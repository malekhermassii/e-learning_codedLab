const Professeur = require("../modeles/ProfesseurModal");
//const User = require("../modeles/userModal");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// Fonction pour générer un JWT
const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId: userId, 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )};

exports.registerProfessor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await Professeur.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Un compte existe déjà avec cet e-mail." });
    }

    // Créer l'utilisateur avec le rôle "professeur"
    const professeur = new Professeur({ name, email, password });
    await professeur.save();

    // Générer un token
    const token = generateToken(professeur._id);

    // Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Contenu de l'e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre compte professeur a été créé",
      text: `Bonjour ${name},\n\nVotre compte professeur a été créé avec succès.\n\nIdentifiants de connexion:\nEmail: ${email}\nMot de passe temporaire: ${password} \n\nvoici votre lien http://localhost:4000/loginprof\n\nMerci de modifier votre mot de passe après connexion.\n\nCordialement,\nL'professeuristration  `,

    };

    // Envoyer l'e-mail
    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Compte professeur créé et e-mail envoyé avec succès.",
      userId: professeur._id,
      name: professeur.name,
      email: professeur.email,
    
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création du compte." });
  }
};
//login prof
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier que l'email et le mot de passe sont fournis
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Rechercher le professeur dans la base de données
    const professeur = await Professeur.findOne({ email });
    
    if (!professeur) {
      console.log("Professeur non trouvé pour l'email:", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const isMatch = await professeur.comparePassword(password);
    if (!isMatch) {
      console.log("Mot de passe incorrect pour l'email:", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer le token JWT
    const token = generateToken(professeur._id);

    // Stocker la session
    req.session.userId = professeur._id;

    // Retourner les informations du professeur
    res.json({
      userId: professeur._id,
      name: professeur.name,
      email: professeur.email,
      token,
     
      user: {
        _id: professeur._id,
        name: professeur.name,
        email: professeur.email,
        image: professeur.image,
        telephone: professeur.telephone,
        dateNaissance: professeur.dateNaissance,
        specialite: professeur.specialite
      }
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    // Destroy the session on the server. The session data is removed.
    if (err) return res.status(500).json({ message: "Logout failed" });
    // connect.sid is the default name of the session cookie used by the Express session middleware to store session data on the client-side
    //  // Clear the session cookie (`connect.sid`) that was stored in the professeur's browser.
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};
//update profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body); // Obtenir les champs à mettre à jour
    const allowedUpdates = [
      "name",
      "email",
      "password",
      "image",
      "dateNaissance",
      "telephone",
      "specialite",
    ];

    // Vérifier que les champs à mettre à jour sont valides
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).json({ message: "Mise à jour invalide" });
    }

    // Trouver l'professeur par ID
    const professeur = await Professeur.findById(req.user.userId);
    console.log("Professeur trouvé:", professeur ? "Oui" : "Non");
    console.log("Image avant mise à jour :", professeur?.image || "Aucune image");
    
    if (!professeur)
      return res.status(404).json({ message: "professeur non trouvé" });

    // Gestion de l'upload d'image
    if (req.files && req.files["image"]) {
      console.log("Fichiers reçus :", req.files);
      // Supprimer l'ancienne image si elle existe
      if (professeur.image) {
        try {
          const oldImagePath = path.join(
            __dirname,
            "../Public/Images",
            professeur.image
          );
          console.log("Tentative de suppression de l'ancienne image:", oldImagePath);
          
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err)
                console.error("Erreur lors de la suppression de l'image :", err);
              else
                console.log("Ancienne image supprimée avec succès");
            });
          } else {
            console.log("L'ancienne image n'existe pas sur le disque");
          }
        } catch (error) {
          console.error("Erreur lors de la vérification/suppression de l'image:", error);
        }
      } else {
        console.log("Aucune image précédente à supprimer");
      }

      // Stocker la nouvelle image
      professeur.image = req.files["image"][0].filename;
      console.log("Nom de la nouvelle image assignée:", professeur.image);
    } else {
      console.log("Aucun fichier image reçu dans la requête");
    }

    // Mise à jour des autres champs
    updates.forEach((update) => {
      // Ne pas hacher le mot de passe ici, laissez le middleware pre-save du modèle s'en charger
      if (update === 'dateNaissance' && req.body[update]) {
        // Assurer que la date est correctement formatée
        const dateObj = new Date(req.body[update]);
        if (!isNaN(dateObj.getTime())) {
          professeur[update] = dateObj;
          console.log("Date de naissance mise à jour:", dateObj);
        } else {
          console.log("Format de date invalide:", req.body[update]);
        }
      } else {
        professeur[update] = req.body[update];
      }
    });

    console.log("Nouvelle image sauvegardée :", professeur.image);
    // Sauvegarder les données mises à jour - le hook pre-save du modèle s'occupera du hachage du mot de passe
    await professeur.save();
    console.log("Professeur sauvegardé avec succès");

    // Retourner les informations mises à jour au front
    const response = {
      userId: professeur._id,
      name: professeur.name,
      email: professeur.email,
      image: professeur.image,
      specialite: professeur.specialite,
      dateNaissance: professeur.dateNaissance,
      telephone: professeur.telephone,
    };
    
    console.log("Réponse envoyée au frontend:", response);
    res.json(response);
  } catch (error) {
    console.error("Erreur complète lors de la mise à jour:", error);
    res
      .status(500)
      .json({ message: "Échec de la mise à jour", error: error.message });
  }
};
//getall
exports.findAllProfesseur = (req, res) => {
  Professeur.find()
    .then((professeurs) => {
      res.send(professeurs);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message || " server error while retreiving our professeurs",
      });
    });
};
//getone
exports.findOneprofesseur = (req, res) => {
  const professeurId = req.params.professeurId;
  console.log("Recherche du professeur avec l'ID:", professeurId);

  if (!mongoose.Types.ObjectId.isValid(professeurId)) {
    return res.status(400).send({
      message: "ID de professeur invalide",
    });
  }

  Professeur.findById(professeurId)
    .select("name specialite email image dateNaissance telephone")
    .then((professeur) => {
      if (!professeur) {
        console.log("Professeur non trouvé avec l'ID:", professeurId);
        return res.status(404).send({
          message: "professeur not found by id " + professeurId,
        });
      }
      console.log("Professeur trouvé:", professeur);
      res.send(professeur);
    })
    .catch((error) => {
      console.error("Erreur lors de la recherche du professeur:", error);
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the professeur by id" + professeurId,
      });
    });
};
//update
exports.updateProfesseur = (req, res) => {
  Professeur.findByIdAndUpdate(
    req.params.professeurId,
    {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    },
    { new: true }
  )
    .then((professeur) => {
      if (!professeur) {
        return res.status(404).send({
          message:
            "professeur not fount with the id " + req.params.professeurId,
        });
      }
      res.send(professeur);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the professeur by id" +
            req.params.professeurId,
      });
    });
};






//delete
exports.deleteProfesseur = (req, res) => {
  Professeur.findByIdAndDelete(req.params.professeurId)
    .then((professeur) => {
      if (!professeur) {
        return res.status(404).send({
          message:
            "professeur not fount with the id " + req.params.professeurId,
        });
      }

      // Vérifier si une image existe et la supprimer du dossier
      if (professeur.image) {
        const imagePath = path.join(
          __dirname,
          "../Public/Images",
          professeur.image
        ); // Le chemin de l'image
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Erreur lors de la suppression de l'image", err);
            return res.status(500).send({
              message: "Erreur serveur lors de la suppression de l'image",
            });
          }
          console.log("Image supprimée avec succès");
        });
      }
      res.send({ message: "professeur deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the professeur by id" +
            req.params.professeurId,
      });
    });
};
