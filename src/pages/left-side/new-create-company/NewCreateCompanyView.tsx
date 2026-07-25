import { ErrorMessage, Field, Form, Formik, FormikErrors, FormikProps } from "formik";
import React, { useContext, useEffect, useRef, useState } from "react";

import { SingleValue } from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import { handleRefresh, openInNewTab } from "../../../common/SharedFunction";
import CustomSearchDropdown from "../../../components/CustomSearchDropdown";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import ImageCropperToolModel from "../../../components/model/ImageCroperToolModel";
import OtpConfirmationModal from "../../../components/model/OtpConfirmationModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  SMALL_TEXT_LENGTH,
  TEXTAREA_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, PRINT_SETTING_TYPE_OBJ } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  fetchprintSetting,
  IprintSetting,
} from "../../order-pdf-view/OrderPdfController";
import { ModalField } from "./NewCompanyPrifixModal";
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
  updateCompanyDetails,
} from "./NewCreateCompanyController";
import NewMailSetup from "./NewMailSetup";
import NewModuleSettings from "./NewModuleSettings";
import NewOpenImageSettings from "./NewOpenImageSettings";
import NewSetPrefixAndPage from "./NewSetPrefixAndPage";
import NewThirdParty from "./NewThirdParty";

const NewCreateCompanyView = ({
  show,
  onHide,
  companyToEdit,
  setRefresh,
  headerName,
  mobileNumber,
}: any) => {
  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  const [thirdPartyData, setThirdPartyData] = useState<any>({});
  const [mailSetupData, setMailSetupData] = useState<any>({});
  const [pagesAndPrefixData, setPagesAndPrefixData] = useState<any>({});
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
  const [activeTab, setActiveTab] = useState<string>("companyDetail");

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
  const formikRef = useRef<FormikProps<any>>(null);
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
  ];

  // Filter fields for each modal type
  const quotationFields = fields.filter((field) =>
    field.name.startsWith("quotation_"),
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
      // COMPANY DETAILS TAB
      // if (activeTab === "companyDetail") {
      await updateCompanyDetails(values, setRefresh, companyToEdit, onHide);
      // }

      // IMAGE SETTINGS TAB
      // else if (activeTab === "imageSettings") {
      //   await updateOpenImageSettings(
      //     values,
      //     setRefresh,
      //     companyToEdit,
      //     onHide,
      //     values.headerImg,
      //     values.footerImg,
      //     values.company_logo,
      //     values.company_sign,
      //     values.company_catalog,
      //     values.bannerimgone,
      //     values.bannerimgtwo
      //   );
      // }
      // else if (activeTab === "modulesSettings") {
      //   await updateModuleSettings(
      //     values,
      //     setRefresh,
      //     companyToEdit,
      //     onHide,
      //   );
      // }

      setImage(values.company_logo);
      // handelClose();
    } else {
      // CREATE COMPANY (only happens first time)
      await createCompany(
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
    // handleRefresh();
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

  const getButtonStyle = (tabName: string): React.CSSProperties => ({
    backgroundColor: activeTab === tabName ? "#f58634" : "transparent",
    color: activeTab === tabName ? "#ffffff" : "#000000",
    border: activeTab === tabName ? "none" : "1px solid #ccc",
    boxShadow: "none",
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "companyDetail":
        return null; // already inside modal form

      case "thirdParty":
        return (
          <NewThirdParty
            show={show}
            onHide={onHide}
            companyToEdit={companyToEdit}
            setRefresh={setRefresh}
            headerName={headerName}
            mobileNumber={mobileNumber}
            setThirdPartyData={setThirdPartyData}
          />
        );

      case "mailSetup":
        return (
          <NewMailSetup
            show={show}
            onHide={onHide}
            companyToEdit={companyToEdit}
            setRefresh={setRefresh}
            headerName={headerName}
            mobileNumber={mobileNumber}
            setMailSetupData={setMailSetupData}
          />
        );

      case "setPrefix":
        return (
          <NewSetPrefixAndPage
            show={show}
            onHide={onHide}
            companyToEdit={companyToEdit}
            setRefresh={setRefresh}
            headerName={headerName}
            mobileNumber={mobileNumber}
            setPagesAndPrefixData={setPagesAndPrefixData}
          />
        );

      case "imageSettings":
        return (
          <NewOpenImageSettings
            show={show}
            onHide={onHide}
            companyToEdit={companyToEdit}
            setRefresh={setRefresh}
            headerName={headerName}
            mobileNumber={mobileNumber}
          />
        );

      case "modulesSettings":
        return (
          <NewModuleSettings
            show={show}
            onHide={onHide}
            companyToEdit={companyToEdit}
            setRefresh={setRefresh}
            headerName={headerName}
            mobileNumber={mobileNumber}
          />
        );

      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <ToastContainer autoClose={2000} />
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ width: "90%", height: "85vh", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                // background: "#fff",
                padding: "10px 0"
              }}
            >
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
              <div className="d-flex align-items-center justify-content-between mb-3">
                <nav
                  className="nav nav-pills flex-column flex-sm-row flex-wrap gap-1"
                  style={{ width: "100%" }}
                >
                  <button
                    className="flex-sm-fill text-sm-center nav-link"
                    type="button"
                    onClick={() => setActiveTab("companyDetail")}
                    style={getButtonStyle("companyDetail")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="currentColor"
                    >
                      <path d="M80-120v-720h400v160h400v560H80Zm80-80h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm320 480h320v-400H480v400Zm80-240v-80h160v80H560Zm0 160v-80h160v80H560Z" />
                    </svg>
                    <span className="m-1">Company Detail</span>
                  </button>

                  <button
                    className="flex-sm-fill text-sm-center nav-link"
                    type="button"
                    onClick={() => setActiveTab("thirdParty")}
                    style={getButtonStyle("thirdParty")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="currentColor"
                    >
                      <path d="m480-400-80-80 80-80 80 80-80 80Zm-85-235L295-735l185-185 185 185-100 100-85-85-85 85ZM225-295 40-480l185-185 100 100-85 85 85 85-100 100Zm510 0L635-395l85-85-85-85 100-100 185 185-185 185ZM480-40 295-225l100-100 85 85 85-85 100 100L480-40Z" />
                    </svg>
                    <span className="m-1">ThirdParty Integration</span>
                  </button>

                  <button
                    className="flex-sm-fill text-sm-center nav-link"
                    type="button"
                    onClick={() => setActiveTab("mailSetup")}
                    style={getButtonStyle("mailSetup")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="currentColor"
                    >
                      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" />
                    </svg>
                    <span className="m-1">Mail Setup</span>
                  </button>

                  <button
                    className="flex-sm-fill text-sm-center nav-link"
                    type="button"
                    onClick={() => setActiveTab("setPrefix")}
                    style={getButtonStyle("setPrefix")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="currentColor"
                    >
                      <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                    </svg>
                    <span className="m-1">Set Prefix and Page</span>
                  </button>

                  <button
                    className="flex-sm-fill text-sm-center nav-link"
                    type="button"
                    onClick={() => setActiveTab("imageSettings")}
                    style={getButtonStyle("imageSettings")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="currentColor"
                    >
                      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
                    </svg>
                    <span className="m-1">Image Settings</span>
                  </button>

                  <button
                    className="flex-sm-fill text-sm-center nav-link"
                    type="button"
                    onClick={() => setActiveTab("modulesSettings")}
                    style={getButtonStyle("modulesSettings")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="currentColor"
                    >
                      <path d="M666-440 440-666l226-226 226 226-226 226Zm-546-80v-320h320v320H120Zm400 400v-320h320v320H520Zm-400 0v-320h320v320H120Zm80-480h160v-160H200v160Zm467 48 113-113-113-113-113 113 113 113Zm-67 352h160v-160H600v160Zm-400 0h160v-160H200v160Zm160-400Zm194-65ZM360-360Zm240 0Z" />
                    </svg>
                    <span className="m-1">Modules Settings</span>
                  </button>
                </nav>
              </div>
              <hr style={{ border: "none", borderTop: "4px solid grey" }} />
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                paddingBottom: 0,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Formik
                enableReinitialize
                initialValues={createCompanyInitialValues(
                  {
                    ...(companyToEdit || {}),
                    // companyToEdit,
                    // selectedCategoryId,
                    ...(thirdPartyData || {}),
                    ...(mailSetupData || {}),
                    ...(pagesAndPrefixData || {}),
                  },
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

                      <>
                        {activeTab === "companyDetail" && (
                          <div className="row mt-4 mx-0 px-2 gy-3  d-flex justify-content-center">
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
                                </div>

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

                                <ErrorMessage
                                  name="company_email"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
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
                            <>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label
                                    style={{ display: "none" }}
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
                                    hidden={true}
                                  />
                                </div>
                              </div>

                              <div className="col-md-4">
                                <div className="form-group">
                                  <label
                                    style={{ display: "none" }}
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
                                    hidden={true}
                                  />

                                </div>
                              </div>

                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    style={{ display: "none" }}
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
                                    hidden={true}
                                  />

                                </div>
                              </div>
                              <div className="col-4"></div>
                            </>



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
                                className="modal-button1 rounded-1 px-4 py-2 ms-2"
                                type="button"
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
                                type="submit"
                                onSubmit={handleSubmit}
                                className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                                style={{
                                  backgroundColor: "#f58634",
                                }}
                              >
                                Save
                              </button>
                            </div>

                          </div>

                        )}
                      </>

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
                      {/* 🔥 TAB CONTENT RENDER HERE */}
                      {activeTab !== "companyDetail" && (
                        <div className="mt-4">{renderTabContent()}</div>
                      )}
                    </Form>
                  );
                }}
              </Formik>
            </div>
          </div>
        </div>
      )
      }

      {
        isPrintSettingShow && (
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
        )
      }
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
      {
        isModalImageTool && (
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
        )
      }
      {
        isModalImageToolForHeader && (
          <ImageCropperToolModel
            show={isModalImageToolForHeader}
            onHide={() => setIsModalImageToolForHeader(false)}
            onSubmit={handleCroppedImageForHeader}
            initialImage={headerimage}
            width={600 * 2}
            height={90 * 2}
            title="Crop Your Header"
          />
        )
      }
      {
        isModalImageToolForOnlineStoreBanner && (
          <ImageCropperToolModel
            show={isModalImageToolForOnlineStoreBanner}
            onHide={() => setIsModalImageToolForOnlineStoreBanner(false)}
            onSubmit={handleCroppedImageForOnlineStoreBanner}
            initialImage={storeBannerOneimage}
            width={1200 * 2}
            height={400 * 2}
            title="Crop Your Online Store banner"
          />
        )
      }
      {
        isModalImageToolForOnlineStoreBannertwo && (
          <ImageCropperToolModel
            show={isModalImageToolForOnlineStoreBannertwo}
            onHide={() => setIsModalImageToolForOnlineStoreBannertwo(false)}
            onSubmit={handleCroppedImageForOnlineStoreBannertwo}
            initialImage={storeBannertwoimage}
            width={1200 * 2}
            height={400 * 2}
            title="Crop Your Online Store banner Two"
          />
        )
      }

      {
        isModalImageToolForFooter && (
          <ImageCropperToolModel
            show={isModalImageToolForFooter}
            onHide={() => setIsModalImageToolForFooter(false)}
            onSubmit={handleCroppedImageForFooter}
            initialImage={footerimage}
            width={600 * 2}
            height={90 * 2}
            title="Crop Your Footer"
          />
        )
      }

      {
        isModalImageToolForSign && (
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
        )
      }

      {/* {isOpenGoogleSheetsColumnConfigModel && (
        <GoogleSheetsColumnConfigModal
          show={isOpenGoogleSheetsColumnConfigModel}
          onHide={() => setIsGoogleSheetsColumnConfigModel(false)}
          RequiredDetail={googleSheetModalDetails ?? null}
        />
      )} */}
    </React.Fragment >
  );
};

export default NewCreateCompanyView;
function validateImageDimensions(
  file: File,
  arg1: number,
  arg2: number,
  arg3: (isValid: any) => void,
) {
  throw new Error("Function not implemented.");
}
