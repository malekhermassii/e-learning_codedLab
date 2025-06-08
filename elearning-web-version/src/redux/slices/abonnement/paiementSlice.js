import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    paiements: [],
    loading: false,
    error: null,
  };
  
const paiementSlice = createSlice({
  name: "paiement",
  initialState,

  reducers: {
  setPaiments: (state, action) => {
    state.paiements = action.payload;
  },
},
});
export const { setPaiments } = paiementSlice.actions;

export default paiementSlice.reducer;
