import { ErrorMessage, Field, Form, Formik, FormikErrors } from "formik";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SingleValue } from "react-select";
import { toast, ToastContainer } from "react-toastify";
import chat_gpt_logo from "../../../assets/images/chat-gpt.jpg";
import company_logo from "../../../assets/images/company_logo.png";
import footer_logo from "../../../assets/images/footer.png";
import gemani_logo from "../../../assets/images/gemani.jpg";
import header_logo from "../../../assets/images/header.png";
import indiamart_logo from "../../../assets/images/indiamart-logo.jpg";
import justdial_logo from "../../../assets/images/justdial.jpg";
import serp_api_logo from "../../../assets/images/serp_api.jpg";
import tradindia_logo from "../../../assets/images/tradindia.jpg";
import whatsapp_logo from "../../../assets/images/whatsapp.jpg";
import www_logo from "../../../assets/images/www.jpg";
import { AppContext } from "../../../common/AppContext";
import {
  copyToClipboard,
  handleRefresh,
  openInNewTab,
  useEscapeKey,
} from "../../../common/SharedFunction";
import ContactInsertApiDoc from "../../../components/company/ContactInsertApiDoc";
import CustomSearchDropdown from "../../../components/CustomSearchDropdown";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import ImageCropperToolModel from "../../../components/model/ImageCroperToolModel";
import OtpConfirmationModal from "../../../components/model/OtpConfirmationModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  INDIA_MART_PUSH_API,
  JUST_DIAL_PUSH_API,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  SMALL_TEXT_LENGTH,
  TEXTAREA_TEXT_LENGTH,
  WA_WEBHOOK_API,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, PRINT_SETTING_TYPE_OBJ } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import useWhatsappPlatformStore from "../../../store/whatsapp/useWhatsappPlateformFlagStore";
import {
  fetchprintSetting,
  IprintSetting,
} from "../../order-pdf-view/OrderPdfController";
import { fetchGoogleSheetForFacebook } from "../LeftSideController";
import CompanyPrifixModal, { ModalField } from "./CompanyPrifixModal";
import {
  createCompany,
  createCompanyInitialValues,
  createCompanyValidationSchema,
  fetchCategoryB2BApi,
  fetchCityApiForCompany,
  fetchCountryApiForCompany,
  fetchCurrency,
  fetchStateApiForCompany,
  fetchSubCategoryB2BApi,
  handelSendOtpForEmailVerifyCompany,
  ICreateCompany,
  IGoogleSheetsProps,
  orderQtyList,
  updateCompany,
} from "./CreateCompanyController";
import GoogleSheetsColumnConfigModal from "./google-sheets-column-config/GoogleSheetsColumnConfigModal";

// interface FormValues {
//   quotation_view_formate: string;
// }

