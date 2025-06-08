const uploads = require("../uploads");
const authMiddleware = require('../middleware/authMiddleware');
module.exports = (app)=>{
    const demandes = require("../controllers/DemandeController")
    app.post("/demandes" ,uploads.fields([{name : "cv"}]), demandes.createdemande),
    app.put("/demandes/:demandeId/accepter",authMiddleware, demandes.accepterdemande);
    app.put("/demandes/:demandeId/refuser", authMiddleware, demandes.refusedemande);
    app.get("/demandes"  , authMiddleware, demandes.findAlldemandes)
    app.get("/demandes/:demandeId" , authMiddleware, demandes.findOneuser)
    app.delete("/demandes/:demandeId" , authMiddleware, demandes.deletedemande)
    app.get("/demandes/:demandeId/download-cv", authMiddleware, demandes.downloadCV);
}
