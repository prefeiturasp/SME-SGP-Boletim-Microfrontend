import { configureStore } from "@reduxjs/toolkit";

const initialState = { usuario: { logado: false, token: "" } };
const mockReducer = (state = initialState) => state;

export const createMockStore = () =>
  configureStore({
    reducer: mockReducer,
  });
