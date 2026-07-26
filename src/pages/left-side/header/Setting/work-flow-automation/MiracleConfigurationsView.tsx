import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

interface IPropsMiracleConfiguration {
  show: boolean;
  onHide: () => void;
  headerName: string;
}

interface ConfigFormData {
  financialYear: string;
  clientId: string;
  apiKey: string;
  urlKey: string;
  baseUrl: string;
  branchName: string;
  companyName: string;
}

interface ModuleRight {
  add: boolean;
  update: boolean;
  delete: boolean;
}

export interface MiracleRightsConfig {
  sync_miracle: {
    enabled: boolean;
    contact: ModuleRight;
    product: ModuleRight;
    invoice: ModuleRight;
    purchase_invoice: ModuleRight;
    return_sales_invoice: ModuleRight;
    return_purchase_invoice: ModuleRight;
    quotation: ModuleRight;
    order: ModuleRight;
    purchase_order: ModuleRight;
    dispatch: ModuleRight;
    inward: ModuleRight;
    account_transaction: ModuleRight;
  };
  webhook: {
    enabled: boolean;
    contact: ModuleRight;
    product: ModuleRight;
    invoice: ModuleRight;
    purchase_invoice: ModuleRight;
    return_sales_invoice: ModuleRight;
    return_purchase_invoice: ModuleRight;
    quotation: ModuleRight;
    order: ModuleRight;
    purchase_order: ModuleRight;
    dispatch: ModuleRight;
    inward: ModuleRight;
    account_transaction: ModuleRight;
  };
}

const defaultModuleRights = (): ModuleRight => ({
  add: true,
  update: true,
  delete: true,
});

const defaultRightsConfig = (): MiracleRightsConfig => ({
  sync_miracle: {
    enabled: true,
    contact: defaultModuleRights(),
    product: defaultModuleRights(),
    invoice: defaultModuleRights(),
    purchase_invoice: defaultModuleRights(),
    return_sales_invoice: defaultModuleRights(),
    return_purchase_invoice: defaultModuleRights(),
    quotation: defaultModuleRights(),
    order: defaultModuleRights(),
    purchase_order: defaultModuleRights(),
    dispatch: defaultModuleRights(),
    inward: defaultModuleRights(),
    account_transaction: defaultModuleRights(),
  },
  webhook: {
    enabled: true,
    contact: defaultModuleRights(),
    product: defaultModuleRights(),
    invoice: defaultModuleRights(),
    purchase_invoice: defaultModuleRights(),
    return_sales_invoice: defaultModuleRights(),
    return_purchase_invoice: defaultModuleRights(),
    quotation: defaultModuleRights(),
    order: defaultModuleRights(),
    purchase_order: defaultModuleRights(),
    dispatch: defaultModuleRights(),
    inward: defaultModuleRights(),
    account_transaction: defaultModuleRights(),
  },
});

type ModuleKey = keyof Omit<MiracleRightsConfig["sync_miracle"], "enabled">;

const MODULE_LIST: { key: ModuleKey; label: string; badge: string }[] = [
  { key: "contact", label: "Contact (Accounts)", badge: "AA/AE/AD" },
  { key: "product", label: "Product", badge: "PA/PE/PD" },
  { key: "invoice", label: "Sales Invoice", badge: "SS" },
  { key: "purchase_invoice", label: "Purchase Invoice", badge: "PP" },
  { key: "return_sales_invoice", label: "Return Sales Invoice", badge: "SR" },
  { key: "return_purchase_invoice", label: "Return Purchase Invoice", badge: "PR" },
  { key: "quotation", label: "Quotation", badge: "QS" },
  { key: "order", label: "Sales Order", badge: "OS" },
  { key: "purchase_order", label: "Purchase Order", badge: "OP" },
  { key: "dispatch", label: "Dispatch", badge: "HS" },
  { key: "inward", label: "Inward", badge: "HP" },
  { key: "account_transaction", label: "Payment & Receipt (Cash/Bank)", badge: "CP/CR/BP/BR" },
];

const initialState: ConfigFormData = {
  financialYear: "",
  clientId: "",
  apiKey: "",
  urlKey: "",
  baseUrl: "",
  branchName: "",
  companyName: "",
};

