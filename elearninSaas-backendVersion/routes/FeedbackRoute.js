module.exports = (app)=>{
    const authMiddleware = require("../middleware/authMiddleware")
    const feedbacks = require("../controllers/FeedbackController")
    app.post("/feedback/:courseId" ,authMiddleware, feedbacks.createFeedback)
    app.get("/feedback" , feedbacks.findAllFeedback)
    app.get("/feedback/:feedbackId" , feedbacks.findOnefeedback)
    
    //app.put("/feedback/:feedbackId" , feedbacks.updatefeedback)
    //app.delete("/feedback/:feedbackId" , feedbacks.deletefeedback)
}
