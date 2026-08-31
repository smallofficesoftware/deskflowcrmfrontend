import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useWhatsappTemplateModal } from "../../../hooks/useWhatsappTemplateModal";
import WhatsappPreview from "./components/WhatsappPreview";
import VariableRow from "./components/VariableRow";
import s from "../../../style/WhatsappTemplateSender.module.css";
import type { WhatsAppTemplateModalProps } from "./types/windex";
import {
  templateHasAttachment,
  getTemplateHeaderFormat,
  type AttachmentFormat,
} from "./types/windex";
import CustomSearchDropdown from "../../CustomSearchDropdown";
import AttachmentVariableRow from "./components/Attachmentvariablerow";

const WhatsappTemplateSenderPreviewModal: React.FC<
  WhatsAppTemplateModalProps
> = (props) => {
  const { show, onHide, displayModule } = props;
  const ctrl = useWhatsappTemplateModal(props);

  const {
    selectedTemplate,
    variables,
    quickFillVars,
    savedConfig,
    availableVariables,
    attachmentVariables,
    attachmentVariableKey,
    attachmentUrl,
    attachmentSourceType, // NEW
    staticAttachmentFileName, // NEW
    templateOptions,
    templateOptionSelected,
    isContextNull,
    loading,
    isFormDisabled,
    saveAsDefault,
    setSaveAsDefault,
    handleTemplateChange,
    handleQuickFill,
    handleVariableChange,
    handleAttachmentVariableChange,
    handleAttachmentSourceChange, // NEW
    handleStaticAttachmentUpload, // NEW
    handleRemoveStaticAttachment, // NEW
    handleSaveConfigOnly,
    handleSend,
    handleClearCache,
  } = ctrl;

  if (!show) return null;

  const variableIndices = Object.keys(variables).map(Number);

  const hasAttachment = selectedTemplate
    ? templateHasAttachment(selectedTemplate)
    : false;
  const headerFormat = selectedTemplate
    ? (getTemplateHeaderFormat(selectedTemplate) as AttachmentFormat | null)
    : null;

  // Attachment is "configured" if either a variable key OR a static URL is set
  const hasAttachmentConfig =
    attachmentSourceType === "static"
      ? !!attachmentUrl
      : !!attachmentVariableKey;
  const hasMappings =
    Object.keys(quickFillVars).length > 0 || hasAttachmentConfig;

  // An IMAGE/VIDEO/DOCUMENT template needs its attachment resolved too -
  // previously this only checked the text {{n}} variables, so Save stayed
  // enabled with no image/video/document chosen at all (either source:
  // static upload or a dynamic variable, either is fine, just not neither).
  const allFilled =
    variableIndices.every((i) => variables[i]?.trim() !== "") &&
    (!hasAttachment || hasAttachmentConfig);

  return (
    <div className={s.moduleRoot}>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        /*  onClick={(e) =>
          e.target === e.currentTarget && !isFormDisabled && onHide()
        } */
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${s.modalDialog}`}
        >
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: 12 }}
          >
            {/* ── Loading overlay ──────────────────────────── */}
            {isFormDisabled && (
              <div className={s.loadingOverlay}>
                <div
                  className="spinner-border"
                  style={{
                    color: "var(--wts-green-dark)",
                    width: "2rem",
                    height: "2rem",
                  }}
                />
                <p>
                  {loading.sending
                    ? "Sending template…"
                    : loading.savingConfig
                      ? "Saving configuration…"
                      : loading.uploadingAttachment
                        ? "Uploading attachment…"
                        : "Loading…"}
                </p>
              </div>
            )}

            {/* ── Modal Header ─────────────────────────────── */}
            <div className={`modal-header ${s.modalHeader}`}>
              <div>
                <div className={s.modalTitle}>
                  <i className={`bi bi-whatsapp ${s.waIcon}`} />
                  WhatsApp Template
                  {savedConfig && (
                    <span
                      className="badge ms-2"
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                      }}
                    >
                      <i className="bi bi-check-circle me-1" />
                      Saved Config
                    </span>
                  )}
                </div>
                <div className={s.modalSubtitle}>{displayModule}</div>
              </div>

              <div className={s.headerActions}>
                <button
                  className={s.btnClearCache}
                  onClick={handleClearCache}
                  disabled={isFormDisabled}
                  title="Clear cached variable values"
                >
                  <i className="bi bi-arrow-clockwise me-1" />
                  Refresh
                </button>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={onHide}
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            {/* ── Modal Body ───────────────────────────────── */}
            <div className="modal-body p-3">
              <div className="row g-3">
                {/* ── LEFT PANEL ──────────────────────────── */}
                <div className="col-lg-8">
                  {/* Config-only banner */}
                  {isContextNull && (
                    <div className={s.modeBanner}>
                      <i className="bi bi-info-circle-fill" />
                      <div>
                        <strong>Configuration Mode</strong> — No target context
                        provided. Send is disabled. Configure mappings, preview
                        with demo values, and save.
                      </div>
                    </div>
                  )}

                  {/* ── Section 1: Template Selection ─────── */}
                  <div className={s.sectionCard}>
                    <div className={s.sectionLabel}>
                      <i className="bi bi-layout-text-window" />
                      Template Selection
                    </div>

                    <div className="row align-items-end g-3">
                      <div className="col-md-7">
                        <label className="form-label small fw-semibold mb-1">
                          Select Template
                        </label>
                        {loading.templates ? (
                          <Skeleton height={38} borderRadius={6} />
                        ) : (
                          <CustomSearchDropdown
                            options={templateOptions}
                            value={templateOptionSelected}
                            onChange={(selected: any) =>
                              handleTemplateChange(selected?.value)
                            }
                            className="w-100"
                            placeholder="Search and select template…"
                            isDisabled={isFormDisabled}
                          />
                        )}
                      </div>

                      {selectedTemplate && (
                        <div className="col-md-5">
                          <div className="d-flex flex-wrap gap-1 pt-1">
                            <span className={s.templateDetailPill}>
                              <i className="bi bi-tag" />
                              {selectedTemplate.category}
                            </span>
                            <span className={s.templateDetailPill}>
                              <i className="bi bi-translate" />
                              {selectedTemplate.language}
                            </span>
                            <span
                              className={s.templateDetailPill}
                              style={{
                                background:
                                  selectedTemplate.status === "APPROVED"
                                    ? "#d1e7dd"
                                    : "#fff3cd",
                                color:
                                  selectedTemplate.status === "APPROVED"
                                    ? "#0a3622"
                                    : "#664d03",
                              }}
                            >
                              <i
                                className={`bi ${
                                  selectedTemplate.status === "APPROVED"
                                    ? "bi-check-circle"
                                    : "bi-clock"
                                }`}
                              />
                              {selectedTemplate.status}
                            </span>
                            {headerFormat && (
                              <span
                                className={s.templateDetailPill}
                                style={{
                                  background: "#e0d7ff",
                                  color: "#3b1fa3",
                                  borderColor: "#c4b5fd",
                                }}
                              >
                                <i
                                  className={`bi ${
                                    headerFormat === "IMAGE"
                                      ? "bi-image"
                                      : headerFormat === "VIDEO"
                                        ? "bi-camera-video"
                                        : "bi-file-earmark-pdf"
                                  }`}
                                />
                                {headerFormat}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Section 2: Attachment Variable ─────── */}
                  {/* Shown only when template header is IMAGE/DOCUMENT/VIDEO */}
                  {selectedTemplate && hasAttachment && headerFormat && (
                    <div className={s.sectionCard}>
                      <div className={s.sectionLabel}>
                        <i
                          className={`bi ${
                            headerFormat === "IMAGE"
                              ? "bi-image"
                              : headerFormat === "VIDEO"
                                ? "bi-camera-video"
                                : "bi-file-earmark-pdf"
                          }`}
                        />
                        Attachment Variable
                        {isContextNull && (
                          <span
                            className="ms-auto fw-normal"
                            style={{
                              fontSize: "0.68rem",
                              color: "#fd7e14",
                              textTransform: "none",
                            }}
                          >
                            <i className="bi bi-flask me-1" />
                            Demo mode
                          </span>
                        )}
                      </div>

                      {loading.savedConfig ? (
                        <Skeleton height={68} borderRadius={8} />
                      ) : (
                        <AttachmentVariableRow
                          headerFormat={headerFormat as AttachmentFormat}
                          attachmentVariableKey={attachmentVariableKey}
                          attachmentUrl={attachmentUrl}
                          attachmentVariables={attachmentVariables}
                          isDemoMode={isContextNull}
                          isFormDisabled={isFormDisabled}
                          onVariableChange={handleAttachmentVariableChange}
                          // NEW props
                          attachmentSourceType={attachmentSourceType}
                          staticAttachmentFileName={staticAttachmentFileName}
                          isUploading={loading.uploadingAttachment}
                          onSourceChange={handleAttachmentSourceChange}
                          onFileUpload={handleStaticAttachmentUpload}
                          onRemoveStatic={handleRemoveStaticAttachment}
                        />
                      )}
                    </div>
                  )}

                  {/* ── Section 3: Body Variable Mapping ────── */}
                  {variableIndices.length > 0 && (
                    <div className={s.sectionCard}>
                      <div className={s.sectionLabel}>
                        <i className="bi bi-braces-asterisk" />
                        Variable Mapping
                        {isContextNull && (
                          <span
                            className="ms-auto fw-normal"
                            style={{
                              fontSize: "0.68rem",
                              color: "#fd7e14",
                              textTransform: "none",
                            }}
                          >
                            <i className="bi bi-flask me-1" />
                            Demo values active
                          </span>
                        )}
                      </div>

                      <div className="row">
                        {loading.templates || loading.savedConfig
                          ? Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="col-xl-4 col-md-6 mb-3">
                                <Skeleton height={84} borderRadius={8} />
                              </div>
                            ))
                          : variableIndices.map((index) => (
                              <VariableRow
                                key={index}
                                index={index}
                                value={variables[index] ?? ""}
                                quickFillKey={quickFillVars[index] ?? ""}
                                availableVariables={availableVariables}
                                isDemoMode={isContextNull}
                                isLoadingVar={false}
                                isFormDisabled={isFormDisabled}
                                onValueChange={handleVariableChange}
                                onQuickFill={handleQuickFill}
                              />
                            ))}
                      </div>

                      {savedConfig && hasMappings && (
                        <div className={s.savedConfigBanner}>
                          <i className="bi bi-bookmark-check-fill" />
                          Configuration loaded from saved settings
                          <span
                            className="ms-1 text-muted"
                            style={{ fontSize: "0.68rem" }}
                          >
                            (Last saved:{" "}
                            {savedConfig.updatedAt
                              ? new Date(
                                  savedConfig.updatedAt,
                                ).toLocaleDateString()
                              : "—"}
                            )
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Section 4: Save Configuration ────────── */}
                  {selectedTemplate && (
                    <div className={s.sectionCard}>
                      <div className={s.sectionLabel}>
                        <i className="bi bi-floppy" />
                        Save Configuration
                      </div>

                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <button
                          className={s.btnSaveConfig}
                          onClick={handleSaveConfigOnly}
                          disabled={isFormDisabled || !hasMappings}
                          title={
                            !hasMappings
                              ? "Map at least one variable first"
                              : undefined
                          }
                        >
                          {loading.savingConfig ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <i className="bi bi-floppy me-2" />
                              Save Config for {displayModule}
                            </>
                          )}
                        </button>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Save variable mappings so they auto-load next time.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── RIGHT PANEL: Preview ─────────────────── */}
                <div className="col-lg-4">
                  <div className={s.previewPanel}>
                    <div className={s.previewLabel}>
                      <i className="bi bi-phone me-1" />
                      Real-time Preview
                    </div>
                    <WhatsappPreview
                      template={selectedTemplate}
                      variables={variables}
                      loading={loading.templates}
                      attachmentUrl={attachmentUrl}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Modal Footer ─────────────────────────────── */}
            <div className={`modal-footer ${s.modalFooter}`}>
              {!isContextNull && selectedTemplate && hasMappings && (
                <div className="form-check me-auto">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="wts-saveOnSend"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    disabled={isFormDisabled}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="wts-saveOnSend"
                  >
                    Save config on send
                  </label>
                </div>
              )}

              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={onHide}
                disabled={isFormDisabled}
              >
                Cancel
              </button>

              {isContextNull ? (
                <div className={s.btnSendDisabledTooltip}>
                  <i className="bi bi-lock-fill" />
                  Send disabled — no context
                </div>
              ) : (
                <button
                  type="button"
                  className={s.btnSend}
                  onClick={handleSend}
                  disabled={!allFilled || isFormDisabled || !selectedTemplate}
                  title={
                    !allFilled
                      ? hasAttachment && !hasAttachmentConfig
                        ? "Choose an image/video/document (upload one or pick a variable) to send"
                        : "Fill all variable values to send"
                      : undefined
                  }
                >
                  {loading.sending ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-whatsapp" />
                      Send Template
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappTemplateSenderPreviewModal;
