import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

const companyMastersId = () => localStorage.getItem("COMPANY_ID");
const loginId = () => localStorage.getItem("UUID");

export interface IReportColumn {
  key: string;
  label: string;
  type: "string" | "number" | "currency" | "date" | "lookup" | "csv";
  filterable?: boolean;
  sortable?: boolean;
  groupable?: boolean;
  aggregatable?: string[];
  // Company-defined custom field (custom_field_form_masters), resolved
  // fresh per company by the backend — not part of the fixed static schema.
  dynamic?: boolean;
}

export interface IModelRelation {
  key: string; // plain relation key, e.g. "customer" — each column below carries the dotted "customer.person_name" key
  label: string;
  columns: IReportColumn[];
  // Second hop, e.g. task_managements' "contact" relation exposing contacts'
  // OWN "label" relation as "contact.label.lable_name" — only ever populated
  // for a modelKey-backed, plain scalar relation (see resolveRelationRelations
  // in modelRegistry.js). Empty array, never undefined, when there's none.
  relations: IModelRelation[];
}

export interface IModelRegistryEntry {
  key: string;
  label: string;
  columns: IReportColumn[];
  // Whitelisted joins — select/display only (no filter/aggregate), see
  // backend/src/services/report_builder/modelRegistry.js and queryEngine.js.
  relations?: IModelRelation[];
  // Step 2 of the plan — which CheckBoxFilterModal.tsx slot numbers apply
  // to this table (keyed by slot number as a string, since JS object keys
  // are always strings even when set with a numeric key server-side), and
  // which whitelisted column (or `true` for slot 6, Demography) each
  // resolves to. Typed here now so the data is visible/usable — the actual
  // CheckBoxFilterModal wiring (a 4600+ line component) is its own
  // follow-up, not built this pass.
  generalFilters?: Record<string, string | true>;
}

export interface IPluginFilterField {
  key: string;
  label: string;
  type: "string" | "number" | "currency" | "date" | "lookup";
}

export interface IPluginRegistryEntry {
  key: string;
  label: string;
  filterSchema: IPluginFilterField[];
}

export interface IMetricEntry {
  key: string;
  label: string;
}

export interface IReportDefinition {
  id: number;
  name: string;
  type: string;
  model_key: string;
  plugin_key?: string | null;
  columns_json: string;
  filters_json: string | null;
  group_by_json: string | null;
  source_system_report_definition_id?: number | null;
  // JSON-stringified number[] of general-filter slots (see
  // generalFilterAdapter.ts's SLOT_LABELS) the author picked as this
  // report's default — null means "show every slot this table has."
  filters_to_show?: string | null;
  // Step 10 — tenant-defined organization (report_groups.id). Distinct
  // from the system gallery's admin-fixed `category`. null = ungrouped.
  report_group_id?: number | null;
  description?: string | null;
  // Named icon (reportIcons.tsx's REPORT_ICON_PATHS key) shown on this
  // report's tile — null falls back to "report".
  icon?: string | null;
  created_date_time: string;
}

const handleError = (error: any, fallback: string) => {
  console.error(error);
  toast.error(error?.response?.data?.developer_msg || fallback);
};

// Same envelope every build-route call gets when the report_builder feature
// flag is off or the PIN hasn't been verified yet — surfaced as a plain
// toast rather than a special-cased UI state, since both are just "not
// available right now" from the caller's point of view.
const reportError = (data: any, fallback: string) => {
  toast.error(data?.ack_msg || fallback);
};

export const verifyReportPin = async (pin: string): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("report-pin/verify", {
      a_application_login_id: loginId(),
      pin,
    });
    if (data?.ack === 1) {
      // Stateless verification (backend's reportPinAuth.js) — this token is
      // what requireReportPin actually checks on every gated request, sent
      // automatically by axiosInstance's own interceptor. Stored here so
      // it survives across Report Builder AND Document Designer, same PIN.
      if (data.data?.reportPinToken) {
        localStorage.setItem("REPORT_PIN_TOKEN", data.data.reportPinToken);
      }
      return true;
    }
    reportError(data, "Incorrect PIN");
    return false;
  } catch (error) {
    handleError(error, "Failed to verify PIN");
    return false;
  }
};

export const getModelRegistry = async (): Promise<IModelRegistryEntry[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/model-registry", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report sources");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report sources");
    return [];
  }
};

export const getPluginRegistry = async (): Promise<IPluginRegistryEntry[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/plugin-registry", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report sources");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report sources");
    return [];
  }
};

