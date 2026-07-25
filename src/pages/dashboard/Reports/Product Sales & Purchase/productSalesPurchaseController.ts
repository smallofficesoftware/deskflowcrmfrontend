import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IProductSalesData {
  item_product_id: number;
  item_product_name: string;
  item_product_code: string;
  item_category_name: string;
  item_unit_name: string;
  quotation?: string;
  salesorder?: string;
  salesinvoice?: string;
  purchaseinvoice?: string;
  purchaseorder?: string;
}

const pivotData = (data: {
  quotation: any[];
  salesOrder: any[];
  salesInvoice: any[];
  purchaseInvoice: any[];
  purchaseOrder: any[];
}): IProductSalesData[] => {
  const groupedByProduct: { [key: string]: IProductSalesData } = {};

  const processItems = (items: any[], cartType: number) => {
    items.forEach((item) => {
      const key = `${item.item_product_id}_${item.item_product_name}`;
      if (!groupedByProduct[key]) {
        groupedByProduct[key] = {
          item_product_id: item.item_product_id,
          item_product_name: item.item_product_name,
          item_product_code: item.item_product_code,
          item_category_name: item.item_category_name,
          item_unit_name: item.item_unit_name,
        };
      }

      const value = `${item.total_quantity}(${item.total_amount})`;
      switch (cartType) {
        case 1:
          groupedByProduct[key].quotation = value;
          break;
        case 2:
          groupedByProduct[key].salesorder = value;
          break;
        case 3:
          groupedByProduct[key].salesinvoice = value;
          break;
        case 4:
          groupedByProduct[key].purchaseinvoice = value;
          break;
        case 5:
          groupedByProduct[key].purchaseorder = value;
          break;
      }
    });
  };

  processItems(data.quotation || [], 1);
  processItems(data.salesOrder || [], 2);
  processItems(data.salesInvoice || [], 3);
  processItems(data.purchaseInvoice || [], 4);
  processItems(data.purchaseOrder || [], 5);

  const result = Object.values(groupedByProduct);
  return result;
};

export const fetchProductReport = async (
  selectedDates: DateObject[] | any | undefined,
  setError?: TReactSetState<string | null>,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedProduct?: string | null,
  selectedCategory?: string | null,
  selectedContactId?: string | null,
  globalSearch?: string,
  offset?: number,
  limit?: number,
  referenceWiseContact?: number
): Promise<any[]> => {

  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  if (!token || !getUUID) {
    const errorMessage = "Authentication details are missing";
    toast.error(errorMessage);
    setError?.(errorMessage);
    return [];
  }

  const requestedData = {
    selectedDates: selectedDates
      ? selectedDates.map((date: DateObject | any) =>
        date instanceof DateObject ? date.format("YYYY-MM-DD") : date
      )
      : undefined,
    a_application_login_id: getUUID,
    selectedProduct,
    selectedCategory,
    selectedContactId,
    globalSearch,
    ul: offset,
    ll: limit,
    referenceWiseContact: referenceWiseContact
  };

  try {
    const response = await axiosInstance.post(
      "getProductSales&Purchase",
      requestedData
    );

    if (response.data.ack === 3) {
      toast.error(response.data.ack_msg);
      return [];
    }

    const data = response.data.data || {
      quotation: [],
      salesOrder: [],
      salesInvoice: [],
      purchaseInvoice: [],
      purchaseOrder: [],
    };

    const pivotedData = pivotData(data);
    const items = Array.isArray(pivotedData) ? pivotedData : [];

    setError?.(null);
    return items;

  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED;

    toast.error(errorMessage);
    setError?.(errorMessage);
    return [];
  }
};

export const fetchProductWiseMomentForExport = async (
  selectedDates: DateObject[] | any | undefined,
  setError?: TReactSetState<string | null>,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedProduct?: string | null,
  selectedCategory?: string | null,
  selectedContactId?: string | null,
  globalSearch?: string,
  offset = 0,
  limit = 500
): Promise<IProductSalesData[]> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selectedDates: selectedDates
      ? selectedDates.map((date: any) =>
        date instanceof DateObject ? date.format("YYYY-MM-DD") : date
      )
      : undefined,
    a_application_login_id: getUUID,
    selectedProduct,
    selectedCategory,
    selectedContactId,
    globalSearch,
    ul: offset,
    ll: limit,
  };

  const response = await axiosInstance.post(
    "getProductSales&Purchase",
    requestedData
  );

  if (response?.data?.ack === 3) {
    toast.error(response.data.ack_msg);
    return [];
  }

  const apiData = response?.data?.data;

  if (!apiData) return [];

  // 🔥 MAIN FIX — object → array
  return pivotData({
    quotation: apiData.quotation || [],
    salesOrder: apiData.salesOrder || [],
    salesInvoice: apiData.salesInvoice || [],
    purchaseInvoice: apiData.purchaseInvoice || [],
    purchaseOrder: apiData.purchaseOrder || [],
  });
};



export const exportAllProductWiseMovementData = async (
  fetchFn: (offset: number, limit: number) => Promise<IProductSalesData[]>,
  limit = 500
): Promise<IProductSalesData[]> => {
  let offset = 0;
  let allData: IProductSalesData[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};


