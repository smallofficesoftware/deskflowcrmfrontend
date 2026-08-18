import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
    formatDateAndTime
} from "../../../common/SharedFunction";
import { useTheme } from "../../../components/ThemeContext";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import EventLogs from "../../../components/model/EventLogModel/EventLogsModel";
import OrderCreateModal from "../../../components/model/OrderCreateModel/OrderCreateModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import RadioButtonModal from "../../../components/model/RadioButtonModal";
import ReminderModal from "../../../components/model/ReminderModal";
import WorkFlowModel from "../../../components/model/workflowConformatioModel/workFlowModelView";
import { fetchPdfmeTemplatesForPicker } from "../../order-print-view/orderPrintController";
import {
    DEFAULT_MESSAGE_ERROR_PERMISSION,
    MESSAGE_UNKNOWN_ERROR_OCCURRED
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, PRINT_SETTING_TYPE_OBJ } from "../../../helpers/AppEnum";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import CreateTaskView from "../../../pages/right-side/create-task/CreateTaskView";
import {
    createReminderForCart,
    fetchListOrderApi,
    fetchOrderByIdApi,
    fetchStageStatusForOrderApi,
    handleChangeStatusOfReminderCompleted,
    handleConvertIntoDispath,
    handleConvertIntoInvoice,
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
    updateStageStatusForOrderRadioButton
} from "../../../pages/right-side/list-order/ListOrderController";
import { axiosInstance } from "../../../services/axiosInstance";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";
import {
    ModuleType,
    useSalesDependencyGuard,
} from "../../../store/sales/salesDependencyGuard";
import useWhatsappPlatformStore from "../../../store/whatsapp/useWhatsappPlateformFlagStore";
import {
    fetchprintSetting,
    IprintSetting,
} from "../../order-pdf-view/OrderPdfController";
import OrderActionDropdown from "./OrderActionDropdown";

interface IPropsListOrder {
    item: IOrder
    isListOrder?: boolean;
    closeListOrder?: () => void;
    contactData?: any;
    isOrderShowNum: ModuleType;
    dynamicTitle?: any;
    setRefreshChat?: (value: boolean | number) => void;
}
interface ICurrency {
    id: number;
    short_name: string;
    name: string;
    symbol: string;
}

