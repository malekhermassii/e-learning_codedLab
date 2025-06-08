const {
  Course,
  Module,
  Video,
  Enrollment,
  Progression,
} = require("../modeles/CourseModal");
const Professeur = require("../modeles/ProfesseurModal");
const User = require("../modeles/userModal");
const fs = require("fs");
const path = require("path");
const Categorie = require("../modeles/CategorieModal");
const transporter = require("../emailService");
const mongoose = require("mongoose");
const Apprenant = require("../modeles/ApprenantModal");
const { Abonnement } = require("../modeles/AbonnementModal");
const { sendPushNotification, sendPushNotificationToMultipleUsers } = require("../Notification/NotificationService");
const { translateObject, translateText } = require("../utils/translation");

exports.createCourse = async (req, res) => {
  try {
    const { nom, description, categorieId, level, languages, modules } =
      req.body;

    // Vérification des champs requis
    if (!nom || !categorieId)
      return res
        .status(400)
        .json({ message: "Le nom du cours et la catégorie sont obligatoires" });

    // Vérification de l'image
    const imageFile = req?.files?.image?.[0];
    if (!imageFile)
      return res
        .status(400)
        .json({ message: "L'image du cours est obligatoire" });

    const imagePath = imageFile.filename;

    // Vérifier l'existence du cours
    const coursExist = await Course.findOne({ nom });
    if (coursExist)
      return res
        .status(409)
        .json({ message: "Un cours avec ce nom existe déjà" });

    // Vérifier si la catégorie existe
    const categorieExist = await Categorie.findById(categorieId);
    if (!categorieExist)
      return res.status(404).json({ message: "Catégorie non trouvée" });

    // Récupération de l'ID du professeur
    const professeurId = req.user.userId;

    // Parse les modules
    let parsedModules = [];
    try {
      parsedModules = modules ? JSON.parse(modules) : [];
    } catch {
      return res.status(400).json({ message: "Format des modules invalide" });
    }

    const uploadedVideos = req.files?.url || [];
    const modulesIds = [];
    let videoIndex = 0;

    // Création des modules et vidéos
    for (const module of parsedModules) {
      if (!module.titre)
        return res
          .status(400)
          .json({ message: "Chaque module doit avoir un titre" });

      const videoIds = [];

      if (module.videos?.length) {
        for (const video of module.videos) {
          if (!video.titrevd || !video.duree)
            return res
              .status(400)
              .json({
                message: `Données vidéo invalides pour le module '${module.titre}'`,
              });

          if (!uploadedVideos[videoIndex])
            return res
              .status(400)
              .json({ message: "Nombre de fichiers vidéo insuffisant" });

          const newVideo = new Video({
            titrevd: video.titrevd,
            duree: video.duree,
            url: uploadedVideos[videoIndex].filename,
          });

          const savedVideo = await newVideo.save();
          videoIds.push(savedVideo._id);
          videoIndex++;
        }
      }

      const newModule = new Module({
        titre: module.titre,
        nbrVideo: videoIds.length,
        videos: videoIds,
      });

      const savedModule = await newModule.save();
      modulesIds.push(savedModule._id);

    }

    if (videoIndex !== uploadedVideos.length)
      return res
        .status(500)
        .json({
          message: "Incohérence entre les vidéos traitées et celles uploadées",
        });

    // Création du cours
    const newCourse = new Course({
      nom,
      description,
      categorieId,
      image: imagePath,
      modules: modulesIds,
      level,
      languages,
      professeurId,
    });

    const savedCourse = await newCourse.save();

    // Mise à jour du professeur
    await Professeur.findByIdAndUpdate(professeurId, {
      $push: { courseId: savedCourse._id },
    });

    res.status(201).json({
      message: "Cours et vidéos créés avec succès",
      course: savedCourse,
    });
  } catch (error) {
    // Suppression des fichiers en cas d'erreur
    if (req.files?.image?.[0]) {
      const imgPath = path.join(
        __dirname,
        "../Public/Images",
        req.files.image[0].filename
      );
      fs.unlink(
        imgPath,
        (err) => err && console.error("Erreur suppression image:", err)
      );
    }

    if (req.files?.url?.length) {
      req.files.url.forEach((file) => {
        const vidPath = path.join(__dirname, "../Public/Videos", file.filename);
        fs.unlink(
          vidPath,
          (err) => err && console.error("Erreur suppression vidéo:", err)
        );
      });
    }

    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la création",
        error: error.message,
      });
  }
};

//getall
exports.findAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("professeurId", "name specialite")
      .populate({
        path: "modules",
        select: "nbrVideo titre",
        populate: {
          path: "videos",
          select: "titrevd duree url",
        },
      })
      .populate({
        path: "question_id",
        select: "question reponse dateEnvoi apprenant_id",
        populate: {
          path: "apprenant_id",
          populate: {
            path: "userId",
            select: "name image ",
          },
        },
      })
      .populate("categorieId", "_id titre");

    // Ajouter les traductions pour chaque cours
    const coursesWithTranslation = await Promise.all(
      courses.map(async (course) => {
        const courseObj = course.toObject();
        console.log("Module data before translation:", JSON.stringify(courseObj.modules, null, 2));
        
        // Ajouter les traductions
        courseObj.nom_ar = await translateText(courseObj.nom, 'en', 'ar');
        courseObj.description_ar = await translateText(courseObj.description, 'en', 'ar');
        courseObj.level_ar = await translateText(courseObj.level, 'en', 'ar');
        
        // Traduire le titre de la catégorie si elle existe
        if (courseObj.categorieId && courseObj.categorieId.titre) {
          courseObj.categorieId.titre_ar = await translateText(courseObj.categorieId.titre, 'en', 'ar');
        }

        // Traduire les titres des modules et des vidéos
        if (courseObj.modules && Array.isArray(courseObj.modules)) {
          courseObj.modules = await Promise.all(
            courseObj.modules.map(async (module) => {
              const moduleObj = { ...module };
              
              // Traduire le titre du module
              if (moduleObj.titre) {
                try {
                  moduleObj.titre_ar = await translateText(moduleObj.titre, 'en', 'ar');
                } catch (error) {
                  console.error("Error translating module title:", error);
                  moduleObj.titre_ar = moduleObj.titre;
                }
              }
              
              // Traduire les titres des vidéos
              if (moduleObj.videos && Array.isArray(moduleObj.videos)) {
                moduleObj.videos = await Promise.all(
                  moduleObj.videos.map(async (video) => {
                    const videoObj = { ...video };
                    if (videoObj.titrevd) {
                      try {
                        videoObj.titrevd_ar = await translateText(videoObj.titrevd, 'en', 'ar');
                        
                      } catch (error) {
                        console.error("Error translating video title:", error);
                        videoObj.titrevd_ar = videoObj.titrevd;
                      }
                    }
                    return videoObj;
                  })
                );
              }
              return moduleObj;
            })
          );
        }
        
        if (courseObj.professeurId && courseObj.professeurId.specialite) {
          courseObj.professeurId.specialite_ar = await translateText(courseObj.professeurId.specialite, 'en', 'ar');
        }
        return courseObj;
      })

      
    );
    res.send(coursesWithTranslation);
  } catch (error) {
    console.error("Error in findAllCourses:", error);
    res.status(500).send({
      message: error.message || "Erreur serveur lors de la récupération des cours",
    });
  }
};
//getone
exports.findOneCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate({
        path: "feedback_id",
        select: "message rating dateEnvoi apprenant_id",
        populate: {
          path: "apprenant_id",
          populate: {
            path: "userId",
            select: "name image ",
          },
        },
      })
      .populate({
        path: "modules",
        select: "nbrVideo titre",
        populate: {
          path: "videos",
          select: "titrevd duree url",
        },
      })
      .populate({
        path: "question_id",
        select: "question reponse dateEnvoi apprenant_id",
        populate: {
          path: "apprenant_id",
          populate: {
            path: "userId",
            select: "name image ",
          },
        },
      })
      .populate("categorieId", "titre")
      .populate("professeurId", "name specialite image");

    if (!course) {
      return res.status(404).send({
        message: "Course not found with id " + req.params.courseId,
      });
    }

    const courseObj = course.toObject();

    // Ajouter les traductions
    courseObj.nom_ar = await translateText(courseObj.nom, 'en', 'ar');
    courseObj.description_ar = await translateText(courseObj.description, 'en', 'ar');
    courseObj.level_ar = await translateText(courseObj.level, 'en', 'ar');
    
    // Traduire le titre de la catégorie si elle existe
    if (courseObj.categorieId && courseObj.categorieId.titre) {
      courseObj.categorieId.titre_ar = await translateText(courseObj.categorieId.titre, 'en', 'ar');
    }

  //   if (courseObj.quizId && courseObj.quizId.questionQuiz_id) {
  //     courseObj.quizId.questionQuiz_id.question_ar = await translateText(courseObj.quizId.questionQuiz_id.question, 'en', 'ar');
  //  if (courseObj.quizId.options){
  //   courseObj.quizId.options = await Promise.all(
  //     courseObj.quizId.options.map(async (option) => {
  //       const optionObj = { ...option };
  //       optionObj.option_ar = await translateText(optionObj.option, 'en', 'ar');
  //       return optionObj;
  //     })
  //   );
  //  } }

    // Traduire les titres des modules et des vidéos
    if (courseObj.modules && Array.isArray(courseObj.modules)) {
      courseObj.modules = await Promise.all(
        courseObj.modules.map(async (module) => {
          const moduleObj = { ...module };
          
          // Traduire le titre du module
          if (moduleObj.titre) {
            try {
              moduleObj.titre_ar = await translateText(moduleObj.titre, 'en', 'ar');

            } catch (error) {
              console.error("Error translating module title:", error);
              moduleObj.titre_ar = moduleObj.titre;
            }
          }
          
          // Traduire les titres des vidéos
          if (moduleObj.videos && Array.isArray(moduleObj.videos)) {
            moduleObj.videos = await Promise.all(
              moduleObj.videos.map(async (video) => {
                const videoObj = { ...video };
                if (videoObj.titrevd) {
                  try {
                    videoObj.titrevd_ar = await translateText(videoObj.titrevd, 'en', 'ar');
                    
                  } catch (error) {
                    console.error("Error translating video title:", error);
                    videoObj.titrevd_ar = videoObj.titrevd;
                  }
                }
                return videoObj;
              })
            );
          }
          return moduleObj;
        })
      );
    }
    if (courseObj.professeurId && courseObj.professeurId.specialite ) {
      courseObj.professeurId.specialite_ar = await translateText(courseObj.professeurId.specialite, 'en', 'ar');
      courseObj.professeurId.name_ar = await translateText(courseObj.professeurId.name, 'en', 'ar');
    }   

    res.send(courseObj);
  } catch (error) {
    console.error("Error finding course:", error);
    res.status(500).send({
      message: "Error retrieving course with id " + req.params.courseId,
    });
  }
};

/**
 * Met à jour un cours existant
 * @param {Object} req - Requête HTTP contenant les données de mise à jour
 * @param {Object} res - Réponse HTTP
 */

exports.updateCourse = async (req, res) => {
  const courseId = req.params.courseId;
  const uploadedImageFile = req.files?.image;
  const uploadedVideoFiles = req.files?.url || [];

  const newVideoFilePaths = [];
  let newImageFilePath = null;

  try {
    const course = await Course.findById(courseId).populate({
      path: "modules",
      populate: { path: "videos" },
    });

    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Supprimer anciens fichiers vidéo et documents associés
    for (const mod of course.modules) {
      for (const vid of mod.videos) {
        if (vid.url) {
          if (Array.isArray(vid.url)) {
            vid.url.forEach(async url => {
              if (url) {
                const videoPath = path.join(__dirname, "../Public/Videos", url);
                if (fs.existsSync(videoPath)) await fs.promises.unlink(videoPath);
              }
            });
          } else {
            const videoPath = path.join(__dirname, "../Public/Videos", vid.url);
            if (fs.existsSync(videoPath)) await fs.promises.unlink(videoPath);
          }
        }
        await Video.findByIdAndDelete(vid._id);
      }
      await Module.findByIdAndDelete(mod._id);
    }

    // Créer les nouveaux modules et vidéos
    const modulesData = req.body.modules ? JSON.parse(req.body.modules) : [];
    const newModuleIds = [];
    let videoIndex = 0;

    for (const mod of modulesData) {
      if (!mod.titre) continue;

      const videoIds = [];
      for (const vid of mod.videos || []) {
        if (!vid.titrevd || !vid.duree) continue;

        let videoFileName = null;

        if (vid.url === "NEW_VIDEO_PLACEHOLDER") {
          if (videoIndex >= uploadedVideoFiles.length) {
            if (uploadedImageFile)
              fs.unlink(
                path.join(
                  __dirname,
                  "../Public/Images",
                  uploadedImageFile.filename
                ),
                () => { }
              );
            newVideoFilePaths.forEach((p) => fs.unlink(p, () => { }));
            return res
              .status(400)
              .json({ message: "Insufficient number of videos" });
          }

          videoFileName = uploadedVideoFiles[videoIndex++].filename;
          newVideoFilePaths.push(
            path.join(__dirname, "../Public/Videos", videoFileName)
          );
        } else if (
          typeof vid.url === "string" &&
          vid.url.includes("/videos/")
        ) {
          videoFileName = vid.url.split("/").pop();
        }

        const newVid = new Video({
          titrevd: vid.titrevd,
          duree: vid.duree,
          url: videoFileName,
        });
        const savedVid = await newVid.save();
        videoIds.push(savedVid._id);
      }

      const newMod = new Module({
        titre: mod.titre,
        nbrVideo: videoIds.length,
        videos: videoIds,
      });
      const savedMod = await newMod.save();
      newModuleIds.push(savedMod._id);
    }

    if (videoIndex !== uploadedVideoFiles.length) {
      if (uploadedImageFile)
        fs.unlink(
          path.join(__dirname, "../Public/Images", uploadedImageFile.filename),
          () => { }
        );
      newVideoFilePaths.forEach((p) => fs.unlink(p, () => { }));
      return res
        .status(500)
        .json({ message: "Inconsistency in video files" });
    }

    // Mise à jour des champs du cours
    course.nom = req.body.nom || course.nom;
    course.description = req.body.description || course.description;
    course.level = req.body.level || course.level;
    course.languages = req.body.languages || course.languages;

    if (req.body.categorieId) {
      const categorie = await Categorie.findById(req.body.categorieId);
      if (!categorie) {
        if (uploadedImageFile)
          fs.unlink(
            path.join(
              __dirname,
              "../Public/Images",
              uploadedImageFile.filename
            ),
            () => { }
          );
        newVideoFilePaths.forEach((p) => fs.unlink(p, () => { }));
        return res.status(404).json({ message: "Category not found" });
      }
      course.categorieId = req.body.categorieId;
    }

    // Gestion de l'image
    if (uploadedImageFile && uploadedImageFile[0] && uploadedImageFile[0].filename) {
      if (course.image) {
        const oldImagePath = path.join(
          __dirname,
          "../Public/Images",
          course.image
        );
        if (fs.existsSync(oldImagePath)) await fs.promises.unlink(oldImagePath);
      }
      course.image = uploadedImageFile[0].filename;
      newImageFilePath = path.join(__dirname, "../Public/Images", course.image);
    }

    course.modules = newModuleIds;
    const updatedCourse = await course.save();

    return res.status(200).json({
      message: "Cours mis à jour avec succès",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error during course update:", error);

    if (newImageFilePath) fs.unlink(newImageFilePath, () => { });
    newVideoFilePaths.forEach((p) => fs.unlink(p, () => { }));

    return res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Supprime un cours et tous ses éléments associés (modules, vidéos, images)
 * @param {Object} req - Requête HTTP contenant l'ID du cours
 * @param {Object} res - Réponse HTTP
 */
exports.deleteCourse = async (req, res) => {
  try {
    console.log("Course ID to delete:", req.params.courseId);
    const course = await Course.findById(req.params.courseId).populate({
      path: 'modules',
      populate: {
        path: 'videos'
      }
    });
    
    if (!course) {
      console.log("Course not found");
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé",
      });
    }

    // La suppression en cascade est gérée par le middleware
    await Course.findOneAndDelete({ _id: course._id });

    res.status(200).json({
      success: true,
      message: "Cours et toutes les ressources associées supprimés avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du cours:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du cours",
      error: error.message,
    });
  }
};

/**
 * Fonction utilitaire pour nettoyer les ressources d'un cours
 * @param {Object} course - Le cours à nettoyer
 */
const cleanupCourseResources = async (course) => {
  // Suppression des modules et vidéos
  if (course.modules?.length > 0) {
    for (const module of course.modules) {
      if (module.videos?.length > 0) {
        for (const video of module.videos) {
          if (video.url) {
            const videoPath = path.join(
              __dirname,
              "../Public/Videos",
              video.url
            );
            try {
              await fs.promises.unlink(videoPath);
            } catch (err) {
              console.error(
                `Error during video deletion: ${video.url}:`,
                err
              );
            }
          }
        }
        await Video.deleteMany({
          _id: { $in: module.videos.map((v) => v._id) },
        });
      }
      await Module.findByIdAndDelete(module._id);
    }
  }

  // Suppression de l'image du cours
  if (course.image) {
    const imagePath = path.join(__dirname, "../Public/Images", course.image);
    try {
      await fs.promises.unlink(imagePath);
    } catch (err) {
      console.error("Error during course image deletion:", err);
    }
  }
};

exports.approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.statut === "accepted") {
      return res.status(400).json({ message: "This course has already been approved" });
    }

    const professeur = await Professeur.findById(course.professeurId);
    if (!professeur) {
      return res.status(404).json({ message: "Professeur not found" });
    }

    course.statut = "accepted";
    await course.save();

    // Envoi d'email au professeur
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: professeur.email,
      subject: "Your course has been approved",
      html: `
        <p>Hello,</p>
        <p>Congratulations! Your course titled <strong>${course.nom}</strong> has been approved.</p>
        <p>You can now continue with the planning and the next steps.</p>
        <p>Thank you for your participation.</p>
        <p>Best regards,</p>
        <p>The administrative team</p>
      `,
    };
    await transporter.sendMail(mailOptions);

    // Envoi de la notification en temps réel via Socket.IO cours approuvé
    const io = req.app.get("socketio");

    if (io) {
      // Notification pour le professeur
      const profNotificationData = {
        professeurId: professeur._id,
        courseId: course._id,
        courseName: course.nom,
        message: `Your course "${course.nom}" has been approved successfully!`,
        type: "course_approved",
        timestamp: new Date().toISOString(),
      };

      io.to(`professeur_${professeur._id}`).emit(
        "courseApproved",
        profNotificationData
      );

      // Envoi de la notification en temps réel via Socket.IO course disponible
      const apprenantNotificationData = {
        courseId: course._id,
        courseName: course.nom,
        message: `A new course "${course.nom}" is now available!`,
        type: "new_course_available",
        timestamp: new Date().toISOString(),
      };

      io.emit("newCourseAvailable", apprenantNotificationData);
    }


    // Envoi des notifications push uniquement aux useers
    try {
      // Récupérer tous les apprenants avec un token Expo valide
      const users = await User.find({ expoPushToken: { $exists: true, $ne: null } });

      if (users.length > 0) {
        const tokens = users.map(user => user.expoPushToken);

        // Envoyer la notification à tous les apprenants
        await sendPushNotificationToMultipleUsers(
          tokens,
          "New course available",
          `A new course "${course.nom}" is now available!`,
          {
            type: "new_course_available",
            courseId: course._id.toString(),
            courseName: course.nom
          }
        );

        console.log(`Notification sent to ${tokens.length} users`);
      } else {
        console.log("No user with Expo token found");
      }
    } catch (notificationError) {
      console.error("Error sending push notifications:", notificationError);
      // On continue même si les notifications échouent
    }
    res.json({
      message: "Course approved and notifications sent",
      course,
      notificationsSent: true
    });
  } catch (error) {
    console.error("Error during course approval:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//refuser cours
exports.refuseCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate(
      "professeurId"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.statut === "rejected") {
      return res.status(400).json({ message: "This course has already been rejected." });
    }

    const professeur = await Professeur.findById(course.professeurId);
    if (!professeur) {
      return res.status(404).json({ message: "Professeur not found" });
    }

    course.statut = "rejected";
    await course.save();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: professeur.email,
      subject: "Your course has been rejected",
      html: `
        <p>Hello ${professeur.name},</p>
        <p>Thank you for your proposal for the course titled <strong>${course.nom}</strong>.</p>
        <p>After evaluation, we regret to inform you that this course does not meet our current needs.</p>
        <p>We encourage you to propose other content that may better fit our program.</p>
        <p>Thank you for your understanding.</p>
        <p>Best regards,</p>
        <p>The administrative team</p>
      `,
    };
    await transporter.sendMail(mailOptions);

    // Envoi de la notification en temps réel via Socket.IO
    const io = req.app.get("socketio");
    if (io) {
      const notificationData = {
        professeurId: professeur._id,
        courseId: course._id,
        courseName: course.nom,
        message: `Votre cours "${course.nom}" a été refusé.`,
        type: "course_rejected",
        timestamp: new Date().toISOString(),
      };

      io.to(`professeur_${professeur._id}`).emit(
        "courseRejected",
        notificationData
      );
      console.log("Notification de refus envoyée:", notificationData);
    }

    res.json({ message: "Cours refusé et email envoyé", course });
  } catch (error) {
    console.error("Erreur lors du refus du cours :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Route pour rechercher les cours par nom
exports.search = async (req, res) => {
  try {
    const { nom } = req.query; // Récupère le terme de recherche à partir de la query string
    if (!nom) {
      return res.status(400).json({ message: "Course name is required" });
    }

    // Recherche des cours qui contiennent le terme dans leur nom
    const courses = await Course.find({
      nom: { $regex: nom, $options: "i" }, // Recherche insensible à la casse
    });

    if (courses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    // Retourne les cours trouvés
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error during course search:", error);
    res.status(500).json({
      message: "Server error during search",
      error: error.message,
    });
  }
};

// Route pour inscrire un user à un cours
exports.enroll = async (req, res) => {
  try {
    console.log(
      "userId:",
      req.user && req.user.userId,
      "courseId:",
      req.params.courseId
    );
    const userId = req.user.userId;
    const { courseId } = req.params;

    // Validation des IDs
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({
        message: "Invalid user ID or course ID",
        details: {
          userIdValid: mongoose.Types.ObjectId.isValid(userId),
          courseIdValid: mongoose.Types.ObjectId.isValid(courseId),
        },
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        userId: userId,
      });
    }

    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
        courseId: courseId,
      });
    }
    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingEnrollment = await Enrollment.findOne({
      apprenantId: apprenant._id,
      courseId,
    });
    if (existingEnrollment) {
      return res.status(409).json({
        message: "L'utilisateur est déjà inscrit à ce cours.",
        enrollmentId: existingEnrollment._id,
      });
    }
    // Ajouter l'inscription
    const abonnementId = apprenant.abonnement_id;
    if (
      !mongoose.Types.ObjectId.isValid(abonnementId)
    ) {
      return res.status(400).json({
        message: "ID abonnement non valide",
        details: {
          abonnementIdValid: mongoose.Types.ObjectId.isValid(abonnementId)
        },
      });
    }

    const abonnement = await Abonnement.findOne({
      _id: abonnementId,
    });
    if (!abonnement || abonnement.statut === "expiré") {
      return res
        .status(404)
        .json({ message: "Abonnement non trouvé ou expiré" });
    } else {
      const enrollment = new Enrollment({
        apprenantId: apprenant._id,
        courseId,
      });
      await enrollment.save();

      res.status(201).json({
        message: "Inscription réussie !",
        enrollmentId: enrollment._id,
        enrolledCount: course.enrolledCount,
      });
    }

    // Mettre à jour la liste des étudiants inscrits dans Course
    if (!course.apprenantEnroll.includes(apprenant._id)) {
      course.apprenantEnroll.push(apprenant._id);
      course.enrolledCount = course.apprenantEnroll.length;
      await course.save();
    }

    // Envoi de la notification push  
    try {
      // Récupérer tous les apprenants avec un token Expo valide
      const token = user.expoPushToken;
      // Envoyer la notification à tous les apprenants
      await sendPushNotification(
        token,
        "New course registration",
        `You are enrolled in the course "${course.nom}"`,
        {
          type: "new_enrollment",
          courseId: course._id.toString(),
          courseName: course.nom
        }
      );

    }
    catch (notificationError) {
      console.error("Erreur lors de l'envoi des notifications push:", notificationError);
      // On continue même si les notifications échouent
    }

    // Envoi de la notification en temps réel via Socket.IO
    const io = req.app.get("socketio");
    if (io) {
      io.emit("newEnrollment", {
        apprenantId: apprenant._id,
        courseId,
        courseName: course.nom,
        message: `New enrollment to the course ${course.nom}`,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error("Erreur détaillée lors de l'inscription :", error);
    res.status(500).json({
      message: "Erreur serveur lors de l'inscription",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.initProgress = async (req, res) => {
  try {
    const { courseId, moduleId, videoId } = req.params;
    const userId = req.user.userId;
    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    let progression = await Progression.findOne({
      apprenantId: apprenant._id,
      courseId,
    });
    if (!progression) {
      progression = new Progression({
        apprenantId: apprenant._id,
        courseId,
        modules: [],
        complet: false,
      });
    }

    let moduleProgress = progression.modules.find((m) =>
      m.moduleId.equals(moduleId)
    );
    if (!moduleProgress) {
      moduleProgress = { moduleId, videosCompletees: [], progressionModule: 0 };
      progression.modules.push(moduleProgress);
    }

    // (Optionnel) Tu peux ajouter la vidéo comme "commencée" ici si tu veux
    // mais ne la mets pas dans videosCompletees tant qu'elle n'est pas terminée

    progression.markModified("modules");
    await progression.save();

    res.json({ message: "Progression initialisée" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erreur lors de l'initialisation",
        error: error.message,
      });
  }
};

//update progression
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, moduleId, videoId } = req.params;
    const userId = req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(moduleId) ||
      !mongoose.Types.ObjectId.isValid(videoId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "ID invalide fourni" });
    }

    // Vérifier si l'apprenant existe
    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    // Fetch course with modules populated
    const course = await Course.findById(courseId).populate("modules");
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    // Check if module belongs to the course
    const module = course.modules.find((mod) => mod._id.equals(moduleId));
    if (!module)
      return res.status(400).json({ message: "Module invalide pour ce cours" });

    // Fetch module details
    const moduleDetails = await Module.findById(moduleId).populate("videos");
    if (!moduleDetails || !moduleDetails.videos) {
      return res
        .status(400)
        .json({ message: "Module introuvable ou sans vidéos" });
    }

    // Check if video belongs to the module
    if (!moduleDetails.videos.some((v) => v._id.equals(videoId))) {
      return res.status(400).json({ message: "Vidéo invalide pour ce module" });
    }

    // Toujours la même clé pour la progression !
    let progression = await Progression.findOne({
      apprenantId: apprenant._id,
      courseId,
    });
    let moduleProgress = progression.modules.find((m) =>
      m.moduleId.equals(moduleId)
    );
    if (!moduleProgress) {
      moduleProgress = { moduleId, videosCompletees: [], progressionModule: 0 };
      progression.modules.push(moduleProgress);
    }

    // Ajout de la vidéo si besoin
    if (!moduleProgress.videosCompletees.some((v) => v.equals(videoId))) {
      moduleProgress.videosCompletees.push(videoId);
    }

    // Calcul du pourcentage
    const totalVideos = moduleDetails.videos.length;
    moduleProgress.progressionModule =
      totalVideos > 0
        ? Math.round(
          (moduleProgress.videosCompletees.length / totalVideos) * 100
        )
        : 0;

    const moduleVideoCountMap = new Map();
    course.modules.forEach((mod) => {
      moduleVideoCountMap.set(mod._id.toString(), mod.videos.length);
    });

    const completedModules = progression.modules.filter((m) => {
      const totalVideosForModule =
        moduleVideoCountMap.get(m.moduleId.toString()) || 0;
      return (
        m.videosCompletees.length === totalVideosForModule &&
        totalVideosForModule > 0
      );
    }).length;

    const totalModules = course.modules.length;
    progression.progressionCours =
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

    progression.complet = completedModules === totalModules;

    progression.markModified("modules");
    await progression.save();

    res.json({
      message: "Progression mise à jour avec succès",
      progressionCours: progression.progressionCours,
      apprenantId: apprenant._id,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    res
      .status(500)
      .json({ message: "Une erreur s'est produite", error: error.message });
  }
};

//pour afficher la progression de chaque cours
exports.getProgression = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { filter } = req.query;

    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let query = { apprenantId: apprenant._id };

    if (filter === "completed") {
      query.complet = true;
    } else if (filter === "ongoing") {
      query.complet = false;
    }

    const progressions = await Progression.find(query).populate({
      path: "courseId",
      select: "nom description enrolledCount image modules categorieId",
      populate: [
        {
          path: "categorieId",
          select: "titre"
        },
        {
          path: "modules",
          model: "Module"
        }
      ]
    });

    res.json(progressions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllProgression = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "ID utilisateur invalide",
        details: {
          userIdValid: mongoose.Types.ObjectId.isValid(userId),
        },
      });
    }
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      // Retourner un tableau vide au lieu d'une erreur
      return res.status(200).json([]);
    }

    const progressions = await Progression.find({ apprenantId: apprenant._id })
      .populate({
        path: "courseId",
        select: "nom description enrolledCount image modules categorieId quizId",
        populate: [
          {
            path: "categorieId",
            select: "titre"
          },
          {
            path: "modules",
            model: "Module"
          }
        ]
      });

    // Traduction des champs
    const progressionsWithTranslation = await Promise.all(
      progressions.map(async (progression) => {
        const progressionObj = progression.toObject();
        if (progressionObj.courseId) {
          // Traduire le nom du cours
          if (progressionObj.courseId.nom) {
            progressionObj.courseId.nom_ar = await translateText(
              progressionObj.courseId.nom,
              'en',
              'ar'
            );
          }
          // Traduire la description du cours
          if (progressionObj.courseId.description) {
            progressionObj.courseId.description_ar = await translateText(
              progressionObj.courseId.description,
              'en',
              'ar'
            );
          }
          // Traduire le titre de la catégorie
          if (
            progressionObj.courseId.categorieId &&
            progressionObj.courseId.categorieId.titre
          ) {
            progressionObj.courseId.categorieId.titre_ar = await translateText(
              progressionObj.courseId.categorieId.titre,
              'en',
              'ar'
            );
          }
        }
        return progressionObj;
      })
    );

    res.status(200).json(progressionsWithTranslation);
  } catch (error) {
    console.error("Erreur lors de la récupération des progressions:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des progressions",
      error: error.message,
    });
  }
};

