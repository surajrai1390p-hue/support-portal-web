/**
 * @fileoverview Kanban column component for the customer complaint dashboard.
 * Renders a labeled column header with a colored status badge, a complaint
 * count, and a list of ComplaintCard items. Displays an empty-state message
 * when there are no complaints in the column.
 */

import React from "react";
import type { Complaint } from "@/src/store/slices/complaintSlice";
import ComplaintCard from "./complaint-card";

type ComplaintColumnProps = {
  /** Display label for the column (e.g. "Pending", "In Progress"). */
  label: string;
  /** Background color for the column's status badge. */
  color: string;
  /** Array of complaints belonging to this column. */
  complaints: Complaint[];
  /** Message shown when the complaints array is empty. */
  emptyText: string;
};

/**
 * A single Kanban column in the customer complaint dashboard.
 *
 * Renders a header with a colored status badge and count, followed by
 * a list of ComplaintCard components. Shows the emptyText message when
 * no complaints are present.
 */
function ComplaintColumn({
  label,
  color,
  complaints,
  emptyText,
}: ComplaintColumnProps) {
  return (
    <section className="cmp-column">
      <div className="cmp-column-header">
        <span
          className="cmp-status-badge"
          style={{ background: color }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.85)",
            }}
          />
          {label}
        </span>

        <span className="cmp-status-count">{complaints.length}</span>
      </div>

      {complaints.length === 0 ? (
        <div className="cmp-empty">{emptyText}</div>
      ) : (
        complaints.map((complaint) => (
          <ComplaintCard
            key={complaint._id}
            complaint={complaint}
          />
        ))
      )}
    </section>
  );
}

export default ComplaintColumn;