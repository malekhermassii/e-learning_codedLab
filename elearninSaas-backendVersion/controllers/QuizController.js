const { Quiz, QuestionQuiz } = require("../modeles/QuizModal");
const Certificat = require("../modeles/CertificatModal");
const Apprenant = require("../modeles/ApprenantModal");
const mongoose = require('mongoose');

const fs = require("fs");
const User = require("../modeles/userModal");
const path = require("path");
const { Course } = require("../modeles/CourseModal");
const puppeteer = require('puppeteer');
const { translateText } = require("../utils/translation");

exports.createQuiz = async (req, res) => {
  const { courseId } = req.body;
  const cours = await Course.findById(courseId);
  if (!cours) return res.status(404).json({ message: "Cours non trouvé" });

  // Vérification des doublons
  const QuizExist = await Quiz.findOne({ courseId: req.body.courseId });
  if (QuizExist) {
    return res.status(409).json({
      message: "Un Quiz avec ce cours existe déjà",
      existingQuize: QuizExist,
    });
  }
  try {
    // Vérification du nombre de questions (max 20)
    if (req.body.questionQuiz_id.length !== 20) {
      return res.status(400).json({
        message: "Le quiz doit contenir exactement 20 questions.",
      });
    }
    // Création du Quiz
    const nouveauquiz = new Quiz({
      courseId: courseId,
      
      resultats: [], // Initialisation des résultats
      questionQuiz_id: [],
    });

    // Sauvegarde du quiz
    const quizCree = await nouveauquiz.save();

    // Vérification des questions et options
    if (!req.body.questionQuiz_id || req.body.questionQuiz_id.length === 0) {
      return res.status(400).json({
        message: "Aucune question fournie pour le quiz.",
      });
    }
    // Traitement de chaque question
    for (const questionData of req.body.questionQuiz_id) {
      if (
        !questionData.question ||
        !questionData.options ||
        !questionData.reponseCorrecte
      ) {
        return res.status(400).json({
          message:
            "Chaque question doit avoir un texte, des options et une réponse correcte.",
        });
      }
      // Création de la question
      const nouvelleQuestion = new QuestionQuiz({
        question: questionData.question,
        options: questionData.options,
        reponseCorrecte: questionData.reponseCorrecte,
        quizId: quizCree._id,
      });

      // Sauvegarde de la question
      const questionCreee = await nouvelleQuestion.save();
      // Ajouter l'ID de la question au quiz
      quizCree.questionQuiz_id.push(questionCreee._id);
    }
    // Sauvegarde finale du quiz avec les questions ajoutées
    await quizCree.save();
    // Mise à jour du cours pour ajouter le quiz
    await Course.findByIdAndUpdate(req.body.courseId, {
      $set: { quizId: quizCree._id }, // Ajoute l'ID du quiz dans le id des quiz du cours
    });
    // Réponse de succès
    res.status(201).json({
      message: "Quiz et questions créés avec succès",
      quiz: quizCree,
    });
  } catch (error) {
    console.error("Erreur lors de la création :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création",
      error: error.message,
    });
  }
};
// GET /quiz - Récupérer tous les quizzes avec leurs relations
exports.findAllQuizs = async (req, res) => {
  try {
    const quizs = await Quiz.find()
      .populate({
        path: 'questionQuiz_id',
        select: 'question options reponseCorrecte'
      })
      .populate({
        path: 'courseId',
        select: 'nom description'
      });

    // Ajouter les traductions pour chaque quiz
    const quizsWithTranslation = await Promise.all(
      quizs.map(async (quiz) => {
        const quizObj = quiz.toObject();
        
        // Traduire les questions et options
        if (quizObj.questionQuiz_id && Array.isArray(quizObj.questionQuiz_id)) {
          quizObj.questionQuiz_id = await Promise.all(
            quizObj.questionQuiz_id.map(async (question) => {
              const questionObj = { ...question };
              
              // Traduire la question
              if (questionObj.question) {
                try {
                  questionObj.question_ar = await translateText(questionObj.question, 'en', 'ar');
                } catch (error) {
                  console.error("Error translating question:", error);
                  questionObj.question_ar = questionObj.question;
                }
              }
              
              // Traduire les options
              if (questionObj.options && Array.isArray(questionObj.options)) {
                questionObj.options_ar = await Promise.all(
                  questionObj.options.map(async (option) => {
                    try {
                      return await translateText(option, 'en', 'ar');
                    } catch (error) {
                      console.error("Error translating option:", error);
                      return option;
                    }
                  })
                );
              }
              
              return questionObj;
            })
          );
        }
        
        return quizObj;
      })
    );

    res.status(200).json(quizsWithTranslation);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Erreur serveur lors de la récupération des quizzes.'
    });
  }
};


