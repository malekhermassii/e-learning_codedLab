const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const CoursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  apprenantEnroll: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant' }] ,// Liste des étudiants inscrits
  image: { type: String },
  statut: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  averageRating: {type: Number,default: 0},
  totalRatings: {type: Number,default: 0},
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
  categorieId: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  question_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  feedback_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
  professeurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur' },
  enrolledCount :{type:Number,default: 0},
  level:{ type: String},
  languages:{ type: String}
});


//moduleschema
const ModuleSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  nbrVideo: { type:Number },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  
 
});
//vdschema
const VideoSchema = new mongoose.Schema({
  titrevd: { type: String },
  duree: { type: String },
  url: [{ type: String }], 
  
});



//enrollschema
const EnrollmentSchema = new mongoose.Schema({
  apprenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  dateEnroll: { type: Date, default: Date.now }
});
//progressionschema
const ProgressionSchema = new mongoose.Schema({
  apprenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Apprenant" },  // Référence à l'apprenant
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },      // Référence au cours
  lastUpdate: { type: Date, default: Date.now },                          // Date de dernière mise à jour
  modules: [
    {
      moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
      videosCompletees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      progressionModule: { type: Number, default: 0 },
    },
  ],
  progressionCours: { type: Number, default: 0 },
  complet: { type: Boolean, default: false }  // Cours complété ou non
});


// Middleware de suppression en cascade
CoursSchema.pre('findOneAndDelete', async function(next) {
  try {
    const courseId = this.getQuery()._id;
    const course = await this.model.findById(courseId).populate({
      path: 'modules',
      populate: {
        path: 'videos'
      }
    });

    if (!course) {
      return next();
    }

    // Suppression des fichiers vidéo et des documents vidéo
    for (const module of course.modules) {
      for (const video of module.videos) {
        if (video.url && Array.isArray(video.url)) {
          // Traitement de chaque URL dans le tableau
          for (const url of video.url) {
            if (url) {
              const videoPath = path.join(__dirname, "../Public/Videos", url);
              if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
                console.log(`Vidéo supprimée: ${url}`);
              }
            }
          }
        } else if (video.url && typeof video.url === 'string') {
          // Gestion du cas où url est une chaîne simple
          const videoPath = path.join(__dirname, "../Public/Videos", video.url);
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            console.log(`Vidéo supprimée: ${video.url}`);
          }
        }
        // Suppression du document vidéo
        await Video.findByIdAndDelete(video._id);
      }
      // Suppression du document module
      await Module.findByIdAndDelete(module._id);
    }

    // Suppression de l'image du cours
    if (course.image) {
      const imagePath = path.join(__dirname, "../Public/Images", course.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Image supprimée: ${course.image}`);
      }
    }

    // Suppression des inscriptions
    await Enrollment.deleteMany({ courseId: course._id });
    console.log('Inscriptions supprimées');

    // Suppression des progressions
    await Progression.deleteMany({ courseId: course._id });
    console.log('Progressions supprimées');

    // Suppression des questions
    await mongoose.model('Question').deleteMany({ courseId: course._id });
    console.log('Questions supprimées');

    // Suppression des feedbacks
    await mongoose.model('Feedback').deleteMany({ courseId: course._id });
    console.log('Feedbacks supprimés');

    // Suppression du quiz associé
    if (course.quizId) {
      await mongoose.model('Quiz').findByIdAndDelete(course.quizId);
      console.log('Quiz supprimé');
    }

    // Mise à jour du professeur
    await mongoose.model('Professeur').findByIdAndUpdate(
      course.professeurId,
      { $pull: { courseId: course._id } }
    );
    console.log('Référence du cours supprimée du professeur');

    next();
  } catch (error) {
    console.error('Erreur dans le middleware de suppression:', error);
    next(error);
  }
});
// Création des modèles
const Course = mongoose.model("Course", CoursSchema);
const Module = mongoose.model("Module", ModuleSchema);
const Video = mongoose.model("Video", VideoSchema);
const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
const Progression = mongoose.model('Progression', ProgressionSchema);


// Export des deux modèles
module.exports = {
  Course,
  Module,
  Video,
  Enrollment,
  Progression
};
