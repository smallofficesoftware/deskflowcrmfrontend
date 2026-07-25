import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

interface IPropsWhatsappConfiguration {
  show: boolean;
  onHide: () => void;
  headerName: string;
}

interface IWhatsappConfigurationForm {
  platform: number | string;
  configureType: number | string;
  whatsappPhoneNumberId: string;
  whatsappWabaId: string;
  whatsappApiKey: string;
}

const initialState: IWhatsappConfigurationForm = {
  platform: 0,
  configureType: 0,
  whatsappPhoneNumberId: "",
  whatsappWabaId: "",
  whatsappApiKey: "",
};

const WhatsappConfigurationView = ({
  show,
  onHide,
  headerName,
}: IPropsWhatsappConfiguration) => {
  const [formData, setFormData] =
    useState<IWhatsappConfigurationForm>(initialState);
  const [whatsappWABAConfigDetails, setWhatsappWABAConfigDetails] = useState<
    any[]
  >([]);
  const [errors, setErrors] = useState<Partial<IWhatsappConfigurationForm>>({});
  const [selectedWhatsappDetail, setSelectedWhatsappDetail] =
    useState<any>(null);

  // UI state for password visibility toggle
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const PLATFORM_OPTIONS = [
    { id: 1, name: "whatsapp.smalloffice.in" },
    { id: 2, name: "wa.smalloffice.in" },
  ];

  const CONFIGURE_TYPE_OPTIONS = [
    { id: 1, name: "QR Based" },
    { id: 2, name: "Cloud Based" },
  ];

  const fetchConfigurations = async () => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = { a_application_login_id };

    try {
      const response = await axiosInstance.post(
        "get-whatsapp-config",
        payload,
        {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": a_application_login_id,
          },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setFormData({
          platform: response.data.data.item.plateform,
          configureType: response.data.data.item.configured_type,
          whatsappPhoneNumberId:
            response.data.data.item.whatsapp_phone_number_id,
          whatsappWabaId: response.data.data.item.whatsapp_waba_id,
          whatsappApiKey: response.data.data.item.whatsapp_api_key,
        });
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  const fetchWhatsappWABAConfigDetails = async () => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = { a_application_login_id };

    try {
      const response = await axiosInstance.post(
        "get-whatsapp-waba-config-details",
        payload,
        {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": a_application_login_id,
          },
        },
      );

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setWhatsappWABAConfigDetails(response.data.data?.data || []);
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
      fetchWhatsappWABAConfigDetails();
    }
  }, [show]);

  useEffect(() => {
    if (
      whatsappWABAConfigDetails.length > 0 &&
      formData.whatsappPhoneNumberId
    ) {
      const selected = whatsappWABAConfigDetails.find(
        (item: any) => item.id === formData.whatsappPhoneNumberId,
      );

      if (selected) {
        setSelectedWhatsappDetail({
          value: selected.id,
          label: `${selected.display_phone_number} - ${selected.verified_name}`,
          phoneNumberId: selected.id,
          wabaId: selected.waba_id,
        });
      }
    }
  }, [whatsappWABAConfigDetails, formData.whatsappPhoneNumberId]);

  const createConfiguration = async (
    data: IWhatsappConfigurationForm = formData,
    showToast: boolean = true,
  ) => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
      a_application_login_id,
      plateform: data.platform,
      configured_type: data.configureType,
      whatsapp_phone_number_id: data.whatsappPhoneNumberId,
      whatsapp_waba_id: data.whatsappWabaId,
      whatsapp_api_key: data.whatsappApiKey,
    };

    try {
      const response = await axiosInstance.post(
        "create-whatsapp-config",
        payload,
        {
          headers: {
            Authorization: `${token}`,
            "x-tenant-id": a_application_login_id,
          },
        },
      );
      await fetchWhatsappWABAConfigDetails();

      if (showToast) {
        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(response.data.ack_msg);
        } else {
          toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  const handleChange = (
    key: keyof IWhatsappConfigurationForm,
    value: string,
  ) => {
    let updatedFormData = {
      ...formData,
      [key]: value,
    };

    if (key === "whatsappApiKey" && value.trim() === "") {
      updatedFormData = {
        ...updatedFormData,
        whatsappPhoneNumberId: "",
        whatsappWabaId: "",
      };
      setSelectedWhatsappDetail(null);
      setWhatsappWABAConfigDetails([]);
    }

    setFormData(updatedFormData);

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));

    if (key === "whatsappApiKey") {
      createConfiguration(updatedFormData, false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const whatsappOptions = whatsappWABAConfigDetails.map((item: any) => ({
    value: item.id,
    label: `${item.display_phone_number} - ${item.verified_name}`,
    phoneNumberId: item.id,
    wabaId: item.waba_id,
  }));

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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
                    Secure Environment Routing Platform
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
                {/* Section 01: Routing Scope */}
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
                    Gateway Routing Environment
                  </h6>

                  <div className="row g-3">
                    <div className="col-6">
                      <label
                        className="form-label mb-1 text-dark fw-medium"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Platform
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.platform}
                        onChange={(e) =>
                          handleChange("platform", e.target.value)
                        }
                      >
                        <option value={0}>Select Platform</option>
                        {PLATFORM_OPTIONS.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                      {errors.platform && (
                        <small className="text-danger d-block mt-1">
                          {errors.platform}
                        </small>
                      )}
                    </div>

                    <div className="col-6">
                      <label
                        className="form-label mb-1 text-dark fw-medium"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Configure Type
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.configureType}
                        onChange={(e) =>
                          handleChange("configureType", e.target.value)
                        }
                      >
                        <option value={0}>Select Type</option>
                        {CONFIGURE_TYPE_OPTIONS.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {errors.configureType && (
                        <small className="text-danger d-block mt-1">
                          {errors.configureType}
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 02: Platform Access Keys (Rendered when platform is chosen) */}
                {formData.platform == 2 && (
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
                      WABA Meta Server Credentials
                    </h6>

                    <div className="row g-3">
                      {/* WhatsApp API Key */}
                      <div className="col-12">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          WhatsApp API Key
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
                            placeholder="Enter WhatsApp API Key"
                            value={formData.whatsappApiKey}
                            onChange={(e) =>
                              handleChange("whatsappApiKey", e.target.value)
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
                            onClick={() =>
                              copyToClipboard(formData.whatsappApiKey)
                            }
                          >
                            Copy
                          </button>
                        </div>
                        {errors.whatsappApiKey && (
                          <small className="text-danger d-block mt-1">
                            {errors.whatsappApiKey}
                          </small>
                        )}
                      </div>

                      {/* WhatsApp Details Dropdown */}
                      <div className="col-12">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          WhatsApp Verified Profiles
                        </label>
                        <CustomSearchDropdown
                          isAsync={false}
                          options={whatsappOptions}
                          value={selectedWhatsappDetail}
                          onChange={(selected: any) => {
                            setSelectedWhatsappDetail(selected);
                            setFormData((prev) => ({
                              ...prev,
                              whatsappPhoneNumberId:
                                selected?.phoneNumberId || "",
                              whatsappWabaId: selected?.wabaId || "",
                            }));
                          }}
                          className="w-100 placeholder-sm"
                          placeholder="Search target WABA channel profile..."
                        />
                      </div>

                      {/* Phone Number ID & WABA ID Fields */}
                      <div className="col-6">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Phone Number ID
                        </label>
                        <input
                          type="text"
                          placeholder="Linked Profile Phone ID"
                          value={formData.whatsappPhoneNumberId}
                          onChange={(e) =>
                            handleChange(
                              "whatsappPhoneNumberId",
                              e.target.value,
                            )
                          }
                          className="form-control form-control-sm"
                        />
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label mb-1 text-dark fw-medium"
                          style={{ fontSize: "0.85rem" }}
                        >
                          WhatsApp WABA ID
                        </label>
                        <input
                          type="text"
                          placeholder="Linked Account WABA ID"
                          value={formData.whatsappWabaId}
                          onChange={(e) =>
                            handleChange("whatsappWabaId", e.target.value)
                          }
                          className="form-control form-control-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
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

export default WhatsappConfigurationView;
