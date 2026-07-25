import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { IWareHouseList, StockProduct } from "./stock-product/stocktypes";
import { SingleValue } from "react-select";
import { IOption } from "../../../../../helpers/AppInterface";
import { DateObject } from "react-multi-date-picker";

export interface IStockDetailList {
  stock_adjustment_type: SingleValue<IOption>;
  stock_date: DateObject;
  stock_remark: string;
}

export interface IStockItemList {
  product_id: number;
  warehouse_from: string | number | null;
  warehouse_to: string | number | null;
  qty: number;
  remark: string;
  category_id: number | string;
  category_name: string;
  product_code: string;
  product_name: string;
}

export interface IStockDetailListSubmit {
  stock_adjustment_type: string | number;
  stock_date: string;
  stock_remark: string;
}

export const fetchWareHouse = async (
  setWarehouse: TReactSetState<IWareHouseList[]>,
) => {
  try {
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      a_application_login_id: uuid,
    };
    const response = await axiosInstance.post("getwarehouse", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const data = response.data.data.item?.map((v: any) => ({
        value: v.id,
        label: v.warehouse_name,
      }));
      setWarehouse(data);
    } else {
      setWarehouse([]);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching currency:", error);
    setWarehouse([]);
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchProductStockList = async (
  page: number,
  itemsPerPage: number,
  search: string,
  searchBarcodeNum1: number,
  selectedCategory: { label: string; value: string } | null,
  setProducts: React.Dispatch<React.SetStateAction<StockProduct[]>>, // ← fixed here
): Promise<StockProduct[]> => {
  const getUUID = localStorage.getItem("UUID");
  const start: number = page * itemsPerPage;

  const requestData = {
    ul: start,
    ll: itemsPerPage,
    a_application_login_id: getUUID,
    searchTerm: search || "",
    searchBarcodeNum: searchBarcodeNum1,
    searchCategoryId: selectedCategory ? selectedCategory.value : null,
  };

  try {
    const response = await axiosInstance.post("product", requestData);

    if (response.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      console.warn("API ack failed, no more data");
      return [];
    }

    // Explicitly type the items from API
    const newItems = response.data.data.item || [];
    const filterItem: StockProduct[] = newItems.map((v: any) => ({
      id: v.id,
      name: v.product_name,
      image: v.product_img,
      stock: v.closing_qty,
      category_id: v.category_id,
      category_name: v.category_name,
      product_code: v.product_code,
    }));

    if (page === 0) {
      setProducts(filterItem);
    } else {
      setProducts((prev) => {
        const existingIds = new Set(prev.map((item) => item.id)); // item is now Product
        const uniqueNew = filterItem.filter(
          (item) => !existingIds.has(item.id),
        ); // item is now Product
        return [...prev, ...uniqueNew];
      });
    }

    return filterItem;
  } catch (error: any) {
    console.error("Error fetching products:", error);
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    return [];
  }
};

export const insertStock = async (
  stockDetail: IStockDetailListSubmit,
  stockItem: IStockItemList[],
  where_action: number,
  setRefreshStockAdjustment: TReactSetState<boolean> | undefined,
  handleHide: () => void,
) => {
  try {
    setRefreshStockAdjustment && setRefreshStockAdjustment(false);
    const getUUID = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("insert-stock", {
      stockDetail,
      stockItem,
      a_application_login_id: getUUID,
    });
    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Product created successfully", {
        style: { whiteSpace: "pre-line" },
      });
      handleHide();
      if (where_action === 1) {
        setRefreshStockAdjustment && setRefreshStockAdjustment(true);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED, {
        style: { whiteSpace: "pre-line" },
      });
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      {
        style: { whiteSpace: "pre-line" },
      },
    );
  }
};

export const fetchAllStockData = async (StockId: number, setCartData: any, setCartItemsData: any) => {
  try {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
      stock_id: StockId,
      a_application_login_id
    };

    const response = await axiosInstance.post("get-all-stock-data", requestData, {
                    headers: {
                        Authorization: `${token}`,
                        "x-tenant-id": a_application_login_id,
                    },
                });

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setCartData(response.data.data.item.resultOfCarts);
      setCartItemsData(response.data.data.item.resultOfCartItems);
    } else {
      setCartData({});
      setCartItemsData({});
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching stock data:", error);
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    return [];
  }
};