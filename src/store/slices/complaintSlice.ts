/**
 * @file Complaint Redux slice.
 *
 * Manages the full lifecycle of support complaints: creating,
 * listing, fetching details, updating status, and fetching the
 * complaint author's user data. All async thunks communicate with
 * the `/api/complaints` backend via the shared `apiClient`.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api";

// ------------------------------------
// Complaint interface
// ------------------------------------

/**
 * Minimal user profile embedded in complaint responses.
 *
 * Represents the customer who filed the complaint. Only a subset of
 * fields may be present depending on the API endpoint used.
 */
export interface ComplaintUser {
  _id: string;
  fullName?: string;
  Username?: string;
  email?: string;
  companyName?: string;
  mobile?: string;
  profileImage?: string;
}

/**
 * Full complaint object as returned by the backend.
 *
 * Contains the complaint's metadata, status, timestamps, and any
 * file attachments. Status is constrained to the values defined in
 * `STATUS_TRANSITIONS` in `complaintConfig.ts`.
 */
export interface Complaint {
  _id: string;
  title: string;
  description: string;
  module?: string;
  feature?: string;
  status: "Pending" | "In Progress" | "Resolved" | "Closed";
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  ticketNumber?: string;
  attachment?: string;
  attachments?: Array<{
    fileUrl?: string;
    originalName?: string;
    fileType?: string;
  }>;
  userId?: string;
  customerEmail?: string;
  companyName?: string;
  customerName?: string;
}

// ------------------------------------
// Create complaint data
// ------------------------------------

/**
 * Payload shape for the create-complaint API call.
 *
 * Includes the complaint's text fields and an optional array of
 * `File` objects that will be sent as multipart form data.
 */
export interface CreateComplaintData {
  title: string;
  description: string;
  module: string;
  feature: string;
  attachments?: File[];
}

// ------------------------------------
// Complaint state
// ------------------------------------

/**
 * Shape of the complaint slice in the Redux store.
 *
 * Tracks the list of complaints, the currently viewed complaint,
 * its author, and various loading/error/success flags used by the
 * UI to drive spinners and notifications.
 */
interface ComplaintState {
  complaints: Complaint[];
  currentComplaint: Complaint | null;
  complaintUser: ComplaintUser | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: ComplaintState = {
  complaints: [],
  currentComplaint: null,
  complaintUser: null,
  loading: false,
  detailLoading: false,
  error: null,
  success: false,
};

// ------------------------------------
// CREATE COMPLAINT
// ------------------------------------

/**
 * Async thunk – creates a new complaint.
 *
 * If the payload includes file attachments the request is sent as
 * `multipart/form-data`; otherwise a plain JSON body is used. On
 * success the new complaint is prepended to the local list.
 */
export const createComplaint = createAsyncThunk(
  "complaint/createComplaint",

  async (
    values: CreateComplaintData,
    { rejectWithValue }
  ) => {
    try {
      const hasAttachments = !!values.attachments?.length;

      if (hasAttachments) {
        const formData = new FormData();

        formData.append("title", values.title.trim());
        formData.append("description", values.description.trim());
        formData.append("module", values.module);
        formData.append("feature", values.feature);
        values.attachments!.forEach((file) =>
          formData.append("attachment", file)
        );

        const response = await apiClient.post(
          "/api/complaints",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        return response.data;
      }

      const response = await apiClient.post(
        "/api/complaints",
        {
          title: values.title.trim(),
          description: values.description.trim(),
          module: values.module,
          feature: values.feature,
        }
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message ||
          "Failed to register complaint"
      );
    }
  }
);

// ------------------------------------
// GET CUSTOMER COMPLAINTS
// ------------------------------------

/**
 * Async thunk – fetches all complaints for the current user.
 *
 * GETs `/api/complaints` and replaces the local complaints array
 * with the server response.
 */
export const fetchComplaints = createAsyncThunk(
  "complaint/fetchComplaints",

  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        "/api/complaints"
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message ||
          "Failed to fetch complaints"
      );
    }
  }
);

// ------------------------------------
// GET SINGLE COMPLAINT
// ------------------------------------

/**
 * Async thunk – fetches a single complaint by its ticket ID.
 *
 * GETs `/api/complaints/:ticketId` and stores the result in
 * `state.complaint.currentComplaint`.
 *
 * @param ticketId - The unique identifier of the complaint to fetch.
 */
export const fetchComplaint = createAsyncThunk(
  "complaint/fetchComplaint",

  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/complaints/${ticketId}`
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message ||
          "Failed to fetch complaint"
      );
    }
  }
);

// ------------------------------------
// UPDATE COMPLAINT STATUS
// ------------------------------------

/**
 * Async thunk – updates the status of an existing complaint.
 *
 * PATCHes `/api/complaints/:ticketId/status` with the new status.
 * On success the updated complaint replaces the entry in the local
 * list and in `currentComplaint`.
 *
 * @param params.ticketId - The complaint to update.
 * @param params.status   - The new status value.
 * @param params.resolutionNote - Resolution note (required when resolving).
 */
export const updateComplaintStatus = createAsyncThunk(
  "complaint/updateComplaintStatus",

  async (
    { ticketId, status, resolutionNote }: { ticketId: string; status: string; resolutionNote?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.patch(
        `/api/complaints/${ticketId}/status`,
        { status, resolutionNote }
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message ||
          "Failed to update status"
      );
    }
  }
);

// ------------------------------------
// FETCH USER BY ID
// ------------------------------------

/**
 * Async thunk – fetches a user's public profile by ID.
 *
 * Used by the support dashboard to display the customer who filed a
 * complaint. The result is stored in `state.complaint.complaintUser`.
 *
 * @param userId - The ID of the user to fetch.
 */
export const fetchUserById = createAsyncThunk(
  "complaint/fetchUserById",

  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/users/${userId}`
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message ||
          "Failed to fetch user data"
      );
    }
  }
);

