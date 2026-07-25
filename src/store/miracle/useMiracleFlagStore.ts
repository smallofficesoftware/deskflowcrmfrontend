import { create } from "zustand";

type MiracleFlagState = {
  isFeatureEnabled: boolean;
  setFeatureEnabled: (value: boolean) => void;
  toggleFeature: () => void;
};

const useMiracleFlagStore = create<MiracleFlagState>((set) => ({
  isFeatureEnabled: false,

  setFeatureEnabled: (value) => set({ isFeatureEnabled: value }),

  toggleFeature: () =>
    set((state) => ({
      isFeatureEnabled: !state.isFeatureEnabled,
    })),
}));

export default useMiracleFlagStore;
