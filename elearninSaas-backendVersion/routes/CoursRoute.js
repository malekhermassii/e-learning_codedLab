const uploads = require("../uploads");
module.exports = (app)=>{
    const courses = require("../controllers/CoursController")
    const authMiddleware = require('../middleware/authMiddleware');
    
    app.post("/course" , uploads.fields([{ name: "image"}, { name: "url"}])  ,authMiddleware, courses.createCourse)
    app.get("/course" , courses.findAllCourses)
    app.get("/course/search", courses.search);
    app.get("/course/:courseId" , courses.findOneCourse)
    app.put("/course/:courseId" ,uploads.fields([{ name: "image"}, { name: "url"}]), authMiddleware, courses.updateCourse)
    app.delete("/course/:courseId" , authMiddleware, courses.deleteCourse)
    app.put("/course/:courseId/accepter", authMiddleware, courses.approveCourse);
    app.put("/course/:courseId/refuser", authMiddleware, courses.refuseCourse);
    app.post('/enroll/:courseId', authMiddleware ,courses.enroll);
    app.put("/progress/update/:courseId/:moduleId/:videoId" ,authMiddleware, courses.updateProgress);
    app.get("/courseprogress", authMiddleware, courses.getProgression);
    app.get("/course/:courseId/modules", courses.getCourseModules);
    app.get("/courseprogress",authMiddleware, courses.getProgression);
    app.get("/courseprogress/:courseId",authMiddleware, courses.getProgressionByCourse);
    app.get('/enroll/check/:courseId', authMiddleware, courses.checkEnrollment);
    app.post('/progress/create/:courseId/:moduleId/:videoId', authMiddleware, courses.initProgress);
    app.get('/abonnement/status', authMiddleware, courses.getAbonnementStatus)
    app.get('/progression/all', authMiddleware, courses.getAllProgression);
   app.get("/course/:courseId/modules", courses.getCourseModules);
   app.get("/course/instructor/:professeurId", courses.getCourseByInstructor);
}
