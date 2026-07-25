import { DateObject } from "react-multi-date-picker";

export interface IOption {
  value: string | number;
  label: string;
}

export interface IFilterData {
  country?: number | string | undefined;
  state?: number | string | undefined;
  city?: number | string | undefined;
  area?: number | string | undefined;
  day?: number | string | undefined;
  month?: number | string | undefined;
  year?: number | string | undefined;
  active?: string;
  daysCount?: string;
  category?: string;
  product?: string;
  contactId?: any;
  productId?: any;
  orderlistselect?: string;
  product_name?: string;
}

/* ----------------------------------------
 * Common Date Type
 * ---------------------------------------- */

export type TFilterDate =
  | string
  | number
  | Date
  | DateObject
  | null
  | undefined;

/* ----------------------------------------
 * Core Filter Information
 * ---------------------------------------- */

export interface ICoreFilterData {
  filterData: IFilterData | null;
  labelAndOr?: number;
  referenceWiseContact?: number;
}

/* ----------------------------------------
 * Date Range Filters
 * ---------------------------------------- */

export interface IDateRangeFilter {
  startSearchDate?: TFilterDate;
  endSearchDate?: TFilterDate;
}

/* ----------------------------------------
 * Selection / Dropdown Filters
 * ---------------------------------------- */

export interface ISelectionFilters {
  selectedCategoryId?: any;
  selectedStockTypeId?: any;
  selectedProductId?: any;
  selectedActiveId?: any;
  selectedDays?: string | number | null;
  selectedContactId?: any;
  selectedProductSearchId?: any;
  selectedOrderListId?: any;

}

/* ----------------------------------------
 * Option / Checkbox / Multi-Select Filters
 * ---------------------------------------- */

export interface IOptionFilters {
  checkedOptionsLabel?: any[];
  checkedOptionsSourceType?: any[];
  checkedOptionsExpenseType?: any[];
  checkedOptionsPaymentBy?: any[];
  checkedOptionsStageStatus?: any[];
  checkedOptionsExpenseStatus?: any[];
  checkedOptionsSeries?: any[];
  checkedOptionsUser?: any[];
  checkedGstOptions?: any[];
  checkedTrasactionMode?: number | null;
  checkedPaymentType?: number | null;
}

/* ----------------------------------------
 * User / Team Assignment Filters
 * ---------------------------------------- */

export interface IUserAssignmentFilters {
  assignedByMultiTeamMember?: any[];
  createdByMultiTeamMember?: any[];
  checkedOptionsContactassignOrNot?: any[];
}

/* ----------------------------------------
 * Task-Related Filters
 * ---------------------------------------- */

export interface ITaskFilters {
  checkedOptionsTaskassignOrNot?: any[];
  checkedOptionsTaskType?: any[];
  checkedOptionsShowTemplateTask?: any[];
}

export interface IAccountTransaction {
  initialCheckedShowCreditData?: number | undefined;
  initialCheckedShowDebitData?: number | undefined;
}
export interface IWarehouseFilter {
  selectedWarehouseIds?: string;
}
/* ----------------------------------------
 * Final Composed Filter Payload
 * ---------------------------------------- */

export interface IFilterPayload
  extends
  ICoreFilterData,
  IDateRangeFilter,
  ISelectionFilters,
  IOptionFilters,
  IUserAssignmentFilters,
  IAccountTransaction,
  IWarehouseFilter,
  ITaskFilters { }
