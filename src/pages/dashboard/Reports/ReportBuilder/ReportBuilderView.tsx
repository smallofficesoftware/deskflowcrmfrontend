import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import PromptModal from "../../../../components/model/PromptModal";
import { fetchCompanyTeamApi, ICompanyTeam } from "../../../left-side/list-company/ListCompanyController";
import {
  copyFromSystemReportDefinition,
  createReportDefinition,
  createReportGroup,
  createReportSchedule,
  deleteReportDefinition,
  deleteReportGroup,
  deleteReportSchedule,
  exportReportPdf,
  getMetricsRegistry,
  getModelRegistry,
  getPluginRegistry,
  getReportTeamRights,
  IDataScope,
  IMetricEntry,
  IModelRegistryEntry,
  IPluginRegistryEntry,
  IReportColumn,
  IReportDefinition,
  IReportGroup,
  IReportRun,
  IReportSchedule,
  ISystemReportDefinition,
  listReportDefinitions,
  listReportGroups,
  listReportRuns,
  listReportSchedules,
  listSystemReportDefinitions,
  runReportDefinition,
  saveReportTeamRights,
  updateReportDefinition,
  updateReportGroup,
  updateReportSchedule,
  verifyReportPin,
} from "./ReportBuilderController";
import { mapColumnTypeToExportFormat, SLOT_LABELS } from "./generalFilterAdapter";
import ReportPdfTemplateDesigner from "./ReportPdfTemplateDesigner";
import { useReportBuilderStore } from "./useReportBuilderStore";

