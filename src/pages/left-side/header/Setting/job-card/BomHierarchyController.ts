import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";

const uuid = () => localStorage.getItem("UUID");

export interface IProcessTime {
  process_name: string;
  seconds: number;
}

export interface IOpenJobCard {
  job_id: number;
  parent_job_card_id: number | null; // set = this is a sub job card
  production_qty: number;
  produced_qty: number;
  pending_qty: number;
}

export interface IBomTreeNode {
  product_id: number;
  product_name: string;
  product_code: string;
  unit: string | number;
  qty: number;
  available_qty?: number; // raw materials only
  open_job_cards?: IOpenJobCard[]; // products with a BOM only
  own_seconds?: number; // this product's own process time for qty
  processes?: IProcessTime[];
  has_bom: boolean;
  truncated?: boolean; // expansion stopped (cycle or too deep)
  children: IBomTreeNode[];
}

export interface IBomHierarchyRow {
  product_id: number;
  product_name: string;
  product_code: string;
  unit: string | number;
  required_qty: number;
  available_qty?: number;
  shortage_qty?: number;
  open_job_cards?: number; // "products to make" rows only
  time_seconds?: number; // "products to make" rows only
}

export interface IBomHierarchy {
  tree: IBomTreeNode;
  intermediate_products: IBomHierarchyRow[];
  raw_materials: IBomHierarchyRow[];
  total_seconds: number;
}

// Full multi-level BOM of a product for a production qty: the tree for the
// chart plus the "to make" and "raw materials needed" tables.
export const fetchBomHierarchy = async (
  productId: number,
  qty: number,
): Promise<IBomHierarchy | null> => {
  try {
    const { data } = await axiosInstance.post("job-card/bom-hierarchy", {
      a_application_login_id: uuid(),
      product_id: productId,
      qty,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) return data.data;
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
};
