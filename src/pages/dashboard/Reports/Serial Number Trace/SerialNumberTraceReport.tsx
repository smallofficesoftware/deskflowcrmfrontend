import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { formatDate, useEscapeKey } from "../../../../common/SharedFunction";
import { printReportTable } from "../../../../components/report/printReportTable";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { exportReportExcel, exportReportPdf } from "../../../../services/reportExportService";
import { productProductTypesList } from "../../../left-side/header/Setting/product/ProductController";
import {
  fetchSerialNumberTraceApi,
  ILinkedDocument,
  ITrace,
  ITraceEvent,
} from "./SerialNumberTraceController";

interface ISerialNumberTraceReportProps {
  onHide?: () => void;
  MobileFlag?: string;
}

interface ITraceRow {
  row_key: string;
  s_no: number;
  date: string;
  event: string;
  reference: string;
  contact_name: string;
  details: string;
  qty: number | "";
  stock: string;
  value: number | "";
}

const REPORT_TITLE = "Serial Number Full Trace";

const typeName = (cartType?: number) =>
  productProductTypesList.find((t) => Number(t.id) === Number(cartType))?.order_type || "Document";

const eventLabel = (event: ITraceEvent) => {
  if (event.source === "document") return typeName(event.cart_type);
  if (event.source === "support_ticket") return "Support Ticket";
  if (event.source === "task") return "Task";
  return "Visit";
};

const linkText = (docs?: ILinkedDocument[]) =>
  (docs || []).map((d) => `${typeName(d.cart_type)}: ${d.cart_number}`).join(", ");

const stockText = (effect?: string) => (effect === "in" ? "In" : effect === "out" ? "Out" : "");

