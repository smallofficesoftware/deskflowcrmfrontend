import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IFilterPayload } from "../../helpers/AppInterface";

// Step 9's "Save Filter" — named, reusable filter presets per report.
// Deliberately its own small store, not an extension of
// useCommonFilterStore: that store's ReportsFilter shape uses slightly
// different field names than the real IFilterPayload CheckBoxFilterModal
// actually submits (e.g. checkedSourceTypes vs checkedOptionsSourceType),
// a mismatch documented where Report Builder's run screen first wired the
// modal in (generalFilterAdapter.ts / ReportRunnerView.tsx) — presets
// here hold the real IFilterPayload verbatim, no field-name translation
// to get wrong.
//
// localStorage-only, same accepted v1 tradeoff the plan already named for
// this feature: presets are per-browser/per-device, not synced or
// shareable between teammates.
interface ReportFilterPresetsState {
  presets: Record<string, Record<string, IFilterPayload>>;
  savePreset: (reportKey: string, name: string, payload: IFilterPayload) => void;
  deletePreset: (reportKey: string, name: string) => void;
  getPresets: (reportKey: string) => Record<string, IFilterPayload>;
}

export const useReportFilterPresetsStore = create<ReportFilterPresetsState>()(
  persist(
    (set, get) => ({
      presets: {},

      savePreset: (reportKey, name, payload) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [reportKey]: { ...(state.presets[reportKey] ?? {}), [name]: payload },
          },
        })),

      deletePreset: (reportKey, name) =>
        set((state) => {
          const existing = { ...(state.presets[reportKey] ?? {}) };
          delete existing[name];
          return { presets: { ...state.presets, [reportKey]: existing } };
        }),

      getPresets: (reportKey) => get().presets[reportKey] ?? {},
    }),
    {
      name: "report-filter-presets",
    },
  ),
);
