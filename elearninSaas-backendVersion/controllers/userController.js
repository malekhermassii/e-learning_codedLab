const User = require("../modeles/userModal");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');


// Helper function to generate JWT
generateToken = (userId) => {
  // we use the jwt.sign to generate a json web token
  return jwt.sign(
    { 
      userId: userId, 
 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password });
    user.image = 'default.png';
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      userId: user._id,
      name: user.name,
      email: user.email,
      token,
    
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password,expoPushToken } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "L'email et le mot de passe sont requis" });
    }
    
    // Rechercher l'utilisateur par email
    const user = await User.findOne({ email });
    
    // Si aucun utilisateur n'est trouvé avec cet email
    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    // Générer un token JWT
    const token = generateToken(user._id);
    
    if (expoPushToken !== null) {
      user.expoPushToken = expoPushToken;
      await user.save();
    }

    // Stocker l'ID de l'utilisateur dans la session
    req.session.userId = user._id;
  

    // Renvoyer les informations de l'utilisateur et le token
    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      dateNaissance: user.dateNaissance,
      telephone: user.telephone,
      token,
     
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ 
      message: "La connexion a échoué", 
      error: error.message 
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    // Destroy the session on the server. The session data is removed.
    if (err) return res.status(500).json({ message: "Logout failed" });
    // connect.sid is the default name of the session cookie used by the Express session middleware to store session data on the client-side
    //  // Clear the session cookie (`connect.sid`) that was stored in the user's browser.
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};

exports.updateProfile = async (req, res) => {
  try {
    // Récupérer l'utilisateur connecté
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'email est modifié et s'il existe déjà
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({ 
          message: "Cet email est déjà utilisé par un autre utilisateur" 
        });
      }
    }

    // Mise à jour des champs de base
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.telephone) user.telephone = req.body.telephone;
    if (req.body.dateNaissance) {
      // S'assurer que la date est valide
      const dateNaissance = new Date(req.body.dateNaissance);
      if (isNaN(dateNaissance.getTime())) {
        return res.status(400).json({ message: "Format de date invalide" });
      }
      user.dateNaissance = dateNaissance;
    }
    if (req.body.image) user.image = req.body.image;

    // Gestion du mot de passe - ATTENTION: Ne pas utiliser bcrypt.hashSync directement
    // car cela contourne le middleware pre('save') du modèle
    if (req.body.password) {
      user.password = req.body.password; // Le middleware pre('save') va automatiquement hasher ce mot de passe
    }

    // Gestion de l'image via req.file (pour les uploads directs)
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (user.image) {
        const oldImagePath = path.join(
          __dirname,
          "../Public/Images",
          user.image
        );
        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.error("Erreur lors de la suppression de l'image :", err);
        });
      }
      user.image = req.file.filename;
    }

    // Sauvegarder les modifications - Ceci va déclencher le hook pre('save')
    await user.save();

    // Générer un nouveau token pour éviter les problèmes d'authentification
    const token = generateToken(user._id);

    // Retourner les informations mises à jour avec le nouveau token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      dateNaissance: user.dateNaissance,
      telephone: user.telephone,
      token ,// Inclure le nouveau token
        });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    res.status(500).json({
      message: "Échec de la mise à jour du profil",
      error: error.message,
      stack: error.stack
    });
  }
};



exports.getProfile = async (req, res) => {
  try {
    // Récupérer l'utilisateur connecté
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Retourner les informations de l'utilisateur
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      dateNaissance: user.dateNaissance ? user.dateNaissance.toISOString() : null,
      telephone: user.telephone
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    res.status(500).json({
      message: "Échec de la récupération du profil",
      error: error.message
    });
  }
};

//getall
exports.findAllusers = (req, res) => {
  User.find()
    .then((users) => {
      res.send(users);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our users",
      });
    });
};
//delete
exports.deleteuser = (req, res) => {
  User.findByIdAndDelete(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "user not fount with the id " + req.params.userId,
        });
      }

      // Vérifier si une image existe et la supprimer du dossier
      if (user.image) {
        const imagePath = path.join(__dirname, "../Public/Images", user.image); // Le chemin de l'image
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
      res.send({ message: "user deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the user by id" + req.params.userId,
      });
    });
};


exports.sendResetCode = async (to, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Code de réinitialisation de mot de passe',
    text: `Votre code de réinitialisation est : ${code}`,
  });
};


// 1. Demander le code
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = code;
  user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  await exports.sendResetCode(email, code);
  res.json({ message: "Code envoyé par email" });
}

// 2. Vérifier le code
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email, resetCode: code });
  if (!user || user.resetCodeExpires < new Date()) {
    return res.status(400).json({ message: "Code invalide ou expiré" });
  }
  res.json({ message: "Code valide" });
}

// 3. Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email, resetCode: code });
  if (!user || user.resetCodeExpires < new Date()) {
    return res.status(400).json({ message: "Code invalide ou expiré" });
  }
  const salt = await bcrypt.genSalt(10);  // Generate a salt with a complexity factor of  The salt is used to add randomness to the hash.
     user.password = newPassword;
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();
  res.json({ message: "Mot de passe réinitialisé avec succès" });
}



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});


