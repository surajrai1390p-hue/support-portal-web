/**
 * @file Redux store configuration.
 *
 * Creates and exports the application-wide Redux Toolkit store,
 * including the redux-persist middleware that keeps auth state
 * (user and role) in localStorage across page reloads.
 */

import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
} from "redux-persist";

import storage from "redux-persist/lib/storage";

import authReducer from "./slices/authSlice";
import complaintReducer from "./slices/complaintSlice";

/** redux-persist configuration – only persists user & role from auth. */
const persistConfig = {
  key: "root",
  storage,

  // Only persist these fields from auth
  whitelist: ["user", "role"],
};

/** Wrapped auth reducer that persists to localStorage via redux-persist. */
const persistedAuthReducer = persistReducer(
  persistConfig,
  authReducer
);

/**
 * Application Redux store.
 *
 * Combines the persisted auth slice and the complaint slice, and
 * configures the default middleware with serializable-check exceptions
 * for redux-persist internal actions.
 */
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    complaint: complaintReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/FLUSH",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REHYDRATE",
        ],
      },
    }),
});

/**
 * redux-persist persistor bound to the store.
 *
 * Pass this to the `PersistGate` component to delay rendering until
 * persisted state has been rehydrated.
 */
export const persistor = persistStore(store);

/**
 * Root state type derived from the Redux store.
 *
 * Use this type in selectors and anywhere the full state shape is
 * needed.
 */
export type RootState = ReturnType<
  typeof store.getState
>;

/**
 * Dispatch type derived from the Redux store.
 *
 * Pass this to `configureStore`-style thunks and to the typed
 * `useAppDispatch` hook.
 */
export type AppDispatch = typeof store.dispatch;