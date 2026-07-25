import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    formatDate,
    formatDateAndTime,
    newRightsForPrint,
} from "../../common/SharedFunction";
import PrintSettingModal from "../../components/model/PrintSettingModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../helpers/AppConstants";
import { PAGE_ID, PRINT_SETTING_TYPE_OBJ } from "../../helpers/AppEnum";
import { setUrlParams } from "../../services/axiosInstance";
import {
    fetchCustomForm,
    fetchprintSetting,
    IprintSetting,
    ItemDetails as OrderItemDetails,
} from "../order-pdf-view/OrderPdfController";
import "./OrderPrintView.css";
import {
    fetchCurrency,
    fetchOrderByForPrintIdApi,
} from "./pendingPrintController";

// Define interface for custom form fields
interface CustomFormField {
    id: number;
    title: string;
    data_type: number;
    display_order: number;
    required_or_not: number;
    print_or_not: number;
    reference_column_name: string;
    data_source?: string | null;
}

interface ICurrency {
    id: number;
    short_name: string;
    name: string;
    symbol: string;
}


const ShippingAddressPrint = () => {
    const [orderPrintById, setOrderPrintById] = useState<OrderItemDetails>();
    const [customOrderPdfViewById, setCustomOrderPdfViewById] = useState<
        CustomFormField[]
    >([]);
    const [productCustomOrderPdfViewById, setProductCustomOrderPdfViewById] =
        useState<CustomFormField[]>([]);
    const [dynamicTerms, setDynamicTerms] = useState<number>(0);
    const [currency, setCurrency] = useState<ICurrency[]>([]);
    const [printSetting, setPrintSetting] = useState<IprintSetting>();
    const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);

    const { id, MobileToken, getID } = useParams();

    useEffect(() => {
        setUrlParams({ MobileToken, getID });

        return () => {
            setUrlParams({});
        };
    }, [MobileToken, getID]);

    const [canViewPrintSetting, setCanViewPrintSetting] = useState<boolean>(false);

    useEffect(() => {
        loadRights();
    }, []);

    const loadRights = async () => {
        const a_application_login_id = getID || localStorage.getItem("UUID");
        const response = await newRightsForPrint(
            PAGE_ID.PRINT_SETTINGS_RIGHTS,
            a_application_login_id,
        );
        setCanViewPrintSetting(response?.view);
    };

    // Wrapper functions
    const setCustomOrderPdfViewByIdWrapper = (value: CustomFormField[] | undefined) => {
        setCustomOrderPdfViewById(Array.isArray(value) ? value : []);
    };

    const setProductCustomOrderPdfViewByIdWrapper = (value: CustomFormField[] | undefined) => {
        setProductCustomOrderPdfViewById(Array.isArray(value) ? value : []);
    };

    useEffect(() => {
        const print_flag = 1;
        fetchOrderByForPrintIdApi(
            Number(id),
            setOrderPrintById,
            MobileToken,
            getID,
            print_flag,
        );
        fetchCurrency(setCurrency);
    }, [id, MobileToken, getID]);

    useEffect(() => {
        let formType = 5;
        if (orderPrintById?.cart?.type) {
            switch (Number(orderPrintById.cart.type)) {
                case 8:
                    formType = 12;
                    break;
                case 9:
                    formType = 13;
                    break;
                default:
                    formType = 5;
            }
        }
        fetchCustomForm(
            formType,
            setCustomOrderPdfViewByIdWrapper as any,
            MobileToken,
            getID,
        );
        fetchCustomForm(
            4,
            setProductCustomOrderPdfViewByIdWrapper as any,
            MobileToken,
            getID,
        );
    }, [orderPrintById?.cart?.type]);

    const selectedCurrency =
        currency.find((curr) => curr.id === orderPrintById?.cart.currency_id)
            ?.short_name || "INR";

    const finalCurrency = selectedCurrency === "INR" ? "INR" : "USD";

    // Matched Custom Fields for Cart
    const matchedCartFields: { [key: string]: string } = {};
    if (orderPrintById?.cart && customOrderPdfViewById.length) {
        Object.entries(orderPrintById.cart).forEach(([key, value]) => {
            if (
                key.startsWith("carts_column_") &&
                value !== undefined &&
                value !== null &&
                value !== "" &&
                value !== "0" &&
                value !== "00:00:00" &&
                value !== "0000-00-00" &&
                value !== "0000-00-00 00:00:00"
            ) {
                const matchedField = customOrderPdfViewById.find(
                    (field) => field.reference_column_name === key
                );
                if (matchedField && matchedField.print_or_not === 1) {
                    let formattedValue = value.toString();

                    if (matchedField.data_type === 4 || matchedField.data_type === 5) {
                        formattedValue = formatDate(value.toString());
                    } else if (matchedField.data_type === 7) {
                        formattedValue = value.toString() === "1" ? "Yes" : "No";
                    }

                    matchedCartFields[matchedField.title] = formattedValue;
                }
            }
        });
    }

    // Matched Custom Fields for Products
    const matchedProductFields: { [itemId: number]: { [key: string]: string } } = {};
    if (orderPrintById?.items?.length && productCustomOrderPdfViewById.length) {
        orderPrintById.items.forEach((item) => {
            const itemId = item.id;
            matchedProductFields[itemId] = {};

            Object.entries(item).forEach(([key, value]) => {
                if (
                    key.startsWith("products_column_") &&
                    value !== undefined &&
                    value !== null &&
                    value !== "" &&
                    value !== "0" &&
                    value !== "00:00:00" &&
                    value !== "0000-00-00" &&
                    value !== "0000-00-00 00:00:00"
                ) {
                    const matchedField = productCustomOrderPdfViewById.find(
                        (field) => field.reference_column_name === key
                    );
                    if (matchedField && matchedField.print_or_not === 1) {
                        let formattedValue = value.toString();

                        if (matchedField.data_type === 5) {
                            formattedValue = formatDateAndTime(value);
                        } else if (matchedField.data_type === 4) {
                            formattedValue = formatDate(value);
                        } else if (matchedField.data_type === 7) {
                            formattedValue = value.toString() === "1" ? "Yes" : "No";
                        }

                        matchedProductFields[itemId][matchedField.title] = formattedValue;
                    }
                }
            });
        });
    }

    useEffect(() => {
        if (orderPrintById?.cart.type === 9) {
            setDynamicTerms(orderPrintById.companyDetail.dispatch_terms_conditions);
        } else if (orderPrintById?.cart.type === 3) {
            setDynamicTerms(orderPrintById.companyDetail.sales_invoice_terms_conditions);
        }
    }, [orderPrintById]);

    useEffect(() => {
        if (orderPrintById?.cart?.type) {
            fetchprintSetting(setPrintSetting, Number(PRINT_SETTING_TYPE_OBJ[String(-14) as keyof typeof PRINT_SETTING_TYPE_OBJ]), 1, MobileToken, getID);
        }
    }, [orderPrintById?.cart?.type, MobileToken, getID]);

    const openPrintSetting = () => {
        if (canViewPrintSetting) {
            setIsPrintSettingShow(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const styles = {
        page: {
            padding: "10px",
            display: "flex",
            justifyContent: "center",
        },
        card: {
            width: "400px",
            border: "2px solid #000",
            padding: "10px",
            fontSize: "12px",
        },
        section: {
            borderBottom: "1px solid #000",
            padding: "5px 0",
        },
    };

    useEffect(() => {
        if (orderPrintById) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [orderPrintById]);
    return orderPrintById ? (

        <div style={{ position: "relative", height: "100%", minHeight: "100vh" }}>
            <div style={styles.page}>
                <div style={styles.card}>

                    {/* ==================== TO (Ship To) ==================== */}
                    <div style={styles.section}>
                        <strong style={{ fontSize: "18px" }}>TO</strong>
                        <p style={{ margin: "6px 0 3px 0", fontWeight: "bold", fontSize: "14px" }}>
                            {orderPrintById?.cart.to_customer_name}
                        </p>

                        <p style={{
                            margin: "4px 0",
                            fontSize: "13.8px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            lineHeight: "1.5"
                        }}>
                            {orderPrintById?.cart.shipping_address}
                        </p>

                        <p style={{ margin: "3px 0", fontSize: "13.5px" }}>
                            {orderPrintById?.cart.city}
                            {orderPrintById?.cart.city && orderPrintById?.cart.state_name ? ", " : ""}
                            {orderPrintById?.cart.state_name}
                            {(orderPrintById?.cart.city || orderPrintById?.cart.state_name) &&
                                orderPrintById?.cart.PinCode
                                ? ` - ${orderPrintById.cart.PinCode}`
                                : orderPrintById?.cart.PinCode
                                    ? ` - ${orderPrintById.cart.PinCode}`
                                    : ""}
                        </p>

                        {orderPrintById?.cart.to_customer_phone && (
                            <p style={{ margin: "6px 0 0 0", fontSize: "15px", fontWeight: "600" }}>
                                Phone: <span style={{ fontSize: "15.5px", fontWeight: "700" }}>
                                    {orderPrintById.cart.to_customer_phone}
                                </span>
                            </p>
                        )}

                        {/* Custom Form Fields */}
                        {Array.isArray(customOrderPdfViewById) &&
                            printSetting?.setting_details?.ShippingLabelCustomForm &&
                            customOrderPdfViewById
                                .filter((field) => field.print_or_not === 1 && field.display_order <= 0)
                                .sort((a, b) => a.display_order - b.display_order)
                                .map((field) => {
                                    const value = matchedCartFields[field.title];
                                    if (!value || value.trim() === "") return null;

                                    return (
                                        <p key={field.id} style={{ margin: "4px 0", fontSize: "13px" }}>
                                            <strong>{field.title}:</strong> {value}
                                        </p>
                                    );
                                })}
                    </div>

                    {/* ==================== FROM (Shipped By) ==================== */}
                    <div style={styles.section}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            {/* Left Side - Company Details */}
                            <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: "18px" }}>FROM</strong>
                                <p style={{ margin: "6px 0 3px 0", fontWeight: "bold", fontSize: "14px" }}>
                                    {orderPrintById?.companyDetail.company_name}
                                </p>

                                <p style={{
                                    margin: "3px 0",
                                    fontSize: "13.5px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    lineHeight: "1.35"
                                }}>
                                    {orderPrintById?.companyDetail.address}
                                </p>

                                <p style={{ margin: "3px 0", fontSize: "13.5px" }}>
                                    {orderPrintById?.companyDetail.state_name}
                                </p>

                                {orderPrintById?.companyDetail.printed_number && (
                                    <p style={{ margin: "6px 0 0 0", fontSize: "15px", fontWeight: "600" }}>
                                        Phone: <span style={{ fontSize: "15.5px", fontWeight: "700" }}>
                                            {orderPrintById.companyDetail.printed_number}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Right Side - Order # and QR Code */}
                            <div style={{ textAlign: "right", marginLeft: "12px" }}>
                                {orderPrintById?.cart.sr_by_number && (
                                    <p style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "15px",
                                        fontWeight: "600"
                                    }}>
                                        Order #: <span style={{ fontSize: "15.5px" }}>
                                            {orderPrintById.cart.sr_by_number}
                                        </span>
                                    </p>
                                )}
                                <div>
                                    <QRCodeSVG
                                        value={`${orderPrintById.cart.sr_by_number}`}
                                        size={100}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==================== PRODUCT TABLE ==================== */}
                    {printSetting?.setting_details?.ProductSection === true && (
                        <>
                            <div style={{ marginTop: "12px" }}>
                                <table style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "12.5px",
                                    border: "1px solid #000",
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f8f8f8", borderBottom: "2px solid #000" }}>
                                            <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: "bold" }}>
                                                Product
                                            </th>
                                            <th style={{
                                                textAlign: "center",
                                                padding: "8px 6px",
                                                fontWeight: "bold",
                                                width: "80px"
                                            }}>
                                                Qty
                                            </th>
                                            <th style={{
                                                textAlign: "right",
                                                padding: "8px 6px",
                                                fontWeight: "bold",
                                                width: "100px"
                                            }}>
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderPrintById.items?.map((item, index) => (
                                            <tr key={index} style={{
                                                borderBottom: index === (orderPrintById.items.length - 1) ? "none" : "1px solid #ddd"
                                            }}>
                                                <td style={{ padding: "8px 6px", verticalAlign: "top", fontSize: "12.8px" }}>
                                                    {item.item_product_name}
                                                </td>
                                                <td style={{ padding: "8px 6px", textAlign: "center", verticalAlign: "top" }}>
                                                    {item.item_qty}
                                                </td>
                                                <td style={{
                                                    padding: "8px 6px",
                                                    textAlign: "right",
                                                    verticalAlign: "top",
                                                    fontWeight: "500"
                                                }}>
                                                    ₹{Number(item.item_total || 0).toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Grand Total */}
                            <div style={{
                                textAlign: "right",
                                fontSize: "14px",
                                fontWeight: "bold",
                                marginTop: "10px",
                                paddingTop: "6px",
                                borderTop: "2px solid #000"
                            }}>
                                Grand Total : ₹{Number(orderPrintById?.cart.grand_total || 0).toLocaleString('en-IN')}
                            </div>
                        </>
                    )}

                    {/* Terms & Conditions */}
                    {dynamicTerms && (
                        <div style={{
                            marginTop: "10px",
                            paddingTop: "8px",
                            borderTop: "1px solid #000",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            textAlign: "justify",
                            wordBreak: "break-word"
                        }}>
                            {dynamicTerms}
                        </div>
                    )}
                </div>
            </div>
            <style>
                {
                    `
        @media print {
  .no-print {
    display: none !important;
  }
}
        `
                }
            </style>
            {/* Print Setting Button */}
            <div className="no-print">
                <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                    <button className="icons" onClick={openPrintSetting}>
                        <span className="text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#000">
                                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
            {/* Print Setting Modal */}
            {isPrintSettingShow && printSetting && (
                <PrintSettingModal
                    show={isPrintSettingShow}
                    setShow={setIsPrintSettingShow}
                    onHide={() => setIsPrintSettingShow(false)}
                    handleSubmit={() => {
                        if (orderPrintById?.cart?.type) {
                            fetchprintSetting(setPrintSetting, Number(PRINT_SETTING_TYPE_OBJ[String(-14) as keyof typeof PRINT_SETTING_TYPE_OBJ]), 1, MobileToken, getID);
                        } else {
                            setIsPrintSettingShow(false);
                        }
                    }}
                    orderType={-14}
                    viewFormate={1}
                    orderById={printSetting?.setting_details}
                    titles={"Create"}
                    message={"Please Enter Your Order Details"}
                    btn1={"CANCEL"}
                    btn2={"Approve"}
                    getID={getID}
                />
            )}
        </div>
    ) : (
        <p className="text-center">Loading...</p>
    );
};

export default ShippingAddressPrint;