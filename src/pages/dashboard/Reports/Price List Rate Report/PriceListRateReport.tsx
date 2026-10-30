import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { Menu } from "primereact/menu";
import CustomSearchDropdown from "../../../../components/CustomSearchDropdown";
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
import { IPriceListView } from "../../../left-side/header/Setting/priceList/PriceListController";
import PriceListItemView from "../../../left-side/header/Setting/priceList/PriceListItemView";
import {
  emptyPriceListRateReport,
  fetchPriceListRateReportApi,
  IPriceListRateReport,
} from "./PriceListRateReportController";

interface IPriceListRateReportProps {
  onHide?: () => void;
  MobileFlag?: string;
}

type TTab = "current" | "history";

interface IReportColumn {
  key: string;
  label: string;
  numeric?: boolean;
  width?: string;
}

const FILTER_KEY = "price_list_rate";
const REPORT_TITLE = "Price List Rates";

const COLUMNS: Record<TTab, IReportColumn[]> = {
  current: [
    { key: "s_no", label: "S.No", width: "4rem" },
    { key: "price_list_name", label: "Price List" },
    { key: "product_name", label: "Product" },
    { key: "product_code", label: "Code" },
    { key: "rate", label: "Rate", numeric: true },
    { key: "discount", label: "Discount (%)", numeric: true },
    { key: "net_rate", label: "Net Rate", numeric: true },
    { key: "last_updated", label: "Last Updated" },
    { key: "last_updated_by_name", label: "Updated By" },
  ],
  history: [
    { key: "s_no", label: "S.No", width: "4rem" },
    { key: "changed_date_time", label: "Changed On" },
    { key: "price_list_name", label: "Price List" },
    { key: "product_name", label: "Product" },
    { key: "product_code", label: "Code" },
    { key: "old_rate", label: "Old Rate", numeric: true },
    { key: "new_rate", label: "New Rate", numeric: true },
    { key: "rate_change", label: "Change", numeric: true },
    { key: "old_net_rate", label: "Old Net Rate", numeric: true },
    { key: "new_net_rate", label: "New Net Rate", numeric: true },
    { key: "changed_by_name", label: "Changed By" },
  ],
};

const TAB_LABEL: Record<TTab, string> = {
  current: "Current Rates",
  history: "Rate Change History",
};

const getCurrentMonthDateRange = () => {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
};

const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtAmount = (n: number | null | undefined) =>
  n === null || n === undefined ? "-" : Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const fmtChange = (n: number) => (n > 0 ? `+${fmtAmount(n)}` : fmtAmount(n));

