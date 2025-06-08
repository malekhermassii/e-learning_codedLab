const uploads = require("../uploads");
module.exports = (app)=>{
    const professeur = require("../controllers/ProfesseurController");
    const authMiddleware = require('../middleware/authMiddleware');
    app.post("/professeurcreate" , professeur.registerProfessor);
    app.post("/professeurlogin", professeur.login);
    //protecetd route
    app.post("/logoutprof", authMiddleware, professeur.logout);
    app.put("/updateprofile" , uploads.fields([{ name: "image"}]), authMiddleware, professeur.updateProfile)
    app.get("/professeur",professeur.findAllProfesseur)
    app.get("/professeur/:professeurId"  ,professeur.findOneprofesseur)
    app.delete("/professeur/:professeurId" , professeur.deleteProfesseur)
    app.put("/professeur/:professeurId" , professeur.updateProfesseur)


}
// authMiddleware,
// authorize('admin')
