import { createSlice } from '@reduxjs/toolkit';

// Récupérer l'état initial depuis le localStorage
const getInitialState = () => {
  const adminToken = localStorage.getItem('adminToken');
  const currentAdmin = JSON.parse(localStorage.getItem('currentadmin'));
  
  return {
    adminToken: adminToken || null,
    admin: currentAdmin || null,
    isAuthenticated: !!adminToken,
    loading: false,
    error: null,
    adminInfo: {
      name: currentAdmin?.name || null,
      email: currentAdmin?.email || null,
      image: currentAdmin?.image || null,
    }
  };
};

const adminSlice = createSlice({
  name: 'authadmin',
  initialState: getInitialState(),
  reducers: {
    setAdminToken(state, action) {
      console.log('✅ setAdminToken action:', action.payload);
      state.adminToken = action.payload.token;
      state.admin = action.payload.admin;
      state.isAuthenticated = true;
      state.adminInfo = {
        name: action.payload.admin?.name || null,
        email: action.payload.admin?.email || null,
        image: action.payload.admin?.image || null,
      };
    },
    clearadmin(state) {
      state.adminToken = null;
      state.admin = null;
      state.isAuthenticated = false;
      state.adminInfo = {
        name: null,
        email: null,
        image: null,
      };
    },
    updateProfil: (state, action) => {
      console.log('✅ updateProfil action:', action.payload);
      
      if (state.admin && state.admin._id === action.payload._id) {
        state.error = null;
        state.admin = { ...state.admin, ...action.payload };
        state.adminInfo = {
          name: action.payload.name || state.adminInfo.name,
          email: action.payload.email || state.adminInfo.email,
          image: action.payload.image || state.adminInfo.image,
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
    }
  },
});

export const { setAdminToken, clearadmin, updateProfil, updateProfilError, updateProfilStart } = adminSlice.actions;
export default adminSlice.reducer;
