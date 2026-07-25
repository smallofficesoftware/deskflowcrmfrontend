import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  formatDate,
  formatDateAndTime,
  formatNumber,
  newRightsForPrint,
} from "../../common/SharedFunction";
import PrintSettingModal from "../../components/model/PrintSettingModal";
import SafeHtml from "../../components/SafeHtml";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../helpers/AppConstants";
import { PAGE_ID, PRINT_SETTING_TYPE_OBJ } from "../../helpers/AppEnum";
import { setUrlParams } from "../../services/axiosInstance";
import { numberToWordsCurrency } from "../../utils/numberToWordsCurrency";
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

// Define interface for custom form fields based on console output
interface CustomFormField {
  id: number;
  title: string;
  data_type: number; // e.g., 3 for date, 4 for date-time
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

const PendingPrintViewV1 = () => {
  const [orderPrintById, setOrderPrintById] = useState<OrderItemDetails>();
  const [customOrderPdfViewById, setCustomOrderPdfViewById] = useState<
    CustomFormField[]
  >([]);
  const [productCustomOrderPdfViewById, setProductCustomOrderPdfViewById] =
    useState<CustomFormField[]>([]);
  const [dynamicColor, setDynamicColor] = useState("#cfcfcf");
  const [dynamicTitle, setDynamicTitle] = useState("");
  const [currency, setCurrency] = useState<ICurrency[]>([]);
  const [printSetting, setPrintSetting] = useState<IprintSetting>();
  const [dynamicViewFormate, setDynamicViewFormate] = useState(1);
  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);

  const { id, MobileToken, getID, type } = useParams();

  useEffect(() => {
    setUrlParams({ MobileToken, getID });

    return () => {
      setUrlParams({});
    };
  }, [MobileToken, getID]);

  const [canViewPrintSetting, setCanViewPrintSetting] =
    useState<boolean>(false);

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

  // Wrapper functions to handle type mismatch
  const setCustomOrderPdfViewByIdWrapper = (
    value: CustomFormField[] | undefined,
  ) => {
    if (Array.isArray(value)) {
      setCustomOrderPdfViewById(value);
    } else {
      setCustomOrderPdfViewById([]);
    }
  };

  const setProductCustomOrderPdfViewByIdWrapper = (
    value: CustomFormField[] | undefined,
  ) => {
    if (Array.isArray(value)) {
      setProductCustomOrderPdfViewById(value);
    } else {
      setProductCustomOrderPdfViewById([]);
    }
  };

  useEffect(() => {
    let print_flag = 1;

    if (type == "5") {
      print_flag = 2;
    }
    fetchOrderByForPrintIdApi(
      Number(id),
      setOrderPrintById,
      MobileToken,
      getID,
      print_flag,
    );
    fetchCurrency(setCurrency);
  }, [id, MobileToken, getID, setCurrency, type]);

