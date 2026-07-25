// ─────────────────────────────────────────────────────────────────────────────
// CampaignModal.tsx  (v3 — 3 bugs fixed)
//
// FIX SUMMARY:
//   #1  Generate Excel now receives variableMapping (Step-3 state) — NOT the
//       parent's templateVariables prop. RecipientSelector prop renamed to
//       `variableMapping: VariableMapping`.
//
//   #2  Launch / send now correctly passes `excel_token` in the payload.
//       The backend uses this token to retrieve the pre-generated Excel binary
//       and extract contacts. No file binary is sent from the frontend.
//
//   #3  Template preview now resolves field keys → human labels from
//       predefinedFields (e.g. "customer_name" → "Customer Name") and
//       colours substituted values distinctly in the WA bubble.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import type {
  Template,
  VariableMapping,
  RecipientMode,
  RecipientData,
  SpecificContactsData,
  ExportExcelData,
  CampaignModalProps,
  StepConfig,
  FieldOption,
} from "./campaign.types";
import { getCampaignService } from "./campaign.service";
import {
  extractVariableIndices,
  buildPreviewText,
  buildPreviewHeader,
  initVariableMapping,
} from "./campaign.utils";
import RecipientSelector from "./RecipientSelector";

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { id: 1, key: "general", label: "General Information" },
  { id: 2, key: "whatsapp", label: "WhatsApp Settings" },
  { id: 3, key: "mapping", label: "Data Mapping" },
  { id: 4, key: "audience", label: "Audience" },
  { id: 5, key: "timeline", label: "Timeline" },
];

