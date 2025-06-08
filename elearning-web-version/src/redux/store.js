// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import categorieReducer from './slices/categorieSlice'
import planReducer from './slices/planSlice'
import professorReducer from './slices/professorSlice'
import questionReducer from './slices/questionSlice'
import avisReducer from './slices/avisSlice'
import demandeReducer from './slices/demandeSlice'
import quizReducer from './slices/quizSlice'
import abonnementReducer from "./slices/abonnement/abonnementSlice";
import paiementReducer from "./slices/abonnement/paiementSlice"
import progressReducer from "./slices/courseprogressSlice";
import adminReducer from "./slices/adminSlice";
import apprenantReducer from "./slices/apprenantSlice";
import usersReducer from "./slices/userSlice"
import profReducer from './slices/profSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    authadmin:adminReducer ,
    apprenants:apprenantReducer,
    categories: categorieReducer,
    plans : planReducer,
    progresss : progressReducer,
    professors: professorReducer,
    questions: questionReducer,
    aviss:avisReducer,
    demandes: demandeReducer,
    quizs: quizReducer,
    abonnement: abonnementReducer,
    paiement: paiementReducer,
    users: usersReducer,
    authprof:profReducer,

    
  },

});
export default store; // ✅ add this line