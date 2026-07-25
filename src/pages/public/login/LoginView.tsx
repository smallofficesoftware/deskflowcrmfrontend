import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APPLICATION_VERSION, MINI_TEXT_LENGTH } from "../../../helpers/AppConstants";
import OTPVerificationView from "../otp-verification/OTPVerificationView";
import RegistrationView from "../resternation/RegistrationView";
import {
  ILoginValues,
  LoginInitialValues,
  loginSubmit,
  LoginValidationSchema,
} from "./LoginController";

interface ILoginProps {
  pageRedirect?: boolean;
}

const LoginView = ({ pageRedirect }: ILoginProps) => {
  let isGroupOpen;
  let position = 1;
  const [showOtp, setShowOtp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReg, setShowReg] = useState(false);
  const [saveMobileNumber, setSaveMobileNumber] = useState("");
  const [haspin, setHaspin] = useState<string | undefined>(undefined); // State to store haspin value
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (values: ILoginValues) => {
    const result = await loginSubmit(values, setShowOtp); // Assuming loginSubmit returns the response or haspin
    setSaveMobileNumber(values.mobile_number);
    if (result?.data?.haspin) {
      setHaspin(result.data.haspin); // Set haspin from API response
    } else {
      setHaspin(undefined); // Reset haspin if not present
    }
  };
  useEffect(() => {
    searchInputRef.current && searchInputRef.current.focus();
  }, []);
  return (
    <>
      {showReg ? (
        <RegistrationView />
      ) : (
        <>
          {showOtp ? (
            <OTPVerificationView
              handleSubmit={() => setShowOtp(false)} // Corrected to toggle back
              mobileNumber={saveMobileNumber}
              setShowMenu={setShowMenu}
              position={position}
              haspin={haspin} // Pass the haspin state
            />
          ) : (
            <div className="col-12 d-flex justify-content-center align-items-center Intro-Left1">
              <Formik
                initialValues={LoginInitialValues}
                validationSchema={LoginValidationSchema()}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, isSubmitting, values, setFieldValue }) => (
                  <Form>
                    <div className="container-fluid px-0 mx-0 ">
                      <div className="row d-flex justify-content-center align-items-center h-100 px-0 mx-0">
                        <div className="">
                          <div className="row justify-content-center mx-0 px-0 ">
                            <div className="col-12 px-5">
                              <div className="px-0 ">
                                <div className="px-5 mx-0">
                                  <div className="text-center pb-2">
                                    <img
                                      src={require("../../../assets/images/deshFlow_log.png")}
                                      width={400}
                                      alt=""
                                    />
                                  </div>
                                  <p className="text-center h2 fw-bold mt-4">
                                    Sign In
                                  </p>
                                  <div className="">
                                    <p
                                      className="text-center "
                                      style={{ color: "#999" }}
                                    >
                                      Please Fill Your Login Details.
                                    </p>
                                  </div>
                                  <div>
                                    <div className="mb-4">
                                      <label
                                        htmlFor="mobile_number"
                                        className="d-flex justify-content-center mb-2 fw-semibold font-size-15"
                                      >
                                        Mobile Number / Email Address
                                        <span className="text-danger">*</span>
                                      </label>
                                      <Field
                                        type="text"
                                        name="mobile_number"
                                        innerRef={searchInputRef}
                                        placeholder="Enter Mobile Number / Email Address"
                                        maxLength={MINI_TEXT_LENGTH}
                                        className={`form-control d-flex justify-content-center pl-10 ${errors.mobile_number &&
                                          touched.mobile_number &&
                                          "is-invalid input-box-error"
                                          }`}
                                        // style={{
                                        //   boxShadow:
                                        //     "0 0 10px 0 rgba(0, 0, 0, 0.1)",
                                        // }}
                                        value={values.mobile_number}
                                      />
                                      <ErrorMessage
                                        name="mobile_number"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                    <div className="d-flex justify-content-center mb-2 mb-lg-3">
                                      <button
                                        type="submit"
                                        className="btn text-light w-100 py-2 rounded-1 fw_500"
                                        style={{ backgroundColor: "#f58634" }}
                                      >
                                        Sign In Now
                                      </button>
                                    </div>
                                    <div className="d-flex justify-content-center mt-4">
                                      Don't have an account?
                                      <span
                                        className="text-primary font-size-15 fw-bold cursor_pointer"
                                        style={{
                                          marginLeft: "5px",
                                          color: "blue",
                                          fontStyle: "italic",
                                        }}
                                        onClick={() => setShowReg(true)}
                                      >
                                        Sign up Now
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-center mt-2">
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
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LoginView;
