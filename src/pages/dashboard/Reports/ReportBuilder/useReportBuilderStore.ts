import { create } from "zustand";
import { IReportDefinition } from "./ReportBuilderController";

export interface IColumnPick {
  column: string;
  aggregate?: string;
  // Presentation-only flags, independent of `aggregate` (a column can be
  // grouped/aggregated in the results AND still be excluded from Excel, or
  // vice versa). Undefined means "on" for showInGrid/showInExcel (so an
  // existing saved report with no flags at all needs no backfill — every
  // picked column already shows everywhere, today's exact behavior) and
  // "off" for showTotal (no report shows a totals row today).
  showInGrid?: boolean;
  showInExcel?: boolean;
  showTotal?: boolean;
}

export interface IFilterRow {
  column: string;
  op: string;
  value: string;
}

interface ReportBuilderFormState {
  editingId: number | null;
  type: "query" | "plugin" | "composite";
  name: string;
  modelKey: string;
  pluginKey: string;
  columns: IColumnPick[];
  filters: IFilterRow[];
  groupBy: string[];
  // composite-type only — metric keys picked from metricsRegistry.js,
  // dimension (team members) is fixed server-side, no column/filter/groupBy
  // pickers apply.
  metricKeys: string[];
  // Step 2 — author's default subset of the table's generalFilters slots
  // (see generalFilterAdapter.ts's SLOT_LABELS). A run-tier viewer can
  // still widen/narrow this for their own session; this is only the
  // default they land on. Empty array (the default) means "show every
  // slot this table has" — same as omitting it.
  filtersToShow: number[];
  // Step 10 — tenant-defined organization (report_groups.id), orthogonal
  // to type/model_key so it's never reset when either changes. null =
  // ungrouped.
  reportGroupId: number | null;
  // Report-picker search matches name + description (Step 5's "Search
  // scope" decision) — orthogonal to type/model_key, same as reportGroupId.
  description: string;
  // Named icon (reportIcons.tsx's REPORT_ICON_PATHS key) for this report's
  // tile — "" means "use the default (report)".
  icon: string;

  setType: (type: "query" | "plugin" | "composite") => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setIcon: (icon: string) => void;
  setModelKey: (key: string) => void;
  setPluginKey: (key: string) => void;
  toggleColumn: (columnKey: string) => void;
  setColumnAggregate: (columnKey: string, aggregate: string) => void;
  setColumnFlag: (columnKey: string, flag: "showInGrid" | "showInExcel" | "showTotal", value: boolean) => void;
  toggleGroupBy: (columnKey: string) => void;
  addFilterRow: (row: IFilterRow) => void;
  updateFilterRow: (index: number, patch: Partial<IFilterRow>) => void;
  removeFilterRow: (index: number) => void;
  setFilterValue: (column: string, value: string) => void;
  toggleMetric: (metricKey: string) => void;
  toggleFilterSlot: (slot: number) => void;
  setReportGroupId: (id: number | null) => void;
  loadForEdit: (definition: IReportDefinition) => void;
  reset: () => void;
}

