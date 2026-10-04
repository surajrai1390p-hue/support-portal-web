/**
 * @fileoverview Profile popup overlay.
 * Displays the signed-in user's avatar, name, organization, and email,
 * along with a logout button. Rendered as a modal-style overlay that
 * closes when the backdrop is clicked.
 */

import React from "react";
import { useRouter } from "next/router";
import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { clearComplaints } from "@/src/store/slices/complaintSlice";
import { persistor } from "@/src/store/store";
import { apiClient } from "@/lib/api";

type ProfilePopupProps = {
  /** Whether the popup is currently visible. */
  open: boolean;
  /** Callback to close the popup. */
  onClose: () => void;
};

/**
 * Profile popup component.
 *
 * Shows the current user's profile information and a logout action.
 * Clears auth state, complaint data, and persisted Redux state on logout,
 * then redirects to the login page.
 */
function ProfilePopup({ open, onClose }: ProfilePopupProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  if (!open) {
    return null;
  }

  const displayName =
    user?.fullName || user?.Username || user?.email || "User";

  const organization =
    user?.companyName || (user?.role ? `${user.role}` : "");

  const email = user?.email || "";

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {}

    dispatch(logout());
    dispatch(clearComplaints());
    await persistor.purge();

    onClose();
    router.replace("/login");
  };

  return (
    <div
      className="cmp-overlay"
      onClick={onClose}
    >
      <div
        className="cmp-popup-card"
        role="dialog"
        aria-label="Account profile"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cmp-signed-in">Signed in As</div>

        <Avatar
          size={96}
          src={user?.profileImage || undefined}
          icon={<UserOutlined />}
          style={{
            background: "#e6fffb",
            color: "#52c41a",
            border: "3px solid #b7eb8f",
          }}
        />

        <div className="cmp-org">{organization}</div>

        <div className="cmp-name">{displayName}</div>

        <div className="cmp-divider" />

        <div className="cmp-email">{email}</div>

        <button
          type="button"
          className="cmp-popup-logout"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default ProfilePopup;