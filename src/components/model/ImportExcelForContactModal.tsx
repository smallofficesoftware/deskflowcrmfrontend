import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import {
  axiosInstance,
  axiosInstanceProductAndContact,
} from "../../services/axiosInstance";
import SafeHtml from "../SafeHtml";
import "./ConfirmationModal.css";

interface IImportExcelForContactModal {
  show: boolean;
  onHide: () => void;
  handleSubmit: () => void;
  title: string;
  message: string;
  btn1: string;
  btn2: string;
  sampleLocation: string;
  potions: number;
  pricelistId?: number;
}

const ImportExcelForContactModal: React.FC<IImportExcelForContactModal> = ({
  show,
  onHide,
  handleSubmit,
  title,
  message,
  btn1,
  btn2,
  sampleLocation,
  potions,
  pricelistId,
}) => {
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorResponceMeg, setErrorResponceMeg] = useState<string>("");
  const [successResponseMsg, setSuccessResponseMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const onSubmit = async () => {
    if (isSubmitting) return;
    if (!attachment) {
      toast.error("Please select a file to upload");
      return;
    }
    const validExcelTypes = [
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ];
    if (!validExcelTypes.includes(attachment.type)) {
      toast.error("Please upload a valid Excel file (.xls or .xlsx)");
      return;
    }

    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    if (!getUUID) {
      return;
    }

    const formData = new FormData();
    formData.append("file", attachment);
    formData.append("a_application_login_id", getUUID);

    setIsSubmitting(true);
    setErrorResponceMeg("");
    setSuccessResponseMsg("");

    switch (potions) {
      case 1:
        try {
          setErrorResponceMeg("");
          const response = await axiosInstanceProductAndContact.post(
            "excel-sheet-v2",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          if (response && response.data.ack === 1) {
            // handleSubmit();
            setAttachment(null);
            toast.success(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
          } else {
            toast.error(
              response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
          }
          const msg = response?.data?.data;
          setErrorResponceMeg(typeof msg === "string" ? msg : "");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED); // Show error toast
        } finally {
          setUploadProgress(0); // Reset progress in all cases
          setIsSubmitting(false);
        }
        break;
      case 2:
        try {
          setErrorResponceMeg("");
          const response = await axiosInstanceProductAndContact.post(
            "excel-sheet-product-v2",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          if (response && response.data.ack === 1) {
            handleSubmit();
            setAttachment(null);
            toast.success(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
          } else {
            // toast.error(
            //   response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            // );
          }
          const msg = response?.data?.data;
          setErrorResponceMeg(typeof msg === "string" ? msg : "");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED); // Show error toast
        } finally {
          setUploadProgress(0); // Reset progress in all cases
          setIsSubmitting(false);
        }
        break;
      case 3:
        try {
          setErrorResponceMeg("");
          const response = await axiosInstanceProductAndContact.post(
            "excel-sheet-task",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          if (response && response.data.ack === 1) {
            handleSubmit();
            setAttachment(null);
            toast.success(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
          } else {
            // toast.error(
            //   response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            // );
          }
          const msg = response?.data?.data;
          setErrorResponceMeg(typeof msg === "string" ? msg : "");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED); // Show error toast
        } finally {
          setUploadProgress(0); // Reset progress in all cases
          setIsSubmitting(false);
        }
        break;
      case 4:
        try {
          setErrorResponceMeg("");
          const response = await axiosInstanceProductAndContact.post(
            "excel-sheet-attendance",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          if (response && response.data.ack === 1) {
            handleSubmit();
            setAttachment(null);
            toast.success(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
          } else {
            // toast.error(
            //   response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            // );
          }
          const msg = response?.data?.data;
          setErrorResponceMeg(typeof msg === "string" ? msg : "");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED); // Show error toast
        } finally {
          setUploadProgress(0); // Reset progress in all cases
          setIsSubmitting(false);
        }
        break;
      case 5:
        try {
          setErrorResponceMeg("");
          setSuccessResponseMsg("");
          const response = await axiosInstanceProductAndContact.post(
            "excel-sheet-product-update-data",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          const errorDetails = response?.data?.data;
          if (errorDetails && typeof errorDetails === "string") {
            setErrorResponceMeg(errorDetails);
          }

          if (response && response.data.ack === 1) {
            setAttachment(null);
            setSuccessResponseMsg(
              response.data.ack_msg || "Successfully updated products.",
            );
          } else if (!errorDetails) {
            setErrorResponceMeg(
              response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          setErrorResponceMeg(MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
          setUploadProgress(0); // Reset progress in all cases
          setIsSubmitting(false);
        }
        break;
      case 6:
        try {
          setErrorResponceMeg("");
          const response = await axiosInstanceProductAndContact.post(
            "excel-sheet-pricelist-update-data",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          if (response && response.data.ack === 1) {
            handleSubmit();
            setAttachment(null);
            toast.success(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
          } else {
            // toast.error(
            //   response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            // );
          }
          const msg = response?.data?.data;
          setErrorResponceMeg(typeof msg === "string" ? msg : "");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED); // Show error toast
        } finally {
          setUploadProgress(0); // Reset progress in all cases
          setIsSubmitting(false);
        }
        break;
      case 7:
        try {
          setErrorResponceMeg("");
          const response = await axiosInstance.post(
            "excel-sheet-compensation-adjustment",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  setUploadProgress(percentCompleted);
                } else {
                  console.log(
                    `File upload progress: Unable to determine total file size`,
                  );
                }
              },
            },
          );

          if (response && response.data.ack === 1) {
            handleSubmit();
            setAttachment(null);
            toast.success(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
          } else {
            toast.error(
              response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
          }
          const msg = response?.data?.data;
          setErrorResponceMeg(typeof msg === "string" ? msg : "");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
          setUploadProgress(0);
          setIsSubmitting(false);
        }
        break;
      default:
        alert("default");
        break;
    }
  };

  const handleHide = () => {
    if (isSubmitting) return;
    setAttachment(null);
    setErrorResponceMeg("");
    const wasSuccess = !!successResponseMsg;
    setSuccessResponseMsg("");
    if (wasSuccess) {
      handleSubmit();
    } else {
      onHide();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };
  const [isGenerateSampleExport, setIsGenerateSampleExport] = useState(false);

  const hanndelChangeExportSampleSheet = async () => {
    switch (potions) {
      case 1:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
          };

          const { data } = await axiosInstance.post(
            "generate-contact-sample-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerateSampleExport(false);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        break;
      case 2:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
          };

          const { data } = await axiosInstance.post(
            "generate-product-sample-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerateSampleExport(false);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        break;
      case 3:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
          };

          const { data } = await axiosInstance.post(
            "generate-Task-sample-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerateSampleExport(false);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        break;
      case 4:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
          };

          const { data } = await axiosInstance.post(
            "generate-attendance-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerateSampleExport(false);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        break;
      case 5:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
          };

          const { data } = await axiosInstance.post(
            "generate-product-update-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerateSampleExport(false);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        break;
      case 6:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
            pricelistId: pricelistId,
          };

          const { data } = await axiosInstance.post(
            "generate-pricelist-update-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerateSampleExport(false);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        break;
      case 7:
        try {
          setIsGenerateSampleExport(true);
          const getUUID = localStorage.getItem("UUID");
          const requestData = {
            a_application_login_id: getUUID,
          };

          const { data } = await axiosInstance.post(
            "generate-compensation-adjustment-sample-sheet",
            requestData,
          );

          if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        } catch (error: any) {
          toast.error(error?.message || error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
          setIsGenerateSampleExport(false);
        }
        break;
      default:
        alert("default");
        break;
    }
  };

  return (
    <div>
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ width: "40%" }}>
            <span
              className="close"
              onClick={!isSubmitting ? handleHide : undefined}
              style={{
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.4 : 1,
                pointerEvents: isSubmitting ? "none" : "auto",
              }}
            >
              ×
            </span>
            <h2 className="modal-title1 form_header_text">{title}</h2>

            <div className={`m-title-2 row`}>
              <label
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                htmlFor="file-upload-contact"
              >
                <div className="col-12 card p-4">
                  <div className="text-center">
                    {attachment ? (
                      <span>
                        <b>{attachment.name}</b>
                      </span>
                    ) : (
                      <span>No file selected</span>
                    )}
                  </div>
                </div>
              </label>
              <input
                type="file"
                id="file-upload-contact"
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept=".xlsx"
              />
              <a
                className=""
                style={{ marginTop: "10px", cursor: "pointer" }}
                onClick={hanndelChangeExportSampleSheet}
              >
                Download Sample Excel
                {isGenerateSampleExport && (
                  <span
                    className="px-1"
                    style={{
                      color: "#aaa",
                      // float: "left",
                      margin: "0px",
                      padding: "0px",
                      lineHeight: "1",
                    }}
                  >
                    <div
                      style={{ fontWeight: "normal" }}
                      className="spinner-border text-secondary"
                      role="status"
                    ></div>
                  </span>
                )}
              </a>
            </div>

            <div>
              <p className="text-danger">
                {" "}
                The Excel file you are importing will automatically Accept the
                current date from the system.
              </p>
              {potions == 3 && (
                <>
                  <p className="text-dark">
                    If you select <strong>Weekly</strong>, you must choose
                    Selected days.
                    <br />
                    For <strong>Monthly</strong>, <strong>Yearly</strong>, or
                    any other recurring option, you must select the Selected
                    date.
                  </p>

                  <p className="text-dark">
                    If "Send WhatsApp notification" is Yes OR "Send Email
                    notification" is Yes (even if only one of them is selected),
                    then the task will be created as an individual task for each
                    team member.
                  </p>

                  <p className="text-dark">
                    In the task creation, if you add <b>1</b> in{" "}
                    <b>(is_task_groups_or_individual)</b>
                    it will create the task as a group task and if you add{" "}
                    <b>2</b> it will create it as an individual task (separate
                    task for each person).
                  </p>
                </>
              )}
              {potions == 4 && (
                <>
                  <p className="text-dark">
                    In the Attendance Sheet, if you add <b>1</b> in{" "}
                    <b>(status)</b>
                    it will be for <b>In</b> Status and if you add <b>2</b> it
                    will be for <b>Out</b> Status.
                  </p>
                </>
              )}
              {potions == 5 && (
                <>
                  <div className="alert alert-warning border-0 mb-3">
                    <strong>Note:</strong> Do not remove the{" "}
                    <code>product_id</code> column or its value. This field is
                    mandatory for internal system functionality.
                  </div>
                </>
              )}
              {potions == 6 && (
                <>
                  <div className="alert alert-warning border-0 mb-3">
                    <strong>Note:</strong> Do not remove the{" "}
                    <code>pricelist_id</code> column or its value. This field is
                    mandatory for internal system functionality.
                  </div>
                </>
              )}
              {potions == 7 && (
                <div
                  className="rounded p-3 my-2"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    textAlign: "left",
                  }}
                >
                  <div
                    className="fw-bold mb-2 text-secondary"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Sheet Column Guidelines
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <div>
                      <code
                        className="fw-semibold rounded"
                        style={{
                          backgroundColor: "#eef2f6",
                          color: "#344054",
                          border: "1px solid #d0d5dd",
                          fontSize: "12px",
                          padding: "2px 7px",
                          cursor: "default",
                        }}
                      >
                        employee_id
                      </code>
                      <span className="ms-2 text-muted">— Employee ID number</span>
                    </div>

                    <div>
                      <code
                        className="fw-semibold rounded"
                        style={{
                          backgroundColor: "#eef2f6",
                          color: "#344054",
                          border: "1px solid #d0d5dd",
                          fontSize: "12px",
                          padding: "2px 7px",
                          cursor: "default",
                        }}
                      >
                        type
                      </code>
                      <span className="ms-2 text-muted">
                        — e.g. <em>Early Exit Hours-HOURS-DEBIT</em>, <em>Overtime</em>
                      </span>
                    </div>

                    <div>
                      <div className="mb-1">
                        <code
                          className="fw-semibold rounded"
                          style={{
                            backgroundColor: "#eef2f6",
                            color: "#344054",
                            border: "1px solid #d0d5dd",
                            fontSize: "12px",
                            padding: "2px 7px",
                            cursor: "default",
                          }}
                        >
                          adjustment_type
                        </code>
                        <span className="ms-2 text-muted">
                          — Numeric code (1 to 4):
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 ps-2 mt-1">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#d4edda",
                            color: "#155724",
                            border: "1px solid #c3e6cb",
                            fontWeight: 500,
                            fontSize: "11px",
                            padding: "4px 7px",
                          }}
                        >
                          <b>1</b> = Credit Hours
                        </span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#f8d7da",
                            color: "#721c24",
                            border: "1px solid #f5c6cb",
                            fontWeight: 500,
                            fontSize: "11px",
                            padding: "4px 7px",
                          }}
                        >
                          <b>2</b> = Debit Hours
                        </span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#d4edda",
                            color: "#155724",
                            border: "1px solid #c3e6cb",
                            fontWeight: 500,
                            fontSize: "11px",
                            padding: "4px 7px",
                          }}
                        >
                          <b>3</b> = Credit Amount
                        </span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#f8d7da",
                            color: "#721c24",
                            border: "1px solid #f5c6cb",
                            fontWeight: 500,
                            fontSize: "11px",
                            padding: "4px 7px",
                          }}
                        >
                          <b>4</b> = Debit Amount
                        </span>
                      </div>
                    </div>

                    <div>
                      <code
                        className="fw-semibold rounded"
                        style={{
                          backgroundColor: "#eef2f6",
                          color: "#344054",
                          border: "1px solid #d0d5dd",
                          fontSize: "12px",
                          padding: "2px 7px",
                          cursor: "default",
                        }}
                      >
                        hours
                      </code>
                      <span className="mx-1 text-muted">/</span>
                      <code
                        className="fw-semibold rounded"
                        style={{
                          backgroundColor: "#eef2f6",
                          color: "#344054",
                          border: "1px solid #d0d5dd",
                          fontSize: "12px",
                          padding: "2px 7px",
                          cursor: "default",
                        }}
                      >
                        amount
                      </code>
                      <span className="ms-2 text-muted">— Adjustment value</span>
                    </div>

                    <div>
                      <code
                        className="fw-semibold rounded"
                        style={{
                          backgroundColor: "#eef2f6",
                          color: "#344054",
                          border: "1px solid #d0d5dd",
                          fontSize: "12px",
                          padding: "2px 7px",
                          cursor: "default",
                        }}
                      >
                        apply_date
                      </code>
                      <span className="ms-2 text-muted">
                        — Date of adjustment (e.g. <span className="fw-semibold text-dark">DD-MM-YYYY</span>, <span className="fw-semibold text-dark">DD-MM-YY</span>, <span className="fw-semibold text-dark">YYYY-MM-DD</span>)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {(successResponseMsg || errorResponceMeg) && (
              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  backgroundColor:
                    successResponseMsg && !errorResponceMeg
                      ? "#f0fff4"
                      : "#fff5f5",
                  border: `1px solid ${
                    successResponseMsg && !errorResponceMeg
                      ? "#9ae6b4"
                      : "#feb2b2"
                  }`,
                  borderRadius: "6px",
                  padding: "10px 14px",
                  marginTop: "10px",
                  marginBottom: "15px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  textAlign: "left",
                }}
              >
                {successResponseMsg && (
                  <div
                    style={{
                      color: "#22543d",
                      fontWeight: "bold",
                      marginBottom: errorResponceMeg ? "8px" : "0px",
                    }}
                  >
                    ✓ {successResponseMsg}
                  </div>
                )}
                {errorResponceMeg && (
                  <div style={{ color: "#c53030" }}>
                    <SafeHtml htmlContent={errorResponceMeg} />
                  </div>
                )}
              </div>
            )}
            <div className="modal-buttons">
              <button
                className="modal-button1"
                onClick={handleHide}
                disabled={isSubmitting}
                style={{
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {btn1}
              </button>
              <button
                className="modal-button2"
                style={{
                  color: "white",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Importing..." : btn2}
              </button>
            </div>
          </div>
          {uploadProgress > 0 && (
            <div className="fullscreen-loader">
              <div className="loader-content">
                <div className="spinner"></div>
                <p>Uploading... {uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportExcelForContactModal;
