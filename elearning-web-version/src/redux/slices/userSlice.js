import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addCategorie: (state, action) => {
      const categorieExists = state.users.some(
        (categorie) => categorie._id === action.payload._id
      );
      if (!categorieExists) state.users.push(action.payload);
    },
    setusers: (state, action) => {
      state.users = action.payload;
    },
    updateUsers: (state, action) => {
      const index = state.users.findIndex(
        (categorie) => categorie._id === action.payload._id
      );
      // index , -1 : python(9)
      if (index !== -1) state.users[index] = action.payload;
    },
    deleteusers: (state, action) => {
      state.users = state.users.filter(
        (categorie) => categorie._id !== action.payload._id
      );
    },
  },
});

export const { addCategorie, setusers, updateUsers, deleteusers } =
usersSlice.actions;
export default usersSlice.reducer;
