/**
 * @fileoverview Support agent dashboard page — re-exports the SupportDashboard
 * component for the support role.
 * Rendered at route path `/dashboard/support`.
 *
 * @description This thin wrapper renders the `SupportDashboard`, which
 * displays all complaints assigned to or visible to the support agent,
 * along with management tools (status updates, assignment, filtering).
 * Accessed after login for Support-role users.
 *
 * @see {@link route /dashboard/support}
 * @see SupportDashboard
 */

import SupportDashboard from "@/src/components/support-dashboard";

/** Support dashboard — delegates rendering to SupportDashboard. */
export default SupportDashboard;
