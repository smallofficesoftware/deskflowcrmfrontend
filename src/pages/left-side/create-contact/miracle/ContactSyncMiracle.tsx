import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";

import "../../header/Setting/product/miracle/ProductSyncModal.css";

import {
  MatchField,
  SyncPreviewResponse,
  SyncProcessResponse,
  SyncStep,
} from "./ContactSyncTypes";
import { axiosInstance } from "../../../../services/axiosInstance";

interface ContactSyncModalProps {
  show: boolean;
  onClose: () => void;
  /** Display name of the third-party software, e.g. "Tally", "Zoho Inventory" */
  thirdPartyName?: string;
  onSyncComplete?: (result: SyncProcessResponse) => void;
}

const MATCH_FIELD_OPTIONS: {
  value: MatchField;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "unique_id",
    label: "Miracle Unique Id",
    icon: "bi-hash",
    description: "Match using last miracle updated contact",
  },
  {
    value: "mobile_number",
    label: "Mobile Number",
    icon: "bi-phone-fill",
    description: "Match using the unique Mobile number",
  },
  {
    value: "gst_number",
    label: "GST Number",
    icon: "bi-calculator-fill",
    description: "Match using the exact GST Number",
  },
  {
    value: "contact_name",
    label: "Company Name",
    icon: "bi-file-earmark-person-fill",
    description: "Match using the exact company name == account name",
  },
  {
    value: "client_code",
    label: "Client Code",
    icon: "bi-person-badge-fill",
    description: "Match using the exact Client Code",
  },
];

const STEP_ORDER: SyncStep[] = ["criteria", "preview", "processing"];
const STEP_CONFIG: { key: SyncStep; label: string; icon: string }[] = [
  { key: "criteria", label: "Match Criteria", icon: "bi-sliders" },
  { key: "preview", label: "Review Sync", icon: "bi-search" },
  { key: "processing", label: "Processing", icon: "bi-gear" },
];

type PreviewFilter = "all" | "matched" | "new";

