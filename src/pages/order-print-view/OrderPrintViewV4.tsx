//OrderPrintViewV4.tsx

import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import no_image from "../../assets/images/no_image.jpeg";
import {
  formatDate,
  formatDateAndTime,
  formatNumber,
  formatTimeOnly,
  getWhatsappFlag,
  newRightsForPrint,
} from "../../common/SharedFunction";
import SafeHtml from "../../components/SafeHtml";
import PrintSettingModal from "../../components/model/PrintSettingModal";
import { whatsappTemplateCloudeSend } from "../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../helpers/AppConstants";
import { PAGE_ID, PRINT_SETTING_TYPE_OBJ } from "../../helpers/AppEnum";
import { axiosInstance, setUrlParams } from "../../services/axiosInstance";
import { numberToWordsCurrency } from "../../utils/numberToWordsCurrency";
import {
  fetchCustomForm,
  fetchprintSetting,
  IprintSetting,
  ItemDetails,
  ItemDetails as OrderItemDetails,
} from "../order-pdf-view/OrderPdfController";
import "./OrderPrintView.css";
import {
  fetchCurrency,
  fetchOrderByForPrintIdApi,
  fetchPdfmeTemplatesForPicker,
  handleDownload,
  isPdfmeSupportedCartType,
} from "./orderPrintController";

// Define interface for custom form fields based on console output
interface CustomFormField {
  id: number;
  title: string;
  data_type: number; // e.g., 3 for date, 4 for date-time
  display_order: number;
  required_or_not: number;
  print_or_not: number;
  product_feild_row_column: number;
  reference_column_name: string;
  data_source?: string | null;
}

interface ICurrency {
  id: number;
  short_name: string;
  name: string;
  symbol: string;
}

