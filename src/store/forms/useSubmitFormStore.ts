import { create } from "zustand";

// "Submit Form" action shared by every module's row/detail action menu. The
// menu item only asks the store to open (the menu itself unmounts when it
// closes, so the modal state can't live there); <SubmitFormHost /> in App.tsx
// renders the picker / fill screen.
export interface ISubmitFormTarget {
  relatedModule: string; // key of RELATED_MODULE_REGISTRY, e.g. "contact", "quotation"
  recordId: number;
}

interface SubmitFormState {
  target: ISubmitFormTarget | null;
  openSubmitForm: (relatedModule: string, recordId: number) => void;
  closeSubmitForm: () => void;
}

export const useSubmitFormStore = create<SubmitFormState>((set) => ({
  target: null,
  openSubmitForm: (relatedModule, recordId) => set({ target: { relatedModule, recordId } }),
  closeSubmitForm: () => set({ target: null }),
}));

// carts.type -> related_module key (form-builder RELATED_MODULE_REGISTRY).
export const CART_TYPE_TO_RELATED_MODULE: Record<number, string> = {
  1: "quotation",
  2: "order",
  3: "sales_invoice",
  4: "purchase_invoice",
  5: "purchase_order",
  6: "sales_return",
  7: "purchase_return",
  8: "inward",
  9: "dispatch",
  12: "proforma_invoice",
};
