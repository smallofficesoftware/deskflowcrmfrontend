// ============================================================
// components/AttachmentVariableRow.tsx
// ADDITION: "Upload your own (static)" option added to the dropdown.
//   - Dropdown now has: [Select source] / [variable options...] / [Upload your own]
//   - When "Upload your own" selected → shows file input + upload button
//   - Existing variable-mapping behavior fully preserved
// ============================================================

import React, { useRef } from "react";
import type {
  VariableConfig,
  AttachmentFormat,
  AttachmentSourceType,
} from "../types/windex";
import {
  ATTACHMENT_ACCEPT_MAP,
  STATIC_ATTACHMENT_OPTION_VALUE,
} from "../types/windex";
import s from "../../../../style/WhatsappTemplateSender.module.css";

interface Props {
  headerFormat: AttachmentFormat;
  attachmentVariableKey: string;
  attachmentUrl: string;
  attachmentVariables: VariableConfig[];
  isDemoMode: boolean;
  isFormDisabled: boolean;
  onVariableChange: (variableKey: string) => void;

  // NEW props for static upload
  attachmentSourceType: AttachmentSourceType; // "variable" | "static"
  staticAttachmentFileName: string;
  isUploading: boolean;
  onSourceChange: (sourceType: AttachmentSourceType) => void;
  onFileUpload: (file: File) => void;
  onRemoveStatic: () => void;
}

const FORMAT_META: Record<
  AttachmentFormat,
  { icon: string; label: string; accept: string }
> = {
  IMAGE: {
    icon: "bi-image",
    label: "Image Attachment",
    accept: "JPG, PNG, WebP",
  },
  DOCUMENT: {
    icon: "bi-file-earmark-pdf",
    label: "Document Attachment",
    accept: "PDF, DOCX",
  },
  VIDEO: {
    icon: "bi-camera-video",
    label: "Video Attachment",
    accept: "MP4, 3GP",
  },
};

const AttachmentVariableRow: React.FC<Props> = ({
  headerFormat,
  attachmentVariableKey,
  attachmentUrl,
  attachmentVariables,
  isDemoMode,
  isFormDisabled,
  onVariableChange,
  attachmentSourceType,
  staticAttachmentFileName,
  isUploading,
  onSourceChange,
  onFileUpload,
  onRemoveStatic,
}) => {
  const meta = FORMAT_META[headerFormat];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown's current value reflects either the variable key OR the static sentinel
  const dropdownValue =
    attachmentSourceType === "static"
      ? STATIC_ATTACHMENT_OPTION_VALUE
      : attachmentVariableKey;

  const handleDropdownChange = (value: string) => {
    if (value === STATIC_ATTACHMENT_OPTION_VALUE) {
      onSourceChange("static");
      return;
    }
    onSourceChange("variable");
    onVariableChange(value);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    // Reset input so the same file can be re-selected later if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={s.attachmentSection}>
      <div className={s.attachmentSectionLabel}>
        <i className={`bi ${meta.icon}`} />
        {meta.label}
        <span className={s.attachmentFormatBadge}>{meta.accept}</span>
        {isDemoMode && (
          <span className={s.variableDemoBadge} style={{ marginLeft: "auto" }}>
            Demo
          </span>
        )}
      </div>

      <div className="row align-items-center g-2">
        {/* Source selector dropdown */}
        <div className="col-md-5">
          <label className="form-label small text-muted mb-1">
            Attachment source
          </label>
          <select
            className={`form-select form-select-sm ${s.quickFillSelect}`}
            style={{ maxWidth: "100%" }}
            value={dropdownValue}
            onChange={(e) => handleDropdownChange(e.target.value)}
            disabled={isFormDisabled}
          >
            <option value="">— Select attachment source —</option>

            {attachmentVariables.length > 0 && (
              <optgroup label="Dynamic (fetched per send)">
                {attachmentVariables.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Static">
              {/* NEW: static upload option */}
              <option value={STATIC_ATTACHMENT_OPTION_VALUE}>
                📎 Upload your own (static file)
              </option>
            </optgroup>
          </select>
        </div>

        {/* Right side: either resolved URL preview OR upload control */}
        <div className="col-md-7">
          {attachmentSourceType === "static" ? (
            <>
              <label className="form-label small text-muted mb-1">
                Uploaded file{" "}
                <span className="text-muted" style={{ fontSize: "0.68rem" }}>
                  (same file used for every send)
                </span>
              </label>

              {attachmentUrl ? (
                <div className={s.attachmentUploadedBox}>
                  <i className="bi bi-paperclip me-1" />
                  <span
                    className="text-truncate"
                    style={{ flex: 1, fontSize: "0.78rem" }}
                    title={staticAttachmentFileName || attachmentUrl}
                  >
                    {staticAttachmentFileName || attachmentUrl}
                  </span>
                  <button
                    type="button"
                    className={s.btnRemoveAttachment}
                    onClick={onRemoveStatic}
                    disabled={isFormDisabled}
                    title="Remove and choose a different file"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              ) : (
                <div className={s.attachmentUploadBox}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ATTACHMENT_ACCEPT_MAP[headerFormat]}
                    onChange={handleFileSelected}
                    disabled={isFormDisabled || isUploading}
                    className={s.attachmentFileInput}
                    id="wts-static-attachment-input"
                  />
                  <label
                    htmlFor="wts-static-attachment-input"
                    className={s.attachmentUploadLabel}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2" />
                        Choose {meta.accept} file to upload
                      </>
                    )}
                  </label>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="form-label small text-muted mb-1">
                Resolved URL{" "}
                {isDemoMode && <span className="text-warning">(demo)</span>}
              </label>
              <div className={s.attachmentUrlPreview}>
                {attachmentUrl ? (
                  <>
                    <i className="bi bi-link-45deg text-success me-1" />
                    <span
                      className="text-truncate"
                      style={{
                        maxWidth: "calc(100% - 20px)",
                        fontSize: "0.78rem",
                      }}
                      title={attachmentUrl}
                    >
                      {attachmentUrl}
                    </span>
                  </>
                ) : (
                  <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-dash-circle me-1" />
                    No URL resolved yet — select a field above
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentVariableRow;
