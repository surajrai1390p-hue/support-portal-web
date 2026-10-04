/**
 * @fileoverview User login page for the Customer Support Portal.
 * Rendered at route path `/login`.
 *
 * @description Provides a login form that accepts either a username or email
 * address along with a password. On successful authentication the user is
 * redirected to their role-specific dashboard (`/dashboard/support` for
 * Support roles, `/dashboard/customer` for all others). The form performs
 * client-side validation for email/username format and password strength.
 *
 * @see {@link route /login}
 */

import React from "react";
import { Form, Input, Button, Card, Flex, message } from "antd";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { loginUser, type LoginData } from "@/src/store/slices/authSlice";

/**
 * Login page component.
 *
 * Renders a header with navigation links, a decorative illustration, and an
 * Ant Design form for credential entry. Dispatches the `loginUser` Redux
 * thunk and routes to the appropriate dashboard on success.
 *
 * @returns {JSX.Element} The login page UI with form validation and error handling.
 */
function Login() {
  const router = useRouter();
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();
  const values = Form.useWatch([], form);
  const dispatch = useAppDispatch();

  const { loading } = useAppSelector((state) => state.auth);

  const allFieldsFilled = !!(values?.email && values?.password);

  const onFinish = async (values: LoginData) => {
    const identifier = values.email?.trim() || "";
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    const loginPayload: LoginData = {
      password: values.password,
      ...(isEmail ? { email: identifier } : { username: identifier }),
    };

    const result = await dispatch(loginUser(loginPayload));

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload?.data?.role || "Customer";

      messageApi.success(result.payload?.message || "Login successful");

      setTimeout(() => {
        router.push(
          role === "Support" ? "/dashboard/support" : "/dashboard/customer",
        );
      }, 600);
    } else {
      messageApi.error((result.payload as string) || "Login failed");
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
        style={{
          minHeight: "calc(100vh - 70px)",
          gap: "80px",
          padding: "40px",
        }}
      >
        <div>
          <Image
            src="/login-illstration.png"
            alt="Login"
            width={550}
            height={450}
            style={{ width: "100%", maxWidth: "550px", height: "auto" }}
          />
        </div>

        <Card style={{ width: "100%", maxWidth: "450px", borderRadius: 16 }}>
          <h1
            style={{
              textAlign: "center",
              fontSize: "clamp(2rem, 3vw, 4rem)",
              marginBottom: "15px",
              marginTop: "15px",
            }}
          >
            Login
          </h1>

          <div
            style={{
              width: "80px",
              height: "4px",
              background: "#52c41a",
              margin: "0 auto 30px",
            }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            validateTrigger="onSubmit"
          >
            <Form.Item
              label="Username / Email"
              name="email"
              rules={[
                {
                  pattern:
                    /^[a-zA-Z0-9_]{4,20}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid username or email!",
                },
              ]}
            >
              <Input placeholder="Enter your username or registered email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password!" },
                {
                  pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                  message:
                    "Password must contain at least 8 characters, including Min 1 uppercase, lowercase, number, and special character.",
                },
              ]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <Link href="/forgot-password" style={{ color: "#52c41a" }}>
                Forgot password?
              </Link>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                disabled={!allFieldsFilled}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Flex>
    </>
  );
}

export default Login;
