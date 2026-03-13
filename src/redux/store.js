import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer } from './reducers/auth';
import { common } from './reducers/common/common';
import { subscriptionReducer } from './reducers/subscription';

const rootReducer = combineReducers({
  auth: authReducer,
  common,
  subscription: subscriptionReducer,
});


const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'common', 'subscription'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: {

        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export default store;
