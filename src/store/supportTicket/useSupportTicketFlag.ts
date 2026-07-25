import { create } from "zustand";

interface IFeatureFlags {
    RAISE_SUPPORT_TICKET_FLAG: number;
    SUPPORT_TICKET_INFO_MESSAGE: string;
    CUSTOMER_SUPPORT_TICKET_ASSING_ID: boolean;
}

interface FeatureFlagState {
    flags: IFeatureFlags;

    setFlags: (flags: Partial<IFeatureFlags>) => void;
}

export const useFeatureFlagStore = create<FeatureFlagState>((set) => ({
    flags: {
        RAISE_SUPPORT_TICKET_FLAG: 1,
        SUPPORT_TICKET_INFO_MESSAGE: "",
        CUSTOMER_SUPPORT_TICKET_ASSING_ID: false,
    },

    setFlags: (flags) =>
        set((state) => ({
            flags: { ...state.flags, ...flags },
        })),
}));