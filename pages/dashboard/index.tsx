/**
 * @fileoverview Dashboard index — a routing-only page that redirects users to
 * their role-specific dashboard.
 * Rendered at route path `/dashboard`.
 *
 * @description This page never renders visible UI. On mount it reads the
 * authenticated user's role from the Redux store and performs a server-style
 * redirect:
 * - **No role** → `/login`
 * - **Support** → `/dashboard/support`
 * - **Customer / other** → `/dashboard/customer`
 *
 * @see {@link route /dashboard}
 * @see {@link route /dashboard/support}
 * @see {@link route /dashboard/customer}
 */

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAppSelector } from "@/src/store/hooks";

/**
 * Dashboard index component that redirects to the appropriate role dashboard.
 *
 * Returns `null` — no DOM is rendered. The redirect occurs inside a
 * `useEffect` that watches the `role` selector.
 *
 * @returns {null} This component renders nothing.
 */
export default function DashboardIndex() {
  const router = useRouter();
  const role = useAppSelector((state) => state.auth.role);

  useEffect(() => {
    if (!role) {
      router.replace("/login");
    } else if (role === "Support") {
      router.replace("/dashboard/support");
    } else {
      router.replace("/dashboard/customer");
    }
  }, [role, router]);

  return null;
}