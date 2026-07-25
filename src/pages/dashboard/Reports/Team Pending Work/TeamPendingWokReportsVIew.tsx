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
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAllTeamPendingWorkData,
  fetchPendingWork,
  fetchTeamPendingWorkForExport,
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
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<IPendingWork[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<IPendingWork[]>(
    [],
  );
  const isPaginationCall = useRef(false);

  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);

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
  const [pendingWork, setPendingWork] = useState<IPendingWork[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IPendingWork[]>>(null);

  const dataArray: IPendingWork[] = Array.isArray(pendingWork)
    ? pendingWork.map((item) => ({
        username: item.username || "-",
        quotation: {
          count: item.quotation?.count ?? 0,
          amount: item.quotation?.amount ?? 0,
        },
        order: {
          count: item.order?.count ?? 0,
          amount: item.order?.amount ?? 0,
        },
        sell_invoice: {
          count: item.sell_invoice?.count ?? 0,
          amount: item.sell_invoice?.amount ?? 0,
        },
        purchase_invoice: {
          count: item.purchase_invoice?.count ?? 0,
          amount: item.purchase_invoice?.amount ?? 0,
        },
        purchase_order: {
          count: item.purchase_order?.count ?? 0,
          amount: item.purchase_order?.amount ?? 0,
        },
        pendingReminder: item.pendingReminder,
        reqExpenseAmount: item.reqExpenseAmount,
      }))
    : [];

  const filteredData = useMemo(() => {
    let data = [...dataArray];
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        data = data.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;

          const fieldStr = fieldValue.toString().toLowerCase();

          switch (matchMode) {
            case "contains":
              return fieldStr.includes(filterValue);
            case "notContains":
              return !fieldStr.includes(filterValue);
            case "startsWith":
              return fieldStr.startsWith(filterValue);
            case "endsWith":
              return fieldStr.endsWith(filterValue);
            case "equals":
              return fieldStr === filterValue;
            case "notEquals":
              return fieldStr !== filterValue;
            default:
              return true;
          }
        });
      }
    });

    if (lazyState.sortField) {
      data.sort((a, b) => {
        const aValue = getNestedValue(a, lazyState.sortField!);
        const bValue = getNestedValue(b, lazyState.sortField!);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) data.reverse();
    }
    return data;
  }, [dataArray, lazyState.filters, lazyState.sortField, lazyState.sortOrder]);

  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadTasks(0, 50, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    setPendingWork,
    debouncedSearchText,
    debouncedSearchText,
  ]);

  const loadTasks = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchPendingWork(
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        offset,
        limit,
        debouncedSearchText,
      );

      if (newData.length < limit) {
        setHasMore(false);
      }

      if (reset) {
        setCustomers(newData);
      } else {
        setCustomers((prev) => {
          const updated = [...prev];
          updated.splice(prev.length, 0, ...newData); // Append via splice on copy
          return updated;
        });
      }

      currentOffset.current = offset + newData.length;
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
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
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  const exportColumns = [
    { title: "Team Member", dataKey: "Name" },
    { title: "Quotation", dataKey: "Quotation" },
    { title: "Order", dataKey: "Sales Order" },
    { title: "Invoice", dataKey: "Sales Invoice" },
    { title: "Purchase Invoice", dataKey: "Purchase Invoice" },
    { title: "Purchase Order", dataKey: "Purchase Order" },
    { title: "Pending Reminder", dataKey: "Pending Reminder Total" },
    { title: "Requested Expense Total", dataKey: "Requested Expense Total" },
  ];

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const filteredData = getFilteredData();
    const tableData = (
      selectedCustomers.length > 0 ? selectedCustomers : filteredData
    ).map((customer) => ({
      Name: customer.username || "-",
      Quotation: `${customer.quotation?.count ?? "-"} ( ${
        customer.quotation?.amount ?? "-"
      })`,
      "Sales Order": `${customer.order?.count ?? "-"} ( ${
        customer.order?.amount ?? "-"
      })`,
      "Sales Invoice": `${customer.sell_invoice?.count ?? "-"} ( ${
        customer.sell_invoice?.amount ?? "-"
      })`,
      "Purchase Invoice": `${customer.purchase_invoice?.count ?? "-"} ( ${
        customer.purchase_invoice?.amount ?? "-"
      })`,
      "Purchase Order": `${customer.purchase_order?.count ?? "-"} ( ${
        customer.purchase_order?.amount ?? "-"
      })`,
      "Pending Reminder Total": customer.pendingReminder ?? "-",
      "Requested Expense Total": customer.reqExpenseAmount ?? "-",
    }));

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`all_Team_PendingWork_report_${new Date().getTime()}.pdf`);
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
        doc.text("Team Pending Work Report ", data.settings.margin.left, 10);
      },
    });

    doc.save(`Team_Pending_Work_Report_${new Date().getTime()}.pdf`);
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

  const exportExcel = async () => {
    try {
      setLoading(false);

      const allData = await exportAllTeamPendingWorkData(
        (offset, limit) =>
          fetchTeamPendingWorkForExport(
            filters.selectedDateArray,
            filters.checkedOptionsUser,
            MobileToken,
            getID,
            offset,
            limit,
          ),
        500,
      );

      if (!allData.length) {
        toast.warn("No data to export");
        return;
      }

      const excelRows = (
        selectedCustomers.length > 0 ? selectedCustomers : allData
      ).map((customer) => ({
        "Team Member": customer.username || "-",

        Quotation: `${customer.quotation?.count ?? 0} ( ${
          customer.quotation?.amount ?? "₹0.00"
        } )`,

        Order: `${customer.order?.count ?? 0} ( ${
          customer.order?.amount ?? "₹0.00"
        } )`,

        Invoice: `${customer.sell_invoice?.count ?? 0} ( ${
          customer.sell_invoice?.amount ?? "₹0.00"
        } )`,

        "Purchase Invoice": `${customer.purchase_invoice?.count ?? 0} ( ${
          customer.purchase_invoice?.amount ?? "₹0.00"
        } )`,
        "Purchase Order": `${customer.purchase_order?.count ?? 0} ( ${
          customer.purchase_order?.amount ?? "₹0.00"
        } )`,
        "Pending Reminder": customer.pendingReminder ?? 0,
        "Requested Expense": customer.reqExpenseAmount ?? 0,
      }));

      const worksheet = xlsx.utils.json_to_sheet(excelRows);
      worksheet["!cols"] = [
        { wpx: 180 },
        { wpx: 160 },
        { wpx: 160 },
        { wpx: 160 },
        { wpx: 160 },
        { wpx: 180 },
      ];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Team Pending Work");

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "Team_Pending_Work_Report");

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export pending work data");
    } finally {
      setLoading(false);
    }
  };

  const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(
      data,
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION,
    );
  };

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
                <th>Team Member</th>
                <th>Quotation</th>
                <th>Order</th>
                <th>Invoice</th>
                <th>Purchase Invoice</th>
                <th>Purchase Order</th>
                <th>Pending Reminder</th>
                <th>Requested Expense</th>
              </tr>
            </thead>
            <tbody>
              ${tableData
                .map(
                  (customer) => `
                <tr>
                  <td>${customer.username || "-"}</td>
                  <td>${customer.quotation?.count ?? "-"} ( ${
                    customer.quotation?.amount ?? "-"
                  })</td>
                  <td>${customer.order?.count ?? "-"} ( ${
                    customer.order?.amount ?? "-"
                  })</td>
                  <td>${customer.sell_invoice?.count ?? "-"} ( ${
                    customer.sell_invoice?.amount ?? "-"
                  })</td>
                  <td>${customer.purchase_invoice?.count ?? "-"} ( ${
                    customer.purchase_invoice?.amount ?? "-"
                  })</td>
                  <td>${customer.purchase_order?.count ?? "-"} ( ${
                    customer.purchase_order?.amount ?? "-"
                  })</td>
                  <td>${customer.pendingReminder ?? "-"}</td>
                  <td>${customer.reqExpenseAmount ?? "-"}</td>
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
          </div>
        </div>
        {/* )} */}
      </div>

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
          lazy
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          scrollable
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 52, // Adjust to your actual row height (inspect in dev tools)
            lazy: true,
            onLazyLoad: (event: { first: number; last: number }) => {
              if (event.last >= customers.length - 1 && hasMore && !loading) {
                loadTasks(currentOffset.current, 50);
              }
            },
            appendOnly: true, // Key fix: prevents DOM reset and scroll jump
            showLoader: true,
            delay: 0,
          }}
          filterDisplay="row"
          dataKey="username"
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          // onPage={onPage}
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
          <Column
            field="username"
            header={
              <span>
                Team <br /> Member
              </span>
            }
            sortable
            filter
            filterField="username"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            body={(rowData: IPendingWork) => rowData.username || "-"}
          />
          <Column
            field="quotation_total"
            header={`${quotationTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="quotation_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              whiteSpace: "pre-wrap",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) =>
              `${rowData.quotation?.count ?? "-"} ( ${
                rowData.quotation?.amount ?? "-"
              })`
            }
          />
          <Column
            field="salesOrder_total"
            header={`${orderTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="salesOrder_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              whiteSpace: "pre-wrap",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) =>
              `${rowData.order?.count ?? "-"} ( ${
                rowData.order?.amount ?? "-"
              })`
            }
          />
          <Column
            field="salesInvoice_total"
            header={`${invoiceTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="salesInvoice_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              whiteSpace: "pre-wrap",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) =>
              `${rowData.sell_invoice?.count ?? "-"} ( ${
                rowData.sell_invoice?.amount ?? "-"
              })`
            }
          />
          <Column
            field="purchaseInvoice_total"
            header={`${purchaseTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="purchaseInvoice_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              whiteSpace: "pre-wrap",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) =>
              `${rowData.purchase_invoice?.count ?? "-"} ( ${
                rowData.purchase_invoice?.amount ?? "-"
              })`
            }
          />
          <Column
            field="purchaseOrder_total"
            header={`${purchaseOrderTitle.replace(/ /g, "\n")}`}
            sortable
            filter
            filterField="purchaseOrder_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              whiteSpace: "pre-wrap",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) =>
              `${rowData.purchase_order?.count ?? "-"} ( ${
                rowData.purchase_order?.amount ?? "-"
              })`
            }
          />
          <Column
            field="pendingReminder_total"
            header={
              <span>
                Pending <br /> Reminder
              </span>
            }
            sortable
            filter
            filterField="pendingReminder_total"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) => rowData.pendingReminder ?? "-"}
          />
          <Column
            field="reqExpenseAmount"
            header={
              <span>
                Requested <br /> Expense
              </span>
            }
            sortable
            filter
            filterField="reqExpenseAmount"
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "120px",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
            bodyStyle={{ textAlign: "right" }}
            body={(rowData: IPendingWork) => rowData.reqExpenseAmount ?? "-"}
          />
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
