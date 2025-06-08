import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  apprenants: [],
};

const apprenantslice = createSlice({
  name: 'apprenants',
  initialState,
  reducers: {
    setApprenant: (state, action) => {
      const { id, data } = action.payload;
      state.apprenants[id] = data;
    },
    setApprenants: (state, action) => {
      state.apprenants = action.payload;
    },
    deleteApprenant: (state, action) => {
      const idToDelete = action.payload;
      state.apprenants = state.apprenants.filter(apprenant => apprenant._id !== idToDelete);
    },
  }
});

export const { setApprenant, deleteApprenant, setApprenants } = apprenantslice.actions;
export default apprenantslice.reducer; 