// components/OrderActionDropdown.tsx

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { whatsappTemplateCloudeSend } from '../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController';
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from '../../../helpers/AppConstants';
import { PAGE_ID, PERMISSION_TYPE } from '../../../helpers/AppEnum';
import useCheckUserPermission from '../../../hooks/useCheckUserPermission';
import { IOrder, orderTypesList } from '../../../pages/right-side/list-order/ListOrderController';
import { fetchCompanyApi, ICompany } from '../../left-side/list-company/ListCompanyController';

interface OrderActionDropdownProps {
    item: IOrder;
    isOrderShowNum?: number;

    // Handlers
    handelChangeEdit?: (id: number, cartNumber: string, type: number) => void;
    openPrint?: (id: number) => void;
    handleDownload?: (id: number) => void;
    handleSendWhatsApp?: (id: number) => void;
    handleStartWorkFlow?: (showNum: number, orderId: number) => void;
    handleModalOpenStatusAssign?: (id?: number, cart_status?: number) => void;
    handleModalOpenReminder?: (id: number | undefined) => void;
    showTask?: (item: IOrder) => void;
    openStageAndStatusLog?: (item: IOrder) => void;
    handleModalConvertIntoOrder?: (id: number, number: string) => void;
    handleModalConvertIntoProforma?: (id: number, number: string) => void;
    handleModalConvertIntoDisPatch?: (id: number, number: string) => void;
    handleModalConvertIntoInvoice?: (id: number, number: string) => void;
    handleModalConvertDispatchIntoInvoice?: (id: number, number: string) => void;
    handleModalConvertIntoInward?: (id: number, number: string) => void;
    handleModalConvertIntoPurchaseInvoice?: (id: number, number: string) => void;
    handleModalConverInwardtIntoPurchaseInvoice?: (id: number, number: string) => void;
    handleModalConvertIntoReturnSalesInoice?: (id: number, number: string) => void;
    handleModalConvertIntoReturnPurchaseInoice?: (id: number, number: string) => void;
    openPendingPrint?: (id: number, type: number) => void;
    openShippingAddressPrint?: (id: number, type: number) => void;
    handleModalMakeCopy?: (id: number, cartType: number) => void;
    handelChangeOrderDelete?: (id?: number) => void;
    handelSyncMiracleInvoice?: (id: number) => void;

    // States
    refreshDownload?: boolean;
    isPDFSendingToWhatsApp?: boolean;
    syncLoading?: boolean;
    isFeatureEnabled?: boolean;
    platformType?: number;
    orderDropdownOpen?: number | null;
    setOrderDropdownOpen?: React.Dispatch<React.SetStateAction<number | null>>;
}

