import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  questions: [],
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    addQuestion: (state, action) => {
      const questionExists = state.questions.some(q => q._id === action.payload._id);
      if (!questionExists) state.questions.push(action.payload);
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    repondreQuestion: (state, action) => {
      const { _id, reponse } = action.payload;
      const questionIndex = state.questions.findIndex(q => q._id === _id);
      if (questionIndex !== -1) {
        state.questions[questionIndex].reponse = reponse;
      }
    },
  },
});

export const { addQuestion, setQuestions, repondreQuestion } = questionsSlice.actions;
export default questionsSlice.reducer;
