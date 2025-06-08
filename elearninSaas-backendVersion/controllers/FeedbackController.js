const Feedback = require("../modeles/FeedbackModal");
const { Course } = require("../modeles/CourseModal");
const User = require("../modeles/userModal");
const Apprenant = require("../modeles/ApprenantModal");
const mongoose = require("mongoose");
//create
exports.createFeedback = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const cours = await Course.findById(courseId);
    if (!cours) return res.status(404).json({ message: "Cours non trouvé" });

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

    // Création du feedback
    const feedback = new Feedback({
      message: req.body.message,
      rating: req.body.rating,
      // apprenant_id: req.apprenant_id,   //recupere ml token
      courseId: courseId,
      apprenant_id: apprenant._id,
    });
    const savedFeedback = await feedback.save();
    // Mise à jour du cours avec le nouveau feedback
    await Course.findByIdAndUpdate(courseId, {
      $push: { feedback_id: savedFeedback._id },
    });
    // Calcul  des ratings
    const ratings = await Feedback.aggregate([
      {
        $group: {
          _id: "$courseId",
          totalRatingSum: { $sum: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
      {
        $project: {
          courseId: "$_id",
          averageRating: {
            $round: [{ $divide: ["$totalRatingSum", "$totalRatings"] }, 1],
          },
          totalRatings: 1,
          _id: 0,
        },
      },
    ]);
    // Mise à jour des cours
    for (const rating of ratings) {
      await Course.findByIdAndUpdate(rating.courseId, {
        averageRating: rating.averageRating,
        totalRatings: rating.totalRatings,
      });
    }
    res.status(201).json({
      message: "Feedback ajouté avec succès",
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du feedback :", error);
    res.status(500).json({
      message: "Erreur serveur lors de l'ajout du feedback",
      error: error.message,
    });
  }
};

//consulter avis
exports.findAllFeedback = (req, res) => {
  Feedback.find().populate
  (
    {
     path: "apprenant_id",
      populate: {
        path: "userId",
        select: "name "
      }
    })
      .populate("courseId", "nom")
    .then((feedbacks) => {
      res.send(feedbacks);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our Feedback",
      });
    });
};
//getone
exports.findOnefeedback = (req, res) => {
  Feedback.findById(req.params.feedbackId).populate
  (
    {
     path: "apprenant_id",
      populate: {
        path: "userId",
        select: "name "
      }
    })
      .populate("courseId", "nom")
    .then((feedback) => {
      if (!feedback) {
        return res.status(404).send({
          message: "feedback not found by id " + req.params.feedbackId,
        });
      }
      res.send(feedback);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the feedback by id" +
            req.params.feedbackId,
      });
    });
};
