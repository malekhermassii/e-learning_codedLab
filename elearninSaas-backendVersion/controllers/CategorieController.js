const Categorie = require("../modeles/CategorieModal");
const fs = require("fs");
const path = require("path");
const { translateText } = require('../utils/translation');
//create
exports.createCategorie = (req, res) => {
  //Vérifie si une image a été envoyée
  const imagePath = req.files["image"] ? req.files["image"][0].filename : null;
  const categorie = new Categorie({
    titre: req.body.titre,
    image: imagePath,
  });
  categorie
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while creating the categorie",
      });
    });
};

//getall
exports.findAllCategorie = async (req, res) => {
  try {
    const categories = await Categorie.find();
    
    const translatedCategories = await Promise.all(categories.map(async (categorie) => {
      const titre_ar = await translateText(categorie.titre, 'en', 'ar');
      return {
        _id: categorie._id,
        titre: categorie.titre,
        titre_ar: titre_ar,
        image: categorie.image
      };
    }));

    res.send(translatedCategories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).send({
      message: error.message || "Erreur serveur lors de la récupération des catégories",
    });
  }
};
//getone
exports.findOneCategorie = (req, res) => {
  Categorie.findById(req.params.categorieId)
    .then((categorie) => {
      if (!categorie) {
        return res.status(404).send({
          message: "categorie not found by id " + req.params.categorieId,
        });
      }
      res.send(categorie);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the categorie by id" +
            req.params.categorieId,
      });
    });
};
//update
exports.updateCategorie = (req, res) => {
  // Par défaut, on garde l'ancienne image
  let imagePath = Categorie.image;
  // Vérifier si une nouvelle image a été uploadée
  if (req.files && req.files["image"]) {
    // Supprimer l'ancienne image si elle existe
    if (Categorie.image) {
      const oldImagePath = path.join(
        __dirname,
        "../Public/Images",
        Categorie.image
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Supprimer l'ancienne image
      }
    }
    // Mettre à jour l'image avec la nouvelle image téléchargée
    imagePath = req.files["image"][0].filename;
  }
  Categorie.findByIdAndUpdate(
    req.params.categorieId,
    {
      titre: req.body.titre,
      image: imagePath,
    },
    { new: true }
  )
    .then((Categorie) => {
      if (!Categorie) {
        return res.status(404).send({
          message: "Categorie not fount with the id " + req.params.categorieId,
        });
      }
      res.send(Categorie);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the categorie by id" +
            req.params.categorieId,
      });
    });
};

exports.deleteCategorie = (req, res) => {
  Categorie.findByIdAndDelete(req.params.categorieId)
    .then((categorie) => {
      if (!categorie) {
        return res.status(404).send({
          message: "categorie not found with ID " + req.params.categorieId,
        });
      }

      // Si pas d'image → répondre directement
      if (!categorie.image) {
        return res.send({ message: "categorie deleted successfully!" });
      }

      // Sinon, supprimer l'image puis envoyer la réponse
      const imagePath = path.join(
        __dirname,
        "../Public/Images",
        categorie.image
      );

      fs.unlink(imagePath, (err) => {
        if (err && err.code !== "ENOENT") {
          // ❌ Problème autre que fichier non trouvé
          console.error("Erreur lors de la suppression de l'image", err);
          return res.status(500).send({
            message: "Erreur serveur lors de la suppression de l'image",
          });
        }

        // ✅ Si tout va bien ou image déjà inexistante
        console.log("Image supprimée (ou non trouvée)");
        return res.send({ message: "categorie deleted successfully!" });
      });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          "Server error while deleting the categorie with ID " +
            req.params.categorieId,
      });
    });
};

