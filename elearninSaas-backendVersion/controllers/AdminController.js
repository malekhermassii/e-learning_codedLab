const Admin = require("../modeles/AdminModal");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId: userId, 
   
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: "1d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingadmin = await Admin.findOne({ email });
    if (existingadmin) {
      return res.status(400).json({ message: "admin already exists" });
    }

    const admin = new Admin({ name, email, password });
    await admin.save();

    const token = generateToken(admin._id);
    res.status(201).json({
      userId: admin._id,
      name: admin.name,
      email: admin.email,
      token,


    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("⭐ Requête de connexion reçue:", req.body);
    const { email, password } = req.body;

    // Look up the admin in the database by their email
    const admin = await Admin.findOne({ email });
    console.log("⭐ Admin trouvé:", admin ? "Oui" : "Non");
    console.log("⭐ Détails de l'admin:", {
      email: admin?.email,
      password: admin?.password,
      _id: admin?._id,
    });

    if (!admin) {
      console.log("❌ Aucun admin trouvé avec cet email");
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    console.log("⭐ Tentative de comparaison du mot de passe");
    console.log("⭐ Mot de passe entré:", password);
    console.log("⭐ Mot de passe stocké:", admin.password);

    const isPasswordValid = await admin.comparePassword(password);
    console.log("⭐ Mot de passe valide:", isPasswordValid ? "Oui" : "Non");

    if (!isPasswordValid) {
      console.log("❌ Mot de passe incorrect");
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Generate a JWT token for the admin
    const token = generateToken(admin._id);
    console.log("⭐ Token généré");

    // Store admin session
    req.session.userId = admin._id;

    // Prepare admin data to send
    const adminData = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      image: admin.image,
      createdAt: admin.createdAt,
    };

    console.log("✅ Connexion réussie pour:", email);
    console.log("✅ Données admin envoyées:", adminData);

    // Send response with token and admin data
    res.json({
      token,
      admin: adminData,
 
    });
  } catch (error) {
    console.error("❌ Erreur de connexion:", error);
    res
      .status(500)
      .json({ message: "La connexion a échoué", error: error.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    // Destroy the session on the server. The session data is removed.
    if (err) return res.status(500).json({ message: "Logout failed" });
    // connect.sid is the default name of the session cookie used by the Express session middleware to store session data on the client-side
    //  // Clear the session cookie (`connect.sid`) that was stored in the admin's browser.
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};

exports.updateAdminProfile = async (req, res) => {
  try {
    console.log("⭐ Mise à jour du profil admin");
    console.log("⭐ Données reçues:", req.body);

    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      console.log("❌ Admin non trouvé");
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Mise à jour des champs de base
    if (req.body.name) {
      console.log("⭐ Mise à jour du nom");
      admin.name = req.body.name;
    }
    if (req.body.email) {
      console.log("⭐ Mise à jour de l'email");
      admin.email = req.body.email;
    }

    // Gestion du mot de passe
    if (req.body.password) {
      console.log("⭐ Mise à jour du mot de passe");
      console.log("⭐ Nouveau mot de passe:", req.body.password);
      admin.password = req.body.password; // Le middleware de hachage s'occupera du hachage
    }

    // Gestion de l'image
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (admin.image) {
        const oldImagePath = path.join(
          __dirname,
          "../Public/Images",
          admin.image
        );
        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.error("Erreur lors de la suppression de l'image :", err);
        });
      }
      admin.image = req.file.filename;
    }

    // Sauvegarder les modifications
    console.log("⭐ Sauvegarde des modifications");
    await admin.save();
    console.log("⭐ Profil mis à jour avec succès");

    // Retourner les informations mises à jour
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      image: admin.image,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({
      message: "Échec de la mise à jour du profil",
      error: error.message,
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
