  import React, { useState, useRef, useMemo } from "react";
  import { Modal, Button } from "react-bootstrap";
  import { useTheme } from "../ThemeContext";
  import OTPInput from "react-otp-input";
  import { axiosInstance } from "../../services/axiosInstance";
  import { toast } from "react-toastify";
  import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";

  interface OtpConfirmationModalProps {
    show: boolean;
    onHide: () => void;
    handleSubmit: () => void;
    title: string;
    message?: string;
    btn1?: string;
    btn2?: string;
    mobileNumber?: string;
    emailId?: string;
    profileId: number;
    position: 1 | 2 | 3 | 4;
  }

  const OtpConfirmationModal: React.FC<OtpConfirmationModalProps> = ({
    show,
    onHide,
    handleSubmit,
    title,
    message,
    btn1 = "Yes",
    btn2 = "No",
    mobileNumber,
    emailId,
    profileId,
    position,
  }) => {
    const { darkMode } = useTheme();
    const modalThemeClass = darkMode ? "modal-dark" : "modal-light-1";
    const [selectedOption, setSelectedOption] = useState<"whatsapp" | "email">("whatsapp");
    const [otp, setOtp] = useState("");
    const [responseMessage, setResponseMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [error, setError] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const token = useMemo(() => localStorage.getItem("token"), []);

    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedOption(event.target.value as "whatsapp" | "email");
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      if (!/^\d*$/.test(input)) {
        setError("Only numbers are allowed.");
        return;
      }
      if (input.length !== 10) {
        setError("Phone number must be exactly 10 digits.");
      } else {
        setError("");
      }
      setPhoneNumber(input);
    };

    const handleSendOTP = async () => {
      try {
        setIsSending(true);
        let responseData;

        if (position === 2) {
          if (!phoneNumber) {
            toast.error("Please enter a mobile number");
            return;
          }
          responseData = await axiosInstance.post(
            "changeNumberOtpSend",
            { contact_number: phoneNumber, loginId: profileId },
            { headers: { Authorization: `${token}` } }
          );
        } else if (position === 1) {
          responseData = await axiosInstance.post(
            "verifyUserOtp",
            {
              [selectedOption === "whatsapp" ? "contact_number" : "emailId"]:
                selectedOption === "whatsapp" ? mobileNumber : emailId,
              loginId: profileId,
            },
            { headers: { Authorization: `${token}` } }
          );
        } else {
          toast.error("Invalid position for OTP sending.");
          return;
        }

        if (responseData.data.code === 200) {
          setResponseMessage(`OTP sent via ${selectedOption || "method"}`);
        } else {
          toast.error(responseData.data.ack_msg);
        }
      } catch (error) {
        toast.error("Failed to send OTP. Please try again.");
      } finally {
        setIsSending(false);
      }
    };

    const handleConfirm = async () => {
      const endpointMap = {
        1: { url: "loginDelete", payload: { otp, loginId: profileId } },
        2: {
          url: "changeNumberOtpVerify",
          payload: { otp, loginId: profileId, contact_number: phoneNumber },
        },
        3: { url: "emailVerification", payload: { loginId: profileId, otp } },
        4: {
          url: "otpEmailVerificationCompany",
          payload: { company_id: profileId, company_otp: otp },
        },
      };

      if (!endpointMap[position]) {
        toast.error("Invalid position.");
        return;
      }

      if (!otp) {
        toast.error("Please enter OTP.");
        return;
      }

      try {
        const responseData = await axiosInstance.post(
          endpointMap[position].url,
          endpointMap[position].payload,
          { headers: { Authorization: `${token}` } }
        );

        if (responseData.data.code === 200 && responseData.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          handleSubmit();
        } else {
          toast.error(responseData.data.ack_msg);
        }
      } catch (error) {
        toast.error("Failed to verify OTP. Please try again.");
      }
    };

    const handleClose = () => {
      setOtp("");
      setResponseMessage("");
      setPhoneNumber("");
      setError("");
      setIsSending(false);
      onHide();
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
      index: number
    ) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setOtp(otp.slice(0, -1));
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        const newOtp = (otp + e.key).slice(0, 6);
        setOtp(newOtp);
        if (index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    };

    const handleInputChange = (value: string, index: number) => {
      if (/^\d?$/.test(value)) {
        const newOtp = otp.split("");
        newOtp[index] = value;
        setOtp(newOtp.join(""));
        if (value && index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    };

    return (
      <Modal
        show={show}
        onHide={handleClose}
        centered
        backdrop="static"
        className={modalThemeClass}
      >
        <div className={`p-10 m-title text-center ${modalThemeClass}`}>
          {title}
        </div>
        <Modal.Body className={modalThemeClass} >
          {message && (
            <p className={`m-title-2 text-center ${modalThemeClass}`}>
              {message}
            </p>
          )}
          {position === 1 && (
            <>
              <div className="text-center mb-3">
                <label className="fw-bold">Verify using</label>
                <div className="d-flex justify-content-center mt-2 flex-column">
                  {mobileNumber && (<div className="form-check me-3">
                    <input
                      type="radio"
                      id="whatsapp"
                      name="verificationOption"
                      value="whatsapp"
                      checked={selectedOption === "whatsapp"}
                      onChange={handleOptionChange}
                      className="form-check-input-custom"
                    />&nbsp;
                    <label htmlFor="whatsapp" className="form-check-label">
                      WhatsApp Number {mobileNumber ? `(${mobileNumber})` : ""}
                    </label>
                  </div>
                  )}
                  {emailId && ( <div className="form-check">
                    <input
                      type="radio"
                      id="email"
                      name="verificationOption"
                      value="email"
                      checked={selectedOption === "email"}
                      onChange={handleOptionChange}
                      className="form-check-input-custom"
                    />&nbsp;
                    <label htmlFor="email" className="form-check-label">
                      Email {emailId ? `(${emailId})` : ""}
                    </label>
                  </div>)}
                
                </div>
                {!responseMessage && (
                  <button
                    onClick={handleSendOTP}
                    className="btn btn-primary mt-3"
                    disabled={isSending}
                    style={{ backgroundColor: "#F58634" }}
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                )}
              </div>
            </>
          )}
          {position === 2 && (
            <>
              <div className="text-center mb-3">
                <label className="fw-bold">Enter new WhatsApp number</label>
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter new WhatsApp number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                />
                {error && <small className="text-danger mt-1 d-block">{error}</small>}
                {!responseMessage && (
                  <button
                    onClick={handleSendOTP}
                    className="btn btn-primary mt-3"
                    disabled={isSending}
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                )}
              </div>
            </>
          )}
          {((position === 1 || position === 2 || position === 3 || position === 4) 
            ) || (position === 3 && !responseMessage) ? (
              <>
                <div className="text-center text-success mb-3">
                  <strong>{responseMessage}</strong>
                </div>
                <div className="text-center">
                  <label htmlFor="OTP" className="mb-2 fw-bold">
                    Enter OTP <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex justify-content-center" style={{ margin: "8px" }}>
                    <OTPInput
                      value={otp}
                      onChange={setOtp}
                      numInputs={6}
                      renderSeparator={<span style={{ margin: "5px" }}>-</span>}
                      renderInput={(props, index) => (
                        <input
                          {...props}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="password"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={1}
                          aria-label={`OTP digit ${index + 1}`}
                          style={{ width: "40px", padding: "5px" }}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onChange={(e) => handleInputChange(e.target.value, index)}
                          autoFocus={index === 0}
                        />
                      )}
                      shouldAutoFocus
                    />
                  </div>
                </div>
              </>
            ): ("")
          }
          <div className="d-flex justify-content-end" style={{ marginTop: "20px" }}>
            <Button className="me-2 px-4" onClick={handleClose} style={{ backgroundColor: "#DC3545" }}>
              {btn1}
            </Button>
             <Button className="px-4" onClick={handleConfirm} style={{ backgroundColor: "#F58634" }}>
              {btn2}
            </Button> 

          </div>
        </Modal.Body>
      </Modal>
    );
  };

  export default OtpConfirmationModal;