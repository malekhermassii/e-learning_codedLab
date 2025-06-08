import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  courses: [],
  coursesByInstructor: [],
  loading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    addCourse: (state, action) => {
      const courseExists = state.courses.some(course => course._id === action.payload._id);
      if (!courseExists) state.courses.push(action.payload);
      const courseByInstructorExists = state.coursesByInstructor.some(course => course._id === action.payload._id);
      if (!courseByInstructorExists) state.coursesByInstructor.push(action.payload);
    },
    setCourses: (state, action) => {
      state.courses = action.payload;
      state.coursesByInstructor = action.payload;
    },
    updateCourse: (state, action) => {
      const index = state.courses.findIndex(course => course._id === action.payload._id);
      // index , -1 : python(9)
      if (index !== -1) state.courses[index] = action.payload;
      const indexByInstructor = state.coursesByInstructor.findIndex(course => course._id === action.payload._id);
      if (indexByInstructor !== -1) state.coursesByInstructor[indexByInstructor] = action.payload;
    },
    deleteCourse: (state, action) => {
      console.log("Suppression du cours dans Redux avec l'ID:", action.payload);
      state.courses = state.courses.filter(course => {
        console.log("Comparaison:", course._id, action.payload);
        return course._id !== action.payload;
      });
      state.coursesByInstructor = state.coursesByInstructor.filter(course => course._id !== action.payload);
    },
    acceptercourse: (state, action) => {
      const index = state.courses.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.courses[index].status = 'acceptée';
      }
    },
    refusercourse: (state, action) => {
      const index = state.courses.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.courses[index].status = 'refusée';
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { addCourse, setCourses, updateCourse, deleteCourse, acceptercourse, refusercourse, setLoading, setError } = courseSlice.actions;
export default courseSlice.reducer;


// Post , Get , Put , delete 