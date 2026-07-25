import React, { useContext, useEffect, useRef, useState } from "react";
import OTPInput from "react-otp-input";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import {
  APPLICATION_VERSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import LeftSideView from "../../left-side/LeftSideView";
import LoginView from "../login/LoginView";
import PricingTable from "../payment-gateway/PricingTable";
import TeamPriceTable from "../payment-gateway/TeamPriceTable";
import PublicCompanyView from "../public-company/PublicCompanyView";
import RegistrationView from "../resternation/RegistrationView";
import StepCompanyView from "../step-company/StepCompanyView";
import {
  IOTPVerifyViewProps,
  IUserInfo,
  OTPSubmit,
  WorkspaceSelectSubmit,
} from "./OTPVerificationController";

interface IOTPVerifyViewPropsExtended extends IOTPVerifyViewProps {
  onOtpSuccess?: () => void;
  teamIennerJoin?: number;
  teamCompanyId?: number;
}

const OTPVerificationView = ({
  handleSubmit,
  mobileNumber,
  setShowMenu,
  position,
  haspin,
  onOtpSuccess,
  teamIennerJoin,
  teamCompanyId,
}: IOTPVerifyViewPropsExtended) => {
  const [count, setCount] = useState(30);
  const [intervalNumber, setIntervalNumber] = useState<
    NodeJS.Timeout | undefined
  >();
  let isGroupOpen;

  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [countResend, setCountResend] = useState(3);
  const [showMenu1, setShowMenu1] = useState(false);
  const [code, setCode] = useState(""); // Use 'code' instead of 'otp' for generality
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [checkCompanyAlreadyExists, setCheckCompanyAlreadyExists] = useState(0);
  const [userInfo, setUserInfo] = useState<IUserInfo>();
  const { checkPlan, setCheckPlan } = useContext(AppContext)!;
  const [showRenewPlan, setShowRenewPlan] = useState(false);
  const [showRenewPlanFromLogin, setShowRenewPlanFromLogin] = useState(false);
  const [companyData, setCompanyData] = useState<any>();
  const [checkForTeamPlanExpireOrNot, setcheckForTeamPlanExpireOrNot] =
    useState(0);
  const [workspacesList, setWorkspacesList] = useState<any[]>([]);

  // Ref for OTP input fields
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalNumber) clearInterval(intervalNumber);
    };
  }, []);
  useEffect(() => {
    if (count === 0 || clickCount === countResend) {
      clearInterval(intervalNumber);
      setIsButtonVisible(true);
    }
  }, [count, intervalNumber, clickCount, countResend]);

  const startTimer = () => {
    const interval = setInterval(() => {
      setCount((prevCount) => prevCount - 1);
    }, 1000);
    setIntervalNumber(interval);
  };

  const handleButtonClick = () => {
    clearInterval(intervalNumber);
    setCount(30);
    setClickCount((prevCount) => prevCount + 1);
    setIsButtonVisible(false);
    restCountDown();
    handleSubmit(false);
  };

  const restCountDown = () => {
    setIsButtonVisible(false);
    const intervals = setInterval(() => {
      setCount((prevCount) => prevCount - 1);
    }, 1000);
    setIntervalNumber(intervals);
  };

  const handleSubmitCode = async () => {
    const res = await OTPSubmit(
      code,
      mobileNumber,
      setShowMenu,
      position,
      setShowMenu1,
      setCheckCompanyAlreadyExists,
      setUserInfo,
      setCompanyData,
      setCheckPlan,
      setShowRenewPlan,
      setShowRenewPlanFromLogin,
      haspin,
      teamIennerJoin,
      onOtpSuccess,
      teamCompanyId,
      setcheckForTeamPlanExpireOrNot,
      setWorkspacesList,
    );
  };

  const handleSubmitOTP = async () => {
    setCode("");

    const mobileRegex = /^\d{10}$/; // exactly 10 digits for mobile
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // basic email format

    const input = mobileNumber.trim();

    let requestData;

    if (input.length === 10 && mobileRegex.test(input)) {
      requestData = {
        table: "a_application_logins",
        where: `{"recovery_mobile":"${input}"}`,
        data: `{"login_pin":""}`,
      };
    } else if (input.length > 10 && emailRegex.test(input)) {
      requestData = {
        table: "a_application_logins",
        where: `{"recovery_email":"${input}"}`,
        data: `{"login_pin":""}`,
      };
    } else {
      toast.error(
        "Please enter a valid 10-digit mobile number or a valid email address.",
      );
      return;
    }

    try {
      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData,
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          handleSubmit(true); // Proceed to OTP flow only after successful update
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  // Handle keydown for OTP inputs
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitCode();
    } else if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setCode(code.slice(0, index - 1));
    } else if (e.key === "Backspace" && code[index]) {
      const newCode = code.split("");
      newCode[index] = "";
      setCode(newCode.join(""));
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const newCode = code.split("");
      newCode[index] = e.key;
      setCode(newCode.join(""));
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle input change for OTP inputs
  const handleInputChange = (value: string, index: number) => {
    if (/^\d?$/.test(value) && index < 6) {
      const newCode = code.split("");
      newCode[index] = value;
      setCode(newCode.join(""));
      if (value.length === 1 && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  return (
    <>
      {checkCompanyAlreadyExists === 5 ? (
        <div
          className="col-12 d-flex justify-content-center align-items-center min-vh-100"
          style={{ backgroundColor: "#f3f4f6", padding: "60px 20px" }}
        >
          <div className="w-100" style={{ maxWidth: "1040px" }}>
            {/* Header Badge */}
            <div className="text-center mb-2">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
                style={{
                  backgroundColor: "#fff3eb",
                  color: "#f58634",
                  borderRadius: "100px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#f58634",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                ></span>
                Workspace Selection
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-center fw-bold mt-3 mb-2"
              style={{
                color: "#0f172a",
                fontSize: "2.25rem",
                letterSpacing: "-0.5px",
              }}
            >
              Choose a Workspace
            </h1>

            {/* Subtitle */}
            <p
              className="text-center text-muted font-size-14 mb-4 mx-auto"
              style={{ maxWidth: "500px", color: "#64748b" }}
            >
              Please choose a workspace to log in to.
            </p>

            {/* Cards List Wrapper with Internal Scroll */}
            <div
              className="w-100 mb-4"
              style={{
                maxHeight: "390px",
                overflowY: "auto",
                padding: "12px 10px",
                border:
                  workspacesList.length > 4 ? "1px solid #e2e8f0" : "none",
                borderRadius: "16px",
                backgroundColor:
                  workspacesList.length > 4 ? "#f8fafc" : "transparent",
              }}
            >
              <div className="d-flex flex-wrap gap-3 justify-content-center align-items-stretch">
                {workspacesList.map((workspace: any) => {
                  const initialLetter =
                    workspace.company_name?.charAt(0).toUpperCase() || "W";
                  const isMainCompany =
                    workspace.parent_company_id === null ||
                    workspace.parent_company_id === undefined;

                  return (
                    <div
                      key={workspace.id}
                      className="bg-white border p-3 d-flex flex-column justify-content-between position-relative"
                      style={{
                        width: "230px",
                        height: "160px",
                        borderColor: "#e2e8f0",
                        borderRadius: "12px",
                        boxShadow:
                          "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                        transition: "all 0.25s ease-in-out",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 20px -3px rgba(245, 134, 52, 0.15), 0 4px 6px -2px rgba(245, 134, 52, 0.08)";
                        e.currentTarget.style.borderColor = "#f58634";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0px)";
                        e.currentTarget.style.boxShadow =
                          "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                    >
                      <div>
                        {/* Avatar & Title block */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div
                            className="d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              backgroundColor: "#fff3eb",
                              color: "#f58634",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {initialLetter}
                          </div>
                          <div style={{ minWidth: 0, flexGrow: 1 }}>
                            <h4
                              className="fw-bold mb-0 font-size-14 text-truncate"
                              style={{ color: "#1e293b", margin: 0 }}
                              title={workspace.company_name}
                            >
                              {workspace.company_name}
                            </h4>
                          </div>
                        </div>

                        {/* Company Type Badge */}
                        <div className="mb-2">
                          {isMainCompany ? (
                            <span
                              className="px-2 py-0.5 rounded text-xs fw-semibold"
                              style={{
                                backgroundColor: "#fff3eb",
                                color: "#f58634",
                                fontSize: "10px",
                                borderRadius: "4px",
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              Main Company
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-xs fw-semibold border"
                              style={{
                                backgroundColor: "#f8fafc",
                                color: "#475569",
                                borderColor: "#e2e8f0",
                                fontSize: "10px",
                                borderRadius: "4px",
                                fontWeight: 500,
                                display: "inline-block",
                              }}
                            >
                              Workspace
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Select Action Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          className="btn fw-semibold text-white d-flex align-items-center justify-content-center gap-1 w-100"
                          style={{
                            backgroundColor: "#f58634",
                            borderColor: "#f58634",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#d97022")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f58634")
                          }
                          onClick={() => {
                            WorkspaceSelectSubmit(
                              workspace.id,
                              setCheckCompanyAlreadyExists,
                              setUserInfo,
                              setCompanyData,
                              setCheckPlan,
                              setShowRenewPlan,
                              setShowRenewPlanFromLogin,
                              setShowMenu1,
                              setcheckForTeamPlanExpireOrNot,
                              () => {
                                if (onOtpSuccess) onOtpSuccess();
                              },
                            );
                          }}
                        >
                          Select
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="currentColor"
                          >
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center mt-4">
              <button
                type="button"
                className="btn btn-link text-decoration-none fw-semibold"
                style={{ color: "#64748b", fontSize: "14px" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#f58634")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#64748b")
                }
                onClick={() => setCheckCompanyAlreadyExists(0)}
              >
                ← Back to OTP verification
              </button>
            </div>
          </div>
        </div>
      ) : checkCompanyAlreadyExists === 4 ? (
        <StepCompanyView
          isVisibleStepCompany={true}
          companyId={companyData?.id}
        />
      ) : (
        <>
          {showRenewPlan && checkCompanyAlreadyExists === 2 ? (
            <PricingTable
              companyId={companyData?.id}
              companyName={companyData?.company_name}
              companyEmailId={companyData?.company_email}
              companyContact={companyData?.company_contact}
              checkCompanyAlreadyExists={checkCompanyAlreadyExists}
              onHide={() => setShowRenewPlan(false)}
            />
          ) : (
            // <TeamPriceTable />
            <>
              {showLogin ? (
                <LoginView pageRedirect={showLogin} />
              ) : (
                <>
                  {showMenu1 ? (
                    <>
                      {checkCompanyAlreadyExists === 1 ? (
                        <>
                          {checkForTeamPlanExpireOrNot == 1 &&
                          showRenewPlanFromLogin ? (
                            <>
                              <PricingTable
                                companyId={companyData?.id}
                                companyName={companyData?.company_name}
                                companyEmailId={companyData?.company_email}
                                companyContact={companyData?.company_contact}
                                planAmount={0}
                                checkCompanyAlreadyExists={
                                  checkCompanyAlreadyExists
                                }
                                onHide={() => setShowRenewPlan(false)}
                              />

                              {/* <CouponModal
                                companyId={companyData?.id}
                                companyName={companyData?.company_name}
                                companyEmailId={companyData?.company_email}
                                companyContact={companyData?.company_contact}
                                // checkCompanyAlreadyExists={checkCompanyAlreadyExists}
                                renew_flag={0}
                                // innnerRenualFlag={innnerRenualFlag}
                                onHide={() => setShowCouponModal(false)}
                                plan_id={selectedPlan.plan_id}
                                plan_amount={selectedPlan.plan_amount}
                                plan_name={selectedPlan.plan_name}
                              /> */}
                            </>
                          ) : checkForTeamPlanExpireOrNot == 2 &&
                            showRenewPlanFromLogin ? (
                            <TeamPriceTable />
                          ) : (
                            <>
                              <LeftSideView
                                isVisible={!isGroupOpen}
                                userInfo={userInfo}
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <PublicCompanyView
                          showCompany={true}
                          mobileNumber={mobileNumber}
                          checkCompanyAlreadyExists={checkCompanyAlreadyExists}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {showRegistration ? (
                        <RegistrationView pageRedirect={showRegistration} />
                      ) : (
                        <div className="col-12 d-flex justify-content-center align-items-center Intro-Left1">
                          <div className="row d-flex justify-content-center align-items-center h-100 px-0 mx-0">
                            <div>
                              <div className="row justify-content-center mx-0 px-0 ">
                                <div className="col-12 ">
                                  <div className="px-0 ">
                                    <div className="px-5 mx-0">
                                      {teamIennerJoin != 1 && (
                                        <div className=" text-center">
                                          <img
                                            src={require("../../../assets/images/deshFlow_log.png")}
                                            width={400}
                                            alt=""
                                          />
                                        </div>
                                      )}
                                      <div className="">
                                        <div className="">
                                          <p className="text-center h2 fw-bold mb-3 mt-4">
                                            Verify {haspin ? "PIN" : "OTP"}
                                          </p>
                                        </div>
                                        {haspin ? (
                                          <div className="">
                                            <p
                                              className="font-size-17"
                                              style={{
                                                color: "#999",
                                                textAlign: "center",
                                              }}
                                            >
                                              Enter Your 6-Digit Login PIN{" "}
                                              <br />
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="">
                                            <p
                                              className="font-size-17"
                                              style={{
                                                color: "#999",
                                                textAlign: "center",
                                              }}
                                            >
                                              Check
                                              <b style={{ color: "#000" }}>
                                                &nbsp;WhatsApp & Email
                                              </b>
                                              &nbsp;for the 6-digit{" "}
                                              {haspin ? "PIN" : "OTP"} <br />
                                              <span
                                                style={{
                                                  display: "block",
                                                  textAlign: "center",
                                                }}
                                              >
                                                sent to &nbsp;
                                                {mobileNumber.replace(
                                                  /.(?=.{4,}$)/g,
                                                  "*",
                                                )}
                                              </span>
                                            </p>
                                          </div>
                                        )}
                                        <div className=" text-center  py-3">
                                          <label
                                            htmlFor="code"
                                            className="  mb-2 fw-bold"
                                          >
                                            Enter {haspin ? "PIN" : "OTP"}
                                            <span className="text-danger">
                                              *
                                            </span>
                                          </label>

                                          <span
                                            style={{ margin: "8px" }}
                                            className="d-flex justify-content-center"
                                          >
                                            <OTPInput
                                              value={code}
                                              onChange={setCode}
                                              numInputs={6}
                                              renderSeparator={
                                                <span style={{ margin: "5px" }}>
                                                  -
                                                </span>
                                              }
                                              renderInput={(props, index) => (
                                                <input
                                                  {...props}
                                                  ref={(el) =>
                                                    (inputRefs.current[index] =
                                                      el)
                                                  }
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
                                                  }}
                                                  onKeyDown={(e) =>
                                                    handleKeyDown(e, index)
                                                  }
                                                  onChange={(e) =>
                                                    handleInputChange(
                                                      e.target.value,
                                                      index,
                                                    )
                                                  }
                                                  autoFocus={index === 0}
                                                />
                                              )}
                                              shouldAutoFocus
                                            />
                                          </span>
                                        </div>
                                        {haspin ? (
                                          <div className="d-flex justify-content-center">
                                            <p className="font-size-15">
                                              Didn't get PIN? &nbsp;
                                            </p>
                                            <div>
                                              <p
                                                className="text-primary font-size-15 fw-bold rounded-1 cursor_pointer"
                                                onClick={handleSubmitOTP}
                                              >
                                                Login With OTP
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="d-flex justify-content-center">
                                            <p className="font-size-15">
                                              Didn't get{" "}
                                              {haspin ? "PIN" : "OTP"}? &nbsp;
                                            </p>
                                            {clickCount < countResend && (
                                              <div>
                                                {isButtonVisible ? (
                                                  <div>
                                                    <p
                                                      className="text-primary font-size-15 fw-bold rounded-1 cursor_pointer"
                                                      onClick={() =>
                                                        setShowLogin(true)
                                                      }
                                                    >
                                                      Resend |
                                                      <span
                                                        onClick={() =>
                                                          setShowLogin(true)
                                                        }
                                                      >
                                                        &nbsp;Change Number
                                                      </span>
                                                    </p>
                                                  </div>
                                                ) : (
                                                  <p className="user-select-none">
                                                    Resend Time {count}
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        <div className="mt-3">
                                          <button
                                            className="btn text-light w-100 py-2 rounded-1 fw_500"
                                            onClick={handleSubmitCode}
                                            style={{
                                              backgroundColor: "#f58634",
                                            }}
                                          >
                                            Verify {haspin ? "PIN" : "OTP"}
                                          </button>
                                        </div>

                                        <div className="d-flex justify-content-center mt-2 ">
                                          {teamIennerJoin != 1 && (
                                            <p>
                                              <Link
                                                to="/PrivacyPolicy"
                                                target="_blank"
                                              >
                                                Privacy Policy
                                              </Link>
                                              &nbsp;|&nbsp;
                                              <Link
                                                to="ContactUs"
                                                target="_blank"
                                              >
                                                Contact Us
                                              </Link>
                                            </p>
                                          )}
                                        </div>
                                        {teamIennerJoin != 1 && (
                                          <small className="d-flex justify-content-center ">
                                            {APPLICATION_VERSION}
                                          </small>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default OTPVerificationView;
