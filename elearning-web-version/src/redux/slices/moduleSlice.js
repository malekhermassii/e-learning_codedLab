import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modules: {},
  loading: false,
  error: null
};

const moduleSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    setModules: (state, action) => {
      const { courseId, modules } = action.payload;
      state.modules[courseId] = modules;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setModules, setLoading, setError } = moduleSlice.actions;
export default moduleSlice.reducer; 