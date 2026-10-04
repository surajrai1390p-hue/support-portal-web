/**
 * @fileoverview Top-level application header for the support portal.
 * Renders the Sharp Minds logo on the left and a profile button on the right.
 * Used by both the customer and support dashboards.
 */

import React from "react";
import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useAppSelector } from "@/src/store/hooks";

type AppHeaderProps = {
  /** Callback invoked when the profile button is clicked. */
  onProfileClick: () => void;
};

/**
 * Application header bar.
 *
 * Displays the company logo and a profile avatar button that triggers the
 * profile popup when clicked.
 */
function AppHeader({ onProfileClick }: AppHeaderProps) {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="cmp-header">
      <div className="cmp-header-inner">
        <Image
          src="/sharpminds.png"
          alt="Sharp Minds"
          width={90}
          height={60}
          style={{ width: "100%", maxWidth: "100px", height: "auto" }}
        />

        <button
          type="button"
          className="cmp-profile-btn"
          onClick={onProfileClick}
          aria-label="Open profile menu"
        >
          <Avatar
            size={26}
            src={user?.profileImage || undefined}
            icon={<UserOutlined />}
            style={{
              background: "#ffffff",
              color: "#52c41a",
              flexShrink: 0,
            }}
          />
          <span>Profile</span>
        </button>
      </div>
    </header>
  );
}

export default AppHeader;