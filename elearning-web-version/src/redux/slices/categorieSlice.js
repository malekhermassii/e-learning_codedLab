import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    addCategorie: (state, action) => {
      const categorieExists = state.categories.some(
        (categorie) => categorie._id === action.payload._id
      );
      if (!categorieExists) state.categories.push(action.payload);
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    updateCategorie: (state, action) => {
      const index = state.categories.findIndex(
        (categorie) => categorie._id === action.payload._id
      );
      // index , -1 : python(9)
      if (index !== -1) state.categories[index] = action.payload;
    },
    deleteCategorie: (state, action) => {
      state.categories = state.categories.filter(
        (categorie) => categorie._id !== action.payload._id
      );
    },
  },
});

export const { addCategorie, setCategories, updateCategorie, deleteCategorie } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;
