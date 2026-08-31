// ─── Tab Navigation (production entry is now a separate modal) ────────────────
export type TabId = "select" | "details" | "material";

// ─── Job Card creation mode ──────────────────────────────────────────────────
//   "order"    -> Customer → Order → Order Item  (job_card_type 1)
//   "product"  -> Direct Product, no customer/order  (job_card_type 2)
//   "customer" -> Customer → Product, no order  (job_card_type 3)
export type JobCardMode = "order" | "product" | "customer";

export const JOB_CARD_TYPE: Record<JobCardMode, number> = {
  order: 1,
  product: 2,
  customer: 3,
};

// ─── Dropdown Options ─────────────────────────────────────────────────────────
export interface ICustomerOption {
  value: number;
  label: string;
}
export interface IOrderOption {
  value: number;
  label: string;
  order_no?: string;
}
export interface IOrderItemOption {
  value: number;
  label: string;
  order_qty: number;
  unit: string;
}

// ─── Detail Cards ─────────────────────────────────────────────────────────────
export interface IContactDetail {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  gst_no?: string;
}

export interface IItemDetail {
  item_id: number;
  product_id?: number; // canonical product id (BOM / production entry key)
  job_card_type?: number;
  item_name: string;
  item_code?: string;
  order_no?: string;
  order_qty: number;
  pending_qty?: number;
  unit: string;
  delivery_date?: string;
}

// ─── BOM / Required Material ──────────────────────────────────────────────────
export interface IBomMaterial {
  material_id: number;
  material_name: string;
  unit: string;
  available_qty: number;
  required_qty: number; // calculated: bom_per_unit × order_qty
  qty_diff: number; // available_qty - required_qty (negative = shortage)
}

export interface IBomProcess {
  bom_id: number;
  process_id: number;
  process_name: string;
  consumption: IBomMaterial[];
  rejection: IBomMaterial[];
}

// ─── Job Card List Item (for JobCardListView) ─────────────────────────────────
export interface IJobCardListItem {
  id: number;
  order_item_id: number;
  product_id?: number;
  job_card_type?: number;
  item_name: string;
  item_code?: string;
  order_no?: string;
  customer_name: string;
  order_qty: number;
  product_qty?: number;
  unit: string;
  status_id: number;
  stage_status_name: string;
  stage_status_color: string;
  label_ids: string;
  label_color: string;
  label_name: string;
  team_assign_ids: string;
  last_modified_date?: string;
  teamMemberName?: any;
  assined_team_person_list?: any;
}

// ─── Production Entry: Warehouse / Team Member dropdowns ──────────────────────
export interface IWarehouseOption {
  value: number;
  label: string;
}

export interface ITeamMemberOption {
  value: number;
  label: string;
}

// ─── Production Entry: editable per-material row ──────────────────────────────
// Qty starts as the calculated value (rate × produced qty) but the user can
// manually override it in the textbox — that override does NOT feed back
// into the top-level Production Qty field, it's a one-way manual correction
// for cases where a bit more/less material was actually used.
export interface IProductionEntryRow {
  material_id: number;
  material_name: string;
  unit: string;
  qty: number;
  warehouse_id: number | null;
  edited: boolean; // true once the user manually changes qty — protects the
  // value from being silently recalculated if produced qty changes again
}

export interface IProductionEntryProcessRows {
  process_id: number;
  process_name: string;
  consumption: IProductionEntryRow[];
  rejection: IProductionEntryRow[];
}

// ─── Production Entry: material line item as sent to / received from the API ─
export interface IProductionEntryMaterialPayload {
  process_id: number;
  material_id: number;
  warehouse_id: number | null;
  qty: number;
  material_name?: string;
  unit?: string;
}

// ─── Production Entry: the single Save payload ────────────────────────────────
// One "Save" click = one production_entries row + its consumption/rejection
// line items, all referencing job_id. Multiple entries can exist per job
// card (partial production runs on different days) — see IProductionEntryListItem.
export interface IProductionEntrySavePayload {
  job_id: number;
  order_item_id: number;
  product_id?: number; // canonical finished-good product id
  produced_qty: number;
  finish_good_warehouse_id: number | null;
  entry_date: string; // "YYYY-MM-DD"
  remark: string;
  team_member_id: number | null;
  consumption_items: IProductionEntryMaterialPayload[];
  rejection_items: IProductionEntryMaterialPayload[];
}

// ─── Production Entry: list row (shown before "+ Add Production Entry") ──────
export interface IProductionEntryListItem {
  id: number;
  job_id: number;
  produced_qty: number;
  entry_date: string;
  remark: string;
  team_member_id: number | null;
  consumption_count: number;
  rejection_count: number;
  created_date_time: string;
}

// ─── Production Entry: warehouse stock lookup ─────────────────────────────────
// Maps `${itemId}_${warehouseId}` -> available qty in that warehouse. Used to
// show live stock for the Finish Good item, and for every consumption /
// rejection material row (consumption additionally blocks Save + shows an
// inline error when the entered qty exceeds what's available).
export type WarehouseStockMap = Record<string, number>;

export const stockKey = (
  itemId: number,
  warehouseId: number | null | undefined,
): string => `${itemId}_${warehouseId ?? ""}`;

export interface IProductionEntryDetail {
  id: number;
  job_id: number;
  produced_qty: number;
  finish_good_warehouse_id: number | null;
  entry_date: string;
  remark: string;
  team_member_id: number | null;
  consumption_items: IProductionEntryMaterialPayload[];
  rejection_items: IProductionEntryMaterialPayload[];
}
