import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import ExportPdfMenuItem from "../../../../components/ExportPdfMenuItem";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchPendingWork,
  IPendingWork,
} from "./TeamPendingWorkController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface ITeamPendingWorkReports {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  purchaseOrderTitle: string;
  purchaseTitle: string;
  quotationTitle: string;
  orderTitle: string;
  invoiceTitle: string;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  onHide?: () => void;
}

const getNestedValue = (obj: any, path: string): any => {
  try {
    // Handle special cases for filter fields that combine count and amount
    if (path === "quotation_total") {
      return `${obj.quotation?.count ?? ""} ${obj.quotation?.amount ?? ""}`;
    }
    if (path === "salesOrder_total") {
      return `${obj.order?.count ?? ""} ${obj.order?.amount ?? ""}`;
    }
    if (path === "salesInvoice_total") {
      return `${obj.sell_invoice?.count ?? ""} ${
        obj.sell_invoice?.amount ?? ""
      }`;
    }
    if (path === "purchaseInvoice_total") {
      return `${obj.purchase_invoice?.count ?? ""} ${
        obj.purchase_invoice?.amount ?? ""
      }`;
    }
    if (path === "purchaseOrder_total") {
      return `${obj.purchase_order_invoice?.count ?? ""} ${
        obj.purchase_invoice?.amount ?? ""
      }`;
    }
    if (path === "pendingReminder_total") {
      return obj.pendingReminder ?? "";
    }
    if (path === "reqExpenseAmount") {
      return obj.reqExpenseAmount ?? "";
    }
    // Default case for other fields
    return (
      path.split(".").reduce((acc, part) => {
        if (acc == null) return undefined;
        return acc[part];
      }, obj) ?? ""
    );
  } catch {
    return "";
  }
};