// Operator choices per column type — mirrors queryEngine.js's ALLOWED_OPERATORS
// exactly (backend/src/services/report_builder/queryEngine.js). Only used
// for query-type filters — plugin-type filters are one value per the
// plugin's own filterSchema key, no operator picker (see PluginFilterForm).
const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  string: [
    { value: "eq", label: "equals" },
    { value: "like", label: "contains" },
  ],
  number: [
    { value: "eq", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less or equal" },
  ],
  currency: [
    { value: "eq", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less or equal" },
  ],
  date: [
    { value: "eq", label: "on" },
    { value: "gte", label: "on or after" },
    { value: "lte", label: "on or before" },
  ],
  lookup: [
    { value: "eq", label: "equals" },
    { value: "in", label: "is one of" },
  ],
};

const AGGREGATE_LABELS: Record<string, string> = {
  sum: "Sum",
  avg: "Average",
  min: "Min",
  max: "Max",
  count: "Count",
};

// Report Builder — query-type (Phase 1 slice) + plugin-type (wraps the 2
// proof complex-report services, unmodified) in one form. No PAGE_ID/rights
// pre-check client-side — access is entirely server-side (report_builder
// company_feature_flags key + the shared owner+PIN gate, same PIN as
// Document Designer), this page just surfaces whatever the API says.
const ReportBuilderView: React.FC = () => {
  const navigate = useNavigate();
  const store = useReportBuilderStore();

  const [pinVerified, setPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true);

  const [registry, setRegistry] = useState<IModelRegistryEntry[]>([]);
  const [plugins, setPlugins] = useState<IPluginRegistryEntry[]>([]);
  const [metrics, setMetrics] = useState<IMetricEntry[]>([]);
  const [definitions, setDefinitions] = useState<IReportDefinition[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [saving, setSaving] = useState(false);

  const [runningId, setRunningId] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<{ definitionId: number; rows: any[]; row_count: number; duration_ms: number } | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [templatesForDef, setTemplatesForDef] = useState<IReportDefinition | null>(null);

  const [showGallery, setShowGallery] = useState(false);
  const [galleryReports, setGalleryReports] = useState<ISystemReportDefinition[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [copyingId, setCopyingId] = useState<number | null>(null);

  // Manage Access (Step 7) — "none" means no grant at all (removed or
  // never granted); the map only ever holds one entry per login, no
  // separate "blocked" state to track since row-absence IS the deny.
  const [manageAccessForDef, setManageAccessForDef] = useState<IReportDefinition | null>(null);
  const [teamMembers, setTeamMembers] = useState<ICompanyTeam[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [accessMap, setAccessMap] = useState<Record<number, IDataScope | "none">>({});
  const [originalGrantedIds, setOriginalGrantedIds] = useState<Set<number>>(new Set());
  const [savingAccess, setSavingAccess] = useState(false);

  // Run History
  const [runHistoryForDef, setRunHistoryForDef] = useState<IReportDefinition | null>(null);
  const [runHistory, setRunHistory] = useState<IReportRun[]>([]);
  const [loadingRunHistory, setLoadingRunHistory] = useState(false);

  // Schedules (Step 8a)
  const [scheduleForDef, setScheduleForDef] = useState<IReportDefinition | null>(null);
  const [schedules, setSchedules] = useState<IReportSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [scheduleSendTime, setScheduleSendTime] = useState("09:00");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1);
  const [scheduleFormat, setScheduleFormat] = useState<"excel" | "pdf" | "both">("excel");
  const [scheduleLoginIds, setScheduleLoginIds] = useState<Set<number>>(new Set());
  const [scheduleExternalEmails, setScheduleExternalEmails] = useState("");

  const selectedModel = registry.find((m) => m.key === store.modelKey);
  const selectedPlugin = plugins.find((p) => p.key === store.pluginKey);

  // Step 10 — report groups. Own state, not folded into loadBuildData's
  // Promise.all: Manage Groups needs to reload just this list after a
  // create/rename/delete without re-fetching the whole registry.
  const [reportGroups, setReportGroups] = useState<IReportGroup[]>([]);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const loadReportGroups = async () => setReportGroups(await listReportGroups());

  const loadBuildData = async () => {
    setLoadingRegistry(true);
    const [reg, plg, mtr, defs] = await Promise.all([getModelRegistry(), getPluginRegistry(), getMetricsRegistry(), listReportDefinitions()]);
    setRegistry(reg);
    setPlugins(plg);
    setMetrics(mtr);
    setDefinitions(defs);
    setLoadingRegistry(false);
    loadReportGroups();
  };

  useEffect(() => {
    if (pinVerified) loadBuildData();
  }, [pinVerified]);

  const openGallery = async () => {
    setShowGallery(true);
    setLoadingGallery(true);
    const rows = await listSystemReportDefinitions();
    setGalleryReports(rows);
    setLoadingGallery(false);
  };

  // "Already Added" — checked against this company's own report_definitions
  // via the source link every copy already carries, not a separate API call.
  const alreadyAddedIds = new Set(
    definitions
      .map((d) => d.source_system_report_definition_id)
      .filter((id): id is number => !!id),
  );

  const handleCopyFromGallery = async (systemReportDefinitionId: number) => {
    setCopyingId(systemReportDefinitionId);
    const created = await copyFromSystemReportDefinition(systemReportDefinitionId);
    setCopyingId(null);
    if (created) {
      loadBuildData();
      // Badge-only, re-copying is still allowed (Step 1's decision) — the
      // modal stays open so the owner can add several at once.
    }
  };

  // {category -> reports[]} — a company builds their own reports across
  // many categories, so grouping the gallery the same way the PDF's own
  // 15 sections are organized makes the picker scannable, not one flat list.
  const galleryByCategory = galleryReports.reduce<Record<string, ISystemReportDefinition[]>>((acc, g) => {
    const key = g.category || "Other";
    (acc[key] = acc[key] || []).push(g);
    return acc;
  }, {});

  const openManageAccess = async (definition: IReportDefinition) => {
    setManageAccessForDef(definition);
    setLoadingAccess(true);
    const companyId = Number(localStorage.getItem("COMPANY_ID"));
    const [, grants] = await Promise.all([
      fetchCompanyTeamApi(setTeamMembers, companyId, ""),
      getReportTeamRights(definition.id),
    ]);
    const map: Record<number, IDataScope | "none"> = {};
    const grantedIds = new Set<number>();
    grants.forEach((g) => {
      map[g.a_application_login_id] = g.data_scope;
      grantedIds.add(g.a_application_login_id);
    });
    setAccessMap(map);
    setOriginalGrantedIds(grantedIds);
    setLoadingAccess(false);
  };

  const handleSaveAccess = async () => {
    if (!manageAccessForDef) return;
    setSavingAccess(true);
    const grants = Object.entries(accessMap)
      .filter(([, scope]) => scope !== "none")
      .map(([loginId, scope]) => ({ a_application_login_id: Number(loginId), data_scope: scope as IDataScope }));
    // Only logins that HAD a grant before and are now "none" need an
    // explicit removal — someone who was already ungranted needs no call.
    const removals = [...originalGrantedIds].filter((loginId) => accessMap[loginId] === "none" || accessMap[loginId] === undefined);
    const ok = await saveReportTeamRights(manageAccessForDef.id, grants, removals);
    setSavingAccess(false);
    if (ok) setManageAccessForDef(null);
  };

  const openRunHistory = async (definition: IReportDefinition) => {
    setRunHistoryForDef(definition);
    setLoadingRunHistory(true);
    const companyId = Number(localStorage.getItem("COMPANY_ID"));
    const [, runs] = await Promise.all([
      fetchCompanyTeamApi(setTeamMembers, companyId, ""),
      listReportRuns(definition.id),
    ]);
    setRunHistory(runs);
    setLoadingRunHistory(false);
  };

  const teamMemberName = (loginId: number) => teamMembers.find((m) => m.id === loginId)?.username || `#${loginId}`;

  const openSchedule = async (definition: IReportDefinition) => {
    setScheduleForDef(definition);
    setLoadingSchedules(true);
    const companyId = Number(localStorage.getItem("COMPANY_ID"));
    const [, rows] = await Promise.all([
      fetchCompanyTeamApi(setTeamMembers, companyId, ""),
      listReportSchedules(definition.id),
    ]);
    setSchedules(rows);
    setLoadingSchedules(false);
    // Reset the "new schedule" form each time the modal opens
    setScheduleFrequency("daily");
    setScheduleSendTime("09:00");
    setScheduleDayOfWeek(1);
    setScheduleDayOfMonth(1);
    setScheduleFormat("excel");
    setScheduleLoginIds(new Set());
    setScheduleExternalEmails("");
  };

  const handleCreateSchedule = async () => {
    if (!scheduleForDef) return;
    setSavingSchedule(true);
    const ok = await createReportSchedule(scheduleForDef.id, {
      frequency: scheduleFrequency,
      send_time: scheduleSendTime,
      day_of_week: scheduleFrequency === "weekly" ? scheduleDayOfWeek : undefined,
      day_of_month: scheduleFrequency === "monthly" ? scheduleDayOfMonth : undefined,
      delivery_format: scheduleFormat,
      recipients: {
        logins: [...scheduleLoginIds],
        emails: scheduleExternalEmails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
      },
    });
    setSavingSchedule(false);
    if (ok) {
      const rows = await listReportSchedules(scheduleForDef.id);
      setSchedules(rows);
      setScheduleLoginIds(new Set());
      setScheduleExternalEmails("");
    }
  };

  const handleToggleScheduleActive = async (schedule: IReportSchedule) => {
    const ok = await updateReportSchedule(schedule.id, { isActive: schedule.isActive ? 0 : 1 });
    if (ok && scheduleForDef) setSchedules(await listReportSchedules(scheduleForDef.id));
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    const ok = await deleteReportSchedule(scheduleId);
    if (ok && scheduleForDef) setSchedules(await listReportSchedules(scheduleForDef.id));
  };

  const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    const created = await createReportGroup(newGroupName.trim(), reportGroups.length);
    if (created) {
      setNewGroupName("");
      loadReportGroups();
    }
  };
  const handleStartRenameGroup = (group: IReportGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.group_name);
  };
  const handleSaveRenameGroup = async () => {
    if (editingGroupId === null || !editingGroupName.trim()) return;
    const ok = await updateReportGroup(editingGroupId, editingGroupName.trim());
    if (ok) {
      setEditingGroupId(null);
      loadReportGroups();
    }
  };
  const handleDeleteGroup = async (id: number) => {
    const ok = await deleteReportGroup(id);
    if (ok) loadReportGroups();
  };

  const handlePinSubmit = async (pin: string) => {
    const ok = await verifyReportPin(pin);
    if (ok) {
      setPinVerified(true);
      setShowPinModal(false);
    }
  };

  const addFilterRow = () => {
    if (!selectedModel) return;
    const firstFilterable = selectedModel.columns.find((c) => c.filterable);
    if (!firstFilterable) return;
    store.addFilterRow({ column: firstFilterable.key, op: OPERATORS_BY_TYPE[firstFilterable.type]?.[0]?.value || "eq", value: "" });
  };

  const handleSave = async () => {
    if (!store.name.trim()) return;
    setSaving(true);

    let created;
    if (store.type === "composite") {
      if (store.metricKeys.length === 0) {
        setSaving(false);
        return;
      }
      // Dimension (team members) is fixed server-side — no model_key,
      // filters, or group_by for this type. columns_json IS the metric-keys
      // array itself, not [{column}] picks (see compositeEngine.js).
      const payload = {
        name: store.name.trim(),
        type: "composite" as const,
        columns_json: store.metricKeys,
        report_group_id: store.reportGroupId,
        description: store.description.trim() || null,
      };
      created = store.editingId
        ? await updateReportDefinition(store.editingId, payload)
        : await createReportDefinition(payload);
    } else if (store.type === "plugin") {
      if (!store.pluginKey) {
        setSaving(false);
        return;
      }
      // Plugin filters are a plain object keyed to the plugin's own param
      // names, not the query-type {column,op,value}[] shape — store.filters
      // is repurposed here as [{column: paramKey, value}], flattened to an
      // object for the save payload. "date" fields (e.g. sourceReport's
      // selected_dates) go over the wire as a real 2-element array — that
      // plugin does `Array.isArray(selected_dates)` itself, a comma string
      // would fail its own validation, not something to special-case
      // per-plugin here since filterSchema already says which fields are dates.
      const filtersObject = Object.fromEntries(
        store.filters
          .filter((f) => f.value !== "")
          .map((f) => {
            const fieldDef = selectedPlugin?.filterSchema.find((s) => s.key === f.column);
            const value = fieldDef?.type === "date" ? f.value.split(",").map((v) => v.trim()) : f.value;
            return [f.column, value];
          }),
      );
      const payload = {
        name: store.name.trim(),
        type: "plugin" as const,
        plugin_key: store.pluginKey,
        // Not yet used for display — the results grid reads columns
        // straight off the run result's real keys for plugin-type
        // (Object.keys(rows[0])), since each plugin's row shape is
        // different and there's no per-column config UI for plugin mode
        // yet. Stored honestly empty rather than a fake placeholder value.
        columns_json: [],
        filters_json: filtersObject,
        report_group_id: store.reportGroupId,
        description: store.description.trim() || null,
      };
      created = store.editingId
        ? await updateReportDefinition(store.editingId, payload)
        : await createReportDefinition(payload);
    } else {
      if (!store.modelKey || store.columns.length === 0) {
        setSaving(false);
        return;
      }
      const payload = {
        name: store.name.trim(),
        type: "query" as const,
        model_key: store.modelKey,
        columns_json: store.columns,
        filters_json: store.filters.filter((f) => f.value !== ""),
        group_by_json: store.groupBy,
        filters_to_show: store.filtersToShow,
        report_group_id: store.reportGroupId,
        description: store.description.trim() || null,
      };
      created = store.editingId
        ? await updateReportDefinition(store.editingId, payload)
        : await createReportDefinition(payload);
    }

    setSaving(false);
    if (created) {
      store.reset();
      loadBuildData();
    }
  };

  const handleEdit = (definition: IReportDefinition) => {
    store.loadForEdit(definition);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (definition: IReportDefinition) => {
    const ok = await deleteReportDefinition(definition.id);
    if (ok) {
      if (store.editingId === definition.id) store.reset();
      loadBuildData();
    }
  };

  const [runSearch, setRunSearch] = useState("");

  const handleRun = async (definition: IReportDefinition, search?: string) => {
    setRunningId(definition.id);
    setRunResult(null);
    const result = await runReportDefinition(definition.id, search ? { search } : undefined);
    setRunningId(null);
    if (result) setRunResult({ definitionId: definition.id, ...result });
  };

  // Debounced re-run of whichever report's result is currently showing,
  // same 300ms convention the rest of this app's search boxes already use
  // (see inquiryView.tsx's own debouncedSearchText). Only fires once a
  // report has actually been run at least once — search has nothing to
  // filter before that.
  useEffect(() => {
    if (!runResult) return;
    const activeDefinition = definitions.find((d) => d.id === runResult.definitionId);
    if (!activeDefinition) return;
    const handler = setTimeout(() => handleRun(activeDefinition, runSearch), 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSearch]);

  const runResultColumns = runResult && runResult.rows.length > 0 ? Object.keys(runResult.rows[0]) : [];

  // Same key-derivation queryEngine.js's own resolveDisplayColumns() uses
  // server-side (aggregate ? alias || `${aggregate}_${column}` : column) —
  // kept in sync by hand since this is a client-side mirror for the export
  // column list, not a shared module. showInGrid/showInExcel/showTotal
  // per-column flags aren't in columns_json yet (a build-form addition,
  // not built this pass) — every selected column is offered to Excel for
  // now, same as the old exportReportExcel path already did.
  const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const buildExportColumns = (definition: IReportDefinition): { key: string; label: string; format?: "date" | "number" | "currency" }[] => {
    try {
      const columns = JSON.parse(definition.columns_json || "[]");
      if (Array.isArray(columns) && columns.length > 0) {
        // Looked up per-definition (not the form's own selectedModel,
        // which only reflects whatever model_key is currently being
        // edited) — this runs over every saved report's own row.
        const modelEntry = registry.find((m) => m.key === definition.model_key);
        return columns.map((c: any) => {
          // composite-type columns_json is a plain array of metric-key
          // strings, not {column,aggregate?} objects — same "shape varies
          // by type" precedent the backend already documents. Metric
          // values are always numeric, so "number" is a safe default.
          if (typeof c === "string") return { key: c, label: humanize(c), format: "number" as const };
          const key = c.aggregate ? c.alias || `${c.aggregate}_${c.column}` : c.column;
          const columnType = modelEntry?.columns.find((col) => col.key === c.column)?.type;
          // An aggregate (sum/avg/count/...) over any column is itself a
          // number, even when the underlying column is a plain "number" —
          // "currency" is the one type worth preserving through an
          // aggregate (a summed currency column is still money).
          const format = c.aggregate ? (columnType === "currency" ? "currency" : "number") : mapColumnTypeToExportFormat(columnType);
          return { key, label: c.label || humanize(key), format };
        });
      }
    } catch {
      // fall through to the sample-row fallback below
    }
    // plugin-type definitions always save columns_json as [] (no
    // per-column config UI for that type yet, see the build form's own
    // comment) — same graceful degradation the backend's
    // resolveDisplayColumns() already has: derive columns from whatever
    // keys the currently-shown preview row actually has, if there is one.
    if (runResult && runResult.definitionId === definition.id && runResult.rows.length > 0) {
      return Object.keys(runResult.rows[0]).map((key) => ({ key, label: humanize(key) }));
    }
    return [];
  };

  const handleExportPdf = async (definition: IReportDefinition) => {
    setExportingId(definition.id);
    const url = await exportReportPdf(definition.id);
    setExportingId(null);
    if (url) window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 20 }}>
      <PromptModal
        show={showPinModal && !pinVerified}
        onHide={() => navigate(-1)}
        onSubmit={handlePinSubmit}
        title="Owner PIN required"
        message="Report Builder is an owner-only area. Enter the shared build PIN to continue (same PIN as Document Designer)."
        placeholder="PIN"
        submitLabel="Verify"
      />

      {pinVerified && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Report Builder</h4>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>

          {/* --- build form --- */}
          <div className="card p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h6>{store.editingId ? "Edit Report" : "New Report"}</h6>
              <button className="btn btn-sm btn-outline-primary" onClick={openGallery}>
                Browse Report Library
              </button>
            </div>

            <div className="row g-2 mb-2 align-items-center">
              <div className="col-md-3">
                <input
                  className="form-control form-control-sm"
                  placeholder="Report name"
                  value={store.name}
                  onChange={(e) => store.setName(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex gap-1">
                <select
                  className="form-select form-select-sm"
                  value={store.reportGroupId ?? ""}
                  onChange={(e) => store.setReportGroupId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Ungrouped</option>
                  {reportGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowManageGroups(true)}>
                  Groups
                </button>
              </div>
              <div className="col-md-3">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${store.type === "query" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => store.setType("query")}
                  >
                    Query
                  </button>
                  <button
                    type="button"
                    className={`btn ${store.type === "plugin" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => store.setType("plugin")}
                  >
                    Plugin
                  </button>
                  <button
                    type="button"
                    className={`btn ${store.type === "composite" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => store.setType("composite")}
                  >
                    Team Metrics
                  </button>
                </div>
              </div>
              {store.type === "query" ? (
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={store.modelKey}
                    onChange={(e) => store.setModelKey(e.target.value)}
                    disabled={loadingRegistry}
                  >
                    <option value="">Select data source...</option>
                    {registry.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : store.type === "plugin" ? (
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={store.pluginKey}
                    onChange={(e) => store.setPluginKey(e.target.value)}
                    disabled={loadingRegistry}
                  >
                    <option value="">Select report...</option>
                    {plugins.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                // composite — dimension (team members) is fixed server-side,
                // no data-source picker needed, just the metric checkboxes below.
                <div className="col-md-4 text-muted" style={{ fontSize: 12, alignSelf: "center" }}>
                  One row per team member — pick metrics below.
                </div>
              )}
            </div>

            <div className="mb-2">
              <input
                className="form-control form-control-sm"
                placeholder="Description (optional — shown on the Custom Reports tile, also matched by search)"
                value={store.description}
                onChange={(e) => store.setDescription(e.target.value)}
              />
            </div>

            {store.type === "query" && selectedModel && (
              <>
                <div className="mb-2">
                  <strong style={{ fontSize: 13 }}>Columns</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                    {selectedModel.columns.map((col: IReportColumn) => {
                      const picked = store.columns.find((c) => c.column === col.key);
                      return (
                        <div key={col.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <label style={{ fontSize: 13, margin: 0 }}>
                            <input type="checkbox" checked={!!picked} onChange={() => store.toggleColumn(col.key)} style={{ marginRight: 4 }} />
                            {col.label}
                            {col.dynamic && <span className="badge bg-info text-dark ms-1" style={{ fontSize: 10 }}>Custom</span>}
                          </label>
                          {picked && col.aggregatable && col.aggregatable.length > 0 && (
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 110 }}
                              value={picked.aggregate || ""}
                              onChange={(e) => store.setColumnAggregate(col.key, e.target.value)}
                            >
                              <option value="">(no aggregate)</option>
                              {col.aggregatable.map((agg) => (
                                <option key={agg} value={agg}>
                                  {AGGREGATE_LABELS[agg] || agg}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Whitelisted joins — select/display only, no aggregate,
                    never appear in the filter/group-by pickers below (those
                    only iterate selectedModel.columns, not .relations). */}
                {selectedModel.relations && selectedModel.relations.length > 0 && (
                  <div className="mb-2">
                    {selectedModel.relations.map((rel) => (
                      <div key={rel.key} style={{ marginBottom: 6 }}>
                        <strong style={{ fontSize: 12, color: "#666" }}>Related: {rel.label}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                          {rel.columns.map((col: IReportColumn) => {
                            const picked = store.columns.some((c) => c.column === col.key);
                            return (
                              <label key={col.key} style={{ fontSize: 13, margin: 0 }}>
                                <input type="checkbox" checked={picked} onChange={() => store.toggleColumn(col.key)} style={{ marginRight: 4 }} />
                                {col.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-2">
                  <strong style={{ fontSize: 13 }}>Group by</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                    {selectedModel.columns
                      .filter((c) => c.groupable)
                      .map((col) => (
                        <label key={col.key} style={{ fontSize: 13, margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={store.groupBy.includes(col.key)}
                            onChange={() => store.toggleGroupBy(col.key)}
                            style={{ marginRight: 4 }}
                          />
                          {col.label}
                        </label>
                      ))}
                  </div>
                </div>

                {selectedModel.generalFilters && Object.keys(selectedModel.generalFilters).length > 0 && (
                  <div className="mb-2">
                    <strong style={{ fontSize: 13 }}>General filters shown by default</strong>
                    <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                      A viewer running this report can still widen or narrow this for themselves — this only picks what they start with.
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {Object.keys(selectedModel.generalFilters)
                        .map(Number)
                        .sort((a, b) => a - b)
                        .map((slot) => (
                          <label key={slot} style={{ fontSize: 13, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={store.filtersToShow.includes(slot)}
                              onChange={() => store.toggleFilterSlot(slot)}
                              style={{ marginRight: 4 }}
                            />
                            {SLOT_LABELS[slot] || `Slot ${slot}`}
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mb-2">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13 }}>Filters</strong>
                    <button className="btn btn-sm btn-link" onClick={addFilterRow}>
                      + Add filter
                    </button>
                  </div>
                  {store.filters.map((f, idx) => {
                    const col = selectedModel.columns.find((c) => c.key === f.column);
                    const operators = OPERATORS_BY_TYPE[col?.type || "string"] || OPERATORS_BY_TYPE.string;
                    return (
                      <div key={idx} className="row g-2 mb-1 align-items-center">
                        <div className="col-md-4">
                          <select
                            className="form-select form-select-sm"
                            value={f.column}
                            onChange={(e) => {
                              const nextCol = selectedModel.columns.find((c) => c.key === e.target.value);
                              store.updateFilterRow(idx, { column: e.target.value, op: OPERATORS_BY_TYPE[nextCol?.type || "string"]?.[0]?.value || "eq" });
                            }}
                          >
                            {selectedModel.columns
                              .filter((c) => c.filterable)
                              .map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.label}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <select className="form-select form-select-sm" value={f.op} onChange={(e) => store.updateFilterRow(idx, { op: e.target.value })}>
                            {operators.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <input
                            className="form-control form-control-sm"
                            value={f.value}
                            onChange={(e) => store.updateFilterRow(idx, { value: e.target.value })}
                            placeholder="Value"
                          />
                        </div>
                        <div className="col-md-1">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => store.removeFilterRow(idx)}>
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {store.type === "plugin" && selectedPlugin && (
              <div className="mb-2">
                <strong style={{ fontSize: 13 }}>Filters</strong>
                <div className="row g-2 mt-1">
                  {selectedPlugin.filterSchema.map((field) => (
                    <div className="col-md-4" key={field.key}>
                      <label style={{ fontSize: 12, display: "block" }}>{field.label}</label>
                      <input
                        className="form-control form-control-sm"
                        type={field.type === "date" ? "text" : "text"}
                        placeholder={field.type === "date" ? "YYYY-MM-DD,YYYY-MM-DD" : field.label}
                        value={store.filters.find((f) => f.column === field.key)?.value || ""}
                        onChange={(e) => store.setFilterValue(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  Date range fields take a comma-separated pair (e.g. 2026-01-01,2026-01-31).
                </div>
              </div>
            )}

            {store.type === "composite" && (
              <div className="mb-2">
                <strong style={{ fontSize: 13 }}>Metrics</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                  {metrics.map((m) => (
                    <label key={m.key} style={{ fontSize: 13, margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={store.metricKeys.includes(m.key)}
                        onChange={() => store.toggleMetric(m.key)}
                        style={{ marginRight: 4 }}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
                <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  One row per team member you have rights to see; each picked metric becomes a column.
                </div>
              </div>
            )}

            {((store.type === "query" && selectedModel) ||
              (store.type === "plugin" && selectedPlugin) ||
              store.type === "composite") && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={
                    saving ||
                    !store.name.trim() ||
                    (store.type === "query" && store.columns.length === 0) ||
                    (store.type === "composite" && store.metricKeys.length === 0)
                  }
                  onClick={handleSave}
                >
                  {saving ? "Saving..." : store.editingId ? "Update Report" : "Save Report"}
                </button>
                {store.editingId && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => store.reset()}>
                    Cancel Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* --- saved reports --- */}
          <div className="card p-3">
            <h6>Saved Reports</h6>
            {definitions.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>No reports yet — build one above.</p>}
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Group</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((def) => (
                  <React.Fragment key={def.id}>
                    <tr>
                      <td>{def.name}</td>
                      <td>{def.type}</td>
                      <td>{def.type === "plugin" ? def.plugin_key : def.type === "composite" ? "Team Metrics" : def.model_key}</td>
                      <td>{reportGroups.find((g) => g.id === def.report_group_id)?.group_name || "—"}</td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          disabled={runningId === def.id}
                          onClick={() => {
                            setRunSearch("");
                            handleRun(def);
                          }}
                        >
                          {runningId === def.id ? "Running..." : "Run"}
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(def)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(def)}>
                          Delete
                        </button>
                        {/* display:contents keeps this <li> from breaking the flex
                            button row's layout while staying valid HTML (a plain
                            <li> outside a <ul>/<ol> renders fine in every browser
                            but isn't valid markup) — same component every legacy
                            report's own export dropdown already uses. */}
                        <ul style={{ display: "contents", listStyle: "none", margin: 0, padding: 0 }}>
                          <ExportExcelMenuItem
                            reportType="report_builder"
                            filters={{ a_application_login_id: localStorage.getItem("UUID"), report_definition_id: def.id }}
                            columns={buildExportColumns(def)}
                            fileName={def.name}
                            disabled={buildExportColumns(def).length === 0}
                          />
                        </ul>
                        <button className="btn btn-sm btn-outline-dark" disabled={exportingId === def.id} onClick={() => handleExportPdf(def)}>
                          PDF / Print
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setTemplatesForDef(def)}>
                          Manage Templates
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openManageAccess(def)}>
                          Manage Access
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openRunHistory(def)}>
                          Run History
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openSchedule(def)}>
                          Schedule
                        </button>
                      </td>
                    </tr>
                    {runResult && runResult.definitionId === def.id && (
                      <tr>
                        <td colSpan={5}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12 }}>
                              {runResult.row_count} row(s) &middot; {runResult.duration_ms}ms
                            </span>
                            <input
                              className="form-control form-control-sm"
                              style={{ width: 200 }}
                              placeholder="Search..."
                              value={runSearch}
                              onChange={(e) => setRunSearch(e.target.value)}
                            />
                          </div>
                          {runResult.rows.length > 0 ? (
                            <div style={{ overflowX: "auto" }}>
                              <table className="table table-sm table-bordered">
                                <thead>
                                  <tr>
                                    {runResultColumns.map((c) => (
                                      <th key={c}>{c}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {runResult.rows.map((row, i) => (
                                    <tr key={i}>
                                      {runResultColumns.map((c) => (
                                        <td key={c}>{String(row[c])}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: 12 }}>No data.</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showGallery && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 480, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>System Report Library</h5>
              <span className="close" onClick={() => setShowGallery(false)}>&times;</span>
            </div>
            {loadingGallery && <p>Loading...</p>}
            {!loadingGallery && galleryReports.length === 0 ? <p>No reports in the library yet.</p> : null}
            {Object.entries(galleryByCategory).map(([category, reports]) => (
              <div key={category} className="mb-3">
                <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{category}</div>
                <hr style={{ margin: "4px 0 8px" }} />
                {reports.map((g) => {
                  const alreadyAdded = alreadyAddedIds.has(g.id);
                  return (
                    <div key={g.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {g.name}
                          {alreadyAdded && (
                            <span className="badge bg-light text-dark ms-2" style={{ fontSize: 10 }}>
                              Already Added
                            </span>
                          )}
                          {g.priority && (
                            <span
                              className={`badge ms-2 ${g.priority === "critical" ? "bg-danger" : g.priority === "high" ? "bg-warning text-dark" : "bg-secondary"}`}
                              style={{ fontSize: 10 }}
                            >
                              {g.priority}
                            </span>
                          )}
                        </div>
                        {g.description && <div style={{ fontSize: 11, color: "#888" }}>{g.description}</div>}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={copyingId === g.id}
                        onClick={() => handleCopyFromGallery(g.id)}
                      >
                        {copyingId === g.id ? "Adding..." : "Use This"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {manageAccessForDef && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 480, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Manage Access — {manageAccessForDef.name}</h5>
              <span className="close" onClick={() => setManageAccessForDef(null)}>&times;</span>
            </div>
            <p className="text-muted" style={{ fontSize: 12 }}>
              Only team members granted access below can see this report in "Custom Reports." Removing access here
              makes their tile disappear immediately, regardless of any other page-level rights they hold.
            </p>
            {loadingAccess && <p>Loading...</p>}
            {!loadingAccess && teamMembers.length === 0 && <p className="text-muted">No team members found.</p>}
            {!loadingAccess &&
              teamMembers.map((member) => {
                const scope = accessMap[member.id] ?? "none";
                return (
                  <div key={member.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <span style={{ fontSize: 13 }}>{member.username}</span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 160 }}
                      value={scope}
                      onChange={(e) =>
                        setAccessMap((prev) => ({ ...prev, [member.id]: e.target.value as IDataScope | "none" }))
                      }
                    >
                      <option value="none">No access</option>
                      <option value="own">Own data</option>
                      <option value="all">All data</option>
                      <option value="chain">Chain (own + referrals)</option>
                    </select>
                  </div>
                );
              })}
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-sm btn-primary" disabled={savingAccess} onClick={handleSaveAccess}>
                {savingAccess ? "Saving..." : "Save Access"}
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setManageAccessForDef(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {runHistoryForDef && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 640, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Run History — {runHistoryForDef.name}</h5>
              <span className="close" onClick={() => setRunHistoryForDef(null)}>&times;</span>
            </div>
            {loadingRunHistory && <p>Loading...</p>}
            {!loadingRunHistory && runHistory.length === 0 && <p className="text-muted">No runs recorded yet.</p>}
            {!loadingRunHistory && runHistory.length > 0 && (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Run by</th>
                    <th>Rows</th>
                    <th>Duration</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {runHistory.map((run) => (
                    <React.Fragment key={run.id}>
                      <tr>
                        <td style={{ fontSize: 12 }}>{run.executed_at}</td>
                        <td style={{ fontSize: 12 }}>{teamMemberName(run.executed_by)}</td>
                        <td style={{ fontSize: 12 }}>{run.row_count ?? "-"}</td>
                        <td style={{ fontSize: 12 }}>{run.duration_ms !== null ? `${run.duration_ms}ms` : "-"}</td>
                        <td>
                          <span className={`badge ${run.success ? "bg-success" : "bg-danger"}`}>
                            {run.success ? "Success" : "Failed"}
                          </span>
                        </td>
                      </tr>
                      {!run.success && run.error_message && (
                        <tr>
                          <td colSpan={5} style={{ fontSize: 11, color: "#b02a37" }}>{run.error_message}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {scheduleForDef && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 560, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Schedule — {scheduleForDef.name}</h5>
              <span className="close" onClick={() => setScheduleForDef(null)}>&times;</span>
            </div>

            {loadingSchedules && <p>Loading...</p>}

            {!loadingSchedules && schedules.length > 0 && (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Frequency</th>
                    <th>Time</th>
                    <th>Format</th>
                    <th>Next Run</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 12 }}>
                        {s.frequency === "weekly" && s.day_of_week !== null
                          ? `Weekly · ${WEEKDAY_LABELS[s.day_of_week]}`
                          : s.frequency === "monthly" && s.day_of_month !== null
                            ? `Monthly · day ${s.day_of_month}`
                            : "Daily"}
                      </td>
                      <td style={{ fontSize: 12 }}>{s.send_time}</td>
                      <td style={{ fontSize: 12 }}>{s.delivery_format}</td>
                      <td style={{ fontSize: 12 }}>{s.isActive ? s.next_run_at : <span className="text-muted">Paused</span>}</td>
                      <td style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleToggleScheduleActive(s)}>
                          {s.isActive ? "Pause" : "Resume"}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSchedule(s.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <hr />
            <h6>New Schedule</h6>
            <div className="row g-2 mb-2">
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 12 }}>Frequency</label>
                <select className="form-select form-select-sm" value={scheduleFrequency} onChange={(e) => setScheduleFrequency(e.target.value as any)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 12 }}>Time</label>
                <input type="time" className="form-control form-control-sm" value={scheduleSendTime} onChange={(e) => setScheduleSendTime(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: 12 }}>Format</label>
                <select className="form-select form-select-sm" value={scheduleFormat} onChange={(e) => setScheduleFormat(e.target.value as any)}>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                  <option value="both">Both</option>
                </select>
              </div>
              {scheduleFrequency === "weekly" && (
                <div className="col-md-6">
                  <label className="form-label" style={{ fontSize: 12 }}>Day of week</label>
                  <select className="form-select form-select-sm" value={scheduleDayOfWeek} onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}>
                    {WEEKDAY_LABELS.map((label, idx) => (
                      <option key={idx} value={idx}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {scheduleFrequency === "monthly" && (
                <div className="col-md-6">
                  <label className="form-label" style={{ fontSize: 12 }}>Day of month</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    className="form-control form-control-sm"
                    value={scheduleDayOfMonth}
                    onChange={(e) => setScheduleDayOfMonth(Math.min(Math.max(Number(e.target.value) || 1, 1), 28))}
                  />
                </div>
              )}
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: 12 }}>Team members</label>
              <div style={{ maxHeight: 120, overflowY: "auto", border: "1px solid #eee", borderRadius: 4, padding: 6 }}>
                {teamMembers.map((m) => (
                  <label key={m.id} style={{ display: "block", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={scheduleLoginIds.has(m.id)}
                      onChange={() =>
                        setScheduleLoginIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(m.id)) next.delete(m.id);
                          else next.add(m.id);
                          return next;
                        })
                      }
                      style={{ marginRight: 6 }}
                    />
                    {m.username}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 12 }}>External emails (comma-separated)</label>
              <input
                className="form-control form-control-sm"
                placeholder="accountant@example.com, boss@example.com"
                value={scheduleExternalEmails}
                onChange={(e) => setScheduleExternalEmails(e.target.value)}
              />
            </div>

            <button
              className="btn btn-sm btn-primary"
              disabled={savingSchedule || (scheduleLoginIds.size === 0 && !scheduleExternalEmails.trim())}
              onClick={handleCreateSchedule}
            >
              {savingSchedule ? "Saving..." : "Add Schedule"}
            </button>
          </div>
        </div>
      )}

      {showManageGroups && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 420, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Manage Groups</h5>
              <span className="close" onClick={() => setShowManageGroups(false)}>&times;</span>
            </div>
            {reportGroups.length === 0 && <p className="text-muted">No groups yet.</p>}
            {reportGroups.map((g) => (
              <div key={g.id} className="d-flex justify-content-between align-items-center border-bottom py-2 gap-2">
                {editingGroupId === g.id ? (
                  <input
                    className="form-control form-control-sm"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveRenameGroup()}
                    autoFocus
                  />
                ) : (
                  <span style={{ fontSize: 13 }}>{g.group_name}</span>
                )}
                <div className="d-flex gap-1">
                  {editingGroupId === g.id ? (
                    <button className="btn btn-sm btn-outline-primary" onClick={handleSaveRenameGroup}>
                      Save
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleStartRenameGroup(g)}>
                      Rename
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteGroup(g.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div className="d-flex gap-2 mt-3">
              <input
                className="form-control form-control-sm"
                placeholder="New group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddGroup}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {templatesForDef && (
        <ReportPdfTemplateDesigner
          docType={`report_${templatesForDef.id}`}
          reportName={templatesForDef.name}
          onClose={() => setTemplatesForDef(null)}
        />
      )}
    </div>
  );
};

export default ReportBuilderView;
