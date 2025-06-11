import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  courses: [],
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    addCourse: (state, action) => {
      const courseExists = state.courses.some(course => course._id === action.payload._id);
      if (!courseExists) state.courses.push(action.payload);
    },
    setCourses: (state, action) => {
      
      state.courses = action.payload;
    },
    updateCourse: (state, action) => {
      const index = state.courses.findIndex(course => course._id === action.payload._id);
      // index , -1 : python(9)
      if (index !== -1) state.courses[index] = action.payload;

    },
    deleteCourse: (state, action) => {
      // filter('rihab')
      state.courses = state.courses.filter(course => course._id !== action.payload._id);
    },
  },
});

export const { addCourse, setCourses, updateCourse, deleteCourse } = coursesSlice.actions;
export default coursesSlice.reducer;


// Post , Get , Put , delete 