/**
 * @fileoverview Complaints list page — re-exports the ComplaintDashboard component.
 * Rendered at route path `/complaints`.
 *
 * @description This is a thin page wrapper that renders the shared
 * `ComplaintDashboard` component. It displays a filterable, sortable table
 * of all complaints for the logged-in user (Customer or Support).
 *
 * @see {@link route /complaints}
 * @see ComplaintDashboard
 */

import ComplaintDashboard from "@/src/components/complaint-dashboard";

/** Complaints listing page — delegates rendering to ComplaintDashboard. */
export default ComplaintDashboard;