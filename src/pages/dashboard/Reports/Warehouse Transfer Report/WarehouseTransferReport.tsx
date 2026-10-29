import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { printReportTable } from "../../../../components/report/printReportTable";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { exportReportExcel, exportReportPdf } from "../../../../services/reportExportService";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import StockAdjustmentModel from "../../../left-side/header/Setting/stock-adjustment/StockAdjustmentModel";
import {
  emptyWarehouseTransferReport,
  fetchWarehouseTransferReportApi,
  IWarehouseTransferReport,
} from "./WarehouseTransferReportController";

interface IWarehouseTransferReportProps {
  onHide?: () => void;
  MobileFlag?: string;
}

type TTab = "summary" | "product" | "source" | "transfer";

interface IReportColumn {
  key: string;
  label: string;
  numeric?: boolean;
  width?: string;
}

const FILTER_KEY = "warehouse_transfer";
const REPORT_TITLE = "Warehouse Transfer Report";

const COLUMNS: Record<TTab, IReportColumn[]> = {
  summary: [
    { key: "s_no", label: "S.No", width: "4rem" },
    { key: "warehouse_name", label: "Warehouse" },
    { key: "total_in", label: "Stock In (+)", numeric: true },
    { key: "total_out", label: "Stock Out (-)", numeric: true },
    { key: "net", label: "Net", numeric: true },
    { key: "transfer_in", label: "Of which Transfer In", numeric: true },
    { key: "transfer_out", label: "Of which Transfer Out", numeric: true },
  ],
  product: [
    { key: "s_no", label: "S.No", width: "4rem" },
    { key: "product_name", label: "Product" },
    { key: "product_code", label: "Code" },
    { key: "warehouse_name", label: "Warehouse" },
    { key: "total_in", label: "Stock In (+)", numeric: true },
    { key: "total_out", label: "Stock Out (-)", numeric: true },
    { key: "net", label: "Net", numeric: true },
    { key: "transfer_in", label: "Of which Transfer In", numeric: true },
    { key: "transfer_out", label: "Of which Transfer Out", numeric: true },
  ],
  source: [
    { key: "s_no", label: "S.No", width: "4rem" },
    { key: "warehouse_name", label: "Warehouse" },
    { key: "source", label: "Source" },
    { key: "total_in", label: "Stock In (+)", numeric: true },
    { key: "total_out", label: "Stock Out (-)", numeric: true },
    { key: "net", label: "Net", numeric: true },
  ],
  transfer: [
    { key: "s_no", label: "S.No", width: "4rem" },
    { key: "cart_date", label: "Date" },
    { key: "out_cart_number", label: "Out No." },
    { key: "in_cart_number", label: "In No." },
    { key: "product_name", label: "Product" },
    { key: "from_warehouse_name", label: "From (-)" },
    { key: "to_warehouse_name", label: "To (+)" },
    { key: "qty", label: "Qty", numeric: true },
    { key: "remark", label: "Remark" },
  ],
};

const TAB_LABEL: Record<TTab, string> = {
  summary: "Warehouse Summary",
  product: "Product-wise",
  source: "Source-wise",
  transfer: "Transfer-wise",
};

const getCurrentMonthDateRange = () => {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
};

const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtQty = (n: number) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 4 });
const fmtSigned = (n: number) => (n > 0 ? `+${fmtQty(n)}` : fmtQty(n));

