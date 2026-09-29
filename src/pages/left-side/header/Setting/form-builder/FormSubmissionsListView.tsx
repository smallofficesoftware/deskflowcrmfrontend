import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, type DataTableFilterEvent, type DataTableFilterMeta, type DataTableSortEvent, type SortOrder } from "primereact/datatable";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import ColumnsButton from "../../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../../components/ExportExcelMenuItem";
import ExportPdfMenuItem from "../../../../../components/ExportPdfMenuItem";
import { ExportColumn } from "../../../../../services/reportExportService";
import {
  getForm,
  listSubmissions,
  deleteSubmission,
  updateSubmissionStatus,
  linkDuplicateContact,
  dismissDuplicateContact,
  exportSubmissionPdf,
  exportBlankFormPdf,
  IRestricted,
  exportSubmissionsBulkPdf,
  exportSubmissionsPagesPdf,
  exportSubmissionsExcel,
  getSubmissionAuditLog,
  isEncryptedField,
  IFormBuilderField,
} from "./FormBuilderController";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";
import SensitiveValueCell from "./SensitiveValueCell";
import SubmissionDetailView from "./SubmissionDetailView";
import { entryNumberOf, listCellText, listFieldsOf } from "./listCells";
import { STATUS_LABELS } from "./approval";
import RadioButtonModal from "../../../../../components/model/RadioButtonModal";

// stageAndStatusMasterTableReference["form_builder_submissions"] (backend
// statusLogServices.js) - 15, not 13: 13 is job_cards' own order_type
// (JobCardController.ts's get-status call), 14 is route_planner's. Both
// already taken; found and fixed after they'd have silently shared one
// status pool with Job Card.
const FORM_SUBMISSIONS_ORDER_TYPE = 15;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

