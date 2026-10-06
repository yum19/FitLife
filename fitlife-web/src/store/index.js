import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { userApi } from './userApi'; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApi.middleware), 
});
