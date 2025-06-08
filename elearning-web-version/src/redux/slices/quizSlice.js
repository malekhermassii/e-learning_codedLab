import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  quizs: [],
  message: null,
  score: null,
  certificats: null,
  quizByInstructor: [],
};

const quizsSlice = createSlice({
  name: "quizs",
  initialState,
  reducers: {
    addQuiz: (state, action) => {
      const quizExists = state.quizs.some(
        (quiz) => quiz._id === action.payload._id
      );    
      if (!quizExists) state.quizs.push(action.payload);
      const quizByInstructorExists = state.quizByInstructor.some(
        (quiz) => quiz._id === action.payload._id
      );
      if (!quizByInstructorExists) state.quizByInstructor.push(action.payload);
    },
    setQuizs: (state, action) => {
      state.quizs = action.payload;
      state.quizByInstructor = action.payload;
    },
    updateQuiz: (state, action) => {
      const index = state.quizs.findIndex(
        (quiz) => quiz._id === action.payload._id
      );
      // index , -1 : python(9)
      if (index !== -1) state.quizs[index] = action.payload;
      const indexByInstructor = state.quizByInstructor.findIndex(
        (quiz) => quiz._id === action.payload._id
      );
      if (indexByInstructor !== -1) state.quizByInstructor[indexByInstructor] = action.payload;
    },
    deleteQuiz: (state, action) => {
      state.quizs = state.quizs.filter(
        (quiz) => quiz._id !== action.payload._id
      );
      state.quizByInstructor = state.quizByInstructor.filter(
        (quiz) => quiz._id !== action.payload._id
      );
    },

    passerQuiz: (state, action) => {
      state.message = action.payload.message;
      state.score = action.payload.score;
      state.certificats = action.payload.certificat || null;
    },
    setCertificat: (state, action) => {
      state.certificats = action.payload;
    },
  },
});

export const {
  addQuiz,
  setQuizs,
  updateQuiz,
  deleteQuiz,
  passerQuiz,
  setCertificat,
} = quizsSlice.actions;
export default quizsSlice.reducer;