const PriceListRateReport: React.FC<IPriceListRateReportProps> = ({ onHide, MobileFlag }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IPriceListRateReport>(emptyPriceListRateReport);
  const [tab, setTab] = useState<TTab>("current");
  // Price list / product filters; empty = all.
  const [selectedPriceListIds, setSelectedPriceListIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const hasSelection = selectedPriceListIds.length > 0 || selectedProductIds.length > 0;
  // Options for the two dropdowns above the table.
  const priceListOptions = (report.options?.price_lists ?? []).map((p) => ({ value: p.id, label: p.name }));
  const productOptions = (report.options?.products ?? []).map((p) => ({ value: p.id, label: p.code ? `${p.name} (${p.code})` : p.name }));
  // Row whose gear menu is open (one shared popup menu for the table).
  const [menuRow, setMenuRow] = useState<any>(null);
  const rowMenu = useRef<Menu>(null);

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { getFilter, setFilters } = useCommonFilterStore();
  const filters = getFilter(FILTER_KEY);
  const [hasData, setHasData] = useState(false);
  const [isModalFilterVisible, setIsModalFilterVisible] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canViewReport = useCheckUserPermission(PAGE_ID.PRICE_LIST_RATES, PERMISSION_TYPE.VIEW);
  const canShare = useCheckUserPermission(PAGE_ID.PRICE_LIST_RATES, PERMISSION_TYPE.SHARE);
  const canPrint = useCheckUserPermission(PAGE_ID.PRICE_LIST_RATES, PERMISSION_TYPE.PRINT);
  const canEditPrice = useCheckUserPermission(PAGE_ID.PRICE_LIST_ITEM, PERMISSION_TYPE.EDIT);

  // Price list whose items are open for editing (the existing price list item screen).
  const [editPriceList, setEditPriceList] = useState<IPriceListView>();

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

  const loadData = () => {
    if (!canViewReport || reportSelectedDates.length !== 2) return;
    fetchPriceListRateReportApi(
      setReport,
      setLoading,
      toApiDate(reportSelectedDates[0]),
      toApiDate(reportSelectedDates[1]),
      selectedPriceListIds,
      selectedProductIds,
    );
  };

  useEffect(() => {
    setSelectedRows([]);
    loadData();
  }, [reportSelectedDates, canViewReport, selectedPriceListIds, selectedProductIds]);

  useEffect(() => {
    setSelectedRows([]);
  }, [tab, debouncedSearchText]);

  const handleGlobalSearch = () => setGlobalSearchText(searchInputRef.current?.value || "");

  // The item screen only needs the price list id and name.
  const openEditPrice = (row: any) => {
    if (!canEditPrice) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    setEditPriceList({ id: row.pricelist_masters_id, price_list_name: row.price_list_name } as IPriceListView);
  };

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
      tab === "current"
        ? hasSelection
          ? report.current
          : [] // current rates are long: show them only once a price list or a product is picked
        : report.history.map((r) => ({
            ...r,
            // A new item has no old rate, so there is no change to show for it.
            rate_change: r.old_rate === null || r.new_rate === null ? null : r.new_rate - r.old_rate,
          }));
    const needle = debouncedSearchText.toLowerCase();
    return source
      .filter((r) => !needle || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(needle)))
      .map((r, i) => ({ ...r, s_no: i + 1, row_key: `${tab}_${i}` }));
  }, [report, tab, debouncedSearchText, hasSelection]);

  const columns = COLUMNS[tab];

  const exportCellValue = (col: IReportColumn, row: any): string | number => {
    if (col.key === "rate_change") return row.rate_change === null ? "-" : fmtChange(row.rate_change);
    if (col.numeric) return fmtAmount(row[col.key]);
    return row[col.key] === "" || row[col.key] == null ? "-" : row[col.key];
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
    reportType: "price_list_rate_report",
    filters: { selectedDates: reportSelectedDates },
    columns: columns.map((c) => ({ key: c.key, label: c.label })),
    fileName: `Price_List_Rates_${tab}`,
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
    if (col.key === "rate_change") {
      if (row.rate_change === null) return <span className="badge bg-info">New</span>;
      const color = row.rate_change > 0 ? "text-success fw-bold" : row.rate_change < 0 ? "text-danger fw-bold" : "text-dark";
      return <span className={color}>{fmtChange(row.rate_change)}</span>;
    }
    if (col.key === "net_rate") {
      // The item's last 5 net rate changes sit under the value (newest first), so no extra column is needed.
      const recent: { date: string; old_net_rate: number | null; new_net_rate: number | null }[] = row.recent_changes ?? [];
      return (
        <div>
          {/* Green, as the customer asked on the Net Rate column (ticket 3023). */}
          <div className="text-success fw-bold">{fmtAmount(row.net_rate)}</div>
          {recent.map((c, i) => (
            <div key={i} className="text-muted" style={{ fontSize: "11px", lineHeight: 1.35 }}>
              {c.date}: {fmtAmount(c.old_net_rate)} &rarr; {fmtAmount(c.new_net_rate)}
            </div>
          ))}
        </div>
      );
    }
    if (col.numeric) return fmtAmount(row[col.key]);
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
      <div className="row g-3 mb-3">
        {[
          // One scheme for all three, from the app's own palette: the dark grey of the report buttons (#4C4C4C) on a
          // light grey card (never plain white). Orange stays reserved for the add action and the active tab.
          { label: "Price Lists", hint: "in this company", value: totals.price_lists, icon: "pi pi-list", accent: "#4C4C4C", tint: "#f1f2f3" },
          { label: "Products Priced", hint: "with a rate in a list", value: totals.products, icon: "pi pi-box", accent: "#4C4C4C", tint: "#f1f2f3" },
          { label: "Rate Changes", hint: "in the selected period", value: totals.changes, icon: "pi pi-history", accent: "#4C4C4C", tint: "#f1f2f3" },
        ].map((card) => (
          <div className="col-12 col-md-4" key={card.label}>
            <div
              className="d-flex align-items-center gap-3 p-3 h-100"
              style={{
                background: card.tint,
                borderLeft: `4px solid ${card.accent}`,
                borderRadius: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              }}
            >
              <span
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#ffffff", color: card.accent, fontSize: "20px" }}
              >
                <i className={card.icon} />
              </span>
              <div className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
                <span className="fw-bold" style={{ fontSize: "26px", color: card.accent }}>
                  {card.value}
                </span>
                <span className="text-dark fw-semibold" style={{ fontSize: "14px" }}>
                  {card.label}
                </span>
                <span className="text-muted" style={{ fontSize: "12px" }}>
                  {card.hint}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      {/* Price list / product filters */}
      {/* The app's own dropdown (same look as every form), one labelled box each; empty = all. */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label mb-1 fw-semibold" style={{ fontSize: "14px" }}>
            Price List
          </label>
          <CustomSearchDropdown
            isMulti
            options={priceListOptions}
            value={priceListOptions.filter((o) => selectedPriceListIds.includes(Number(o.value)))}
            onChange={(opts: { value: number | string; label: string }[] | null) => setSelectedPriceListIds((opts ?? []).map((o) => Number(o.value)))}
            placeholder="All Price Lists"
            className="w-100"
          />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label mb-1 fw-semibold" style={{ fontSize: "14px" }}>
            Product
          </label>
          <CustomSearchDropdown
            isMulti
            options={productOptions}
            value={productOptions.filter((o) => selectedProductIds.includes(Number(o.value)))}
            onChange={(opts: { value: number | string; label: string }[] | null) => setSelectedProductIds((opts ?? []).map((o) => Number(o.value)))}
            placeholder="All Products"
            className="w-100"
          />
        </div>
      </div>

      {/* View switch: current rates / change history */}
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

      {tab === "history" && (
        <p className="text-muted small mb-2">
          History is recorded from the day this report was introduced; earlier price changes are not available.
        </p>
      )}

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
          emptyMessage={tab === "current" && !hasSelection ? "Select a price list or a product above to see its rates." : "No records found"}
          loadingIcon={<i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />}
        >
          {!MobileFlag && (
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem", position: "sticky", top: 0, zIndex: 1 }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}
          {/* Action column: first, right after the checkbox, like the Action column of All Contact Report
              (docs/REPORT_UI_GUIDELINES.md "Action columns"): no sort / search / filter, icon centred. */}
          {canEditPrice && (
            <Column
              header="Action"
              headerClassName="center-header"
              headerStyle={{
                width: "70px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
              }}
              body={(row: any) => (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Button
                    icon="pi pi-cog"
                    className="p-button-text"
                    style={{ color: "green", width: "2rem" }}
                    tooltip="Settings"
                    tooltipOptions={{ position: "left" }}
                    aria-label="Settings"
                    aria-haspopup
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuRow(row);
                      rowMenu.current?.toggle(e);
                    }}
                  />
                </div>
              )}
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
        <Menu
          ref={rowMenu}
          popup
          model={[{ label: "Edit", icon: "pi pi-pencil", command: () => menuRow && openEditPrice(menuRow) }]}
        />
      </div>

      {editPriceList && (
        <PriceListItemView
          show={!!editPriceList}
          onHide={() => {
            setEditPriceList(undefined);
            loadData(); // show the new rate and the history row the change just wrote
          }}
          title={"Price List Item"}
          btn1={"Cancel"}
          btn2={"Save"}
          passDataInAddItem={editPriceList}
        />
      )}

      {/* Filter Modal */}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Price List Rates"
          message="Filter the rate change history by date range"
          btn1="Cancel"
          btn2="Apply Filter"
          filtersToShow={[1]}
          pageId={PAGE_ID.PRICE_LIST_RATES}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
        />
      )}
    </div>
  );
};

export default PriceListRateReport;
