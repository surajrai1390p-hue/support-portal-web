/**
 * @fileoverview Support-agent complaint dashboard.
 * Provides a three-column Kanban board (Overdue, Pending, In Progress) for
 * support staff to triage and manage customer complaints. Includes search,
 * date filtering, and tabbed views for queues, latest complaints, and
 * resolved complaints.
 */

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Spin, Button, Input, DatePicker, Tag, Modal, Select, Row, Col, Form } from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  FilterOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { MODULES, FEATURES } from "@/src/config/complaintConfig";

const { RangePicker } = DatePicker;

function formatDuration(start: string, end: string): string {
  const s = dayjs(start);
  const e = dayjs(end);
  if (!s.isValid() || !e.isValid()) return "—";
  const diffMs = e.diff(s);
  if (diffMs < 0) return "—";
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (parts.length === 0 && minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(" ") : "0 minutes";
}

import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchComplaints } from "@/src/store/slices/complaintSlice";
import type { Complaint } from "@/src/store/slices/complaintSlice";
import { STATUS_COLORS } from "@/src/config/complaintConfig";
import AppHeader from "./app-header";
import ProfilePopup from "./profile-popup";
import SupportTicketCard from "./support-ticket-card";

/** Column definitions for the support Kanban board. */
const SUPPORT_COLUMNS = [
  { key: "Overdue", label: "Overdue", color: "#ff4d4f" },
  { key: "Pending", label: "Pending", color: "#faad14" },
  { key: "In Progress", label: "In Progress", color: "#1890ff" },
] as const;

const OVERDUE_THRESHOLD_HOURS = 48;

function classifyOverdue(complaint: Complaint): boolean {
  if (complaint.status !== "Pending") return false;
  if (!complaint.createdAt) return false;
  const created = dayjs(complaint.createdAt);
  return dayjs().diff(created, "hour") >= OVERDUE_THRESHOLD_HOURS;
}

function SupportDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const { complaints, loading, error } = useAppSelector(
    (state) => state.complaint
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"queues" | "latest" | "resolved">("queues");
  const [activeNav, setActiveNav] = useState<"board">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [committedSearchQuery, setCommittedSearchQuery] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    dateRange: null as [Dayjs | null, Dayjs | null] | null,
    companyName: null as string | null,
    status: null as string | null,
    module: null as string | null,
    features: [] as string[],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    dateRange: null as [Dayjs | null, Dayjs | null] | null,
    companyName: null as string | null,
    status: null as string | null,
    module: null as string | null,
    features: [] as string[],
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role === "Customer") {
      router.replace("/dashboard/customer");
      return;
    }
    if (role === "Support") {
      dispatch(fetchComplaints());
    }
  }, [dispatch, user, role, router]);

  const dateFilteredComplaints = useMemo(() => {
    let filtered = [...complaints];

    // Apply date range filter
    if (appliedFilters.dateRange && appliedFilters.dateRange[0] && appliedFilters.dateRange[1]) {
      const [start, end] = appliedFilters.dateRange;
      filtered = filtered.filter((c) => {
        if (!c.createdAt) return false;
        const created = dayjs(c.createdAt);
        return created.isAfter(start.subtract(1, "day")) && created.isBefore(end.add(1, "day"));
      });
    }

    // Apply company name filter
    if (appliedFilters.companyName) {
      filtered = filtered.filter((c) => c.companyName === appliedFilters.companyName);
    }

    // Apply status filter
    if (appliedFilters.status) {
      filtered = filtered.filter((c) => c.status === appliedFilters.status);
    }

    // Apply module filter
    if (appliedFilters.module) {
      filtered = filtered.filter((c) => c.module === appliedFilters.module);
    }

    // Apply feature filter (multiple selection)
    if (appliedFilters.features && appliedFilters.features.length > 0) {
      filtered = filtered.filter((c) => c.feature && appliedFilters.features.includes(c.feature));
    }

    return filtered;
  }, [complaints, appliedFilters]);

  const filteredComplaints = useMemo(() => {
    if (!committedSearchQuery.trim()) return dateFilteredComplaints;
    const q = committedSearchQuery.toLowerCase();
    return dateFilteredComplaints.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q))
    );
  }, [dateFilteredComplaints, committedSearchQuery]);

  const resolvedComplaints = useMemo(() => {
    return filteredComplaints.filter(
      (c) => c.status === "Resolved" || c.status === "Closed"
    );
  }, [filteredComplaints]);

  const columnComplaints = useMemo(() => {
    const overdue: Complaint[] = [];
    const pending: Complaint[] = [];
    const inProgress: Complaint[] = [];

    filteredComplaints.forEach((c) => {
      if (classifyOverdue(c)) {
        overdue.push(c);
      } else if (c.status === "Pending") {
        pending.push(c);
      } else if (c.status === "In Progress") {
        inProgress.push(c);
      }
    });

    return { Overdue: overdue, Pending: pending, "In Progress": inProgress };
  }, [filteredComplaints]);

  const showLoading = loading && complaints.length === 0 && !error;
  const showError = error && complaints.length === 0;

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setTempFilters({
      dateRange: null,
      companyName: null,
      status: null,
      module: null,
      features: [],
    });
    setAppliedFilters({
      dateRange: null,
      companyName: null,
      status: null,
      module: null,
      features: [],
    });
    setFilterModalOpen(false);
  };

  const handleOpenFilterModal = () => {
    setTempFilters({ ...appliedFilters });
    setFilterModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setCommittedSearchQuery(value);
  };

  if (!user || role === "Customer") return null;

  return (
    <>
      <AppHeader onProfileClick={() => setProfileOpen((v) => !v)} />

      <div className="spt-layout">
        <aside className="spt-sidebar">
          <div className="spt-sidebar-section">
            <div className="spt-sidebar-label">NAVIGATION</div>
            <button
              type="button"
              className={`spt-sidebar-item ${activeNav === "board" ? "spt-sidebar-item--active" : ""}`}
              onClick={() => setActiveNav("board")}
            >
              <AppstoreOutlined />
              <span>Ticket Board</span>
            </button>

          </div>

          
        </aside>

        <main className="spt-main">
          <>
            <div className="spt-tabs">
              <button
                type="button"
                className={`spt-tab ${activeTab === "queues" ? "spt-tab--active" : ""}`}
                onClick={() => setActiveTab("queues")}
              >
                Support Queues
              </button>
              <button
                type="button"
                className={`spt-tab ${activeTab === "latest" ? "spt-tab--active" : ""}`}
                onClick={() => setActiveTab("latest")}
              >
                Latest Complaints
              </button>
              <button
                type="button"
                className={`spt-tab ${activeTab === "resolved" ? "spt-tab--active" : ""}`}
                onClick={() => setActiveTab("resolved")}
              >
                Resolved Complaints
              </button>
            </div>

            <div className="spt-search-bar">
              <Input
                prefix={<SearchOutlined style={{ color: "#8c8c8c", cursor: "pointer" }} onClick={() => handleSearch(searchQuery)} />}
                placeholder="Search customers, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                className="spt-search-input"
                allowClear
              />
              <Button
                icon={<FilterOutlined />}
                onClick={handleOpenFilterModal}
                className="spt-filter-btn"
              >
                Filter
              </Button>
            </div>

            <Modal
              title="Filter Tickets"
              open={filterModalOpen}
              onCancel={() => setFilterModalOpen(false)}
              footer={[
                <Button key="reset" onClick={handleResetFilters}>
                  Reset
                </Button>,
                <Button key="cancel" onClick={() => setFilterModalOpen(false)}>
                  Cancel
                </Button>,
                <Button key="apply" type="primary" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>,
              ]}
              className="spt-filter-modal"
              width={600}
            >
              <Form layout="vertical" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item label="Date Range">
                      <RangePicker
                        value={tempFilters.dateRange}
                        onChange={(dates) => setTempFilters({ ...tempFilters, dateRange: dates as [Dayjs | null, Dayjs | null] | null })}
                        style={{ width: "100%" }}
                        format="DD MMM YYYY"
                      />
                    </Form.Item>
                  </Col>
                  {/* <Col xs={24} sm={12}>
                    <Form.Item label="Company Name">
                      <Select
                        placeholder="Select company"
                        value={tempFilters.companyName}
                        onChange={(value) => setTempFilters({ ...tempFilters, companyName: value })}
                        allowClear
                        style={{ width: "100%" }}
                      >
                        <Select.Option value="TCS">TCS</Select.Option>
                        <Select.Option value="Infosys">Infosys</Select.Option>
                        <Select.Option value="Wipro">Wipro</Select.Option>
                        <Select.Option value="HCL">HCL</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col> */}
                  <Col xs={24} sm={12}>
                    <Form.Item label="Status">
                      <Select
                        placeholder="Select status"
                        value={tempFilters.status}
                        onChange={(value) => setTempFilters({ ...tempFilters, status: value })}
                        allowClear
                        style={{ width: "100%" }}
                      >
                        <Select.Option value="Overdue">Overdue</Select.Option>
                        <Select.Option value="Pending">Pending</Select.Option>
                        <Select.Option value="In Progress">In Progress</Select.Option>
                        <Select.Option value="Resolved">Resolved</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Module">
                      <Select
                        placeholder="Select module"
                        value={tempFilters.module}
                        onChange={(value) => setTempFilters({ ...tempFilters, module: value, features: [] })}
                        allowClear
                        style={{ width: "100%" }}
                      >
                        {MODULES.map((module) => (
                          <Select.Option key={module} value={module}>
                            {module}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Feature">
                      <Select
                        mode="multiple"
                        placeholder="Select features"
                        value={tempFilters.features}
                        onChange={(value) => setTempFilters({ ...tempFilters, features: value })}
                        allowClear
                        style={{ width: "100%" }}
                        disabled={!tempFilters.module}
                      >
                        {FEATURES.map((feature) => (
                          <Select.Option key={feature} value={feature}>
                            {feature}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Modal>

            {activeTab === "queues" && (
              <>
                <div className="spt-board-header">
                  <div className="spt-board-title-row">
                    <h2 className="spt-board-title">Ticket Board</h2>
                    
                  </div>
                  
                </div>

                {showLoading ? (
                  <div className="spt-loading">
                    <Spin />
                    <p style={{ marginTop: 12 }}>Loading complaints...</p>
                  </div>
                ) : showError ? (
                  <div className="spt-error">
                    <h3 className="spt-error-title">
                      Unable to load complaints.
                    </h3>
                    <p className="spt-error-text">Please try again.</p>
                    <Button
                      type="primary"
                      onClick={() => dispatch(fetchComplaints())}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="spt-board">
                    {SUPPORT_COLUMNS.map((col) => {
                      const items = columnComplaints[col.key] || [];
                      return (
                        <section key={col.key} className="spt-column">
                          <div
                            className="spt-column-top-border"
                            style={{ background: col.color }}
                          />
                          <div className="spt-column-header">
                            <span className="spt-column-label">{col.label}</span>
                            <span className="spt-column-count">
                              {items.length}
                            </span>
                            <button
                              type="button"
                              className="spt-column-menu"
                              aria-label={`${col.label} options`}
                            >
                              <MoreOutlined />
                            </button>
                          </div>

                          <div className="spt-column-body">
                            {items.length === 0 ? (
                              <div className="spt-empty-col">
                                No tickets
                              </div>
                            ) : (
                              items.map((complaint) => (
                                <SupportTicketCard
                                  key={complaint._id}
                                  complaint={complaint}
                                />
                              ))
                            )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "latest" && (
              <>
                <div className="spt-board-header">
                  <div className="spt-board-title-row">
                    <h2 className="spt-board-title">Latest Complaints</h2>
                  </div>
                </div>

                {showLoading ? (
                  <div className="spt-loading">
                    <Spin />
                    <p style={{ marginTop: 12 }}>Loading complaints...</p>
                  </div>
                ) : showError ? (
                  <div className="spt-error">
                    <h3 className="spt-error-title">
                      Unable to load complaints.
                    </h3>
                    <p className="spt-error-text">Please try again.</p>
                    <Button
                      type="primary"
                      onClick={() => dispatch(fetchComplaints())}
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredComplaints.filter((c) => c.status !== "Resolved").length === 0 ? (
                  <div className="spt-empty-col">No complaints found</div>
                ) : (
                  <div className="spt-table-container">
                    <table className="spt-table">
                      <thead>
                        <tr>
                          <th className="spt-th spt-th-id">Ticket ID</th>
                          <th className="spt-th spt-th-title">Title</th>
                          <th className="spt-th spt-th-customer">Customer</th>
                          <th className="spt-th spt-th-category">Module</th>
                          <th className="spt-th spt-th-category">Feature</th>
                          <th className="spt-th spt-th-status">Status</th>
                          <th className="spt-th spt-th-date">Created Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredComplaints].filter((c) => c.status !== "Resolved")
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          )
                          .map((complaint) => {
                            const ticketDisplay = (
                              complaint.ticketNumber ||
                              complaint._id ||
                              ""
                            ).replace(/^#/, "");
                            const customerDisplay =
                              complaint.customerName ||
                              (complaint.customerEmail
                                ? complaint.customerEmail.split("@")[0]
                                : "Customer");
                            const createdDisplay = complaint.createdAt
                              ? dayjs(complaint.createdAt).format("DD - MM - YYYY")
                              : "";
                            return (
                              <tr
                                key={complaint._id}
                                className="spt-tr"
                                onClick={() =>
                                  router.push(
                                    `/complaints/${complaint.ticketNumber || complaint._id}`
                                  )
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    router.push(
                                      `/complaints/${complaint.ticketNumber || complaint._id}`
                                    );
                                  }
                                }}
                              >
                                <td className="spt-td spt-td-id">
                                  #{ticketDisplay}
                                </td>
                                <td className="spt-td spt-td-title">
                                  {complaint.title}
                                </td>
                                <td className="spt-td spt-td-customer">
                                  {customerDisplay}
                                </td>
                                <td className="spt-td spt-td-category">
                                  {complaint.module && (
                                    <span className="spt-tag spt-tag-module">
                                      {complaint.module}
                                    </span>
                                  )}
                                </td>
                                <td className="spt-td spt-td-category">
                                  {complaint.feature && (
                                    <span className="spt-tag spt-tag-feature">
                                      {complaint.feature}
                                    </span>
                                  )}
                                </td>
                                <td className="spt-td spt-td-status">
                                  <Tag
                                    color={STATUS_COLORS[complaint.status] || "#8c8c8c"}
                                    style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999 }}
                                  >
                                    {complaint.status}
                                  </Tag>
                                </td>
                                <td className="spt-td spt-td-date">
                                  {createdDisplay}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === "resolved" && (
              <>
                <div className="spt-board-header">
                  <div className="spt-board-title-row">
                    <h2 className="spt-board-title">Resolved Complaints</h2>
                  </div>
                </div>

                {showLoading ? (
                  <div className="spt-loading">
                    <Spin />
                    <p style={{ marginTop: 12 }}>Loading complaints...</p>
                  </div>
                ) : showError ? (
                  <div className="spt-error">
                    <h3 className="spt-error-title">
                      Unable to load complaints.
                    </h3>
                    <p className="spt-error-text">Please try again.</p>
                    <Button
                      type="primary"
                      onClick={() => dispatch(fetchComplaints())}
                    >
                      Retry
                    </Button>
                  </div>
                ) : resolvedComplaints.length === 0 ? (
                  <div className="spt-empty-col">No resolved complaints</div>
                ) : (
                  <div className="spt-table-container">
                    <table className="spt-table">
                      <thead>
                        <tr>
                          <th className="spt-th spt-th-id">Ticket ID</th>
                          <th className="spt-th spt-th-title">Title</th>
                          <th className="spt-th spt-th-customer">Customer</th>
                          <th className="spt-th spt-th-category">Module</th>
                          <th className="spt-th spt-th-category">Feature</th>
                          <th className="spt-th spt-th-date">Created Date</th>
                          <th className="spt-th spt-th-status">Resolution Duration</th>
                          <th className="spt-th spt-th-date">Resolved Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...resolvedComplaints]
                          .sort(
                            (a, b) =>
                              new Date(b.updatedAt || b.createdAt).getTime() -
                              new Date(a.updatedAt || a.createdAt).getTime()
                          )
                          .map((complaint) => {
                            const ticketDisplay = (
                              complaint.ticketNumber ||
                              complaint._id ||
                              ""
                            ).replace(/^#/, "");
                            const customerDisplay =
                              complaint.customerName ||
                              (complaint.customerEmail
                                ? complaint.customerEmail.split("@")[0]
                                : "Customer");
                            const resolvedDisplay = complaint.updatedAt
                              ? dayjs(complaint.updatedAt).format("DD - MM - YYYY")
                              : complaint.createdAt
                                ? dayjs(complaint.createdAt).format("DD - MM - YYYY")
                                : "";
                            return (
                              <tr
                                key={complaint._id}
                                className="spt-tr"
                                onClick={() =>
                                  router.push(
                                    `/complaints/${complaint.ticketNumber || complaint._id}`
                                  )
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    router.push(
                                      `/complaints/${complaint.ticketNumber || complaint._id}`
                                    );
                                  }
                                }}
                              >
                                <td className="spt-td spt-td-id">
                                  #{ticketDisplay}
                                </td>
                                <td className="spt-td spt-td-title">
                                  {complaint.title}
                                </td>
                                <td className="spt-td spt-td-customer">
                                  {customerDisplay}
                                </td>
                                <td className="spt-td spt-td-category">
                                  {complaint.module && (
                                    <span className="spt-tag spt-tag-module">
                                      {complaint.module}
                                    </span>
                                  )}
                                </td>
                                <td className="spt-td spt-td-category">
                                  {complaint.feature && (
                                    <span className="spt-tag spt-tag-feature">
                                      {complaint.feature}
                                    </span>
                                  )}
                                </td>
                                <td className="spt-td spt-td-date">
                                  {complaint.createdAt
                              ? dayjs(complaint.createdAt).format("DD - MM - YYYY")
                                    : "—"}
                                </td>
                                <td className="spt-td spt-td-status">
                                  {complaint.createdAt && (complaint.updatedAt || complaint.createdAt)
                                    ? formatDuration(
                                        complaint.createdAt,
                                        complaint.updatedAt || complaint.createdAt
                                      )
                                    : "—"}
                                </td>
                                <td className="spt-td spt-td-date">
                                  {resolvedDisplay}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        </main>
      </div>

      <ProfilePopup
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}

export default SupportDashboard;
