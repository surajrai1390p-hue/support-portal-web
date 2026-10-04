/**
 * @fileoverview Floating action button (FAB) for registering a new complaint.
 * Renders a "+" button that navigates to the complaint registration form.
 * Used on the customer complaint dashboard.
 */

import React from "react";
import { useRouter } from "next/router";

/**
 * Floating action button that navigates to the complaint registration page.
 */
function AddComplaintButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="cmp-fab"
      aria-label="Register Complaint"
      title="Register Complaint"
      onClick={() => router.push("/complaints/register")}
    >
      +
    </button>
  );
}

export default AddComplaintButton;