const getErrorMessage = (err: any, fallback: string): string => {
  if (!err) return fallback;
  const responseData = err?.response?.data;

  if (responseData) {
    if (typeof responseData === "string") {
      if (responseData.trim().startsWith("<")) return fallback;
      return responseData;
    }
    if (typeof responseData.message === "string") {
      return responseData.message;
    }
    if (Array.isArray(responseData.message)) {
      return responseData.message
        .map((m: any) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(", ");
    }
    if (typeof responseData.error === "string") {
      return responseData.error;
    }
    if (typeof responseData.error?.message === "string") {
      return responseData.error.message;
    }
  }

  if (typeof err.message === "string" && err.message.trim() !== "") {
    return err.message;
  }

  return fallback;
};

const ContactSyncMiracle: React.FC<ContactSyncModalProps> = ({
  show,
  onClose,
  thirdPartyName = "Miracle",
  onSyncComplete,
}) => {
  const [step, setStep] = useState<SyncStep>("criteria");

  // Step 1 state
  const [matchFields, setMatchFields] = useState<MatchField[]>([]);
  const [criteriaError, setCriteriaError] = useState("");

  // Step 2 state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SyncPreviewResponse | null>(
    null,
  );
  const [previewError, setPreviewError] = useState("");
  const [activeFilter, setActiveFilter] = useState<PreviewFilter>("all");

  // Step 3 state
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] =
    useState<SyncProcessResponse | null>(null);
  const [processError, setProcessError] = useState("");

  const resetState = () => {
    setStep("criteria");
    setMatchFields([]);
    setCriteriaError("");
    setPreviewLoading(false);
    setPreviewData(null);
    setPreviewError("");
    setActiveFilter("all");
    setProcessing(false);
    setProcessResult(null);
    setProcessError("");
  };

  useEffect(() => {
    if (show) resetState();
  }, [show]);

  const toggleMatchField = (field: MatchField) => {
    setMatchFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
    setCriteriaError("");
  };

  const handleFetchPreview = async () => {
    if (matchFields.length === 0) {
      setCriteriaError(
        "Select at least one field to identify duplicate contacts.",
      );
      return;
    }
    setCriteriaError("");
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const getUUID = localStorage.getItem("UUID");

      const res = await axiosInstance.post("/contact-sync/preview", {
        matchBy: matchFields,
        a_application_login_id: getUUID,
      });

      const resBody = res?.data;
      if (resBody?.status === false || resBody?.success === false) {
        const errMsg =
          typeof resBody?.message === "string"
            ? resBody.message
            : typeof resBody?.error === "string"
              ? resBody.error
              : `Failed to fetch contacts from ${thirdPartyName}.`;
        throw new Error(errMsg);
      }

      const data: SyncPreviewResponse = resBody?.data ?? resBody;

      if (!data || !Array.isArray(data.items)) {
        throw new Error("Invalid format received from backend server.");
      }

      setPreviewData({
        items: Array.isArray(data.items) ? data.items : [],
        totalFetched: Number(data.totalFetched) || 0,
        totalMatched: Number(data.totalMatched) || 0,
        totalNew: Number(data.totalNew) || 0,
      });
      setStep("preview");
    } catch (err: any) {
      const msg = getErrorMessage(
        err,
        `Failed to fetch contacts from ${thirdPartyName}. Please try again.`,
      );
      setPreviewError(msg);
      toast.error(msg);
      setStep("preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartSync = async () => {
    setStep("processing");
    setProcessing(true);
    setProcessError("");
    setProcessResult(null);
    try {
      const getUUID = localStorage.getItem("UUID");

      const res = await axiosInstance.post("/contact-sync/process", {
        matchBy: matchFields,
        a_application_login_id: getUUID,
      });

      const resBody = res?.data;
      if (resBody?.status === false || resBody?.success === false) {
        const errMsg =
          typeof resBody?.message === "string"
            ? resBody.message
            : typeof resBody?.error === "string"
              ? resBody.error
              : "Sync failed on server.";
        throw new Error(errMsg);
      }

      const rawData: SyncProcessResponse = resBody?.data ?? resBody;

      const normalizedResult: SyncProcessResponse = {
        updatedCount: Number(rawData?.updatedCount) || 0,
        createdCount: Number(rawData?.createdCount) || 0,
        failedCount: Number(rawData?.failedCount) || 0,
        errors: Array.isArray(rawData?.errors) ? rawData.errors : [],
      };

      setProcessResult(normalizedResult);
      onSyncComplete?.(normalizedResult);

      if (normalizedResult.failedCount > 0) {
        toast.warning(
          `Sync completed with ${normalizedResult.failedCount} error(s).`,
        );
      } else {
        toast.success("Contacts synced successfully.");
      }
    } catch (err: any) {
      const msg = getErrorMessage(err, "Sync failed. Please try again.");
      setProcessError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!previewData || !Array.isArray(previewData.items)) return [];
    if (activeFilter === "all") return previewData.items;
    return previewData.items.filter((i) => i?.status === activeFilter);
  }, [previewData, activeFilter]);

  const handleClose = () => {
    if (processing) return;
    onClose();
  };

  if (!show) return null;

  const currentIndex = STEP_ORDER.indexOf(step);

  const renderStepIndicator = () => (
    <>
      {STEP_CONFIG.map((s, idx) => {
        const status =
          idx < currentIndex
            ? "completed"
            : idx === currentIndex
              ? "active"
              : "pending";
        return (
          <React.Fragment key={s.key}>
            <div className={`psm-step ${status}`}>
              <div className="psm-step-circle">
                <i
                  className={`bi ${status === "completed" ? "bi-check-lg" : s.icon}`}
                />
              </div>
              <div className="psm-step-label">{s.label}</div>
            </div>
            {idx < STEP_CONFIG.length - 1 && (
              <div
                className={`psm-connector ${idx < currentIndex ? "completed" : ""}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );

  const renderCriteriaStep = () => (
    <div>
      <p className="text-muted mb-3">
        Select which field(s) should be used to detect duplicate contacts
        between our software and {thirdPartyName}. A contact is treated as a
        match if it agrees on <strong>any</strong> selected field.
      </p>

      <label className="psm-label mb-2">
        Duplicate with <span className="text-danger">*</span>
      </label>

      <div className={`psm-option-group ${criteriaError ? "is-invalid" : ""}`}>
        {MATCH_FIELD_OPTIONS.map((opt) => {
          const checked = matchFields.includes(opt.value);
          return (
            <div
              key={opt.value}
              className={`psm-option ${checked ? "checked" : ""}`}
              onClick={() => toggleMatchField(opt.value)}
              role="checkbox"
              aria-checked={checked}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleMatchField(opt.value);
                }
              }}
            >
              <div className="psm-option-icon">
                <i className={`bi ${opt.icon}`} />
              </div>
              <div className="psm-option-text">
                <div className="psm-option-label">{opt.label}</div>
                <div className="psm-option-desc">{opt.description}</div>
              </div>
              <div className="psm-option-check">
                <i
                  className={`bi ${checked ? "bi-check-circle-fill" : "bi-circle"}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {criteriaError && (
        <div className="psm-error-text">
          <i className="bi bi-exclamation-circle me-1" />
          {criteriaError}
        </div>
      )}

      <div className="psm-info-box mt-4">
        <i className="bi bi-info-circle" />
        <span>
          Contacts matched on any selected field will have their{" "}
          {thirdPartyName} ID linked on our side. Unmatched contacts will be
          created as new entries and linked automatically.
        </span>
      </div>
    </div>
  );

  const renderPreviewSkeleton = () => (
    <div>
      <div className="row g-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div className="col-4" key={i}>
            <Skeleton height={70} borderRadius={10} />
          </div>
        ))}
      </div>
      <Skeleton height={32} width={260} className="mb-3" />
      <Skeleton height={44} count={5} className="mb-2" />
    </div>
  );

  const renderPreviewErrorState = () => (
    <div className="psm-empty-state error">
      <i className="bi bi-exclamation-triangle" />
      <p>{previewError}</p>
      <button
        type="button"
        className="btn btn-orange btn-sm"
        onClick={handleFetchPreview}
      >
        <i className="bi bi-arrow-clockwise me-1" />
        Retry
      </button>
    </div>
  );

  const renderPreviewStep = () => {
    if (previewLoading) return renderPreviewSkeleton();
    if (previewError) return renderPreviewErrorState();
    if (!previewData) return null;

    const totalFetched = previewData?.totalFetched ?? 0;
    const totalMatched = previewData?.totalMatched ?? 0;
    const totalNew = previewData?.totalNew ?? 0;
    const itemsCount = previewData?.items?.length ?? 0;

    return (
      <div>
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div className="psm-stat-card">
              <div className="psm-stat-value">{totalFetched}</div>
              <div className="psm-stat-label">Fetched</div>
            </div>
          </div>
          <div className="col-4">
            <div className="psm-stat-card matched">
              <div className="psm-stat-value">{totalMatched}</div>
              <div className="psm-stat-label">Will Update</div>
            </div>
          </div>
          <div className="col-4">
            <div className="psm-stat-card new">
              <div className="psm-stat-value">{totalNew}</div>
              <div className="psm-stat-label">Will Add</div>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="btn-group psm-filter-group" role="group">
            {(["all", "matched", "new"] as PreviewFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`btn btn-sm ${activeFilter === f ? "btn-orange" : "btn-outline-secondary"}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === "all" && `All (${itemsCount})`}
                {f === "matched" && `Matched (${totalMatched})`}
                {f === "new" && `New (${totalNew})`}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="psm-empty-state">
            <i className="bi bi-inbox" />
            <p>No contacts found for this filter.</p>
          </div>
        ) : (
          <div className="psm-table-wrap">
            <table className="table table-hover align-middle psm-table">
              <thead>
                <tr>
                  <th>{thirdPartyName} Contact</th>
                  <th>Matched With</th>
                  <th>Match Field</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  if (!item) return null;
                  const thirdParty = item.thirdPartyContact;
                  const matched = item.matchedContact;
                  return (
                    <tr key={thirdParty?.id ?? idx}>
                      <td>
                        <div className="fw-semibold">
                          {thirdParty?.name || "—"}
                        </div>
                        <div className="text-muted small">
                          {thirdParty?.gst_number || ""}
                        </div>
                        <div className="text-muted small">
                          {thirdParty?.mobile_number || ""}
                        </div>
                      </td>
                      <td>
                        {matched ? (
                          <>
                            <div className="fw-semibold">
                              {matched?.name || "—"}
                            </div>
                            <div className="text-muted small">
                              {matched?.gst_number || ""}
                            </div>
                            <div className="text-muted small">
                              {matched?.mobile_number || ""}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {item.matchedBy ? (
                          <span className="badge psm-badge-field text-capitalize">
                            {item.matchedBy}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {item.status === "matched" ? (
                          <span className="badge psm-badge-matched">
                            <i className="bi bi-arrow-repeat me-1" />
                            Update
                          </span>
                        ) : (
                          <span className="badge psm-badge-new">
                            <i className="bi bi-plus-circle me-1" />
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderProcessingStep = () => {
    if (processing) {
      return (
        <div className="psm-processing-state">
          <div className="psm-spinner">
            <span className="spinner-border" role="status" />
          </div>
          <h6 className="mt-3">Syncing contacts with {thirdPartyName}…</h6>
          <p className="text-muted small">
            This may take a moment depending on the number of contacts.
          </p>
        </div>
      );
    }

    if (processError) {
      return (
        <div className="psm-empty-state error">
          <i className="bi bi-exclamation-triangle" />
          <p>{processError}</p>
          <button
            type="button"
            className="btn btn-orange btn-sm"
            onClick={handleStartSync}
          >
            <i className="bi bi-arrow-clockwise me-1" />
            Retry Sync
          </button>
        </div>
      );
    }

    if (processResult) {
      const { updatedCount, createdCount, failedCount, errors } = processResult;
      return (
        <div className="psm-processing-state">
          <div
            className={`psm-result-icon ${failedCount > 0 ? "warning" : "success"}`}
          >
            <i
              className={`bi ${failedCount > 0 ? "bi-exclamation-triangle" : "bi-check-lg"}`}
            />
          </div>
          <h6 className="mt-3">
            {failedCount > 0
              ? "Sync completed with some errors"
              : "Sync completed successfully"}
          </h6>

          <div className="row g-3 mt-2">
            <div className="col-4">
              <div className="psm-stat-card matched">
                <div className="psm-stat-value">{updatedCount}</div>
                <div className="psm-stat-label">Updated</div>
              </div>
            </div>
            <div className="col-4">
              <div className="psm-stat-card new">
                <div className="psm-stat-value">{createdCount}</div>
                <div className="psm-stat-label">Created</div>
              </div>
            </div>
            <div className="col-4">
              <div className="psm-stat-card failed">
                <div className="psm-stat-value">{failedCount}</div>
                <div className="psm-stat-label">Failed</div>
              </div>
            </div>
          </div>

          {failedCount > 0 && errors && errors.length > 0 && (
            <div className="psm-error-list mt-3">
              {errors.map((e: any, idx: number) => {
                const errMsg =
                  typeof e === "string"
                    ? e
                    : typeof e?.message === "string"
                      ? e.message
                      : typeof e?.error === "string"
                        ? e.error
                        : "Unknown error";
                return (
                  <div key={idx} className="psm-error-item">
                    <i className="bi bi-x-circle me-1" />
                    {errMsg}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (step === "criteria") {
      return (
        <>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-orange"
            onClick={handleFetchPreview}
            disabled={previewLoading}
          >
            {previewLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Checking…
              </>
            ) : (
              <>
                Check Sync Preview <i className="bi bi-arrow-right ms-1" />
              </>
            )}
          </button>
        </>
      );
    }

    if (step === "preview") {
      return (
        <>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setStep("criteria")}
          >
            <i className="bi bi-arrow-left me-1" />
            Back
          </button>
          <button
            type="button"
            className="btn btn-orange"
            onClick={handleStartSync}
            disabled={
              !previewData ||
              !Array.isArray(previewData.items) ||
              previewData.items.length === 0
            }
          >
            Start Sync <i className="bi bi-arrow-right ms-1" />
          </button>
        </>
      );
    }

    // processing step
    return (
      <>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            setStep("criteria");
            setProcessResult(null);
          }}
          disabled={processing}
        >
          Sync More
        </button>
        <button
          type="button"
          className="btn btn-orange"
          onClick={handleClose}
          disabled={processing}
        >
          Done
        </button>
      </>
    );
  };

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show psm-modal"
        style={{ display: "block" }}
        tabIndex={-1}
        role="dialog"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content psm-content">
            <div className="psm-header">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="psm-header-icon">
                    <i className="bi bi-arrow-repeat" />
                  </span>
                  <div>
                    <h5 className="mb-0 psm-title">Sync Contacts</h5>
                    <small className="psm-subtitle">
                      Our Software ⇄ {thirdPartyName}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-psm"
                  onClick={handleClose}
                  aria-label="Close"
                  disabled={processing}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            <div className="psm-stepper">{renderStepIndicator()}</div>

            <div className="modal-body psm-body">
              {step === "criteria" && renderCriteriaStep()}
              {step === "preview" && renderPreviewStep()}
              {step === "processing" && renderProcessingStep()}
            </div>

            <div className="modal-footer psm-footer">{renderFooter()}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSyncMiracle;
