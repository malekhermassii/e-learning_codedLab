import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  subscriptions: [],
  sessionId: [],
};

const abonnementSlice = createSlice({
  name: "abonnement",
  initialState,

  reducers: {
    createCheckoutSession: (state, action) => {
      const sessionExists = state.sessionId.some(
        (course) => course._id === action.payload._id
      );
      if (!sessionExists) state.sessionId.push(action.payload);
    },

    fetchSubscriptions: (state, action) => {
      state.subscriptions = action.payload;
    },
  },
});
export const { createCheckoutSession, fetchSubscriptions } =
  abonnementSlice.actions;

export default abonnementSlice.reducer;