const detailsText = (event: ITraceEvent) => {
  if (event.source === "document") {
    return [
      event.linked_from?.length ? `From ${linkText(event.linked_from)}` : "",
      event.linked_to?.length ? `To ${linkText(event.linked_to)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }
  return [event.title || "", event.completed_date ? `Completed ${formatDate(event.completed_date)}` : ""]
    .filter(Boolean)
    .join(" | ");
};

const currentStatus = (trace: ITrace) => {
  if (trace.last_stock_effect === "in") return { text: "In stock", cls: "text-success" };
  if (trace.last_stock_effect === "out") return { text: "Out of stock", cls: "text-danger" };
  return { text: "No stock movement", cls: "text-muted" };
};

const COLUMNS: { key: keyof ITraceRow; label: string; width?: string; numeric?: boolean }[] = [
  { key: "s_no", label: "S.No", width: "4rem" },
  { key: "date", label: "Date" },
  { key: "event", label: "Event" },
  { key: "reference", label: "Reference" },
  { key: "contact_name", label: "Contact Name" },
  { key: "details", label: "Details", width: "240px" },
  { key: "qty", label: "Qty", numeric: true },
  { key: "stock", label: "Stock" },
  { key: "value", label: "Value", numeric: true },
];

const SerialNumberTraceReport: React.FC<ISerialNumberTraceReportProps> = ({ onHide, MobileFlag }) => {
  const [serialInput, setSerialInput] = useState("");
  const [searchedSerial, setSearchedSerial] = useState("");
  const [trace, setTrace] = useState<ITrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ITraceRow[]>([]);

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canViewReport = useCheckUserPermission(PAGE_ID.SERIAL_NUMBER_TRACE, PERMISSION_TYPE.VIEW);
  const canShare = useCheckUserPermission(PAGE_ID.SERIAL_NUMBER_TRACE, PERMISSION_TYPE.SHARE);
  const canPrint = useCheckUserPermission(PAGE_ID.SERIAL_NUMBER_TRACE, PERMISSION_TYPE.PRINT);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEscapeKey(() => {
    if (isExportDropdownOpen) {
      setIsExportDropdownOpen(false);
    } else {
      onHide?.();
    }
  });

  const runSearch = async (serial: string) => {
    if (!canViewReport) return;
    if (!serial) {
      toast.warning("Please enter Serial Number");
      return;
    }
    setLoading(true);
    setSearched(true);
    setSelectedRows([]);
    const result = await fetchSerialNumberTraceApi(serial);
    setTrace(result);
    setSearchedSerial(result ? serial : "");
    setLoading(false);
  };

  const handleSearch = () => runSearch(serialInput.trim());
  const handleRefresh = () => runSearch(searchedSerial || serialInput.trim());

  const rows = useMemo<ITraceRow[]>(
    () =>
      (trace?.events || []).map((e, i) => ({
        row_key: `${e.source}-${e.id}`,
        s_no: i + 1,
        date: e.date ? formatDate(e.date) : "",
        event: eventLabel(e),
        reference: e.reference || "",
        contact_name: e.contact_name || "",
        details: detailsText(e),
        qty: e.source === "document" ? Number(e.qty ?? 0) : "",
        stock: stockText(e.stock_effect),
        value: e.source === "document" ? Number(e.amount || 0) : "",
      })),
    [trace],
  );

  const exportColumns = COLUMNS.filter((c) => c.key !== "s_no");
  const dataToExport = () => (selectedRows.length > 0 ? selectedRows : rows);

  const exportParams = () => ({
    reportType: "serial_number_trace",
    filters: { serialNumber: searchedSerial },
    columns: exportColumns.map((c) => ({
      key: c.key,
      label: c.label,
      ...(c.numeric ? { format: "number" as const } : {}),
    })),
    fileName: `Serial_Number_Trace_${searchedSerial}`,
    rows: dataToExport(),
  });

  const exportExcel = async () => {
    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    if (rows.length === 0) {
      toast.warning("No data to export");
      return;
    }
    try {
      await exportReportExcel(exportParams());
      toast.success("Excel exported successfully!");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const exportPdf = async () => {
    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    if (rows.length === 0) {
      toast.warning("No data to export");
      return;
    }
    try {
      await exportReportPdf(exportParams());
      toast.success("PDF exported successfully!");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const printTable = () => {
    if (!canPrint) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    printReportTable(`${REPORT_TITLE} - ${searchedSerial}`, exportColumns, dataToExport() as any);
  };

  const cellBody = (key: keyof ITraceRow) => (row: ITraceRow) => {
    if (key === "stock") {
      if (!row.stock) return "-";
      return <span className={`badge ${row.stock === "In" ? "bg-success" : "bg-danger"}`}>{row.stock}</span>;
    }
    if (key === "value") return row.value === "" ? "-" : Number(row.value).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    if (key === "qty") return row.qty === "" ? "-" : row.qty;
    const v = row[key];
    return v === "" || v == null ? "-" : v;
  };

  if (!canViewReport) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {DEFAULT_MESSAGE_ERROR_PERMISSION}
      </div>
    );
  }

  const status = trace ? currentStatus(trace) : null;

  const kpi = (label: string, value: React.ReactNode, cls = "text-dark") => (
    <div className="col-md-2 col-6 mb-2">
      <div className="card shadow-sm border-0 bg-light p-3 text-center h-100">
        <span className="text-muted small">{label}</span>
        <h5 className={`fw-bold mb-0 ${cls}`} style={{ wordBreak: "break-word" }}>
          {value}
        </h5>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header Bar */}
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3 style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }} className="dash-board-text-count">
          {REPORT_TITLE}
        </h3>

        <div className="d-flex gap-2 flex-wrap align-items-center" style={{ position: "relative", paddingLeft: MobileFlag ? "10px" : "" }}>
          {/* Serial number lookup (this report's search box) */}
          <div
            className="d-flex gap-2 align-items-center"
            style={{ width: MobileFlag ? "285px" : "355px", zIndex: "999", position: "relative" }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Enter Serial Number"
              style={{ width: MobileFlag ? "220px" : "300px", marginTop: "10px" }}
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            {serialInput && (
              <span
                className="clear-icon"
                onClick={() => {
                  setSerialInput("");
                  setTrace(null);
                  setSearched(false);
                  setSearchedSerial("");
                  setSelectedRows([]);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            )}
            <Button
              icon="pi pi-search"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleSearch}
              disabled={loading || !serialInput.trim()}
              tooltip="Search"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />
          </div>

          <div className="d-flex gap-2 align-items-center">
            <Button
              icon="pi pi-refresh"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleRefresh}
              disabled={loading || (!searchedSerial && !serialInput.trim())}
              tooltip="Refresh"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />

            {!MobileFlag && (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <Button
                  icon="pi pi-ellipsis-v"
                  className="report_button"
                  style={{ backgroundColor: "#4C4C4C" }}
                  rounded
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExportDropdownOpen((prev) => !prev);
                  }}
                  tooltip="More Option"
                  tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
                />
                <ul
                  className={`labelDropLeft ${isExportDropdownOpen ? "isVisible" : "isHidden"}`}
                  style={{
                    width: "170px",
                    position: "absolute",
                    right: "0",
                    top: "100%",
                    zIndex: 999,
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                  }}
                >
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      exportExcel();
                    }}
                  >
                    <i className="pi pi-file-excel" style={{ marginRight: "4px" }} />
                    Export Excel
                  </li>
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      exportPdf();
                    }}
                  >
                    <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
                    Export PDF
                  </li>
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      printTable();
                    }}
                  >
                    <i className="pi pi-print" style={{ marginRight: "4px" }} />
                    Print
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Section */}
      {trace && status && (
        <div className="row mb-3">
          {kpi("Serial Number", trace.serial_number, "text-primary")}
          {kpi("Product", trace.product_name || "-")}
          {kpi("Current Status", status.text, status.cls)}
          {kpi("Stock Balance", Number(trace.stock_balance).toLocaleString("en-IN"))}
          {kpi("Last Party", trace.last_party || "-")}
          {kpi("Events", trace.event_count)}
        </div>
      )}

      {/* Main Table */}
      <div className="report_card" style={{ height: "75vh", display: "flex", flexDirection: "column" }}>
        <DataTable
          value={rows}
          dataKey="row_key"
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          scrollable
          scrollHeight="65vh"
          paginator
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Total Records: {totalRecords}"
          rows={50}
          rowsPerPageOptions={[25, 50, 100, 200]}
          filterDisplay="row"
          loading={loading}
          selection={selectedRows}
          onSelectionChange={(e: any) => setSelectedRows(e.value)}
          selectionMode="multiple"
          emptyMessage={searched ? "No records found" : "Enter Serial Number and click Search"}
          loadingIcon={<i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />}
        >
          {!MobileFlag && (
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem", position: "sticky", top: 0, zIndex: 1 }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.label}
              sortable
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerStyle={{
                width: col.width || "150px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={cellBody(col.key)}
            />
          ))}
        </DataTable>
      </div>
    </div>
  );
};

export default SerialNumberTraceReport;
