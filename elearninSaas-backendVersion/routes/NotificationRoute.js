const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialiser Firebase Admin
const serviceAccount = require('../blabla-a4d5c-firebase-adminsdk-kq1lm-1c2d8d529f.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Stocker les tokens FCM (dans un vrai projet, utilisez une base de données)
const deviceTokens = new Map();

// Enregistrer un nouveau token d'appareil
router.post('/register-device', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({ error: 'Token et userId sont requis' });
    }

    // Stocker le token avec l'ID utilisateur
    deviceTokens.set(userId, token);
    
    res.status(200).json({ message: 'Token enregistré avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du token:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer une notification à un utilisateur spécifique
router.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    const token = deviceTokens.get(userId);
    if (!token) {
      return res.status(404).json({ error: 'Token non trouvé pour cet utilisateur' });
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({ message: 'Notification envoyée avec succès', response });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer une notification à tous les utilisateurs
router.post('/send-notification-all', async (req, res) => {
  try {
    const { title, body, data } = req.body;
    
    const tokens = Array.from(deviceTokens.values());
    if (tokens.length === 0) {
      return res.status(404).json({ error: 'Aucun token trouvé' });
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    res.status(200).json({ message: 'Notifications envoyées avec succès', response });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 