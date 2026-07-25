import { ErrorMessage, Field, useFormikContext } from "formik";
import { useContext, useEffect, useState } from "react";

import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import { copyToClipboard, handleRefresh } from "../../../common/SharedFunction";
import ContactInsertApiDoc from "../../../components/company/ContactInsertApiDoc";
import OtpConfirmationModal from "../../../components/model/OtpConfirmationModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import {
  INDIA_MART_PUSH_API,
  JUST_DIAL_PUSH_API,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import { fetchGoogleSheetForFacebook } from "../LeftSideController";
import {
  createCompany,
  fetchCountryApiForCompany,
  fetchCurrency,
  fetchThirdPartyData,
  IGoogleSheetsProps,
  updateThirdParty,
} from "./NewCreateCompanyController";
import GoogleSheetsColumnConfigModal from "./new-google-sheets-column-config/NewGoogleSheetsColumnConfigModal";

const NewThirdParty = ({
  show,
  onHide,
  companyToEdit,
  setRefresh,
  headerName,
  mobileNumber,
  isShowApiKey,
  setThirdPartyData,
}: any) => {
  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();

  const [isEmailVerifyConfirmation, setIsEmailVerifyCloseConfirmation] =
    useState(false);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const [logPreview, setLogPreview] = useState<string | null>(null);
  const [signPreview, setSignPreview] = useState<string | null>(null);

  const [countriesList, setCountriesList] = useState([]);

  const [currency, setCurrency] = useState<ICurrency[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<number>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();

  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);

  const [
    isOpenGoogleSheetsColumnConfigModel,
    setIsGoogleSheetsColumnConfigModel,
  ] = useState(false);
  const [googleSheetModalDetails, setGoogleSheetModalDetails] =
    useState<IGoogleSheetsProps>();

  const [
    onlineStoreBannerCroppedImageUrl,
    setOnlineStoreBannerCroppedImageUrl,
  ] = useState<string | undefined>();
  const [storeBannerOneimage, setStoreBannerOneimage] = useState(
    companyToEdit?.banner_img_one || "",
  );
  const [storeBannerOnePreview, setStoreBannerOnePreview] = useState<
    string | null
  >(null);

  const [
    onlineStoreBannertwoCroppedImageUrl,
    setOnlineStoreBannertwoCroppedImageUrl,
  ] = useState<string | undefined>();
  const [storeBannertwoimage, setStoreBannertwoimage] = useState(
    companyToEdit?.banner_img_two || "",
  );
  const [storeBannertwoPreview, setStoreBannertwoOnePreview] = useState<
    string | null
  >(null);
  const canViewThirdPArtyLeadGeneration = useCheckUserPermission(
    PAGE_ID.THIRD_PARTY_LEAD_GENERATION,
    PERMISSION_TYPE.ADD,
  );

  const openGoogleSheetsColumnConfigModal = (
    title: string,
    sheet_type: number | string,
  ) => {
    setIsGoogleSheetsColumnConfigModel(true);
    setGoogleSheetModalDetails({ title, sheet_type });
  };

  const [selectedCurrency, setSelectedCurrency] =
    useState<SingleValue<IOption> | null>(null);

  const [defaultCurrency, setDefaultCurrency] =
    useState<SingleValue<IOption> | null>(null);

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | undefined>();

  const [signCroppedImageUrl, setSignCroppedImageUrl] = useState<
    string | undefined
  >();

  const [indiaMartApiResponse, setIndiaMartApiResponse] = useState<any>(null); // State for API response

  interface ICurrency {
    id: number;
    short_name: string;
    name: string;
  }

  // Handle IndiaMart API call
  const handleIndiaMartSubmit = async () => {
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = date
        .toLocaleString("default", { month: "short" })
        .toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    if (!getUUID || !token) {
      toast.error("Missing UUID or token. Please log in again.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/india-mart", // Verify this endpoint matches your backend
        {
          a_application_login_id: getUUID,
          source_type_id: -1,
          from_date: formatDate,
          to_date: formatDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Standard Bearer token format
          },
        },
      );

      if (response.data.code === 200 && response.data.ack === "SUCCESS") {
        toast.success(response.data.ack_msg || "Data fetched successfully");
        setIndiaMartApiResponse(response.data);
      } else {
        toast.error(response.data.ack_msg || "Failed to fetch data");
        setIndiaMartApiResponse(response.data);
      }
    } catch (error: any) {
      console.error("IndiaMart API Error:", error);
      toast.error(
        error?.response?.data?.ack_msg ||
        error?.message ||
        "Failed to fetch IndiaMart data",
      );
      setIndiaMartApiResponse({
        error: error?.message || "Failed to fetch IndiaMart data",
      });
    }
  };
  const handleTradeIndiaSubmit = async () => {
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = date
        .toLocaleString("default", { month: "short" })
        .toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    if (!getUUID || !token) {
      toast.error("Missing UUID or token. Please log in again.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/trade-india-buy-leads", // Verify this endpoint matches your backend
        {
          a_application_login_id: getUUID,
          source_type_id: -13,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Standard Bearer token format
          },
        },
      );

      if (response.data.code === 200 && response.data.ack === "SUCCESS") {
        toast.success(response.data.ack_msg || "Data fetched successfully");
      } else {
        toast.error(response.data.ack_msg || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Trade India API Error:", error);
      toast.error(
        error?.response?.data?.ack_msg ||
        error?.message ||
        "Failed to fetch Trade India data",
      );
    }

    try {
      const response = await axiosInstance.post(
        "/trade-india", // Verify this endpoint matches your backend
        {
          a_application_login_id: getUUID,
          source_type_id: -13,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Standard Bearer token format
          },
        },
      );
      if (response.data.code === 200 && response.data.ack === "SUCCESS") {
        toast.success(response.data.ack_msg || "Data fetched successfully");
      } else {
        toast.error(response.data.ack_msg || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Trade India API Error:", error);
      toast.error(
        error?.response?.data?.ack_msg ||
        error?.message ||
        "Failed to fetch Trade India data",
      );
    }
  };

  useEffect(() => {
    return () => {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    };
  }, [croppedImageUrl]);

  const countryOptions = countriesList.map((category: any) => ({
    value: category.id,
    label: category.country_name,
  }));
  const defaultCountry = countryOptions.find((c) => c.value === 101);

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

  // For Online Store Banner One
  useEffect(() => {
    if (onlineStoreBannerCroppedImageUrl) {
      setStoreBannerOneimage(onlineStoreBannerCroppedImageUrl);
    } else if (storeBannerOnePreview) {
      setStoreBannerOneimage(storeBannerOnePreview);
    } else if (companyToEdit?.banner_img_one) {
      setStoreBannerOneimage(companyToEdit.banner_img_one);
    } else {
      setStoreBannerOneimage("");
    }
  }, [
    onlineStoreBannerCroppedImageUrl,
    storeBannerOnePreview,
    companyToEdit?.banner_img_one,
  ]);

  // For Online Store Banner One Two
  useEffect(() => {
    if (onlineStoreBannertwoCroppedImageUrl) {
      setStoreBannertwoimage(onlineStoreBannertwoCroppedImageUrl);
    } else if (storeBannertwoPreview) {
      setStoreBannertwoimage(storeBannertwoPreview);
    } else if (companyToEdit?.banner_img_two) {
      setStoreBannertwoimage(companyToEdit.banner_img_two);
    } else {
      setStoreBannertwoimage("");
    }
  }, [
    onlineStoreBannertwoCroppedImageUrl,
    storeBannertwoPreview,
    companyToEdit?.banner_img_two,
  ]);

  useEffect(() => {
    if (signCroppedImageUrl) {
      setSignPreview(signCroppedImageUrl);
    } else if (signPreview) {
      // already set
    } else if (companyToEdit?.company_sign) {
      setSignPreview(companyToEdit.company_sign);
    } else {
      setSignPreview("");
    }
  }, [signCroppedImageUrl, companyToEdit?.company_sign]);

  const handleSubmit = async (values: any) => {
    if (companyToEdit?.id) {
      updateThirdParty(values, setRefresh, companyToEdit, onHide);
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
      fetchThirdPartyData(setThirdPartyData, companyToEdit);
    }
  }, [show, companyToEdit]);

  const handelClose = () => {
    setHeaderPreview("");
    // handleRefresh();
    onHide();
    setFooterPreview("");
    setLogPreview("");
    setSignPreview("");
    // setCataLogPreview("");
    // setCataLogView("");
    // setImage("");
    setStoreBannerOnePreview("");
    setStoreBannertwoOnePreview("");
  };

  useEffect(() => {
    // fetchCategoryB2BApi(setCategoryList);
    fetchCurrency(setCurrency);

    if (companyToEdit) {
      setSelectedCategoryId(companyToEdit?.category_id_b2b);
      fetchCountryApiForCompany(setCountriesList);
    }
    if (companyToEdit?.country_id) {
      setSelectedStateId(companyToEdit?.country_id || undefined);
    } else {
      setSelectedStateId(defaultCountry?.value);
    }
  }, [companyToEdit?.country_id, show]);

  useEffect(() => {
    if (
      companyToEdit &&
      companyToEdit.currency_id &&
      currency &&
      currency.length > 0
    ) {
      // Match companyToEdit.currency_id with currency state
      const matchedCurrency = currency.find(
        (curr) => curr.id === companyToEdit.currency_id,
      );
      if (matchedCurrency) {
        // Create dropdown option using matched currency
        const currencyOption = {
          label: `${matchedCurrency.short_name} - ${matchedCurrency.name}`,
          value: matchedCurrency.id,
        };
        setDefaultCurrency(currencyOption);
        setSelectedCurrency(currencyOption);
        // Update Formik field for consistency
      }
    }
  }, [companyToEdit, currency]);

  const GoogleSheetOpen = ({ link }: { link: string }) => {
    return link ? (
      <div style={{ fontSize: "15px", color: "red" }}>
        <a
          href={`https://docs.google.com/spreadsheets/d/${link}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Sheet
        </a>
      </div>
    ) : null;
  };

  return (
    <>
      <div className="mb-3 py-4  ">
        <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
          <>
            <div className="col-12 col-md-8"></div>
            {/* {activeTab === "thirdParty" && ( */}
            <>
              {/* <hr /> */}
              {/* <div className="col-12 d-flex justify-content-end mb-3"></div> */}
              <div className="col-12">
                {/* IndiaMart Pull API Key Section */}
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    {/* Image on Left Side */}
                    <div className="me-4">
                      <img
                        src={require("../../../assets/images/indiamart-logo.jpg")}
                        alt="IndiaMart"
                        style={{
                          height: "11vh",
                          width: "20vh",
                          objectFit: "contain",
                          marginLeft: "20px",
                        }}
                      />
                    </div>

                    {/* Fields and Buttons on Right Side */}
                    <div style={{ width: "45%" }} className="ms-5">
                      {/* India Mart Pull API Key Field */}
                      <label
                        htmlFor="india_mart_api_key"
                        className="form_label"
                      >
                        India Mart Pull API Key
                      </label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-key"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          name="india_mart_api_key"
                          rows={1}
                          className={`form-control bg-light border-start-0 ${errors.india_mart_api_key &&
                            touched.india_mart_api_key
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                        {/* Test Button beside the First Field */}
                      </div>

                      {/* IndiaMart Push API Link Field */}
                      <label className="form_label">
                        IndiaMart Push API Link
                      </label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-link-45deg"></i>
                                            </span> */}
                        <input
                          type="text"
                          readOnly
                          value={INDIA_MART_PUSH_API + companyToEdit.qr_code}
                          className="form-control bg-light border-start-0"
                        />
                      </div>

                      {/* Copy Button below the second field */}
                    </div>
                    <div
                      style={{
                        width: "45%",
                        display: "flex",
                        justifyContent: "space-between",
                        flexDirection: "column",
                        height: "100%",
                        alignItems: "self-start",
                      }}
                    >
                      {/* India Mart Pull API Key Field */}

                      {/* Test Button beside the First Field */}
                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-secondary ms-5"
                          title="Test IndiaMart Pull API Key"
                          onClick={handleIndiaMartSubmit}
                        >
                          <i className="bi bi-check-circle"></i> Test
                        </button>
                      </div>

                      {/* IndiaMart Push API Link Field */}
                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-secondary ms-5 mt-3"
                          title="Copy Push Links"
                          onClick={() =>
                            copyToClipboard(
                              INDIA_MART_PUSH_API + companyToEdit.qr_code,
                            )
                          }
                        >
                          <i className="bi bi-copy"></i> Copy
                        </button>
                      </div>

                      {/* Copy Button below the second field */}
                    </div>
                  </div>

                  <ErrorMessage
                    name="india_mart_api_key"
                    component="div"
                    className="field-error text-danger mt-1"
                  />
                </div>
              </div>
              <hr /> {/* Separate HR for IndiaMart Pull */}
              {/* Justdial & IndiaMart Push Links Section - NOW FULLY SEPARATE */}
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="me-4">
                        <img
                          src={require("../../../assets/images/justdial.jpg")}
                          alt="IndiaMart"
                          style={{
                            height: "11vh",
                            width: "20vh",
                            objectFit: "contain",
                            marginLeft: "20px",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ width: "45%" }} className="ms-5">
                      <label className="form_label">
                        Justdial Push API Link
                      </label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-link-45deg"></i>
                                            </span> */}
                        <input
                          type="text"
                          readOnly
                          value={JUST_DIAL_PUSH_API + companyToEdit.qr_code}
                          className="form-control bg-light border-start-0"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-5"
                      title="Copy Push Links"
                      onClick={() =>
                        copyToClipboard(
                          `Justdial: ${JUST_DIAL_PUSH_API + companyToEdit.qr_code
                          }`,
                        )
                      }
                    >
                      <i className="bi bi-copy"></i> Copy
                    </button>
                  </div>
                </div>
              </div>
              <hr /> {/* Separate HR after Push Links */}
              {/* Trade India Section */}
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      <img
                        src={require("../../../assets/images/tradindia.jpg")}
                        alt="IndiaMart"
                        style={{
                          height: "11vh",
                          width: "20vh",
                          objectFit: "contain",
                          marginLeft: "20px",
                        }}
                      />
                    </div>
                    <div style={{ width: "45%" }} className="ms-5">
                      <label className="form_label">
                        Trade India API User ID
                      </label>
                      <div className="input-group mb-3">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-person"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          name="trade_india_user_id"
                          className={`form-control bg-light border-start-0 ${errors.trade_india_user_id &&
                            touched.trade_india_user_id
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>

                      <label className="form_label">
                        Trade India API Profile ID
                      </label>
                      <div className="input-group mb-3">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-person"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          name="trade_india_profile_id"
                          className={`form-control bg-light border-start-0 ${errors.trade_india_profile_id &&
                            touched.trade_india_profile_id
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>

                      <label className="form_label">Trade India API Key</label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-key"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          name="trade_india_key"
                          className={`form-control bg-light border-start-0 ${errors.trade_india_key && touched.trade_india_key
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>
                    </div>

                    {/* TEST BUTTON for Trade India User ID */}
                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-5"
                      title="Test IndiaMart Pull API Key"
                      onClick={handleTradeIndiaSubmit}
                    >
                      <i className="bi bi-check-circle"></i> Test
                    </button>
                  </div>

                  <ErrorMessage
                    name="trade_india_user_id"
                    component="div"
                    className="field-error text-danger"
                  />
                  <ErrorMessage
                    name="trade_india_profile_id"
                    component="div"
                    className="field-error text-danger"
                  />
                  <ErrorMessage
                    name="trade_india_key"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <hr />
              {/* WhatsApp Section */}
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      <img
                        src={require("../../../assets/images/whatsapp.jpg")}
                        alt="IndiaMart"
                        style={{
                          height: "11vh",
                          width: "20vh",
                          objectFit: "contain",
                          marginLeft: "20px",
                        }}
                      />
                    </div>
                    <div style={{ width: "45%" }} className="ms-5">
                      <label className="form_label">WhatsApp API Authkey</label>
                      <div className="input-group mb-3">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-whatsapp"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          name="whatsapp_authkey"
                          className={`form-control bg-light border-start-0 ${errors.whatsapp_authkey && touched.whatsapp_authkey
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>

                      <label className="form_label">WhatsApp API AppKey</label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-whatsapp"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          name="whatsapp_appkey"
                          className={`form-control bg-light border-start-0 ${errors.whatsapp_appkey && touched.whatsapp_appkey
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-5"
                      title="Copy WhatsApp AppKey"
                      onClick={() => copyToClipboard(values.whatsapp_appkey)}
                    >
                      <i className="bi bi-copy"></i> Copy
                    </button>
                  </div>

                  <ErrorMessage
                    name="whatsapp_authkey"
                    component="div"
                    className="field-error text-danger"
                  />
                  <ErrorMessage
                    name="whatsapp_appkey"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <hr />
              {/* ChatGPT Section */}
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      <img
                        src={require("../../../assets/images/chat-gpt.jpg")}
                        alt="IndiaMart"
                        style={{
                          height: "11vh",
                          width: "20vh",
                          objectFit: "contain",
                          marginLeft: "20px",
                        }}
                      />
                    </div>
                    <div style={{ width: "45%" }} className="ms-5">
                      <label className="form_label">ChatGPT API Key</label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-robot"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          name="chatgpt_appkey"
                          className={`form-control bg-light border-start-0 ${errors.chatgpt_appkey && touched.chatgpt_appkey
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-5"
                      title="Copy ChatGPT API Key"
                      onClick={() => copyToClipboard(values.chatgpt_appkey)}
                    >
                      <i className="bi bi-copy"></i> Copy
                    </button>
                  </div>

                  <ErrorMessage
                    name="chatgpt_appkey"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <hr /> {/* Separate HR before Gemini */}
              {/* Google Gemini Section - NOW FULLY SEPARATE */}
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      <img
                        src={require("../../../assets/images/gemani.jpg")}
                        alt="IndiaMart"
                        style={{
                          height: "11vh",
                          width: "20vh",
                          objectFit: "contain",
                          marginLeft: "20px",
                        }}
                      />
                    </div>
                    <div style={{ width: "45%" }} className="ms-5">
                      <label className="form_label">Gemini API Key</label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-robot"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          rows={1}
                          style={{ resize: "none" }}
                          name="gimini_appkey"
                          className={`form-control bg-light border-start-0 ${errors.gimini_appkey && touched.gimini_appkey
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-5"
                      title="Copy Gemini API Key"
                      onClick={() => copyToClipboard(values.gimini_appkey)}
                    >
                      <i className="bi bi-copy"></i> Copy
                    </button>
                  </div>

                  <ErrorMessage
                    name="gimini_appkey"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <hr /> {/* Separate HR after Gemini */}
              {/* SERP API Section */}
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      <img
                        src={require("../../../assets/images/serp_api.jpg")}
                        alt="IndiaMart"
                        style={{
                          height: "11vh",
                          width: "20vh",
                          objectFit: "contain",
                          marginLeft: "20px",
                        }}
                      />
                    </div>
                    <div style={{ width: "45%" }} className="ms-5">
                      <label htmlFor="serp_api_key" className="form_label">
                        SERP API Key
                      </label>
                      <div className="input-group">
                        {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-key"></i>
                                            </span> */}
                        <Field
                          as="textarea"
                          name="serp_api_key"
                          rows={1}
                          className={`form-control bg-light border-start-0 ${errors.serp_api_key && touched.serp_api_key
                            ? "is-invalid input-box-error"
                            : ""
                            }`}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-5"
                      title="Copy SERP API Key"
                      onClick={() => copyToClipboard(values.serp_api_key)}
                    >
                      <i className="bi bi-copy"></i> Copy
                    </button>
                  </div>

                  <ErrorMessage
                    name="serp_api_key"
                    component="div"
                    className="field-error text-danger mt-1"
                  />
                </div>
              </div>
              <hr />
              <ContactInsertApiDoc
                name="insert_contact_api"
                label="Contact Insert API"
                imageSrc={require("../../../assets/images/www.jpg")}
                copyValue={values.insert_contact_api}
                onCopy={copyToClipboard}
              />
              <hr />
              {/* Google Sheet Section */}
              <div className="col-12 col-md-12 mb-3">
                {/* <a
                                      href={require("../../../assets/sample/sampleGoogleSheet.xlsx")}
                                      download="sampleGoogleSheet.xlsx"
                                      className=""
                                    >
                                      Download Sample Google Sheet
                                    </a> */}
                <div className="google-sheet-config-description">
                  <h4>Google Sheet Configuration</h4>

                  <p>
                    In the <strong>Google Sheet Configuration</strong>, click
                    the <strong>SETUP</strong> button. You will see a list of
                    columns on the left side. These column names are{" "}
                    <strong>system-defined fields</strong> from our software.
                  </p>

                  <p>
                    On the right side, enter the{" "}
                    <strong>corresponding column names</strong> from your Google
                    Sheet in the provided text boxes. Each Google Sheet column
                    name should match the related system field shown on the
                    left.
                  </p>

                  <p>
                    You can also define the <strong>sequence (order)</strong> of
                    columns as they appear in your Google Sheet. Data will be
                    processed according to this column sequence.
                  </p>

                  <div className="alert alert-warning mt-3">
                    <strong>⚠️ Important (Mandatory):</strong>
                    <ul className="mb-0 mt-2">
                      <li>
                        The <strong>id</strong> field is{" "}
                        <strong>not available</strong> in the setup column list
                        and cannot be configured from the SETUP screen.
                      </li>
                      <li>
                        The <strong>id</strong> column must exist only in your
                        Google Sheet.
                      </li>
                      <li>
                        This <strong>id</strong> column must contain a{" "}
                        <strong>unique value</strong> for each record.
                      </li>
                      <li>
                        The system uses this <strong>id</strong> column as a
                        unique key to identify and update existing leads.
                      </li>
                      <li>
                        If the <strong>id</strong> column is missing or contains
                        duplicate values, the system will insert the same lead
                        multiple times, resulting in duplicate data.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group mb-3">
                  <label
                    htmlFor="google_lead_sheet_for_faceBook_1"
                    className="pb-2 form_label"
                  >
                    Google Lead Sheet For FaceBook 1
                  </label>
                  <button
                    type="button"
                    className="icons text-white"
                    onClick={() =>
                      openGoogleSheetsColumnConfigModal(
                        "Google Lead Sheet For FaceBook 1",
                        1,
                      )
                    }
                  >
                    <span className="badge bg-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#fafdfb"
                      >
                        <path d="M288-384h48v-144h-48v48h-48v48h48v48Zm96-48h336v-48H384v48Zm240-96h48v-48h48v-48h-48v-48h-48v144Zm-384-48h336v-48H240v48Zm96 432v-96H168q-29.7 0-50.85-21.16Q96-282.32 96-312.04v-432.24Q96-774 117.15-795T168-816h624q29.7 0 50.85 21.16Q864-773.68 864-743.96v432.24Q864-282 842.85-261T792-240H624v96H336ZM168-312h624v-432H168v432Zm0 0v-432 432Z" />
                      </svg>{" "}
                      Setup
                    </span>
                  </button>
                  <div className="input-group">
                    <span
                      className="input-group-text bg-light border-end-0"
                      style={{ height: "46px" }}
                    >
                      <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                      {/* Example icon */}
                    </span>
                    <Field
                      as="textarea"
                      name="google_lead_sheet_for_faceBook_1"
                      className={`form-control font-size-15 rounded-1 bg-light border-start-0 ${errors.google_lead_sheet_for_faceBook_1 &&
                        touched.google_lead_sheet_for_faceBook_1
                        ? "is-invalid input-box-error"
                        : ""
                        }`}
                      rows={1}
                    />
                    <Field
                      type="text"
                      name="google_sheet_first_name"
                      style={{
                        height: "30px",
                        margin: "5px",
                      }}
                      className={`form-control form-control-sm font-size-15 rounded-1 ${errors.google_sheet_first_name &&
                        touched.google_sheet_first_name &&
                        "is-invalid input-box-error"
                        }`}
                    />
                  </div>
                  <GoogleSheetOpen
                    link={values.google_lead_sheet_for_faceBook_1}
                  />
                  <ErrorMessage
                    name="google_lead_sheet_for_faceBook_1"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group mb-3">
                  <label
                    htmlFor="google_lead_sheet_for_faceBook_2"
                    className="pb-2 form_label"
                  >
                    Google Lead Sheet For FaceBook 2
                  </label>
                  <button
                    type="button"
                    className="icons text-white"
                    onClick={() =>
                      openGoogleSheetsColumnConfigModal(
                        "Google Lead Sheet For FaceBook 2",
                        2,
                      )
                    }
                  >
                    <span className="badge bg-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#fafdfb"
                      >
                        <path d="M288-384h48v-144h-48v48h-48v48h48v48Zm96-48h336v-48H384v48Zm240-96h48v-48h48v-48h-48v-48h-48v144Zm-384-48h336v-48H240v48Zm96 432v-96H168q-29.7 0-50.85-21.16Q96-282.32 96-312.04v-432.24Q96-774 117.15-795T168-816h624q29.7 0 50.85 21.16Q864-773.68 864-743.96v432.24Q864-282 842.85-261T792-240H624v96H336ZM168-312h624v-432H168v432Zm0 0v-432 432Z" />
                      </svg>{" "}
                      Setup
                    </span>
                  </button>
                  <div className="input-group">
                    <span
                      className="input-group-text bg-light border-end-0"
                      style={{ height: "46px" }}
                    >
                      <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                      {/* Example icon */}
                    </span>
                    <Field
                      as="textarea"
                      name="google_lead_sheet_for_faceBook_2"
                      className={`form-control font-size-15 rounded-1 bg-light border-start-0 ${errors.google_lead_sheet_for_faceBook_2 &&
                        touched.google_lead_sheet_for_faceBook_2
                        ? "is-invalid input-box-error"
                        : ""
                        }`}
                      rows={1}
                    />
                    <Field
                      type="text"
                      name="google_sheet_second_name"
                      style={{
                        height: "30px",
                        margin: "5px",
                      }} // 👈 small
                      className={`form-control form-control-sm font-size-15 rounded-1 ${errors.google_sheet_second_name &&
                        touched.google_sheet_second_name &&
                        "is-invalid input-box-error"
                        }`}
                    />
                  </div>
                  <GoogleSheetOpen
                    link={values.google_lead_sheet_for_faceBook_2}
                  />
                  <ErrorMessage
                    name="google_lead_sheet_for_faceBook_2"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group mb-3">
                  <label
                    htmlFor="google_sheet_key_3"
                    className="pb-2 form_label"
                  >
                    Google Sheet Key 3
                  </label>
                  <button
                    type="button"
                    className="icons text-white"
                    onClick={() =>
                      openGoogleSheetsColumnConfigModal("Google Sheet Key 3", 3)
                    }
                  >
                    <span className="badge bg-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#fafdfb"
                      >
                        <path d="M288-384h48v-144h-48v48h-48v48h48v48Zm96-48h336v-48H384v48Zm240-96h48v-48h48v-48h-48v-48h-48v144Zm-384-48h336v-48H240v48Zm96 432v-96H168q-29.7 0-50.85-21.16Q96-282.32 96-312.04v-432.24Q96-774 117.15-795T168-816h624q29.7 0 50.85 21.16Q864-773.68 864-743.96v432.24Q864-282 842.85-261T792-240H624v96H336ZM168-312h624v-432H168v432Zm0 0v-432 432Z" />
                      </svg>{" "}
                      Setup
                    </span>
                  </button>
                  <div className="input-group">
                    <span
                      className="input-group-text bg-light border-end-0"
                      style={{ height: "46px" }}
                    >
                      <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                      {/* Example icon */}
                    </span>
                    <Field
                      as="textarea"
                      name="google_sheet_key_3"
                      className={`form-control font-size-15 rounded-1 bg-light border-start-0 ${errors.google_sheet_key_3 && touched.google_sheet_key_3
                        ? "is-invalid input-box-error"
                        : ""
                        }`}
                      rows={1}
                    />
                    <Field
                      type="text"
                      name="google_sheet_third_name"
                      style={{
                        height: "30px",
                        margin: "5px",
                      }} // 👈 small
                      className={`form-control form-control-sm font-size-15 rounded-1 ${errors.google_sheet_third_name &&
                        touched.google_sheet_third_name &&
                        "is-invalid input-box-error"
                        }`}
                    />
                  </div>
                  <GoogleSheetOpen link={values.google_sheet_key_3} />
                  <ErrorMessage
                    name="google_sheet_key_3"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group mb-3">
                  <label
                    htmlFor="google_sheet_key_4"
                    className="pb-2 form_label"
                  >
                    Google Sheet Key 4
                  </label>
                  <button
                    type="button"
                    className="icons text-white"
                    onClick={() =>
                      openGoogleSheetsColumnConfigModal("Google Sheet Key 4", 4)
                    }
                  >
                    <span className="badge bg-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#fafdfb"
                      >
                        <path d="M288-384h48v-144h-48v48h-48v48h48v48Zm96-48h336v-48H384v48Zm240-96h48v-48h48v-48h-48v-48h-48v144Zm-384-48h336v-48H240v48Zm96 432v-96H168q-29.7 0-50.85-21.16Q96-282.32 96-312.04v-432.24Q96-774 117.15-795T168-816h624q29.7 0 50.85 21.16Q864-773.68 864-743.96v432.24Q864-282 842.85-261T792-240H624v96H336ZM168-312h624v-432H168v432Zm0 0v-432 432Z" />
                      </svg>{" "}
                      Setup
                    </span>
                  </button>
                  <div className="input-group">
                    <span
                      className="input-group-text bg-light border-end-0"
                      style={{ height: "46px" }}
                    >
                      <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                      {/* Example icon */}
                    </span>
                    <Field
                      as="textarea"
                      name="google_sheet_key_4"
                      className={`form-control font-size-15 rounded-1 bg-light border-start-0 ${errors.google_sheet_key_4 && touched.google_sheet_key_4
                        ? "is-invalid input-box-error"
                        : ""
                        }`}
                      rows={1}
                    />
                    <Field
                      type="text"
                      name="google_sheet_fourth_name"
                      style={{
                        height: "30px",
                        margin: "5px",
                      }} // 👈 small
                      className={`form-control form-control-sm font-size-15 rounded-1 ${errors.google_sheet_fourth_name &&
                        touched.google_sheet_fourth_name &&
                        "is-invalid input-box-error"
                        }`}
                    />
                  </div>
                  <GoogleSheetOpen link={values.google_sheet_key_4} />
                  <ErrorMessage
                    name="google_sheet_key_4"
                    component="div"
                    className="field-error text-danger"
                  />
                </div>
              </div>
              {(values.google_lead_sheet_for_faceBook_1 ||
                values.google_lead_sheet_for_faceBook_2 ||
                values.google_sheet_key_3 ||
                values.google_sheet_key_4) &&
                canViewThirdPArtyLeadGeneration ? (
                <div className="col-12 col-md-12">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetchGoogleSheetForFacebook();
                    }}
                    className="btn btn-success"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm140-40-56-56 103-104-104-104 57-56 160 160-160 160Zm180 0v-80h240v80H480Z" />
                    </svg>{" "}
                    RUN GOOGLE SHEET API
                  </button>
                </div>
              ) : (
                ""
              )}
            </>
            {/* // )} */}
          </>

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
      {/* {modals.map((modal, index) => (
                                        <CompanyPrifixModal
                                            key={index}
                                            show={modal.show}
                                            onClose={() => modal.setShow(false)}
                                            title={modal.title}
                                            fields={modal.fields}
                                            footerButtons={[
                                                {
                                                    label: "Save",
                                                    variant: "primary",
                                                    onClick: () => {
                                                        // Update parent form values
                                                        modal.fields.forEach((field) => {
                                                            setFieldValue(field.name, values[field.name]);
                                                        });
                                                        modal.setShow(false);
                                                    },
                                                },
                                            ]}
                                        />
                                    ))} */}

      {isPrintSettingShow && (
        <PrintSettingModal
          show={isPrintSettingShow}
          setShow={setIsPrintSettingShow}
          onHide={() => setIsPrintSettingShow(false)}
          handleSubmit={() => {
            // if (orderPrintById?.cart?.type && dynamicViewFormate) {
            //   fetchprintSetting(
            //     setPrintSetting,
            //     MobileToken,
            //     getID,
            //     Number(orderPrintById.cart.type),
            //     dynamicViewFormate
            //   ).then(() => {
            //     fetchOrderByForPrintIdApi(
            //       Number(id),
            //       setOrderPrintById,
            //       MobileToken,
            //       getID
            //     ).then(() => {
            //       setIsPrintSettingShow(false);
            //     });
            //   });
            // } else {
            setIsPrintSettingShow(false);
            // }
          }}
          // orderType={orderPrintById?.cart.type}
          // viewFormate={dynamicViewFormate}
          // orderById={printSetting?.setting_details}
          titles={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
        />
      )}
      <OtpConfirmationModal
        show={isEmailVerifyConfirmation}
        onHide={() => setIsEmailVerifyCloseConfirmation(false)}
        handleSubmit={() => handleRefresh()}
        title={`Verify Email`}
        message={`Are you sure you want  Verify  this ${companyToEdit?.company_email} Email?`}
        btn1="CANCEL"
        btn2="verify"
        profileId={companyToEdit?.id}
        position={4}
      />
      {/* {isModalImageTool && (
                <ImageCropperToolModel
                    show={isModalImageTool}
                    onHide={() => setIsModalImageTool(false)}
                    onSubmit={handleCroppedImage}
                    initialImage={image}
                    setCroppedImageUrl={setCroppedImageUrl}
                    width={521 * 2}
                    height={512 * 2}
                    title="Crop Your Logo"
                />
            )}
            {isModalImageToolForHeader && (
                <ImageCropperToolModel
                    show={isModalImageToolForHeader}
                    onHide={() => setIsModalImageToolForHeader(false)}
                    onSubmit={handleCroppedImageForHeader}
                    initialImage={headerimage}
                    width={600 * 2}
                    height={90 * 2}
                    title="Crop Your Header"
                />
            )}
            {isModalImageToolForOnlineStoreBanner && (
                <ImageCropperToolModel
                    show={isModalImageToolForOnlineStoreBanner}
                    onHide={() => setIsModalImageToolForOnlineStoreBanner(false)}
                    onSubmit={handleCroppedImageForOnlineStoreBanner}
                    initialImage={storeBannerOneimage}
                    width={1200 * 2}
                    height={400 * 2}
                    title="Crop Your Online Store banner"
                />
            )}
            {isModalImageToolForOnlineStoreBannertwo && (
                <ImageCropperToolModel
                    show={isModalImageToolForOnlineStoreBannertwo}
                    onHide={() => setIsModalImageToolForOnlineStoreBannertwo(false)}
                    onSubmit={handleCroppedImageForOnlineStoreBannertwo}
                    initialImage={storeBannertwoimage}
                    width={1200 * 2}
                    height={400 * 2}
                    title="Crop Your Online Store banner Two"
                />
            )}

            {isModalImageToolForFooter && (
                <ImageCropperToolModel
                    show={isModalImageToolForFooter}
                    onHide={() => setIsModalImageToolForFooter(false)}
                    onSubmit={handleCroppedImageForFooter}
                    initialImage={footerimage}
                    width={600 * 2}
                    height={90 * 2}
                    title="Crop Your Footer"
                />
            )}

            {isModalImageToolForSign && (
                <ImageCropperToolModel
                    show={isModalImageToolForSign}
                    onHide={() => setIsModalImageToolForSign(false)}
                    onSubmit={handleCroppedImageForSign}
                    initialImage={
                        signCroppedImageUrl ||
                        signPreview ||
                        companyToEdit?.company_sign ||
                        ""
                    }
                    width={521 * 2}
                    height={512 * 2}
                    title="Crop Your Company Sign"
                />
            )} */}

      {isOpenGoogleSheetsColumnConfigModel && (
        <GoogleSheetsColumnConfigModal
          show={isOpenGoogleSheetsColumnConfigModel}
          onHide={() => setIsGoogleSheetsColumnConfigModel(false)}
          RequiredDetail={googleSheetModalDetails ?? null}
        />
      )}
    </>
  );
};
export default NewThirdParty;
