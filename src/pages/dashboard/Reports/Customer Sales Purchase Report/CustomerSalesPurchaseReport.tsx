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
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import { exportReportExcel } from "../../../../services/reportExportService";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchCustomerSalesPurchaseReport,
  ICustomerSalesPurchaseItem,
  ICustomerSalesPurchaseSummary,
} from "./CustomerSalesPurchaseController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface ICustomerSalesPurchaseReportProps {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  selectedContactId?: string | number | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  onHide?: () => void;
}

const CustomerSalesPurchaseReport: React.FC<
  ICustomerSalesPurchaseReportProps
> = ({
  selectedDates,
  selectedTeamMembers,
  selectedContactId,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  onHide,
}) => {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [customers, setCustomers] = useState<ICustomerSalesPurchaseItem[]>([]);
    const [allRawData, setAllRawData] = useState<ICustomerSalesPurchaseItem[]>(
      [],
    );
    const [selectedCustomers, setSelectedCustomers] = useState<
      ICustomerSalesPurchaseItem[]
    >([]);
    const [selectAll, setSelectAll] = useState(false);

    const [summaryData, setSummaryData] = useState<ICustomerSalesPurchaseSummary>(
      {
        totalCustomers: 0,
        totalSales: 0,
        totalPurchase: 0,
        netBalance: 0,
        currency_symbol: "₹",
      },
    );

    const [globalSearchText, setGlobalSearchText] = useState<string>("");
    const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { getFilter, setFilters } = useCommonFilterStore();
    const filters = getFilter("customer_sales_purchase");
    const [hasData, setHasData] = useState<boolean>(false);
    const [isModalFilterVisible, setIsModalFilterVisible] =
      useState<boolean>(false);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dt = useRef<DataTable<ICustomerSalesPurchaseItem[]>>(null);

    const offsetRef = useRef(0);
    const isFetchingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const PAGE_SIZE = 50;

    const currSym =
      summaryData.currency_symbol || customers[0]?.currency_symbol || "₹";

    // Rights Checks (Using Account/Contact Report Page ID or fallback)
    const canViewReport = useCheckUserPermission(
      PAGE_ID.CUSTOMER_SALES_PURCHASE_REPORT,
      PERMISSION_TYPE.VIEW,
    );
    const canShare = useCheckUserPermission(
      PAGE_ID.CUSTOMER_SALES_PURCHASE_REPORT,
      PERMISSION_TYPE.SHARE,
    );
    const canPrint = useCheckUserPermission(
      PAGE_ID.CUSTOMER_SALES_PURCHASE_REPORT,
      PERMISSION_TYPE.PRINT,
    );

    const [lazyState, setLazyState] = useState<LazyTableState>({
      first: 0,
      rows: 49,
      page: 1,
      sortField: null,
      sortOrder: null,
      filters: {
        customer_code: { value: null, matchMode: "contains" },
        customer_name: { value: null, matchMode: "contains" },
        relationship: { value: null, matchMode: "contains" },
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
        setFilters("customer_sales_purchase", {
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

        await fetchCustomerSalesPurchaseReport(
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
          selectedContactId || filters.selectedContactId,
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
      selectedContactId,
      filters.selectedContactId,
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
      setFilters("customer_sales_purchase", updatedFilters);
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

    const formatBalance = (val: number) => {
      const absVal = Math.abs(val).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      if (val < 0) {
        return `(${currSym}${absVal})`;
      }
      return `${currSym}${absVal}`;
    };

    // Export functions with permission verification. NOTE: this report has
    // no full-dataset re-fetch (unlike most others) - export was always
    // limited to whatever's currently loaded (`customers`) or selected;
    // preserved as-is, only the workbook generation moved server-side.
    const exportExcel = async () => {
      if (!canShare) {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        return;
      }
      const dataToExport =
        selectedCustomers.length > 0 ? selectedCustomers : customers;
      if (dataToExport.length === 0) return;

      const rows = dataToExport.map((item, idx) => {
        const row: Record<string, string | number> = {};
        visibleColumns.forEach((col) => {
          row[col.key] = getExportCellValue(col, item, idx);
        });
        return row;
      });

      try {
        await exportReportExcel({
          reportType: "customer_sales_purchase_report",
          filters: {},
          columns: visibleColumns,
          fileName: "Customer_Wise_Sales_Purchase_Report",
          rows,
        });
        toast.success("Excel exported successfully!");
      } catch {
        toast.error("Failed to export data");
      }
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
      doc.text("Customer-Wise Sales & Purchase Report", 40, 40);

      const head = [visibleColumns.map((col) => col.label)];

      const body = dataToExport.map((item, idx) =>
        visibleColumns.map((col) => getExportCellValue(col, item, idx)),
      );

      autoTable(doc, {
        head: head,
        body: body,
        startY: 60,
        theme: "striped",
        styles: { fontSize: 9 },
      });

      doc.save(`Customer_Wise_Sales_Purchase_Report_${new Date().getTime()}.pdf`);
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
          <title>Print Customer-Wise Sales & Purchase Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #0d47a1; color: white; }
            h1 { text-align: center; }
            .creditor { color: #d32f2f; font-weight: bold; }
            .debtor { color: #2e7d32; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Customer-Wise Sales & Purchase Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${dataToExport
          .map(
            (item, idx) => `
                    <tr>
                      ${visibleColumns
                .map(
                  (col) =>
                    `<td${col.key === "relationship"
                      ? ` class="${item.relationship === "Net Creditor" ? "creditor" : item.relationship === "Net Debtor" ? "debtor" : ""}"`
                      : ""
                    }>${getExportCellValue(col, item, idx)}</td>`,
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

    const relationshipBodyTemplate = (rowData: ICustomerSalesPurchaseItem) => {
      if (rowData.relationship === "-") {
        return <span>-</span>;
      }
      let badgeClass = "badge bg-secondary";
      if (rowData.relationship === "Net Creditor") {
        badgeClass = "badge bg-danger";
      } else if (rowData.relationship === "Net Debtor") {
        badgeClass = "badge bg-success";
      }

      return <span className={badgeClass}>{rowData.relationship}</span>;
    };

    const netBalanceBodyTemplate = (rowData: ICustomerSalesPurchaseItem) => {
      const formatted = formatBalance(rowData.net_balance);
      const textColor =
        rowData.net_balance < 0
          ? "text-danger fw-bold"
          : rowData.net_balance > 0
            ? "text-success fw-bold"
            : "text-dark";
      return <span className={textColor}>{formatted}</span>;
    };

    type SalesPurchaseColumnDef = ColumnDef & {
      header: React.ReactNode;
      filterMatchMode?: string;
      width?: string;
      body: (rowData: ICustomerSalesPurchaseItem, options?: any) => React.ReactNode;
    };

    const baseColumnDefs: SalesPurchaseColumnDef[] = useMemo(() => {
      return [
        {
          key: "s_no",
          label: "S.No",
          header: "S.No",
          width: "4rem",
          body: (_rowData, options) => options.rowIndex + 1,
        },
        {
          key: "customer_code",
          label: "Customer Code",
          header: "Customer Code",
          body: (rowData) => rowData.customer_code,
        },
        {
          key: "customer_name",
          label: "Customer Name",
          header: "Customer Name",
          body: (rowData) => rowData.customer_name,
        },
        {
          key: "state",
          label: "State",
          header: "State",
          body: (rowData) => rowData.state,
        },
        {
          key: "gstin",
          label: "GSTIN",
          header: "GSTIN",
          body: (rowData) => rowData.gstin,
        },
        {
          key: "total_sales",
          label: "Total Sales",
          header: `Total Sales (${currSym})`,
          body: (rowData) =>
            `${currSym}${rowData.total_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        },
        {
          key: "total_purchase",
          label: "Total Purchase",
          header: `Total Purchase (${currSym})`,
          body: (rowData) =>
            `${currSym}${rowData.total_purchase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        },
        {
          key: "net_balance",
          label: "Net Balance",
          header: `Net Balance (${currSym})`,
          body: netBalanceBodyTemplate,
        },
        {
          key: "relationship",
          label: "Relationship",
          header: "Relationship",
          body: relationshipBodyTemplate,
        },
      ];
    }, [currSym]);

    const {
      visibleColumns,
      orderedColumns,
      hiddenKeys,
      toggleColumn,
      reorderColumns,
      resetColumns,
    } = useColumnPreferences(
      "customer_sales_purchase_report",
      baseColumnDefs,
    );

    const getExportCellValue = (
      col: SalesPurchaseColumnDef,
      item: ICustomerSalesPurchaseItem,
      idx: number,
    ): string | number => {
      switch (col.key) {
        case "s_no":
          return idx + 1;
        case "total_sales":
          return `${currSym}${item.total_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
        case "total_purchase":
          return `${currSym}${item.total_purchase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
        case "net_balance":
          return formatBalance(item.net_balance);
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
          className={`d-flex ${MobileFlag
              ? "flex-column align-items-start"
              : "align-items-center justify-content-between gap-2"
            } mb-3`}
        >
          <h3
            style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
            className="dash-board-text-count"
          >
            Customer-Wise Sales & Purchase Report
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
                  className={`labelDropLeft ${isExportDropdownOpen ? "isVisible" : "isHidden"
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

        {/* Summary KPI Section */}
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-light p-3 text-center">
              <span className="text-muted small">Total Customers</span>
              <h5 className="fw-bold mb-0 text-primary">
                {summaryData.totalCustomers}
              </h5>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-light p-3 text-center">
              <span className="text-muted small">Total Sales</span>
              <h5 className="fw-bold mb-0 text-dark">
                {currSym}
                {summaryData.totalSales.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </h5>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-light p-3 text-center">
              <span className="text-muted small">Total Purchase</span>
              <h5 className="fw-bold mb-0 text-dark">
                {currSym}
                {summaryData.totalPurchase.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </h5>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-light p-3 text-center">
              <span className="text-muted small">Net Balance</span>
              <h5
                className={`fw-bold mb-0 ${summaryData.netBalance < 0 ? "text-danger" : "text-success"}`}
              >
                {formatBalance(summaryData.netBalance)}
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
                sortable
                filter
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
            title="Filter Customer Sales & Purchase Report"
            message="Filter report by date range or team members"
            btn1="Cancel"
            btn2="Apply Filter"
            filtersToShow={[1, 4, 5]}
            pageId={PAGE_ID.CUSTOMER_SALES_PURCHASE_REPORT}
            initialStartSearchDate={filters.startSearchDate}
            initialEndSearchDate={filters.endSearchDate}
            initialCheckedOptionsUser={filters.checkedOptionsUser}
            initialFilterData={{ contactId: filters.selectedContactId }}
          />
        )}
      </div>
    );
  };

export default CustomerSalesPurchaseReport;
