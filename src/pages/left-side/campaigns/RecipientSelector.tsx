// ─────────────────────────────────────────────────────────────────────────────
// RecipientSelector.tsx  (v4 — FIXED template variable validation)
// Self-contained recipient selection component.
// Handles: Specific Contacts | Export Excel
// ─────────────────────────────────────────────────────────────────────────────
//
// FIX: Added hasTemplateVariables prop to conditionally validate variable
// mapping. Templates without variables now skip validation and proceed directly
// to Excel generation.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import type {
  RecipientMode,
  RecipientData,
  SpecificContactsData,
  ExportExcelData,
  WhereParams,
  VariableMapping,
  FieldOption,
} from "./campaign.types";
import type { CampaignService } from "./campaign.service";
import { parseContactNumbers, triggerDownload } from "./campaign.utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipientSelectorProps {
  mode: RecipientMode;
  onModeChange: (mode: RecipientMode) => void;

  data: RecipientData | null;
  onDataChange: (data: RecipientData) => void;

  /** Template ID — required for Excel generation API call */
  templateId: string;

  /** Dynamic filter params from parent CRM software */
  whereParams?: WhereParams;

  /**
   * FIX #1: This is NOW the Step-3 variableMapping state (VariableMapping),
   * NOT the parent's templateVariables prop (TemplateVariableConfig).
   *
   * This is the user-configured mapping like:
   *   { "1": "customer_name", "2": "Sales Order", "3": "mobile" }
   *
   * It gets sent verbatim as `variable_mapping` to POST /campaign/generate-excel.
   */
  variableMapping: VariableMapping;

  /** CRM field options — for displaying resolved labels in the mapping preview */
  predefinedFields?: FieldOption[];

  service: CampaignService;

  /**
   * FIX (v4): Does the selected template actually have variables?
   * If false, variable mapping validation is skipped.
   * Defaults to true for safety (validates if unsure).
   */
  hasTemplateVariables?: boolean;
}

// ─── Mode definitions ────────────────────────────────────────────────────────

