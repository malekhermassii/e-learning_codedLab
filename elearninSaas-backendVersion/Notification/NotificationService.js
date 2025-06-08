//Service pour envoyer des notifications

const { Expo } = require('expo-server-sdk');

// Créer une nouvelle instance d'Expo
const expo = new Expo();

// Fonction pour envoyer une notification
async function sendPushNotification(pushToken, title, message, data = {}) {
  try {
    // Vérifier si le token est valide
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Token invalide: ${pushToken}`);
      return { success: false, error: 'Token invalide' };
    }

    // Construire le message
    const notification = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: message,
      data: data,
      priority: 'high'
    };

    // Envoyer le message
    const chunks = expo.chunkPushNotifications([notification]);
    const tickets = [];

    // Envoyer les chunks de messages
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true, tickets };
  } catch (error) {
    console.error('Erreur dans sendPushNotification:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour envoyer une notification à plusieurs utilisateurs
async function sendPushNotificationToMultipleUsers(tokens, title, message, data = {}) {
  try {
    // Filtrer les tokens invalides
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
    
    if (validTokens.length === 0) {
      return { success: false, error: 'Aucun token valide' };
    }

    // Créer les messages pour chaque token
    const messages = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: message,
      data: data,
      priority: 'high'
    }));

    // Envoyer les messages
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true, tickets };
  } catch (error) {
    console.error('Erreur dans sendPushNotificationToMultipleUsers:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendPushNotificationToMultipleUsers
};
