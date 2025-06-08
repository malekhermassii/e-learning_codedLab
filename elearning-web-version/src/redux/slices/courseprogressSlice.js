import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  progresss: [],
};

const progresssSlice = createSlice({
  name: 'progresss',
  initialState,
  reducers: {
    updateProgress: (state, action) => {
        const index = state.progresss.findIndex(progress => progress._id === action.payload._id);
        // index , -1 : python(9)
        if (index !== -1) state.progresss[index] = action.payload;
  
      },
    setProgress: (state, action) => {
      state.progresss = action.payload;
    },
   
  },
});

export const { updateProgress, setProgress } = progresssSlice.actions;
export default progresssSlice.reducer;
