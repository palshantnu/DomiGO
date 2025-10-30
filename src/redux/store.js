import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import residencyReducer from './slices/residencySlice';
import tripsReducer from './slices/tripsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    residency: residencyReducer,
    trips: tripsReducer,
  },
});

export default store;
