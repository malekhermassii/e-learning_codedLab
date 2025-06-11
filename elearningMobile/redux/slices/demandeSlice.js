import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  demandes: [],
};

const demandesSlice = createSlice({
  name: 'demandes',
  initialState,
  reducers: {
    addDemande: (state, action) => {
      const demandeExists = state.demandes.some(demande => demande._id === action.payload._id);
      if (!demandeExists) { state.demandes.push({ ...action.payload, status: 'en attente' })};
    },
    setDemandes: (state, action) => {
      state.demandes = action.payload;
    },
  
    deleteDemande: (state, action) => {
      // filter('rihab')
      state.demandes = state.demandes.filter(demande => demande._id !== action.payload._id);
    },
    accepterDemande: (state, action) => {
        const index = state.demandes.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.demandes[index].status = 'acceptée';
        }
      },
      refuserDemande: (state, action) => {
        const index = state.demandes.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.demandes[index].status = 'refusée';
        }
      },
  },
});

export const { addDemande, setDemandes,accepterDemande, refuserDemande, deleteDemande } = demandesSlice.actions;
export default demandesSlice.reducer;


