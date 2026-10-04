/**
 * @fileoverview Generic dashboard shell used after login.
 * Renders a header with the company logo, user role tag, email, and logout
 * button, plus a centered content card displaying a title, subtitle, and
 * optional highlight text.
 */

import React from "react";
import { Card, Flex, Button, Tag } from "antd";
import Image from "next/image";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/api";

type Props = {
  /** User's email address displayed in the header. */
  email: string;
  /** User's role — determines the color of the role tag in the header. */
  role: "Customer" | "Support";
  /** Main heading displayed in the content card. */
  title: string;
  /** Descriptive text shown below the title. */
  subtitle: string;
  /** Optional highlighted message shown in green below the subtitle. */
  highlight?: string;
};

/**
 * Dashboard shell layout component.
 *
 * Wraps page content with a persistent header (logo, role, email, logout)
 * and renders the child content in a centered card. Used by the customer
 * and support role-selection dashboards.
 */
export default function DashboardShell({ email, role, title, subtitle, highlight }: Props) {
  const router = useRouter();

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {}
    router.push("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <header style={{ background: "#ffffff", padding: "0 20px" }}>
        <Flex justify="space-between" align="center" style={{ height: "100%" }}>
          <Image
            src="/sharpminds.png"
            alt="Sharp Minds"
            width={90}
            height={60}
            style={{ width: "100%", maxWidth: "100px", height: "auto" }}
          />
          <Flex gap="small" align="center">
            <Tag color={role === "Support" ? "geekblue" : "green"}>{role}</Tag>
            <span style={{ color: "#555", fontSize: 13 }}>{email}</span>
            <Button size="small" onClick={() => {
                router.push("/login");
              }}>
              Logout
            </Button>
          </Flex>
        </Flex>
      </header>

      <Flex
        justify="center"
        align="center"
        style={{ minHeight: "calc(100vh - 70px)", padding: "20px" }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "640px",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "#0f2c74",
              marginTop: 8,
              marginBottom: 8,
              fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)",
            }}
          >
            {title}
          </h1>
          <div
            style={{
              width: "80px",
              height: "4px",
              background: "#52c41a",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#666", marginBottom: 8 }}>{subtitle}</p>
          {highlight && (
            <p style={{ color: "#389e0d", marginBottom: 0 }}>
              {highlight}
            </p>
          )}
        </Card>
      </Flex>
    </div>
  );
}