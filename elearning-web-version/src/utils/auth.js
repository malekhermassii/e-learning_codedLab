/**
 * Check if a user is currently logged in
 * @returns {boolean} True if a user is logged in
 */
import { logoutUser } from '../api';
import axios from 'axios';


//Vérifier si un utilisateur est connecté
export const isAuthenticated = () => {
  const pathname = window.location.pathname;

  if (pathname.startsWith('/instructor')) {
    // Authentification prof
    const profToken = localStorage.getItem('profToken') || sessionStorage.getItem('profToken');
    const currentProf = localStorage.getItem('currentprof') || sessionStorage.getItem('currentprof');
    return !!(profToken && currentProf);
  } else if (pathname.startsWith('/admin')) {
    // Authentification admin
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const currentAdmin = localStorage.getItem('currentadmin') || sessionStorage.getItem('currentadmin');
    return !!(adminToken && currentAdmin);
  } else {
    
    // Authentification utilisateur classique
    const localUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log("localUser",localUser);
    console.log("token",token);
    return !!(localUser &&token);
  }
};

/**
 * Get the currently logged in user's data
 * @returns {Object|null} The current user object or null if not logged in
 */
//Récupère les données de l'utilisateur depuis localStorage ou sessionStorage.
export const getCurrentUser = () => {
  const pathname = window.location.pathname;

  if (pathname.startsWith('/instructor')) {
    // Si on est dans l'espace prof
    const currentProf = localStorage.getItem('currentprof') || sessionStorage.getItem('currentprof');
    return currentProf ? JSON.parse(currentProf) : null;
  } else if (pathname.startsWith('/admin')) {
    // Si on est dans l'espace admin
    const currentAdmin = localStorage.getItem('currentadmin') || sessionStorage.getItem('currentadmin');
    return currentAdmin ? JSON.parse(currentAdmin) : null;
  } else {
    // Espace utilisateur classique
    const localUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return localUser ? JSON.parse(localUser) : null;
  }
};



// Dans votre composant
export const logout = async (role) => {
  try {
    await logoutUser();
    // Nettoyer le stockage local
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userToken");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("image");
    localStorage.removeItem("image");
    localStorage.removeItem('notifications');
    localStorage.removeItem('hasNewNotification');

    
    // Supprimer le token des headers axios
    delete axios.defaults.headers.common["Authorization"];
    // Rediriger vers la page de connexion appropriée
    
      window.location.href = '/login';
    
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    // Même en cas d'erreur, on nettoie le stockage et on redirige
    // localStorage.removeItem("currentUser");
    // localStorage.removeItem("userToken");
    // sessionStorage.removeItem("currentUser");
    // sessionStorage.removeItem("userToken");
    // sessionStorage.removeItem("token");
    // localStorage.removeItem("token");
    // localStorage.removeItem("image");
    // delete axios.defaults.headers.common["Authorization"];
    // window.location.href = '/login';
  }
};



/**Ajouter un abonnement à un utilisateur
 * Add a subscription to user profile
 * @param {Object} subscriptionData - The subscription data to save
 */

export const addSubscription = (subscriptionData) => {
  const user = getCurrentUser();
  
  if (!user) return false;
  
  // Add subscription info to user data
  const updatedUser = {
    ...user,
    subscription: {
      ...subscriptionData,
      startDate: new Date().toISOString(),
      isActive: true
    }
  };
  
  // Save updated user data
  if (localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  } else {
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }
  
  return true;
};

/**
 * Check if user has an active subscription
 * @returns {boolean} True if user has an active subscription
 */
export const hasActiveSubscription = () => {
  const user = getCurrentUser();
  return !!(user && user.subscription && user.subscription.isActive);
};

/**
 * Récupère la liste des cours auxquels l'utilisateur est inscrit.
 * @returns {Array} Array of enrolled course IDs
 */
export const getEnrolledCourses = () => {
  const user = getCurrentUser();
  return (user && user.enrolledCourses) || [];
};

/**
 * inscrit user in a course
 * @param {string} courseId - The course ID to enroll in
 * @returns {boolean} True if enrollment was successful
 */
export const enrollInCourse = (courseId) => {
  const user = getCurrentUser();
  
  if (!user) return false;
  
  // Initialize enrolledCourses array if it doesn't exist
  const enrolledCourses = user.enrolledCourses || [];
  
  // verifier user 3ml inscrit 3l cours ou non
  if (enrolledCourses.includes(courseId)) return true;
  
  // Add course to enrolled courses
  const updatedUser = {
    ...user,
    enrolledCourses: [...enrolledCourses, courseId],
    enrollmentDates: {
      ...(user.enrollmentDates || {}),
      [courseId]: new Date().toISOString()
    }
  };
  
  // Save updated user data
  if (localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  } else {
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }
  
  return true;
};

/**
 * Update user profile information
 * @param {Object} updatedData - User profile data to update (fullName, email, password)
 * @returns {boolean} True if update was successful
 */
export const updateUserProfile = (updatedData) => {
  const user = getCurrentUser();
  
  if (!user) return false;
  
  // Create updated user object
  const updatedUser = {
    ...user,
    ...updatedData,
    // Add a lastUpdated timestamp
    lastUpdated: new Date().toISOString()
  };
  
  // Save updated user data
  if (localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  } else {
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }
  
  return true;
}; 

export const hasActiveSubscriptionServer = async () => {
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const response = await fetch("https://backendlms-5992.onrender.com/abonnement/status", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();
    console.log("data abonnement",data)
    // On considère actif si statut === "actif"
    if (data.statut === "actif") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'abonnement serveur:', error);
    return false;
  }
}; 