/**
 * @fileoverview Complaint card component for the customer-facing Kanban board.
 * Renders a compact card showing ticket number, title, module/feature badge,
 * company name, submission date, and status. Clicking the card navigates to
 * the complaint detail page.
 */

import React from "react";
import { useRouter } from "next/router";
import { formatDate } from "@/src/lib/dateUtils";
import type { Complaint } from "@/src/store/slices/complaintSlice";

type ComplaintCardProps = {
  /** The complaint data to render in the card. */
  complaint: Complaint;
};

/**
 * Complaint card displayed on the customer Kanban board.
 *
 * Shows a summary of the complaint including its ticket number, title,
 * module/feature classification, company, submission date, and status.
 * Navigates to the complaint detail page on click.
 */
function ComplaintCard({ complaint }: ComplaintCardProps) {
  const router = useRouter();

  const ticketNumber = (complaint.ticketNumber || complaint._id || "").replace(
    /^#/,
    ""
  );

  const submittedAt = complaint.createdAt
    ? formatDate(complaint.createdAt)
    : "";

  const badgeText = [complaint.module, complaint.feature]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="cmp-card"
      onClick={() => router.push(`/complaints/${complaint.ticketNumber || complaint._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/complaints/${complaint.ticketNumber || complaint._id}`);
        }
      }}
    >
      <div className="cmp-card-id">#{ticketNumber}</div>

      <h4 className="cmp-card-title">{complaint.title}</h4>

      {badgeText ? (
        <span className="cmp-feature-badge">{badgeText}</span>
      ) : null}

      <div className="cmp-card-divider" />

      {complaint.companyName && (
        <span className="cmp-card-company">{complaint.companyName}</span>
      )}

      <div className="cmp-card-footer">
        <span className="cmp-footer-text">
          {submittedAt ? `Submitted: ${submittedAt}` : ""}
        </span>

        <span className="cmp-footer-status">
          Status: {complaint.status}
        </span>
      </div>
    </article>
  );
}

export default ComplaintCard;