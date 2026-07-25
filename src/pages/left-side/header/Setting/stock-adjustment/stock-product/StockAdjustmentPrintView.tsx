import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { newRightsForPrint } from '../../../../../../common/SharedFunction';
import { PAGE_ID } from '../../../../../../helpers/AppEnum';
import { toast } from 'react-toastify';
import { DEFAULT_MESSAGE_ERROR_PERMISSION, DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../../../../../helpers/AppConstants';
import { axiosInstance } from '../../../../../../services/axiosInstance';
import { fetchAllStockData } from '../StockAdjustmentController';
import { IprintSetting } from '../../../../../order-pdf-view/OrderPdfController';

const StockAdjustmentPrintView = () => {
    const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);
    const [printSetting, setPrintSetting] = useState<IprintSetting>();

    const { StockId, MobileToken, getID } = useParams();

    // useEffect(() => {
    //     setUrlParams({ MobileToken, getID });

    //     return () => {
    //         setUrlParams({});
    //     };
    // }, [MobileToken, getID]);

    const [canViewPrintSetting, setCanViewPrintSetting] = useState<boolean>(false);
    const [cartData, setCartData] = useState<Record<string, any>>({});
    const [cartItemsData, setCartItemsData] = useState<any[]>([]);

    


    useEffect(() => {
        fetchAllStockData(Number(StockId), setCartData, setCartItemsData);
    }, []);

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


    // useEffect(() => {
    //     let formType = 5;
    //     if (orderPrintById?.cart?.type) {
    //         switch (Number(orderPrintById.cart.type)) {
    //             case 8:
    //                 formType = 12;
    //                 break;
    //             case 9:
    //                 formType = 13;
    //                 break;
    //             default:
    //                 formType = 5;
    //         }
    //     }
    //     fetchCustomForm(
    //         formType,
    //         setCustomOrderPdfViewByIdWrapper as any,
    //         MobileToken,
    //         getID,
    //     );
    //     fetchCustomForm(
    //         4,
    //         setProductCustomOrderPdfViewByIdWrapper as any,
    //         MobileToken,
    //         getID,
    //     );
    // }, [orderPrintById?.cart?.type]);

    // const selectedCurrency =
    //     currency.find((curr) => curr.id === orderPrintById?.cart.currency_id)
    //         ?.short_name || "INR";

    // const finalCurrency = selectedCurrency === "INR" ? "INR" : "USD";

    // Matched Custom Fields for Cart
    // const matchedCartFields: { [key: string]: string } = {};
    // if (orderPrintById?.cart && customOrderPdfViewById.length) {
    //     Object.entries(orderPrintById.cart).forEach(([key, value]) => {
    //         if (
    //             key.startsWith("carts_column_") &&
    //             value !== undefined &&
    //             value !== null &&
    //             value !== "" &&
    //             value !== "0" &&
    //             value !== "00:00:00" &&
    //             value !== "0000-00-00" &&
    //             value !== "0000-00-00 00:00:00"
    //         ) {
    //             const matchedField = customOrderPdfViewById.find(
    //                 (field) => field.reference_column_name === key
    //             );
    //             if (matchedField && matchedField.print_or_not === 1) {
    //                 let formattedValue = value.toString();

    //                 if (matchedField.data_type === 4 || matchedField.data_type === 5) {
    //                     formattedValue = formatDate(value.toString());
    //                 } else if (matchedField.data_type === 7) {
    //                     formattedValue = value.toString() === "1" ? "Yes" : "No";
    //                 }

    //                 matchedCartFields[matchedField.title] = formattedValue;
    //             }
    //         }
    //     });
    // }

    // Matched Custom Fields for Products
    // const matchedProductFields: { [itemId: number]: { [key: string]: string } } = {};
    // if (orderPrintById?.items?.length && productCustomOrderPdfViewById.length) {
    //     orderPrintById.items.forEach((item) => {
    //         const itemId = item.id;
    //         matchedProductFields[itemId] = {};

    //         Object.entries(item).forEach(([key, value]) => {
    //             if (
    //                 key.startsWith("products_column_") &&
    //                 value !== undefined &&
    //                 value !== null &&
    //                 value !== "" &&
    //                 value !== "0" &&
    //                 value !== "00:00:00" &&
    //                 value !== "0000-00-00" &&
    //                 value !== "0000-00-00 00:00:00"
    //             ) {
    //                 const matchedField = productCustomOrderPdfViewById.find(
    //                     (field) => field.reference_column_name === key
    //                 );
    //                 if (matchedField && matchedField.print_or_not === 1) {
    //                     let formattedValue = value.toString();

    //                     if (matchedField.data_type === 5) {
    //                         formattedValue = formatDateAndTime(value);
    //                     } else if (matchedField.data_type === 4) {
    //                         formattedValue = formatDate(value);
    //                     } else if (matchedField.data_type === 7) {
    //                         formattedValue = value.toString() === "1" ? "Yes" : "No";
    //                     }

    //                     matchedProductFields[itemId][matchedField.title] = formattedValue;
    //                 }
    //             }
    //         });
    //     });
    // }

    // useEffect(() => {
    //     if (orderPrintById?.cart.type === 9) {
    //         setDynamicTerms(orderPrintById.companyDetail.dispatch_terms_conditions);
    //     } else if (orderPrintById?.cart.type === 3) {
    //         setDynamicTerms(orderPrintById.companyDetail.sales_invoice_terms_conditions);
    //     }
    // }, [orderPrintById]);

    // useEffect(() => {
    //     if (orderPrintById?.cart?.type) {
    //         fetchprintSetting(setPrintSetting, Number(14), 1, MobileToken, getID);
    //     }
    // }, [orderPrintById?.cart?.type, MobileToken, getID]);

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
            width: "70%",
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
        if (cartItemsData) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [cartItemsData]);

    return (
        <>
            <style>
                {`
            .no-border,
.no-border td,
.no-border th {
    border: none !important;
}
            `}
            </style>

            <div style={{ position: "relative", height: "100%", minHeight: "100vh" }}>
                <div style={styles.page}>
                    <div style={styles.card}>

                        <div style={styles.section}>
                            <p style={{ textAlign: "center" }}><strong style={{ fontSize: "18px" }}>Stock Adjustment</strong></p>
                        </div>

                        <div style={styles.section}>

                            {/* <p style={{ margin: "6px 0 3px 0", fontWeight: "bold", fontSize: "15px" }}>
                            Stock Number
                        </p>

                        <p style={{
                            margin: "4px 0",
                            fontSize: "15px",
                            fontWeight: "bold",
                        }}>
                            Transfer Date
                        </p>
                        <p style={{
                            margin: "4px 0",
                            fontSize: "15px",
                            fontWeight: "bold",
                        }}>
                            Created Date
                        </p>
                        <p style={{
                            margin: "4px 0",
                            fontSize: "15px",
                            fontWeight: "bold",
                        }}>
                            Created By
                        </p>
                        <p style={{
                            margin: "4px 0",
                            fontSize: "15px",
                            fontWeight: "bold",
                        }}>
                            Remark
                        </p> */}

                            <table className="table table-sm no-border">
                                <tbody style={{ fontSize: "15px" }}>
                                    <tr>
                                        <td style={{ fontWeight: "bold", width: "150px" }}>Stock Number</td>
                                        <td>-</td>
                                        <td style={{ fontWeight: "bold" }}>{cartData.cart_number}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: "bold", width: "150px" }}>Transfer Date</td>
                                        <td>-</td>
                                        <td>{cartData.cart_date}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: "bold", width: "150px" }}>Created Date</td>
                                        <td>-</td>
                                        <td>{cartData.created_date_time}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: "bold", width: "150px" }}>Created By</td>
                                        <td>-</td>
                                        <td>{cartData.created_by_name}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: "bold", width: "150px" }}>Remark</td>
                                        <td>-</td>
                                        <td style={{ whiteSpace: "break-spaces", wordBreak: "break-word" }}>{cartData.cart_remark}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* ==================== PRODUCT TABLE ==================== */}
                        {/* {printSetting?.setting_details?.ProductSection === true && ( */}
                        {cartItemsData.length === 0 ? (
                            <h6 style={{ marginTop: "12px" }}>No Cart Items Found.</h6>
                        ) : <>
                            <div style={{ marginTop: "12px" }}>
                                <table style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "12.5px",
                                    border: "1px solid #000",
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f8f8f8", borderBottom: "2px solid #000" }}>
                                            <th style={{ padding: "8px 6px", fontWeight: "bold" }}>
                                                Product Name
                                            </th>
                                            <th style={{
                                                padding: "8px 6px",
                                                fontWeight: "bold",
                                                // width: "80px"
                                            }}>
                                                Warehouse
                                            </th>
                                            <th style={{
                                                padding: "8px 6px",
                                                fontWeight: "bold",
                                                // width: "80px"
                                            }}>
                                                Qty
                                            </th>
                                            <th style={{
                                                padding: "8px 6px",
                                                fontWeight: "bold",
                                                // width: "100px"
                                            }}>
                                                Remark
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartItemsData.map((item, index) => (
                                            <tr key={index} style={{
                                                borderBottom: index === (cartItemsData.length - 1) ? "none" : "1px solid #ddd"
                                            }}>
                                                <td style={{ padding: "8px 6px", verticalAlign: "top", fontSize: "12.8px" }}>
                                                    {item.item_product_name}
                                                </td>
                                                <td>
                                                    {item.item_warehouse_name}
                                                </td>
                                                <td style={{ padding: "8px 6px", verticalAlign: "top" }}>
                                                    {item.item_qty}
                                                </td>
                                                <td style={{
                                                    padding: "8px 6px",
                                                    // textAlign: "right",
                                                    verticalAlign: "top",
                                                    fontWeight: "500",
                                                    whiteSpace: "break-spaces",
                                                    wordBreak: "break-word"
                                                }}>
                                                    {item.item_product_description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>}
                        
                        {/* )} */}

                        {/* Terms & Conditions */}
                        {/* {dynamicTerms && (
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
                    )} */}
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
                {/* {isPrintSettingShow && printSetting && (
                <PrintSettingModal
                    show={isPrintSettingShow}
                    setShow={setIsPrintSettingShow}
                    onHide={() => setIsPrintSettingShow(false)}
                    handleSubmit={() => {
                        if (orderPrintById?.cart?.type) {
                            fetchprintSetting(setPrintSetting, Number(14), 1, MobileToken, getID);
                        } else {
                            setIsPrintSettingShow(false);
                        }
                    }}
                    orderType={14}
                    viewFormate={1}
                    orderById={printSetting?.setting_details}
                    titles={"Create"}
                    message={"Please Enter Your Order Details"}
                    btn1={"CANCEL"}
                    btn2={"Approve"}
                    getID={getID}
                />
            )} */}
            </div>
        </>
    )
}

export default StockAdjustmentPrintView;