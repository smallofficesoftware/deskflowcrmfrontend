import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { IStageStatusView } from "../stage-status/StageStatusController";
import {
  IBomProcess,
  IContactDetail,
  IItemDetail,
  IJobCardListItem,
  IProductionEntryDetail,
  IProductionEntryListItem,
  IProductionEntrySavePayload,
  ITeamMemberOption,
  IWarehouseOption,
  stockKey,
  WarehouseStockMap,
} from "./JobCardTypes";

const uuid = () => localStorage.getItem("UUID");

// ─── List: paginated job card history ────────────────────────────────────────

export const fetchJobCardList = async (
  setList: TReactSetState<IJobCardListItem[]>,
  setLoading: TReactSetState<boolean>,
  searchTerm: string = "",
  limit: number = 30,
  offset: number = 0,
  append: boolean = false,
  labelOptions: any[] = [],
  statusOptions: any[] = [],
  assignedTeamOptions: any[] = [],
  createdTeamOptions: any[] = [],
  labelAndOr: number = 0,
): Promise<boolean> => {
  try {
    const data = await axiosInstance.post("job-card/fetch", {
      a_application_login_id: uuid(),
      ul: offset,
      ll: limit,
      searchTerm,
      labelOptions,
      statusOptions,
      assignedTeamOptions,
      createdTeamOptions,
      labelAndOr,
    });
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        if (!append) setList([]);
        return false;
      }
      const newItems: IJobCardListItem[] = data.data.data || [];
      if (append) {
        setList((prev) => [...prev, ...newItems]);
      } else {
        setList(newItems);
      }
      return newItems.length === limit;
    }
    return false;
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setTimeout(() => setLoading(false), 1000);
  }
};

// ─── Dropdowns ────────────────────────────────────────────────────────────────
// (The old eager job-card/customers, job-card/orders, job-card/order-items
// fetchers were removed — the searchable dropdowns below replace them.)

// ─── Searchable Dropdowns (async, type-to-search) ─────────────────────────────
// Used by ItemSelectSection's CustomSearchDropdown fields, backed by the real
// Contact / listOrder / orderById endpoints (not the placeholder job-card/*
// endpoints used by the eager fetchers above).

// value is string | number to match CustomSearchDropdown's own Option type
export interface IOption {
  value: string | number;
  label: string;
}

// Raw shapes (only the fields we actually read) — full payloads carry many
// more fields we don't need for the dropdown.
interface IRawContact {
  id: number;
  person_name: string;
  company_name?: string;
}

interface IRawOrder {
  id: number;
  cart_number: string;
  cart_date?: string;
}

interface IRawOrderItem {
  id: number;
  item_product_name: string;
  item_product_code?: string;
  item_qty: number;
  item_unit_name: string;
}

