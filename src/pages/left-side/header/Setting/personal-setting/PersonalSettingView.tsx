import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { TReactSetState } from "../../../../../helpers/AppType";
import useWhatsappPlatformStore from "../../../../../store/whatsapp/useWhatsappPlateformFlagStore";
import {
  createPersonalSettingInitialValues,
  createPersonalSettingValidationSchema,
  fetchWhatsappWABAConfigDetailsTeam,
  handleSaveData,
  ITeamWABADetails
} from "./PersonalSettingController";

interface IPropsPersonalSetting {
  show: boolean;
  onHide: () => void;
  companyToEdit: any;
  headerName: string;
  setIsLoadApi: TReactSetState<boolean>;
}
const PersonalSettingView = ({
  show,
  onHide,
  companyToEdit,
  headerName,
  setIsLoadApi,
}: IPropsPersonalSetting) => {

  const { platformType } = useWhatsappPlatformStore();
  const [whatsappWABAConfigDetails, setWhatsappWABAConfigDetails] =
    useState<ITeamWABADetails[]>([]);

  const [isOpenThirdParty, setIsOpenThirdParty] = useState(false);

  const handleSubmit = async (values: any) => {
    handleSaveData(values, companyToEdit.id, onHide, setIsLoadApi);
  };
  const [showQr, setShowQr] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Store interval reference
  const [statusMessages, setStatusMessages] = useState<{
    type: string;
    message: string;
  }>(); // Store status messages

  // const fetchQr = async () => {
  //   const mobileNo = companyToEdit?.recovery_mobile || 0;
  //   const response = await axiosInstanceForWpWeb.get("/show-qr");
  //   setShowQr(response.data.data.qr);
  //   const latestStatus = response?.data?.data?.latestStatusMessage;
  //   if (Array.isArray(latestStatus) && latestStatus.length > 0) {
  //     setStatusMessages(latestStatus[0]); // Ensure it's a valid object
  //   } else {
  //     setStatusMessages({ type: "", message: "" }); // Default empty object
  //   }
  // };

  const handleClose = () => {
    onHide();
    setIsOpenThirdParty(false);
  };
  // useEffect(() => {
  //   if (isOpenThirdParty) {
  //     fetchQr(); // Fetch QR code when modal opens

  //     // Start auto-refresh every 1 minute
  //     intervalRef.current = setInterval(fetchQr, 10000);
  //     setStatusMessages({ type: "", message: "" });
  //   } else {
  //     // Stop API calls when modal is closed
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //       intervalRef.current = null;
  //     }
  //   }
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //       intervalRef.current = null;
  //     }
  //   };
  // }, [isOpenThirdParty]);

  const copyToClipboard = async (text: any) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWhatsappWABAConfigDetailsTeam(
      setWhatsappWABAConfigDetails
    );
  }, []);

  return (
    <div>
      {show && (
        <div className="modal1">
          <div className="modal-content1">
            <div className="d-flex align-items-center justify-content-between">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">{headerName}</h2>
              </div>
              <div className="col-4">
                {" "}
                <span className="close" onClick={handleClose}>
                  &times;
                </span>
              </div>
            </div>

            <Formik
              enableReinitialize
              initialValues={createPersonalSettingInitialValues(companyToEdit)}
              validationSchema={createPersonalSettingValidationSchema()}
              onSubmit={handleSubmit}

            >
              {({ errors, touched, setFieldValue, values }) => {
                const whatsappOptions = whatsappWABAConfigDetails.map(
                  (item) => ({
                    value: item.id,
                    label: `${item.display_phone_number} - ${item.verified_name}`,
                    phoneNumberId: item.id,
                    wabaId: item.waba_id,
                  })
                );

                const selectedWhatsappDetail =
                  whatsappOptions.find(
                    (item) =>
                      String(item.phoneNumberId) ===
                      String(values.whatsapp_phone_number_id)
                  ) || null;

                return (
                  <Form>
                    <div className="  mt-3    d-flex justify-content-center">
                      <div className="mb-3 py-4  ">
                        <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
                          {/* <div className="col-12 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="whatsapp_authkey"
                              className="pb-2 form_label"
                            >
                              Whatsapp Api authkey
                            </label>
                            <Field
                              as="textarea"
                              name="whatsapp_authkey"
                              className={`form-control font-size-15 rounded-1   ${
                                errors.whatsapp_authkey &&
                                touched.whatsapp_authkey &&
                                "is-invalid input-box-error"
                              }`}
                              rows={1}
                            />
                            <ErrorMessage
                              name="whatsapp_authkey"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-6 ">
                          <div className="form-group">
                            <label
                              htmlFor="whatsapp_appkey"
                              className="pb-2 form_label"
                            >
                              Whatsapp Api AppKey
                            </label>
                            <Field
                              as="textarea"
                              name="whatsapp_appkey"
                              className={`form-control font-size-15 rounded-1   ${
                                errors.whatsapp_appkey &&
                                touched.whatsapp_appkey &&
                                "is-invalid input-box-error"
                              }`}
                              rows={1}
                            />
                            <ErrorMessage
                              name="whatsapp_appkey"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div> */}

                          {platformType == 2 && (
                            <>
                              <div className="col-12 col-md-6">
                                <label className="form-check-label mb-1">
                                  WhatsApp API Key
                                </label>

                                <div style={{ position: "relative" }}>
                                  <input
                                    type="password"
                                    placeholder="Enter WhatsApp API Key"
                                    value={values.whatsapp_api_key}
                                    onChange={async (e) => {

                                      const apiKey = e.target.value;

                                      setFieldValue(
                                        "whatsapp_api_key",
                                        apiKey
                                      );

                                      if (!apiKey.trim()) {

                                        setWhatsappWABAConfigDetails([]);

                                        setFieldValue(
                                          "whatsapp_phone_number_id",
                                          ""
                                        );

                                        setFieldValue(
                                          "whatsapp_waba_id",
                                          ""
                                        );
                                        const updatedValues = {
                                          ...values,
                                          whatsapp_api_key: "",
                                          whatsapp_phone_number_id: "",
                                          whatsapp_waba_id: "",
                                        };

                                        setFieldValue("whatsapp_phone_number_id", "");
                                        setFieldValue("whatsapp_waba_id", "");

                                        await handleSaveData(
                                          updatedValues,
                                          companyToEdit.id,
                                          onHide,
                                          setIsLoadApi,
                                          false
                                        );

                                        return;
                                      }

                                      await handleSaveData(
                                        {
                                          ...values,
                                          whatsapp_api_key: apiKey,
                                        },
                                        companyToEdit.id,
                                        onHide,
                                        setIsLoadApi,
                                        false
                                      );

                                      await fetchWhatsappWABAConfigDetailsTeam(
                                        setWhatsappWABAConfigDetails
                                      );
                                    }}
                                    className="form-control pe-5"
                                  />

                                  {/* Copy Icon */}
                                  <span
                                    onClick={() =>
                                      copyToClipboard(
                                        values.whatsapp_api_key
                                      )
                                    }
                                    style={{
                                      position: "absolute",
                                      right: "12px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      height="20px"
                                      viewBox="0 -960 960 960"
                                      width="20px"
                                      fill="#5f6368"
                                    >
                                      <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
                                    </svg>
                                  </span>
                                </div>
                              </div>

                              <div className="col-12 col-md-6">
                                <label className="form-check-label mb-1">
                                  WhatsApp Details
                                </label>

                                <CustomSearchDropdown
                                  isAsync={false}
                                  options={whatsappOptions}
                                  value={selectedWhatsappDetail}
                                  onChange={(selected: any) => {

                                    setFieldValue(
                                      "whatsapp_phone_number_id",
                                      selected?.phoneNumberId || ""
                                    );

                                    setFieldValue(
                                      "whatsapp_waba_id",
                                      selected?.wabaId || ""
                                    );
                                  }}
                                  className="w-100"
                                  placeholder="Search WABA Details"
                                />
                              </div>


                              {/* WhatsApp Phone Number ID */}
                              <div className="col-12 col-md-6">
                                <label className="form-check-label mb-1">
                                  WhatsApp Phone Number ID
                                </label>

                                <input
                                  type="text"
                                  placeholder="Enter WhatsApp Phone Number ID"
                                  value={values.whatsapp_phone_number_id}
                                  onChange={(e) =>
                                    setFieldValue(
                                      "whatsapp_phone_number_id",
                                      e.target.value
                                    )
                                  }
                                  className="form-control"
                                />
                              </div>

                              {/* WhatsApp WABA ID */}
                              <div className="col-12 col-md-6"
                                style={{ marginTop: "23px" }}
                              >
                                <label className="form-check-label mb-1">
                                  WhatsApp WABA ID
                                </label>

                                <input
                                  type="text"
                                  placeholder="Enter WhatsApp WABA ID"
                                  value={values.whatsapp_waba_id}
                                  onChange={(e) =>
                                    setFieldValue(
                                      "whatsappWabaId",
                                      e.target.value
                                    )
                                  }
                                  className="form-control"
                                />
                              </div>
                            </>
                          )}
                          <div className="col-12 col-md-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="company_name"
                                className="pb-2 form_label"
                              >
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
                          <div className="col-12 col-md-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="port_mail_setup"
                                className="pb-2 form_label"
                              >
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
                          <div className="col-12 col-md-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="mail_id_setup"
                                className="pb-2 form_label"
                              >
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
                          <div className="col-12 col-md-6 ">
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
                          <div className="col-12 col-md-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="pop3_host"
                                className="pb-2 form_label"
                              >
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
                          <div className="col-12 col-md-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="incoming_port"
                                className="pb-2 form_label"
                              >
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
                          {/* <WhatsAppQRView /> */}

                          {/* <div className="col-12 border rounded bg-secondary">
                          <b
                            className="cursor-pointer"
                            onClick={() => setIsOpenThirdParty(true)}
                            style={{
                              cursor: "pointer",
                              display: "block",
                              color: "#ffff",
                            }}
                          >
                            Show Qr
                            <span className="ms-2">
                              {isOpenThirdParty ? "▲" : "▼"}
                            </span>
                          </b>
                        </div>
                        {isOpenThirdParty && (
                          <>
                            <div className="col-12 ">
                              <div className="form-group">
                                <label
                                  htmlFor="india_mart_api_key"
                                  className="pb-2 form_label"
                                >
                                  QR
                                </label>

                                {showQr && (
                                  <img
                                    src={showQr}
                                    style={{ height: "600px", width: "600px" }}
                                    alt=""
                                  />
                                )}
                                {statusMessages && (
                                  <p>{statusMessages.message}</p>
                                )}
                              </div>
                            </div>
                          </>
                        )} */}
                          <div className="col-12 col-12 pt-4 d-flex justify-content-end modal-buttons">
                            <button
                              className="modal-button1"
                              onClick={handleClose}
                            >
                              Close
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                              style={{
                                backgroundColor: "#f58634",
                              }}
                            >
                              save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Form>
                )
              }}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSettingView;