const WarehouseTransferReport: React.FC<IWarehouseTransferReportProps> = ({ onHide, MobileFlag }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IWarehouseTransferReport>(emptyWarehouseTransferReport);
  const [tab, setTab] = useState<TTab>("summary");
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { getFilter, setFilters } = useCommonFilterStore();
  const filters = getFilter(FILTER_KEY);
  const [hasData, setHasData] = useState(false);
  const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canViewReport = useCheckUserPermission(PAGE_ID.STOCK_ADJUSTMENT, PERMISSION_TYPE.VIEW);
  const canAddTransfer = useCheckUserPermission(PAGE_ID.STOCK_ADJUSTMENT, PERMISSION_TYPE.ADD);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  // The add popup sets this once a transfer is saved, so the report reloads with it.
  const [refreshTransfer, setRefreshTransfer] = useState(false);
  const canShare = useCheckUserPermission(PAGE_ID.STOCK_ADJUSTMENT, PERMISSION_TYPE.SHARE);
  const canPrint = useCheckUserPermission(PAGE_ID.STOCK_ADJUSTMENT, PERMISSION_TYPE.PRINT);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(globalSearchText?.trim() ?? ""), 400);
    return () => clearTimeout(timer);
  }, [globalSearchText]);

  useEscapeKey(() => {
    if (isExportDropdownOpen) {
      setIsExportDropdownOpen(false);
    } else {
      onHide?.();
    }
  });

  // Current month by default, kept in the shared filter store like every other report.
  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate) {
      const [startDate, endDate] = getCurrentMonthDateRange();
      setFilters(FILTER_KEY, {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const reportSelectedDates = useMemo<Date[]>(() => {
    const dates = [filters.startSearchDate, filters.endSearchDate];
    return dates
      .map((date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (typeof date === "object" && "toDate" in date) return date.toDate();
        return new Date(date as string | number);
      })
      .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
  }, [filters.startSearchDate, filters.endSearchDate]);

  const warehouseIds: string = filters.selectedWarehouseIds || "";

  const loadData = () => {
    if (!canViewReport || reportSelectedDates.length !== 2) return;
    fetchWarehouseTransferReportApi(
      setReport,
      setLoading,
      toApiDate(reportSelectedDates[0]),
      toApiDate(reportSelectedDates[1]),
      warehouseIds,
    );
  };

  useEffect(() => {
    setSelectedRows([]);
    loadData();
  }, [reportSelectedDates, warehouseIds, canViewReport]);

  useEffect(() => {
    if (!refreshTransfer) return;
    loadData();
    setRefreshTransfer(false);
  }, [refreshTransfer]);

  useEffect(() => {
    setSelectedRows([]);
  }, [tab, debouncedSearchText]);

  const handleGlobalSearch = () => setGlobalSearchText(searchInputRef.current?.value || "");

  const handleApplyFilters = (data: any) => {
    const [startDate, endDate] = getCurrentMonthDateRange();
    const updatedFilters = {
      ...data,
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [data?.startSearchDate || startDate, data?.endSearchDate || endDate],
    };
    setFilters(FILTER_KEY, updatedFilters);
    setHasData(Object.keys(updatedFilters || {}).length > 0);
    setIsModalFilterVisible(false);
  };

  // Rows of the active tab, numbered, with the page search applied.
  const rows = useMemo(() => {
    const source: any[] =
      tab === "summary" ? report.summary : tab === "product" ? report.product_wise : tab === "source" ? report.source_wise : report.transfers;
    const needle = debouncedSearchText.toLowerCase();
    return source
      .filter((r) => !needle || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(needle)))
      .map((r, i) => ({ ...r, s_no: i + 1, row_key: `${tab}_${i}` }));
  }, [report, tab, debouncedSearchText]);

  const columns = COLUMNS[tab];

  const exportCellValue = (col: IReportColumn, row: any): string | number => {
    if (col.key === "net") return fmtSigned(row.net);
    return row[col.key] ?? "-";
  };

  const exportRows = () => {
    const source = selectedRows.length > 0 ? selectedRows : rows;
    return source.map((r) => {
      const out: Record<string, string | number> = {};
      columns.forEach((c) => {
        out[c.key] = exportCellValue(c, r);
      });
      return out;
    });
  };

  const exportParams = () => ({
    reportType: "warehouse_transfer_report",
    filters: { selectedDates: reportSelectedDates, selectedWarehouseIds: warehouseIds },
    columns: columns.map((c) => ({ key: c.key, label: c.label })),
    fileName: `Warehouse_Transfer_${tab}`,
    rows: exportRows(),
  });

  const exportExcel = async () => {
    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    if (rows.length === 0) return;
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
    if (rows.length === 0) return;
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
    const dataToPrint = (selectedRows.length > 0 ? selectedRows : rows).map((r) => {
      const out: Record<string, unknown> = {};
      columns.forEach((c) => {
        out[c.key] = exportCellValue(c, r);
      });
      return out;
    });
    printReportTable(`${REPORT_TITLE} - ${TAB_LABEL[tab]}`, columns, dataToPrint);
  };

  const cellBody = (col: IReportColumn) => (row: any) => {
    if (col.key === "net") {
      const color = row.net > 0 ? "text-success fw-bold" : row.net < 0 ? "text-danger fw-bold" : "text-dark";
      return <span className={color}>{fmtSigned(row.net)}</span>;
    }
    if (col.numeric) return fmtQty(row[col.key]);
    return row[col.key] === "" || row[col.key] == null ? "-" : row[col.key];
  };

  if (!canViewReport) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {DEFAULT_MESSAGE_ERROR_PERMISSION}
      </div>
    );
  }

  const totals = report.totals;

  // Same tab look as the rest of the app (e.g. BOM master): active = orange, rest = outlined.
  const tabButtonStyle = (key: TTab): React.CSSProperties => ({
    backgroundColor: tab === key ? "#f58634" : "transparent",
    color: tab === key ? "#ffffff" : "#000000",
    border: tab === key ? "none" : "1px solid #ccc",
    boxShadow: "none",
  });

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
          {/* Search Box */}
          <div
            className="d-flex gap-2 align-items-center"
            style={{ width: MobileFlag ? "285px" : "355px", zIndex: "999", position: "relative" }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="form-control"
              placeholder={MobileFlag ? "Search in This Report" : "Search Anything in This Report"}
              style={{ width: MobileFlag ? "220px" : "300px", marginTop: "10px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGlobalSearch();
              }}
            />
            {globalSearchText && (
              <span
                className="clear-icon"
                onClick={() => {
                  setGlobalSearchText("");
                  if (searchInputRef.current) searchInputRef.current.value = "";
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
              onClick={handleGlobalSearch}
              tooltip="Search"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 align-items-center">
            <Button
              icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={() => setIsModalFilterVisible(true)}
              tooltip="Filter Report"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />

            <Button
              icon="pi pi-refresh"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={loadData}
              tooltip="Refresh"
              tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
            />

            {/* Opens the Stock Adjustment add screen with "Warehouse To Warehouse Transfer" preselected. */}
            <Button
              icon="pi pi-plus"
              className="report_button"
              style={{ backgroundColor: "rgb(245, 134, 52)" }}
              rounded
              onClick={() => {
                if (canAddTransfer) {
                  setIsTransferModalOpen(true);
                } else {
                  toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }
              }}
              tooltip="Warehouse Transfer"
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
      <div className="row mb-3">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Transfers</span>
            <h5 className="fw-bold mb-0 text-primary">{totals.transfer_count}</h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Stock In (+)</span>
            <h5 className="fw-bold mb-0 text-success">{fmtQty(totals.total_in)}</h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Stock Out (-)</span>
            <h5 className="fw-bold mb-0 text-danger">{fmtQty(totals.total_out)}</h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Net</span>
            <h5 className={`fw-bold mb-0 ${totals.net < 0 ? "text-danger" : totals.net > 0 ? "text-success" : "text-dark"}`}>
              {fmtSigned(totals.net)}
            </h5>
          </div>
        </div>
      </div>

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      {/* View switch: warehouse summary / product-wise / transfer-wise */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2" style={{ width: "100%" }}>
          {(Object.keys(TAB_LABEL) as TTab[]).map((key) => (
            <button
              key={key}
              type="button"
              className="flex-sm-fill text-sm-center nav-link"
              onClick={() => setTab(key)}
              style={tabButtonStyle(key)}
            >
              <span className="m-1">{TAB_LABEL[key]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Table */}
      <div className="report_card" style={{ height: "75vh", display: "flex", flexDirection: "column" }}>
        <DataTable
          key={tab}
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
          emptyMessage="No records found"
          loadingIcon={<i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />}
        >
          {!MobileFlag && (
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem", position: "sticky", top: 0, zIndex: 1 }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}
          {columns.map((col) => (
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
              body={cellBody(col)}
            />
          ))}
        </DataTable>
      </div>

      {isTransferModalOpen && (
        <StockAdjustmentModel
          show={isTransferModalOpen}
          onHide={() => setIsTransferModalOpen(false)}
          flag={1}
          where_action={1}
          defaultStockType="1"
          setRefreshStockAdjustment={setRefreshTransfer}
        />
      )}

      {/* Filter Modal */}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Warehouse Transfer Report"
          message="Filter report by date range or warehouse"
          btn1="Cancel"
          btn2="Apply Filter"
          filtersToShow={[1, 16]}
          pageId={PAGE_ID.STOCK_ADJUSTMENT}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          selectedWarehouseIds={filters.selectedWarehouseIds}
        />
      )}
    </div>
  );
};

export default WarehouseTransferReport;