// Brand Theme Colors
const DESKFLOW_COLOR = "#e37430"; // Deskflow Theme Color
const MIRACLE_COLOR = "#1070b2";  // Miracle Theme Color

const MiracleConfigurationsView = ({
  show,
  onHide,
  headerName,
}: IPropsMiracleConfiguration) => {
  const [formData, setFormData] = useState<ConfigFormData>(initialState);
  const [rightsConfig, setRightsConfig] = useState<MiracleRightsConfig>(defaultRightsConfig());
  const [errors, setErrors] = useState<Partial<ConfigFormData>>({});

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"general" | "sync" | "webhook">("general");

  // Track if configuration details exist in DB
  const [hasSavedConfig, setHasSavedConfig] = useState<boolean>(false);

  // UI state for masking/unmasking credentials
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showClientId, setShowClientId] = useState<boolean>(false);

  // Status states
  const [isGeneratingToken, setIsGeneratingToken] = useState<boolean>(false);

  const fetchConfigurations = async () => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = { a_application_login_id };

    try {
      const response = await axiosInstance.post("get-miracle-config", payload, {
        headers: {
          Authorization: `${token}`,
          "x-tenant-id": a_application_login_id,
        },
      });

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const item = response.data.data?.item;
        const isConfigured = Boolean(
          item && (item.client_id || item.api_key || item.Year || item.baseurl || item.CompanyName || item.BranchName)
        );
        setHasSavedConfig(isConfigured);

        setFormData({
          financialYear: item?.Year || "",
          clientId: item?.client_id || "",
          apiKey: item?.api_key || "",
          urlKey: item?.urlKey || "",
          baseUrl: item?.baseurl || "",
          branchName: item?.BranchName || "",
          companyName: item?.CompanyName || "",
        });

        if (item?.rights_config) {
          setRightsConfig(item.rights_config);
        } else {
          setRightsConfig(defaultRightsConfig());
        }
      } else {
        setFormData(initialState);
        setRightsConfig(defaultRightsConfig());
        setHasSavedConfig(false);
      }
    } catch (error: any) {
      setHasSavedConfig(false);
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  useEffect(() => {
    if (show) {
      fetchConfigurations();
      setActiveTab("general");
    }
  }, [show]);

  const createConfiguration = async () => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
      a_application_login_id,
      Year: formData.financialYear,
      client_id: formData.clientId,
      api_key: formData.apiKey,
      urlKey: formData.urlKey,
      baseurl: formData.baseUrl,
      BranchName: formData.branchName,
      CompanyName: formData.companyName,
      rights_config: rightsConfig,
    };

    try {
      const response = await axiosInstance.post(
        "create-miracle-config",
        payload,
        {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": a_application_login_id,
          },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setHasSavedConfig(true);
        toast.success(
          response.data.ack_msg || "Configuration saved successfully.",
        );
      } else {
        toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  const handleGenerateAccessToken = async () => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
      a_application_login_id,
    };

    setIsGeneratingToken(true);
    try {
      const response = await axiosInstance.post(
        "generate-miracle-token",
        payload,
        {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": a_application_login_id,
          },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(
          response.data.ack_msg || "Access Token column written successfully!",
        );
      } else {
        toast.error(response.data.ack_msg || "Failed to generate token.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleChange = (key: keyof ConfigFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const toggleMasterSwitch = (section: "sync_miracle" | "webhook") => {
    setRightsConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled,
      },
    }));
  };

  const toggleModuleRight = (
    section: "sync_miracle" | "webhook",
    moduleKey: ModuleKey,
    action: "add" | "update" | "delete"
  ) => {
    setRightsConfig((prev) => {
      const currentModule = prev[section][moduleKey] || defaultModuleRights();
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [moduleKey]: {
            ...currentModule,
            [action]: !currentModule[action],
          },
        },
      };
    });
  };

  const validate = () => {
    const newErrors: Partial<ConfigFormData> = {};
    const financialYearRegex = /^\d{4}-\d{2}-\d{2}#\d{4}-\d{2}-\d{2}$/;

    if (!formData.financialYear.trim()) {
      newErrors.financialYear = "Financial year is required";
    } else if (!financialYearRegex.test(formData.financialYear)) {
      newErrors.financialYear = "Format should be: 2026-04-01#2027-03-31";
    }

    if (!formData.clientId.trim()) {
      newErrors.clientId = "Client ID is required";
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API Key is required";
    }

    if (!formData.urlKey.trim()) {
      newErrors.urlKey = "URL Key is required";
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = "Base URL is required";
    } else {
      try {
        new URL(formData.baseUrl);
      } catch {
        newErrors.baseUrl = "Enter valid URL";
      }
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = "Branch name is required";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "general" && !validate()) return;

    createConfiguration();
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <React.Fragment>
      {show && (
        <div
          className="modal1"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="modal-content1 p-4 shadow-lg border border-secondary border-opacity-25 rounded-3"
            style={{
              width: "55%",
              height: "92%",
              overflowY: "auto",
              background: "#ffffff",
            }}
          >
            {/* Header Security Badge & Close */}
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="p-2 rounded-circle d-inline-flex"
                  style={{
                    backgroundColor: "rgba(16, 112, 178, 0.1)",
                    color: MIRACLE_COLOR,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <div>
                  <h5 className="modal-title1 mb-0 fw-bold text-dark">
                    {headerName}
                  </h5>
                </div>
              </div>
              <span
                className="close text-secondary"
                onClick={onHide}
                style={{ cursor: "pointer", fontSize: "1.5rem" }}
              >
                &times;
              </span>
            </div>

            {/* Tab Navigation */}
            <div className="d-flex border-bottom mb-3 gap-2">
              <button
                type="button"
                className="btn btn-sm px-3 py-2 fw-semibold rounded-top-2"
                onClick={() => setActiveTab("general")}
                style={{
                  backgroundColor: activeTab === "general" ? "rgba(227, 116, 48, 0.1)" : "transparent",
                  color: activeTab === "general" ? DESKFLOW_COLOR : "#64748b",
                  borderBottom: activeTab === "general" ? `2px solid ${DESKFLOW_COLOR}` : "2px solid transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  fontSize: "0.82rem",
                }}
              >
                1. General & API Credentials
              </button>

              <button
                type="button"
                className="btn btn-sm px-3 py-2 fw-semibold rounded-top-2 d-flex align-items-center gap-1"
                onClick={() => {
                  if (!hasSavedConfig) {
                    toast.info("Please save API credentials first to configure Sync Rights.");
                    return;
                  }
                  setActiveTab("sync");
                }}
                style={{
                  backgroundColor: activeTab === "sync" ? "rgba(16, 112, 178, 0.1)" : "transparent",
                  color: activeTab === "sync" ? MIRACLE_COLOR : "#64748b",
                  borderBottom: activeTab === "sync" ? `2px solid ${MIRACLE_COLOR}` : "2px solid transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  opacity: hasSavedConfig ? 1 : 0.55,
                  cursor: hasSavedConfig ? "pointer" : "not-allowed",
                  fontSize: "0.82rem",
                }}
              >
                {!hasSavedConfig && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                2. Deskflow To Miracle (Sync)
              </button>

              <button
                type="button"
                className="btn btn-sm px-3 py-2 fw-semibold rounded-top-2 d-flex align-items-center gap-1"
                onClick={() => {
                  if (!hasSavedConfig) {
                    toast.info("Please save API credentials first to configure Webhook Rights.");
                    return;
                  }
                  setActiveTab("webhook");
                }}
                style={{
                  backgroundColor: activeTab === "webhook" ? "rgba(16, 112, 178, 0.1)" : "transparent",
                  color: activeTab === "webhook" ? MIRACLE_COLOR : "#64748b",
                  borderBottom: activeTab === "webhook" ? `2px solid ${MIRACLE_COLOR}` : "2px solid transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  opacity: hasSavedConfig ? 1 : 0.55,
                  cursor: hasSavedConfig ? "pointer" : "not-allowed",
                  fontSize: "0.82rem",
                }}
              >
                {!hasSavedConfig && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                3. Miracle To Deskflow (Webhook)
              </button>
            </div>

            {!hasSavedConfig && (
              <div
                className="p-2 mb-3 rounded-2 border d-flex align-items-center gap-2"
                style={{
                  backgroundColor: "rgba(227, 116, 48, 0.06)",
                  borderColor: "rgba(227, 116, 48, 0.3)",
                  fontSize: "0.78rem",
                  color: DESKFLOW_COLOR,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  Please enter and save your Miracle API configuration credentials first. Sync and Webhook Rights tabs will unlock automatically after initial save.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-1">
              {/* TAB 1: General & API Credentials */}
              {activeTab === "general" && (
                <div className="head d-flex flex-column gap-3">
                  {/* 01: System Identity Settings Group */}
                  <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                    <h6
                      className="text-uppercase fw-semibold mb-3 d-flex align-items-center gap-2"
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        color: DESKFLOW_COLOR,
                      }}
                    >
                      <span
                        className="p-1 rounded-1"
                        style={{
                          backgroundColor: "rgba(227, 116, 48, 0.1)",
                          color: DESKFLOW_COLOR,
                        }}
                      >
                        01
                      </span>
                      Instance & Scope Settings
                    </h6>

                    <div className="row g-3">
                      <div className="col-6">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Financial Year
                        </label>
                        <input
                          type="text"
                          placeholder="2026-04-01#2027-03-31"
                          value={formData.financialYear}
                          onChange={(e) =>
                            handleChange("financialYear", e.target.value)
                          }
                          className="form-control form-control-sm"
                        />
                        {errors.financialYear && (
                          <small className="text-danger d-block mt-1">
                            {errors.financialYear}
                          </small>
                        )}
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Base URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com"
                          value={formData.baseUrl}
                          onChange={(e) =>
                            handleChange("baseUrl", e.target.value)
                          }
                          className="form-control form-control-sm"
                        />
                        {errors.baseUrl && (
                          <small className="text-danger d-block mt-1">
                            {errors.baseUrl}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 02: Security Credentials Group */}
                  <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                    <h6
                      className="text-uppercase fw-semibold mb-3 d-flex align-items-center gap-2"
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        color: DESKFLOW_COLOR,
                      }}
                    >
                      <span
                        className="p-1 rounded-1"
                        style={{
                          backgroundColor: "rgba(227, 116, 48, 0.1)",
                          color: DESKFLOW_COLOR,
                        }}
                      >
                        02
                      </span>
                      API Access & Identity Keys
                    </h6>

                    <div className="row g-3">
                      {/* Client ID */}
                      <div className="col-12">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Client ID
                        </label>
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            height: "31px",
                          }}
                        >
                          <input
                            type={showClientId ? "text" : "password"}
                            placeholder="Enter Client ID"
                            value={formData.clientId}
                            onChange={(e) =>
                              handleChange("clientId", e.target.value)
                            }
                            className="form-control form-control-sm"
                            style={{
                              borderTopRightRadius: "0",
                              borderBottomRightRadius: "0",
                              height: "100%",
                              flex: 1,
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            style={{
                              borderRadius: "0",
                              borderLeft: "none",
                              height: "100%",
                              width: "70px",
                              fontSize: "0.75rem",
                            }}
                            onClick={() => setShowClientId(!showClientId)}
                          >
                            {showClientId ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            style={{
                              borderTopLeftRadius: "0",
                              borderBottomLeftRadius: "0",
                              borderLeft: "none",
                              height: "100%",
                              width: "70px",
                              fontSize: "0.75rem",
                            }}
                            onClick={() => copyToClipboard(formData.clientId)}
                          >
                            Copy
                          </button>
                        </div>
                        {errors.clientId && (
                          <small className="text-danger d-block mt-1">
                            {errors.clientId}
                          </small>
                        )}
                      </div>

                      {/* API Key */}
                      <div className="col-12">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          API Key
                        </label>
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            height: "31px",
                          }}
                        >
                          <input
                            type={showApiKey ? "text" : "password"}
                            placeholder="Enter API Key"
                            value={formData.apiKey}
                            onChange={(e) =>
                              handleChange("apiKey", e.target.value)
                            }
                            className="form-control form-control-sm"
                            style={{
                              borderTopRightRadius: "0",
                              borderBottomRightRadius: "0",
                              height: "100%",
                              flex: 1,
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            style={{
                              borderRadius: "0",
                              borderLeft: "none",
                              height: "100%",
                              width: "70px",
                              fontSize: "0.75rem",
                            }}
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            style={{
                              borderTopLeftRadius: "0",
                              borderBottomLeftRadius: "0",
                              borderLeft: "none",
                              height: "100%",
                              width: "70px",
                              fontSize: "0.75rem",
                            }}
                            onClick={() => copyToClipboard(formData.apiKey)}
                          >
                            Copy
                          </button>
                        </div>
                        {errors.apiKey && (
                          <small className="text-danger d-block mt-1">
                            {errors.apiKey}
                          </small>
                        )}
                      </div>

                      {/* URL Key */}
                      <div className="col-12">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          URL Key
                        </label>
                        <input
                          type="text"
                          placeholder="Enter URL Key"
                          value={formData.urlKey}
                          onChange={(e) => handleChange("urlKey", e.target.value)}
                          className="form-control form-control-sm"
                        />
                        {errors.urlKey && (
                          <small className="text-danger d-block mt-1">
                            {errors.urlKey}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STANDALONE DATABASE TRIGGER CARD */}
                  <div
                    className="border p-3 rounded-2"
                    style={{
                      backgroundColor: "rgba(227, 116, 48, 0.04)",
                      borderColor: "rgba(227, 116, 48, 0.25)",
                    }}
                  >
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span className="mt-1" style={{ color: DESKFLOW_COLOR }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </span>
                      <div>
                        <h6
                          className="fw-bold mb-0"
                          style={{ fontSize: "0.85rem", color: DESKFLOW_COLOR }}
                        >
                          Generate Database Column Token
                        </h6>
                        <p
                          className="text-muted mb-0"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Triggers a secure key synchronization pipeline directly
                          inside the remote engine database. This action does not
                          modify the client-side keys above.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAccessToken}
                      className="btn btn-sm w-100 mt-1 d-flex align-items-center justify-content-center gap-2 text-white fw-medium shadow-sm"
                      disabled={isGeneratingToken}
                      style={{
                        backgroundColor: DESKFLOW_COLOR,
                        border: `1px solid ${DESKFLOW_COLOR}`,
                      }}
                    >
                      {isGeneratingToken ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Executing DB Pipeline Sync...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                          Generate Access Token
                        </>
                      )}
                    </button>
                  </div>

                  {/* 03: Organizational Context Group */}
                  <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                    <h6
                      className="text-uppercase fw-semibold mb-3 d-flex align-items-center gap-2"
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        color: DESKFLOW_COLOR,
                      }}
                    >
                      <span
                        className="p-1 rounded-1"
                        style={{
                          backgroundColor: "rgba(227, 116, 48, 0.1)",
                          color: DESKFLOW_COLOR,
                        }}
                      >
                        03
                      </span>
                      Organization Context
                    </h6>

                    <div className="row g-3">
                      <div className="col-6">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Branch Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Branch Name"
                          value={formData.branchName}
                          onChange={(e) =>
                            handleChange("branchName", e.target.value)
                          }
                          className="form-control form-control-sm"
                        />
                        {errors.branchName && (
                          <small className="text-danger d-block mt-1">
                            {errors.branchName}
                          </small>
                        )}
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Company Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Company Name"
                          value={formData.companyName}
                          onChange={(e) =>
                            handleChange("companyName", e.target.value)
                          }
                          className="form-control form-control-sm"
                        />
                        {errors.companyName && (
                          <small className="text-danger d-block mt-1">
                            {errors.companyName}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Deskflow To Miracle (Sync Miracle) */}
              {activeTab === "sync" && (
                <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6
                      className="text-uppercase fw-semibold mb-0 d-flex align-items-center gap-2"
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        color: MIRACLE_COLOR,
                      }}
                    >
                      <span
                        className="p-1 rounded-1"
                        style={{
                          backgroundColor: "rgba(16, 112, 178, 0.1)",
                          color: MIRACLE_COLOR,
                        }}
                      >
                        04
                      </span>
                      Deskflow To Miracle (Sync Miracle)
                    </h6>

                    {/* Master Switch */}
                    <div className="form-check form-switch d-flex align-items-center gap-2 mb-0 ps-0">
                      <label
                        className="form-check-label text-dark fw-semibold mb-0"
                        style={{ fontSize: "0.8rem", cursor: "pointer" }}
                        htmlFor="syncMiracleMasterSwitch"
                      >
                        {rightsConfig.sync_miracle.enabled ? "Sync Enabled" : "Sync Disabled"}
                      </label>
                      <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        id="syncMiracleMasterSwitch"
                        checked={rightsConfig.sync_miracle.enabled}
                        onChange={() => toggleMasterSwitch("sync_miracle")}
                        style={{
                          cursor: "pointer",
                          width: "2.3em",
                          height: "1.2em",
                          backgroundColor: rightsConfig.sync_miracle.enabled ? MIRACLE_COLOR : undefined,
                          borderColor: rightsConfig.sync_miracle.enabled ? MIRACLE_COLOR : undefined,
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-muted mb-3" style={{ fontSize: "0.74rem" }}>
                    Master switch controls whether Miracle Sync UI buttons are displayed across Deskflow CRM. Module-wise switches configure fine-grained Add, Update, and Delete permissions.
                  </p>

                  {/* Module Grid Matrix */}
                  <div
                    className="d-flex flex-column gap-2"
                    style={{
                      opacity: rightsConfig.sync_miracle.enabled ? 1 : 0.45,
                      pointerEvents: rightsConfig.sync_miracle.enabled ? "auto" : "none",
                    }}
                  >
                    {MODULE_LIST.map((mod) => {
                      const moduleRight = rightsConfig.sync_miracle[mod.key] || defaultModuleRights();
                      return (
                        <div
                          key={`sync-${mod.key}`}
                          className="p-2 border rounded-2 bg-white d-flex align-items-center justify-content-between shadow-xs"
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-medium text-dark" style={{ fontSize: "0.8rem" }}>
                              {mod.label}
                            </span>
                            <span className="badge border fw-normal" style={{ fontSize: "0.66rem", backgroundColor: "rgba(16, 112, 178, 0.08)", color: MIRACLE_COLOR }}>
                              {mod.badge}
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            {/* Add Switch */}
                            <div className="form-check form-switch d-flex align-items-center gap-1 mb-0 ps-0">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`sync-${mod.key}-add`}
                                checked={moduleRight.add}
                                onChange={() => toggleModuleRight("sync_miracle", mod.key, "add")}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: moduleRight.add ? "#10b981" : undefined,
                                  borderColor: moduleRight.add ? "#10b981" : undefined,
                                }}
                              />
                              <label className="form-check-label text-secondary mb-0" style={{ fontSize: "0.72rem" }} htmlFor={`sync-${mod.key}-add`}>
                                Add
                              </label>
                            </div>

                            {/* Update Switch */}
                            <div className="form-check form-switch d-flex align-items-center gap-1 mb-0 ps-0">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`sync-${mod.key}-update`}
                                checked={moduleRight.update}
                                onChange={() => toggleModuleRight("sync_miracle", mod.key, "update")}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: moduleRight.update ? MIRACLE_COLOR : undefined,
                                  borderColor: moduleRight.update ? MIRACLE_COLOR : undefined,
                                }}
                              />
                              <label className="form-check-label text-secondary mb-0" style={{ fontSize: "0.72rem" }} htmlFor={`sync-${mod.key}-update`}>
                                Update
                              </label>
                            </div>

                            {/* Delete Switch */}
                            <div className="form-check form-switch d-flex align-items-center gap-1 mb-0 ps-0">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`sync-${mod.key}-delete`}
                                checked={moduleRight.delete}
                                onChange={() => toggleModuleRight("sync_miracle", mod.key, "delete")}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: moduleRight.delete ? "#ef4444" : undefined,
                                  borderColor: moduleRight.delete ? "#ef4444" : undefined,
                                }}
                              />
                              <label className="form-check-label text-secondary mb-0" style={{ fontSize: "0.72rem" }} htmlFor={`sync-${mod.key}-delete`}>
                                Delete
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Miracle To Deskflow (Webhook) */}
              {activeTab === "webhook" && (
                <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6
                      className="text-uppercase fw-semibold mb-0 d-flex align-items-center gap-2"
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        color: MIRACLE_COLOR,
                      }}
                    >
                      <span
                        className="p-1 rounded-1"
                        style={{
                          backgroundColor: "rgba(16, 112, 178, 0.1)",
                          color: MIRACLE_COLOR,
                        }}
                      >
                        05
                      </span>
                      Miracle To Deskflow (Webhook)
                    </h6>

                    {/* Master Switch */}
                    <div className="form-check form-switch d-flex align-items-center gap-2 mb-0 ps-0">
                      <label
                        className="form-check-label text-dark fw-semibold mb-0"
                        style={{ fontSize: "0.8rem", cursor: "pointer" }}
                        htmlFor="webhookMasterSwitch"
                      >
                        {rightsConfig.webhook.enabled ? "Webhook Enabled" : "Webhook Disabled"}
                      </label>
                      <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        id="webhookMasterSwitch"
                        checked={rightsConfig.webhook.enabled}
                        onChange={() => toggleMasterSwitch("webhook")}
                        style={{
                          cursor: "pointer",
                          width: "2.3em",
                          height: "1.2em",
                          backgroundColor: rightsConfig.webhook.enabled ? MIRACLE_COLOR : undefined,
                          borderColor: rightsConfig.webhook.enabled ? MIRACLE_COLOR : undefined,
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-muted mb-3" style={{ fontSize: "0.74rem" }}>
                    Master switch enables incoming Miracle webhook notifications. Module switches control whether Add, Update, or Delete events are processed into Deskflow CRM.
                  </p>

                  {/* Module Grid Matrix */}
                  <div
                    className="d-flex flex-column gap-2"
                    style={{
                      opacity: rightsConfig.webhook.enabled ? 1 : 0.45,
                      pointerEvents: rightsConfig.webhook.enabled ? "auto" : "none",
                    }}
                  >
                    {MODULE_LIST.map((mod) => {
                      const moduleRight = rightsConfig.webhook[mod.key] || defaultModuleRights();
                      return (
                        <div
                          key={`webhook-${mod.key}`}
                          className="p-2 border rounded-2 bg-white d-flex align-items-center justify-content-between shadow-xs"
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-medium text-dark" style={{ fontSize: "0.8rem" }}>
                              {mod.label}
                            </span>
                            <span className="badge border fw-normal" style={{ fontSize: "0.66rem", backgroundColor: "rgba(16, 112, 178, 0.08)", color: MIRACLE_COLOR }}>
                              {mod.badge}
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            {/* Add Switch */}
                            <div className="form-check form-switch d-flex align-items-center gap-1 mb-0 ps-0">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`webhook-${mod.key}-add`}
                                checked={moduleRight.add}
                                onChange={() => toggleModuleRight("webhook", mod.key, "add")}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: moduleRight.add ? "#10b981" : undefined,
                                  borderColor: moduleRight.add ? "#10b981" : undefined,
                                }}
                              />
                              <label className="form-check-label text-secondary mb-0" style={{ fontSize: "0.72rem" }} htmlFor={`webhook-${mod.key}-add`}>
                                Add
                              </label>
                            </div>

                            {/* Update Switch */}
                            <div className="form-check form-switch d-flex align-items-center gap-1 mb-0 ps-0">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`webhook-${mod.key}-update`}
                                checked={moduleRight.update}
                                onChange={() => toggleModuleRight("webhook", mod.key, "update")}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: moduleRight.update ? MIRACLE_COLOR : undefined,
                                  borderColor: moduleRight.update ? MIRACLE_COLOR : undefined,
                                }}
                              />
                              <label className="form-check-label text-secondary mb-0" style={{ fontSize: "0.72rem" }} htmlFor={`webhook-${mod.key}-update`}>
                                Update
                              </label>
                            </div>

                            {/* Delete Switch */}
                            <div className="form-check form-switch d-flex align-items-center gap-1 mb-0 ps-0">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`webhook-${mod.key}-delete`}
                                checked={moduleRight.delete}
                                onChange={() => toggleModuleRight("webhook", mod.key, "delete")}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: moduleRight.delete ? "#ef4444" : undefined,
                                  borderColor: moduleRight.delete ? "#ef4444" : undefined,
                                }}
                              />
                              <label className="form-check-label text-secondary mb-0" style={{ fontSize: "0.72rem" }} htmlFor={`webhook-${mod.key}-delete`}>
                                Delete
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="col-12 d-flex mt-4 justify-content-end gap-2 border-top pt-3">
                <button
                  className="btn btn-light px-4"
                  onClick={onHide}
                  type="button"
                  style={{ fontSize: "0.85rem" }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn px-4 text-light fw-medium rounded-2 shadow-sm"
                  style={{
                    backgroundColor: DESKFLOW_COLOR,
                    border: "none",
                    fontSize: "0.85rem",
                  }}
                >
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default MiracleConfigurationsView;
