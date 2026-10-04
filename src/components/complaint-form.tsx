/**
 * @fileoverview Complaint registration form.
 * Provides fields for title, description, module, feature, and file attachments.
 * Validates input (word limits, file types/sizes) and dispatches the
 * createComplaint action on submission. Redirects to the complaints list
 * on success.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  App,
  Modal,
  Row, Col} from "antd";
import { InboxOutlined, PaperClipOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { createComplaint } from "@/src/store/slices/complaintSlice";
import {
  MODULES,
  FEATURES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
  MAX_VIDEO_SIZE_BYTES,
  MAX_FILES,
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  VIDEO_MIME_TYPES,
  VIDEO_EXTENSIONS,
} from "@/src/config/complaintConfig";

/** Form field values submitted when registering a new complaint. */
type ComplaintFormValues = {
  title: string;
  description: string;
  module: string;
  feature: string;
};

function ComplaintForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { message } = App.useApp();

  const [form] = Form.useForm<ComplaintFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  const { loading: creating } = useAppSelector(
    (state) => state.complaint
  );

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    let changed = false;
    fileList.forEach((file) => {
      if (!previewUrlsRef.current.has(file.uid) && file.originFileObj) {
        const url = URL.createObjectURL(file.originFileObj);
        previewUrlsRef.current.set(file.uid, url);
        changed = true;
      }
    });
    if (changed) {
      setPreviewUrls(new Map(previewUrlsRef.current));
    }
  }, [fileList]);

  const removePreview = (uid: string) => {
    const url = previewUrlsRef.current.get(uid);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(uid);
      setPreviewUrls((prev) => {
        const next = new Map(prev);
        next.delete(uid);
        return next;
      });
    }
  };
  

  const handleBeforeUpload = (file: File) => {
    const hasValidType =
      ALLOWED_FILE_TYPES.includes(file.type) ||
      ALLOWED_FILE_EXTENSIONS.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

    if (!hasValidType) {
      message.error("Only PDF, PNG, JPG, MP4, WebM, or MOV files are allowed.");
      return Upload.LIST_IGNORE;
    }

    const isVideo =
      VIDEO_MIME_TYPES.includes(file.type) ||
      VIDEO_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

    const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
    const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_FILE_SIZE_MB;

    if (file.size > maxSize) {
      message.error(`File must be ${maxSizeMB}MB or smaller.`);
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const onFinish = async (values: ComplaintFormValues) => {
    const attachments = fileList
      .map((f) => f.originFileObj as File)
      .filter(Boolean);

    const result = await dispatch(
      createComplaint({
        title: values.title,
        description: values.description,
        module: values.module,
        feature: values.feature,
        attachments,
      })
    );

    if (createComplaint.fulfilled.match(result)) {
      message.success(
        result.payload?.message || "Complaint registered successfully."
      );

      form.resetFields();
      setFileList([]);
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
      setPreviewUrls(new Map());

      setTimeout(() => {
        router.push("/complaints");
      }, 800);
    } else {
      message.error("Unable to register complaint. Please try again.");
    }
  };

  return (
    <div className="cmp-form-card">
      <h1 className="cmp-form-title">Register Complaint</h1>
      <p className="cmp-form-subtitle">
        Tell us about the issue and we will get back to you.
      </p>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={true}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Please enter a short title.",
            },
          ]}
        >
          <Input.TextArea
  placeholder="Write a short title"
  rows={2}
  showCount={{
    formatter: ({ count, maxLength }) =>
      `${count} / ${maxLength} characters`,
  }}
  maxLength={100}
  style={{ resize: "vertical", minHeight: 30 }}
/>
        </Form.Item>

        <Form.Item
  label="Description"
  name="description"
  rules={[
    {
      required: true,
      whitespace: true,
      message: "Please describe your issue.",
    },
    {
      validator: (_, value) => {
        if (!value) {
          return Promise.resolve();
        }

        const wordCount = value.trim().split(/\s+/).length;

        if (wordCount > 1000) {
          return Promise.reject(
            new Error("Description cannot exceed 1000 words.")
          );
        }

        return Promise.resolve();
      },
    },
  ]}