//getone
exports.findOneQuiz = async (req, res) => {
  try {
    const {quizId} = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "ID de quiz invalide" });
    }
    const quiz = await Quiz.findById({_id:quizId})
      .populate({
        path: 'questionQuiz_id',
        select: 'question options reponseCorrecte '
      })
      .populate('courseId', 'nom')
      .populate({
        path: "resultats.apprenant_id",
        populate: {
          path: "userId",
          select: "name email "
        }
      });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    const quizObj = quiz.toObject();
    
    // Traduire les questions et options
    if (quizObj.questionQuiz_id && Array.isArray(quizObj.questionQuiz_id)) {
      quizObj.questionQuiz_id = await Promise.all(
        
        quizObj.questionQuiz_id.map(async (question) => {
          const questionObj = { ...question };
          
          // Traduire la question
          if (questionObj.question) {
            try {
              questionObj.question_ar = await translateText(questionObj.question, 'en', 'ar');
            } catch (error) {
              console.error("Error translating question:", error);
              questionObj.question_ar = questionObj.question;
            }
          }
          
          // Traduire les options
          if (questionObj.options && Array.isArray(questionObj.options)) {
            questionObj.options_ar = await Promise.all(
              questionObj.options.map(async (option) => {
                try {
                  return await translateText(option, 'en', 'ar');
                } catch (error) {
                  console.error("Error translating option:", error);
                  return option;
                }
              })
            );
          }
          
          return questionObj;
        })
      );
    }
    const courseName = await translateText(quizObj.courseId.nom, 'en', 'ar');
    quizObj.courseId.nom_ar= courseName;

    res.status(200).json(quizObj);
  } catch (error) {
    console.error("Erreur lors de la recherche du quiz:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

//update

exports.updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { courseId, questionQuiz_id} = req.body;

    // Vérification de l'existence du quiz à mettre à jour
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    // Si un nouveau cours est fourni, vérification et mise à jour
    if (courseId) {
      const cours = await Course.findById(courseId);
      if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé" });
      }
      quiz.courseId = courseId;
    }

  

    // Mise à jour des questions si elles sont fournies
    if (questionQuiz_id) {
      if (!Array.isArray(questionQuiz_id)) {
        return res
          .status(400)
          .json({ message: "Les questions doivent être un tableau." });
      }
      if (questionQuiz_id.length > 20) {
        return res.status(400).json({
          message: "Le quiz ne peut pas contenir plus de 20 questions.",
        });
      }

      // Suppression des questions existantes associées au quiz
      await QuestionQuiz.deleteMany({ quizId: quiz._id });
      // Réinitialisation du tableau des questions du quiz
      quiz.questionQuiz_id = [];

      // Création et sauvegarde de chacune des nouvelles questions
      for (const questionData of questionQuiz_id) {
        if (
          !questionData.question ||
          !questionData.options ||
          !questionData.reponseCorrecte
        ) {
          return res.status(400).json({
            message:
              "Chaque question doit avoir un texte, des options et une réponse correcte.",
          });
        }

        const nouvelleQuestion = new QuestionQuiz({
          question: questionData.question,
          options: questionData.options,
          reponseCorrecte: questionData.reponseCorrecte,
          quizId: quiz._id,
        });

        const questionCreee = await nouvelleQuestion.save();
        quiz.questionQuiz_id.push(questionCreee._id);
      }
    }

    // Sauvegarde du quiz mis à jour
    const quizUpdated = await quiz.save();

    // Mise à jour du cours pour lier le quiz (si courseId est fourni)
    if (courseId) {
      await Course.findByIdAndUpdate(courseId, { $set: { quizId: quiz._id } });
    }

    res.status(200).json({
      message: "Quiz mis à jour avec succès",
      quiz: quizUpdated,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du quiz :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du quiz",
      error: error.message,
    });
  }
};

