/**
 * @file Authentication Redux slice.
 *
 * Manages user authentication state including registration, login,
 * forgot-password OTP flow, email verification, and logout.
 * All async thunks communicate with the `/api` backend via the shared
 * `apiClient`.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { apiClient, baseURL } from "@/lib/api";

// --------------------
// Registration
// --------------------

/**
 * Payload shape for the registration API call.
 *
 * Contains the user's personal and company details required to create
 * a new customer account.
 */
export interface RegistrationData {
  fullName: string;
  Username: string;
  companyName: string;
  mobile: string;
  email: string;
  password: string;
}

// --------------------
// Login
// --------------------

/**
 * Payload shape for the login API call.
 *
 * Supports authentication by either email or username; at least one
 * identifier must be provided along with the password.
 */
export interface LoginData {
  email?: string;
  username?: string;
  password: string;
}

/**
 * Authenticated user object returned by the backend after login.
 *
 * Stores profile information and the user's role, which determines
 * which UI surfaces (customer vs. support) are accessible.
 */
export interface User {
  id: string;
  email: string;
  role: "Customer" | "Support";
  fullName?: string;
  Username?: string;
  companyName?: string;
  mobile?: string;
  profileImage?: string;
}

// --------------------
// Forgot Password
// --------------------

/**
 * Payload shape for requesting a forgot-password OTP.
 *
 * `method` is fixed to `"email"` and `value` is the email address
 * the OTP should be sent to.
 */
export interface ForgotOtpData {
  method: "email";
  value: string;
}

/**
 * Payload shape for resetting the password after OTP verification.
 *
 * Includes the email address, the verified OTP, and the new password.
 */
export interface ResetPasswordData {
  method: "email";
  value: string;
  otp: string;
  newPassword: string;
}

// --------------------
// Auth State
// --------------------

/**
 * Shape of the authentication slice in the Redux store.
 *
 * Tracks loading/success/error states alongside the current user
 * and role so the UI can react to async auth operations.
 */
interface AuthState {
  loading: boolean;
  success: boolean;
  error: string | null;

  user: User | null;

  role: "Customer" | "Support" | null;
}

const initialState: AuthState = {
  loading: false,
  success: false,
  error: null,

  user: null,
  role: null,
};

// --------------------
// Register API
// --------------------

/**
 * Async thunk – registers a new user account.
 *
 * POSTs the registration payload to `/api/register` and returns the
 * server response. On failure the backend error message is forwarded
 * via `rejectWithValue`.
 */
export const registerUser = createAsyncThunk(
  "auth/registerUser",

  async (values: RegistrationData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/register", values);

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message || "Registration failed",
      );
    }
  },
);

// --------------------
// Login API
// --------------------

/**
 * Async thunk – logs in an existing user.
 *
 * Sends the credentials via HTTP Basic Auth to `/api/auth/login`.
 * On success the response contains `data.user` and `data.role` which
 * are stored in the Redux state (and persisted to localStorage).
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",

  async (values: LoginData, { rejectWithValue }) => {
    try {
      const identifier = values.email || values.username || "";
      const response = await apiClient.post(
        "/api/auth/login",
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          auth: {
            username: identifier,
            password: values.password,
          },
        },
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message || "Login failed",
      );
    }
  },
);

// --------------------
// Request Forgot Password OTP
// --------------------

/**
 * Async thunk – requests a one-time password for the forgot-password flow.
 *
 * POSTs the email address to `/api/forgot/request`. The backend sends
 * the OTP to the provided email.
 */
export const requestForgotOtp = createAsyncThunk(
  "auth/requestForgotOtp",

  async (values: ForgotOtpData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/forgot/request", values);

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message || "Failed to send OTP",
      );
    }
  },
);

// --------------------
// Reset Password
// --------------------

/**
 * Async thunk – resets the user's password using a verified OTP.
 *
 * POSTs the new password and OTP to `/api/forgot/reset`. Must be
 * called after `verifyForgotOtp` succeeds.
 */
export const resetForgotPassword = createAsyncThunk(
  "auth/resetForgotPassword",

  async (values: ResetPasswordData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/forgot/reset", values);

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message || "Reset failed",
      );
    }
  },
);

// --------------------
// Verify Forgot Password OTP
// --------------------

/**
 * Payload shape for OTP verification.
 *
 * Identical to `ForgotOtpData` but includes the OTP entered by the
 * user so the backend can validate it.
 */
export interface VerifyOtpData {
  method: "email";
  value: string;
  otp: string;
}

/**
 * Async thunk – verifies the OTP received during the forgot-password flow.
 *
 * POSTs the OTP and email to `/api/forgot/verify`. A successful
 * response allows the caller to proceed to `resetForgotPassword`.
 */
export const verifyForgotOtp = createAsyncThunk(
  "auth/verifyForgotOtp",

  async (values: VerifyOtpData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/forgot/verify", values);

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message || "OTP verification failed",
      );
    }
  },
);

// --------------------
// Check Email Registration
// --------------------

/**
 * Async thunk – checks whether an email address is already registered.
 *
 * POSTs the email to `/api/forgot/check-email`. Used during the
 * forgot-password flow to verify the user exists before sending OTPs.
 */
export const checkEmailRegistered = createAsyncThunk(
  "auth/checkEmailRegistered",

  async (values: ForgotOtpData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/forgot/check-email", values);

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message || "Unable to verify email",
      );
    }
  },
);

// --------------------
// Auth Slice
// --------------------

/**
 * Authentication Redux slice.
 *
 * Combines synchronous reducers (clearAuthState, logout) with async
 * extra reducers for every auth thunk. The slice handles loading,
 * success, and error transitions for each operation.
 */
const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    /** Resets transient UI flags (loading, success, error) without touching user data. */
    clearAuthState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },

    /** Clears all auth state – used on explicit logout or session expiry. */
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.success = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // =========================
    // REGISTER
    // =========================

    builder

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error = (action.payload as string) || "Registration failed";
      });

    // =========================
    // LOGIN
    // =========================

    builder

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;

        state.role = action.payload?.data?.role || null;

        state.user = action.payload?.data?.user || null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error = (action.payload as string) || "Login failed";
      });

    // =========================
    // REQUEST OTP
    // =========================

    builder

      .addCase(requestForgotOtp.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(requestForgotOtp.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })

      .addCase(requestForgotOtp.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error = (action.payload as string) || "Failed to send OTP";
      });

    // =========================
    // RESET PASSWORD
    // =========================

    builder

      .addCase(resetForgotPassword.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(resetForgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })

      .addCase(resetForgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error = (action.payload as string) || "Reset failed";
      });

    // =========================
    // VERIFY OTP
    // =========================

    builder

      .addCase(verifyForgotOtp.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(verifyForgotOtp.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })

      .addCase(verifyForgotOtp.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error = (action.payload as string) || "OTP verification failed";
      });

    // =========================
    // CHECK EMAIL REGISTERED
    // =========================

    builder

      .addCase(checkEmailRegistered.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(checkEmailRegistered.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })

      .addCase(checkEmailRegistered.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error = (action.payload as string) || "Unable to verify email";
      });
  },
});

// --------------------
// Actions
// --------------------

/**
 * Synchronous action creators exported from the auth slice.
 *
 * - `clearAuthState` – resets transient UI flags.
 * - `logout` – clears the stored user and role.
 */
export const { clearAuthState, logout } = authSlice.actions;

// --------------------
// Reducer
// --------------------

/**
 * Auth slice reducer, to be mounted at `state.auth` in the Redux store.
 */
export default authSlice.reducer;
