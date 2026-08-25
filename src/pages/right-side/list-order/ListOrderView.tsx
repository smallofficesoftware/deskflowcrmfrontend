import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import {
  convertDateTimeFormat,
  formatDate,
  formatDateAndTime,
  formatNumber,
} from "../../../common/SharedFunction";
import { useTheme } from "../../../components/ThemeContext";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import EventLogs from "../../../components/model/EventLogModel/EventLogsModel";
import OrderCreateModal from "../../../components/model/OrderCreateModel/OrderCreateModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import RadioButtonModal from "../../../components/model/RadioButtonModal";
import ReminderModal from "../../../components/model/ReminderModal";
import { whatsappTemplateCloudeSend } from "../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import WorkFlowModel from "../../../components/model/workflowConformatioModel/workFlowModelView";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_MESSAGE_FOR_UNDER_DEVELOPMENT,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  MIN_WIDTH_FOR_TEXT,
  SMALL_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, PRINT_SETTING_TYPE_OBJ } from "../../../helpers/AppEnum";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import { fetchPdfmeTemplatesForPicker, fetchTemplatesForDocType, isPdfmeSupportedCartType } from "../../order-print-view/orderPrintController";
import {
  generateAndPrintPendingPdf,
  tryPendingPdfmePrint,
} from "../../dashboard/Reports/Quotations/QuotationController";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";
import {
  ModuleType,
  useSalesDependencyGuard,
} from "../../../store/sales/salesDependencyGuard";
import useWhatsappPlatformStore from "../../../store/whatsapp/useWhatsappPlateformFlagStore";
import MultipleDeletePopUp from "../../dashboard/Reports/MultipleDeletePopUp";
import {
  fetchprintSetting,
  IprintSetting,
} from "../../order-pdf-view/OrderPdfController";
import CreateTaskView from "../create-task/CreateTaskView";
import {
  createReminderForCart,
  fetchCurrency,
  fetchListOrderApi,
  fetchOrderByIdApi,
  fetchStageStatusForOrderApi,
  handleChangeStatusOfReminderCompleted,
  handleConvertIntoDispath,
  handleConvertIntoInvoice,
  handleConvertIntoProforma,
  handleConvertIntoInward,
  handleConvertIntoOrder,
  handleConvertIntoPurchaseInvoice,
  handleConvertIntoReturnPurchaseInvoice,
  handleDeleteOrder,
  handleMakeNewCopy,
  handleModalConvertIntoReturnSalesInvoices,
  IOrder,
  orderTypesList,
  orderTypesSendList,
  syncMiracleInvoice,
  updateStageStatusForOrderRadioButton,
} from "./ListOrderController";

let TRANSACTION_MODE: any = {
  "1": "Cash Memo",
  "2": "Debit Memo",
};

interface IPropsListOrder {
  isListOrder: boolean;
  closeListOrder: () => void;
  contactData?: any;
  isOrderShowNum: ModuleType;
  dynamicTitle?: any;
  setRefreshChat?: (value: boolean | number) => void;
  onRefreshMessages?: () => void;
  /** Called after a conversion succeeds with the target order type number.
   *  Lets the parent switch its list view to the converted-to type.
   *  e.g. Quotation(1) → Order(2): onConversionSuccess(2) */
  onConversionSuccess?: (targetOrderType: number) => void;
}
interface ICurrency {
  id: number;
  short_name: string;
  name: string;
  symbol: string;
}

