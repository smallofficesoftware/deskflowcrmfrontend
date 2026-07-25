// ============================================================
// components/WhatsappPreview.tsx
// CHANGES:
//   - Full support for IMAGE / DOCUMENT / VIDEO / TEXT headers
//   - Footer rendering
//   - All button types (QUICK_REPLY, PHONE_NUMBER, URL)
//   - Attachment preview (shows placeholder when no URL yet)
// ============================================================

import React from "react";
import type { Template, VariableValueMap } from "../types/windex";
import {
  interpolateBodyText,
  getTemplateHeader,
  getTemplateFooter,
  getTemplateButtons,
} from "../../../../utils/TemplateUtils";
import { getTemplateHeaderFormat } from "../types/windex";
import s from "../../../../style/WhatsappTemplateSender.module.css";

interface Props {
  template: Template | null;
  variables: VariableValueMap;
  loading?: boolean;
  /** Resolved attachment URL (for IMAGE/DOCUMENT/VIDEO headers) */
  attachmentUrl?: string;
}

const WhatsappPreview: React.FC<Props> = ({
  template,
  variables,
  loading,
  attachmentUrl,
}) => {
  if (loading) {
    return (
      <div className={s.previewEmpty}>
        <div className="spinner-border text-secondary spinner-border-sm" />
        <span>Loading preview…</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className={s.previewEmpty}>
        <i className="bi bi-phone" />
        <span>Select a template to preview</span>
      </div>
    );
  }

  const headerFormat = getTemplateHeaderFormat(template);
  const headerText = getTemplateHeader(template);
  const bodyText = interpolateBodyText(template, variables);
  const footerText = getTemplateFooter(template);
  const buttons = getTemplateButtons(template);

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={s.whatsappDevice}>
      {/* Device header bar */}
      <div className={s.deviceStatusBar}>
        <div className={s.deviceAvatar}>B</div>
        <div className={s.deviceContactInfo}>
          <div className={s.deviceContactName}>Your Brand</div>
          <div className={s.deviceContactStatus}>Business Account</div>
        </div>
        <i
          className="bi bi-three-dots-vertical text-white opacity-75"
          style={{ fontSize: "1rem" }}
        />
      </div>

      {/* Chat area */}
      <div className={s.chatBg}>
        <div className={s.chatDateBadge}>
          <span>TODAY</span>
        </div>

        {/* Message bubble */}
        <div className={s.messageBubble}>
          {/* ── Header rendering — all types ─────────────── */}
          {headerFormat === "TEXT" && headerText && (
            <div className={s.messageHeader}>{headerText}</div>
          )}

          {headerFormat === "IMAGE" && (
            <div className={s.mediaHeader}>
              {attachmentUrl ? (
                <img
                  src={attachmentUrl}
                  alt="Template image"
                  className={s.mediaImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className={s.mediaPlaceholder}>
                  <i className="bi bi-image" />
                  <span>Image</span>
                </div>
              )}
            </div>
          )}

          {headerFormat === "VIDEO" && (
            <div className={s.mediaHeader}>
              {attachmentUrl ? (
                <video
                  src={attachmentUrl}
                  controls={false}
                  className={s.mediaImage}
                  preload="metadata"
                />
              ) : (
                <div className={s.mediaPlaceholder}>
                  <i className="bi bi-camera-video" />
                  <span>Video</span>
                </div>
              )}
              <div className={s.mediaPlayOverlay}>
                <i className="bi bi-play-circle-fill" />
              </div>
            </div>
          )}

          {headerFormat === "DOCUMENT" && (
            <div className={s.documentHeader}>
              <div className={s.documentIcon}>
                <i className="bi bi-file-earmark-pdf-fill" />
              </div>
              <div className={s.documentInfo}>
                <div className={s.documentName}>
                  {attachmentUrl
                    ? (attachmentUrl.split("/").pop()?.split("?")[0] ??
                      "Document")
                    : "Document"}
                </div>
                <div className={s.documentMeta}>
                  {attachmentUrl ? "PDF · Tap to open" : "Attachment pending"}
                </div>
              </div>
            </div>
          )}

          {/* ── Body ─────────────────────────────────────── */}
          <div className={s.messageBody}>{renderFormattedText(bodyText)}</div>

          {/* ── Footer ───────────────────────────────────── */}
          {footerText && <div className={s.messageFooter}>{footerText}</div>}

          {/* ── Timestamp ────────────────────────────────── */}
          <div className={s.messageTime}>{now} ✓✓</div>
          <div className={s.messageBubbleTail} />

          {/* ── Buttons ──────────────────────────────────── */}
          {buttons.length > 0 && (
            <div className={s.messageButtons}>
              {buttons.map((btn, i) => (
                <div key={i} className={s.messageButtonItem}>
                  {btn.type === "PHONE_NUMBER" && (
                    <i
                      className="bi bi-telephone me-1"
                      style={{ color: "#25d366" }}
                    />
                  )}
                  {btn.type === "URL" && (
                    <i
                      className="bi bi-box-arrow-up-right me-1"
                      style={{ color: "#00a5f4" }}
                    />
                  )}
                  {btn.type === "QUICK_REPLY" && (
                    <i
                      className="bi bi-reply me-1"
                      style={{ color: "#667781" }}
                    />
                  )}
                  {btn.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <div key={li}>
        {parts.map((part, pi) =>
          part.startsWith("*") && part.endsWith("*") ? (
            <strong key={pi}>{part.slice(1, -1)}</strong>
          ) : (
            <span key={pi}>{part}</span>
          ),
        )}
      </div>
    );
  });
}

export default WhatsappPreview;
