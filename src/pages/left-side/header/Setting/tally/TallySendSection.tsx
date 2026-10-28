import { useEffect, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { toast } from "react-toastify";
import CheckBoxFilterModal from "../../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../../components/report/AppliedFilterBar";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { PAGE_ID } from "../../../../../helpers/AppEnum";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { useCommonFilterStore } from "../../../../../store/report/useCommonFilterStore";

// Manual "Send to Tally" for sales invoices and receipts (plans/2026-10-08-marketplace-tally-plan.txt,
// "like Miracle": a manual path and an automatic one). Lists the documents in a period with where each
// stands, lets the user pick some (or everything not yet sent) and queues them for the connector.
// The connector does the actual writing to Tally; this screen only queues and then watches the status.

type Kind = "invoice" | "receipt";
type DocStatus = "unsent" | "queued" | "sent" | "changed" | "failed";

interface IDocRow {
  id: number;
  number: string | null;
  date: string | null;
  party: string;
  amount: number | null;
  status: DocStatus;
  error: string | null;
  sent_at: string | null;
}

interface IBlocked {
  id: number;
  label: string;
  problems: string[];
}

const KINDS: { key: Kind; label: string; noun: string }[] = [
  { key: "invoice", label: "Sales invoices", noun: "invoice" },
  { key: "receipt", label: "Receipts", noun: "receipt" },
];

const STATUS_LABEL: Record<DocStatus, string> = {
  unsent: "Not sent",
  queued: "Queued",
  sent: "Sent",
  changed: "Changed since sent",
  failed: "Failed",
};

const STATUS_BADGE: Record<DocStatus, string> = {
  unsent: "bg-secondary",
  queued: "bg-info text-dark",
  sent: "bg-success",
  changed: "bg-warning text-dark",
  failed: "bg-danger",
};

const FILTER_KEY = "tally_send_documents";
const FETCH_LIMIT = 200;
const POLL_EVERY_MS = 4000;
const POLL_GIVE_UP_MS = 2 * 60 * 1000;

const ymd = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const monthRange = (): Date[] => {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "");
const formatAmount = (value: number | null) =>
  value === null || value === undefined ? "" : Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TallySendSection = () => {
  const [kind, setKind] = useState<Kind>("invoice");
  const [rows, setRows] = useState<IDocRow[]>([]);
  const [selected, setSelected] = useState<IDocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | DocStatus>("all");
  const [blocked, setBlocked] = useState<IBlocked[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const { getFilter, setFilters } = useCommonFilterStore();
  const filters = getFilter(FILTER_KEY);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Current month by default, set once (same convention as the reports).
  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate) {
      const [start, end] = monthRange();
      setFilters(FILTER_KEY, { ...filters, startSearchDate: start, endSearchDate: end, selectedDateArray: [start, end] });
    }
  }, []);

  const errorOf = (error: any) => error?.response?.data?.ack_msg || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED;

  const fetchDocs = async (quiet = false) => {
    const from = ymd(filters.startSearchDate);
    const to = ymd(filters.endSearchDate);
    if (!from || !to) return;
    if (!quiet) setLoading(true);
    try {
      const { data } = await axiosInstance.post("tally/sync/documents", { entity: kind, from, to, limit: FETCH_LIMIT });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      setRows(data.data?.items || []);
      return data.data?.items as IDocRow[];
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    setSelected([]);
    setBlocked([]);
    fetchDocs();
  }, [kind, filters.startSearchDate, filters.endSearchDate]);

  // After sending, keep refreshing while anything is still queued so the status turns Sent / Failed
  // on its own as the connector reports back.
  const watchQueued = async () => {
    const startedAt = Date.now();
    while (mounted.current && Date.now() - startedAt < POLL_GIVE_UP_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS));
      if (!mounted.current) return;
      const latest = await fetchDocs(true);
      if (latest && !latest.some((r) => r.status === "queued")) return;
    }
  };

  const send = async (docs: IDocRow[]) => {
    if (!docs.length) return;
    setSending(true);
    setBlocked([]);
    try {
      const { data } = await axiosInstance.post("tally/sync/send", { entity: kind, ids: docs.map((d) => d.id) });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      const results: { id: number; status: string; problems?: string[] }[] = data.data?.items || [];
      const queued = results.filter((r) => r.status === "queued" || r.status === "already_queued").length;
      const problems = results.filter((r) => r.status === "blocked");
      const labelOf = (id: number) => docs.find((d) => d.id === id)?.number || `#${id}`;
      setBlocked(problems.map((p) => ({ id: p.id, label: labelOf(p.id), problems: p.problems || [] })));
      if (queued) toast.success(`${queued} ${KINDS.find((k) => k.key === kind)!.noun}${queued === 1 ? "" : "s"} queued for Tally`);
      if (problems.length) toast.error(`${problems.length} could not be sent - see the list below the table`);
      setSelected([]);
      await fetchDocs(true);
      if (queued) watchQueued();
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setSending(false);
    }
  };

  const handleApplyFilters = (data: any) => {
    const [start, end] = monthRange();
    const startSearchDate = data?.startSearchDate || start;
    const endSearchDate = data?.endSearchDate || end;
    setFilters(FILTER_KEY, { ...data, startSearchDate, endSearchDate, selectedDateArray: [startSearchDate, endSearchDate] });
    setShowFilter(false);
  };

  const visible = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
  const notSent = visible.filter((r) => r.status === "unsent" || r.status === "failed" || r.status === "changed");
  const noun = KINDS.find((k) => k.key === kind)!.noun;
  const stickyHeader = { position: "sticky" as const, top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" };

  return (
    <div className="mt-4">
      <h5 className="tly-heading">Send to Tally</h5>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2" style={{ width: "100%" }}>
          {KINDS.map((k) => {
            const active = kind === k.key;
            return (
              <button
                key={k.key}
                type="button"
                className="flex-sm-fill text-sm-center nav-link"
                style={{
                  backgroundColor: active ? "#f58634" : "transparent",
                  color: active ? "#ffffff" : "#000000",
                  border: active ? "none" : "1px solid #ccc",
                  boxShadow: "none",
                }}
                onClick={() => setKind(k.key)}
              >
                <span className="m-1">{k.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
        <button className="btn btn-outline-secondary" onClick={() => setShowFilter(true)}>
          Filter period
        </button>
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | DocStatus)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as DocStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button className="btn btn-outline-secondary" onClick={() => fetchDocs()} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <span className="flex-grow-1" />
        <button className="btn report_button" onClick={() => send(selected)} disabled={sending || selected.length === 0}>
          {sending ? "Sending..." : `Send selected (${selected.length})`}
        </button>
        <button className="btn btn-outline-secondary" onClick={() => send(notSent)} disabled={sending || notSent.length === 0}>
          {`Send all not sent (${notSent.length})`}
        </button>
      </div>

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      <div className="report_card" style={{ display: "flex", flexDirection: "column" }}>
        <DataTable
          value={visible}
          dataKey="id"
          selectionMode="checkbox"
          selection={selected}
          onSelectionChange={(e) => setSelected(e.value as IDocRow[])}
          isDataSelectable={(e) => (e.data as IDocRow).status !== "queued"}
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          loading={loading}
          scrollable
          scrollHeight="50vh"
          paginator
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Total Records: {totalRecords}"
          rows={25}
          rowsPerPageOptions={[25, 50, 100, 200]}
          emptyMessage="No records found"
        >
          <Column selectionMode="multiple" headerStyle={{ ...stickyHeader, width: "50px" }} style={{ width: "50px" }} />
          <Column
            header="S.No"
            body={(_row: IDocRow, options: { rowIndex: number }) => options.rowIndex + 1}
            style={{ fontSize: "14px", width: "70px" }}
            headerStyle={{ ...stickyHeader, width: "70px" }}
          />
          <Column field="number" header="Number" sortable style={{ fontSize: "14px" }} headerStyle={stickyHeader} />
          <Column
            header="Date"
            sortable
            sortField="date"
            body={(row: IDocRow) => formatDate(row.date)}
            style={{ fontSize: "14px", width: "110px" }}
            headerStyle={{ ...stickyHeader, width: "110px" }}
          />
          <Column field="party" header="Customer" sortable style={{ fontSize: "14px" }} headerStyle={stickyHeader} />
          <Column
            header="Amount"
            sortable
            sortField="amount"
            body={(row: IDocRow) => formatAmount(row.amount)}
            style={{ fontSize: "14px", width: "130px", textAlign: "right" }}
            headerStyle={{ ...stickyHeader, width: "130px" }}
          />
          <Column
            header="Status"
            sortable
            sortField="status"
            body={(row: IDocRow) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{STATUS_LABEL[row.status]}</span>}
            style={{ fontSize: "14px", width: "170px" }}
            headerStyle={{ ...stickyHeader, width: "170px" }}
          />
          <Column
            header="Detail"
            body={(row: IDocRow) => (row.error ? <span className="text-danger">{row.error}</span> : row.sent_at ? `Sent ${formatDate(row.sent_at)}` : "")}
            style={{ fontSize: "14px" }}
            headerStyle={stickyHeader}
          />
        </DataTable>
      </div>
      {rows.length >= FETCH_LIMIT && (
        <p className="small text-muted mt-2 mb-0">Showing the latest {FETCH_LIMIT} for this period. Narrow the period to see the rest.</p>
      )}

      {blocked.length > 0 && (
        <div className="card shadow-sm border-0 bg-light p-3 mt-3">
          <h5 className="tly-heading">Could not be sent</h5>
          <ul className="small mb-0 ps-3">
            {blocked.map((b) => (
              <li key={b.id}>
                <b>{b.label}</b> - {b.problems.join(" ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showFilter && (
        <CheckBoxFilterModal
          show={showFilter}
          onHide={() => setShowFilter(false)}
          handleSubmit={handleApplyFilters}
          title="Filter documents to send"
          message="Choose the period to list"
          btn1="Cancel"
          btn2="Apply Filter"
          filtersToShow={[1]}
          pageId={PAGE_ID.CUSTOMER_SALES_PURCHASE_REPORT}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
        />
      )}
    </div>
  );
};

export default TallySendSection;