  useEffect(() => {
    let formType = 5;
    if (orderPrintById?.cart?.type) {
      switch (Number(orderPrintById.cart.type)) {
        case 1:
          formType = 5;
          break;
        case 2:
          formType = 6;
          break;
        case 3:
          formType = 7;
          break;
        case 4:
          formType = 8;
          break;
        case 5:
          formType = 9;
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

  const grandTotalInWords = numberToWordsCurrency(
    orderPrintById?.cart?.grand_total ?? 0,
    finalCurrency,
  );

  const gst = orderPrintById?.cart?.gst_amt ?? 0;

  const gstTotalInWords = numberToWordsCurrency(gst, finalCurrency);

  const formatFieldName = (key: string, prefix: string) => {
    return key
      .replace(prefix, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Variable to store matched key-value pairs with title as key for cart
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
          (field) => field.reference_column_name === key,
        );
        if (matchedField) {
          // Format date or date-time based on data_type
          let formattedValue = value.toString();
          if (matchedField.data_type === 4 || matchedField.data_type === 5) {
            try {
              formattedValue = formatDate(value.toString());
            } catch (e) {
              console.error(
                `Error formatting date for ${matchedField.title}:`,
                e,
              );
            }
          } else if (matchedField.data_type === 7) {
            formattedValue = value.toString() === "1" ? "Yes" : "No";
          }
          matchedCartFields[matchedField.title] = formattedValue;
        }
      }
    });
  }

  // Variable to store matched key-value pairs with title as key for products
  const matchedProductFields: { [itemId: number]: { [key: string]: string } } =
    {};
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
            (field) => field.reference_column_name === key,
          );
          if (matchedField) {
            // Format date or date-time based on data_type
            let formattedValue = value.toString();
            if (matchedField.data_type === 5) {
              try {
                formattedValue = formatDateAndTime(value);
              } catch (e) {
                console.error(
                  `Error formatting date for ${matchedField.title}:`,
                  e,
                );
              }
            } else if (matchedField.data_type === 7) {
              formattedValue = value.toString() === "1" ? "Yes" : "No";
            } else if (matchedField.data_type === 4) {
              try {
                formattedValue = formatDate(value);
              } catch (e) {
                console.error(
                  `Error formatting date for ${matchedField.title}:`,
                  e,
                );
              }
            }
            matchedProductFields[itemId][matchedField.title] = formattedValue;
          }
        }
      });
    });
  }

  useEffect(() => {
    if (orderPrintById?.cart.type === 1) {
      setDynamicColor(
        orderPrintById.companyDetail.quotation_view_color || "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 2) {
      setDynamicColor(
        orderPrintById.companyDetail.order_view_color || "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 3) {
      setDynamicColor(
        orderPrintById.companyDetail.invoice_view_color || "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 4) {
      setDynamicColor(
        orderPrintById.companyDetail.purchase_view_color || "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 5) {
      setDynamicColor(
        orderPrintById.companyDetail.purchase_order_view_color || "#cfcfcf",
      );
    } else {
      setDynamicColor("#cfcfcf");
    }
  });

  useEffect(() => {
    if (orderPrintById?.cart.type === 1) {
      setDynamicTitle(
        orderPrintById.companyDetail.quotation_title || "Quotation",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.quotation_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 2) {
      setDynamicTitle(
        orderPrintById.companyDetail.order_title || "Sales Order",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.order_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 3) {
      setDynamicTitle(
        orderPrintById.companyDetail.invoice_title || "Sales Invoice",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.invoice_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 4) {
      setDynamicTitle(
        orderPrintById.companyDetail.purchase_title || "Purchase Invoice",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.purchase_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 5) {
      setDynamicTitle(
        orderPrintById.companyDetail.purchase_order_title || "Purchase Order",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.purchase_order_view_formate || 1,
      );
    }
  });
  type GroupedItem = {
    item_hsn_code: string | number;
    item_gst: number;
    item_total: number;
  };

  const groupedItems: Record<string, GroupedItem> = (
    orderPrintById?.items ?? []
  ).reduce((acc: Record<string, GroupedItem>, item) => {
    const key = item.item_hsn_code;

    if (!acc[key]) {
      acc[key] = {
        item_hsn_code: item.item_hsn_code,
        item_gst: item.item_gst,
        item_total: 0,
      };
    }

    acc[key].item_total += Number(item.item_total || 0);
    return acc;
  }, {});

  const openPrintSetting = () => {
    if (canViewPrintSetting) {
      if (orderPrintById?.cart?.type && dynamicViewFormate) {
        fetchprintSetting(
          setPrintSetting,
          Number(PRINT_SETTING_TYPE_OBJ[String(7) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
          7,
          MobileToken,
          getID,
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

  useEffect(() => {
    if (orderPrintById?.cart?.type && dynamicViewFormate) {
      fetchprintSetting(setPrintSetting, Number(PRINT_SETTING_TYPE_OBJ[String(7) as keyof typeof PRINT_SETTING_TYPE_OBJ]), 7, MobileToken, getID);
    }
  }, [
    orderPrintById?.cart?.type,
    dynamicViewFormate,
    MobileToken,
    getID,
    setPrintSetting,
  ]);

  const symbolCurrency = "₹";

  return orderPrintById ? (
    <div style={{ position: "relative", height: "100%", minHeight: "100vh" }}>
      {orderPrintById?.companyDetail.company_logo && (
        <img
          style={{
            position: "absolute",
            top: "47%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "221px",
            opacity: "0.05",
            zIndex: "-1",
            pointerEvents: "none",
          }}
          src={orderPrintById?.companyDetail.company_logo}
          alt="Company Watermark"
        />
      )}

      <style>
        {`
    @page {
      size: A5;
      margin: 3mm; /* Reduced margin for more space */
    }

    * {
      box-sizing: border-box;
      font-size:15px !important;
    }

    .print-table {
      width: 142mm !important; /* Increased width to use more of A5 space */
      max-width: 142mm !important;
      margin: 0 auto;
      border-collapse: collapse;
      font-size: 10px !important; /* Slightly smaller font */
      line-height: 1.0 !important; /* Tighter line height */
    }

    .person_name {
           word-break: break-word;  
           white-space: normal;      
           overflow-wrap: anywhere;  
    }

    /* Optimized column widths for A5 with GST columns */
    .print-table th:nth-child(1) { width: 4% !important; } /* No. */
    .print-table th:nth-child(2) { width: 25% !important; } /* Product Description */
    .print-table th:nth-child(3) { width: 8% !important; } /* HSN/SAC */
    .print-table th:nth-child(4) { width: 12% !important; } /* Qty/Unit */
    .print-table th:nth-child(5) { width: 12% !important; } /* Rate */
    .print-table th:nth-child(6) { width: 10% !important; } /* Dis(%) */
    .print-table th:nth-child(7) { width: 12% !important; } /* GST(%) */
    .print-table th:nth-child(8) { width: 18% !important; } /* Amount - increased */

    /* Without GST columns */
    .print-table.no-gst th:nth-child(1) { width: 5% !important; }
    .print-table.no-gst th:nth-child(2) { width: 35% !important; }
    .print-table.no-gst th:nth-child(3) { width: 15% !important; }
    .print-table.no-gst th:nth-child(4) { width: 15% !important; }
    .print-table.no-gst th:nth-child(5) { width: 10% !important; }
    .print-table.no-gst th:nth-child(6) { width: 20% !important; }

    @media print {
      body {
        margin: 0;
        width: 148mm;
        height: auto;
      }

      .person_name {
           word-break: break-word;  
           white-space: normal;      
           overflow-wrap: anywhere;  
        }
      
      .compnay_name {
        font-size: 16px !important;
      }
      
      .print-table {
        width: 142mm !important;
        max-width: 142mm !important;
        margin: 0 auto;
        font-size: 10px !important;
        line-height: 1.0 !important;
        border-collapse: collapse;
      }
      
      .print-table th, .print-table td {
        padding: 1px 2px !important; /* Minimal padding */
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Ensure nested tables don't overflow */
      .print-table table {
        width: 100% !important;
        max-width: 100% !important;
        border-collapse: collapse;
        font-size: inherit !important;
      }
      
      /* Specific fixes for amount columns */
      .print-table .text-right {
        text-align: right !important;
        white-space: nowrap !important;
      }
      
      /* Make sure currency symbols don't wrap */
      .currency-amount {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      *{
          font-size: 12px !important;
      }
    }
        `}
      </style>
      <div className="print-table">
        <div className="content" id="content">
          <table
            className="print-table"
            style={{ backgroundColor: "transparent" }}
          >
            <thead>
              <>
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      border: "1px solid black",
                      textTransform: "uppercase",
                      fontWeight: "bold",
                      padding: "5px",
                      backgroundColor: `${dynamicColor}`,
                    }}
                  >
                    {orderPrintById.companyDetail.company_name}
                  </td>
                </tr>
                {printSetting?.setting_details.headerDetails == true && (
                  <>
                    {" "}
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          // border: "1px solid black",
                          padding: "3px",
                          fontSize: "9px",
                        }}
                      >
                        <b>{"Address : "}</b>
                        {orderPrintById.companyDetail.address}
                        <br />
                        <b>{"Mo. "}</b>
                        {orderPrintById.companyDetail.printed_number} {" , "}
                        <b>{"Email : "}</b>
                        {orderPrintById.companyDetail.company_email}
                        {" , "}
                        <b>{"GSTIN : "}</b>
                        {orderPrintById.companyDetail.gst_number}
                        {" , "}
                        <b>{"State : "}</b>
                        {orderPrintById.companyDetail.state_name}
                      </td>
                    </tr>
                  </>
                )}
              </>
            </thead>
            <tbody>
              <tr>
                <td
                  className="main-colspan-class text-center"
                  colSpan={9}
                  style={{ backgroundColor: `${dynamicColor}` }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <p className="m-0" style={{ width: "33%" }}>
                      &nbsp;
                    </p>
                    <p className="m-0 text-center" style={{ width: "33%" }}>
                      {type == "5" ? (
                        <b>Pending Purchase Order</b>
                      ) : (
                        <b>Pending Sales Order</b>
                      )}
                    </p>
                    <p className="m-0 text-end" style={{ width: "33%" }}>
                      <b>
                        {orderPrintById?.cart.cart_number.length > 0 &&
                          orderPrintById?.cart.cart_number != "XXXXXXX"
                          ? "Original"
                          : "Draft"}
                      </b>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  className="main-colspan-class"
                  style={{ padding: "0" }}
                  colSpan={9}
                >
                  <table
                    border={0}
                    ref={(el) => {
                      if (el) {
                        el.style.setProperty("width", "100%", "important");
                        el.style.setProperty("margin", "0", "important");
                        el.style.setProperty("border", "0px", "important");
                      }
                    }}
                  >
                    <tr>
                      <td
                        style={{
                          verticalAlign: "top",
                          width: "70mm",
                          borderTop: "0px",
                          borderBottom: "0px",
                          maxWidth: "70mm",
                        }}
                        className="without_price_check_customer person_name"
                      >
                        {printSetting?.setting_details.toBuyer == true && (
                          <>
                            <span>
                              <b>TO / BUYER ,</b>
                            </span>
                            <br />
                            <span
                              className="bolde-style"
                              style={{ textTransform: "uppercase" }}
                            >
                              <strong>
                                {orderPrintById?.cart.to_customer_company_name}(
                                {orderPrintById?.cart.to_customer_name})
                                <br />
                                <span
                                  style={{
                                    textTransform: "lowercase",
                                    fontWeight: "500",
                                  }}
                                >
                                  {"Mo. "}
                                  {orderPrintById?.cart.to_customer_phone}
                                  {" - "}
                                  {orderPrintById?.cart.to_customer_email}
                                </span>
                                <br />
                              </strong>
                            </span>
                          </>
                        )}

                        {printSetting?.setting_details.billingAddress ==
                          true && (
                            <>
                              <span className="bolde-style">
                                <b>Billing Address:</b>
                              </span>
                              <br />
                              <span style={{ wordWrap: "break-word" }}>
                                {orderPrintById?.cart.Address}
                              </span>
                              <br />
                            </>
                          )}

                        {printSetting?.setting_details.gstinNo == true && (
                          <>
                            <span>
                              <strong>
                                GSTIN No. :{" "}
                                <span style={{ fontWeight: "normal" }}>
                                  {orderPrintById?.cart.to_customer_gst_number}
                                </span>
                              </strong>
                            </span>
                            {", "}
                          </>
                        )}

                        {printSetting?.setting_details.supplyTo == true && (
                          <>
                            <span>
                              <strong>
                                Supply To :{" "}
                                <span style={{ fontWeight: "normal" }}>
                                  {orderPrintById?.cart.state_name}
                                </span>{" "}
                              </strong>
                            </span>
                          </>
                        )}
                      </td>
                      <td
                        style={{
                          verticalAlign: "top",
                          width: "50%",
                          border: "0px",
                        }}
                      >
                        {printSetting?.setting_details.orderNo == true && (
                          <>
                            <span>
                              <b>{dynamicTitle} No. : </b>
                              {orderPrintById?.cart.cart_number}
                            </span>
                            <br />
                          </>
                        )}

                        {printSetting?.setting_details.orderDateTime ==
                          true && (
                            <>
                              <span>
                                <b>{dynamicTitle} Date & Time :</b>{" "}
                                {orderPrintById?.cart.update_Date_time
                                  ? formatDateAndTime(
                                    orderPrintById?.cart.update_Date_time,
                                  )
                                  : ""}
                              </span>
                              <hr style={{ margin: "0" }} />
                            </>
                          )}

                        {printSetting?.setting_details.contactPerson ==
                          true && (
                            <>
                              <span>
                                <b>Contact Person :</b>{" "}
                                {orderPrintById?.loginDetail?.username}
                              </span>
                            </>
                          )}

                        <br />
                        {Object.entries(matchedCartFields)
                          .filter(([title]) =>
                            customOrderPdfViewById.some(
                              (field) =>
                                field.title === title &&
                                field.print_or_not === 1 &&
                                field.data_type !== 11 &&
                                field.data_type !== 12,
                            ),
                          )
                          .map(([title, value]) => {
                            if (
                              value != "00:00:00" &&
                              value != null &&
                              value != "0000-00-00 00:00:00" &&
                              value != "0000-00-00" &&
                              value != "0" &&
                              value != undefined
                            ) {
                              return (
                                <span key={title}>
                                  <b>{title} :</b> {value}
                                  <br />
                                </span>
                              );
                            }
                            return null;
                          })}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr
                className="text-center"
                style={{ backgroundColor: `${dynamicColor}` }}
              >
                <th className="text-center">No.</th>
                <th className="text-center">Particular Description</th>
                <th className="text-center">
                  {type == "5"
                    ? "Purchase Order Qty/Unit"
                    : "Sales Order Qty/Unit"}
                </th>
                <th className="text-center">
                  {type == "5" ? "Purchase Sales Qty/Unit" : "Sales Qty/Unit"}
                </th>
                <th className="text-center">Pending Qty/Unit</th>
                {printSetting?.setting_details.rate == true && (
                  <th className="text-center">Rate</th>
                )}
              </tr>
              {orderPrintById?.items?.length ? (
                <>
                  {orderPrintById.items.map((item, index) => (
                    <React.Fragment key={index}>
                      {item.item_qty - item.sales_qty == 0 ? (
                        ""
                      ) : (
                        <tr key={index}>
                          <td className="text-center srno">
                            <strong>{index + 1}</strong>
                          </td>
                          <td
                            className="model"
                            style={{
                              position: "relative",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.item_product_name}
                            {item.item_product_code && "-"}
                            {item.item_product_code}
                            <br />
                            {item.item_product_description && (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: `${item.item_product_description}<br/>`,
                                }}
                              />
                            )}
                            {matchedProductFields[item.id] &&
                              Object.entries(matchedProductFields[item.id])
                                .filter(([title]) =>
                                  productCustomOrderPdfViewById.some(
                                    (field) =>
                                      field.title === title &&
                                      field.print_or_not === 1,
                                  ),
                                ) // Filter for print_or_not === 1
                                .map(([title, value]) => {
                                  if (
                                    value != "00:00:00" &&
                                    value != null &&
                                    value != "0000-00-00 00:00:00" &&
                                    value != "0000-00-00" &&
                                    value != "0" &&
                                    value != undefined
                                  ) {
                                    return (
                                      <span key={title}>
                                        <b>{title} :</b> {value}
                                        <br />
                                      </span>
                                    );
                                  }
                                  return null;
                                })}
                          </td>
                          <td className="text-right without_price_check">
                            {item.item_qty}  /
                            {item.item_unit_name}
                          </td>
                          <td className="text-right">
                            {item.sales_qty}  /
                            {item.item_unit_name}
                          </td>

                          <td className="text-right">
                            {item.item_qty - item.sales_qty}  /
                            {item.item_unit_name}
                          </td>
                          {printSetting?.setting_details.rate == true && (
                            <td className="text-right">
                              {item.item_rate !== undefined &&
                                item.item_rate !== null
                                ? `${currency.find(
                                  (c) => c.id === item.currency_id,
                                )?.symbol || "₹"
                                } ` + formatNumber(item.item_rate, 2)
                                : `${currency.find(
                                  (c) => c.id === item.currency_id,
                                )?.symbol || "₹"
                                } ` + "0"}
                            </td>
                          )}
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {Array.from({
                    length: Math.max(
                      0,
                      12 - (orderPrintById.items?.length || 0),
                    ),
                  }).map((_, blankIndex) => (
                    <tr key={`blank-${blankIndex}`}>
                      <td className="text-center srno">
                        {/* <strong>{(orderPrintById.items?.length || 0) + blankIndex + 1}</strong> */}
                      </td>
                      <td className="model"></td>
                      <td className="model"></td>
                      <td className="model"></td>
                      <td className="model"></td>
                      {printSetting?.setting_details.rate == true && (
                        <td className="model"></td>
                      )}
                    </tr>
                  ))}
                </>
              ) : (
                Array.from({ length: 12 }).map((_, blankIndex) => (
                  <tr key={`blank-${blankIndex}`}>
                    <td className="text-center srno"></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))
              )}
              <tr style={{ backgroundColor: `${dynamicColor}` }}>
                <td></td>
                {/* <td></td> */}
                <td className="without_price_check"></td>
                <td className="without_price_check"></td>
                <td className="without_price_check"></td>
                <td className="without_price_check"></td>
                {printSetting?.setting_details.rate == true && (
                  <td className="without_price_check"></td>
                )}

              </tr>
              <tr>
                <td colSpan={8} style={{ padding: 0 }}>
                  <table
                    style={{
                      padding: 0,
                      margin: 0,
                      width: "100%",
                      backgroundColor: "transparent",
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.setProperty("width", "100%", "important");
                        el.style.setProperty("margin", "0", "important");
                        el.style.setProperty("border", "0px", "important");
                      }
                    }}
                  >
                    <tbody>
                      {printSetting?.setting_details.signSignatory == false &&
                        printSetting?.setting_details.termsCondition == false ? (
                        ""
                      ) : (
                        <>
                          <tr
                            className="without_price_check"
                            style={{
                              border: "0px",
                              paddingBottom: "50px",
                              pageBreakInside: "avoid",
                            }}
                          >
                            <td
                              rowSpan={1}
                              style={{
                                borderTop: "1px solid #808080",
                                paddingTop: "5px",
                                borderBottom: "0px",
                                borderInline: "0px",
                                width: "60%",
                                maxWidth: "60%",
                              }}
                            >
                              {printSetting?.setting_details.termsCondition ==
                                true && (
                                  <>
                                    <span className="font-13">
                                      <b>Terms & Condition : </b>
                                    </span>
                                    <p className="font-13">
                                      {orderPrintById?.cart
                                        .cart_terms_and_condition ? (
                                        <SafeHtml
                                          htmlContent={
                                            orderPrintById?.cart
                                              .cart_terms_and_condition
                                          }
                                        />
                                      ) : (
                                        " "
                                      )}
                                    </p>
                                  </>
                                )}
                            </td>
                            <td
                              colSpan={2}
                              style={{
                                borderTop: "1px solid #808080",
                                paddingTop: "5px",
                                borderBottom: "0px",
                                borderInline: "0px",
                                textAlign: "right",
                                verticalAlign: "top",
                              }}
                            >
                              {printSetting?.setting_details.signSignatory ==
                                true && (
                                  <>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                      }}
                                    >
                                      <p style={{ margin: "0", padding: "0" }}>
                                        For,{" "}
                                        {
                                          orderPrintById?.companyDetail
                                            .company_name
                                        }
                                      </p>
                                      <p
                                        style={{
                                          margin: "0",
                                          padding: "0",
                                          paddingBottom: orderPrintById
                                            ?.companyDetail.company_sign
                                            ? "10px"
                                            : "0px",
                                          paddingTop: orderPrintById
                                            ?.companyDetail.company_sign
                                            ? "10px"
                                            : "0px",
                                          marginBottom: orderPrintById
                                            ?.companyDetail.company_sign
                                            ? "0px"
                                            : "100px",
                                        }}
                                      >
                                        {orderPrintById?.companyDetail
                                          .company_sign ? (
                                          <img
                                            style={{
                                              width: "100px",
                                              padding: "0",
                                            }}
                                            src={
                                              orderPrintById?.companyDetail
                                                .company_sign
                                            }
                                            alt="Company Signature"
                                          />
                                        ) : (
                                          ""
                                        )}
                                      </p>
                                      <span>(Authorized Signatory)</span>
                                    </div>
                                  </>
                                )}
                            </td>
                          </tr>
                        </>
                      )}{" "}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="print-setting"
        style={{ position: "absolute", top: "0", right: "0" }}
      >
        <button className="icons " onClick={openPrintSetting}>
          <span className="text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="26px"
              viewBox="0 -960 960 960"
              width="26px"
              fill="#000"
            >
              <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
            </svg>
          </span>
        </button>
      </div>

      {isPrintSettingShow && printSetting && (
        <PrintSettingModal
          show={isPrintSettingShow}
          setShow={setIsPrintSettingShow}
          onHide={() => setIsPrintSettingShow(false)}
          handleSubmit={() => {
            if (orderPrintById?.cart?.type && dynamicViewFormate) {
              fetchprintSetting(
                setPrintSetting,
                Number(PRINT_SETTING_TYPE_OBJ[String(7) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
                7,
                MobileToken,
                getID,
              );
            } else {
              setIsPrintSettingShow(false);
            }
          }}
          orderType={7}
          viewFormate={7}
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

export default PendingPrintViewV1;
