/**
 * @fileoverview Customer dashboard page — re-exports the ComplaintDashboard
 * component for the customer role.
 * Rendered at route path `/dashboard/customer`.
 *
 * @description This thin wrapper renders the shared `ComplaintDashboard`,
 * which displays a filterable, sortable table of complaints belonging to
 * the logged-in customer. Accessed after login for non-Support users.
 *
 * @see {@link route /dashboard/customer}
 * @see ComplaintDashboard
 */

import ComplaintDashboard from "@/src/components/complaint-dashboard";

/** Customer dashboard — delegates rendering to ComplaintDashboard. */
export default ComplaintDashboard;