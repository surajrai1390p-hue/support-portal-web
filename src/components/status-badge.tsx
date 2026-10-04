/**
 * @fileoverview Colored status badge component.
 * Renders a pill-shaped badge with a background color derived from the
 * complaint status. Optionally includes a small dot indicator. Used
 * throughout the dashboard to visually represent complaint statuses.
 */

import React from "react";
import { STATUS_COLORS } from "@/src/config/complaintConfig";

type StatusBadgeProps = {
  /** The complaint status string (e.g. "Pending", "In Progress", "Resolved"). */
  status: string;
  /** Optional custom label override. Falls back to the status value if omitted. */
  label?: string;
  /** Whether to show a small white dot before the label. Defaults to true. */
  dot?: boolean;
};

/**
 * Status badge pill component.
 *
 * Displays a colored badge with the status label. The background color
 * is looked up from the STATUS_COLORS config map.
 */
function StatusBadge({ status, label, dot = true }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || "#8c8c8c";

  return (
    <span
      className="cmp-status-badge"
      style={{ background: color }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.85)",
          }}
        />
      )}
      {(label || status).toUpperCase()}
    </span>
  );
}

export default StatusBadge;