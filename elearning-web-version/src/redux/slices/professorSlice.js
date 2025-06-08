import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  professors: [],
  loading: false,
  error: null
};

const professorSlice = createSlice({
  name: 'professors',
  initialState,
  reducers: {
    setProfessor: (state, action) => {
      const { id, data } = action.payload;
      state.professors[id] = data;
    },
    setProfesseurs: (state, action) => {
      state.professors = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addProfesseur: (state, action) => {
      const professeurExists = state.professors.some(professeur => professeur._id === action.payload._id);
      if (!professeurExists) state.professors.push(action.payload);
    },
    
    updateProfesseur: (state, action) => {
      const index = state.professors.findIndex(professeur => professeur._id === action.payload._id);
      // index , -1 : python(9)
      if (index !== -1) state.professors[index] = action.payload;

    },
    deleteProfesseur: (state, action) => {
      // filter('rihab')
      state.professors = state.professors.filter(professeur => professeur._id !== action.payload._id);
    },
  }
});

export const { setProfessor, setLoading, setError,addProfesseur,updateProfesseur,setProfesseurs, deleteProfesseur} = professorSlice.actions;
export default professorSlice.reducer; 