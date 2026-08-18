import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { isValidPhone } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { logOutApi } from "../../../pages/left-side/LeftSideController";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  IPropsMobileNumberChangeModel,
  verifyNewNumber,
  verifyNewNumberOTP,
  verifyOldNumber,
  verifyOldNumberOTP,
} from "./mobileNumberChangeModelController";

const MobileNumberChangeModel = ({
  show,
  onHide,
  RequiredDetail,
}: IPropsMobileNumberChangeModel) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [isEditedMobileNumber, setIsEditedMobileNumber] = useState(true);
  const [isOTPVerifiedAutoGen, setIsOTPVerifiedAutoGen] = useState(false);
  const [isOTPSend, setIsOTPSend] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [isNewOTPSend, setIsNewOTPSend] = useState(false);
  const [isNewOTPVerified, setIsNewOTPVerified] = useState(false);
  const [oldNumberOTPSendReponseMsg, setOldNumberOTPSendReponseMsg] =
    useState("");
  const [oldNumberEnteredOTP, setOldNumberEnteredOTP] = useState("");
  const [newEnteredNumber, setNewEnteredNumber] = useState("");
  const [newEnteredOTP, setNewEnteredOTP] = useState("");
  const [newNumberOTPSendReponseMsg, setNewNumberOTPSendReponseMsg] =
    useState("");
  const [isNewNumberFieldDisabled, setIsNewNumberFieldDisabled] =
    useState(false);
  const [isOldNumberButtonDisabled, setIsOldNumberButtonDisabled] =
    useState(false);
  const [phoneError, setPhoneError] = useState<string>("");

  useEffect(() => {
    if (!show) return;
    setMobileNumber(
      !RequiredDetail.is_auto_generate_phone
        ? RequiredDetail.phone_number || ""
        : "",
    );
    setIsEditedMobileNumber(!RequiredDetail.is_auto_generate_phone);
  }, [show]);

  const handelClickVerifyOldNumber = async () => {
    await verifyOldNumber(
      mobileNumber,
      setOldNumberOTPSendReponseMsg,
      setIsOTPSend,
      RequiredDetail,
    );
  };

  const handelChangeSetOldNumberOTP = async (otp: string) => {
    setOldNumberEnteredOTP(otp);
  };

  const handelClickVerifyOldNumberOTP = async () => {
    await verifyOldNumberOTP(
      oldNumberEnteredOTP,
      setIsOTPVerified,
      setIsOldNumberButtonDisabled,
      RequiredDetail,
      mobileNumber,
      logOutApi,
      setIsOTPVerifiedAutoGen,
    );
  };

  const handelChangeSetNewNumber = async (newNumber: string) => {
    setNewEnteredNumber(newNumber);
  };

  const handelClickVerifyNewNumber = async () => {
    await verifyNewNumber(
      newEnteredNumber,
      setIsNewOTPSend,
      setNewNumberOTPSendReponseMsg,
    );
  };

  const handelChangeSetNewOTP = async (newOTP: string) => {
    setNewEnteredOTP(newOTP);
  };

  const handelClickVerifyNewNumberOTP = async () => {
    await verifyNewNumberOTP(
      newEnteredOTP,
      newEnteredNumber,
      setIsNewOTPVerified,
      setIsNewNumberFieldDisabled,
      logOutApi,
    );
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileNumber(e.target.value);
    if (!e.target.value) {
      setPhoneError("Phone number is required");
    } else if (!isValidPhone(e.target.value)) {
      setPhoneError("Please enter a valid phone number");
    } else {
      setPhoneError("");
    }
  };

  const handelClose = () => {
    setMobileNumber("");
    setIsEditedMobileNumber(true);
    setIsOTPSend(false);
    setIsOTPVerified(false);
    setIsNewOTPSend(false);
    setIsNewOTPVerified(false);
    setIsOTPVerifiedAutoGen(false);
    setOldNumberOTPSendReponseMsg("");
    setOldNumberEnteredOTP("");
    setNewEnteredNumber("");
    setNewEnteredOTP("");
    setNewNumberOTPSendReponseMsg("");
    setIsNewNumberFieldDisabled(false);
    setIsOldNumberButtonDisabled(false);
    onHide();
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
                  <label>Phone Number</label>
                  <input
                    placeholder="Enter phone number"
                    disabled={isEditedMobileNumber}
                    type="text"
                    className="form-control"
                    value={mobileNumber || ""}
                    onChange={handlePhoneNumberChange}
                  />
                  {oldNumberOTPSendReponseMsg && (
                    <p className="text-info">{oldNumberOTPSendReponseMsg}</p>
                  )}
                  {phoneError && (
                    <p style={{ color: "red", fontSize: "12px" }}>
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>
              <div className="col-4">
                <button
                  disabled={isOldNumberButtonDisabled}
                  onClick={handelClickVerifyOldNumber}
                  className="btn btn-primary"
                  style={{ marginTop: "25px" }}
                >
                  {" "}
                  Verify Number{" "}
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
                        value={oldNumberEnteredOTP}
                        onChange={(e) =>
                          handelChangeSetOldNumberOTP(e.target.value)
                        }
                      />
                      {(isOTPVerified || isOTPVerifiedAutoGen) && (
                        <p style={{ color: "green" }}>
                          &#x2714; Phone number verified
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-4">
                    <button
                      onClick={handelClickVerifyOldNumberOTP}
                      className="btn btn-primary"
                      style={{ marginTop: "25px" }}
                    >
                      {" "}
                      Verify OTP
                    </button>
                  </div>
                </>
              )}

              {isOTPVerified && (
                <>
                  <div className="col-8">
                    <div className="form-group">
                      <label>Enter New Phone Number</label>
                      <input
                        disabled={isNewNumberFieldDisabled}
                        onChange={(e) =>
                          handelChangeSetNewNumber(e.target.value)
                        }
                        value={newEnteredNumber || ""}
                        type="text"
                        className="form-control"
                      />
                      {newNumberOTPSendReponseMsg && (
                        <p className="text-info">
                          {newNumberOTPSendReponseMsg}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-4">
                    <button
                      disabled={isNewNumberFieldDisabled}
                      onClick={handelClickVerifyNewNumber}
                      className="btn btn-primary"
                      style={{ marginTop: "25px" }}
                    >
                      {" "}
                      Verify New Number{" "}
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
                              &#x2714; New Phone number verified
                              <br /> &#x2714; New phone number updated
                              successfully
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="col-4">
                        <button
                          onClick={handelClickVerifyNewNumberOTP}
                          className="btn btn-primary"
                          style={{ marginTop: "25px" }}
                        >
                          {" "}
                          Verify OTP
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

export default MobileNumberChangeModel;
