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

const initialState: ConfigFormData = {
  financialYear: "",
  clientId: "",
  apiKey: "",
  urlKey: "",
  baseUrl: "",
  branchName: "",
  companyName: "",
};

const MiracleConfigurationsView = ({
  show,
  onHide,
  headerName,
}: IPropsMiracleConfiguration) => {
  const [formData, setFormData] = useState<ConfigFormData>(initialState);
  const [errors, setErrors] = useState<Partial<ConfigFormData>>({});

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
        setFormData({
          financialYear: response.data.data.item.Year,
          clientId: response.data.data.item.client_id,
          apiKey: response.data.data.item.api_key,
          urlKey: response.data.data.item.urlKey,
          baseUrl: response.data.data.item.baseurl,
          branchName: response.data.data.item.BranchName,
          companyName: response.data.data.item.CompanyName,
        });
      } else {
        setFormData(initialState);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  useEffect(() => {
    if (show) {
      fetchConfigurations();
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

  // Separate database column operation for Token Generation
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

    if (!validate()) return;

    createConfiguration();
    onHide();
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
              width: "42%",
              height: "88%",
              overflowY: "auto",
              background: "#ffffff",
            }}
          >
            {/* Header Security Badge & Close */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="p-2 rounded-circle d-inline-flex"
                  style={{
                    backgroundColor: "rgba(245, 134, 52, 0.1)",
                    color: "#f58634",
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
                  {/* <small
                    className="text-muted d-block"
                    style={{ fontSize: "0.75rem" }}
                  >
                    AES-256 encrypted database channel
                  </small> */}
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

            <form onSubmit={handleSubmit} className="px-1">
              <div className="head d-flex flex-column gap-3">
                {/* System Identity Settings Group */}
                <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                  <h6
                    className="text-uppercase fw-semibold mb-3 d-flex align-items-center gap-2"
                    style={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      color: "#f58634",
                    }}
                  >
                    <span
                      className="p-1 rounded-1"
                      style={{
                        backgroundColor: "rgba(245, 134, 52, 0.1)",
                        color: "#f58634",
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

                {/* Security Credentials Group */}
                <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                  <h6
                    className="text-uppercase fw-semibold mb-3 d-flex align-items-center gap-2"
                    style={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      color: "#f58634",
                    }}
                  >
                    <span
                      className="p-1 rounded-1"
                      style={{
                        backgroundColor: "rgba(245, 134, 52, 0.1)",
                        color: "#f58634",
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
                    backgroundColor: "rgba(245, 134, 52, 0.04)",
                    borderColor: "rgba(245, 134, 52, 0.25)",
                  }}
                >
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <span className="mt-1" style={{ color: "#f58634" }}>
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
                        style={{ fontSize: "0.85rem", color: "#f58634" }}
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
                      backgroundColor: "#f58634",
                      border: "1px solid #e07220",
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

                {/* Organizational Context Group */}
                <div className="border border-light-subtle p-3 rounded-2 bg-light bg-opacity-25">
                  <h6
                    className="text-uppercase fw-semibold mb-3 d-flex align-items-center gap-2"
                    style={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      color: "#f58634",
                    }}
                  >
                    <span
                      className="p-1 rounded-1"
                      style={{
                        backgroundColor: "rgba(245, 134, 52, 0.1)",
                        color: "#f58634",
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
                    backgroundColor: "#f58634",
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
