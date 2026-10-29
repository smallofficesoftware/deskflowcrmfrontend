import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IWarehouseTransferSummary {
  warehouse_id: number;
  warehouse_name: string;
  /** Warehouse-to-warehouse transfers only. */
  transfer_in: number;
  transfer_out: number;
  /** Every stock movement (dispatch, invoice, GRN, returns, stock adjustment, transfers). */
  total_in: number;
  total_out: number;
  net: number;
}

export interface IWarehouseSourceWise extends IWarehouseTransferSummary {
  source: string;
}

export interface IWarehouseTransferProductWise extends IWarehouseTransferSummary {
  product_id: number;
  product_name: string;
  product_code: string;
}

export interface IWarehouseTransferRow {
  sr_by_number: number;
  cart_date: string;
  remark: string;
  out_cart_number: string;
  in_cart_number: string;
  product_id: number;
  product_name: string;
  product_code: string;
  from_warehouse_id: number | null;
  from_warehouse_name: string;
  to_warehouse_id: number | null;
  to_warehouse_name: string;
  qty: number;
}

export interface IWarehouseTransferReport {
  summary: IWarehouseTransferSummary[];
  product_wise: IWarehouseTransferProductWise[];
  source_wise: IWarehouseSourceWise[];
  transfers: IWarehouseTransferRow[];
  totals: {
    transfer_in: number;
    transfer_out: number;
    total_in: number;
    total_out: number;
    net: number;
    transfer_count: number;
  };
}

export const emptyWarehouseTransferReport: IWarehouseTransferReport = {
  summary: [],
  product_wise: [],
  source_wise: [],
  transfers: [],
  totals: { transfer_in: 0, transfer_out: 0, total_in: 0, total_out: 0, net: 0, transfer_count: 0 },
};

export const fetchWarehouseTransferReportApi = async (
  setReport: TReactSetState<IWarehouseTransferReport>,
  setLoading: TReactSetState<boolean>,
  fromDate: string,
  toDate: string,
  warehouseId: string,
) => {
  setLoading(true);
  try {
    const response = await axiosInstance.post("warehouse-transfer-report", {
      a_application_login_id: localStorage.getItem("UUID"),
      from_date: fromDate,
      to_date: toDate,
      warehouse_id: warehouseId || undefined,
    });
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setReport(response.data.data);
    } else {
      setReport(emptyWarehouseTransferReport);
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    setReport(emptyWarehouseTransferReport);
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};
