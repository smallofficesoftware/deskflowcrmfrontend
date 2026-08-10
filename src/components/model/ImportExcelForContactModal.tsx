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
  const onSubmit = async () => {
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
        }
        break;
      case 5:
        try {
          setErrorResponceMeg("");
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
        }
        break;
      default:
        alert("default");
        break;
    }
  };

  const handleHide = () => {
    setAttachment(null);
    onHide();
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
            <span className="close" onClick={onHide}>
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
                <>
                  <p className="text-dark">
                    In the Compensation Adjustment Sheet, specify <b>employee_id</b>, <b>type</b> (e.g. Early Exit Hours-HOURS-DEBIT, Overtime, etc.), <b>adjustment_type</b> (1=Credit Hours, 2=Debit Hours, 3=Credit Amount, 4=Debit Amount), <b>hours</b> / <b>amount</b>, and <b>apply_date</b> (YYYY-MM-DD).
                  </p>
                </>
              )}
            </div>
            {errorResponceMeg && (
              <div
                style={{
                  height: "200px",
                  overflow: "scroll",
                  border: "2px solid #000000",
                  padding: "5px",
                }}
                className="text-danger"
              >
                {<SafeHtml htmlContent={errorResponceMeg} />}
              </div>
            )}
            <div className="modal-buttons">
              <button className="modal-button1" onClick={handleHide}>
                {btn1}
              </button>
              <button
                className="modal-button2"
                style={{ color: "white" }}
                onClick={onSubmit}
              >
                {btn2}
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
