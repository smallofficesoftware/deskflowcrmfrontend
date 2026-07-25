import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ICompanyInfo {
  company_id: number;
  company_name: string;
  company_contact: string;
  city_id: number;
  city_name: string;
  address: string;
  state_id: number;
  state_name: string;
  company_email: string;
  is_strict_check_product_stock: number;
}

interface CompanyInfoState {
  companyInfo: ICompanyInfo;
  setCompanyInfo: (data: ICompanyInfo) => void;
}

export const useCompanyStore = create<CompanyInfoState>()(
  persist(
    (set) => ({
      companyInfo: {
        company_id: 0,
        company_name: "",
        company_contact: "",
        city_id: 0,
        city_name: "",
        address: "",
        state_id: 0,
        state_name: "",
        company_email: "",
        is_strict_check_product_stock: 0,
      },

      setCompanyInfo: (data) =>
        set({
          companyInfo: data,
        }),
    }),
    {
      name: "company-storage",
    },
  ),
);
