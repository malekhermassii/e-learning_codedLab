import { createSlice } from "@reduxjs/toolkit";

// Récupérer l'état initial depuis le localStorage
const getInitialState = () => {
  const profToken = localStorage.getItem("profToken");
  const currentprof = JSON.parse(localStorage.getItem("currentprof"));

  return {
    profToken: profToken || null,
    prof: currentprof || null,
    isAuthenticated: !!profToken,
    loading: false,
    error: null,
    profInfo: {
      name: currentprof?.name || null,
      email: currentprof?.email || null,
      image: currentprof?.image || null,
      telephone: currentprof?.telephone || null,
      dateNaissance: currentprof?.dateNaissance || null,
      specialite: currentprof?.specialite || null,
    },
  };
};

const profSlice = createSlice({
  name: "authprof",
  initialState: getInitialState(),
  reducers: {
    setprofToken(state, action) {
      console.log("✅ setprofToken action:", action.payload);
      state.profToken = action.payload.token;
      state.prof = action.payload.prof;
      state.isAuthenticated = true;
      state.profInfo = {
        name: action.payload.prof?.name || null,
        email: action.payload.prof?.email || null,
        image: action.payload.prof?.image || null,
        telephone: action.payload.prof?.telephone || null,
        dateNaissance: action.payload.prof?.dateNaissance || null,
        specialite: action.payload.prof?.specialite || null,
      };
    },
    clearprof(state) {
      state.profToken = null;
      state.prof = null;
      state.isAuthenticated = false;
      state.profInfo = {
        name: null,
        email: null,
        image: null,
        telephone: null,
        dateNaissance: null,
        specialite: null,
      };
    },
    updateProfil: (state, action) => {
      console.log("✅ updateProfil action:", action.payload);

      // Mettre à jour les informations du professeur
      if (state.prof && state.prof._id === action.payload._id) {
        // Mettre à jour le state
        state.loading = false;
        state.error = null;
        state.prof = { ...state.prof, ...action.payload };
        state.profInfo = {
          name: action.payload.name || state.profInfo.name,
          email: action.payload.email || state.profInfo.email,
          image: action.payload.image || state.profInfo.image,
          telephone: action.payload.telephone || state.profInfo.telephone,
          dateNaissance:
            action.payload.dateNaissance || state.profInfo.dateNaissance,
          specialite: action.payload.specialite || state.profInfo.specialite,
        };
      } else {
        state.error = "Erreur lors de la mise à jour du profil";
      }
    },
    updateProfilError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfilStart: (state) => {
      state.loading = true;
      state.error = null;
    },
  },
});

export const {
  setprofToken,
  clearprof,
  updateProfil,
  updateProfilError,
  updateProfilStart,
} = profSlice.actions;
export default profSlice.reducer;