export const getMetricsRegistry = async (): Promise<IMetricEntry[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/metrics-registry", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load metrics");
    return [];
  } catch (error) {
    handleError(error, "Failed to load metrics");
    return [];
  }
};

export const listReportDefinitions = async (): Promise<IReportDefinition[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/list", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load saved reports");
    return [];
  } catch (error) {
    handleError(error, "Failed to load saved reports");
    return [];
  }
};

// Trimmed, run-only shape — build internals (columns_json/filters_json/
// group_by_json) stay private to the owner+PIN listReportDefinitions.
export interface IRunnableReportDefinition {
  id: number;
  name: string;
  type: string;
  // No "category" here — that column only ever existed on the master-DB
  // system gallery, never on a tenant's own report_definitions. Tenant
  // organization uses report_group_id instead (Step 10).
  description: string | null;
  // Named icon (reportIcons.tsx's REPORT_ICON_PATHS key) — null falls
  // back to "report".
  icon: string | null;
  model_key: string | null;
  plugin_key: string | null;
  filters_to_show: string | null;
  // Composite is always per-team-member aggregates; a query-type report
  // is aggregated iff it has a group_by_json set (the raw column list
  // itself stays build-internal — this is just the derived boolean).
  // Drives Step 9's Compare Period, which has no clean meaning against a
  // raw ungrouped row listing.
  is_aggregated: boolean;
  // Step 9's Drill Down — query-type only (empty for plugin/composite).
  // Just the column-key list, no aggregate/having internals.
  group_by_columns: string[];
  // Step 10 — which report_groups bucket this falls into on the "Custom
  // Reports" tile grid; null = the "Ungrouped" bucket.
  report_group_id: number | null;
}

// Step 10 — Report groups. Flat, single-level; read (list) is flag-only/
// no-PIN (group names sit at the same non-sensitive tier `category`/
// `description` already do — every viewer needs them to render tile
// bucket headers, not just the owner); create/update/delete stay
// build-tier owner+PIN.
export interface IReportGroup {
  id: number;
  company_masters_id: number;
  group_name: string;
  display_order: number;
}

export const listReportGroups = async (): Promise<IReportGroup[]> => {
  try {
    const { data } = await axiosInstance.post("report-groups/list", { a_application_login_id: loginId() });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report groups");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report groups");
    return [];
  }
};

export const createReportGroup = async (group_name: string, display_order?: number): Promise<IReportGroup | null> => {
  try {
    const { data } = await axiosInstance.post("report-groups/create", { a_application_login_id: loginId(), group_name, display_order });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to create report group");
    return null;
  } catch (error) {
    handleError(error, "Failed to create report group");
    return null;
  }
};

export const updateReportGroup = async (id: number, group_name: string, display_order?: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-groups/${id}/update`, { a_application_login_id: loginId(), group_name, display_order });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to update report group");
    return false;
  } catch (error) {
    handleError(error, "Failed to update report group");
    return false;
  }
};

export const deleteReportGroup = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-groups/${id}/delete`, { a_application_login_id: loginId() });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to delete report group");
    return false;
  } catch (error) {
    handleError(error, "Failed to delete report group");
    return false;
  }
};

// Step 8a — Scheduling. recipients mixes internal team members (logins,
// picked from the same team-member list Manage Access already fetches)
// and raw external email addresses in one delivery — a scheduled report
// can go to someone who couldn't open it on-demand themselves, per the
// plan's decision (the owner scheduling it is trusted to decide who
// receives it).
export interface IReportScheduleRecipients {
  logins: number[];
  emails: string[];
}

export interface IReportSchedule {
  id: number;
  report_definition_id: number;
  a_application_login_id: number;
  frequency: "daily" | "weekly" | "monthly";
  send_time: string;
  day_of_week: number | null;
  day_of_month: number | null;
  delivery_format: "excel" | "pdf" | "both";
  recipients: string; // JSON-stringified IReportScheduleRecipients
  next_run_at: string;
  last_run_at: string | null;
  isActive: number;
}

export interface IReportSchedulePayload {
  frequency: "daily" | "weekly" | "monthly";
  send_time: string;
  day_of_week?: number;
  day_of_month?: number;
  delivery_format: "excel" | "pdf" | "both";
  recipients: IReportScheduleRecipients;
  isActive?: number;
}

