/**
 * @fileoverview Attachment viewer component for complaint file previews.
 * Renders a thumbnail grid of uploaded files and opens a preview modal
 * (inline image viewer, PDF iframe, or download fallback) when a thumbnail
 * is clicked.
 */

import React, { useState } from "react";
import { Modal } from "antd";
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

type Attachment = {
  /** Direct URL to the uploaded file. */
  fileUrl?: string;
  /** Original filename as uploaded by the user. */
  originalName?: string;
  /** MIME type of the file (e.g. "image/png", "application/pdf"). */
  fileType?: string;
};

type AttachmentViewerProps = {
  /** Array of attachment objects to display. */
  attachments: Attachment[];
};

function isImage(fileType?: string): boolean {
  return !!fileType && fileType.startsWith("image/");
}

function isVideo(fileType?: string): boolean {
  return !!fileType && fileType.startsWith("video/");
}

function isPdf(fileType?: string): boolean {
  return fileType === "application/pdf";
}

/**
 * Single attachment thumbnail card.
 *
 * Renders an image preview for image files, a PDF icon for PDFs, or a
 * generic file icon for unsupported types. Clicking the thumbnail invokes
 * the provided callback to open the preview modal.
 */
function AttachmentThumbnail({
  attachment,
  onClick,
}: {
  attachment: Attachment;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  if (!attachment.fileUrl) return null;

  if (isImage(attachment.fileType) && !imgError) {
    return (
      <div className="cmp-attachment-thumb cmp-attachment-image" onClick={onClick}>
        <img
          src={attachment.fileUrl}
          alt={attachment.originalName || "Attachment"}
          onError={() => setImgError(true)}
        />
        <div className="cmp-attachment-name">
          {attachment.originalName || "Image"}
        </div>
      </div>
    );
  }

  if (isPdf(attachment.fileType)) {
    return (
      <div className="cmp-attachment-thumb cmp-attachment-pdf" onClick={onClick}>
        <FilePdfOutlined style={{ fontSize: 40, color: "#ff4d4f" }} />
        <div className="cmp-attachment-name">
          {attachment.originalName || "PDF"}
        </div>
      </div>
    );
  }

  if (isVideo(attachment.fileType)) {
    return (
      <div className="cmp-attachment-thumb cmp-attachment-video" onClick={onClick}>
        <VideoCameraOutlined style={{ fontSize: 40, color: "#722ed1" }} />
        <div className="cmp-attachment-name">
          {attachment.originalName || "Video"}
        </div>
      </div>
    );
  }

  return (
    <div className="cmp-attachment-thumb cmp-attachment-file" onClick={onClick}>
      <FileImageOutlined style={{ fontSize: 40, color: "#8c8c8c" }} />
      <div className="cmp-attachment-name">
        {attachment.originalName || "File"}
      </div>
    </div>
  );
}

function AttachmentViewer({ attachments }: AttachmentViewerProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const current = previewIndex !== null ? attachments[previewIndex] : null;

  const handleDownload = () => {
    if (!current?.fileUrl) return;
    const link = document.createElement("a");
    link.href = current.fileUrl;
    link.download = current.originalName || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="cmp-attachments-grid">
        {attachments.map((att, idx) => (
          <AttachmentThumbnail
            key={idx}
            attachment={att}
            onClick={() => setPreviewIndex(idx)}
          />
        ))}
      </div>

      <Modal
        open={previewIndex !== null}
        onCancel={() => setPreviewIndex(null)}
        width={900}
        className="cmp-attachment-modal"
        destroyOnClose
        title={current?.originalName || "Preview"}
        footer={
          current?.fileUrl ? (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <a
                href={current.fileUrl}
                download={current.originalName || "download"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#52c41a", fontWeight: 600 }}
              >
                <DownloadOutlined /> Download
              </a>
            </div>
          ) : null
        }
      >
        {current && (
          <div className="cmp-attachment-preview">
            {isImage(current.fileType) ? (
              <img
                src={current.fileUrl}
                alt={current.originalName || "Attachment"}
                style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }}
              />
            ) : isVideo(current.fileType) ? (
              <video
                src={current.fileUrl}
                controls
                style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }}
              />
            ) : isPdf(current.fileType) ? (
              <iframe
                src={current.fileUrl}
                title={current.originalName || "PDF"}
                style={{
                  width: "100%",
                  height: "70vh",
                  border: "none",
                  borderRadius: 8,
                }}
              />
            ) : (
              <div className="cmp-attachment-unavailable">
                <p>Preview not available for this file type.</p>
                <a
                  href={current.fileUrl}
                  download={current.originalName || "download"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DownloadOutlined /> Download File
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default AttachmentViewer;
