const uploads = require("../uploads");
const authMiddleware = require('../middleware/authMiddleware');
module.exports = (app)=>{
    const categorie = require("../controllers/CategorieController")
    app.post("/categorie" , authMiddleware, uploads.fields([{ name: "image"}]), categorie.createCategorie)
    app.get("/categorie" , categorie.findAllCategorie)
    app.get("/categorie/:categorieId" , categorie.findOneCategorie)
    app.put("/categorie/:categorieId" ,authMiddleware, uploads.fields([{ name: "image"}]) , categorie.updateCategorie)
    app.delete("/categorie/:categorieId" , authMiddleware, categorie.deleteCategorie)
}
