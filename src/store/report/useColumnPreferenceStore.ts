import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColumnPreferenceEntry {
  column_order: string[];
  hidden_columns: string[];
}

interface ColumnPreferenceState {
  preferences: Record<string, ColumnPreferenceEntry>;
  loaded: Record<string, boolean>;
  // persist's own rehydration from localStorage happens asynchronously
  // (a microtask after this store's bare initial state has already been
  // read by any component that mounted synchronously) — a consumer must
  // wait on this flag before trusting `loaded`/`getPreference`, or it can
  // capture the pre-hydration empty state into its own local React state
  // and never revisit it (isLoaded looking "already true" once hydration
  // does land is exactly what makes that stick).
  hasHydrated: boolean;

  getPreference: (reportKey: string) => ColumnPreferenceEntry | undefined;
  isLoaded: (reportKey: string) => boolean;

  setPreference: (
    reportKey: string,
    entry: ColumnPreferenceEntry,
  ) => void;

  markLoaded: (reportKey: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useColumnPreferenceStore = create<ColumnPreferenceState>()(
  persist(
    (set, get) => ({
      preferences: {},
      loaded: {},
      hasHydrated: false,

      getPreference: (reportKey) => get().preferences[reportKey],

      isLoaded: (reportKey) => Boolean(get().loaded[reportKey]),

      setPreference: (reportKey, entry) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [reportKey]: entry,
          },
        })),

      markLoaded: (reportKey) =>
        set((state) => ({
          loaded: {
            ...state.loaded,
            [reportKey]: true,
          },
        })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "report-column-preferences",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