// ── Customer search (Contact) ──
export const searchCustomers = async (
  inputValue: string,
): Promise<IOption[]> => {
  if (!inputValue) return [];
  try {
    const { data } = await axiosInstance.post("Contact", {
      a_application_login_id: uuid(),
      searchTerm: inputValue || "",
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items: IRawContact[] = data.data?.item || [];
      return items.map((c) => ({
        value: c.id,
        label: c.company_name
          ? `${c.person_name.trim()} - ${c.company_name}`
          : c.person_name.trim(),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading customers:", error);
    return [];
  }
};

// ── Order search (listOrder), scoped to a customer ──
export const searchOrdersByCustomer = async (
  contactMasterId: number,
  inputValue: string,
): Promise<IOption[]> => {
  if (!inputValue) return [];
  try {
    const { data } = await axiosInstance.post("listOrder", {
      a_application_login_id: uuid(),
      contact_master_id: contactMasterId,
      searchTerm: inputValue || "",
      order_type: 2,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items: IRawOrder[] = data.data?.item || [];
      return items.map((o) => ({
        value: o.id,
        label: o.cart_number || `Order #${o.id}`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading orders:", error);
    return [];
  }
};

// ── Order items for a cart, filtered to items whose product has a BOM ──
export const fetchOrderItemsByCart = async (
  cartId: number,
): Promise<IOption[]> => {
  try {
    const { data } = await axiosInstance.post("job-card/order-items", {
      a_application_login_id: uuid(),
      cart_id: cartId,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items: IRawOrderItem[] = data.data?.items || [];
      return items.map((i) => ({
        value: i.id,
        label: i.item_product_code
          ? `${i.item_product_name} (${i.item_product_code}) — ${i.item_qty} ${i.item_unit_name}`
          : `${i.item_product_name} — ${i.item_qty} ${i.item_unit_name}`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading order items:", error);
    return [];
  }
};

// ── BOM product search (Direct Product / For Customer modes) ──
export const searchBomProducts = async (
  inputValue: string,
): Promise<IOption[]> => {
  try {
    const { data } = await axiosInstance.post("job-card/products", {
      a_application_login_id: uuid(),
      searchTerm: inputValue || "",
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items: {
        id: number;
        product_name: string;
        product_code?: string;
        unit?: string;
      }[] = data.data?.items || [];
      return items.map((p) => ({
        value: p.id,
        label: p.product_code
          ? `${p.product_name} (${p.product_code})`
          : p.product_name,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading BOM products:", error);
    return [];
  }
};

// ─── Warehouse & Team Member (Production Entry header fields) ────────────────

export const fetchWarehouseList = async (
  setList: TReactSetState<IWarehouseOption[]>,
  setLoading: TReactSetState<boolean>,
): Promise<void> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post("getwarehouse", {
      a_application_login_id: uuid(),
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items = data.data?.item || [];
      setList(
        items.map((w: any) => ({
          value: Number(w.id),
          label: w.warehouse_name,
        })),
      );
    } else {
      setList([]);
    }
  } catch (error) {
    console.error("Error loading warehouses:", error);
    setList([]);
  } finally {
    setLoading(false);
  }
};

// ── Warehouse stock, batched (Production Entry: Finish Good + every material row) ──
// NOTE: endpoint is a placeholder — swap it once the backend route exists.
// Sends every distinct (item_id, warehouse_id) pair the form currently needs
// in one call rather than one request per row.
export const fetchWarehouseStockBatch = async (
  items: { material_id: number; warehouse_id: number }[],
): Promise<WarehouseStockMap> => {
  if (items.length === 0) return {};
  try {
    const { data } = await axiosInstance.post(
      "job-card/warehouse-stock-batch",
      {
        a_application_login_id: uuid(),
        items,
      },
    );
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const stockItems = data.data?.item || [];
      const map: WarehouseStockMap = {};
      stockItems.forEach((r: any) => {
        map[stockKey(r.material_id, r.warehouse_id)] =
          Number(r.available_qty) || 0;
      });
      return map;
    }
    return {};
  } catch (error) {
    console.error("Error loading warehouse stock:", error);
    return {};
  }
};

export const fetchTeamMemberList = async (
  setList: TReactSetState<ITeamMemberOption[]>,
  setLoading: TReactSetState<boolean>,
): Promise<void> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post("my-team", {
      a_application_login_id: uuid(),
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items = data.data?.item || [];
      setList(
        items.map((m: any) => ({
          value: Number(m.id),
          label: m.username,
        })),
      );
    } else {
      setList([]);
    }
  } catch (error) {
    console.error("Error loading team members:", error);
    setList([]);
  } finally {
    setLoading(false);
  }
};

// ─── Job Card Detail (contact + item + BOM in one call) ───────────────────────

export const fetchJobCardDetail = async (
  jobId: number,
  setContactDetail: TReactSetState<IContactDetail | null>,
  setItemDetail: TReactSetState<IItemDetail | null>,
  setBomProcesses: TReactSetState<IBomProcess[]>,
  setLoading: TReactSetState<boolean>,
): Promise<boolean> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post("job-card/detail", {
      a_application_login_id: uuid(),
      id: jobId,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setContactDetail(data.data?.contactDetail || null);
      setItemDetail(data.data?.itemDetail || null);
      setBomProcesses(data.data?.bomProcesses || []);
      return true;
    }
    toast.warning(data.ack_msg || "No job card data found.");
    return false;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setLoading(false);
  }
};

// ─── Save Job Card ────────────────────────────────────────────────────────────

export const saveJobCard = async (
  jobCardType: number, // 1 = from order, 2 = direct product, 3 = for customer
  itemId: number, // cart_item id (type 1) or product id (type 2/3)
  productQty: number,
  selectedCustomer: string | number | null,
  selectedOrder: string | number | null,
  setLoading: TReactSetState<boolean>,
): Promise<number | null> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post("job-card/save", {
      a_application_login_id: uuid(),
      job_card_type: jobCardType,
      item_id: itemId,
      order_item_id: itemId, // kept for backward compat with older backends
      product_qty: productQty,
      customer_id: selectedCustomer || null,
      order_id: selectedOrder || null,
    });

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Job card saved.");
      return data.data.id;
    }

    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  } finally {
    setLoading(false);
  }
};

// ─── BOM Print ────────────────────────────────────────────────────────────────

export const printBomDetail = async (orderItemId: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("job-card/print-bom", {
      a_application_login_id: uuid(),
      order_item_id: orderItemId,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success("BOM sent to print.");
      return true;
    }
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

// ─── Production Entry: list / detail / save ───────────────────────────────────
// Matches job-card/production-entry/{list,detail,save} exactly.

export const fetchProductionEntryList = async (
  jobId: number,
  setList: TReactSetState<IProductionEntryListItem[]>,
  setLoading: TReactSetState<boolean>,
): Promise<void> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post(
      "job-card/production-entry/list",
      {
        a_application_login_id: uuid(),
        job_id: jobId,
      },
    );
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setList(data.data || []);
    } else {
      setList([]);
      toast.warning(data.ack_msg || "No production entries found.");
    }
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setList([]);
  } finally {
    setLoading(false);
  }
};

export const fetchProductionEntryDetail = async (
  entryId: number,
  setDetail: TReactSetState<IProductionEntryDetail | null>,
  setLoading: TReactSetState<boolean>,
): Promise<void> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post(
      "job-card/production-entry/detail",
      {
        a_application_login_id: uuid(),
        id: entryId,
      },
    );
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setDetail(data.data || null);
    } else {
      setDetail(null);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setDetail(null);
  } finally {
    setLoading(false);
  }
};

export const saveProductionEntry = async (
  payload: IProductionEntrySavePayload,
): Promise<{ success: boolean; message: string; id?: number }> => {
  try {
    const { data } = await axiosInstance.post(
      "job-card/production-entry/save",
      {
        a_application_login_id: uuid(),
        ...payload,
      },
    );
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return {
        success: true,
        message: data.ack_msg || "Production entry saved.",
        id: data.data?.id,
      };
    }
    return {
      success: false,
      message: data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    };
  }
};

export const deleteProductionEntry = async (
  entryId: number,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(
      "job-card/production-entry/delete",
      {
        a_application_login_id: uuid(),
        id: entryId,
      },
    );
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Production entry deleted successfully.");
      return true;
    }
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const deleteJobCardApi = async (jobCardId: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("job-card/delete", {
      a_application_login_id: uuid(),
      id: jobCardId,
    });

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Job card deleted successfully.");
      return true;
    }

    // If blocked by backend (e.g. production entries exist), it drops here
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const updateLabelOrStatusOrTeamMember = async (
  setLoading: TReactSetState<boolean>,
  checkedOptions: any[] | number,
  jobId: number | undefined,
  on_effect: "team_assignment" | "label_assignmet" | "status_assignment",
) => {
  try {
    setLoading(true);
    const getUUID = localStorage.getItem("UUID");

    const apiRoutesDefined = {
      team_assignment: "assign-team-to-job",
      label_assignmet: "assign-lable-to-job",
      status_assignment: "assign-status-to-job",
    };

    const { data } = await axiosInstance.post(apiRoutesDefined[on_effect], {
      checkedOptions,
      jobId,
      a_application_login_id: getUUID,
    });

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setLoading(false);
  }
};

export const fetchStageStatusApiForJobCard = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  current_status: number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: "13",
    a_application_login_id: getUUID,
    action_flag: "update",
    current_status: current_status || "",
  };

  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setStageStatusList([]);
    }
    setStageStatusList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchAllOrdersByCustomer = async (
  customerId: number,
): Promise<IOption[]> => {
  try {
    const { data } = await axiosInstance.post("listOrder", {
      a_application_login_id: uuid(),
      contact_master_id: customerId,
      order_type: 2,
      request_to: "jbcrd",
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const items: IRawOrder[] = data.data?.item || [];
      return items.map((o) => ({
        value: o.id,
        label: o.cart_number || `Order #${o.id}`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading orders:", error);
    return [];
  }
};

export const updateJobCard = async (
  jobCardId: number,
  productQty: number,
  setLoading: TReactSetState<boolean>,
): Promise<boolean> => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.post("job-card/update", {
      a_application_login_id: uuid(),
      id: jobCardId,
      product_qty: productQty,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Job card updated.");
      return true;
    }
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } catch (e: any) {
    toast.error(e?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setLoading(false);
  }
};
