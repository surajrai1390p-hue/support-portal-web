/**
 * @fileoverview Multi-step password recovery page for the Customer Support Portal.
 * Rendered at route path `/forgot-password`.
 *
 * @description Guides the user through a two-step flow:
 * 1. **Email step** – the user enters a registered email address; the system
 *    verifies the email exists and sends a 6-digit OTP.
 * 2. **Verify & Reset step** – the user enters the OTP, verifies it, then
 *    sets and confirms a new password. Password strength is validated
 *    in real-time. On success the user is redirected to the login page.
 *
 * @see {@link route /forgot-password}
 */

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Flex, message, Steps, Alert } from "antd";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAppDispatch } from "@/src/store/hooks";

import {
  requestForgotOtp,
  verifyForgotOtp,
  resetForgotPassword,
  checkEmailRegistered,
} from "@/src/store/slices/authSlice";

/**
 * Forgot-password page component.
 *
 * Renders a stepped form (Ant Design Steps) that transitions between email
 * entry, OTP verification, and password reset. Manages local state for the
 * current step, OTP verification status, and loading indicators.
 *
 * @returns {JSX.Element} The multi-step forgot-password UI.
 */
function ForgotPassword() {
  const router = useRouter();
  const [emailForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useAppDispatch();

  const passwordValue = Form.useWatch("password", resetForm);
  const password = passwordValue ?? "";

  const passwordRequirements = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    length: password.length >= 8,
  };

  useEffect(() => {
    if (password && resetForm.getFieldValue("confirm")) {
      resetForm.validateFields(["confirm"]).catch(() => {});
    }
  }, [password, resetForm]);

  const [current, setCurrent] = useState(0);
  const [target, setTarget] = useState("");
  const [destination, setDestination] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const MAX_OTP_REQUESTS = 3;
  const COOLDOWN_SECONDS = 120;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /**
   * Validates the email exists, then dispatches an OTP request to the backend.
   * On success, advances the wizard to the verify-and-reset step.
   *
   * @param {{ email: string }} values - Form values containing the email address.
   * @returns {Promise<void>}
   */
  const requestOtp = async (values: { email: string }) => {
    try {
      setSending(true);

      // Check whether email is registered
      const check = await dispatch(
        checkEmailRegistered({
          method: "email",
          value: values.email.trim(),
        }),
      );

      if (!checkEmailRegistered.fulfilled.match(check)) {
        messageApi.error(
          (check.payload as string) ||
            "Unable to verify email. Please try again.",
        );
        return;
      }

      const exists = check.payload?.data?.exists ?? check.payload?.exists;

      if (exists !== true) {
        messageApi.error("Email is not registered.");
        return;
      }

      // Send OTP
      const result = await dispatch(
        requestForgotOtp({
          method: "email",
          value: values.email.trim(),
        }),
      );

      if (requestForgotOtp.fulfilled.match(result)) {
        setTarget(values.email.trim());

        setDestination(
          result.payload?.data?.destination ||
            result.payload?.destination ||
            values.email,
        );

        messageApi.success(result.payload?.message || "OTP sent successfully");

        setOtpRequestCount((prev) => prev + 1);
        setCooldown(COOLDOWN_SECONDS);
        setCurrent(1);
      } else {
        messageApi.error(
          (result.payload as string) || "Failed to send OTP. Please try again.",
        );
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      messageApi.error("Something went wrong while sending OTP.");
    } finally {
      setSending(false);
    }
  };
  /**
   * Resends the OTP to the same email address. Enforces a 2-minute cooldown
   * and a maximum of 3 OTP requests per session.
   */
  const resendOtp = async () => {
    if (!target || cooldown > 0 || otpRequestCount >= MAX_OTP_REQUESTS) return;

    try {
      setSending(true);

      const result = await dispatch(
        requestForgotOtp({
          method: "email",
          value: target,
        }),
      );

      if (requestForgotOtp.fulfilled.match(result)) {
        setDestination(
          result.payload?.data?.destination ||
            result.payload?.destination ||
            target,
        );
        messageApi.success(result.payload?.message || "OTP resent successfully");
        setOtpRequestCount((prev) => prev + 1);
        setCooldown(COOLDOWN_SECONDS);
        otpForm.resetFields();
      } else {
        messageApi.error(
          (result.payload as string) || "Failed to resend OTP. Please try again.",
        );
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      messageApi.error("Something went wrong while resending OTP.");
    } finally {
      setSending(false);
    }
  };

  /**
   * Submits the entered OTP for server-side verification. On success, marks
   * the OTP as verified and enables the password reset form.
   *
   * @returns {Promise<void>}
   */
  const verifyOtp = async () => {
    try {
      if (!target) {
        return;
      }

      // Read OTP directly from input fields to avoid form state sync issues
      const otpContainer = document.querySelector(".otp-container");
      const inputs = otpContainer?.querySelectorAll("input");
      if (!inputs || inputs.length === 0) return;
      const otp = Array.from(inputs).map((input) => input.value).join("");

      if (otp.length !== 6) {
        messageApi.error("Please enter the complete 6-digit OTP.");
        return;
      }

      setVerifying(true);

      const result = await dispatch(
        verifyForgotOtp({
          method: "email",
          value: target,
          otp,
        }),
      );

      setVerifying(false);

      if (verifyForgotOtp.fulfilled.match(result)) {
        setOtpVerified(true);
        resetForm.resetFields();

        messageApi.success(
          result.payload?.message || "OTP verified successfully.",
        );
      } else {
        messageApi.error(
          (result.payload as string) ||
            "Invalid or expired OTP. Please try again.",
        );
      }
    } catch {
      // form validation failed
    }
  };

  /**
   * Sends the new password to the backend along with the verified OTP and
   * target email. Redirects to `/login` on success.
   *
   * @param {{ password: string }} values - Form values containing the new password.
   * @returns {Promise<void>}
   */
  const submitReset = async (values: { password: string }) => {
    setResetting(true);

    const result = await dispatch(
      resetForgotPassword({
        method: "email",
        value: target,
        otp: otpForm.getFieldValue("otp") || "",
        newPassword: values.password,
      }),
    );

    setResetting(false);

    if (resetForgotPassword.fulfilled.match(result)) {
      messageApi.success(
        result.payload?.message || "Password reset successful. Please login.",
      );

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } else {
      messageApi.error(
        (result.payload as string) ||
          "Unable to reset password. Please try again.",
      );
    }
  };

  return (
    <>
      {contextHolder}
      <header style={{ background: "#ffffff", padding: "0 20px" }}>
        <Flex justify="space-between" align="center" style={{ height: "100%" }}>
          <Image
            src="/sharpminds.png"
            alt="Sharp Minds"
            width={90}
            height={60}
            style={{ width: "100%", maxWidth: "100px", height: "auto" }}
          />
          <Flex gap="small">
            <Button
              size="small"
              type="primary"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button size="small" onClick={() => router.push("/register")}>
              Register
            </Button>
          </Flex>
        </Flex>
      </header>

      <Flex
        justify="center"
        align="center"
        wrap="wrap"
        gap="40px"
        style={{ minHeight: "calc(100vh - 70px)", padding: "40px" }}


      >
        <div>
          <Image
            src="/forgot-password.png"
            alt="Forgot Password"
            width={550}
            height={450}
            style={{ width: "100%", maxWidth: "550px", height: "auto" }}
          />
        </div>

        <Card style={{ width: "100%", maxWidth: "500px", borderRadius: 16 }}>
          <h1
            style={{
              textAlign: "center",
              marginTop: "8px",
              marginBottom: "8px",
              color: "#0f2c74",
            }}
          >
            Recover Account
          </h1>
          <div
            style={{
              width: "80px",
              height: "4px",
              background: "#52c41a",
              margin: "0 auto 20px",
            }}
          />
          <p style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
            {current === 0
              ? "Enter your registered email to receive a recovery OTP."
              : "Verify the OTP sent to your email, then set a new password."}
          </p>

          <Steps
            size="small"
            current={current}
            items={[{ title: "Email" }, { title: "Verify & Reset" }]}
            style={{ marginBottom: 24 }}
          />

          {current === 0 ? (
            <Form form={emailForm} layout="vertical" onFinish={requestOtp}>
              <Form.Item
                label="Registered Email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Please enter your registered email",
                  },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter your registered email" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={sending}
                  disabled={
                    !emailForm.isFieldsTouched(true) ||
                    emailForm
                      .getFieldsError()
                      .some(({ errors }) => errors.length)
                  }
                >
                  Send OTP
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <>
              {otpVerified ? (
                <Alert
                  type="success"
                  showIcon
                  message="OTP verified. You can now set a new password."
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="Enter the OTP below and verify it to enable password reset."
                  style={{ marginBottom: 16 }}
                />
              )}

              {destination && (
                <div
                  style={{
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    color: "#389e0d",
                    padding: "8px 12px",
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  OTP sent to <b>{destination}</b>
                </div>
              )}

              <Form form={otpForm} layout="vertical">
                <Form.Item
                  label="OTP"
                  name="otp"
                  rules={[
                    { required: true, message: "Please enter the OTP" },
                  ]}
                >
                  <div className="otp-container">
                    <Input.OTP length={6} disabled={otpVerified} />
                  </div>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    block
                    loading={verifying}
                    disabled={otpVerified}
                    onClick={verifyOtp}
                  >
                    Verify OTP
                  </Button>
                </Form.Item>
              </Form>

              {!otpVerified && (
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  {otpRequestCount >= MAX_OTP_REQUESTS ? (
                    <span style={{ color: "#ff4d4f", fontSize: 13 }}>
                      Maximum OTP requests reached. Please try again later.
                    </span>
                  ) : cooldown > 0 ? (
                    <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                      Resend OTP in {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}
                    </span>
                  ) : (
                    <Button
                      type="link"
                      onClick={resendOtp}
                      loading={sending}
                      style={{ padding: 0, fontSize: 13 }}
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
              )}

              <Form
                form={resetForm}
                layout="vertical"
                onFinish={submitReset}
                style={{ marginTop: 8 }}
              >
                <Form.Item
                  label="New Password"
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter a new password",
                    },
                    
                  ]}
                >
                  <Input.Password
                    placeholder="Enter a new password"
                    disabled={!otpVerified}
                    autoComplete="new-password"
                  />
                </Form.Item>
                {password.length > 0 && (
                  <div
                    style={{
                      marginTop: "-15px",
                      marginBottom: "20px",
                      fontSize: "13px",
                      lineHeight: "1.8",
                    }}
                  >
                    <div
                      style={{
                        color: passwordRequirements.uppercase
                          ? "#52c41a"
                          : "#ff4d4f",
                      }}
                    >
                      {passwordRequirements.uppercase ? "✓" : "✗"} At least 1
                      uppercase letter
                    </div>

                    <div
                      style={{
                        color: passwordRequirements.lowercase
                          ? "#52c41a"
                          : "#ff4d4f",
                      }}
                    >
                      {passwordRequirements.lowercase ? "✓" : "✗"} At least 1
                      lowercase letter
                    </div>

                    <div
                      style={{
                        color: passwordRequirements.number
                          ? "#52c41a"
                          : "#ff4d4f",
                      }}
                    >
                      {passwordRequirements.number ? "✓" : "✗"} At least 1
                      number
                    </div>

                    <div
                      style={{
                        color: passwordRequirements.special
                          ? "#52c41a"
                          : "#ff4d4f",
                      }}
                    >
                      {passwordRequirements.special ? "✓" : "✗"} At least 1
                      special character
                    </div>

                    <div
                      style={{
                        color: passwordRequirements.length
                          ? "#52c41a"
                          : "#ff4d4f",
                      }}
                    >
                      {passwordRequirements.length ? "✓" : "✗"} Minimum 8
                      characters
                    </div>
                  </div>
                )}

                <Form.Item
                  label="Confirm Password"
                  name="confirm"
                  rules={[
                    {
                      required: true,
                      message: "Please confirm your password",
                    },
                    {
                      validator: (_, value) => {
                        if (
                          !value ||
                          value === resetForm.getFieldValue("password")
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match"),
                        );
                      },
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Re-enter the new password"
                    disabled={!otpVerified}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={resetting}
                    disabled={!otpVerified}
                  >
                    Reset Password
                  </Button>
                </Form.Item>
              </Form>

              <Button
                type="link"
                block
                onClick={() => {
                  setCurrent(0);
                  setOtpVerified(false);
                  otpForm.resetFields();
                  resetForm.resetFields();
                }}
              >
                Use a different email
              </Button>
            </>
          )}
        </Card>
      </Flex>
    </>
  );
}

export default ForgotPassword;
