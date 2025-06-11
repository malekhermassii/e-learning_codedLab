import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  quizs: [],
  message: null,
  score: null,
  certificats: null,
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
    },
    setQuizs: (state, action) => {
      state.quizs = action.payload;
    },
    updateQuiz: (state, action) => {
      const index = state.quizs.findIndex(
        (quiz) => quiz._id === action.payload._id
      );
      // index , -1 : python(9)
      if (index !== -1) state.quizs[index] = action.payload;
    },
    deleteQuiz: (state, action) => {
      state.quizs = state.quizs.filter(
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
