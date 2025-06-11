import axios from "axios";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setCourses } from "./redux/slices/courseSlice";
import { setCategories } from "./redux/slices/categorieSlice";
import { setPlan } from "./redux/slices/planSlice";
import {
  setProfessor,
  setError,
  setLoading,
} from "./redux/slices/professorSlice";
import { updateProfil } from "./redux/slices/authSlice";
import { setProgress } from "./redux/slices/courseprogressSlice";
import { useDispatch } from "react-redux";

const API_URL = "http://192.168.70.148:4000";

// Configuration de l'instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
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
    const response = await api.get("/categorie");
    if (response.status !== 200) throw new Error("Failed to fetch categories");
    dispatch(setCategories(response.data));
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Dispatch une action d'erreur si nécessaire
  }
};

export const fetchCourses = () => async (dispatch) => {
  try {
    const response = await api.get("/course",{withCredentials: false});
    if (response.status !== 200) throw new Error("Failed to fetch courses");
    dispatch(setCourses(response.data));
  } catch (error) {
    console.error("Error fetching courses:", error);
    // Maybe dispatch an error action here, like dispatch(setCoursesError(error.message));
  }
};
export const fetchQuiz = () => async (dispatch) => {
  try {
    const response = await api.get("/quiz");
    if (response.status !== 200) throw new Error("Failed to fetch quiz");
    dispatch(setCourses(response.data));
  } catch (error) {
    console.error("Error fetching quiz:", error);
  }
};

export const getquizById = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du quiz:", error);
    throw (
      error.response?.data || {
        message: "Erreur lors de la récupération du quiz",
      }
    );
  }
};

export const getCourseById = async (courseId) => {
  try {
    // console.log("Fetching course with ID:", courseId);
    const response = await api.get(`/course/${courseId}`);
    // console.log("Course data received:", response.data);
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
    const response = await api.get("/planabonnement");
    if (response.status !== 200) throw new Error("Failed to fetch plan");
    dispatch(setPlan(response.data));
  } catch (error) {
    console.error("Error fetching plan:", error);
  }
};

//get one prof
export const fetchProfessor = (professeurId) => async (dispatch) => {
  try {
    
    const response = await api.get(`/professeur/${professeurId}`);

    return response.data;
  } catch (error) {
    console.error("Error fetching professor:", error);
    throw (
      error.response?.data || {
        message: "Error fetching professor",
      }
    );
  }
};

export const fetchAllProgress = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch("http://192.168.70.148:4000/progression/all", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      throw new Error('Error fetching all progress');
    }
    const data = await response.json();

    // Séparation completed / ongoing
    const completed = [];
    const ongoing = [];
    data.forEach((progression) => {
      if (progression.complet) {
        completed.push(progression);
      } else {
        ongoing.push(progression);
      }
    });

    return { completed, ongoing };
  } catch (error) {
    console.error('Error fetching all progress:', error);
    return { completed: [], ongoing: [] };
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


export const isApprenant = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await api.get(`/apprenant/by-user/${userId}`,{
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

