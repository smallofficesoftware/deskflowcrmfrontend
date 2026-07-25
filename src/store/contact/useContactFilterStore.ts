import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TFilterDate } from '../../helpers/AppInterface';

interface IFilterData {
    country?: number | string | undefined;
    state?: number | string | undefined;
    city?: number | string | undefined;
    area?: number | string | undefined;
    active?: string;
    daysCount?: string;
    category?: string;
    product?: string;
}

interface ContactFilter {
    searchTerm: string;
    filterData: IFilterData | null;
    checkedOptions: any[];
    checkedSourceTypes: any[];
    startSearchDate: TFilterDate;
    endSearchDate: TFilterDate;
    checkedOptionsStageStatus: any[];
    checkedOptionsUser: any[];
    selectedCategoryId: any;
    selectedProductId: any;
    selectedActiveId?: any;
    selectedDays?: string | number | undefined | null;
    assignedByMultiTeamMember?: any[];
    createdByMultiTeamMember?: any[];
    isFilterApplied: boolean;
    labelwiseContactShowAndOrNot: number;
    initialCheckedShowCreditData?: number;
    initialCheckedShowDebitData?: number;
    checkedOptionsContactassignOrNot?: any[];
}

const initialState: ContactFilter = {
    searchTerm: '',
    filterData: null,
    checkedOptions: [],
    checkedSourceTypes: [],
    startSearchDate: "",
    endSearchDate: "",
    checkedOptionsStageStatus: [],
    checkedOptionsUser: [],
    selectedCategoryId: null,
    selectedProductId: null,
    selectedActiveId: null,
    selectedDays: null,
    assignedByMultiTeamMember: [],
    createdByMultiTeamMember: [],
    isFilterApplied: false,
    labelwiseContactShowAndOrNot: 0,
    initialCheckedShowCreditData: 0,
    initialCheckedShowDebitData: 0,
    checkedOptionsContactassignOrNot: []
};

interface ContactFilterState {
    filters: ContactFilter;
    setFilter: <K extends keyof ContactFilter>(key: K, value: ContactFilter[K]) => void;
    setFilters: (newFilters: ContactFilter) => void;
    clearFilters: () => void;
}

export const useContactFilterStore = create<ContactFilterState>()(
    persist(
        (set) => ({
            filters: initialState,

            setFilter: (key, value) =>
                set((state) => ({
                    filters: { ...state.filters, [key]: value },
                })),

            setFilters: (newFilters) =>
                set((state) => ({
                    filters: { ...state.filters, ...newFilters },
                })),

            clearFilters: () => set({ filters: initialState }),
        }),
        {
            name: 'contact-filters', // key in localStorage
        }
    )
);