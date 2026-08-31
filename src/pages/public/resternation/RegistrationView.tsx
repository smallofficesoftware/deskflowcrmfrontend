import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { generateCustomEmail, generateCustomNumber } from "../../../common/SharedFunction";
import { APPLICATION_VERSION } from "../../../helpers/AppConstants";
import LeftSideView from "../../left-side/LeftSideView";
import LoginView from "../login/LoginView";
import OTPVerificationView from "../otp-verification/OTPVerificationView";
import {
  IRegistration,
  registrationInitialValues,
  registrationSubmit,
  registrationValidationSchema,
} from "./RegistrationController";
interface IRegistrationProps {
  pageRedirect?: boolean;
}
const RegistrationView = ({ pageRedirect }: IRegistrationProps) => {
  let isGroupOpen;
  const [showOtp, setShowOtp] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [saveMobileNumber, setSaveMobileNumber] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const handleSubmit = async (values: IRegistration) => {
    const updatedValues = { ...values };

    if (
      updatedValues.mobile_number.length === 0 &&
      updatedValues.recovery_email.length === 0
    ) {
      toast.error("Please fill Mobile Number or Email Address");
      return;
    }
    setSaveMobileNumber(updatedValues.mobile_number);

    if (updatedValues.mobile_number.length === 0) {
      updatedValues.mobile_number = await generateCustomNumber();
      updatedValues.registration_flag = "1";
      setSaveMobileNumber(updatedValues.recovery_email);
    }

    if (updatedValues.recovery_email.length === 0) {
      updatedValues.recovery_email = await generateCustomEmail();
      updatedValues.registration_flag = "2";
      setSaveMobileNumber(updatedValues.mobile_number);

    }
    // updatedValues.registration_flag = "0";
    registrationSubmit(updatedValues, setShowOtp, setShowMenu);

  };


  return (
    <>
      {showLogin ? (
        <LoginView pageRedirect={showLogin} />
      ) : (
        <>
          {showMenu ? (
            <>
              <LeftSideView isVisible={!isGroupOpen} />
            </>
          ) : (
            <>
              {showOtp ? (
                <>
                  <div className="col-12 d-flex justify-content-center align-items-center Intro-Left1">
                    <Formik
                      initialValues={registrationInitialValues}
                      validationSchema={registrationValidationSchema()}
                      onSubmit={handleSubmit}
                    >
                      {({
                        errors,
                        touched,
                        isSubmitting,
                        values,
                        setFieldValue,
                      }) => (
                        <Form>
                          <div className="container-fluid px-0 mx-0 ">
                            <div className="row d-flex justify-content-center align-items-center h-100 px-0 mx-0">
                              <div>
                                <div
                                  className="row justify-content-center mx-0 px-0 "
                                >
                                  <div className="col-12 px-5">
                                    <div className="px-0 ">
                                      <div className="px-5 mx-0">
                                        <div className="text-center  pt-3">
                                          <img
                                            src={require("../../../assets/images/deshFlow_log.png")}
                                            width={400}
                                            alt=""
                                          />
                                        </div>
                                        <p className="text-center h2 fw-bold  mt-4">
                                          Sign Up
                                        </p>
                                        <div className="d-flex justify-content-center pb-2">
                                          <p style={{ color: "#999" }}>
                                            Please Fill Your Personal Details.
                                          </p>
                                        </div>
                                        <div>
                                          <div className="form-group mb-4">
                                            <label
                                              htmlFor="username"
                                              className="mb-2  d-flex justify-content-center  fw-semibold font-size-15"
                                              style={{ color: "#000" }}

                                            >
                                              Your Name
                                              <span className="text-danger">
                                                *
                                              </span>
                                            </label>
                                            <Field
                                              type="text"
                                              name="username"
                                              placeHolder="Enter Your Name"
                                              className={`form-control pl-10 ${errors.username &&
                                                touched.username &&
                                                "is-invalid input-box-error"
                                                }`}
                                              style={{ border: "1px solid #CED4DA" }}
                                              value={values.username}
                                            />
                                            <ErrorMessage
                                              name="username"
                                              component="div"
                                              className="field-error text-danger"
                                            />
                                          </div>
                                          <div className="form-group mb-4">
                                            <label
                                              htmlFor="mobile_number"
                                              className="mb-2  d-flex justify-content-center  fw-semibold font-size-15"
                                            >
                                              Mobile Number
                                            </label>
                                            <Field
                                              type="text"
                                              name="mobile_number"
                                              placeHolder="Enter Mobile Number"
                                              className={`form-control pl-10 ${errors.mobile_number &&
                                                touched.mobile_number &&
                                                "is-invalid input-box-error"
                                                }`}
                                              style={{ border: "1px solid #CED4DA" }}
                                              value={values.mobile_number}
                                              onChange={(e: {
                                                target: { value: string };
                                              }) => {
                                                const onlyNumbers = e.target.value
                                                  .replace(/[^0-9]/g, "")
                                                  .slice(0, 10);

                                                setFieldValue("mobile_number", onlyNumbers);
                                              }}
                                            />
                                            <ErrorMessage
                                              name="mobile_number"
                                              component="div"
                                              className="field-error text-danger"
                                            />
                                          </div>
                                          <div className="form-group mb-4">
                                            <label
                                              htmlFor="recovery_email"
                                              className="mb-2  d-flex justify-content-center  fw-semibold font-size-15"
                                            >
                                              Your Email Address
                                            </label>
                                            <Field
                                              type="text"
                                              name="recovery_email"
                                              placeHolder="Enter Your Email Address"
                                              className={`form-control pl-10 ${errors.recovery_email &&
                                                touched.recovery_email &&
                                                "is-invalid input-box-error"
                                                }`}
                                              style={{ border: "1px solid #CED4DA" }}
                                              value={values.recovery_email}
                                            // onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSaveEmail("recovery_email")}
                                            />
                                            <ErrorMessage
                                              name="recovery_email"
                                              component="div"
                                              className="field-error text-danger"
                                            />
                                          </div>
                                          <div className="d-flex justify-content-center  mb-2 mb-lg-3">
                                            <button
                                              type="submit"
                                              className="btn text-light w-100 py-2  rounded-1 fw_500"
                                              style={{
                                                backgroundColor: "#f58634",
                                              }}
                                            >
                                              Sign Up Now
                                            </button>
                                          </div>
                                          <div className="d-flex justify-content-center mt-4">
                                            Already You have an Account?
                                            <span
                                              className=" text-primary font-size-15 fw-bold  cursor_pointer"
                                              style={{
                                                marginLeft: "5px",
                                                color: "blue",
                                                fontStyle: "italic",
                                              }}
                                              onClick={() => setShowLogin(true)}
                                            >
                                              Sign In Now
                                            </span>
                                          </div>
                                          <div className="d-flex justify-content-center mt-2 ">
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
                                          </div>
                                          <small className="d-flex justify-content-center ">
                                            {APPLICATION_VERSION}
                                          </small>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  </div>
                </>
              ) : (
                <OTPVerificationView
                  handleSubmit={() => setShowOtp(true)}
                  mobileNumber={saveMobileNumber}
                  setShowMenu={setShowMenu}
                  position={2}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default RegistrationView;
