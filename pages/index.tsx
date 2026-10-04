/**
 * @fileoverview Landing / home page for the Customer Support Portal.
 * Rendered at route path `/`.
 *
 * @description Displays the Sharp Minds branding, a welcome heading, a brief
 * description of the portal's capabilities, and two call-to-action buttons
 * (Register and Login) that navigate to their respective auth pages.
 *
 * @see {@link route /}
 */

import { Button, Flex } from "antd";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "@/styles/Home.module.css";

/**
 * Home / landing page component.
 *
 * Renders a centered card with the company logo, welcome text, and navigation
 * buttons to the Register and Login pages.
 *
 * @returns {JSX.Element} The public-facing landing page UI.
 */
export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Image
          src="/sharpminds.png"
          alt="Sharp Minds"
          width={180}
          height={90}
          style={{
            width: "180px",
            height: "auto",
          }}
        />

        <h1 className={styles.title}>
          Welcome to
          <br />
          Customer Support Portal
        </h1>

        <p className={styles.subtitle}>
          Manage support requests, track ticket status and
          receive timely updates from our support team.
        </p>

        <Flex justify="center" gap="middle">
          <Button
            type="primary"
            size="large"
            style={{
              background: "#52c41a",
              borderColor: "#52c41a",
              minWidth: "140px",
            }}
            onClick={() => router.push("/register")}
          >
            Register
          </Button>

          <Button
            size="large"
            style={{ minWidth: "140px" }}
            onClick={() => router.push("/login")}
          >
            Login
          </Button>
        </Flex>
      </div>
    </div>
  );
}