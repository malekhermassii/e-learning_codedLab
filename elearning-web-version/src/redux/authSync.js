import { store } from './store';
import { setprofToken, clearprof } from './slices/profSlice';

/**
 * Synchronise les données d'authentification entre le localStorage/sessionStorage et Redux
 * @param {Function} [dispatch] - Le dispatch Redux (optionnel, utilisera store.dispatch si non fourni)
 * @returns {boolean} - true si la synchronisation a été effectuée avec succès
 */
export const syncProfAuthData = (dispatch = null) => {
  try {
    // Utiliser le dispatch fourni ou celui du store
    const dispatchAction = dispatch || store.dispatch;
    
    // Récupérer les données du localStorage ou sessionStorage
    const token = localStorage.getItem('profToken') || sessionStorage.getItem('profToken');
    const profDataStr = localStorage.getItem('currentprof') || sessionStorage.getItem('currentprof');
    
    if (!token || !profDataStr) {
      console.log('Aucune donnée d\'authentification à synchroniser');
      return false;
    }
    
    // Parser les données du professeur
    const prof = JSON.parse(profDataStr);
    
    if (!prof || !prof._id) {
      console.log('Données de professeur invalides');
      return false;
    }
    
    // Dispatch l'action pour mettre à jour Redux
    dispatchAction(setprofToken({ token, prof }));
    console.log('✅ Données d\'authentification synchronisées avec Redux');
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des données d\'authentification:', error);
    return false;
  }
};

/**
 * Vérifie si un professeur est authentifié en contrôlant le localStorage et sessionStorage
 * @returns {boolean} True si authentifié, sinon False
 */
export const isProfAuthenticated = () => {
  const profToken = localStorage.getItem("profToken") || sessionStorage.getItem("profToken");
  const currentprof = localStorage.getItem("currentprof") || sessionStorage.getItem("currentprof");
  
  return !!(profToken && currentprof);
};

/**
 * Réinitialise complètement l'état d'authentification (localStorage, sessionStorage et Redux)
 * @param {Function} dispatch - Le dispatch Redux (optionnel si utilisé en dehors d'un composant connecté)
 */
export const resetProfAuth = (dispatch = null) => {
  // Nettoyer le stockage local
  localStorage.removeItem("profToken");
  localStorage.removeItem("currentprof");
  sessionStorage.removeItem("profToken");
  sessionStorage.removeItem("currentprof");
  
  // Nettoyer le state Redux si dispatch est fourni
  if (dispatch) {
    dispatch(clearprof());
  }
}; 