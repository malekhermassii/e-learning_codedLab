module.exports = (app)=>{
    const authMiddleware = require("../middleware/authMiddleware")
    const quizes = require("../controllers/QuizController")
    app.post("/quiz" , quizes.createQuiz)
    app.get("/quiz" , quizes.findAllQuizs)
    app.get("/quiz/:quizId" , quizes.findOneQuiz)
    app.put("/quiz/:quizId" ,authMiddleware, quizes.updateQuiz)
    app.delete("/quiz/:quizId" ,authMiddleware, quizes.deletequiz)
    app.post("/passerQuiz/:quizId" , authMiddleware, quizes.passerQuiz)
    app.get("/certificat/course/:courseId", authMiddleware, quizes.getCertificatInfo)
    app.get("/certificats/:certificatId/telecharger", quizes.telechargerCertificat);
    app.get("/quizResult/:quizId", authMiddleware, quizes.getQuizResult);
    app.get("/quizByInstructor/:professeurId", authMiddleware, quizes.getQuizByInstructor);
}