const DEFAULT_FIELDS: FieldOption[] = [
  { label: "Customer Name", value: "sn_customer_name" },
  { label: "Company Name", value: "sn_company_name" },
  { label: "Mobile", value: "sn_mobile" },
  { label: "City", value: "sn_city" },
  { label: "Email", value: "sn_email" },
  { label: "Client Code", value: "sn_client_code" },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ current }: { current: number }) {
  return (
    <div className="campaign-sidebar">
      {STEPS.map((s) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div
            key={s.id}
            className={`sidebar-step${active ? " active" : ""}${done ? " done" : ""}`}
          >
            <div className="step-indicator">
              {done ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7L5.5 10.5L12 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span>{s.id}</span>
              )}
            </div>
            <div className="step-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────
//
// FIX #3: preview now renders with proper label resolution.
// Substituted values shown in a green pill inside the bubble.
// Buttons component rendered below the bubble if present.

function WAPreview({
  template,
  mapping,
  fields,
}: {
  template: Template | null;
  mapping: VariableMapping;
  fields: FieldOption[];
}) {
  if (!template) {
    return (
      <div className="wa-preview-phone">
        <div className="wa-phone-shell wa-phone-empty">
          <div className="wa-empty-hint">Select a template to preview</div>
        </div>
      </div>
    );
  }

  // FIX #3 — use fields for label resolution in both header & body
  const rawHeaderText = buildPreviewHeader(
    template.components,
    mapping,
    fields,
  );
  const rawBodyText = buildPreviewText(template.components, mapping, fields);

  const footer = template.components.find((c) => c.type === "FOOTER");
  const buttons = template.components.find((c) => c.type === "BUTTONS");
  const header = template.components.find((c) => c.type === "HEADER");

  /**
   * Render body text with «resolved_value» markers highlighted in green.
   * Splits on «...» markers and colours them.
   */
  const renderHighlighted = (text: string) => {
    if (!text)
      return <span className="wa-placeholder">Preview will appear here…</span>;
    const parts = text.split(/(«[^»]+»)/g);
    return (
      <>
        {parts.map((part, i) =>
          part.startsWith("«") && part.endsWith("»") ? (
            <span key={i} className="wa-var-highlight">
              {part.slice(1, -1)}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    );
  };

  return (
    <div className="wa-preview-phone">
      <div className="wa-phone-shell">
        {/* Status bar */}
        <div className="wa-status-bar">
          <span>9:41</span>
          <span>▐▐▐ ▲ ▓</span>
        </div>

        {/* Header bar */}
        <div className="wa-header-bar">
          <div className="wa-back-btn">‹</div>
          <div className="wa-avatar">YB</div>
          <div className="wa-contact-info">
            <div className="wa-contact-name">Your Brand</div>
            <div className="wa-contact-sub">Business Account</div>
          </div>
          <div className="wa-header-actions">⋮</div>
        </div>

        {/* Chat area */}
        <div className="wa-chat-bg">
          <div className="wa-date-chip">TODAY</div>
          <div className="wa-bubble-wrap">
            <div className="wa-bubble">
              {/* HEADER — image/video placeholder or text */}
              {header?.format && header.format !== "TEXT" && (
                <div
                  className={`wa-media-placeholder wa-media-${header.format.toLowerCase()}`}
                >
                  {header.format === "IMAGE" && "🖼 Image"}
                  {header.format === "VIDEO" && "▶ Video"}
                  {header.format === "DOCUMENT" && "📄 Document"}
                </div>
              )}
              {header?.format === "TEXT" && rawHeaderText && (
                <div className="wa-bubble-header">
                  {renderHighlighted(rawHeaderText)}
                </div>
              )}
              {!header?.format && header?.text && (
                <div className="wa-bubble-header">
                  {renderHighlighted(rawHeaderText || header.text)}
                </div>
              )}

              {/* BODY */}
              <div className="wa-bubble-body">
                {renderHighlighted(rawBodyText)}
              </div>

              {/* FOOTER */}
              {footer?.text && (
                <div className="wa-bubble-footer">{footer.text}</div>
              )}

              {/* Timestamp */}
              <div className="wa-bubble-time">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" ✓✓"}
              </div>
            </div>

            {/* BUTTONS */}
            {buttons?.buttons && buttons.buttons.length > 0 && (
              <div className="wa-buttons">
                {buttons.buttons.map((btn, i) => (
                  <div key={i} className="wa-btn">
                    {btn.type === "PHONE_NUMBER" && "📞 "}
                    {btn.type === "URL" && "🔗 "}
                    {btn.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="wa-preview-legend">
        <span
          className="wa-var-highlight"
          style={{ fontSize: "0.65rem", padding: "1px 5px" }}
        >
          value
        </span>
        {" = mapped variable"}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CampaignModal({
  show,
  onHide,
  whereParams = {},
  templateVariables = {},
  predefinedFields = DEFAULT_FIELDS,
  onSuccess,
}: CampaignModalProps) {
  const service = useMemo(() => getCampaignService(), []);

  // ── Wizard state ────────────────────────────────────────────────────────

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [hasTemplateVariables, setHasTemplateVariables] = useState(false);

  // Step 3 — variable mapping configured by user
  const [variableMapping, setVariableMapping] = useState<VariableMapping>({});

  // Step 3 — document media (only when template HEADER format === "DOCUMENT")
  const [docMediaMode, setDocMediaMode] = useState<"network_url" | "upload">(
    "network_url",
  );
  const [docNetworkUrl, setDocNetworkUrl] = useState("");
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);
  const [docUploadedUrl, setDocUploadedUrl] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  // Step 4 — audience (default to export_excel)
  const [recipientMode, setRecipientMode] =
    useState<RecipientMode>("export_excel");
  const [recipientData, setRecipientData] = useState<RecipientData | null>(
    null,
  );

  // Step 5 — timeline
  const [sendMode, setSendMode] = useState<"immediate" | "scheduled">(
    "immediate",
  );
  const [scheduledAt, setScheduledAt] = useState("");

  // ── Derived ──────────────────────────────────────────────────────────────

  const variableIndices = useMemo(
    () =>
      selectedTemplate
        ? extractVariableIndices(selectedTemplate.components)
        : [],
    [selectedTemplate],
  );

  // ── Effects ──────────────────────────────────────────────────────────────

  // Reset all state when modal closes
  useEffect(() => {
    if (!show) {
      setStep(1);
      setCampaignName("");
      setDescription("");
      setSelectedTemplate(null);
      setVariableMapping({});
      setDocMediaMode("network_url");
      setDocNetworkUrl("");
      setDocUploadFile(null);
      setDocUploadedUrl("");
      setDocUploading(false);
      setRecipientMode("export_excel");
      setRecipientData(null);
      setSendMode("immediate");
      setScheduledAt("");
    }
  }, [show]);

  // Fetch templates when reaching step 2
  useEffect(() => {
    if (show && step === 2 && templates.length === 0) {
      setLoadingTemplates(true);
      service
        .fetchTemplates()
        .then(setTemplates)
        .catch((err: Error) => {
          toast.error(err.message);
          // Dev fallback
          setTemplates([
            {
              id: "1",
              name: "order_shipped",
              language: "en_US",
              category: "Marketing",
              status: "APPROVED",
              components: [
                {
                  type: "BODY",
                  text: "Hi {{1}}, your order {{2}} has been shipped! Expected: {{3}}.",
                },
                { type: "FOOTER", text: "Reply STOP to unsubscribe" },
                {
                  type: "BUTTONS",
                  buttons: [
                    { type: "QUICK_REPLY", text: "Track Order" },
                    {
                      type: "PHONE_NUMBER",
                      text: "Call Support",
                      phone_number: "+91-000-000-0000",
                    },
                  ],
                },
              ],
            },
            {
              id: "2",
              name: "cart_reminder",
              language: "en_US",
              category: "Marketing",
              status: "APPROVED",
              components: [
                { type: "HEADER", format: "IMAGE" },
                {
                  type: "BODY",
                  text: "Hey {{1}}! You left items in your cart. Use code {{2}} for 10% off. Total: ₹{{3}}",
                },
                {
                  type: "BUTTONS",
                  buttons: [
                    {
                      type: "URL",
                      text: "View Cart",
                      url: "https://example.com/cart",
                    },
                  ],
                },
              ],
            },
            {
              id: "3",
              name: "welcome_message",
              language: "en_US",
              category: "Utility",
              status: "APPROVED",
              components: [
                {
                  type: "HEADER",
                  format: "TEXT",
                  text: "Welcome to Our Store, {{1}}!",
                },
                {
                  type: "BODY",
                  text: "Hello {{1}}, welcome aboard! Your account at {{2}} is now active.",
                },
                { type: "FOOTER", text: "Need help? Reply to this message." },
              ],
            },
          ]);
        })
        .finally(() => setLoadingTemplates(false));
    }
  }, [show, step, templates.length, service]);

  // When template changes, reinitialise variable mapping.
  // FIX #1: pre-fill from parent's templateVariables as defaults (number keys → string keys).
  // FIX (v4): Also track whether the template has variables for validation in RecipientSelector.
  useEffect(() => {
    if (selectedTemplate) {
      const indices = extractVariableIndices(selectedTemplate.components);
      // Convert TemplateVariableConfig (number keys) → VariableMapping (string keys) for defaults
      const defaults: Record<number, string> = templateVariables;
      setVariableMapping(initVariableMapping(indices, defaults));

      // NEW: Set flag for whether template has variables
      setHasTemplateVariables(indices.length > 0);
    }
  }, [selectedTemplate, templateVariables]);

  // Derived: does selected template have a DOCUMENT header?
  const hasDocHeader = useMemo(
    () =>
      !!selectedTemplate?.components.find(
        (c) =>
          c.type === "HEADER" &&
          (c.format === "DOCUMENT" || c.format === "IMAGE"),
      ),
    [selectedTemplate],
  );

  // Upload handler for document media
  const handleDocUpload = async (file: File) => {
    setDocUploadFile(file);
    setDocUploading(true);
    setDocUploadedUrl("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const getUUID = localStorage.getItem("UUID");
      if (getUUID) formData.append("a_application_login_id", getUUID);
      const { data } = await (service as any).client.post(
        "/campaign/upload-media",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const url: string = data?.data?.url ?? data?.url ?? "";
      if (!url) throw new Error("No URL returned from upload");
      setDocUploadedUrl(url);
      toast.success("✅ Document uploaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Document upload failed",
      );
      setDocUploadFile(null);
    } finally {
      setDocUploading(false);
    }
  };

  // Resolve the final media_url to send in the campaign payload
  const resolvedMediaUrl = hasDocHeader
    ? docMediaMode === "network_url"
      ? docNetworkUrl.trim()
      : docUploadedUrl
    : undefined;

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (step === 1 && !campaignName.trim()) {
      toast.error("Campaign name is required");
      return false;
    }
    if (step === 2 && !selectedTemplate) {
      toast.error("Please select a WhatsApp template");
      return false;
    }
    if (step === 3 && hasDocHeader) {
      if (docMediaMode === "network_url" && !docNetworkUrl.trim()) {
        toast.error("Please enter a document network URL");
        return false;
      }
      if (docMediaMode === "upload" && !docUploadedUrl) {
        toast.error("Please upload a document file first");
        return false;
      }
    }
    if (step === 4) {
      if (recipientMode === "specific_contacts") {
        const d = recipientData as SpecificContactsData | null;
        if (!d?.contact_numbers?.length) {
          toast.error("Please add at least one contact number");
          return false;
        }
      }
      if (recipientMode === "export_excel") {
        const d = recipientData as ExportExcelData | null;
        if (!d?.excel_token) {
          toast.error("Please generate the Excel file first");
          return false;
        }
      }
    }
    if (step === 5 && sendMode === "scheduled" && !scheduledAt) {
      toast.error("Please select a scheduled date and time");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) setStep((s) => s + 1);
  };

  // ── Launch ────────────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    if (!validate() || !selectedTemplate) return;
    setSubmitting(true);

    try {
      const excelData =
        recipientData?.mode === "export_excel"
          ? (recipientData as ExportExcelData)
          : null;
      const specificData =
        recipientData?.mode === "specific_contacts"
          ? (recipientData as SpecificContactsData)
          : null;

      /**
       * FIX #2: Pass excel_token in the payload.
       * The backend uses this token to retrieve the pre-generated Excel file
       * and extract contacts for the WhatsApp campaign.
       * We do NOT send the download_url or a file binary from the frontend.
       */
      const getUUID = localStorage.getItem("UUID");
      const result = await service.sendCampaign({
        name: campaignName,
        description: description || undefined,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        language_code: selectedTemplate.language,
        variables_mapping: variableMapping,
        media_url: resolvedMediaUrl,
        recipient_type: recipientMode,
        contact_numbers: specificData?.contact_numbers,
        a_application_login_id: getUUID || "",
        excel_token: excelData?.excel_token, // ← FIX #2
        excel_download_url: excelData?.download_url, // ← FIX #2
        scheduled_at: sendMode === "scheduled" ? scheduledAt : undefined,
      });

      toast.success(
        `🚀 ${result.data.message ?? "Campaign launched successfully!"}`,
      );
      onSuccess?.(result);
      // onHide();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to launch campaign",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="cm-backdrop"
        // onClick={(e) => e.target === e.currentTarget && onHide()}
        role="dialog"
        aria-modal="true"
        aria-label="Create Campaign"
      >
        <div className="cm-modal">
          {/* Header */}
          <div className="cm-header">
            <div>
              <h2 className="cm-title">Create Campaign</h2>
              <p className="cm-subtitle">
                Follow the steps to launch your campaign.
              </p>
            </div>
            <button className="cm-close" onClick={onHide} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="cm-body">
            <Sidebar current={step} />

            <div className="cm-content">
              {/* ════ STEP 1 ════ */}
              {step === 1 && (
                <>
                  <div className="step-heading">
                    <h3>Campaign Information</h3>
                    <p>
                      Give your campaign an identifiable name to get started.
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Campaign Name <span className="req">*</span>
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Summer Sale Announcement"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Internal Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="What is the goal of this campaign?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* ════ STEP 2 — WhatsApp Settings ════ */}
              {step === 2 && (
                <>
                  <div className="step-heading">
                    <h3>WhatsApp Settings</h3>
                    <p>Choose the template for this campaign.</p>
                  </div>
                  <div className="two-col">
                    {/* Template list */}
                    <div>
                      {loadingTemplates ? (
                        <div className="template-grid">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="template-card">
                              <Skeleton
                                height={16}
                                width={60}
                                style={{ marginBottom: 8 }}
                              />
                              <Skeleton
                                height={14}
                                width={120}
                                style={{ marginBottom: 6 }}
                              />
                              <Skeleton count={2} height={12} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="template-grid">
                          {templates.map((t) => {
                            const isSelected = selectedTemplate?.id === t.id;
                            const bodyComp = t.components.find(
                              (c) => c.type === "BODY",
                            );
                            const headerComp = t.components.find(
                              (c) => c.type === "HEADER",
                            );
                            const hasButtons = t.components.some(
                              (c) => c.type === "BUTTONS",
                            );
                            return (
                              <div
                                key={t.id}
                                className={`template-card${isSelected ? " selected" : ""}`}
                                onClick={() => setSelectedTemplate(t)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && setSelectedTemplate(t)
                                }
                              >
                                {isSelected && (
                                  <div className="selected-check">
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 10 10"
                                      fill="none"
                                    >
                                      <path
                                        d="M1.5 5L4 7.5L8.5 2.5"
                                        stroke="white"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                )}
                                {/* Category + type badges */}
                                <div className="template-badges">
                                  <span
                                    className={`template-badge${t.category?.toLowerCase() === "utility" ? " utility" : ""}`}
                                  >
                                    {t.category || "Marketing"}
                                  </span>
                                  {headerComp?.format &&
                                    headerComp.format !== "TEXT" && (
                                      <span className="template-badge media">
                                        {headerComp.format === "IMAGE" &&
                                          "🖼 Image"}
                                        {headerComp.format === "VIDEO" &&
                                          "▶ Video"}
                                        {headerComp.format === "DOCUMENT" &&
                                          "📄 Doc"}
                                      </span>
                                    )}
                                  {hasButtons && (
                                    <span className="template-badge btn-badge">
                                      🔘 Buttons
                                    </span>
                                  )}
                                </div>
                                <div className="template-name">{t.name}</div>
                                <div className="template-preview">
                                  {bodyComp?.text ?? ""}
                                </div>
                                <div className="template-lang">
                                  {t.language}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* FIX #3: pass predefinedFields to WAPreview for label resolution */}
                    <WAPreview
                      template={selectedTemplate}
                      mapping={variableMapping}
                      fields={predefinedFields}
                    />
                  </div>
                </>
              )}

              {/* ════ STEP 3 — Data Mapping ════ */}
              {step === 3 && (
                <>
                  <div className="step-heading">
                    <h3>Data Mapping</h3>
                    <p>
                      Map each template variable to a CRM field or enter a
                      static value.
                    </p>
                  </div>

                  {variableIndices.length === 0 ? (
                    <div className="info-banner green">
                      ✅ This template has no variables to map.
                    </div>
                  ) : (
                    <>
                      <div className="var-table-head">
                        <span>Variable</span>
                        <span>Map to CRM Field</span>
                        <span>Or Static Value</span>
                      </div>

                      {variableIndices.map((v) => {
                        const key = String(v);
                        const currentVal = variableMapping[key] ?? "";
                        const isField = predefinedFields.some(
                          (f) => f.value === currentVal,
                        );
                        return (
                          <div key={v} className="var-row">
                            <div className="var-pill-label">
                              {"{{" + v + "}}"}
                            </div>

                            <select
                              className="form-control"
                              value={isField ? currentVal : "__none__"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariableMapping((prev) => ({
                                  ...prev,
                                  [key]: val === "__none__" ? "" : val,
                                }));
                              }}
                            >
                              <option value="__none__">— Select field —</option>
                              {predefinedFields.map((f) => (
                                <option key={f.value} value={f.value}>
                                  {f.label}
                                </option>
                              ))}
                            </select>

                            <input
                              className="form-control"
                              placeholder="Enter static text…"
                              value={isField ? "" : currentVal}
                              disabled={isField}
                              onChange={(e) =>
                                setVariableMapping((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        );
                      })}

                      <div
                        className="info-banner amber"
                        style={{ marginTop: 12 }}
                      >
                        💡 Select a CRM field <strong>or</strong> type a static
                        value — not both.
                      </div>
                    </>
                  )}

                  {/* ── Document media section (only when HEADER format = DOCUMENT) ── */}
                  {hasDocHeader && (
                    <div style={{ marginTop: 20 }}>
                      <div
                        className="var-table-head"
                        style={{ gridTemplateColumns: "1fr" }}
                      >
                        <span>📄 Document Attachment</span>
                      </div>
                      <div className="panel-box" style={{ marginTop: 8 }}>
                        <div className="panel-box-header">
                          <span className="panel-box-title">
                            Provide the document to attach
                          </span>
                          <span className="panel-box-sub">
                            Choose how you want to supply the document file for
                            this template
                          </span>
                        </div>

                        {/* Mode toggle */}
                        <div
                          style={{ display: "flex", gap: 10, marginBottom: 14 }}
                        >
                          {(["network_url", "upload"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => {
                                setDocMediaMode(mode);
                                setDocNetworkUrl("");
                                setDocUploadFile(null);
                                setDocUploadedUrl("");
                              }}
                              style={{
                                flex: 1,
                                padding: "9px 14px",
                                border: `2px solid ${docMediaMode === mode ? "#14b866" : "#e5e7eb"}`,
                                borderRadius: 8,
                                background:
                                  docMediaMode === mode ? "#f0fdf4" : "white",
                                color:
                                  docMediaMode === mode ? "#0f7a47" : "#374151",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all .15s",
                              }}
                            >
                              {mode === "network_url"
                                ? "🌐 Network URL"
                                : "⬆ Upload Document"}
                            </button>
                          ))}
                        </div>

                        {/* Network URL input */}
                        {docMediaMode === "network_url" && (
                          <div>
                            <label className="form-label">
                              Document URL <span className="req">*</span>
                            </label>
                            <input
                              className="form-control"
                              placeholder="https://example.com/document.pdf"
                              value={docNetworkUrl}
                              onChange={(e) => setDocNetworkUrl(e.target.value)}
                            />
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "#6b7280",
                                marginTop: 5,
                              }}
                            >
                              Must be a publicly accessible URL (PDF, DOCX,
                              etc.)
                            </div>
                            {docNetworkUrl.trim() && (
                              <div
                                className="info-banner green"
                                style={{ marginTop: 10 }}
                              >
                                ✅ URL set — will be sent as the document
                                attachment.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Upload input */}
                        {docMediaMode === "upload" && (
                          <div>
                            <label className="form-label">
                              Upload File <span className="req">*</span>
                            </label>
                            <input
                              type="file"
                              className="form-control"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.png,.jpeg"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDocUpload(f);
                              }}
                              disabled={docUploading}
                            />
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "#6b7280",
                                marginTop: 5,
                              }}
                            >
                              Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX,
                              TXT
                            </div>
                            {docUploading && (
                              <div
                                className="info-banner amber"
                                style={{ marginTop: 10 }}
                              >
                                <span
                                  className="spinner"
                                  style={{
                                    borderTopColor: "#92400e",
                                    borderColor: "rgba(146,64,14,.3)",
                                  }}
                                />{" "}
                                Uploading document…
                              </div>
                            )}
                            {docUploadedUrl && !docUploading && (
                              <div
                                className="excel-result-card"
                                style={{ marginTop: 10 }}
                              >
                                <div className="excel-result-icon">📄</div>
                                <div className="excel-result-info">
                                  <div className="excel-result-count">
                                    {docUploadFile?.name}
                                  </div>
                                  <div className="excel-result-sub">
                                    Uploaded · URL ready
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ════ STEP 4 — Audience ════ */}
              {step === 4 && (
                <>
                  <div className="step-heading">
                    <h3>Recipients Selection</h3>
                    <p>Choose who will receive this campaign message.</p>
                  </div>
                  {/*
                    FIX #1: Pass variableMapping (Step-3 state) as `variableMapping` prop.
                    Previously this was passing `templateVariables` (the parent prop),
                    which is the TemplateVariableConfig and was undefined/empty.
                  */}
                  <RecipientSelector
                    mode={recipientMode}
                    onModeChange={setRecipientMode}
                    data={recipientData}
                    onDataChange={setRecipientData}
                    templateId={selectedTemplate?.id ?? ""}
                    whereParams={whereParams}
                    variableMapping={variableMapping}
                    predefinedFields={predefinedFields}
                    service={service}
                    hasTemplateVariables={hasTemplateVariables} // ← NEW LINE
                  />
                </>
              )}

              {/* ════ STEP 5 — Timeline ════ */}
              {step === 5 && (
                <>
                  <div className="step-heading">
                    <h3>Launch & Schedule</h3>
                    <p>Choose when to send out your campaign.</p>
                  </div>

                  <div
                    className={`timeline-option${sendMode === "immediate" ? " selected" : ""}`}
                    onClick={() => setSendMode("immediate")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setSendMode("immediate")
                    }
                  >
                    <div className="tl-icon">⚡</div>
                    <div>
                      <div className="tl-title">Send Immediately</div>
                      <div className="tl-desc">
                        Process and send right after you hit launch.
                      </div>
                    </div>
                  </div>

                  <div
                    className={`timeline-option${sendMode === "scheduled" ? " selected" : ""}`}
                    onClick={() => setSendMode("scheduled")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setSendMode("scheduled")
                    }
                  >
                    <div className="tl-icon">🗓</div>
                    <div>
                      <div className="tl-title">Schedule for Later</div>
                      <div className="tl-desc">
                        Pick a specific date and time for delivery.
                      </div>
                    </div>
                  </div>

                  {sendMode === "scheduled" && (
                    <div className="form-group" style={{ marginTop: 8 }}>
                      <label className="form-label">
                        Scheduled Date & Time <span className="req">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}

                  {sendMode === "immediate" && (
                    <div className="info-banner green" style={{ marginTop: 8 }}>
                      Your campaign will be processed immediately. Best for
                      time-sensitive broadcasts.
                    </div>
                  )}

                  {/* Summary card */}
                  <div className="review-card">
                    <div className="review-card-title">Campaign Summary</div>
                    <div className="review-rows">
                      <div className="review-row">
                        <span>Name</span>
                        <strong>{campaignName}</strong>
                      </div>
                      <div className="review-row">
                        <span>Template</span>
                        <strong>{selectedTemplate?.name ?? "—"}</strong>
                      </div>
                      <div className="review-row">
                        <span>Variables mapped</span>
                        <strong>
                          {
                            Object.values(variableMapping).filter(Boolean)
                              .length
                          }{" "}
                          / {variableIndices.length}
                        </strong>
                      </div>
                      <div className="review-row">
                        <span>Recipients</span>
                        <strong>
                          {recipientMode === "specific_contacts"
                            ? `${(recipientData as SpecificContactsData)?.contact_numbers?.length ?? 0} contacts`
                            : `Excel — ${(recipientData as ExportExcelData)?.total_count?.toLocaleString() ?? "?"} contacts`}
                        </strong>
                      </div>
                      <div className="review-row">
                        <span>Sending</span>
                        <strong>
                          {sendMode === "immediate"
                            ? "Immediately"
                            : scheduledAt || "—"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="launch-banner">
                    <div className="launch-banner-icon">🚀</div>
                    <div>
                      <div className="launch-banner-title">
                        Ready to launch?
                      </div>
                      <div className="launch-banner-sub">
                        Campaigns cannot be edited once in the sending queue.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* /cm-content */}
          </div>
          {/* /cm-body */}

          {/* Footer */}
          <div className="cm-footer">
            <button
              className="btn-back"
              onClick={() => (step === 1 ? onHide() : setStep((s) => s - 1))}
            >
              ← {step === 1 ? "Cancel" : "Back"}
            </button>
            <div className="step-counter">
              Step {step} of {STEPS.length}
            </div>
            {step < 5 ? (
              <button className="btn-next" onClick={handleNext}>
                Next Step →
              </button>
            ) : (
              <button
                className="btn-launch"
                onClick={handleLaunch}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" /> Launching…
                  </>
                ) : (
                  "🚀 Launch Campaign"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cm-backdrop {
    position: fixed; inset: 0;
    background: rgba(10,15,25,0.72); backdrop-filter: blur(6px);
    z-index: 1050;
    display: flex; align-items: center; justify-content: center;
    animation: cmFadeIn 0.2s ease;
  }
  @keyframes cmFadeIn { from { opacity: 0 } to { opacity: 1 } }

  .cm-modal {
    background: #fff; border-radius: 16px;
    width: min(97vw, 1000px); max-height: 92vh;
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.04);
    animation: cmSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
    overflow: hidden;
  }
  @keyframes cmSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.98) }
    to   { opacity: 1; transform: none }
  }

  /* Header */
  .cm-header {
    padding: 18px 26px 14px; border-bottom: 1px solid #f0f2f5;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .cm-title   { font-size: 1.1rem; font-weight: 700; color: #0f1923; letter-spacing: -0.3px; }
  .cm-subtitle { font-size: 0.77rem; color: #8a95a3; margin-top: 2px; }
  .cm-close {
    width: 32px; height: 32px; border: none; background: #f4f6f8; border-radius: 8px;
    cursor: pointer; color: #64748b; font-size: 17px;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, color .15s;
  }
  .cm-close:hover { background: #fee2e2; color: #dc2626; }

  /* Layout */
  .cm-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

  /* Sidebar */
  .campaign-sidebar {
    width: 200px; flex-shrink: 0; background: #fafbfc;
    border-right: 1px solid #f0f2f5; padding: 22px 14px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .sidebar-step { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; }
  .sidebar-step.active { background: #e8f8f0; }
  .step-indicator {
    width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%;
    background: #e2e8f0; color: #64748b;
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .sidebar-step.active .step-indicator { background: #14b866; color: white; box-shadow: 0 0 0 3px rgba(20,184,102,0.18); }
  .sidebar-step.done  .step-indicator  { background: #14b866; color: white; }
  .step-label { font-size: 0.76rem; font-weight: 600; color: #94a3b8; }
  .sidebar-step.active .step-label { color: #0f7a47; }
  .sidebar-step.done  .step-label  { color: #14b866; }

  /* Content */
  .cm-content { flex: 1; overflow-y: auto; padding: 26px 30px; min-width: 0; }
  .cm-content::-webkit-scrollbar { width: 5px; }
  .cm-content::-webkit-scrollbar-thumb { background: #dde3ea; border-radius: 4px; }

  /* Headings */
  .step-heading { margin-bottom: 22px; }
  .step-heading h3 { font-size: 1rem; font-weight: 700; color: #0f1923; }
  .step-heading p  { font-size: 0.78rem; color: #8a95a3; margin-top: 4px; }

  /* Forms */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 0.77rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
  .req { color: #ef4444; margin-left: 2px; }
  .form-control {
    width: 100%; padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px;
    font-size: 0.875rem; color: #1f2937; background: white; outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .form-control:focus { border-color: #14b866; box-shadow: 0 0 0 3px rgba(20,184,102,.1); }
  .form-control:disabled { background: #f9fafb; color: #9ca3af; }
  textarea.form-control { resize: vertical; }

  /* Two-col */
  .two-col { display: grid; grid-template-columns: 1fr 260px; gap: 22px; align-items: start; }

  /* Template grid */
  .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 10px; }
  .template-card {
    border: 2px solid #e5e7eb; border-radius: 10px; padding: 12px;
    cursor: pointer; transition: all .15s; position: relative;
  }
  .template-card:hover   { border-color: #86efad; background: #f0fdf4; }
  .template-card.selected { border-color: #14b866; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(20,184,102,.12); }
  .selected-check {
    position: absolute; top: 8px; right: 8px;
    width: 18px; height: 18px; background: #14b866; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .template-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 7px; }
  .template-badge {
    display: inline-flex; padding: 2px 7px; border-radius: 20px;
    font-size: 0.65rem; font-weight: 600; background: #dcfce7; color: #166534;
  }
  .template-badge.utility  { background: #dbeafe; color: #1e40af; }
  .template-badge.media    { background: #fef3c7; color: #92400e; }
  .template-badge.btn-badge { background: #f3e8ff; color: #6b21a8; }
  .template-name    { font-size: 0.8rem; font-weight: 700; color: #1f2937; margin-bottom: 5px; }
  .template-preview {
    font-size: 0.71rem; color: #6b7280; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .template-lang { font-size: 0.66rem; color: #9ca3af; margin-top: 6px; }

  /* ── WA Preview (FIX #3) ── */
  .wa-preview-phone { display: flex; flex-direction: column; align-items: center; position: sticky; top: 0; gap: 6px; }
  .wa-phone-shell {
    width: 240px; border-radius: 28px; overflow: hidden;
    border: 6px solid #1a1a2e;
    box-shadow: 0 12px 32px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.06);
  }
  .wa-phone-empty { background: #f8fafc; padding: 50px 16px; }
  .wa-empty-hint { text-align: center; color: #9ca3af; font-size: 0.78rem; }

  .wa-status-bar {
    background: #075e54; color: rgba(255,255,255,0.7);
    font-size: 0.55rem; padding: 3px 10px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .wa-header-bar {
    background: #075e54; padding: 8px 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .wa-back-btn { color: white; font-size: 18px; line-height: 1; cursor: pointer; }
  .wa-avatar {
    width: 30px; height: 30px; background: #25d366; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .wa-contact-info { flex: 1; }
  .wa-contact-name { font-size: 0.75rem; font-weight: 700; color: white; }
  .wa-contact-sub  { font-size: 0.6rem; color: rgba(255,255,255,0.65); }
  .wa-header-actions { color: rgba(255,255,255,0.7); font-size: 16px; }

  .wa-chat-bg {
    background: #e5ddd5; min-height: 180px; padding: 10px 8px;
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1.2' fill='%23cdc7bc' fill-opacity='0.5'/%3E%3C/svg%3E");
  }
  .wa-date-chip {
    text-align: center; font-size: 0.58rem; color: #5d5d5d;
    background: rgba(255,255,255,0.75); border-radius: 8px;
    padding: 2px 8px; display: block; margin: 0 auto 8px; width: fit-content;
  }

  .wa-bubble-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 0; max-width: 88%; }
  .wa-bubble {
    background: white; border-radius: 0 8px 8px 8px;
    padding: 7px 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }
  .wa-bubble-header {
    font-size: 0.72rem; font-weight: 700; color: #1f2937; margin-bottom: 4px; line-height: 1.4;
  }
  .wa-bubble-body {
    font-size: 0.7rem; color: #1f2937; line-height: 1.6; white-space: pre-wrap; word-break: break-word;
  }
  .wa-placeholder { color: #9ca3af; font-style: italic; }
  .wa-bubble-footer {
    font-size: 0.6rem; color: #6b7280; margin-top: 5px;
    border-top: 1px solid #f3f4f6; padding-top: 4px;
  }
  .wa-bubble-time { font-size: 0.58rem; color: #9ca3af; text-align: right; margin-top: 3px; }

  /* FIX #3: highlighted variable substitution values */
  .wa-var-highlight {
    display: inline-block;
    background: #dcfce7; color: #166534;
    border-radius: 3px; padding: 0 3px;
    font-size: inherit; font-weight: 600;
  }

  /* Media placeholder */
  .wa-media-placeholder {
    width: 100%; border-radius: 6px; padding: 14px;
    background: #f3f4f6; text-align: center;
    font-size: 0.72rem; color: #6b7280; margin-bottom: 6px;
  }

  /* Buttons below bubble */
  .wa-buttons { width: 100%; display: flex; flex-direction: column; gap: 2px; }
  .wa-btn {
    background: white; border-radius: 8px;
    text-align: center; padding: 6px 8px;
    font-size: 0.68rem; font-weight: 600; color: #0a85d1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer;
  }

  /* Preview legend */
  .wa-preview-legend { font-size: 0.68rem; color: #6b7280; text-align: center; }

  /* Variable mapping */
  .var-table-head {
    display: grid; grid-template-columns: 100px 1fr 1fr; gap: 10px;
    padding: 0 4px 8px; border-bottom: 1px solid #f0f2f5; margin-bottom: 10px;
    font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px;
  }
  .var-row {
    display: grid; grid-template-columns: 100px 1fr 1fr; gap: 10px; align-items: center;
    padding: 10px 12px; background: #fafbfc; border: 1px solid #f0f2f5;
    border-radius: 8px; margin-bottom: 8px;
  }
  .var-pill-label {
    font-family: 'Courier New', monospace; font-size: 0.74rem; font-weight: 700; color: #0f7a47;
    background: #e8f8f0; padding: 3px 8px; border-radius: 5px; display: inline-block;
  }

  /* Recipient */
  .recipient-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
  .recipient-card {
    border: 2px solid #e5e7eb; border-radius: 10px; padding: 14px;
    cursor: pointer; transition: all .15s;
    display: flex; align-items: flex-start; gap: 10px; position: relative;
  }
  .recipient-card:hover    { border-color: #86efad; background: #f0fdf4; }
  .recipient-card.selected { border-color: #14b866; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(20,184,102,.12); }
  .recipient-icon {
    width: 34px; height: 34px; flex-shrink: 0; background: #e8f8f0; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 16px; transition: background .15s;
  }
  .recipient-icon.active { background: #14b866; }
  .recipient-title { font-size: 0.82rem; font-weight: 700; color: #1f2937; }
  .recipient-desc  { font-size: 0.72rem; color: #6b7280; margin-top: 2px; }
  .recipient-check {
    position: absolute; top: 10px; right: 10px; width: 18px; height: 18px;
    background: #14b866; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }

  /* Panel box */
  .panel-box { background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
  .panel-box-header { margin-bottom: 12px; }
  .panel-box-title { font-size: 0.83rem; font-weight: 700; color: #1f2937; display: block; }
  .panel-box-sub   { font-size: 0.73rem; color: #6b7280; margin-top: 3px; display: block; }

  /* Chips */
  .tag-list  { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag-chip  {
    display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
    background: #e8f8f0; color: #0f7a47; border-radius: 20px; font-size: 0.73rem; font-weight: 600;
  }
  .tag-chip button { border: none; background: none; cursor: pointer; color: #0f7a47; font-size: 13px; line-height: 1; padding: 0; }
  .tag-chip button:hover { color: #dc2626; }
  .chip-count { font-size: 0.75rem; font-weight: 700; color: #374151; }

  /* Input row */
  .input-row { display: flex; gap: 8px; }
  .input-row .form-control { flex: 1; }
  .btn-add {
    padding: 8px 14px; border: 1.5px solid #14b866; border-radius: 8px;
    background: #f0fdf4; color: #0f7a47; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; white-space: nowrap; transition: all .15s;
  }
  .btn-add:hover { background: #14b866; color: white; }

  /* Filter summary */
  .filter-summary { background: #f0fdf4; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
  .filter-summary-label { font-size: 0.72rem; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .filter-chip { padding: 3px 9px; background: #dcfce7; color: #166534; border-radius: 20px; font-size: 0.72rem; }

  /* Var mapping preview (inside Excel panel) */
  .var-mapping-preview { background: #f8fafc; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
  .var-mapping-grid { display: flex; flex-direction: column; gap: 5px; }
  .var-mapping-row  { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; }
  .var-pill  { font-family: 'Courier New', monospace; background: #e8f8f0; color: #0f7a47; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
  .var-arrow { color: #9ca3af; }
  .var-col   { color: #374151; font-weight: 600; }

  /* Excel */
  .btn-generate {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;
    border: none; border-radius: 8px; background: #0f1923; color: white;
    font-size: 0.83rem; font-weight: 700; cursor: pointer; transition: all .15s;
  }
  .btn-generate:hover    { background: #1a2d3d; }
  .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }
  .excel-result-card {
    display: flex; align-items: center; gap: 12px; background: white;
    border: 1.5px solid #14b866; border-radius: 10px; padding: 12px 16px; margin-top: 12px;
  }
  .excel-result-icon  { font-size: 22px; }
  .excel-result-info  { flex: 1; }
  .excel-result-count { font-size: 0.9rem; font-weight: 700; color: #0f1923; }
  .excel-result-sub   { font-size: 0.72rem; color: #6b7280; }
  .btn-download {
    padding: 7px 14px; border: 1.5px solid #14b866; border-radius: 8px;
    background: #f0fdf4; color: #0f7a47; font-size: 0.78rem; font-weight: 700;
    cursor: pointer; white-space: nowrap; transition: all .15s;
  }
  .btn-download:hover { background: #14b866; color: white; }

  /* Info banners */
  .info-banner { border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; line-height: 1.5; }
  .info-banner.green { background: #f0fdf4; border: 1px solid #bbf7d0; color: #0f7a47; }
  .info-banner.amber { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }

  /* Timeline */
  .timeline-option {
    border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; cursor: pointer;
    transition: all .15s; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;
  }
  .timeline-option:hover    { border-color: #86efad; }
  .timeline-option.selected { border-color: #14b866; background: #f0fdf4; }
  .tl-icon {
    width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; background: #e8f8f0;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .timeline-option.selected .tl-icon { background: #14b866; }
  .tl-title { font-size: 0.88rem; font-weight: 700; color: #1f2937; }
  .tl-desc  { font-size: 0.76rem; color: #6b7280; margin-top: 2px; }

  /* Review */
  .review-card { background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-top: 14px; margin-bottom: 10px; }
  .review-card-title { font-size: 0.78rem; font-weight: 700; color: #374151; margin-bottom: 10px; }
  .review-rows { display: flex; flex-direction: column; gap: 7px; }
  .review-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.8rem; color: #6b7280; border-bottom: 1px solid #f0f2f5; padding-bottom: 6px;
  }
  .review-row:last-child { border-bottom: none; padding-bottom: 0; }
  .review-row strong { color: #1f2937; }

  /* Launch banner */
  .launch-banner {
    background: linear-gradient(135deg, #0f1923 0%, #1a2d3d 100%);
    border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px;
  }
  .launch-banner-icon {
    width: 40px; height: 40px; flex-shrink: 0; background: rgba(20,184,102,.15);
    border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .launch-banner-title { font-size: 0.9rem; font-weight: 700; color: white; }
  .launch-banner-sub   { font-size: 0.75rem; color: #8a9bb0; margin-top: 2px; }

  /* Footer */
  .cm-footer {
    padding: 14px 26px; border-top: 1px solid #f0f2f5;
    display: flex; align-items: center; justify-content: space-between;
    background: white; flex-shrink: 0;
  }
  .btn-back {
    display: flex; align-items: center; gap: 5px; padding: 8px 16px;
    border: 1.5px solid #e5e7eb; border-radius: 8px; background: white;
    font-size: 0.82rem; font-weight: 600; color: #374151; cursor: pointer; transition: all .15s;
  }
  .btn-back:hover { background: #f8fafc; }
  .step-counter { font-size: 0.75rem; color: #9ca3af; font-weight: 600; }
  .btn-next {
    display: flex; align-items: center; gap: 5px; padding: 8px 20px;
    border: none; border-radius: 8px; background: #14b866; color: white;
    font-size: 0.82rem; font-weight: 700; cursor: pointer;
    transition: all .15s; box-shadow: 0 2px 8px rgba(20,184,102,.3);
  }
  .btn-next:hover { background: #0fa358; transform: translateY(-1px); }
  .btn-launch {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 22px;
    border: none; border-radius: 8px; background: linear-gradient(135deg, #14b866, #0fa358);
    color: white; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all .15s;
    box-shadow: 0 4px 14px rgba(20,184,102,.4);
  }
  .btn-launch:hover    { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(20,184,102,.45); }
  .btn-launch:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* Spinner */
  .spinner {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: white;
    border-radius: 50%; animation: cmSpin .7s linear infinite;
  }
  @keyframes cmSpin { to { transform: rotate(360deg) } }

  /* Responsive */
  @media (max-width: 680px) {
    .cm-modal { width: 100vw; max-height: 100dvh; border-radius: 0; }
    .campaign-sidebar { display: none; }
    .two-col, .recipient-grid { grid-template-columns: 1fr; }
    .var-table-head, .var-row { grid-template-columns: 80px 1fr 1fr; }
    .cm-content { padding: 18px 16px; }
  }
`;