//delete
exports.deletequiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Vérification de l'existence du quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ message: `quiz non trouvé avec l'ID ${quizId}` });
    }

    // Suppression des question associées
    if (quiz.questionQuiz_id && quiz.questionQuiz_id.length > 0) {
      await QuestionQuiz.deleteMany({ _id: { $in: quiz.questionQuiz_id } });
    }

    // Suppression du quiz
    await Quiz.findByIdAndDelete(quizId);

    res.status(200).json({
      message: "QUIZ et ses QUESTIONS associés supprimés avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression du quiz",
      error: error.message,
    });
  }
};

// Passer un quiz
exports.passerQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { reponses } = req.body;
    const userId = req.user.userId;
    if (
      !mongoose.Types.ObjectId.isValid(quizId) ||
      !mongoose.Types.ObjectId.isValid(userId ) 
    ) {
      return res.status(400).json({
        message: "ID utilisateur ou cours invalide",
        details: {
          quizIdValid: mongoose.Types.ObjectId.isValid(quizId),
          userIdValid: mongoose.Types.ObjectId.isValid(userId),
        },
      });
    }


    // Vérifier si le quiz existe
    const quiz = await Quiz.findById(quizId)
      .populate('questionQuiz_id');

    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    // Vérifier si l'apprenant existe
    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    // Vérifier si l'apprenant a déjà passé ce quiz
    const resultatExistant = quiz.resultats.find(
      r => r.apprenant_id && r.apprenant_id.toString() === apprenant._id.toString()
    );

    if (resultatExistant) {
      resultatExistant.score = reponses.score;
    } else {
      console.log('reponses score',reponses.score);
      quiz.resultats.push({
        apprenant_id: apprenant._id,
        score: reponses.score
      });
    }

    // Sauvegarder les modifications
    await quiz.save();

    // Si le score est suffisant (≥ 17/20), créer un certificat
    let certificat = null;
    if (reponses.score >= 17) {
      certificat = await Certificat.findOne({
        courseId: quiz.courseId,
        apprenant_id: apprenant._id
      });

      if (!certificat) {
        certificat = new Certificat({
          courseId: quiz.courseId,
          apprenant_id: apprenant._id,
          date_obtention: new Date()
        });
        await certificat.save();
      }
           // Mise à jour du apprenant
     await Apprenant.findByIdAndUpdate(apprenant._id, {
      $push: { certificat_id: certificat._id },
    });
    }


    res.status(200).json({
      message: "Quiz terminé avec succès",
      score: reponses.score,
      certificat: certificat ? {
        id: certificat._id,
        date_obtention: certificat.date_obtention
      } : null
    });

  } catch (error) {
    console.error("Erreur lors du passage du quiz:", error);
    res.status(500).json({
      message: "Erreur serveur lors du passage du quiz",
      error: error.message
    });
  }
};

// Obtenir les informations du certificat par cours
exports.getCertificatInfo = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    console.log("Recherche du certificat pour:", { courseId, userId });

    // Vérifier si l'apprenant existe
    const apprenant = await Apprenant.findOne({ userId: userId });
    if (!apprenant) {
      console.log("Apprenant non trouvé pour userId:", userId);
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }
    if (!courseId || !apprenant) {
      console.log("Paramètres manquants:", { courseId, apprenantId: apprenant?._id });
      return res.status(400).json({ message: "courseId ou apprenant_id manquant" });
    }

    const certificat = await Certificat.findOne({
      courseId: courseId,
      apprenant_id: apprenant._id
    })
      .populate({
        path: 'courseId',
        select: 'nom ',
        populate: {
          path: 'professeurId',
          select: 'name'
        }
      })
      .populate({
        path: 'apprenant_id',
        populate: {
          path: 'userId',
          select: 'name '
        }
      });

    if (!certificat) {
      console.log("Certificat non trouvé pour:", { courseId, apprenantId: apprenant._id });
      return res.status(404).json({
        message: "Certificat non trouvé pour ce cours"
      });
    }

    console.log("Certificat trouvé:", {
      id: certificat._id,
      courseId: certificat.courseId?._id,
      apprenantId: certificat.apprenant_id?._id
    });

    // Traduire les informations du certificat
    const courseName = certificat.courseId.nom;
    const professorName = certificat.courseId.professeurId.name;
    const studentName = certificat.apprenant_id.userId.name;

    const courseName_ar = await translateText(courseName, 'en', 'ar');
    const professorName_ar = await translateText(professorName, 'en', 'ar');
    const studentName_ar = await translateText(studentName, 'en', 'ar');

    const response = {
      certificat: {
        id: certificat._id.toString(),
        date_obtention: certificat.date_obtention
      },
      courseInfo: {
        nom: courseName,
        nom_ar: courseName_ar,
        professeur: professorName,
        professeur_ar: professorName_ar
      },
      apprenantInfo: {
        name: studentName,
        name_ar: studentName_ar
      }
    };

    console.log("Réponse envoyée:", JSON.stringify(response, null, 2));
    res.status(200).json(response);

  } catch (error) {
    console.error("Erreur détaillée lors de la récupération du certificat:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: "Erreur lors de la récupération des informations du certificat",
      error: error.message
    });
  }
};

// Télécharger le certificat
exports.telechargerCertificat = async (req, res) => {
  try {
    const { certificatId } = req.params;
    console.log("Tentative de téléchargement du certificat avec l'ID:", certificatId);

    if (!certificatId || !mongoose.Types.ObjectId.isValid(certificatId)) {
      console.log("ID de certificat invalide:", certificatId);
      return res.status(400).json({ 
        message: "ID de certificat invalide ou manquant",
        details: {
          certificatIdValid: mongoose.Types.ObjectId.isValid(certificatId),
          certificatId: certificatId
        }
      });
    }

    const certificat = await Certificat.findById(certificatId)
      .populate({
        path: 'apprenant_id',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .populate({
        path: 'courseId',
        select: 'nom',
        populate: {
          path: 'professeurId',
          select: 'name'
        }
      });

    if (!certificat) {
      console.log("Certificat non trouvé pour l'ID:", certificatId);
      return res.status(404).json({ message: "Certificat non trouvé." });
    }

    console.log("Certificat trouvé:", {
      id: certificat._id,
      apprenant: certificat.apprenant_id?.userId?.name,
      cours: certificat.courseId?.nom
    });

    // Lis le template HTML
    const templatePath = path.join(__dirname, '../templates/certificatTemplate.html');
    console.log("Chemin du template:", templatePath);
    
    if (!fs.existsSync(templatePath)) {
      console.error("Le fichier template n'existe pas:", templatePath);
      return res.status(500).json({ message: "Template de certificat non trouvé" });
    }

    let html = fs.readFileSync(templatePath, 'utf8');
    // Remplace les variables dans le HTML (remplacement global)
    html = html.replace(/{{userName}}/g, certificat.apprenant_id.userId.name)
      .replace(/{{courseName}}/g, certificat.courseId.nom)
      .replace(/{{profName}}/g, certificat.courseId.professeurId.name)
      .replace(/{{score}}/g, "20")
      .replace(/{{date}}/g, new Date(certificat.date_obtention).toLocaleDateString('fr-FR'));

    console.log("HTML généré avec succès");

    // Génère le PDF avec Puppeteer
    console.log("Démarrage de Puppeteer...");
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true });
    await browser.close();

    console.log("PDF généré avec succès, taille:", pdfBuffer.length);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=certificat.pdf`,
      'Content-Length': pdfBuffer.length
    });
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Erreur détaillée lors du téléchargement du certificat:", {
      message: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ 
      message: "Erreur serveur lors du téléchargement du certificat",
      error: error.message,
      details: error.stack
    });
  }
};


