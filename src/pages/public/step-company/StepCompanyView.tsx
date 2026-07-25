import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { handleRefresh } from "../../../common/SharedFunction";
import LeftSideView from "../../left-side/LeftSideView";
import { fetchApiStepCompany } from "./StepCompanyController";

interface ISetCompanyProps {
  isVisibleStepCompany: boolean;
  companyId: number | undefined;
}
const StepCompanyView = ({
  isVisibleStepCompany,
  companyId,
}: ISetCompanyProps) => {
  let isGroupOpen;
  const [showSetCompanyPage, setShowSetCompanyPage] = useState(false);
  const [showError, setShowError] = useState("");
  const [showIntroductionVideo, setShowIntroductionVideo] = useState("");

  useEffect(() => {
    const delayFetch = setTimeout(() => {
      console.log("delay vala mathi");

      fetchApiStepCompany(setShowSetCompanyPage, companyId, setShowError);
    }, 10000);

    return () => clearTimeout(delayFetch);
  }, [isVisibleStepCompany, companyId]);

  useEffect(() => {
    if (showSetCompanyPage) {
      const reloadTimer = setTimeout(() => {
        handleRefresh();
      }, 2000); // Delay to allow smooth transition

      return () => clearTimeout(reloadTimer);
    }
  }, [showSetCompanyPage]);

  const handleRetrieve = () => {
    console.log("retrie mathi");
    fetchApiStepCompany(setShowSetCompanyPage, companyId, setShowError);
  };
  return (
    <>
      {showSetCompanyPage ? (
        <>
          {/* <IntroductionVideo /> */}
          <LeftSideView isVisible={!isGroupOpen} />
        </>
      ) : (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{
              // width: "98%",
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgb(240 242 245)",
              marginTop: "10px",
            }}
          >
            <div className="row Intro-Left1">
              <div className="col-12">
                <span className="d-flex justify-content-center mt-5">
                  <img
                    width={400}
                    src={require("../../../assets/images/deshFlow_log.png")}
                    alt=""
                  />
                </span>
                {showError === "" ? (
                  <div className="d-flex justify-content-center mt-4">
                    <div
                      className="  spinner-border text-secondary"
                      role="status"
                    ></div>
                    {/* <img
                width={200}
                src={require("../../../assets/images/Avatar-10.jpeg")}
                alt=""
              /> */}
                  </div>
                ) : (
                  <span></span>
                )}
                <div className="d-flex justify-content-center mt-3">
                  <div>
                    {showError === "" ? (
                      <p className="modal-title1 form_header_text">
                        We are setting up your Company.
                        <br />
                        Please do not click or refresh the page. This process may
                        take a moment. <br /> Once complete, you will be
                        automatically redirected to your dashboard. Thank you for
                        your patience!
                      </p>
                    ) : (
                      <div>
                        <p className="d-flex justify-content-center mb-2 mb-lg-3">
                          {" "}
                          Click here to Try Again{" "}
                        </p>
                        <div className="d-flex justify-content-center  mb-2 mb-lg-3">
                          <button
                            type="submit"
                            className="btn  text-light w-25 py-2 px-2  rounded-1 fw_500"
                            onClick={handleRetrieve}
                            style={{
                              backgroundColor: "#f58634",
                            }}
                          >
                            Try Again
                          </button>
                        </div>
                        <div className=" d-flex justify-content-center mt-2">
                          <p>
                            <Link to="/PrivacyPolicy" target="_blank">
                              Privacy Policy
                            </Link>
                            &nbsp;|&nbsp;
                            <Link to="ContactUs" target="_blank">
                              Contact Us
                            </Link>
                          </p>
                        </div>
                      </div>
                    )}
                    {/* <p className="text-danger">{showError}</p> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      )}
    </>
  );
};

export default StepCompanyView;
