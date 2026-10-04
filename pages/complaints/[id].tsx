/**
 * @fileoverview Complaint detail page — displays a single complaint's full
 * information and allows Support users to change its status.
 * Rendered at route path `/complaints/[id]`.
 *
 * @description Fetches a complaint by its ID from the URL query parameter
 * and renders its title, description, metadata (module, feature, date),
 * attachments, and current status. Support-role users see a dropdown that
 * lets them transition the complaint to the next valid status (with a
 * confirmation modal). Customer-role users see the status as a read-only
 * tag. A profile popup is available from the header.
 *
 * @see {@link route /complaints/:id}
 */

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Spin, Button, Tag, Avatar, Dropdown, Modal, Input, message } from "antd";
import type { MenuProps } from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  MailOutlined,
  AppstoreOutlined,
  BulbOutlined,
  UserOutlined,
  BankOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { formatDateTime } from "@/src/lib/dateUtils";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchComplaint,
  fetchUserById,
  updateComplaintStatus,
  updateResolutionNote,
  clearCurrentComplaint,
  clearComplaintUser,
} from "@/src/store/slices/complaintSlice";
import type { Complaint, ComplaintUser } from "@/src/store/slices/complaintSlice";
import { STATUS_COLORS, getNextStatuses } from "@/src/config/complaintConfig";
import AppHeader from "@/src/components/app-header";
import ProfilePopup from "@/src/components/profile-popup";
import AttachmentViewer from "@/src/components/attachment-viewer";

/**
 * Resolves customer display information from multiple possible data sources.
 *
 * Merges data from the embedded `userId` object (when populated), a separately
 * fetched `ComplaintUser`, top-level complaint fields, and the logged-in
 * user's company as a final fallback.
 *
 * @param {Complaint} complaint - The complaint record containing customer references.
 * @param {ComplaintUser | null} fetchedUser - A separately fetched user object (when
 *   `userId` is a string ID rather than a populated object).
 * @param {{ companyName?: string } | null} loggedInUser - The currently authenticated
 *   user, used as a last-resort company fallback.
 * @returns {{ name: string; email: string; company: string; profileImage?: string }}
 *   Resolved customer display fields.
 */
function resolveCustomer(
  complaint: Complaint,
  fetchedUser: ComplaintUser | null,
  loggedInUser: { companyName?: string } | null
) {
  const user = complaint.userId as ComplaintUser | string | undefined;
  const isObj = user && typeof user === "object";

  const name =
    complaint.customerName ||
    (isObj ? user.fullName || user.Username : undefined) ||
    (fetchedUser ? fetchedUser.fullName || fetchedUser.Username : undefined) ||
    complaint.customerEmail?.split("@")[0] ||
    "N/A";

  const email =
    complaint.customerEmail ||
    (isObj ? user.email : undefined) ||
    (fetchedUser ? fetchedUser.email : undefined) ||
    "N/A";

  const company =
    complaint.companyName ||
    (isObj ? user.companyName : undefined) ||
    (fetchedUser ? fetchedUser.companyName : undefined) ||
    loggedInUser?.companyName ||
    "N/A";

  const profileImage =
    (isObj ? user.profileImage : undefined) ||
    (fetchedUser ? fetchedUser.profileImage : undefined) ||
    undefined;

  return { name, email, company, profileImage };
}

/**
 * Complaint detail page component.
 *
 * Fetches a single complaint by ID from the URL, displays its full details,
 * and provides a status-change dropdown for Support-role users. Redirects
 * unauthenticated users to `/login`.
 *
 * @returns {JSX.Element} The complaint detail view with header, metadata,
 *   description, attachments, and a status-change confirmation modal.
 */