const CreateCompanyView = ({
  show,
  onHide,
  companyToEdit,
  setRefresh,
  headerName,
  mobileNumber,
  isShowApiKey,
}: any) => {
  const { setPlatformType, platformType } = useWhatsappPlatformStore();

  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  // const { values } = useFormikContext<FormValues>();
  const [isEmailVerifyConfirmation, setIsEmailVerifyCloseConfirmation] =
    useState(false);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const [logPreview, setLogPreview] = useState<string | null>(null);
  const [signPreview, setSignPreview] = useState<string | null>(null);
  const [catalogPreview, setCataLogPreview] = useState<string | null>(null);
  const [catalogview, setCataLogView] = useState<string | null>(null);

  const [countriesList, setCountriesList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);

  const [currency, setCurrency] = useState<ICurrency[]>([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);

  const [selectedStateId, setSelectedStateId] = useState<number>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number>();

  const [selectedCityId, setSelectedCityId] = useState<number>();
  const [isOpenThirdParty, setIsOpenThirdParty] = useState(false);
  const [isOpenMailSetup, setIsOpenMailSetup] = useState(false);
  const [isOpenPrefix, setIsOpenPrefix] = useState(false);
  const [isOpenImageSettings, setIsOpenImageSettings] = useState(false);
  const [isOpenModuleSettings, setIsOpenModuleSettings] = useState(false);
  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);
  const [printSetting, setPrintSetting] = useState<IprintSetting>();
  const [isModalImageTool, setIsModalImageTool] = useState<boolean>(false);
  const [isModalImageToolForHeader, setIsModalImageToolForHeader] =
    useState<boolean>(false);
  const [isModalImageToolForFooter, setIsModalImageToolForFooter] =
    useState<boolean>(false);

  const [headerCroppedImageUrl, setHeaderCroppedImageUrl] = useState<
    string | undefined
  >();
  const [footerCroppedImageUrl, setFooterCroppedImageUrl] = useState<
    string | undefined
  >();

  const [headerCroppedImage, setHeaderCroppedImage] = useState<Blob | null>(
    null,
  );
  const [footerCroppedImage, setFooterCroppedImage] = useState<Blob | null>(
    null,
  );

  const [
    isOpenGoogleSheetsColumnConfigModel,
    setIsGoogleSheetsColumnConfigModel,
  ] = useState(false);
  const [googleSheetModalDetails, setGoogleSheetModalDetails] =
    useState<IGoogleSheetsProps>();

  // online Store Banner States
  const [
    isModalImageToolForOnlineStoreBanner,
    setIsModalImageToolForOnlineStoreBanner,
  ] = useState<boolean>(false);
  const [onlineStoreBannerCroppedImage, setOnlineStoreBannerCroppedImage] =
    useState<Blob | null>(null);
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
    isModalImageToolForOnlineStoreBannertwo,
    setIsModalImageToolForOnlineStoreBannertwo,
  ] = useState<boolean>(false);
  const [
    onlineStoreBannertwoCroppedImage,
    setOnlineStoreBannertwoCroppedImage,
  ] = useState<Blob | null>(null);
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

  useEscapeKey(onHide);

  const handleViewImageTool = () => {
    if (true) {
      setIsModalImageTool(true);
      // alert("click");
      // alert(isModalImageTool)
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewImageToolForHeader = () => {
    if (true) {
      setIsModalImageToolForHeader(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleViewImageToolForOnlineStoreBanner = () => {
    if (true) {
      setIsModalImageToolForOnlineStoreBanner(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleViewImageToolForOnlineStoreBannertwo = () => {
    if (true) {
      setIsModalImageToolForOnlineStoreBannertwo(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewImageToolForFooter = () => {
    if (true) {
      setIsModalImageToolForFooter(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewImageToolForSign = () => {
    if (true) {
      setIsModalImageToolForSign(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openGoogleSheetsColumnConfigModal = (
    title: string,
    sheet_type: number | string,
  ) => {
    setIsGoogleSheetsColumnConfigModel(true);
    setGoogleSheetModalDetails({ title, sheet_type });
  };

  // const [viewFormate, setViewFormate] = useState()

  // setViewFormate(companyToEdit?.quotation_view_formate)
  const [selectedCurrency, setSelectedCurrency] =
    useState<SingleValue<IOption> | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const subCategoryRef = useRef<HTMLDivElement>(null);
  const companyNameRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const [defaultCurrency, setDefaultCurrency] =
    useState<SingleValue<IOption> | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);

  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | undefined>();

  const [inOrderImageView, setInOrderImageView] = useState(
    companyToEdit?.in_order_image_view || 1,
  );
  const [watermarkInPrint, setWatermarkInPrint] = useState(
    companyToEdit?.watermark_in_print || 1,
  );
  const [isContactValidation, setisContactValidation] = useState(
    companyToEdit?.is_contact_validation || 1,
  );
  const [isStrictCheckProductStock, setisStrictCheckProductStock] = useState(
    companyToEdit?.is_strict_check_product_stock || 1,
  );
  const [
    isStrictCheckWareHouseWiseProductStock,
    setisStrictCheckWareHouseWiseProductStock,
  ] = useState(
    companyToEdit?.is_strict_wharehouse_wise_product_stock_check || 1,
  );
  const [viewInquiryFormInContact, setViewInquiryFormInContact] = useState(
    companyToEdit?.view_inquiry_form_in_contact || 1,
  );
  const [sameProductMultipleInCart, setSameProductMultipleInCart] = useState(
    companyToEdit?.same_product_multiple_in_cart || 1,
  );
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [image, setImage] = useState(companyToEdit?.company_logo || "abcd");
  const [headerimage, setHeaderimage] = useState(
    companyToEdit?.header_image || "",
  );
  const [footerimage, setFooterimage] = useState(
    companyToEdit?.footer_image || "",
  );
  const setFieldValueRef =
    useRef<(field: string, value: any, shouldValidate?: boolean) => void>();
  const [isModalImageToolForSign, setIsModalImageToolForSign] =
    useState<boolean>(false);
  const [signCroppedImageUrl, setSignCroppedImageUrl] = useState<
    string | undefined
  >();
  const [signCroppedImage, setSignCroppedImage] = useState<Blob | null>(null);
  const [showModalQuotation, setShowModalQuotation] = useState(false);
  const [showModalProformaInvoice, setShowModalProformaInvoice] = useState(false);
  const [showModalOrder, setShowModalOrder] = useState(false);
  const [showModalSalesInvoice, setShowModalSalesInvoice] = useState(false);
  const [showModalReturnSalesInvoice, setShowModalReturnSalesInvoice] =
    useState(false);
  const [showModalPurchaseOrder, setShowModalPurchaseOrder] = useState(false);
  const [showModalPurchaseInvoice, setShowModalPurchaseInvoice] =
    useState(false);
  const [showModalReturnPurchaseInvoice, setShowModalReturnPurchaseInvoice] =
    useState(false);
  const [showModalInward, setShowModalInward] = useState(false);
  const [showModalWorkOrder, setShowModalWorkOrder] = useState(false);
  const [indiaMartApiResponse, setIndiaMartApiResponse] = useState<any>(null); // State for API response
  const [showModalDispatch, setShowModalDispatch] = useState(false);

  interface ICurrency {
    id: number;
    short_name: string;
    name: string;
  }

  interface IndiaMartFormValues {
    indiamart_fromdate: string;
    indiamart_todate: string;
  }

  // Format date to DD-MMM-YYYY
  // Format date helper (optional)

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
  // Validation schema for IndiaMart modal
  // const indiaMartValidationSchema = Yup.object({
  //   indiamart_fromdate: Yup.string().required("From Date is required"),
  //   indiamart_todate: Yup.string()
  //     .required("To Date is required")
  //     .test("is-after-from-date", "To Date must be after From Date", function (value) {
  //       const fromDate = this.parent.indiamart_fromdate;
  //       if (!fromDate || !value) return true;
  //       return new Date(value) >= new Date(fromDate);
  //     }),
  // });

  const fields: ModalField[] = [
    {
      name: "quotation_terms_conditions",
      label: "Quotation Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "quotation_remark",
      label: "Quotation Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "quotation_note",
      label: "Quotation Note",
      type: "text",
      col: 6,
    },
    {
      name: "quotation_packing_charge_title",
      label: "Quotation Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "quotation_transport_charge_title",
      label: "Quotation Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "quotation_tcs_title",
      label: "Quotation TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "quotation_tsc_percentage",
      label: "Quotation TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "proforma_invoice_terms_conditions",
      label: "Proforma Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "proforma_invoice_remark",
      label: "Proforma Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "proforma_invoice_note",
      label: "Proforma Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "proforma_invoice_packing_charge_title",
      label: "Proforma Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "proforma_invoice_transport_charge_title",
      label: "Proforma Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "proforma_invoice_tcs_title",
      label: "Proforma Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "proforma_invoice_tsc_percentage",
      label: "Proforma Invoice TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "order_terms_conditions",
      label: "Sales Order Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "order_remark",
      label: "Sales Order Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "order_note",
      label: "Sales Order Note",
      type: "text",
      col: 6,
    },
    {
      name: "order_packing_charge_title",
      label: "Sales Order Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "order_transport_charge_title",
      label: "Sales Order Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "order_tcs_title",
      label: "Sales Order TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "order_tsc_percentage",
      label: "Sales Order TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "sales_invoice_terms_conditions",
      label: "Sales Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "sales_invoice_remark",
      label: "Sales Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "sales_invoice_note",
      label: "Sales Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "sales_invoice_packing_charge_title",
      label: "Sales Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "sales_invoice_transport_charge_title",
      label: "Sales Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "sales_invoice_tcs_title",
      label: "Sales Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "sales_invoice_tsc_percentage",
      label: "Sales Invoice TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "return_sales_invoice_terms_conditions",
      label: "Return Sales Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_sales_invoice_remark",
      label: "Return Sales Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_sales_invoice_note",
      label: "Return Sales Note",
      type: "text",
      col: 6,
    },
    {
      name: "return_sales_invoice_packing_charge_title",
      label: "Return Sales Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_sales_invoice_transport_charge_title",
      label: "Return Sales Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_sales_invoice_tcs_title",
      label: "Return Sales TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "return_sales_invoice_tsc_percentage",
      label: "Return Sales TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "purchase_order_terms_conditions",
      label: "Purchase Order Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_order_remark",
      label: "Purchase Order Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_order_note",
      label: "Purchase Order Note",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_order_packing_charge_title",
      label: "Purchase Order Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_order_transport_charge_title",
      label: "Purchase Order Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_order_tcs_title",
      label: "Purchase Order TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "purchase_order_tsc_percentage",
      label: "Purchase Order TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "purchase_invoice_terms_conditions",
      label: "Purchase Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_invoice_remark",
      label: "Purchase Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_invoice_note",
      label: "Purchase Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_invoice_packing_charge_title",
      label: "Purchase Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_invoice_transport_charge_title",
      label: "Purchase Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_invoice_tcs_title",
      label: "Purchase Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "purchase_invoice_tsc_percentage",
      label: "Purchase Invoice TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "return_purchase_invoice_terms_conditions",
      label: "Return Purchase Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_purchase_invoice_remark",
      label: "Return Purchase Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_purchase_invoice_note",
      label: "Return Purchase Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "return_purchase_invoice_packing_charge_title",
      label: "Return Purchase Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_purchase_invoice_transport_charge_title",
      label: "Return Purchase Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_purchase_invoice_tcs_title",
      label: "Return Purchase Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "return_purchase_invoice_tsc_percentage",
      label: "Return Purchase Invoice TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "work_order_terms_conditions",
      label: "Work Order Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "work_order_remark",
      label: "Work Order Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "work_order_note",
      label: "Work Order Note",
      type: "text",
      col: 6,
    },
    {
      name: "work_order_packing_charge_title",
      label: "Work Order Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "work_order_transport_charge_title",
      label: "Work Order Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "work_order_tcs_title",
      label: "Work Order TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "work_order_tsc_percentage",
      label: "Work Order TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "inward_terms_conditions",
      label: "Inward Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "inward_remark",
      label: "Inward Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "inward_note",
      label: "Inward Note",
      type: "text",
      col: 6,
    },
    {
      name: "inward_packing_charge_title",
      label: "Inward Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "inward_transport_charge_title",
      label: "Inward Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "inward_tcs_title",
      label: "Inward TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "inward_tsc_percentage",
      label: "Inward TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "dispatch_terms_conditions",
      label: "Dispatch Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "dispatch_remark",
      label: "Dispatch Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "dispatch_note",
      label: "Dispatch Note",
      type: "text",
      col: 6,
    },
    {
      name: "dispatch_packing_charge_title",
      label: "Dispatch Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "dispatch_transport_charge_title",
      label: "Dispatch Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "dispatch_tcs_title",
      label: "Dispatch TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "dispatch_tsc_percentage",
      label: "Dispatch TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "quotation_effect_last_data_on_new",
      label: "Quotation Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "proforma_invoice_effect_last_data_on_new",
      label: "Proforma Invoice Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "sales_invoice_effect_last_data_on_new",
      label: "Sales Invoice Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "order_effect_last_data_on_new",
      label: "Sales Order Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "return_sales_invoice_effect_last_data_on_new",
      label: "Return Sales Invoice Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "purchase_invoice_effect_last_data_on_new",
      label: "Purchase Invoice Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "return_purchase_invoice_effect_last_data_on_new",
      label: "Return Purchase Invoice Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "purchase_order_effect_last_data_on_new",
      label: "Purchase Order Auto Data Populated from last Entry",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Yes", value: 1 },
        { label: "No", value: 2 },
      ],
    },
    {
      name: "quotation_sr_number_generate_flag",
      label: "Quotation Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "proforma_invoice_sr_number_generate_flag",
      label: "Proforma Invoice Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "order_sr_number_generate_flag",
      label: "Sales Order Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "sales_invoice_sr_number_generate_flag",
      label: "Sales Invoice Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "return_sales_invoice_sr_number_generate_flag",
      label: "Return Sales Invoice Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "purchase_order_sr_number_generate_flag",
      label: "Purchase Order Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "purchase_invoice_sr_number_generate_flag",
      label: "Purchase Invoice Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "return_purchase_invoice_sr_number_generate_flag",
      label: "Return Purchase Invoice Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "inward_sr_number_generate_flag",
      label: "Inward Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "dispatch_sr_number_generate_flag",
      label: "Dispatch Number Generation",
      type: "dropdown",
      col: 3,
      as: "select",
      options: [
        { label: "Auto", value: 0 },
        { label: "Manually", value: 1 },
      ],
    },
    {
      name: "quotation_series_pattern",
      label: "Quotation Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "proforma_invoice_series_pattern",
      label: "Proforma Invoice Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "sales_invoice_series_pattern",
      label: "Sales Invoice Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "order_series_pattern",
      label: "Sales Order Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "return_sales_invoice_series_pattern",
      label: "Return Sales Invoice Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "purchase_invoice_series_pattern",
      label: "Purchase Invoice Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "return_purchase_invoice_series_pattern",
      label: "Return Purchase Invoice Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "purchase_order_series_pattern",
      label: "Purchase Order Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "inward_series_pattern",
      label: "Inward Sr. Number Pattern",
      type: "text",
      col: 8,
    },
    {
      name: "dispatch_series_pattern",
      label: "Dispatch Sr. Number Pattern",
      type: "text",
      col: 8,
    },
  ];

  // Filter fields for each modal type
  const quotationFields = fields.filter((field) =>
    field.name.startsWith("quotation_"),
  );
  const proformaInvoiceFields = fields.filter((field) =>
    field.name.startsWith("proforma_invoice_"),
  );
  const orderFields = fields.filter((field) => field.name.startsWith("order_"));
  const salesInvoiceFields = fields.filter((field) =>
    field.name.startsWith("sales_invoice_"),
  );
  const returnSalesInvoiceFields = fields.filter((field) =>
    field.name.startsWith("return_sales_invoice_"),
  );
  const purchaseOrderFields = fields.filter((field) =>
    field.name.startsWith("purchase_order_"),
  );
  const purchaseInvoiceFields = fields.filter((field) =>
    field.name.startsWith("purchase_invoice_"),
  );
  const returnPurchaseInvoiceFields = fields.filter((field) =>
    field.name.startsWith("return_purchase_invoice_"),
  );
  const workOrderFields = fields.filter((field) =>
    field.name.startsWith("work_order_"),
  );

  const inwardFields = fields.filter((field) =>
    field.name.startsWith("inward_"),
  );
  const dispatchFields = fields.filter((field) =>
    field.name.startsWith("dispatch_"),
  );

  // Initial values for each modal type
  const modals = [
    {
      show: showModalQuotation,
      setShow: setShowModalQuotation,
      title: "Quotation Details",
      fields: quotationFields,
    },

    {
      show: showModalProformaInvoice,
      setShow: setShowModalProformaInvoice,
      title: "Proforma Invoice Details",
      fields: proformaInvoiceFields,
    },
    {
      show: showModalOrder,
      setShow: setShowModalOrder,
      title: "Order Details",
      fields: orderFields,
    },
    {
      show: showModalSalesInvoice,
      setShow: setShowModalSalesInvoice,
      title: "Sales Invoice Details",
      fields: salesInvoiceFields,
    },
    {
      show: showModalReturnSalesInvoice,
      setShow: setShowModalReturnSalesInvoice,
      title: "Return Sales Invoice Details",
      fields: returnSalesInvoiceFields,
    },
    {
      show: showModalPurchaseOrder,
      setShow: setShowModalPurchaseOrder,
      title: "Purchase Order Details",
      fields: purchaseOrderFields,
    },
    {
      show: showModalPurchaseInvoice,
      setShow: setShowModalPurchaseInvoice,
      title: "Purchase Invoice Details",
      fields: purchaseInvoiceFields,
    },
    {
      show: showModalReturnPurchaseInvoice,
      setShow: setShowModalReturnPurchaseInvoice,
      title: "Return Purchase Invoice Details",
      fields: returnPurchaseInvoiceFields,
    },
    {
      show: showModalWorkOrder,
      setShow: setShowModalWorkOrder,
      title: "Work Order Details",
      fields: workOrderFields,
    },
    {
      show: showModalInward,
      setShow: setShowModalInward,
      title: "Inward Details",
      fields: inwardFields,
    },
    {
      show: showModalDispatch,
      setShow: setShowModalDispatch,
      title: "Dispatch Details",
      fields: dispatchFields,
    },
  ];

  useEffect(() => {
    return () => {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    };
  }, [croppedImageUrl]);

  const handleCroppedImage = async (blob: Blob | null, url: string | null) => {
    if (blob && url) {
      setCroppedImage(blob);
      setCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-logo.jpg", {
        type: "image/jpeg",
      });
      setFieldValueRef.current?.("company_logo", croppedFile);
    } else {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
      setFieldValueRef.current?.("company_logo", ""); // Clear Formik field
      await handleDeleteImage("company_logo");
      // Optionally clear Formik field if needed
    }
  };
  const handleCroppedImageForHeader = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setHeaderCroppedImage(blob);
      setHeaderCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-header.jpg", {
        type: "image/jpeg",
      });
      setFieldValueRef.current?.("headerImg", croppedFile);
    } else {
      if (headerCroppedImageUrl) {
        URL.revokeObjectURL(headerCroppedImageUrl);
      }
      setHeaderCroppedImage(null);
      setHeaderCroppedImageUrl("");
      setFieldValueRef.current?.("headerImg", "");
      await handleDeleteImage("header_img");
    }
  };

  const handleCroppedImageForFooter = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setFooterCroppedImage(blob);
      setFooterCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-footer.jpg", {
        type: "image/jpeg",
      });
      setFieldValueRef.current?.("footerImg", croppedFile);
    } else {
      if (footerCroppedImageUrl) {
        URL.revokeObjectURL(footerCroppedImageUrl);
      }
      setFooterCroppedImage(null);
      setFooterCroppedImageUrl("");
      setFieldValueRef.current?.("footerImg", "");
      await handleDeleteImage("footer_img");
    }
  };
  const handleCroppedImageForOnlineStoreBanner = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setOnlineStoreBannerCroppedImage(blob);
      setOnlineStoreBannerCroppedImageUrl(url);
      const croppedFile = new File(
        [blob],
        "cropped-online-store-banner-one.jpg",
        { type: "image/jpeg" },
      );
      setFieldValueRef.current?.("bannerimgone", croppedFile);
    } else {
      if (onlineStoreBannerCroppedImageUrl) {
        URL.revokeObjectURL(onlineStoreBannerCroppedImageUrl);
      }
      setOnlineStoreBannerCroppedImage(null);
      setOnlineStoreBannerCroppedImageUrl("");
      setFieldValueRef.current?.("bannerimgone", "");
      await handleDeleteImage("banner_img_one");
    }
  };
  const handleCroppedImageForOnlineStoreBannertwo = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setOnlineStoreBannertwoCroppedImage(blob);
      setOnlineStoreBannertwoCroppedImageUrl(url);
      const croppedFile = new File(
        [blob],
        "cropped-online-store-banner-one.jpg",
        { type: "image/jpeg" },
      );
      setFieldValueRef.current?.("bannerimgtwo", croppedFile);
    } else {
      if (onlineStoreBannertwoCroppedImageUrl) {
        URL.revokeObjectURL(onlineStoreBannertwoCroppedImageUrl);
      }
      setOnlineStoreBannertwoCroppedImage(null);
      setOnlineStoreBannertwoCroppedImageUrl("");
      setFieldValueRef.current?.("bannerimgtwo", "");
      await handleDeleteImage("banner_img_two");
    }
  };

  const handleCroppedImageForSign = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setSignCroppedImage(blob);
      setSignCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-sign.jpg", {
        type: "image/jpeg",
      });
      setFieldValueRef.current?.("company_sign", croppedFile);
    } else {
      if (signCroppedImageUrl) {
        URL.revokeObjectURL(signCroppedImageUrl);
      }
      setSignCroppedImage(null);
      setSignCroppedImageUrl("");
      setFieldValueRef.current?.("company_sign", "");
      await handleDeleteImage("company_sign");
    }
  };

  const validateImageDimensions = (
    file: File,
    width: number,
    height: number,
    callback: (isValid: boolean) => void,
  ) => {
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      console.warn("Invalid file type for image validation:", file.type);
      toast.error("Please upload a valid image file (PNG, JPG, or JPEG).");
      callback(false);
      return;
    }

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        try {
          if (img.width === width && img.height === height) {
            callback(true);
          } else {
            callback(false);
          }
        } catch (error) {
          console.error("Error processing image dimensions:", error);
          callback(false);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };

      img.onerror = () => {
        console.error(
          "Failed to load image for dimension validation:",
          file.name,
        );
        toast.error("Could not load the image. Please try another file.");
        callback(false);
        URL.revokeObjectURL(img.src);
      };
    } catch (error) {
      console.error("Error in validateImageDimensions:", error);
      toast.error("An error occurred while validating the image.");
      callback(false);
    }
  };
  const countryOptions = countriesList.map((category: any) => ({
    value: category.id,
    label: category.country_name,
  }));
  const defaultCountry = countryOptions.find((c) => c.value === 101);
  const handleCountriesChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption) {
      setFieldValue("country_id", selectedOption.value);
      setSelectedStateId(selectedOption.value as number);
    } else {
      setFieldValue("country_id", "");
      setSelectedStateId(undefined);
    }
  };
  const handleCategoryChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption) {
      setFieldValue("category_id_b2b", selectedOption.value);
      setSelectedCategoryId(selectedOption.value as number);
    } else {
      setSelectedCategoryId(undefined);
    }
  };
  const handleSateChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption) {
      setFieldValue("state_id", selectedOption.value);
      setSelectedCityId(selectedOption.value as number);
    } else {
      setFieldValue("state_id", "");
      setSelectedCityId(undefined);
    }
  };
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
  const handleCurrencyChange = (
    selectedOption: SingleValue<IOption> | null,
  ) => {
    setSelectedCurrency(selectedOption);
  };

  const fieldRefs: Record<string, React.RefObject<HTMLElement>> = {
    company_name: companyNameRef,
    company_email: emailRef,
    category_id_b2b: categoryRef,
    sub_category_id_b2b: subCategoryRef,
    // Add more as needed
  };

  useEffect(() => {
    if (croppedImageUrl) {
      setImage(croppedImageUrl);
    } else if (logPreview) {
      setImage(logPreview);
    } else if (companyToEdit?.company_logo) {
      setImage(companyToEdit.company_logo);
    } else {
      setImage("");
    }
  }, [croppedImageUrl, logPreview, companyToEdit?.company_logo]);

  // For Header
  useEffect(() => {
    if (headerCroppedImageUrl) {
      setHeaderimage(headerCroppedImageUrl);
    } else if (headerPreview) {
      setHeaderimage(headerPreview);
    } else if (companyToEdit?.header_image) {
      setHeaderimage(companyToEdit.header_image);
    } else {
      setHeaderimage("");
    }
  }, [headerCroppedImageUrl, headerPreview, companyToEdit?.header_image]);

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

  // For Footer
  useEffect(() => {
    if (footerCroppedImageUrl) {
      setFooterimage(footerCroppedImageUrl);
    } else if (footerPreview) {
      setFooterimage(footerPreview);
    } else if (companyToEdit?.footer_image) {
      setFooterimage(companyToEdit.footer_image);
    } else {
      setFooterimage("");
    }
  }, [footerCroppedImageUrl, footerPreview, companyToEdit?.footer_image]);

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
      updateCompany(
        values,
        setRefresh,
        companyToEdit,
        onHide,
        values.headerImg,
        values.footerImg,
        values.company_logo,
        values.company_sign,
        values.company_catalog,
        values.bannerimgone,
        values.bannerimgtwo,
      );
      setImage(values.company_logo);
      handelClose();
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

  const handelClose = () => {
    setHeaderPreview("");
    onHide();
    setFooterPreview("");
    setLogPreview("");
    setSignPreview("");
    setCataLogPreview("");
    setCataLogView("");
    setImage("");
    setStoreBannerOnePreview("");
    setStoreBannertwoOnePreview("");
  };

  useEffect(() => {
    fetchCategoryB2BApi(setCategoryList);
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
    if (selectedStateId) {
      const fetchState = async () => {
        try {
          await fetchStateApiForCompany(setStateList, selectedStateId);
          if (companyToEdit) {
            setSelectedCityId(companyToEdit?.state_id);
          }
        } catch (error) {
          console.error("Error fetching city options:", error);
        }
      };
      fetchState();
    }
  }, [companyToEdit, selectedStateId]);

  useEffect(() => {
    if (selectedCategoryId) {
      const fetchSubCategory = async () => {
        try {
          await fetchSubCategoryB2BApi(setSubCategoryList, selectedCategoryId);
        } catch (error) {
          console.error("Error fetching city options:", error);
        }
      };
      fetchSubCategory();
    }
  }, [companyToEdit, selectedCategoryId]);
  useEffect(() => {
    if (selectedCityId) {
      const fetchCities = async () => {
        try {
          await fetchCityApiForCompany(setCityList, selectedCityId);
        } catch (error) {
          console.error("Error fetching city options:", error);
        }
      };
      fetchCities();
    }
  }, [selectedCityId]);
  const handleDeleteImage = async (columnName: string) => {
    try {
      setIsDeletingImage(true);
      const requestData = {
        table: "company_masters",
        where: `{"id":"${companyToEdit?.id}"}`,
        data: `{"${columnName}":""}`,
      };
      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData,
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          if (columnName === "company_logo") {
            setFieldValueRef.current?.("company_logo", "");
          } else if (columnName === "company_sign") {
            setFieldValueRef.current?.("company_sign", "");
          } else if (columnName === "company_catalog") {
            setFieldValueRef.current?.("company_catalog", "");
          } else if (columnName === "header_img") {
            setFieldValueRef.current?.("headerImg", "");
          } else if (columnName === "footer_img") {
            setFieldValueRef.current?.("footerImg", "");
          } else if (columnName === "banner_img_one") {
            setFieldValueRef.current?.("bannerimgone", "");
          } else if (columnName === "banner_img_two") {
            setFieldValueRef.current?.("bannerimgtwo", "");
          }
          setCroppedImage(null);
          setCroppedImageUrl(undefined);
          setLogPreview("");
          setImage("");
          if (croppedImageUrl) {
            URL.revokeObjectURL(croppedImageUrl);
          }
          handleRefresh();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      setIsDeletingImage(false);
    }
  };

  const stateOptions = stateList.map((category: any) => ({
    value: category.id,
    label: category.state_name,
  }));
  const cityOptions = cityList.map((category: any) => ({
    value: category.id,
    label: category.city_name,
  }));

  const categoryOptions =
    categoryList &&
    categoryList.map((category: any) => ({
      value: category.id,
      label: category.category_name_b2b,
    }));

  const subCategoryOptions =
    subCategoryList &&
    subCategoryList.map((category: any) => ({
      value: category.id,
      label: category.sub_category_name_b2b,
    }));

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    setFieldValue: {
      (
        field: string,
        value: any,
        shouldValidate?: boolean,
      ): Promise<void | FormikErrors<ICreateCompany>>;
      (arg0: any, arg1: any): void;
    },
    setPreview: {
      (value: React.SetStateAction<string | null>): void;
      (arg0: string): void;
    },
  ) => {
    const file = event.currentTarget.files?.[0];
    const inputRef = event.currentTarget; // Store reference to the input element
    if (file) {
      if (fieldName === "headerImg" || fieldName === "footerImg") {
        validateImageDimensions(file, 600, 90, (isValid) => {
          if (isValid) {
            setFieldValue(fieldName, file);
            setPreview(URL.createObjectURL(file));
          } else {
            toast.error("Please Select File with 600px X 90px dimension");
            inputRef.value = ""; // Reset the input using the stored reference
          }
        });
      } else {
        setFieldValue(fieldName, file);
        setPreview(URL.createObjectURL(file));
        if (fieldName === "company_catalog") {
          setCataLogView(file.name);
        }
      }
    }
  };

  // const currencyOptions = [
  //   // { label: "USD - US Dollar", value: 1 }, // USD → ID 1
  //   // { label: "EUR - Euro", value: 2 },
  //   { label: "INR - Indian Rupee", value: 3, disabled: true },
  //   // { label: "JPY - Japanese Yen", value: 4 },
  //   // { label: "GBP - British Pound", value: 5 },
  //   // { label: "AUD - Australian Dollar", value: 6 },
  //   // { label: "CAD - Canadian Dollar", value: 7 },
  //   // { label: "CHF - Swiss Franc", value: 8 },
  //   // { label: "CNY - Chinese Yuan", value: 9 },
  //   // { label: "ZAR - South African Rand", value: 10 }
  // ];

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

  const currencyOptions =
    currency.map((curr: any) => ({
      label: `${curr.short_name} - ${curr.name}`,
      value: curr.id,
      // disabled: curr.short_name === "INR", // Disable INR as per your requirement
    })) || [];

  const dropDownOptions = [
    { label: "V1-A4 (With GST)", value: 1 },
    { label: "V2-A4 (Without GST)", value: 2 },
    { label: "V3-A5 (With GST)", value: 3 },
    { label: "V4-A5 (Without GST)", value: 4 },
    { label: "V5-POS", value: 5 },
  ];

  const openPrintSetting = () => {
    // const selectedValue = formValues.quotation_view_formate;
    if (true) {
      fetchprintSetting(setPrintSetting, Number(PRINT_SETTING_TYPE_OBJ[String(1) as keyof typeof PRINT_SETTING_TYPE_OBJ]), Number(1)).then(() => {
        setIsPrintSettingShow(true);
      });
    } else {
      setIsPrintSettingShow(true);
    }
  };

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

  const orderQtyOptions = useMemo(
    () =>
      orderQtyList.map((item_order_qty_unit) => ({
        value: Number(item_order_qty_unit.id),
        label: item_order_qty_unit.qty_unit,
      })),
    [orderQtyList],
  );
  return (
    <React.Fragment>
      <ToastContainer />
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ width: "80%" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">{headerName}</h2>
              </div>
              <div className="col-4">
                <span
                  className="close ms-3 pb-3"
                  onClick={handelClose}
                  style={{ cursor: "pointer" }}
                >
                  &times;
                </span>
                <p
                  className="landing-page-text text-end"
                  style={{ cursor: "pointer", color: "blue", fontSize: "13px" }}
                  onClick={() => openInNewTab("/videoTutorial", 16)}
                >
                  Learn More :
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#0000FF"
                  >
                    <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                  </svg>
                </p>
              </div>
            </div>
            <Formik
              enableReinitialize
              initialValues={createCompanyInitialValues(
                companyToEdit,
                mobileNumber,
                defaultCountry,
                {
                  in_order_image_view: inOrderImageView,
                  watermark_in_print: watermarkInPrint,
                  view_inquiry_form_in_contact: viewInquiryFormInContact,
                  same_product_multiple_in_cart: sameProductMultipleInCart,
                  is_contact_validation: isContactValidation,
                  is_strict_check_product_stock: isStrictCheckProductStock,
                  is_strict_wharehouse_wise_product_stock_check:
                    isStrictCheckWareHouseWiseProductStock,
                  // quotation_view_formate: viewFormate,
                },

                // { watermark_in_print: watermarkInPrint }
              )}
              validationSchema={createCompanyValidationSchema()}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, setFieldValue, values }) => {
                setFieldValueRef.current = setFieldValue;
                return (
                  <Form>
                    <div className="mt-3 d-flex justify-content-center">
                      <div className="mb-3 py-4  ">
                        <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
                          <div className="col-12 col-md-4 ">
                            <div className="form-group">
                              <label
                                htmlFor="company_name"
                                className="pb-2 form_label"
                              >
                                Company Name
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="company_name"
                                placeHolder="Enter Your Company name"
                                maxLength={BIG_TEXT_LENGTH}
                                innerRef={companyNameRef}
                                className={`form-control font-size-15 rounded-1   ${errors.company_name &&
                                  touched.company_name &&
                                  "is-invalid input-box-error"
                                  }`}
                              />
                              <ErrorMessage
                                name="company_name"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="category_id_b2b"
                                className="mb-1 form_label"
                              >
                                Business Category
                                <span className="text-danger">*</span>
                              </label>
                              <FormikCustomSearchDropdown
                                name="category_id_b2b"
                                options={categoryOptions}
                                className={`  ${errors.category_id_b2b &&
                                  touched.category_id_b2b &&
                                  "is-invalid input-box-error"
                                  }`}
                                onChange={handleCategoryChange}
                              />
                              <ErrorMessage
                                name="category_id_b2b"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="sub_category_id_b2b"
                                className="mb-1 form_label"
                              >
                                Business Sub Category
                                <span className="text-danger">*</span>
                              </label>
                              <FormikCustomSearchDropdown
                                name="sub_category_id_b2b"
                                options={subCategoryOptions}
                                className={`  ${errors.sub_category_id_b2b &&
                                  touched.sub_category_id_b2b &&
                                  "is-invalid input-box-error"
                                  }`}
                              />
                              <ErrorMessage
                                name="sub_category_id_b2b"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="company_email"
                                className="pb-2 form_label"
                              >
                                Email<span className="text-danger">*</span>
                              </label>

                              <div className="input-group">
                                <Field
                                  type="email"
                                  name="company_email"
                                  placeHolder="Enter Email Address"
                                  maxLength={BIG_TEXT_LENGTH}
                                  readOnly={
                                    companyToEdit?.is_email_verified === 1
                                  }
                                  className={`form-control font-size-15 rounded-1 ${companyToEdit?.is_email_verified === 1
                                    ? "form-control-plaintext bg-light"
                                    : ""
                                    } ${errors.company_email &&
                                    touched.company_email &&
                                    "is-invalid input-box-error"
                                    }`}
                                />
                                {isShowApiKey === 1 && (
                                  <span
                                    className={`input-group-text ${companyToEdit?.is_email_verified === 1
                                      ? "bg-success text-white"
                                      : "bg-danger text-white"
                                      }`}
                                    style={{ height: "45px" }}
                                  >
                                    <i
                                      className={`bi ${companyToEdit?.is_email_verified === 1
                                        ? "bi-check-circle"
                                        : "bi-x-circle"
                                        }`}
                                    ></i>
                                  </span>
                                )}
                              </div>

                              {isShowApiKey === 1 && (
                                <div className="">
                                  {companyToEdit?.is_email_verified === 1 ? (
                                    <p style={{ color: `green` }}>
                                      Your email verified successfully
                                    </p>
                                  ) : (
                                    <p
                                      onClick={() =>
                                        handelSendOtpForEmailVerifyCompany(
                                          setIsEmailVerifyCloseConfirmation,
                                          companyToEdit?.id,
                                        )
                                      }
                                      style={{ color: `black` }}
                                    >
                                      <i>
                                        Please{" "}
                                        <b
                                          style={{
                                            color: "blue",
                                            textDecoration: "underline",
                                            fontWeight: "normal",
                                            cursor: "pointer",
                                          }}
                                        >
                                          Click Here
                                        </b>
                                        ,To Verify Your Email
                                      </i>
                                    </p>
                                  )}
                                </div>
                              )}
                              <ErrorMessage
                                name="company_email"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          {isShowApiKey === 1 && (
                            <div className="col-12 col-md-4">
                              <div className="form-group">
                                <label
                                  // style={{ display: "none" }}
                                  htmlFor="company_contact"
                                  className="pb-2 form_label"
                                >
                                  Mobile Number
                                </label>
                                <Field
                                  type="text"
                                  name="company_contact"
                                  className={`form-control font-size-15 rounded-1   ${errors.company_contact &&
                                    touched.company_contact &&
                                    "is-invalid input-box-error"
                                    }`}
                                  disabled={true}
                                // hidden={true}
                                />
                                <ErrorMessage
                                  name="company_contact"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}

                          {isShowApiKey === 1 && (
                            <div className="col-12 col-md-4">
                              <div className="form-group">
                                <label
                                  // style={{ display: "none" }}
                                  htmlFor="printed_number"
                                  className="pb-2 form_label"
                                >
                                  Printed Number
                                </label>
                                <Field
                                  type="text"
                                  name="printed_number"
                                  className={`form-control font-size-15 rounded-1   ${errors.printed_number &&
                                    touched.printed_number &&
                                    "is-invalid input-box-error"
                                    }`}
                                // disabled={true}
                                // hidden={true}
                                />
                                <ErrorMessage
                                  name="printed_number"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}

                          {isShowApiKey === 5 ? (
                            <>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="activation_code"
                                    className="pb-2 form_label"
                                  >
                                    Activation Code
                                  </label>
                                  <Field
                                    type="text"
                                    name="activation_code"
                                    placeholder="Enter Activation Code"
                                    className={`form-control font-size-15 rounded-1 ${errors.activation_code &&
                                      touched.activation_code &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="activation_code"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="referral_code"
                                    className="pb-2 form_label"
                                  >
                                    Referral Code
                                  </label>
                                  <Field
                                    type="text"
                                    name="referral_code"
                                    placeholder="Enter Referral Code"
                                    className={`form-control font-size-15 rounded-1 ${errors.referral_code &&
                                      touched.referral_code &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="referral_code"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="gst_number "
                                    className="pb-2 form_label"
                                  >
                                    GST Number
                                  </label>
                                  <Field
                                    type="text"
                                    name="gst_number"
                                    maxLength={SMALL_TEXT_LENGTH}
                                    className={`form-control font-size-15 rounded-1   ${errors.gst_number &&
                                      touched.gst_number &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="gst_number"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-4"></div>
                              <div className="col-4"></div>
                            </>
                          ) : (
                            ""
                          )}

                          {isShowApiKey === 1 ? (
                            <>
                              <div className="col-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="country"
                                    className="mb-1 form_label"
                                  >
                                    Country
                                    <span className="text-danger">*</span>
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="country_id"
                                    options={countryOptions}
                                    className={`${errors.country_id &&
                                      touched.country_id &&
                                      "is-invalid input-box-error"
                                      }`}
                                    onChange={handleCountriesChange}
                                  />
                                  <ErrorMessage
                                    name="country_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="state_id"
                                    className="mb-1 form_label"
                                  >
                                    State<span className="text-danger">*</span>
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="state_id"
                                    options={stateOptions}
                                    className={`  ${errors.state_id &&
                                      touched.state_id &&
                                      "is-invalid input-box-error"
                                      }`}
                                    onChange={handleSateChange}
                                  />
                                  <ErrorMessage
                                    name="state_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4 ">
                                <div className="form-group">
                                  <label
                                    htmlFor="city"
                                    className="mb-1 form_label"
                                  >
                                    City
                                  </label>
                                  <FormikCustomSearchDropdown
                                    name="city_id"
                                    options={cityOptions}
                                    className={`  ${errors.city_id &&
                                      touched.city_id &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="city_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4 ">
                                <div className="form-group">
                                  <label
                                    htmlFor="name "
                                    className="pb-2 form_label"
                                  >
                                    Address
                                  </label>
                                  <Field
                                    as="textarea"
                                    name="address"
                                    maxLength={TEXTAREA_TEXT_LENGTH}
                                    className={`form-control font-size-15 rounded-1   ${errors.address &&
                                      touched.address &&
                                      "is-invalid input-box-error"
                                      }`}
                                    onInput={(
                                      e: React.FormEvent<HTMLTextAreaElement>,
                                    ) => {
                                      const target =
                                        e.target as HTMLTextAreaElement;
                                      target.style.height = "auto";
                                      target.style.height =
                                        target.scrollHeight + "px";
                                    }}
                                  />
                                  <ErrorMessage
                                    name="address"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="terms_and_condition "
                                    className="pb-2 form_label"
                                  >
                                    Terms & Conditions
                                  </label>
                                  <Field
                                    as="textarea"
                                    name="terms_and_condition"
                                    maxLength={TEXTAREA_TEXT_LENGTH}
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      resize: "none",
                                      overflow: "hidden",
                                    }}
                                    className={`form-control font-size-15 rounded-1 ${errors.terms_and_condition &&
                                      touched.terms_and_condition &&
                                      "is-invalid input-box-error"
                                      }`}
                                    onInput={(
                                      e: React.FormEvent<HTMLTextAreaElement>,
                                    ) => {
                                      const target =
                                        e.target as HTMLTextAreaElement;
                                      target.style.height = "auto";
                                      target.style.height =
                                        target.scrollHeight + "px";
                                    }}
                                    onKeyDown={(e: {
                                      key: string;
                                      target: { value: string };
                                    }) => {
                                      if (e.key === "Enter") {
                                        e.target.value = e.target.value + "\n";
                                      }
                                    }}
                                  />
                                  <ErrorMessage
                                    name="terms_and_condition"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="currency_id"
                                    className="mb-1 form_label"
                                  >
                                    Currency
                                  </label>
                                  <CustomSearchDropdown
                                    options={currencyOptions}
                                    defaultValue={defaultCurrency}
                                    value={selectedCurrency}
                                    onChange={(
                                      selectedOption: SingleValue<IOption> | null,
                                    ) => {
                                      handleCurrencyChange(selectedOption);
                                      setFieldValue(
                                        "currency_id",
                                        selectedOption
                                          ? selectedOption.value
                                          : "",
                                      );
                                    }}
                                    className={`${errors.currency_id &&
                                      touched.currency_id &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="currency_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="gst_number "
                                    className="pb-2 form_label"
                                  >
                                    GST Number
                                  </label>
                                  <Field
                                    type="text"
                                    name="gst_number"
                                    maxLength={SMALL_TEXT_LENGTH}
                                    className={`form-control font-size-15 rounded-1   ${errors.gst_number &&
                                      touched.gst_number &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="gst_number"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-12 col-md-8"></div>

                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="bank_detail "
                                    className="pb-2 form_label"
                                  >
                                    Bank Details
                                  </label>
                                  <Field
                                    as="textarea"
                                    name="bank_detail"
                                    maxLength={TEXTAREA_TEXT_LENGTH}
                                    className={`form-control font-size-15 rounded-1   ${errors.bank_detail &&
                                      touched.bank_detail &&
                                      "is-invalid input-box-error"
                                      }`}
                                    onInput={(
                                      e: React.FormEvent<HTMLTextAreaElement>,
                                    ) => {
                                      const target =
                                        e.target as HTMLTextAreaElement;
                                      target.style.height = "auto";
                                      target.style.height =
                                        target.scrollHeight + "px";
                                    }}
                                  />
                                  <ErrorMessage
                                    name="bank_detail"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="upi_id"
                                    className="pb-2 form_label"
                                  >
                                    UPI ID
                                  </label>
                                  <Field
                                    type="text"
                                    name="upi_id"
                                    className={`form-control font-size-15 rounded-1  ${errors.upi_id &&
                                      touched.upi_id &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="upi_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="upi_name"
                                    className="pb-2 form_label"
                                  >
                                    UPI Name
                                  </label>
                                  <Field
                                    type="text"
                                    name="upi_name"
                                    className={`form-control font-size-15 rounded-1 ${errors.upi_name &&
                                      touched.upi_name &&
                                      "is-invalid input-box-error"
                                      }`}
                                  />
                                  <ErrorMessage
                                    name="upi_name"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-8"></div>
                              <div className="col-12 border rounded bg-secondary pt-2 pb-2">
                                <b
                                  className="cursor-pointer"
                                  onClick={() =>
                                    setIsOpenThirdParty(!isOpenThirdParty)
                                  }
                                  style={{
                                    cursor: "pointer",
                                    display: "block",
                                    color: "#ffff",
                                  }}
                                >
                                  ThirdParty Integration
                                  <span className="ms-2">
                                    {isOpenThirdParty ? "▲" : "▼"}
                                  </span>
                                  <span className="close ">
                                    <p
                                      className=""
                                      style={{
                                        fontSize: "15px",
                                        cursor: "pointer",
                                        color: "white",
                                        float: "right",
                                        marginBottom: "0",
                                        // marginTop:"-7px"
                                      }}
                                      onClick={() =>
                                        openInNewTab("/videoTutorial", 23)
                                      }
                                    >
                                      How to Generate All Key :{" "}
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="20px"
                                        viewBox="0 -960 960 960"
                                        width="20px"
                                        fill="white"
                                      >
                                        <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                                      </svg>
                                    </p>
                                  </span>
                                </b>
                              </div>
                              {isOpenThirdParty && (
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
                                            src={indiamart_logo}
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
                                        <div style={{ width: "45%" }}>
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
                                              value={
                                                INDIA_MART_PUSH_API +
                                                companyToEdit.qr_code
                                              }
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
                                              <i className="bi bi-check-circle"></i>{" "}
                                              Test
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
                                                  INDIA_MART_PUSH_API +
                                                  companyToEdit.qr_code,
                                                )
                                              }
                                            >
                                              <i className="bi bi-copy"></i>{" "}
                                              Copy
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
                                              src={justdial_logo}
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
                                        <div
                                          style={{ width: "45%" }}
                                          className="ms-5"
                                        >
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
                                              value={
                                                JUST_DIAL_PUSH_API +
                                                companyToEdit.qr_code
                                              }
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
                                              `Justdial: ${JUST_DIAL_PUSH_API +
                                              companyToEdit.qr_code
                                              }`,
                                            )
                                          }
                                        >
                                          <i className="bi bi-copy"></i> Copy
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {platformType == 2 && (
                                    <>
                                      <hr />
                                      <div className="col-12">
                                        <div className="form-group mb-3">
                                          <div className="d-flex align-items-center">
                                            <div className="d-flex align-items-center">
                                              <div className="me-4">
                                                <img
                                                  src={whatsapp_logo}
                                                  alt="wa_webhook_url"
                                                  style={{
                                                    height: "11vh",
                                                    width: "20vh",
                                                    objectFit: "contain",
                                                    marginLeft: "20px",
                                                  }}
                                                />
                                              </div>
                                            </div>
                                            <div
                                              style={{ width: "45%" }}
                                              className="ms-5"
                                            >
                                              <label className="form_label">
                                                Whatsapp webhook
                                              </label>
                                              <div className="input-group">
                                                {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-link-45deg"></i>
                                            </span> */}
                                                <input
                                                  type="text"
                                                  readOnly
                                                  value={
                                                    WA_WEBHOOK_API +
                                                    companyToEdit.qr_code
                                                  }
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
                                                  `wa.smalloffice.in: ${WA_WEBHOOK_API +
                                                  companyToEdit.qr_code
                                                  }`,
                                                )
                                              }
                                            >
                                              <i className="bi bi-copy"></i>{" "}
                                              Copy
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  <hr /> {/* Separate HR after Push Links */}
                                  {/* Trade India Section */}
                                  <div className="col-12">
                                    <div className="form-group mb-3">
                                      <div className="d-flex align-items-center">
                                        <div className="me-4">
                                          <img
                                            src={tradindia_logo}
                                            alt="IndiaMart"
                                            style={{
                                              height: "11vh",
                                              width: "20vh",
                                              objectFit: "contain",
                                              marginLeft: "20px",
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{ width: "45%" }}
                                          className="ms-5"
                                        >
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

                                          <label className="form_label">
                                            Trade India API Key
                                          </label>
                                          <div className="input-group">
                                            {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-key"></i>
                                            </span> */}
                                            <Field
                                              as="textarea"
                                              rows={1}
                                              name="trade_india_key"
                                              className={`form-control bg-light border-start-0 ${errors.trade_india_key &&
                                                touched.trade_india_key
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
                                          <i className="bi bi-check-circle"></i>{" "}
                                          Test
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
                                            src={whatsapp_logo}
                                            alt="IndiaMart"
                                            style={{
                                              height: "11vh",
                                              width: "20vh",
                                              objectFit: "contain",
                                              marginLeft: "20px",
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{ width: "45%" }}
                                          className="ms-5"
                                        >
                                          <label className="form_label">
                                            WhatsApp API Authkey
                                          </label>
                                          <div className="input-group mb-3">
                                            {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-whatsapp"></i>
                                            </span> */}
                                            <Field
                                              as="textarea"
                                              rows={1}
                                              name="whatsapp_authkey"
                                              className={`form-control bg-light border-start-0 ${errors.whatsapp_authkey &&
                                                touched.whatsapp_authkey
                                                ? "is-invalid input-box-error"
                                                : ""
                                                }`}
                                            />
                                          </div>

                                          <label className="form_label">
                                            WhatsApp API AppKey
                                          </label>
                                          <div className="input-group">
                                            {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-whatsapp"></i>
                                            </span> */}
                                            <Field
                                              as="textarea"
                                              rows={1}
                                              name="whatsapp_appkey"
                                              className={`form-control bg-light border-start-0 ${errors.whatsapp_appkey &&
                                                touched.whatsapp_appkey
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
                                          onClick={() =>
                                            copyToClipboard(
                                              values.whatsapp_appkey,
                                            )
                                          }
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
                                            src={chat_gpt_logo}
                                            alt="IndiaMart"
                                            style={{
                                              height: "11vh",
                                              width: "20vh",
                                              objectFit: "contain",
                                              marginLeft: "20px",
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{ width: "45%" }}
                                          className="ms-5"
                                        >
                                          <label className="form_label">
                                            ChatGPT API Key
                                          </label>
                                          <div className="input-group">
                                            {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-robot"></i>
                                            </span> */}
                                            <Field
                                              as="textarea"
                                              rows={1}
                                              name="chatgpt_appkey"
                                              className={`form-control bg-light border-start-0 ${errors.chatgpt_appkey &&
                                                touched.chatgpt_appkey
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
                                          onClick={() =>
                                            copyToClipboard(
                                              values.chatgpt_appkey,
                                            )
                                          }
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
                                            src={gemani_logo}
                                            alt="IndiaMart"
                                            style={{
                                              height: "11vh",
                                              width: "20vh",
                                              objectFit: "contain",
                                              marginLeft: "20px",
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{ width: "45%" }}
                                          className="ms-5"
                                        >
                                          <label className="form_label">
                                            Gemini API Key
                                          </label>
                                          <div className="input-group">
                                            {/* <span className="input-group-text bg-light border-end-0">
                                              <i className="bi bi-robot"></i>
                                            </span> */}
                                            <Field
                                              as="textarea"
                                              rows={1}
                                              style={{ resize: "none" }}
                                              name="gimini_appkey"
                                              className={`form-control bg-light border-start-0 ${errors.gimini_appkey &&
                                                touched.gimini_appkey
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
                                          onClick={() =>
                                            copyToClipboard(
                                              values.gimini_appkey,
                                            )
                                          }
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
                                            src={serp_api_logo}
                                            alt="IndiaMart"
                                            style={{
                                              height: "11vh",
                                              width: "20vh",
                                              objectFit: "contain",
                                              marginLeft: "20px",
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{ width: "45%" }}
                                          className="ms-5"
                                        >
                                          <label
                                            htmlFor="serp_api_key"
                                            className="form_label"
                                          >
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
                                              className={`form-control bg-light border-start-0 ${errors.serp_api_key &&
                                                touched.serp_api_key
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
                                          onClick={() =>
                                            copyToClipboard(values.serp_api_key)
                                          }
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
                                    imageSrc={www_logo}
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
                                        In the{" "}
                                        <strong>
                                          Google Sheet Configuration
                                        </strong>
                                        , click the <strong>SETUP</strong>{" "}
                                        button. You will see a list of columns
                                        on the left side. These column names are{" "}
                                        <strong>system-defined fields</strong>{" "}
                                        from our software.
                                      </p>

                                      <p>
                                        On the right side, enter the{" "}
                                        <strong>
                                          corresponding column names
                                        </strong>{" "}
                                        from your Google Sheet in the provided
                                        text boxes. Each Google Sheet column
                                        name should match the related system
                                        field shown on the left.
                                      </p>

                                      <p>
                                        You can also define the{" "}
                                        <strong>sequence (order)</strong> of
                                        columns as they appear in your Google
                                        Sheet. Data will be processed according
                                        to this column sequence.
                                      </p>

                                      <div className="alert alert-warning mt-3">
                                        <strong>
                                          ⚠️ Important (Mandatory):
                                        </strong>
                                        <ul className="mb-0 mt-2">
                                          <li>
                                            The <strong>id</strong> field is{" "}
                                            <strong>not available</strong> in
                                            the setup column list and cannot be
                                            configured from the SETUP screen.
                                          </li>
                                          <li>
                                            The <strong>id</strong> column must
                                            exist only in your Google Sheet.
                                          </li>
                                          <li>
                                            This <strong>id</strong> column must
                                            contain a{" "}
                                            <strong>unique value</strong> for
                                            each record.
                                          </li>
                                          <li>
                                            The system uses this{" "}
                                            <strong>id</strong> column as a
                                            unique key to identify and update
                                            existing leads.
                                          </li>
                                          <li>
                                            If the <strong>id</strong> column is
                                            missing or contains duplicate
                                            values, the system will insert the
                                            same lead multiple times, resulting
                                            in duplicate data.
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
                                          style={{ height: "120px" }}
                                        >
                                          <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                                          {/* Example icon */}
                                        </span>
                                        <Field
                                          as="textarea"
                                          style={{ height: "120px" }} // 👈 big
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
                                          }} // 👈 small
                                          className={`form-control form-control-sm font-size-15 rounded-1 ${errors.google_sheet_first_name &&
                                            touched.google_sheet_first_name &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                      </div>
                                      <GoogleSheetOpen
                                        link={
                                          values.google_lead_sheet_for_faceBook_1
                                        }
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
                                          style={{ height: "120px" }}
                                        >
                                          <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                                          {/* Example icon */}
                                        </span>
                                        <Field
                                          style={{ height: "120px" }} // 👈 big
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
                                        link={
                                          values.google_lead_sheet_for_faceBook_2
                                        }
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
                                          openGoogleSheetsColumnConfigModal(
                                            "Google Sheet Key 3",
                                            3,
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
                                          style={{ height: "120px" }}
                                        >
                                          <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                                          {/* Example icon */}
                                        </span>
                                        <Field
                                          as="textarea"
                                          name="google_sheet_key_3"
                                          style={{ height: "120px" }} // 👈 big
                                          className={`form-control font-size-15 rounded-1 bg-light border-start-0 ${errors.google_sheet_key_3 &&
                                            touched.google_sheet_key_3
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
                                      <GoogleSheetOpen
                                        link={values.google_sheet_key_3}
                                      />
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
                                          openGoogleSheetsColumnConfigModal(
                                            "Google Sheet Key 4",
                                            4,
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
                                          style={{ height: "120px" }}
                                        >
                                          <i className="bi bi-file-earmark-spreadsheet"></i>{" "}
                                          {/* Example icon */}
                                        </span>
                                        <Field
                                          as="textarea"
                                          style={{ height: "120px" }} // 👈 big
                                          name="google_sheet_key_4"
                                          className={`form-control font-size-15 rounded-1 bg-light border-start-0 ${errors.google_sheet_key_4 &&
                                            touched.google_sheet_key_4
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
                                      <GoogleSheetOpen
                                        link={values.google_sheet_key_4}
                                      />
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
                              )}
                              <div className="col-12 border rounded bg-secondary pt-2 pb-2">
                                <b
                                  onClick={() =>
                                    setIsOpenMailSetup(!isOpenMailSetup)
                                  }
                                  style={{
                                    cursor: "pointer",
                                    display: "block",
                                    color: "#ffff",
                                  }}
                                >
                                  Mail Setup
                                  <span className="ms-2">
                                    {isOpenMailSetup ? "▲" : "▼"}
                                  </span>
                                </b>
                              </div>
                              {isOpenMailSetup && (
                                <>
                                  <div className="col-12 col-md-4">
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
                                  <div className="col-12 col-md-4">
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
                                  <div className="col-12 col-md-4">
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
                                  <div className="col-12 col-md-4">
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
                                </>
                              )}
                              <div className="col-12 border rounded bg-secondary pt-2 pb-2">
                                <b
                                  onClick={() => setIsOpenPrefix(!isOpenPrefix)}
                                  style={{
                                    cursor: "pointer",
                                    display: "block",
                                    color: "#ffff",
                                  }}
                                >
                                  Set Prefix and Page
                                  <span className="ms-2">
                                    {isOpenPrefix ? "▲" : "▼"}
                                  </span>
                                </b>
                              </div>
                              {isOpenPrefix && (
                                <>
                                  {/* Quotation  */}
                                  {/* Prefix */}
                                  <div className="row">
                                    {/* Quotation Prefix */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="quotation_prefix"
                                          className="pb-2 form_label"
                                        >
                                          Quotation Prefix
                                        </label>
                                        <Field
                                          type="text"
                                          name="quotation_prefix"
                                          className={`form-control font-size-15 rounded-1 ${errors.quotation_prefix &&
                                            touched.quotation_prefix &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="quotation_prefix"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* Quotation Title */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="quotation_title"
                                          className="pb-2 form_label"
                                        >
                                          Quotation Title
                                        </label>
                                        <Field
                                          type="text"
                                          name="quotation_title"
                                          className={`form-control font-size-15 rounded-1 ${errors.quotation_title &&
                                            touched.quotation_title &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="quotation_title"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* Quotation Doc. No. */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="quotation_doc_no"
                                          className="pb-2 form_label"
                                        >
                                          Quotation Doc. No.
                                        </label>
                                        <Field
                                          type="text"
                                          name="quotation_doc_no"
                                          className={`form-control font-size-15 rounded-1 ${errors.quotation_doc_no &&
                                            touched.quotation_doc_no &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="quotation_doc_no"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* Quotation View Color */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="quotation_view_color"
                                          className="pb-2 form_label"
                                        >
                                          Quotation View Color
                                        </label>
                                        <Field
                                          type="color"
                                          name="quotation_view_color"
                                          className={`form-control font-size-15 rounded-1 ${errors.quotation_view_color &&
                                            touched.quotation_view_color &&
                                            "is-invalid input-box-error"
                                            }`}
                                          defaultValue="#000000"
                                          style={{
                                            backgroundColor: `${values.quotation_view_color}`,
                                            width: "100%",
                                          }}
                                        />
                                        <ErrorMessage
                                          name="quotation_view_color"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* Quotation View Format */}
                                    <div className="col-12 col-md-3">
                                      <div className="form-group">
                                        <label
                                          htmlFor="quotation_view_formate"
                                          className="pb-2 form_label"
                                        >
                                          Quotation View Format
                                        </label>
                                        <FormikCustomSearchDropdown
                                          name="quotation_view_formate"
                                          options={dropDownOptions}
                                          className={`form-control font-size-15 rounded-1 ${errors.quotation_view_formate &&
                                            touched.quotation_view_formate &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="quotation_view_formate"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* Three Dots Button */}
                                    <div className="col-12 col-md-1 d-flex align-items-center">
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() =>
                                          setShowModalQuotation(true)
                                        }
                                        title="More Options"
                                      >
                                        <i className="bi bi-three-dots-vertical fs-4"></i>
                                      </button>
                                    </div>
                                  </div>
                                  {/* profoma Invoice Prifix  */}
                                  <div className="row">
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="proforma_invoice_prefix"
                                          className="pb-2 form_label"
                                        >
                                          Proforma Invoice Prefix
                                        </label>
                                        <Field
                                          type="text"
                                          name="proforma_invoice_prefix"
                                          className={`form-control font-size-15 rounded-1 ${errors.proforma_invoice_prefix &&
                                            touched.proforma_invoice_prefix &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="proforma_invoice_prefix"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* profoma Invoice Title */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="proforma_invoice_title"
                                          className="pb-2 form_label"
                                        >
                                          Proforma Invoice Title
                                        </label>
                                        <Field
                                          type="text"
                                          name="proforma_invoice_title"
                                          className={`form-control font-size-15 rounded-1 ${errors.proforma_invoice_title &&
                                            touched.proforma_invoice_title &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="proforma_invoice_title"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* profoma Invoice Doc. No. */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="proforma_invoice_doc_no"
                                          className="pb-2 form_label"
                                        >
                                          Proforma Invoice Doc. No.
                                        </label>
                                        <Field
                                          type="text"
                                          name="proforma_invoice_doc_no"
                                          className={`form-control font-size-15 rounded-1 ${errors.proforma_invoice_doc_no &&
                                            touched.proforma_invoice_doc_no &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="proforma_invoice_doc_no"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* profoma Invoice View Color */}
                                    <div className="col-12 col-md-2">
                                      <div className="form-group">
                                        <label
                                          htmlFor="proforma_invoice_view_color"
                                          className="pb-2 form_label"
                                        >
                                          Proforma Invoice View Color
                                        </label>
                                        <Field
                                          type="color"
                                          name="proforma_invoice_view_color"
                                          className={`form-control font-size-15 rounded-1 ${errors.proforma_invoice_view_color &&
                                            touched.proforma_invoice_view_color &&
                                            "is-invalid input-box-error"
                                            }`}
                                          defaultValue="#000000"
                                          style={{
                                            backgroundColor: `${values.proforma_invoice_view_color}`,
                                            width: "100%",
                                          }}
                                        />
                                        <ErrorMessage
                                          name="proforma_invoice_view_color"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* profoma Invoice View Format */}
                                    <div className="col-12 col-md-3">
                                      <div className="form-group">
                                        <label
                                          htmlFor="proforma_invoice_view_formate"
                                          className="pb-2 form_label"
                                        >
                                          Proforma Invoice View Format
                                        </label>
                                        <FormikCustomSearchDropdown
                                          name="proforma_invoice_view_formate"
                                          options={dropDownOptions}
                                          className={`form-control font-size-15 rounded-1 ${errors.proforma_invoice_view_formate &&
                                            touched.proforma_invoice_view_formate &&
                                            "is-invalid input-box-error"
                                            }`}
                                        />
                                        <ErrorMessage
                                          name="proforma_invoice_view_formate"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    {/* Three Dots Button */}
                                    <div className="col-12 col-md-1 d-flex align-items-center">
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() =>
                                          setShowModalProformaInvoice(true)
                                        }
                                        title="More Options"
                                      >
                                        <i className="bi bi-three-dots-vertical fs-4"></i>
                                      </button>
                                    </div>
                                  </div>
                                  {/* Order Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="order_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Order Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="order_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.order_prefix &&
                                          touched.order_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="order_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="order_title"
                                        className="pb-2 form_label"
                                      >
                                        Order Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="order_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.order_title &&
                                          touched.order_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="order_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc.No. */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="order_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Order Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="order_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.order_doc_no &&
                                          touched.order_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="order_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="order_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Order View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="order_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.order_view_color &&
                                          touched.order_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        style={{
                                          backgroundColor: `${values.order_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="order_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="order_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Order View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="order_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1   ${errors.order_view_formate &&
                                          touched.order_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="order_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() => setShowModalOrder(true)}
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Print Setting 
                                  <div className="col-12 col-md-1 ">
                                    <div className="form-group">
                                      <button className="icons ">
                                        <span className="text-white">
                                          <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>

                                        </span>
                                      </button>
                                    </div>{" "}
                                  </div>*/}

                                  {/* Invoice */}
                                  {/* Invoice Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="invoice_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Invoice Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="invoice_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.invoice_prefix &&
                                          touched.invoice_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="invoice_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="invoice_title"
                                        className="pb-2 form_label"
                                      >
                                        Invoice Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="invoice_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.invoice_title &&
                                          touched.invoice_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="invoice_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc.No. */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="invoice_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Invoice Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="invoice_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.invoice_doc_no &&
                                          touched.invoice_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="invoice_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="invoice_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Invoice View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="invoice_view_color"
                                        className={`form-control rounded-1   ${errors.invoice_view_color &&
                                          touched.invoice_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        style={{
                                          backgroundColor: `${values.invoice_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="invoice_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="invoice_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Invoice View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="invoice_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1   ${errors.invoice_view_formate &&
                                          touched.invoice_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="invoice_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() =>
                                        setShowModalSalesInvoice(true)
                                      }
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Print Setting 
                                <div className="col-12 col-md-1 ">
                                  <div className="form-group">
                                    <button className="icons ">
                                      <span className="text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>

                                      </span>
                                    </button>
                                  </div>{" "}
                                </div>*/}

                                  {/* Return Sales Invoice  */}
                                  {/* Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_sales_invoice_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Return Sales Invoice Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="return_sales_invoice_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_prefix &&
                                          touched.return_sales_invoice_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="return_sales_invoice_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_sales_invoice_title"
                                        className="pb-2 form_label"
                                      >
                                        Return Sales Invoice Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="return_sales_invoice_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_title &&
                                          touched.return_sales_invoice_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="return_sales_invoice_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc.No. */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_sales_invoice_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Return Sales Invoice Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="return_sales_invoice_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_doc_no &&
                                          touched.return_sales_invoice_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="return_sales_invoice_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_sales_invoice_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Return Sales Invoice View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="return_sales_invoice_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_view_color &&
                                          touched.return_sales_invoice_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        defaultValue={"#000000"}
                                        style={{
                                          backgroundColor: `${values.return_sales_invoice_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="return_sales_invoice_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_sales_invoice_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Return Sales Invoice View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="return_sales_invoice_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1 ${errors.return_sales_invoice_view_formate &&
                                          touched.return_sales_invoice_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      // onChange={(selectedOption: any) => {
                                      //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                                      //   setViewFormate(selectedOption?.value || "");
                                      // }}
                                      />
                                      <ErrorMessage
                                        name="return_sales_invoice_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>

                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() =>
                                        setShowModalReturnSalesInvoice(true)
                                      }
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Purchase Order */}
                                  {/* Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_ord_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Purchase Order
                                      </label>
                                      <Field
                                        type="text"
                                        name="purchase_ord_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_ord_prefix &&
                                          touched.purchase_ord_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_ord_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title*/}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_order_title"
                                        className="pb-2 form_label"
                                      >
                                        Purchase Order Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="purchase_order_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_order_title &&
                                          touched.purchase_order_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_order_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc. No.  */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_order_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Purchase Order Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="purchase_order_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_order_doc_no &&
                                          touched.purchase_order_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_order_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View Color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_order_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Purchase Order View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="purchase_order_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_order_view_color &&
                                          touched.purchase_order_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        style={{
                                          backgroundColor: `${values.purchase_order_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="purchase_order_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_order_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Purchase Order View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="purchase_order_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1   ${errors.purchase_order_view_formate &&
                                          touched.purchase_order_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_order_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  {/* three dote */}
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() =>
                                        setShowModalPurchaseOrder(true)
                                      }
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Purchase */}
                                  {/* Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Purchase Invoice Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="purchase_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_prefix &&
                                          touched.purchase_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title*/}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_title"
                                        className="pb-2 form_label"
                                      >
                                        Purchase Invoice Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="purchase_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_title &&
                                          touched.purchase_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc. No.  */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Purchase Invoice Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="purchase_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_doc_no &&
                                          touched.purchase_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View Color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Purchase Invoice View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="purchase_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.purchase_view_color &&
                                          touched.purchase_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        style={{
                                          backgroundColor: `${values.purchase_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="purchase_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="purchase_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Purchase Invoice View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="purchase_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1   ${errors.purchase_view_formate &&
                                          touched.purchase_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="purchase_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  {/* three dote */}
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() =>
                                        setShowModalPurchaseInvoice(true)
                                      }
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Return Purchase Invoice  */}
                                  {/* Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_purchase_invoice_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Return Purchase Invoice Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="return_purchase_invoice_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_prefix &&
                                          touched.return_purchase_invoice_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="return_purchase_invoice_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_purchase_invoice_title"
                                        className="pb-2 form_label"
                                      >
                                        Return Purchase Invoice Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="return_purchase_invoice_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_title &&
                                          touched.return_purchase_invoice_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="return_purchase_invoice_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc.No. */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_purchase_invoice_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Return Purchase Invoice Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="return_purchase_invoice_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_doc_no &&
                                          touched.return_purchase_invoice_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="return_purchase_invoice_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_purchase_invoice_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Return Purchase Invoice View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="return_purchase_invoice_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_view_color &&
                                          touched.return_purchase_invoice_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        defaultValue={"#000000"}
                                        style={{
                                          backgroundColor: `${values.return_purchase_invoice_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="return_purchase_invoice_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="return_purchase_invoice_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Return Purchase Invoice View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="return_purchase_invoice_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1 ${errors.return_purchase_invoice_view_formate &&
                                          touched.return_purchase_invoice_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      // onChange={(selectedOption: any) => {
                                      //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                                      //   setViewFormate(selectedOption?.value || "");
                                      // }}
                                      />
                                      <ErrorMessage
                                        name="return_purchase_invoice_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  {/* three dote */}
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() =>
                                        setShowModalReturnPurchaseInvoice(true)
                                      }
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Inward  */}
                                  {/* Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="inward_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Inward Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="inward_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.inward_prefix &&
                                          touched.inward_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="inward_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="inward_title"
                                        className="pb-2 form_label"
                                      >
                                        Inward Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="inward_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.inward_title &&
                                          touched.inward_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="inward_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc.No. */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="inward_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Inward Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="inward_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.inward_doc_no &&
                                          touched.inward_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="inward_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="inward_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Inward View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="inward_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.inward_view_color &&
                                          touched.inward_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        defaultValue={"#000000"}
                                        style={{
                                          backgroundColor: `${values.inward_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="inward_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="inward_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Inward View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="inward_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1 ${errors.inward_view_formate &&
                                          touched.inward_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      // onChange={(selectedOption: any) => {
                                      //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                                      //   setViewFormate(selectedOption?.value || "");
                                      // }}
                                      />
                                      <ErrorMessage
                                        name="inward_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  {/* three dote */}
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() => setShowModalInward(true)}
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>

                                  {/* Dispatch  */}
                                  {/* Prefix */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="dispatch_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Dispatch Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="dispatch_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.dispatch_prefix &&
                                          touched.dispatch_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="dispatch_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Title */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="dispatch_title"
                                        className="pb-2 form_label"
                                      >
                                        Dispatch Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="dispatch_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.dispatch_title &&
                                          touched.dispatch_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="dispatch_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Doc.No. */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="dispatch_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Dispatch Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="dispatch_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.dispatch_doc_no &&
                                          touched.dispatch_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="dispatch_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* View color */}
                                  <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="dispatch_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Dispatch View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="dispatch_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.dispatch_view_color &&
                                          touched.dispatch_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        defaultValue={"#000000"}
                                        style={{
                                          backgroundColor: `${values.dispatch_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="dispatch_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  {/* Print Version */}
                                  <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="dispatch_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Dispatch View Formate
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="dispatch_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1 ${errors.dispatch_view_formate &&
                                          touched.dispatch_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      // onChange={(selectedOption: any) => {
                                      //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                                      //   setViewFormate(selectedOption?.value || "");
                                      // }}
                                      />
                                      <ErrorMessage
                                        name="dispatch_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div>
                                  {/* three dote */}
                                  <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() => setShowModalDispatch(true)}
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div>
                                  {/* Dispatch  */}

                                  {/* Workorder */}
                                  {/* Prefix */}
                                  {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Workorder Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="workorder_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.order_prefix &&
                                          touched.order_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                                  {/* Title */}
                                  {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_title"
                                        className="pb-2 form_label"
                                      >
                                        Workorder Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="workorder_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.workorder_title &&
                                          touched.workorder_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                                  {/* Doc.No. */}
                                  {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Workorder Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="workorder_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.workorder_doc_no &&
                                          touched.workorder_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                                  {/* View color */}
                                  {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Workorder View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="workorder_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.workorder_view_color &&
                                          touched.workorder_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        style={{
                                          backgroundColor: `${values.workorder_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="workorder_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                                  {/* Print Version */}
                                  {/* <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Workorder View Color
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="workorder_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1   ${errors.workorder_view_formate &&
                                          touched.workorder_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div> */}
                                  {/* three dote */}
                                  {/* <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() => setShowModalWorkOrder(true)}
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div> */}

                                  <div className="col-12 col-md-3"></div>
                                </>
                              )}
                              <div className="col-12 border rounded bg-secondary pt-2 pb-2">
                                <b
                                  onClick={() =>
                                    setIsOpenImageSettings(!isOpenImageSettings)
                                  }
                                  style={{
                                    cursor: "pointer",
                                    display: "block",
                                    color: "#ffff",
                                  }}
                                >
                                  Image Settings
                                  <span className="ms-2">
                                    {isOpenImageSettings ? "▲" : "▼"}
                                  </span>
                                </b>
                              </div>
                              {isOpenImageSettings && (
                                <>
                                  <div className="row">
                                    {isShowApiKey === 1 && (
                                      <div className="col-4 mt-2">
                                        <div className="add-source-of-type-section">
                                          <p>
                                            Company Logo
                                            <small className="text-danger ps-2">
                                              Best Size(521 X 512px)
                                            </small>
                                          </p>
                                        </div>
                                        <div className="imgBox-product d-flex align-items-end">
                                          {croppedImageUrl ? (
                                            <img
                                              onClick={handleViewImageTool}
                                              src={croppedImageUrl}
                                              alt=""
                                              className="imgBox-product-cover animate__animated animate__fadeIn"
                                            />
                                          ) : logPreview ? (
                                            <img
                                              onClick={handleViewImageTool}
                                              src={logPreview}
                                              alt=""
                                              className="imgBox-product-cover animate__animated animate__fadeIn"
                                            />
                                          ) : values.company_logo ? (
                                            <>
                                              <img
                                                onClick={handleViewImageTool}
                                                src={values.company_logo}
                                                alt=""
                                                className="imgBox-product-cover animate__animated animate__fadeIn"
                                              />
                                            </>
                                          ) : (
                                            <img
                                              onClick={handleViewImageTool}
                                              src={company_logo}
                                              alt=""
                                              className="imgBox-product-cover animate__animated animate__fadeIn"
                                            />
                                          )}
                                          {values.company_logo && (
                                            <button
                                              type="button"
                                              title="Delete"
                                              disabled={isDeletingImage}
                                              onClick={() =>
                                                handleDeleteImage(
                                                  "company_logo",
                                                )
                                              }
                                            >
                                              <svg
                                                className="btn-outline-danger-hover"
                                                width="25"
                                                height="25"
                                                viewBox="0 0 24 24"
                                                fill={
                                                  isDeletingImage
                                                    ? "currentColor"
                                                    : "red"
                                                }
                                              >
                                                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {isShowApiKey === 1 && (
                                      <div className="col-4 mt-2">
                                        <div className="add-source-of-type-section">
                                          <p>Company Profile</p>
                                        </div>
                                        <div className=" px-2 chat-attach">
                                          <label
                                            style={{
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                            htmlFor="file-upload-company-catalog"
                                          >
                                            <div className="col-12 card p-4">
                                              <div className="text-center">
                                                {catalogview ? (
                                                  <span>
                                                    <b>{catalogview}</b>
                                                  </span>
                                                ) : (
                                                  <span
                                                    style={{
                                                      color:
                                                        "rgb(153, 153, 153)",
                                                    }}
                                                  >
                                                    Please select file
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </label>

                                          <input
                                            type="file"
                                            id="file-upload-company-catalog"
                                            onChange={(event) =>
                                              handleFileChange(
                                                event,
                                                "company_catalog", // The field name you want to set
                                                setFieldValue, // Function to update the field value
                                                setCataLogPreview, // Function to set the image preview
                                              )
                                            }
                                            style={{ display: "none" }} // Hide the actual file input
                                            accept=".pdf"
                                          />
                                        </div>
                                        <div className="ml-2 d-flex align-items-center">
                                          {catalogview ? (
                                            ""
                                          ) : values.company_catalog ? (
                                            <Link
                                              to={values.company_catalog}
                                              target="_blank"
                                            >
                                              <i>Click Hear, to View Catalog</i>
                                            </Link>
                                          ) : (
                                            ""
                                          )}
                                          {values.company_catalog && (
                                            <button
                                              type="button"
                                              disabled={isDeletingImage}
                                              onClick={() =>
                                                handleDeleteImage(
                                                  "company_catalog",
                                                )
                                              }
                                              className="btn"
                                              title="Delete"
                                            >
                                              <svg
                                                className="btn-outline-danger-hover"
                                                width="25"
                                                height="25"
                                                viewBox="0 0 24 24"
                                                fill={
                                                  isDeletingImage
                                                    ? "currentColor"
                                                    : "red"
                                                }
                                              >
                                                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {isShowApiKey === 1 && (
                                      <div
                                        className="col-4 mt-2"
                                      // style={{
                                      //   position: "absolute",
                                      //   top: "5%",
                                      //   left: "70%",
                                      // }}
                                      >
                                        <div className="add-source-of-type-section">
                                          <p>
                                            Company Sign / Stamp <br />
                                            <small className="text-danger">
                                              Best Size(521 X 512px)
                                            </small>
                                          </p>
                                        </div>
                                        <div
                                          className="imgBox-product"
                                          style={{
                                            maxWidth: "230px",
                                            maxHeight: "140px",
                                          }}
                                        >
                                          <label htmlFor="input-files-company-sign">
                                            <div>
                                              {signCroppedImageUrl ? (
                                                <img
                                                  onClick={
                                                    handleViewImageToolForSign
                                                  }
                                                  src={signCroppedImageUrl}
                                                  alt=""
                                                  className="imgBox-product-cover animate__animated animate__fadeIn"
                                                  style={{
                                                    width: "100%",
                                                    height: "100%",
                                                  }}
                                                />
                                              ) : signPreview ? (
                                                <img
                                                  onClick={
                                                    handleViewImageToolForSign
                                                  }
                                                  src={signPreview}
                                                  alt=""
                                                  className="imgBox-product-cover animate__animated animate__fadeIn"
                                                  style={{
                                                    width: "100%",
                                                    height: "100%",
                                                  }}
                                                />
                                              ) : values.company_sign ? (
                                                <img
                                                  onClick={
                                                    handleViewImageToolForSign
                                                  }
                                                  src={values.company_sign}
                                                  alt=""
                                                  className="imgBox-product-cover animate__animated animate__fadeIn"
                                                  style={{
                                                    width: "100%",
                                                    height: "100%",
                                                  }}
                                                />
                                              ) : (
                                                <img
                                                  onClick={
                                                    handleViewImageToolForSign
                                                  }
                                                  src={company_logo}
                                                  alt=""
                                                  className="imgBox-product-cover animate__animated animate__fadeIn"
                                                  style={{
                                                    width: "100%",
                                                    height: "100%",
                                                  }}
                                                />
                                              )}
                                            </div>

                                            {/* <div>
                                            <div className="form-group1">
                                              <input
                                                type="file"
                                                name="image"
                                                id="input-files-company-sign"
                                                className="form-control-file border"
                                                onChange={(event) =>
                                                  handleFileChange(
                                                    event,
                                                    "company_sign",
                                                    setFieldValue,
                                                    setSignPreview
                                                  )
                                                }
                                                style={{ display: "none" }}
                                                accept=".png,.jpg,.jpeg"
                                              />
                                            </div>
                                          </div> */}
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="row">
                                    <div
                                      style={{
                                        position: "relative",
                                        paddingBottom: "40px",
                                      }}
                                    >
                                      <div className="col-6 mt-2">
                                        {/* Header Image Upload */}
                                        <div
                                          className="col-12 "
                                          style={{ position: "relative" }}
                                        >
                                          <p>
                                            Header Image
                                            <small>
                                              (minimum image size 600 PX x 90
                                              PX)
                                            </small>
                                          </p>
                                          {headerCroppedImageUrl ? (
                                            <img
                                              onClick={
                                                handleViewImageToolForHeader
                                              }
                                              src={headerCroppedImageUrl}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          ) : headerPreview ? (
                                            <img
                                              onClick={
                                                handleViewImageToolForHeader
                                              }
                                              src={headerPreview}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          ) : values.header_img ? (
                                            <img
                                              onClick={
                                                handleViewImageToolForHeader
                                              }
                                              src={values.header_img}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          ) : (
                                            <img
                                              onClick={
                                                handleViewImageToolForHeader
                                              }
                                              src={header_logo}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          )}
                                          {/* {
                                          values.header_img && <button type="button" title="Delete" disabled={isDeletingImage} onClick={() => handleDeleteImage("header_img")} style={{ position: "absolute", bottom: "1px", right: "15px" }}>
                                            <svg className="btn-outline-danger-hover" width="25" height="25" viewBox="0 0 24 24" fill={isDeletingImage ? "currentColor" : "red"}>
                                              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                            </svg>
                                          </button>
                                        } */}
                                        </div>
                                      </div>
                                      {/* Footer Image Upload */}
                                      <div
                                        className="col-6 mt-2"
                                        style={{ position: "relative" }}
                                      >
                                        <p>
                                          Footer Image
                                          <small>
                                            (minimum image size 600 PX x 90 PX)
                                          </small>
                                        </p>
                                        {/* <small> minimum image size 500 x 120</small> */}
                                        {footerCroppedImageUrl ? (
                                          <img
                                            onClick={
                                              handleViewImageToolForFooter
                                            }
                                            src={footerCroppedImageUrl}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        ) : footerPreview ? (
                                          <img
                                            onClick={
                                              handleViewImageToolForFooter
                                            }
                                            src={footerPreview}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        ) : values.footer_img ? (
                                          <img
                                            onClick={
                                              handleViewImageToolForFooter
                                            }
                                            src={values.footer_img}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        ) : (
                                          <img
                                            onClick={
                                              handleViewImageToolForFooter
                                            }
                                            src={footer_logo}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        )}
                                        {/* <div>
                                          <div className="form-group1">
                                            <input
                                              type="file"
                                              name="image"
                                              id="input-files-footer"
                                              className="form-control-file border"
                                              onChange={(event) =>
                                                handleFileChange(
                                                  event,
                                                  "footerImg", // The field name you want to set
                                                  setFieldValue, // Function to update the field value
                                                  setFooterPreview // Function to set the image preview
                                                )
                                              }
                                              style={{ display: "none" }}
                                              accept=".png,.jpg,.jpeg"
                                            />
                                          </div>
                                        </div> */}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div
                                      style={{
                                        position: "relative",
                                        paddingBottom: "40px",
                                      }}
                                    >
                                      <div className="col-6 mt-2">
                                        {/* Header Image Upload */}
                                        <div
                                          className="col-12 "
                                          style={{ position: "relative" }}
                                        >
                                          <p>
                                            Online Store Banner
                                            <small>
                                              (minimum image size 600 PX x 90
                                              PX)
                                            </small>
                                          </p>
                                          {onlineStoreBannerCroppedImageUrl ? (
                                            <img
                                              onClick={
                                                handleViewImageToolForOnlineStoreBanner
                                              }
                                              src={
                                                onlineStoreBannerCroppedImageUrl
                                              }
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          ) : storeBannerOnePreview ? (
                                            <img
                                              onClick={
                                                handleViewImageToolForOnlineStoreBanner
                                              }
                                              src={storeBannerOnePreview}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          ) : values.banner_img_one ? (
                                            <img
                                              onClick={
                                                handleViewImageToolForOnlineStoreBanner
                                              }
                                              src={values.banner_img_one}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          ) : (
                                            <img
                                              onClick={
                                                handleViewImageToolForOnlineStoreBanner
                                              }
                                              src={header_logo}
                                              alt=""
                                              className="imgBox-company"
                                            />
                                          )}
                                          {/* {
                                          values.banner_img_one && <button type="button" title="Delete" disabled={isDeletingImage} onClick={() => handleDeleteImage("banner_img_one")} style={{ position: "absolute", bottom: "1px", right: "15px" }}>
                                            <svg className="btn-outline-danger-hover" width="25" height="25" viewBox="0 0 24 24" fill={isDeletingImage ? "currentColor" : "red"}>
                                              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                            </svg>
                                          </button>
                                        } */}
                                        </div>
                                      </div>
                                      {/* Footer Image Upload */}
                                      <div
                                        className="col-6 mt-2"
                                        style={{ position: "relative" }}
                                      >
                                        <p>
                                          Online Store Banner two
                                          <small>
                                            (minimum image size 600 PX x 90 PX)
                                          </small>
                                        </p>
                                        {/* <small> minimum image size 500 x 120</small> */}
                                        {onlineStoreBannertwoCroppedImageUrl ? (
                                          <img
                                            onClick={
                                              handleViewImageToolForOnlineStoreBannertwo
                                            }
                                            src={
                                              onlineStoreBannertwoCroppedImageUrl
                                            }
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        ) : storeBannertwoPreview ? (
                                          <img
                                            onClick={
                                              handleViewImageToolForOnlineStoreBannertwo
                                            }
                                            src={storeBannertwoPreview}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        ) : values.banner_img_two ? (
                                          <img
                                            onClick={
                                              handleViewImageToolForOnlineStoreBannertwo
                                            }
                                            src={values.banner_img_two}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        ) : (
                                          <img
                                            onClick={
                                              handleViewImageToolForOnlineStoreBannertwo
                                            }
                                            src={footer_logo}
                                            alt=""
                                            className="imgBox-company"
                                          />
                                        )}
                                        {/* <div>
                                          <div className="form-group1">
                                            <input
                                              type="file"
                                              name="image"
                                              id="input-files-footer"
                                              className="form-control-file border"
                                              onChange={(event) =>
                                                handleFileChange(
                                                  event,
                                                  "footerImg", // The field name you want to set
                                                  setFieldValue, // Function to update the field value
                                                  setFooterPreview // Function to set the image preview
                                                )
                                              }
                                              style={{ display: "none" }}
                                              accept=".png,.jpg,.jpeg"
                                            />
                                          </div>
                                        </div> */}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              <div className="col-12 border rounded bg-secondary pt-2 pb-2">
                                <b
                                  onClick={() =>
                                    setIsOpenModuleSettings(
                                      !isOpenModuleSettings,
                                    )
                                  }
                                  style={{
                                    cursor: "pointer",
                                    display: "block",
                                    color: "#ffff",
                                  }}
                                >
                                  Modules Settings
                                  <span className="ms-2">
                                    {isOpenModuleSettings ? "▲" : "▼"}
                                  </span>
                                </b>
                              </div>
                              {isOpenModuleSettings && (
                                <>
                                  <div className="row">
                                    <div
                                      style={{
                                        position: "relative",
                                        paddingBottom: "40px",
                                      }}
                                    >
                                      <div
                                        className="col-6 mt-2"
                                      // style={{
                                      //   position: "absolute",
                                      //   top: "-1%",
                                      //   left: "70%",
                                      // }}
                                      >
                                        <div
                                          className="form-check form-switch"
                                          style={{ marginTop: "1.8%" }}
                                        >
                                          <label htmlFor="in_order_image_view">
                                            Product Image View In a Cart
                                          </label>
                                          <Field
                                            type="checkbox"
                                            name="in_order_image_view"
                                            className="form-check-input"
                                            checked={
                                              values.in_order_image_view === 1
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              setFieldValue(
                                                "in_order_image_view",
                                                e.target.checked ? 1 : 2,
                                              );
                                              setInOrderImageView(
                                                e.target.checked ? 1 : 2,
                                              );
                                            }}
                                          />
                                        </div>

                                        <div className="form-check form-switch">
                                          <label htmlFor="watermark_in_print">
                                            Show Watermark In Print/PDF
                                          </label>
                                          <Field
                                            type="checkbox"
                                            name="watermark_in_print"
                                            className="form-check-input"
                                            checked={
                                              values.watermark_in_print === 2
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              setFieldValue(
                                                "watermark_in_print",
                                                e.target.checked ? 2 : 1,
                                              );
                                              setWatermarkInPrint(
                                                e.target.checked ? 2 : 1,
                                              );
                                            }}
                                          />
                                        </div>
                                        <div className="form-check form-switch">
                                          <label htmlFor="view_inquiry_form_in_contact">
                                            Display Inquiry Form in Contact
                                            Creation
                                          </label>
                                          <Field
                                            type="checkbox"
                                            name="view_inquiry_form_in_contact"
                                            className="form-check-input"
                                            checked={
                                              values?.view_inquiry_form_in_contact ===
                                              2
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              setFieldValue(
                                                "view_inquiry_form_in_contact",
                                                e.target.checked ? 2 : 1,
                                              );
                                              setViewInquiryFormInContact(
                                                e.target.checked ? 2 : 1,
                                              );
                                            }}
                                          />
                                        </div>
                                        <div className="form-check form-switch">
                                          <label htmlFor="same_product_multiple_in_cart">
                                            Allow Same product added multiple
                                            times in the cart.
                                          </label>
                                          <Field
                                            type="checkbox"
                                            name="same_product_multiple_in_cart"
                                            className="form-check-input"
                                            checked={
                                              values?.same_product_multiple_in_cart ===
                                              2
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              setFieldValue(
                                                "same_product_multiple_in_cart",
                                                e.target.checked ? 2 : 1,
                                              );
                                              setSameProductMultipleInCart(
                                                e.target.checked ? 2 : 1,
                                              );
                                            }}
                                          />
                                        </div>
                                        <div className="form-check form-switch">
                                          <label htmlFor="is_contact_validation">
                                            <code>
                                              Off = Contact Number Duplication
                                              Not Allowed | On = Contact Number
                                              Duplication Allowed
                                            </code>
                                          </label>
                                          <Field
                                            type="checkbox"
                                            name="is_contact_validation"
                                            className="form-check-input"
                                            checked={
                                              values.is_contact_validation === 2
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              setFieldValue(
                                                "is_contact_validation",
                                                e.target.checked ? 2 : 1,
                                              );
                                              setisContactValidation(
                                                e.target.checked ? 2 : 1,
                                              );
                                            }}
                                          />
                                        </div>
                                        <div className="form-check form-switch">
                                          <label htmlFor="is_strict_check_product_stock">
                                            Strict Product Stock Check In
                                            dispatch/sales invoice
                                          </label>

                                          <Field
                                            type="checkbox"
                                            name="is_strict_check_product_stock"
                                            className="form-check-input"
                                            checked={
                                              Number(
                                                values.is_strict_check_product_stock,
                                              ) === 2
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              const value = e.target.checked
                                                ? 2
                                                : 1;

                                              setFieldValue(
                                                "is_strict_check_product_stock",
                                                value,
                                              );
                                              setisStrictCheckProductStock(
                                                value,
                                              );
                                            }}
                                          />
                                        </div>
                                        <div className="form-check form-switch">
                                          <label htmlFor="is_strict_wharehouse_wise_product_stock_check">
                                            Strict Product Stock Check WareHouse
                                            Wise In dispatch/sales invoice
                                          </label>

                                          <Field
                                            type="checkbox"
                                            name="is_strict_wharehouse_wise_product_stock_check"
                                            className="form-check-input"
                                            checked={
                                              Number(
                                                values.is_strict_wharehouse_wise_product_stock_check,
                                              ) === 2
                                            }
                                            onChange={(
                                              e: React.ChangeEvent<HTMLInputElement>,
                                            ) => {
                                              if (
                                                Number(
                                                  values.is_strict_check_product_stock,
                                                ) != 2
                                              ) {
                                                toast.error(
                                                  "Please enable 'Strict Product Stock Check' first to enable warehouse-wise product stock check.",
                                                );
                                                return;
                                              }

                                              const value = e.target.checked
                                                ? 2
                                                : 1;

                                              setFieldValue(
                                                "is_strict_wharehouse_wise_product_stock_check",
                                                value,
                                              );
                                              setisStrictCheckWareHouseWiseProductStock(
                                                value,
                                              );
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="col-4 col-md-4">
                                        <div className="form-group">
                                          <label
                                            htmlFor="order_qty_unit"
                                            className="mb-1 form_label"
                                          >
                                            Order Unit Classification{" "}
                                            <span className="text-danger">
                                              *
                                            </span>
                                          </label>
                                          <FormikCustomSearchDropdown
                                            name="order_qty_unit"
                                            options={orderQtyOptions}
                                            className={` ${errors.order_qty_unit &&
                                              touched.order_qty_unit &&
                                              "is-invalid input-box-error"
                                              }`}
                                          />
                                          <ErrorMessage
                                            name="order_qty_unit"
                                            component="div"
                                            className="field-error text-danger"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            ""
                          )}
                          <div className="col-12 col-12 pt-5 d-flex justify-content-end modal-buttons">
                            <button
                              className="modal-button1"
                              onClick={handelClose}
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
                              {isShowApiKey === 1
                                ? "Save Company"
                                : "Create Company"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {modals.map((modal, index) => (
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
                    ))}
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      )}

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
      {isModalImageTool && (
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
      )}

      {isOpenGoogleSheetsColumnConfigModel && (
        <GoogleSheetsColumnConfigModal
          show={isOpenGoogleSheetsColumnConfigModel}
          onHide={() => setIsGoogleSheetsColumnConfigModel(false)}
          RequiredDetail={googleSheetModalDetails ?? null}
        />
      )}
    </React.Fragment>
  );
};

export default CreateCompanyView;
function validateImageDimensions(
  file: File,
  arg1: number,
  arg2: number,
  arg3: (isValid: any) => void,
) {
  throw new Error("Function not implemented.");
}
