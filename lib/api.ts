/**
 * @file API client configuration.
 *
 * Provides a pre-configured Axios instance shared by all client-side
 * components and hooks that communicate with the backend. The instance
 * is set up with `withCredentials` so session cookies are sent
 * cross-origin and a JSON content-type header by default.
 *
 * Includes a global response interceptor that catches 401 Unauthorized
 * errors (expired/invalid session) and redirects to the login page.
 */

import axios from "axios";
import { store } from "@/src/store/store";
import { logout } from "@/src/store/slices/authSlice";

/**
 * Base URL for the backend API.
 *
 * Reads from the `NEXT_PUBLIC_API_URL` environment variable and falls
 * back to `http://localhost:5000` for local development.
 */
export const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Shared Axios instance for all backend requests.
 *
 * Uses `withCredentials: true` so that HTTP-only session cookies are
 * included in every cross-origin request. All API modules and hooks
 * should import this instance rather than creating their own.
 */
export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/**
 * Global response interceptor — catches 401 Unauthorized responses
 * across all API calls. When the backend returns 401 (expired JWT,
 * missing session, etc.), this interceptor:
 *
 * 1. Dispatches the `logout` action to clear persisted auth state
 * 2. Redirects to `/login` (skips if already on the login page)
 *
 * This ensures session expiry is handled uniformly without requiring
 * individual try/catch blocks in every thunk or component.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());

      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);