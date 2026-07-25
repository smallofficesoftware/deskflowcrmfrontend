import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IStockAdjustmentView {
  id: number;
  type: string | number;
  cart_number: string;
  cart_date: string;
  a_application_login_id: string | number;
  total_qty: number;
  created_date_time: string;
  created_by_name: string;
}

export const handleDeleteStockAdjustment = async (
  stockAdjustmentIds: number | string,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setStockAdjustmentList: TReactSetState<IStockAdjustmentView[]>,
) => {
  const getUUID = localStorage.getItem("UUID");

  try {
    setLoading(true);
    const requestData = {
      stock_adjustment_id: stockAdjustmentIds,
      a_application_login_id: getUUID,
    };

    const data = await axiosInstance.post(
      "delete-stock-adjustment",
      requestData,
    );

    if (data.data.ack === 1) {
      setIsDeleteConfirmation(false);
      fetchStockAdjustmentApi(
        0,
        ITEMS_PER_PAGE,
        setStockAdjustmentList,
        setLoading,
        "",
      );
      toast.success("Stock Adjustment Deleted Successfully");
    } else {
      toast.error(data.data.ack_msg || "Unknown error occurred");
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || "Unknown error occurred");
  } finally {
    setLoading(false);
  }
};

export const fetchStockAdjustmentApi = async (
  page: number,
  itemsPerPage: number,
  setStockAdjustmentList: (items: IStockAdjustmentView[]) => void,
  setLoading: TReactSetState<boolean>,
  term: string,
) => {
  const getUUID = localStorage.getItem("UUID");
  const start: number = page * itemsPerPage;

  const requestData = {
    ul: start, // Upper limit based on page number
    ll: itemsPerPage, // Lower limit based on page number
    a_application_login_id: getUUID,
    searchTerm: term,
  };
  try {
    const data = await axiosInstance.post(
      "get-stock-adjustment-list",
      requestData,
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setStockAdjustmentList([]);
      }
      setLoading(true);
      setStockAdjustmentList(data.data.data.item);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const getItemWiseCurrentStock = async (
  setIsLoadingCurrentStockFetch: TReactSetState<boolean>,
  item_ids: string,
) => {
  try {
    setIsLoadingCurrentStockFetch(true);
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
      ul: 0,
      ll: 1000,
      a_application_login_id: getUUID,
      productId: item_ids,
    };
    const data = await axiosInstance.post("product", requestData);
    let item = [];
    if (data.status === 200) {
      item = data.data.data.item.map((v: any) => {
        return {
          product_id: v.id,
          current_stock: v.closing_qty,
        };
      });
      return item;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setIsLoadingCurrentStockFetch(false);
  }
};
