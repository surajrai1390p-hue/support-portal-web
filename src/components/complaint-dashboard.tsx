/**
 * @fileoverview Customer-facing complaint dashboard.
 * Renders a Kanban board with three columns (Pending, In Progress, Resolved)
 * for tracking the user's own complaints. Includes the app header, profile
 * popup, and a floating action button to register new complaints.
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Spin, Button } from "antd";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchComplaints } from "@/src/store/slices/complaintSlice";
import { BOARD_COLUMNS } from "@/src/config/complaintConfig";
import AppHeader from "./app-header";
import ProfilePopup from "./profile-popup";
import ComplaintColumn from "./complaint-column";
import AddComplaintButton from "./add-complaint-button";

/** Empty-state messages displayed when each column has no complaints. */
const EMPTY_TEXTS: Record<string, string> = {
  Pending: "No pending complaints",
  "In Progress": "No complaints in progress",
  Resolved: "No resolved complaints",
};

function ComplaintDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const { complaints, loading, error } = useAppSelector(
    (state) => state.complaint
  );

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role === "Support") {
      router.replace("/dashboard/support");
      return;
    }

    dispatch(fetchComplaints());
  }, [dispatch, user, role, router]);

  const pending = complaints.filter((c) => c.status === "Pending");
  const inProgress = complaints.filter((c) => c.status === "In Progress");
  const resolved = complaints.filter(
    (c) => c.status === "Resolved" || c.status === "Closed"
  );

  const columnComplaints: Record<string, typeof complaints> = {
    Pending: pending,
    "In Progress": inProgress,
    Resolved: resolved,
  };

  const showLoading = loading && complaints.length === 0 && !error;
  const showError = error && complaints.length === 0;

  if (!user || role === "Support") return null;

  return (
    <>
      <AppHeader onProfileClick={() => setProfileOpen((v) => !v)} />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px 120px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              color: "#0f2c74",
              fontSize: "clamp(1.25rem, 2vw, 1.6rem)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            My Complaints
          </h2>
        </div>

        {showLoading ? (
          <div className="cmp-loading">
            <Spin />
            <p style={{ marginTop: 12 }}>Loading complaints...</p>
          </div>
        ) : showError ? (
          <div className="cmp-error">
            <h3 className="cmp-error-title">Unable to load complaints.</h3>
            <p className="cmp-error-text">Please try again.</p>
            <Button
              type="primary"
              onClick={() => dispatch(fetchComplaints())}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="cmp-board">
            {BOARD_COLUMNS.map((column) => (
              <ComplaintColumn
                key={column.key}
                label={column.label}
                color={column.color}
                complaints={columnComplaints[column.key]}
                emptyText={EMPTY_TEXTS[column.key]}
              />
            ))}
          </div>
        )}
      </main>

      <AddComplaintButton />

      <ProfilePopup
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}

export default ComplaintDashboard;