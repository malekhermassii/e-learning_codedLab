import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Vérifie si un utilisateur est connecté
 * @returns {Promise<boolean>} True si un utilisateur est connecté
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const user = await AsyncStorage.getItem('user');
    return !!(token && user);
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Récupère les données de l'utilisateur connecté
 * @returns {Promise<Object|null>} Les données de l'utilisateur ou null
 */
export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

/**
 * Ajoute un abonnement à l'utilisateur
 * @param {Object} subscriptionData - Les données de l'abonnement
 * @returns {Promise<boolean>} True si l'ajout a réussi
 */
export const addSubscription = async (subscriptionData) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Ajouter les informations d'abonnement
    const updatedUser = {
      ...user,
      subscription: {
        ...subscriptionData,
        startDate: new Date().toISOString(),
        isActive: true
      }
    };

    // Sauvegarder les données mises à jour
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'abonnement:', error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur a un abonnement actif
 * @returns {Promise<boolean>} True si l'utilisateur a un abonnement actif
 */
export const hasActiveSubscription = async () => {
  try {
    const user = await getCurrentUser();
    return !!(user && user.subscription && user.subscription.isActive);
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'abonnement:', error);
    return false;
  }
};

/**
 * Récupère la liste des cours auxquels l'utilisateur est inscrit
 * @returns {Promise<Array>} Liste des IDs des cours
 */
export const getEnrolledCourses = async () => {
  try {
    const user = await getCurrentUser();
    return (user && user.enrolledCourses) || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des cours inscrits:', error);
    return [];
  }
};

/**
 * Inscrit l'utilisateur à un cours
 * @param {string} courseId - L'ID du cours
 * @returns {Promise<boolean>} True si l'inscription a réussi
 */
export const enrollInCourse = async (courseId) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Initialiser le tableau des cours si nécessaire
    const enrolledCourses = user.enrolledCourses || [];

    // Vérifier si l'utilisateur est déjà inscrit
    if (enrolledCourses.includes(courseId)) return true;

    // Ajouter le cours aux cours inscrits
    const updatedUser = {
      ...user,
      enrolledCourses: [...enrolledCourses, courseId],
      enrollmentDates: {
        ...(user.enrollmentDates || {}),
        [courseId]: new Date().toISOString()
      }
    };

    // Sauvegarder les données mises à jour
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'inscription au cours:', error);
    return false;
  }
};

/**
 * Met à jour le profil utilisateur
 * @param {Object} updatedData - Données du profil à mettre à jour
 * @returns {Promise<boolean>} True si la mise à jour a réussi
 */
export const updateUserProfile = async (updatedData) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Créer l'objet utilisateur mis à jour
    const updatedUser = {
      ...user,
      ...updatedData,
      lastUpdated: new Date().toISOString()
    };

    // Sauvegarder les données mises à jour
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return false;
  }
};

/**
 * Vérifie auprès du backend si l'utilisateur a un abonnement actif
 * @returns {Promise<boolean>} True si l'abonnement est actif
 */
export const hasActiveSubscriptionServer = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch("http://192.168.70.148:4000/abonnement/status", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();
    // On considère actif si statut === "actif"
    return response.ok && data.statut === "actif";
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'abonnement serveur:', error);
    return false;
  }
}; 