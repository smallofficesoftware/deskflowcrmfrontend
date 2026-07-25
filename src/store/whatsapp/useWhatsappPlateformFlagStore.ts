import { create } from "zustand";

type WhatsappPlatformState = {
  platformType: number; // 0 = None, 1 = QR, 2 = Cloud
  setPlatformType: (value: number) => void;
  togglePlatform: () => void;
};

const useWhatsappPlatformStore = create<WhatsappPlatformState>((set) => ({
  platformType: 0,

  setPlatformType: (value) =>
    set({
      platformType: value,
    }),

  togglePlatform: () =>
    set((state) => ({
      platformType: state.platformType === 1 ? 2 : 1,
    })),
}));

export default useWhatsappPlatformStore;