export const listReportSchedules = async (reportDefinitionId: number): Promise<IReportSchedule[]> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${reportDefinitionId}/schedules/list`, { a_application_login_id: loginId() });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load schedules");
    return [];
  } catch (error) {
    handleError(error, "Failed to load schedules");
    return [];
  }
};

export const createReportSchedule = async (reportDefinitionId: number, payload: IReportSchedulePayload): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${reportDefinitionId}/schedules/create`, { a_application_login_id: loginId(), ...payload });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to create schedule");
    return false;
  } catch (error) {
    handleError(error, "Failed to create schedule");
    return false;
  }
};

export const updateReportSchedule = async (scheduleId: number, payload: Partial<IReportSchedulePayload>): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-schedules/${scheduleId}/update`, { a_application_login_id: loginId(), ...payload });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to update schedule");
    return false;
  } catch (error) {
    handleError(error, "Failed to update schedule");
    return false;
  }
};

export const deleteReportSchedule = async (scheduleId: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-schedules/${scheduleId}/delete`, { a_application_login_id: loginId() });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to delete schedule");
    return false;
  } catch (error) {
    handleError(error, "Failed to delete schedule");
    return false;
  }
};

// "Custom Reports" (ReportsTileView's dynamic section) — visibility is
// per-report_definition_team_rights grant only (Step 7), no page-level
// fallback: a login sees exactly the reports it's been explicitly granted,
// nothing else. No PIN needed to browse/run, only to build.
export const listRunnableReportDefinitions = async (): Promise<IRunnableReportDefinition[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/list-runnable", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load reports");
    return [];
  } catch (error) {
    handleError(error, "Failed to load reports");
    return [];
  }
};

// Step 2's non-PIN slice of the model registry (backend:
// getGeneralFilterConfig) — just enough for CheckBoxFilterModal's adapter
// to pick findInSet vs in per slot, without exposing the full build
// surface getModelRegistry (PIN-gated) carries.
export interface IGeneralFilterConfig {
  generalFilters: Record<string, string | true>;
  columnTypes: Record<string, string>;
  // Every filterable base column on the table (not just the ones a
  // generalFilters slot targets) — drives the run screen's row-level
  // per-column filters, so it only offers a filter on a column
  // queryEngine.js will actually accept (it throws hard on a
  // non-filterable one, e.g. any aggregate alias or relation-dotted key).
  filterableColumns: Record<string, { type: string; label: string }>;
}

export const getGeneralFilterConfig = async (model_key: string): Promise<IGeneralFilterConfig | null> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/general-filter-config", {
      a_application_login_id: loginId(),
      model_key,
    });
    if (data?.ack === 1) return data.data;
    reportError(data, "Failed to load filter options");
    return null;
  } catch (error) {
    handleError(error, "Failed to load filter options");
    return null;
  }
};

export interface ISystemReportDefinition {
  id: number;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  priority: "critical" | "high" | "normal" | null;
}

// "Browse Report Library" gallery — flag-only, no PIN (same tier Document
// Designer's own system-gallery/list uses, see documentPrintTemplateRouter.js).
export const listSystemReportDefinitions = async (): Promise<ISystemReportDefinition[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/system-gallery/list", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report library");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report library");
    return [];
  }
};

// Copying is a build action (writes a new report_definitions row) so it's
// PIN-gated, same tier as create — the caller must already have a valid
// x-report-pin-token, same as every other build route.
export const copyFromSystemReportDefinition = async (
  systemReportDefinitionId: number,
): Promise<IReportDefinition | null> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/system-gallery/copy", {
      a_application_login_id: loginId(),
      company_masters_id: companyMastersId(),
      system_report_definition_id: systemReportDefinitionId,
    });
    if (data?.ack === 1) {
      toast.success("Report added to your company");
      return data.data.item;
    }
    reportError(data, "Failed to add report");
    return null;
  } catch (error) {
    handleError(error, "Failed to add report");
    return null;
  }
};

export interface IReportDefinitionPayload {
  name: string;
  type?: "query" | "plugin" | "composite";
  model_key?: string;
  plugin_key?: string;
  // query-type: [{column,aggregate?,alias?}]. plugin-type: {paramKey:value}.
  // composite-type: string[] of metric keys (see metricsRegistry.js).
  columns_json: any;
  filters_json?: any;
  group_by_json?: any;
  filters_to_show?: number[];
  report_group_id?: number | null;
  description?: string | null;
  icon?: string | null;
}

export const createReportDefinition = async (payload: IReportDefinitionPayload): Promise<IReportDefinition | null> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/create", {
      a_application_login_id: loginId(),
      company_masters_id: companyMastersId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Report created successfully");
      return data.data.item;
    }
    reportError(data, "Failed to create report");
    return null;
  } catch (error) {
    handleError(error, "Failed to create report");
    return null;
  }
};

