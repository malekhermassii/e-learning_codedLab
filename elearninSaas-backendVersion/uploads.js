const multer = require("multer");
const path = require("path");

//Définition des destinations pour les fichiers (Images & Vidéos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Type MIME du fichier:", file.mimetype);
    console.log("Nom original du fichier:", file.originalname);
    
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("Extension détectée:", ext);
    
    if (/\.(jpeg|jpg|png|gif|webp)$/i.test(file.originalname.toLowerCase())) {
      console.log("Fichier identifié comme image");
      cb(null, "Public/Images"); // Dossier pour les images
    } else if (/\.(mp4|avi|mkv|mov|wmv)$/i.test(file.originalname.toLowerCase())) {
      console.log("Fichier identifié comme vidéo");
      cb(null, "Public/Videos"); // Dossier pour les vidéos
    } else if (/\.(pdf|doc|docx)$/i.test(file.originalname.toLowerCase())) {
      console.log("Fichier identifié comme document");
      cb(null, "Public/CV"); // Dossier pour les CV
    } else {
      console.log("Type de fichier non reconnu");
      return cb(new Error(`Format de fichier non autorisé: ${ext}`), false);
    }
  },
  filename: function (req, file, cb) {
    // Créer un nom de fichier unique en ajoutant un timestamp
    const uniqueName = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
    console.log("Nouveau nom de fichier:", uniqueName);
    cb(null, uniqueName);
  },
});

// Filtrer les fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mkv|mov|wmv|pdf|doc|docx/i;
  
  // Vérifier par l'extension
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Vérifier par le type MIME
  const mimetype = allowedTypes.test(file.mimetype);

  console.log("Vérification du fichier:", file.originalname);
  console.log("Type MIME:", file.mimetype);
  console.log("Extension valide:", extname);
  console.log("Type MIME valide:", mimetype);

  if (extname || mimetype) {
    console.log("Fichier accepté");
    return cb(null, true);
  } else {
    console.log("Fichier rejeté");
    return cb(
      new Error(
        `Ce type de fichier n'est pas autorisé. Extensions acceptées: jpeg, jpg, png, gif, webp, mp4, avi, mkv, mov, wmv, pdf, doc, docx. Type reçu: ${file.mimetype}`
      ),
      false
    );
  }
};

//Middleware multer
const uploads = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 10MB max
  }
});

module.exports = uploads;
