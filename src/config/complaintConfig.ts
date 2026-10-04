/**
 * @file Complaint module configuration constants.
 *
 * Centralises all static data used by the complaint management
 * feature: module and feature lists, status colours, board columns,
 * allowed status transitions, and file upload constraints.
 */

// Modules available in the Register Complaint form.
export const MODULES = ["Sales"];

// Features selectable within a module.
export const FEATURES = [
  "Inquiry",
  "Quotation",
  "Customer Order",
];

/**
 * Maps each complaint status to the hex colour used by status
 * badges on the complaint board and dashboard.
 */
export const STATUS_COLORS: Record<string, string> = {
  Pending: "#faad14",
  "In Progress": "#1890ff",
  Resolved: "#52c41a",
  Closed: "#8c8c8c",
};

/**
 * Column definitions rendered on the complaint dashboard board view.
 * Each entry links a status key with a display label and colour.
 */
export const BOARD_COLUMNS = [
  { key: "Pending", label: "PENDING", color: STATUS_COLORS.Pending },
  { key: "In Progress", label: "IN PROGRESS", color: STATUS_COLORS["In Progress"] },
  { key: "Resolved", label: "RESOLVED", color: STATUS_COLORS.Resolved },
] as const;

/**
 * Forward-only, irreversible status transition map.
 *
 * Keys are current statuses; values are the statuses a complaint may
 * move to from that state. An empty array means no further transitions.
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  Pending: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: [],
};

/**
 * Returns the list of valid next statuses for a given current status.
 *
 * @param currentStatus - The complaint's current status.
 * @returns An array of allowed next statuses (empty when none remain).
 */
export function getNextStatuses(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/** Maximum allowed file size in megabytes for non-video attachments. */
export const MAX_FILE_SIZE_MB = 10;

/** Maximum allowed file size in megabytes for video attachments. */
export const MAX_VIDEO_SIZE_MB = 25;

/** Maximum allowed file size in bytes for non-video attachments. */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Maximum allowed file size in bytes for video attachments. */
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

/** MIME types accepted for complaint attachments. */
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

/** File extensions (with leading dot) accepted for complaint attachments. */
export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".mp4", ".webm", ".mov"];

/** Video MIME types — used to apply the larger size limit. */
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Video file extensions — used to apply the larger size limit. */
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];

/** Maximum number of file attachments allowed per complaint. */
export const MAX_FILES = 5;