// ------------------------------------
// UPDATE RESOLUTION NOTE
// ------------------------------------

/**
 * Async thunk – updates the resolution note on a resolved complaint.
 *
 * PATCHes `/api/complaints/:ticketId/resolution-note` with the new note.
 *
 * @param params.ticketId - The complaint to update.
 * @param params.resolutionNote - The resolution note text.
 */
export const updateResolutionNote = createAsyncThunk(
  "complaint/updateResolutionNote",

  async (
    { ticketId, resolutionNote }: { ticketId: string; resolutionNote: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.patch(
        `/api/complaints/${ticketId}/resolution-note`,
        { resolutionNote }
      );

      return response.data;
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      return rejectWithValue(
        apiError.response?.data?.message ||
          "Failed to update resolution note"
      );
    }
  }
);

// ------------------------------------
// SLICE
// ------------------------------------

/**
 * Complaint Redux slice.
 *
 * Combines synchronous reducers for clearing state with async extra
 * reducers for every complaint thunk. Handles loading, success, and
 * error transitions and keeps the local complaints list in sync with
 * the backend after each operation.
 */
const complaintSlice = createSlice({
  name: "complaint",

  initialState,

  reducers: {
    /** Resets transient UI flags (loading, success, error) without clearing complaint data. */
    clearComplaintState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },

    /** Clears the complaints list and resets all transient flags. */
    clearComplaints: (state) => {
      state.complaints = [];
      state.loading = false;
      state.success = false;
      state.error = null;
    },

    /** Clears the currently viewed complaint and its author data. */
    clearCurrentComplaint: (state) => {
      state.currentComplaint = null;
      state.complaintUser = null;
      state.detailLoading = false;
      state.error = null;
    },

    /** Clears only the complaint author data. */
    clearComplaintUser: (state) => {
      state.complaintUser = null;
    },
  },

  extraReducers: (builder) => {

    // ==============================
    // CREATE COMPLAINT
    // ==============================

    builder
      .addCase(createComplaint.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(createComplaint.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;

        if (action.payload?.data) {
          state.complaints.unshift(
            action.payload.data
          );
        }
      })

      .addCase(createComplaint.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error =
          (action.payload as string) ||
          "Failed to register complaint";
      });

    // ==============================
    // FETCH COMPLAINTS
    // ==============================

    builder
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.complaints =
          action.payload?.data || [];
      })

      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false;

        state.error =
          (action.payload as string) ||
          "Failed to fetch complaints";
      });

    // ==============================
    // FETCH SINGLE COMPLAINT
    // ==============================

    builder
      .addCase(fetchComplaint.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })

      .addCase(fetchComplaint.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.error = null;
        state.currentComplaint = action.payload?.data || null;
      })

      .addCase(fetchComplaint.rejected, (state, action) => {
        state.detailLoading = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch complaint";
      });

    // ==============================
    // UPDATE COMPLAINT STATUS
    // ==============================

    builder
      .addCase(updateComplaintStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const updated = action.payload?.data;
        if (updated) {
          state.currentComplaint = updated;

          const idx = state.complaints.findIndex(
            (c) => c._id === updated._id
          );
          if (idx !== -1) {
            state.complaints[idx] = updated;
          }
        }
      })

      .addCase(updateComplaintStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to update status";
      });

    // ==============================
    // FETCH USER BY ID
    // ==============================

    builder
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.complaintUser = action.payload?.data || null;
      });

    // ==============================
    // UPDATE RESOLUTION NOTE
    // ==============================

    builder
      .addCase(updateResolutionNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateResolutionNote.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const updated = action.payload?.data;
        if (updated) {
          state.currentComplaint = updated;

          const idx = state.complaints.findIndex(
            (c) => c._id === updated._id
          );
          if (idx !== -1) {
            state.complaints[idx] = updated;
          }
        }
      })

      .addCase(updateResolutionNote.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to update resolution note";
      });
  },
});

/**
 * Synchronous action creators exported from the complaint slice.
 *
 * Used by components to reset specific parts of complaint state
 * (e.g. after navigating away from a detail view).
 */
export const {
  clearComplaintState,
  clearComplaints,
  clearCurrentComplaint,
  clearComplaintUser,
} = complaintSlice.actions;

/**
 * Complaint slice reducer, to be mounted at `state.complaint` in the
 * Redux store.
 */
export default complaintSlice.reducer;