>
  <Input.TextArea
    placeholder="Describe your issue in detail..."
    rows={5}
    maxLength={5000}
    showCount={{
      formatter: ({ count }) => {
        const val = form.getFieldValue("description") || "";
        const words = val.trim() ? val.trim().split(/\s+/).length : 0;
        return `${words} / 1000 words`;
      },
    }}
    style={{ resize: "vertical", minHeight: 120 }}
  />
</Form.Item>

        <Row gutter={16}>
  <Col xs={24} md={12}>
        <Form.Item
          label="Module"
          name="module"
          rules={[
            {
              required: true,
              message: "Please select a module.",
            },
          ]}
        >
          <Select
            placeholder="Select a module"
            size="large"
            options={MODULES.map((module) => ({
              label: module,
              value: module,
            }))}
          />
        </Form.Item></Col>

        <Col xs={24} md={12}>
    {/* Feature */}
  

        <Form.Item
          label="Feature"
          name="feature"
          rules={[
            {
              required: true,
              message: "Please select a feature.",
            },
          ]}
        >
          <Select
            placeholder="Select a feature"
            size="large"
            options={FEATURES.map((feature) => ({
              label: feature,
              value: feature,
            }))}
          />
        </Form.Item></Col></Row>

        <Form.Item label="File upload">
          <Upload.Dragger
            className="cmp-upload-dropzone"
            accept=".pdf,.png,.jpg,.jpeg,.mp4,.webm,.mov"
            multiple={true}
            maxCount={MAX_FILES}
            fileList={fileList}
            showUploadList={false}
            beforeUpload={handleBeforeUpload}
            onChange={(info) => {
              const currentUids = new Set(info.fileList.map((f) => f.uid));
              Array.from(previewUrlsRef.current.keys()).forEach((uid) => {
                if (!currentUids.has(uid)) {
                  removePreview(uid);
                }
              });
              setFileList(info.fileList);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: "#52c41a" }} />
            </p>
            <p className="ant-upload-text">
              <span className="cmp-upload-click">Click to upload</span> or drag
              and drop
            </p>
            <p className="ant-upload-hint">
              PDF, PNG, JPG up to {MAX_FILE_SIZE_MB}MB or MP4, WebM, MOV up to {MAX_VIDEO_SIZE_MB}MB — up to{" "}
              {MAX_FILES} files
            </p>
          </Upload.Dragger>
        </Form.Item>

        {fileList.length > 0 && (
          <div className="cmp-attachment-file-list">
            {fileList.map((file) => {
              const url = previewUrls.get(file.uid) ?? null;
              const isImage =
                file.type?.startsWith("image/") ||
                /\.(png|jpe?g|webp)$/i.test(file.name);
              const isVideo =
                file.type?.startsWith("video/") ||
                /\.(mp4|webm|mov)$/i.test(file.name);
              return (
                <div key={file.uid} className="cmp-attachment-file-row">
                  <PaperClipOutlined className="cmp-attachment-file-icon" />
                  <button
                    type="button"
                    className="cmp-attachment-file-link"
                    onClick={() => {
                      if (!url) return;
                      if (isImage || isVideo) {
                        setPreviewFile({ url, name: file.name });
                      } else {
                        window.open(url, "_blank");
                      }
                    }}
                  >
                    {file.name}
                  </button>
                  <button
                    type="button"
                    className="cmp-attachment-file-remove"
                    onClick={() => {
                      removePreview(file.uid);
                      setFileList((prev) =>
                        prev.filter((f) => f.uid !== file.uid)
                      );
                    }}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={!!previewFile}
          title={previewFile?.name}
          footer={null}
          onCancel={() => setPreviewFile(null)}
          centered
          width={520}
        >
          {previewFile && (
            previewFile.name.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={previewFile.url}
                controls
                style={{ width: "100%", borderRadius: 8 }}
              />
            ) : (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                style={{ width: "100%", borderRadius: 8 }}
              />
            )
          )}
        </Modal>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={creating}
          style={{ marginTop: 8 }}
        >
          Submit
        </Button>
      </Form>
    </div>
  );
}

export default ComplaintForm;