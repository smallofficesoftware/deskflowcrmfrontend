import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAllStatusWiseData,
  fetchStatus,
  fetchStatusWiseForExport,
  IStatusReport,
  IStatusWiseReportData,
} from "./StatusWiseReportController";

// ── SECTIONS config ──────────────────────────────────────────────────────────
// SECTIONS replace karo ye se:
const GROUPS = [
  { label: "Internal Status", key: "internal" as const },
  { label: "External Status", key: "external" as const },
];

interface IPropStageStatusWiseReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedStageStatus?: string[] | null;
  selectedTeamMembers?: string[] | null;
  globalSearch?: string;
  onHide?: () => void;
}

const StatusWiseReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  selectedStageStatus,
  selectedTeamMembers,
  globalSearch,
  onHide,
}: IPropStageStatusWiseReports) => {
  const [loading, setLoading] = useState(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("status_wise_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── statusWiseReport: object, NOT array ──────────────────────────────────
  const [statusWiseReport, setStatusWiseReport] =
    useState<IStatusWiseReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IStatusReport[]>>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      dropdownRef.current.contains(event.target as Node)
    )
      return;
    setIsExportDropdownOpen(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) onHide?.();
    else setIsExportDropdownOpen(false);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);
    return () => clearTimeout(timer);
  }, [globalSearchText]);

  const handleApplyFilters = (data: any) => {
    const [startDate, endDate] = getCurrentMonthDateRange();
    const updatedFilters = {
      ...data,
      checkedOptionsStageStatus: data.checkedOptionsStageStatus || [],
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };
    setFilters("status_wise_report", updatedFilters);
    setHasData(Object.keys(updatedFilters || {}).length > 0);
    setIsModalFilterVisible(false);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalSearch = () => {
    const value = searchInputRef.current?.value || "";
    setGlobalSearchText(value);
  };

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [startOfMonth, endOfMonth];
  };

  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate || !filters.selectedDateArray) {
      const [startDate, endDate] = getCurrentMonthDateRange();
      setFilters("status_wise_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.STATUS_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.STATUS_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  type StatusColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    sortableCol?: boolean;
    filterCol?: boolean;
    body?: (rowData: { name: string; support_ticket: number; task: number }) => React.ReactNode;
  };

  const baseColumnDefs: StatusColumnDef[] = useMemo(
    () => [
      {
        key: "name",
        label: "Status Name",
        header: "Status Name",
        sortableCol: true,
        filterCol: false,
      },
      {
        key: "support_ticket",
        label: "Support Ticket Count",
        header: "Support Ticket Count",
        sortableCol: true,
        filterCol: false,
      },
      {
        key: "task",
        label: "Task Count",
        header: "Task Count",
        sortableCol: true,
        filterCol: false,
      },
    ],
    [],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("status_wise_report", baseColumnDefs);

  const EXTRA_EXPORT_COLUMNS: { key: string; label: string }[] = [
    { key: "group", label: "Group" },
  ];

  const getExportCellValue = (
    col: StatusColumnDef,
    row: { group: string; name: string; support_ticket: number; task: number },
  ): string | number => {
    switch (col.key) {
      case "name":
        return row.name;
      case "support_ticket":
        return row.support_ticket;
      case "task":
        return row.task;
      default:
        return (row as any)[col.key] ?? "-";
    }
  };

  // Load every status row (the master list is small — request a high limit
  // rather than a hard 50 cap) and let each section grid sort/paginate itself.
  const loadStatus = async () => {
    setLoading(true);
    try {
      await fetchStatus(
        (data) => setStatusWiseReport(data),
        filters.selectedDateArray,
        MobileToken,
        getID,
        MobileFlag,
        filters.checkedOptionsStageStatus,
        filters.checkedOptionsUser,
        0,
        100000,
        debouncedSearchText,
      );
    } catch (err: any) {
      console.error("Error loading status report:", err);
      setError(err?.message || "Failed to fetch data");
      setStatusWiseReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsStageStatus,
    filters.checkedOptionsUser,
    debouncedSearchText,
  ]);

  const handleRefresh = () => {
    loadStatus();
  };

  // ── merged rows per group (status name -> support-ticket + task counts) ────
  // Memoised so PrimeReact's per-table sort stays stable across renders.
  const groupRows = useMemo(() => {
    const build = (key: "internal" | "external") => {
      const stMap = new Map<string, number>();
      const tkMap = new Map<string, number>();
      (statusWiseReport?.[key]?.support_ticket || []).forEach((i) =>
        stMap.set(i.name, i.count ?? 0),
      );
      (statusWiseReport?.[key]?.normal_task || []).forEach((i) =>
        tkMap.set(i.name, i.count ?? 0),
      );
      const allNames = [...new Set([...stMap.keys(), ...tkMap.keys()])];
      return allNames.map((name) => ({
        name,
        support_ticket: stMap.get(name) ?? 0,
        task: tkMap.get(name) ?? 0,
      }));
    };
    return { internal: build("internal"), external: build("external") };
  }, [statusWiseReport]);

  // ── export helpers ────────────────────────────────────────────────────────
  const getExportRows = () =>
    GROUPS.flatMap(({ label, key }) => {
      const stMap = new Map<string, number>();
      const tkMap = new Map<string, number>();
      (statusWiseReport?.[key]?.support_ticket || []).forEach((i) =>
        stMap.set(i.name, i.count ?? 0),
      );
      (statusWiseReport?.[key]?.normal_task || []).forEach((i) =>
        tkMap.set(i.name, i.count ?? 0),
      );
      const allNames = [...new Set([...stMap.keys(), ...tkMap.keys()])];
      return allNames.map((name) => ({
        group: label,
        name,
        support_ticket: stMap.get(name) ?? 0,
        task: tkMap.get(name) ?? 0,
      }));
    });

  const exportColumns = [
    ...visibleColumns.map((col) => ({ title: col.label, dataKey: col.key })),
    ...EXTRA_EXPORT_COLUMNS.map((col) => ({ title: col.label, dataKey: col.key })),
  ];

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const tableData = getExportRows();

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`status_wise_report_${Date.now()}.pdf`);
      return;
    }

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { top: 20, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text(
          "Status Wise Task Or Supp. Ticket Report",
          data.settings.margin.left,
          10,
        );
      },
    });

    doc.save(`status_wise_report_${Date.now()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allContacts = await exportAllStatusWiseData(
        (offset, limit) =>
          fetchStatusWiseForExport(
            filters.selectedDateArray,
            MobileToken,
            getID,
            MobileFlag,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
            debouncedSearchText,
            offset,
            limit,
          ),
        50,
      );

      if (!allContacts.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = allContacts.map((item: any) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item);
        });
        EXTRA_EXPORT_COLUMNS.forEach((col) => {
          row[col.label] = item[col.key] ?? "-";
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0] || {}).map(() => ({
        wpx: 150,
      }));

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "Status Wise Task Or Supp. Ticket Report",
      );

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      saveAsExcelFile(excelBuffer, "status_Wise_Report");
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export status wise data");
    } finally {
      setLoading(false);
    }
  };

  const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, `${fileName}_export_${Date.now()}.xlsx`);
  };

  const printTable = () => {
    const tableData = getExportRows();
    const printContent = `
      <html>
        <head>
          <title>Status Wise Task Or Supp. Ticket Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Status Wise Task Or Supp. Ticket Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
                ${EXTRA_EXPORT_COLUMNS.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableData
                .map(
                  (r) => `
                <tr>
                  ${visibleColumns
                    .map((col) => `<td>${getExportCellValue(col, r)}</td>`)
                    .join("")}
                  ${EXTRA_EXPORT_COLUMNS.map(
                    (col) => `<td>${(r as any)[col.key] ?? "-"}</td>`,
                  ).join("")}
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Status Wise Task Or Supp. Ticket Report
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Status Wise Task Or Supp. Ticket Report
        </h3>
        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
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
                className={`labelDropLeft ${isExportDropdownOpen ? "isVisible" : "isHidden"}`}
                style={{
                  width: "170px",
                  position: "absolute",
                  right: "0",
                  top: "100%",
                  zIndex: 1000,
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
                    if (!statusWiseReport) return;
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
                    if (!statusWiseReport) return;
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
                    if (!statusWiseReport) return;
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

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      {/* ── 2 section tables ───────────────────────────────────────────────── */}
      <div
        className="report_card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          padding: "16px",
        }}
      >
        {GROUPS.map(({ label, key }) => {
          const rows = groupRows[key];

          return (
            <div key={key}>
              <h5
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {label}
              </h5>
              <DataTable
                value={rows}
                dataKey="name"
                loading={loading}
                emptyMessage="No data found"
                scrollable
                resizableColumns
                columnResizeMode="fit"
                scrollHeight="300px"
                size="small"
                removableSort
                sortMode="single"
                paginator={rows.length > 25}
                rows={25}
                rowsPerPageOptions={[25, 50, 100]}
                tableStyle={{ minWidth: "400px" }}
              >
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
          );
        })}
      </div>

      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 4, 21, 5]}
          pageId={1}
          stageandStatusOrderType={8}
          initialFilterData={{
            ...filters.filterData,
            category: filters.selectedCategoryId,
            product: filters.selectedProductId,
            contactId: filters.selectedContactId,
            productId: filters.selectedProductSearchId,
            orderlistselect: filters.selectedOrderListId,
          }}
          initialCheckedOptions={filters.checkedOptions}
          initialCheckedSourceTypes={filters.checkedSourceTypes}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          initialCheckedOptionsStageStatus={filters.checkedOptionsStageStatus}
          initialCheckedOptionsSeries={filters.checkedOptionsSeries}
          initialSelectedStockTypeId={filters.selectedStockTypeId}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
          initialSelectedActiveId={filters.selectedActiveId}
          initialselectedOrderListId={filters.selectedOrderListId}
          initialSelectedDays={filters.selectedDays}
          selectedWarehouseIds={filters.selectedWarehouseIds}
          initialReferenceWiseContact={filters.referenceWiseContact}
          isApplyReport={1}
        />
      )}
    </div>
  );
};

export default StatusWiseReport;