export const updateReportDefinition = async (
  id: number,
  payload: Partial<IReportDefinitionPayload>,
): Promise<IReportDefinition | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/update`, {
      a_application_login_id: loginId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Report updated successfully");
      return data.data.item;
    }
    reportError(data, "Failed to update report");
    return null;
  } catch (error) {
    handleError(error, "Failed to update report");
    return null;
  }
};

export const deleteReportDefinition = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/delete`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) {
      toast.success("Report deleted successfully");
      return true;
    }
    reportError(data, "Failed to delete report");
    return false;
  } catch (error) {
    handleError(error, "Failed to delete report");
    return false;
  }
};

export const exportReportExcel = async (id: number): Promise<string | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/export/excel`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.fileUrl;
    reportError(data, "Failed to export Excel");
    return null;
  } catch (error) {
    handleError(error, "Failed to export Excel");
    return null;
  }
};

export const exportReportPdf = async (
  id: number,
  options?: {
    template_id?: number;
    disposition?: "inline" | "attachment";
    // Same gap as the Excel export path had — runDefinitionByType reads
    // these straight off req.body, so a run without them silently ignores
    // whatever the on-screen grid is currently filtered/searched to.
    search?: string;
    filters?: { column: string; op: string; value: unknown; combinator?: "and" | "or"; includeBlank?: boolean }[];
  },
): Promise<string | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/export/pdf`, {
      a_application_login_id: loginId(),
      ...options,
    });
    if (data?.ack === 1) return data.data.fileUrl;
    reportError(data, "Failed to export PDF");
    return null;
  } catch (error) {
    handleError(error, "Failed to export PDF");
    return null;
  }
};

export const runReportDefinition = async (
  id: number,
  options?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: { column: string; direction: "ASC" | "DESC" };
    // General-filter (CheckBoxFilterModal) translation, merged server-side
    // with the definition's own saved filters_json — see generalFilterAdapter.ts.
    filters?: { column: string; op: string; value: unknown; combinator?: "and" | "or"; includeBlank?: boolean }[];
    // Step 9's Drill Down — runs the definition ungrouped/unaggregated for
    // this one call (queryEngine.js's suppressGroupBy), returning the raw
    // rows a grouped/aggregated row was built from instead of another
    // aggregate. Query-type only; meaningless for plugin/composite.
    suppressGroupBy?: boolean;
  },
): Promise<{ rows: any[]; row_count: number; duration_ms: number } | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/run`, {
      a_application_login_id: loginId(),
      ...options,
    });
    if (data?.ack === 1) return data.data;
    reportError(data, "Failed to run report");
    return null;
  } catch (error) {
    handleError(error, "Failed to run report");
    return null;
  }
};

export type IDataScope = "own" | "all" | "chain";

export interface IReportTeamRight {
  a_application_login_id: number;
  data_scope: IDataScope;
}

// Manage Access modal — current grants for one report (Step 7).
export const getReportTeamRights = async (id: number): Promise<IReportTeamRight[]> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/team-rights/list`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load access list");
    return [];
  } catch (error) {
    handleError(error, "Failed to load access list");
    return [];
  }
};

// grants: who should have access, and what scope. removals: logins whose
// grant row should be deleted — "no access" is row-absence, not a separate
// blocked state (Step 7's simplified design), so removing someone here
// really does make their Custom Reports tile disappear, guaranteed.
export const saveReportTeamRights = async (
  id: number,
  grants: IReportTeamRight[],
  removals: number[],
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/team-rights`, {
      a_application_login_id: loginId(),
      grants,
      removals,
    });
    if (data?.ack === 1) {
      toast.success("Access updated successfully");
      return true;
    }
    reportError(data, "Failed to update access");
    return false;
  } catch (error) {
    handleError(error, "Failed to update access");
    return false;
  }
};

// Run History (small addition — report_runs already gets a row on every
// run, nothing read it back until now). executed_by comes back as a raw
// login id — resolved to a display name client-side off the same
// team-member list Manage Access already fetches, not joined server-side.
export interface IReportRun {
  id: number;
  executed_by: number;
  executed_at: string;
  row_count: number | null;
  duration_ms: number | null;
  success: 0 | 1;
  error_message: string | null;
}

export const listReportRuns = async (id: number, limit = 50, offset = 0): Promise<IReportRun[]> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/run-history/list`, {
      a_application_login_id: loginId(),
      limit,
      offset,
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load run history");
    return [];
  } catch (error) {
    handleError(error, "Failed to load run history");
    return [];
  }
};
