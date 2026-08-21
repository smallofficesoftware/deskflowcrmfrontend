import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { SingleValue } from "react-select";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import * as Yup from "yup";
import no_image from "../../../assets/images/no_image.jpeg";
import {
  formatDateSendDataBase,
  formatNumber,
  getCustomFieldDatavalues,
  useEscapeKey,
} from "../../../common/SharedFunction";
import {
  BIG1_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_ERROR,
  DEFAULT_STATUS_CODE_SUCCESS,
  DEFAULT_TCS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  PACKING_FORWARDING_CHARGE_GST,
  SMALL_TEXT_LENGTH,
  TRANSPORT_CHARGE__GST,
} from "../../../helpers/AppConstants";
import {
  PAGE_ID,
  PERMISSION_TYPE,
  PRINT_SETTING_TYPE_OBJ,
} from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { ICustomInquiryFromList } from "../../../pages/left-side/header/Setting/custom-inquiry-from/CustomInquiryFromController";
import CreateProductView from "../../../pages/left-side/header/Setting/product/create-product/CreateProductView";
import { IUserList } from "../../../pages/left-side/LeftSideController";
import {
  fetchprintSetting,
  IprintSetting,
} from "../../../pages/order-pdf-view/OrderPdfController";
import {
  fetchMiracleAccountLedger,
  IAccountLedgerFromMiracleOptions,
} from "../../../pages/right-side/create-account-transaction/CreateAccountTransactionController";
import {
  handleConvertIntoDispath,
  handleConvertIntoInvoice,
  handleConvertIntoProforma,
  handleConvertIntoInward,
  handleConvertIntoOrder,
  handleConvertIntoPurchaseInvoice,
  handleConvertIntoReturnPurchaseInvoice,
  handleMakeNewCopy,
  handleModalConvertIntoReturnSalesInvoices,
  syncMiracleInvoice,
} from "../../../pages/right-side/list-order/ListOrderController";
import { fetchPdfmeTemplatesForPicker, isPdfmeSupportedCartType } from "../../../pages/order-print-view/orderPrintController";
import { axiosInstance } from "../../../services/axiosInstance";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";
import {
  ModuleType,
  useSalesDependencyGuard,
} from "../../../store/sales/salesDependencyGuard";
import useWhatsappPlatformStore from "../../../store/whatsapp/useWhatsappPlateformFlagStore";
import CustomSearchDropdown from "../../CustomSearchDropdown";
import ConfirmationModal from "../ConfirmationModal";
import "../ConfirmationModal.css";
import PrintSettingModal from "../PrintSettingModal";
import ReportModal from "../ReportsModel";
import RibbonBanner from "../RibbonBedgetLeftSide/RibbonBannerLeft";
import { whatsappTemplateCloudeSend } from "../whatsapp_template_sender/WhatsappTemplateSenderController";
import { startWorkflow } from "../workflowConformatioModel/workFlowModelController";
import ApproveModel from "./ApproveModel";
import AttachDocumentModel from "./AttachDoument/AttachDocumentModel";
import {
  fetchCategoryApiForOrder,
  fetchCompanyForTerms,
  fetchContactDetail,
  fetchCurrency,
  fetchCustomInqFromApi,
  fetchCustomProductFromApi,
  fetchLastPartyCommonDetail,
  fetchOrderByCartNumber,
  fetchOrderId,
  fetchPaymentTypeApi,
  fetchpricelistForOrder,
  fetchProductApiForOrder,
  fetchwrehouse,
  formatDateTimeForInput,
  ICart,
  ICartAll,
  ICartItem,
  ICompanyTerms,
  ICustomFormFiledValuesLastParty,
  ICustomFormList,
} from "./OrderCreateModelController";
import PageTextEditModel from "./PageTextEditModel/PageTextEditModel";
import DesignerPageEditModel from "./PageTextEditModel/DesignerPageEditModel";

interface IOrderCreateModal {
  show: boolean;
  onHide: () => void;
  handleSubmit: () => void;
  /** Called after a conversion succeeds, with the target order type number.
   *  e.g. Quotation(1) → Proforma(12): onConversionSuccess(12)
   *  Optional — callers that don't need to redirect can omit it. */
  onConversionSuccess?: (targetOrderType: number) => void;
  title: string;
  message: string;
  btn1: string;
  btn2: string;
  Contact?: IUserList;
  isOrderShowNum: number;
  orderById?: any;
  orderId?: any;
  flag?: string;
  companyDetail?: any;
  setRefreshReport?: (value: boolean | number) => void;
  isOrderViewFormate?: number | string;
}

interface UploadedFileWithOrder {
  file: File;
  display_order: number;
}

