/**
 * @fileoverview New complaint registration page for the Customer Support Portal.
 * Rendered at route path `/complaints/register`.
 *
 * @description Renders the shared `ComplaintForm` component inside a centered
 * layout with the application header and profile popup. Unauthenticated users
 * are redirected to `/login`. This is the entry point for customers to submit
 * a new support complaint.
 *
 * @see {@link route /complaints/register}
 * @see ComplaintForm
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Flex } from "antd";
import { useAppSelector } from "@/src/store/hooks";
import AppHeader from "@/src/components/app-header";
import ProfilePopup from "@/src/components/profile-popup";
import ComplaintForm from "@/src/components/complaint-form";

/**
 * Complaint registration page component.
 *
 * Displays the app header, the `ComplaintForm`, and the profile popup.
 * Redirects to `/login` if no authenticated user is found.
 *
 * @returns {JSX.Element} The new-complaint page UI.
 */
export default function RegisterComplaintPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  return (
    <>
      <AppHeader onProfileClick={() => setProfileOpen((v) => !v)} />

      <Flex
        justify="center"
        align="flex-start"
        style={{
          padding: "40px 20px 60px",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <ComplaintForm />
      </Flex>

      <ProfilePopup
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}