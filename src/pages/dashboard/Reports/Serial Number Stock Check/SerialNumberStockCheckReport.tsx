import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { formatDate, useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import OrderCreateModal from "../../../../components/model/OrderCreateModel/OrderCreateModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { printReportTable } from "../../../../components/report/printReportTable";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { exportReportExcel, exportReportPdf } from "../../../../services/reportExportService";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchApiStockMovementSerialNumberwise,
  IProductStockMovement,
  ISerialNumberTaskHistory,
  ISerialNumberVisitHistory,
  productProductTypesList,
} from "../../../left-side/header/Setting/product/ProductController";
import { ITitle } from "../../DashoardController";
import {
  fetchCompanyTitlesApi,
  isStockInCartType,
  viewFormatForCartType,
} from "./SerialNumberStockCheckController";

interface ISerialNumberStockCheckReportProps {
  onHide?: () => void;
  MobileFlag?: string;
}

type TTab = "movement" | "task" | "visit";

interface IReportColumn {
  key: string;
  label: string;
  width?: string;
  numeric?: boolean;
}

const FILTER_KEY = "serial_number_stock_check";
const REPORT_TITLE = "Serial Number Wise Stock Check";

const typeLabel = (cartType: number) =>
  productProductTypesList.find((t) => Number(t.id) === Number(cartType))?.order_type || "";

const getCurrentMonthDateRange = () => {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
};

const fmtQty = (n: number) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 4 });

const SerialNumberStockCheckReport: React.FC<ISerialNumberStockCheckReportProps> = ({ onHide, MobileFlag }) => {
  const [serialInput, setSerialInput] = useState("");
  const [searchedSerial, setSearchedSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [movements, setMovements] = useState<IProductStockMovement[]>([]);
  const [openQty, setOpenQty] = useState(0);
  const [closingQty, setClosingQty] = useState(0);
  const [isInnerActive, setIsInnerActive] = useState(true);
  const [isOuterActive, setIsOuterActive] = useState(true);
  const [taskHistory, setTaskHistory] = useState<ISerialNumberTaskHistory[]>([]);
  const [visitHistory, setVisitHistory] = useState<ISerialNumberVisitHistory[]>([]);

  const [tab, setTab] = useState<TTab>("movement");
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const { getFilter, setFilters } = useCommonFilterStore();
  const filters = getFilter(FILTER_KEY);
  const [hasData, setHasData] = useState(false);
  const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState<ITitle[]>([]);
  const [isOrderModalShow, setIsOrderModalShow] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [orderType, setOrderType] = useState<any>(null);
  const [viewFormate, setViewFormate] = useState(0);

  const canViewReport = useCheckUserPermission(PAGE_ID.SERIAL_NUMBER_STOCK_CHECK, PERMISSION_TYPE.VIEW);
  const canShare = useCheckUserPermission(PAGE_ID.SERIAL_NUMBER_STOCK_CHECK, PERMISSION_TYPE.SHARE);
  const canPrint = useCheckUserPermission(PAGE_ID.SERIAL_NUMBER_STOCK_CHECK, PERMISSION_TYPE.PRINT);

  useEffect(() => {
    fetchCompanyTitlesApi().then(setTitle);
  }, []);

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
    return [filters.startSearchDate, filters.endSearchDate]
      .map((date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (typeof date === "object" && "toDate" in date) return date.toDate();
        return new Date(date as string | number);
      })
      .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
  }, [filters.startSearchDate, filters.endSearchDate]);

  const warehouseIds: string = filters.selectedWarehouseIds || "";

  const loadData = async (serial: string) => {
    if (!canViewReport) return;
    if (!serial) {
      toast.warning("Please enter Serial Number");
      return;
    }
    setLoading(true);
    setSearched(true);
    setSelectedRows([]);
    try {
      await fetchApiStockMovementSerialNumberwise(
        setMovements,
        serial,
        reportSelectedDates,
        setClosingQty,
        setOpenQty,
        warehouseIds,
        setIsInnerActive,
        setIsOuterActive,
        setTaskHistory,
        setVisitHistory,
      );
      setSearchedSerial(serial);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => loadData(serialInput.trim());
  const handleRefresh = () => loadData(searchedSerial || serialInput.trim());

  // Filters changed (dates / warehouses): reload for the serial already looked up.
  useEffect(() => {
    if (searchedSerial) loadData(searchedSerial);
  }, [reportSelectedDates, warehouseIds]);

  useEffect(() => {
    setSelectedRows([]);
  }, [tab]);

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

  const handleOpenOrderModal = (item: IProductStockMovement) => {
    setOrderInfo(item);
    setOrderType(item.cart_type);
    setViewFormate(viewFormatForCartType(title?.[0], item.cart_type));
    setIsOrderModalShow(true);
  };

  // ---- rows per tab -------------------------------------------------------
  const movementRows = useMemo(
    () =>
      movements.map((item, i) => ({
        row_key: `m_${i}`,
        s_no: i + 1,
        date: item.cart_date ? formatDate(item.cart_date) : "",
        contact_name: item.to_customer_name || "",
        type: typeLabel(item.cart_type),
        reference: [item.cart_number, ...(item.linked_documents || []).map((d) => d.cart_number)].join(", "),
        outer_qty: item.item_outer_quantity ? `${item.item_outer_quantity} / ${item.outer_qty_unit}` : "",
        inner_qty: item.item_inner_quantity ? `${item.item_inner_quantity} / ${item.inner_qty_unit}` : "",
        qty: Number(item.item_qty || 0),
        status: isStockInCartType(item.cart_type) ? "In" : "Out",
        value: Number(item.item_total || 0),
        _item: item,
      })),
    [movements],
  );

  const taskRows = useMemo(
    () =>
      taskHistory.map((item, i) => ({
        row_key: `t_${item.id}`,
        s_no: i + 1,
        task_title: item.task_title || "",
        type: item.is_support_ticket ? "Support Ticket" : "Task",
        contact_name: item.contact_name || "",
        from_date: item.task_fromdate ? formatDate(item.task_fromdate) : "",
        completed_date: item.completed_date ? formatDate(item.completed_date) : "",
      })),
    [taskHistory],
  );

  const visitRows = useMemo(
    () =>
      visitHistory.map((item, i) => ({
        row_key: `v_${item.id}`,
        s_no: i + 1,
        remark: item.remark || "",
        contact_name: item.contact_name || "",
        start_date: item.start_date ? formatDate(item.start_date) : "",
        end_date: item.end_date ? formatDate(item.end_date) : "",
      })),
    [visitHistory],
  );

  const columns: IReportColumn[] = useMemo(() => {
    if (tab === "task") {
      return [
        { key: "s_no", label: "S.No", width: "4rem" },
        { key: "task_title", label: "Title", width: "240px" },
        { key: "type", label: "Type" },
        { key: "contact_name", label: "Contact Name" },
        { key: "from_date", label: "From Date" },
        { key: "completed_date", label: "Completed Date" },
      ];
    }
    if (tab === "visit") {
      return [
        { key: "s_no", label: "S.No", width: "4rem" },
        { key: "remark", label: "Remark", width: "240px" },
        { key: "contact_name", label: "Contact Name" },
        { key: "start_date", label: "Start Date" },
        { key: "end_date", label: "End Date" },
      ];
    }
    const cols: IReportColumn[] = [
      { key: "s_no", label: "S.No", width: "4rem" },
      { key: "date", label: "Date" },
      { key: "contact_name", label: "Contact Name" },
      { key: "type", label: "Type" },
      { key: "reference", label: "Reference", width: "200px" },
    ];
    if (isOuterActive) cols.push({ key: "outer_qty", label: "Outer Qty", numeric: true });
    if (isInnerActive) cols.push({ key: "inner_qty", label: "Inner Qty", numeric: true });
    cols.push(
      { key: "qty", label: "Qty", numeric: true },
      { key: "status", label: "Status" },
      { key: "value", label: "Value", numeric: true },
    );
    return cols;
  }, [tab, isOuterActive, isInnerActive]);

  const activeRows: any[] = tab === "movement" ? movementRows : tab === "task" ? taskRows : visitRows;
  const exportColumns = columns.filter((c) => c.key !== "s_no");
  const dataToExport = () => (selectedRows.length > 0 ? selectedRows : activeRows);
  const tabLabel = tab === "movement" ? "Stock Movement" : tab === "task" ? "Task / Support Ticket History" : "Visit History";

  const exportParams = () => ({
    reportType: "serial_number_stock_check",
    filters: { serialNumber: searchedSerial },
    columns: exportColumns.map((c) => ({
      key: c.key,
      label: c.label,
      ...(c.key === "qty" || c.key === "value" ? { format: "number" as const } : {}),
    })),
    fileName: `Serial_Number_Stock_Check_${searchedSerial}_${tab}`,
    rows: dataToExport(),
  });

  const exportExcel = async () => {
    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    if (activeRows.length === 0) {
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
    if (activeRows.length === 0) {
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
    printReportTable(`${REPORT_TITLE} - ${searchedSerial} - ${tabLabel}`, exportColumns, dataToExport());
  };

  // ---- cells ---------------------------------------------------------------
  const cellBody = (key: string) => (row: any) => {
    if (key === "reference") {
      return (
        <div>
          <span
            style={{ color: "#0d6efd", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => handleOpenOrderModal(row._item)}
          >
            {row._item.cart_number}
          </span>
          {row._item.linked_documents?.map((doc: any) => (
            <div key={`${doc.cart_type}-${doc.cart_number}`}>
              <small className="text-muted">
                {typeLabel(doc.cart_type) || "Converted"}: {doc.cart_number}
              </small>
            </div>
          ))}
        </div>
      );
    }
    if (key === "status") {
      return <span className={`badge ${row.status === "In" ? "bg-success" : "bg-danger"}`}>{row.status}</span>;
    }
    if (key === "value") return Number(row.value).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    if (key === "qty") return fmtQty(row.qty);
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

  const totalIn = movementRows.filter((r) => r.status === "In").reduce((s, r) => s + r.qty, 0);
  const totalOut = movementRows.filter((r) => r.status === "Out").reduce((s, r) => s + r.qty, 0);

  const tabButtonStyle = (key: TTab): React.CSSProperties => ({
    backgroundColor: tab === key ? "#f58634" : "transparent",
    color: tab === key ? "#ffffff" : "#000000",
    border: tab === key ? "none" : "1px solid #ccc",
    boxShadow: "none",
  });

  const kpi = (label: string, value: React.ReactNode, cls = "text-dark") => (
    <div className="col-md-3 col-6 mb-2">
      <div className="card shadow-sm border-0 bg-light p-3 text-center h-100">
        <span className="text-muted small">{label}</span>
        <h5 className={`fw-bold mb-0 ${cls}`}>{value}</h5>
      </div>
    </div>
  );

  const emptyText = searched ? "No records found" : "Enter Serial Number and click Search";

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
                  setSearchedSerial("");
                  setSearched(false);
                  setMovements([]);
                  setTaskHistory([]);
                  setVisitHistory([]);
                  setOpenQty(0);
                  setClosingQty(0);
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
      {searched && (
        <div className="row mb-3">
          {kpi("Opening Quantity", fmtQty(openQty))}
          {kpi("Total In (+)", fmtQty(totalIn), "text-success")}
          {kpi("Total Out (-)", fmtQty(totalOut), "text-danger")}
          {kpi("Closing Quantity", fmtQty(closingQty), closingQty < 0 ? "text-danger" : "text-primary")}
        </div>
      )}

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      {/* Tabs */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2" style={{ width: "100%" }}>
          <button type="button" className="flex-sm-fill text-sm-center nav-link" onClick={() => setTab("movement")} style={tabButtonStyle("movement")}>
            <span className="m-1">Stock Movement ({movementRows.length})</span>
          </button>
          <button type="button" className="flex-sm-fill text-sm-center nav-link" onClick={() => setTab("task")} style={tabButtonStyle("task")}>
            <span className="m-1">Task / Support Ticket History ({taskRows.length})</span>
          </button>
          <button type="button" className="flex-sm-fill text-sm-center nav-link" onClick={() => setTab("visit")} style={tabButtonStyle("visit")}>
            <span className="m-1">Visit History ({visitRows.length})</span>
          </button>
        </nav>
      </div>

      {/* Phone layout for movements: one card per movement (kept from the previous design) */}
      {MobileFlag && tab === "movement" ? (
        <div style={{ padding: "0 12px 12px" }}>
          {movementRows.length > 0 ? (
            movementRows.map((row) => (
              <div key={row.row_key} className="mb-2 p-2" style={{ border: "1px solid #dee2e6", borderRadius: "8px", backgroundColor: "#fff" }}>
                <div className="d-flex justify-content-between align-items-start">
                  <b>{row.type}</b>
                  <small className="text-muted">{row.date}</small>
                </div>
                <div>{cellBody("reference")(row)}</div>
                {row.contact_name && <div className="text-muted">{row.contact_name}</div>}
                <div className="d-flex justify-content-between mt-2 pt-2" style={{ borderTop: "1px solid #eee" }}>
                  <span>
                    Qty <b>{fmtQty(row.qty)}</b>
                  </span>
                  <span className={`badge ${row.status === "In" ? "bg-success" : "bg-danger"}`}>{row.status}</span>
                  <span>
                    Value <b>{row.value.toFixed(2)}</b>
                  </span>
                </div>
                {((isOuterActive && row.outer_qty) || (isInnerActive && row.inner_qty)) && (
                  <small className="text-muted">
                    {isOuterActive && row.outer_qty ? `Outer ${row.outer_qty}  ` : ""}
                    {isInnerActive && row.inner_qty ? `Inner ${row.inner_qty}` : ""}
                  </small>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4">{emptyText}</div>
          )}
        </div>
      ) : (
        /* Main Table */
        <div className="report_card" style={{ height: "75vh", display: "flex", flexDirection: "column" }}>
          <DataTable
            key={tab}
            value={activeRows}
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
            emptyMessage={emptyText}
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
                body={tab === "movement" ? cellBody(col.key) : undefined}
              />
            ))}
          </DataTable>
        </div>
      )}

      {/* Filter Modal */}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Serial Number Wise Stock Check"
          message="Filter report by date range or warehouse"
          btn1="Cancel"
          btn2="Apply Filter"
          filtersToShow={[1, 16]}
          pageId={PAGE_ID.SERIAL_NUMBER_STOCK_CHECK}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          selectedWarehouseIds={filters.selectedWarehouseIds}
        />
      )}

      {/* Order Modal */}
      {isOrderModalShow && (
        <OrderCreateModal
          show={isOrderModalShow}
          onHide={() => setIsOrderModalShow(false)}
          handleSubmit={() => setIsOrderModalShow(false)}
          title="Edit/View"
          message="Please Enter Your Order Details"
          btn1="CANCEL"
          btn2="Approve"
          Contact={orderInfo}
          isOrderShowNum={orderType}
          isOrderViewFormate={viewFormate}
          orderId={orderInfo?.cart_id}
          orderById={orderInfo?.cart_id}
        />
      )}
    </div>
  );
};

export default SerialNumberStockCheckReport;
