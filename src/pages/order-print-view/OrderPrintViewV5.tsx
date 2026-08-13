//OrderPrintViewV5.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  formatDate,
  formatDateAndTime,
  formatNumber,
  getWhatsappFlag,
} from "../../common/SharedFunction";
import SafeHtml from "../../components/SafeHtml";
import { whatsappTemplateCloudeSend } from "../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  PACKING_FORWARDING_CHARGE_HSN_CODE,
  TRANSPORT_CHARGE_HSN_CODE,
} from "../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../helpers/AppEnum";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import { setUrlParams } from "../../services/axiosInstance";
import { numberToWordsCurrency } from "../../utils/numberToWordsCurrency";
import {
  fetchCustomForm,
  ItemDetails,
  ItemDetails as OrderItemDetails,
} from "../order-pdf-view/OrderPdfController";
import "./OrderPrintView.css";
import {
  fetchCurrency,
  fetchOrderByForPrintIdApi,
  handleDownload,
} from "./orderPrintController";

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

const OrderPrintViewV5 = () => {
  const [orderPrintById, setOrderPrintById] = useState<OrderItemDetails>();
  const [customOrderPdfViewById, setCustomOrderPdfViewById] = useState<
    CustomFormField[]
  >([]);
  const [productCustomOrderPdfViewById, setProductCustomOrderPdfViewById] =
    useState<CustomFormField[]>([]);
  const [dynamicColor, setDynamicColor] = useState("#cfcfcf");
  const [dynamicTitle, setDynamicTitle] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [contactState, setContactState] = useState("");
  const [currency, setCurrency] = useState<ICurrency[]>([]);
  const [orderPrintList, setOrderPrintList] = useState<ItemDetails[]>([]);
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const [whatsappConfigDetail, setWhatsappConfigDetail] = useState<number>(0);

  const { id, MobileToken, getID, printFlag } = useParams();
  const orderIds = useMemo(() => {
    return (
      id
        ?.split(",")
        .map((id) => id.trim())
        .filter((id) => id) || []
    );
  }, [id]);

  useEffect(() => {
    setUrlParams({ MobileToken, getID });

    return () => {
      setUrlParams({});
    };
  }, [MobileToken, getID]);

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
    loadWha();
  }, []);

  const loadWha = async () => {
    const a_application_login_id = getID || localStorage.getItem("UUID");
    const response = await getWhatsappFlag(a_application_login_id);
    setWhatsappConfigDetail(response?.WHATSAPP_PLATEFORM);
  };

  useEffect(() => {
    if (!orderIds.length) return;

    setIsOrderLoading(true);

    Promise.all(
      orderIds.map((singleId) =>
        fetchOrderByForPrintIdApi(Number(singleId), MobileToken, getID),
      ),
    )
      .then((responses) => {
        const validData = responses.filter(
          (item): item is ItemDetails => item !== null,
        );

        setOrderPrintList(validData);

        // backward compatibility (old 300+ usages safe)
        setOrderPrintById(validData[0]);

        setIsOrderLoading(false);
      })
      .catch(() => {
        setIsOrderLoading(false);
      });

    // currency still single call
    fetchCurrency(setCurrency);
  }, [orderIds, MobileToken, getID, setCurrency]);

  let state_id = orderPrintById?.companyDetail.state_id;
  let cart_state_id = orderPrintById?.cart.state_id;

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
        case 7:
          formType = 11;
          break;
        case 8:
          formType = 12;
          break;
        case 9:
          formType = 13;
          break;
        case 12:
          formType = 15;
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
        value !== " " &&
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
          value !== " " &&
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
    } else if (orderPrintById?.cart.type === 6) {
      setDynamicColor(
        orderPrintById.companyDetail.return_sales_invoice_view_color ||
        "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 7) {
      setDynamicColor(
        orderPrintById.companyDetail.return_purchase_invoice_view_color ||
        "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 8) {
      setDynamicColor(
        orderPrintById.companyDetail.inward_view_color || "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 9) {
      setDynamicColor(
        orderPrintById.companyDetail.dispatch_view_color || "#cfcfcf",
      );
    } else if (orderPrintById?.cart.type === 12) {
      setDynamicColor(
        orderPrintById.companyDetail.proforma_invoice_view_color || "#cfcfcf",
      );
    } else {
      setDynamicColor("#cfcfcf");
    }
  }, [orderPrintById]);

  useEffect(() => {
    if (orderPrintById?.cart.type === 1) {
      setDynamicTitle(
        orderPrintById.companyDetail.quotation_title || "Quotation",
      );
    } else if (orderPrintById?.cart.type === 2) {
      setDynamicTitle(
        orderPrintById.companyDetail.order_title || "Sales Order",
      );
    } else if (orderPrintById?.cart.type === 3) {
      setDynamicTitle(
        orderPrintById.companyDetail.invoice_title || "Sales Invoice",
      );
    } else if (orderPrintById?.cart.type === 4) {
      setDynamicTitle(
        orderPrintById.companyDetail.purchase_title || "Purchase Invoice",
      );
    } else if (orderPrintById?.cart.type === 5) {
      setDynamicTitle(
        orderPrintById.companyDetail.purchase_order_title || "Purchase Order",
      );
    } else if (orderPrintById?.cart.type === 6) {
      setDynamicTitle(
        orderPrintById.companyDetail.return_sales_invoice_title ||
        "Return Sales Invoice",
      );
    } else if (orderPrintById?.cart.type === 7) {
      setDynamicTitle(
        orderPrintById.companyDetail.return_purchase_invoice_title ||
        "Return Purchase Invoice",
      );
    } else if (orderPrintById?.cart.type === 8) {
      setDynamicTitle(
        orderPrintById.companyDetail.inward_title ||
        "Goods Received Note (GRN)",
      );
    } else if (orderPrintById?.cart.type === 9) {
      setDynamicTitle(
        orderPrintById.companyDetail.dispatch_title || "Dispatch",
      );
    } else if (orderPrintById?.cart.type === 12) {
      setDynamicTitle(
        orderPrintById.companyDetail.proforma_invoice_title || "Proforma Invoice",
      );
    }
  }, [orderPrintById]);

  type GroupedItem = {
    item_hsn_code: string | number;
    item_gst: number;
    item_total: number;
  };

  // Filter items with valid HSN codes
  const groupedItems: Record<string, GroupedItem> = (
    orderPrintById?.items ?? []
  ).reduce((acc: Record<string, GroupedItem>, item) => {
    const hsn = item.item_hsn_code.trim();
    const gstRate = Number(item.item_gst) || 0;

    const key = `${hsn}|||${gstRate}`;

    if (!acc[key]) {
      acc[key] = {
        item_hsn_code: hsn == "" ? "Unknown" : hsn,
        item_gst: gstRate,
        item_total: 0,
      };
    }

    acc[key].item_total += Number(item.item_total || 0);
    return acc;
  }, {});

  // Check if there are any items with HSN codes or packing/transport charges with HSN
  const hasHsnItems = Object.keys(groupedItems).length > 0;
  const hasPackingChargeWithHsn =
    orderPrintById?.cart?.packing_forwarding_charge !== undefined &&
    orderPrintById?.cart?.packing_forwarding_charge > 0 &&
    PACKING_FORWARDING_CHARGE_HSN_CODE;
  const hasTransportChargeWithHsn =
    orderPrintById?.cart?.transport_charge !== undefined &&
    orderPrintById?.cart?.transport_charge > 0 &&
    TRANSPORT_CHARGE_HSN_CODE;
  const showGstSummary =
    orderPrintById?.cart.gst_amt != 0 &&
    (hasHsnItems || hasPackingChargeWithHsn || hasTransportChargeWithHsn);

  const symbolCurrency = "₹";

  useEffect(() => {
    if (orderPrintById && !printFlag) {
      const timer = setTimeout(() => {
        window.print();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [orderPrintById]);

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

  const canPdfInward = useCheckUserPermission(
    PAGE_ID.INWARD,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfDispatch = useCheckUserPermission(
    PAGE_ID.DISPATCH,
    PERMISSION_TYPE.SHARE,
  );
  const canPdfProfomaInvoice = useCheckUserPermission(
    PAGE_ID.PROFOMA_INVOICE,
    PERMISSION_TYPE.SHARE,
  );

  const openPdf = () => {
    const permissionMap: Record<number, boolean> = {
      1: canPdfQuo,
      2: canPdfOrder,
      3: canPdfInv,
      4: canPdfPurchase,
      5: canPdfPurchaseOrder,
      6: canPdfReturnSalesInvoice,
      7: canPdfInward,
      8: canPdfDispatch,
      12: canPdfProfomaInvoice,
    };
    if (orderPrintById?.shareRights == true) {
      handleDownload(id, MobileToken, getID, "downloadPdf");
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const shareWhatsapp = () => {
    const permissionMap: Record<number, boolean> = {
      1: canPdfQuo,
      2: canPdfOrder,
      3: canPdfInv,
      4: canPdfPurchase,
      5: canPdfPurchaseOrder,
      6: canPdfReturnSalesInvoice,
      7: canPdfInward,
      8: canPdfDispatch,
      12: canPdfProfomaInvoice,
    };
    if (orderPrintById?.shareRights == true) {
      if (whatsappConfigDetail == 1) {
        handleDownload(id, MobileToken, getID, "shareInWhatsapp");
      } else if (whatsappConfigDetail == 2) {
        whatsappTemplateCloudeSend(
          { orderId: id, appId: getID },
          `carts_${orderPrintById?.cart?.type}`,
          {
            customer_mobile_number: String(
              orderPrintById?.cart?.to_customer_phone,
            ),
          },
          getID,
        );
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  return isOrderLoading || !orderPrintList?.length ? (
    <div
      style={{
        position: "relative",
        // width: "80mm",
        minHeight: "100vh",
        margin: "0 auto",
        fontSize: "10px",
        lineHeight: "1.2",
      }}
    >
      <style>
        {`
        
          @page {
            width: 80mm !important;
            margin: 2mm 1mm;
          }
             .person_name {
           word-break: break-word;  
           white-space: nowrap;   
           overflow:hidden;
           text-overflow:ellipsis;   
        }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .print-table th, .print-table td {
            border: 1px solid black;
            padding: 3px;
            font-size: 10px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .print-table th {
            background-color: ${dynamicColor};
            text-align: center;
          }
          .text-center {
            text-align: center !important;
          }
          .text-right {
            text-align: right !important;
          }
          .text-left {
            text-align: left !important;
          }
          .main-colspan-class {
            padding: 0 !important;
          }
          .srno {
            width: 10%;
          }
          .model {
            width: 40%;
          }
          .without_price_check {
            width: 25%;
          }
          .without_price_check_customer {
            width: 40%;
            padding-right: 5px !important;
          }
          .bolde-style {
            font-weight: bold;
          }
          .font-13 {
            font-size: 10px !important;
          }
          .content {
            width: 100%;
            max-width: 80mm;
          }
          hr {
            margin: 2px 0;
            border: 0;
            border-top: 1px solid black;
          }
          @media print {
           .person_name {
           word-break: break-word;  
           white-space: nowrap;   
           overflow:hidden;
           text-overflow:ellipsis; 
        }
            body, .print-table, .content {
              width: 80mm !important;
              max-width: 80mm !important;
            }
            .print-table th, .print-table td {
              font-size: 10px ;
              padding: 2px !important;
            }
            .companyName{
              font-size: 20px !important;
            }
          }
            *{
          border:0px !important;
        }
          .companyName{
              font-size: 20px !important;
            }
          hr {
            border-top: 2px solid #000 !important;
             height: 2px;
             width:100%
        }
          .content td,th {
            padding: 2px 5px !important;
             height: 5px;
          }

              .person_name {
           word-break: break-word;  
           white-space: nowrap;   
           overflow:hidden;
           text-overflow:ellipsis;   
        }
        `}
      </style>
      <div className="content" id="content">
        <table className="print-table">
          <thead>
            <>
              <tr>
                <td
                  className="companyName"
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    border: "1px solid black",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    padding: "3px",
                    backgroundColor: dynamicColor,
                    // fontSize: "40px ",
                  }}
                >
                  {orderPrintById?.companyDetail.company_name}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    border: "1px solid black",
                    padding: "3px",
                  }}
                >
                  {orderPrintById?.companyDetail.address}
                  <br />
                  <b>Mo.</b> {orderPrintById?.companyDetail.printed_number} ,{" "}
                  <b>Email:</b> {orderPrintById?.companyDetail.company_email} ,{" "}
                  <b>GSTIN:</b> {orderPrintById?.companyDetail.gst_number} ,{" "}
                  <b>State:</b> {orderPrintById?.companyDetail.state_name}
                </td>
              </tr>
            </>
          </thead>
          <tbody>
            <tr style={{ pageBreakBefore: "always" }}>
              <td
                className="main-colspan-class text-center"
                colSpan={4}
                style={{ backgroundColor: dynamicColor }}
              >
                <hr />
                <p className="m-0">
                  <b>{dynamicTitle}</b>
                </p>
                <hr />
              </td>
            </tr>
            <tr>
              <td
                className="main-colspan-class"
                style={{ padding: "0" }}
                colSpan={4}
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
                        width: "50%",
                        borderTop: "0px",
                        borderBottom: "0px",
                        paddingRight: "5px",
                      }}
                      className="without_price_check_customer"
                    >
                      <span>
                        <b>Customer Name:</b>
                      </span>
                      <br />
                      <span>
                        <b>Contact No.:</b>
                      </span>
                      <br />
                      <span>
                        <b>{dynamicTitle} No.:</b>
                      </span>
                      <br />
                      <span>
                        <b>{dynamicTitle} Date & Time:</b>
                      </span>
                      <br />

                      <span>
                        <b>Team Member:</b>
                      </span>
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
                                <b>{title}:</b>
                                <br />
                              </span>
                            );
                          }
                          return null;
                        })}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        borderTop: "0px",
                        borderBottom: "0px",
                        width: "30mm",
                        maxWidth: "30mm",
                      }}
                      className="person_name"
                    >
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
                            {orderPrintById?.cart.to_customer_phone}
                          </span>
                          <br />
                        </strong>
                      </span>
                      <span>{orderPrintById?.cart.cart_number}</span>
                      <br />
                      <span>
                        {orderPrintById?.cart.update_Date_time
                          ? formatDateAndTime(
                            orderPrintById?.cart.update_Date_time,
                          )
                          : ""}
                      </span>
                      <br />
                      <span>{orderPrintById?.loginDetail?.username}</span>
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
                                {value}
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
            <tr>
              <td
                colSpan={4}
                style={{ height: "0px", padding: "0px", margin: "0px" }}
              >
                <hr />
              </td>
            </tr>
            <tr
              className="text-center"
              style={{ backgroundColor: dynamicColor }}
            >
              {/* <th className="text-center srno">No.</th> */}
              <th className="text-left model" colSpan={2}>
                Particular Description
              </th>
              <th className="text-center without_price_check">Qty/Unit</th>
              <th className="text-center without_price_check">Amount</th>
            </tr>
            <tr>
              <td
                colSpan={4}
                style={{ height: "0px", padding: "0px", margin: "0px" }}
              >
                <hr />
              </td>
            </tr>
            {orderPrintById?.items?.length && (
              <>
                {orderPrintById.items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr key={index}>
                      <td
                        colSpan={2}
                        className="model"
                        style={{
                          position: "relative",
                          wordBreak: "break-word",
                        }}
                      >
                        {index + 1}
                        {")"}
                        {"    "}
                        {item.item_product_name}
                        {item.item_product_code && (
                          <>
                            <br /> <strong>Product Code:</strong>
                            {item.item_product_code}
                          </>
                        )}
                        <br />
                        {item.item_product_description && (
                          <span>
                            <SafeHtml
                              htmlContent={item.item_product_description?.replace(
                                /\n/g,
                                "<br>",
                              )}
                            />
                          </span>
                        )}
                        {item.serial_numbers &&
                          item.serial_numbers.length > 0 && (
                            <>
                              {/* <br /> */}
                              <strong>SN No:</strong>
                              <br />

                              {/* {item.serial_numbers.map((sn, index) => (
                                              <span key={index}>
                                                {index + 1}. {sn}
                                                <br />
                                              </span>
                                            ))} */}
                              {item.serial_numbers.map((sn, index) => (
                                <span key={index}>
                                  {sn}
                                  <br />
                                </span>
                              ))}
                            </>
                          )}
                        {matchedProductFields[item.id] &&
                          Object.entries(matchedProductFields[item.id])
                            .filter(([title]) =>
                              productCustomOrderPdfViewById.some(
                                (field) =>
                                  field.title === title &&
                                  field.print_or_not === 1,
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
                                    <b>{title}:</b> {value}
                                    <br />
                                  </span>
                                );
                              }
                              return null;
                            })}
                      </td>
                      <td className="text-right without_price_check">
                        {item.item_qty} / {item.item_unit_name}
                      </td>
                      <td className="text-right now-rap-white-space without_price_check">
                        {item.item_total && item.item_gst !== undefined
                          ? `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` + formatNumber(item.item_total, 2)
                          : `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` + "0"}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </>
            )}
            <tr>
              <td
                colSpan={4}
                style={{ height: "0px", padding: "0px", margin: "0px" }}
              >
                <hr />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: 0 }}>
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
                    <tr>
                      <td
                        className="text-left font-13"
                        style={{ borderTop: "0", borderLeft: "0" }}
                      >
                        <strong>Sub Total</strong>
                      </td>
                      <td
                        className="text-right now-rap-white-space font-13"
                        style={{ borderTop: "0", borderRight: "0" }}
                      >
                        <strong>
                          {orderPrintById?.cart.total_amt
                            ? `${currency.find(
                              (curr) =>
                                curr.id ===
                                orderPrintById?.cart.currency_id,
                            )?.symbol || "₹"
                            } ` +
                            formatNumber(orderPrintById?.cart.total_amt, 2)
                            : `${currency.find(
                              (curr) =>
                                curr.id ===
                                orderPrintById?.cart.currency_id,
                            )?.symbol || "₹"
                            } ` + "0"}
                        </strong>
                      </td>
                    </tr>
                    {/* <tr>
                      <td
                        className="text-left without_price_check"
                        style={{ borderLeft: "0" }}
                      >
                        <b>Packing Forwarding charge</b>
                      </td>
                      <td
                        className="text-right font-13 without_price_check"
                        style={{ borderRight: "0px" }}
                      >
                        {orderPrintById?.cart.packing_forwarding_charge
                          ? `${
                              currency.find(
                                (curr) =>
                                  curr.id === orderPrintById?.cart.currency_id
                              )?.symbol || "₹"
                            } ` +
                            formatNumber(
                              orderPrintById?.cart.packing_forwarding_charge,
                              2
                            )
                          : ""}
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="text-left font-13 without_price_check"
                        style={{ borderLeft: "0" }}
                      >
                        <strong>Transport charge</strong>
                      </td>
                      <td
                        className="text-right font-13 without_price_check"
                        style={{ borderRight: "0px", borderLeft: "0" }}
                      >
                        {orderPrintById?.cart.transport_charge
                          ? `${
                              currency.find(
                                (curr) =>
                                  curr.id === orderPrintById?.cart.currency_id
                              )?.symbol || "₹"
                            } ` +
                            formatNumber(
                              orderPrintById?.cart.transport_charge,
                              2
                            )
                          : ""}
                      </td>
                    </tr> */}
                    <tr>
                      <td
                        className="text-left font-13 without_price_check"
                        style={{ borderLeft: "0" }}
                      >
                        <strong>Discount</strong>
                      </td>
                      <td
                        className="text-right now-rap-white-space font-13 without_price_check"
                        style={{ borderRight: "0px", borderLeft: "0" }}
                      >
                        {orderPrintById?.cart
                          ? `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` + formatNumber(0, 2)
                          : `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` + "0"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="text-left font-13 without_price_check"
                        style={{ borderLeft: "0" }}
                      >
                        <strong>Total Taxable Amount</strong>
                      </td>
                      <td
                        className="text-right now-rap-white-space font-13 without_price_check"
                        style={{ borderRight: "0px" }}
                      >
                        {orderPrintById?.cart.taxable_amt
                          ? `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` +
                          formatNumber(orderPrintById?.cart.taxable_amt, 2)
                          : `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` + "0"}
                      </td>
                    </tr>
                    <tr>
                      {orderPrintById?.cart.state_id !=
                        orderPrintById?.companyDetail.state_id ? (
                        <>
                          <td
                            className="text-left without_price_check"
                            style={{ borderLeft: "0" }}
                          >
                            {orderPrintById?.cart.gst_amt ? (
                              <strong>IGST</strong>
                            ) : (
                              ""
                            )}
                          </td>
                          <td
                            className="text-right now-rap-white-space font-13 without_price_check"
                            style={{ borderRight: "0px" }}
                          >
                            {orderPrintById?.cart.gst_amt
                              ? `${currency.find(
                                (curr) =>
                                  curr.id ===
                                  orderPrintById?.cart.currency_id,
                              )?.symbol || "₹"
                              } ` +
                              formatNumber(orderPrintById?.cart.gst_amt, 2)
                              : `${currency.find(
                                (curr) =>
                                  curr.id ===
                                  orderPrintById?.cart.currency_id,
                              )?.symbol || "₹"
                              } ` + "0"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            className="text-left without_price_check"
                            style={{ borderLeft: "0" }}
                          >
                            {orderPrintById?.cart.gst_amt ? (
                              <strong>CGST</strong>
                            ) : (
                              ""
                            )}
                          </td>
                          <td
                            className="text-right now-rap-white-space font-13 without_price_check"
                            style={{ borderRight: "0px" }}
                          >
                            {orderPrintById?.cart.gst_amt
                              ? `${currency.find(
                                (curr) =>
                                  curr.id ===
                                  orderPrintById?.cart.currency_id,
                              )?.symbol || "₹"
                              } ` +
                              formatNumber(
                                orderPrintById?.cart.gst_amt / 2,
                                2,
                              )
                              : ""}
                          </td>
                        </>
                      )}
                    </tr>
                    {orderPrintById?.cart.state_id ==
                      orderPrintById?.companyDetail.state_id ? (
                      <>
                        <tr>
                          <td
                            className="text-left without_price_check"
                            style={{ borderLeft: "0" }}
                          >
                            {orderPrintById?.cart.gst_amt ? (
                              <strong>SGST</strong>
                            ) : (
                              ""
                            )}
                          </td>
                          <td
                            className="text-right now-rap-white-space font-13 without_price_check"
                            style={{ borderRight: "0px" }}
                          >
                            {orderPrintById?.cart.gst_amt
                              ? `${currency.find(
                                (curr) =>
                                  curr.id ===
                                  orderPrintById?.cart.currency_id,
                              )?.symbol || "₹"
                              } ` +
                              formatNumber(
                                orderPrintById?.cart.gst_amt / 2,
                                2,
                              )
                              : ""}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <></>
                    )}
                    {cart_state_id == state_id ? (
                      <></>
                    ) : (
                      <tr>
                        <td className="text-left without_price_check"></td>
                        <td
                          className="text-right without_price_check"
                          style={{ borderRight: "0px" }}
                        ></td>
                      </tr>
                    )}
                    <tr className="without_price_check">
                      <td style={{ borderLeft: "0" }}>
                        <strong>Round Off</strong>
                      </td>
                      <td
                        className="text-right now-rap-white-space"
                        style={{ borderRight: "0px" }}
                      >
                        {orderPrintById?.cart.round_off
                          ? `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` +
                          formatNumber(orderPrintById?.cart.round_off, 2)
                          : `${currency.find(
                            (curr) =>
                              curr.id === orderPrintById?.cart.currency_id,
                          )?.symbol || "₹"
                          } ` + "0"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={4}
                        style={{ height: "0px", padding: "0px", margin: "0px" }}
                      >
                        <hr />
                      </td>
                    </tr>
                    <tr className="without_price_check">
                      <td
                        style={{
                          fontSize: "12px",
                          borderBottom: "0px",
                          borderLeft: "0",
                        }}
                      >
                        <strong>Grand Total</strong>
                      </td>
                      <td
                        className="text-right now-rap-white-space"
                        style={{
                          fontSize: "12px",
                          borderBottom: "0px",
                          borderRight: "0px",
                          width: "25%",
                        }}
                      >
                        <strong>
                          {orderPrintById?.cart.grand_total
                            ? `${currency.find(
                              (curr) =>
                                curr.id ===
                                orderPrintById?.cart.currency_id,
                            )?.symbol || "₹"
                            } ` +
                            formatNumber(orderPrintById?.cart.grand_total, 2)
                            : `${currency.find(
                              (curr) =>
                                curr.id ===
                                orderPrintById?.cart.currency_id,
                            )?.symbol || "₹"
                            } ` + "0"}
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={4}
                        style={{ height: "0px", padding: "0px", margin: "0px" }}
                      >
                        <hr />
                      </td>
                    </tr>
                    <tr
                      className="without_price_check"
                      style={{
                        border: "0px",
                        paddingBottom: "20px",
                        textAlign: "center",
                      }}
                    >
                      <td colSpan={4} style={{ border: "0" }}>
                        Thank You For Shopping!
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className="print-setting"
        style={{ position: "absolute", top: "0", right: "0" }}
      >
        <button className="icons " onClick={openPdf}>
          <span className="text-white">
            <svg
              height="28px"
              viewBox="0 -960 960 960"
              width="28px"
              fill="#000"
            >
              <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
            </svg>
          </span>
        </button>
        <button
          className="icons"
          onClick={shareWhatsapp}
          title="share in whatsapp"
        >
          <span style={{ color: "black" }}>
            <i className="bi bi-whatsapp" style={{ fontSize: "22px" }}></i>
          </span>
        </button>
      </div>
    </div>
  ) : (
    <>
      {orderPrintList.map((orderPrintById, index) => (
        <div key={index}>
          <div
            style={{
              position: "relative",
              // width: "80mm",
              minHeight: "100vh",
              margin: "0 auto",
              fontSize: "10px",
              lineHeight: "1.2",
            }}
          >
            <style>
              {`
        
          @page {
            width: 80mm !important;
            margin: 2mm 1mm;
          }
             .person_name {
           word-break: break-word;  
           white-space: nowrap;   
           overflow:hidden;
           text-overflow:ellipsis;   
        }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .print-table th, .print-table td {
            border: 1px solid black;
            padding: 3px;
            font-size: 10px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .print-table th {
            background-color: ${dynamicColor};
            text-align: center;
          }
          .text-center {
            text-align: center !important;
          }
          .text-right {
            text-align: right !important;
          }
          .text-left {
            text-align: left !important;
          }
          .main-colspan-class {
            padding: 0 !important;
          }
          .srno {
            width: 10%;
          }
          .model {
            width: 40%;
          }
          .without_price_check {
            width: 25%;
          }
          .without_price_check_customer {
            width: 40%;
            padding-right: 5px !important;
          }
          .bolde-style {
            font-weight: bold;
          }
          .font-13 {
            font-size: 10px !important;
          }
          .content {
            width: 100%;
            max-width: 80mm;
          }
          hr {
            margin: 2px 0;
            border: 0;
            border-top: 1px solid black;
          }
          @media print {
           .person_name {
           word-break: break-word;  
           white-space: nowrap;   
           overflow:hidden;
           text-overflow:ellipsis; 
        }
            body, .print-table, .content {
              width: 80mm !important;
              max-width: 80mm !important;
            }
            .print-table th, .print-table td {
              font-size: 10px ;
              padding: 2px !important;
            }
            .companyName{
              font-size: 20px !important;
            }
          }
            *{
          border:0px !important;
        }
          .companyName{
              font-size: 20px !important;
            }
          hr {
            border-top: 2px solid #000 !important;
             height: 2px;
             width:100%
        }
          .content td,th {
            padding: 2px 5px !important;
             height: 5px;
          }

              .person_name {
           word-break: break-word;  
           white-space: nowrap;   
           overflow:hidden;
           text-overflow:ellipsis;   
        }
        `}
            </style>
            <div className="content" id="content">
              <table className="print-table">
                <thead>
                  <>
                    <tr>
                      <td
                        className="companyName"
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          border: "1px solid black",
                          textTransform: "uppercase",
                          fontWeight: "bold",
                          padding: "3px",
                          backgroundColor: dynamicColor,
                          // fontSize: "40px ",
                        }}
                      >
                        {orderPrintById.companyDetail.company_name}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          border: "1px solid black",
                          padding: "3px",
                        }}
                      >
                        {orderPrintById.companyDetail.address}
                        <br />
                        <b>Mo.</b>{" "}
                        {orderPrintById.companyDetail.printed_number} ,{" "}
                        <b>Email:</b>{" "}
                        {orderPrintById.companyDetail.company_email} ,{" "}
                        <b>GSTIN:</b> {orderPrintById.companyDetail.gst_number}{" "}
                        , <b>State:</b>{" "}
                        {orderPrintById.companyDetail.state_name}
                      </td>
                    </tr>
                  </>
                </thead>
                <tbody>
                  <tr style={{ pageBreakBefore: "always" }}>
                    <td
                      className="main-colspan-class text-center"
                      colSpan={4}
                      style={{ backgroundColor: dynamicColor }}
                    >
                      <hr />
                      <p className="m-0">
                        <b>{dynamicTitle}</b>
                      </p>
                      <hr />
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="main-colspan-class"
                      style={{ padding: "0" }}
                      colSpan={4}
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
                              width: "50%",
                              borderTop: "0px",
                              borderBottom: "0px",
                              paddingRight: "5px",
                            }}
                            className="without_price_check_customer"
                          >
                            <span>
                              <b>Customer Name:</b>
                            </span>
                            <br />
                            <span>
                              <b>Contact No.:</b>
                            </span>
                            <br />
                            <span>
                              <b>{dynamicTitle} No.:</b>
                            </span>
                            <br />
                            <span>
                              <b>{dynamicTitle} Date & Time:</b>
                            </span>
                            <br />

                            <span>
                              <b>Team Member:</b>
                            </span>
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
                                      <b>{title}:</b>
                                      <br />
                                    </span>
                                  );
                                }
                                return null;
                              })}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              borderTop: "0px",
                              borderBottom: "0px",
                              width: "30mm",
                              maxWidth: "30mm",
                            }}
                            className="person_name"
                          >
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
                                  {orderPrintById?.cart.to_customer_phone}
                                </span>
                                <br />
                              </strong>
                            </span>
                            <span>{orderPrintById?.cart.cart_number}</span>
                            <br />
                            <span>
                              {orderPrintById?.cart.update_Date_time
                                ? formatDateAndTime(
                                  orderPrintById?.cart.update_Date_time,
                                )
                                : ""}
                            </span>
                            <br />
                            <span>{orderPrintById?.loginDetail?.username}</span>
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
                                      {value}
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
                  <tr>
                    <td
                      colSpan={4}
                      style={{ height: "0px", padding: "0px", margin: "0px" }}
                    >
                      <hr />
                    </td>
                  </tr>
                  <tr
                    className="text-center"
                    style={{ backgroundColor: dynamicColor }}
                  >
                    {/* <th className="text-center srno">No.</th> */}
                    <th className="text-left model" colSpan={2}>
                      Particular Description
                    </th>
                    <th className="text-center without_price_check">
                      Qty/Unit
                    </th>
                    <th className="text-center without_price_check">Amount</th>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      style={{ height: "0px", padding: "0px", margin: "0px" }}
                    >
                      <hr />
                    </td>
                  </tr>
                  {orderPrintById?.items?.length && (
                    <>
                      {orderPrintById.items.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr key={index}>
                            <td
                              colSpan={2}
                              className="model"
                              style={{
                                position: "relative",
                                wordBreak: "break-word",
                              }}
                            >
                              {index + 1}
                              {")"}
                              {"    "}
                              {item.item_product_name}
                              {item.item_product_code && (
                                <>
                                  <br /> <strong>Product Code:</strong>
                                  {item.item_product_code}
                                </>
                              )}
                              <br />
                              {item.item_product_description && (
                                <span>
                                  <SafeHtml
                                    htmlContent={item.item_product_description?.replace(
                                      /\n/g,
                                      "<br>",
                                    )}
                                  />
                                </span>
                              )}
                              {item.serial_numbers &&
                                item.serial_numbers.length > 0 && (
                                  <>
                                    {/* <br /> */}
                                    <strong>SN No:</strong>
                                    <br />

                                    {/* {item.serial_numbers.map((sn, index) => (
                                              <span key={index}>
                                                {index + 1}. {sn}
                                                <br />
                                              </span>
                                            ))} */}
                                    {item.serial_numbers.map((sn, index) => (
                                      <span key={index}>
                                        {sn}
                                        <br />
                                      </span>
                                    ))}
                                  </>
                                )}
                              {matchedProductFields[item.id] &&
                                Object.entries(matchedProductFields[item.id])
                                  .filter(([title]) =>
                                    productCustomOrderPdfViewById.some(
                                      (field) =>
                                        field.title === title &&
                                        field.print_or_not === 1,
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
                                          <b>{title}:</b> {value}
                                          <br />
                                        </span>
                                      );
                                    }
                                    return null;
                                  })}
                            </td>
                            <td className="text-right without_price_check">
                              {item.item_qty} / {item.item_unit_name}
                            </td>
                            <td className="text-right now-rap-white-space without_price_check">
                              {item.item_total && item.item_gst !== undefined
                                ? `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` + formatNumber(item.item_total, 2)
                                : `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` + "0"}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </>
                  )}
                  <tr>
                    <td
                      colSpan={4}
                      style={{ height: "0px", padding: "0px", margin: "0px" }}
                    >
                      <hr />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ padding: 0 }}>
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
                          <tr>
                            <td
                              className="text-left font-13"
                              style={{ borderTop: "0", borderLeft: "0" }}
                            >
                              <strong>Sub Total</strong>
                            </td>
                            <td
                              className="text-right now-rap-white-space font-13"
                              style={{ borderTop: "0", borderRight: "0" }}
                            >
                              <strong>
                                {orderPrintById?.cart.total_amt
                                  ? `${currency.find(
                                    (curr) =>
                                      curr.id ===
                                      orderPrintById?.cart.currency_id,
                                  )?.symbol || "₹"
                                  } ` +
                                  formatNumber(
                                    orderPrintById?.cart.total_amt,
                                    2,
                                  )
                                  : `${currency.find(
                                    (curr) =>
                                      curr.id ===
                                      orderPrintById?.cart.currency_id,
                                  )?.symbol || "₹"
                                  } ` + "0"}
                              </strong>
                            </td>
                          </tr>
                          {/* <tr>
                      <td
                        className="text-left without_price_check"
                        style={{ borderLeft: "0" }}
                      >
                        <b>Packing Forwarding charge</b>
                      </td>
                      <td
                        className="text-right font-13 without_price_check"
                        style={{ borderRight: "0px" }}
                      >
                        {orderPrintById?.cart.packing_forwarding_charge
                          ? `${
                              currency.find(
                                (curr) =>
                                  curr.id === orderPrintById?.cart.currency_id
                              )?.symbol || "₹"
                            } ` +
                            formatNumber(
                              orderPrintById?.cart.packing_forwarding_charge,
                              2
                            )
                          : ""}
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="text-left font-13 without_price_check"
                        style={{ borderLeft: "0" }}
                      >
                        <strong>Transport charge</strong>
                      </td>
                      <td
                        className="text-right font-13 without_price_check"
                        style={{ borderRight: "0px", borderLeft: "0" }}
                      >
                        {orderPrintById?.cart.transport_charge
                          ? `${
                              currency.find(
                                (curr) =>
                                  curr.id === orderPrintById?.cart.currency_id
                              )?.symbol || "₹"
                            } ` +
                            formatNumber(
                              orderPrintById?.cart.transport_charge,
                              2
                            )
                          : ""}
                      </td>
                    </tr> */}
                          <tr>
                            <td
                              className="text-left font-13 without_price_check"
                              style={{ borderLeft: "0" }}
                            >
                              <strong>Discount</strong>
                            </td>
                            <td
                              className="text-right now-rap-white-space font-13 without_price_check"
                              style={{ borderRight: "0px", borderLeft: "0" }}
                            >
                              {orderPrintById?.cart
                                ? `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` + formatNumber(0, 2)
                                : `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` + "0"}
                            </td>
                          </tr>
                          <tr>
                            <td
                              className="text-left font-13 without_price_check"
                              style={{ borderLeft: "0" }}
                            >
                              <strong>Total Taxable Amount</strong>
                            </td>
                            <td
                              className="text-right now-rap-white-space font-13 without_price_check"
                              style={{ borderRight: "0px" }}
                            >
                              {orderPrintById?.cart.taxable_amt
                                ? `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` +
                                formatNumber(
                                  orderPrintById?.cart.taxable_amt,
                                  2,
                                )
                                : `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` + "0"}
                            </td>
                          </tr>
                          <tr>
                            {orderPrintById?.cart.state_id !=
                              orderPrintById?.companyDetail.state_id ? (
                              <>
                                <td
                                  className="text-left without_price_check"
                                  style={{ borderLeft: "0" }}
                                >
                                  {orderPrintById.cart.gst_amt ? (
                                    <strong>IGST</strong>
                                  ) : (
                                    ""
                                  )}
                                </td>
                                <td
                                  className="text-right now-rap-white-space font-13 without_price_check"
                                  style={{ borderRight: "0px" }}
                                >
                                  {orderPrintById?.cart.gst_amt
                                    ? `${currency.find(
                                      (curr) =>
                                        curr.id ===
                                        orderPrintById?.cart.currency_id,
                                    )?.symbol || "₹"
                                    } ` +
                                    formatNumber(
                                      orderPrintById?.cart.gst_amt,
                                      2,
                                    )
                                    : `${currency.find(
                                      (curr) =>
                                        curr.id ===
                                        orderPrintById?.cart.currency_id,
                                    )?.symbol || "₹"
                                    } ` + "0"}
                                </td>
                              </>
                            ) : (
                              <>
                                <td
                                  className="text-left without_price_check"
                                  style={{ borderLeft: "0" }}
                                >
                                  {orderPrintById.cart.gst_amt ? (
                                    <strong>CGST</strong>
                                  ) : (
                                    ""
                                  )}
                                </td>
                                <td
                                  className="text-right now-rap-white-space font-13 without_price_check"
                                  style={{ borderRight: "0px" }}
                                >
                                  {orderPrintById?.cart.gst_amt
                                    ? `${currency.find(
                                      (curr) =>
                                        curr.id ===
                                        orderPrintById?.cart.currency_id,
                                    )?.symbol || "₹"
                                    } ` +
                                    formatNumber(
                                      orderPrintById?.cart.gst_amt / 2,
                                      2,
                                    )
                                    : ""}
                                </td>
                              </>
                            )}
                          </tr>
                          {orderPrintById?.cart.state_id ==
                            orderPrintById?.companyDetail.state_id ? (
                            <>
                              <tr>
                                <td
                                  className="text-left without_price_check"
                                  style={{ borderLeft: "0" }}
                                >
                                  {orderPrintById.cart.gst_amt ? (
                                    <strong>SGST</strong>
                                  ) : (
                                    ""
                                  )}
                                </td>
                                <td
                                  className="text-right now-rap-white-space font-13 without_price_check"
                                  style={{ borderRight: "0px" }}
                                >
                                  {orderPrintById?.cart.gst_amt
                                    ? `${currency.find(
                                      (curr) =>
                                        curr.id ===
                                        orderPrintById?.cart.currency_id,
                                    )?.symbol || "₹"
                                    } ` +
                                    formatNumber(
                                      orderPrintById?.cart.gst_amt / 2,
                                      2,
                                    )
                                    : ""}
                                </td>
                              </tr>
                            </>
                          ) : (
                            <></>
                          )}
                          {cart_state_id == state_id ? (
                            <></>
                          ) : (
                            <tr>
                              <td className="text-left without_price_check"></td>
                              <td
                                className="text-right without_price_check"
                                style={{ borderRight: "0px" }}
                              ></td>
                            </tr>
                          )}
                          <tr className="without_price_check">
                            <td style={{ borderLeft: "0" }}>
                              <strong>Round Off</strong>
                            </td>
                            <td
                              className="text-right now-rap-white-space"
                              style={{ borderRight: "0px" }}
                            >
                              {orderPrintById?.cart.round_off
                                ? `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` +
                                formatNumber(
                                  orderPrintById?.cart.round_off,
                                  2,
                                )
                                : `${currency.find(
                                  (curr) =>
                                    curr.id ===
                                    orderPrintById?.cart.currency_id,
                                )?.symbol || "₹"
                                } ` + "0"}
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                height: "0px",
                                padding: "0px",
                                margin: "0px",
                              }}
                            >
                              <hr />
                            </td>
                          </tr>
                          <tr className="without_price_check">
                            <td
                              style={{
                                fontSize: "12px",
                                borderBottom: "0px",
                                borderLeft: "0",
                              }}
                            >
                              <strong>Grand Total</strong>
                            </td>
                            <td
                              className="text-right now-rap-white-space"
                              style={{
                                fontSize: "12px",
                                borderBottom: "0px",
                                borderRight: "0px",
                                width: "25%",
                              }}
                            >
                              <strong>
                                {orderPrintById?.cart.grand_total
                                  ? `${currency.find(
                                    (curr) =>
                                      curr.id ===
                                      orderPrintById?.cart.currency_id,
                                  )?.symbol || "₹"
                                  } ` +
                                  formatNumber(
                                    orderPrintById?.cart.grand_total,
                                    2,
                                  )
                                  : `${currency.find(
                                    (curr) =>
                                      curr.id ===
                                      orderPrintById?.cart.currency_id,
                                  )?.symbol || "₹"
                                  } ` + "0"}
                              </strong>
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                height: "0px",
                                padding: "0px",
                                margin: "0px",
                              }}
                            >
                              <hr />
                            </td>
                          </tr>
                          <tr
                            className="without_price_check"
                            style={{
                              border: "0px",
                              paddingBottom: "20px",
                              textAlign: "center",
                            }}
                          >
                            <td colSpan={4} style={{ border: "0" }}>
                              Thank You For Shopping!
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              className="print-setting"
              style={{ position: "absolute", top: "0", right: "0" }}
            >
              <button className="icons " onClick={openPdf}>
                <span className="text-white">
                  <svg
                    height="28px"
                    viewBox="0 -960 960 960"
                    width="28px"
                    fill="#000"
                  >
                    <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                  </svg>
                </span>
              </button>
              <button
                className="icons"
                onClick={shareWhatsapp}
                title="share in whatsapp"
              >
                <span style={{ color: "black" }}>
                  <i
                    className="bi bi-whatsapp"
                    style={{ fontSize: "22px" }}
                  ></i>
                </span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default OrderPrintViewV5;
