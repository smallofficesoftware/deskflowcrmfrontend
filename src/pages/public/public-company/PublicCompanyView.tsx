import { useContext, useEffect, useState } from "react";
// import { OTPSubmit, IOTPVerifyViewProps } from "./OTPVerificationController";
import { Link } from "react-router-dom";
import { AppContext } from "../../../common/AppContext";
import { handleRefresh } from "../../../common/SharedFunction";
import { APPLICATION_VERSION } from "../../../helpers/AppConstants";
import { TOnChangeInput } from "../../../helpers/AppType";
import CreateCompanyView from "../../left-side/create-company/CreateCompanyView";
import LeftSideView from "../../left-side/LeftSideView";
import PricingTable from "../payment-gateway/PricingTable";
import RegistrationView from "../resternation/RegistrationView";
import StepCompanyView from "../step-company/StepCompanyView";
import { publicCreateVaiLinkCompany } from "./PublicCompanyController";

const PublicCompanyView = ({
  showCompany,
  mobileNumber,
  checkCompanyAlreadyExists,
}: any) => {
  let isGroupOpen;
  const { checkPlan, isCheckPlan } = useContext(AppContext)!;
  useEffect(() => {
  }, [checkPlan]);

  const [showRegistration, setShowRegistration] = useState(false);
  const [showMenu1, setShowMenu1] = useState(false);
  const [isCreateCompany, setIsCreateCompany] = useState(false);
  const [isJoinCompany, setIsJoinCompany] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [showRenewPlan, setShowRenewPlan] = useState(false);

  const handelChangeJoinCompany = (event: TOnChangeInput) => {
    const value = event.target.value;
    setJoinInput(value);
    setJoinError(value ? "" : "Invitation key is Required");
  };
  const handleJoinCompany = () => {
    setIsJoinCompany(true);
  };

  const joinHandleSubmit = async () => {
    if (!joinInput) setJoinError("Invitation key is Required");
    if (joinInput) {
      publicCreateVaiLinkCompany(joinInput, setShowMenu1);
    }

  };
  const handleLogout = () => {
    localStorage.clear();
    handleRefresh();
  };
  return (
    <>
      {showCompany ? (
        <>

          {typeof checkPlan === "object" &&
            checkPlan?.plan_id === 0 &&
            isCheckPlan === true ? (
            <PricingTable
              companyId={checkPlan?.id}
              companyName={checkPlan?.company_name}
              companyEmailId={checkPlan?.company_email}
              companyContact={checkPlan?.company_contact}
              onHide={() => setShowRenewPlan(false)}

            />
          ) : (

            <>
              {refresh ?
                < StepCompanyView isVisibleStepCompany={true} companyId={checkPlan?.id} />
                :
                <>
                  {showMenu1 || isCheckPlan === true ? (
                    <>
                      <LeftSideView isVisible={!isGroupOpen} />
                    </>
                  ) : (
                    <>
                      {showRegistration ? (
                        <RegistrationView pageRedirect={showRegistration} />
                      ) : (
                        <div className="col-12 d-flex justify-content-center align-items-center Intro-Left1">
                          <div className="row d-flex justify-content-center align-items-center h-100 px-0 mx-0">
                            <div>
                              <div
                                className="row justify-content-center mx-0 px-0 "

                              >
                                <div className="col-12 ">
                                  <div className="px-0 ">
                                    <div className="px-5 mx-0">
                                      <div className=" text-center">
                                        <img
                                          src={require("../../../assets/images/deshFlow_log.png")}
                                          width={400}
                                          alt=""
                                        />

                                      </div>

                                      <div className="">
                                        <div className="">
                                          <p className="text-center h2 fw-bold mb-3  mt-4">
                                            Create Company
                                          </p>
                                        </div>
                                        <div className="">
                                          <p
                                            className="d-flex align-items-center justify-content-center font-size-19"
                                            style={{ color: "#999", fontWeight: "600" }}
                                          >
                                            If you are a company owner, please create your company to get started. <br />
                                            If you are a team member, please contact your company owner to join the team.
                                          </p>
                                        </div>
                                        <div className="row justify-content-center mx-0 px-0 ">
                                          {/* <div
                                            className="col-5 d-flex align-items-center justify-content-center"
                                            onClick={handleJoinCompany}
                                            style={{
                                              border: "2px solid",
                                              borderColor: isJoinCompany ? "green" : "gray",
                                              height: "125px"
                                            }}
                                          >

                                            <div className="text-center"
                                              style={{
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                              }}>
                                              <div>
                                                <img
                                                  src={require("../../../assets/icons/Join.png")}
                                                  width={50}
                                                  alt="Join"
                                                  style={{ cursor: "pointer" }}
                                                />
                                              </div>

                                            </div>

                                          </div> */}

                                          {/* <div className="col-1 text-center d-flex align-items-center justify-content-center">
                                            <span style={{ fontWeight: "bold" }}>OR</span>
                                          </div> */}

                                          <div className="col-4 d-flex align-items-center justify-content-center"
                                            style={{ border: "1px solid black", height: "125px" }}>
                                            <div className="text-center"
                                              style={{
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                              }}>
                                              <img
                                                src={require("../../../assets/icons/create_company.png")}
                                                width={50}
                                                alt="Create"
                                                onClick={() => setIsCreateCompany(true)}
                                                style={{ cursor: "pointer" }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{
                                          display: "flex",
                                          justifyContent: "space-evenly",
                                          textAlign: "center",
                                          paddingBottom: "2px",
                                        }}>
                                          {/* <div className="w-50"><label className="p-3   mb-2 fw-bold">Join As Team Member</label></div> */}
                                          <div className="w-50" onClick={() => setIsCreateCompany(true)}><label className="p-3 mb-2 fw-bold" style={{ cursor: "pointer" }}>Create New Company</label></div>
                                        </div>


                                        {isJoinCompany && (
                                          <div className=" text-center pt-2">
                                            <label htmlFor="InvitationKey" className="mb-2 fw-bold">
                                              Enter Invitation Key
                                              <span className="text-danger">*</span>
                                            </label>
                                            <div className="d-flex justify-content-center mb-2">
                                              <p
                                                style={{
                                                  fontSize: "14px",
                                                  marginBottom: "0px",
                                                }}
                                              >
                                                Please Contact the Company Admin for
                                                an Invitation key
                                              </p>
                                            </div>
                                            <div className="d-flex flex-column g-0">
                                              <input
                                                type="text"
                                                title="join company"
                                                id="InvitationKey"
                                                placeholder="Enter Invitation key"
                                                value={joinInput}
                                                onChange={(e) =>
                                                  handelChangeJoinCompany(e)
                                                }
                                                className="form-control mb-1"
                                              />
                                              {joinError && (
                                                <span className="text-danger text-start w-100">
                                                  {joinError}
                                                </span>
                                              )}
                                            </div>
                                            <div className="mt-3">
                                              <button
                                                className="btn text-light w-100 py-2  rounded-1 fw_500"
                                                onClick={joinHandleSubmit}
                                                style={{ backgroundColor: "#f58634" }}
                                              >
                                                Join Company
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        <div className="d-flex justify-content-center mt-2 ">
                                          <p>
                                            <Link
                                              to="/PrivacyPolicy"
                                              target="_blank"
                                            >
                                              Privacy Policy
                                            </Link>
                                            &nbsp;|&nbsp;
                                            <Link to="ContactUs" target="_blank">
                                              Contact Us
                                            </Link>
                                          </p>
                                        </div>
                                        <small className="d-flex justify-content-center ">
                                          {APPLICATION_VERSION}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex justify-content-center mt-5">
                                <button
                                  onClick={handleLogout}
                                  className="btn"
                                  style={{
                                    backgroundColor: "#f58634",
                                    color: "white",
                                    padding: "5px 20px",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginLeft: "15px"
                                  }}
                                >
                                  <span>Logout Here</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              }
            </>
          )}
          <CreateCompanyView
            show={isCreateCompany}
            onHide={() => setIsCreateCompany(false)}
            setRefresh={setRefresh}
            headerName={"Create Your Own Company"}
            mobileNumber={mobileNumber}
            isShowApiKey={5}
          />

        </>
      ) : (
        ""
      )}
    </>
  );
};

export default PublicCompanyView;
