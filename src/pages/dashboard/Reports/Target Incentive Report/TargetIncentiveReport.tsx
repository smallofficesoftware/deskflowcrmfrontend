import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTableSortEvent,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchTargetIncentiveReport,
  ITargetIncentiveItem,
  ITargetIncentiveSummary,
} from "./TargetIncentiveReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: number | null;
  filters: DataTableFilterMeta;
}

interface ITargetIncentiveReportProps {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  onHide?: () => void;
}

const TargetIncentiveReport: React.FC<ITargetIncentiveReportProps> = ({
  selectedDates,
  selectedTeamMembers,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  onHide,
}) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<ITargetIncentiveItem[]>([]);
  const [allRawData, setAllRawData] = useState<ITargetIncentiveItem[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<
    ITargetIncentiveItem[]
  >([]);
  const [selectAll, setSelectAll] = useState(false);

  const [summaryData, setSummaryData] = useState<ITargetIncentiveSummary>({
    totalMembers: 0,
    totalTargetAmount: 0,
    totalAchievedAmount: 0,
    totalIncentivePayout: 0,
    currency_symbol: "₹",
  });

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { getFilter, setFilters } = useCommonFilterStore();
  const filters = getFilter("target_incentive");
  const [hasData, setHasData] = useState<boolean>(false);
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dt = useRef<DataTable<ITargetIncentiveItem[]>>(null);

  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const PAGE_SIZE = 50;

  const currSym =
    summaryData.currency_symbol || customers[0]?.currency_symbol || "₹";

  // Rights Checks
  const canViewReport = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canShare = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      username: { value: null, matchMode: "contains" },
      target_type_label: { value: null, matchMode: "contains" },
      status: { value: null, matchMode: "contains" },
    },
  });

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsExportDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);
    return () => clearTimeout(timer);
  }, [globalSearchText]);

  useEscapeKey(() => {
    if (isExportDropdownOpen) {
      setIsExportDropdownOpen(false);
    } else {
      onHide?.();
    }
  });

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [startOfMonth, endOfMonth];
  };

  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate) {
      const [startDate, endDate] = getCurrentMonthDateRange();
      setFilters("target_incentive", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const reportSelectedDates = useMemo<Date[]>(() => {
    const dates = selectedDates || [
      filters.startSearchDate,
      filters.endSearchDate,
    ];
    return dates
      .map((date) => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (typeof date === "object" && "toDate" in date)
          return (date as any).toDate();
        return new Date(date as string | number);
      })
      .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
  }, [selectedDates, filters.startSearchDate, filters.endSearchDate]);

  const loadData = async (reset = false) => {
    if (!canViewReport) return;
    if (isFetchingRef.current) return;
    if (!hasMoreRef.current && !reset) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      if (reset) {
        offsetRef.current = 0;
        setCustomers([]);
        hasMoreRef.current = true;
      }

      await fetchTargetIncentiveReport(
        (dataSetter) => {
          const newData =
            typeof dataSetter === "function"
              ? dataSetter(allRawData)
              : dataSetter;
          setAllRawData(newData);
          if (newData.length < PAGE_SIZE) {
            hasMoreRef.current = false;
          }
          setCustomers((prev) => (reset ? newData : [...prev, ...newData]));
        },
        setTotalRecords,
        setSummaryData,
        reportSelectedDates,
        selectedTeamMembers || filters.checkedOptionsUser,
        MobileToken,
        getID,
        offsetRef.current,
        PAGE_SIZE,
        globalSearch || debouncedSearchText,
      );

      offsetRef.current += PAGE_SIZE;
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setCustomers([]);
    setAllRawData([]);
    loadData(true);
  };

  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadData(true);
  }, [
    reportSelectedDates,
    selectedTeamMembers,
    filters.checkedOptionsUser,
    debouncedSearchText,
    globalSearch,
    canViewReport,
  ]);

  const handleGlobalSearch = () => {
    const value = searchInputRef.current?.value || "";
    setGlobalSearchText(value);
  };

  const handleApplyFilters = (data: any) => {
    const [startDate, endDate] = getCurrentMonthDateRange();
    const updatedFilters = {
      ...data,
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };
    setFilters("target_incentive", updatedFilters);
    setHasData(Object.keys(updatedFilters || {}).length > 0);
    setIsModalFilterVisible(false);
  };

  const onSort = (e: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: e.sortField,
      sortOrder: e.sortOrder,
    }));
  };

  const onFilter = (e: DataTableFilterEvent) => {
    setLazyState((prev) => ({
      ...prev,
      filters: e.filters,
    }));
  };

  const onSelectionChange = (e: any) => {
    setSelectedCustomers(e.value);
    setSelectAll(e.value.length === customers.length);
  };

  const onSelectAllChange = (e: any) => {
    const checked = e.checked;
    setSelectAll(checked);
    setSelectedCustomers(checked ? customers : []);
  };

  // Export functions with permission verification & dynamic currency symbol
  const exportExcel = () => {
    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : customers;
    if (dataToExport.length === 0) return;

    const formattedData = dataToExport.map((item) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.label] = getExportCellValue(col, item);
      });
      EXTRA_EXPORT_COLUMNS.forEach((col) => {
        row[col.label] = (item as any)[col.key] || "-";
      });
      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(formattedData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, `Target_Incentive_Report_${new Date().getTime()}.xlsx`);
    toast.success("Excel exported successfully!");
  };

  const exportPdf = () => {
    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : customers;
    if (dataToExport.length === 0) return;

    const doc = new jsPDF("l", "pt", "a4");
    doc.text("Target & Incentive Report", 40, 40);

    const head = [
      [
        ...visibleColumns.map((col) => col.label),
        ...EXTRA_EXPORT_COLUMNS.map((col) => col.label),
      ],
    ];

    const body = dataToExport.map((item) => [
      ...visibleColumns.map((col) => getExportCellValue(col, item)),
      ...EXTRA_EXPORT_COLUMNS.map((col) => (item as any)[col.key] || "-"),
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      startY: 60,
      theme: "striped",
      styles: { fontSize: 9 },
    });

    doc.save(`Target_Incentive_Report_${new Date().getTime()}.pdf`);
    toast.success("PDF exported successfully!");
  };

  const printTable = () => {
    if (!canPrint) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    const dataToExport =
      selectedCustomers.length > 0 ? selectedCustomers : customers;
    if (dataToExport.length === 0) return;

    const printContent = `
      <html>
        <head>
          <title>Print Target Incentive Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Target vs Incentive Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
                ${EXTRA_EXPORT_COLUMNS.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${dataToExport
                .map(
                  (item) => `
                    <tr>
                      ${visibleColumns
                        .map((col) => `<td>${getExportCellValue(col, item)}</td>`)
                        .join("")}
                      ${EXTRA_EXPORT_COLUMNS.map(
                        (col) => `<td>${(item as any)[col.key] || "-"}</td>`,
                      ).join("")}
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const pctBodyTemplate = (rowData: ITargetIncentiveItem) => {
    const pct = rowData.achievement_percentage;
    let badgeClass = "badge bg-danger";
    if (pct >= 100) badgeClass = "badge bg-success";
    else if (pct >= 80) badgeClass = "badge bg-warning text-dark";

    return <span className={badgeClass}>{pct}%</span>;
  };

  const statusBodyTemplate = (rowData: ITargetIncentiveItem) => {
    let badgeClass = "badge bg-danger";
    if (rowData.status === "Target Achieved") badgeClass = "badge bg-success";
    else if (rowData.status === "Near Target")
      badgeClass = "badge bg-warning text-dark";

    return <span className={badgeClass}>{rowData.status}</span>;
  };

  type TargetColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    sortableCol?: boolean;
    filterCol?: boolean;
    body?: (rowData: ITargetIncentiveItem) => React.ReactNode;
  };

  const baseColumnDefs: TargetColumnDef[] = useMemo(
    () => [
      {
        key: "username",
        label: "Team Member",
        header: "Team Member",
      },
      {
        key: "target_type_label",
        label: "Target Type",
        header: "Target Type",
        body: (rowData: ITargetIncentiveItem) => (
          <span className="badge bg-info text-dark">
            {rowData.target_type_label || "Invoice"}
          </span>
        ),
      },
      {
        key: "target_achieved_count",
        label: "Target / Achieved Count",
        header: "Target / Achieved Count",
        sortableCol: false,
        filterCol: false,
        body: (rowData: ITargetIncentiveItem) =>
          rowData.target_count && rowData.target_count > 0
            ? `${rowData.target_count} / ${rowData.achieved_count || 0}`
            : "-",
      },
      {
        key: "target_achieved_value",
        label: "Target / Achieved Value",
        header: "Target / Achieved Value",
        sortableCol: false,
        filterCol: false,
        body: (rowData: ITargetIncentiveItem) =>
          rowData.target_value && rowData.target_value > 0
            ? `${currSym}${rowData.target_value.toLocaleString("en-IN")} / ${currSym}${(rowData.achieved_value || 0).toLocaleString("en-IN")}`
            : "-",
      },
      {
        key: "achievement_percentage",
        label: "Achievement (%)",
        header: "Achievement (%)",
        filterCol: false,
        body: pctBodyTemplate,
      },
      {
        key: "incentive_rule",
        label: "Incentive Rule",
        header: "Incentive Rule",
        sortableCol: false,
        filterCol: false,
        body: (rowData: ITargetIncentiveItem) =>
          rowData.incentive_type === 1
            ? `${rowData.incentive_value}%`
            : rowData.incentive_type === 2
              ? `${currSym}${Number(rowData.incentive_value || 0).toLocaleString("en-IN")} (Flat)`
              : "None",
      },
      {
        key: "earned_incentive",
        label: "Earned Incentive",
        header: "Earned Incentive",
        filterCol: false,
        body: (rowData: ITargetIncentiveItem) =>
          `${currSym}${(rowData.incentive_amount ?? rowData.earned_incentive ?? 0).toLocaleString("en-IN")}`,
      },
      {
        key: "status",
        label: "Status",
        header: "Status",
        body: statusBodyTemplate,
      },
    ],
    [currSym],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("target_incentive_report", baseColumnDefs);

  const EXTRA_EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "incentive_type_label", label: "Incentive Type" },
  ];

  const getExportCellValue = (
    col: TargetColumnDef,
    item: ITargetIncentiveItem,
  ): string => {
    switch (col.key) {
      case "username":
        return item.username || "-";
      case "target_type_label":
        return item.target_type_label || "Invoice";
      case "target_achieved_count":
        return item.target_count && item.target_count > 0
          ? `${item.target_count} / ${item.achieved_count || 0}`
          : "-";
      case "target_achieved_value":
        return item.target_value && item.target_value > 0
          ? `${currSym}${(item.target_value || 0).toLocaleString("en-IN")} / ${currSym}${(item.achieved_value || 0).toLocaleString("en-IN")}`
          : "-";
      case "achievement_percentage":
        return `${item.achievement_percentage ?? item.achievement_pct ?? 0}%`;
      case "incentive_rule":
        return item.incentive_type === 1
          ? `${item.incentive_value}%`
          : item.incentive_type === 2
            ? `${currSym}${item.incentive_value} (Flat)`
            : "None";
      case "earned_incentive":
        return `${currSym}${(item.incentive_amount ?? item.earned_incentive ?? 0).toLocaleString("en-IN")}`;
      case "status":
        return item.status;
      default:
        return (item as any)[col.key] ?? "-";
    }
  };

  if (!canViewReport) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {DEFAULT_MESSAGE_ERROR_PERMISSION}
      </div>
    );
  }

  return (
    <div>
      {/* Header Bar */}
      <div
        className={`d-flex ${
          MobileFlag
            ? "flex-column align-items-start"
            : "align-items-center justify-content-between gap-2"
        } mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Target vs Incentive Report
        </h3>

        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
          {/* Search Box */}
          <div
            className="d-flex gap-2 align-items-center"
            style={{
              width: MobileFlag ? "285px" : "355px",
              zIndex: "999",
              position: "relative",
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="form-control"
              placeholder={
                MobileFlag
                  ? "Search in This Report"
                  : "Search Anything in This Report"
              }
              style={{
                width: MobileFlag ? "220px" : "300px",
                marginTop: "10px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGlobalSearch();
                }
              }}
            />
            {globalSearchText && (
              <span
                className="clear-icon"
                onClick={() => {
                  setGlobalSearchText("");
                  if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#5f6368"
                >
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
              tooltipOptions={{
                position: "top",
                style: { fontSize: "14px" },
              }}
            />
          </div>

          {/* Action Buttons: Filter & Dropdown options */}
          <div className="d-flex gap-2 align-items-center">
            <Button
              icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={() => setIsModalFilterVisible(true)}
              tooltip="Filter Report"
              tooltipOptions={{
                position: "top",
                style: { fontSize: "14px" },
              }}
            />

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
                tooltipOptions={{
                  position: "top",
                  style: { fontSize: "14px" },
                }}
              />

              <ul
                className={`labelDropLeft ${
                  isExportDropdownOpen ? "isVisible" : "isHidden"
                }`}
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
                    if (customers.length === 0) return;
                    canShare
                      ? exportExcel()
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }}
                >
                  <i
                    className="pi pi-file-excel"
                    style={{ marginRight: "4px" }}
                  />
                  Export Excel
                </li>

                <li
                  className="listItem text-start"
                  role="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    if (customers.length === 0) return;
                    canShare
                      ? exportPdf()
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }}
                >
                  <i
                    className="pi pi-file-pdf"
                    style={{ marginRight: "4px" }}
                  />
                  Export PDF
                </li>

                <li
                  className="listItem text-start"
                  role="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    if (customers.length === 0) return;
                    canPrint
                      ? printTable()
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }}
                >
                  <i className="pi pi-print" style={{ marginRight: "4px" }} />
                  Print
                </li>
              </ul>
            </div>
            <Button
              icon="pi pi-refresh"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleRefresh}
              tooltip="Refresh"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />
            <ColumnsButton
              columns={orderedColumns}
              hiddenKeys={hiddenKeys}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetColumns}
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Section with dynamic company currency symbol */}
      <div className="row mb-3">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Total Members</span>
            <h5 className="fw-bold mb-0 text-primary">
              {summaryData.totalMembers}
            </h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Total Target Value</span>
            <h5 className="fw-bold mb-0 text-dark">
              {currSym}
              {summaryData.totalTargetAmount.toLocaleString("en-IN")}
            </h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Total Achieved Value</span>
            <h5 className="fw-bold mb-0 text-success">
              {currSym}
              {summaryData.totalAchievedAmount.toLocaleString("en-IN")}
            </h5>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 bg-light p-3 text-center">
            <span className="text-muted small">Total Incentive Payout</span>
            <h5 className="fw-bold mb-0 text-warning">
              {currSym}
              {summaryData.totalIncentivePayout.toLocaleString("en-IN")}
            </h5>
          </div>
        </div>
      </div>

      {/* Main Table using Virtual Scroller */}
      <div
        className="report_card"
        style={{ height: "75vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          ref={dt}
          value={customers}
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          scrollable
          scrollHeight="65vh"
          virtualScrollerOptions={{
            itemSize: 50,
            lazy: true,
            onLazyLoad: (e: any) => {
              if (
                e.last >= customers.length - 1 &&
                hasMoreRef.current &&
                !loading
              ) {
                loadData(false);
              }
            },
            appendOnly: true,
            showLoader: true,
            delay: 0,
          }}
          filterDisplay="row"
          onFilter={onFilter}
          filters={lazyState.filters}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          loading={loading}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          emptyMessage="No records found"
          loadingIcon={
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />
          }
        >
          {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && (
            <Column
              selectionMode="multiple"
              headerStyle={{
                width: "3rem",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}

          {visibleColumns.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.header}
              sortable={col.sortableCol !== false}
              filter={col.filterCol !== false}
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode={col.filterMatchMode || "contains"}
              headerStyle={{
                width: col.width || "150px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={col.body}
            />
          ))}
        </DataTable>
      </div>

      {/* Filter Modal */}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Target Incentive Report"
          message="Filter report by date range or team members"
          btn1="Cancel"
          btn2="Apply Filter"
          filtersToShow={[1, 5]}
          pageId={PAGE_ID.TARGET_VS_INCENTIVE_REPORT}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
        />
      )}
    </div>
  );
};

export default TargetIncentiveReport;
