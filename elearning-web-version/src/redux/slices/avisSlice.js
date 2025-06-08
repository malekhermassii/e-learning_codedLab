import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  aviss: [],
};

const avissSlice = createSlice({
  name: 'aviss',
  initialState,
  reducers: {
    addAvis: (state, action) => {
      const avisExists = state.aviss.some(q => q._id === action.payload._id);
      if (!avisExists) state.aviss.push(action.payload);
    },
    setAviss: (state, action) => {
      state.aviss = action.payload;
    },
   
  },
});

export const { addAvis, setAviss } = avissSlice.actions;
export default avissSlice.reducer;