export default function ComplaintDetailPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;

  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const { currentComplaint, complaintUser, detailLoading, loading, error } = useAppSelector(
    (state) => state.complaint
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState("");

  const nextStatuses = useMemo(
    () => (currentComplaint ? getNextStatuses(currentComplaint.status) : []),
    [currentComplaint]
  );

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (id && typeof id === "string") {
      dispatch(fetchComplaint(id));
    }

    return () => {
      dispatch(clearCurrentComplaint());
      dispatch(clearComplaintUser());
    };
  }, [dispatch, id, user, router]);

  useEffect(() => {
    if (currentComplaint?.userId && typeof currentComplaint.userId === "string") {
      dispatch(fetchUserById(currentComplaint.userId));
    }
  }, [dispatch, currentComplaint]);

  const ticketNumber = currentComplaint?.ticketNumber || currentComplaint?._id || "";
  const statusColor = STATUS_COLORS[currentComplaint?.status || "Pending"] || "#faad14";
  const customer = useMemo(
    () => (currentComplaint ? resolveCustomer(currentComplaint, complaintUser, user) : null),
    [currentComplaint, complaintUser, user]
  );

  /**
   * Called when a Support user picks a new status from the dropdown.
   * Stores the pending status and opens the confirmation modal.
   *
   * @param {string} newStatus - The status value selected by the user.
   */
  const handleStatusSelect = (newStatus: string) => {
    if (!currentComplaint || newStatus === currentComplaint.status) return;
    setPendingStatus(newStatus);
    setModalOpen(true);
    setStatusDropdownOpen(false);
  };

  /**
   * Dispatches the `updateComplaintStatus` thunk to persist the pending
   * status change. Displays a success or error toast accordingly.
   *
   * @returns {Promise<void>}
   */
  const handleStatusConfirm = async () => {
    if (!currentComplaint || !pendingStatus) return;
    const ticketId = currentComplaint.ticketNumber || currentComplaint._id;
    try {
      await dispatch(
        updateComplaintStatus({
          ticketId,
          status: pendingStatus,
          resolutionNote: pendingStatus === "Resolved" ? resolutionNote : undefined,
        })
      ).unwrap();
      message.success(`Status updated to "${pendingStatus}"`);
      setModalOpen(false);
      setPendingStatus(null);
      setResolutionNote("");
    } catch (err) {
      message.error("Failed to update status. Please try again.");
    }
  };

  const handleStatusCancel = () => {
    setModalOpen(false);
    setPendingStatus(null);
    setResolutionNote("");
  };

  const handleEditNote = () => {
    setEditNoteValue(currentComplaint?.resolutionNote || "");
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!currentComplaint || !editNoteValue.trim()) return;
    const ticketId = currentComplaint.ticketNumber || currentComplaint._id;
    try {
      await dispatch(
        updateResolutionNote({ ticketId, resolutionNote: editNoteValue.trim() })
      ).unwrap();
      message.success("Resolution note updated");
      setIsEditingNote(false);
      setEditNoteValue("");
    } catch (err) {
      message.error("Failed to update resolution note. Please try again.");
    }
  };

  const handleCancelEditNote = () => {
    setIsEditingNote(false);
    setEditNoteValue("");
  };

  const statusMenuItems: MenuProps["items"] = nextStatuses.map((s) => ({
    key: s,
    label: (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: STATUS_COLORS[s] || "#8c8c8c",
          }}
        />
        {s}
      </span>
    ),
  }));

  if (!user) return null;

  return (
    <>
      <AppHeader onProfileClick={() => setProfileOpen((v) => !v)} />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(role === "Support" ? "/dashboard/support" : "/complaints")}
          style={{ marginBottom: 16, color: "#0f2c74", fontWeight: 600 }}
        >
          Back to Complaints
        </Button>

        {detailLoading ? (
          <div className="cmp-loading">
            <Spin />
            <p style={{ marginTop: 12 }}>Loading complaint details...</p>
          </div>
        ) : error ? (
          <div className="cmp-error">
            <h3 className="cmp-error-title">Unable to load complaint.</h3>
            <p className="cmp-error-text">{error}</p>
            <Button type="primary" onClick={() => id && typeof id === "string" && dispatch(fetchComplaint(id))}>
              Retry
            </Button>
          </div>
        ) : currentComplaint ? (
          <div className="cmp-detail-card">
            <div className="cmp-detail-header">
              <div>
                <span className="cmp-detail-ticket">#{ticketNumber}</span>
              </div>
              {role === "Support" && nextStatuses.length > 0 && (
                <Dropdown
                  menu={{ items: statusMenuItems, onClick: ({ key }) => handleStatusSelect(key) }}
                  trigger={["click"]}
                  open={statusDropdownOpen}
                  onOpenChange={(open) => setStatusDropdownOpen(open)}
                >
                  <Tag
                    color={statusColor}
                    style={{
                      fontSize: 14,
                      padding: "4px 14px",
                      borderRadius: 999,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {currentComplaint.status}
                    <DownOutlined style={{ fontSize: 10, marginLeft: 6 }} />
                  </Tag>
                </Dropdown>
              )}
              {role !== "Support" && (
                <Tag
                  color={statusColor}
                  style={{
                    fontSize: 14,
                    padding: "4px 14px",
                    borderRadius: 999,
                  }}
                >
                  {currentComplaint.status}
                </Tag>
              )}
            </div>

            {role === "Support" && customer && (customer.name || customer.email || customer.company) && (
              <div className="cmp-detail-customer-section">
                <div className="cmp-customer-card">
                  <Avatar
                    size={48}
                    src={customer.profileImage}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: "#e6fffb",
                      color: "#52c41a",
                      border: "2px solid #b7eb8f",
                      flexShrink: 0,
                    }}
                  />
                  <div className="cmp-customer-info">
                    {customer.name && (
                      <div className="cmp-customer-name">{customer.name}</div>
                    )}
                    {customer.company && (
                      <div className="cmp-customer-detail">
                        <BankOutlined />
                        <span>{customer.company}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="cmp-customer-detail">
                        <MailOutlined />
                        <span>{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <h1 className="cmp-detail-title">{currentComplaint.title}</h1>

            <div className="cmp-detail-meta">
              {currentComplaint.module && (
                <div className="cmp-detail-meta-item">
                  <AppstoreOutlined />
                  <span>{currentComplaint.module}</span>
                </div>
              )}
              {currentComplaint.feature && (
                <div className="cmp-detail-meta-item">
                  <BulbOutlined />
                  <span>{currentComplaint.feature}</span>
                </div>
              )}
              {currentComplaint.createdAt && (
                <div className="cmp-detail-meta-item">
                  <ClockCircleOutlined />
                  <span>{formatDateTime(currentComplaint.createdAt)}</span>
                </div>
              )}
            </div>

            <div className="cmp-detail-section">
              <h3 className="cmp-detail-section-title">Description</h3>
              <p className="cmp-detail-description">{currentComplaint.description}</p>
            </div>

            {currentComplaint.attachments && currentComplaint.attachments.length > 0 && (
              <div className="cmp-detail-section">
                <h3 className="cmp-detail-section-title">
                  Attachments ({currentComplaint.attachments.length})
                </h3>
                <AttachmentViewer attachments={currentComplaint.attachments} />
              </div>
            )}

            {role === "Support" && currentComplaint.status === "Resolved" && (
              <div className="cmp-detail-section cmp-resolution-section">
                <div className="cmp-resolution-header">
                  <h3 className="cmp-detail-section-title" style={{ marginBottom: 0 }}>
                    Resolution Note
                  </h3>
                  {!isEditingNote && (
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={handleEditNote}
                      style={{ color: "#52c41a", fontWeight: 600 }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {isEditingNote ? (
                  <div className="cmp-resolution-edit">
                    <Input.TextArea
                      value={editNoteValue}
                      onChange={(e) => setEditNoteValue(e.target.value)}
                      rows={4}
                      placeholder="Describe how this complaint was resolved..."
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={handleSaveNote}
                        loading={loading}
                        style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      >
                        Save
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={handleCancelEditNote}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="cmp-resolution-content">
                    <p>{currentComplaint.resolutionNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="cmp-error">
            <h3 className="cmp-error-title">Complaint not found.</h3>
            <Button type="primary" onClick={() => router.push("/complaints")}>
              Go Back
            </Button>
          </div>
        )}
      </main>

      <ProfilePopup
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <Modal
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
            Confirm Status Change
          </span>
        }
        open={modalOpen}
        onOk={handleStatusConfirm}
        onCancel={handleStatusCancel}
        okText={loading ? "Updating..." : "Confirm"}
        cancelText="Cancel"
        confirmLoading={loading}
        centered
        okButtonProps={{
          disabled: pendingStatus === "Resolved" && !resolutionNote.trim(),
        }}
      >
        {currentComplaint && pendingStatus && (
          <div style={{ padding: "8px 0" }}>
            <p style={{ marginBottom: 16, color: "#595959" }}>
              Are you sure you want to change the complaint status?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Tag
                color={STATUS_COLORS[currentComplaint.status] || "#8c8c8c"}
                style={{ fontSize: 13, padding: "3px 12px", borderRadius: 999 }}
              >
                {currentComplaint.status}
              </Tag>
              <span style={{ color: "#8c8c8c", fontSize: 16 }}>&rarr;</span>
              <Tag
                color={STATUS_COLORS[pendingStatus] || "#8c8c8c"}
                style={{ fontSize: 13, padding: "3px 12px", borderRadius: 999 }}
              >
                {pendingStatus}
              </Tag>
            </div>
            {pendingStatus === "Resolved" && (
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#262626" }}>
                  Resolution Note <span style={{ color: "#ff4d4f" }}>*</span>
                </label>
                <Input.TextArea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={4}
                  placeholder="Describe how this complaint was resolved..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
