import { create } from 'zustand';

interface AdvertisementState {
    advertisement: string;
    setAdvertisement: (value: string) => void;
    clearAdvertisement: () => void;
}

const useAdvertisementStore = create<AdvertisementState>((set) => ({
    advertisement: "",

    setAdvertisement: (value: string) => set({ advertisement: value }),

    clearAdvertisement: () => set({ advertisement: "" }),
}));

export default useAdvertisementStore;