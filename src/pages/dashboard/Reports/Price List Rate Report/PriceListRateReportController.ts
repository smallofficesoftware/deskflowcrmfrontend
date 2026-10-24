import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IPriceListRateCurrentRow {
  price_list_id: number;
  pricelist_masters_id: number;
  price_list_name: string;
  product_id: number;
  product_name: string | null;
  product_code: string | null;
  rate: number | null;
  discount: number | null;
  discount_amount: number | null;
  net_rate: number | null;
  last_updated: string;
  last_updated_by_name: string;
}

export interface IPriceListRateHistoryRow {
  history_id: number;
  price_list_id: number;
  pricelist_masters_id: number;
  price_list_name: string | null;
  product_id: number;
  product_name: string | null;
  product_code: string | null;
  change_type: "insert" | "update";
  old_rate: number | null;
  new_rate: number | null;
  old_discount: number | null;
  new_discount: number | null;
  old_net_rate: number | null;
  new_net_rate: number | null;
  changed_date_time: string;
  changed_by_name: string;
}

export interface IPriceListRateReport {
  current: IPriceListRateCurrentRow[];
  history: IPriceListRateHistoryRow[];
  totals: {
    price_lists: number;
    products: number;
    changes: number;
  };
}

export const emptyPriceListRateReport: IPriceListRateReport = {
  current: [],
  history: [],
  totals: { price_lists: 0, products: 0, changes: 0 },
};

export const fetchPriceListRateReportApi = async (
  setReport: TReactSetState<IPriceListRateReport>,
  setLoading: TReactSetState<boolean>,
  fromDate: string,
  toDate: string,
) => {
  setLoading(true);
  try {
    const response = await axiosInstance.post("price-list-report", {
      a_application_login_id: localStorage.getItem("UUID"),
      from_date: fromDate,
      to_date: toDate,
    });
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setReport(response.data.data);
    } else {
      setReport(emptyPriceListRateReport);
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    setReport(emptyPriceListRateReport);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};
