/**
 * @fileoverview New user registration page for the Customer Support Portal.
 * Rendered at route path `/register`.
 *
 * @description Displays a registration form collecting full name, company
 * name, mobile number, email, and password. A username is auto-generated
 * from the full name on blur. The form enforces password strength rules
 * (uppercase, lowercase, digit, special character, minimum length) and
 * shows real-time validation feedback. On success the user is redirected
 * to the login page.
 *
 * @see {@link route /register}
 */

import React from "react";
import { Form, Input, Button, Card, Flex, message, Select } from "antd";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  registerUser,
  type RegistrationData,
} from "@/src/store/slices/authSlice";

/**
 * Registration page component.
 *
 * Renders a header, a decorative illustration, and an Ant Design form with
 * real-time password requirement indicators. Generates a username from the
 * entered full name and dispatches the `registerUser` Redux thunk on submit.
 *
 * @returns {JSX.Element} The registration page UI with inline validation.
 */
function Register() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [generatedUsername, setGeneratedUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const values = Form.useWatch([], form);

  const dispatch = useAppDispatch();

  const { loading } = useAppSelector((state) => state.auth);

  const isFormFilled = !!(
    values?.fullName &&
    values?.companyName &&
    values?.mobile &&
    values?.email &&
    values?.password
  );
  const passwordRequirements = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    length: password.length >= 8,
  };

  /**
   * Generates a candidate username from a full name by lowercasing,
   * replacing spaces with underscores, and appending a random 4-digit number.
   *
   * @param {string} fullName - The user's full name (e.g. "John Doe").
   * @returns {string} A username string such as "john_doe4821".
   */
  const generateUsername = (fullName: string) => {
    const name = fullName.trim().toLowerCase().replace(/\s+/g, "_");

    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    return `${name}${randomNumber}`;
  };

  const onFinish = async (values: RegistrationData) => {
    const registrationData: RegistrationData = {
      ...values,
      Username: generatedUsername,
    };

    const result = await dispatch(registerUser(registrationData));

    if (registerUser.fulfilled.match(result)) {
      form.resetFields();
      setGeneratedUsername("");

      messageApi.success(result.payload?.message || "Registration successful!");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      messageApi.error((result.payload as string) || "Registration failed");
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
              onClick={() => {
                router.push("/login");
              }}
            >
              Login
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                router.push("/register");
              }}
            >
              {" "}
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
          minHeight: "calc(100vh -70px)",
          gap: "80px",
          padding: "40px",
        }}
      >
        <div>
          <Image
            src="/register-illustartion.png"
            alt="Register"
            width={550}
            height={400}
            style={{ width: "100%", maxWidth: "550px", height: "auto" }}
          />
        </div>

        <Card
          style={{
            width: "100%",
            maxWidth: "450px",
            borderRadius: 16,
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "clamp(2rem, 3vw, 4rem)",
              marginBottom: "15px",
              marginTop: "15px",
            }}
          >
            Register
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
              label="Full Name"
              name="fullName"
              rules={[
                {
                  required: true,
                  message: "Please enter your Full Name!",
                },
                {
                  pattern: /^[a-zA-Z ]+$/,
                  message: "Full name should contain only letters and spaces.",
                },
              ]}
            >
              <Input
                placeholder="Enter your Full Name"
                onKeyPress={(e) => {
                  if (!/[a-zA-Z ]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  form.setFieldsValue({
                    fullName: e.target.value.replace(/[^a-zA-Z ]/g, ""),
                  });
                }}
                onBlur={() => {
                  const fullName = form.getFieldValue("fullName");

                  if (fullName && fullName.trim()) {
                    const username = generateUsername(fullName);
                    setGeneratedUsername(username);
                  }
                }}
              />
            </Form.Item>
            {generatedUsername && (
              <div
                style={{
                  marginTop: "-10px",
                  marginBottom: "20px",
                  color: "#52c41a",
                  fontSize: "14px",
                }}
              >
                Generated Username: <strong>{generatedUsername}</strong>
              </div>
            )}
            <Form.Item
              label="Company Name"
              name="companyName"
              rules={[
                {
                  required: true,
                  message: "Please enter your company name!",
                },
                {
                  pattern: /^[a-zA-Z ]+$/,
                  message:
                    "Company name should contain only letters and spaces.",
                },
              ]}
            >
              <Input placeholder="Enter your company name" />
            </Form.Item>

            <Form.Item
              label="Mobile Number"
              name="mobile"
              rules={[
                { required: true, message: "Please enter your mobile number!" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit mobile number!",
                },
              ]}
            >
              <Input
                placeholder="Mobile Number"
                maxLength={10}
                inputMode="numeric"
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input placeholder="Enter your email address" />
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
              <Input.Password
                placeholder="Enter a strong password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>
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
                  color: passwordRequirements.uppercase ? "#52c41a" : "#ff4d4f",
                }}
              >
                {passwordRequirements.uppercase ? "✓" : "✗"} At least 1
                uppercase letter
              </div>

              <div
                style={{
                  color: passwordRequirements.lowercase ? "#52c41a" : "#ff4d4f",
                }}
              >
                {passwordRequirements.lowercase ? "✓" : "✗"} At least 1
                lowercase letter
              </div>

              <div
                style={{
                  color: passwordRequirements.number ? "#52c41a" : "#ff4d4f",
                }}
              >
                {passwordRequirements.number ? "✓" : "✗"} At least 1 number
              </div>

              <div
                style={{
                  color: passwordRequirements.special ? "#52c41a" : "#ff4d4f",
                }}
              >
                {passwordRequirements.special ? "✓" : "✗"} At least 1 special
                character
              </div>

              <div
                style={{
                  color: passwordRequirements.length ? "#52c41a" : "#ff4d4f",
                }}
              >
                {passwordRequirements.length ? "✓" : "✗"} Minimum 8 characters
              </div>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                disabled={!isFormFilled}
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

export default Register;
