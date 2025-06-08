const Demande = require("../modeles/DemandeModal");
const transporter = require("../emailService");
const path = require("path");
const fs = require("fs");

exports.createdemande = async (req, res) => {
  try {
    // Vérification des doublons (utiliser await ici)
    const demandeExist = await Demande.findOne({ email: req.body.email });
    if (demandeExist) {
      return res.status(409).json({
        message: "A user with this email already exists",
        existinguser: demandeExist,
      });
    }
    const cvPath = req.files["cv"] ? req.files["cv"][0].filename : null;
    if (!cvPath) {
      return res.status(400).json({ error: "The CV file is required" });
    }
    // Création du nouvel demande
    const demande = new Demande({
      name: req.body.name,
      email: req.body.email,
      country: req.body.country,
      speciality: req.body.speciality,
      cv: cvPath,
      birthDate: req.body.birthDate,
      topic: req.body.topic,
    });

    // Sauvegarde de l'utilisateur
    const newDemande = await demande.save();
    res.status(201).json({
      message: "Request created successfully",
      demande: newDemande,
    });
  } catch (error) {
    console.error("Error while creating the request :", error);
    res.status(500).send({
      message: error.message || "Server error while creating the request",
    });
  }
};

exports.accepterdemande = async (req, res) => {
  const { demandeId } = req.params;
  const { dateEntretien ,meetLink} = req.body;
  try {
    // Recherche de la demande par ID
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ message: "Request not found" });
    }
    // Vérifier que la date d'entretien est fournie
    if (!dateEntretien) {
      return res
        .status(400)
        .json({
          message:
            "The interview date is required to approve the request.",
        });
    }
    // Mise à jour du statut de la demande et ajout de la date d'entretien
    demande.statut = "approved";
    demande.dateEntretien = dateEntretien;
    demande.meetLink = meetLink;
    await demande.save(); // Sauvegarder la demande mise à jour
    // Options de l'email
    const mailOptions = {
      from: "rihabchebil10@gmail.com",
      to: demande.email,
      subject: "Interview scheduled",
      html: `
          <p>Hello,</p>
          <p>Your request has been approved. You must organize an interview scheduled for the following date:</p>
          <ul>
              <li><strong>Interview date :</strong> ${new Date(
                dateEntretien
              ).toLocaleString("fr-FR")}</li>
              <li>
              ${meetLink}
              </li>
          </ul>
          <p>Please take the necessary arrangements.</p>
          <p>Best regards,</p>
          <p>The administrative team</p>
      `,
    };
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    // Réponse au client
    res.json({ message: "Request approved and email sent", demande });
  } catch (error) {
    console.error("Error while approving the request :", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//refuser demande
exports.refusedemande = async (req, res) => {
  try {
    // Recherche du demande par ID
    const demande = await Demande.findById(req.params.demandeId);
    // Vérification si le demande existe
    if (!demande) {
      return res.status(404).json({ message: "Request not found" });
    }
    // Mise à jour du statut du demande
    demande.statut = "rejected";
    await demande.save();
    // Options de l'email
    const mailOptions = {
      from: "rihabchebil10@gmail.com",
      to: demande.email,
      subject: "Refus of your request",
      html: `
        <p>Hello,</p>
        <p>We regret to inform you that your request has been rejected. We encourage you to try again in the future.</p>
        <p>Thank you for your understanding.</p>
        <p>Best regards,</p>
        <p>The administrative team</p>
      `,
    };
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    res.json({ message: "Request rejected and email sent", demande });
  } catch (error) {
    console.error("Error while rejecting the request :", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.findAlldemandes = (req, res) => {
  Demande.find()
    .then((demandes) => {
      res.send(demandes);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our demandes",
      });
    });
};

exports.findOneuser = (req, res) => {
  Demande.findById(req.params.userId)
    .then((demande) => {
      if (!demande) {
        return res.status(404).send({
          message: "demande not found by id " + req.params.demandeId,
        });
      }
      res.send(demande);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the demande by id" + req.params.demandeId,
      });
    });
};


//delete
exports.deletedemande = (req, res) => {
  Demande.findByIdAndDelete(req.params.demandeId)
    .then((demande) => {
      if (!demande) {
        return res.status(404).send({
          message: "demande not fount with the id " + req.params.demandeId,
        });
      }
      res.send({ message: "demande deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the demande by id" + req.params.demandeId,
      });
    });
};

exports.downloadCV = async (req, res) => {
  try {
    const { demandeId } = req.params;
    const demande = await Demande.findById(demandeId);
    if (!demande || !demande.cv) {
      return res.status(404).json({ message: "CV non trouvé pour cette demande" });
    }

    // Chemin absolu vers le fichier CV
    const cvPath = path.join(__dirname, "../Public/CV", demande.cv);

    // Vérifier que le fichier existe
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ message: "file not found" });
    }

    // Définir les headers pour le téléchargement
    res.download(cvPath, demande.cv, (err) => {
      if (err) {
        console.error("error while downloading the cv:", err);
        res.status(500).json({ message: "error while downloading the cv" });
      }
    });
  } catch (error) {
    console.error("error while downloading the cv:", error);
    res.status(500).json({ message: "server error", error: error.message });
  }
};

