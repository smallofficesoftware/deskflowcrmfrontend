import { create } from "zustand";
import { axiosInstance } from "../../services/axiosInstance";

export type ModuleType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

interface DependencyResultL1 {
  canDelete: boolean;
  canEdit: boolean;
  msg: string;
}

interface DependencyResult {
  ack_msg: string;
  ack: number;
  developer_msg: string;
  data: DependencyResultL1;
}

interface DependencyGuardState {
  loading: boolean;
  lastCheck?: DependencyResult;

  check: (cart_type: ModuleType, id: number) => Promise<DependencyResult>;

  reset: () => void;
}

export const useSalesDependencyGuard = create<DependencyGuardState>((set) => ({
  loading: false,
  lastCheck: undefined,

  check: async (cart_type, id) => {
    set({ loading: true });

    try {
      const res = await axiosInstance.post("action-accessibility", {
        cart_type,
        id,
      });

      set({ lastCheck: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  reset: () => set({ lastCheck: undefined }),
}));
