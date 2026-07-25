import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  generateCustomEmail,
  generateCustomNumber
} from "../../../common/SharedFunction";
import OTPVerificationView from "../../../pages/public/otp-verification/OTPVerificationView";
import {
  IRegistration,
  registrationInitialValues,
  registrationSubmit,
  registrationValidationSchema,
} from "../../../pages/public/resternation/RegistrationController";

interface IPropsCompany {
  isCompanyOpen: boolean;
  closeCompany: () => void;
  companyInfo: any;
}

// CreateTeamMemBerModal component
const CreateTeamMemBerModal = ({
  onClose,
  onSuccess,
  onOtpSuccess,
  company_id,
}: {
  company_id?: number;
  onClose: () => void;
  onSuccess: () => void;
  onOtpSuccess: () => void;
}) => {
  const [showOtp, setShowOtp] = useState(true);
  const [saveMobileNumber, setSaveMobileNumber] = useState("");

  const usernameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showOtp && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [showOtp]);

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
      updatedValues.jointeam_flag = "1";
      setSaveMobileNumber(updatedValues.recovery_email);
    }

    if (updatedValues.recovery_email.length === 0) {
      updatedValues.recovery_email = await generateCustomEmail();
      updatedValues.registration_flag = "2";
      updatedValues.jointeam_flag = "1";
      setSaveMobileNumber(updatedValues.mobile_number);
    }
    registrationSubmit(updatedValues, setShowOtp, onSuccess); // Call onSuccess to indicate form submission success
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal1" style={{ display: "block" }}>
      <div className="modal-content1">
        <span className="close" onClick={handleClose}>
          &times;
        </span>
        {showOtp ? (
          <div className="col-6 d-flex justify-content-center align-items-center Intro-Left1">
            <Formik
              initialValues={registrationInitialValues}
              validationSchema={registrationValidationSchema()}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, values, setFieldValue }) => (
                <Form>
                  <div className="container-fluid px-0 mx-0">
                    <div className="row d-flex justify-content-center align-items-center h-100 px-0 mx-0">
                      <div>
                        <div className="row justify-content-center mx-0 px-0">
                          <div className="col-12 px-5">
                            <div className="px-0">
                              <div className="px-5 mx-0">
                                {/* <div className="text-center pt-3">
                                  <img
                                    src={require("../../../assets/images/deshFlow_log.png")}
                                    width={400}
                                    alt=""
                                  />
                                </div> */}
                                <p className="text-center h2 fw-bold mt-4">
                                  Add Member
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
                                      className="mb-2 d-flex justify-content-center fw-semibold font-size-15"
                                      style={{ color: "#000" }}
                                    >
                                      Person Name
                                      <span className="text-danger">*</span>
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
                                      innerRef={usernameInputRef}
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
                                      className="mb-2 d-flex justify-content-center fw-semibold font-size-15"
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
                                      className="mb-2 d-flex justify-content-center fw-semibold font-size-15"
                                    >
                                      Email Address
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
                                    />
                                    <ErrorMessage
                                      name="recovery_email"
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
                                      Sign Up Now
                                    </button>
                                  </div>
                                  {/* <div className="d-flex justify-content-center mt-2">
                                    <p>
                                      <a href="/PrivacyPolicy" target="_blank">
                                        Privacy Policy
                                      </a>
                                      &nbsp;|&nbsp;
                                      <a href="/ContactUs" target="_blank">
                                        Contact Us
                                      </a>
                                    </p>
                                  </div> */}
                                  {/* <small className="d-flex justify-content-center">
                                    {APPLICATION_VERSION}
                                  </small> */}
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
        ) : (
          <OTPVerificationView
            handleSubmit={() => setShowOtp(true)}
            mobileNumber={saveMobileNumber}
            setShowMenu={() => { }}
            position={2}
            onOtpSuccess={onOtpSuccess} // Trigger modal close and team list refresh
            teamIennerJoin={1}
            teamCompanyId={company_id}

          />
        )}
      </div>
    </div>
  );
};

export default CreateTeamMemBerModal;