const MODES: {
  key: RecipientMode;
  title: string;
  desc: string;
  icon: string;
}[] = [
  {
    key: "specific_contacts",
    title: "Specific Contacts",
    icon: "🎯",
    desc: "Manually enter phone numbers to target",
  },
  {
    key: "export_excel",
    title: "Export Excel",
    icon: "📊",
    desc: "Generate a filtered contact list from your backend",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecipientSelector({
  mode,
  onModeChange,
  data,
  onDataChange,
  templateId,
  whereParams = {},
  variableMapping,
  predefinedFields = [],
  service,
  hasTemplateVariables = true, // ← NEW: defaults to true for safety
}: RecipientSelectorProps) {
  const [contactInput, setContactInput] = useState("");
  const [generatingExcel, setGeneratingExcel] = useState(false);

  // ── Auto-trigger Excel generation when mode is export_excel on first render ─
  useEffect(() => {
    if (
      mode === "export_excel" &&
      !data &&
      templateId &&
      (!hasTemplateVariables || // ← NEW: allow if template has no variables
        Object.values(variableMapping).some((v) => v.trim() !== ""))
    ) {
      // Trigger without awaiting — handleGenerateExcel manages its own state
      // We call it via a small async wrapper to avoid stale-closure issues
      const autoGenerate = async () => {
        setGeneratingExcel(true);
        try {
          const getUUID = localStorage.getItem("UUID");
          const result = await service.generateExcel({
            where: whereParams,
            variable_mapping: variableMapping,
            template_id: templateId,
            a_application_login_id: getUUID || "",
          });
          if (result.ack !== 1) {
            toast.error(result.data?.message ?? "Excel generation failed");
            return;
          }
          onDataChange({
            mode: "export_excel",
            excel_token: result.data.excel_token,
            total_count: result.data.total_count,
            download_url: result.data.download_url,
          });
          toast.success(
            `✅ Excel generated — ${result.data.total_count} contacts found`,
          );
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Excel generation failed",
          );
        } finally {
          setGeneratingExcel(false);
        }
      };
      autoGenerate();
    }
    // Only run on mount (or when mode switches to export_excel fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const contactData =
    data?.mode === "specific_contacts" ? (data as SpecificContactsData) : null;
  const excelData =
    data?.mode === "export_excel" ? (data as ExportExcelData) : null;
  const contacts = contactData?.contact_numbers ?? [];

  // ── Specific contacts handlers ─────────────────────────────────────────────

  const addContacts = useCallback(() => {
    const nums = parseContactNumbers(contactInput);
    if (!nums.length) return;
    const merged = Array.from(new Set([...contacts, ...nums]));
    onDataChange({ mode: "specific_contacts", contact_numbers: merged });
    setContactInput("");
  }, [contactInput, contacts, onDataChange]);

  const removeContact = useCallback(
    (num: string) => {
      onDataChange({
        mode: "specific_contacts",
        contact_numbers: contacts.filter((c) => c !== num),
      });
    },
    [contacts, onDataChange],
  );

  // ── Excel generation handler ───────────────────────────────────────────────

  const handleGenerateExcel = useCallback(async () => {
    if (!templateId) {
      toast.error("Please select a template first");
      return;
    }

    // ✅ FIX (v4): Only validate variable mapping if template HAS variables
    if (hasTemplateVariables) {
      const hasAnyMapping = Object.values(variableMapping).some(
        (v) => v.trim() !== "",
      );
      if (!hasAnyMapping) {
        toast.error("Please complete variable mapping in Step 3 first");
        return;
      }
    }

    setGeneratingExcel(true);
    try {
      /**
       * FIX #1: Send variableMapping (Step-3 state) as variable_mapping.
       * This is { "1": "customer_name", "2": "Sales Order", "3": "mobile" }
       * NOT the parent's templateVariables prop.
       */
      const getUUID = localStorage.getItem("UUID");

      const result = await service.generateExcel({
        where: whereParams,
        variable_mapping: variableMapping,
        template_id: templateId,
        a_application_login_id: getUUID || "",
      });

      if (result.ack !== 1) {
        toast.error(result.data?.message ?? "Excel generation failed");
        return;
      }

      onDataChange({
        mode: "export_excel",
        excel_token: result.data.excel_token,
        total_count: result.data.total_count,
        download_url: result.data.download_url,
      });

      toast.success(
        `✅ Excel generated — ${result.data.total_count} contacts found`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Excel generation failed",
      );
    } finally {
      setGeneratingExcel(false);
    }
  }, [
    service,
    templateId,
    whereParams,
    variableMapping,
    onDataChange,
    hasTemplateVariables,
  ]);

  const handleDownload = useCallback(() => {
    if (!excelData?.download_url) return;
    triggerDownload(
      excelData.download_url,
      `campaign_contacts_${Date.now()}.xlsx`,
    );
  }, [excelData]);

  // ── Mapping preview helper ────────────────────────────────────────────────

  const resolveLabel = (val: string): string => {
    const field = predefinedFields.find((f) => f.value === val);
    return field?.label ?? val;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Mode cards */}
      <div className="recipient-grid">
        {MODES.map((m) => (
          <div
            key={m.key}
            className={`recipient-card${mode === m.key ? " selected" : ""}`}
            onClick={() => onModeChange(m.key)}
            role="button"
            aria-pressed={mode === m.key}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onModeChange(m.key)}
          >
            <div className={`recipient-icon${mode === m.key ? " active" : ""}`}>
              {m.icon}
            </div>
            <div>
              <div className="recipient-title">{m.title}</div>
              <div className="recipient-desc">{m.desc}</div>
            </div>
            {mode === m.key && (
              <div className="recipient-check">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
          </div>
        ))}
      </div>

      {/* ── Specific Contacts panel ── */}
      {mode === "specific_contacts" && (
        <div className="panel-box">
          <div className="panel-box-header">
            <span className="panel-box-title">Enter Phone Numbers</span>
            <span className="panel-box-sub">
              Separate multiple numbers with comma, space, or new line
            </span>
          </div>
          <div className="input-row">
            <textarea
              className="form-control"
              rows={3}
              placeholder={"918488032287, 918866110546\n919904298299"}
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button className="btn-add" onClick={addContacts}>
              + Add Numbers
            </button>
          </div>
          {contacts.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="chip-count">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""}{" "}
                added
              </div>
              <div className="tag-list" style={{ marginTop: 6 }}>
                {contacts.map((c) => (
                  <span key={c} className="tag-chip">
                    {c}
                    <button
                      onClick={() => removeContact(c)}
                      aria-label={`Remove ${c}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Export Excel panel ── */}
      {mode === "export_excel" && (
        <div className="panel-box">
          <div className="panel-box-header">
            <span className="panel-box-title">Generate Contact Excel</span>
            <span className="panel-box-sub">
              Backend will create an Excel file based on your active filters
            </span>
          </div>

          {/* Active filter summary */}
          {Object.keys(whereParams).length > 0 && (
            <div className="filter-summary">
              <div className="filter-summary-label">Active Filters</div>
              <div className="filter-chips">
                {Object.entries(whereParams).map(([k, v]) =>
                  v !== undefined && v !== "" ? (
                    <span key={k} className="filter-chip">
                      <strong>{k.replace(/_/g, " ")}:</strong>{" "}
                      {Array.isArray(v) ? v.join(", ") : String(v)}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Variable mapping preview — shows Step 3 config */}
          {Object.keys(variableMapping).length > 0 && (
            <div className="var-mapping-preview">
              <div className="filter-summary-label" style={{ marginBottom: 6 }}>
                Variable → Column Mapping (from Step 3)
              </div>
              <div className="var-mapping-grid">
                {Object.entries(variableMapping).map(([idx, val]) =>
                  val ? (
                    <div key={idx} className="var-mapping-row">
                      <span className="var-pill">{"{{" + idx + "}}"}</span>
                      <span className="var-arrow">→</span>
                      <span className="var-col">{resolveLabel(val)}</span>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Generate / Regenerate */}
          <div style={{ marginTop: 14 }}>
            <button
              className="btn-generate"
              onClick={handleGenerateExcel}
              disabled={generatingExcel}
            >
              {generatingExcel ? (
                <>
                  <span className="spinner" /> Generating…
                </>
              ) : excelData?.excel_token ? (
                "↺ Regenerate Excel"
              ) : (
                "📊 Generate Excel"
              )}
            </button>
          </div>

          {/* Result card */}
          {excelData?.excel_token && !generatingExcel && (
            <div className="excel-result-card">
              <div className="excel-result-icon">📋</div>
              <div className="excel-result-info">
                <div className="excel-result-count">
                  {excelData.total_count?.toLocaleString() ?? "—"} contacts
                </div>
                <div className="excel-result-sub">
                  Excel ready • Token:{" "}
                  <code style={{ fontSize: "0.68rem", color: "#6b7280" }}>
                    {excelData.excel_token.slice(0, 12)}…
                  </code>
                </div>
              </div>
              {excelData.download_url && (
                <button className="btn-download" onClick={handleDownload}>
                  ⬇ Download
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
