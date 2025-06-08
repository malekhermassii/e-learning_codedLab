import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userToken: null,
  user: null,
  isAuthenticated: false,
  userInfo: {
    name: null,
    email: null,
    telephone: null,
    dateNaissance: null,
    image: null,
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserToken(state, action) {
      console.log('✅ USER FROM PAYLOAD:', action.payload.user);
      state.userToken = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.userInfo = {
        name: action.payload.user?.name || null,
        email: action.payload.user?.email || null,
        telephone: action.payload.user?.telephone || null,
        dateNaissance: action.payload.user?.dateNaissance || null,
        image: action.payload.user?.image || null,
      };
      
    },
    clearUser(state) {
      state.userToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.userInfo = {
        name: null,
        email: null
      };
    },


    updateProfil: (state, action) => {
      if (state.user && state.user._id === action.payload._id) {
        state.user = { ...state.user, ...action.payload };
        state.userInfo = {
          name: action.payload.name || state.userInfo.name,
          email: action.payload.email || state.userInfo.email,
          telephone: action.payload.telephone || state.userInfo.telephone,
          dateNaissance: action.payload.dateNaissance || state.userInfo.dateNaissance,
          image: action.payload.image || state.userInfo.image,
        };
      }
    }
    
  },
});

export const { setUserToken, clearUser , updateProfil} = authSlice.actions;
export default authSlice.reducer;
