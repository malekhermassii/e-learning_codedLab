import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  apprenants: {},
};

const apprenantslice = createSlice({
  name: 'apprenants',
  initialState,
  reducers: {
    setApprenant: (state, action) => {
      const { id, data } = action.payload;
      state.apprenants[id] = data;
    },

    deleteApprenant: (state, action) => {
      // filter('rihab')
      state.apprenants = state.apprenants.filter(apprenant => apprenant._id !== action.payload._id);
    },
  }
});

export const { setApprenant,deleteApprenant} = apprenantslice.actions;
export default apprenantslice.reducer; 