const OrderActionDropdown: React.FC<OrderActionDropdownProps> = ({
    item,
    isOrderShowNum = 0,
    handelChangeEdit,
    openPrint,
    handleDownload,
    handleSendWhatsApp,
    handleStartWorkFlow,
    handleModalOpenStatusAssign,
    handleModalOpenReminder,
    showTask,
    openStageAndStatusLog,
    handleModalConvertIntoOrder,
    handleModalConvertIntoProforma,
    handleModalConvertIntoDisPatch,
    handleModalConvertIntoInvoice,
    handleModalConvertDispatchIntoInvoice,
    handleModalConvertIntoInward,
    handleModalConvertIntoPurchaseInvoice,
    handleModalConverInwardtIntoPurchaseInvoice,
    handleModalConvertIntoReturnSalesInoice,
    handleModalConvertIntoReturnPurchaseInoice,
    openPendingPrint,
    openShippingAddressPrint,
    handleModalMakeCopy,
    handelChangeOrderDelete,
    handelSyncMiracleInvoice,
    refreshDownload,
    isPDFSendingToWhatsApp,
    syncLoading,
    isFeatureEnabled,
    platformType,
    orderDropdownOpen,
    setOrderDropdownOpen,
}) => {

    const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
    const [noDataFound, setNoDataFound] = useState(false);
    const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();
    const [loading, setLoading] = useState(false);


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
    const canPdfProforma = useCheckUserPermission(
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

    useEffect(() => {
        fetchCompanyApi(
            setCompanyLists,
            "",
            setNoDataFound,
            setCompanyJoinOrCreate,
            setLoading
        );
    }, []);

    const companyData = companyLists?.[0];

    const dynamicQuotation =
        companyData?.quotation_title || "Quotation";

    const dynamicOrder =
        companyData?.order_title || "Sales Order";

    const dynamicdisPatch =
        companyData?.dispatch_title || "Dispatch";

    const dynamicInward =
        companyData?.inward_title || "Goods Received Note (GRN)";

    const dynamicInvoice =
        companyData?.invoice_title || "Sales Invoice";

    const dynamicReturnSalesInvoice =
        companyData?.return_sales_invoice_title || "Return Sales Invoice";

    const dynamicPurchaseOrder =
        companyData?.purchase_order_title || "Purchase Order";

    const dynamicPurchaseInvoice =
        companyData?.purchase_title || "Purchase Invoice";

    const dynamicReturnPurchaseInvoice =
        companyData?.return_purchase_invoice_title || "Return Purchase Invoice";

    const dynamicProformaInvoice =
        companyData?.proforma_invoice_title || "Proforma Invoice";

    const printId =
        orderTypesList?.find(
            (option) => Number(option.id) === isOrderShowNum
        )?.id || "";

    const workflowConfig: Record<
        string,
        { name: string; workflow: number }
    > = {
        "1": {
            name: dynamicQuotation,
            workflow: 5,
        },
        "2": {
            name: dynamicOrder,
            workflow: 6,
        },
        "3": {
            name: dynamicInvoice,
            workflow: 7,
        },
        "4": {
            name: dynamicPurchaseInvoice,
            workflow: 10,
        },
        "5": {
            name: dynamicPurchaseOrder,
            workflow: 9,
        },
        "6": {
            name: dynamicReturnSalesInvoice,
            workflow: 8,
        },
        "7": {
            name: dynamicReturnPurchaseInvoice,
            workflow: 11,
        },
        "8": {
            name: dynamicInward,
            workflow: 12,
        },
        "9": {
            name: dynamicdisPatch,
            workflow: 13,
        },
        "12": {
            name: dynamicProformaInvoice,
            workflow: 14,
        },
    };

    const dynamicName =
        workflowConfig[printId]?.name || "";

    const dynamicStartWorkflow =
        workflowConfig[printId]?.workflow || 0;

    return (
        <>
            <style>{`.listItem-report {
  padding-right: 10px;
  padding-left: 10px;
  padding-top: 10px;
  color: var(--listItem-report);
  font-size: 13px;
  cursor: pointer;
  box-sizing: border-box;
  display: block;
  height: 30px;
  line-height: 13px;
}
.listItem-report:hover {
  background: #fce0ca;
}
`}</style>
            <ul
                style={{
                    // // background: "var(--dropdown)",
                    // boxShadow:
                    //     "0 2px 5px 0 rgba(var(--shadow-rgb), 0.26), 0 2px 10px 0 rgba(var(--shadow-rgb), 0.16)",
                    // width: "180px",
                    // position: "absolute",
                    // borderRadius: "4px",
                    // marginTop: "15%",
                    // marginLeft: "65%",
                    zIndex: 999,
                    // listStyle: "none",
                    // marginBottom: 0,
                    // // display: "none",
                    margin: 0,
                    padding: "10px 10px",
                    minWidth: "auto",
                    fontSize: "14px",
                    textAlign: "start"
                }}
            >
                <li
                    className="listItem-report"
                    role="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOrderDropdownOpen?.(null);
                        handelChangeEdit?.(
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
                            item.type === 5 ||
                            item.type === 12)) ||
                        !item.cart_number
                        ? "Edit/View"
                        : "View"}
                </li>
                <li
                    className="listItem-report"
                    role="button"
                    onClick={() => openPrint?.(item.id)}
                >
                    Print
                </li>
                <li
                    className="listItem-report"
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
                            12: canPdfProforma,
                        };
                        if (!refreshDownload) {
                            if (permissionMap[isOrderShowNum]) {
                                handleDownload?.(item.id);
                            } else {
                                setOrderDropdownOpen?.(null);

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
                    className="listItem-report"
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
                        };
                        if (!isPDFSendingToWhatsApp) {
                            if (permissionMap[isOrderShowNum]) {
                                if (platformType == 1) {
                                    handleSendWhatsApp?.(item.id);
                                } else if (platformType == 2) {
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
                                    );
                                }
                            } else {
                                setOrderDropdownOpen?.(null);

                                toast.error(
                                    DEFAULT_MESSAGE_ERROR_PERMISSION,
                                );
                            }
                        }
                    }}
                    style={{ color: "#3baf4f", fontWeight: "600" }}
                >
                    {isPDFSendingToWhatsApp
                        ? "Sending..."
                        : "Send to WhatsApp"}
                </li>
                <li
                    className="listItem-report"
                    role="button"
                    onClick={() =>
                        handleStartWorkFlow?.(isOrderShowNum, item.id)
                    }
                    style={{ color: "#0992f3", fontWeight: "600" }}
                >
                    Start WorkFlow
                </li>
                <li
                    className="listItem-report"
                    role="button"
                    onClick={() =>
                        handleModalOpenStatusAssign?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() => handleModalOpenReminder?.(item.id)}
                    >
                        Reminder
                    </li>
                )}
                <li
                    className="listItem-report"
                    role="button"
                    onClick={() => showTask?.(item)}
                >
                    Add Task
                </li>
                <li
                    className="listItem-report"
                    role="button"
                    onClick={() => openStageAndStatusLog?.(item)}
                >
                    Timeline
                </li>
                {item.type === 1 && item.cart_number ? (
                    <li
                        style={{ height: "auto" }}
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoOrder?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoProforma?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoInvoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoDisPatch?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoInvoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoInvoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertDispatchIntoInvoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoInward?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoPurchaseInvoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConverInwardtIntoPurchaseInvoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoReturnSalesInoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalConvertIntoReturnPurchaseInoice?.(
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            openPendingPrint?.(item.id, item.type)
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            openPendingPrint?.(item.id, item.type)
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handelSyncMiracleInvoice?.(item.id)
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
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            openShippingAddressPrint?.(item.id, item.type)
                        }
                    >
                        {/* Pending {dynamicOrder} Print */}
                        Shipping Label Print
                    </li>
                ) : (
                    <span></span>
                )}
                {item.type === 1 && item.cart_number && (
                    <li
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalMakeCopy?.(item.id, item.type)
                        }
                    >
                        Create New Copy
                    </li>
                )}
                {item.type === 2 && item.cart_number && (
                    <li
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalMakeCopy?.(item.id, item.type)
                        }
                    >
                        Create New Copy
                    </li>
                )}
                {item.type === 3 && item.cart_number && (
                    <li
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalMakeCopy?.(item.id, item.type)
                        }
                    >
                        Create New Copy
                    </li>
                )}
                {item.type === 4 && item.cart_number && (
                    <li
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalMakeCopy?.(item.id, item.type)
                        }
                    >
                        Create New Copy
                    </li>
                )}
                {item.type === 5 && item.cart_number && (
                    <li
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalMakeCopy?.(item.id, item.type)
                        }
                    >
                        Create New Copy
                    </li>
                )}
                {item.type === 6 && item.cart_number && (
                    <li
                        className="listItem-report"
                        role="button"
                        onClick={() =>
                            handleModalMakeCopy?.(item.id, item.type)
                        }
                    >
                        Create New Copy
                    </li>
                )}
                {item.type === 12 && item.cart_number && (
                    <li
                        className="listItem-report"
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
                    className="listItem-report"
                    role="button"
                    onClick={() => handelChangeOrderDelete?.(item.id)}
                >
                    Delete
                </li>
            </ul>
        </>
    );
};

export default OrderActionDropdown;