interface PaymentMode {
  id: string | number;
  payment_type_name: string;
  // ... other fields if needed
}
const OrderCreateModal: React.FC<IOrderCreateModal> = ({
  show,
  onHide,
  handleSubmit,
  onConversionSuccess,
  title,
  message,
  btn1,
  btn2,
  Contact,
  isOrderShowNum,
  orderById,
  companyDetail,
  orderId,
  setRefreshReport,
  flag,
  isOrderViewFormate,
}) => {
  const { platformType } = useWhatsappPlatformStore();
  const [columnSizing, setColumnSizing] = useState({});
  const [productList, setProductList] = useState<any[]>([]);
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshDownload, setRefreshDownload] = useState(false);
  // §7 template picker — same rule as ListOrderView.tsx/OrderPrintView*.tsx:
  // check flag+template count before opening anything, skip below 2.
  const [showDownloadPicker, setShowDownloadPicker] = useState(false);
  const [downloadTemplateChoices, setDownloadTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [printLoading, setPrintLoading] = useState(false);
  // Which action opened the template picker — "print" (flag 2, auto-print
  // after generating) or "view" (flag 1, "Open Print View": just display
  // the real PDF, no print dialog).
  const [printMode, setPrintMode] = useState<"print" | "view">("print");
  const [printTemplateChoices, setPrintTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [refreshShare, setRrefreshShare] = useState(false);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [addDataSourceItemForPageText, setAddDataSourceItemForPageText] =
    useState<ICustomInquiryFromList>();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tooltipBgColor, setTolltipBgColor] = useState<string>("#fff");

  const [currentPage, setCurrentPage] = useState(0);
  const [orderbyidList, setOrderbyidList] = useState<ICartAll | null>(null);
  const [printSetting, setPrintSetting] = useState<IprintSetting>();
  const [isConversionRateReadOnly, setIsConversionRateReadOnly] =
    useState<boolean>(true);
  const [closingQuantities, setClosingQuantities] = useState<
    Record<number, number>
  >({});
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [cart, setCart] = useState<ICart[]>([]);

  const [contactDetail, setContactDetail] = useState<any>({});
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [priceList, setPriceList] = useState<any[]>([]);
  const [currency, setCurrency] = useState<any[]>([]);
  const [warehouse, setWarehouse] = useState<any[]>([]);

  const [customFormList, setCustomFormList] = useState<ICustomFormList[]>([]);
  const [companyTerms, setCompanyTerms] = useState("");
  const [dynamicStartWorkflow, setDynamicStartWorkflow] = useState(0);
  const [companyNote, setCompanyNote] = useState("");
  const [companyRemark, setCompanyRemark] = useState("");

  const [printDate, setPrintDate] = useState<ICompanyTerms[]>([]);
  const [isOrderClassification, setisOrderClassification] = useState<number>();
  const [contactData, setContactData] = useState<IUserList | undefined>();
  const [selectedCurrency, setSelectedCurrency] =
    useState<SingleValue<IOption> | null>(null);

  const [customFormListProduct, setCustomFormListProduct] = useState<
    ICustomFormList[]
  >([]);
  const [cartCustomFieldValues, setCartCustomFieldValues] = useState<
    Record<string, any>
  >({});
  const [defaultSeriesPrefix, setDefaultSeriesPrefix] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<any>(false);
  const [selectedPriceList, setSelectedPriceList] = useState<any>();
  const [isPriceListTouched, setIsPriceListTouched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarcodeNum, setSearchBarcodeNum] = useState(0);

  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    item: any;
    index: number;
  } | null>(null);
  const [isRefreshReport, setIsRefreshReport] = useState(false);
  const [discount, setDiscount] = useState<string | number>(0);
  const [cartId, setCartId] = useState(0);

  const [cartIdPrint, setCartIdPrint] = useState(0);
  const [packingForwardingCharge, setPackingForwardingCharge] = useState<
    string | number
  >(0);
  const [packingForwardingChargeTitle, setPackingForwardingChargeTitle] =
    useState<string>("Packing Forwarding charge");
  const [transportCharge, setTransportCharge] = useState<string | number>(0);
  const [transportChargeTitle, setTransportChargeTitle] =
    useState<string>("Transport charge");
  const [conversionRate, setConversionRate] = useState<string | number>();
  const [advancePayment, setAdvancePayment] = useState<string | number>();
  const [orderNumber, setOrderNumber] = useState<string | number>();
  const [new_customer_name, setNew_customer_name] = useState<string | number>();
  const [new_customer_mobile, setNew_customer_mobile] = useState<
    number | string
  >();
  const [isTcsActive, setIsTcsActive] = useState(false);
  const [isGstActive, setIsGstActive] = useState(true);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);

  const [grandTotal, setGrandTotal] = useState(0);
  const [tcsAmount, setTcsAmount] = useState(0);
  const [roundOffAmount, setRoundOffAmount] = useState(0);
  const [taxAbleAmount, setTaxAbleAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [closingQty, setClosingQty] = useState(0);
  const [cartRemark, setCartRemark] = useState("");
  const [isBarcode, setIsBarcode] = useState(false);
  const [cartTermsAndCondition, setCartTermsAndCondition] = useState("");
  const [cartNote, setCartNote] = useState("");
  const [cartDueDate, setCartDueDate] = useState<DateObject>();
  const [cartnumber, setCartNumber] = useState("");
  const [oldNumber, setOldNumber] = useState("");
  const [srNumber, setSRNumber] = useState(0);
  const [updateDate, setUpdateDate] = useState("");
  const [oldUpdateDate, setOldUpdateDate] = useState("");
  const [reportName, setReportName] = useState("");
  const componentRef = useRef<HTMLDivElement>(null);
  const [defaultCurrency, setDefaultCurrency] =
    useState<SingleValue<IOption> | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<
    number | null
  >(null);
  const [focusedProductIndex, setFocusedProductIndex] = useState<number | null>(
    null,
  );
  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);

  const [isEditDataSourceForPageText, setIsEditDataSourceForPageText] =
    useState(false);
  const [isAttachDocument, setIsAttachDocument] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileWithOrder[]>(
    [],
  );

  // setIsEditDataSourceForPageText(true)

  const [openCloseRightSide, setOpenCloseRight] = useState(true);

  const productRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isConvetIntoOrderConfirmation, setIsConvetIntoOrderConfirmation] =
    useState(false);
  const [
    isConvertIntoPurchaseInvoiceConfirmation,
    setIsConvertPurchaseIntoInvoiceConfirmation,
  ] = useState(false);
  const [
    isConvertPurchaseIntoReturnPurchaseInvoiceConfirmation,
    setIsConvertPurchaseIntoReturnPurchaseInvoiceConfirmation,
  ] = useState(false);
  const [
    isConvertIntoReturnSalesInvoiceConfirmation,
    setIsConvertIntoReturnSalesInvoiceConfirmation,
  ] = useState(false);

  const [converCartId, setConverCartId] = useState<number | undefined>(0);

  const [convertCartNumber, setConvertCartNumber] = useState("");
  const [refreshCarts, setRefreshCarts] = useState(false);

  const [isOrderCreateFromContactShow, setIsOrderCreateFromContactShow] =
    useState(false);
  const [isMakeCartCopyConfirmation, setIsMakeCartCopyConfirmation] =
    useState(false);
  const [makeCopyType, setMakeCopyType] = useState(0);
  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: string]: any[];
  }>({});

  const [originalUpdateDate, setOriginalUpdateDate] = useState("");
  const [paddingLeft, setPaddingLeft] = useState(0);
  const hiddenRef = useRef<HTMLSpanElement | null>(null);
  const [originalQuantities, setOriginalQuantities] = useState<
    Record<number, number>
  >({});
  const [paymentTypeList, setPaymentTypeList] = useState<any>([]);

  const [
    isConvertIntoInvoiceConfirmation,
    setIsConvertIntoInvoiceConfirmation,
  ] = useState(false);
  const [isConvertIntoProformaConfirmation, setIsConvertIntoProformaConfirmation] =
    useState(false);

  const [
    isConvertIntoDisPatchConfirmation,
    setIsConvertIntoDisPatchConfirmation,
  ] = useState(false);

  const [isConvertIntoInwardConfirmation, setIsConvertIntoInwardConfirmation] =
    useState(false);

  const [isConversionSuccess, setIsConversionSuccess] = useState(false);
  const [newOrderShowNumAfterConversion, setnewOrderShowNumAfterConversion] =
    useState<number | undefined>(undefined);
  const [dynamicGstSwitch, setDynamicGstSwitch] = useState<any>();
  const [dynamicTitle, setDynamicTitle] = useState<string>("");
  const [dynamicTitleColour, setDynamicTitleColour] = useState<string>("");
  const [dynamicImageView, setDynamicImageView] = useState<number[]>([]);
  const [dynamicProductAdd, setDynamicProductAdd] = useState<number[]>([]);
  const [dynamicSalesInvoiceTitle, setDynamicSalesInvoiceTitle] =
    useState<string>("");
  const [dynamicDispatch, setDynamicDispatch] = useState<string>("");
  const [dynamicInward, setDynamicInward] = useState<string>("");
  const [dynamicPurchaseInvoiceTitle, setDynamicPurchaseInvoiceTitle] =
    useState<string>("");
  const [dynamicSalesOrderTitle, setDynamicSalesOrderTitle] =
    useState<string>("");
  const [dynamicReturnSalesInvoice, setDynamicReturnSalesInvoice] =
    useState<string>("");
  const [dynamicReturnPurchaseInvoice, setDynamicReturnPurchaseInvoice] =
    useState<string>("");
  const [dynamicTCSTitle, setDynamicTCSTitle] = useState<string>("TCS");
  const [dynamicTCSRate, setDynamicTCSRate] = useState<string | number>(
    DEFAULT_TCS,
  );
  const [showapproveModel, setShowapproveModel] = useState(false);
  const [approveData, setApproveData] = useState<{
    checkedOptions: string[] | undefined;
    dropdownValue: { value: number; label: string } | undefined;
    selectedSeries: { value: string; label: string } | undefined;
    customSeriesNumber: string | undefined;
    customSeriesDate: DateObject | undefined;
    selectedTrasactionMode: string;
    selectedMiracleLedger: string;
  }>({
    checkedOptions: [],
    dropdownValue: undefined,
    selectedSeries: undefined,
    customSeriesNumber: "",
    customSeriesDate: undefined,
    selectedTrasactionMode: "",
    selectedMiracleLedger: "",
  });
  const isApproveSubmittingRef = useRef(false);
  const [conversionType, setConversionType] = useState("");
  const [buttonLoading, setButtonloding] = useState(false);
  const [isEditPageUrlModalOpen, setIsEditPageUrlModalOpen] = useState(false);
  const [isEditDesignerPageModalOpen, setIsEditDesignerPageModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "flat">(
    "percentage",
  );
  const [teamMamberist, setTeamList] = useState<any>([]);
  const [selectedTeamMamber, setSelectedTeamMamber] =
    useState<SingleValue<IOption> | null>(null);

  const [orderByIdToPrint, setOrderById] = useState<any>();
  const [isOrderShowNum1, setIsOrderShowNum1] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditOrderShow, setIsEditOrderShow] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<
    "mobile" | "name" | null
  >(null);
  const [searchCartNumber, setSearchCartNumber] = useState("");
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isDuplicateOrderLoaded, setIsDuplicateOrderLoaded] = useState(false);
  const [accountLedgerFromMiracle, setAccountLedgerFromMiracle] = useState<
    IAccountLedgerFromMiracleOptions[]
  >([]);
  const [isWhatsAppCloudLoading, setIsWhatsAppCloudLoading] = useState(false);

  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );
  const [miracleAccountLedgerIdAdv, setMiracleAccountLedgerIdAdv] = useState<
    number | null
  >(null);

  const [selectedMiracleLedgerAdv, setSelectedMiracleLedgerAdv] = useState<
    IAccountLedgerFromMiracleOptions | any
  >("");

  const [cashDiscount, setCashDiscount] = useState<string | number>("");

  const [cashDiscountType, setCashDiscountType] = useState<
    "percentage" | "flat"
  >("flat");

  useEffect(() => {
    if (approveData.checkedOptions && approveData.checkedOptions.length > 0) {
      // Guard: prevent duplicate submissions if approveData is still populated
      // during a re-render that happens before the state resets.
      if (isApproveSubmittingRef.current) return;
      isApproveSubmittingRef.current = true;

      const shouldPrint = approveData.checkedOptions.includes("opt2");
      const shouldApprove = approveData.checkedOptions.includes("opt1");
      const approveSeries = approveData.selectedSeries?.value;
      const shouldShareWhatsapp = approveData.checkedOptions.includes("opt3");
      const shouldDownlaodPdf = approveData.checkedOptions.includes("opt4");
      const shouldstartWorkFlow = approveData.checkedOptions.includes("opt5");
      const syncWithMiracle = approveData.checkedOptions.includes("opt6");
      const enteredSeriesNumber = approveData.customSeriesNumber || "";
      const enteredSeriesDate = approveData.customSeriesDate
        ? formatDateSendDataBase(approveData.customSeriesDate?.toDate())
        : "";
      const transaction_mode = approveData.selectedTrasactionMode || "";
      const selectedMiracleLedger_main =
        approveData.selectedMiracleLedger || "";

      // Reset approveData immediately (all closure values are already captured
      // in local variables above, so this is safe).
      setApproveData({
        checkedOptions: [],
        dropdownValue: undefined,
        selectedSeries: undefined,
        customSeriesNumber: "",
        customSeriesDate: undefined,
        selectedTrasactionMode: "",
        selectedMiracleLedger: "",
      });

      if (shouldApprove) {
        onSubmit(
          shouldPrint,
          shouldShareWhatsapp,
          shouldDownlaodPdf,
          shouldstartWorkFlow,
          approveSeries,
          enteredSeriesNumber,
          enteredSeriesDate,
          transaction_mode,
          selectedMiracleLedger_main,
          syncWithMiracle,
        );
      } else if (shouldPrint) {
        onSubmit(
          true,
          shouldShareWhatsapp,
          shouldDownlaodPdf,
          undefined,
          "",
          enteredSeriesNumber,
          enteredSeriesDate,
          transaction_mode,
          selectedMiracleLedger_main,
          syncWithMiracle,
        );
      }
    } else {
      // Reset the guard once approveData is cleared, ready for next approval.
      isApproveSubmittingRef.current = false;
    }
  }, [approveData]);

  useEffect(() => {
    if (isConversionSuccess && isOrderShowNum == 1) {
      if (conversionType === "proforma") {
        setnewOrderShowNumAfterConversion(12); // 1 = quotation => 12 = proforma invoice
        onConversionSuccess?.(12);
      } else if (conversionType === "invoice") {
        setnewOrderShowNumAfterConversion(3); // 1 = quotation => 3 = sales invoice
        onConversionSuccess?.(3);
      } else {
        setnewOrderShowNumAfterConversion(2); // 1 = quotation => 2 = sales order
        onConversionSuccess?.(2);
      }
    } else if (
      isConversionSuccess &&
      isOrderShowNum == 2 &&
      conversionType === "invoice"
    ) {
      setnewOrderShowNumAfterConversion(3); // 2 = sales order => 3 = sales Invoice
      onConversionSuccess?.(3);
    } else if (
      isConversionSuccess &&
      isOrderShowNum == 3 &&
      conversionType === "returnSalesInvoice"
    ) {
      setnewOrderShowNumAfterConversion(6); // 3 = sales invoice => 6 = return sales invoice
      onConversionSuccess?.(6);
    } else if (
      isConversionSuccess &&
      isOrderShowNum == 4 &&
      conversionType === "returnPurchaseInvoice"
    ) {
      setnewOrderShowNumAfterConversion(7); // 4 = purchase invoice => 7 = return purchase invoice
      onConversionSuccess?.(7);
    } else if (
      isConversionSuccess &&
      isOrderShowNum == 5 &&
      conversionType === "purchaseInvoice"
    ) {
      setnewOrderShowNumAfterConversion(4); // 5 = purchase order => 4 = purchase invoice
      onConversionSuccess?.(4);
    } else if (
      isConversionSuccess &&
      isOrderShowNum == 2 &&
      conversionType === "dispatch"
    ) {
      setnewOrderShowNumAfterConversion(9); // 2 = sales order => 9 = Dispatch
      onConversionSuccess?.(9);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 5 &&
      conversionType === "Inward"
    ) {
      setnewOrderShowNumAfterConversion(8); // 5 = purchase order => 8 = Inward
      onConversionSuccess?.(8);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 9 &&
      conversionType === "invoice"
    ) {
      setnewOrderShowNumAfterConversion(3); // 9 = Dispatch => 3 = Invoice
      onConversionSuccess?.(3);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 8 &&
      conversionType === "purchaseInvoice"
    ) {
      setnewOrderShowNumAfterConversion(4); // 8 = Inward => 4 = purchase invoice
      onConversionSuccess?.(4);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 12 &&
      conversionType === "invoice"
    ) {
      setnewOrderShowNumAfterConversion(3); // 12 = Proforma => 3 = Invoice
      onConversionSuccess?.(3);
    }
  }, [isConversionSuccess]);

  useEffect(() => {
    if (isConversionSuccess) {
      setTimeout(() => {
        setIsConversionSuccess(false);
      }, 2000);
    }
  }, [isConversionSuccess]);

  const canViewPrintSetting = useCheckUserPermission(
    PAGE_ID.PRINT_SETTINGS_RIGHTS,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.VIEW,
  );
  const canApproveQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.APPROVE,
  );
  const canApproveProfomaInvoice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.APPROVE,
  );
  const canApproveReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.APPROVE,
  );
  const canApproveReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.APPROVE,
  );

  const canApproveOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.APPROVE,
  );
  const canApproveInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.APPROVE,
  );
  const canApprovePurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.APPROVE,
  );
  const canEditQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.EDIT,
  );
  const canEditProfomaInvoice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.EDIT,
  );
  const canEditReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.EDIT,
  );
  const canEditReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.EDIT,
  );
  const canEditInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.EDIT,
  );
  const canEditDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.EDIT,
  );
  const canEditOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.EDIT,
  );
  const canEditInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.EDIT,
  );
  const canEditPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.EDIT,
  );

  // Parchase Order Rights Start
  const canEditPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.EDIT,
  );

  const canApprovePurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.APPROVE,
  );

  const canPrintPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.PRINT,
  );

  const canPdfPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.PRINT,
  );

  const canPdfReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.SHARE,
  );
  //  Parchase Order Rights End

  const canPrintInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintProfomaInovice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.PRINT,
  );
  const canPrintPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.PRINT,
  );
  const canPdfInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfProfomaInvoice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.SHARE,
  );

  const canAddProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.ADD,
  );
  const canApproveInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.APPROVE,
  );
  const canApproveDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.APPROVE,
  );

  const [cartItemDelete, setCartItemDelete] = useState<
    { cart_item_id_del: number }[]
  >([]);
  // order Type 10 = Stock Inward and 11 = Stock Outward so do not use this two type he is work in direactly backend side
  const orderTypesList = [
    { id: "1", order_type: "Quotation" },
    { id: "2", order_type: "Sales Order" },
    { id: "3", order_type: "Sales Invoice" },
    { id: "4", order_type: "Purchase Invoice" },
    { id: "5", order_type: "Purchase Order" },
    { id: "6", order_type: "Return Sales Invoice" },
    { id: "7", order_type: "Return Purchase Invoice" },
    { id: "8", order_type: "Inward" },
    { id: "9", order_type: "Dispatch" },
    { id: "12", order_type: "Proforma Invoice" },
  ];

  useEffect(() => {
    if (show) {
      setSelectedTeamMamber(null);
      const formTypeMap: Record<number, number> = {
        1: 5,
        2: 6,
        3: 7,
        4: 8,
        5: 9,
        6: 10,
        7: 11,
        8: 12,
        9: 13,
      };
      const formType =
        formTypeMap[newOrderShowNumAfterConversion || isOrderShowNum];

      const fetchInitialData = async () => {
        try {
          await Promise.allSettled([
            fetchCustomInqFromApi(setCustomFormList, formType),
            fetchCustomProductFromApi(setCustomFormListProduct, formType),
            fetchCompanyForTerms(setPrintDate, setisOrderClassification),
            canViewProduct
              ? fetchProductApiForOrder(
                0,
                ITEMS_PER_PAGE,
                searchTerm,
                searchBarcodeNum,
                selectedCategory,
                selectedPriceList,
                Contact,
                setProductList,
                isOrderShowNum,
                1,
                isPriceListTouched,
              )
              : Promise.resolve(),
            searchInputRef.current?.focus(),
            canViewCategory
              ? fetchCategoryApiForOrder(setCategoryList)
              : Promise.resolve(),
            fetchpricelistForOrder(
              setPriceList,
              setSelectedPriceList,
              pricelistOptions,
              Contact,
            ),
            fetchContactDetail(contact_id, setContactDetail),
            fetchCurrency(setCurrency),
            fetchAllTeamMamberApi(),
            fetchwrehouse(setWarehouse),
            fetchOrderId(setOrderbyidList, converCartId || orderId),
            fetchPaymentTypeApi(setPaymentTypeList),
          ]);

          if (!orderById || !orderById.cart) {
            setConversionRate(1);
            searchInputRef.current?.focus();
          }

          const cartProductIds = cart
            .filter((item) => item.id)
            .map((item) => item.id);
        } catch (error) {
          console.error("Error fetching initial data:", error);
        }
      };

      fetchInitialData();
      fetchLastPartyDetailProvider();
    }
  }, [show, isOrderShowNum, newOrderShowNumAfterConversion]);

  const fetchLastPartyDetailProvider = async () => {
    if (!orderById && Contact) {
      const contact_id = orderId ? Contact?.to_customer_id : Contact?.id;

      const { customFormFiledValues, cartValues } =
        await fetchLastPartyCommonDetail({
          contact_id,
          type: isOrderShowNum,
        });

      // Terms & Condition
      if (!companyDetail?.[0]) {
        if (cartValues?.cart_terms_and_condition) {
          setCartTermsAndCondition(
            cartValues?.cart_terms_and_condition
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<[^>]*>/g, ""),
          );
        }
      }

      // Default values
      if (cartValues?.cart_remark) {
        setCartRemark(
          cartValues?.cart_remark
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, ""),
        );
      }

      if (cartValues?.cart_note) {
        setCartNote(
          cartValues?.cart_note
            ?.replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "") ?? "",
        );
      }

      if (customFormFiledValues.length > 0) {
        customFormFiledValues.map((v: ICustomFormFiledValuesLastParty) => {
          if (v.value) {
            handleCartCustomFieldChange(v.fieldName, v.value, v.dataType);
          }
        });
      }
    }
  };

  useEffect(() => {
    if (show) {
      const timeout = setTimeout(() => {
        fetchProductApiForOrder(
          0,
          ITEMS_PER_PAGE,
          searchTerm,
          searchBarcodeNum,
          selectedCategory,
          selectedPriceList,
          Contact,
          setProductList,
          isOrderShowNum,
          2,
          isPriceListTouched,
        );
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [show, searchTerm, searchBarcodeNum, selectedCategory, selectedPriceList]);

  useEffect(() => {
    if (companyDetail && companyDetail.length > 0) {
      const firstItem = companyDetail[0];
      const rawTerms =
        typeof firstItem === "string"
          ? firstItem
          : firstItem?.terms_and_condition || "";
      if (rawTerms) {
        const cleanedTerms = rawTerms
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "");
        setCartTermsAndCondition(cleanedTerms);
        setCartRemark(cleanedTerms);
      }
    }
  }, [companyDetail]);

  useEffect(() => {
    if (orderById && orderById.items) {
      const formattedItems = orderById.items.map((item: ICartItem) => ({
        id: item.item_product_id,
        product_name: item.item_product_name,
        hsn_code: item.item_hsn_code,
        warehouse_id: item.item_warehouse_id || 0,
        product_code: item.item_product_code,
        product_description: item.item_product_description,
        net_rate: item.item_net_rate,
        product_inner_qty: item.product_inner_qty || 1,
        product_outer_qty: item.product_outer_qty || 1,
        inner_qty_unit: item.inner_qty_unit || "",
        outer_qty_unit: item.outer_qty_unit || "",
        quantity: item.item_qty,
        serial_numbers: item.serial_numbers || [],
        is_serial_number: item.is_serial_number,
        item_inner_quantity: item.item_inner_quantity,
        item_outer_quantity: item.item_outer_quantity,
        item_loose_quantity: item.item_loose_quantity,
        unit: item.item_unit_name,
        cart_item_id: item.id,
        category_id: item.item_category_id,
        category_name: item.item_category_name,
        GST: item.item_gst,
        // HSN_code:item.h
        rate: item.item_rate,
        item_discount_pct: item.item_discount_pct,
        item_discount_pr: item.item_discount_pr,
        company_masters_id: orderById.cart.company_masters_id,
        a_application_login_id: orderById.cart.a_application_login_id,
        price_list_discount: item.item_discount_pct,
        price_list_dis_amt: item.item_discount_pr,
        products_column_number_1: item.products_column_number_1 || "",
        products_column_number_2: item.products_column_number_2 || "",
        products_column_number_3: item.products_column_number_3 || "",
        products_column_number_4: item.products_column_number_4 || "",
        products_column_number_5: item.products_column_number_5 || "",
        products_column_text_1: item.products_column_text_1 || "",
        products_column_text_2: item.products_column_text_2 || "",
        products_column_text_3: item.products_column_text_3 || "",
        products_column_text_4: item.products_column_text_4 || "",
        products_column_text_5: item.products_column_text_5 || "",
        products_column_text_area_1: item.products_column_text_area_1 || "",
        products_column_text_area_2: item.products_column_text_area_2 || "",
        products_column_text_area_3: item.products_column_text_area_3 || "",
        products_column_text_area_4: item.products_column_text_area_4 || "",
        products_column_text_area_5: item.products_column_text_area_5 || "",
        products_column_date_1: item.products_column_date_1 || "",
        products_column_date_2: item.products_column_date_2 || "",
        products_column_date_3: item.products_column_date_3 || "",
        products_column_date_4: item.products_column_date_4 || "",
        products_column_date_5: item.products_column_date_5 || "",
        products_column_date_and_time_1:
          item.products_column_date_and_time_1 || "",
        products_column_date_and_time_2:
          item.products_column_date_and_time_2 || "",
        products_column_date_and_time_3:
          item.products_column_date_and_time_3 || "",
        products_column_date_and_time_4:
          item.products_column_date_and_time_4 || "",
        products_column_date_and_time_5:
          item.products_column_date_and_time_5 || "",
        products_column_time_1: item.products_column_time_1 || "",
        products_column_time_2: item.products_column_time_2 || "",
        products_column_time_3: item.products_column_time_3 || "",
        products_column_time_4: item.products_column_time_4 || "",
        products_column_time_5: item.products_column_time_5 || "",
        products_column_switch_1: item.products_column_switch_1 ? 1 : 0,
        products_column_switch_2: item.products_column_switch_2 ? 1 : 0,
        products_column_switch_3: item.products_column_switch_3 ? 1 : 0,
        products_column_switch_4: item.products_column_switch_4 ? 1 : 0,
        products_column_switch_5: item.products_column_switch_5 ? 1 : 0,
        products_column_decimal_1: item.products_column_decimal_1 || "",
        products_column_decimal_2: item.products_column_decimal_2 || "",
        products_column_decimal_3: item.products_column_decimal_3 || "",
        products_column_decimal_4: item.products_column_decimal_4 || "",
        products_column_decimal_5: item.products_column_decimal_5 || "",
        products_column_dropdown_1: item.products_column_dropdown_1 || "",
        products_column_dropdown_2: item.products_column_dropdown_2 || "",
        products_column_dropdown_3: item.products_column_dropdown_3 || "",
        products_column_dropdown_4: item.products_column_dropdown_4 || "",
        products_column_dropdown_5: item.products_column_dropdown_5 || "",
        products_column_radio_1: item.products_column_radio_1 || "",
        products_column_radio_2: item.products_column_radio_2 || "",
        products_column_radio_3: item.products_column_radio_3 || "",
        products_column_radio_4: item.products_column_radio_4 || "",
        products_column_radio_5: item.products_column_radio_5 || "",
      }));
      setCart(formattedItems);
    }
    if (
      (isOrderShowNum === 9 || isOrderShowNum === 8) &&
      orderById?.cart?.referance_cart_id
    ) {
      const origQty: Record<number, number> = {};
      orderById.items.forEach((item: ICartItem) => {
        origQty[item.item_product_id] = item.item_qty;
      });
      setOriginalQuantities(origQty);
    }

    if (orderById && orderById.cart) {
      setCartId(orderById.cart.id);
      setDiscount(orderById.cart.discount_pct ?? 0);
      setCartNumber(orderById.cart.cart_number ?? "");
      setSRNumber(orderById.cart.sr_by_number ?? "");
      setUpdateDate(convertUTCToLocal(orderById.cart.update_Date_time) ?? "");
      setOldUpdateDate(orderById.cart.update_Date_time ?? "");
      setOldNumber(orderById.cart.sr_by_number ?? "");
      setOrderNumber(orderById.cart.cart_number ?? "");
      setDefaultSeriesPrefix(orderById.cart.sr_by_prifix || "");
      setPackingForwardingCharge(orderById.cart.packing_forwarding_charge ?? 0);
      setPackingForwardingChargeTitle(
        orderById.cart.packing_forwarding_charge_title ??
        "Packing Forwarding charge",
      );
      setTransportCharge(orderById.cart.transport_charge ?? 0);
      setTransportChargeTitle(
        orderById.cart.transport_charge_title ?? "Transport charge",
      );
      setDynamicTCSTitle(orderById.cart.tcs_title ?? "TCS");
      setDynamicTCSRate(orderById.cart.tcs_percentage ?? DEFAULT_TCS);
      setGrandTotal(orderById.cart.grand_total ?? 0);
      setCashDiscount(orderById.cart.cash_discount ?? 0);
      setCashDiscountType(
        Number(orderById.cart.cash_discount_type) == 1 ? "percentage" : "flat",
      );
      setIsTcsActive(!!orderById.cart.tcs_amt);
      setTcsAmount(orderById.cart.tcs_amt ?? 0);
      setIsGstActive(
        orderById.cart.gst_amt !== null &&
        orderById.cart.gst_amt !== undefined &&
        orderById.cart.gst_amt > 0,
      );
      setGstAmount(orderById.cart.gst_amt ?? 0);
      setRoundOffAmount(orderById.cart.round_off ?? 0);
      setCartRemark(
        orderById.cart.cart_remark
          ?.replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "") ?? "",
      );

      setConversionRate(orderById.cart.conversion_rate ?? 1);
      setAdvancePayment(orderById.cart.advance_payment ?? "");
      setSelectedPaymentMode(orderById.cart.payment_type ?? "");
      setSelectedMiracleLedgerAdv(
        orderById.cart.miracle_account_ledger_adv ?? "",
      );
      setCartTermsAndCondition(
        orderById.cart.cart_terms_and_condition
          ?.replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "") ?? "",
      );
      setCartNote(
        orderById.cart.cart_note
          ?.replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "") ?? "",
      );

      if (orderById.cart.due_date && orderById.cart.due_date != "0000-00-00") {
        setCartDueDate(
          new DateObject({
            date: orderById.cart.due_date,
            format: "YYYY-MM-DD",
          }),
        );
      }

      const initialCustomFieldValues: Record<string, any> = {};
      customFormList.forEach((field) => {
        const fieldName = field.reference_column_name;
        const value = orderById.cart[fieldName];
        initialCustomFieldValues[fieldName] =
          value !== undefined && value !== null
            ? field.data_type === 5
              ? formatDateTimeForInput(value)
              : field.data_type === 7
                ? value === true || value === 1 || value === "1"
                  ? 1
                  : 0
                : value
            : field.data_type === 7
              ? 0
              : "";
      });
      setCartCustomFieldValues(initialCustomFieldValues);
    }
  }, [orderById, customFormList]);

  // handleLoadOrder ME YE CHANGES KARO

  const handleLoadOrder = async () => {
    if (!searchCartNumber.trim()) {
      toast.error("Please enter order number");
      return;
    }

    try {
      setIsLoadingOrder(true);

      const response = await fetchOrderByCartNumber(
        searchCartNumber,
        setOrderbyidList,
        isOrderShowNum,
      );

      if (!response) return;

      // customer reset
      setNew_customer_name("");
      setNew_customer_mobile("");

      // IMPORTANT RESET
      setSRNumber(0);
      setCartNumber("");
      setOrderNumber("");
      setUpdateDate("");

      // hide SR No + Date fields
      setIsDuplicateOrderLoaded(true);

      // reset search textbox
      setSearchCartNumber("");

      toast.success("Order loaded successfully");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  useEffect(() => {
    if (orderbyidList && orderbyidList.items) {
      const formattedItems = orderbyidList.items.map((item: ICartItem) => ({
        id: item.item_product_id,
        product_name: item.item_product_name,
        hsn_code: item.item_hsn_code,
        product_code: item.item_product_code,
        product_description: item.item_product_description,
        net_rate: item.item_net_rate,
        product_inner_qty: item.product_inner_qty || 1,
        product_outer_qty: item.product_outer_qty || 1,
        inner_qty_unit: item.inner_qty_unit || "",
        outer_qty_unit: item.outer_qty_unit || "",
        quantity: item.item_qty,
        serial_numbers: item.serial_numbers || [],
        is_serial_number: item.is_serial_number,
        item_inner_quantity: item.item_inner_quantity,
        item_outer_quantity: item.item_outer_quantity,
        item_loose_quantity: item.item_loose_quantity,
        unit: item.item_unit_name,
        cart_item_id: item.id,
        category_id: item.item_category_id,
        category_name: item.item_category_name,
        GST: item.item_gst,
        rate: item.item_rate,
        item_discount_pct: item.item_discount_pct,
        item_discount_pr: item.item_discount_pr,
        company_masters_id: orderbyidList.cart.company_masters_id,
        a_application_login_id: orderbyidList.cart.a_application_login_id,
        price_list_discount: item.item_discount_pct,
        price_list_dis_amt: item.item_discount_pr,
        products_column_number_1: item.products_column_number_1 || "",
        products_column_number_2: item.products_column_number_2 || "",
        products_column_number_3: item.products_column_number_3 || "",
        products_column_number_4: item.products_column_number_4 || "",
        products_column_number_5: item.products_column_number_5 || "",
        products_column_text_1: item.products_column_text_1 || "",
        products_column_text_2: item.products_column_text_2 || "",
        products_column_text_3: item.products_column_text_3 || "",
        products_column_text_4: item.products_column_text_4 || "",
        products_column_text_5: item.products_column_text_5 || "",
        products_column_text_area_1: item.products_column_text_area_1 || "",
        products_column_text_area_2: item.products_column_text_area_2 || "",
        products_column_text_area_3: item.products_column_text_area_3 || "",
        products_column_text_area_4: item.products_column_text_area_4 || "",
        products_column_text_area_5: item.products_column_text_area_5 || "",
        products_column_date_1: item.products_column_date_1 || "",
        products_column_date_2: item.products_column_date_2 || "",
        products_column_date_3: item.products_column_date_3 || "",
        products_column_date_4: item.products_column_date_4 || "",
        products_column_date_5: item.products_column_date_5 || "",
        products_column_date_and_time_1:
          item.products_column_date_and_time_1 || "",
        products_column_date_and_time_2:
          item.products_column_date_and_time_2 || "",
        products_column_date_and_time_3:
          item.products_column_date_and_time_3 || "",
        products_column_date_and_time_4:
          item.products_column_date_and_time_4 || "",
        products_column_date_and_time_5:
          item.products_column_date_and_time_5 || "",
        products_column_time_1: item.products_column_time_1 || "",
        products_column_time_2: item.products_column_time_2 || "",
        products_column_time_3: item.products_column_time_3 || "",
        products_column_time_4: item.products_column_time_4 || "",
        products_column_time_5: item.products_column_time_5 || "",
        products_column_switch_1: item.products_column_switch_1 ? 1 : 0,
        products_column_switch_2: item.products_column_switch_2 ? 1 : 0,
        products_column_switch_3: item.products_column_switch_3 ? 1 : 0,
        products_column_switch_4: item.products_column_switch_4 ? 1 : 0,
        products_column_switch_5: item.products_column_switch_5 ? 1 : 0,
        products_column_decimal_1: item.products_column_decimal_1 || "",
        products_column_decimal_2: item.products_column_decimal_2 || "",
        products_column_decimal_3: item.products_column_decimal_3 || "",
        products_column_decimal_4: item.products_column_decimal_4 || "",
        products_column_decimal_5: item.products_column_decimal_5 || "",
        products_column_dropdown_1: item.products_column_dropdown_1 || "",
        products_column_dropdown_2: item.products_column_dropdown_2 || "",
        products_column_dropdown_3: item.products_column_dropdown_3 || "",
        products_column_dropdown_4: item.products_column_dropdown_4 || "",
        products_column_dropdown_5: item.products_column_dropdown_5 || "",
        products_column_radio_1: item.products_column_radio_1 || "",
        products_column_radio_2: item.products_column_radio_2 || "",
        products_column_radio_3: item.products_column_radio_3 || "",
        products_column_radio_4: item.products_column_radio_4 || "",
        products_column_radio_5: item.products_column_radio_5 || "",
      }));
      setCart(formattedItems);
    }

    if (
      (isOrderShowNum === 9 || isOrderShowNum === 8) &&
      orderbyidList &&
      orderbyidList?.cart?.referance_cart_id
    ) {
      const origQty: Record<number, number> = {};
      orderbyidList.items.forEach((item: ICartItem) => {
        origQty[item.item_product_id] = item.item_qty;
      });
      setOriginalQuantities(origQty);
    }
    if (orderbyidList && orderbyidList.cart) {
      setCartId(orderbyidList.cart.id);
      setDiscount(orderbyidList.cart.discount_pct ?? 0);
      // setCartNumber(orderbyidList.cart.cart_number ?? "");
      // setSRNumber(orderbyidList.cart.sr_by_number ?? "");
      // setUpdateDate(
      //   convertUTCToLocal(orderbyidList.cart.update_Date_time) ?? "",
      // );
      // setOrderNumber(orderbyidList.cart.cart_number ?? "");
      if (!isDuplicateOrderLoaded) {
        setCartNumber(orderbyidList.cart.cart_number ?? "");
        setSRNumber(orderbyidList.cart.sr_by_number ?? "");
        setUpdateDate(
          convertUTCToLocal(orderbyidList.cart.update_Date_time) ?? "",
        );
        setOrderNumber(orderbyidList.cart.cart_number ?? "");
      }
      setOldNumber(orderbyidList.cart.sr_by_number ?? "");
      setDefaultSeriesPrefix(orderbyidList.cart.sr_by_prifix || "");

      setPackingForwardingCharge(
        orderbyidList.cart.packing_forwarding_charge ?? 0,
      );
      setPackingForwardingChargeTitle(
        orderbyidList.cart.packing_forwarding_charge_title ??
        "Packing Forwarding charge",
      );
      setDynamicTCSTitle(orderbyidList.cart.tcs_title ?? "TCS");
      setDynamicTCSRate(orderbyidList.cart.tcs_percentage ?? DEFAULT_TCS);

      setTransportCharge(orderbyidList.cart.transport_charge ?? 0);
      setCashDiscount(orderbyidList.cart.cash_discount ?? 0);
      setCashDiscountType(
        Number(orderbyidList.cart.cash_discount_type) == 1
          ? "percentage"
          : "flat",
      );
      setTransportChargeTitle(
        orderbyidList.cart.transport_charge_title ?? "Transport charge",
      );
      setGrandTotal(orderbyidList.cart.grand_total ?? 0);
      setIsTcsActive(!!orderbyidList.cart.tcs_amt);
      setTcsAmount(orderbyidList.cart.tcs_amt ?? 0);
      setIsGstActive(
        orderbyidList.cart.gst_amt !== null &&
        orderbyidList.cart.gst_amt !== undefined &&
        orderbyidList.cart.gst_amt >= 0,
      );
      setGstAmount(orderbyidList.cart.gst_amt ?? 0);
      setRoundOffAmount(orderbyidList.cart.round_off ?? 0);
      setCartRemark(orderbyidList.cart.cart_remark ?? "");
      setConversionRate(orderbyidList.cart.conversion_rate ?? 1);
      setAdvancePayment(orderbyidList.cart.advance_payment ?? "");
      setSelectedPaymentMode(orderbyidList.cart.payment_type ?? "");
      setSelectedMiracleLedgerAdv(
        orderbyidList.cart.miracle_account_ledger_adv ?? "",
      );
      setCartTermsAndCondition(
        orderbyidList.cart.cart_terms_and_condition
          ?.replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "") ?? "",
      );
      setCartNote(
        orderbyidList.cart.cart_note
          ?.replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "") ?? "",
      );

      if (
        orderbyidList.cart.due_date &&
        orderbyidList.cart.due_date != "0000-00-00"
      ) {
        setCartDueDate(
          new DateObject({
            date: orderbyidList.cart.due_date,
            format: "YYYY-MM-DD",
          }),
        );
      }

      const initialCustomFieldValues: Record<string, any> = {};
      customFormList.forEach((field) => {
        const fieldName = field.reference_column_name;
        const value = orderbyidList.cart[fieldName];
        initialCustomFieldValues[fieldName] =
          value !== undefined && value !== null
            ? field.data_type === 5
              ? formatDateTimeForInput(value)
              : field.data_type === 7
                ? value === true || value === 1 || value === "1"
                  ? 1
                  : 0
                : value
            : field.data_type === 7
              ? 0
              : "";
      });

      setCartCustomFieldValues(initialCustomFieldValues);
    }
  }, [orderbyidList, customFormList]);

  const isEditMode = !!orderById?.cart?.id;

  useEffect(() => {
    if (orderbyidList?.cart?.update_Date_time) {
      const localDateTime = convertUTCToLocal(
        orderbyidList.cart.update_Date_time,
      );
      setUpdateDate(localDateTime);
      setOriginalUpdateDate(orderbyidList.cart.update_Date_time); // Store original UTC value
    }
  }, [orderbyidList]);

  const addToCart = (item: ICart) => {
    if (
      (isOrderShowNum === 9 || isOrderShowNum === 8) &&
      (orderById?.cart?.referance_cart_id ||
        orderbyidList?.cart?.referance_cart_id)
    ) {
      toast.error("Cannot add new products to Dispatch with reference order");
      return;
    }

    // const initialRate =
    //   item?.price_list_rate && Number(item.price_list_rate) > 0
    //     ? Number(item.price_list_rate)
    //     : Number(item.rate) || 0;
    const initialRate = Number(item.rate) || 0;

    const initialDiscountValue =
      discountType === "percentage"
        ? Number(item.price_list_discount) || 0
        : Number(item.price_list_dis_amt) || 0;

    const result = calculateNetRate(
      initialRate,
      initialDiscountValue,
      Number(item.GST) || 0,
      discountType,
    );

    const isSerialConversion =
      item.is_serial_number === 2 &&
      (([3, 9].includes(Number(isOrderShowNum)) &&
        orderbyidList?.cart?.reference_type == 2) ||
        ([4, 8].includes(Number(isOrderShowNum)) &&
          orderbyidList?.cart?.reference_type == 5));

    setCart((prevCart) => [
      ...prevCart,
      {
        ...item,
        quantity: isSerialConversion ? 0 : item.is_serial_number == 2 ? 1 : 1,
        rate: initialRate.toFixed(2),
        item_discount_pct: result.discountPercent, // always percentage
        item_discount_pr: result.discountAmount, // always ₹ amount
        net_rate: result.net,
        warehouse_id:
          orderTypesNameFind !== "Quotation" &&
            orderTypesNameFind !== "Proforma Invoice" &&
            orderTypesNameFind !== "Sales Order" &&
            orderTypesNameFind !== "Sales Invoice" &&
            orderTypesNameFind !== "Purchase Order"
            ? (defaultWarehouse?.value ?? -1)
            : undefined,
      },
    ]);
  };

  // const handleQuantityChange = (index: number, newQuantity: number) => {
  //   const updatedCart = [...cart];
  //   updatedCart[index].quantity = newQuantity > 0 ? newQuantity : 1;
  //   setCart(updatedCart);
  // };

  // const handleQuantityChange = (index: number, newQuantity: number) => {
  //   const updatedCart = [...cart];
  //   const currentItem = updatedCart[index];

  //   // Decimal not allowed
  //   if (currentItem.is_point_value_allow !== 1) {
  //     if (!Number.isInteger(newQuantity)) {
  //       toast.error("Decimal quantity is not allowed for this item");
  //       return;
  //     }
  //   }

  //   if (
  //     (isOrderShowNum === 9 || isOrderShowNum === 8) &&
  //     (orderById?.cart?.referance_cart_id ||
  //       orderbyidList?.cart?.referance_cart_id)
  //   ) {
  //     const originalQty = originalQuantities[currentItem.id];

  //     if (originalQty !== undefined && newQuantity > originalQty) {
  //       toast.error(`Only ${originalQty} quantity is remaining`);
  //       return;
  //     }
  //   }

  //   updatedCart[index].quantity = newQuantity;
  //   setCart(updatedCart);
  // };

  // const handleQuantityChange = (index: number, newQuantity: number) => {
  //   const updatedCart = [...cart];
  //   const currentItem = updatedCart[index];

  //   if (!currentItem) return;

  //   // 🔹 Convert order type safely to number
  //   const orderType = Number(isOrderShowNum);

  //   // 🔹 Decimal validation
  //   if (currentItem.is_point_value_allow !== 1) {
  //     if (!Number.isInteger(newQuantity)) {
  //       toast.error("Decimal quantity is not allowed for this item");
  //       return;
  //     }
  //   }

  //   // 🔹 Reference order validation (for type 8 & 9)
  //   if (
  //     (orderType === 8 || orderType === 9) &&
  //     (orderById?.cart?.referance_cart_id ||
  //       orderbyidList?.cart?.referance_cart_id)
  //   ) {
  //     const originalQty = originalQuantities[currentItem.id];

  //     if (
  //       originalQty !== undefined &&
  //       newQuantity > originalQty &&
  //       newQuantity > currentItem.quantity // allow decrease but not increase
  //     ) {
  //       toast.error(`Only ${originalQty} quantity is remaining`);
  //       return;
  //     }
  //   }

  //   // 🔹 Product multipliers
  //   const productInner = Number(currentItem.product_inner_qty) || 1;
  //   const productOuter = Number(currentItem.product_outer_qty) || 1;

  //   // 🔥 Reverse Calculation Logic
  //   const calculatedInner =
  //     productInner > 0 ? Math.floor(newQuantity / productInner) : 0;

  //   const calculatedOuter =
  //     productOuter > 0 ? Math.floor(newQuantity / productOuter) : 0;

  //   // 🔹 Update item
  //   updatedCart[index] = {
  //     ...currentItem,
  //     quantity: newQuantity,
  //     item_inner_quantity: calculatedInner,
  //     item_outer_quantity: calculatedOuter,
  //   };

  //   setCart(updatedCart);
  // };

  const updatePackingQuantities = (item: any, quantity: number) => {
    const innerPack = Number(item.product_inner_qty) || 1;
    const outerPack = Number(item.product_outer_qty) || 1;

    let outerQty = 0;
    let innerQty = 0;
    let looseQty = 0;

    // CASE 2 → ONLY INNER
    if (isOrderClassification === 2) {
      innerQty = Math.floor(quantity / innerPack);
      looseQty = quantity - innerQty * innerPack;
    }

    // CASE 3 → ONLY OUTER
    else if (isOrderClassification === 3) {
      outerQty = Math.floor(quantity / outerPack);
      looseQty = quantity - outerQty * outerPack;
    }

    // CASE 4 → INNER + OUTER
    else if (isOrderClassification === 4) {
      outerQty = Math.floor(quantity / outerPack);

      const remaining = quantity - outerQty * outerPack;

      innerQty = Math.floor(remaining / innerPack);

      const used = outerQty * outerPack + innerQty * innerPack;

      looseQty = quantity - used;
    }

    return {
      quantity,
      item_inner_quantity: innerQty,
      item_outer_quantity: outerQty,
      item_loose_quantity: looseQty,
    };
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const updatedCart = [...cart];
    const currentItem = updatedCart[index];

    if (!currentItem) return;

    const orderType = Number(isOrderShowNum);

    //  Decimal restriction
    if (currentItem.is_point_value_allow !== 1) {
      if (!Number.isInteger(newQuantity)) {
        toast.error("Decimal quantity is not allowed for this item");
        return;
      }
    }

    //  8 & 9 restriction
    if (
      (orderType === 8 || orderType === 9) &&
      (orderById?.cart?.referance_cart_id ||
        orderbyidList?.cart?.referance_cart_id)
    ) {
      const originalQty = originalQuantities[currentItem.id];

      if (
        originalQty !== undefined &&
        newQuantity > originalQty &&
        newQuantity > currentItem.quantity
      ) {
        toast.error(`Only ${originalQty} quantity is remaining`);
        return;
      }
    }

    const innerPack = Number(currentItem.product_inner_qty) || 1;
    const outerPack = Number(currentItem.product_outer_qty) || 1;

    let outerQty = 0;
    let innerQty = 0;
    let looseQty = 0;

    // -----------------------------
    // CASE 2 → ONLY INNER
    // -----------------------------
    if (isOrderClassification === 2) {
      innerQty = Math.floor(newQuantity / innerPack);
      looseQty = newQuantity - innerQty * innerPack;
    }

    // -----------------------------
    // CASE 3 → ONLY OUTER
    // -----------------------------
    else if (isOrderClassification === 3) {
      outerQty = Math.floor(newQuantity / outerPack);
      looseQty = newQuantity - outerQty * outerPack;
    }

    // -----------------------------
    // CASE 4 → INNER + OUTER
    // -----------------------------
    else if (isOrderClassification === 4) {
      outerQty = Math.floor(newQuantity / outerPack);

      const remaining = newQuantity - outerQty * outerPack;

      innerQty = Math.floor(remaining / innerPack);

      const used = outerQty * outerPack + innerQty * innerPack;

      looseQty = newQuantity - used;
    }
    const result = calculateNetRate(
      Number(currentItem.rate),
      discountType === "percentage"
        ? Number(currentItem.item_discount_pct)
        : Number(currentItem.item_discount_pr),
      Number(currentItem.GST) || 0,
      discountType,
    );
    updatedCart[index] = {
      ...currentItem,
      quantity: newQuantity,
      item_inner_quantity: innerQty,
      item_outer_quantity: outerQty,
      item_loose_quantity: looseQty,
      net_rate: result.net, // ← Updated
      item_discount_pct: result.discountPercent,
      item_discount_pr: result.discountAmount,
    };

    setCart(updatedCart);
  };
  const handleDescriptionChange = (index: number, value: string) => {
    const updatedCart = [...cart];
    updatedCart[index].product_description = value;
    setCart(updatedCart);
  };

  const calculateAmount = (
    rate: number | string,
    quantity: number | string,
    discountInput: number | string, // This is item.item_discount_pct when percentage
    discountType: "percentage" | "flat",
    discountPr?: number | string, // This is item.item_discount_pr when flat
  ) => {
    const r = Number(rate) || 0;
    const qty = Number(quantity) || 1;

    let discountPerUnit = 0;

    if (discountType === "percentage") {
      const discountPct = Number(discountInput) || 0;
      discountPerUnit = (r * discountPct) / 100;
    } else {
      // Flat discount
      discountPerUnit = Number(discountPr) || 0;
    }

    const amountBeforeGst = Math.max(0, r - discountPerUnit);
    const finalAmount = amountBeforeGst * qty;

    return Number(finalAmount.toFixed(2));
  };

  const isProductInCart = (itemId: number) => {
    return cart.some((cartItem) => cartItem.id === itemId);
  };

  // const handleRemoveItem = (removeItem: any, indexToRemove: number) => {
  //   if (orderById && orderById.cart) {
  //     setIsDeleteConfirmation(true);
  //     setCartItemDelete((prevDeletedIds) => [
  //       ...prevDeletedIds,
  //       { cart_item_id_del: removeItem.cart_item_id },
  //     ]);
  //   }
  //   setCart((prevCart) =>
  //     prevCart.filter((_, index) => index !== indexToRemove)
  //   );
  // };
  const check = useSalesDependencyGuard((s) => s.check);
  /* When Your are remove Product into Order List code Start*/
  const handleRemoveItem = async (removeItem: any, indexToRemove: number) => {
    if (orderById) {
      const cartId = orderById?.cart?.id ?? orderById;

      const result = await check(isOrderShowNum as ModuleType, cartId);
      if (!result.data.canDelete) {
        toast.error(result.data.msg);
        return;
      }
    }

    if (orderById && orderById.cart) {
      setItemToDelete({ item: removeItem, index: indexToRemove });
      setIsDeleteConfirmation(true);
      return;
      /* aa else if atla mate muki che order mathi items remove kari tyare props mathi only id avse */
    } else if (orderById) {
      setItemToDelete({ item: removeItem, index: indexToRemove });
      setIsDeleteConfirmation(true);
      return;
    }
    setCart((prevCart) =>
      prevCart.filter((_, index) => index !== indexToRemove),
    );
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const { item, index } = itemToDelete;

    if (item.cart_item_id) {
      setCartItemDelete((prev) => [
        ...prev,
        { cart_item_id_del: item.cart_item_id },
      ]);
    }

    setCart((prevCart) => prevCart.filter((_, i) => i !== index));

    setIsDeleteConfirmation(false);
    setItemToDelete(null);
  };
  /* When Your are remove Product into Order List code END */
  const handleHide = () => {
    setCart([]);
    setDiscount(0);
    setPackingForwardingCharge(0);
    setTransportCharge(0);
    setTcsAmount(0);
    setGstAmount(0);
    setGrandTotal(0);
    setCashDiscount(0);
    setCashDiscountType("percentage");
    setRoundOffAmount(0);
    setCartItemDelete([]);
    setIsTcsActive(false);
    setSelectedCategory("");
    setCartRemark("");
    setCartTermsAndCondition("");
    setCartNote("");
    setCartDueDate(undefined);
    setCustomFormList([]);
    setConversionRate(1);
    setCartCustomFieldValues({});
    onHide();
    setHighlightedProductId(null);
    setSearchTerm("");
    setSearchBarcodeNum(0);
    setIsBarcode(false);
    setIsCloseConfirmation(false);
    setIsRefreshReport(false);
    setCartIdPrint(0);
    setAdvancePayment("");
    setConverCartId(undefined);
    setnewOrderShowNumAfterConversion(undefined);
    setSelectedPaymentMode("");
    setSelectedMiracleLedgerAdv("");
  };

  const handleClear = () => {
    setCart([]);
    setDiscount(0);
    setPackingForwardingCharge(0);
    setTransportCharge(0);
    setTcsAmount(0);
    setGstAmount(0);
    setGrandTotal(0);
    setCashDiscount(0);
    setCashDiscountType("percentage");
    setRoundOffAmount(0);
    setCartItemDelete([]);
    setIsTcsActive(false);
    setSelectedCategory("");
    setCartRemark("");
    setCartTermsAndCondition("");
    setCartNote("");
    setCartDueDate(undefined);
    setCustomFormList([]);
    setConversionRate(1);
    setCartCustomFieldValues({});
    setHighlightedProductId(null);
    setSearchTerm("");
    setSearchBarcodeNum(0);
    setIsBarcode(false);
    setIsCloseConfirmation(false);
    setIsRefreshReport(false);
    setCartIdPrint(0);
    setNew_customer_name("");
    setNew_customer_mobile("");
    setAdvancePayment("");
    setConverCartId(undefined);
    setnewOrderShowNumAfterConversion(undefined);
    setSelectedPaymentMode("");
    setSelectedMiracleLedgerAdv("");
  };

  const handleCategoryChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedCategory(selectedOption);
  };

  const handlepricelistChange = (selectedOption: SingleValue<IOption>) => {
    setIsPriceListTouched(true);
    setSelectedPriceList(selectedOption);
  };

  const categoryOptions = categoryList.map((category: any) => ({
    value: category.id,
    label: category.category_name,
  }));

  const pricelistOptions = priceList.map((price: any) => ({
    value: price.id,
    label: price.price_list_name,
  }));

  // useEffect(() => {
  //   const selectedPriceList2 = pricelistOptions.find(option => option.value == "2") || null;
  //   setSelectedPriceList(selectedPriceList2);

  // }, [[priceList]])

  let contact_id = orderId ? Contact?.to_customer_id : Contact?.id;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const barcodeDetected = !!(Number(value) && value.length === 13);
    setIsBarcode(barcodeDetected);
    setSearchTerm(value);
    setFocusedProductIndex(null);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const newTimeout = setTimeout(() => {
      if (barcodeDetected) {
        fetchProductApiForOrder(
          0,
          ITEMS_PER_PAGE,
          "",
          Number(value),
          selectedCategory,
          selectedPriceList,
          Contact,
          setProductList,
          isOrderShowNum,
          3,
          isPriceListTouched,
        );
      } else {
        if (value.length >= 3) {
          fetchProductApiForOrder(
            0,
            ITEMS_PER_PAGE,
            value,
            0,
            selectedCategory,
            selectedPriceList,
            Contact,
            setProductList,
            isOrderShowNum,
            4,
            isPriceListTouched,
          );
        } else if (value.length === 0) {
          fetchProductApiForOrder(
            0,
            ITEMS_PER_PAGE,
            "",
            0,
            selectedCategory,
            selectedPriceList,
            Contact,
            setProductList,
            isOrderShowNum,
            5,
            isPriceListTouched,
          );
          setSearchTerm("");
        } else {
          setProductList([]);
        }
      }
    }, 100);
    setTypingTimeout(newTimeout);
  };
  const handleCartCustomFieldChange = (
    fieldName: string,
    value: any,
    dataType: number,
  ) => {
    setCartCustomFieldValues((prev) => {
      let formattedValue = value;

      if (dataType === 7) {
        formattedValue = value === true || value === 1 ? 1 : 0;
      } else if (dataType === 8) {
        formattedValue = String(value || "")?.replace(/[^0-9.]/g, "");
      }

      return {
        ...prev,
        [fieldName]: formattedValue,
      };
    });
  };

  useEffect(() => {
    let isFetching = false;

    const handleScroll = () => {
      const el = listInnerRef.current;
      if (el && !isFetching) {
        const isBottomReached =
          el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (isBottomReached) {
          isFetching = true;
          fetchProductApiForOrder(
            currentPage + 1,
            ITEMS_PER_PAGE,
            searchTerm,
            searchBarcodeNum,
            selectedCategory,
            selectedPriceList,
            Contact,
            setProductList,
            isOrderShowNum,
            6,
            isPriceListTouched,
          )
            .then((newItems) => {
              if (Array.isArray(newItems) && newItems.length > 0) {
                setProductList((prev) => {
                  const existingIds = new Set(prev.map((item) => item.id));
                  const uniqueNewItems = newItems.filter(
                    (item) => !existingIds.has(item.id),
                  );
                  return [...prev, ...uniqueNewItems];
                });
                setCurrentPage((prevPage) => prevPage + 1);
              }
              isFetching = false;
            })
            .catch((error) => {
              console.error("Error fetching products:", error);
              isFetching = false;
            });
        }
      } else if (!el) {
        console.log("listInnerRef is null, cannot attach scroll listener");
      }
    };

    const attachScrollListener = () => {
      const el = listInnerRef.current;
      if (el) {
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
      } else {
        const timeout = setTimeout(attachScrollListener, 100);
        return () => clearTimeout(timeout);
      }
    };
    if (show) {
      const cleanup = attachScrollListener();
      return cleanup;
    }
  }, [show, currentPage, searchTerm, searchBarcodeNum, selectedCategory]);

  const handleCurrencyChange = (
    selectedOption: SingleValue<IOption> | null,
  ) => {
    setSelectedCurrency(selectedOption);
    const isSameCurrency = selectedOption?.value === defaultCurrency?.value;
    setConversionRate(isSameCurrency ? "1" : "");
    setIsConversionRateReadOnly(isSameCurrency);
  };

  const handleConversionRateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (value.startsWith(".")) value = "0" + value;
    setConversionRate(value);
  };

  const openPageTextEdit = (field?: ICustomFormList) => {
    if (field) {
      setAddDataSourceItemForPageText(
        field as unknown as ICustomInquiryFromList,
      );
    }
    setIsEditDataSourceForPageText((prev) => !prev);
  };

  const handleAdvancePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, "");

    const numericValue = Number(value);

    if (numericValue > grandTotal) {
      toast.error("Advance payment cannot exceed Grand Total");
      return;
    }
    setAdvancePayment(value);
  };
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fetchSuggestions = async (value: string) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const getUUID = localStorage.getItem("UUID");

      const { data } = await axiosInstance.post(`Contact`, {
        searchTerm: value,
        a_application_login_id: getUUID,
      });

      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setSuggestions(data.data.item || []);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error(error);
      setSuggestions([]);
    }
  };
  const handleMobileNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    setNew_customer_mobile(value);

    fetchSuggestions(value); // 👈 search
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setNew_customer_name(value);

    fetchSuggestions(value); // 👈 search
  };
  const handleSelectSuggestion = (item: any) => {
    setNew_customer_mobile(item.mobile_number);
    setNew_customer_name(item.person_name);
    setContactData(item);

    setSuggestions([]);
    setShowSuggestions(false);
  };
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, "");

    const numericValue = Number(value);
    setSRNumber(numericValue);
  };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUpdateDate(value);
  };

  useEffect(() => {
    if (show) {
      searchInputRef.current?.focus();
    }
  }, [show]);

  const handleCustomFieldChange = (
    index: number,
    fieldName: string,
    value: any,
    dataType: number,
  ) => {
    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index
          ? {
            ...item,
            [fieldName]:
              dataType === 7
                ? value === true || value === 1
                  ? 1
                  : 0
                : dataType === 8
                  ? value.replace(/[^0-9.]/g, "")
                  : value,
          }
          : item,
      ),
    );
  };

  useEffect(() => {
    const fetchAllDropdownData = async () => {
      const allFields = [...customFormList, ...customFormListProduct];
      const uniqueFieldIds = Array.from(
        new Set(allFields.map((item) => item.id)),
      ).filter((id) => {
        const field = allFields.find((f) => f.id === id);
        return field && [9, 10, 11, 12, 14].includes(field.data_type);
      });

      if (uniqueFieldIds.length === 0) {
        setDropdownDataMap({});
        return;
      }

      try {
        const data = await getCustomFieldDatavalues(uniqueFieldIds);

        const dataMap: { [key: string]: any[] } = {};
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const key = String(item.custom_field_master_id);
            if (!dataMap[key]) {
              dataMap[key] = [];
            }
            dataMap[key].push(item);
          });
        }
        setDropdownDataMap(dataMap);
      } catch (error) {
        console.error("Error fetching dropdown data in bulk:", error);
        setDropdownDataMap({});
      }
    };

    if (
      (customFormList && customFormList.length > 0) ||
      (customFormListProduct && customFormListProduct.length > 0)
    ) {
      fetchAllDropdownData();
    }
  }, [customFormList, customFormListProduct]);

  const renderInputField = (
    item: ICustomFormList,
    name: string,
    fieldName: string,
    index: number | null,
    isCartLevel: boolean = false,
  ) => {
    const value = isCartLevel
      ? (cartCustomFieldValues[fieldName] ?? (item.data_type === 7 ? 0 : ""))
      : ((cart[index as number]?.[fieldName] as
        | string
        | number
        | boolean
        | undefined) ?? (item.data_type === 7 ? 0 : ""));

    const isReadOnly =
      item.form_type === 4 &&
      (item.data_type == 7 ||
        item.data_type == 9 ||
        item.data_type == 10 ||
        item.data_type == 11 ||
        item.data_type == 12);

    return (
      <div className={item.form_type === 4 ? "col-12 px-2" : "col-6 px-2"}>
        <div
          className={item.form_type === 4 ? "d-flex form-group" : "form-group"}
        >
          <label htmlFor={fieldName} className="pb-2 form_label">
            {name}
            {item.required_or_not === 1 && item.form_type !== 4 && (
              <span className="text-danger">*</span>
            )}
          </label>

          {(() => {
            switch (item.data_type) {
              case 1: // Number
                return (
                  <input
                    type="text"
                    className="form-control"
                    value={value.toString()}
                    onChange={(e) =>
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                    }
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    }}
                    disabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Order" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                    readOnly={isReadOnly}
                  />
                );
              case 2: // Text
                return (
                  <input
                    type="text"
                    className="form-control"
                    value={value.toString()}
                    onChange={(e) =>
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                    }
                    disabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Order" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                    readOnly={isReadOnly}
                  />
                );
              case 3: // Textarea
                return (
                  <textarea
                    className="form-control"
                    rows={1}
                    value={value.toString()}
                    onChange={(e) =>
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                    }
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height =
                        Math.max(target.scrollHeight, 150) + "px";
                    }}
                    disabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Order" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                    readOnly={isReadOnly}
                  />
                );
              case 4: // Date
                // Helper function to check if date is valid
                const isValidDate = (dateStr: string) => {
                  if (!dateStr || dateStr === "0000-00-00" || dateStr === "") {
                    return false;
                  }
                  const date = new Date(dateStr);
                  return date instanceof Date && !isNaN(date.getTime());
                };

                // Get the date value and validate it
                const dateValue = value.toString();
                const validDateValue = isValidDate(dateValue) ? dateValue : "";

                return (
                  <div>
                    <DatePicker
                      value={validDateValue}
                      onChange={(date: DateObject) =>
                        isCartLevel
                          ? handleCartCustomFieldChange(
                            fieldName,
                            date,
                            item.data_type,
                          )
                          : handleCustomFieldChange(
                            index as number,
                            fieldName,
                            date,
                            item.data_type,
                          )
                      }
                      disabled={
                        isReadOnly ||
                        (orderTypesNameFind !== "Quotation" &&
                          cartnumber &&
                          orderTypesNameFind !== "Sales Order" &&
                          orderTypesNameFind !== "Proforma Invoice" &&
                          orderTypesNameFind !== "Sales Invoice" &&
                          orderTypesNameFind !== "Purchase Order"
                          ? true
                          : false)
                      }
                      readOnly={isReadOnly}
                      format="YYYY-MM-DD"
                      placeholder={`Enter ${name}`}
                      inputClass={`form-control font-size-15 rounded-1`}
                    />
                  </div>
                );
              case 5: // DateTime
                return (
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={value.toString()}
                    onChange={(e) =>
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                    }
                    disabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Order" &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                    readOnly={isReadOnly}
                  />
                );
              case 6: // Time
                return (
                  <input
                    type="time"
                    className="form-control"
                    value={value.toString()}
                    onChange={(e) =>
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          e.target.value,
                          item.data_type,
                        )
                    }
                    disabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Order" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                    readOnly={isReadOnly}
                  />
                );
              case 7: // Switch
                return item.form_type === 4 ? (
                  <span>{value === 1 || value === true ? "Yes" : "No"}</span>
                ) : (
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={value === 1 || value === true}
                      onChange={(e) =>
                        isCartLevel
                          ? handleCartCustomFieldChange(
                            fieldName,
                            e.target.checked,
                            item.data_type,
                          )
                          : handleCustomFieldChange(
                            index as number,
                            fieldName,
                            e.target.checked,
                            item.data_type,
                          )
                      }
                      disabled={
                        isReadOnly ||
                        (orderTypesNameFind !== "Quotation" &&
                          cartnumber &&
                          orderTypesNameFind !== "Sales Order" &&
                          orderTypesNameFind !== "Proforma Invoice" &&
                          orderTypesNameFind !== "Sales Invoice" &&
                          orderTypesNameFind !== "Purchase Order"
                          ? true
                          : false)
                      }
                      readOnly={isReadOnly}
                    />
                  </div>
                );
              case 8: // Decimal
                return (
                  <input
                    type="text"
                    className="form-control"
                    value={value.toString()}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (!/^\d*\.?\d*$/.test(value)) return;
                      if ((value.match(/\./g) || []).length > 1) {
                        value = value.slice(0, -1);
                      }
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          value,
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          value,
                          item.data_type,
                        );
                    }}
                    disabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                    readOnly={isReadOnly}
                  />
                );
              case 9: // Dropdown
                const datas = dropdownDataMap[item.id] || [];
                const dropDownOptions = datas.map((dataItem: any) => ({
                  value: dataItem.data_sorce,
                  label: dataItem.data_sorce,
                }));
                const selectedOption =
                  dropDownOptions.find(
                    (opt) => opt.value === value.toString(),
                  ) || null;

                return (
                  <CustomSearchDropdown
                    options={dropDownOptions}
                    value={selectedOption}
                    onChange={(selectedOption: SingleValue<IOption>) =>
                      isCartLevel
                        ? handleCartCustomFieldChange(
                          fieldName,
                          selectedOption?.value || "",
                          item.data_type,
                        )
                        : handleCustomFieldChange(
                          index as number,
                          fieldName,
                          selectedOption?.value || "",
                          item.data_type,
                        )
                    }
                    isDisabled={
                      isReadOnly ||
                      (orderTypesNameFind !== "Quotation" &&
                        cartnumber &&
                        orderTypesNameFind !== "Sales Order" &&
                        orderTypesNameFind !== "Sales Invoice" &&
                        orderTypesNameFind !== "Proforma Invoice" &&
                        orderTypesNameFind !== "Purchase Order"
                        ? true
                        : false)
                    }
                  />
                );
              case 10: // Radio
                const radioData = dropdownDataMap[item.id] || [];

                const radioOptions = radioData.map(
                  (dataItem: any) => dataItem.data_sorce,
                );

                return item.form_type === 4 ? (
                  <span>{value.toString()}</span>
                ) : (
                  <div className="mt-1">
                    {radioOptions?.map((option: string, i: number) => (
                      <label key={i} className="p-1">
                        <input
                          type="radio"
                          name={`${fieldName}-${index ?? "cart"}`}
                          value={option}
                          checked={value.toString() === option}
                          onChange={() =>
                            isCartLevel
                              ? handleCartCustomFieldChange(
                                fieldName,
                                option,
                                item.data_type,
                              )
                              : handleCustomFieldChange(
                                index as number,
                                fieldName,
                                option,
                                item.data_type,
                              )
                          }
                          disabled={
                            isReadOnly ||
                            (orderTypesNameFind !== "Quotation" &&
                              cartnumber &&
                              orderTypesNameFind !== "Sales Order" &&
                              orderTypesNameFind !== "Sales Invoice" &&
                              orderTypesNameFind !== "Proforma Invoice" &&
                              orderTypesNameFind !== "Purchase Order"
                              ? true
                              : false)
                          }
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                );
              case 11: {
                const datas = dropdownDataMap[item.id] || [];
                const options = datas.map((dataItem: any) => ({
                  value: dataItem.data_sorce,
                  label: dataItem.data_sorce,
                }));

                const selectedValue =
                  options.find((opt) => opt.value === value?.toString()) ||
                  options[0] ||
                  null;

                if (!value && selectedValue?.value) {
                  if (isCartLevel) {
                    handleCartCustomFieldChange(
                      fieldName,
                      selectedValue.value,
                      item.data_type,
                    );
                  } else {
                    handleCustomFieldChange(
                      index as number,
                      fieldName,
                      selectedValue.value,
                      item.data_type,
                    );
                  }
                }

                return null;
              }

              case 12: {
                const datas = dropdownDataMap[item.id] || [];
                const options = datas.map((dataItem: any) => ({
                  value: dataItem.data_sorce,
                  label: dataItem.data_sorce,
                }));

                const selectedValue =
                  options.find((opt) => opt.value === value?.toString()) ||
                  options[0] ||
                  null;

                if (!value && selectedValue?.value) {
                  if (isCartLevel) {
                    handleCartCustomFieldChange(
                      fieldName,
                      selectedValue.value,
                      item.data_type,
                    );
                  } else {
                    handleCustomFieldChange(
                      index as number,
                      fieldName,
                      selectedValue.value,
                      item.data_type,
                    );
                  }
                }

                return null;
              }
              default:
                return <span>No field available</span>;
            }
          })()}
        </div>
      </div>
    );
  };

  const validateCartItemsAndFields = async () => {
    const schema = Yup.object().shape({
      carts: Yup.array().of(
        Yup.object().shape({
          product_name: Yup.string()
            .trim()
            .required("Product Name is required"),
          quantity: Yup.number()
            .test(
              "serial-number-validation",
              "Please add at least 1 Serial Number",
              function (value) {
                const { is_serial_number, serial_numbers } = this.parent;

                if (
                  is_serial_number == 2 &&
                  [3, 4, 8, 9].includes(Number(isOrderShowNum))
                ) {
                  return (
                    Array.isArray(serial_numbers) && serial_numbers.length > 0
                  );
                }

                return value !== undefined && value >= 0.001;
              },
            )
            .min(0.001, "Quantity must be at least 0.001")
            .required("Quantity is required"),
          rate: Yup.number().required("Rate is required"),
          GST: Yup.number().required("GST is required"),
          due_date: Yup.mixed().test(
            "due-date-required",
            "Due/Delivery Date is required",
            () => {
              if (Number(isOrderShowNum) !== 3) {
                return true;
              }

              return !!cartDueDate;
            },
          ),
          ...customFormListProduct.reduce(
            (acc, item) => {
              if (item.required_or_not === 1 && item.form_type === 4) {
                switch (item.data_type) {
                  case 1: // Number
                    acc[item.reference_column_name] = Yup.number()
                      .typeError(`${item.title} must be a number`)
                      .required(`${item.title} is required`);
                    break;
                  case 2: // Text
                    acc[item.reference_column_name] = Yup.string()
                      .trim()
                      .min(1, `${item.title} cannot be empty`)
                      .required(`${item.title} is required`);
                    break;
                  case 3: // Textarea
                    acc[item.reference_column_name] = Yup.string()
                      .trim()
                      .min(1, `${item.title} cannot be empty`)
                      .required(`${item.title} is required`);
                    break;
                  case 4: // Date
                    acc[item.reference_column_name] = Yup.string()
                      .matches(
                        /^\d{4}-\d{2}-\d{2}$/,
                        `${item.title} must be a valid date`,
                      )
                      .required(`${item.title} is required`);
                    break;
                  case 5: // DateTime
                    acc[item.reference_column_name] = Yup.string()
                      .matches(
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                        `${item.title} must be a valid date and time`,
                      )
                      .required(`${item.title} is required`);
                    break;
                  case 6: // Time
                    acc[item.reference_column_name] = Yup.string()
                      .min(1, `${item.title} cannot be empty`)
                      .required(`${item.title} is required`);
                    break;
                  case 7: // Switch (Boolean)
                    acc[item.reference_column_name] = Yup.mixed()
                      .test(
                        "is-boolean-or-number",
                        `${item.title} must be a valid boolean or number`,
                        (value) =>
                          value === 0 ||
                          value === 1 ||
                          value === true ||
                          value === false,
                      )
                      .required(`${item.title} is required`);
                    break;
                  case 8: // Decimal
                    acc[item.reference_column_name] = Yup.number()
                      .typeError(`${item.title} must be a valid decimal`)
                      .required(`${item.title} is required`);
                    break;
                  case 9: // Dropdown
                    // acc[item.reference_column_name] = Yup.string()
                    //   .nullable()
                    //   .test(
                    //     "required-dropdown",
                    //     `${item.title} is required`,
                    //     (value) => value !== undefined && value !== null && value !== ""
                    //   );
                    // break;
                    acc[item.reference_column_name] = Yup.string().required(
                      `${item.title} is required`,
                    );
                    break;
                  case 10: // Radio
                    acc[item.reference_column_name] = Yup.string()
                      .min(1, `${item.title} cannot be empty`)
                      .required(`${item.title} is required`);
                    break;
                  default:
                    break;
                }
              }
              return acc;
            },
            {} as Record<string, Yup.AnySchema>,
          ),
        }),
      ),
      cartCustomFields: Yup.object().shape({
        ...customFormList.reduce(
          (acc, item) => {
            if (item.required_or_not === 1 && item.form_type === 5) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 6) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 7) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 8) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 9) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed().test(
                    "is-boolean-or-number",
                    `${item.title} must be a valid boolean or number`,
                    (value) =>
                      value === 0 ||
                      value === 1 ||
                      value === true ||
                      value === false,
                  );
                  // .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 10) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 11) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 12) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            } else if (item.required_or_not === 1 && item.form_type === 13) {
              switch (item.data_type) {
                case 1: // Number
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a number`)
                    .required(`${item.title} is required`);
                  break;
                case 2: // Text
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 3: // Textarea
                  acc[item.reference_column_name] = Yup.string()
                    .trim()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 4: // Date
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}$/,
                      `${item.title} must be a valid date`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 5: // DateTime
                  acc[item.reference_column_name] = Yup.string()
                    .matches(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
                      `${item.title} must be a valid date and time`,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 6: // Time
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 7: // Switch (Boolean)
                  acc[item.reference_column_name] = Yup.mixed()
                    .test(
                      "is-boolean-or-number",
                      `${item.title} must be a valid boolean or number`,
                      (value) =>
                        value === 0 ||
                        value === 1 ||
                        value === true ||
                        value === false,
                    )
                    .required(`${item.title} is required`);
                  break;
                case 8: // Decimal
                  acc[item.reference_column_name] = Yup.number()
                    .typeError(`${item.title} must be a valid decimal`)
                    .required(`${item.title} is required`);
                  break;
                case 9: // Dropdown
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                case 10: // Radio
                  acc[item.reference_column_name] = Yup.string()
                    .min(1, `${item.title} cannot be empty`)
                    .required(`${item.title} is required`);
                  break;
                default:
                  break;
              }
            }
            return acc;
          },
          {} as Record<string, Yup.AnySchema>,
        ),
        conversionRate: Yup.string().required("Remark is required"),
        packingForwardingChargeTitle: Yup.string()
          .trim()
          .required("Packing Forwarding charge title is required"),
        transportChargeTitle: Yup.string()
          .trim()
          .required("Transport charge title is required"),
      }),
    });
    try {
      const transformedCart = cart.map((item) => {
        const transformedItem: Record<string, any> = { ...item };

        customFormListProduct
          .filter(
            (field) => field.form_type === 4 && field.required_or_not === 1,
          )
          .forEach((field) => {
            const fieldName = field.reference_column_name;
            const value = item[fieldName];
            transformedItem[fieldName] =
              value !== undefined && value !== null
                ? field.data_type === 7
                  ? value === true || value === 1 || value === "1"
                    ? 1
                    : 0
                  : field.data_type === 8
                    ? Number(value) || ""
                    : value
                : field.data_type === 7
                  ? 0
                  : "";
          });
        return transformedItem;
      });

      const transformedCartCustomFields: Record<string, any> = {
        conversionRate: conversionRate || "",
        packingForwardingChargeTitle: packingForwardingChargeTitle || "",
        transportChargeTitle: transportChargeTitle || "",
        ...cartCustomFieldValues,
      };
      customFormList
        .filter((field) => field.form_type === 5 && field.required_or_not === 1)
        .forEach((field) => {
          const fieldName = field.reference_column_name;
          const value = transformedCartCustomFields[fieldName];
          transformedCartCustomFields[fieldName] =
            value !== undefined && value !== null
              ? field.data_type === 7
                ? value === true || value === 1 || value === "1"
                  ? 1
                  : 0
                : field.data_type === 8
                  ? value !== ""
                    ? Number(value)
                    : ""
                  : (value ?? "")
              : field.data_type === 7
                ? 0
                : "";
        });

      await schema.validate(
        {
          carts: transformedCart,
          cartCustomFields: transformedCartCustomFields,
        },
        { abortEarly: false },
      );

      if (
        advancePayment &&
        Number(advancePayment) > 0 &&
        !selectedPaymentMode
      ) {
        return {
          payment_mode:
            "Payment Mode is required when Advance Payment is entered",
        };
      }

      return {};
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err: any) => {
        const path = err.path.includes("cartCustomFields")
          ? `carts_column_${err.path.split(".")[1]}`
          : err.path;
        errors[path] = err.message;
      });
      return errors;
    }
  };

  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  // const totalAmount = cart.reduce((total, item) => {
  //   const beforeGstRate =
  //     Number(item.rate) -
  //     (Number(item.rate) * Number(item.item_discount_pct)) / 100;
  //   return total + item.quantity * beforeGstRate;
  // }, 0);

  // const totalGst = cart.reduce((total, item) => {
  //   const discount_amount =
  //     (Number(item.rate) * Number(item.item_discount_pct)) / 100;
  //   const discounted_amount = Number(item.rate) - discount_amount;
  //   const gst_amount = (item.GST * discounted_amount) / 100;
  //   return total + gst_amount * item.quantity;
  // }, 0);
  // ✅ Fixed & Improved totalAmount (Subtotal before GST)
  const totalAmount = cart.reduce((total, item) => {
    const rate = Number(item.rate) || 0;
    const qty = Number(item.quantity) || 1;

    let discountPerUnit = 0;
    if (discountType === "percentage") {
      discountPerUnit = (rate * (Number(item.item_discount_pct) || 0)) / 100;
    } else {
      discountPerUnit = Number(item.item_discount_pr) || 0;
    }

    const beforeGst = Math.max(0, rate - discountPerUnit);
    return total + qty * beforeGst;
  }, 0);
  // ✅ Fixed totalGst
  const totalGst = cart.reduce((total, item) => {
    const rate = Number(item.rate) || 0;
    const qty = Number(item.quantity) || 1;
    const gst = Number(item.GST) || 0;

    let discountPerUnit = 0;
    if (discountType === "percentage") {
      discountPerUnit = (rate * (Number(item.item_discount_pct) || 0)) / 100;
    } else {
      discountPerUnit = Number(item.item_discount_pr) || 0;
    }

    const discounted = Math.max(0, rate - discountPerUnit);
    const gstPerUnit = (gst * discounted) / 100;

    return total + qty * gstPerUnit;
  }, 0);
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (value === "") {
      setDiscount(0);
      return;
    }
    const discountValue = value;
    if (Number(discountValue) < 100) {
      setDiscount(discountValue);
    } else {
      toast.error("Discount cannot exceed total amount");
      setDiscount(0);
    }
  };

  const showDiscount = (totalAmount * parseFloat(discount as string)) / 100;

  const handlePackingForwardingChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (value.startsWith(".")) value = "0" + value;
    setPackingForwardingCharge(value);
  };
  const handelChangeShowModelReport = () => {
    setIsOrderCreateFromContactShow(true);
  };

  const handleTransportCharge = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (value.startsWith(".")) value = "0" + value;
    setTransportCharge(value);
  };

  const handlePackingForwardingTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPackingForwardingChargeTitle(e.target.value);
  };

  const handleTcsTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDynamicTCSTitle(e.target.value);
  };

  const handleTcsPercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (value.startsWith(".")) value = "0" + value;
    if (Number(value) > 100) {
      toast.error("TCS percentage cannot exceed 100%");
      return;
    }
    setDynamicTCSRate(value);
  };

  const handleTransportChargeTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setTransportChargeTitle(e.target.value);
  };

  const handleRateChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value;

    // Allow only numbers with max 2 decimals
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;

    const newRate = Number(value);

    if (newRate < 0) {
      toast.error("Negative Rate Is Not Allowed");
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item, i) => {
        if (i !== index) return item;

        // Re-calculate discount based on NEW rate (this was your main bug)
        const result = calculateNetRate(
          newRate,
          discountType === "percentage"
            ? Number(item.item_discount_pct)
            : Number(item.item_discount_pr),
          item.GST,
          discountType,
        );

        return {
          ...item,
          rate: value, // keep as user is typing
          item_discount_pct: result.discountPercent,
          item_discount_pr: result.discountAmount,
          net_rate: result.net,
        };
      }),
    );
  };

  const handleRateBlur = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value.trim();
    if (value === "") return;

    const formattedRate = parseFloat(value).toFixed(2);

    setCart((prevCart) =>
      prevCart.map((item, i) => {
        if (i !== index) return item;

        const result = calculateNetRate(
          parseFloat(formattedRate),
          discountType === "percentage"
            ? Number(item.item_discount_pct)
            : Number(item.item_discount_pr),
          item.GST,
          discountType,
        );

        return {
          ...item,
          rate: formattedRate,
          item_discount_pct: result.discountPercent,
          item_discount_pr: result.discountAmount,
          net_rate: result.net,
        };
      }),
    );
  };
  const handleProductItemDiscountChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value.trim();

    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    // If empty, allow it (user can delete everything)
    if (value === "") {
      setCart((prevCart) =>
        prevCart.map((item, i) =>
          i === index
            ? {
              ...item,
              discount_input_value: "",
              item_discount_pct: 0,
              item_discount_pr: 0,
              net_rate: Number(item.rate), // or recalculate properly
            }
            : item,
        ),
      );
      return;
    }

    const numValue = Number(value);

    // ================== REAL-TIME VALIDATION BEFORE UPDATING ==================
    if (discountType === "percentage") {
      if (numValue > 100) {
        toast.error("Discount % cannot be more than 100");
        return; // ← STOP here, do not update state
      }
    } else if (discountType === "flat") {
      const itemRate = Number(cart[index]?.rate || 0);
      if (numValue > itemRate) {
        toast.error("Flat discount cannot be more than rate");
        return; // ← STOP here
      }
    }

    // If validation passed → update state
    setCart((prevCart) =>
      prevCart.map((item, i) => {
        if (i !== index) return item;

        const result = calculateNetRate(
          Number(item.rate),
          numValue,
          item.GST,
          discountType,
        );

        return {
          ...item,
          discount_input_value: value, // keep raw string for smooth typing
          item_discount_pct: result.discountPercent,
          item_discount_pr: result.discountAmount,
          net_rate: result.net,
        };
      }),
    );
  };
  // const calculateNetRate = (
  //   rate: number,
  //   discount: number,
  //   gst: number,
  //   type: "percentage" | "flat"
  // ) => {
  //   let discountAmount = 0;
  //   let discountPercent = 0;

  //   if (type === "percentage") {
  //     discountPercent = discount;
  //     discountAmount = (rate * discount) / 100;
  //   } else {
  //     discountAmount = discount;
  //     discountPercent = rate > 0 ? (discount / rate) * 100 : 0;
  //   }

  //   let discounted_amount = rate - discountAmount;
  //   if (discounted_amount < 0) discounted_amount = 0;

  //   const gst_amount = (gst * discounted_amount) / 100;

  //   // ✅ ROUNDING FIX
  //   discountAmount = Number(discountAmount);
  //   discountPercent = Number(discountPercent);
  //   const final = Number((discounted_amount + gst_amount).toFixed(2));

  //   return {
  //     net: final,
  //     discountAmount,
  //     discountPercent,
  //   };
  // };

  const calculateNetRate = (
    rate: number,
    discountInput: number, // This can be % or flat amount depending on type
    gst: number,
    type: "percentage" | "flat",
  ) => {
    const r = Number(rate) || 0;
    let discountPercent = 0;
    let discountAmount = 0;

    if (type === "percentage") {
      discountPercent = Number(discountInput) || 0;
      discountAmount = (r * discountPercent) / 100;
    } else {
      discountAmount = Number(discountInput) || 0;
      discountPercent = r > 0 ? (discountAmount / r) * 100 : 0;
    }

    let discountedAmount = r - discountAmount;
    if (discountedAmount < 0) discountedAmount = 0;

    const gstAmount = (gst * discountedAmount) / 100;
    const netRate = Number((discountedAmount + gstAmount).toFixed(2));

    return {
      net: netRate,
      discountPercent: Number(discountPercent.toFixed(4)), // for internal accuracy
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  };
  const orderTypesNameFind =
    orderTypesList.find(
      (option) =>
        Number(option.id) ===
        (newOrderShowNumAfterConversion || isOrderShowNum),
    )?.order_type || "";

  useEffect(() => {
    const packingCharge = parseFloat(packingForwardingCharge as string) || 0;
    const transportChargeValue = parseFloat(transportCharge as string) || 0;
    const grossTaxableAmount =
      totalAmount - showDiscount + packingCharge + transportChargeValue;

    let cashDiscountAmount = 0;

    if ((Number(cashDiscount) || 0) > 0) {
      if (cashDiscountType == "percentage") {
        cashDiscountAmount = (grossTaxableAmount * Number(cashDiscount)) / 100;
      } else {
        cashDiscountAmount = Number(cashDiscount);
      }
    }

    setTaxAbleAmount(Math.max(grossTaxableAmount - cashDiscountAmount, 0));
  }, [
    totalAmount,
    showDiscount,
    packingForwardingCharge,
    transportCharge,
    cashDiscount,
    cashDiscountType,
  ]);

  useEffect(() => {
    const tcsRate = Number(dynamicTCSRate) / 100;
    const tcs = isTcsActive ? (taxAbleAmount + gstAmount) * tcsRate : 0;
    setTcsAmount(tcs);
  }, [gstAmount, isTcsActive, taxAbleAmount, dynamicTCSRate]);

  useEffect(() => {
    let packing_forwarding_charge_gst =
      Number(packingForwardingCharge) * (PACKING_FORWARDING_CHARGE_GST / 100);
    const transport_charge_gst =
      Number(transportCharge) * (TRANSPORT_CHARGE__GST / 100);

    const baseGst =
      totalGst + packing_forwarding_charge_gst + transport_charge_gst;

    const packingCharge = parseFloat(packingForwardingCharge as string) || 0;
    const transportChargeValue = parseFloat(transportCharge as string) || 0;
    const grossTaxableAmount =
      totalAmount - showDiscount + packingCharge + transportChargeValue;

    let discountRatio = 0;
    if ((Number(cashDiscount) || 0) > 0 && grossTaxableAmount > 0) {
      if (cashDiscountType === "percentage") {
        discountRatio = Math.min((Number(cashDiscount) || 0) / 100, 1);
      } else {
        discountRatio = Math.min(
          (Number(cashDiscount) || 0) / grossTaxableAmount,
          1,
        );
      }
    }

    const gstFinal = isGstActive
      ? Math.max(0, baseGst * (1 - discountRatio))
      : 0;

    setGstAmount(gstFinal);
  }, [
    isGstActive,
    totalGst,
    packingForwardingCharge,
    transportCharge,
    totalAmount,
    showDiscount,
    cashDiscount,
    cashDiscountType,
  ]);

  useEffect(() => {
    const total = taxAbleAmount + gstAmount + tcsAmount;
    const rounded = Math.round(total);
    const roundOffAmount1 = Number((rounded - total).toFixed(2));

    setRoundOffAmount(roundOffAmount1);
  }, [gstAmount, taxAbleAmount, tcsAmount]);

  useEffect(() => {
    const grandAmount = Math.round(taxAbleAmount + gstAmount + tcsAmount);
    setGrandTotal(grandAmount);
  }, [gstAmount, taxAbleAmount, tcsAmount]);

  useEffect(() => {
    if (printDate && printDate.length > 0 && currency && currency.length > 0) {
      const companyCurrencyId = printDate[0]?.currency_id;
      const defaultCurr = currency.find(
        (curr: any) => curr.id === companyCurrencyId,
      );

      if (defaultCurr) {
        const currencyOption = {
          label: `${defaultCurr.short_name} - ${defaultCurr.name}`,
          value: defaultCurr.id,
        };
        setDefaultCurrency(currencyOption);

        if (orderById && orderById.cart && orderById.cart.currency_id) {
          const selectedCurr = currency.find(
            (curr: any) => curr.id === orderById.cart.currency_id,
          );
          if (selectedCurr) {
            setSelectedCurrency({
              label: `${selectedCurr.short_name} - ${selectedCurr.name}`,
              value: selectedCurr.id,
            });
            setConversionRate((prev) =>
              prev === orderById.cart.conversion_rate
                ? prev
                : orderById.cart.conversion_rate,
            );
            setIsConversionRateReadOnly(selectedCurr.id === defaultCurr.id);
          } else {
            setSelectedCurrency(currencyOption);
            setConversionRate("1");
            setIsConversionRateReadOnly(true);
          }
        } else {
          setSelectedCurrency(currencyOption);
          setConversionRate("1");
          setIsConversionRateReadOnly(true);
        }
      }
    }
  }, [printDate, currency, orderById]);
  const [defaultWarehouse, setDefaultWarehouse] = useState<IOption | null>(
    null,
  );

  useEffect(() => {
    const shouldShowWarehouse =
      orderTypesNameFind !== "Quotation" &&
      orderTypesNameFind !== "Sales Order" &&
      orderTypesNameFind !== "Sales Invoice" &&
      orderTypesNameFind !== "Proforma Invoice" &&
      orderTypesNameFind !== "Purchase Order";

    if (warehouse?.length > 0 && shouldShowWarehouse) {
      const defaultWh = warehouse.find((wh: any) => wh.id == -1);

      if (defaultWh) {
        const warehouseOption = {
          label: defaultWh.warehouse_name,
          value: defaultWh.id,
        };

        setDefaultWarehouse(warehouseOption);
        setCart((prevCart) =>
          prevCart.map((item) => ({
            ...item,
            warehouse_id: item.warehouse_id ?? -1,
          })),
        );
      }
    }
  }, [warehouse]);

  const currencyOptions =
    currency.map((curr: any) => ({
      label: `${curr.short_name} - ${curr.name}`,
      value: curr.id,
    })) || [];
  const warehouseOptions =
    warehouse?.map((wh: any) => ({
      label: wh.warehouse_name,
      value: Number(wh.id), // 👈 force number
    })) || [];
  const handleWarehouseChange = (
    index: number,
    selectedOption: SingleValue<IOption>,
  ) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];

      updatedCart[index] = {
        ...updatedCart[index],
        warehouse_id: selectedOption?.value ?? undefined,
      };

      return updatedCart;
    });
  };

  const onSaveAndDraft = async (
    isApprove: number,
    shouldPrint: boolean,
    shareInwhatsapp?: boolean,
    downloadPdf?: boolean,
    startWorkFlow?: boolean,
    approveSeries?: string,
    enteredSeriesNumber?: string,
    enteredSeriesDate?: string,
    transaction_mode?: string,
    selectedMiracleLedger_main?: string,
    syncWithMiracle?: boolean,
  ) => {
    let contactDataFlag;
    let contactCreateFlag;
    const errors = await validateCartItemsAndFields();
    setButtonloding(true);

    // if (Object.keys(errors).length > 0) {
    //   toast.error("Required fields are missing. Please check the form.");
    //   setButtonloding(false);
    //   return;
    // }
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    if (!cart || cart.length === 0) {
      toast.error("Please select at least one product to proceed.");
      setButtonloding(false);
      return;
    }

    const customFieldErrors: Record<string, string> = {};

    // 1. Cart-level custom fields (products_column_xxx)
    for (const item of cart) {
      const productIndex = cart.indexOf(item); // for error display

      for (const field of customFormListProduct) {
        if (field.form_type !== 4) continue;

        const fieldName = field.reference_column_name;
        const rawValue = item[fieldName];

        if (rawValue === undefined || rawValue === null || rawValue === "") {
          if (field.required_or_not === 1) {
            customFieldErrors[`cart[${productIndex}].${fieldName}`] =
              `${field.title} is required`;
          }
          continue;
        }

        const strValue = String(rawValue).trim();

        // Min / Max length
        if (field.min_limit || field.max_limit) {
          const min = Number(field.min_limit) || 0;
          const max = Number(field.max_limit) || Infinity;

          if (min > 0 && strValue.length < min) {
            customFieldErrors[`cart[${productIndex}].${fieldName}`] =
              `${field.title} must be at least ${min} characters`;
          }
          if (max < Infinity && strValue.length > max) {
            customFieldErrors[`cart[${productIndex}].${fieldName}`] =
              `${field.title} must not exceed ${max} characters`;
          }
        }

        // Validation type (pattern)
        if (field.validation_type) {
          const vt = String(field.validation_type);
          let regex: RegExp | null = null;
          let msg = "";

          switch (vt) {
            case "1":
              regex = /^[0-9]+$/;
              msg = "only numbers";
              break;
            case "2":
              regex = /^[A-Za-z0-9]+$/;
              msg = "alphanumeric only";
              break;
            case "3":
              regex = /^[A-Za-z\s]+$/;
              msg = "letters only";
              break;
            case "4":
              regex = /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = "letters + special chars";
              break;
            case "5":
              regex = /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = "numbers + special chars";
              break;
            case "6":
              regex = /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = "alphanumeric + special chars";
              break;
          }

          if (regex && !regex.test(strValue)) {
            customFieldErrors[`cart[${productIndex}].${fieldName}`] =
              `${field.title} must contain ${msg}`;
          }
        }
      }
    }

    // 2. Order-level custom fields (cartCustomFieldValues)
    for (const field of customFormList) {
      if (![5, 6, 7, 8, 9, 10, 11, 12, 13].includes(field.form_type)) continue;

      const fieldName = field.reference_column_name;
      const rawValue = cartCustomFieldValues[fieldName];

      if (rawValue === undefined || rawValue === null || rawValue === "") {
        if (field.required_or_not === 1) {
          customFieldErrors[fieldName] = `${field.title} is required`;
        }
        continue;
      }

      const strValue = String(rawValue).trim();

      // Min / Max length
      if (field.min_limit || field.max_limit) {
        const min = Number(field.min_limit) || 0;
        const max = Number(field.max_limit) || Infinity;

        if (min > 0 && strValue.length < min) {
          customFieldErrors[fieldName] =
            `${field.title} must be at least ${min} characters`;
        }
        if (max < Infinity && strValue.length > max) {
          customFieldErrors[fieldName] =
            `${field.title} must not exceed ${max} characters`;
        }
      }

      // Validation type
      if (field.validation_type) {
        const vt = String(field.validation_type);
        let regex: RegExp | null = null;
        let msg = "";

        switch (vt) {
          case "1":
            regex = /^[0-9]+$/;
            msg = "only numbers";
            break;
          case "2":
            regex = /^[A-Za-z0-9]+$/;
            msg = "alphanumeric only";
            break;
          case "3":
            regex = /^[A-Za-z\s]+$/;
            msg = "letters only";
            break;
          case "4":
            regex = /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
            msg = "letters + special chars";
            break;
          case "5":
            regex = /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
            msg = "numbers + special chars";
            break;
          case "6":
            regex = /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
            msg = "alphanumeric + special chars";
            break;
        }

        if (regex && !regex.test(strValue)) {
          customFieldErrors[fieldName] = `${field.title} must contain ${msg}`;
        }
      }
    }

    // If any custom field error → stop + show toast
    if (Object.keys(customFieldErrors).length > 0) {
      console.log("Custom field validation errors:", customFieldErrors);

      // Show first error in toast
      const firstError = Object.values(customFieldErrors)[0];
      toast.error(firstError || "Custom field validation failed");

      // Optional: mark fields as touched / show inline errors
      // You can loop and call setFieldError if you expose formik context

      setButtonloding(false);
      return;
    }

    const token = await localStorage.getItem("token");
    const localId = await localStorage.getItem("UUID");
    const currentDateTime = new Date();
    const formattedDateTime = formatDateSendDataBase(currentDateTime);
    // const a_application_login_id = Number(localId);
    const a_application_login_id = selectedTeamMamber?.value
      ? Number(selectedTeamMamber.value)
      : isEditMode
        ? Number(orderById?.cart?.a_application_login_id)
        : Number(localId);
    const Approve_application_login_id = Number(localId);
    let mobileString = String(new_customer_mobile);
    let nameString = String(new_customer_name);
    let contactDataForPayload = contactData;

    if (
      mobileString &&
      mobileString !== "undefined" &&
      mobileString !== null &&
      nameString !== undefined &&
      nameString !== null
    ) {
      if (mobileString.length < 10) {
        toast.error("Mobile number must be at least 10 digits long");
        setButtonloding(false);
        return;
      }

      if (
        mobileString.length > 9 &&
        (nameString.length == 0 ||
          nameString == undefined ||
          nameString == "undefined")
      ) {
        toast.error("Customer name is required when a mobile number is added");
        setButtonloding(false);
        return;
      }

      contactDataFlag = "new/exists";
      const requestData = {
        table: "contact_masters",
        where: JSON.stringify({
          isDelete: 0,
          mobile_number: new_customer_mobile,
        }),
      };

      const contact_check = await axiosInstance.post("commonGet", requestData);
      console.log("contact_checkcontact_check", contact_check);

      if (contact_check.data.ack == DEFAULT_STATUS_CODE_SUCCESS) {
        contactDataForPayload = contact_check.data.data[0];
        setContactData(contactDataForPayload);
      } else if (contact_check.data.ack == DEFAULT_STATUS_CODE_ERROR) {
        contactCreateFlag = "createNew";
        const requestDataCreateContact = {
          person_name: nameString || "unknown",
          mobile_number: new_customer_mobile,
          a_application_login_id: localId,
          is_unread: 1,
        };

        const { data } = await axiosInstance.post(
          "createContact",
          requestDataCreateContact,
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
          contactDataForPayload = data.data;
          setContactData(data.data);
        } else {
          console.error("createContact API error:", data.ack_msg);
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          return;
        }
      }
    }

    if (
      !contactCreateFlag ||
      (contactCreateFlag === "createNew" && contactDataForPayload)
    ) {
      const productCustomFormFieldValues = cart.map((item) => ({
        products_column_number_1: item.products_column_number_1 || "",
        products_column_number_2: item.products_column_number_2 || "",
        products_column_number_3: item.products_column_number_3 || "",
        products_column_number_4: item.products_column_number_4 || "",
        products_column_number_5: item.products_column_number_5 || "",
        products_column_text_1: item.products_column_text_1 || "",
        products_column_text_2: item.products_column_text_2 || "",
        products_column_text_3: item.products_column_text_3 || "",
        products_column_text_4: item.products_column_text_4 || "",
        products_column_text_5: item.products_column_text_5 || "",
        products_column_text_area_1: item.products_column_text_area_1 || "",
        products_column_text_area_2: item.products_column_text_area_2 || "",
        products_column_text_area_3: item.products_column_text_area_3 || "",
        products_column_text_area_4: item.products_column_text_area_4 || "",
        products_column_text_area_5: item.products_column_text_area_5 || "",
        products_column_date_1: item.products_column_date_1 || "",
        products_column_date_2: item.products_column_date_2 || "",
        products_column_date_3: item.products_column_date_3 || "",
        products_column_date_4: item.products_column_date_4 || "",
        products_column_date_5: item.products_column_date_5 || "",
        products_column_date_and_time_1:
          item.products_column_date_and_time_1 || "",
        products_column_date_and_time_2:
          item.products_column_date_and_time_2 || "",
        products_column_date_and_time_3:
          item.products_column_date_and_time_3 || "",
        products_column_date_and_time_4:
          item.products_column_date_and_time_4 || "",
        products_column_date_and_time_5:
          item.products_column_date_and_time_5 || "",
        products_column_time_1: item.products_column_time_1 || "",
        products_column_time_2: item.products_column_time_2 || "",
        products_column_time_3: item.products_column_time_3 || "",
        products_column_time_4: item.products_column_time_4 || "",
        products_column_time_5: item.products_column_time_5 || "",
        products_column_switch_1: item.products_column_switch_1 ? 1 : 0,
        products_column_switch_2: item.products_column_switch_2 ? 1 : 0,
        products_column_switch_3: item.products_column_switch_3 ? 1 : 0,
        products_column_switch_4: item.products_column_switch_4 ? 1 : 0,
        products_column_switch_5: item.products_column_switch_5 ? 1 : 0,
        products_column_decimal_1: item.products_column_decimal_1 || "",
        products_column_decimal_2: item.products_column_decimal_2 || "",
        products_column_decimal_3: item.products_column_decimal_3 || "",
        products_column_decimal_4: item.products_column_decimal_4 || "",
        products_column_decimal_5: item.products_column_decimal_5 || "",
        products_column_dropdown_1: item.products_column_dropdown_1 || "",
        products_column_dropdown_2: item.products_column_dropdown_2 || "",
        products_column_dropdown_3: item.products_column_dropdown_3 || "",
        products_column_dropdown_4: item.products_column_dropdown_4 || "",
        products_column_dropdown_5: item.products_column_dropdown_5 || "",
        products_column_radio_1: item.products_column_radio_1 || "",
        products_column_radio_2: item.products_column_radio_2 || "",
        products_column_radio_3: item.products_column_radio_3 || "",
        products_column_radio_4: item.products_column_radio_4 || "",
        products_column_radio_5: item.products_column_radio_5 || "",
      }));

      let submitDateTime;
      const currentLocalDateTime = convertUTCToLocal(originalUpdateDate);
      const hasDateChanged = updateDate !== currentLocalDateTime;

      if (hasDateChanged && updateDate) {
        submitDateTime = convertLocalToUTC(updateDate);
      } else {
        submitDateTime = originalUpdateDate;
      }

      const cartPayload = {
        type: newOrderShowNumAfterConversion || isOrderShowNum,
        sr_by_prifix: approveSeries || "",
        entered_series_number: enteredSeriesNumber || "",
        transaction_mode: transaction_mode || "",
        miracle_account_legder: selectedMiracleLedger_main || "",
        entered_series_date: enteredSeriesDate || "",
        cart_remark: cartRemark.replace(/\n/g, "<br>"),
        account_transactions_ref_table: "carts",
        grand_total: grandTotal ? formatNumber(grandTotal, 2) : 0,
        transport_charge: transportCharge,
        taxable_amt: taxAbleAmount,
        cash_discount: Number(cashDiscount) || 0,
        cash_discount_type: cashDiscountType == "percentage" ? 1 : 2,
        tcs_amt: tcsAmount,
        gst_amt: gstAmount,
        round_off: roundOffAmount,
        total_amt: totalAmount,
        total_qty: totalQuantity,
        discount_pct: discount,
        discount_pr: showDiscount,
        packing_forwarding_charge: packingForwardingCharge,
        packing_forwarding_charge_title: packingForwardingChargeTitle,
        tcs_title: dynamicTCSTitle,
        tcs_percentage: dynamicTCSRate,
        transport_charge_title: transportChargeTitle,
        cart_terms_and_condition: cartTermsAndCondition.replace(/\n/g, "<br>"),
        cart_note: cartNote.replace(/\n/g, "<br>"),
        due_date: cartDueDate
          ? formatDateSendDataBase(cartDueDate.toDate())
          : "",
        cart_date: formattedDateTime,
        currency_id: selectedCurrency?.value || defaultCurrency?.value || 0,
        conversion_rate: conversionRate,
        advance_payment: advancePayment,
        payment_type: selectedPaymentMode,
        miracle_account_ledger_adv: selectedMiracleLedgerAdv?.value || "",
        new_srNumber: srNumber,
        old_srNumber: oldNumber,
        new_updateDateTime: submitDateTime,
        old_updateDateTime: originalUpdateDate,
        cartNumbers: cartnumber,
        ...cartCustomFieldValues,
        ...(contactDataFlag === "new/exists"
          ? {
            country_id: contactDataForPayload?.country,
            state_id: contactDataForPayload?.state,
            city_id: contactDataForPayload?.city,
            area_id: contactDataForPayload?.area,
            PinCode: contactDataForPayload?.pincode,
            Address: contactDataForPayload?.address,
            shipping_address: contactDataForPayload?.shipping_address,
            to_customer_id: contactDataForPayload?.id,
            to_customer_company_name: contactDataForPayload?.company_name,
            to_customer_name: contactDataForPayload?.person_name,
            to_customer_phone: contactDataForPayload?.mobile_number,
            to_customer_email: contactDataForPayload?.email_id,
            to_customer_gst_number: contactDataForPayload?.gst_number,
            to_customer_price_list_id:
              contactDataForPayload?.assinged_to_price_list,
          }
          : {
            country_id: Contact?.country,
            state_id: Contact?.state,
            city_id: Contact?.city,
            area_id: Contact?.area,
            PinCode: Contact?.pincode,
            Address: Contact?.address,
            shipping_address: Contact?.shipping_address,
            to_customer_id: contact_id,
            to_customer_company_name: Contact?.company_name,
            to_customer_name: Contact?.person_name,
            to_customer_phone: Contact?.mobile_number,
            to_customer_email: Contact?.email_id,
            to_customer_gst_number: Contact?.gst_number,
            to_customer_price_list_id: Contact?.assinged_to_price_list,
          }),
      };

      const cartItemsPayload = cart.map((item, index) => ({
        item_category_id: item.category_id,
        item_category_name: item.category_name,
        item_product_id: item.id,
        item_product_name: item.product_name,
        item_product_code: item.product_code,
        item_unit_name: item.unit,
        item_rate: item.rate,
        item_gst: item.GST,
        item_net_rate: item.net_rate,
        item_qty: item.quantity,
        serial_numbers: item.serial_numbers || [],
        item_inner_quantity: item.item_inner_quantity,
        item_outer_quantity: item.item_outer_quantity,
        item_loose_quantity: item.item_loose_quantity,
        product_inner_qty: item.product_inner_qty,
        product_outer_qty: item.product_outer_qty,
        inner_qty_unit: item.inner_qty_unit,
        outer_qty_unit: item.outer_qty_unit,
        item_discount_pct: item.item_discount_pct,
        item_discount_pr: item.item_discount_pr,
        item_total: calculateAmount(
          item.rate,
          item.quantity,
          item.item_discount_pct, // always %
          discountType,
          item.item_discount_pr, // ₹
        ),
        item_product_description: item.product_description?.replace(
          /\n/g,
          "<br>",
        ),
        item_hsn_code: item.hsn_code,
        item_warehouse_id: item.warehouse_id || 0,
        currency_id: selectedCurrency?.value || defaultCurrency?.value || 0,
        conversion_rate: conversionRate,
        advance_payment: advancePayment,
        payment_type: selectedPaymentMode,
        miracle_account_ledger_adv: selectedMiracleLedgerAdv?.value || "",
        ...productCustomFormFieldValues[index],
      }));

      const cartItemsForUpdatePayload = cart.map((item: any, index) => ({
        id: item.cart_item_id,
        item_category_id: item.category_id,
        item_category_name: item.category_name,
        item_product_id: item.id,
        item_product_name: item.product_name,
        item_hsn_code: item.hsn_code,
        item_product_code: item.product_code,
        item_unit_name: item.unit,
        item_rate: item.rate,
        item_gst: item.GST,
        item_net_rate: item.net_rate,
        item_qty: item.quantity,
        serial_numbers: item.serial_numbers || [],
        item_inner_quantity: item.item_inner_quantity,
        item_outer_quantity: item.item_outer_quantity,
        item_loose_quantity: item.item_loose_quantity,
        product_inner_qty: item.product_inner_qty,
        product_outer_qty: item.product_outer_qty,
        inner_qty_unit: item.inner_qty_unit,
        outer_qty_unit: item.outer_qty_unit,
        item_discount_pct: item.item_discount_pct,
        item_discount_pr: item.item_discount_pr,
        item_total: calculateAmount(
          item.rate,
          item.quantity,
          item.item_discount_pct, // always %
          discountType,
          item.item_discount_pr, // ₹
        ),
        item_product_description: item.product_description,
        item_warehouse_id: item.warehouse_id || 0,
        currency_id: selectedCurrency?.value || defaultCurrency?.value || 0,
        conversion_rate: conversionRate,
        advance_payment: advancePayment,
        payment_type: selectedPaymentMode,
        miracle_account_ledger_adv: selectedMiracleLedgerAdv?.value || "",
        ...productCustomFormFieldValues[index],
      }));

      const { cart_date, type, ...filteredCartPayload } = cartPayload;
      const update_cart_items = cartItemDelete.concat(
        cartItemsForUpdatePayload as any,
      );
      const combinedPayloadUpdate = {
        update_cart: cartPayload,
        update_cart_items,
        cart_id: cartId,
        a_application_login_id,
        Approve_application_login_id,
        is_approve: isApprove,
        type,
        reference_cart_id:
          orderById?.cart?.referance_cart_id ||
          orderbyidList?.cart?.referance_cart_id,
      };

      // **HELPER FUNCTION FOR PDF DOWNLOAD**
      const handleDownloadPdf = async (currentCartId: number) => {
        try {
          setRefreshDownload(true);
          const resops = await axiosInstance.post("/order-pdf", {
            cart_id: currentCartId,
          });

          if (resops.data.ack === 1) {
            const fileUrl = resops.data.data.path;
            const response = await axios.get(fileUrl, { responseType: "blob" });
            const fileName = resops.data.data.title;
            const blob = new Blob([response.data], {
              type: response.headers["content-type"],
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setRefreshDownload(false);
          } else {
            toast.error(resops.data.ack_msg);
            setRefreshDownload(false);
          }
        } catch (error: any) {
          toast.error(
            error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
          );
          setRefreshDownload(false);
        }
      };

      // **HELPER FUNCTION FOR WHATSAPP SHARE**
      const handleShareWhatsapp = async (currentCartId: number) => {
        try {
          setRrefreshShare(true);
          const getUUID = localStorage.getItem("UUID");
          const { data } = await axiosInstance.post(
            "/send-sales-pdf-whatsapp",
            {
              cart_id: currentCartId,
              a_application_login_id: getUUID,
            },
          );
          if (data && data.code == 200) {
            toast.success("WhatsApp message sent successfully.");
          }
        } catch (error: any) {
          toast.error(
            error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
          );
          setRrefreshShare(false);
        } finally {
          setRrefreshShare(false);
        }
      };

      // **HELPER FUNCTION TO HANDLE PRINT**
      const handlePrintForOrderType = (
        orderType: number,
        currentCartId: number,
        companyDetail: any[],
      ) => {
        const viewFormateMap: Record<number, string> = {
          1: companyDetail[0]?.quotation_view_formate,
          2: companyDetail[0]?.order_view_formate,
          3: companyDetail[0]?.invoice_view_formate,
          4: companyDetail[0]?.purchase_view_formate,
          5: companyDetail[0]?.purchase_order_view_formate,
          6: companyDetail[0]?.return_sales_invoice_view_formate,
          7: companyDetail[0]?.return_purchase_invoice_view_formate,
          8: companyDetail[0]?.inward_view_formate,
          9: companyDetail[0]?.dispatch_view_formate,
        };

        const viewFormate = viewFormateMap[orderType];
        if (!viewFormate) return;

        const baseURL = window.location.origin;
        const printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${currentCartId}`;
        const myWindow = window.open(
          printUrl,
          "_blank",
          "width=1000,height=1000",
        );

        if (myWindow) {
          let isPrinted = false;
          myWindow.onload = () => {
            const checkContent = setInterval(() => {
              const contentElement =
                myWindow.document.querySelector("body > *");
              if (
                contentElement &&
                myWindow.document.readyState === "complete"
              ) {
                clearInterval(checkContent);

                if (!isPrinted && printSetting) {
                  isPrinted = true;
                  setTimeout(() => {
                    myWindow.print();
                  }, 2000);
                  myWindow.onafterprint = () => {
                    myWindow.close();
                  };
                  myWindow.addEventListener("afterprint", () => {
                    myWindow.close();
                  });
                }
              }
            }, 100);
          };
          myWindow.addEventListener("beforeunload", () => {
            if (!isPrinted) {
              isPrinted = true;
            }
          });
          setTimeout(() => {
            if (!isPrinted) {
              myWindow.close();
            }
          }, 10000);
        } else {
          console.error("Failed to open print");
        }
      };

      try {
        if ((orderById && orderById.cart) || converCartId || orderId) {
          // **UPDATE ORDER**
          const { data } = await axiosInstance.post(
            "updateOrder",
            combinedPayloadUpdate,
          );

          if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(data.ack_msg || "Order updated successfully");

            // **Use existing cartId**
            const updatedCartId = cartId;

            // **Execute actions with correct cart_id**
            if (shareInwhatsapp) {
              setTimeout(() => {
                if (platformType == 1) {
                  handleShareWhatsapp(updatedCartId);
                } else if (platformType == 2) {
                  whatsappTemplateCloudeSend(
                    {
                      orderId: updatedCartId,
                      appId: localStorage.getItem("UUID"),
                    },
                    `carts_${isOrderShowNum}`,
                    {
                      customer_mobile_number: String(
                        cartPayload?.to_customer_phone,
                      ),
                    },
                  );
                }
              }, 2000);
            }
            if (syncWithMiracle) {
              syncMiracleInvoice(updatedCartId);
            }
            if (downloadPdf) {
              setTimeout(() => {
                handleDownloadPdf(updatedCartId);
              }, 2000);
            }
            if (startWorkFlow) {
              startWorkflow(
                approveData.dropdownValue,
                updatedCartId,
                "cart",
                handleSubmit,
              );
            }
            if (shouldPrint) {
              handlePrintForOrderType(
                type,
                updatedCartId,
                data.data.companyDetail,
              );
            }

            handleSubmit();
            setShowapproveModel(false);
            setButtonloding(false);

            if (flag === "quick") {
              handleClear();
            } else {
              handleHide();
              onHide();
            }
          } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            setButtonloding(false);
          }
        } else {
          // **CREATE ORDER**
          const { data } = await axiosInstance.post("createOrder", {
            cart: cartPayload,
            items: cartItemsPayload,
            a_application_login_id,
            Approve_application_login_id,
            is_approve: isApprove,
          });

          if (
            data.code === 200 &&
            data.ack === DEFAULT_STATUS_CODE_SUCCESS &&
            data.data.item[0].cart_id > 0
          ) {
            toast.success(data.ack_msg || "Order created successfully");

            // **Get cart_id from API response**
            const newCartId = data.data.item[0].cart_id;
            const orderType = data.data.item[0].cart_type;

            // **Update state**
            setCartId(newCartId);

            handleSubmit();
            setShowapproveModel(false);
            setButtonloding(false);

            // **Handle file upload with correct cart_id**
            if (uploadedFiles && uploadedFiles.length > 0) {
              const formData = new FormData();
              uploadedFiles.forEach((item) => {
                formData.append("images", item.file);
                formData.append(
                  "display_orders",
                  item.display_order.toString(),
                );
              });
              formData.append("cart_id", newCartId.toString());
              formData.append(
                "a_application_login_id",
                data.data.item[0].a_application_login_id,
              );

              await axiosInstance.post("orderAttachment", formData, {
                headers: {
                  Authorization: `${token}`,
                  "x-tenant-id": localId,
                  "Content-Type": "multipart/form-data",
                },
              });
            }

            // **Execute actions with correct cart_id**
            if (shareInwhatsapp) {
              setTimeout(() => {
                if (platformType == 1) {
                  handleShareWhatsapp(newCartId);
                } else if (platformType == 2) {
                  whatsappTemplateCloudeSend(
                    { orderId: newCartId, appId: localStorage.getItem("UUID") },
                    `carts_${isOrderShowNum}`,
                    {
                      customer_mobile_number: String(
                        cartPayload?.to_customer_phone,
                      ),
                    },
                  );
                }
              }, 2000);
            }
            if (syncWithMiracle) {
              syncMiracleInvoice(newCartId);
            }
            if (downloadPdf) {
              setTimeout(() => {
                handleDownloadPdf(newCartId);
              }, 2000);
            }

            if (startWorkFlow) {
              startWorkflow(
                approveData.dropdownValue,
                newCartId,
                "cart",
                handleSubmit,
              );
            }

            if (shouldPrint) {
              handlePrintForOrderType(
                orderType,
                newCartId,
                data.data.companyDetail,
              );
            }

            if (flag === "quick") {
              handleClear();
              setIsCloseConfirmation(false);
              setIsSuccess(true);
            } else {
              handleHide();
              onHide();
            }
          } else {
            setIsError(true);
            setButtonloding(false);
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          }
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
        );
        setButtonloding(false);
      }
    }
  };

  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "AwesomeFileName",
  });

  const openInNewTabPrint = (path: string) => {
    const baseURL = window.location.origin;
    // window.open(`${baseURL}${path}/${cartId}`, "_blank");
    const printUrl = `${baseURL}${path}/${cartId}`;
    const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");
    if (myWindow) {
      let isPrinted = false;
      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted && printSetting) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 2000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
          }
        }, 100);
      };
      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });
      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    } else {
      console.error("Failed to open print");
    }
  };

  // For a pdfme-enabled Quotation/Sales Order, Print generates the real PDF
  // and opens/prints it directly — same shape as Download and
  // ListOrderView.tsx's openPrint(): check flag+template count first, open
  // nothing until we know what to generate. Legacy (openInNewTabPrint
  // above) is unchanged for every other type or when the flag is off.
  const isPdfmeEnabledForType = async (cartTypeId: number): Promise<boolean> => {
    if (!isPdfmeSupportedCartType(cartTypeId)) return false;
    const companyMastersId = localStorage.getItem("COMPANY_ID");
    if (!companyMastersId) return false;
    try {
      const { data } = await axiosInstance.post("get-feature-flag", {
        company_masters_id: companyMastersId,
        feature_key: "document_designer",
      });
      return data?.ack === 1 && !!data.data.item.is_enabled;
    } catch {
      return false;
    }
  };

  // autoPrint=true (Print action) opens the real PDF and triggers the
  // browser print dialog on it. autoPrint=false ("Open Print View" —
  // view-only) opens the same real PDF but just displays it — no print
  // dialog. Previously "Open Print View" showed this component's own
  // stale on-screen layout instead (printFlag suppresses all auto-print
  // effects on that route), which never reflected the actual Designer
  // template for a pdfme-enabled type.
  const generatePdfWindow = async (documentTemplateId: number | undefined, autoPrint: boolean) => {
    setPrintLoading(true);
    try {
      const resops = await axiosInstance.post("/order-pdf", {
        cart_id: cartId,
        ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}),
      });
      if (resops.data.ack !== 1) {
        toast.error(resops.data.ack_msg);
        return;
      }
      const response = await axios.get(resops.data.data.path, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, "_blank");
      if (pdfWindow && autoPrint) {
        pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setPrintLoading(false);
    }
  };

  const generateAndPrintPdf = (documentTemplateId?: number) => generatePdfWindow(documentTemplateId, true);
  const generateAndViewPdf = (documentTemplateId?: number) => generatePdfWindow(documentTemplateId, false);

  const printWithTemplate = (templateId: number) => {
    setPrintTemplateChoices([]);
    if (printMode === "view") {
      generateAndViewPdf(templateId);
    } else {
      generateAndPrintPdf(templateId);
    }
  };

  const handleDownload = async (documentTemplateId?: number) => {
    try {
      setRefreshDownload(true);
      const token = localStorage.getItem("token");
      const getUUID = localStorage.getItem("UUID");
      const resops = await axiosInstance.post("/order-pdf", {
        cart_id: cartId,
        ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}),
      });

      if (resops.data.ack === 1) {
        const fileUrl = resops.data.data.path;
        const response = await axios.get(fileUrl, { responseType: "blob" });
        const fileName = resops.data.data.title;
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setRefreshDownload(false);
        // handleHide();
      } else {
        toast.error(resops.data.ack_msg);
        setRefreshDownload(false);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
      setRefreshDownload(false);
    }
  };
  const handleShare = async () => {
    try {
      setRrefreshShare(true);
      const token = localStorage.getItem("token");
      const getUUID = localStorage.getItem("UUID");

      const { data } = await axiosInstance.post("/send-sales-pdf-whatsapp", {
        cart_id: cartId,
        a_application_login_id: getUUID,
      });
      if (data && data.code == 200) {
        toast.success("WhatsApp message sent successfully.");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
      setRrefreshShare(false);
    } finally {
      setRrefreshShare(false);
    }
  };

  const openPdf = () => {
    const permissionMap: Record<number, boolean> = {
      1: canPdfQuo,
      2: canPdfOrder,
      3: canPdfInv,
      4: canPdfPurchase,
      5: canPdfPurchaseOrder,
      6: canPdfReturnSalesInvoice,
      7: canPdfReturnPurchaseInvoice,
      8: canPdfInward,
      9: canPdfDispatch,
      12: canPdfProfomaInvoice,
    };
    const orderNum = newOrderShowNumAfterConversion || isOrderShowNum;
    if (permissionMap[orderNum]) {
      downloadWithPicker();
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // §7 picker — check flag+template count first, same rule as Download
  // everywhere else in the app: skip below 2 templates.
  const downloadWithPicker = async () => {
    const cartTypeId = newOrderShowNumAfterConversion || isOrderShowNum;
    const choices = await fetchPdfmeTemplatesForPicker(cartTypeId);
    if (choices.length < 2) {
      await handleDownload();
      return;
    }
    setDownloadTemplateChoices(choices);
    setShowDownloadPicker(true);
  };

  const openShare = () => {
    const permissionMap: Record<number, boolean> = {
      1: canPdfQuo,
      2: canPdfOrder,
      3: canPdfInv,
      4: canPdfPurchase,
      5: canPdfPurchaseOrder,
      6: canPdfReturnSalesInvoice,
      7: canPdfReturnPurchaseInvoice,
      8: canPdfInward,
      9: canPdfDispatch,
      12: canPdfProfomaInvoice,
    };
    if (permissionMap[newOrderShowNumAfterConversion || isOrderShowNum]) {
      if (platformType == 1) {
        handleShare();
      } else if (platformType == 2) {
        whatsappTemplateCloudeSend(
          { orderId: cartId, appId: localStorage.getItem("UUID") },
          `carts_${isOrderShowNum}`,
          {
            customer_mobile_number: String(orderById.cart.to_customer_phone),
          },
          undefined,
          setIsWhatsAppCloudLoading,
        );
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openPrint = async (flag: number) => {
    const permissionMap: Record<number, boolean> = {
      1: canPrintQuo,
      2: canPrintOrder,
      3: canPrintInv,
      4: canPrintPurchase,
      5: canPrintPurchaseOrder,
      6: canPrintReturnSalesInvoice,
      7: canPrintReturnPurchaseInvoice,
      8: canPrintInward,
      9: canPrintDispatch,
      12: canPrintProfomaInovice,
    };
    const cartTypeId = newOrderShowNumAfterConversion || isOrderShowNum;
    if (permissionMap[cartTypeId]) {
      // Intercept BOTH flag=2 ("print now") and flag=1 ("Open Print
      // View") for pdfme-supported+enabled types — flag=1 used to open
      // this component's own stale on-screen layout (printFlag suppresses
      // all auto-print effects on that route), never reflecting the real
      // Designer template. Now both show the actual generated PDF; only
      // flag=2 auto-triggers the print dialog on it. Short-circuits
      // before the await for non-pdfme types, so window.open() in the
      // legacy branches below still fires synchronously within this
      // click's event-handler call stack.
      if (isPdfmeSupportedCartType(cartTypeId) && (await isPdfmeEnabledForType(cartTypeId))) {
        setPrintMode(flag == 2 ? "print" : "view");
        setPrintLoading(true);
        const choices = await fetchPdfmeTemplatesForPicker(cartTypeId);
        setPrintLoading(false);
        if (choices.length > 1) {
          setPrintTemplateChoices(choices);
        } else if (flag == 2) {
          generateAndPrintPdf();
        } else {
          generateAndViewPdf();
        }
        return;
      }
      if (orderTypesNameFind == "Quotation") {
        const printID = printDate.map(
          (item, index) => item.quotation_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Sales Order" && printDate) {
        const printID = printDate.map((item, index) => item.order_view_formate);
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Sales Invoice" && printDate) {
        const printID = printDate.map(
          (item, index) => item.invoice_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Purchase Invoice" && printDate) {
        const printID = printDate.map(
          (item, index) => item.purchase_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Purchase Order" && printDate) {
        const printID = printDate.map(
          (item, index) => item.purchase_order_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Return Sales Invoice" && printDate) {
        const printID = printDate.map(
          (item, index) => item.return_sales_invoice_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Return Purchase Invoice" && printDate) {
        const printID = printDate.map(
          (item, index) => item.return_purchase_invoice_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Inward" && printDate) {
        const printID = printDate.map(
          (item, index) => item.inward_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Dispatch" && printDate) {
        const printID = printDate.map(
          (item, index) => item.dispatch_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
      if (orderTypesNameFind == "Proforma Invoice" && printDate) {
        const printID = printDate.map(
          (item, index) => item.proforma_invoice_view_formate,
        );
        if (flag == 2) {
          openInNewTabPrint(`/OrderPrintViewV${printID}`);
        } else {
          const baseURL = window.location.origin;
          window.open(
            `${baseURL}/OrderPrintViewV${printID}/${cartId}/1`,
            "_blank",
          );
        }
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const editCart = (shouldPrint: boolean) => {
    if (!orderById) {
      onSaveAndDraft(2, shouldPrint);
    } else {
      const permissionMap: Record<number, boolean> = {
        1: canEditQuo,
        2: canEditOrder,
        3: canEditInv,
        4: canEditPurchase,
        5: canEditPurchaseOrder,
        6: canEditReturnSalesInvoice,
        7: canEditReturnPurchaseInvoice,
        8: canEditInward,
        9: canEditDispatch,
        12: canEditProfomaInvoice,
      };
      if (permissionMap[newOrderShowNumAfterConversion || isOrderShowNum]) {
        onSaveAndDraft(2, shouldPrint);
      } else {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      }
    }
    setRefreshReport && setRefreshReport(true);
  };

  const onSubmitApprove = async () => {
    const errors = await validateCartItemsAndFields();

    // if (Object.keys(errors).length > 0) {
    //   toast.error("Required fields are missing. Please check the form.");
    //   return;
    // }
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    setShowapproveModel(true);
  };

  const onSubmit = async (
    shouldPrint: boolean,
    shareInwhatsapp?: boolean,
    downloadPdf?: boolean,
    startWorkFlow?: boolean,
    approveSeries?: string,
    enteredSeriesNumber?: string,
    enteredSeriesDate?: string,
    transaction_mode?: string,
    selectedMiracleLedger_main?: string,
    syncWithMiracle?: boolean,
  ) => {
    if (orderById) {
      const permissionMap1: Record<number, boolean> = {
        1: canApproveQuo,
        2: canApproveOrder,
        3: canApproveInv,
        4: canApprovePurchase,
        5: canApprovePurchaseOrder,
        6: canApproveReturnSalesInvoice,
        7: canApproveReturnPurchaseInvoice,
        8: canApproveInward,
        9: canApproveDispatch,
        12: canApproveProfomaInvoice,
      };

      const permissionMap: Record<number, boolean> = {
        1: canEditQuo,
        2: canEditOrder,
        3: canEditInv,
        4: canEditPurchase,
        5: canEditPurchaseOrder,
        6: canEditReturnSalesInvoice,
        7: canEditReturnPurchaseInvoice,
        8: canEditInward,
        9: canEditDispatch,
        12: canEditProfomaInvoice,
      };
      if (
        permissionMap[newOrderShowNumAfterConversion || isOrderShowNum] &&
        permissionMap1[newOrderShowNumAfterConversion || isOrderShowNum]
      ) {
        onSaveAndDraft(
          1,
          shouldPrint,
          shareInwhatsapp,
          downloadPdf,
          startWorkFlow,
          approveSeries,
          enteredSeriesNumber,
          enteredSeriesDate,
          transaction_mode,
          selectedMiracleLedger_main,
          syncWithMiracle,
        );
      } else {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      }
    } else {
      const permissionMap: Record<number, boolean> = {
        1: canApproveQuo,
        2: canApproveOrder,
        3: canApproveInv,
        4: canApprovePurchase,
        5: canApprovePurchaseOrder,
        6: canApproveReturnSalesInvoice,
        7: canApproveReturnPurchaseInvoice,
        8: canApproveInward,
        9: canApproveDispatch,
        12: canApproveProfomaInvoice,
      };

      if (permissionMap[newOrderShowNumAfterConversion || isOrderShowNum]) {
        onSaveAndDraft(
          1,
          shouldPrint,
          shareInwhatsapp,
          downloadPdf,
          startWorkFlow,
          approveSeries,
          enteredSeriesNumber,
          enteredSeriesDate,
          transaction_mode,
          selectedMiracleLedger_main,
          syncWithMiracle,
        );
      } else {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      }
    }
    setRefreshReport && setRefreshReport(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isBarcode && productList && productList.length > 0) {
        addToCart(productList[0]);
        setFocusedProductIndex(null);
        fetchProductApiForOrder(
          0,
          ITEMS_PER_PAGE,
          searchTerm,
          0,
          selectedCategory,
          selectedPriceList,
          Contact,
          setProductList,
          isOrderShowNum,
          7,
          isPriceListTouched,
        );
        searchInputRef.current?.focus();
      } else if (
        focusedProductIndex !== null &&
        productList &&
        productList[focusedProductIndex] &&
        !cartnumber
      ) {
        const selectedProduct = productList[focusedProductIndex];
        if (
          isProductInCart(selectedProduct.id) &&
          dynamicProductAdd.includes(1)
        ) {
          updateCartQuantity(selectedProduct.id, 1);
        } else {
          addToCart(selectedProduct);
        }
        setFocusedProductIndex(null);
        fetchProductApiForOrder(
          0,
          ITEMS_PER_PAGE,
          searchTerm,
          0,
          selectedCategory,
          selectedPriceList,
          Contact,
          setProductList,
          isOrderShowNum,
          8,
          isPriceListTouched,
        );
        searchInputRef.current?.focus();
      }
    } else if (e.key === "ArrowDown" && productList && productList.length > 0) {
      e.preventDefault();
      setFocusedProductIndex(0);
      setTimeout(() => {
        productRefs.current[0]?.focus();
      }, 0);
    }
  };

  const handleModalMakeCopy = (id: number, cartType: number) => {
    const permissionMap: Record<number, boolean> = {
      1: canEditQuo,
      2: canEditOrder,
      3: canEditInv,
      4: canEditPurchase,
      5: canEditPurchaseOrder,
      6: canEditReturnSalesInvoice,
      7: canEditReturnPurchaseInvoice,
      8: canEditInward,
      9: canEditDispatch,
      12: canEditProfomaInvoice,
    };

    if (permissionMap[newOrderShowNumAfterConversion || isOrderShowNum]) {
      setConverCartId(id);
      setIsMakeCartCopyConfirmation(true);
      setMakeCopyType(cartType);
    } else {
      setIsMakeCartCopyConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openPendingPrint = (id: number, type: number) => {
    const baseURL = window.location.origin;

    let printId;

    printId = orderTypesList?.find(
      (option) =>
        Number(option.id) === newOrderShowNumAfterConversion || isOrderShowNum,
    )?.id;
    window.open(`${baseURL}/PendingPrintViewV1/${id}/${type}`, "_blank");
  };

  useEffect(() => {
    if (show && companyTerms.length > 0 && !orderById) {
      const cleanedTerms = companyTerms
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();

      setCartTermsAndCondition(cleanedTerms);
    }
    if (show && companyNote && companyNote.length > 0 && !orderById) {
      const cleanedNote = companyNote
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();

      setCartNote(cleanedNote);
    }

    // For Remark
    if (show && companyRemark && companyRemark.length > 0 && !orderById) {
      const cleanedRemark = companyRemark
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();

      setCartRemark(cleanedRemark);
    }
  }, [show, companyTerms, orderById]);

  // const updateCartQuantity = (productId: number, quantityChange: number) => {
  //   if (
  //     (isOrderShowNum === 9 || isOrderShowNum === 8) &&
  //     orderbyidList?.cart?.referance_cart_id &&
  //     quantityChange > 0
  //   ) {
  //     toast.error("Cannot increase quantity in Dispatch with reference order");
  //     return;
  //   }

  //   setCart((prevCartItems: any[]) =>
  //     prevCartItems.map((item) =>
  //       item.id === productId
  //         ? { ...item, quantity: item.quantity + quantityChange }
  //         : item,
  //     ),
  //   );
  // };

  const updateCartQuantity = (productId: number, quantityChange: number) => {
    if (
      (isOrderShowNum === 9 || isOrderShowNum === 8) &&
      orderbyidList?.cart?.referance_cart_id &&
      quantityChange > 0
    ) {
      toast.error("Cannot increase quantity in Dispatch with reference order");
      return;
    }

    setCart((prevCartItems: any[]) =>
      prevCartItems.map((item) => {
        if (item.id !== productId) return item;

        const newQuantity = item.quantity + quantityChange;

        const innerPack = Number(item.product_inner_qty) || 1;
        const outerPack = Number(item.product_outer_qty) || 1;

        let outerQty = 0;
        let innerQty = 0;
        let looseQty = 0;

        // CASE 2 → ONLY INNER
        if (isOrderClassification === 2) {
          innerQty = Math.floor(newQuantity / innerPack);
          looseQty = newQuantity - innerQty * innerPack;
        }

        // CASE 3 → ONLY OUTER
        else if (isOrderClassification === 3) {
          outerQty = Math.floor(newQuantity / outerPack);
          looseQty = newQuantity - outerQty * outerPack;
        }

        // CASE 4 → INNER + OUTER
        else if (isOrderClassification === 4) {
          outerQty = Math.floor(newQuantity / outerPack);

          const remaining = newQuantity - outerQty * outerPack;

          innerQty = Math.floor(remaining / innerPack);

          const used = outerQty * outerPack + innerQty * innerPack;

          looseQty = newQuantity - used;
        }

        return {
          ...item,
          quantity: newQuantity,
          item_inner_quantity: innerQty,
          item_outer_quantity: outerQty,
          item_loose_quantity: looseQty,
        };
      }),
    );
  };

  useEffect(() => {
    const handleProductNavigation = (e: KeyboardEvent) => {
      if (
        focusedProductIndex !== null &&
        productList &&
        productList.length > 0
      ) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedProductIndex((prev) =>
            prev !== null && prev < productList.length - 1 ? prev + 1 : prev,
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedProductIndex((prev) => {
            if (prev !== null && prev > 0) {
              return prev - 1;
            } else if (prev === 0) {
              searchInputRef.current?.focus();
              return null;
            }
            return prev;
          });
        }
      }
    };

    if (
      show &&
      focusedProductIndex !== null &&
      productRefs.current[focusedProductIndex]
    ) {
      productRefs.current[focusedProductIndex]?.focus();
    }

    window.addEventListener("keydown", handleProductNavigation);
    return () => window.removeEventListener("keydown", handleProductNavigation);
  }, [show, focusedProductIndex, productList]);

  const isDisabled =
    (orderTypesNameFind !== "Quotation" &&
      orderTypesNameFind !== "Sales Order" &&
      orderTypesNameFind !== "Sales Invoice" &&
      orderTypesNameFind !== "Proforma Invoice" &&
      orderTypesNameFind !== "Purchase Order" &&
      !!cartnumber) ||
    selectedCurrency?.value === defaultCurrency?.value;
  // const isDisabledPayment = !!orderNumber;
  const isDisabledPayment =
    orderTypesNameFind !== "Sales Invoice" && !!cartnumber;

  useEffect(() => {
    searchInputRef.current && searchInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (isSuccess || isError) {
      setTimeout(() => {
        setIsError(false);
        setIsSuccess(false);
      }, 2000);
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    if (orderTypesNameFind == "Quotation") {
      setReportName("quotation");
    } else if (orderTypesNameFind == "Sales Order") {
      setReportName("order");
    } else if (orderTypesNameFind == "Sales Invoice") {
      setReportName("order_invoice");
    } else if (orderTypesNameFind == "Purchase Invoice") {
      setReportName("purchase_invoice");
    } else if (orderTypesNameFind == "Purchase Order") {
      setReportName("purchase_order");
    } else if (orderTypesNameFind == "Proforma Invoice") {
      setReportName("profoma_invoice");
    }
  });

  // const calculateMainQuantity = (item: any) => {
  //   const innerPart =
  //     (item.item_inner_quantity || 0) *
  //     (item.product_inner_qty || 1);

  //   const outerPart =
  //     (item.item_outer_quantity || 0) *
  //     (item.product_inner_qty || 1) *
  //     (item.product_outer_qty || 1);

  //   return innerPart + outerPart;
  // };

  const calculateMainQuantity = (item: any) => {
    let productInner = Number(item.product_inner_qty) || 1;
    let productOuter = Number(item.product_outer_qty) || 1;

    let innerQty = Number(item.item_inner_quantity) || 0;
    let outerQty = Number(item.item_outer_quantity) || 0;
    let looseQty = Number(item.item_loose_quantity) || 0;
    let totalInner = 0;
    let totalOuter = 0;
    // CASE 4 → INNER + OUTER
    if (isOrderClassification === 4) {
      if (innerQty !== 0) {
        totalInner = innerQty * productInner;
      }

      if (outerQty !== 0) {
        totalOuter = outerQty * productOuter;
      }

      return totalInner + totalOuter;
    }

    // CASE 2 → ONLY INNER
    if (isOrderClassification === 2) {
      return innerQty !== 0 ? innerQty * productInner : 0;
    }

    // CASE 3 → ONLY OUTER
    if (isOrderClassification === 3) {
      return outerQty !== 0 ? outerQty * productOuter : 0;
    }

    return 0;
  };

  const handleModalConvertIntoOrder = (id: number, number: string) => {
    if (canEditOrder) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("order");
      setIsConvetIntoOrderConfirmation(true);
    } else {
      setIsConvetIntoOrderConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalConvertIntoInvoice = (id: number, number: string) => {
    if (canEditInv) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvertIntoInvoiceConfirmation(true);
      setConversionType("invoice");
    } else {
      setIsConvertIntoInvoiceConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoProforma = (id: number, number: string) => {
    if (canApproveProfomaInvoice || canEditProfomaInvoice) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvertIntoProformaConfirmation(true);
      setConversionType("proforma");
    } else {
      setIsConvertIntoProformaConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalConvertIntoDisPatch = (id: number, number: string) => {
    if (canEditDispatch) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvertIntoDisPatchConfirmation(true);
      setConversionType("dispatch");
    } else {
      setIsConvertIntoDisPatchConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoInward = (id: number, number: string) => {
    if (canEditInward) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvertIntoInwardConfirmation(true);
      setConversionType("Inward");
    } else {
      setIsConvertIntoInwardConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoPurchaseInvoice = (
    id: number,
    number: string,
  ) => {
    if (canEditPurchase) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvertPurchaseIntoInvoiceConfirmation(true);
      setConversionType("purchaseInvoice");
    } else {
      setIsConvertPurchaseIntoInvoiceConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoReturnPurchaseInvoice = (
    id: number,
    number: string,
  ) => {
    if (true) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("returnPurchaseInvoice");
      setIsConvertPurchaseIntoReturnPurchaseInvoiceConfirmation(true);
    } else {
      setIsConvertPurchaseIntoReturnPurchaseInvoiceConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalConvertIntoReturnSalesInvoice = (
    id: number,
    number: string,
  ) => {
    if (true) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("returnSalesInvoice");
      setIsConvertIntoReturnSalesInvoiceConfirmation(true);
    } else {
      setIsConvertIntoReturnSalesInvoiceConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const showTooltip = (text: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip(text);
    let toolTipBgColorContain = "#fff";
    setTolltipBgColor(toolTipBgColorContain);
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 50 });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const openPrintSetting = () => {
    if (canViewPrintSetting) {
      if (
        (newOrderShowNumAfterConversion || isOrderShowNum) &&
        isOrderViewFormate
      ) {
        fetchprintSetting(
          setPrintSetting,
          Number(
            PRINT_SETTING_TYPE_OBJ[
            String(
              isOrderShowNum || newOrderShowNumAfterConversion,
            ) as keyof typeof PRINT_SETTING_TYPE_OBJ
            ],
          ),
          Number(isOrderViewFormate),
        ).then(() => {
          setIsPrintSettingShow(true);
        });
      } else {
        setIsPrintSettingShow(true);
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openCloseRight = () => {
    if (openCloseRightSide) {
      setOpenCloseRight(false);
    } else {
      setOpenCloseRight(true);
    }
  };

  let contact_name = orderId ? Contact?.to_customer_name : Contact?.person_name;
  let company_contact_name = orderId
    ? Contact?.to_customer_name
    : Contact?.company_name;

  const formatDateForInput = (localDateString: string) => {
    if (!localDateString) return "";

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateString)) {
      return localDateString;
    }

    if (localDateString.includes("Z") || localDateString.includes("+")) {
      const date = new Date(localDateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    return localDateString;
  };

  const convertUTCToLocal = (utcString: string): string => {
    if (!utcString) return "";

    try {
      const date = new Date(utcString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("UTC to Local conversion error:", error);
      return "";
    }
  };

  const convertLocalToUTC = (localDateTimeString: string): string => {
    if (!localDateTimeString) return "";

    try {
      // Create date object from datetime-local input (treats as local time)
      const localDate = new Date(localDateTimeString);
      if (isNaN(localDate.getTime())) return "";

      // Convert to UTC ISO string
      return localDate.toISOString();
    } catch (error) {
      console.error("Local to UTC conversion error:", error);
      return "";
    }
  };

  const openCreateProduct = () => {
    if (canAddProduct) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  if (refreshProduct) {
    fetchProductApiForOrder(
      0,
      ITEMS_PER_PAGE,
      searchTerm,
      searchBarcodeNum,
      selectedCategory,
      selectedPriceList,
      Contact,
      setProductList,
      isOrderShowNum,
      9,
      isPriceListTouched,
    );
    setRefreshProduct(false);
  }

  const handleReportClose = () => {
    handleHide();
  };

  useEscapeKey(handleReportClose);

  const parts = cartnumber.split("/");
  const firstPastOfCartNumber = parts[0];
  const lastPastOfCartNumber = parts[parts.length - 1];

  useEffect(() => {
    if (!printDate?.length) return;

    const first = printDate[0];
    // Set the state values
    setDynamicImageView(printDate.map((i) => i.in_order_image_view));
    setDynamicProductAdd(printDate.map((i) => i.same_product_multiple_in_cart));

    setDynamicSalesInvoiceTitle(first.invoice_title || "");
    setDynamicPurchaseInvoiceTitle(first.purchase_title || "");
    setDynamicSalesOrderTitle(first.order_title || "");
    setDynamicReturnSalesInvoice(first.return_sales_invoice_title || "");
    setDynamicReturnPurchaseInvoice(first.return_purchase_invoice_title || "");
    setDynamicDispatch(first.dispatch_title || "");
    setDynamicInward(first.inward_title || "");

    switch (orderTypesNameFind) {
      case "Quotation":
        setDynamicGstSwitch(first.quotation_view_formate);
        setDynamicTitle(first.quotation_title || "");
        setDynamicTitleColour("#439c51ff");
        setCompanyNote(first.quotation_note || "");
        setCompanyRemark(first.quotation_remark || "");
        setCompanyTerms(first.quotation_terms_conditions || "");
        setDynamicStartWorkflow(5);
        setPackingForwardingChargeTitle(first.quotation_packing_charge_title);
        setTransportChargeTitle(first.quotation_transport_charge_title);
        setDynamicTCSTitle(first.quotation_tcs_title);
        setDynamicTCSRate(first.quotation_tsc_percentage);

        break;

      case "Proforma Invoice":
        setDynamicGstSwitch(first.proforma_invoice_view_formate);
        setDynamicTitle(first.proforma_invoice_title || "");
        setDynamicTitleColour("#439c51ff");
        setCompanyNote(first.proforma_invoice_note || "");
        setCompanyRemark(first.proforma_invoice_remark || "");
        setCompanyTerms(first.proforma_invoice_terms_conditions || "");
        setDynamicStartWorkflow(5);
        setPackingForwardingChargeTitle(
          first.proforma_invoice_packing_charge_title,
        );
        setTransportChargeTitle(first.proforma_invoice_transport_charge_title);
        setDynamicTCSTitle(first.proforma_invoice_tcs_title);
        setDynamicTCSRate(first.proforma_invoice_tsc_percentage);

        break;

      case "Sales Order":
        setDynamicGstSwitch(first.order_view_formate);
        setDynamicTitle(first.order_title || "");
        setDynamicTitleColour("#1B3C53");
        setCompanyTerms(first.order_terms_conditions || "");
        setCompanyNote(first.order_note || "");
        setCompanyRemark(first.order_remark || "");
        setDynamicStartWorkflow(6);
        setPackingForwardingChargeTitle(
          first.order_packing_charge_title || "Packing Forwarding charge",
        );
        setTransportChargeTitle(first.order_transport_charge_title);
        setDynamicTCSTitle(first.order_tcs_title);
        setDynamicTCSRate(first.order_tsc_percentage);

        break;

      case "Sales Invoice":
        setDynamicGstSwitch(first.invoice_view_formate);
        setDynamicTitle(first.invoice_title || "");
        setDynamicTitleColour("#896C6C");
        setCompanyTerms(first.sales_invoice_terms_conditions || "");
        setCompanyNote(first.sales_invoice_note || "");
        setCompanyRemark(first.sales_invoice_remark || "");
        setDynamicStartWorkflow(7);
        setPackingForwardingChargeTitle(
          first.sales_invoice_packing_charge_title,
        );
        setTransportChargeTitle(first.sales_invoice_transport_charge_title);
        setDynamicTCSTitle(first.sales_invoice_tcs_title);
        setDynamicTCSRate(first.sales_invoice_tsc_percentage);

        break;

      case "Purchase Invoice":
        setDynamicGstSwitch(first.purchase_view_formate);
        setDynamicTitle(first.purchase_title || "");
        setDynamicTitleColour("#3E3F29");
        setCompanyTerms(first.purchase_invoice_terms_conditions || "");
        setCompanyNote(first.purchase_invoice_note || "");
        setCompanyRemark(first.purchase_invoice_remark || "");
        setDynamicStartWorkflow(10);
        setPackingForwardingChargeTitle(
          first.purchase_invoice_packing_charge_title,
        );
        setTransportChargeTitle(first.purchase_invoice_transport_charge_title);
        setDynamicTCSTitle(first.purchase_invoice_tcs_title);
        setDynamicTCSRate(first.purchase_invoice_tsc_percentage);

        break;

      case "Purchase Order":
        setDynamicGstSwitch(first.purchase_order_view_formate);
        setDynamicTitle(first.purchase_order_title || "");
        setDynamicTitleColour("#090040");
        setCompanyTerms(first.purchase_order_terms_conditions || "");
        setCompanyNote(first.purchase_order_note || "");
        setCompanyRemark(first.purchase_order_remark || "");
        setDynamicStartWorkflow(9);
        setPackingForwardingChargeTitle(
          first.purchase_order_packing_charge_title,
        );
        setTransportChargeTitle(first.purchase_order_transport_charge_title);
        setDynamicTCSTitle(first.purchase_order_tcs_title);
        setDynamicTCSRate(first.purchase_order_tsc_percentage);

        break;

      case "Return Sales Invoice":
        setDynamicGstSwitch(first.return_sales_invoice_view_formate);
        setDynamicTitle(first.return_sales_invoice_title || "");
        setDynamicTitleColour("#670D2F");
        setCompanyTerms(first.return_sales_invoice_terms_conditions || "");
        setCompanyNote(first.return_sales_invoice_note || "");
        setCompanyRemark(first.return_sales_invoice_remark || "");
        setDynamicStartWorkflow(8);
        setPackingForwardingChargeTitle(
          first.return_sales_invoice_packing_charge_title,
        );
        setTransportChargeTitle(
          first.return_sales_invoice_transport_charge_title,
        );
        setDynamicTCSTitle(first.return_sales_invoice_tcs_title);
        setDynamicTCSRate(first.return_sales_invoice_tsc_percentage);

        break;

      case "Return Purchase Invoice":
        setDynamicGstSwitch(first.return_purchase_invoice_view_formate);
        setDynamicTitle(first.return_purchase_invoice_title || "");
        setDynamicTitleColour("#735557");
        setCompanyTerms(first.return_purchase_invoice_terms_conditions || "");
        setCompanyNote(first.return_purchase_invoice_note || "");
        setCompanyRemark(first.return_purchase_invoice_remark || "");
        setDynamicStartWorkflow(11);
        setPackingForwardingChargeTitle(
          first.return_purchase_invoice_packing_charge_title,
        );
        setTransportChargeTitle(
          first.return_purchase_invoice_transport_charge_title,
        );
        setDynamicTCSTitle(first.return_purchase_invoice_tcs_title);
        setDynamicTCSRate(first.return_purchase_invoice_tsc_percentage);

        break;
      case "Inward":
        setDynamicGstSwitch(first.inward_view_formate);
        setDynamicTitle(first.inward_title || "");
        setDynamicTitleColour("#6B3F69");
        setCompanyTerms(first.inward_terms_conditions || "");
        setCompanyNote(first.inward_note || "");
        setCompanyRemark(first.inward_remark || "");
        setDynamicStartWorkflow(12);
        setPackingForwardingChargeTitle(first.inward_packing_charge_title);
        setTransportChargeTitle(first.inward_transport_charge_title);
        setDynamicTCSTitle(first.inward_tcs_title);
        setDynamicTCSRate(first.inward_tsc_percentage);

        break;
      case "Dispatch":
        setDynamicGstSwitch(first.dispatch_view_formate);
        setDynamicTitle(first.dispatch_title || "");
        setDynamicTitleColour("#819A91");
        setCompanyTerms(first.dispatch_terms_conditions || "");
        setCompanyNote(first.dispatch_note || "");
        setCompanyRemark(first.dispatch_remark || "");
        setDynamicStartWorkflow(13);
        setPackingForwardingChargeTitle(first.dispatch_packing_charge_title);
        setTransportChargeTitle(first.dispatch_transport_charge_title);
        setDynamicTCSTitle(first.dispatch_tcs_title);
        setDynamicTCSRate(first.dispatch_tsc_percentage);

        break;

      default:
        break;
    }
  }, [printDate, orderTypesNameFind]);

  useEffect(() => {
    const measureWidth = () => {
      if (hiddenRef.current && dynamicTitle) {
        const width = hiddenRef.current.offsetWidth;
        setPaddingLeft(width);
      }
    };

    measureWidth();

    const timeoutId = setTimeout(measureWidth, 100);

    return () => clearTimeout(timeoutId);
  }, [dynamicTitle, contact_name, company_contact_name, orderId, Contact]);

  const anyGstEmpty = printDate.some(
    (i) => !i.gst_number || i.gst_number.trim() === "",
  );
  const anyGstPresent = printDate.some(
    (i) => i.gst_number && i.gst_number.trim() !== "",
  );

  let switchStatus = true;

  // CASE 1: GST blank → switch OFF + disabled
  if (anyGstEmpty) {
    switchStatus = false;
  }

  // CASE 2: dynamic switch disabled modes → OFF
  else if (dynamicGstSwitch === 2 || dynamicGstSwitch === 4) {
    switchStatus = false;
  }

  // CASE 3: dynamic switch enabled modes (1 & 3) AND gst present
  else if (
    (dynamicGstSwitch === 1 || dynamicGstSwitch === 3) &&
    anyGstPresent
  ) {
    switchStatus = true;
  }

  useEffect(() => {
    if (orderById && orderById.cart) {
      setIsGstActive(
        orderById.cart.gst_amt != null &&
        orderById.cart.gst_amt != undefined &&
        orderById.cart.gst_amt > 0,
      );
    } else {
      setIsGstActive(switchStatus);
    }
  }, [orderById, dynamicGstSwitch]);

  const [selectedPaymentMode, setSelectedPaymentMode] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // const paymentModeOptions = paymentModeList.map((itemMode) => ({
  //   value: Number(itemMode.id),
  //   label: itemMode.mode_name,
  // }));

  const paymentModeOptions = useMemo<
    Array<{ value: string | number; label: string }>
  >(
    () =>
      paymentTypeList.map((mode: PaymentMode) => ({
        value: mode.id,
        label: mode.payment_type_name.trim() || "Unnamed mode",
      })),
    [paymentTypeList],
  );

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaymentMode(e.target.value);

    if (e.target.value) {
      setPaymentError("");
    }
  };

  useEffect(() => {
    setAccountLedgerFromMiracle([]);
    setSelectedMiracleLedgerAdv(null);

    if (selectedPaymentMode && isFeatureEnabled) {
      fetchMiracleAccountLedger(
        setAccountLedgerFromMiracle,
        selectedPaymentMode,
      );
    }
  }, [selectedPaymentMode]);

  const columns: ColumnDef<ICart>[] = [
    { id: "remove", size: 40, minSize: 40 },
    { id: "product_name", size: 100, minSize: 100 },
    { id: "desc", size: 120, minSize: 120 },

    ...customFormListProduct
      .filter((f) => f.form_type === 4)
      .map((f) => ({
        id: f.reference_column_name,
        size: 100,
        minSize: 100,
      })),

    { id: "hsn_code", size: 70, minSize: 70 },
    { id: "warehouse", size: 150, minSize: 150 },
    { id: "item_inner_quantity", size: 80, minSize: 80 },
    { id: "item_outer_quantity", size: 80, minSize: 80 },
    { id: "item_loose_quantity", size: 80, minSize: 80 },
    { id: "qty", size: 70, minSize: 70 },
    { id: "unit", size: 60, minSize: 60 },

    ...(orderTypesNameFind !== "Inward" && orderTypesNameFind !== "Dispatch"
      ? [
        { id: "rate", size: 90, minSize: 90 },
        { id: "discount", size: 80, minSize: 80 },
        { id: "gst", size: 90, minSize: 90 },
        { id: "amount", size: 120, minSize: 120 },
      ]
      : []),
  ];

  const table = useReactTable({
    data: cart,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,

    getCoreRowModel: getCoreRowModel(),
  });

  const getHeaderById = (id: string) =>
    table.getHeaderGroups()[0]?.headers.find((h) => h.column.id === id);

  let extraColSpan = 0;

  if (isOrderClassification === 4) {
    extraColSpan = 3;
  } else if (isOrderClassification === 2 || isOrderClassification === 3) {
    extraColSpan = 2;
  }

  const footerBaseColSpan =
    orderTypesNameFind !== "Quotation" &&
      orderTypesNameFind !== "Sales Order" &&
      orderTypesNameFind !== "Proforma Invoice" &&
      orderTypesNameFind !== "Purchase Order"
      ? (isGstActive ? 10 : 9) + extraColSpan
      : (isGstActive ? 9 : 8) + extraColSpan;

  /* Team Mamaber Fatch*/
  const fetchAllTeamMamberApi = async () => {
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };
    try {
      const data = await axiosInstance.post("my-team", requestData, {
        headers: {
          Authorization: `${token}`,
        },
      });
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS && data.data.data?.item) {
        setTeamList(data.data.data.item);
      } else {
        setTeamList([]);
      }
    } catch (error: any) {
      setTeamList([]);
    }
  };

  const TeamMamberOptions = teamMamberist.map((member: any) => ({
    value: member.id,
    label: member.username,
  }));

  const handleTeamMamberChange = (
    selectedOption: SingleValue<IOption> | null,
  ) => {
    setSelectedTeamMamber(selectedOption);
  };
  useEffect(() => {
    if (orderById?.cart?.a_application_login_id && teamMamberist.length > 0) {
      const loginId = Number(orderById.cart.a_application_login_id);

      const selected = teamMamberist.find(
        (member: any) => Number(member.id) === loginId,
      );

      if (selected) {
        setSelectedTeamMamber({
          value: selected.id,
          label: selected.username,
        });
      }
    }
    if (
      orderById?.cart?.miracle_account_ledger_adv &&
      accountLedgerFromMiracle.length > 0
    ) {
      const selectedLedger: any = accountLedgerFromMiracle.find(
        (item) => item.value === orderById.cart.miracle_account_ledger_adv,
      );

      if (selectedLedger) {
        setSelectedMiracleLedgerAdv(selectedLedger);
        setMiracleAccountLedgerIdAdv(selectedLedger.value);
      }
    }
  }, [orderById, teamMamberist, accountLedgerFromMiracle]);

  const [serialModalOpen, setSerialModalOpen] = useState(false);

  const [selectedSerialItemIndex, setSelectedSerialItemIndex] = useState<
    number | null
  >(null);

  const [serialInput, setSerialInput] = useState("");
  const openSerialModal = (index: number) => {
    setSelectedSerialItemIndex(index);
    setSerialInput("");
    setSerialModalOpen(true);
  };
  const isDispatchToInvoice =
    isOrderShowNum == 3 &&
    (orderbyidList?.cart?.reference_type == 9 ||
      orderById?.cart?.reference_type == 9);

  const isInwardToPurchaseInvoice =
    isOrderShowNum == 4 &&
    (orderbyidList?.cart?.reference_type == 8 ||
      orderById?.cart?.reference_type == 8);

  const isApprovedDocument =
    orderTypesNameFind !== "Quotation" &&
      orderTypesNameFind !== "Sales Order" &&
      orderTypesNameFind !== "Purchase Order" &&
      orderTypesNameFind !== "Proforma Invoice" &&
      cartnumber
      ? true
      : false;

  const isLockedConversion =
    isDispatchToInvoice || isInwardToPurchaseInvoice || isApprovedDocument;

  const addSerialNumber = () => {
    if (selectedSerialItemIndex === null) return;

    const value = serialInput.trim();

    if (!value) {
      toast.error("Please scan serial number");
      return;
    }

    const updatedCart = [...cart];

    const currentItem = updatedCart[selectedSerialItemIndex];
    if (isLockedConversion) {
      toast.error("Serial numbers cannot be changed or add");
      return;
    }
    if (!currentItem.serial_numbers) {
      currentItem.serial_numbers = [];
    }

    // duplicate check
    if (currentItem.serial_numbers.includes(value)) {
      toast.error("Serial number already added");
      return;
    }
    if (currentItem.serial_numbers.includes(value)) {
      toast.error("Serial number already added");
      return;
    }

    //NEW / IMPROVED RESTRICTION FOR CONVERSION
    const isConversionOrder = isOrderShowNum === 8 || isOrderShowNum === 9;
    const hasReferenceCart =
      orderById?.cart?.referance_cart_id ||
      orderbyidList?.cart?.referance_cart_id;

    if (
      isConversionOrder &&
      hasReferenceCart &&
      originalQuantities[currentItem.id]
    ) {
      const remainingQty = originalQuantities[currentItem.id];
      const currentSerialCount = currentItem.serial_numbers.length;

      if (currentSerialCount >= remainingQty) {
        toast.error(
          `You can add only ${remainingQty} serial numbers (Remaining Qty: ${remainingQty})`,
        );
        return;
      }
    }
    currentItem.serial_numbers.push(value);

    // auto qty update
    // currentItem.quantity = currentItem.serial_numbers.length;
    const updatedQty = currentItem.serial_numbers.length;

    const packingData = updatePackingQuantities(currentItem, updatedQty);

    currentItem.quantity = packingData.quantity;

    currentItem.item_inner_quantity = packingData.item_inner_quantity;

    currentItem.item_outer_quantity = packingData.item_outer_quantity;

    currentItem.item_loose_quantity = packingData.item_loose_quantity;

    setCart(updatedCart);

    setSerialInput("");

    setTimeout(() => {
      document.getElementById("serial-input-box")?.focus();
    }, 100);
  };

  const removeSerialNumber = (itemIndex: number, serialIndex: number) => {
    if (isLockedConversion) {
      toast.error("Serial numbers cannot be changed or add");
      return;
    }
    const updatedCart = [...cart];

    updatedCart[itemIndex].serial_numbers.splice(serialIndex, 1);

    // auto qty update
    const updatedQty = updatedCart[itemIndex].serial_numbers.length;

    const packingData = updatePackingQuantities(
      updatedCart[itemIndex],
      updatedQty,
    );

    updatedCart[itemIndex].quantity = packingData.quantity;

    updatedCart[itemIndex].item_inner_quantity =
      packingData.item_inner_quantity;

    updatedCart[itemIndex].item_outer_quantity =
      packingData.item_outer_quantity;

    updatedCart[itemIndex].item_loose_quantity =
      packingData.item_loose_quantity;

    setCart(updatedCart);
  };
  const handleMiracleAccountLedgerChange = (
    selectedOption: IAccountLedgerFromMiracleOptions | null,
  ) => {
    setSelectedMiracleLedgerAdv(selectedOption);

    setMiracleAccountLedgerIdAdv(
      selectedOption?.value ? Number(selectedOption.value) : null,
    );
  };
  const handleCashDiscountTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextType = e.target.checked ? "flat" : "percentage";

    const discountValue = Number(cashDiscount) || 0;

    if (nextType === "percentage" && discountValue > 100) {
      toast.error("Current discount value cannot be converted to Percentage.");

      return;
    }

    setCashDiscountType(nextType);
  };
  const handleCashDiscount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setCashDiscount("");
      return;
    }

    const discountValue = Number(value);

    if (discountValue < 0) {
      toast.error("Cash Discount cannot be negative");
      return;
    }

    if (cashDiscountType === "flat") {
      const packingCharge = parseFloat(packingForwardingCharge as string) || 0;
      const transportChargeValue = parseFloat(transportCharge as string) || 0;
      const grossTaxableAmount =
        totalAmount - showDiscount + packingCharge + transportChargeValue;

      if (discountValue > grossTaxableAmount) {
        toast.error("Cash Discount cannot be greater than Gross Taxable Amount");
        return;
      }
    }

    if (cashDiscountType === "percentage") {
      if (discountValue > 100) {
        toast.error("Percentage Discount cannot be greater than 100%");
        return;
      }
    }

    setCashDiscount(value);
  };
  return (
    <div>
      <style>
        {`
    .main-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-flow: column;
      justify-content: center;
      align-items: center;
    }

    .check-container {
      width: 6.25rem;
      height: 7.5rem;
      display: flex;
      flex-flow: column;
      align-items: center;
      justify-content: space-between;
    }

    .check-background {
      width: 100%;
      height: calc(100% - 1.25rem);
      background: linear-gradient(to bottom right, #5de593, #41d67c);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(0.84);
      opacity: 1; 
      animation: animateContainer 0.8s ease-out forwards 0s; /* 0–0.8s */
    }

    .check-background svg {
      width: 65%;
      transform: translateY(0.25rem);
      stroke-dasharray: 80;
      stroke-dashoffset: 80;
      opacity: 1;
      animation: animateCheck 0.6s ease-out forwards 0.8s; 
    }

    .check-shadow {
      bottom: calc(-15% - 5px);
      left: 0;
      border-radius: 50%;
      background: radial-gradient(closest-side, rgba(73, 218, 131, 1), transparent);
      opacity: 0;
      animation: animateShadow 0.6s ease-out forwards 1.4s; 
    }

    @keyframes animateContainer {
      0% {
        transform: scale(0.84);
        box-shadow: 0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset,
                    0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset;
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0px 0px 0px 32px rgba(255, 255, 255, 0.25) inset,
                    0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset;
      }
      100% {
        transform: scale(0.84);
        box-shadow: 0px 0px 0px 0px rgba(255, 255, 255, 0.25) inset,
                    0px 0px 0px 0px rgba(255, 255, 255, 0.25) inset;
      }
    }

    @keyframes animateCheck {
      0% { stroke-dashoffset: 80; }
      100% { stroke-dashoffset: 0; }
    }

    @keyframes animateShadow {
      0% {
        opacity: 0;
        width: 100%;
        height: 15%;
        transform: scale(0.5);
      }
      100% {
        opacity: 0.25;
        width: 85%;
        height: 15%;
        transform: scale(1);
      }
    }
      .resizer {
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
        width: 6px;
        cursor: col-resize;
        user-select: none;
        touch-action: none;
      }
  `}
      </style>

      {show && (
        <div className="modal1" style={{ textAlign: "left" }}>
          {(isSuccess || isError || isConversionSuccess) && (
            <div
              className="modal-content1"
              style={{
                width: "98%",
                marginTop: "10px",
                zIndex: "9999",
                position: "absolute",
                height: "95%",
                marginLeft: "1%",
              }}
            >
              {isError && (
                <div
                  style={{
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "12.25rem",
                      height: "14.5rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "calc(100% - 1.25rem)",
                        background:
                          "linear-gradient(to bottom right, #ff6b6b, #ff4c4c)",
                        boxShadow:
                          "0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset, 0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset",
                        transform: "scale(0.84)",
                        borderRadius: "50%",
                        animation: "animateContainer 0.8s ease-out forwards 0s", // 0–0.8s
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 1,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        fill="white"
                        style={{
                          width: "65%",
                          transform: "translateY(0.25rem)",
                          strokeDasharray: 80,
                          strokeDashoffset: 80,
                          animation: "animateCheck 0.6s ease-out forwards 0.8s", // 0.8–1.4s
                        }}
                      >
                        <path
                          d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                          stroke="white"
                        />
                      </svg>
                    </div>

                    <div
                      style={{
                        bottom: "calc(-15% - 5px)",
                        left: 0,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(closest-side, rgba(255, 76, 76, 1), transparent)",
                        animation: "animateShadow 0.6s ease-out forwards 1.4s", // 1.4–2.0s
                        width: "85%",
                        height: "15%",
                      }}
                    />
                  </div>
                  <h4>Something Went Wrong Please Try Again</h4>
                </div>
              )}

              {(isSuccess || isConversionSuccess) && (
                <div
                  style={{
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "12.25rem",
                      height: "14.5rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "calc(100% - 1.25rem)",
                        background:
                          "linear-gradient(to bottom right, #5de593, #41d67c)",
                        boxShadow:
                          "0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset, 0px 0px 0px 65px rgba(255, 255, 255, 0.25) inset",
                        transform: "scale(0.84)",
                        borderRadius: "50%",
                        animation: "animateContainer 0.8s ease-out forwards 0s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 1,
                      }}
                    >
                      <svg
                        viewBox="0 0 65 51"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          width: "65%",
                          transform: "translateY(0.25rem)",
                          strokeDasharray: 80,
                          strokeDashoffset: 80,
                          animation: "animateCheck 0.6s ease-out forwards 0.8s", // 0.8–1.4s
                        }}
                      >
                        <path
                          d="M7 25L27.3077 44L58.5 7"
                          stroke="white"
                          strokeWidth="13"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div
                      style={{
                        bottom: "calc(-15% - 5px)",
                        left: 0,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(closest-side, rgba(73, 218, 131, 1), transparent)",
                        animation: "animateShadow 0.6s ease-out forwards 1.4s", // 1.4–2.0s
                        width: "85%",
                        height: "15%",
                      }}
                    />
                  </div>
                  <h4>SuccessFully Created</h4>
                </div>
              )}
            </div>
          )}

          {!isConversionSuccess && (
            <div
              className="modal-content1"
              style={{
                width: "98%",
                backgroundColor: "rgb(240 242 245)",
                marginTop: "10px",
              }}
            >
              <div className="row d-flex justify-content-end">
                <div className="col-12">
                  <span
                    ref={hiddenRef}
                    style={{
                      visibility: "hidden",
                      position: "absolute",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dynamicTitle}
                  </span>

                  <RibbonBanner color={dynamicTitleColour}>
                    {dynamicTitle}
                  </RibbonBanner>

                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h4
                      className="modal-title1 form_header_text "
                      style={{
                        paddingLeft: `${paddingLeft + 15}px`,
                        fontSize: "14px",
                        display: "inline-block",
                      }}
                    >
                      {company_contact_name} ({contact_name}){" "}
                      {cartnumber && (
                        <span
                          style={{ fontSize: "14px", fontWeight: "normal" }}
                        ></span>
                      )}
                    </h4>

                    <div className="d-flex flex-row-reverse align-items-top">
                      <span
                        className="close ms-3"
                        onClick={() => setIsCloseConfirmation(true)}
                      >
                        ×
                      </span>
                      <span
                        className="close px-2"
                        onClick={openPrintSetting}
                        onMouseEnter={(e) => showTooltip("Print Setting", e)}
                        onMouseLeave={hideTooltip}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="28px"
                          viewBox="0 -960 960 960"
                          width="28px"
                          fill="currentColor"
                        >
                          <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                        </svg>
                      </span>
                      <span
                        className="close px-2"
                        onClick={() => handelChangeShowModelReport()}
                        onMouseEnter={(e) => showTooltip("View Report", e)}
                        onMouseLeave={hideTooltip}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="30px"
                          viewBox="0 -960 960 960"
                          width="30px"
                          fill="currentColor"
                        >
                          <path d="M80-120v-80h800v80H80Zm40-120v-280h120v280H120Zm200 0v-480h120v480H320Zm200 0v-360h120v360H520Zm200 0v-600h120v600H720Z" />
                        </svg>
                      </span>

                      {(orderById && orderById) || converCartId || orderId ? (
                        <>
                          <span
                            className="close px-2"
                            onClick={() => openPrint(2)}
                            onMouseEnter={(e) => showTooltip("Open Print", e)}
                            onMouseLeave={hideTooltip}
                          >
                            <svg
                              height="28px"
                              viewBox="0 -960 960 960"
                              width="28px"
                              fill="currentColor"
                            >
                              <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" />
                            </svg>
                          </span>

                          {refreshDownload ? (
                            <span
                              className="px-1"
                              style={{
                                color: "#aaa",
                                float: "right",
                                margin: "0px",
                                padding: "0px",
                                lineHeight: "1",
                              }}
                            >
                              <div
                                style={{ fontWeight: "normal" }}
                                className="spinner-border text-secondary"
                                role="status"
                              ></div>
                            </span>
                          ) : (
                            <span
                              className="close px-2"
                              onClick={openPdf}
                              onMouseEnter={(e) =>
                                showTooltip("Download PDF", e)
                              }
                              onMouseLeave={hideTooltip}
                            >
                              <svg
                                height="28px"
                                viewBox="0 -960 960 960"
                                width="28px"
                                fill="currentColor"
                              >
                                <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                              </svg>
                            </span>
                          )}
                          {refreshShare || isWhatsAppCloudLoading ? (
                            <span
                              className="px-1"
                              style={{
                                color: "#aaa",
                                float: "right",
                                margin: "0px",
                                padding: "0px",
                                lineHeight: "1",
                              }}
                            >
                              <div
                                style={{ fontWeight: "normal" }}
                                className="spinner-border text-secondary"
                                role="status"
                              ></div>
                            </span>
                          ) : (
                            <span
                              className="close px-2"
                              onClick={openShare}
                              onMouseEnter={(e) =>
                                showTooltip("Share PDF in WhatsApp", e)
                              }
                              onMouseLeave={hideTooltip}
                            >
                              <i
                                className="bi bi-whatsapp"
                                style={{ fontSize: "22px" }}
                              ></i>
                            </span>
                          )}

                          <span
                            className="close px-2"
                            onClick={() => openPrint(1)}
                            onMouseEnter={(e) =>
                              showTooltip("Open Print View", e)
                            }
                            onMouseLeave={hideTooltip}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="28px"
                              viewBox="0 -960 960 960"
                              width="28px"
                              fill="currentColor"
                            >
                              <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
                            </svg>
                          </span>

                          {orderTypesNameFind == "Quotation" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoOrder(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicSalesOrderTitle}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Quotation" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoProforma(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${printDate?.[0]?.proforma_invoice_title || "Proforma Invoice"}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Quotation" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicSalesInvoiceTitle}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Sales Order" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicSalesInvoiceTitle}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Dispatch" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicSalesInvoiceTitle}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Sales Order" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoDisPatch(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicDispatch}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M240-160q-50 0-85-35t-35-85H40v-440q0-33 23.5-56.5T120-800h560v160h120l120 160v200h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85H360q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T280-280q0-17-11.5-28.5T240-320q-17 0-28.5 11.5T200-280q0 17 11.5 28.5T240-240ZM120-360h32q17-18 39-29t49-11q27 0 49 11t39 29h272v-360H120v360Zm600 120q17 0 28.5-11.5T760-280q0-17-11.5-28.5T720-320q-17 0-28.5 11.5T680-280q0 17 11.5 28.5T720-240Zm-40-200h170l-90-120h-80v120ZM360-540Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Purchase Order" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoPurchaseInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicPurchaseInvoiceTitle}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Inward" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoPurchaseInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicPurchaseInvoiceTitle}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Purchase Order" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoInward(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(`Convert to ${dynamicInward}`, e)
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-120H640q-30 38-71.5 59T480-240q-47 0-88.5-21T320-320H200v120Zm280-120q38 0 69-22t43-58h168v-360H200v360h168q12 36 43 58t69 22Zm0-80L320-560l56-58 64 64v-166h80v166l64-64 56 58-160 160ZM200-200h560-560Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Purchase Invoice" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoReturnPurchaseInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicReturnPurchaseInvoice}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {orderTypesNameFind == "Sales Invoice" &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  handleModalConvertIntoReturnSalesInvoice(
                                    cartId,
                                    cartnumber,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip(
                                    `Convert to ${dynamicReturnSalesInvoice}`,
                                    e,
                                  )
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>
                            )}
                          {cartnumber != "" && (
                            <span
                              className="close px-2"
                              onClick={() =>
                                handleModalMakeCopy(
                                  cartId,
                                  newOrderShowNumAfterConversion ||
                                  isOrderShowNum,
                                )
                              }
                              onMouseEnter={(e) =>
                                showTooltip("Create New Copy", e)
                              }
                              onMouseLeave={hideTooltip}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="30px"
                                viewBox="0 -960 960 960"
                                width="30px"
                                fill="currentColor"
                              >
                                <path d="M280-160v-441q0-33 24-56t57-23h439q33 0 56.5 23.5T880-600v320L680-80H360q-33 0-56.5-23.5T280-160ZM81-710q-6-33 13-59.5t52-32.5l434-77q33-6 59.5 13t32.5 52l10 54h-82l-7-40-433 77 40 226v279q-16-9-27.5-24T158-276L81-710Zm279 110v440h280l160-160v-280H360Zm220 220Zm-40 160h80v-120h120v-80H620v-120h-80v120H420v80h120v120Z" />
                              </svg>
                            </span>
                          )}
                          {(orderTypesNameFind == "Sales Order" ||
                            orderTypesNameFind == "Purchase Order") &&
                            cartnumber != "" && (
                              <span
                                className="close px-2"
                                onClick={() =>
                                  openPendingPrint(
                                    cartId,
                                    newOrderShowNumAfterConversion ||
                                    isOrderShowNum,
                                  )
                                }
                                onMouseEnter={(e) =>
                                  showTooltip("Pending Print", e)
                                }
                                onMouseLeave={hideTooltip}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="30px"
                                  viewBox="0 -960 960 960"
                                  width="30px"
                                  fill="currentColor"
                                >
                                  <path d="M680-80q-83 0-141.5-58.5T480-280q0-83 58.5-141.5T680-480q83 0 141.5 58.5T880-280q0 83-58.5 141.5T680-80Zm67-105 28-28-75-75v-112h-40v128l87 87Zm-547 65q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v250q-18-13-38-22t-42-16v-212h-80v120H280v-120h-80v560h212q7 22 16 42t22 38H200Zm280-640q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z" />
                                </svg>
                              </span>
                            )}
                          {tooltip && (
                            <div
                              style={{
                                position: "fixed",
                                top: `calc(${pos.y}px + 65px`,
                                left: `calc(${pos.x}px - 30px)`,
                                transform: "translateX(-90%)",
                                backgroundColor: tooltipBgColor,
                                color: "#000",
                                border: "1px solid black",
                                padding: "4px 8px",
                                // padding: "2px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                zIndex: 9999,
                                pointerEvents: "none",
                                whiteSpace: "nowrap",
                                transition: "opacity 0.3s ease",
                                // marginTop: "12%"
                              }}
                            >
                              {tooltip}
                            </div>
                          )}
                        </>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row align-items-start g-3">
                {/* SR NO + DATE */}
                {cartnumber && !isDuplicateOrderLoaded && (
                  <div className="col-xl-5 col-lg-4 col-md-6">
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* SR NO */}
                      <div>
                        <label
                          className="form_label"
                          style={{ fontWeight: "bold" }}
                        >
                          SR. No.
                        </label>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "5px",
                          }}
                        >
                          {firstPastOfCartNumber && "#"}
                          {firstPastOfCartNumber}

                          <input
                            type="text"
                            className="form-control mx-1"
                            style={{
                              width: "80px",
                              height: "38px",
                            }}
                            value={srNumber}
                            onChange={handleNumberChange}
                            required
                          />

                          {lastPastOfCartNumber}
                        </div>
                      </div>

                      {/* DATE */}
                      <div>
                        <label
                          className="form_label"
                          style={{ fontWeight: "bold" }}
                        >
                          Date & Time
                        </label>

                        <input
                          type="datetime-local"
                          className="form-control mt-1"
                          style={{
                            width: "220px",
                            height: "38px",
                          }}
                          value={
                            updateDate ? formatDateForInput(updateDate) : ""
                          }
                          onChange={handleDateChange}
                          required
                          max={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MOBILE + NAME + SINGLE SUGGESTION */}
                {flag == "quick" && (
                  <div className="col-xl-4 col-lg-6 col-md-12 position-relative">
                    <div className="row">
                      {/* MOBILE */}
                      <div className="col-6">
                        <label className="form_label">Mobile No.</label>

                        <input
                          type="text"
                          className="form-control mt-1"
                          value={new_customer_mobile}
                          onChange={(e) => {
                            setActiveSuggestionField("mobile");
                            handleMobileNoChange(e);
                          }}
                        />
                      </div>

                      {/* CUSTOMER NAME */}
                      <div className="col-6">
                        <label className="form_label">Customer Name</label>

                        <input
                          type="text"
                          className="form-control mt-1"
                          value={new_customer_name}
                          onChange={(e) => {
                            setActiveSuggestionField("name");
                            handleNameChange(e);
                          }}
                        />
                      </div>
                    </div>

                    {/* SINGLE SUGGESTION BOX */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "72px",
                          left: "12px",
                          right: "12px",
                          background: "#fff",
                          border: "1px solid #ccc",
                          zIndex: 9999,
                          maxHeight: "200px",
                          overflowY: "auto",
                          borderRadius: "4px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        {suggestions.map((item: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              padding: "10px",
                              cursor: "pointer",
                              borderBottom: "1px solid #eee",
                            }}
                            onClick={() => handleSelectSuggestion(item)}
                          >
                            <div style={{ fontWeight: 600 }}>
                              {item.person_name}
                            </div>

                            <div style={{ fontSize: "13px", color: "#666" }}>
                              {item.mobile_number}

                              {item.company_name
                                ? ` • ${item.company_name}`
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CURRENCY */}
                {orderTypesNameFind !== "Inward" &&
                  orderTypesNameFind !== "Dispatch" && (
                    <div className="col-xl-2 col-lg-3 col-md-6">
                      <label
                        className="form_label"
                        style={{ fontWeight: "bold" }}
                      >
                        Currency <span className="text-danger">*</span>
                      </label>

                      <div className="mt-1">
                        <CustomSearchDropdown
                          options={currencyOptions}
                          defaultValue={defaultCurrency}
                          value={selectedCurrency}
                          onChange={(
                            selectedOption: SingleValue<IOption> | null,
                          ) => {
                            handleCurrencyChange(selectedOption);
                          }}
                        />
                      </div>
                    </div>
                  )}

                {/* RATE */}
                {orderTypesNameFind !== "Inward" &&
                  orderTypesNameFind !== "Dispatch" && (
                    <div className="col-xl-2 col-lg-3 col-md-6">
                      <label
                        className="form_label"
                        style={{ fontWeight: "bold" }}
                      >
                        Rate
                        {defaultCurrency && selectedCurrency && (
                          <span>
                            {" "}
                            (1 {selectedCurrency.label.split(" - ")[0]} = ?{" "}
                            {defaultCurrency.label.split(" - ")[0]})
                          </span>
                        )}
                      </label>

                      <input
                        type="text"
                        className="form-control mt-1"
                        style={{ height: "38px" }}
                        value={conversionRate}
                        onChange={handleConversionRateChange}
                        disabled={isDisabled}
                        required
                      />
                    </div>
                  )}

                {/* TEAM MEMBER */}
                {cartnumber == "" && (
                  <div className="col-xl-2 col-lg-3 col-md-6">
                    <label
                      className="form_label"
                      style={{ fontWeight: "bold" }}
                    >
                      Select Team Member
                    </label>

                    <div
                      className="mt-1"
                      style={{
                        position: "relative",
                        zIndex: 9999,
                      }}
                    >
                      <CustomSearchDropdown
                        options={TeamMamberOptions}
                        value={selectedTeamMamber}
                        onChange={handleTeamMamberChange}
                        isDisabled={cartnumber ? "disabled" : false}
                      />
                    </div>
                  </div>
                )}

                {/* SEARCH PREVIOUS ORDER */}
                {flag == "quick" && (
                  <div className="col-xl-2 col-lg-3 col-md-4">
                    <label
                      className="form_label"
                      style={{ fontWeight: "bold" }}
                    >
                      Search Previous {dynamicTitle}
                    </label>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "5px",
                      }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Cart Number"
                        value={searchCartNumber}
                        onChange={(e) => setSearchCartNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleLoadOrder();
                          }
                        }}
                      />

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleLoadOrder}
                        disabled={isLoadingOrder}
                        style={{
                          whiteSpace: "nowrap",
                          height: "38px",
                          backgroundColor: "#f58634",
                        }}
                      >
                        {isLoadingOrder ? "Loading..." : "Load"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div
                className="mt-3"
                style={{
                  position: "absolute",
                  top: "15.5%",
                  right: "2%",
                  zIndex: "999999999",
                }}
              >
                <span
                  className="close px-2"
                  onClick={openCloseRight}
                  onMouseEnter={(e) => {
                    openCloseRightSide
                      ? showTooltip("Hide Products", e)
                      : showTooltip("Show Products", e);
                  }}
                  onMouseLeave={hideTooltip}
                >
                  {openCloseRightSide ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="28px"
                      viewBox="0 -960 960 960"
                      width="28px"
                      fill="currentColor"
                    >
                      <path d="M300-640v320l160-160-160-160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="28px"
                      viewBox="0 -960 960 960"
                      width="28px"
                      fill="currentColor"
                    >
                      <path d="M460-320v-320L300-480l160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z" />
                    </svg>
                  )}
                </span>
              </div>

              <div
                style={{ width: "98%", height: "20%", marginBottom: "20px" }}
              >
                <div className="col-12 d-flex"></div>
              </div>

              <div className={`m-title-2 row `}>
                <div
                  className={`card  ${!openCloseRightSide
                    ? "col-12"
                    : dynamicImageView.includes(2)
                      ? "col-9"
                      : "col-8"
                    }`}
                  style={{ borderRadius: "0px" }}
                >
                  <div
                    className="mt-2 table-responsive"
                    style={{ maxHeight: "50vh", overflowY: "auto" }}
                  >
                    <table
                      className="table table-bordered"
                      border={0}
                      style={{ tableLayout: "fixed", width: "100%" }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1000,
                          backgroundColor: "#F0F2F5",
                        }}
                      >
                        <tr>
                          {/* Remove column */}
                          <th
                            className="text-center"
                            style={{
                              width: table.getColumn("remove")?.getSize(),
                              position: "relative",
                            }}
                          >
                            {/* <div
                              className="resizer"
                              onMouseDown={getHeaderById("remove")!.getResizeHandler()} 
                              onTouchStart={getHeaderById("remove")!.getResizeHandler()}
                            /> */}
                          </th>

                          {/* Product */}
                          <th
                            className="text-center order-text"
                            style={{
                              width: table.getColumn("product_name")?.getSize(),
                              position: "relative",
                            }}
                          >
                            Product
                            <div
                              className="resizer"
                              onMouseDown={getHeaderById(
                                "product_name",
                              )!.getResizeHandler()}
                              onTouchStart={getHeaderById(
                                "product_name",
                              )!.getResizeHandler()}
                            />
                          </th>

                          {/* Desc */}
                          <th
                            className="text-center order-text"
                            style={{
                              width: table.getColumn("desc")?.getSize(),
                              position: "relative",
                            }}
                          >
                            Desc.
                            <div
                              className="resizer"
                              onMouseDown={getHeaderById(
                                "desc",
                              )!.getResizeHandler()}
                              onTouchStart={getHeaderById(
                                "desc",
                              )!.getResizeHandler()}
                            />
                          </th>

                          {/* Dynamic Custom Fields */}
                          {customFormListProduct.map((field) => (
                            <th
                              key={field.reference_column_name}
                              className="text-center order-text"
                              style={{
                                width: table
                                  .getColumn(field.reference_column_name)
                                  ?.getSize(),
                                position: "relative",
                              }}
                            >
                              {field.title}
                              {field.required_or_not === 1 && (
                                <span className="text-danger">*</span>
                              )}

                              <div
                                className="resizer"
                                onMouseDown={getHeaderById(
                                  field.reference_column_name,
                                )?.getResizeHandler()}
                              />
                            </th>
                          ))}

                          {/* HSN */}
                          <th
                            className="text-center order-text"
                            style={{
                              width: table.getColumn("hsn_code")?.getSize(),
                              position: "relative",
                            }}
                          >
                            HSN/SAC
                            <div
                              className="resizer"
                              onMouseDown={getHeaderById(
                                "hsn_code",
                              )?.getResizeHandler()}
                            />
                          </th>
                          {orderTypesNameFind !== "Quotation" &&
                            orderTypesNameFind !== "Sales Order" &&
                            orderTypesNameFind !== "Proforma Invoice" &&
                            orderTypesNameFind !== "Purchase Order" && (
                              <>
                                {/* Warehouse */}
                                <th
                                  className="text-center order-text"
                                  style={{
                                    width: table
                                      .getColumn("warehouse")
                                      ?.getSize(),
                                    position: "relative",
                                  }}
                                >
                                  Warehouse{" "}
                                  <span className="text-danger">*</span>
                                  <div
                                    className="resizer"
                                    onMouseDown={getHeaderById(
                                      "warehouse",
                                    )?.getResizeHandler()}
                                  />
                                </th>
                              </>
                            )}
                          {/* Inner Qty */}
                          {(isOrderClassification == 2 ||
                            isOrderClassification == 4) && (
                              <th
                                className="text-center order-text"
                                style={{
                                  width: table
                                    .getColumn("item_inner_quantity")
                                    ?.getSize(),
                                  position: "relative",
                                }}
                              >
                                Inner Qty
                                <div
                                  className="resizer"
                                  onMouseDown={getHeaderById(
                                    "item_inner_quantity",
                                  )?.getResizeHandler()}
                                />
                              </th>
                            )}
                          {/* Outter Qty */}
                          {(isOrderClassification == 3 ||
                            isOrderClassification == 4) && (
                              <th
                                className="text-center order-text"
                                style={{
                                  width: table
                                    .getColumn("item_outer_quantity")
                                    ?.getSize(),
                                  position: "relative",
                                }}
                              >
                                Outer Qty
                                <div
                                  className="resizer"
                                  onMouseDown={getHeaderById(
                                    "item_outer_quantity",
                                  )?.getResizeHandler()}
                                />
                              </th>
                            )}
                          {isOrderClassification != 1 && (
                            <th
                              className="text-center order-text"
                              style={{
                                width: table
                                  .getColumn("item_loose_quantity")
                                  ?.getSize(),
                                position: "relative",
                              }}
                            >
                              Loose Qty
                              <div
                                className="resizer"
                                onMouseDown={getHeaderById(
                                  "item_loose_quantity",
                                )?.getResizeHandler()}
                              />
                            </th>
                          )}
                          {/* Qty */}
                          <th
                            className="text-center order-text"
                            style={{
                              width: table.getColumn("qty")?.getSize(),
                              position: "relative",
                            }}
                          >
                            Qty
                            <div
                              className="resizer"
                              onMouseDown={getHeaderById(
                                "qty",
                              )?.getResizeHandler()}
                            />
                          </th>

                          {/* Unit */}
                          <th
                            className="text-center order-text"
                            style={{
                              width: table.getColumn("unit")?.getSize(),
                              position: "relative",
                            }}
                          >
                            Unit
                            <div
                              className="resizer"
                              onMouseDown={getHeaderById(
                                "unit",
                              )?.getResizeHandler()}
                            />
                          </th>

                          {/* Pricing Block */}
                          {orderTypesNameFind !== "Inward" &&
                            orderTypesNameFind !== "Dispatch" && (
                              <>
                                {/* Rate */}
                                <th
                                  className="text-center order-text"
                                  style={{
                                    width: table.getColumn("rate")?.getSize(),
                                    position: "relative",
                                  }}
                                >
                                  Rate
                                  <div
                                    className="resizer"
                                    onMouseDown={getHeaderById(
                                      "rate",
                                    )?.getResizeHandler()}
                                  />
                                </th>

                                {/* Discount */}
                                <th
                                  className="text-center order-text"
                                  style={{
                                    width: table
                                      .getColumn("discount")
                                      ?.getSize(),
                                    position: "relative",
                                  }}
                                >
                                  <div className="d-flex align-items-center">
                                    {/* % */}
                                    <span
                                      className={
                                        discountType === "percentage"
                                          ? "fw-bold text-primary"
                                          : ""
                                      }
                                    >
                                      %
                                    </span>

                                    {/* Switch */}
                                    <div className="form-check form-switch m-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={discountType === "flat"}
                                        onChange={(e) =>
                                          setDiscountType(
                                            e.target.checked
                                              ? "flat"
                                              : "percentage",
                                          )
                                        }
                                      />
                                    </div>

                                    {/* ₹ */}
                                    <span
                                      className={
                                        discountType === "flat"
                                          ? "fw-bold text-primary"
                                          : ""
                                      }
                                    >
                                      ₹
                                    </span>
                                  </div>
                                  Dis/Qty
                                  <div
                                    className="resizer"
                                    onMouseDown={getHeaderById(
                                      "discount",
                                    )?.getResizeHandler()}
                                  />
                                </th>

                                {/* GST */}
                                {isGstActive && (
                                  <th
                                    className="text-center order-text"
                                    style={{
                                      width: table.getColumn("gst")?.getSize(),
                                      position: "relative",
                                    }}
                                  >
                                    GST(%)
                                    <div
                                      className="resizer"
                                      onMouseDown={getHeaderById(
                                        "gst",
                                      )?.getResizeHandler()}
                                    />
                                  </th>
                                )}

                                {/* Amount */}
                                <th
                                  className="text-center order-text"
                                  colSpan={2}
                                  style={{
                                    width: table.getColumn("amount")?.getSize(),
                                    position: "relative",
                                  }}
                                >
                                  Amount
                                  <div
                                    className="resizer"
                                    onMouseDown={getHeaderById(
                                      "amount",
                                    )?.getResizeHandler()}
                                  />
                                </th>
                              </>
                            )}
                        </tr>
                      </thead>

                      <tbody>
                        {cart.length > 0 ? (
                          cart.map((item, index) => {
                            return (
                              <tr key={index}>
                                <td
                                  className="text-center"
                                  style={{ width: "100%" }}
                                >
                                  {orderTypesNameFind !== "Quotation" &&
                                    orderTypesNameFind !== "Sales Order" &&
                                    orderTypesNameFind !== "Sales Invoice" &&
                                    orderTypesNameFind !== "Proforma Invoice" &&
                                    orderTypesNameFind !== "Purchase Order" &&
                                    cartnumber ? (
                                    <span></span>
                                  ) : (
                                    <span
                                      style={{
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "15px",
                                      }}
                                      onClick={() =>
                                        handleRemoveItem(item, index)
                                      }
                                    >
                                      <svg
                                        viewBox="0 -960 960 960"
                                        width="22px"
                                        fill="currentColor"
                                      >
                                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                      </svg>
                                      {/* <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor"><path d="M666-440 440-666l226-226 226 226-226 226Zm-546-80v-320h320v320H120Zm400 400v-320h320v320H520Zm-400 0v-320h320v320H120Zm80-480h160v-160H200v160Zm467 48 113-113-113-113-113 113 113 113Zm-67 352h160v-160H600v160Zm-400 0h160v-160H200v160Zm160-400Zm194-65ZM360-360Zm240 0Z" /></svg> */}
                                    </span>
                                  )}
                                </td>
                                <td
                                  className="text-start order-text"
                                  style={{
                                    width: table
                                      .getColumn("product_name")
                                      ?.getSize(),
                                  }}
                                >
                                  {item.product_name}
                                </td>
                                <td
                                  style={{
                                    width: table.getColumn("desc")?.getSize(),
                                  }}
                                >
                                  <textarea
                                    className="form-control"
                                    id="desc"
                                    name="desc"
                                    placeholder="desc"
                                    value={item.product_description}
                                    disabled={
                                      orderTypesNameFind !== "Quotation" &&
                                        orderTypesNameFind !== "Sales Order" &&
                                        orderTypesNameFind !== "Sales Invoice" &&
                                        orderTypesNameFind !==
                                        "Proforma Invoice" &&
                                        orderTypesNameFind !== "Purchase Order" &&
                                        cartnumber
                                        ? true
                                        : false
                                    }
                                    onChange={(e) =>
                                      handleDescriptionChange(
                                        index,
                                        e.target.value,
                                      )
                                    }
                                  >
                                    {item.product_description}
                                  </textarea>
                                </td>
                                {customFormListProduct
                                  .filter((item) => item.form_type === 4)
                                  .map((field) => (
                                    <td
                                      key={field.reference_column_name}
                                      style={{
                                        paddingLeft: "0px",
                                        width: table
                                          .getColumn(
                                            field.reference_column_name,
                                          )
                                          ?.getSize(),
                                      }}
                                    >
                                      {renderInputField(
                                        field,
                                        "",
                                        field.reference_column_name,
                                        index,
                                      )}
                                    </td>
                                  ))}
                                <td
                                  style={{
                                    width: table
                                      .getColumn("hsn_code")
                                      ?.getSize(),
                                  }}
                                >
                                  {item.hsn_code}
                                </td>
                                {orderTypesNameFind !== "Quotation" &&
                                  orderTypesNameFind !== "Sales Order" &&
                                  orderTypesNameFind !== "Proforma Invoice" &&
                                  orderTypesNameFind !== "Purchase Order" && (
                                    <td style={{ width: 180 }}>
                                      <CustomSearchDropdown
                                        options={warehouseOptions}
                                        value={
                                          warehouseOptions.find(
                                            (wh) =>
                                              wh.value === item.warehouse_id,
                                          ) ||
                                          defaultWarehouse ||
                                          null
                                        }
                                        onChange={(selected) =>
                                          handleWarehouseChange(index, selected)
                                        }
                                        isDisabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            cartnumber &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order"
                                            ? "disabled"
                                            : false
                                        }
                                      />
                                    </td>
                                  )}

                                {/* <td className="">
                                  <input
                                    className="form-control"
                                    type="text"
                                    title="Quantity"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        index,
                                        e.target.value === ""
                                          ? 1
                                          : parseInt(e.target.value) || 1
                                      )
                                    }
                                    onFocus={(e) => e.target.select()}
                                    disabled={
                                      orderTypesNameFind !== "Quotation" &&
                                        orderTypesNameFind !== "Sales Order" &&
                                        orderTypesNameFind !== "Purchase Order" &&
                                        cartnumber
                                        ? true
                                        : false
                                    }
                                    style={{ textAlign: "right" }}
                                  />
                                </td> */}
                                {(isOrderClassification == 2 ||
                                  isOrderClassification == 4) && (
                                    <td
                                      className=""
                                      style={{
                                        width: table
                                          .getColumn("item_inner_quantity")
                                          ?.getSize(),
                                      }}
                                    >
                                      <input
                                        className="form-control"
                                        type="number"
                                        step={
                                          item.is_point_value_allow === 1
                                            ? "0.01"
                                            : "1"
                                        }
                                        title="Inner Quantity"
                                        placeholder="Inner Qty"
                                        value={item.item_inner_quantity}
                                        readOnly={
                                          [3, 4, 8, 9].includes(
                                            Number(isOrderShowNum),
                                          ) && item?.is_serial_number == 2
                                        }
                                        onChange={(e) => {
                                          const value = e.target.value;

                                          const innerQty =
                                            item.is_point_value_allow === 1
                                              ? value === ""
                                                ? 0
                                                : parseFloat(value) || 0
                                              : value === ""
                                                ? 0
                                                : parseInt(value, 10) || 0;

                                          setCart((prev) =>
                                            prev.map((cartItem, i) => {
                                              if (i !== index) return cartItem;

                                              const updatedItem = {
                                                ...cartItem,
                                                item_inner_quantity: innerQty,
                                                item_loose_quantity: 0,
                                              };

                                              return {
                                                ...updatedItem,
                                                quantity:
                                                  calculateMainQuantity(
                                                    updatedItem,
                                                  ),
                                              };
                                            }),
                                          );
                                        }}
                                        onBlur={(e) => {
                                          let val;

                                          if (item.is_point_value_allow === 1) {
                                            val = parseFloat(e.target.value);
                                          } else {
                                            val = parseInt(e.target.value, 10);
                                          }

                                          if (isNaN(val) || val <= 0) {
                                            val = 0;
                                          }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !== "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                        style={{
                                          textAlign: "right",
                                          backgroundColor:
                                            [3, 4, 8, 9].includes(
                                              Number(isOrderShowNum),
                                            ) && item?.is_serial_number == 2
                                              ? "#f5f5f5"
                                              : "",

                                          cursor:
                                            [3, 4, 8, 9].includes(
                                              Number(isOrderShowNum),
                                            ) && item?.is_serial_number == 2
                                              ? "not-allowed"
                                              : "default",
                                        }}
                                      />
                                      <span
                                        className="order-text text-end"
                                        style={{
                                          fontSize: "12px",
                                          textAlign: "end",
                                        }}
                                      >
                                        {item.inner_qty_unit}
                                      </span>
                                    </td>
                                  )}
                                {(isOrderClassification == 3 ||
                                  isOrderClassification == 4) && (
                                    <td
                                      className=""
                                      style={{
                                        width: table
                                          .getColumn("item_outer_quantity")
                                          ?.getSize(),
                                      }}
                                    >
                                      <input
                                        className="form-control"
                                        type="number"
                                        step={
                                          item.is_point_value_allow === 1
                                            ? "0.01"
                                            : "1"
                                        }
                                        title="Outer Quantity"
                                        placeholder="Outer Qty"
                                        value={item.item_outer_quantity}
                                        readOnly={
                                          [3, 4, 8, 9].includes(
                                            Number(isOrderShowNum),
                                          ) && item?.is_serial_number == 2
                                        }
                                        onChange={(e) => {
                                          const value = e.target.value;

                                          const outerQty =
                                            item.is_point_value_allow === 1
                                              ? value === ""
                                                ? 0
                                                : parseFloat(value) || 0
                                              : value === ""
                                                ? 0
                                                : parseInt(value, 10) || 0;

                                          setCart((prev) =>
                                            prev.map((cartItem, i) => {
                                              if (i !== index) return cartItem;

                                              const updatedItem = {
                                                ...cartItem,
                                                item_outer_quantity: outerQty,
                                                item_loose_quantity: 0,
                                              };

                                              return {
                                                ...updatedItem,
                                                quantity:
                                                  calculateMainQuantity(
                                                    updatedItem,
                                                  ),
                                              };
                                            }),
                                          );
                                        }}
                                        onBlur={(e) => {
                                          let val;

                                          if (item.is_point_value_allow === 1) {
                                            val = parseFloat(e.target.value);
                                          } else {
                                            val = parseInt(e.target.value, 10);
                                          }

                                          if (isNaN(val) || val <= 0) {
                                            val = 0;
                                          }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !== "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                        style={{
                                          textAlign: "right",
                                          backgroundColor:
                                            [3, 4, 8, 9].includes(
                                              Number(isOrderShowNum),
                                            ) && item?.is_serial_number == 2
                                              ? "#f5f5f5"
                                              : "",

                                          cursor:
                                            [3, 4, 8, 9].includes(
                                              Number(isOrderShowNum),
                                            ) && item?.is_serial_number == 2
                                              ? "not-allowed"
                                              : "default",
                                        }}
                                      />
                                      <span
                                        className="order-text text-end"
                                        style={{
                                          fontSize: "12px",
                                          textAlign: "end",
                                        }}
                                      >
                                        {item.outer_qty_unit}
                                      </span>
                                    </td>
                                  )}
                                {isOrderClassification != 1 && (
                                  <td
                                    style={{
                                      width: table
                                        .getColumn("item_loose_quantity")
                                        ?.getSize(),
                                    }}
                                  >
                                    <input
                                      className="form-control"
                                      type="number"
                                      value={item.item_loose_quantity}
                                      disabled
                                      style={{
                                        textAlign: "right",
                                        backgroundColor: "#f5f5f5",
                                        cursor: "not-allowed",
                                      }}
                                    />
                                  </td>
                                )}
                                <td
                                  className=""
                                  style={{
                                    width: table.getColumn("qty")?.getSize(),
                                  }}
                                >
                                  <input
                                    className="form-control"
                                    type="number"
                                    step={
                                      item.is_point_value_allow === 1
                                        ? "0.01"
                                        : "1"
                                    }
                                    title="Quantity"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    readOnly={
                                      [3, 4, 8, 9].includes(
                                        Number(isOrderShowNum),
                                      ) && item?.is_serial_number == 2
                                    }
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      let qty;

                                      if (item.is_point_value_allow === 1) {
                                        qty =
                                          value === ""
                                            ? 0
                                            : parseFloat(value) || 0;
                                      } else {
                                        qty =
                                          value === ""
                                            ? 0
                                            : parseInt(value, 10) || 0;
                                      }

                                      handleQuantityChange(index, qty);
                                    }}
                                    onBlur={(e) => {
                                      let val;

                                      if (item.is_point_value_allow === 1) {
                                        val = parseFloat(e.target.value);
                                      } else {
                                        val = parseInt(e.target.value, 10);
                                      }

                                      if (isNaN(val) || val <= 0) {
                                        val = 0;
                                      }

                                      handleQuantityChange(index, val);
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    disabled={
                                      ([3, 4, 8, 9].includes(
                                        Number(isOrderShowNum),
                                      ) &&
                                        item?.is_serial_number == 2) ||
                                        (orderTypesNameFind !== "Quotation" &&
                                          orderTypesNameFind !== "Sales Order" &&
                                          orderTypesNameFind !==
                                          "Proforma Invoice" &&
                                          orderTypesNameFind !==
                                          "Sales Invoice" &&
                                          orderTypesNameFind !==
                                          "Purchase Order" &&
                                          cartnumber)
                                        ? true
                                        : false
                                    }
                                    style={{
                                      textAlign: "right",
                                      backgroundColor:
                                        [3, 4, 8, 9].includes(
                                          Number(isOrderShowNum),
                                        ) && item?.is_serial_number == 2
                                          ? "#f5f5f5"
                                          : "",

                                      cursor:
                                        [3, 4, 8, 9].includes(
                                          Number(isOrderShowNum),
                                        ) && item?.is_serial_number == 2
                                          ? "not-allowed"
                                          : "default",
                                    }}
                                  />

                                  {(isOrderShowNum === 9 ||
                                    isOrderShowNum === 8) &&
                                    (orderById?.cart?.referance_cart_id ||
                                      orderbyidList?.cart?.referance_cart_id) &&
                                    originalQuantities[item.id] && (
                                      <strong
                                        title="Remaining Quantity"
                                        style={{
                                          cursor: "help",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                        }}
                                      >
                                        ROQ : {originalQuantities[item.id]}
                                      </strong>
                                    )}

                                  {item?.is_serial_number == 2 &&
                                    [3, 4, 8, 9].includes(
                                      Number(isOrderShowNum),
                                    ) && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#007bff",
                                          cursor: "pointer",
                                          marginTop: "4px",
                                          textAlign: "center",
                                          fontWeight: 600,
                                        }}
                                        onClick={() => openSerialModal(index)}
                                      >
                                        +SN.No
                                      </div>
                                    )}
                                </td>

                                <td
                                  className="text-center"
                                  style={{
                                    width: table.getColumn("unit")?.getSize(),
                                  }}
                                >
                                  <span style={{ display: "block" }}>
                                    {item?.unit}
                                  </span>
                                  <br />
                                  <span
                                    className="order-text text-end"
                                    style={{
                                      fontSize: "12px",
                                      textAlign: "end",
                                    }}
                                  >
                                    <strong
                                      title="Current Stock"
                                      style={{
                                        cursor: "help",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {" "}
                                      CS:{" "}
                                    </strong>{" "}
                                    {item.closing_qty}
                                  </span>
                                </td>
                                {orderTypesNameFind !== "Inward" &&
                                  orderTypesNameFind !== "Dispatch" && (
                                    <>
                                      <td
                                        style={{
                                          width: table
                                            .getColumn("rate")
                                            ?.getSize(),
                                        }}
                                      >
                                        <input
                                          className="form-control"
                                          type="text"
                                          title="Rate"
                                          placeholder="Rate"
                                          value={item.rate}
                                          onChange={(e) =>
                                            handleRateChange(index, e)
                                          }
                                          onBlur={(e) =>
                                            handleRateBlur(index, e)
                                          }
                                          style={{ textAlign: "right" }}
                                          onFocus={(e) => e.target.select()}
                                          disabled={
                                            orderTypesNameFind !==
                                              "Quotation" &&
                                              orderTypesNameFind !==
                                              "Sales Order" &&
                                              orderTypesNameFind !==
                                              "Sales Invoice" &&
                                              orderTypesNameFind !==
                                              "Proforma Invoice" &&
                                              orderTypesNameFind !==
                                              "Purchase Order" &&
                                              cartnumber
                                              ? true
                                              : false
                                          }
                                        />

                                        <br />
                                        <span
                                          className="order-text text-end"
                                          style={{
                                            fontSize: "12px",
                                            textAlign: "end",
                                          }}
                                        >
                                          <strong
                                            title="Last Rate"
                                            style={{
                                              cursor: "help",
                                              fontSize: "12px",
                                              fontWeight: 600,
                                            }}
                                          >
                                            LR:
                                          </strong>{" "}
                                          {item.last_item_net_rate}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          width: table
                                            .getColumn("discount")
                                            ?.getSize(),
                                        }}
                                      >
                                        <input
                                          className="form-control"
                                          type="text"
                                          title="Discount"
                                          placeholder="Discount"
                                          style={{ textAlign: "right" }}
                                          onFocus={(e) => e.target.select()}
                                          onBlur={(e) => {
                                            const val = parseFloat(
                                              e.target.value || "0",
                                            );

                                            setCart((prev) =>
                                              prev.map((item, i) =>
                                                i === index
                                                  ? {
                                                    ...item,
                                                    discount_input_value:
                                                      undefined, // clear temp input
                                                    item_discount_pct:
                                                      discountType ===
                                                        "percentage"
                                                        ? Number(
                                                          val.toFixed(4),
                                                        )
                                                        : item.item_discount_pct,
                                                    item_discount_pr:
                                                      discountType === "flat"
                                                        ? Number(
                                                          val.toFixed(2),
                                                        )
                                                        : item.item_discount_pr,
                                                  }
                                                  : item,
                                              ),
                                            );
                                          }}
                                          disabled={
                                            orderTypesNameFind !==
                                              "Quotation" &&
                                              orderTypesNameFind !==
                                              "Sales Order" &&
                                              orderTypesNameFind !==
                                              "Sales Invoice" &&
                                              orderTypesNameFind !==
                                              "Purchase Order" &&
                                              orderTypesNameFind !==
                                              "Proforma Invoice" &&
                                              cartnumber
                                              ? true
                                              : false
                                          }
                                          value={
                                            item.discount_input_value ??
                                            (discountType === "percentage"
                                              ? item.item_discount_pct
                                              : item.item_discount_pr)
                                          }
                                          onChange={(e) =>
                                            handleProductItemDiscountChange(
                                              index,
                                              e,
                                            )
                                          }
                                        />
                                        <br />
                                        <span
                                          className="order-text text-end"
                                          style={{
                                            fontSize: "12px",
                                            textAlign: "end",
                                          }}
                                        >
                                          <strong
                                            title="Last Discount"
                                            style={{
                                              cursor: "help",
                                              fontSize: "12px",
                                              fontWeight: 600,
                                            }}
                                          >
                                            LD(%):
                                          </strong>{" "}
                                          {item.last_item_dis_pr}
                                        </span>
                                      </td>

                                      {isGstActive ? (
                                        <>
                                          <td
                                            className="text-end order-text"
                                            style={{
                                              width: table
                                                .getColumn("gst")
                                                ?.getSize(),
                                            }}
                                          >
                                            {item.GST}
                                          </td>
                                          <td
                                            className="text-end"
                                            colSpan={2}
                                            style={{
                                              width: table
                                                .getColumn("amount")
                                                ?.getSize(),
                                            }}
                                          >
                                            <span
                                              style={{
                                                width: "100%",
                                                textAlign: "right",
                                                display: "inline-block",
                                              }}
                                              title="Amount"
                                            >
                                              {formatNumber(
                                                calculateAmount(
                                                  item.rate,
                                                  item.quantity,
                                                  item.item_discount_pct,
                                                  discountType,
                                                  item.item_discount_pr,
                                                ),
                                                2,
                                              )}
                                            </span>
                                          </td>
                                        </>
                                      ) : (
                                        <td className="text-end" colSpan={2}>
                                          <span
                                            style={{
                                              width: "100%",
                                              textAlign: "right",
                                              display: "inline-block",
                                            }}
                                            title="Amount"
                                          >
                                            {formatNumber(
                                              calculateAmount(
                                                item.rate,
                                                item.quantity,
                                                item.item_discount_pct,
                                                discountType,
                                                item.item_discount_pr,
                                              ),
                                              2,
                                            )}
                                          </span>
                                        </td>
                                      )}
                                    </>
                                  )}

                                {/* <td className="text-end order-text">
                                {item.net_rate
                                  ? formatNumber(item.net_rate, 2)
                                  : 0}
                              </td> */}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={
                                footerBaseColSpan +
                                2 +
                                customFormListProduct.length
                              }
                              className="text-center order-text"
                            >
                              No Products in the Cart
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {orderTypesNameFind !== "Inward" &&
                        orderTypesNameFind !== "Dispatch" && (
                          <>
                            <tfoot
                              style={{ backgroundColor: "rgb(240, 242, 245)" }}
                            >
                              {cart.length > 0 ? (
                                <>
                                  <tr className="table-bordered">
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      Total
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    {/* <td className="text-end order-text">
                              {totalQuantity}
                            </td> */}
                                    <td
                                      colSpan={2}
                                      className="text-end order-text"
                                      style={{
                                        width: table
                                          .getColumn("amount")
                                          ?.getSize(),
                                      }}
                                    >
                                      {totalAmount
                                        ? formatNumber(totalAmount, 2)
                                        : ""}
                                    </td>
                                  </tr>
                                  {/* <tr>
                            <td colSpan={8} className="order-text">
                              Discount (%)
                            </td>
                            {customFormListProduct.map((field) => (
                              <th
                                key={field.reference_column_name}
                                className="text-center order-text"
                              >
                                {""}
                              </th>
                            ))}
                            <td>
                              <input
                                type="text"
                                title="Discount"
                                placeholder="Discount"
                                className=""
                                style={{ width: "100%", textAlign: "right" }}
                                disabled={
                                  orderTypesNameFind !== "Quotation" &&
                                  cartnumber
                                    ? true
                                    : false
                                }
                                onChange={(e) => handleDiscountChange(e)}
                                value={discount}
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span>
                                {showDiscount
                                  ? formatNumber(showDiscount, 2)
                                  : 0}
                              </span>
                            </td>
                          </tr> */}
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter charge name"
                                        value={packingForwardingChargeTitle}
                                        onChange={
                                          handlePackingForwardingTitleChange
                                        }
                                        maxLength={SMALL_TEXT_LENGTH}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                        style={{
                                          border: "1px solid #ced4da",
                                          padding: "5px 10px",
                                          fontSize: "14px",
                                          width: "40%",
                                        }}
                                      />
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td colSpan={2}>
                                      <input
                                        type="text"
                                        title={packingForwardingChargeTitle}
                                        placeholder="Charge"
                                        style={{
                                          width: "100%",
                                          textAlign: "right",
                                        }}
                                        onChange={handlePackingForwardingChange}
                                        onFocus={(e) => e.target.select()}
                                        value={packingForwardingCharge}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                      />
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter charge name"
                                        value={transportChargeTitle}
                                        onChange={
                                          handleTransportChargeTitleChange
                                        }
                                        maxLength={SMALL_TEXT_LENGTH}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                        style={{
                                          border: "1px solid #ced4da",
                                          padding: "5px 10px",
                                          fontSize: "14px",
                                          width: "40%",
                                        }}
                                      />
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td colSpan={2}>
                                      <input
                                        type="text"
                                        title={transportChargeTitle}
                                        placeholder="Charge"
                                        onFocus={(e) => e.target.select()}
                                        onBeforeInput={(e) => {
                                          const currentValue = (
                                            e.target as HTMLInputElement
                                          ).value;
                                          const nextValue =
                                            currentValue +
                                            (e as unknown as InputEvent).data;

                                          if (!/^\d*\.?\d*$/.test(nextValue)) {
                                            e.preventDefault();
                                          }
                                        }}
                                        style={{
                                          width: "100%",
                                          textAlign: "right",
                                        }}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                        onChange={handleTransportCharge}
                                        value={transportCharge}
                                      />
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      <div className="d-flex align-items-center justify-content-between">
                                        <span>Cash Discount</span>

                                        <div className="d-flex align-items-center">
                                          <span
                                            className={
                                              cashDiscountType === "percentage"
                                                ? "fw-bold text-primary"
                                                : ""
                                            }
                                          >
                                            %
                                          </span>

                                          <div className="form-check form-switch m-0 mx-2">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              checked={cashDiscountType === "flat"}
                                              onChange={handleCashDiscountTypeChange}
                                            />
                                          </div>

                                          <span
                                            className={
                                              cashDiscountType === "flat"
                                                ? "fw-bold text-primary"
                                                : ""
                                            }
                                          >
                                            ₹
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td colSpan={2}>
                                      <input
                                        type="text"
                                        placeholder={
                                          cashDiscountType === "percentage"
                                            ? "Discount %"
                                            : "Discount Amount"
                                        }
                                        onFocus={(e) => e.target.select()}
                                        onBeforeInput={(e) => {
                                          const currentValue = (
                                            e.target as HTMLInputElement
                                          ).value;

                                          const nextValue =
                                            currentValue +
                                            (e as unknown as InputEvent).data;

                                          if (!/^\d*\.?\d*$/.test(nextValue)) {
                                            e.preventDefault();
                                          }
                                        }}
                                        style={{
                                          width: "100%",
                                          textAlign: "right",
                                        }}
                                        value={cashDiscount}
                                        onChange={handleCashDiscount}
                                      />
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      Taxable Amount
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td colSpan={2}>
                                      <span
                                        style={{
                                          width: "100%",
                                          textAlign: "right",
                                          display: "inline-block",
                                        }}
                                        title="Taxable Amount"
                                      >
                                        {taxAbleAmount
                                          ? formatNumber(taxAbleAmount, 2)
                                          : 0}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan - 1}
                                      className="order-text"
                                    >
                                      GST
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td style={{ padding: "0px" }}>
                                      <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          role="switch"
                                          disabled={
                                            !switchStatus ||
                                              (orderTypesNameFind !==
                                                "Quotation" &&
                                                orderTypesNameFind !==
                                                "Sales Order" &&
                                                orderTypesNameFind !==
                                                "Sales Invoice" &&
                                                orderTypesNameFind !==
                                                "Proforma Invoice" &&
                                                orderTypesNameFind !==
                                                "Purchase Order" &&
                                                cartnumber)
                                              ? true
                                              : false
                                          }
                                          checked={
                                            switchStatus ? isGstActive : false
                                          }
                                          onChange={() => {
                                            if (anyGstEmpty) {
                                              toast.error(
                                                "GST number is missing. Please update it in company settings.",
                                              );
                                              return;
                                            }

                                            // Only toggle if GST exists
                                            setIsGstActive(!isGstActive);
                                          }}
                                        />
                                      </div>
                                    </td>
                                    <td
                                      colSpan={2}
                                      style={{ textAlign: "end" }}
                                    >
                                      <span>{formatNumber(gstAmount, 2)}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan - 2}
                                      className="order-text"
                                    >
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter TCS title"
                                        value={dynamicTCSTitle}
                                        onChange={handleTcsTitleChange}
                                        maxLength={SMALL_TEXT_LENGTH}
                                        disabled={
                                          orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber
                                            ? true
                                            : false
                                        }
                                        style={{
                                          border: "1px solid #ced4da",
                                          padding: "5px 10px",
                                          fontSize: "14px",
                                          width: "20%",
                                        }}
                                      />
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td style={{ padding: "0px" }}>
                                      <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                        <input
                                          type="text"
                                          className="form-control"
                                          placeholder="%"
                                          value={dynamicTCSRate}
                                          onChange={handleTcsPercentageChange}
                                          onFocus={(e) => e.target.select()}
                                          disabled={
                                            !isTcsActive ||
                                              (orderTypesNameFind !==
                                                "Quotation" &&
                                                orderTypesNameFind !==
                                                "Sales Order" &&
                                                orderTypesNameFind !==
                                                "Sales Invoice" &&
                                                orderTypesNameFind !==
                                                "Proforma Invoice" &&
                                                orderTypesNameFind !==
                                                "Purchase Order" &&
                                                cartnumber)
                                              ? true
                                              : false
                                          }
                                          style={{
                                            width: "60px",
                                            textAlign: "right",
                                            padding: "2px 5px",
                                            fontSize: "14px",
                                          }}
                                        />
                                        <span style={{ fontSize: "12px" }}>
                                          %
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: "0px" }}>
                                      <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          role="switch"
                                          disabled={
                                            orderTypesNameFind !==
                                              "Quotation" &&
                                              orderTypesNameFind !==
                                              "Sales Order" &&
                                              orderTypesNameFind !==
                                              "Sales Invoice" &&
                                              orderTypesNameFind !==
                                              "Proforma Invoice" &&
                                              orderTypesNameFind !==
                                              "Purchase Order" &&
                                              cartnumber
                                              ? true
                                              : false
                                          }
                                          id="flexSwitchCheckDefault"
                                          checked={isTcsActive}
                                          onChange={() =>
                                            setIsTcsActive(!isTcsActive)
                                          }
                                        />
                                      </div>
                                    </td>
                                    <td
                                      colSpan={2}
                                      style={{ textAlign: "end" }}
                                    >
                                      <span>
                                        {tcsAmount
                                          ? formatNumber(tcsAmount, 4)
                                          : 0}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      Round Off
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td colSpan={2}>
                                      <span
                                        style={{
                                          width: "100%",
                                          textAlign: "right",
                                          display: "inline-block",
                                        }}
                                        title="Round Off"
                                      >
                                        {roundOffAmount
                                          ? formatNumber(roundOffAmount, 2)
                                          : 0}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan={footerBaseColSpan}
                                      className="order-text"
                                    >
                                      Grand Total
                                    </td>
                                    {customFormListProduct.map((field) => (
                                      <th
                                        key={field.reference_column_name}
                                        className="text-center order-text"
                                      >
                                        {""}
                                      </th>
                                    ))}
                                    <td colSpan={2}>
                                      <span
                                        style={{
                                          width: "100%",
                                          textAlign: "right",
                                          display: "inline-block",
                                        }}
                                        title="Grand Total"
                                      >
                                        {grandTotal
                                          ? formatNumber(grandTotal, 4)
                                          : 0}
                                      </span>
                                    </td>
                                  </tr>
                                </>
                              ) : (
                                <span></span>
                              )}
                            </tfoot>
                          </>
                        )}
                    </table>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        flexWrap: "wrap",
                      }}
                    >
                      <div className="form-group col-6 px-2">
                        <label>Remark</label>
                        <textarea
                          style={{ height: "150px" }}
                          className="form-control"
                          rows={1}
                          value={cartRemark}
                          onInput={(
                            e: React.FormEvent<HTMLTextAreaElement>,
                          ) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height =
                              Math.max(target.scrollHeight, 150) + "px";
                          }}
                          // maxLength={TEXTAREA_TEXT_LENGTH}
                          onChange={(e) => setCartRemark(e.target.value)}
                          disabled={
                            orderTypesNameFind !== "Quotation" &&
                              orderTypesNameFind !== "Sales Order" &&
                              orderTypesNameFind !== "Sales Invoice" &&
                              orderTypesNameFind !== "Proforma Invoice" &&
                              orderTypesNameFind !== "Purchase Order" &&
                              cartnumber
                              ? true
                              : false
                          }
                        ></textarea>
                      </div>
                      <div className="form-group col-6 px-2">
                        <label> Terms and Condition</label>
                        <textarea
                          className="form-control"
                          style={{ height: "150px" }}
                          rows={1}
                          value={cartTermsAndCondition}
                          onInput={(
                            e: React.FormEvent<HTMLTextAreaElement>,
                          ) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height =
                              Math.max(target.scrollHeight, 150) + "px";
                          }}
                          onChange={(e) =>
                            setCartTermsAndCondition(e.target.value)
                          }
                          disabled={
                            orderTypesNameFind !== "Quotation" &&
                              orderTypesNameFind !== "Sales Order" &&
                              orderTypesNameFind !== "Sales Invoice" &&
                              orderTypesNameFind !== "Proforma Invoice" &&
                              orderTypesNameFind !== "Purchase Order" &&
                              cartnumber
                              ? true
                              : false
                          }
                        ></textarea>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        flexWrap: "wrap",
                      }}
                    >
                      <div className="form-group col-6 px-2">
                        <label>Note</label>
                        <input
                          type="text"
                          className="form-control"
                          value={cartNote}
                          maxLength={BIG1_TEXT_LENGTH}
                          onChange={(e) => setCartNote(e.target.value)}
                          disabled={
                            orderTypesNameFind !== "Quotation" &&
                              orderTypesNameFind !== "Sales Order" &&
                              orderTypesNameFind !== "Sales Invoice" &&
                              orderTypesNameFind !== "Proforma Invoice" &&
                              orderTypesNameFind !== "Purchase Order" &&
                              cartnumber
                              ? true
                              : false
                          }
                        />
                      </div>

                      {isOrderShowNum != 9 && isOrderShowNum != 8 && (
                        <div className="form-group col-6 px-2">
                          <label>
                            {dynamicTitle}{" "}
                            {isOrderShowNum == 3
                              ? `Due/Delivery Date`
                              : `Due Date`}
                          </label>
                          <div>
                            <DatePicker
                              value={cartDueDate}
                              onChange={(date: DateObject) =>
                                setCartDueDate(date)
                              }
                              format="DD-MM-YYYY"
                              placeholder={`Select Due Date`}
                              inputClass={`form-control font-size-15 rounded-1`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="form-group"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        flexWrap: "wrap",
                      }}
                    >
                      {customFormList
                        .filter((field) => field.form_type === 5)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }
                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}

                      {customFormList
                        .filter((field) => field.form_type === 6)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }

                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}

                      {customFormList
                        .filter((field) => field.form_type === 7)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }

                            return null;
                          }
                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}

                      {customFormList
                        .filter((field) => field.form_type === 8)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];
                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }

                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}

                      {customFormList
                        .filter((field) => field.form_type === 9)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }

                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}
                      {customFormList
                        .filter((field) => field.form_type === 10)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }
                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}
                      {customFormList
                        .filter((field) => field.form_type === 12)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }
                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}
                      {customFormList
                        .filter((field) => field.form_type === 13)
                        .map((item) => {
                          const shouldHideField =
                            item.data_type === 12 ||
                            item.data_type === 11 ||
                            item.data_type === 14;

                          if (shouldHideField) {
                            const dropdownOptions =
                              dropdownDataMap[item.id] || [];
                            const options = dropdownOptions.map((opt: any) => ({
                              value: opt.data_sorce,
                              label: opt.data_sorce,
                            }));

                            const selectedValue =
                              options.find(
                                (opt) =>
                                  opt.value ===
                                  cartCustomFieldValues[
                                    item.reference_column_name
                                  ]?.toString(),
                              ) || options[0];

                            if (
                              !cartCustomFieldValues[
                              item.reference_column_name
                              ] &&
                              selectedValue?.value
                            ) {
                              handleCartCustomFieldChange(
                                item.reference_column_name,
                                selectedValue.value,
                                item.data_type,
                              );
                            }
                            return null;
                          }

                          return (
                            <React.Fragment key={item.reference_column_name}>
                              {renderInputField(
                                item,
                                item.title,
                                item.reference_column_name,
                                null,
                                true,
                              )}
                            </React.Fragment>
                          );
                        })}
                    </div>
                    <div className="row">
                      <div
                        className="form-group col-3"
                        style={{
                          position: "relative",
                          width: "20%",
                        }}
                      >
                        {orderTypesNameFind != "Quotation" &&
                          orderTypesNameFind != "Inward" &&
                          orderTypesNameFind != "Proforma Invoice" &&
                          orderTypesNameFind != "Dispatch" && (
                            <>
                              <label
                                htmlFor="advance_payment"
                                className="form_label"
                                style={{ zIndex: 99999, fontSize: "13px" }}
                              >
                                {orderTypesNameFind == "Sales Order" ||
                                  orderTypesNameFind == "Sales Invoice"
                                  ? `Advance Received Amount`
                                  : `Advance Payment Amount`}
                              </label>

                              <input
                                type="text"
                                className="form-control"
                                style={{ height: "38px", marginBottom: "0px" }}
                                value={advancePayment}
                                onChange={handleAdvancePaymentChange}
                                disabled={isDisabledPayment}
                              />
                            </>
                          )}
                      </div>
                      <div
                        className="form-group col-3"
                        style={{
                          position: "relative",
                          width: "24.3%",
                        }}
                      >
                        {orderTypesNameFind != "Quotation" &&
                          orderTypesNameFind != "Inward" &&
                          orderTypesNameFind != "Proforma Invoice" &&
                          orderTypesNameFind !== "Dispatch" && (
                            <div className="form-group">
                              <label
                                htmlFor="mode"
                                className="mb-1 form_label"
                                style={{ zIndex: 99999, fontSize: "13px" }}
                              >
                                Payment By{" "}
                                {Number(advancePayment) > 0 && (
                                  <span className="text-danger">*</span>
                                )}
                              </label>

                              <select
                                id="mode"
                                name="mode" // good for form libraries
                                className={`form-control ${Number(advancePayment) > 0 &&
                                  !selectedPaymentMode
                                  ? "is-invalid"
                                  : ""
                                  }`}
                                value={selectedPaymentMode ?? ""}
                                onChange={handlePaymentChange}
                                disabled={isDisabledPayment}
                              >
                                <option value="" disabled hidden>
                                  -- Select Payment Mode --
                                </option>

                                {paymentModeOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              {Number(advancePayment) > 0 &&
                                !selectedPaymentMode && (
                                  <div className="field-error text-danger">
                                    Payment Mode is required when Advance
                                    Payment is entered
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                      {isFeatureEnabled &&
                        orderTypesNameFind != "Quotation" &&
                        orderTypesNameFind != "Inward" &&
                        orderTypesNameFind != "Proforma Invoice" &&
                        orderTypesNameFind != "Dispatch" && (
                          <div className="form-group col-3">
                            <div className="form-group">
                              <label
                                htmlFor="miracle_account_ledger_adv"
                                className="mb-1 form_label"
                              >
                                Account Ledger From Miracle
                              </label>
                              <CustomSearchDropdown
                                options={accountLedgerFromMiracle}
                                value={selectedMiracleLedgerAdv ?? ""}
                                onChange={(selectedOption: any) =>
                                  handleMiracleAccountLedgerChange(
                                    selectedOption,
                                  )
                                }
                              />
                            </div>
                          </div>
                        )}
                      <div
                        style={{
                          position: "relative",
                          width: "27.3%",
                          display: "flex",
                          justifyContent: "end",
                          alignItems: "center",
                        }}
                        className="col-3"
                      >
                        {flag != "quick" &&
                          orderTypesNameFind != "Inward" &&
                          orderTypesNameFind !== "Dispatch" ? (
                          <>
                            <div className="form-group float-end">
                              <label>
                                <h5>
                                  <b>Closing Balance: {flag} </b>
                                  {contactDetail && (
                                    <span
                                      style={{
                                        color:
                                          contactDetail?.closing_balance > 0
                                            ? "green"
                                            : contactDetail?.closing_balance < 0
                                              ? "red"
                                              : "black",
                                      }}
                                    >
                                      {(
                                        Math.abs(
                                          contactDetail?.closing_balance || 0,
                                        ) as number
                                      ).toFixed(2)}
                                    </span>
                                  )}
                                </h5>
                              </label>
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row pb-3">
                    <div
                      className="col-4"
                      style={{
                        display: "flex",
                        alignItems: "end",
                        justifyContent: "start",
                      }}
                    >
                      <div
                        className="modal-buttons text-start"
                        style={{ margin: "0px" }}
                      >
                        {customFormList.some(
                          (field) => field.data_type === 11,
                        ) && (
                            <button
                              className="modal-button2"
                              onClick={() => setIsEditDataSourceForPageText(true)}
                            >
                              Edit Other Pages
                            </button>
                          )}
                        {customFormList.some(
                          (field) => field.data_type === 12,
                        ) && (
                            <button
                              className="modal-button2"
                              onClick={() => setIsEditPageUrlModalOpen(true)}
                            >
                              Edit Page URL
                            </button>
                          )}
                        {customFormList.some(
                          (field) => field.data_type === 14,
                        ) && (
                            <button
                              className="modal-button2"
                              onClick={() => setIsEditDesignerPageModalOpen(true)}
                            >
                              Edit Designer Page
                            </button>
                          )}
                      </div>
                      <div
                        className="modal-buttons text-start"
                        style={{ margin: "0px" }}
                      >
                        <button
                          className="modal-button2"
                          onClick={() => setIsAttachDocument(true)}
                        >
                          Attach Document
                        </button>
                      </div>
                    </div>
                    <div
                      className="col-8"
                      style={{
                        display: "flex",
                        alignItems: "end",
                        justifyContent: "end",
                      }}
                    >
                      <div
                        className="modal-buttons text-end"
                        style={{ margin: "0px" }}
                      >
                        <button
                          className="modal-button1"
                          onClick={() => setIsCloseConfirmation(true)}
                        >
                          {btn1}
                        </button>
                        {/* disabled={orderTypesNameFind !== "Quotation"? true : false */}
                        {cartnumber || !cart || cart.length == 0 ? (
                          <span></span>
                        ) : (
                          <button
                            className="modal-button2"
                            style={{
                              paddingInline: "10px",
                            }}
                            onClick={() => editCart(false)}
                          >
                            Save In Draft
                          </button>
                        )}
                        {(orderTypesNameFind !== "Quotation" &&
                          orderTypesNameFind !== "Sales Order" &&
                          orderTypesNameFind !== "Purchase Order" &&
                          orderTypesNameFind !== "Sales Invoice" &&
                          orderTypesNameFind !== "Purchase Invoice" &&
                          orderTypesNameFind !== "Return Sales Invoice" &&
                          orderTypesNameFind !== "Return Purchase Invoice" &&
                          orderTypesNameFind !== "Proforma Invoice" &&
                          orderTypesNameFind !== "Inward" &&
                          orderTypesNameFind !== "Dispatch" &&
                          cartnumber) ||
                          !cart ||
                          cart.length == 0 ? (
                          <span></span>
                        ) : (
                          <>
                            {/* <button
                              className="modal-button2"
                              style={{
                                backgroundColor: "#06cf9c",
                                border: "1.5px solid #06cf9c",
                                paddingInline: "10px",
                              }}
                              onClick={() => onSubmit(false)}
                            >
                              {btn2}
                            </button>
                            <button
                              className="modal-button2"
                              style={{
                                backgroundColor: "#06cf9c",
                                border: "1.5px solid #06cf9c",
                                paddingInline: "10px",
                              }}
                              onClick={() => onSubmit(true)}
                            >
                              {"approve & print"}
                            </button> */}
                            <button
                              className="modal-button2"
                              style={{
                                backgroundColor: "#06cf9c",
                                border: "1.5px solid #06cf9c",
                                paddingInline: "10px",
                              }}
                              onClick={() => {
                                const customFieldErrors: Record<
                                  string,
                                  string
                                > = {};

                                // 1. Cart-level custom fields (products_column_xxx)
                                for (const item of cart) {
                                  const productIndex = cart.indexOf(item); // for error display

                                  for (const field of customFormListProduct) {
                                    if (field.form_type !== 4) continue;

                                    const fieldName =
                                      field.reference_column_name;
                                    const rawValue = item[fieldName];

                                    if (
                                      rawValue === undefined ||
                                      rawValue === null ||
                                      rawValue === ""
                                    ) {
                                      if (field.required_or_not === 1) {
                                        customFieldErrors[
                                          `cart[${productIndex}].${fieldName}`
                                        ] = `${field.title} is required`;
                                      }
                                      continue;
                                    }

                                    const strValue = String(rawValue).trim();

                                    // Min / Max length
                                    if (field.min_limit || field.max_limit) {
                                      const min = Number(field.min_limit) || 0;
                                      const max =
                                        Number(field.max_limit) || Infinity;

                                      if (min > 0 && strValue.length < min) {
                                        customFieldErrors[
                                          `cart[${productIndex}].${fieldName}`
                                        ] =
                                          `${field.title} must be at least ${min} characters`;
                                      }
                                      if (
                                        max < Infinity &&
                                        strValue.length > max
                                      ) {
                                        customFieldErrors[
                                          `cart[${productIndex}].${fieldName}`
                                        ] =
                                          `${field.title} must not exceed ${max} characters`;
                                      }
                                    }

                                    // Validation type (pattern)
                                    if (field.validation_type) {
                                      const vt = String(field.validation_type);
                                      let regex: RegExp | null = null;
                                      let msg = "";

                                      switch (vt) {
                                        case "1":
                                          regex = /^[0-9]+$/;
                                          msg = "only numbers";
                                          break;
                                        case "2":
                                          regex = /^[A-Za-z0-9]+$/;
                                          msg = "alphanumeric only";
                                          break;
                                        case "3":
                                          regex = /^[A-Za-z\s]+$/;
                                          msg = "letters only";
                                          break;
                                        case "4":
                                          regex =
                                            /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
                                          msg = "letters + special chars";
                                          break;
                                        case "5":
                                          regex =
                                            /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
                                          msg = "numbers + special chars";
                                          break;
                                        case "6":
                                          regex =
                                            /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
                                          msg = "alphanumeric + special chars";
                                          break;
                                      }

                                      if (regex && !regex.test(strValue)) {
                                        customFieldErrors[
                                          `cart[${productIndex}].${fieldName}`
                                        ] =
                                          `${field.title} must contain ${msg}`;
                                      }
                                    }
                                  }
                                }

                                // 2. Order-level custom fields (cartCustomFieldValues)
                                for (const field of customFormList) {
                                  if (
                                    ![5, 6, 7, 8, 9, 10, 11, 12, 13].includes(
                                      field.form_type,
                                    )
                                  )
                                    continue;

                                  const fieldName = field.reference_column_name;
                                  const rawValue =
                                    cartCustomFieldValues[fieldName];

                                  if (
                                    rawValue === undefined ||
                                    rawValue === null ||
                                    rawValue === ""
                                  ) {
                                    if (field.required_or_not === 1) {
                                      customFieldErrors[fieldName] =
                                        `${field.title} is required`;
                                    }
                                    continue;
                                  }

                                  const strValue = String(rawValue).trim();

                                  // Min / Max length
                                  if (field.min_limit || field.max_limit) {
                                    const min = Number(field.min_limit) || 0;
                                    const max =
                                      Number(field.max_limit) || Infinity;

                                    if (min > 0 && strValue.length < min) {
                                      customFieldErrors[fieldName] =
                                        `${field.title} must be at least ${min} characters`;
                                    }
                                    if (
                                      max < Infinity &&
                                      strValue.length > max
                                    ) {
                                      customFieldErrors[fieldName] =
                                        `${field.title} must not exceed ${max} characters`;
                                    }
                                  }

                                  // Validation type
                                  if (field.validation_type) {
                                    const vt = String(field.validation_type);
                                    let regex: RegExp | null = null;
                                    let msg = "";

                                    switch (vt) {
                                      case "1":
                                        regex = /^[0-9]+$/;
                                        msg = "only numbers";
                                        break;
                                      case "2":
                                        regex = /^[A-Za-z0-9]+$/;
                                        msg = "alphanumeric only";
                                        break;
                                      case "3":
                                        regex = /^[A-Za-z\s]+$/;
                                        msg = "letters only";
                                        break;
                                      case "4":
                                        regex =
                                          /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
                                        msg = "letters + special chars";
                                        break;
                                      case "5":
                                        regex =
                                          /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
                                        msg = "numbers + special chars";
                                        break;
                                      case "6":
                                        regex =
                                          /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
                                        msg = "alphanumeric + special chars";
                                        break;
                                    }

                                    if (regex && !regex.test(strValue)) {
                                      customFieldErrors[fieldName] =
                                        `${field.title} must contain ${msg}`;
                                    }
                                  }
                                }

                                onSubmitApprove();
                              }}
                            >
                              {"Approve"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    ></div>
                  </div>
                </div>
                {openCloseRightSide && (
                  <>
                    <div
                      className={`${dynamicImageView.includes(2) ? "col-3" : "col-4"
                        } card`}
                      style={{ borderRadius: "0px" }}
                    >
                      <div className=" d-flex gap-1">
                        {dynamicImageView.includes(1) ? (
                          <div className="search-bar-order pe-2">
                            <label htmlFor="">Search Product</label>
                          </div>
                        ) : (
                          ""
                        )}

                        <div
                          className={`${dynamicImageView.includes(2) ? "w-100" : "w-50"
                            } mt-2`}
                        >
                          <label htmlFor="">Product Category</label>
                        </div>
                        {/* {dynamicImageView.includes(1) ? (
                    <div className="search-bar-order pe-2">
                      <label htmlFor="">Product List</label>
                    </div>
                  ) : (
                    ""
                  )} */}
                        <div
                          className={`${dynamicImageView.includes(2) ? "w-100" : "w-50"
                            } mt-2`}
                        >
                          <label htmlFor="">Price List</label>
                        </div>
                      </div>
                      <div className=" d-flex justify-content-between">
                        {dynamicImageView.includes(1) ? (
                          <div className="search-bar-order pe-2">
                            <div style={{ width: "70%" }}>
                              <button
                                className="search"
                                onClick={openCreateProduct}
                                style={{ marginLeft: "47%" }}
                              >
                                <span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="26px"
                                    viewBox="0 -960 960 960"
                                    width="26px"
                                    fill="currentColor"
                                  >
                                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                  </svg>
                                </span>
                              </button>
                              <button
                                className="search"
                                style={{ left: "10px" }}
                              >
                                <span className="">
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="24"
                                    height="24"
                                    className=""
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                                    ></path>
                                  </svg>
                                </span>
                              </button>

                              <span className="go-back">
                                <svg
                                  viewBox="0 0 24 24"
                                  width="24"
                                  height="24"
                                  className=""
                                >
                                  <path
                                    fill="currentColor"
                                    d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                                  ></path>
                                </svg>
                              </span>

                              <input
                                type="text"
                                title="Search"
                                aria-label="Search"
                                placeholder="Search"
                                value={searchTerm}
                                ref={searchInputRef}
                                maxLength={SMALL_TEXT_LENGTH}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                disabled={
                                  cartnumber &&
                                    orderTypesNameFind !== "Quotation" &&
                                    orderTypesNameFind !== "Sales Order" &&
                                    orderTypesNameFind !== "Sales Invoice" &&
                                    orderTypesNameFind !== "Proforma Invoice" &&
                                    orderTypesNameFind !== "Purchase Order"
                                    ? true
                                    : false || canViewProduct
                                      ? false
                                      : true
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          ""
                        )}

                        <div
                          className={`${dynamicImageView.includes(2) ? "w-100" : "w-50"
                            } mt-2`}
                        >
                          <CustomSearchDropdown
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            className="w-100 "
                            isDisabled={
                              orderTypesNameFind !== "Quotation" &&
                                orderTypesNameFind !== "Sales Order" &&
                                orderTypesNameFind !== "Sales Invoice" &&
                                orderTypesNameFind !== "Proforma Invoice" &&
                                orderTypesNameFind !== "Purchase Order" &&
                                cartnumber
                                ? "disabled"
                                : false
                            }
                          />
                          {dynamicImageView.includes(2) ? (
                            <>
                              <label htmlFor="" className="mt-1">
                                Search Product
                              </label>

                              <div
                                className="search-bar-order pe- mt-0"
                                style={{
                                  width: "200%",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "140%",
                                  }}
                                >
                                  <button
                                    className="search"
                                    style={{ left: "10px" }}
                                  >
                                    <span className="">
                                      <svg
                                        viewBox="0 0 24 24"
                                        width="24"
                                        height="24"
                                        className=""
                                      >
                                        <path
                                          fill="currentColor"
                                          d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                                        ></path>
                                      </svg>
                                    </span>
                                  </button>

                                  <span className="go-back">
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="24"
                                      height="24"
                                      className=""
                                    >
                                      <path
                                        fill="currentColor"
                                        d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                                      ></path>
                                    </svg>
                                  </span>

                                  <input
                                    type="text"
                                    title="Search"
                                    aria-label="Search"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onFocus={(e) => e.target.select()}
                                    maxLength={SMALL_TEXT_LENGTH}
                                    ref={searchInputRef}
                                    onChange={(e) =>
                                      setSearchTerm(e.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    disabled={
                                      orderTypesNameFind !== "Quotation" &&
                                        orderTypesNameFind !== "Sales Order" &&
                                        orderTypesNameFind !== "Sales Invoice" &&
                                        orderTypesNameFind !==
                                        "Proforma Invoice" &&
                                        orderTypesNameFind !== "Purchase Order" &&
                                        cartnumber
                                        ? true
                                        : false || canViewProduct
                                          ? false
                                          : true
                                    }
                                    style={{
                                      display: "inline-block",
                                      flex: "1",
                                      marginRight: "10px",
                                    }}
                                  />
                                  <button
                                    className="icon"
                                    onClick={openCreateProduct}
                                  >
                                    <span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="26px"
                                        viewBox="0 -960 960 960"
                                        width="26px"
                                        fill="currentColor"
                                      >
                                        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                      </svg>
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            ""
                          )}
                        </div>
                        <div
                          className={`${dynamicImageView.includes(2) ? "w-100" : "w-50"
                            } mt-2`}
                          style={{ paddingInline: "10px" }}
                        >
                          <CustomSearchDropdown
                            options={pricelistOptions}
                            value={selectedPriceList}
                            onChange={handlepricelistChange}
                            className="w-100 "
                            isDisabled={
                              orderTypesNameFind !== "Quotation" &&
                                orderTypesNameFind !== "Sales Order" &&
                                orderTypesNameFind !== "Proforma Invoice" &&
                                orderTypesNameFind !== "Sales Invoice" &&
                                orderTypesNameFind !== "Purchase Order" &&
                                cartnumber
                                ? "disabled"
                                : false
                            }
                          />
                        </div>
                        {/* <div className="mt-3 px-2">
                      <span>
                        <svg
                          width="24"
                          height="24px"
                          viewBox="0 0 16 16"
                        >
                          <path
                            d="m 2 1 c -0.554688 0 -1 0.445312 -1 1 v 2 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 v -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m 5 1 v 2 h 8 v -2 z m -5 4.015625 c -0.554688 0 -1 0.445313 -1 1 v 1.980469 c 0 0.550781 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.449219 1 -1 v -1.980469 c 0 -0.554687 -0.445312 -1 -1 -1 z m 5 0.984375 v 2 h 8 v -2 z m -5 4 c -0.554688 0 -1 0.445312 -1 1 v 1.980469 c 0 0.550781 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.449219 1 -1 v -1.980469 c 0 -0.554688 -0.445312 -1 -1 -1 z m 5 0.984375 v 2 h 8 v -2 z m 0 0"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                    </div> */}
                      </div>

                      <div>
                        {productList ? (
                          <>
                            <div
                              className="row"
                              style={{ overflow: "auto", maxHeight: "62vh" }}
                              ref={listInnerRef}
                            >
                              {productList &&
                                productList.map((item: any, idx: number) => (
                                  <div
                                    className={`${dynamicImageView.includes(2)
                                      ? "col-12"
                                      : "col-md-4"
                                      }`}
                                    key={item.id}
                                  >
                                    <div
                                      ref={(el) =>
                                        (productRefs.current[idx] = el)
                                      }
                                      className={`${dynamicImageView.includes(2)
                                        ? "mb-1"
                                        : "mb-3"
                                        } card`}
                                      style={{
                                        cursor:
                                          (orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber) ||
                                            ((isOrderShowNum === 9 ||
                                              isOrderShowNum === 8) &&
                                              (orderById?.cart
                                                ?.referance_cart_id ||
                                                orderbyidList?.cart
                                                  ?.referance_cart_id))
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity:
                                          (orderTypesNameFind !== "Quotation" &&
                                            orderTypesNameFind !==
                                            "Sales Order" &&
                                            orderTypesNameFind !==
                                            "Proforma Invoice" &&
                                            orderTypesNameFind !==
                                            "Sales Invoice" &&
                                            orderTypesNameFind !==
                                            "Purchase Order" &&
                                            cartnumber) ||
                                            ((isOrderShowNum === 9 ||
                                              isOrderShowNum === 8) &&
                                              (orderById?.cart
                                                ?.referance_cart_id ||
                                                orderbyidList?.cart
                                                  ?.referance_cart_id))
                                            ? 0.6
                                            : 1,
                                        // borderColor:
                                        //   highlightedProductId === item.id ||
                                        //     focusedProductIndex === idx
                                        //     ? "#f58634"
                                        //     : isProductInCart(item.id)
                                        //       ? "#f58634"
                                        //       : "",
                                        backgroundColor:
                                          highlightedProductId === item.id ||
                                            focusedProductIndex === idx
                                            ? "#DDF4E7"
                                            : isProductInCart(item.id)
                                              ? "#DDF4E7"
                                              : "",
                                        borderRadius: "0px",
                                        outline:
                                          focusedProductIndex === idx
                                            ? "2px solid #26667F"
                                            : "none",
                                      }}
                                      onClick={() => {
                                        if (
                                          !cartnumber ||
                                          orderTypesNameFind == "Quotation" ||
                                          orderTypesNameFind == "Sales Order" ||
                                          orderTypesNameFind ==
                                          "Sales Invoice" ||
                                          (orderTypesNameFind ==
                                            "Purchase Order" &&
                                            isOrderShowNum != 9 &&
                                            (!orderById?.cart
                                              ?.referance_cart_id ||
                                              !orderbyidList?.cart
                                                ?.referance_cart_id))
                                        ) {
                                          if (
                                            (isOrderShowNum === 9 ||
                                              isOrderShowNum === 8) &&
                                            (orderById?.cart
                                              ?.referance_cart_id ||
                                              orderbyidList?.cart
                                                ?.referance_cart_id)
                                          ) {
                                            toast.error(
                                              "Cannot add products to Dispatch with reference order",
                                            );
                                            return;
                                          }

                                          if (
                                            isProductInCart(item.id) &&
                                            dynamicProductAdd.includes(1)
                                          ) {
                                            updateCartQuantity(item.id, 1);
                                          } else {
                                            addToCart(item);
                                          }
                                          toast.success(
                                            isProductInCart(item.id)
                                              ? "Product quantity updated in cart"
                                              : "Product added successfully to cart",
                                            {
                                              autoClose: 200,
                                            },
                                          );
                                          setFocusedProductIndex(null);
                                          fetchProductApiForOrder(
                                            0,
                                            ITEMS_PER_PAGE,
                                            searchTerm,
                                            0,
                                            selectedCategory,
                                            selectedPriceList,
                                            Contact,
                                            setProductList,
                                            isOrderShowNum,
                                            10,
                                            isPriceListTouched,
                                          );
                                          searchInputRef.current?.focus();
                                        }
                                      }}
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !cartnumber) {
                                          if (
                                            isProductInCart(
                                              item.id &&
                                              dynamicProductAdd.includes(1),
                                            )
                                          ) {
                                            updateCartQuantity(item.id, 1);
                                          } else {
                                            addToCart(item);
                                          }
                                          toast.success(
                                            isProductInCart(item.id)
                                              ? "Product quantity updated in cart"
                                              : "Product added successfully to cart",
                                          );
                                          setFocusedProductIndex(null);
                                          fetchProductApiForOrder(
                                            0,
                                            ITEMS_PER_PAGE,
                                            searchTerm,
                                            0,
                                            selectedCategory,
                                            selectedPriceList,
                                            Contact,
                                            setProductList,
                                            isOrderShowNum,
                                            11,
                                            isPriceListTouched,
                                          );
                                          searchInputRef.current?.focus();
                                        }
                                      }}
                                    >
                                      {dynamicImageView.includes(1) ? (
                                        <>
                                          <div
                                            style={{
                                              backgroundImage: item?.product_img
                                                ? `url(${item.product_img})`
                                                : `url(${no_image})`,
                                              backgroundSize: "cover",
                                              backgroundPosition: "center",
                                              height: "12vh",
                                              width: "100%",
                                              backgroundRepeat: "no-repeat",
                                            }}
                                          ></div>
                                          <div
                                            title={item.product_name}
                                            className="p-1"
                                          >
                                            <div style={{ maxHeight: "60px" }}>
                                              <h4
                                                className="order-text-card-body"
                                                style={{
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  margin: 0,
                                                }}
                                              >
                                                <b> {item.product_name}</b>
                                              </h4>
                                            </div>
                                            <h4 className="order-text-card-body">
                                              <b> {item.category_name}</b>
                                            </h4>
                                            <h4
                                              className="order-text-card-body"
                                              style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "5px",
                                                }}
                                              >
                                                <svg
                                                  height="12px"
                                                  viewBox="0 -960 960 960"
                                                  width="12px"
                                                  fill="currentColor"
                                                >
                                                  <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z" />
                                                </svg>
                                                <span>{item.rate}</span>
                                              </span>

                                              <strong>
                                                CS: {item.closing_qty}
                                              </strong>
                                            </h4>
                                          </div>{" "}
                                        </>
                                      ) : (
                                        <>
                                          <div className="p-1 d-flex justify-content-between align-items-start">
                                            <div>
                                              <h5
                                                className=""
                                                style={{
                                                  fontSize: "13px",
                                                  wordWrap: "break-word",
                                                  whiteSpace: "normal",
                                                  // overflow: "hidden",
                                                  // textOverflow: "ellipsis",
                                                  // display: "-webkit-box",
                                                  // WebkitLineClamp: 2,
                                                  // WebkitBoxOrient: "vertical",
                                                  maxWidth: "200px",
                                                  width: "200px",
                                                }}
                                              >
                                                <b>{item.product_name}</b>
                                              </h5>
                                              <small className="text-muted order-text-card-body">
                                                {item.category_name}
                                              </small>
                                            </div>
                                            <div
                                              className="text-end"
                                              style={{ width: "200px" }}
                                            >
                                              <div className="">
                                                <svg
                                                  height="12px"
                                                  viewBox="0 -960 960 960"
                                                  width="12px"
                                                  fill="currentColor"
                                                  className="me-1"
                                                >
                                                  <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z" />
                                                </svg>
                                                <strong>{item.net_rate}</strong>
                                              </div>
                                              <div>
                                                <strong className="order-text-card-body">
                                                  CS: {item.closing_qty}
                                                </strong>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </>
                        ) : (
                          <p>
                            {`No products available! \n Go to Settings > Products and add
                        your products.`}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {serialModalOpen && (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{ width: "50%", maxHeight: "85vh" }}
          >
            <span className="close" onClick={() => setSerialModalOpen(false)}>
              &times;
            </span>

            <h2 className="modal-title1 form_header_text">Serial Number</h2>

            <div className="p-3">
              {/* Input + Add Button */}
              <div className="d-flex gap-2 align-items-center mb-3">
                <input
                  id="serial-input-box"
                  type="text"
                  className="form-control"
                  placeholder="Scan Serial Number"
                  value={serialInput}
                  // readOnly={isLockedConversion}
                  onChange={(e) => setSerialInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSerialNumber()}
                />

                <button
                  type="button"
                  onClick={addSerialNumber}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    opacity: isLockedConversion ? 0.6 : 1,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="26px"
                    viewBox="0 -960 960 960"
                    width="26px"
                    fill="#5f6368"
                  >
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button>
                {/* <button type="button" onClick={addSerialNumber}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#5f6368">
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button> */}
              </div>

              {/* Serial Numbers Table with Scroll */}
              <div
                style={{
                  maxHeight:
                    cart[selectedSerialItemIndex || 0]?.serial_numbers?.length >
                      3
                      ? "220px"
                      : "auto",
                  overflowY:
                    cart[selectedSerialItemIndex || 0]?.serial_numbers?.length >
                      3
                      ? "auto"
                      : "hidden",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                }}
              >
                <table className="table table-bordered mb-0">
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#f8f9fa",
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th style={{ width: "70px" }}>SR</th>
                      <th>Serial Number</th>
                      <th style={{ width: "100px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSerialItemIndex !== null &&
                      cart[selectedSerialItemIndex]?.serial_numbers?.length >
                      0 ? (
                      cart[selectedSerialItemIndex].serial_numbers.map(
                        (sn: string, serialIndex: number) => (
                          <tr key={serialIndex}>
                            <td>{serialIndex + 1}</td>
                            <td>{sn}</td>
                            <td>
                              {/* {!isLockedConversion && (
                              <button
                                type="button"
                                onClick={() => removeSerialNumber(selectedSerialItemIndex, serialIndex)}
                                style={{ border: "none", background: "transparent", cursor: "pointer" }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="red">
                                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                </svg>
                              </button>
                            )} */}

                              <button
                                type="button"
                                onClick={() =>
                                  removeSerialNumber(
                                    selectedSerialItemIndex,
                                    serialIndex,
                                  )
                                }
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  opacity: isLockedConversion ? 0.6 : 1,
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="22px"
                                  viewBox="0 -960 960 960"
                                  width="22px"
                                  fill="red"
                                >
                                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          style={{ textAlign: "center", padding: "20px" }}
                        >
                          No Serial Number Added
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* {isLockedConversion && (
                <p className="text-danger mt-2 text-center">
                  <strong>Note:</strong> Serial numbers cannot be modified After Approved.
                </p>
              )} */}
            </div>
          </div>
        </div>
      )}

      {isCloseConfirmation && (
        <ConfirmationModal
          show={isCloseConfirmation}
          onHide={() => setIsCloseConfirmation(false)}
          handleSubmit={() => handleHide()}
          title={`Close this ${dynamicTitle}`}
          message={`Are you sure you want Close this ${dynamicTitle}?`}
          btn1="No"
          btn2="Yes"
        />
      )}

      {/* {
        isDeleteConfirmation && (
          <ConfirmationModal
            show={isDeleteConfirmation}
            onHide={() => setIsDeleteConfirmation(false)}
            handleSubmit={() => setIsDeleteConfirmation(false)}
            title={`Delete this Product`}
            message={`Are you sure you want to delete this product? This message appears when you click on 'Save In Draft'`}
            btn1="CANCEL"
            btn2="Delete"
          />
        )
      } */}

      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => {
            setIsDeleteConfirmation(false);
            setItemToDelete(null);
          }}
          handleSubmit={confirmDelete}
          title="Delete this Product"
          message="Are you sure you want to delete this product?"
          btn1="CANCEL"
          btn2="Delete"
        />
      )}
      {isOpenCreateModel && (
        <CreateProductView
          show={isOpenCreateModel}
          onHide={() => setIsCreateModel(false)}
          productToEdit={undefined}
          headerName="Create Product"
          setRefreshProduct={setRefreshProduct}
        />
      )}
      {isOrderCreateFromContactShow && (
        <ReportModal
          show={isOrderCreateFromContactShow}
          onHide={() => setIsOrderCreateFromContactShow(false)}
          handleSubmit={() => setIsOrderCreateFromContactShow(false)}
          titles={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
          reportName={reportName}
        />
      )}

      {isConvertIntoProformaConfirmation && (
        <ConfirmationModal
          show={isConvertIntoProformaConfirmation}
          onHide={() => setIsConvertIntoProformaConfirmation(false)}
          handleSubmit={() => {
            handleConvertIntoProforma(
              converCartId,
              convertCartNumber,
              setIsConvertIntoProformaConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            );
          }}
          title={`Convert to ${printDate?.[0]?.proforma_invoice_title || "Proforma Invoice"}`}
          message={`Are you sure you want to Convert this ${dynamicTitle} Into ${printDate?.[0]?.proforma_invoice_title || "Proforma Invoice"}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvetIntoOrderConfirmation && (
        <ConfirmationModal
          show={isConvetIntoOrderConfirmation}
          onHide={() => setIsConvetIntoOrderConfirmation(false)}
          handleSubmit={() => {
            handleConvertIntoOrder(
              converCartId,
              convertCartNumber,
              setIsConvetIntoOrderConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            );
          }}
          title={`Convert to ${dynamicSalesOrderTitle}`}
          message={`Are you sure you want to Convert this ${dynamicTitle} Into ${dynamicSalesOrderTitle}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoDisPatchConfirmation && (
        <ConfirmationModal
          show={isConvertIntoDisPatchConfirmation}
          onHide={() => setIsConvertIntoDisPatchConfirmation(false)}
          handleSubmit={() =>
            handleConvertIntoDispath(
              converCartId,
              convertCartNumber,
              setIsConvertIntoDisPatchConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            )
          }
          title={`Convert to ${dynamicDispatch}`}
          message={`Are you sure you want to Convert ${dynamicTitle} this Into ${dynamicDispatch} ?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoInwardConfirmation && (
        <ConfirmationModal
          show={isConvertIntoInwardConfirmation}
          onHide={() => setIsConvertIntoInwardConfirmation(false)}
          handleSubmit={() =>
            handleConvertIntoInward(
              converCartId,
              convertCartNumber,
              setIsConvertIntoInwardConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            )
          }
          title={`Convert to ${dynamicInward}`}
          message={`Are you sure you want to Convert ${dynamicTitle} this Into ${dynamicInward} ?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}

      {isConvertIntoInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoInvoiceConfirmation}
          onHide={() => setIsConvertIntoInvoiceConfirmation(false)}
          handleSubmit={() =>
            handleConvertIntoInvoice(
              converCartId,
              convertCartNumber,
              setIsConvertIntoInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            )
          }
          title={`Convert to ${dynamicSalesInvoiceTitle}`}
          message={`Are you sure you want to Convert ${dynamicTitle} this Into ${dynamicSalesInvoiceTitle} ?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}

      {isConvertIntoPurchaseInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoPurchaseInvoiceConfirmation}
          onHide={() => setIsConvertPurchaseIntoInvoiceConfirmation(false)}
          handleSubmit={() =>
            handleConvertIntoPurchaseInvoice(
              converCartId,
              convertCartNumber,
              setIsConvertPurchaseIntoInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            )
          }
          title={`Convert to ${dynamicPurchaseInvoiceTitle}`}
          message={`Are you sure you want to Convert this ${dynamicTitle} Into ${dynamicPurchaseInvoiceTitle}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertPurchaseIntoReturnPurchaseInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertPurchaseIntoReturnPurchaseInvoiceConfirmation}
          onHide={() =>
            setIsConvertPurchaseIntoReturnPurchaseInvoiceConfirmation(false)
          }
          handleSubmit={() =>
            handleConvertIntoReturnPurchaseInvoice(
              converCartId,
              convertCartNumber,
              setIsConvertPurchaseIntoReturnPurchaseInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            )
          }
          title={`Convert to ${dynamicReturnPurchaseInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicTitle} Into ${dynamicReturnPurchaseInvoice}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoReturnSalesInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoReturnSalesInvoiceConfirmation}
          onHide={() => setIsConvertIntoReturnSalesInvoiceConfirmation(false)}
          handleSubmit={() =>
            handleModalConvertIntoReturnSalesInvoices(
              converCartId,
              convertCartNumber,
              setIsConvertIntoReturnSalesInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setConverCartId,
            )
          }
          title={`Convert to ${dynamicReturnSalesInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicTitle} Into ${dynamicReturnSalesInvoice}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}

      {isMakeCartCopyConfirmation && (
        <ConfirmationModal
          show={isMakeCartCopyConfirmation}
          onHide={() => setIsMakeCartCopyConfirmation(false)}
          handleSubmit={() =>
            handleMakeNewCopy(
              // makeCopyType,
              // converCartId,
              // setIsMakeCartCopyConfirmation,
              // setRefreshCarts,

              makeCopyType,
              converCartId,
              setIsMakeCartCopyConfirmation,
              setRefreshCarts,
              setLoading,
              setOrderById,
              setIsOrderShowNum1,
              setIsEditOrderShow,
            )
          }
          title={`Create New Copy Of ${dynamicTitle}`}
          message={`Are you sure you want to Create New Copy Of ${dynamicTitle}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isPrintSettingShow && printSetting && (
        <PrintSettingModal
          show={isPrintSettingShow}
          setShow={setIsPrintSettingShow}
          onHide={() => setIsPrintSettingShow(false)}
          handleSubmit={() => {
            if (
              newOrderShowNumAfterConversion ||
              (isOrderShowNum && isOrderViewFormate)
            ) {
              fetchprintSetting(
                setPrintSetting,
                Number(newOrderShowNumAfterConversion || isOrderShowNum),
                Number(isOrderViewFormate),
              );
            } else {
              setIsPrintSettingShow(false);
            }
          }}
          orderType={Number(isOrderShowNum)}
          viewFormate={Number(isOrderViewFormate)}
          orderById={printSetting?.setting_details}
          titles={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
        />
      )}

      {isEditDataSourceForPageText && (
        <PageTextEditModel
          show={isEditDataSourceForPageText}
          onHide={() => setIsEditDataSourceForPageText(false)}
          passDataInAddItem={null}
          pageTextFields={
            customFormList
              .filter((f) => f.data_type === 11)
              .map((field) => {
                const dropdownOptions = dropdownDataMap[String(field.id)] || [];

                const __dropdownSources = dropdownOptions.map(
                  (opt) => opt.data_sorce,
                );
                const currentValue =
                  cartCustomFieldValues[field.reference_column_name] || "";
                const finalDataSorce =
                  currentValue || __dropdownSources[0] || "";

                return {
                  ...field,
                  data_sorce: finalDataSorce,
                  __dropdownSources,
                };
              }) as (ICustomInquiryFromList & { __dropdownSources: string[] })[]
          }
          isLocalOnly={true}
          onLocalDataSourceChange={(fieldName, html) => {
            setCartCustomFieldValues((prev) => ({
              ...prev,
              [fieldName]: html,
            }));
          }}
        />
      )}

      {isEditPageUrlModalOpen && (
        <PageTextEditModel
          show={isEditPageUrlModalOpen}
          onHide={() => setIsEditPageUrlModalOpen(false)}
          passDataInAddItem={null}
          pageTextFields={
            customFormList
              .filter((f) => f.data_type === 12)
              .map((field) => {
                const dropdownOptions = dropdownDataMap[String(field.id)] || [];

                const __dropdownSources = dropdownOptions.map(
                  (opt) => opt.data_sorce,
                );
                const currentValue =
                  cartCustomFieldValues[field.reference_column_name] || "";
                const finalDataSorce =
                  currentValue || __dropdownSources[0] || "";

                return {
                  ...field,
                  data_sorce: finalDataSorce,
                  __dropdownSources,
                };
              }) as (ICustomInquiryFromList & { __dropdownSources: string[] })[]
          }
          isLocalOnly={true}
          onLocalDataSourceChange={(fieldName, html) => {
            setCartCustomFieldValues((prev) => ({
              ...prev,
              [fieldName]: html,
            }));
          }}
        />
      )}

      {isEditDesignerPageModalOpen && (
        <DesignerPageEditModel
          show={isEditDesignerPageModalOpen}
          onHide={() => setIsEditDesignerPageModalOpen(false)}
          designerPageFields={customFormList
            .filter((f) => f.data_type === 14)
            .map((field) => {
              const dropdownOptions = dropdownDataMap[String(field.id)] || [];
              const __dropdownSources = dropdownOptions.map((opt: any) => opt.data_sorce);
              const adminDefault = __dropdownSources[0] || "";
              return {
                ...field,
                data_sorce:
                  cartCustomFieldValues[field.reference_column_name] || adminDefault,
                __dropdownSources,
              };
            })}
          onLocalDataSourceChange={(fieldName, templateId) => {
            setCartCustomFieldValues((prev) => ({
              ...prev,
              [fieldName]: templateId,
            }));
          }}
        />
      )}

      <AttachDocumentModel
        show={isAttachDocument}
        onHide={() => setIsAttachDocument(false)}
        title={`Attach Document for ${dynamicTitle}`}
        onSave={async (newFiles, modifiedExisting) => {
          try {
            const token = localStorage.getItem("token");
            const localId = localStorage.getItem("UUID");

            // Handle new files upload
            if (
              newFiles &&
              newFiles.length > 0 &&
              ((orderById && orderById.cart && orderById.cart.id) ||
                (orderId && orderId.cart && orderId.cart.id))
            ) {
              const formData = new FormData();

              newFiles.forEach((item) => {
                formData.append("images", item.file);
                formData.append(
                  "display_orders",
                  item.display_order.toString(),
                );
              });

              formData.append("cart_id", cartId.toString());
              formData.append("a_application_login_id", localId || "");

              const attachment = await axiosInstance.post(
                "orderAttachment",
                formData,
                {
                  headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": localId,
                    "Content-Type": "multipart/form-data",
                  },
                },
              );

              if (attachment.data.ack === 1) {
                toast.success("Files uploaded successfully");
              }
            } else {
              setUploadedFiles(newFiles);
            }

            // Handle modified existing attachments
            if (modifiedExisting && modifiedExisting.length > 0) {
              for (const item of modifiedExisting) {
                await axiosInstance.post("updateorderAttachment", {
                  id: item.id,
                  display_order: item.display_order,
                  isDelete: item.isMarkedForDelete ? 1 : 0,
                });
              }
              toast.success("Attachments updated successfully");
            }
          } catch (error: any) {
            // console.error("Error updating attachments:", error);
            toast.error("Failed to update attachments", error);
          }
        }}
        cartId={
          (orderById && orderById.cart && orderById.cart.id) ||
          (orderId && orderId.cart && orderId.cart.id) ||
          null
        }
      />

      {showapproveModel && (
        <ApproveModel
          show={showapproveModel}
          onHide={() => setShowapproveModel(false)}
          handleSubmit={(
            checkedOptions,
            dropdownValue,
            selectedSeries,
            customSeriesNumber,
            customSeriesDate,
            selectedTrasactionMode,
            selectedMiracleLedger,
          ) => {
            setApproveData({
              checkedOptions,
              dropdownValue,
              selectedSeries,
              customSeriesNumber,
              customSeriesDate,
              selectedTrasactionMode: selectedTrasactionMode || "",
              selectedMiracleLedger: selectedMiracleLedger || "",
            });
          }}
          setButtonloding={setButtonloding}
          loading={buttonLoading}
          title={`Confirm ${dynamicTitle} Actions`}
          message={`Pick what you want to do after clicking Approve.`}
          showTaskTemplateFor={dynamicStartWorkflow}
          orderType={isOrderShowNum}
          showOrderId={cartId}
          defaultSeriesValue={
            orderById?.cart?.sr_by_prifix || orderbyidList?.cart?.sr_by_prifix
          }
          defaultCustomSeriesValue={{
            customSeriesNumber:
              orderById?.cart?.cart_number || orderbyidList?.cart?.cart_number,
            customSeriesDate:
              orderById?.cart?.update_Date_time ||
              orderbyidList?.cart?.update_Date_time,
          }}
          transaction_mode={
            orderById?.cart?.transaction_mode ||
            orderbyidList?.cart?.transaction_mode
          }
          miracle_account_legder={
            orderById?.cart?.miracle_account_legder ||
            orderbyidList?.cart?.miracle_account_legder
          }
          isDisabledSeries={cartnumber ? true : false}
          isoption={true}
          drop1={"Select Series"}
          opt1={"Save & Approve"}
          opt2={"Print"}
          opt3={"Share In WhatsApp"}
          opt4={"Download PDF"}
          opt5={"Start WorkFlow"}
          opt6={"Sync With Miracle"}
          opt5NoteText={
            "All tasks are created automatically according to the selected template."
          }
          setWorkFlowFor={"cart"}
          btn1="CANCEL"
          btn2="Approve"
        />
      )}
      {showDownloadPicker && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Choose Template</h5>
              <span
                className="close"
                onClick={() => {
                  setShowDownloadPicker(false);
                  setDownloadTemplateChoices([]);
                }}
              >
                &times;
              </span>
            </div>
            {downloadTemplateChoices.map((t) => (
              <div
                key={t.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>{t.template_name}{t.is_default ? " ★" : ""}</div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    handleDownload(t.id);
                    setShowDownloadPicker(false);
                    setDownloadTemplateChoices([]);
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {printTemplateChoices.length > 0 && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Choose Template</h5>
              <span
                className="close"
                onClick={() => setPrintTemplateChoices([])}
              >
                &times;
              </span>
            </div>
            {printTemplateChoices.map((t) => (
              <div
                key={t.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>{t.template_name}{t.is_default ? " ★" : ""}</div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => printWithTemplate(t.id)}
                >
                  {printMode === "view" ? "View" : "Print"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {printLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCreateModal;