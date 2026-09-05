import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import PromptModal from "../../../../components/model/PromptModal";
import { fetchCompanyTeamApi, ICompanyTeam } from "../../../left-side/list-company/ListCompanyController";
import { ReportIcon } from "../../../side-view/reportIcons";
import ManageGroupsModal from "./ManageGroupsModal";
import {
  copyFromSystemReportDefinition,
  createReportSchedule,
  deleteReportDefinition,
  deleteReportSchedule,
  duplicateReportDefinition,
  exportReportDefinitionJson,
  exportReportPdf,
  getModelRegistry,
  getReportTeamRights,
  IDataScope,
  IModelRegistryEntry,
  IReportDefinition,
  IReportGroup,
  IReportRun,
  IReportSchedule,
  ISystemReportDefinition,
  importReportDefinitionFile,
  listReportDefinitions,
  listReportGroups,
  listReportRuns,
  listReportSchedules,
  listSystemReportDefinitions,
  saveReportTeamRights,
  updateReportSchedule,
  verifyReportPin,
} from "./ReportBuilderController";
import { mapColumnTypeToExportFormat } from "./generalFilterAdapter";
import ReportPdfTemplateDesigner from "./ReportPdfTemplateDesigner";

// List-level half of the old ReportBuilderView.tsx (Step 12, piece 6) — the
// Saved Reports card grid, gallery/import/duplicate, and every per-report
// row action (Manage Access/Run History/Schedule/PDF Designer/Export).
// Building/editing a report's own shape (name/type/source/columns/filters/
// group/icon) now lives on its own screen (ReportBuilderWizardView.tsx,
// pieces 1-5), reached via "New Report" / a card's "Edit" button — this
// view holds no useReportBuilderStore reference at all, it only reads
// already-saved IReportDefinition rows.
const ReportBuilderListView: React.FC = () => {
  const navigate = useNavigate();

  // See ReportBuilderWizardView.tsx's own copy of this comment — trusts an
  // already-stored REPORT_PIN_TOKEN instead of re-prompting on every
  // mount/reload; a stale token just fails the first gated call normally.
  const [pinVerified, setPinVerified] = useState(() => !!localStorage.getItem("REPORT_PIN_TOKEN"));
  const [showPinModal, setShowPinModal] = useState(true);

  const [registry, setRegistry] = useState<IModelRegistryEntry[]>([]);
  const [definitions, setDefinitions] = useState<IReportDefinition[]>([]);
  const [reportGroups, setReportGroups] = useState<IReportGroup[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [exportingId, setExportingId] = useState<number | null>(null);
  const [templatesForDef, setTemplatesForDef] = useState<IReportDefinition | null>(null);

  const [showGallery, setShowGallery] = useState(false);
  const [galleryReports, setGalleryReports] = useState<ISystemReportDefinition[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [copyingId, setCopyingId] = useState<number | null>(null);

  const [showManageGroups, setShowManageGroups] = useState(false);

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

  // Saved Reports tile grid — matches ReportsTileView.tsx's own card style
  // (Custom Reports tiles at /SideView?view=reports) instead of a plain
  // Bootstrap table, so this screen reads as "part of this app" the same
  // way the run screen already does. Secondary actions collapse into one
  // "More" dropdown per card (same click-outside pattern the run screen's
  // toolbar already uses) — a card with 7 visible action buttons would be
  // more cluttered than the table it's replacing.
  const [openMoreMenuId, setOpenMoreMenuId] = useState<number | null>(null);
  const moreMenuCardRef = useRef<HTMLDivElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  // Saved Reports search — client-side, same "the list is already scoped
  // and small (a company's own report count)" reasoning ReportsTileView.tsx's
  // own search box already relies on. Matches name + description.
  const [savedSearch, setSavedSearch] = useState("");
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuCardRef.current && !moreMenuCardRef.current.contains(event.target as Node)) {
        setOpenMoreMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadReportGroups = async () => setReportGroups(await listReportGroups());

  const loadListData = async () => {
    setLoadingList(true);
    const [reg, defs] = await Promise.all([getModelRegistry(), listReportDefinitions()]);
    setRegistry(reg);
    setDefinitions(defs);
    setLoadingList(false);
    loadReportGroups();
  };

  useEffect(() => {
    if (pinVerified) loadListData();
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
      loadListData();
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

  const handlePinSubmit = async (pin: string) => {
    const ok = await verifyReportPin(pin);
    if (ok) {
      setPinVerified(true);
      setShowPinModal(false);
    }
  };

  // Themed replacement for window.confirm() — same pattern
  // DocumentDesignerView.tsx already uses (one shared pending-action slot,
  // driven by the app's own ConfirmationModal instead of a native dialog).
  // Deleting a report or a schedule are the only two destructive actions on
  // this screen (Manage Groups' own delete lives in ManageGroupsModal.tsx,
  // gets its own copy of this same pattern).
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const askConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ message, onConfirm });

  const handleDelete = async (definition: IReportDefinition) => {
    const ok = await deleteReportDefinition(definition.id);
    if (ok) loadListData();
  };

  const handleDuplicate = async (definition: IReportDefinition) => {
    const created = await duplicateReportDefinition(definition.id);
    if (created) loadListData();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file name back-to-back
    if (!file) return;
    const created = await importReportDefinitionFile(file);
    if (created) loadListData();
  };

  // Same key-derivation queryEngine.js's own resolveDisplayColumns() uses
  // server-side (aggregate ? alias || `${aggregate}_${column}` : column) —
  // kept in sync by hand since this is a client-side mirror for the export
  // column list, not a shared module. showInExcel:false drops a column from
  // this list entirely (defaults to included, same as before this flag
  // existed); showTotal rides along per-column so buildExportFooter below
  // can build the totals row without re-parsing columns_json itself.
  const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const buildExportColumns = (definition: IReportDefinition): { key: string; label: string; format?: "date" | "number" | "currency"; showTotal?: boolean }[] => {
    try {
      const columns = JSON.parse(definition.columns_json || "[]");
      if (Array.isArray(columns) && columns.length > 0) {
        const modelEntry = registry.find((m) => m.key === definition.model_key);
        return columns
          .filter((c: any) => typeof c === "string" || c.showInExcel !== false)
          .map((c: any) => {
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
            return { key, label: c.label || humanize(key), format, showTotal: !!c.showTotal };
          });
      }
    } catch {
      // fall through
    }
    // plugin-type definitions always save columns_json as [] (no
    // per-column config UI for that type — see StepColumns.tsx) — nothing
    // to export from here without a sample row. Exporting a plugin-type
    // report now happens from its own run screen (ReportRunnerView.tsx),
    // which derives columns from the real fetched rows instead.
    return [];
  };

  // One grand-total row, computed over whichever columns got showTotal:true
  // at build time — undefined (not an empty FooterSpec) when none did, so
  // ExportExcelMenuItem's own "no footer passed" behavior is unchanged for
  // every report that doesn't use this. The label lands in the first
  // exported column that ISN'T itself being summed (falls back to the
  // first summed column's own row if every exported column has a total,
  // an edge case rather than a crash).
  const buildExportFooter = (definition: IReportDefinition) => {
    const exportCols = buildExportColumns(definition);
    const totalCols = exportCols.filter((c) => c.showTotal);
    if (totalCols.length === 0) return undefined;
    const labelKey = exportCols.find((c) => !c.showTotal)?.key ?? totalCols[0].key;
    const row: Record<string, string | number | { fromSum: string }> = { [labelKey]: "Total" };
    totalCols.forEach((c) => {
      row[c.key] = { fromSum: c.key };
    });
    return {
      sums: totalCols.map((c) => ({ outputKey: c.key, sourceKey: c.key })),
      rows: [row],
    };
  };

  const handleExportPdf = async (definition: IReportDefinition) => {
    setExportingId(definition.id);
    const url = await exportReportPdf(definition.id);
    setExportingId(null);
    if (url) window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Same .report-tile hover effect ReportsTileView.tsx already defines
          for the Custom Reports tile grid — duplicated here (not shared,
          each screen already owns its own inline styles in this app)
          so Saved Reports' cards read the same way. */}
      <style>{`
        .report-tile { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .report-tile:hover { border-color: #d1d5db; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        /* Bootstrap's default .btn-primary is blue — doesn't match this
           app's own accent (the same orange ReportsTileView.tsx's tile
           icons already use). Scoped to this page only. */
        .rb-btn-primary { background-color: #F58634; border-color: #F58634; color: #fff; }
        .rb-btn-primary:hover, .rb-btn-primary:focus { background-color: #e0752a; border-color: #e0752a; color: #fff; }
        .rb-btn-primary:disabled { background-color: #f5ab7a; border-color: #f5ab7a; }
        .rb-btn-outline-primary { color: #F58634; border-color: #F58634; background-color: transparent; }
        .rb-btn-outline-primary:hover, .rb-btn-outline-primary:focus { background-color: #F58634; border-color: #F58634; color: #fff; }
      `}</style>
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

          {/* --- saved reports --- */}
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Saved Reports</h6>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm rb-btn-primary" onClick={() => navigate("/report-builder/new")}>
                  + New Report
                </button>
                <button className="btn btn-sm rb-btn-outline-primary" onClick={openGallery}>
                  Browse Report Library
                </button>
                <button className="btn btn-sm rb-btn-outline-primary" onClick={() => importFileInputRef.current?.click()}>
                  Import
                </button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={handleImportFile}
                />
              </div>
            </div>
            {loadingList && <p className="text-muted" style={{ fontSize: 13 }}>Loading...</p>}
            {!loadingList && definitions.length === 0 && (
              <p className="text-muted" style={{ fontSize: 13 }}>No reports yet — click "New Report" to build one.</p>
            )}
            {definitions.length > 0 && (
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search saved reports..."
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                style={{ maxWidth: 320, marginBottom: 12 }}
              />
            )}
            {(() => {
              const q = savedSearch.trim().toLowerCase();
              const filteredDefinitions = q
                ? definitions.filter((d) => d.name.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q))
                : definitions;
              if (definitions.length > 0 && filteredDefinitions.length === 0) {
                return <p className="text-muted" style={{ fontSize: 13 }}>No saved reports match "{savedSearch}".</p>;
              }
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {filteredDefinitions.map((def) => {
                    const group = reportGroups.find((g) => g.id === def.report_group_id)?.group_name;
                    const source = def.type === "plugin" ? def.plugin_key : def.type === "composite" ? "Team Metrics" : def.model_key;
                    return (
                      <div
                        key={def.id}
                        className="report-tile"
                        style={{
                          position: "relative",
                          padding: 16,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "#fff3eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <ReportIcon name={def.icon || "report"} size={16} color="#F58634" />
                          </div>
                          <a
                            href={`/report-builder/run/${def.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/report-builder/run/${def.id}`);
                            }}
                            style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", textDecoration: "none" }}
                          >
                            {def.name}
                          </a>
                        </div>
                        <div style={{ fontSize: 11, color: "#8a8a8a", marginBottom: def.description ? 4 : 8 }}>
                          {def.type}
                          {source ? ` · ${source}` : ""}
                          {group ? ` · ${group}` : ""}
                        </div>
                        {def.description && (
                          <p style={{ margin: 0, marginBottom: 8, fontSize: 12, lineHeight: 1.5, color: "#8a8a8a" }}>{def.description}</p>
                        )}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/report-builder/${def.id}/edit`)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => askConfirm(`Delete "${def.name}"? This can't be undone.`, () => handleDelete(def))}
                          >
                            Delete
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setOpenMoreMenuId((v) => (v === def.id ? null : def.id))}
                          >
                            &#8942; More
                          </button>
                        </div>
                        {openMoreMenuId === def.id && (
                          <div
                            ref={moreMenuCardRef}
                            style={{
                              position: "absolute",
                              right: 16,
                              top: "100%",
                              zIndex: 1000,
                              width: 200,
                              background: "#fff",
                              borderRadius: 8,
                              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                              padding: 8,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {/* display:contents keeps this <li> from breaking the flex
                                column's layout while staying valid HTML (a plain <li>
                                outside a <ul>/<ol> renders fine in every browser but
                                isn't valid markup) — same component every legacy
                                report's own export dropdown already uses. */}
                            <ul style={{ display: "contents", listStyle: "none", margin: 0, padding: 0 }}>
                              <ExportExcelMenuItem
                                reportType="report_builder"
                                filters={{ a_application_login_id: localStorage.getItem("UUID"), report_definition_id: def.id }}
                                columns={buildExportColumns(def)}
                                footer={buildExportFooter(def)}
                                fileName={def.name}
                                disabled={buildExportColumns(def).length === 0}
                                onSelect={() => setOpenMoreMenuId(null)}
                              />
                            </ul>
                            <button
                              className="btn btn-sm btn-outline-dark"
                              disabled={exportingId === def.id}
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                handleExportPdf(def);
                              }}
                            >
                              {exportingId === def.id ? "Exporting..." : "PDF / Print"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                handleDuplicate(def);
                              }}
                            >
                              Duplicate
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                exportReportDefinitionJson(def.id, def.name);
                              }}
                            >
                              Export JSON
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                setTemplatesForDef(def);
                              }}
                            >
                              Manage Templates
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                openManageAccess(def);
                              }}
                            >
                              Manage Access
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                openRunHistory(def);
                              }}
                            >
                              Run History
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setOpenMoreMenuId(null);
                                openSchedule(def);
                              }}
                            >
                              Schedule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowManageGroups(true)}>
                Manage Groups
              </button>
            </div>
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
                        className="btn btn-sm rb-btn-outline-primary"
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
              <button className="btn btn-sm rb-btn-primary" disabled={savingAccess} onClick={handleSaveAccess}>
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
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => askConfirm("Delete this schedule? This can't be undone.", () => handleDeleteSchedule(s.id))}
                        >
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
              className="btn btn-sm rb-btn-primary"
              disabled={savingSchedule || (scheduleLoginIds.size === 0 && !scheduleExternalEmails.trim())}
              onClick={handleCreateSchedule}
            >
              {savingSchedule ? "Saving..." : "Add Schedule"}
            </button>
          </div>
        </div>
      )}

      <ManageGroupsModal show={showManageGroups} onClose={() => setShowManageGroups(false)} onChanged={loadReportGroups} />

      <ConfirmationModal
        show={!!confirmDialog}
        onHide={() => setConfirmDialog(null)}
        handleSubmit={() => {
          confirmDialog?.onConfirm();
          setConfirmDialog(null);
        }}
        title="Please Confirm"
        message={confirmDialog?.message}
        btn1="Cancel"
        btn2="Delete"
      />

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

export default ReportBuilderListView;
