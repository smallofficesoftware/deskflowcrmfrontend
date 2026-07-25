import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IProductInventory {
  name: string;
  code: string;
  category_name: string;
  openingStock: number;
  inward: number;
  purchase: number;
  returnPurchase: number;
  dispatch: number;
  sales: number;
  returnSales: number;
  stockAdjustmentInward: number;
  stockAdjustmentOutward: number;
  closingStock: number;
  min_stock_quantity: number;
  max_stock_quantity: number;
  item_unit_name: string;
  total_closing_stock_value: string;
  total_closing_stock_rate: string;
}

export const fetchProductInventory = async (
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedProduct?: string | null,
  selectedCategory?: string | null,
  selectedWarehouseIds?: string | null,
  ul: number = 0,
  ll: number = 50,
  globalSearch?: string,
  selectedStockTypeId?: string | null,
): Promise<{ items: IProductInventory[]; total_count: number } | null> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selectedDates,
    selectedProduct,
    selectedCategory,
    selectedStockTypeId,
    selectedWarehouseIds,
    a_application_login_id: getUUID,
    ul,
    ll,
    globalSearch,
  };

  try {
    const response = await axiosInstance.post(
      "/getProductInventoryReport",
      requestedData,
    );

    if (response?.data?.ack === 3) {
      toast.error(response.data.ack_msg);
      return null;
    }

    const items = response?.data?.data?.items ?? [];
    console.log("type", typeof response?.data?.data?.totalRecords)
    const total_count =
      typeof response?.data?.data?.totalRecords === "number"
        ? response.data.data.totalRecords
        : 0;

    return { items, total_count };
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
};

export const exportProductInventoryData = async <T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  limit = 500,
): Promise<T[]> => {
  let offset = 0;
  let allData: T[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk || chunk.length === 0) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};
