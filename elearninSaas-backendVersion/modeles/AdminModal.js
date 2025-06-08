const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  image: { type: String },
});

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  console.log("⭐ Middleware de hachage du mot de passe");
  console.log("⭐ Mot de passe avant hachage:", this.password);
  
  if (!this.isModified("password")) {
    console.log("⭐ Le mot de passe n'a pas été modifié");
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    console.log("⭐ Sel généré:", salt);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("⭐ Mot de passe après hachage:", this.password);
    next();
  } catch (error) {
    console.error("❌ Erreur lors du hachage du mot de passe:", error);
    next(error);
  }
});

// Compare password method
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("⭐ Comparaison des mots de passe dans le modèle");
  console.log("⭐ Mot de passe candidat:", candidatePassword);
  console.log("⭐ Mot de passe stocké:", this.password);
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log("⭐ Résultat de la comparaison:", result);
  return result;
};
module.exports = mongoose.model("Admin", AdminSchema);

//qwerty123
//wqwerdqfghkefmqgregu45678902fpihgwety13fdwcuier3611897woipopq3
