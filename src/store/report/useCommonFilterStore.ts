import { DateObject } from "react-multi-date-picker";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TFilterDate } from "../../helpers/AppInterface";

interface IFilterData {
  country?: number | string;
  state?: number | string;
  city?: number | string;
  area?: number | string;
  day?: number | string;
  month?: number | string;
  year?: number | string;
  active?: string;
  daysCount?: string;
  category?: string;
  product?: string;
  orderlistselect?: string;
}

export interface ReportsFilter {
  filterData: IFilterData | null;
  checkedOptions: any[];
  checkedSourceTypes: any[];
  checkedExpenseTypes: any[];
  checkedOptionsPaymentBy: any[];
  checkedGstOptions: any[];
  checkedTrasactionMode: number | null;
  checkedPaymentType: number | null;
  startSearchDate: TFilterDate;
  endSearchDate: TFilterDate;
  checkedOptionsStageStatus: any[];
  checkedOptionsExpenseStatus: any[];
  checkedOptionsSeries: any[];
  checkedOptionsUser: any[];
  assignedByMultiTeamMember: any[];
  createdByMultiTeamMember: any[];
  selectedCategoryId: any;
  selectedStockTypeId: any;
  selectedProductId: any;
  selectedActiveId?: any;
  selectedDays?: string | number | null;
  isFilterApplied: boolean;
  selectedDateArray: DateObject[] | any | null;
  selectedWarehouseIds?: string;
  selectedContactId: any;
  selectedProductSearchId: any;
  selectedOrderListId?: any;
  referenceWiseContact?: number;
  month?: number | string;
  year?: number | string;
}

export const initialState: ReportsFilter = {
  filterData: null,
  checkedOptions: [],
  checkedSourceTypes: [],
  checkedExpenseTypes: [],
  checkedOptionsPaymentBy: [],
  checkedGstOptions: [],
  checkedTrasactionMode: null,
  checkedPaymentType: null,
  startSearchDate: "",
  endSearchDate: "",
  checkedOptionsStageStatus: [],
  checkedOptionsExpenseStatus: [],
  checkedOptionsSeries: [],
  checkedOptionsUser: [],
  assignedByMultiTeamMember: [],
  createdByMultiTeamMember: [],
  selectedCategoryId: null,
  selectedStockTypeId: null,
  selectedProductId: null,
  selectedActiveId: null,
  selectedDays: null,
  isFilterApplied: false,
  selectedDateArray: null,
  selectedWarehouseIds: undefined,
  selectedContactId: null,
  selectedProductSearchId: null,
  selectedOrderListId: null,
  referenceWiseContact: undefined,
  month: "",
  year: "",
};

interface ReportsFilterState {
  filters: Record<string, ReportsFilter>;

  getFilter: (reportName: string) => ReportsFilter;

  setFilter: <K extends keyof ReportsFilter>(
    reportName: string,
    key: K,
    value: ReportsFilter[K],
  ) => void;

  setFilters: (reportName: string, values: Partial<ReportsFilter>) => void;

  clearFilters: (reportName: string) => void;
}

export const useCommonFilterStore = create<ReportsFilterState>()(
  persist(
    (set, get) => ({
      filters: {},

      getFilter: (reportName) =>
        get().filters[reportName] ?? initialState,

      setFilter: (reportName, key, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [reportName]: {
              ...(state.filters[reportName] ?? initialState),
              [key]: value,
            },
          },
        })),

      setFilters: (reportName, values) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [reportName]: {
              ...(state.filters[reportName] ?? initialState),
              ...values,
            },
          },
        })),

      clearFilters: (reportName) =>
        set((state) => {
          const filters = { ...state.filters };
          delete filters[reportName];

          return { filters };
        }),
    }),
    {
      name: "reports-filters",
    },
  ),
);
