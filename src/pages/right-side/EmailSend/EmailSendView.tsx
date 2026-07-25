import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import EmailCustomEditor from "../../../components/EmailCustomEditor";
import { useTheme } from "../../../components/ThemeContext";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_STATUS_CODE_SUCCESS,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstanceFormData } from "../../../services/axiosInstance";

const EmailSendView = ({
  show,
  onHide,
  title,
  btn1 = "Yes",
  btn2 = "No",
  contactInfo,
  setLoading,
}: {
  show: boolean;
  onHide: () => void;
  title: string;
  btn1: string;
  btn2: string;
  contactInfo: any;
  setLoading: TReactSetState<boolean>;
}) => {
  const { darkMode } = useTheme();
  const MAX_FILE_SIZE_MB = 10; // Maximum file size in MB
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [editorContent, setEditorContent] = useState<string>("");
  const [email, setEmail] = useState(contactInfo?.email_id || "");
  const [ccEmail, setCcEmail] = useState(""); // New CC email state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [ccEmailError, setCcEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Email validation function
  const validateEmail = (
    value: string,
    setError: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (value && !emailRegex.test(value)) {
      setError("Invalid email address");
    } else {
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    setLoading(false);
    if (message.trim()) {
      if (!getUUID) {
        toast.error("UUID not found, please try again.");
        return;
      }
setSending(true);
      try {
        if (message.trim()) {
          if (!getUUID) {
            toast.error("UUID not found, please try again.");
            return;
          }
          const formData1 = new FormData();
          if (attachment) {
            const validTypes = [
              "image/jpeg",
              "image/png",
              "application/pdf",
              "application/msword", // .doc
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
              "application/zip",
              "image/svg+xml",
              "video/mp4",
              "video/x-matroska", // .mkv
              "video/mpeg",
              "text/plain",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
              "application/vnd.ms-excel", // .xls
              "application/vnd.ms-powerpoint", // .ppt
              "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
              "text/csv",
              "application/xml",
              "text/xml",
            ];
            const fileType = attachment.type;

            if (!validTypes.includes(fileType)) {
              toast.error(
                "Invalid file format. Please upload a jpeg, jpg, png, pdf, docx, zip, svg, mp4, mkv, mpeg, txt, xlsx, xls, ppt, pptx, csv, xml"
              );
              return;
            }

            if (attachment.size > MAX_FILE_SIZE_BYTES) {
              toast.error(
                `File is too large. Please upload a file smaller than ${MAX_FILE_SIZE_MB} MB.`
              );
              return;
            }

            formData1.append("file", attachment);
          }
          formData1.append("email", email);
          formData1.append("ccEmail", ccEmail); // Add CC email to form data
          formData1.append("subject", subject);
          formData1.append("message", message);
          formData1.append("contact_masters_id", contactInfo?.id || "");
          formData1.append("a_application_login_id", getUUID);
          formData1.append("message_type_id", "1");

          try {
            const uploadResponse = await axiosInstanceFormData.post(
              "sendMailToMsg",
              formData1
            );

            if (uploadResponse.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
              toast.success(uploadResponse.data.ack_msg);
              // Clear form fields after success
              setLoading(true);
              setEmail("");
              setCcEmail("");
              setSubject("");
              setMessage("");
              setAttachment(null);
              onHide(); // Close modal
            } else {
              toast.error(uploadResponse.data.ack_msg);
            }
          } catch (uploadError: any) {
            toast.error(
              uploadError.response?.data?.message || "File upload failed."
            );
          }
        } else {
          toast.error("Message cannot be empty.");
        }
      } catch (emailError: any) {
        toast.error(
          emailError?.response.data.message || "Failed to send email."
        );
      } finally {
         setSending(false);
      }
    } else {
      toast.error("Please fill Description and Email");
    }
  };

  const handleSave = (e: any) => {
    handleSubmit1(e);
  };
  const isSubmitDisabled = emailError !== null || email.trim() === "";

 return (
  <React.Fragment>
    <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
      <div className={`p-10 m-title ${modalThemeClass}`}>{title}</div>
      <Modal.Body className={`${modalThemeClass}`}>
        {sending? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 fw_500">
              Please wait, email is sending...
            </p>
          </div>
        ) : (
          <>
            <div>
              <label>To Email</label>
              <span className="text-danger">*</span>
              <input
                type="email"
                placeholder="Recipient Email"
                value={email}
                maxLength={BIG_TEXT_LENGTH}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email, setEmailError)}
                required
                className="form-control font-size-15 rounded-1"
              />
              {emailError && <span className="text-danger">{emailError}</span>}
            </div>

            <div>
              <label>CC Email</label>
              <input
                type="email"
                placeholder="CC Email"
                value={ccEmail}
                maxLength={BIG_TEXT_LENGTH}
                onChange={(e) => {
                  setCcEmail(e.target.value);
                }}
                className="form-control font-size-15 rounded-1"
              />
              {ccEmailError && (
                <span className="text-danger">{ccEmailError}</span>
              )}
            </div>

            <div>
              <label>Subject</label>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                maxLength={BIG_TEXT_LENGTH}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="form-control font-size-15 rounded-1"
              />
            </div>

            <div>
              <label>Description</label>
              <span className="text-danger">*</span>
              <EmailCustomEditor
                text1={message}
                setMessage={setMessage}
              />
            </div>

            <div style={{ border: "1px solid #dee2e6", borderTop: "hidden" }}>
              <div className="col-12 d-flex">
                <div className="px-2 chat-attach">
                  <label
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    htmlFor="file-upload"
                  >
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M330-240q-104 0-177-73T80-490q0-104 73-177t177-73h370q75 0 127.5 52.5T880-560q0 75-52.5 127.5T700-380H350q-46 0-78-32t-32-78q0-46 32-78t78-32h370v80H350q-13 0-21.5 8.5T320-490q0 13 8.5 21.5T350-460h350q42-1 71-29.5t29-70.5q0-42-29-71t-71-29H330q-71-1-120.5 49T160-490q0 70 49.5 119T330-320h390v80H330Z" />
                    </svg>
                  </label>

                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
                <div className="ml-2 d-flex align-items-center">
                  {attachment ? (
                    <span>{attachment.name}</span>
                  ) : (
                    <span>No file selected</span>
                  )}
                </div>
              </div>
            </div>

            <p>{status}</p>

            <div className="d-flex justify-content-end m-btn">
              <Button className="mr-2 px-4 btn1" onClick={onHide}>
                {btn1}
              </Button>
              <Button
                className="px-4 ms-2 btn2"
                onClick={handleSave}
                disabled={isSubmitDisabled}
              >
                {btn2}
              </Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  </React.Fragment>
);
};

export default EmailSendView;