// Keyed by editingId (null = drafting a new, not-yet-saved definition) —
// not persisted (zustand/middleware's persist) since this is in-progress
// form state, not a user preference to survive across sessions the way
// useColumnPreferenceStore's does. Deliberately its own store rather than
// reusing useCommonFilterStore, whose ReportsFilter shape is hardcoded per
// existing report — that would just recreate the backend's "no shared base"
// problem on the frontend (same reasoning as the original Phase 1 doc).
export const useReportBuilderStore = create<ReportBuilderFormState>()((set, get) => ({
  editingId: null,
  type: "query",
  name: "",
  modelKey: "",
  pluginKey: "",
  columns: [],
  filters: [],
  groupBy: [],
  metricKeys: [],
  filtersToShow: [],
  reportGroupId: null,
  description: "",
  icon: "",

  setType: (type) => set({ type, modelKey: "", pluginKey: "", columns: [], filters: [], groupBy: [], metricKeys: [], filtersToShow: [] }),
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setIcon: (icon) => set({ icon }),
  setModelKey: (modelKey) => set({ modelKey, columns: [], filters: [], groupBy: [], filtersToShow: [] }),
  setPluginKey: (pluginKey) => set({ pluginKey, filters: [] }),

  toggleColumn: (columnKey) =>
    set((state) => ({
      columns: state.columns.some((c) => c.column === columnKey)
        ? state.columns.filter((c) => c.column !== columnKey)
        : [...state.columns, { column: columnKey }],
    })),

  setColumnAggregate: (columnKey, aggregate) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.column === columnKey ? { ...c, aggregate: aggregate || undefined } : c)),
    })),

  setColumnFlag: (columnKey, flag, value) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.column === columnKey ? { ...c, [flag]: value } : c)),
    })),

  toggleGroupBy: (columnKey) =>
    set((state) => ({
      groupBy: state.groupBy.includes(columnKey) ? state.groupBy.filter((k) => k !== columnKey) : [...state.groupBy, columnKey],
    })),

  addFilterRow: (row) => set((state) => ({ filters: [...state.filters, row] })),

  updateFilterRow: (index, patch) =>
    set((state) => ({ filters: state.filters.map((f, i) => (i === index ? { ...f, ...patch } : f)) })),

  removeFilterRow: (index) => set((state) => ({ filters: state.filters.filter((_, i) => i !== index) })),

  // Plugin-mode filter form is keyed by the plugin's own bespoke param
  // names (filterSchema), not modelRegistry columns — one row per key,
  // upserted by column name rather than addFilterRow's append-a-blank-row
  // flow, since the plugin form always shows its FULL filterSchema at once.
  setFilterValue: (column, value) => {
    const existing = get().filters.find((f) => f.column === column);
    if (existing) {
      set((state) => ({ filters: state.filters.map((f) => (f.column === column ? { ...f, value } : f)) }));
    } else {
      set((state) => ({ filters: [...state.filters, { column, op: "eq", value }] }));
    }
  },

  toggleMetric: (metricKey) =>
    set((state) => ({
      metricKeys: state.metricKeys.includes(metricKey) ? state.metricKeys.filter((k) => k !== metricKey) : [...state.metricKeys, metricKey],
    })),

  toggleFilterSlot: (slot) =>
    set((state) => ({
      filtersToShow: state.filtersToShow.includes(slot) ? state.filtersToShow.filter((s) => s !== slot) : [...state.filtersToShow, slot],
    })),

  setReportGroupId: (reportGroupId) => set({ reportGroupId }),

  loadForEdit: (definition) => {
    // composite-type columns_json is already the metric-keys string array —
    // no {column,op,value} shape to reconstruct, unlike query/plugin below.
    if (definition.type === "composite") {
      const metricKeys = JSON.parse(definition.columns_json || "[]");
      set({
        editingId: definition.id,
        type: "composite",
        name: definition.name,
        modelKey: "",
        pluginKey: "",
        columns: [],
        filters: [],
        groupBy: [],
        metricKeys,
        filtersToShow: [],
        reportGroupId: definition.report_group_id ?? null,
        description: definition.description || "",
        icon: definition.icon || "",
      });
      return;
    }

    const columns = JSON.parse(definition.columns_json || "[]");
    const groupBy = JSON.parse(definition.group_by_json || "[]");
    const rawFilters = JSON.parse(definition.filters_json || (definition.type === "plugin" ? "{}" : "[]"));
    // query-type filters_json is already the [{column,op,value}] shape the
    // UI works with. plugin-type filters_json is a plain {paramKey: value}
    // object (see handleSave's comment) — converted back to the same array
    // shape here so both modes share one filters editor. Array values
    // (date-type fields saved as a real 2-element array) are joined back
    // into the comma-string the date input displays.
    const filters = Array.isArray(rawFilters)
      ? rawFilters
      : Object.entries(rawFilters).map(([column, value]) => ({
          column,
          op: "eq",
          value: Array.isArray(value) ? value.join(",") : String(value),
        }));
    set({
      editingId: definition.id,
      type: (definition.type as "query" | "plugin") || "query",
      name: definition.name,
      modelKey: definition.model_key || "",
      pluginKey: (definition as any).plugin_key || "",
      columns,
      filters,
      groupBy,
      metricKeys: [],
      filtersToShow: definition.filters_to_show ? JSON.parse(definition.filters_to_show) : [],
      reportGroupId: definition.report_group_id ?? null,
      description: definition.description || "",
      icon: definition.icon || "",
    });
  },

  reset: () =>
    set({
      editingId: null,
      type: "query",
      name: "",
      modelKey: "",
      pluginKey: "",
      columns: [],
      filters: [],
      groupBy: [],
      metricKeys: [],
      filtersToShow: [],
      reportGroupId: null,
      description: "",
      icon: "",
    }),
}));
