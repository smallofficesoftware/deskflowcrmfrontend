import { ErrorMessage, Field, useFormikContext } from "formik";
import { useContext, useEffect } from "react";

import { AppContext } from "../../../common/AppContext";
import {
  createCompany,
  fetchMailSetupData,
  updateMailSetup,
} from "./NewCreateCompanyController";

const NewMailSetup = ({
  show,
  onHide,
  companyToEdit,
  setRefresh,
  // headerName,
  mobileNumber,
  setMailSetupData,
}: any) => {
  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Enter" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
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

  const handleSubmit = async (values: any) => {
    if (companyToEdit?.id) {
      updateMailSetup(values, setRefresh, companyToEdit, onHide);
      // setImage(values.company_logo);
      // handelClose();
    } else {
      createCompany(
        values,
        setRefresh,
        onHide,
        mobileNumber,
        setCheckPlan,
        isSetCheckPlan,
      );
    }
  };

  useEffect(() => {
    if (show && companyToEdit?.id) {
      fetchMailSetupData(setMailSetupData, companyToEdit);
    }
  }, [show, companyToEdit]);

  const handelClose = () => {
    // setHeaderPreview("");
    // handleRefresh();
    onHide();
    // setFooterPreview("");
    // setLogPreview("");
    // setSignPreview("");
    // setCataLogPreview("");
    // setCataLogView("");
    // setImage("");
  };

  return (
      <div className="mt-3 d-flex justify-content-center">
        <div className="mb-3 py-4  ">
          <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
            {/* {isOpenMailSetup && ( */}
            <>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label htmlFor="company_name" className="pb-2 form_label">
                    SMTP HOST
                  </label>
                  <Field
                    type="text"
                    name="host_out_going_mail"
                    className={`form-control font-size-15 rounded-1   ${errors.host_out_going_mail &&
                      touched.host_out_going_mail &&
                      "is-invalid input-box-error"
                      }`}
                  />
                  <ErrorMessage
                    name="host_out_going_mail"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label htmlFor="port_mail_setup" className="pb-2 form_label">
                    Email OutGoing Port
                  </label>
                  <Field
                    type="text"
                    name="port_mail_setup"
                    className={`form-control font-size-15 rounded-1   ${errors.port_mail_setup &&
                      touched.port_mail_setup &&
                      "is-invalid input-box-error"
                      }`}
                  />
                  <ErrorMessage
                    name="port_mail_setup"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label htmlFor="mail_id_setup" className="pb-2 form_label">
                    Email Address
                  </label>
                  <Field
                    type="email"
                    name="mail_id_setup"
                    className={`form-control font-size-15 rounded-1   ${errors.mail_id_setup &&
                      touched.mail_id_setup &&
                      "is-invalid input-box-error"
                      }`}
                  />
                  <ErrorMessage
                    name="mail_id_setup"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label
                    htmlFor="password_mail_setup"
                    className="pb-2 form_label"
                  >
                    Password
                  </label>
                  <Field
                    type="password"
                    name="password_mail_setup"
                    className={`form-control font-size-15 rounded-1   ${errors.password_mail_setup &&
                      touched.password_mail_setup &&
                      "is-invalid input-box-error"
                      }`}
                  />
                  <ErrorMessage
                    name="password_mail_setup"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label htmlFor="pop3_host" className="pb-2 form_label">
                    POP3 Host
                  </label>
                  <Field
                    type="text"
                    name="pop3_host"
                    className={`form-control font-size-15 rounded-1   ${errors.pop3_host &&
                      touched.pop3_host &&
                      "is-invalid input-box-error"
                      }`}
                  />
                  <ErrorMessage
                    name="pop3_host"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-group">
                  <label htmlFor="incoming_port" className="pb-2 form_label">
                    Incoming Port
                  </label>
                  <Field
                    type="text"
                    name="incoming_port"
                    className={`form-control font-size-15 rounded-1   ${errors.incoming_port &&
                      touched.incoming_port &&
                      "is-invalid input-box-error"
                      }`}
                  />
                  <ErrorMessage
                    name="incoming_port"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
            </>
            {/* )} */}

            <div
              style={{
                bottom: 0,
                background: "#fff",
                padding: "15px",
                borderTop: "1px solid #ddd",
                zIndex: 1000,
                position: "sticky"
              }}
              className="d-flex justify-content-end gap-2"
            >
              <button
                type="button"
                className="modal-button1 rounded-1 px-4 py-2 ms-2"
                onClick={handelClose}
                style={{
                  border: "1px solid #f58634",
                  color: "#f58634",
                  background: "transparent"
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(values)}
                className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                style={{
                  backgroundColor: "#f58634",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};
export default NewMailSetup;