exports.getQuizResult = async (req, res) => {
  try {
    const  {quizId}  = req.params;
    const userId = req.user.userId;


    if (
      !mongoose.Types.ObjectId.isValid(quizId) ||
      !mongoose.Types.ObjectId.isValid(userId )
    ) {
      return res.status(400).json({
        message: "ID utilisateur ou cours invalide",
        details: {
          quizIdValid: mongoose.Types.ObjectId.isValid(quizId),
          userIdValid: mongoose.Types.ObjectId.isValid(userId),
        },
      });
    }


    console.log('Recherche du quiz avec ID:', quizId);
    console.log('ID utilisateur:', userId);

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    // Trouver l'apprenant par userId
    const apprenant = await Apprenant.findOne({ userId: userId })
      .populate('userId');

    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé" });
    }

    // Chercher le résultat dans le tableau resultats du quiz
    const resultat = quiz.resultats.find(
      r => r.apprenant_id && r.apprenant_id.toString() === apprenant._id.toString()
    );

    if (!resultat) {
      return res.status(404).json({ message: "Résultat du quiz non trouvé" });
    }

    res.status(200).json({
      score: resultat.score,
      passed: resultat.score >= 17
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du résultat du quiz:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération du résultat du quiz",
      error: error.message
    }); 
  }
};

exports.getQuizByInstructor    = async (req, res) => {
  try {
    const { professeurId } = req.params;
    const courses = await Course.find({ professeurId: professeurId });
    const quizIds = courses.map(course => course.quizId);
    const quizes = await Quiz.find({ _id: { $in: quizIds } })
    .populate('questionQuiz_id').populate('courseId', 'nom');
    if (!quizes) {  
      return res.status(404).json({ message: "Quiz non trouvé" });
    }
    res.status(200).json(quizes);
  } catch (error) {
    console.error("Erreur lors de la récupération du quiz:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

