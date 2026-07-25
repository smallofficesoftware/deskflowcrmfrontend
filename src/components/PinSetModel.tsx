import React, { useRef, useState } from "react";
import OTPInput from "react-otp-input";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../helpers/AppConstants";
import { axiosInstance } from "../services/axiosInstance";

interface ApiResponse {
  code: number;
  ack: number;
  ack_msg?: string;
}

const PinSetModel = () => {
  const [showPopUp, setShowPopUp] = useState<boolean>(true);
  const [otp, setOtp] = useState<string>("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit PIN.");
      return;
    }

    const getUUID = localStorage.getItem("UUID");
    if (!getUUID) {
      toast.error("User ID not found.");
      return;
    }

    const requestData = {
      table: "a_application_logins",
      where: `{"id":"${getUUID}"}`,
      data: `{"login_pin":"${otp}"}`,
    };

    try {
      const { data } = await axiosInstance.post<ApiResponse>("commonUpdate", requestData);

      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success("PIN updated successfully!");
          setShowPopUp(false);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error) {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleOtpChange = (value: string) => {
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
    }
  };

  const handleInputChange = (value: string, index: number) => {
    // Handle pasted input or other changes
    if (value.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    } else if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setOtp(otp.slice(0, index - 1));
    } else if (e.key === "Backspace" && otp[index]) {
      const newOtp = otp.split("");
      newOtp[index] = "";
      setOtp(newOtp.join(""));
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault(); // Prevent default to avoid double input
      const newOtp = otp.split("");
      newOtp[index] = e.key;
      setOtp(newOtp.join(""));
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  return (
    <>
      {showPopUp && (
        <div
          className="video-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="video-modal"
            style={{
              position: "relative",
              width: "90%",
              maxWidth: "500px",
              background: "#fff",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  minHeight: "300px",
                  maxHeight: "70vh",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "10px",
                }}
              >
                <div>
                  <p className="text-center h2 fw-bold mb-3 mt-4">
                    Set Your Login PIN
                  </p>
                  <p
                    className="font-size-17"
                    style={{
                      color: "#999",
                      textAlign: "center",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Enter Your 6-digit Login PIN
                  </p>

                  <div className="text-center py-3">
                    <label htmlFor="otp" className="mb-2 fw-bold">
                      Enter PIN
                      <span className="text-danger">*</span>
                    </label>
                    <div
                      style={{
                        margin: "0",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <OTPInput
  value={otp}
  onChange={handleOtpChange}
  numInputs={6}
  renderSeparator={<span style={{ marginRight: "8px" }}>-</span>}
  renderInput={(props, index) => (
    <input
      {...props}
      ref={(el) => (inputRefs.current[index] = el)}
      type="password" 
      inputMode="numeric"
      pattern="\d*"
      maxLength={1}
      style={{
        height: "45px",
        width: "45px",
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "4px",
        margin: "0 2px",
      }}
      onKeyDown={(e) => handleKeyDown(e, index)}
      onChange={(e) => {
        handleInputChange(e.target.value, index);
      }}
      autoFocus={index === 0}
    />
  )}
  shouldAutoFocus
/>
                    </div>
                  </div>
                  <p
                    className="font-size-17"
                    style={{
                      color: "#999",
                      textAlign: "center",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Use At Next Login Without OTP
                  </p>

                  <div className="mt-3 w-100" style={{ padding: "0 10px" }}>
                    <button
                      type="submit"
                      className="btn text-light w-100 py-2 rounded-1 fw_500"
                      style={{
                        backgroundColor: "#f58634",
                        border: "none",
                        cursor: otp.length === 6 ? "pointer" : "not-allowed",
                        opacity: otp.length === 6 ? 1 : 0.6,
                      }}
                      disabled={otp.length !== 6}
                    >
                      Set Pin
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PinSetModel;