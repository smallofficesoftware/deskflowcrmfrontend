import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColumnPreferenceEntry {
  column_order: string[];
  hidden_columns: string[];
}

interface ColumnPreferenceState {
  preferences: Record<string, ColumnPreferenceEntry>;
  loaded: Record<string, boolean>;

  getPreference: (reportKey: string) => ColumnPreferenceEntry | undefined;
  isLoaded: (reportKey: string) => boolean;

  setPreference: (
    reportKey: string,
    entry: ColumnPreferenceEntry,
  ) => void;

  markLoaded: (reportKey: string) => void;
}

export const useColumnPreferenceStore = create<ColumnPreferenceState>()(
  persist(
    (set, get) => ({
      preferences: {},
      loaded: {},

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
    }),
    {
      name: "report-column-preferences",
    },
  ),
);