const ListOrderView = ({
  isListOrder,
  closeListOrder,
  contactData,
  isOrderShowNum,
  dynamicTitle,
  setRefreshChat,
  onRefreshMessages,
  onConversionSuccess,
}: IPropsListOrder) => {
  const check = useSalesDependencyGuard((s) => s.check);
  const { platformType } = useWhatsappPlatformStore();

  const dropdownCreateOrderRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<Record<number, HTMLUListElement | null>>({});
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [dynamicViewFormate, setDynamicViewFormate] = useState(1);
  const [isWhatsAppCloudLoading, setIsWhatsAppCloudLoading] = useState(false);

  const { darkMode, toggleTheme } = useTheme();
  const [dropdownOpenCreateOrder, setDropdownOpenCreateOrder] = useState(false);
  const [isOrderCreateShow, setIsOrderCreateShow] = useState(false);
  const [orderList, setOrderList] = useState<IOrder[]>([]);
  const [orderById, setOrderById] = useState<any>();

  const [noDataFound, setNoDataFound] = useState(false);
  const [refreshCarts, setRefreshCarts] = useState(false);
  const [orderId, setOrderId] = useState<number>();
  const [orderDropdownOpen, setOrderDropdownOpen] = useState<any>(null);
  const [isEditOrderShow, setIsEditOrderShow] = useState(false);
  const [orderIdDelete, setOrderIdDelete] = useState(0);
  const [converCartId, setConverCartId] = useState(0);
  const [convertCartNumber, setConvertCartNumber] = useState("");
  const [makeCopyType, setMakeCopyType] = useState(0);
  const [currency, setCurrency] = useState<ICurrency[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [refreshDownload, setRefreshDownload] = useState(false);
  // §7 template picker — same rule as the single-order OrderPrintView*.tsx
  // pages: skip the picker when the company has 0-1 pdfme templates for
  // this doc type, show it when 2+.
  const [showDownloadPicker, setShowDownloadPicker] = useState(false);
  const [downloadTemplateChoices, setDownloadTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [pendingDownloadCartId, setPendingDownloadCartId] = useState<number | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [printTemplateChoices, setPrintTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [pendingPrintCartId, setPendingPrintCartId] = useState<number | null>(null);
  // Pending Order/Purchase print template picker -- distinct state from
  // printTemplateChoices/pendingPrintCartId above (those are the confirmed-
  // order print flow's own picker). See tryPendingPdfmePrint's click-time-
  // check comment (QuotationController.ts).
  const [pendingOrderPrintChoices, setPendingOrderPrintChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [pendingOrderPrintCartId, setPendingOrderPrintCartId] = useState<number | null>(null);
  const [isPDFSendingToWhatsApp, setIsPDFSendingToWhatsApp] = useState(false);
  const [isConvetIntoOrderConfirmation, setIsConvetIntoOrderConfirmation] =
    useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [checkboxesVisible, setIsCheckboxesVisible] = useState(
    selectedIds.length > 0 || isAllSelected,
  );

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
  const [
    isConvertIntoPurchaseInvoiceConfirmation,
    setIsConvertPurchaseIntoInvoiceConfirmation,
  ] = useState(false);
  const [
    isConvertIntoReturnSalesInvoiceConfirmation,
    setIsConvertIntoReturnSalesInvoiceConfirmation,
  ] = useState(false);
  const [
    isConvertIntoReturnPurchaseInvoiceConfirmation,
    setIsConvertIntoReturnPurchaseInvoiceConfirmation,
  ] = useState(false);
  const [isMakeCartCopyConfirmation, setIsMakeCartCopyConfirmation] =
    useState(false);
  const [isReminderConfirmationStatus, setIsReminderConfirmationStatus] =
    useState(false);
  const [reminderData, setReminderData] = useState<IOrder>();
  const [isOrderShowNum1, setIsOrderShowNum1] = useState(0);
  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
    useState<boolean>(false);
  const [
    isShowConformationForStartWorkFlow,
    setIsShowConformationForStartWorkFlow,
  ] = useState<boolean>(false);
  const [workFlowShowId, setWorkFlowShowId] = useState<number>(0);
  const [workFlowOrderId, setWorkFlowOrderId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hover, setHover] = useState(false);
  const [companyDetail, setCompanyDetail] = useState<any>();

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
    [],
  );
  const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
  const [statusAssignStatusId, setStatusAssignStatusId] = useState<number>();
  const [isSetReminderConfirmation, setIsSetReminderConfirmation] =
    useState(false);

  const [refreshProduct, setRefreshProduct] = useState(false);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [printSetting, setPrintSetting] = useState<IprintSetting>();
  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);
  const [isConversionSuccess, setIsConversionSuccess] = useState(false);

  const [newOrderShowNumAfterConversion, setnewOrderShowNumAfterConversion] =
    useState<number | undefined>(undefined);
  const [newlyCreatedCartId, setNewlyCreatedCartId] = useState<
    number | null | undefined
  >(undefined);

  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const actionDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const actionDropdownWrapperRef = useRef<HTMLDivElement>(null);
  const [isMultiApproveConfirmation, setIsMultiApproveConfirmation] =
    useState(false);
  const [isMultiConvertConfirmation, setIsMultiConvertConfirmation] =
    useState(false);
  const [convertToType, setConvertToType] = useState<number>(0);
  const [multiConvertTarget, setMultiConvertTarget] = useState<number>(0);
  const [conversionType, setConversionType] = useState("");
  const [getCompanyId, setGetCompanyId] = useState(0);
  const [isMultiDeleteShow, setIsMultiDeleteShow] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<number[]>([]);


  const [isStageAndStatusModalOpen, setIsStageAndStatusModalOpen] =
    useState(false);
  const [stageAndStatusData, setStageAndStatusData] = useState<{
    orderId?: number;
    contactId?: number;
    referenceTable?: string;
    tableType?: string;
  }>({});
  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );

  const canAddQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.ADD,
  );
  const canViewPrintSetting = useCheckUserPermission(
    PAGE_ID.PRINT_SETTINGS_RIGHTS,
    PERMISSION_TYPE.VIEW,
  );
  const canAddOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.ADD,
  );
  const canAddInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canAddProforma = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canAddPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.ADD,
  );
  const canDelQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.DELETE,
  );
  const canDelOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.DELETE,
  );
  const canDelInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.DELETE,
  );
  const canDelPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.DELETE,
  );
  const canViewStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canStartWorkFlow = useCheckUserPermission(
    PAGE_ID.START_WORK_FLOW,
    PERMISSION_TYPE.ADD,
  );
  const canAddReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.ADD,
  );
  const canApproveReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.APPROVE,
  );
  const canAddPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.ADD,
  );
  const canAddReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.ADD,
  );
  const canAddReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.ADD,
  );

  const canDelPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.DELETE,
  );
  const canDelRetuenSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.DELETE,
  );
  const canDelRetuenPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.DELETE,
  );
  const canDelInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.DELETE,
  );
  const canDelDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.DELETE,
  );
  const canDelProformaInovice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.DELETE,
  );
  const canAddTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.ADD,
  );
  const canPdfQuo = useCheckUserPermission(
    PAGE_ID.QUOTATION,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfOrder = useCheckUserPermission(
    PAGE_ID.ORDER,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfInv = useCheckUserPermission(
    PAGE_ID.INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfPurchase = useCheckUserPermission(
    PAGE_ID.PURCHASE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfPurchaseOrder = useCheckUserPermission(
    PAGE_ID.PURCHASE_ORDER,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfReturnSalesInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_SALES_INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfReturnPurchaseInvoice = useCheckUserPermission(
    PAGE_ID.RETURN_PURCHASE_INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfInWard = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfProfomaInovice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.SHARE,
  );
  const canAddInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.ADD,
  );
  const canAddDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.ADD,
  );
  const canAddProfomaInvoice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.ADD,
  );

  const toggleDropdownCreate = () => {
    setDropdownOpenCreateOrder(!dropdownOpenCreateOrder);
  };

  const handelChangeShowModelQuotation = () => {
    setIsOrderShowNum1(1);
    setIsOrderCreateShow(true);
  };
  const handelChangeShowModelOrder = () => {
    setIsOrderShowNum1(2);
    setIsOrderCreateShow(true);
  };
  const handelChangeShowModelInvoice = () => {
    setIsOrderShowNum1(3);
    setIsOrderCreateShow(true);
  };
  const handleDownload = async (cartId: any, documentTemplateId?: number) => {
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
        setOrderDropdownOpen(null);

        // handleHide();
      } else {
        setOrderDropdownOpen(null);

        toast.error(resops.data.ack_msg);
        setRefreshDownload(false);
      }
    } catch (error: any) {
      setOrderDropdownOpen(null);
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
      setRefreshDownload(false);
    }
  };

  const downloadWithPicker = async (cartId: number) => {
    const choices = await fetchPdfmeTemplatesForPicker(isOrderShowNum);
    if (choices.length < 2) {
      await handleDownload(cartId);
      return;
    }
    setDownloadTemplateChoices(choices);
    setPendingDownloadCartId(cartId);
    setShowDownloadPicker(true);
  };

  const handleSendWhatsApp = async (cartId: any) => {
    try {
      setIsPDFSendingToWhatsApp(true);
      const getUUID = localStorage.getItem("UUID");
      const { data } = await axiosInstance.post("/send-sales-pdf-whatsapp", {
        cart_id: cartId,
        a_application_login_id: getUUID,
      });
      if (data && data.code == 200) {
        toast.success("WhatsApp message sent successfully.");
      }
      setOrderDropdownOpen(null);
    } catch (error: any) {
      setOrderDropdownOpen(null);

      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      setIsPDFSendingToWhatsApp(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownCreateOrderRef.current &&
        !dropdownCreateOrderRef.current.contains(event.target as Node)
      ) {
        setDropdownOpenCreateOrder(false);
        setOrderDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [dropdownCreateOrderRef]);
  useEffect(() => {
    // Load initial page
    setOrderList([]); // Clear existing list on initial load
    setCurrentPage(0); // Reset currentPage on initial load
    setNoDataFound(false); // Reset no data found
    fetchListOrderApi(
      0,
      ITEMS_PER_PAGE,
      (newItems) => setOrderList(newItems),
      setNoDataFound,
      setLoading,
      contactData.id,
      searchTerm,
      isOrderShowNum,
    );
  }, [contactData.id, isOrderShowNum, searchTerm]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOrderDropdownOpen(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  useEffect(() => {
    let isFetching = false; // Flag to prevent multiple fetches

    const handleScroll = () => {
      const el = listInnerRef.current;
      if (el && !loading && !noDataFound && !isFetching) {
        const isBottomReached =
          el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (isBottomReached) {
          isFetching = true; // Set flag to true to prevent duplicate calls
          fetchListOrderApi(
            currentPage + 1,
            ITEMS_PER_PAGE,
            (newItems) => {
              if (newItems.length > 0) {
                setOrderList((prev) => {
                  // Ensure no duplicates by checking IDs
                  const existingIds = new Set(prev.map((item) => item.id));
                  const uniqueNewItems = newItems.filter(
                    (item) => !existingIds.has(item.id),
                  );
                  return [...prev, ...uniqueNewItems];
                });
                setCurrentPage((prevPage) => prevPage + 1);
              } else {
                setNoDataFound(true);
              }
              isFetching = false; // Reset flag after fetch completes
            },
            setNoDataFound,
            setLoading,
            contactData.id,
            searchTerm,
            isOrderShowNum,
          );
        }
      }
    };

    const el = listInnerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [
    currentPage,
    loading,
    noDataFound,
    contactData.id,
    searchTerm,
    isOrderShowNum,
  ]);

  const handelRefreshOrder = () => {
    if (isOrderShowNum > 0) {
      setOrderList([]); // Clear existing list
      setCurrentPage(0); // Reset page
      setNoDataFound(false); // Reset no data found
      fetchListOrderApi(
        0,
        ITEMS_PER_PAGE,
        setOrderList,
        setNoDataFound,
        setLoading,
        contactData.id,
        searchTerm,
        isOrderShowNum,
      );
      fetchCurrency(setCurrency);
    }
  };

  useEffect(() => {
    if (contactData?.id) {
      closeListOrder();
      setSearchTerm("");
    } else {
      return undefined;
    }
  }, [contactData?.id]);

  useEffect(() => {
    if (isOrderShowNum > 0) {
      fetchListOrderApi(
        0,
        ITEMS_PER_PAGE,
        setOrderList,
        setNoDataFound,
        setLoading,
        contactData.id,
        searchTerm,
        isOrderShowNum,
      );
      fetchCurrency(setCurrency);
    }
  }, [
    contactData.id,
    isListOrder,
    isOrderCreateShow,
    isOrderShowNum,
    refreshCarts,
    searchTerm,
  ]);
  useEffect(() => {
    if (refreshCarts && isOrderShowNum > 0) {
      fetchListOrderApi(
        0,
        ITEMS_PER_PAGE,
        setOrderList,
        setNoDataFound,
        setLoading,
        contactData.id,
        "",
        isOrderShowNum,
      );
      fetchCurrency(setCurrency);

      setRefreshCarts(false);
    }
  }, [refreshCarts]);

  useEffect(() => {
    if (isModalAssignStatusVisible) {
      fetchStageStatusForOrderApi(
        setOptionRadioButtonStatus,
        isOrderShowNum,
        statusAssignStatusId,
      );
    } else {
      setOptionRadioButtonStatus([]);
      setStatusAssignStatusId(0);
    }
  }, [isModalAssignStatusVisible]);

  useEffect(() => {
    setIsCheckboxesVisible(selectedIds.length > 0 || isAllSelected);
  }, [selectedIds, isAllSelected]);

  useEffect(() => {
    const handleClickOutsideAction = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        actionDropdownWrapperRef.current &&
        !actionDropdownWrapperRef.current.contains(target) &&
        actionDropdownButtonRef.current &&
        !actionDropdownButtonRef.current.contains(target)
      ) {
        setIsActionDropdownOpen(false);
      }
    };

    if (isActionDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutsideAction);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideAction);
    };
  }, [isActionDropdownOpen]);

  const handleClickOutside = (event: { target: any }) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest(".icon-more");
    const isSelectedBtn = (target as HTMLElement).closest(".selected-btn");

    if (isDropdownButton || isSelectedBtn) {
      return;
    }

    const clickedInDropdown = Object.values(dropdownRef.current).some(
      (ref) => ref && ref.contains(target),
    );

    const clickedInActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      actionDropdownWrapperRef.current?.contains(target);

    if (!clickedInDropdown && !clickedInActionDropdown) {
      setOrderDropdownOpen(null);
    }

    if (!clickedInActionDropdown) {
      setIsActionDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (orderDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [orderDropdownOpen]);

  const createOrderSubmit = () => {
    setRefreshCarts(true);
    setRefreshChat && setRefreshChat(true); // Call the function with true
    setIsOrderCreateShow(false);
  };

  const updateOrderSubmit = () => {
    setRefreshCarts(true);
    setRefreshChat && setRefreshChat(true); // Call the function with true
    setIsEditOrderShow(false);
  };
  const toggleDropdownOrder = (id: number) => {
    setOrderId(id);
    setOrderDropdownOpen((prevId: any) => (prevId === id ? null : id));
  };
  const [editOrView, setEditOrView] = useState<string>("");
  const handelChangeEdit = (id: number, cartNumber: string, type: number) => {
    setEditOrView(
      (cartNumber && (type === 1 || type === 2 || type === 5 || type === 3 || type === 12)) ||
        !cartNumber
        ? "Edit/View"
        : "View",
    );

    setIsEditOrderShow(true);
    fetchOrderByIdApi(id, setLoading, setOrderById, setIsOrderShowNum1);
    setOrderDropdownOpen(null);
  };
  // const handelChangeOrderDelete = async (id?: number) => {
  //   const permissionMap: Record<number, boolean> = {
  //     1: canDelQuo, // Quotation
  //     2: canDelOrder, // Order
  //     3: canDelInv, // Invoice
  //     4: canDelPurchase, // Purchase Invoice
  //     5: canDelPurchaseOrder, // Purchase order
  //     6: canDelRetuenSalesInvoice, // Return sales invoice
  //     7: canDelRetuenPurchaseInvoice, // return purchase invoice
  //     8: canDelInward, // inward
  //     9: canDelDispatch, // dispatch
  //   };

  //   if (!permissionMap[isOrderShowNum]) {
  //     setIsDeleteConfirmation(false);
  //     setOrderDropdownOpen(null);
  //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //     return;
  //   }

  //   const result = await check(isOrderShowNum, id);

  //   if (permissionMap[isOrderShowNum]) {
  //     setIsDeleteConfirmation(true);
  //     if (id) {
  //       setOrderIdDelete(id);
  //     }
  //     setOrderDropdownOpen(null);
  //     setIsActionDropdownOpen(false);
  //   }
  // };

  const handelChangeOrderDelete = async (id?: number) => {
    const permissionMap: Record<ModuleType, boolean> = {
      1: canDelQuo,
      2: canDelOrder,
      3: canDelInv,
      4: canDelPurchase,
      5: canDelPurchaseOrder,
      6: canDelRetuenSalesInvoice,
      7: canDelRetuenPurchaseInvoice,
      8: canDelInward,
      9: canDelDispatch,
      12: canDelProformaInovice,
    };

    if (!permissionMap[isOrderShowNum]) {
      setIsDeleteConfirmation(false);
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    const result = await check(isOrderShowNum, id!);

    if (!result.data.canDelete) {
      toast.error(result.data.msg);
      return;
    }

    setIsDeleteConfirmation(true);
    setOrderDropdownOpen(null);
    setIsActionDropdownOpen(false);

    if (id) {
      setOrderIdDelete(id);
    }
  };

  const handelChangeMultiDelete = () => {
    const permissionMap: Record<ModuleType, boolean> = {
      1: canDelQuo,
      2: canDelOrder,
      3: canDelInv,
      4: canDelPurchase,
      5: canDelPurchaseOrder,
      6: canDelRetuenSalesInvoice,
      7: canDelRetuenPurchaseInvoice,
      8: canDelInward,
      9: canDelDispatch,
      12: canDelProformaInovice,
    };

    if (!permissionMap[isOrderShowNum]) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select at least one item to delete");
      return;
    }

    setDeleteTargetIds(selectedIds);
    setIsMultiDeleteShow(true);
    setIsActionDropdownOpen(false);
  };

  const handleConfirmInquiriesRadioButton = async (checkedOptions: any[]) => {
    let idsToUpdate: number | number[];

    if (selectedIds.length > 0) {
      idsToUpdate = selectedIds;
    } else if (statusAssignContactId !== undefined) {
      idsToUpdate = statusAssignContactId;
    } else {
      return;
    }

    await updateStageStatusForOrderRadioButton(
      idsToUpdate,
      checkedOptions,
      setRefreshCarts,
      setIsModalAssignStatusVisible,
    );

    setIsAllSelected(false);
    setSelectedIds([]);
  };

  const handleMultiApprove = async () => {
    try {
      const localId = await localStorage.getItem("UUID");

      setLoading(true);

      const response = await axiosInstance.post("updateOrder", {
        cart_id: selectedIds,
        a_application_login_id: localId,
        is_approve: 1,
        type: isOrderShowNum,
      });

      if (response.data.ack === 1) {
        toast.success(response.data.ack_msg || "Orders approved successfully");
        setIsMultiApproveConfirmation(false);
        setSelectedIds([]);
        setIsAllSelected(false);
        setRefreshCarts(true);
      } else {
        toast.error(response.data.ack_msg || "Failed to approve orders");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMultiConvert = (targetType: number) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one item");
      return;
    }
    if (targetType == 1) {
      setConvertToType(2);
    }
    if (targetType == 2) {
      setConvertToType(3);
    }
    if (targetType == 5) {
      setConvertToType(4);
    }
    if (targetType == 3) {
      setConvertToType(6);
    }
    if (targetType == 4) {
      setConvertToType(7);
    }
    if (targetType == 9) {
      setConversionType("invoice");

      setConvertToType(3);
    }
    if (targetType == 8) {
      setConvertToType(4);
    }

    const selectedItems = orderList.filter((item) =>
      selectedIds.includes(item.id),
    );
    const missingCartNumber = selectedItems.some((item) => !item.cart_number);

    if (missingCartNumber) {
      toast.error(
        "One or more selected items are in draft mode. Please approve them first.",
      );
      return;
    }

    setMultiConvertTarget(targetType);
    setIsMultiConvertConfirmation(true);
    setIsActionDropdownOpen(false);
  };

  const handleMultiConvertSubmit = async () => {
    setLoading(true);

    try {
      // ✅ Prepare bulk data with all selected items
      const selectedItems = orderList.filter((item) =>
        selectedIds.includes(item.id),
      );

      // Extract all IDs and cart_numbers
      const cartIds = selectedItems.map((item) => item.id);
      const cartNumbers = selectedItems.map((item) => item.cart_number || "");

      // ✅ Single function call with arrays
      switch (multiConvertTarget) {
        case 1: // Quotation → Order
          await handleConvertIntoOrder(
            cartIds, // [1190, 1191, 1192]
            cartNumbers, // ["CART-001", "CART-002", "CART-003"]
            () => { },
            () => { },
            () => { },
            () => { },
          );
          break;

        case 8: // Inward → Purchase Invoice
          await handleConvertIntoPurchaseInvoice(
            cartIds,
            cartNumbers,
            () => { },
            () => { },
            () => { },
            () => { },
          );
          break;
        case 9: // Dispatch → Sales Invoice
          await handleConvertIntoInvoice(
            cartIds,
            cartNumbers,
            () => { },
            () => { },
            setIsConversionSuccess,
            setNewlyCreatedCartId,
          );
          break;

        default:
          throw new Error("Invalid conversion type");
      }

      // Success message
      toast.success(`${selectedItems.length} item(s) converted successfully`);
      setRefreshCarts(true);
      setSelectedIds([]);
      setIsAllSelected(false);
    } catch (e) {
      console.error("Bulk conversion error:", e);
    } finally {
      setLoading(false);
      setIsMultiConvertConfirmation(false);
    }
  };

  const handleMultiPrint = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one item to print");
      return;
    }

    const permissionMap: Record<number, boolean> = {
      1: canAddQuo,
      2: canAddOrder,
      3: canAddInv,
      4: canAddPurchase,
      5: canAddPurchaseOrder,
      6: canAddReturnSalesInvoice,
      7: canAddReturnPurchaseInvoice,
    };

    if (!permissionMap[isOrderShowNum]) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    setLoading(true);
    setIsActionDropdownOpen(false);

    try {
      const baseURL = window.location.origin;
      const parser = new DOMParser();

      // Construct a single URL with comma-separated IDs
      const printUrl = `${baseURL}/OrderPrintViewV${dynamicViewFormate}/${selectedIds.join(
        ",",
      )}`;
      const printWindow = window.open(
        printUrl,
        "_blank",
        "width=1000,height=1000",
      );
      // const printWindow = window.open('', '_blank', 'width=1000,height=1000');
      // Same double-print-dialog risk as openPrint() above for a
      // pdfme-enabled type — window.open() first (popup-blocker safe),
      // decide whether to force-print after the async flag check. Note:
      // this URL joins multiple cart ids with a comma for bulk print —
      // OrderPrintView's own pdfme reroute was only built/verified for a
      // single id, so multi-select print against a pdfme-enabled company
      // isn't guaranteed to auto-print anything once skipped here.
      const skipExternalPrint = await isPdfmeEnabledForType(isOrderShowNum);
      if (printWindow && !skipExternalPrint) {
        printWindow.document.close();

        let isPrinted = false;
        printWindow.onload = () => {
          const checkContent = setInterval(() => {
            const contentElement =
              printWindow.document.querySelector("body > *");
            if (
              contentElement &&
              printWindow.document.readyState === "complete"
            ) {
              clearInterval(checkContent);
              if (!isPrinted && printSetting) {
                isPrinted = true;
                setTimeout(() => {
                  printWindow.print();
                }, 2000);
                printWindow.onafterprint = () => {
                  printWindow.close();
                };
                printWindow.addEventListener("afterprint", () => {
                  printWindow.close();
                });
              }
            }
          }, 100);
        };

        printWindow.addEventListener("beforeunload", () => {
          if (!isPrinted) {
            isPrinted = true;
          }
        });

        setTimeout(() => {
          if (!isPrinted) {
            printWindow.close();
          }
        }, 10000);
      } else if (!printWindow) {
        toast.error("Failed to open print window");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpenStatusAssign = (
    id?: number,
    cart_status?: number | undefined,
  ) => {
    if (canViewStatus) {
      if (id) {
        setStatusAssignContactId(id);
      }
      if (cart_status) {
        setStatusAssignStatusId(cart_status);
      }
      setIsModalAssignStatusVisible(true);
      setOrderDropdownOpen(null);
      setIsActionDropdownOpen(false);
    } else {
      setIsModalAssignStatusVisible(false);
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleStartWorkFlow = (showNum: number, orderId: number) => {
    if (canStartWorkFlow) {
      setIsShowConformationForStartWorkFlow(true);
      setWorkFlowShowId(showNum);
      setWorkFlowOrderId(orderId);
    } else {
      setIsShowConformationForStartWorkFlow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalApprove = () => {
    const permissionMap: Record<number, boolean> = {
      1: canAddQuo,
      2: canAddOrder,
      3: canAddInv,
      4: canAddPurchase,
      5: canAddPurchaseOrder,
      6: canAddReturnSalesInvoice,
      7: canAddReturnPurchaseInvoice,
    };

    if (permissionMap[isOrderShowNum]) {
      if (selectedIds.length === 0) {
        toast.error("Please select at least one item to approve");
        return;
      }
      setIsMultiApproveConfirmation(true);
      setIsActionDropdownOpen(false);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalOpenReminder = (id: number | undefined) => {
    if (canAddReminder) {
      setOrderId(id);
      setIsSetReminderConfirmation(true);

      setOrderDropdownOpen(null);
    } else {
      setIsSetReminderConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoOrder = (id: number, number: string) => {
    if (canAddOrder) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("order");
      setIsConvetIntoOrderConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvetIntoOrderConfirmation(false);
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoInvoice = (id: number, number: string) => {
    if (canAddInv) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("invoice");
      setIsConvertIntoInvoiceConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertIntoInvoiceConfirmation(false);
    setIsConvertIntoProformaConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoProforma = (id: number, number: string) => {
    if (canAddProforma) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("proforma");
      setIsConvertIntoProformaConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertIntoProformaConfirmation(false);
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalConvertDispatchIntoInvoice = (
    id: number,
    number: string,
  ) => {
    if (canAddInv) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("invoice");
      setIsConvertIntoInvoiceConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertIntoInvoiceConfirmation(false);
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoDisPatch = (id: number, number: string) => {
    if (canAddDispatch) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setIsConvertIntoDisPatchConfirmation(true);
      setOrderDropdownOpen(null);
      setConversionType("dispatch");
    } else {
      setIsConvertIntoDisPatchConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoInward = (id: number, number: string) => {
    if (canAddInward) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("Inward");
      setIsConvertIntoInwardConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertIntoInwardConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalConvertIntoPurchaseInvoice = (
    id: number,
    number: string,
  ) => {
    if (canAddPurchaseOrder) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("purchaseInvoice");
      setIsConvertPurchaseIntoInvoiceConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertPurchaseIntoInvoiceConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConverInwardtIntoPurchaseInvoice = (
    id: number,
    number: string,
  ) => {
    if (canAddPurchaseOrder) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("purchaseInvoice");
      setIsConvertPurchaseIntoInvoiceConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertPurchaseIntoInvoiceConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalConvertIntoReturnSalesInoice = (
    id: number,
    number: string,
  ) => {
    if (canAddReturnSalesInvoice) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("returnSalesInvoice");
      setIsConvertIntoReturnSalesInvoiceConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertIntoReturnSalesInvoiceConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleModalConvertIntoReturnPurchaseInoice = (
    id: number,
    number: string,
  ) => {
    if (canAddReturnPurchaseInvoice) {
      setConverCartId(id);
      setConvertCartNumber(number);
      setConversionType("returnPurchaseInvoice");
      setIsConvertIntoReturnPurchaseInvoiceConfirmation(true);
      setOrderDropdownOpen(null);
    } else {
      setIsConvertIntoReturnPurchaseInvoiceConfirmation(false);

      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (isConversionSuccess && isOrderShowNum === 1) {
      if (conversionType === "proforma") {
        setnewOrderShowNumAfterConversion(12);
        onConversionSuccess?.(12);
      } else if (conversionType === "invoice") {
        setnewOrderShowNumAfterConversion(3);
        onConversionSuccess?.(3);
      } else {
        setnewOrderShowNumAfterConversion(2);
        onConversionSuccess?.(2);
      }
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 2 &&
      conversionType === "invoice"
    ) {
      setnewOrderShowNumAfterConversion(3);
      onConversionSuccess?.(3);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 3 &&
      conversionType === "returnSalesInvoice"
    ) {
      setnewOrderShowNumAfterConversion(6);
      onConversionSuccess?.(6);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 4 &&
      conversionType === "returnPurchaseInvoice"
    ) {
      setnewOrderShowNumAfterConversion(7);
      onConversionSuccess?.(7);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 5 &&
      conversionType === "purchaseInvoice"
    ) {
      setnewOrderShowNumAfterConversion(4);
      onConversionSuccess?.(4);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 2 &&
      conversionType === "dispatch"
    ) {
      setnewOrderShowNumAfterConversion(9);
      onConversionSuccess?.(9);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 5 &&
      conversionType === "Inward"
    ) {
      setnewOrderShowNumAfterConversion(8);
      onConversionSuccess?.(8);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 9 &&
      conversionType === "invoice"
    ) {
      setnewOrderShowNumAfterConversion(3);
      onConversionSuccess?.(3);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 8 &&
      conversionType === "purchaseInvoice"
    ) {
      setnewOrderShowNumAfterConversion(4);
      onConversionSuccess?.(4);
    } else if (
      isConversionSuccess &&
      isOrderShowNum === 12 &&
      conversionType === "invoice"
    ) {
      setnewOrderShowNumAfterConversion(3);
      onConversionSuccess?.(3);
    }
  }, [isConversionSuccess]);

  useEffect(() => {
    if (
      isConversionSuccess &&
      newOrderShowNumAfterConversion &&
      newlyCreatedCartId
    ) {
      fetchOrderByIdApi(
        newlyCreatedCartId,
        setLoading,
        setOrderById,
        setIsOrderShowNum1,
      );

      setIsEditOrderShow(true);
      setIsConversionSuccess(false);
      setNewlyCreatedCartId(null);
    }
  }, [isConversionSuccess, newOrderShowNumAfterConversion, newlyCreatedCartId]);

  const handleModalMakeCopy = (id: number, cartType: number) => {
    const permissionMap: Record<number, boolean> = {
      1: canAddQuo,
      2: canAddOrder,
      3: canAddInv,
      4: canAddPurchase,
      5: canAddPurchaseOrder,
      6: canAddReturnSalesInvoice,
      12: canAddProfomaInvoice,
    };

    if (permissionMap[isOrderShowNum]) {
      setConverCartId(id);
      setIsMakeCartCopyConfirmation(true);
      setMakeCopyType(cartType);
      setOrderDropdownOpen(null);
    } else {
      setIsMakeCartCopyConfirmation(false);
      setOrderDropdownOpen(null);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 2 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      setSearchTimeout(
        setTimeout(() => {
          if (isOrderShowNum > 0) {
            fetchListOrderApi(
              0,
              ITEMS_PER_PAGE,
              setOrderList,
              setNoDataFound,
              setLoading,
              contactData.id,
              value,
              isOrderShowNum,
            );
          }
        }, 1000),
      );
    }
  };
  const findType =
    orderTypesSendList?.find((option) => Number(option.id) === isOrderShowNum)
      ?.type || "";
  const handleReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: any;
  }) => {
    if (
      data.dateTime.trim() &&
      data.remark.trim() &&
      data.selectedCategory !== null &&
      data.selectedCategory !== false
    ) {
      createReminderForCart(
        data,
        contactData?.id,
        orderId,
        setIsSetReminderConfirmation,
        findType,
        setRefreshCarts,
      );
    } else {
      toast.error("Please enter Date and Time, Remark, and Select Team Member");
      setIsSetReminderConfirmation(true);
    }
  };
  const handleChangeStatusOfReminder = (messageData: IOrder) => {
    if (canApproveReminder) {
      setIsReminderConfirmationStatus(true);
      setReminderData(messageData);
    } else {
      setIsReminderConfirmationStatus(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (orderList != undefined && orderList.length > 0) {
      if (isOrderShowNum == 1) {
        setDynamicViewFormate(orderList[0].quotation_view_formate || 1);
      } else if (isOrderShowNum == 2) {
        setDynamicViewFormate(orderList[0].order_view_formate || 1);
      } else if (isOrderShowNum == 3) {
        setDynamicViewFormate(orderList[0].invoice_view_formate || 1);
      } else if (isOrderShowNum == 4) {
        setDynamicViewFormate(orderList[0].purchase_view_formate || 1);
      } else if (isOrderShowNum == 5) {
        setDynamicViewFormate(orderList[0].purchase_order_view_formate || 1);
      } else {
        setDynamicViewFormate(1);
      }
    }
  }, [orderList]);

  useEffect(() => {
    setOrderDropdownOpen(null);
    setOrderId(undefined);
  }, [contactData?.id]);

  const handleModalPrint = (id: number) => {
    const permissionMap: Record<number, boolean> = {
      1: canAddQuo,
      2: canAddOrder,
      3: canAddInv,
      4: canAddPurchase,
    };

    if (permissionMap[isOrderShowNum]) {
      openPrint(id);
      setOrderDropdownOpen(null);
    } else {
      setOrderDropdownOpen(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  // For a pdfme-enabled Quotation/Sales Order, Print now generates the real
  // PDF and opens/prints it directly from here — same shape as Download
  // (check flag+template count first, open nothing until we know what to
  // generate), instead of navigating to OrderPrintView and waiting on its
  // own delayed auto-print effect to decide. Legacy (non-pdfme) types keep
  // the old open-then-force-print-the-on-screen-view behavior untouched.
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

  const generateAndPrintPdf = async (cartId: number, documentTemplateId?: number) => {
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
      if (pdfWindow) {
        pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setPrintLoading(false);
    }
  };

  const printWithTemplate = (templateId: number) => {
    setPrintTemplateChoices([]);
    if (pendingPrintCartId != null) generateAndPrintPdf(pendingPrintCartId, templateId);
    setPendingPrintCartId(null);
  };

  // All 10 cart-shaped doc types, one lookup instead of one near-identical
  // if-block per type — each entry is just {cart type number, the
  // company's view-format field name for that type's default print
  // layout}. isPdfmeSupportedCartType/PDFME_DOC_TYPE_BY_CART_TYPE
  // (orderPrintController.ts) is the actual source of truth for which
  // cart types pdfme is wired for; this table only needs to stay in sync
  // for the view-format field name per type.
  const PRINT_TYPE_CONFIG: Record<string, { cartTypeId: number; viewFormateKey: string }> = {
    "1": { cartTypeId: 1, viewFormateKey: "quotation_view_formate" },
    "2": { cartTypeId: 2, viewFormateKey: "order_view_formate" },
    "3": { cartTypeId: 3, viewFormateKey: "invoice_view_formate" },
    "4": { cartTypeId: 4, viewFormateKey: "purchase_view_formate" },
    "5": { cartTypeId: 5, viewFormateKey: "purchase_order_view_formate" },
    "6": { cartTypeId: 6, viewFormateKey: "return_sales_invoice_view_formate" },
    "7": { cartTypeId: 7, viewFormateKey: "return_purchase_invoice_view_formate" },
    "8": { cartTypeId: 8, viewFormateKey: "inward_view_formate" },
    "9": { cartTypeId: 9, viewFormateKey: "dispatch_view_formate" },
    "12": { cartTypeId: 12, viewFormateKey: "proforma_invoice_view_formate" },
  };

  const openPrint = async (id: number) => {
    const baseURL = window.location.origin;

    let printId;
    printId = orderTypesList?.find(
      (option) => Number(option.id) === isOrderShowNum,
    )?.id;
    const config = printId != null ? PRINT_TYPE_CONFIG[printId] : undefined;
    if (config) {
      const { cartTypeId, viewFormateKey } = config;
      const viewId = (orderList[0] as any)?.[viewFormateKey];
      const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

      // Check pdfme first, open nothing until we know what to do — same
      // shape as Download. Falls through to the legacy open-then-force-
      // print behavior for every non-pdfme type or when the flag is off.
      const pdfmeOn = await isPdfmeEnabledForType(cartTypeId);
      if (pdfmeOn) {
        setPrintLoading(true);
        const choices = await fetchPdfmeTemplatesForPicker(cartTypeId);
        setPrintLoading(false);
        if (choices.length > 1) {
          setPrintTemplateChoices(choices);
          setPendingPrintCartId(id);
        } else {
          generateAndPrintPdf(id);
        }
      } else {
        const myWindow = window.open(
          printUrl,
          "_blank",
          "width=1000,height=1000",
        );

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
                console.log("waiting...");
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
      }
    }

    setOrderDropdownOpen(null);
  };

  const openPendingPrintLegacy = (id: number, type: number) => {
    const baseURL = window.location.origin;
    window.open(`${baseURL}/PendingPrintViewV1/${id}/${type}`, "_blank");
  };

  const printWithPendingOrderTemplate = (templateId: number) => {
    setPendingOrderPrintChoices([]);
    if (pendingOrderPrintCartId != null) generateAndPrintPendingPdf(pendingOrderPrintCartId, templateId);
    setPendingOrderPrintCartId(null);
  };

  const openPendingPrint = async (id: number, type: number) => {
    const result = await tryPendingPdfmePrint(id, type);
    if (result.status === "picker") {
      setPendingOrderPrintChoices(result.choices);
      setPendingOrderPrintCartId(id);
      return;
    }
    if (result.status === "handled") return;
    openPendingPrintLegacy(id, type);
  };
  const openShippingAddressPrint = (id: number, type: number) => {
    const baseURL = window.location.origin;

    let printId;

    printId = orderTypesList?.find(
      (option) => Number(option.id) === isOrderShowNum,
    )?.id;
    // window.open(`${baseURL}/ShippingAddressPrint/${id}/${type}`, "_blank");
    const printUrl = `${baseURL}/ShippingAddressPrint/${id}/${type}`;
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
            console.log("waiting...");
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

  const [shippingLabelLoading, setShippingLabelLoading] = useState(false);
  const [shippingLabelTemplateChoices, setShippingLabelTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [pendingShippingLabelCart, setPendingShippingLabelCart] = useState<
    { cartId: number; cartType: number } | null
  >(null);

  const generateAndPrintShippingLabel = async (cartId: number, cartType: number, documentTemplateId?: number) => {
    setShippingLabelLoading(true);
    try {
      const resops = await axiosInstance.post("/shipping-label-pdf", {
        cart_id: cartId,
        cart_type: cartType,
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
      if (pdfWindow) {
        pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setShippingLabelLoading(false);
    }
  };

  const printWithShippingLabelTemplate = (templateId: number) => {
    setShippingLabelTemplateChoices([]);
    if (pendingShippingLabelCart) {
      generateAndPrintShippingLabel(pendingShippingLabelCart.cartId, pendingShippingLabelCart.cartType, templateId);
    }
    setPendingShippingLabelCart(null);
  };

  // pdfme path when document_designer is on (same flag/pattern openPrint()
  // uses for cart docs) — picker first when the company has 2+ shippingLabel
  // templates, same as quotation. Falls back to the legacy
  // ShippingAddressPrint React page entirely when the flag is off.
  const printShippingLabel = async (cartId: number, cartType: number) => {
    const companyMastersId = localStorage.getItem("COMPANY_ID");
    let pdfmeOn = false;
    if (companyMastersId) {
      try {
        const { data } = await axiosInstance.post("get-feature-flag", {
          company_masters_id: companyMastersId,
          feature_key: "document_designer",
        });
        pdfmeOn = data?.ack === 1 && !!data.data.item.is_enabled;
      } catch {
        pdfmeOn = false;
      }
    }

    if (!pdfmeOn) {
      openShippingAddressPrint(cartId, cartType);
      return;
    }

    const choices = await fetchTemplatesForDocType("shippingLabel");
    if (choices.length > 1) {
      setShippingLabelTemplateChoices(choices);
      setPendingShippingLabelCart({ cartId, cartType });
      return;
    }

    generateAndPrintShippingLabel(cartId, cartType);
  };

  let printId;
  printId =
    orderTypesList?.find((option) => Number(option.id) === isOrderShowNum)
      ?.id || "";

  let dynamicStartWorkflow;
  let dynamicName: any;
  let dynamicOrder: string;
  let dynamicdisPatch: string;
  let dynamicInward: string;
  let dynamicInvoice: string;
  let dynamicReturnSalesInvoice: string;
  let dynamicPurchaseOrder: string;
  let dynamicPurchaseInvoice: string;
  let dynamicQuotation: string;
  let dynamicReturnPurchaseInvoice: string;
  let dynamicProformaInvoice: string;

  dynamicQuotation = dynamicTitle?.quotation_title || "Quotation";
  dynamicOrder = dynamicTitle?.order_title || "Sales Order";
  dynamicdisPatch = dynamicTitle?.dispatch_title || "Dispatch";
  dynamicInward = dynamicTitle?.inward_title || "Goods Received Note (GRN)";
  dynamicInvoice = dynamicTitle?.invoice_title || "Sales Invoice";
  dynamicReturnSalesInvoice =
    dynamicTitle?.return_invoice_title || "Return Sales Invoice";
  dynamicPurchaseOrder = dynamicTitle?.purchase_order_title || "Purchase Order";
  dynamicPurchaseInvoice = dynamicTitle?.purchase_title || "Purchase Invoice";
  dynamicReturnPurchaseInvoice =
    dynamicTitle?.return_purchase_invoice || "Return Purchase Invoice";
  dynamicProformaInvoice =
    dynamicTitle?.proforma_invoice_title || "Proforma Invoice";
  if (printId == "1") {
    dynamicName = dynamicTitle?.quotation_title || "Quotation";
    dynamicStartWorkflow = 5;
  }
  if (printId == "2") {
    dynamicName = dynamicTitle?.order_title || "Sales Order";
    dynamicStartWorkflow = 6;
  }
  if (printId == "3") {
    dynamicName = dynamicTitle?.invoice_title || "Sales Invoice";
    dynamicStartWorkflow = 7;
  }
  if (printId == "4") {
    dynamicName = dynamicTitle?.purchase_title || "Purchase Invoice";
    dynamicStartWorkflow = 10;
  }
  if (printId == "5") {
    dynamicName = dynamicTitle?.purchase_order_title || "Purchase Order";
    dynamicStartWorkflow = 9;
  }
  if (printId == "6") {
    dynamicName = dynamicTitle?.return_sales_invoice || "Return Sales Invoice";
    dynamicStartWorkflow = 8;
  }
  if (printId == "7") {
    dynamicName =
      dynamicTitle?.return_purchase_invoice || "Return Purchase Invoice";
    dynamicStartWorkflow = 11;
  }
  if (printId == "8") {
    dynamicName = dynamicTitle?.inward_title || "Goods Received Note";
    dynamicStartWorkflow = 12;
  }
  if (printId == "9") {
    dynamicName = dynamicTitle?.dispatch_title || "Dispatch";
    dynamicStartWorkflow = 13;
  }
  if (printId == "12") {
    dynamicName = dynamicTitle?.proforma_invoice_title || "Proforma Invoice";
    dynamicStartWorkflow = 14;
  }

  const openModelCart = () => {
    // if (isOrderShowNum == 9 || isOrderShowNum == 8) {
    //   toast.error(
    //     `This ${dynamicName} cannot be created directly. Please convert it from an order.`,
    //   );
    //   return;
    // }
    const findTypeCart =
      Number(
        orderTypesList?.find((option) => Number(option.id) === isOrderShowNum)
          ?.id,
      ) || 0;

    const permissionMap: Record<number, boolean> = {
      1: canAddQuo,
      2: canAddOrder,
      3: canAddInv,
      4: canAddPurchase,
      5: canAddPurchaseOrder,
      6: canAddReturnSalesInvoice,
      7: canAddReturnPurchaseInvoice,
      8: canAddInward,
      9: canAddDispatch,
      12: canAddProfomaInvoice,
    };

    if (permissionMap[findTypeCart]) {
      setIsOrderCreateShow(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openPrintSetting = () => {
    if (canViewPrintSetting) {
      if (isOrderShowNum && dynamicViewFormate) {
        fetchprintSetting(
          setPrintSetting,
          Number(PRINT_SETTING_TYPE_OBJ[String(isOrderShowNum) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
          Number(dynamicViewFormate),
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
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<any[]>([]);

  const [isOpenTaskCreateModel, setIsOpenTaskCreateModel] = useState(false);
  const [taskData, setTaskData] = useState<{
    orderId?: number;
    taskTitle?: string;
    contactId?: number;
    referenceTable?: string;
  }>({});
  const showTask = (item: IOrder) => {
    if (canAddTask) {
      setIsOpenTaskCreateModel(true);
      const findType =
        orderTypesSendList?.find(
          (option) => Number(option.id) === isOrderShowNum,
        )?.type || "";
      setTaskData({
        orderId: item.id,
        taskTitle: item.cart_number || "Task for Order",
        contactId: contactData?.id,
        referenceTable: `cart_${findType}`,
      });
      setOrderDropdownOpen(null);
    } else {
      setOrderDropdownOpen(null);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  function openStageAndStatusLog(item: IOrder) {
    const findType =
      orderTypesSendList?.find((option) => Number(option.id) === isOrderShowNum)
        ?.type || "";
    setStageAndStatusData({
      orderId: item.id,
      contactId: contactData?.id,
      referenceTable: `carts`,
      tableType: `cart_${findType}`,
    });
    setIsStageAndStatusModalOpen(true);
  }

  const handleConversionModalHide = () => {
    setIsConvetIntoOrderConfirmation(false);
    setIsConvertIntoInvoiceConfirmation(false);
    setIsConvertPurchaseIntoInvoiceConfirmation(false);
    setIsConvertIntoReturnSalesInvoiceConfirmation(false);
    setIsConvertIntoReturnPurchaseInvoiceConfirmation(false);
    setIsConvertIntoDisPatchConfirmation(false);
    setIsConvertIntoInwardConfirmation(false);
    setConverCartId(0);
    setConvertCartNumber("");
    setIsConversionSuccess(false);
    setNewlyCreatedCartId(undefined);
    setnewOrderShowNumAfterConversion(undefined);
  };
  const handleEditHide = () => {
    setIsEditOrderShow(false);
    setConverCartId(0);
    setConvertCartNumber("");
    setIsConversionSuccess(false);
    setNewlyCreatedCartId(undefined);
    setnewOrderShowNumAfterConversion(undefined);
  };

  const handelSyncMiracleInvoice = (item: any) => {
    syncMiracleInvoice(item, setSyncLoading);
  };

  const handleSendWhatsAppCloud = (item: any) => {
    whatsappTemplateCloudeSend(
      {
        orderId: item.id,
        appId: localStorage.getItem("UUID"),
      },
      `carts_${isOrderShowNum}`,
      {
        customer_mobile_number: String(
          item.to_customer_phone,
        ),
      },
      undefined,
      setIsWhatsAppCloudLoading
    );
  }

  return (
    <>
      {isListOrder ? (
        <>
          <div className="leftSide " id="search-message">
            <div className="header-Chat d-flex justify-content-evenly position-relative">
              <div className="ICON w-5 position-absolute start-0">
                <button className="icons" onClick={closeListOrder}>
                  <span className="text-white" title="Close">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
                    </svg>
                  </span>
                </button>
              </div>

              <div
                className="newText"
                style={{
                  width: "fit-content",
                  position: "absolute",
                  left: "30px",
                }}
              >
                <h2>
                  {dynamicName}
                  {/* {orderTypesList?.find(
                    (option) => Number(option.id) === isOrderShowNum
                  )?.type || ""} */}
                  &nbsp; List
                </h2>
              </div>
              <div className="w-30 text-end position-absolute end-0">
                {dynamicViewFormate != 5 && (
                  <>
                    <button
                      className="icons"
                      onClick={openPrintSetting}
                      style={{ paddingInline: "2px" }}
                    >
                      <span className="text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="26px"
                          viewBox="0 -960 960 960"
                          width="26px"
                          fill="currentColor"
                        >
                          <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                        </svg>
                      </span>
                    </button>
                  </>
                )}

                {/* {isOrderShowNum != 9 || isOrderShowNum != 8 && ( */}
                <>
                  <button
                    className="icons "
                    onClick={openModelCart}
                    style={{ paddingInline: "2px" }}
                  >
                    <span className="text-white">
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
                </>
                {/* )} */}

                <button
                  className="icons pP "
                  style={{ marginBottom: "50px", paddingInline: "2px" }}
                  onClick={handelRefreshOrder}
                >
                  <span className="text-white" title="Refresh">
                    <svg width="30" height="30" viewBox="0 0 50 50">
                      <path
                        fill="currentColor"
                        d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                      />
                      <path
                        fill="currentColor"
                        d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                      />
                      <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                      <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
            <div className="search-bar">
              <div>
                <button className="search">
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
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>

                <input
                  type="text"
                  title="Search"
                  aria-label="Search or start new chat"
                  placeholder="Search"
                  maxLength={SMALL_TEXT_LENGTH}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <span
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: hover ? "#111827" : "#9ca3af",
                    }}
                    onClick={() => setSearchTerm("")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1">
              {selectedIds.length > 0 && (
                <span
                  className="selected-btn rounded-5"
                  style={{
                    width: "fit-content",
                    height: "fit-content",
                    paddingTop: "0.375rem",
                    paddingBottom: "0.375rem",
                    paddingLeft: "0.75rem",
                    paddingRight: "0.75rem",
                    marginLeft: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    className="custom-checkbox mx-1"
                    checked={isAllSelected}
                    title="Select All"
                    onChange={() => {
                      const newSelected = isAllSelected
                        ? []
                        : orderList.map((u) => u.id);
                      setSelectedIds(newSelected);
                      setIsAllSelected(!isAllSelected);
                    }}
                  />
                  <div
                    className="position-relative d-inline-block ms-1 dropdown-end"
                    ref={actionDropdownWrapperRef}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      ref={actionDropdownButtonRef}
                      className="border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderDropdownOpen(null);
                        setIsActionDropdownOpen((prev) => !prev);
                      }}
                      disabled={selectedIds.length === 0}
                    >
                      <span className="contact-btn-search-text">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 19 20"
                          width="22px"
                          height="22px"
                          className="hide animate__animated animate__fadeInUp"
                        >
                          <path
                            fill="currentColor"
                            d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                          ></path>
                        </svg>
                      </span>
                    </button>
                    {isActionDropdownOpen && (
                      <ul
                        className="labelDropLeft isVisible"
                        ref={actionDropdownRef}
                        style={{
                          position: "absolute",
                          left: -40,
                          minWidth: "220px",
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "5px",
                          zIndex: "1000",
                          overflowY: "auto",
                          height: "auto",
                          maxHeight: "30vh",
                        }}
                      >
                        {/* <li
                          className="listItem"
                          role="button"
                          onClick={() => {
                            handelChangeOrderDelete();
                            setIsActionDropdownOpen(false);
                          }}
                        >
                          <span>
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                            </svg>
                          </span>{" "}
                          Delete Selected
                        </li> */}
                        <li
                          className="listItem"
                          role="button"
                          onClick={() => {
                            handleModalOpenStatusAssign();
                            setIsActionDropdownOpen(false);
                          }}
                        >
                          <span>
                            <svg
                              height="15"
                              viewBox="0 -960 960 960"
                              width="15"
                              fill="currentColor"
                            >
                              <path d="M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm40-80h200v-80H200v80Zm382-80 198-198-57-57-141 142-57-57-56 57 113 113Zm-382-80h200v-80H200v80Zm0-160h200v-80H200v80Zm-40 400v-560 560Z"></path>
                            </svg>
                          </span>{" "}
                          Change Status
                        </li>
                        <li
                          className="listItem"
                          role="button"
                          onClick={() => {
                            handleModalApprove();
                            setIsActionDropdownOpen(false);
                          }}
                        >
                          <span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="15px"
                              viewBox="0 -960 960 960"
                              width="15px"
                              fill="currentColor"
                            >
                              <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                            </svg>
                          </span>{" "}
                          multi approve
                        </li>
                        <li
                          className="listItem"
                          role="button"
                          onClick={() => {
                            toast.error(DEFAULT_MESSAGE_FOR_UNDER_DEVELOPMENT);

                            // handleMultiPrint();
                            // setIsActionDropdownOpen(false);
                          }}
                        >
                          <span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="15px"
                              viewBox="0 -960 960 960"
                              width="15px"
                              fill="currentColor"
                            >
                              <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h640q51 0 85.5 34.5T960-520v240H800v160Zm80-240v-160q0-17-11.5-28.5T760-540H200q-17 0-28.5 11.5T160-500v160h80v-80h480v80h80Z" />
                            </svg>
                          </span>{" "}
                          multi Print
                        </li>
                        {isOrderShowNum === 1 && canAddOrder && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => handleMultiConvert(1)}
                          >
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                              >
                                <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                              </svg>
                            </span>{" "}
                            multi Convert to {dynamicOrder}
                          </li>
                        )}

                        {/* {isOrderShowNum === 2 && canAddInv && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => handleMultiConvert(2)}
                          >
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                              >
                                <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                              </svg>
                            </span>{" "}
                            multi Convert to {dynamicInvoice}
                          </li>
                        )} */}

                        {isOrderShowNum === 5 && canAddPurchase && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => handleMultiConvert(3)}
                          >
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                              >
                                <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                              </svg>
                            </span>{" "}
                            multi Convert to {dynamicPurchaseInvoice}
                          </li>
                        )}
                        {isOrderShowNum === 8 && canAddPurchase && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => handleMultiConvert(8)}
                          >
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                              >
                                <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                              </svg>
                            </span>{" "}
                            multi Convert to {dynamicPurchaseInvoice}
                          </li>
                        )}

                        {isOrderShowNum === 3 && canAddReturnSalesInvoice && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => handleMultiConvert(4)}
                          >
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                              >
                                <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                              </svg>
                            </span>{" "}
                            multi Convert to {dynamicReturnSalesInvoice}
                          </li>
                        )}

                        {isOrderShowNum === 4 &&
                          canAddReturnPurchaseInvoice && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() => handleMultiConvert(5)}
                            >
                              <span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="15px"
                                  viewBox="0 -960 960 960"
                                  width="15px"
                                  fill="currentColor"
                                >
                                  <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                                </svg>
                              </span>{" "}
                              multi Convert to {dynamicReturnPurchaseInvoice}
                            </li>
                          )}
                        {isOrderShowNum === 9 && canAddInv && (
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => handleMultiConvert(9)}
                          >
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="15px"
                                viewBox="0 -960 960 960"
                                width="15px"
                                fill="currentColor"
                              >
                                <path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM80-80v-80h102q-48-23-77.5-68T75-330q0-79 55.5-134.5T265-520v80q-45 0-77.5 32T155-330q0 39 24 69t61 38v-97h80v240H80Zm320-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z" />
                              </svg>
                            </span>{" "}
                            multi Convert to {dynamicInvoice}
                          </li>
                        )}

                        <li
                          className="listItem"
                          role="button"
                          onClick={() => {
                            toast.error(DEFAULT_MESSAGE_FOR_UNDER_DEVELOPMENT);
                          }}
                        >
                          <span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="15px"
                              viewBox="0 -960 960 960"
                              width="15px"
                              fill="currentColor"
                            >
                              <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h640q51 0 85.5 34.5T960-520v240H800v160Zm80-240v-160q0-17-11.5-28.5T760-540H200q-17 0-28.5 11.5T160-500v160h80v-80h480v80h80Z" />
                            </svg>
                          </span>{" "}
                          multi Download
                        </li>
                        <li
                          className="listItem"
                          role="button"
                          onClick={handelChangeMultiDelete}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="currentColor"><path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z" /></svg>{" "}
                          multi Delete
                        </li>
                      </ul>
                    )}
                  </div>
                </span>
              )}
            </div>

            <div
              className="chats"
              style={{
                height: "calc(100vh -  277px)",
                maxHeight: "calc(100vh- 277px)",
                minHeight: "300px",
                overflow: "auto",
                overflowX: "hidden",
              }}
              ref={listInnerRef}
            >
              <>
                {loading
                  ? Array.from({ length: 12 }).map((_, index) => (
                    <button key={index} className="block chat-list">
                      <div className="h-text">
                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </h4>
                          <h4 className="text-end">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={30}
                              height={10}
                            />
                          </h4>
                        </div>

                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              width={100}
                              style={{
                                opacity: darkMode ? "" : 0.5,
                                marginLeft: "10px",
                              }}
                            />
                          </h4>
                          <p className="time">
                            <Skeleton
                              width={80}
                              style={{ opacity: darkMode ? "" : 0.5 }}
                              height={10}
                            />
                          </p>
                        </div>
                        <button className="icon-more float-end">
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={30}
                          />
                        </button>
                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </h4>
                        </div>
                        <div className="head">
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </div>

                        <div className="">
                          <label className="float-start inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </label>
                          <br />
                          <p className=" d-flex justify-content-between text-break text-start inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                            <div className="">
                              <span className="badge rounded-pill">
                                <Skeleton
                                  style={{
                                    marginLeft: "10px",
                                    opacity: darkMode ? "" : 0.5,
                                  }}
                                  width={40}
                                />
                              </span>
                            </div>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                  : orderList &&
                  orderList.map((item, index) => (
                    <>
                      <div
                        key={item.id}
                        onMouseEnter={(e) => {
                          if (selectedIds.length === 0 && !isAllSelected) {
                            const checkbox: any =
                              e.currentTarget.querySelector(
                                ".checkbox-wrapper",
                              );
                            if (checkbox) {
                              setIsCheckboxesVisible(true);
                            }
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedIds.length === 0 && !isAllSelected) {
                            const checkbox: any =
                              e.currentTarget.querySelector(
                                ".checkbox-wrapper",
                              );
                            if (checkbox) {
                              setIsCheckboxesVisible(false);
                            }
                          }
                        }}
                      >
                        <ul
                          ref={(el) => (dropdownRef.current[item.id] = el)}
                          className={`labelDropLeft ${orderId === item.id && orderDropdownOpen
                            ? "isVisible"
                            : "isHidden"
                            }`}
                          style={{ width: "160px" }}
                        >
                          <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderDropdownOpen(null);
                              handelChangeEdit(
                                item.id,
                                item.cart_number,
                                item.type,
                              );
                            }}
                          >
                            {(item.cart_number &&
                              (item.type === 1 ||
                                item.type === 2 ||
                                item.type === 3 ||
                                item.type === 12 ||
                                item.type === 5)) ||
                              !item.cart_number
                              ? "Edit/View"
                              : "View"}
                          </li>
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => {
                              if (!printLoading) openPrint(item.id);
                            }}
                          >
                            {printLoading ? "Preparing..." : "Print"}
                          </li>
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => {
                              const permissionMap: Record<number, boolean> = {
                                1: canPdfQuo,
                                2: canPdfOrder,
                                3: canPdfInv,
                                4: canPdfPurchase,
                                5: canPdfPurchaseOrder,
                                6: canPdfReturnSalesInvoice,
                                7: canPdfReturnPurchaseInvoice,
                                8: canPdfInWard,
                                9: canPdfDispatch,
                                12: canPdfProfomaInovice,
                              };
                              if (!refreshDownload) {
                                if (permissionMap[isOrderShowNum]) {
                                  downloadWithPicker(item.id);
                                } else {
                                  setOrderDropdownOpen(null);

                                  toast.error(
                                    DEFAULT_MESSAGE_ERROR_PERMISSION,
                                  );
                                }
                              }
                            }}
                          >
                            {refreshDownload
                              ? "Downloading..."
                              : "Download PDF"}
                          </li>
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => {
                              const permissionMap: Record<number, boolean> = {
                                1: canPdfQuo,
                                2: canPdfOrder,
                                3: canPdfInv,
                                4: canPdfPurchase,
                                5: canPdfPurchaseOrder,
                                6: canPdfReturnSalesInvoice,
                                7: canPdfReturnPurchaseInvoice,
                                8: canPdfInWard,
                                9: canPdfDispatch,
                                12: canPdfProfomaInovice,
                              };
                              if (!isPDFSendingToWhatsApp) {
                                if (permissionMap[isOrderShowNum]) {
                                  if (platformType == 1) {
                                    handleSendWhatsApp(item.id);
                                  } else if (platformType == 2) {
                                    handleSendWhatsAppCloud(item);
                                  }
                                } else {
                                  setOrderDropdownOpen(null);

                                  toast.error(
                                    DEFAULT_MESSAGE_ERROR_PERMISSION,
                                  );
                                }
                              }
                            }}
                            style={{ color: "#3baf4f", fontWeight: "600" }}
                          >
                            {isPDFSendingToWhatsApp || isWhatsAppCloudLoading
                              ? "Sending..."
                              : "Send to WhatsApp"}
                          </li>
                          <li
                            className="listItem"
                            role="button"
                            onClick={() =>
                              handleStartWorkFlow(isOrderShowNum, item.id)
                            }
                            style={{ color: "#0992f3", fontWeight: "600" }}
                          >
                            Start WorkFlow
                          </li>
                          <li
                            className="listItem"
                            role="button"
                            onClick={() =>
                              handleModalOpenStatusAssign(
                                item.id,
                                item.cart_status,
                              )
                            }
                          >
                            Assign Status
                          </li>
                          {item.is_reminder ? (
                            <span></span>
                          ) : (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() => handleModalOpenReminder(item.id)}
                            >
                              Reminder
                            </li>
                          )}
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => showTask(item)}
                          >
                            Add Task
                          </li>
                          <li
                            className="listItem"
                            role="button"
                            onClick={() => openStageAndStatusLog(item)}
                          >
                            Timeline
                          </li>
                          {item.type === 1 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoOrder(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicOrder}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 1 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoProforma(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicProformaInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 1 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoInvoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 2 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoDisPatch(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicdisPatch}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 2 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoInvoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 12 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoInvoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 9 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertDispatchIntoInvoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 5 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoInward(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicInward}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 5 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoPurchaseInvoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicPurchaseInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 8 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConverInwardtIntoPurchaseInvoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicPurchaseInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 3 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoReturnSalesInoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicReturnSalesInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 4 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalConvertIntoReturnPurchaseInoice(
                                  item.id,
                                  item.cart_number,
                                )
                              }
                            >
                              Convert to {dynamicReturnPurchaseInvoice}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 5 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                openPendingPrint(item.id, item.type)
                              }
                            >
                              Pending {dynamicPurchaseOrder} Print
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 2 && item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                openPendingPrint(item.id, item.type)
                              }
                            >
                              Pending {dynamicOrder} Print
                            </li>
                          ) : (
                            <span></span>
                          )}

                          {isFeatureEnabled &&
                            (item.type === 3 ||
                              item.type === 4 ||
                              item.type === 2 ||
                              item.type === 5 ||
                              item.type === 6 ||
                              item.type === 7 ||
                              item.type === 1 ||
                              item.type === 9 ||
                              item.type === 8) &&
                            item.cart_number ? (
                            <li
                              style={{
                                height: "auto",
                                color: syncLoading ? "#E21F26" : "",
                              }}
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handelSyncMiracleInvoice(item.id)
                              }
                            >
                              {syncLoading ? "Syncing.." : "Sync Miracle"}
                            </li>
                          ) : (
                            <span></span>
                          )}

                          {(item.type === 9 || item.type === 3) &&
                            item.cart_number ? (
                            <li
                              style={{ height: "auto" }}
                              className="listItem"
                              role="button"
                              onClick={() => {
                                if (!shippingLabelLoading) printShippingLabel(item.id, item.type);
                              }}
                            >
                              {shippingLabelLoading ? "Preparing..." : "Shipping Label Print"}
                            </li>
                          ) : (
                            <span></span>
                          )}
                          {item.type === 1 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          {item.type === 2 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          {item.type === 3 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          {item.type === 4 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          {item.type === 5 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          {item.type === 6 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          {item.type === 12 && item.cart_number && (
                            <li
                              className="listItem"
                              role="button"
                              onClick={() =>
                                handleModalMakeCopy?.(item.id, item.type)
                              }
                            >
                              Create New Copy
                            </li>
                          )}
                          <li
                            style={{ color: "red", fontWeight: "600" }}
                            className="listItem"
                            role="button"
                            onClick={() => handelChangeOrderDelete(item.id)}
                          >
                            Delete
                          </li>
                        </ul>
                      </div>
                      <button
                        key={index}
                        className="block chat-list"
                        onMouseEnter={(e) => {
                          if (selectedIds.length === 0 && !isAllSelected) {
                            setIsCheckboxesVisible(true);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedIds.length === 0 && !isAllSelected) {
                            setIsCheckboxesVisible(false);
                          }
                        }}
                      >
                        <div className="h-text">
                          <div className="head">
                            <div
                              className="checkbox-wrapper"
                              style={{
                                position: "absolute",
                                left: -10,
                                top: 0,
                                visibility:
                                  checkboxesVisible ||
                                    selectedIds.length > 0 ||
                                    isAllSelected
                                    ? "visible"
                                    : "hidden",
                                zIndex: 10,
                              }}
                            >
                              <input
                                type="checkbox"
                                className="custom-checkbox mb-1"
                                checked={selectedIds.includes(item.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const updated = e.target.checked
                                    ? [...selectedIds, item.id]
                                    : selectedIds.filter(
                                      (id: any) => id !== item.id,
                                    );
                                  setSelectedIds(updated);
                                  setIsAllSelected(
                                    updated.length === orderList.length,
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <h4 className="order-text-big-front">
                              <b>
                                #
                                {item.cart_number
                                  ? item.cart_number
                                  : "XXXXXXX"}
                              </b>
                            </h4>
                            {item.cart_number ? (
                              <h4
                                style={{
                                  backgroundColor: "#06cf9c ",
                                  border: "2px solid #06cf9c",
                                  color: "black",
                                }}
                                className="inquiry-front badge rounded-pill"
                              >
                                Approved
                              </h4>
                            ) : (
                              <h4
                                style={{
                                  backgroundColor: "#eeeeee ",
                                  border: "2px solid rgb(207, 207, 207)",
                                  color: "black",
                                }}
                                className="inquiry-front badge rounded-pill"
                              >
                                Draft
                              </h4>
                            )}
                          </div>
                          <div className="float-end">
                            {item.is_reminder ? (
                              <span
                                role="button"
                                onClick={() =>
                                  handleChangeStatusOfReminder(item)
                                }
                              >
                                <svg
                                  height="16px"
                                  viewBox="0 -960 960 960"
                                  width="16 px"
                                  className=""
                                  fill="currentColor"
                                >
                                  <path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" />
                                </svg>
                              </span>
                            ) : (
                              <span></span>
                            )}
                          </div>
                          <div className="head">
                            <h4
                              className="inquiry-front"
                              style={{
                                wordBreak: "break-word",
                                maxWidth: "200px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              <b>Customer Name</b> :
                              {item.to_customer_name
                                ? item.to_customer_name
                                : ""}
                            </h4>
                          </div>
                          <button
                            className="icon-more float-end"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdownOrder(item.id);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 19 20"
                              width="19"
                              height="20"
                              className="hide animate__animated animate__fadeInUp"
                            >
                              <path
                                fill="currentColor"
                                d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                              ></path>
                            </svg>
                          </button>
                          <div className="head">
                            <h4 className="inquiry-front">
                              <b>Contact Number </b> :
                              {item.to_customer_phone
                                ? item.to_customer_phone
                                : ""}
                            </h4>
                          </div>
                          <div className="head w-100">
                            {isOrderShowNum != 9 && isOrderShowNum != 8 && (
                              <>
                                <div>
                                  <h4 className="order-text-big-front">
                                    <b>
                                      {item.grand_total
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id === item.currency_id,
                                        )?.symbol || "₹"
                                        }  ` +
                                        formatNumber(item.grand_total, 2)
                                        : ""}
                                    </b>
                                  </h4>
                                </div>
                              </>
                            )}

                            <div className="">
                              <span
                                style={{
                                  backgroundColor: item.stage_status_color
                                    ? item.stage_status_color
                                    : "#eeeeee",
                                }}
                                className="badge rounded-pill"
                              >
                                {item.stage_status_name}
                              </span>
                            </div>
                          </div>
                          <div className="head">
                            {item.referance_cart_name !== "" ? (
                              <h4 className="inquiry-front">
                                <b>Ref. No. </b> : #
                                {item.referance_cart_name
                                  ? item.referance_cart_name
                                  : ""}
                              </h4>
                            ) : (
                              ""
                            )}
                          </div>

                          <div className="head">
                            <div>
                              <p className="time text-end">
                                {item.cart_number ? (
                                  <p className="d-flex items-center">
                                    <>
                                      <span>Approved By:</span>{" "}
                                      <span
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${MIN_WIDTH_FOR_TEXT}`,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                        }}
                                      >
                                        {item.approved_by}
                                      </span>
                                    </>
                                  </p>
                                ) : (
                                  <p></p>
                                )}

                                {item.due_date &&
                                  item.due_date != "0000-00-00" &&
                                  isOrderShowNum != 9 &&
                                  isOrderShowNum != 8 && (
                                    <p
                                      className="d-flex items-center"
                                      style={{ color: "red" }}
                                    >
                                      Due Date:{formatDate(item.due_date)}
                                    </p>
                                  )}

                                {!!item.transaction_mode && item.transaction_mode != "0" && (
                                  <p
                                    className="d-flex items-center"
                                    style={{ color: "red" }}
                                  >
                                    Transaction Mode:{" "}
                                    {
                                      TRANSACTION_MODE[
                                      String(item.transaction_mode)
                                      ]
                                    }
                                  </p>
                                )}

                                <p
                                  className="contact-text"
                                  style={{ textAlign: "start" }}
                                >
                                  {item.cart_number
                                    ? item.update_Date_time
                                      ? convertDateTimeFormat(
                                        item.update_Date_time,
                                      ).date
                                      : ""
                                    : ""}
                                </p>

                                <p
                                  className="contact-text"
                                  style={{ textAlign: "start" }}
                                >
                                  {item.cart_number
                                    ? item.update_Date_time
                                      ? convertDateTimeFormat(
                                        item.update_Date_time,
                                      ).time
                                      : ""
                                    : ""}
                                </p>
                              </p>
                            </div>
                            <p className="time text-end">
                              <p className="d-flex items-center">
                                <>
                                  <span>Created By:</span>{" "}
                                  <span
                                    style={{
                                      wordWrap: "break-word",
                                      width: `${MIN_WIDTH_FOR_TEXT}`,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      display: "inline-block",
                                    }}
                                  >
                                    {item.created_by}
                                  </span>
                                </>
                              </p>

                              <p className="contact-text">
                                {item.created_date_time
                                  ? convertDateTimeFormat(
                                    item.created_date_time,
                                  ).date
                                  : ""}
                              </p>
                              <p className="contact-text">
                                {item.created_date_time
                                  ? convertDateTimeFormat(
                                    item.created_date_time,
                                  ).time
                                  : ""}
                              </p>
                            </p>
                          </div>
                        </div>
                      </button>
                    </>
                  ))}
              </>
              {noDataFound && <p className="no_found">No data found</p>}
            </div>
          </div>
        </>
      ) : null}
      <OrderCreateModal
        show={isOrderCreateShow}
        onHide={() => setIsOrderCreateShow(false)}
        handleSubmit={createOrderSubmit}
        title={"Create"}
        message={`Please enter your  ${dynamicName}`}
        btn1={"CANCEL"}
        btn2={"Save & Approve"}
        Contact={contactData}
        isOrderShowNum={isOrderShowNum}
        companyDetail={companyDetail}
        isOrderViewFormate={dynamicViewFormate}
      />
      {isSetReminderConfirmation && (
        <ReminderModal
          show={isSetReminderConfirmation}
          onHide={() => setIsSetReminderConfirmation(false)}
          handleSubmit={handleReminder}
          title={` Set Reminder of 
                ${dynamicName}`}
          message={"Are you sure you want delete is message? "}
          btn1="CANCEL"
          btn2="set Reminder"
          request_flag="4"
        />
      )}

      <OrderCreateModal
        show={isEditOrderShow}
        onHide={handleEditHide}
        handleSubmit={updateOrderSubmit}
        title={editOrView}
        message={`Please enter your  ${dynamicName}`}
        btn1={"Close"}
        btn2={"Save & Approve"}
        Contact={contactData}
        isOrderShowNum={newOrderShowNumAfterConversion || isOrderShowNum}
        orderById={newlyCreatedCartId || orderById}
        companyDetail={companyDetail}
        isOrderViewFormate={dynamicViewFormate}
      />
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => setIsDeleteConfirmation(false)}
          handleSubmit={() =>
            handleDeleteOrder(
              selectedIds.length > 0 ? selectedIds : orderIdDelete,
              setIsDeleteConfirmation,
              setRefreshCarts,
              () => {
                setIsAllSelected(false);
                setSelectedIds([]);
              },
              isOrderShowNum,
            )
          }
          title={`Delete this ${dynamicName}`}
          message={`Are you sure you want to Delete this ${dynamicName}?`}
          btn1="CANCEL"
          btn2="Delete"
        />
      )}

      {isReminderConfirmationStatus && (
        <ConfirmationModal
          show={isReminderConfirmationStatus}
          onHide={() => setIsReminderConfirmationStatus(false)}
          handleSubmit={() =>
            handleChangeStatusOfReminderCompleted(
              reminderData?.id,
              setIsReminderConfirmationStatus,
              findType,
              setRefreshCarts,
            )
          }
          title={"Are you sure you want to complete this Reminder?"}
          message={`Remark : ${reminderData && reminderData.reminder_remark}`}
          btn1="CANCEL"
          btn2="Complete Reminder Now"
          message1={`Reminder Date : ${reminderData && formatDateAndTime(reminderData.reminder_data_time)
            }`}
        />
      )}
      {isConvertIntoProformaConfirmation && (
        <ConfirmationModal
          show={isConvertIntoProformaConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoProforma(
              converCartId,
              convertCartNumber,
              setIsConvertIntoProformaConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicProformaInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicQuotation} Into ${dynamicProformaInvoice}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvetIntoOrderConfirmation && (
        <ConfirmationModal
          show={isConvetIntoOrderConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoOrder(
              converCartId,
              convertCartNumber,
              setIsConvetIntoOrderConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicOrder}`}
          message={`Are you sure you want to Convert this ${dynamicQuotation} Into ${dynamicOrder}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoInvoiceConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoInvoice(
              converCartId,
              convertCartNumber,
              setIsConvertIntoInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicName} Into ${dynamicInvoice}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoDisPatchConfirmation && (
        <ConfirmationModal
          show={isConvertIntoDisPatchConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoDispath(
              converCartId,
              convertCartNumber,
              setIsConvertIntoDisPatchConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicdisPatch}`}
          message={`Are you sure you want to Convert this ${dynamicOrder} Into ${dynamicdisPatch}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoInwardConfirmation && (
        <ConfirmationModal
          show={isConvertIntoInwardConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoInward(
              converCartId,
              convertCartNumber,
              setIsConvertIntoInwardConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicInward}`}
          message={`Are you sure you want to Convert this ${dynamicPurchaseOrder} Into ${dynamicInward}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}

      {isConvertIntoPurchaseInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoPurchaseInvoiceConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoPurchaseInvoice(
              converCartId,
              convertCartNumber,
              setIsConvertPurchaseIntoInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicPurchaseInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicName} Into ${dynamicPurchaseInvoice}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoReturnSalesInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoReturnSalesInvoiceConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleModalConvertIntoReturnSalesInvoices(
              converCartId,
              convertCartNumber,
              setIsConvertIntoReturnSalesInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicReturnSalesInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicInvoice} Into ${dynamicReturnSalesInvoice}?`}
          btn1="CANCEL"
          btn2="Apply"
        />
      )}
      {isConvertIntoReturnPurchaseInvoiceConfirmation && (
        <ConfirmationModal
          show={isConvertIntoReturnPurchaseInvoiceConfirmation}
          onHide={handleConversionModalHide}
          handleSubmit={() =>
            handleConvertIntoReturnPurchaseInvoice(
              converCartId,
              convertCartNumber,
              setIsConvertIntoReturnPurchaseInvoiceConfirmation,
              setRefreshCarts,
              setIsConversionSuccess,
              setNewlyCreatedCartId,
            )
          }
          title={`Convert to ${dynamicReturnPurchaseInvoice}`}
          message={`Are you sure you want to Convert this ${dynamicPurchaseInvoice} Into ${dynamicReturnPurchaseInvoice}?`}
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
          title={`Create New Copy Of ${dynamicName}`}
          message={`Are you sure you want to Create New Copy Of ${dynamicName}?`}
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
            if (isOrderShowNum && dynamicViewFormate) {
              fetchprintSetting(
                setPrintSetting,
                Number(PRINT_SETTING_TYPE_OBJ[String(isOrderShowNum) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
                Number(dynamicViewFormate),
              );
            } else {
              setIsPrintSettingShow(false);
            }
          }}
          orderType={Number(isOrderShowNum)}
          viewFormate={Number(dynamicViewFormate)}
          orderById={printSetting?.setting_details}
          titles={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
        />
      )}
      <RadioButtonModal
        show={isModalAssignStatusVisible}
        onHide={() => setIsModalAssignStatusVisible(false)}
        handleSubmit={handleConfirmInquiriesRadioButton}
        title={`Assign status to ${dynamicName}`}
        message={`Please select the Status for this ${dynamicName}.`}
        btn1="Cancel"
        btn2="Submit"
        options={optionRadioButtonStatus}
        selectedLabelIds={
          orderList.find((item) => item.id === statusAssignContactId)
            ?.cart_status
        }
        contactId={statusAssignContactId}
        getOptionColor={(option) => option.color || "#eeeeee"}
        getOptionName={(option) => option.name}
        showColorBadge={true}
      />

      {isOpenTaskCreateModel && (
        <CreateTaskView
          show={isOpenTaskCreateModel}
          onHide={() => {
            setIsOpenTaskCreateModel(false);
            setTaskData({});
          }}
          onTaskCreated={onRefreshMessages}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
          headerName={`Create Task of ${dynamicName}`}
          productToEdit={undefined}
          messageId={taskData.orderId}
          messageDescription={taskData.taskTitle}
          contactId={taskData.contactId}
          referenceTable={taskData.referenceTable}
          supportTicketFlag={0}
        />
      )}

      {isStageAndStatusModalOpen && (
        <EventLogs
          show={isStageAndStatusModalOpen}
          onHide={() => setIsStageAndStatusModalOpen(false)}
          contactId={stageAndStatusData?.contactId}
          reference_id={stageAndStatusData?.orderId}
          reference_table={stageAndStatusData?.referenceTable}
          requiredTabs={["status_timeline"]}
          table_type={stageAndStatusData?.tableType}
        />
      )}

      {isMultiApproveConfirmation && (
        <ConfirmationModal
          show={isMultiApproveConfirmation}
          onHide={() => setIsMultiApproveConfirmation(false)}
          handleSubmit={handleMultiApprove}
          title={`Approve Multiple ${dynamicName}`}
          message={`Are you sure you want to approve ${selectedIds.length} selected ${dynamicName}(s)?`}
          btn1="CANCEL"
          btn2="Approve All"
        />
      )}
      {isShowConformationForStartWorkFlow && (
        <WorkFlowModel
          show={isShowConformationForStartWorkFlow}
          onHide={() => setIsShowConformationForStartWorkFlow(false)}
          handleSubmit={() => setIsShowConformationForStartWorkFlow(false)}
          title={`Start WorkFlow For ${dynamicName}`}
          message={`Are you sure you want to Start WorkFlow for ${dynamicName}?`}
          showTaskTemplateFor={dynamicStartWorkflow}
          showOrderId={workFlowOrderId}
          setWorkFlowFor={"cart"}
          btn1="CANCEL"
          btn2="Start"
        />
      )}
      {isMultiConvertConfirmation && (
        <ConfirmationModal
          show={isMultiConvertConfirmation}
          onHide={() => setIsMultiConvertConfirmation(false)}
          handleSubmit={handleMultiConvertSubmit}
          title={`Convert ${selectedIds.length} Items`}
          message={`Are you sure you want to convert selected items to ${convertToType === 2
            ? dynamicOrder
            : convertToType === 3
              ? dynamicInvoice
              : convertToType === 4
                ? dynamicPurchaseInvoice
                : dynamicReturnPurchaseInvoice
            }?`}
          btn1="CANCEL"
          btn2="Convert All"
        />
      )}
      {isMultiDeleteShow && (
        <MultipleDeletePopUp
          show={isMultiDeleteShow}
          onHide={() => {
            setIsMultiDeleteShow(false);
            setDeleteTargetIds([]);
          }}
          onSuccess={() => {
            setRefreshCarts(true);
            setIsAllSelected(false);
            setSelectedIds([]);
          }}
          selectedIds={deleteTargetIds}
          cartType={isOrderShowNum}
          title={dynamicName}
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
                  setPendingDownloadCartId(null);
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
                    if (pendingDownloadCartId != null) handleDownload(pendingDownloadCartId, t.id);
                    setShowDownloadPicker(false);
                    setDownloadTemplateChoices([]);
                    setPendingDownloadCartId(null);
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
                onClick={() => {
                  setPrintTemplateChoices([]);
                  setPendingPrintCartId(null);
                }}
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
                  Print
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {pendingOrderPrintChoices.length > 0 && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Choose Template</h5>
              <span
                className="close"
                onClick={() => {
                  setPendingOrderPrintChoices([]);
                  setPendingOrderPrintCartId(null);
                }}
              >
                &times;
              </span>
            </div>
            {pendingOrderPrintChoices.map((t) => (
              <div
                key={t.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>{t.template_name}{t.is_default ? " ★" : ""}</div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => printWithPendingOrderTemplate(t.id)}
                >
                  Print
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {shippingLabelTemplateChoices.length > 0 && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Choose Template</h5>
              <span
                className="close"
                onClick={() => {
                  setShippingLabelTemplateChoices([]);
                  setPendingShippingLabelCart(null);
                }}
              >
                &times;
              </span>
            </div>
            {shippingLabelTemplateChoices.map((t) => (
              <div
                key={t.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>{t.template_name}{t.is_default ? " ★" : ""}</div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => printWithShippingLabelTemplate(t.id)}
                >
                  Print
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
    </>
  );
};

export default ListOrderView;