exports.getCourseModules = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    console.log("Fetching modules for course:", courseId);

    const course = await Course.findById(courseId).populate({
      path: "modules",
      select: "titre nbrVideo",
      populate: {
        path: "videos",
        select: "titrevd duree url",
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    console.log("Found modules:", course.modules);
    res.json(course.modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des modules",
      error: error.message,
    });
  }
};
// Vérifier si l'apprenant est déjà inscrit à un cours
exports.checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }
    const existingEnrollment = await Enrollment.findOne({
      apprenantId: apprenant._id,
      courseId,
    });
    res.json({ isEnrolled: !!existingEnrollment });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.getProgressionByCourse = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const courseId = req.params.courseId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    const progression = await Progression.findOne({
      apprenantId: apprenant._id,
      courseId,
    });

    res.json(progression ? [progression] : []);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Vérifie le statut de l'abonnement de l'utilisateur connecté
exports.getAbonnementStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const apprenant = await Apprenant.findOne({ userId })
      .populate({
        path: "abonnement_id",
        populate: {
          path: "planId",
          select: "name price interval offers statut"
        }
      });
    if (!apprenant) {
      return res
        .status(200)
        .json({ statut: "not_found", message: "Aucun abonnement trouvé" });
    }

    if (apprenant.abonnement_id.statut === "expiré") {
      return res.status(200).json({ statut: "expiré" });
    }
    return res.status(200).json({ statut: "actif" });
  } catch (error) {
    res.status(500).json({ statut: "error", message: error.message });
  }
};


exports.getCourseByInstructor = async (req, res) => {
  try {
    const { professeurId } = req.params;
    const courses = await Course.find({ professeurId: professeurId })
    .populate({
      path: 'modules',
      select: 'titre nbrVideo',
    })
    .populate('categorieId', 'titre');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}