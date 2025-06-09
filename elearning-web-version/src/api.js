import React from "react";
import axios from "axios";
import { setCourses } from "./redux/slices/courseSlice";
import { setCategories } from "./redux/slices/categorieSlice";
import { setPlan } from "./redux/slices/planSlice";
import {setQuizs} from "./redux/slices/quizSlice"
import {
  setProfesseurs,
  setLoading,
  setError,
} from "./redux/slices/professorSlice";
import { setApprenants } from "./redux/slices/apprenantSlice";
import { setDemandes } from "./redux/slices/demandeSlice";
import { fetchSubscriptions } from "./redux/slices/abonnement/abonnementSlice";
import { setPaiments } from "./redux/slices/abonnement/paiementSlice";
import { setAviss } from "./redux/slices/avisSlice";
import { setQuestions } from "./redux/slices/questionSlice";

import { Form } from "react-router-dom";
import { setusers } from "./redux/slices/userSlice";

const API_URL = "https://backendlms-5992.onrender.com";

// Configuration de l'instance axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Export de l'instance API pour utilisation directe dans les composants
export default api;

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("profToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Categories API
export const fetchCategories = () => async (dispatch) => {
  try {
    const response = await api.get("/categorie",{withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch categories");
    dispatch(setCategories(response.data));
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Dispatch une action d'erreur si nécessaire
  }
};
export const fetchReview = () => async (dispatch) => {
  try {
    const response = await api.get("/feedback",{withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch feddback");
    dispatch(setAviss(response.data));
  } catch (error) {
    console.error("Error fetching feedback:", error);
  }
};

export const fetchProfessors = async () => {
  try {
    const response = await axios.get(`${API_URL}/professeur`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des professeurs:', error);
    throw error;
  }
};
export const fetchQuestion = () => async (dispatch) => {
  try {
    const response = await api.get("/question",{withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch question");
    dispatch(setQuestions(response.data));
  } catch (error) {
    console.error("Error fetching question:", error);
  }
};

export const fetchUsers = () => async (dispatch) => {
  try {
    const response = await api.get("/users",{withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch user");
    dispatch(setusers(response.data));
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};
export const fetchCourses = () => async (dispatch) => {
  try {
    
    const response = await api.get("/course", {withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch courses");
    dispatch(setCourses(response.data));
  } catch (error) {
    console.error("Error fetching courses:", error);
    // Maybe dispatch an error action here, like dispatch(setCoursesError(error.message));
  }
};
export const fetchabonnements = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    const response = await api.get("/admin/subscriptions",{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status !== 200) throw new Error("Failed to fetch courses");
    dispatch(fetchSubscriptions(response.data));
  } catch (error) {
    console.error("Error fetching courses:", error);
    // Maybe dispatch an error action here, like dispatch(setCoursesError(error.message));
  }
};
export const fetchpayement = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    const response = await api.get("/admin/payments",{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("response",response.data);
    if (response.status !== 200) throw new Error("Failed to fetch payments");
    dispatch(setPaiments(response.data));
  } catch (error) {
    console.error("Error fetching payments:", error);
  }
};

export const fetchQuiz = () => async (dispatch) => {
  try {
    const response = await api.get("/quiz",{withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch quiz");
    dispatch(setQuizs(response.data));
  } catch (error) {
    console.error("Error fetching quiz:", error);
  }
};

export const fetchprofesseur = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const token = localStorage.getItem("adminToken");
    const response = await api.get("/professeur", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
    });
    if (response.status !== 200) throw new Error("Failed to fetch prof");

    dispatch(setProfesseurs(response.data));
    dispatch(setError(null));
  } catch (error) {
    console.error("Error fetching prof:", error);
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};
export const fetchdemandes = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    const response = await api.get("/demandes",{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status !== 200) throw new Error("Failed to fetch demande");

    dispatch(setDemandes(response.data));
    console.log("demandes reçus :", response.data);
  } catch (error) {
    console.error("Error fetching demandes:", error);
    // Maybe dispatch an error action here, like dispatch(setCoursesError(error.message));
  }
};

export const fetchapprenants = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    const response = await api.get("/apprenant",{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status !== 200) throw new Error("Failed to fetch apprenants");

    dispatch(setApprenants(response.data));
    console.log("aprrenant reçus :", response.data);
  } catch (error) {
    console.error("Error fetching aprrenant:", error);
    // Maybe dispatch an error action here, like dispatch(setCoursesError(error.message));
  }
};

export const getquizById = async (quizId) => {
  try {
    console.log("Fetching quiz with ID:", quizId);
    const response = await api.get(`/quiz/${quizId}`,{withCredentials: false});
    console.log("quiz data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("error fetching quiz by id", error);
    throw (
      error.response?.data || {
          message: "error fetching quiz by id",
        }
    );
  }
};

export const getCourseById = async (courseId) => {
  try {
    console.log("Fetching course with ID:", courseId);
    const response = await api.get(`/course/${courseId}`,{withCredentials: false});
    console.log("Course data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du cours:", error);
    throw (
      error.response?.data || {
        message: "Erreur lors de la récupération du cours",
      }
    );
  }
};

export const createCourse = async (courseData) => {
  try {
    const response = await api.post("/course", courseData);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Erreur lors de la création du cours" }
    );
  }
};

export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await api.put(`/course/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Erreur lors de la mise à jour du cours",
      }
    );
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/course/${courseId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Erreur lors de la suppression du cours",
      }
    );
  }
};

// Fonctions pour les inscriptions aux cours
export const enrollInCourse = async (courseId) => {
  try {
    const response = await api.post(`/enroll/${courseId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Erreur lors de l'inscription au cours",
      }
    );
  }
};

// Fonctions pour la progression des cours
export const updateCourseProgress = async (courseId, moduleId, videoId) => {
  try {
    const response = await api.put(
      `/progress/update/${courseId}/${moduleId}/${videoId}`
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Erreur lors de la mise à jour de la progression",
      }
    );
  }
};

export const getCourseProgress = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/courseprogress`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      throw new Error("Format de données invalide");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la progression:", error);
    throw error;
  }
};

export const fetchplan = () => async (dispatch) => {
  try {

    const response = await api.get("/planabonnement", {withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch plan");
    dispatch(setPlan(response.data));
  } catch (error) {
    console.error("Error fetching plan:", error);
  }
};

//get one prof
export const fetchProfessor = (professeurId) => async (dispatch) => {
  try {
    console.log("Fetching course with ID:", professeurId);
    const response = await api.get(`/professeur/${professeurId}`,{withCredentials: false});
    console.log("Course data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du cours:", error);
    throw (
      error.response?.data || {
        message: "Erreur lors de la récupération du cours",
      }
    );
  }
};
export const logoutUser = async () => {
  try {
    const response = await api.post("/logout");

    // Supprimer les données de l'utilisateur du stockage local
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    localStorage.removeItem("userToken");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("token");

    // Supprimer le token de l'instance axios
    delete api.defaults.headers.common["Authorization"];

    return response.data;
  } catch (error) {
    // En cas d'erreur, on nettoie quand même le stockage local
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    localStorage.removeItem("userToken");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];

    throw new Error(error.response?.data?.message || "Échec de la déconnexion");
  }
};

export const logoutProf = async () => {
  try {
    const token = localStorage.getItem("profToken");
    if (!token) {
      // Si pas de token, on nettoie quand même le stockage local
      localStorage.removeItem("currentprof");
      localStorage.removeItem("profToken");
      sessionStorage.removeItem("currentprof");
      sessionStorage.removeItem("profToken"); 
      return;
    }

    const response = await api.post("/logoutprof", {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    localStorage.removeItem("currentprof");
    localStorage.removeItem("profToken");
    sessionStorage.removeItem("currentprof");
    sessionStorage.removeItem("profToken");

    window.location.href = '/loginprof';

    
    return response.data;
  } catch (error) {
    // En cas d'erreur, on nettoie quand même le stockage local
    
    console.error("Erreur de déconnexion:", error);
    return;
  }
};
export const logoutAdmin = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      // Si pas de token, on nettoie quand même le stockage local
      cleanupStorage();
      return;
    }

    const response = await api.post("/adminlogout", {}, {
      withCredentials: false,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    window.location.href = '/loginadmin';
    cleanupStorage();
    return response.data;
  } catch (error) {
    // En cas d'erreur, on nettoie quand même le stockage local
    cleanupStorage();
    console.error("Erreur de déconnexion:", error);
    return;
  }
};
// Fonction utilitaire pour nettoyer le stockage
const cleanupStorage = () => {
  localStorage.removeItem("currentadmin");
  localStorage.removeItem("adminToken");
  
  sessionStorage.removeItem("currentadmin");
  sessionStorage.removeItem("adminToken");

  delete api.defaults.headers.common["Authorization"];
};


export const fetchAllProgress = async () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch("https://backendlms-5992.onrender.com/progression/all", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des progressions');
    }
    const data = await response.json();

    // Séparation completed / ongoing
    const completed = [];
    const ongoing = [];
    console.log("data",data);
    data.forEach((progression) => {
      if (progression.complet) {
        completed.push(progression);
      } else {
        ongoing.push(progression);
      }
    });

    return { completed, ongoing };
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les progressions:', error);
    return { completed: [], ongoing: [] };
  }
};

export const getQuizById = async (quizId) => {
  try {
    console.log("Fetching quiz with ID:", quizId);
    const response = await api.get(`/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du quiz:", error);  
  }
};


export const getQuizByInstructor = async (professeurId) => {
  const token = localStorage.getItem("profToken") || sessionStorage.getItem("profToken");
  try {
    const response = await axios.get(`https://backendlms-5992.onrender.com/quizByInstructor/${professeurId}`,{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error) { 
    console.error("Erreur lors de la récupération du quiz:", error);
  }
};

export const getCourseByInstructor = async (professeurId) => {
  try {
    const response = await api.get(`/course/instructor/${professeurId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du cours:", error);
  }
};
  export const downloadCV = async (demandeId) => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken"); 
      const response = await api.get(`/demandes/${demandeId}/download-cv`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors du téléchargement du CV:", error);
    }
  };

 export const isApprenant = async (userId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
     
      const response = await axios.get(`https://backendlms-5992.onrender.com/apprenant/by-user/${userId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
          
        },
      });
      if (response.status !== 200) throw new Error("Failed to fetch apprenant");
      return true;
    } catch (error) {
     // console.error("Erreur lors de la vérification de l'apprenant:", error);
      return false;
    }
  };
