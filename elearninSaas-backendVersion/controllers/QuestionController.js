const Question = require("../modeles/QuestionModal");
const { Course, Video } = require("../modeles/CourseModal");
const Apprenant = require("../modeles/ApprenantModal");
const User = require("../modeles/userModal");
const mongoose = require("mongoose");
exports.createQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({
        message: "ID utilisateur ou cours invalide",
        details: {
          userIdValid: mongoose.Types.ObjectId.isValid(userId),
          courseIdValid: mongoose.Types.ObjectId.isValid(courseId),
        },
      });
    }
    // Récupération du cours concerné
    const course = await Course.findById(courseId).populate('professeurId');
    if (!course) {
      return res.status(404).send({ message: "Cours introuvable." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Utilisateur non trouvé.",
        userId: userId,
      });
    }

    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }
    // Création de la question
    const qst = new Question({
      question: req.body.question,
      apprenant_id: apprenant._id , // à remplacer par le middleware auth
      courseId: courseId,
    });

    // Sauvegarde de la question
    const savedQuestion = await qst.save();

    // Mise à jour du cours avec la nouvelle question
    await Course.findByIdAndUpdate(courseId, {
      $push: { question_id: savedQuestion._id },
    });

    // Envoi de notification au professeur via Socket.IO
    const io = req.app.get('socketio');
    if (io && course.professeurId?._id) {
      io.to(`professeur_${course.professeurId._id}`).emit('newQuestion', {
        questionId: savedQuestion._id,
        courseId: courseId,
        courseName: course.nom,
        studentName: req.apprenant?.name || "Un étudiant",
        message: `Nouvelle question dans le cours "${course.nom}"`,
        timestamp: new Date(),
      });
    }

    // Réponse réussie
    res.status(201).send({
      message: "Question créée avec succès et ajoutée au cours",
      question: savedQuestion,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur serveur lors de la création de la question",
    });
  }
};

exports.findAllquestion = (req, res) => {
  Question.find().populate(
    {
      path: "apprenant_id",
      populate: {
        path: "userId",
        select: "name  image"
      }
    })
    .populate({
      path: "courseId",
      select: "nom ",
      populate: {
        path: "professeurId",
        select: "name",
      }
    })
    .then((questions) => {
      res.send(questions);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our question",
      });
    });
};

//getone
exports.findOnequestion = (req, res) => {
  Question.findById(req.params.questionId)
    .populate(
      {
        path: "apprenant_id",
        populate: {
          path: "userId",
          select: "name "
        }
      })
    .populate({
      path: "courseId",
      select: "nom ",
      populate: {
        path: "professeurId",
        select: "name",
      }
    })
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          message: "question not found by id " + req.params.questionId,
        });
      }
      res.send(question);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the question by id" +
          req.params.questionId,
      });
    });
};

exports.repondreQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { reponse } = req.body;
    const profId = req.profId;

    if (!reponse || typeof reponse !== 'string' || reponse.trim().length < 5) {
      return res.status(400).json({
        message: "La réponse doit contenir au moins 5 caractères."
      });
    }

    const question = await Question.findById(questionId)
      .populate({
        path: "courseId",
        select: "nom professeurId",
        populate: {
          path: "professeurId",
          select: "name",
        }
      })
      .populate({
        path: "apprenant_id",
        select: "userId",
        populate: {
          path: "userId",
          select: "name email"
        }
      });

    if (!question) {
      return res.status(404).json({ message: "Question non trouvée." });
    }

    // Vérification de l'autorisation
    if (profId) {
      const courseProfId = question.courseId?.professeurId;
      const isOwner = courseProfId &&
        (courseProfId._id?.toString() === profId.toString() ||
          courseProfId.toString() === profId.toString());

      if (!isOwner) {
        return res.status(403).json({
          message: "Accès refusé : Cette question ne fait pas partie de vos cours."
        });
      }
    }

    question.reponse = reponse;
    question.dateReponse = new Date();
    await question.save();

    // Envoyer une notification à l'étudiant ici si nécessaire

    const io = req.app.get("socketio");
 
    if (io) {
      // Notification pour le professeur
      const apprenantNotificationData = {
        courseId: question.courseId._id,
        courseName: question.courseId.nom,
        message: `Votre question a été répondu!`,
        type: "question_reponse",
        timestamp: new Date().toISOString(),
      };
     
      io.to(`apprenant_${question.apprenant_id._id}`).emit(
        "questionreponse",
        apprenantNotificationData
      );
      console.log("Notification envoyée à l'apprenant:", apprenantNotificationData );

      
    }

    res.status(200).json({
      message: "Réponse enregistrée avec succès",
      question: {
        _id: question._id,
        question: question.question,
        reponse: question.reponse,
        course: question.courseId?.nom,
        student: question.apprenant_id?.userId?.name
      }
    });
  } catch (error) {
    console.error("Erreur lors de la réponse à la question :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la réponse à la question",
      error: error.message,
    });
  }
};
