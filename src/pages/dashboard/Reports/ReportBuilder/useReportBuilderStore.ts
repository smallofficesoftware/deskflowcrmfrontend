import { create } from "zustand";
import { IReportDefinition } from "./ReportBuilderController";

export interface IColumnPick {
  column: string;
  aggregate?: string;
}

export interface IFilterRow {
  column: string;
  op: string;
  value: string;
}

interface ReportBuilderFormState {
  editingId: number | null;
  type: "query" | "plugin";
  name: string;
  modelKey: string;
  pluginKey: string;
  columns: IColumnPick[];
  filters: IFilterRow[];
  groupBy: string[];

  setType: (type: "query" | "plugin") => void;
  setName: (name: string) => void;
  setModelKey: (key: string) => void;
  setPluginKey: (key: string) => void;
  toggleColumn: (columnKey: string) => void;
  setColumnAggregate: (columnKey: string, aggregate: string) => void;
  toggleGroupBy: (columnKey: string) => void;
  addFilterRow: (row: IFilterRow) => void;
  updateFilterRow: (index: number, patch: Partial<IFilterRow>) => void;
  removeFilterRow: (index: number) => void;
  setFilterValue: (column: string, value: string) => void;
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

  setType: (type) => set({ type, modelKey: "", pluginKey: "", columns: [], filters: [], groupBy: [] }),
  setName: (name) => set({ name }),
  setModelKey: (modelKey) => set({ modelKey, columns: [], filters: [], groupBy: [] }),
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

  loadForEdit: (definition) => {
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
    }),
}));
