import { create } from "zustand";

export type ReviewShow = "none" | "system_review" | "store_review";

export interface ReviewStatus {
  show: ReviewShow;
  prefill?: { rating?: number | null; comment?: string | null };
  storeUrl?: string;
}

interface ReviewState {
  status: ReviewStatus;
  setStatus: (status: ReviewStatus) => void;
  clear: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  status: { show: "none" },
  setStatus: (status) => set({ status }),
  clear: () => set({ status: { show: "none" } }),
}));