// Portaled to document.body (not the .labelDropLeft in-flow dropdown
// pattern) - a PrimeReact scrollable DataTable's body wrapper clips/traps
// any position:absolute menu nested inside a row cell (overflow + its own
// stacking context beat any z-index we set), so the menu never became
// visible in-place. Rendering outside the table via a portal, positioned
// from the button's own bounding rect, sidesteps that entirely.
const RowActionMenu = ({
  onViewEdit,
  onPdf,
  onHistory,
  onChangeStatus,
  onDelete,
}: {
  onViewEdit: () => void;
  onPdf: () => void;
  onHistory: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 4, left: rect.right - 150 });
    };
    reposition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const menuItem = (label: string, onClick: () => void, danger = false) => (
    <li
      className="listItem"
      role="button"
      style={{
        margin: "0 10px",
        height: "25px",
        display: "flex",
        alignItems: "center",
        color: danger ? "#dc3545" : undefined,
        fontWeight: danger ? "bold" : undefined,
      }}
      onClick={() => {
        setOpen(false);
        onClick();
      }}
    >
      {label}
    </li>
  );

  return (
    <div ref={buttonRef} style={{ display: "inline-block" }}>
      <Button
        icon="pi pi-cog"
        className="p-button-text source-of-type-list-grid-options"
        style={{ color: "green", width: "2rem" }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      />
      {open
        ? createPortal(
            <ul
              ref={menuRef}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: 150,
                height: "auto",
                zIndex: 9999,
                background: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                borderRadius: "6px",
                padding: "5px 0",
                listStyle: "none",
                margin: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {menuItem("Edit", onViewEdit)}
              {menuItem("PDF", onPdf)}
              {menuItem("History", onHistory)}
              {menuItem("Change Status", onChangeStatus)}
              {menuItem("Delete", onDelete, true)}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
};

// "More Option" dropdown - same pi-ellipsis-v round Button + labelDropLeft
// list holding ExportExcelMenuItem/ExportPdfMenuItem that
// allContactReportView.tsx uses, so Form Submissions' toolbar looks and
// behaves like Contact Book's instead of a bespoke icon set. Export items
// fall back to the currently loaded page when nothing is selected (no
// registry entry exists here to fall back to server-side like Contact
// Book's own "select none -> exports everything" does).
const MoreOptionsMenu = ({
  reportType,
  columns,
  fileName,
  exportRows,
  getCellValue,
  onPrintBlank,
  onPrintAll,
  onExportAllExcel,
  onExportAllPdf,
}: {
  reportType: string;
  columns: ExportColumn[];
  fileName: string;
  exportRows: any[];
  getCellValue: (col: ExportColumn, row: any) => unknown;
  onPrintBlank: () => void;
  onPrintAll: () => void;
  onExportAllExcel: () => void;
  onExportAllPdf: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <Button
        icon="pi pi-ellipsis-v"
        className="report_button"
        style={{ backgroundColor: "#4C4C4C" }}
        rounded
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        tooltip="More Option"
        tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
      />
      <ul
        className={`labelDropLeft ${open ? "isVisible" : "isHidden"}`}
        style={{ width: 210, position: "absolute", right: 0, top: "100%", zIndex: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ExportExcelMenuItem
          reportType={reportType}
          columns={columns}
          fileName={fileName}
          filters={{}}
          selectedRows={exportRows}
          getCellValue={getCellValue}
          disabled={exportRows.length === 0}
          onSelect={() => setOpen(false)}
        />
        <ExportPdfMenuItem
          reportType={reportType}
          columns={columns}
          fileName={fileName}
          filters={{}}
          selectedRows={exportRows}
          getCellValue={getCellValue}
          disabled={exportRows.length === 0}
          onSelect={() => setOpen(false)}
        />
        <li
          className="listItem text-start"
          role="button"
          onClick={() => {
            setOpen(false);
            onPrintBlank();
          }}
        >
          <i className="pi pi-print" style={{ marginRight: "4px" }} />
          Print blank form
        </li>
        <li
          className="listItem text-start"
          role="button"
          onClick={() => {
            setOpen(false);
            onPrintAll();
          }}
        >
          <i className="pi pi-print" style={{ marginRight: "4px" }} />
          Print all entries
        </li>
        <li
          className="listItem text-start"
          role="button"
          onClick={() => {
            setOpen(false);
            onExportAllExcel();
          }}
        >
          <i className="pi pi-file-excel" style={{ marginRight: "4px" }} />
          Export ALL to Excel
        </li>
        <li
          className="listItem text-start"
          role="button"
          onClick={() => {
            setOpen(false);
            onExportAllPdf();
          }}
        >
          <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
          Export ALL to PDF
        </li>
      </ul>
    </div>
  );
};

interface StatusOption {
  id: number;
  name: string;
  color: string;
}

interface Props {
  formId: number;
  onClose?: () => void;
}

// Staff-facing submissions list for one form — reachable both from the
// builder (FormBuilderListView's "Submissions" button) and from
// SideView.tsx's ?view=forms Published Forms browsing list (plan §7).
// Rebuilt on PrimeReact DataTable/Column - the same grid the site's other
// real report grids use (allContactReportView.tsx), not a plain <table>:
// numbered-page paginator, built-in multi-select, resizable/sortable
// columns, a ColumnsButton chooser, and Export Excel/PDF via the exact
// same ExportExcelMenuItem/ExportPdfMenuItem components (passing `rows`
// directly skips their reportType registry lookup entirely - server just
// formats the given rows - so no backend registry change was needed).
const FormSubmissionsListView: React.FC<Props> = ({ formId, onClose }) => {
  const [title, setTitle] = useState("");
  // Full-number (encrypted) Aadhaar fields get their own column: the list
  // returns them masked, with a Show button when the server allows reveal.
  const [encryptedFields, setEncryptedFields] = useState<IFormBuilderField[]>([]);
  // Answers shown as columns (Show in the entries list) and all fields, for the entry number.
  const [listFields, setListFields] = useState<IFormBuilderField[]>([]);
  const [restricted, setRestricted] = useState<IRestricted | null>(null);
  // Approval stages (plan I): stage names and the "waiting for me" filter.
  const [approval, setApproval] = useState<{ enabled: boolean; stages?: { id: string; name: string }[]; my_stage_ids?: string[] } | null>(null);
  const [stageFilter, setStageFilter] = useState<"all" | "mine" | "completed">("all");
  const [allFields, setAllFields] = useState<IFormBuilderField[]>([]);
  const [canRevealSensitive, setCanRevealSensitive] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [auditFor, setAuditFor] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);

  // ── Paging (numbered pages, same as allContactReportView.tsx's DataTable) ──
  const [first, setFirst] = useState(0);
  const [pageRows, setPageRows] = useState(PAGE_SIZE_OPTIONS[1]);
  const [loading, setLoading] = useState(false);

  // ── Sorting - client-side over the currently loaded page only (the
  // backend has no ORDER BY param; matches allContactReportView.tsx's own
  // lazy DataTable, which also just re-sorts its loaded array). ──
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(1);

  // ── Row selection (built into DataTable) ──
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Per-row "Change Status" modal - same RadioButtonModal used by Contact's
  // "Assign Status" action, instead of an inline <select> in the grid cell.
  const [statusModalRow, setStatusModalRow] = useState<any>(null);

  // ── Column chooser (ColumnsButton) - simple in-memory toggle, not the
  // persisted useColumnPreferences hook (that's per-report-key localStorage;
  // out of scope for a per-form dynamic column set). ──
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [colOrder, setColOrder] = useState<string[]>([]);

  const loadStatusOptions = async () => {
    try {
      const { data } = await axiosInstance.post("get-status", {
        status_type: FORM_SUBMISSIONS_ORDER_TYPE,
        a_application_login_id: Number(localStorage.getItem("UUID")),
      });
      setStatusOptions(data?.data?.item || data?.data || []);
    } catch {
      setStatusOptions([]);
    }
  };

  const changeStatus = async (submissionId: number, statusId: number) => {
    const res = await updateSubmissionStatus(formId, submissionId, statusId);
    if (res?.ack === 1) {
      reload();
    } else {
      toast.error(res?.ack_msg || "Could not update status");
    }
  };

  const buildFilters = () => {
    const filters: Record<string, any> = {};
    if (stageFilter === "mine") filters.pending_for_me = true;
    if (stageFilter === "completed") filters.stage_status = "completed";
    return filters;
  };

  const load = async (firstIndex: number, rowsPerPage: number) => {
    setLoading(true);
    const res = await listSubmissions(formId, {
      search: search || undefined,
      filters: buildFilters(),
      limit: rowsPerPage,
      offset: firstIndex,
    });
    setRows(res?.data?.item || []);
    setTotalRecords(res?.data?.total || 0);
    setCanRevealSensitive(res?.data?.can_reveal_sensitive === true);
    setRestricted(res?.data?.restricted || null);
    setApproval(res?.data?.approval?.enabled ? res.data.approval : null);
    setSelectedRows([]);
    setLoading(false);
  };

  const reload = () => {
    setFirst(0);
    load(0, pageRows);
  };

  const onPage = (event: { first: number; rows: number }) => {
    setFirst(event.first);
    setPageRows(event.rows);
    load(event.first, event.rows);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  };

  // Re-load when the "waiting for me" tab changes.
  useEffect(() => {
    if (allFields.length || approval) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter]);

  // Debounced live search (matches allContactReportView.tsx's debounced
  // search UX) - reload 400ms after the user stops typing.
  useEffect(() => {
    if (!allFields.length) return; // skip the very first render, before the form itself has loaded
    const t = setTimeout(() => reload(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    (async () => {
      const formRes = await getForm(formId);
      if (formRes?.data?.item) {
        setTitle(formRes.data.item.title);
        try {
          const fields = JSON.parse(formRes.data.item.published_schema_json || "[]") as IFormBuilderField[];
          setEncryptedFields(fields.filter(isEncryptedField));
          setListFields(listFieldsOf(fields));
          setAllFields(fields);
        } catch {
          setEncryptedFields([]);
          setListFields([]);
          setAllFields([]);
        }
      }
      setFirst(0);
      load(0, pageRows);
      loadStatusOptions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // Columns this user may see (hidden fields are left out; masked ones show ••••).
  const shownListFields = listFields.filter((f) => !restricted?.hidden?.includes(f.key));

  // Column definitions for the DataTable/ColumnsButton/Export set - one
  // source of truth for all three, same as allContactReportView.tsx's
  // visibleColumns.
  const allColumnDefs = useMemo(
    () => [
      { key: "_entry", label: "Entry", locked: true },
      { key: "_submitted", label: "Submitted", locked: true },
      { key: "_by", label: "By" },
      ...shownListFields.map((f) => ({ key: f.key, label: f.label })),
      ...encryptedFields.map((f) => ({ key: f.key, label: f.label })),
      ...(approval ? [{ key: "_approval", label: "Approval" }] : []),
      { key: "_status", label: "Status" },
    ],
    [shownListFields, encryptedFields, approval],
  );

  // Keep colOrder in sync with the current field set (formId change) while
  // preserving any hidden/reordered state the user already set for keys
  // that still exist.
  useEffect(() => {
    const defaultKeys = allColumnDefs.map((c) => c.key);
    setColOrder((prev) => {
      const kept = prev.filter((k) => defaultKeys.includes(k));
      const missing = defaultKeys.filter((k) => !kept.includes(k));
      return [...kept, ...missing];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumnDefs]);

  const toggleColumn = (key: string) =>
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const reorderColumns = (newOrder: string[]) => setColOrder(newOrder);
  const resetColumns = () => {
    setHiddenKeys(new Set());
    setColOrder(allColumnDefs.map((c) => c.key));
  };

  const orderedVisibleKeys = colOrder.filter((k) => !hiddenKeys.has(k));
  const columnDefByKey = new Map(allColumnDefs.map((c) => [c.key, c]));

  // ── Per-column filter row (filterDisplay="row") - same as
  // allContactReportView.tsx's own DataTable: one active field at a time
  // (typing in a new column clears any other), client-side over the
  // currently loaded page only (Contact Book's own onFilter/getFilteredData
  // never sends these to the server either - only the global search box and
  // the "Filter Report" modal do). ──
  const [colFilters, setColFilters] = useState<DataTableFilterMeta>({});

  useEffect(() => {
    setColFilters((prev) => {
      const next: DataTableFilterMeta = {};
      allColumnDefs.forEach((c) => {
        next[c.key] = prev[c.key] ?? { value: null, matchMode: "contains" };
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumnDefs]);

  const onColumnFilter = (event: DataTableFilterEvent) => {
    const activeField = Object.keys(event.filters).find((key) => {
      const f: any = event.filters[key];
      return "value" in f && f.value !== null && f.value !== "";
    });
    const next: DataTableFilterMeta = { ...event.filters };
    Object.keys(next).forEach((key) => {
      if (key !== activeField) (next[key] as any).value = null;
    });
    setColFilters(next);
  };

  const cellFor = (row: any, key: string): React.ReactNode => {
    if (key === "_entry") return entryNumberOf(allFields, row);
    if (key === "_submitted") return new Date(row.created_date_time).toLocaleString();
    if (key === "_by") return row.submitted_by_type === "public" ? row.submitter_name || "Public" : row._created_by_name || "Internal";
    if (key === "_approval") {
      if (!row.current_stage) return <span className="text-muted">—</span>;
      return (
        <>
          <div>{approval?.stages?.find((st) => st.id === row.current_stage)?.name || row.current_stage}</div>
          <span className={`badge ${row.stage_status === "completed" ? "bg-success" : row.stage_status === "sent_back" ? "bg-warning text-dark" : "bg-primary"}`}>
            {STATUS_LABELS[row.stage_status] || row.stage_status}
          </span>
        </>
      );
    }
    if (key === "_status") {
      return row._status?.name ? (
        <span className="badge rounded-pill" style={{ backgroundColor: row._status.color || "#6c757d" }}>
          {row._status.name}
        </span>
      ) : (
        <span className="text-muted">— No status —</span>
      );
    }
    const encField = encryptedFields.find((f) => f.key === key);
    if (encField) {
      return (
        <SensitiveValueCell
          formId={formId}
          submissionId={row.id}
          fieldKey={key}
          maskedValue={row[key]}
          canReveal={canRevealSensitive}
        />
      );
    }
    const field = shownListFields.find((f) => f.key === key);
    if (field) return restricted?.masked?.includes(key) ? "••••" : listCellText(field, row);
    return null;
  };

  // Text value for sort/export - cellFor() above returns JSX for some
  // columns (Approval/Status/encrypted), which can't be compared/exported.
  const textValueFor = (row: any, key: string): string => {
    if (key === "_entry") return String(entryNumberOf(allFields, row) ?? "");
    if (key === "_submitted") return row.created_date_time || "";
    if (key === "_by") return row.submitted_by_type === "public" ? row.submitter_name || "Public" : row._created_by_name || "Internal";
    if (key === "_approval") return row.current_stage ? STATUS_LABELS[row.stage_status] || row.stage_status : "";
    if (key === "_status") return row._status?.name || "";
    const field = shownListFields.find((f) => f.key === key);
    if (field) return restricted?.masked?.includes(key) ? "" : String(listCellText(field, row) ?? "");
    return String(row[key] ?? "");
  };

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = textValueFor(a, sortField);
      const bv = textValueFor(b, sortField);
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
    if (sortOrder === -1) copy.reverse();
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortField, sortOrder]);

  const filteredRows = useMemo(() => {
    const activeEntry = Object.entries(colFilters).find(([, f]: [string, any]) => f?.value != null && f.value !== "");
    if (!activeEntry) return sortedRows;
    const [key, f] = activeEntry as [string, any];
    const needle = String(f.value).toLowerCase();
    return sortedRows.filter((row) => textValueFor(row, key).toLowerCase().includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedRows, colFilters]);

  const exportColumns: ExportColumn[] = orderedVisibleKeys.map((key) => ({
    key,
    label: columnDefByKey.get(key)?.label || key,
  }));
  const getExportCellValue = (col: ExportColumn, row: any) => textValueFor(row, col.key);

  const openLink = (url?: string) => {
    if (url) window.open(url, "_blank");
  };

  const openAudit = async (id: number) => {
    setAuditFor(id);
    const res = await getSubmissionAuditLog(formId, id);
    setAuditRows(res?.data?.item || []);
  };

  const bulkDelete = async () => {
    if (!selectedRows.length) return;
    if (!window.confirm(`Delete ${selectedRows.length} submission(s)? This can't be undone.`)) return;
    setBulkBusy(true);
    await Promise.all(selectedRows.map((r) => deleteSubmission(formId, r.id)));
    setBulkBusy(false);
    toast.success("Deleted");
    reload();
  };

  const bulkChangeStatus = async (statusId: number) => {
    if (!selectedRows.length) return;
    setBulkBusy(true);
    await Promise.all(selectedRows.map((r) => updateSubmissionStatus(formId, r.id, statusId)));
    setBulkBusy(false);
    toast.success("Status updated");
    reload();
  };

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap" style={{ gap: 8 }}>
        <h4 className="mb-0">{title} — Submissions</h4>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          {/* Search sits inline with the round buttons - same single toolbar
              row as allContactReportView.tsx (search first, then Refresh /
              Filter / More Option / ColumnsButton), not a separate row. */}
          <div className="d-flex gap-2 align-items-center me-2" style={{ position: "relative" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search Anything in This Report"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && reload()}
            />
            {search ? (
              <span className="clear-icon" onClick={() => setSearch("")}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            ) : null}
            <Button
              icon="pi pi-search"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={reload}
              tooltip="Search"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />
          </div>

          {/* Round gray Buttons + the pi-ellipsis-v "More Option" dropdown -
              exact same toolbar pattern as allContactReportView.tsx
              (Refresh / More Option / ColumnsButton), not a bespoke SVG
              icon set. The separate exact-match "Filter Report" panel was
              removed - the per-column filter row covers that now. */}
          <Button
            icon="pi pi-refresh"
            className="report_button me-2"
            style={{ backgroundColor: "#4C4C4C" }}
            rounded
            onClick={reload}
            tooltip="Refresh"
            tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
          />
          <div className="me-2">
            <MoreOptionsMenu
              reportType={`form_submissions_${formId}`}
              columns={exportColumns}
              fileName={`${title || "Form"}_Submissions`}
              exportRows={selectedRows.length ? selectedRows : rows}
              getCellValue={getExportCellValue}
              onPrintBlank={async () => openLink((await exportBlankFormPdf(formId))?.data?.fileUrl)}
              onPrintAll={async () => openLink((await exportSubmissionsPagesPdf(formId))?.data?.fileUrl)}
              onExportAllExcel={async () => openLink((await exportSubmissionsExcel(formId))?.data?.fileUrl)}
              onExportAllPdf={async () => openLink((await exportSubmissionsBulkPdf(formId))?.data?.fileUrl)}
            />
          </div>

          <ColumnsButton
            columns={allColumnDefs}
            hiddenKeys={hiddenKeys}
            onToggle={toggleColumn}
            onReorder={reorderColumns}
            onReset={resetColumns}
          />
        </div>
      </div>

      {approval ? (
        <div className="btn-group mb-3" role="group" aria-label="Approval filter">
          {(["all", "mine", "completed"] as const).map((k) => (
            <button key={k} type="button" className={`btn btn-sm ${stageFilter === k ? "fb-btn-primary" : "btn-outline-secondary"}`} onClick={() => setStageFilter(k)}>
              {k === "all" ? "All entries" : k === "mine" ? "Waiting for me" : "Completed"}
            </button>
          ))}
        </div>
      ) : null}

      {selectedRows.length > 0 ? (
        <div className="d-flex align-items-center mb-2 p-2 rounded-2" style={{ background: "#fff5ec", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{selectedRows.length} selected</span>
          <select
            className="form-control form-control-sm w-auto"
            disabled={bulkBusy}
            value=""
            onChange={(e) => e.target.value && bulkChangeStatus(Number(e.target.value))}
          >
            <option value="">Change status to...</option>
            {statusOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button className="btn btn-sm btn-outline-danger" disabled={bulkBusy} onClick={bulkDelete}>
            Delete Selected
          </button>
          <button className="btn btn-sm btn-link" onClick={() => setSelectedRows([])}>
            Clear
          </button>
        </div>
      ) : null}

      <div className="report_card" style={{ display: "flex", flexDirection: "column" }}>
        <DataTable
          value={filteredRows}
          dataKey="id"
          scrollable
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollHeight="flex"
          paginator
          lazy
          first={first}
          rows={pageRows}
          totalRecords={totalRecords}
          onPage={onPage}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onSort={onSort}
          sortField={sortField ?? undefined}
          sortOrder={sortOrder}
          sortMode="single"
          filterDisplay="row"
          filters={colFilters}
          onFilter={onColumnFilter}
          loading={loading}
          selection={selectedRows}
          onSelectionChange={(e: any) => setSelectedRows(e.value)}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No data found"
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem", position: "sticky", top: 0, zIndex: 1 }} bodyStyle={{ textAlign: "center" }} />
          <Column
            field="actions"
            header=""
            headerStyle={{ width: "60px", position: "sticky", top: 0, zIndex: 1 }}
            body={(row) => (
              <RowActionMenu
                onViewEdit={() => setOpenId(row.id)}
                onPdf={async () => {
                  const res = await exportSubmissionPdf(formId, row.id);
                  openLink(res?.data?.fileUrl);
                }}
                onHistory={() => openAudit(row.id)}
                onChangeStatus={() => setStatusModalRow(row)}
                onDelete={async () => {
                  if (!window.confirm("Delete this submission?")) return;
                  const res = await deleteSubmission(formId, row.id);
                  if (res?.ack === 1) {
                    toast.success("Deleted");
                    reload();
                  }
                }}
              />
            )}
          />
          {orderedVisibleKeys.map((key) => {
            const def = columnDefByKey.get(key);
            if (!def) return null;
            return (
              <Column
                key={key}
                field={key}
                header={def.label}
                sortable
                filter
                filterField={key}
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{ width: "150px", position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
                bodyStyle={{ fontSize: "14px" }}
                body={(row) => cellFor(row, key)}
              />
            );
          })}
          <Column
            field="possible_match"
            header="Possible Match"
            headerStyle={{ width: "160px", position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
            body={(row) =>
              row.possible_duplicate_contact_id ? (
                <>
                  <span className="badge bg-warning me-1">Possible match</span>
                  <button
                    className="btn btn-sm btn-outline-success me-1"
                    onClick={async () => {
                      await linkDuplicateContact(formId, row.id);
                      reload();
                    }}
                  >
                    Link
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={async () => {
                      await dismissDuplicateContact(formId, row.id);
                      reload();
                    }}
                  >
                    Dismiss
                  </button>
                </>
              ) : null
            }
          />
        </DataTable>
      </div>

      <RadioButtonModal
        show={statusModalRow != null}
        onHide={() => setStatusModalRow(null)}
        title="Change Status"
        message=""
        btn1="Cancel"
        btn2="Save"
        options={statusOptions}
        selectedLabelIds={statusModalRow?.submission_status_id}
        contactId={statusModalRow?.id}
        getOptionColor={(s) => s.color}
        getOptionName={(s) => s.name}
        showColorBadge
        displayClearButton={false}
        handleSubmit={(statusId) => {
          if (statusModalRow && statusId) changeStatus(statusModalRow.id, statusId);
          setStatusModalRow(null);
        }}
      />

      {openId != null ? (
        <SubmissionDetailView
          formId={formId}
          submissionId={openId}
          onClose={() => setOpenId(null)}
          onSaved={() => {
            reload();
          }}
          startInEdit
        />
      ) : null}

      {auditFor != null ? (
        <div className="card p-3 mt-3">
          <div className="d-flex justify-content-between">
            <h6>Submission #{auditFor} history</h6>
            <button className="btn btn-sm btn-link" onClick={() => setAuditFor(null)}>
              Close
            </button>
          </div>
          {auditRows.length === 0 ? (
            <div className="text-muted">No history yet</div>
          ) : (
            <ul className="list-unstyled">
              {auditRows.map((r) => (
                <li key={r.id} className="mb-2">
                  <strong>{r.action}</strong> — {new Date(r.created_date_time).toLocaleString()}
                  {r.details ? <div className="small text-muted">{JSON.stringify(r.details)}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FormSubmissionsListView;
