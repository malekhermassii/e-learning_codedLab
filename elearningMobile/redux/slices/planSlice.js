import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plans: [],
};

const planSlice = createSlice({
  name: 'plans',
  initialState,
  reducers: {
    addPlan: (state, action) => {
      const planExists = state.plans.some(plan => plan._id === action.payload._id);
      if (!planExists) state.plans.push(action.payload);
    },
    setPlan: (state, action) => {
      state.plans = action.payload;
    },
    updatePlan: (state, action) => {
      const index = state.plans.findIndex(plan => plan._id === action.payload._id);
      // index , -1 : python(9)
      if (index !== -1) state.plans[index] = action.payload;

    },
    deletePlan: (state, action) => {
      // filter('rihab')
      state.plans = state.plans.filter(plan => plan._id !== action.payload._id);
    },
  },
});

export const { addPlan, setPlan, updatePlan, deletePlan } = planSlice.actions;
export default planSlice.reducer;


