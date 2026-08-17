import React, { useEffect, useState } from "react";
import { logOutApi } from "../../../pages/left-side/LeftSideController";
import { isRealEmail } from "../../../utils/emailValidator";
import {
  IRequiredDetail,
  verifyEmailAddress,
  verifyNewEmailAddress,
  verifyNewNumberOTP,
  verifyOldEmailOTP,
} from "./emailAddressChangeModelController";

interface IPropsMobileNumberChangeModel {
  show: boolean;
  onHide: () => void;
  RequiredDetail: IRequiredDetail;
}
const EmailAddressChangeModelView = ({
  show,
  onHide,
  RequiredDetail,
}: IPropsMobileNumberChangeModel) => {
  const [emailAddress, setEmailAddress] = useState("");
  const [isEditedEmailAddress, setIsEditedEmailAddress] = useState(false);
  const [isOTPSend, setIsOTPSend] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [isOTPVerifiedAutoGen, setIsOTPVerifiedAutoGen] = useState(false);
  const [isNewOTPSend, setIsNewOTPSend] = useState(false);
  const [isNewOTPVerified, setIsNewOTPVerified] = useState(false);
  const [oldNumberOTPSendReponseMsg, setOldNumberOTPSendReponseMsg] =
    useState("");
  const [oldEmailEnteredOTP, setOldEmailEnteredOTP] = useState("");
  const [newEnteredEmailAddress, setNewEnteredNumber] = useState("");
  const [newEnteredOTP, setNewEnteredOTP] = useState("");
  const [newNumberOTPSendReponseMsg, setNewNumberOTPSendReponseMsg] =
    useState("");
  const [isNewEmailAddressFieldDisabled, setIsNewNumberFieldDisabled] =
    useState(false);
  const [isOldEmailButtonDisabled, setIsOldEmailButtonDisabled] =
    useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [newEmailError, setNewEmailError] = useState<string>("");

  const [isFirstEmailOTPLoading, setIsFirstEmailOTPLoading] =
    useState<boolean>(false);
  const [isFirstEmailVerifyOTPLoading, setIsFirstEmailVerifyOTPLoading] =
    useState<boolean>(false);
  const [isFirstNewEmailVerifyLoading, setIsFirstNewEmailVerifyLoading] =
    useState<boolean>(false);
  const [isFirstNewEmailVerifyOTPLoading, setIsFirstNewEmailVerifyOTPLoading] =
    useState<boolean>(false);

  useEffect(() => {
    if (!show) return;
    setEmailAddress(
      !RequiredDetail.is_auto_generate_email
        ? RequiredDetail.email_address || ""
        : "",
    );
    setIsEditedEmailAddress(!RequiredDetail.is_auto_generate_email);
  }, [show]);

  const handleEmailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailAddress(e.target.value);
    if (!e.target.value) {
      setEmailError("Email is required");
    } else if (!isRealEmail(e.target.value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handelChangeSetOldEmailOTP = async (otp: string) => {
    setOldEmailEnteredOTP(otp);
  };

  const handelChangeSetNewEmaillAddress = async (newNumber: string) => {
    setNewEnteredNumber(newNumber);
    if (!newNumber) {
      setNewEmailError("Email is required");
    } else if (!isRealEmail(newNumber)) {
      setNewEmailError("Please enter a valid email address");
    } else {
      setNewEmailError("");
    }
  };

  const handelChangeSetNewOTP = async (newOTP: string) => {
    setNewEnteredOTP(newOTP);
  };

  const handelClose = () => {
    setEmailAddress("");
    setIsEditedEmailAddress(true);
    setIsOTPSend(false);
    setIsOTPVerified(false);
    setIsOTPVerifiedAutoGen(false);
    setIsNewOTPSend(false);
    setIsNewOTPVerified(false);
    setOldNumberOTPSendReponseMsg("");
    setOldEmailEnteredOTP("");
    setNewEnteredNumber("");
    setNewEnteredOTP("");
    setNewNumberOTPSendReponseMsg("");
    setIsNewNumberFieldDisabled(false);
    setIsOldEmailButtonDisabled(false);
    onHide();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        // Allow Enter to submit the form if the Save Product button is focused
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.classList.contains("save-product-button")) {
          return; // Let the default behavior (form submission) proceed
        }
        event.preventDefault(); // Prevent default Enter behavior for other elements
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  const handelClickVerifyEmailAddress = async () => {
    await verifyEmailAddress(
      emailAddress,
      setIsFirstEmailOTPLoading,
      setOldNumberOTPSendReponseMsg,
      setIsOTPSend,
      RequiredDetail,
    );
  };

  const handelClickVerifyNewNumberOTP = async () => {
    await verifyNewNumberOTP(
      newEnteredOTP,
      newEnteredEmailAddress,
      setIsNewOTPVerified,
      setIsNewNumberFieldDisabled,
      logOutApi,
      setIsFirstNewEmailVerifyOTPLoading,
    );
  };

  const handelClickVerifyNewEmailAddress = async () => {
    await verifyNewEmailAddress(
      newEnteredEmailAddress,
      setIsNewOTPSend,
      setNewNumberOTPSendReponseMsg,
      setIsFirstNewEmailVerifyLoading,
    );
  };

  const handelClickVerifyOldEmailOTP = async () => {
    await verifyOldEmailOTP(
      oldEmailEnteredOTP,
      RequiredDetail,
      emailAddress,
      setIsOldEmailButtonDisabled,
      setIsOTPVerifiedAutoGen,
      setIsOTPVerified,
      logOutApi,
      setIsFirstEmailVerifyOTPLoading,
    );
  };

  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1">
            <div className="d-flex align-items-center justify-content-between">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">
                  {RequiredDetail?.title}
                </h2>
              </div>
              <div className="col-4">
                <span
                  className="close ms-3 pb-3"
                  onClick={handelClose}
                  style={{ cursor: "pointer" }}
                >
                  ×
                </span>
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-8">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    disabled={isEditedEmailAddress}
                    type="text"
                    className="form-control"
                    placeholder="Enter Your Email Address"
                    onChange={handleEmailAddressChange}
                    value={emailAddress || ""}
                  />
                  {oldNumberOTPSendReponseMsg && (
                    <p className="text-info">{oldNumberOTPSendReponseMsg}</p>
                  )}
                  {emailError && (
                    <p style={{ color: "red", fontSize: "12px" }}>
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
              <div className="col-4">
                <button
                  disabled={isOldEmailButtonDisabled || isFirstEmailOTPLoading}
                  onClick={handelClickVerifyEmailAddress}
                  className="btn btn-primary"
                  style={{ marginTop: "25px" }}
                >
                  {isFirstEmailOTPLoading ? `○○ Verifying...` : `Verify`}
                </button>
              </div>

              {isOTPSend && (
                <>
                  <div className="col-8">
                    <div className="form-group">
                      <label>Enter OTP</label>
                      <input
                        type="text"
                        className="form-control"
                        value={oldEmailEnteredOTP}
                        onChange={(e) =>
                          handelChangeSetOldEmailOTP(e.target.value)
                        }
                      />
                      {(isOTPVerified || isOTPVerifiedAutoGen) && (
                        <p style={{ color: "green" }}>
                          &#x2714; Email Address verified
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-4">
                    <button
                      disabled={isFirstEmailVerifyOTPLoading}
                      onClick={handelClickVerifyOldEmailOTP}
                      className="btn btn-primary"
                      style={{ marginTop: "25px" }}
                    >
                      {isFirstEmailVerifyOTPLoading
                        ? `○○ Verifying...`
                        : `Verify OTP`}
                    </button>
                  </div>
                </>
              )}

              {isOTPVerified && (
                <>
                  <div className="col-8">
                    <div className="form-group">
                      <label>Enter New Email Address</label>
                      <input
                        disabled={isNewEmailAddressFieldDisabled}
                        onChange={(e) =>
                          handelChangeSetNewEmaillAddress(e.target.value)
                        }
                        value={newEnteredEmailAddress || ""}
                        type="text"
                        className="form-control"
                      />
                      {newNumberOTPSendReponseMsg && (
                        <p className="text-info">
                          {newNumberOTPSendReponseMsg}
                        </p>
                      )}
                      {newEmailError && (
                        <p style={{ color: "red", fontSize: "12px" }}>
                          {newEmailError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-4">
                    <button
                      disabled={
                        isNewEmailAddressFieldDisabled ||
                        isFirstNewEmailVerifyLoading
                      }
                      onClick={handelClickVerifyNewEmailAddress}
                      className="btn btn-primary"
                      style={{ marginTop: "25px" }}
                    >
                      {isFirstNewEmailVerifyLoading
                        ? `○○ Verifying...`
                        : `Verify`}
                    </button>
                  </div>
                  {isNewOTPSend && (
                    <>
                      <div className="col-8">
                        <div className="form-group">
                          <label>Enter OTP</label>
                          <input
                            value={newEnteredOTP}
                            onChange={(e) =>
                              handelChangeSetNewOTP(e.target.value)
                            }
                            type="text"
                            className="form-control"
                          />
                          {isNewOTPVerified && (
                            <p style={{ color: "green" }}>
                              &#x2714; New Email Address verified
                              <br /> &#x2714; New email address updated
                              successfully
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="col-4">
                        <button
                          disabled={isFirstNewEmailVerifyOTPLoading}
                          onClick={handelClickVerifyNewNumberOTP}
                          className="btn btn-primary"
                          style={{ marginTop: "25px" }}
                        >
                          {" "}
                          {isFirstNewEmailVerifyOTPLoading
                            ? `○○ Verifying...`
                            : `Verify OTP`}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default EmailAddressChangeModelView;