const CommonOrderActions = ({
    item,
    isListOrder,
    closeListOrder,
    contactData,
    isOrderShowNum,
    dynamicTitle,
    setRefreshChat,
}: IPropsListOrder) => {
    const check = useSalesDependencyGuard((s) => s.check);
    const { platformType } = useWhatsappPlatformStore();

    const dropdownCreateOrderRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<Record<number, HTMLUListElement | null>>({});
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [dynamicViewFormate, setDynamicViewFormate] = useState(1);

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
    // §7 template picker — mirrors ListOrderView.tsx's downloadWithPicker.
    const [showDownloadPicker, setShowDownloadPicker] = useState(false);
    const [downloadTemplateChoices, setDownloadTemplateChoices] = useState<
        { id: number; template_name: string; is_default: number }[]
    >([]);
    const [pendingDownloadCartId, setPendingDownloadCartId] = useState<number | null>(null);
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
    const canAddProforma = useCheckUserPermission(
        PAGE_ID.PROFOMA_INVOICE,
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
    const canDelProformaInvoice = useCheckUserPermission(
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
    const canAddInward = useCheckUserPermission(
        PAGE_ID.INWARD,
        PERMISSION_TYPE.ADD,
    );
    const canAddDispatch = useCheckUserPermission(
        PAGE_ID.DISPATCH,
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
    useEffect(() => {
        // Load initial page
        setOrderList([]); // Clear existing list on initial load
        setCurrentPage(0); // Reset currentPage on initial load
        setNoDataFound(false); // Reset no data found
        fetchListOrderApi(
            0,
            0,
            (newItems) => setOrderList(newItems),
            setNoDataFound,
            setLoading,
            contactData.id,
            searchTerm,
            isOrderShowNum,
        );
    }, [contactData.id, isOrderShowNum, searchTerm]);

    useEffect(() => {
        if (isOrderShowNum > 0) {
            fetchListOrderApi(
                0,
                0,
                setOrderList,
                setNoDataFound,
                setLoading,
                contactData.id,
                searchTerm,
                isOrderShowNum,
            );
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
                0,
                setOrderList,
                setNoDataFound,
                setLoading,
                contactData.id,
                "",
                isOrderShowNum,
            );;

            setRefreshCarts(false);
        }
    }, [refreshCarts]);
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



    // useEffect(() => {
    //     if (contactData?.id) {
    //         closeListOrder();
    //         setSearchTerm("");
    //     } else {
    //         return undefined;
    //     }
    // }, [contactData?.id]);

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
            (cartNumber && (type === 1 || type === 2 || type === 5 || type === 3)) ||
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
            12: canDelProformaInvoice
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
            12: canAddProforma,
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
            if (printWindow) {
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
            } else {
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
            12: canAddProforma,
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
            setnewOrderShowNumAfterConversion(2);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 2 &&
            conversionType === "invoice"
        ) {
            setnewOrderShowNumAfterConversion(3);
        } else if (isConversionSuccess && isOrderShowNum === 3) {
            setnewOrderShowNumAfterConversion(6);
        } else if (isConversionSuccess && isOrderShowNum === 4) {
            setnewOrderShowNumAfterConversion(7);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 5 &&
            conversionType === "purchaseInvoice"
        ) {
            setnewOrderShowNumAfterConversion(4);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 2 &&
            conversionType === "dispatch"
        ) {
            setnewOrderShowNumAfterConversion(9);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 5 &&
            conversionType === "Inward"
        ) {
            setnewOrderShowNumAfterConversion(8);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 9 &&
            conversionType === "invoice"
        ) {
            setnewOrderShowNumAfterConversion(3);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 8 &&
            conversionType === "purchaseInvoice"
        ) {
            setnewOrderShowNumAfterConversion(4);
        } else if (
            isConversionSuccess &&
            isOrderShowNum === 12 &&
            conversionType === "invoice"
        ) {
            setnewOrderShowNumAfterConversion(3);
        }
    }, [isConversionSuccess, isOrderShowNum]);

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
            12: canAddProforma,
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
            } else if (isOrderShowNum == 12) {
                setDynamicViewFormate(orderList[0].proforma_invoice_view_formate || 1);
            }
            else {
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
            12: canAddProforma,
        };

        if (permissionMap[isOrderShowNum]) {
            openPrint(id);
            setOrderDropdownOpen(null);
        } else {
            setOrderDropdownOpen(null);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };


    const openPrint = (id: number) => {
        const baseURL = window.location.origin;

        let printId;
        printId = orderTypesList?.find(
            (option) => Number(option.id) === isOrderShowNum,
        )?.id;
        if (printId === "1") {
            const viewId = orderList[0].quotation_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
            // window.open(`${baseURL}/OrderPrintViewV${viewId}/${id}`, "_blank");
        }

        if (printId == "2") {
            const viewId = orderList[0].order_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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

        if (printId == "3") {
            const viewId = orderList[0].invoice_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "4") {
            const viewId = orderList[0].purchase_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "5") {
            const viewId = orderList[0].purchase_order_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "6") {
            const viewId = orderList[0].return_sales_invoice_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "7") {
            const viewId = orderList[0].return_purchase_invoice_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "8") {
            const viewId = orderList[0].inward_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "9") {
            const viewId = orderList[0].dispatch_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        if (printId == "12") {
            const viewId = orderList[0].dispatch_view_formate;
            const printUrl = `${baseURL}/OrderPrintViewV${viewId}/${id}`;

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
        setOrderDropdownOpen(null);
    };

    const openPendingPrint = (id: number, type: number) => {
        const baseURL = window.location.origin;

        let printId;

        printId = orderTypesList?.find(
            (option) => Number(option.id) === isOrderShowNum,
        )?.id;
        window.open(`${baseURL}/PendingPrintViewV1/${id}/${type}`, "_blank");
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
            12: canAddProforma,
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

    return (
        <>
            <OrderActionDropdown
                item={item}
                isOrderShowNum={isOrderShowNum}
                handelChangeEdit={handelChangeEdit}
                openPrint={openPrint}
                handleDownload={downloadWithPicker}
                handleSendWhatsApp={handleSendWhatsApp}
                handleStartWorkFlow={handleStartWorkFlow}
                handleModalOpenStatusAssign={handleModalOpenStatusAssign}
                handleModalOpenReminder={handleModalOpenReminder}
                showTask={showTask}
                openStageAndStatusLog={openStageAndStatusLog}
                handleModalConvertIntoOrder={handleModalConvertIntoOrder}
                handleModalConvertIntoDisPatch={handleModalConvertIntoDisPatch}
                handleModalConvertIntoInvoice={handleModalConvertIntoInvoice}
                handleModalConvertDispatchIntoInvoice={handleModalConvertDispatchIntoInvoice}
                handleModalConvertIntoInward={handleModalConvertIntoInward}
                handleModalConvertIntoPurchaseInvoice={handleModalConvertIntoPurchaseInvoice}
                handleModalConverInwardtIntoPurchaseInvoice={
                    handleModalConverInwardtIntoPurchaseInvoice
                }
                handleModalConvertIntoReturnSalesInoice={
                    handleModalConvertIntoReturnSalesInoice
                }
                handleModalConvertIntoReturnPurchaseInoice={
                    handleModalConvertIntoReturnPurchaseInoice
                }
                openPendingPrint={openPendingPrint}
                openShippingAddressPrint={openShippingAddressPrint}
                handleModalMakeCopy={handleModalMakeCopy}
                handelChangeOrderDelete={handelChangeOrderDelete}
                handelSyncMiracleInvoice={handelSyncMiracleInvoice}
                refreshDownload={refreshDownload}
                isPDFSendingToWhatsApp={isPDFSendingToWhatsApp}
                syncLoading={syncLoading}
                isFeatureEnabled={isFeatureEnabled}
                platformType={platformType}
                orderDropdownOpen={orderDropdownOpen}
                setOrderDropdownOpen={setOrderDropdownOpen}
            />
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
        </>
    );
};

export default CommonOrderActions;