const TeamPendingWorkReportsView = ({
  selectedDates,
  selectedTeamMembers,
  purchaseOrderTitle,
  purchaseTitle,
  quotationTitle,
  orderTitle,
  invoiceTitle,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  onHide,
}: ITeamPendingWorkReports) => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<IPendingWork[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<IPendingWork[]>(
    [],
  );

  const isLoadingMore = useRef(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("pending");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      dropdownRef.current.contains(event.target as Node)
    ) {
      return;
    }

    setIsExportDropdownOpen(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
    }
  });

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

    setFilters("pending", updatedFilters);

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
    if (!filters.startSearchDate || !filters.endSearchDate) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("pending", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.PENDINGWORK_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.PENDINGWORK_REPORT,
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
      contact_total: { value: null, matchMode: "contains" },
      quotation_total: { value: null, matchMode: "contains" },
      salesOrder_total: { value: null, matchMode: "contains" },
      salesInvoice_total: { value: null, matchMode: "contains" },
      purchaseInvoice_total: { value: null, matchMode: "contains" },
      purchaseOrder_total: { value: null, matchMode: "contains" },
      visit_totalHours: { value: null, matchMode: "contains" },
      expense_RequestedAmount: { value: null, matchMode: "contains" },
      salary_workingHrs: { value: null, matchMode: "contains" },
      pendingReminder_total: { value: null, matchMode: "contains" },
      reqExpenseAmount: { value: null, matchMode: "contains" },
    },
  });
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IPendingWork[]>>(null);

  useEffect(() => {
    setSelectedCustomers([]);
    loadTeamPendingWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
  ]);

  // Backend's ul/ll don't actually paginate the team-member list (see
  // teamPendingWorkReportServices.js - the outer team query has no limit
  // at all, and the per-member offset/limit only ever applies to a
  // single-id lookup where it's a no-op), so every call already returns
  // every matching team member regardless of what page was asked for. One
  // fetch per filter/search change is therefore both correct and
  // sufficient - the grid below paginates the already-complete `customers`
  // client-side (PrimeReact's own non-lazy paginator) instead of
  // re-fetching an identical response per page.
  const loadTeamPendingWork = async () => {
    if (isLoadingMore.current) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchPendingWork(
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        0,
        50,
        debouncedSearchText,
      );

      setCustomers(newData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  };

  const handleRefresh = async () => {
    loadTeamPendingWork();
  };

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  const onFilter = (event: DataTableFilterEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: 0,
      filters: event.filters,
    }));
  };

  const onSelectionChange = (event: { value: IPendingWork[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === customers.length);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedCustomers([...getFilteredData()]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  const getFilteredData = () => {
    let filteredData = [...customers];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;
          if (field === "lable_name" && typeof fieldValue === "string") {
            const labels = fieldValue
              .split(",")
              .map((l) => l.trim().toLowerCase());
            return labels.some((label) =>
              matchMode === "contains"
                ? label.includes(filterValue)
                : matchMode === "equals"
                  ? label === filterValue
                  : true,
            );
          }

          const fieldStr = fieldValue.toString().toLowerCase();

          switch (matchMode) {
            case "equals":
              return fieldValue.toString() === meta.value.toString();
            case "contains":
              return fieldStr.includes(filterValue);
            case "notContains":
              return !fieldStr.includes(filterValue);
            case "startsWith":
              return fieldStr.startsWith(filterValue);
            case "endsWith":
              return fieldStr.endsWith(filterValue);
            case "notEquals":
              return fieldStr !== filterValue;
            default:
              return true;
          }
        });
      }
    });

    if (lazyState.sortField) {
      filteredData.sort((a, b) => {
        const aValue = getNestedValue(a, lazyState.sortField!);
        const bValue = getNestedValue(b, lazyState.sortField!);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) filteredData.reverse();
    }

    return filteredData;
  };

  //  const exportExcel = () => {
  //     const filteredData = getFilteredData();
  //     const exportData = (
  //     selectedCustomers.length > 0 ? selectedCustomers : filteredData
  //   ).map((customer) => ({
  //     Name: customer.username || "-",
  //     Quotation: `${customer.quotation?.count ?? "-"} ( ${customer.quotation?.amount ?? "-"
  //       })`,
  //     "Sales Order": `${customer.order?.count ?? "-"} ( ${customer.order?.amount ?? "-"
  //       })`,
  //     "Sales Invoice": `${customer.sell_invoice?.count ?? "-"} ( ${customer.sell_invoice?.amount ?? "-"
  //       })`,
  //     "Purchase Invoice": `${customer.purchase_invoice?.count ?? "-"} ( ${customer.purchase_invoice?.amount ?? "-"
  //       })`,
  //     "Pending Reminder Total": customer.pendingReminder ?? "-",
  //   }));

  //     const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [
  //     { wpx: 150 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //     { wpx: 120 },
  //   ];
  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //     saveAsExcelFile(excelBuffer, "team_pending_work");
  //   };

  const printTable = () => {
    const filteredData = getFilteredData();
    const tableData =
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;

    const printContent = `
      <html>
        <head>
          <title>Team Pending Work Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Team Pending Work Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableData
                .map(
                  (customer) => `
                <tr>
                  ${visibleColumns
                    .map(
                      (col) =>
                        `<td>${getExportCellValue(col, customer)}</td>`,
                    )
                    .join("")}
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

  type PendingWorkColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: IPendingWork) => React.ReactNode;
  };

  const baseColumnDefs: PendingWorkColumnDef[] = useMemo(
    () => [
      {
        key: "username",
        label: "Team Member",
        header: (
          <span>
            Team <br /> Member
          </span>
        ),
        width: "120px",
        body: (rowData: IPendingWork) => rowData.username || "-",
      },
      {
        key: "quotation_total",
        label: quotationTitle,
        header: `${quotationTitle.replace(/ /g, "\n")}`,
        width: "120px",
        body: (rowData: IPendingWork) =>
          `${rowData.quotation?.count ?? "-"} ( ${
            rowData.quotation?.amount ?? "-"
          })`,
      },
      {
        key: "salesOrder_total",
        label: orderTitle,
        header: `${orderTitle.replace(/ /g, "\n")}`,
        width: "120px",
        body: (rowData: IPendingWork) =>
          `${rowData.order?.count ?? "-"} ( ${rowData.order?.amount ?? "-"})`,
      },
      {
        key: "salesInvoice_total",
        label: invoiceTitle,
        header: `${invoiceTitle.replace(/ /g, "\n")}`,
        width: "120px",
        body: (rowData: IPendingWork) =>
          `${rowData.sell_invoice?.count ?? "-"} ( ${
            rowData.sell_invoice?.amount ?? "-"
          })`,
      },
      {
        key: "purchaseInvoice_total",
        label: purchaseTitle,
        header: `${purchaseTitle.replace(/ /g, "\n")}`,
        width: "120px",
        body: (rowData: IPendingWork) =>
          `${rowData.purchase_invoice?.count ?? "-"} ( ${
            rowData.purchase_invoice?.amount ?? "-"
          })`,
      },
      {
        key: "purchaseOrder_total",
        label: purchaseOrderTitle,
        header: `${purchaseOrderTitle.replace(/ /g, "\n")}`,
        width: "120px",
        body: (rowData: IPendingWork) =>
          `${rowData.purchase_order?.count ?? "-"} ( ${
            rowData.purchase_order?.amount ?? "-"
          })`,
      },
      {
        key: "pendingReminder_total",
        label: "Pending Reminder",
        header: (
          <span>
            Pending <br /> Reminder
          </span>
        ),
        width: "120px",
        body: (rowData: IPendingWork) => rowData.pendingReminder ?? "-",
      },
      {
        key: "reqExpenseAmount",
        label: "Requested Expense",
        header: (
          <span>
            Requested <br /> Expense
          </span>
        ),
        width: "120px",
        body: (rowData: IPendingWork) => rowData.reqExpenseAmount ?? "-",
      },
    ],
    [
      quotationTitle,
      orderTitle,
      invoiceTitle,
      purchaseTitle,
      purchaseOrderTitle,
    ],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("team_pending_work_report", baseColumnDefs);

  const getExportCellValue = (
    col: PendingWorkColumnDef,
    customer: IPendingWork,
  ): string => {
    switch (col.key) {
      case "username":
        return customer.username || "-";
      case "quotation_total":
        return `${customer.quotation?.count ?? "-"} ( ${
          customer.quotation?.amount ?? "-"
        })`;
      case "salesOrder_total":
        return `${customer.order?.count ?? "-"} ( ${
          customer.order?.amount ?? "-"
        })`;
      case "salesInvoice_total":
        return `${customer.sell_invoice?.count ?? "-"} ( ${
          customer.sell_invoice?.amount ?? "-"
        })`;
      case "purchaseInvoice_total":
        return `${customer.purchase_invoice?.count ?? "-"} ( ${
          customer.purchase_invoice?.amount ?? "-"
        })`;
      case "purchaseOrder_total":
        return `${customer.purchase_order?.count ?? "-"} ( ${
          customer.purchase_order?.amount ?? "-"
        })`;
      case "pendingReminder_total":
        return `${customer.pendingReminder ?? "-"}`;
      case "reqExpenseAmount":
        return `${customer.reqExpenseAmount ?? "-"}`;
      default:
        return `${(customer as any)[col.key] ?? "-"}`;
    }
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Team Pending Work
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
          Team Pending Work
        </h3>
        {/* {MobileFlag || MobileFlag != undefined || MobileFlag != null ? (
          ""
        ) : ( */}
        <div
          className={`d-flex gap-2 flex-wrap align-items-center`}
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
                style: {
                  fontSize: "14px",
                },
              }}
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
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
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
                tooltipOptions={{
                  position: "top",
                  style: {
                    fontSize: "14px",
                  },
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
                  zIndex: 1000,
                  maxHeight: "calc(100vh - 120px)",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                }}
              >
                <ExportExcelMenuItem
                  reportType="team_pending_work_report"
                  getCellValue={getExportCellValue}
                  filters={{
                    selectedDates: filters.selectedDateArray,
                    selectedTeamMembers: filters.checkedOptionsUser,
                  }}
                  columns={visibleColumns}
                  fileName="Team_Pending_Work_Report"
                  canShare={canShare}
                  disabled={customers.length === 0}
                  onSelect={() => setIsExportDropdownOpen(false)}
                  selectedRows={selectedCustomers}
                />

                <ExportPdfMenuItem
                  reportType="team_pending_work_report"
                  getCellValue={getExportCellValue}
                  filters={{
                    selectedDates: filters.selectedDateArray,
                    selectedTeamMembers: filters.checkedOptionsUser,
                  }}
                  columns={visibleColumns}
                  fileName="Team_Pending_Work_Report"
                  canShare={canShare}
                  disabled={customers.length === 0}
                  onSelect={() => setIsExportDropdownOpen(false)}
                  selectedRows={selectedCustomers}
                />

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
            )}

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
        {/* )} */}
      </div>

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      <div
        className="report_card"
        style={{
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DataTable
          ref={dt}
          value={customers}
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          scrollable
          scrollHeight="flex"
          filterDisplay="row"
          dataKey="username"
          paginator
          rows={50}
          rowsPerPageOptions={[25, 50, 100, 200]}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          emptyMessage="No data found"
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
              sortable
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode="contains"
              headerStyle={{
                width: col.width || "120px",
                whiteSpace: "pre-wrap",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{
                textAlign: col.key === "username" ? undefined : "right",
              }}
              body={col.body}
            />
          ))}
        </DataTable>
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
          filtersToShow={[1, 5]}
          pageId={1}
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

export default TeamPendingWorkReportsView;
