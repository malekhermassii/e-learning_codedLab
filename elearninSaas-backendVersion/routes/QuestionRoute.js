module.exports = (app) => {
    const questions = require("../controllers/QuestionController");
    const authMiddleware = require("../middleware/authMiddleware");

    // Routes pour les questions
    app.post("/question/:courseId", authMiddleware, questions.createQuestion);
    app.get("/question", questions.findAllquestion);
    app.get("/question/:questionId", questions.findOnequestion);
    app.put("/question/:questionId/reponse", authMiddleware, questions.repondreQuestion);
};
