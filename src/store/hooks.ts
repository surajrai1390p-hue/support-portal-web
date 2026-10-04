/**
 * @file Typed Redux hooks.
 *
 * Re-exports `useDispatch` and `useSelector` with the correct TypeScript
 * types for this app's Redux store (`RootState` and `AppDispatch`).
 * Import these hooks instead of the plain react-redux versions to get
 * full type-safety across all components and thunks.
 */

import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import type { RootState, AppDispatch } from "./store";

/**
 * Typed version of React-Redux's `useDispatch`.
 *
 * Returns a dispatch function pre-typed to the `AppDispatch` type
 * defined by the app's Redux store.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of React-Redux's `useSelector`.
 *
 * Enforces that all selector callbacks receive the correct `RootState`
 * shape, catching type errors at compile time.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;