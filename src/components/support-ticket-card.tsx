/**
 * @fileoverview Support ticket card for the agent Kanban board.
 * Renders a detailed card with ticket ID, title, description, module/feature
 * tags, attachment indicator, and customer info. Clicking the card navigates
 * to the complaint detail page.
 */

import React from "react";
import { useRouter } from "next/router";
import { Avatar, Tooltip } from "antd";
import { UserOutlined, PaperClipOutlined, FileTextOutlined } from "@ant-design/icons";
import { formatDate } from "@/src/lib/dateUtils";
import type { Complaint } from "@/src/store/slices/complaintSlice";

type SupportTicketCardProps = {
  /** The complaint data to render in the ticket card. */
  complaint: Complaint;
};

/**
 * Support ticket card displayed on the agent Kanban board.
 *
 * Shows ticket number, title, description, module/feature tags, attachment
 * indicator, customer avatar, name, company, and submission date. Navigates
 * to the complaint detail page on click.
 */
function SupportTicketCard({ complaint }: SupportTicketCardProps) {
  const router = useRouter();

  const ticketNumber = (complaint.ticketNumber || complaint._id || "").replace(
    /^#/,
    ""
  );

  const submittedAt = complaint.createdAt
    ? formatDate(complaint.createdAt)
    : "";

  const hasAttachments =
    (complaint.attachments && complaint.attachments.length > 0) ||
    complaint.attachment;

  const firstAttachmentName = complaint.attachments?.[0]?.originalName || null;

  const customerName = complaint.customerEmail
    ? complaint.customerEmail.split("@")[0]
    : "Customer";

  return (
    <article
      className="spt-card"
      onClick={() =>
        router.push(`/complaints/${complaint.ticketNumber || complaint._id}`)
      }
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(
            `/complaints/${complaint.ticketNumber || complaint._id}`
          );
        }
      }}
    >
      <div className="spt-card-top">
        <span className="spt-card-id">#{ticketNumber}</span>
      </div>

      <h4 className="spt-card-title">{complaint.title}</h4>

      <p className="spt-card-desc">{complaint.description}</p>

      <div className="spt-card-tags">
        {complaint.module && (
          <span className="spt-tag spt-tag-module">{complaint.module}</span>
        )}
        {complaint.feature && (
          <span className="spt-tag spt-tag-feature">{complaint.feature}</span>
        )}
        {hasAttachments && (
          <span className="spt-tag spt-tag-attachment">
            <PaperClipOutlined style={{ fontSize: 11 }} />
            {firstAttachmentName || "Attachment"}
          </span>
        )}
        {complaint.status === "Resolved" && complaint.resolutionNote && (
          <Tooltip title="Has resolution note">
            <span className="spt-tag spt-tag-note">
              <FileTextOutlined style={{ fontSize: 11 }} />
              Note
            </span>
          </Tooltip>
        )}
      </div>

      <div className="spt-card-divider" />

      <div className="spt-card-customer">
        <Avatar
          size={32}
          icon={<UserOutlined />}
          style={{
            backgroundColor: "#e6fffb",
            color: "#52c41a",
            border: "2px solid #b7eb8f",
            flexShrink: 0,
          }}
        />
        <div className="spt-card-customer-info">
          <span className="spt-card-customer-name">{customerName}</span>
          {complaint.companyName && (
            <span className="spt-card-customer-company">{complaint.companyName}</span>
          )}
          {submittedAt && (
            <span className="spt-card-customer-date">{submittedAt}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default SupportTicketCard;
