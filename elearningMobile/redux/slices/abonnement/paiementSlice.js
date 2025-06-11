import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    history: [],
    loading: false,
    error: null,
  };
  
const paiementSlice = createSlice({
  name: "paiement",
  initialState,

  reducers: {
  setPaiments: (state, action) => {
    state.history = action.payload;
  },
},
});
export const { setPaiments } = paiementSlice.actions;

export default paiementSlice.reducer;