const OrderPrintViewV4 = () => {
  const [orderPrintById, setOrderPrintById] = useState<OrderItemDetails>();
  const [customOrderPdfViewById, setCustomOrderPdfViewById] = useState<
    CustomFormField[]
  >([]);
  const [productCustomOrderPdfViewById, setProductCustomOrderPdfViewById] =
    useState<CustomFormField[]>([]);
  const [dynamicViewFormate, setDynamicViewFormate] = useState(1);

  const [dynamicColor, setDynamicColor] = useState("#cfcfcf");
  const [dynamicTitle, setDynamicTitle] = useState("");
  const { id, MobileToken, getID, printFlag } = useParams();
  const [currency, setCurrency] = useState<ICurrency[]>([]);
  const [printSetting, setPrintSetting] = useState<IprintSetting>();
  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const [isCustomFormsLoading, setIsCustomFormsLoading] = useState(true);
  const [isPrintSettingLoading, setIsPrintSettingLoading] = useState(true);
  const [printDialogOpened, setPrintDialogOpened] = useState(false);
  const [isLoadingAfterUpdate, setIsLoadingAfterUpdate] = useState(false);
  const [orderPrintList, setOrderPrintList] = useState<ItemDetails[]>([]);
  const [whatsappConfigDetail, setWhatsappConfigDetail] = useState<number>(0);
  // pdfme Document Designer — opt-in per company, Quotation (cart.type===1)
  // only for this pilot. Same pattern as OrderPrintViewV1.tsx.
  const [pdfmeEnabled, setPdfmeEnabled] = useState(false);
  const [pdfmeFlagChecked, setPdfmeFlagChecked] = useState(false);
  const [downloadTemplateChoices, setDownloadTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [printTemplateChoices, setPrintTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const [canPdfProfomaInvoice, setcanPdfProfomaInvoice] = useState<boolean>(false);

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

  let gstAmount = orderPrintById?.cart.gst_amt;
  gstAmount = 0;

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
    if (!orderIds.length) return;

    setIsOrderLoading(true);
    setIsCustomFormsLoading(true);
    setIsPrintSettingLoading(true);

    Promise.all(
      orderIds.map((singleId) =>
        fetchOrderByForPrintIdApi(Number(singleId), MobileToken, getID),
      ),
    )
      .then((responses) => {
        const validData = responses.filter(
          (item: any): item is ItemDetails => item !== null,
        );

        setOrderPrintList(validData);

        // backward compatibility (300+ places safe)
        setOrderPrintById(validData[0]);

        setIsOrderLoading(false);

        // currency still single time call
        fetchCurrency(setCurrency);
      })
      .catch(() => {
        setIsOrderLoading(false);
      });
  }, [orderIds, MobileToken, getID]);

  useEffect(() => {
    if (!orderPrintById?.cart?.type || isOrderLoading) return;

    setIsCustomFormsLoading(true);

    let formType = 5;
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
      case 6:
        formType = 10;
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

    Promise.all([
      fetchCustomForm(
        formType,
        setCustomOrderPdfViewByIdWrapper as any,
        MobileToken,
        getID,
      ),
      fetchCustomForm(
        4,
        setProductCustomOrderPdfViewByIdWrapper as any,
        MobileToken,
        getID,
      ),
    ])
      .then(() => {
        setIsCustomFormsLoading(false);
      })
      .catch(() => {
        setIsCustomFormsLoading(false);
      });
  }, [orderPrintById?.cart?.type, MobileToken, getID, isOrderLoading]);

  useEffect(() => {
    if (!orderPrintById?.cart?.type || !dynamicViewFormate || isOrderLoading)
      return;

    if (printSetting) return;

    // Wait for the actual dynamicViewFormate to be set from orderPrintById
    // Don't proceed if we're still on default value and orderPrintById has loaded
    if (orderPrintById && dynamicViewFormate === 1) {
      // Check if the actual format from company details is different
      const actualFormat =
        orderPrintById.cart.type === 1
          ? orderPrintById.companyDetail.quotation_view_formate
          : orderPrintById.cart.type === 2
            ? orderPrintById.companyDetail.order_view_formate
            : orderPrintById.cart.type === 3
              ? orderPrintById.companyDetail.invoice_view_formate
              : orderPrintById.cart.type === 4
                ? orderPrintById.companyDetail.purchase_view_formate
                : orderPrintById.cart.type === 5
                  ? orderPrintById.companyDetail.purchase_order_view_formate
                  : orderPrintById.cart.type === 6
                    ? orderPrintById.companyDetail
                      .return_sales_invoice_view_formate
                    : orderPrintById.cart.type === 7
                      ? orderPrintById.companyDetail
                        .return_purchase_invoice_view_formate
                      : orderPrintById.cart.type === 8
                        ? orderPrintById.companyDetail.inward_view_formate
                        : orderPrintById.cart.type === 9
                          ? orderPrintById.companyDetail.dispatch_view_formate
                          : orderPrintById.cart.type === 12
                            ? orderPrintById.companyDetail.proforma_invoice_view_formate
                            : 1;

      // If actual format exists and is different from current, wait for state update
      if (actualFormat && actualFormat !== dynamicViewFormate) {
        return;
      }
    }

    setIsPrintSettingLoading(true);

    fetchprintSetting(
      setPrintSetting,
      Number(PRINT_SETTING_TYPE_OBJ[String(orderPrintById.cart.type) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
      dynamicViewFormate,
      MobileToken,
      getID,
    )
      .then(() => {
        setIsPrintSettingLoading(false);
      })
      .catch(() => {
        setIsPrintSettingLoading(false);
      });
  }, [
    orderPrintById?.cart?.type,
    dynamicViewFormate,
    MobileToken,
    getID,
    isOrderLoading,
    printSetting,
  ]);

  useEffect(() => {
    const companyMastersId = localStorage.getItem("COMPANY_ID");
    if (!isPdfmeSupportedCartType(orderPrintById?.cart?.type) || !companyMastersId) {
      setPdfmeFlagChecked(true);
      return;
    }
    axiosInstance
      .post("get-feature-flag", {
        company_masters_id: companyMastersId,
        feature_key: "document_designer",
      })
      .then(({ data }) => {
        if (data?.ack === 1) setPdfmeEnabled(!!data.data.item.is_enabled);
      })
      .finally(() => setPdfmeFlagChecked(true));
  }, [orderPrintById?.cart?.type]);

  const printGeneratedPdf = async (documentTemplateId?: number) => {
    const token = MobileToken || localStorage.getItem("token");
    const companyMastersId = localStorage.getItem("COMPANY_ID");
    try {
      const resops = await axiosInstance.post(
        "/order-pdf",
        { cart_id: id, ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}) },
        { headers: { Authorization: `${token}`, "x-tenant-id": getID, "x-company-id": companyMastersId } },
      );
      if (resops.data.ack !== 1) return;
      const response = await axios.get(resops.data.data.path, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, "_blank");
      if (pdfWindow) {
        pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const printWithTemplate = (templateId: number) => {
    setPrintTemplateChoices([]);
    printGeneratedPdf(templateId);
  };

  // pdfme path: fires as soon as the flag is confirmed true — no reason to
  // wait for the legacy timer (that delay exists to let this component's
  // own DOM finish rendering pageText/pageURL extra sections before
  // window.print(), which doesn't apply here since we fetch a real PDF).
  useEffect(() => {
    if (pdfmeEnabled && orderPrintById && printSetting && !printDialogOpened && !printFlag) {
      (async () => {
        setPrintDialogOpened(true);
        const choices = await fetchPdfmeTemplatesForPicker(orderPrintById?.cart?.type);
        if (choices.length > 1) {
          setPrintTemplateChoices(choices);
        } else {
          printGeneratedPdf();
        }
      })();
    }
  }, [pdfmeEnabled, orderPrintById, printSetting, printDialogOpened, printFlag]);

  // Legacy path: only for a confirmed-non-pdfme cart — gated on
  // pdfmeFlagChecked so this can't race ahead of the flag check above.
  // Trigger print dialog 2 seconds after all data is loaded
  useEffect(() => {
    if (
      !isOrderLoading &&
      !isCustomFormsLoading &&
      !isPrintSettingLoading &&
      orderPrintById &&
      printSetting &&
      !printDialogOpened &&
      !printFlag &&
      pdfmeFlagChecked &&
      !pdfmeEnabled
    ) {
      const timeoutDuration = customOrderPdfViewById.some(
        (field) =>
          (field.data_type === 11 || field.data_type === 12) &&
          field.print_or_not === 1,
      )
        ? 5000
        : 2000;

      const timer = setTimeout(() => {
        setPrintDialogOpened(true);
        window.print();
      }, timeoutDuration);

      return () => clearTimeout(timer);
    }
  }, [
    isOrderLoading,
    isCustomFormsLoading,
    isPrintSettingLoading,
    orderPrintById,
    printSetting,
    printDialogOpened,
    printFlag,
    customOrderPdfViewById,
    pdfmeFlagChecked,
    pdfmeEnabled,
  ]);

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
  const sortedFields: { title: string; value: string }[] = [];

  if (orderPrintById?.cart && customOrderPdfViewById.length) {
    customOrderPdfViewById.forEach((field: CustomFormField) => {
      const key = field.reference_column_name;
      if (key in orderPrintById.cart) {
        const value = orderPrintById.cart[key];
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
          let formattedValue = value.toString();
          if (field.data_type === 4 || field.data_type === 5) {
            try {
              formattedValue = formatDate(value.toString());
            } catch (e) {
              console.error(`Error formatting date for ${field.title}:`, e);
            }
          } else if (field.data_type === 7) {
            formattedValue = value.toString() === "1" ? "Yes" : "No";
          }
          matchedCartFields[field.title] = formattedValue;
          sortedFields.push({ title: field.title, value: formattedValue });
        }
      }
    });
  }

  // Variable to store matched key-value pairs with title as key for products
  const matchedProductFields: { [itemId: number]: { [key: string]: string } } =
    {};

  const getActiveRow2Fields = () => {
    const activeFieldsMap = new Map<string, CustomFormField>();

    {
      printSetting?.setting_details.product_custom_feilds &&
        productCustomOrderPdfViewById.forEach((field) => {
          if (
            Number(field.product_feild_row_column) === 2 &&
            Number(field.print_or_not) === 1
          ) {
            const hasValue = orderPrintById?.items?.some((item) => {
              const itemFields = matchedProductFields[item.id] || {};
              const value = itemFields[field.title];
              return (
                value &&
                value !== "0" &&
                value !== "00:00:00" &&
                value !== "0000-00-00" &&
                value !== ""
              );
            });

            if (hasValue) {
              activeFieldsMap.set(field.title, field);
            }
          }
        });
    }
    return Array.from(activeFieldsMap.values());
  };

  const calculateTotalColumns = () => {
    let totalCols = 5; // No., Product Description, Qty/Unit

    const activeRow2Fields = getActiveRow2Fields();
    totalCols += activeRow2Fields.length;

    if (printSetting?.setting_details.rate === true) {
      totalCols += 1; // Rate
      if (printSetting?.setting_details.discountColumn === true) totalCols += 1;
      if (gstAmount != 0) totalCols += 1; // GST column
      totalCols += 1; // Amount
    }

    if (
      printSetting?.setting_details.productImageinColumn &&
      printSetting?.setting_details.productImage == true
    ) {
      totalCols += 1;
    }

    return totalCols;
  };

  const totalColumns = calculateTotalColumns();

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
      setDynamicViewFormate(
        orderPrintById.companyDetail.quotation_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 2) {
      setDynamicColor(
        orderPrintById.companyDetail.order_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.order_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 3) {
      setDynamicColor(
        orderPrintById.companyDetail.invoice_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.invoice_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 4) {
      setDynamicColor(
        orderPrintById.companyDetail.purchase_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.purchase_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 5) {
      setDynamicColor(
        orderPrintById.companyDetail.purchase_order_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.purchase_order_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 6) {
      setDynamicColor(
        orderPrintById.companyDetail.return_sales_invoice_view_color ||
        "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.return_sales_invoice_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 7) {
      setDynamicColor(
        orderPrintById.companyDetail.return_purchase_invoice_view_color ||
        "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.return_purchase_invoice_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 8) {
      setDynamicColor(
        orderPrintById.companyDetail.inward_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.inward_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 9) {
      setDynamicColor(
        orderPrintById.companyDetail.dispatch_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.dispatch_view_formate || 1,
      );
    } else if (orderPrintById?.cart.type === 12) {
      setDynamicColor(
        orderPrintById.companyDetail.proforma_invoice_view_color || "#cfcfcf",
      );
      setDynamicViewFormate(
        orderPrintById.companyDetail.proforma_invoice_view_formate || 1,
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

  const symbolCurrency = "₹";
  let amountColspan = 2;

  const OrderPrintEffect = ({ field }: { field: any }) => {
    const timeoutDuration =
      field.data_type === 11 || field.data_type === 12 ? 5000 : 2000;

    // This component mounts once PER matching pageText/pageURL custom
    // field — without a printDialogOpened guard, 2+ such fields would each
    // independently trigger print. Shares printDialogOpened/pdfmeEnabled
    // with the outer component's own effects (closure), so whichever
    // fires first (here or the outer effect) blocks the rest.
    useEffect(() => {
      if (pdfmeEnabled && orderPrintById && printSetting && !printDialogOpened && !printFlag) {
        (async () => {
          setPrintDialogOpened(true);
          const choices = await fetchPdfmeTemplatesForPicker(orderPrintById?.cart?.type);
          if (choices.length > 1) {
            setPrintTemplateChoices(choices);
          } else {
            printGeneratedPdf();
          }
        })();
      }
    }, [pdfmeEnabled, orderPrintById, printSetting, printDialogOpened, printFlag]);

    useEffect(() => {
      if (
        orderPrintById &&
        !printFlag &&
        printSetting &&
        !printDialogOpened &&
        pdfmeFlagChecked &&
        !pdfmeEnabled
      ) {
        const timer = setTimeout(() => {
          setPrintDialogOpened(true);
          window.print();
        }, timeoutDuration);
        return () => clearTimeout(timer);
      }
    }, [orderPrintById, timeoutDuration, printDialogOpened, printFlag, printSetting, pdfmeFlagChecked, pdfmeEnabled]);

    return null;
  };

  {
    customOrderPdfViewById
      .filter(
        (field) =>
          field.print_or_not === 1 &&
          (field.data_type === 11 || field.data_type === 12) &&
          field.display_order <= 0,
      )
      .map((field) => {
        const [title, value] =
          Object.entries(matchedCartFields).find(([t]) => t === field.title) ||
          [];

        if (
          !value ||
          value === "00:00:00" ||
          value === null ||
          value === "0000-00-00 00:00:00" ||
          value === "0000-00-00" ||
          value === "0" ||
          value === undefined ||
          value.trim() === ""
        ) {
          return null;
        }

        return <OrderPrintEffect key={field.title} field={field} />;
      });
  }

  let qtyCount = 0;
  orderPrintById?.items?.forEach((item) => {
    qtyCount += item?.item_qty || 0;
  });

  const openPrintSetting = () => {
    if (canViewPrintSetting) {
      if (orderPrintById?.cart?.type && dynamicViewFormate) {
        fetchprintSetting(
          setPrintSetting,
          Number(PRINT_SETTING_TYPE_OBJ[String(orderPrintById.cart.type) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
          dynamicViewFormate,
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

  const [canViewPrintSetting, setCanViewPrintSetting] =
    useState<boolean>(false);
  const [canPdfInv, setCanPdfInv] = useState<boolean>(false);
  const [canPdfOrder, setcanPdfOrder] = useState<boolean>(false);
  const [canPdfQuo, setcanPdfQuo] = useState<boolean>(false);
  const [canPdfPurchase, setcanPdfPurchase] = useState<boolean>(false);
  const [canPdfPurchaseOrder, setcanPdfPurchaseOrder] =
    useState<boolean>(false);
  const [canPdfReturnSalesInvoice, setcanPdfReturnSalesInvoice] =
    useState<boolean>(false);
  const [canPdfInward, setcanPdfInward] = useState<boolean>(false);
  const [canPdfDispatch, setcanPdfDispatch] = useState<boolean>(false);

  useEffect(() => {
    loadWha();
    loadRights();
  }, []);

  const loadWha = async () => {
    const a_application_login_id = getID || localStorage.getItem("UUID");
    const response = await getWhatsappFlag(a_application_login_id);
    setWhatsappConfigDetail(response?.WHATSAPP_PLATEFORM);
  };

  const loadRights = async () => {
    const a_application_login_id = getID || localStorage.getItem("UUID");
    const response = await newRightsForPrint(
      PAGE_ID.PRINT_SETTINGS_RIGHTS,
      a_application_login_id,
    );
    setCanViewPrintSetting(response?.view);

    const response2 = await newRightsForPrint(
      PAGE_ID.INVOICE,
      a_application_login_id,
    );
    setCanPdfInv(response2?.share);

    const response3 = await newRightsForPrint(
      PAGE_ID.ORDER,
      a_application_login_id,
    );
    setcanPdfOrder(response3?.share);

    const response4 = await newRightsForPrint(
      PAGE_ID.QUOTATION,
      a_application_login_id,
    );
    setcanPdfQuo(response4?.share);

    const response5 = await newRightsForPrint(
      PAGE_ID.PURCHASE,
      a_application_login_id,
    );
    setcanPdfPurchase(response5?.share);

    const response6 = await newRightsForPrint(
      PAGE_ID.PURCHASE_ORDER,
      a_application_login_id,
    );
    setcanPdfPurchaseOrder(response6?.share);

    const response7 = await newRightsForPrint(
      PAGE_ID.RETURN_SALES_INVOICE,
      a_application_login_id,
    );
    setcanPdfReturnSalesInvoice(response7?.share);

    const response8 = await newRightsForPrint(
      PAGE_ID.INWARD,
      a_application_login_id,
    );
    setcanPdfInward(response8?.share);

    const response9 = await newRightsForPrint(
      PAGE_ID.DISPATCH,
      a_application_login_id,
    );
    setcanPdfDispatch(response9?.share);
    const response12 = await newRightsForPrint(
      PAGE_ID.PROFOMA_INVOICE,
      a_application_login_id,
    );
    setcanPdfProfomaInvoice(response12?.share);
  };
  const openPdf = async () => {
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
      const choices = await fetchPdfmeTemplatesForPicker(orderPrintById?.cart?.type);
      if (choices.length > 1) {
        setDownloadTemplateChoices(choices);
      } else {
        handleDownload(id, MobileToken, getID, "downloadPdf");
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const downloadWithTemplate = (templateId: number) => {
    setDownloadTemplateChoices([]);
    handleDownload(id, MobileToken, getID, "downloadPdf", templateId);
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

  const showBorder = printSetting?.setting_details?.productBottomBorder ?? true;
  const showRowLines =
    printSetting?.setting_details?.showLinesBetweenProducts ?? false;

  return isOrderLoading ||
    isCustomFormsLoading ||
    isLoadingAfterUpdate ||
    !orderPrintList?.length ? (
    <p className="text-center">Loading...</p>
  ) : (
    <>
      {orderPrintList.map((orderPrintById, index) => (
        <div key={index}>
          <div
            style={
              {
                position: "relative",
                height: "100%",
                minHeight: "100vh",
                ...(orderPrintById?.companyDetail.watermark_in_print == 2 &&
                  orderPrintById?.companyDetail.company_logo && {
                  "--logo-url": `url(${orderPrintById?.companyDetail.company_logo})`,
                }),
              } as React.CSSProperties
            }
            className={`watermarked-page ${showBorder ? "no-print-border" : ""}`}
          >
            <style>
              {`
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        
    @page {
      size: auto;
      margin: 8mm;
    }

         .no-print-border  {
        border-block: none !important;
      }
      .product-row-lines td {
  border-bottom: 1px solid #000 !important;
}

    .grand-total-row td {
    white-space: nowrap !important;
    overflow: hidden !important;
  }
     .person_name {
           word-break: break-word;  
           white-space: normal;      
           overflow-wrap: anywhere;  
        }


    *{
       .compnay_name:{
        font-size: 30px !important;
        }
    }
 ${printSetting?.setting_details.productImageinColumn &&
                  printSetting?.setting_details.productImage
                  ? `
    .print-table th:nth-child(1) { width: 2% !important; }
    .print-table th:nth-child(2) { width: 2% !important; }
    .print-table th:nth-child(3) { width: 19% !important; }
    .print-table th:nth-child(4) { width: 10% !important; }
    .print-table th:nth-child(5) { width: 14% !important; }
    .print-table th:nth-child(6) { width: 8% !important; }
    .print-table th:nth-child(7) { width: 8% !important; }
    .print-table th:nth-child(8) { width: 8% !important; }
    .print-table th:nth-child(9) { width: 19% !important; }
    `
                  : `
    .print-table th:nth-child(1) { width: 2% !important; }
    .print-table th:nth-child(2) { width: 23% !important; }
    .print-table th:nth-child(3) { width: 10% !important; }
    .print-table th:nth-child(4) { width: 14% !important; }
    .print-table th:nth-child(5) { width: 8% !important; }
    .print-table th:nth-child(6) { width: 8% !important; }
    .print-table th:nth-child(7) { width: 8% !important; }
    .print-table th:nth-child(8) { width: 19% !important; }
    `
                }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
         .person_name {
           word-break: break-word;  
           white-space: normal;      
           overflow-wrap: anywhere;  
        }

      .compnay_name:{
        font-size:30px !important;
      }
        .grand-total-row td {
    white-space: nowrap !important;
    overflow: hidden !important;
  
  }
      body {
        margin: 0;
        width: 100%;
        height: auto;
      }
         .compnay_name:{
        font-size:30px !important;
      }
      .print-table {
        width: 100% !important;
        max-width: 100% !important;
        font-size: 13px !important;
        line-height: 1.2 !important;
      }
      .content {
        width: 100%;
        height: auto;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      td, th {
        padding: 2px !important;
        font-size: 13px !important;
        word-wrap: break-word;
      }
      .font-13 {
        font-size: 13px !important;
      }
      th {
        font-size: 13px !important;
      }
      .content table thead td {
        font-size: 13px !important;
      }
       ${printSetting?.setting_details.productImageinColumn &&
                  printSetting?.setting_details.productImage
                  ? `
    .print-table th:nth-child(1) { width: 2% !important; }
    .print-table th:nth-child(2) { width: 2% !important; }
    .print-table th:nth-child(3) { width: 19% !important; }
    .print-table th:nth-child(4) { width: 10% !important; }
    .print-table th:nth-child(5) { width: 14% !important; }
    .print-table th:nth-child(6) { width: 8% !important; }
    .print-table th:nth-child(7) { width: 8% !important; }
    .print-table th:nth-child(8) { width: 8% !important; }
    .print-table th:nth-child(9) { width: 19% !important; }
    `
                  : `
    .print-table th:nth-child(1) { width: 2% !important; }
    .print-table th:nth-child(2) { width: 23% !important; }
    .print-table th:nth-child(3) { width: 10% !important; }
    .print-table th:nth-child(4) { width: 14% !important; }
    .print-table th:nth-child(5) { width: 8% !important; }
    .print-table th:nth-child(6) { width: 8% !important; }
    .print-table th:nth-child(7) { width: 8% !important; }
    .print-table th:nth-child(8) { width: 19% !important; }
    `
                }
      
      table table {
        font-size: 13px !important;
        border-collapse:collapse
      }
      table table td, table table th {
        padding: 1px !important;
        font-size: 13px !important;
      }
      .print-table, .content {
        page-break-after: auto;
        page-break-before: auto;
      }
         .compnay_name:{
        font-size:30px !important;
      }
         .person_name {
           word-break: break-word;  
           white-space: normal;      
           overflow-wrap: anywhere;  
        }
    }

    @media screen {
      .print-table {
        width: 100%;
        min-height: auto;
        max-width: 100%;
        margin: 0 auto; /* Center the table on the screen */
        transform: none; /* Remove scaling to maintain original size */
      }
           .compnay_name:{
        font-size:30px !important;
      }
         .person_name {
           word-break: break-word;  
           white-space: normal;      
           overflow-wrap: anywhere;  
        }
      
    }
  `}
            </style>

            <div className="print-container">
              <div className="content" id="content">
                <table
                  className="print-table"
                  style={{ backgroundColor: "transparent" }}
                >
                  <thead>
                    {printSetting?.setting_details.headerImage === true &&
                      orderPrintById?.companyDetail.header_img !== "" && (
                        <tr>
                          <td
                            colSpan={totalColumns}
                            style={{ padding: "0" }}
                            className="text-center"
                          >
                            <img
                              style={{ width: "99.5%" }}
                              src={orderPrintById.companyDetail.header_img}
                              alt="Company Header"
                            />
                          </td>
                        </tr>
                      )}

                    {printSetting?.setting_details.headerDetails === true && (
                      <>
                        <tr>
                          <td
                            colSpan={totalColumns}
                            style={{
                              textAlign: "center",
                              border: "1px solid black",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                              padding: "5px",
                              backgroundColor: dynamicColor,
                            }}
                          >
                            {orderPrintById.companyDetail.company_name}
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={totalColumns}
                            style={{
                              textAlign: "center",
                              border: "1px solid black",
                              padding: "5px",
                            }}
                          >
                            {orderPrintById.companyDetail.address.length >
                              0 && (
                                <>
                                  <b>Address : </b>
                                  {orderPrintById.companyDetail.address}
                                  <br />
                                </>
                              )}
                            {orderPrintById.companyDetail.printed_number
                              .length > 0 && (
                                <>
                                  <b>Mo. </b>
                                  {orderPrintById.companyDetail.printed_number},
                                </>
                              )}
                            {orderPrintById.companyDetail.company_email.length >
                              0 && (
                                <>
                                  <b> Email : </b>
                                  {orderPrintById.companyDetail.company_email},
                                </>
                              )}
                            {orderPrintById.companyDetail.gst_number.length >
                              0 && (
                                <>
                                  <b> GSTIN : </b>
                                  {orderPrintById.companyDetail.gst_number},
                                </>
                              )}
                            {orderPrintById.companyDetail.state_name.length >
                              0 && (
                                <>
                                  <b> State : </b>
                                  {orderPrintById.companyDetail.state_name}
                                </>
                              )}
                          </td>
                        </tr>
                      </>
                    )}

                    {printSetting?.setting_details.headerDetailsWithLogo ===
                      true &&
                      printSetting.setting_details.headerLogoOnRightSide ===
                      false && (
                        <>
                          <tr>
                            <td
                              colSpan={totalColumns}
                              style={{
                                padding: "0px",
                                margin: "0px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "left",
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "5px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <img
                                    src={
                                      orderPrintById.companyDetail
                                        .company_logo || no_image
                                    }
                                    alt={
                                      orderPrintById.companyDetail.company_name
                                    }
                                    style={{
                                      width: "100px",
                                      height: "100px",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    padding: "5px",
                                    paddingLeft: "10px",
                                    width: "600px",
                                    textAlign: "left",
                                    fontSize: "14px",
                                  }}
                                >
                                  <h4
                                    style={{
                                      textAlign: "start",
                                      textTransform: "uppercase",
                                      fontWeight: "bold",
                                      margin: "0px",
                                      fontSize: "23px",
                                    }}
                                  >
                                    {orderPrintById.companyDetail.company_name}
                                  </h4>
                                  {orderPrintById.companyDetail.address.length >
                                    0 && (
                                      <>
                                        <b>Address : </b>
                                        {orderPrintById.companyDetail.address}
                                        ,{" "}
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.state_name
                                    .length > 0 && (
                                      <>
                                        <b> State : </b>
                                        {orderPrintById.companyDetail.state_name},
                                        <br />
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.printed_number
                                    .length > 0 && (
                                      <>
                                        <b>Mo. </b>
                                        {
                                          orderPrintById.companyDetail
                                            .printed_number
                                        }
                                        ,{" "}
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.company_email
                                    .length > 0 && (
                                      <>
                                        <b> Email : </b>
                                        {
                                          orderPrintById.companyDetail
                                            .company_email
                                        }
                                        ,{" "}
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.gst_number
                                    .length > 0 && (
                                      <>
                                        <b> GSTIN : </b>
                                        {orderPrintById.companyDetail.gst_number}
                                      </>
                                    )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}

                    {printSetting?.setting_details.headerDetailsWithLogo ===
                      true &&
                      printSetting.setting_details.headerLogoOnRightSide ===
                      true && (
                        <>
                          <tr>
                            <td
                              colSpan={totalColumns}
                              style={{
                                padding: "0px",
                                margin: "0px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "5px",
                                    paddingLeft: "10px",
                                    width: "700px",
                                    textAlign: "left",
                                    fontSize: "14px",
                                  }}
                                >
                                  <h4
                                    style={{
                                      textAlign: "start",
                                      textTransform: "uppercase",
                                      fontWeight: "bold",
                                      margin: "0px",
                                    }}
                                  >
                                    {orderPrintById.companyDetail.company_name}
                                  </h4>
                                  {orderPrintById.companyDetail.address.length >
                                    0 && (
                                      <>
                                        <b>Address : </b>
                                        {orderPrintById.companyDetail.address}
                                        ,{" "}
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.state_name
                                    .length > 0 && (
                                      <>
                                        <b> State : </b>
                                        {orderPrintById.companyDetail.state_name},
                                        <br />
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.printed_number
                                    .length > 0 && (
                                      <>
                                        <b>Mo. </b>
                                        {
                                          orderPrintById.companyDetail
                                            .printed_number
                                        }
                                        ,{" "}
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.company_email
                                    .length > 0 && (
                                      <>
                                        <b> Email : </b>
                                        {
                                          orderPrintById.companyDetail
                                            .company_email
                                        }
                                        ,{" "}
                                      </>
                                    )}
                                  {orderPrintById.companyDetail.gst_number
                                    .length > 0 && (
                                      <>
                                        <b> GSTIN : </b>
                                        {orderPrintById.companyDetail.gst_number}
                                      </>
                                    )}
                                </div>
                                <div
                                  style={{
                                    padding: "5px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <img
                                    src={
                                      orderPrintById.companyDetail
                                        .company_logo || no_image
                                    }
                                    alt={
                                      orderPrintById.companyDetail.company_name
                                    }
                                    style={{
                                      width: "100px",
                                      height: "100px",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                  </thead>

                  <tbody>
                    <tr style={{ pageBreakBefore: "always" }}>
                      <td
                        className="main-colspan-class text-center"
                        colSpan={totalColumns}
                        style={{ backgroundColor: `${dynamicColor}` }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="m-0">
                            <b>
                              {!printSetting?.setting_details?.debitCredit
                                ? ""
                                : orderPrintById?.cart?.type === 3 ||
                                  orderPrintById?.cart?.type === 7
                                  ? "Debit Memo"
                                  : orderPrintById?.cart?.type === 4 ||
                                    orderPrintById?.cart?.type === 6
                                    ? "Credit Memo"
                                    : ""}
                            </b>
                          </p>
                          <p className="m-0">
                            <b>{dynamicTitle}</b>
                          </p>
                          <p className="m-0">
                            {printSetting?.setting_details.orignalDuplicate && (
                              <>
                                <b>
                                  {printSetting?.setting_details
                                    .orignalDuplicate &&
                                    orderPrintById?.cart.cart_number.length > 0 &&
                                    orderPrintById?.cart.cart_number != "XXXXXXX"
                                    ? "Original"
                                    : "Draft"}
                                </b>
                              </>
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="main-colspan-class"
                        style={{ padding: "0" }}
                        colSpan={totalColumns}
                      >
                        <table
                          border={0}
                          ref={(el) => {
                            if (el) {
                              el.style.setProperty(
                                "width",
                                "100%",
                                "important",
                              );
                              el.style.setProperty("margin", "0", "important");
                              el.style.setProperty(
                                "border",
                                "0px",
                                "important",
                              );
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
                                borderLeft: "0px",
                                maxWidth: "70mm",
                              }}
                              className="without_price_check_customer person_name"
                            >
                              {printSetting?.setting_details.toBuyer ==
                                true && (
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
                                        {orderPrintById?.cart
                                          .to_customer_company_name && (
                                            <>
                                              {
                                                orderPrintById?.cart
                                                  .to_customer_company_name
                                              }
                                              <br />
                                            </>
                                          )}

                                        {orderPrintById?.cart
                                          .to_customer_name && (
                                            <>
                                              {
                                                orderPrintById?.cart
                                                  .to_customer_name
                                              }
                                              <br />
                                            </>
                                          )}
                                        <span
                                          style={{
                                            textTransform: "lowercase",
                                            fontWeight: "500",
                                          }}
                                        >
                                          {printSetting?.setting_details
                                            ?.ContactMobileNumber === true &&
                                            orderPrintById?.cart
                                              ?.to_customer_phone && (
                                              <>
                                                {"Mo. "}
                                                {
                                                  orderPrintById?.cart
                                                    .to_customer_phone
                                                }
                                                -{" "}
                                              </>
                                            )}

                                          {orderPrintById?.cart.to_customer_email
                                            .length > 0 && (
                                              <>
                                                {
                                                  orderPrintById?.cart
                                                    .to_customer_email
                                                }
                                              </>
                                            )}
                                        </span>
                                        <br />
                                      </strong>
                                    </span>
                                  </>
                                )}

                              {printSetting?.setting_details.billingAddress ==
                                true &&
                                orderPrintById?.cart.Address.length > 0 && (
                                  <>
                                    <span className="bolde-style">
                                      <b>Billing Address:</b>
                                    </span>
                                    <br />
                                    <span
                                      style={{
                                        wordWrap: "break-word",
                                        width: "50px",
                                      }}
                                    >
                                      {orderPrintById?.cart.Address}
                                    </span>
                                  </>
                                )}
                            </td>
                            <td
                              style={{ verticalAlign: "top", width: "71mm" }}
                              ref={(el) => {
                                if (el) {
                                  el.style.setProperty(
                                    "border",
                                    "0px",
                                    "important",
                                  );
                                }
                              }}
                            >
                              {printSetting?.setting_details.orderNo ==
                                true && (
                                  <>
                                    <span>
                                      <b>{dynamicTitle} No. : </b>
                                      {orderPrintById?.cart.cart_number}
                                    </span>
                                    <br />
                                  </>
                                )}

                              <span>
                                <b>
                                  {printSetting?.setting_details.orderDateTime
                                    ? `${dynamicTitle} Date & Time :`
                                    : printSetting?.setting_details
                                      .orderTimeOnly
                                      ? `${dynamicTitle} Time :`
                                      : ""}
                                </b>{" "}
                                {printSetting?.setting_details.orderDateTime &&
                                  orderPrintById?.cart.update_Date_time &&
                                  formatDate(
                                    orderPrintById?.cart.update_Date_time,
                                  )}{" "}
                                {printSetting?.setting_details.orderTimeOnly &&
                                  orderPrintById?.cart.update_Date_time &&
                                  formatTimeOnly(
                                    orderPrintById?.cart.update_Date_time,
                                  )}
                              </span>
                              <br />

                              {printSetting?.setting_details
                                .cart_custom_feilds &&
                                sortedFields
                                  .filter((field) =>
                                    customOrderPdfViewById.some(
                                      (f) =>
                                        f.title === field.title &&
                                        f.print_or_not === 1 &&
                                        f.data_type !== 11 &&
                                        f.data_type !== 12,
                                    ),
                                  )
                                  .map((field) => (
                                    <span key={field.title}>
                                      <b>{field.title}: </b>
                                      {field.value}
                                      <br />
                                    </span>
                                  ))}
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
                      {printSetting?.setting_details.productImage == true &&
                        printSetting?.setting_details.productImageinColumn && (
                          <th className="text-center">Image</th>
                        )}
                      <th className="text-center"> Particular Description</th>
                      {getActiveRow2Fields().map((field) => (
                        <th key={field.title} className="text-center">
                          {field.title}
                        </th>
                      ))}
                      {printSetting?.setting_details?.qtycolumn === true && (
                        <th className="text-center">
                          Qty{printSetting?.setting_details.unitName && "/Unit"}
                        </th>
                      )}
                      {printSetting?.setting_details.rate && (
                        <>
                          <th className="text-center">Rate</th>
                          {printSetting?.setting_details.discountColumn ==
                            true && (
                              <>
                                <th className="text-center">Dis(%)</th>
                              </>
                            )}

                          {gstAmount != 0 ? (
                            <th className="text-center"> GST(%)</th>
                          ) : (
                            ""
                          )}
                          <th
                            className="without_price_check"
                            colSpan={
                              printSetting?.setting_details.discountColumn ==
                                true
                                ? 5
                                : 4
                            }
                          >
                            Amount
                          </th>
                        </>
                      )}
                    </tr>
                    {orderPrintById?.items?.length ? (
                      <>
                        {orderPrintById.items.map((item, index) => {
                          const customFields =
                            matchedProductFields[item.id] || {};

                          // Row 1: inside description
                          const fieldsRow1 = Object.entries(
                            customFields,
                          ).filter(([title]) =>
                            productCustomOrderPdfViewById.some(
                              (f) =>
                                f.title === title &&
                                f.print_or_not === 1 &&
                                (f.product_feild_row_column === 1 ||
                                  !f.product_feild_row_column),
                            ),
                          );

                          return (
                            <React.Fragment key={index}>
                              <tr
                                key={index}
                                className={
                                  showRowLines ? "product-row-lines" : ""
                                }
                              >
                                <td
                                  className={`text-center srno ${showBorder ? "no-print-border" : ""
                                    }`}
                                >
                                  <strong>{index + 1}</strong>
                                </td>

                                {printSetting?.setting_details.productImage ==
                                  true &&
                                  printSetting?.setting_details
                                    .productImageinColumn && (
                                    <td
                                      className={`text-center srno ${showBorder ? "no-print-border" : ""
                                        }`}
                                      style={{ paddingBlock: "2px" }}
                                    >
                                      <img
                                        src={item.product_img || no_image}
                                        alt="Product"
                                        style={{
                                          width: "70px",
                                          height: "70px",
                                          objectFit: "cover",
                                        }}
                                      />
                                    </td>
                                  )}

                                {/* Product Description + Row 1 */}
                                <td
                                  className={`model ${showBorder ? "no-print-border" : ""
                                    }`}
                                  style={{
                                    position: "relative",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {item.item_product_name}{" "}
                                  {printSetting?.setting_details.productCode ==
                                    true &&
                                    item.item_product_code && (
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
                                        {item.serial_numbers.map(
                                          (sn, index) => (
                                            <span key={index}>
                                              {sn}
                                              <br />
                                            </span>
                                          ),
                                        )}
                                      </>
                                    )}
                                  {printSetting?.setting_details
                                    .product_custom_feilds &&
                                    fieldsRow1.map(([title, value]) => {
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
                                  {printSetting?.setting_details.productImage &&
                                    !printSetting?.setting_details
                                      .productImageinColumn && (
                                      <>
                                        <br />
                                        <img
                                          src={item.product_img || no_image}
                                          alt="Product"
                                          style={{
                                            width: "80%",
                                            objectFit: "cover",
                                          }}
                                        />
                                      </>
                                    )}
                                </td>

                                {/* Dynamic Row 2 columns */}
                                {(() => {
                                  const activeRow2Fields =
                                    getActiveRow2Fields();

                                  return activeRow2Fields.map((field) => {
                                    const value = customFields[field.title];
                                    const displayValue =
                                      value &&
                                        value !== "0" &&
                                        value !== "00:00:00" &&
                                        value !== "0000-00-00"
                                        ? value
                                        : "";

                                    return (
                                      <td
                                        key={field.title}
                                        className={`text-center model ${showBorder ? "no-print-border" : ""
                                          }`}
                                      >
                                        {displayValue}
                                      </td>
                                    );
                                  });
                                })()}
                                {printSetting?.setting_details.qtycolumn ==
                                  true && (
                                    <td
                                      className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                        }`}
                                    >
                                      {item.item_qty}{" "}
                                      {printSetting?.setting_details.unitName ===
                                        true &&
                                        item.item_unit_name &&
                                        ` / ${item.item_unit_name}`}
                                    </td>
                                  )}
                                {printSetting?.setting_details.rate && (
                                  <>
                                    <td
                                      className={`text-right now-rap-white-space without_price_check ${showBorder ? "no-print-border" : ""
                                        }`}
                                    >
                                      {item.item_rate
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id === item.currency_id,
                                        )?.symbol || "₹"
                                        } ` + formatNumber(item.item_rate, 2)
                                        : `${currency.find(
                                          (curr) =>
                                            curr.id === item.currency_id,
                                        )?.symbol || "₹"
                                        } ` + "0"}
                                    </td>
                                    {printSetting?.setting_details
                                      .discountColumn == true && (
                                        <>
                                          <td
                                            className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                              }`}
                                          >
                                            {item.item_discount_pct
                                              ? formatNumber(
                                                item.item_discount_pct,
                                                2,
                                              )
                                              : "0"}
                                          </td>
                                        </>
                                      )}

                                    {gstAmount != 0 ? (
                                      <td
                                        className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                          }`}
                                      >
                                        {item.item_gst
                                          ? formatNumber(item.item_gst, 2)
                                          : ""}
                                      </td>
                                    ) : (
                                      ""
                                    )}
                                    <td
                                      className={`text-right now-rap-white-space without_price_check ${showBorder ? "no-print-border" : ""
                                        }`}
                                      colSpan={
                                        printSetting?.setting_details
                                          .discountColumn == true
                                          ? 1
                                          : 2
                                      }
                                    >
                                      {item.item_total &&
                                        item.item_gst !== undefined
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id === item.currency_id,
                                        )?.symbol || "₹"
                                        } ` + formatNumber(item.item_total, 2)
                                        : `${currency.find(
                                          (curr) =>
                                            curr.id === item.currency_id,
                                        )?.symbol || "₹"
                                        } ` + "0"}
                                    </td>
                                  </>
                                )}
                              </tr>
                            </React.Fragment>
                          );
                        })}
                        {Array.from({
                          length: Math.max(
                            0,
                            7 - (orderPrintById.items?.length || 0),
                          ),
                        }).map((_, blankIndex) => {
                          const activeRow2Fields = getActiveRow2Fields();

                          return (
                            <tr key={`blank-${blankIndex}`}>
                              <td
                                className={`text-center srno ${showBorder ? "no-print-border" : ""
                                  }`}
                              ></td>
                              {printSetting?.setting_details.rate && (
                                <td
                                  className={`model ${showBorder ? "no-print-border" : ""
                                    }`}
                                ></td>
                              )}

                              {/* Dynamic empty columns */}
                              {activeRow2Fields.map((field) => (
                                <td
                                  key={field.title}
                                  className={`text-center model ${showBorder ? "no-print-border" : ""
                                    }`}
                                ></td>
                              ))}

                              {printSetting?.setting_details?.qtycolumn !==
                                false && (
                                  <>
                                    <td
                                      className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                        }`}
                                    ></td>
                                    <td
                                      className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                        }`}
                                    ></td>
                                  </>
                                )}

                              {printSetting?.setting_details.rate && (
                                <>
                                  {printSetting?.setting_details?.qtycolumn ===
                                    false && (
                                      <td
                                        className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                          }`}
                                      ></td>
                                    )}
                                  {printSetting?.setting_details
                                    .discountColumn == true && (
                                      <>
                                        <td
                                          className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                            }`}
                                        ></td>
                                      </>
                                    )}

                                  <td
                                    className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                      }`}
                                    colSpan={
                                      printSetting?.setting_details
                                        .discountColumn == true
                                        ? 1
                                        : 2
                                    }
                                  ></td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      Array.from({ length: 7 }).map((_, blankIndex) => (
                        <tr key={`blank-${blankIndex}`}>
                          <td
                            className={`text-center srno ${showBorder ? "no-print-border" : ""
                              }`}
                          ></td>
                          {printSetting?.setting_details.productImage == true &&
                            printSetting?.setting_details
                              .productImageinColumn && (
                              <td
                                className={`text-center srno ${showBorder ? "no-print-border" : ""
                                  }`}
                              ></td>
                            )}
                          {printSetting?.setting_details.rate && (
                            <td
                              className={`model ${showBorder ? "no-print-border" : ""
                                }`}
                            ></td>
                          )}
                          {printSetting?.setting_details?.qtycolumn !==
                            false && (
                              <>
                                <td
                                  className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                    }`}
                                ></td>
                                <td
                                  className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                    }`}
                                ></td>
                              </>
                            )}
                          {orderPrintById.cart.gst_amt != 0 ? (
                            <td
                              className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                }`}
                            ></td>
                          ) : null}
                          <td
                            className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                              }`}
                          ></td>
                          {printSetting?.setting_details.rate && (
                            <>
                              <td
                                className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                  }`}
                              ></td>
                              {printSetting?.setting_details.discountColumn ==
                                true && (
                                  <>
                                    <td
                                      className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                        }`}
                                    ></td>
                                  </>
                                )}
                              {orderPrintById.cart.gst_amt != 0 ? (
                                <td
                                  className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                    }`}
                                ></td>
                              ) : null}
                              <td
                                className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                  }`}
                                colSpan={
                                  orderPrintById.cart.gst_amt != 0 ? 4 : 3
                                }
                              ></td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                    <tr style={{ backgroundColor: `${dynamicColor}` }}>
                      <td></td>
                      {printSetting?.setting_details.productImage == true &&
                        printSetting?.setting_details.productImageinColumn && (
                          <td className={`text-center srno`}></td>
                        )}
                      {getActiveRow2Fields().map((field) => (
                        <td key={field.title}></td>
                      ))}

                      {printSetting?.setting_details?.qtycolumn === true && (
                        <td className="text-right">
                          <strong>Total</strong>
                        </td>
                      )}
                      {printSetting?.setting_details?.qtycolumn === false && (
                        <td className="text-right"></td>
                      )}
                      {printSetting?.setting_details?.qtycolumn === true && (
                        <td className="without_price_check text-right">
                          <strong>{qtyCount}</strong>
                        </td>
                      )}
                      {printSetting?.setting_details.rate && (
                        <>
                          <td className="without_price_check"></td>
                          <td className="without_price_check"></td>
                          {printSetting?.setting_details.discountColumn ==
                            true && (
                              <>
                                <td className={`text-right`}></td>
                              </>
                            )}

                          {gstAmount ? (
                            <>
                              <td className="without_price_check"></td>
                              <td></td>
                            </>
                          ) : (
                            ""
                          )}
                        </>
                      )}
                    </tr>
                    <tr>
                      <td colSpan={totalColumns} style={{ padding: 0 }}>
                        <table
                          style={{
                            padding: 0,
                            margin: 0,
                            width: "100%",
                            backgroundColor: "transparent",
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.setProperty(
                                "width",
                                "100%",
                                "important",
                              );
                              el.style.setProperty("margin", "0", "important");
                              el.style.setProperty(
                                "border",
                                "0px",
                                "important",
                              );
                            }
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                className="without_price_check"
                                rowSpan={
                                  printSetting?.setting_details.rate == true
                                    ? 5
                                    : 1
                                }
                                colSpan={
                                  printSetting?.setting_details.rate == true
                                    ? 1
                                    : 3
                                }
                                style={{
                                  maxWidth:
                                    printSetting?.setting_details.rate == true
                                      ? "60%"
                                      : "100%",
                                  width:
                                    printSetting?.setting_details.rate == true
                                      ? "60%"
                                      : "100%",
                                  verticalAlign: "top",
                                  border: "0px",
                                  padding: "0px",
                                }}
                              >
                                {printSetting?.setting_details.termsCondition ==
                                  true && (
                                    <>
                                      {orderPrintById?.cart
                                        .cart_terms_and_condition.length > 0 &&
                                        orderPrintById?.cart
                                          .cart_terms_and_condition != "" &&
                                        orderPrintById?.cart
                                          .cart_terms_and_condition !=
                                        undefined &&
                                        orderPrintById?.cart
                                          .cart_terms_and_condition != null && (
                                          <>
                                            <div
                                              style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                              }}
                                            >
                                              <div>
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
                                                {printSetting?.setting_details
                                                  .rate && (
                                                    <>
                                                      <b>Grand Total In Words</b> :{" "}
                                                      {grandTotalInWords}
                                                      <br />
                                                    </>
                                                  )}
                                                {/* {printSetting?.setting_details.rate &&
                                            gstAmount != 0 ? (
                                            <>
                                              <b>GST Total In Words</b> :{" "}
                                              <span>{gstTotalInWords}</span>
                                            </>
                                          ) : (
                                            ""
                                          )}
                                          <br /> */}
                                                {orderPrintById.cart.cart_remark
                                                  .length > 0 && (
                                                    <>
                                                      <b style={{ width: "400px" }}>
                                                        Remarks
                                                      </b>{" "}
                                                      :{" "}
                                                    </>
                                                  )}

                                                <span
                                                  style={{
                                                    maxWidth: "400px",
                                                    display: "inline-flex",
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  <SafeHtml
                                                    htmlContent={orderPrintById.cart.cart_remark?.replace(
                                                      /\n/g,
                                                      "<br>",
                                                    )}
                                                  />
                                                </span>
                                              </div>
                                              <div style={{ padding: "5px" }}>
                                                {(orderPrintById.cart.type == 2 ||
                                                  orderPrintById.cart.type == 3 ||
                                                  orderPrintById.cart.type ==
                                                  1) &&
                                                  orderPrintById?.cart
                                                    .currency_id == 3 &&
                                                  printSetting?.setting_details
                                                    .paymentQR == true && (
                                                    <>
                                                      <QRCodeSVG
                                                        value={`upi://pay?pa=${orderPrintById
                                                          ?.companyDetail.upi_id
                                                          }&pn=${encodeURIComponent(
                                                            orderPrintById
                                                              ?.companyDetail
                                                              .upi_name,
                                                          )}&am=${orderPrintById?.cart
                                                            .grand_total -
                                                          orderPrintById?.cart
                                                            .advance_payment
                                                          }&cu=INR&tn=${dynamicTitle}%20No.%20:%20${encodeURI(
                                                            orderPrintById?.cart
                                                              ?.cart_number || "",
                                                          )}`}
                                                        size={90}
                                                      />
                                                      <center>
                                                        <p
                                                          style={{
                                                            marginTop: "5px",
                                                            marginBottom: "0px",
                                                            fontSize: "10px",
                                                          }}
                                                        >
                                                          Payable Amount<br></br>
                                                          By UPI
                                                        </p>
                                                      </center>
                                                    </>
                                                  )}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                    </>
                                  )}
                              </td>

                              {printSetting?.setting_details.rate && (
                                <>
                                  <td
                                    className={`text-right without_price_check  ${showBorder ? "no-print-border" : ""
                                      }`}
                                    style={{ borderTop: "0" }}
                                  >
                                    <strong>Total</strong>
                                  </td>
                                  <td
                                    className={`text-right now-rap-white-space without_price_check  ${showBorder ? "no-print-border" : ""
                                      }`}
                                    style={{
                                      borderTop: "0",
                                      borderRight: "0px",
                                    }}
                                  >
                                    <strong>
                                      {orderPrintById?.cart.total_amt
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` +
                                        formatNumber(
                                          orderPrintById?.cart.total_amt,
                                          2,
                                        )
                                        : `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` + "0"}
                                    </strong>
                                  </td>
                                </>
                              )}
                            </tr>
                            {printSetting?.setting_details.rate &&
                              (() => {
                                const getCurrencySymbol = () =>
                                  currency.find(
                                    (curr) =>
                                      curr.id ===
                                      orderPrintById?.cart.currency_id,
                                  )?.symbol || "₹";

                                const rowsData = [
                                  {
                                    key: "packing",
                                    label:
                                      orderPrintById?.cart
                                        .packing_forwarding_charge_title ||
                                      "Transport Charge",
                                    value:
                                      orderPrintById?.cart
                                        .packing_forwarding_charge,
                                    condition:
                                      orderPrintById?.cart
                                        .packing_forwarding_charge > 0,
                                  },
                                  {
                                    key: "transport",
                                    label:
                                      orderPrintById?.cart
                                        .transport_charge_title ||
                                      "Transport Charge",
                                    value:
                                      orderPrintById?.cart.transport_charge,
                                    condition:
                                      orderPrintById?.cart.transport_charge > 0,
                                  },
                                  {
                                    key: "subtotal",
                                    label: "Sub Total",
                                    value:
                                      orderPrintById?.cart.taxable_amt || 0,
                                    condition: true,
                                  },
                                  {
                                    key: "tcs",
                                    label:
                                      orderPrintById?.cart.tcs_title || "TCS",
                                    value: orderPrintById?.cart.tcs_amt,
                                    condition: orderPrintById?.cart.tcs_amt > 0,
                                  },
                                  /* {
                                    key: "advance_payment",
                                    label: "Advance Received Amount",
                                    value: orderPrintById?.cart.advance_payment,
                                    condition:
                                      orderPrintById?.cart.advance_payment > 0,
                                  }, */
                                ];

                                const activeRows = rowsData.filter(
                                  (row) => row.condition,
                                );
                                const totalRows = 4;
                                const blankRowsNeeded =
                                  totalRows - activeRows.length;

                                return (
                                  <>
                                    {activeRows.map((row) => (
                                      <tr key={row.key}>
                                        <td
                                          className={`text-right  without_price_check  ${showBorder ? "no-print-border" : ""
                                            }`}
                                        >
                                          <strong>{row.label}</strong>
                                        </td>
                                        <td
                                          className={`text-right now-rap-white-space without_price_check  ${showBorder ? "no-print-border" : ""
                                            }`}
                                          style={{ borderRight: "0px" }}
                                        >
                                          {`${getCurrencySymbol()} ${formatNumber(
                                            row.value,
                                            2,
                                          )}`}
                                        </td>
                                      </tr>
                                    ))}

                                    {Array.from({
                                      length: blankRowsNeeded,
                                    }).map((_, index) => (
                                      <tr key={`blank-${index}`}>
                                        <td
                                          className={`text-right without_price_check  ${showBorder ? "no-print-border" : ""
                                            }`}
                                        ></td>
                                        <td
                                          className={`text-right without_price_check  ${showBorder ? "no-print-border" : ""
                                            }`}
                                          style={{ borderRight: "0px" }}
                                        ></td>
                                      </tr>
                                    ))}

                                    <tr className="without_price_check">
                                      <td
                                        rowSpan={1}
                                        style={{
                                          borderLeft: "0px",
                                          borderTop: "0px",
                                        }}
                                      ></td>
                                      <td
                                        className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                          }`}
                                      >
                                        <strong>Round Off</strong>
                                      </td>
                                      <td
                                        className={`text-right without_price_check ${showBorder ? "no-print-border" : ""
                                          }`}
                                        style={{ borderRight: "0px" }}
                                      >
                                        {`${getCurrencySymbol()} ${formatNumber(
                                          orderPrintById?.cart.round_off || 0,
                                          2,
                                        )}`}
                                      </td>
                                    </tr>
                                  </>
                                );
                              })()}

                            <tr className="without_price_check grand-total-row">
                              <td
                                rowSpan={
                                  1 +
                                  (orderPrintById?.cart.advance_payment > 0
                                    ? 2
                                    : 0)
                                }
                                style={{ border: "0px" }}
                              >
                                {printSetting?.setting_details.note && (
                                  <>
                                    <b>
                                      <>
                                        Note : {orderPrintById.cart.cart_note}
                                      </>
                                    </b>
                                  </>
                                )}
                              </td>
                              {printSetting?.setting_details.rate && (
                                <>
                                  <td
                                    className={`text-right`}
                                    style={{
                                      fontSize: "16px",
                                      borderBottom: "0px",
                                      color: "green",
                                    }}
                                  >
                                    <strong>Grand Total</strong>
                                  </td>
                                  <td
                                    className={`text-right now-rap-white-space`}
                                    style={{
                                      fontSize: "15px",
                                      borderBottom: "0px",
                                      borderRight: "0px",
                                      color: "green",
                                      // width: "25%", // Increased from 17%
                                      // minWidth: "25%",
                                    }}
                                  >
                                    <strong>
                                      {orderPrintById?.cart.grand_total
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` +
                                        formatNumber(
                                          orderPrintById?.cart.grand_total,
                                          2,
                                        )
                                        : `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` + "0"}
                                    </strong>
                                  </td>
                                </>
                              )}
                            </tr>

                            {orderPrintById?.cart.advance_payment > 0 && (
                              <>
                                <tr className="without_price_check">
                                  <td
                                    className="text-right"
                                    style={{
                                      fontSize: "14px",
                                      borderBottom: "0px",
                                    }}
                                  >
                                    <strong>Advance Received Amount</strong>
                                  </td>
                                  <td
                                    className="text-right now-rap-white-space"
                                    style={{
                                      fontSize: "14px",
                                      borderBottom: "0px",
                                      borderRight: "0px",
                                    }}
                                  >
                                    <strong>
                                      {orderPrintById?.cart.advance_payment
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` +
                                        formatNumber(
                                          orderPrintById?.cart
                                            .advance_payment,
                                          2,
                                        )
                                        : `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` + "0"}
                                    </strong>
                                  </td>
                                </tr>
                                <tr
                                  className="without_price_check"
                                  style={{ color: "orange" }}
                                >
                                  <td
                                    className="text-right"
                                    style={{
                                      fontSize: "14px",
                                      borderBottom: "0px",
                                    }}
                                  >
                                    <strong>Payable Amount</strong>
                                  </td>
                                  <td
                                    className="text-right now-rap-white-space"
                                    style={{
                                      fontSize: "14px",
                                      borderBottom: "0px",
                                      borderRight: "0px",
                                    }}
                                  >
                                    <strong>
                                      {orderPrintById?.cart.advance_payment
                                        ? `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` +
                                        formatNumber(
                                          orderPrintById?.cart.grand_total -
                                          orderPrintById?.cart
                                            .advance_payment,
                                          2,
                                        )
                                        : `${currency.find(
                                          (curr) =>
                                            curr.id ===
                                            orderPrintById?.cart
                                              .currency_id,
                                        )?.symbol || "₹"
                                        } ` + "0"}
                                    </strong>
                                  </td>
                                </tr>
                              </>
                            )}

                            {printSetting?.setting_details.signSignatory ==
                              true && (
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
                                    }}
                                  ></td>
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
                                            : "50px",
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
                                  </td>
                                </tr>
                              )}
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
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                display: pdfmeEnabled ? "none" : undefined,
              }}
            >
              <button
                className="icons "
                onClick={openPrintSetting}
                title="Print setting"
              >
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

              <button className="icons " onClick={openPdf} title="download PDF">
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
            {isPrintSettingShow && printSetting && (
              <PrintSettingModal
                show={isPrintSettingShow}
                setShow={setIsPrintSettingShow}
                onHide={() => setIsPrintSettingShow(false)}
                handleSubmit={() => {
                  setIsLoadingAfterUpdate(true);

                  if (orderPrintById?.cart?.type && dynamicViewFormate) {
                    fetchprintSetting(
                      setPrintSetting,
                      Number(PRINT_SETTING_TYPE_OBJ[String(orderPrintById.cart.type) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
                      dynamicViewFormate,
                      MobileToken,
                      getID,
                    )
                      .then(() => {
                        return Promise.all(
                          orderIds.map((singleId) =>
                            fetchOrderByForPrintIdApi(
                              Number(singleId),
                              MobileToken,
                              getID,
                            ),
                          ),
                        );
                      })
                      .then((responses) => {
                        const validData = responses.filter(
                          (item): item is ItemDetails => item !== null,
                        );

                        setOrderPrintList(validData);

                        // backward compatibility
                        setOrderPrintById(validData[0]);

                        setTimeout(() => {
                          setIsPrintSettingShow(false);
                          setIsLoadingAfterUpdate(false);
                        }, 1000);
                      })
                      .catch(() => {
                        setIsLoadingAfterUpdate(false);
                        setIsPrintSettingShow(false);
                      });
                  } else {
                    setIsPrintSettingShow(false);
                    setIsLoadingAfterUpdate(false);
                  }
                }}
                orderType={orderPrintById?.cart.type}
                viewFormate={dynamicViewFormate}
                orderById={printSetting?.setting_details}
                titles={"Create"}
                message={"Please Enter Your Order Details"}
                btn1={"CANCEL"}
                btn2={"Approve"}
                getID={getID}
              />
            )}
            {downloadTemplateChoices.length > 0 && (
              <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5>Choose Template</h5>
                    <span
                      className="close"
                      onClick={() => setDownloadTemplateChoices([])}
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
                        onClick={() => downloadWithTemplate(t.id)}
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
                        Print
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default OrderPrintViewV4;
