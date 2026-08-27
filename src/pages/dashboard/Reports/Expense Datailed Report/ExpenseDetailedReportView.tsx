import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ImageViewer from "../../../../components/ImageViewer";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCompanyStore } from "../../../../store/company/useCompanyStore";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import CreateExpenseView from "../../../left-side/header/Setting/expense/create-expense/CreateExpenseView";
import { handleDeleteExpense } from "../../../left-side/header/Setting/expense/ExpenseController";
import { ICompanyTeam } from "../../../left-side/list-company/ListCompanyController";
import { formatDateToDDMMYYYY } from "../Salary Register/SalaryRegisterReport";
import {
  fetchCompanyTeamList,
  fetchDetailedExpense,
  IExpenseDetailedReport,
} from "./ExpenseDetailedReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropsourceReportReports {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  selectedExpenseTypes?: any[] | null | string;
  selectedExpenseStatus?: any[] | null | string;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  onHide?: () => void;
}

const getNestedValue = (obj: any, path: string): any => {
  try {
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

const ExpenseDetailedReport = ({
  selectedDates,
  selectedTeamMembers,
  selectedExpenseTypes,
  selectedExpenseStatus,
  MobileToken,
  getID,
  MobileFlag,
  globalSearch,
  onHide,
}: IPropsourceReportReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [expenses, setExpenses] = useState<any[]>([]);

  const [selectAll, setSelectAll] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<
    IExpenseDetailedReport[]
  >([]);

  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);

  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const currentOffset = useRef(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 50;

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("Expense_Detailed_Report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<any>(null);
  const [sourceReport, setSourceReport] = useState<IExpenseDetailedReport[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IExpenseDetailedReport[]>>(null);
  const op = useRef<OverlayPanel>(null);
  const [selectedRow, setSelectedRow] = useState<IExpenseDetailedReport | null>(
    null,
  );

  const companyInfo = useCompanyStore((state) => state.companyInfo);

  const [editExpenseItem, setEditExpenseItem] =
    useState<IExpenseDetailedReport>();
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  const [createEditStatusFlag, setCreateEditStatusFlag] = useState<string>("");
  const [teamId, setTeamId] = useState(0);
  const [isOpenStatusModel, setIsOpenStatusModel] = useState(false);
  const [editExpenseStatusItem, setEditExpenseStatusItem] =
    useState<IExpenseDetailedReport>();
  const [statusFlag, setStatusFlag] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [deleteItemId, setDeleteItemId] = useState<number | undefined>(
    undefined,
  );
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsExportDropdownOpen(false);
    }
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
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
      checkedExpenseTypes: data?.checkedOptionsExpenseType || [],
      checkedOptionsExpenseStatus: data?.checkedOptionsExpenseStatus || [],
    };

    setFilters("Expense_Detailed_Report", updatedFilters);

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
    if (
      !filters.startSearchDate ||
      !filters.endSearchDate ||
      !filters.selectedDateArray
    ) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("Expense_Detailed_Report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const canView = useCheckUserPermission(
    PAGE_ID.EXPENSE_DETAILED_REPORT,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(PAGE_ID.EXPENSES, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(
    PAGE_ID.EXPENSES,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.EXPENSES,
    PERMISSION_TYPE.DELETE,
  );
  const canShare = useCheckUserPermission(
    PAGE_ID.EXPENSE_DETAILED_REPORT,
    PERMISSION_TYPE.SHARE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.EXPENSE_DETAILED_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      employee: { value: null, matchMode: "contains" },
      expense_date: { value: null, matchMode: "contains" },
      expense_name: { value: null, matchMode: "contains" },
      amount: { value: null, matchMode: "contains" },
      pass_amount: { value: null, matchMode: "contains" },
      remark: { value: null, matchMode: "contains" },
      status: { value: null, matchMode: "contains" },
      created_date_time: { value: null, matchMode: "contains" },
    },
  });

  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (canView) {
      offsetRef.current = 0;
      setHasMore(true);
      currentOffset.current = 0; // Fixed ref name if it was offsetRef
      setTotalRecords(0); // Reset total
      setSourceReport([]);
      setSelectedExpenses([]);
      loadMoreData(true);
    }
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    filters.checkedExpenseTypes,
    filters.checkedOptionsExpenseStatus,
    debouncedSearchText,
    canView,
  ]);

  const dataArray: IExpenseDetailedReport[] = useMemo(() => {
    return Array.isArray(sourceReport) ? sourceReport : [];
  }, [sourceReport]);

  useEffect(() => {
    // loadLazyData();
    return () => {
      if (networkTimeout.current) clearTimeout(networkTimeout.current);
    };
  }, [lazyState, sourceReport]);

  const getFilteredData = () => {
    let filteredData = [...dataArray];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;
        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;

          const fieldStr =
            typeof fieldValue === "number"
              ? fieldValue.toString()
              : fieldValue.toString().toLowerCase();

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

  const loadMoreData = async (reset = false) => {
    if (!canView) return;
    if (isFetchingRef.current) return;
    if (!hasMore && !reset) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const dateArrayToUse =
        filters.selectedDateArray && filters.selectedDateArray.length === 2
          ? filters.selectedDateArray
          : getCurrentMonthDateRange();

      const newData =
        (await fetchDetailedExpense(
          dateArrayToUse,
          filters.checkedOptionsUser,
          filters.checkedExpenseTypes,
          filters.checkedOptionsExpenseStatus,
          offsetRef.current,
          PAGE_SIZE,
          debouncedSearchText,
          MobileToken,
          getID,
          MobileFlag,
        )) || [];

      if (newData.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (reset) {
        setSourceReport(newData);
      } else {
        setSourceReport((prev) => [...prev, ...newData]);
      }

      offsetRef.current += PAGE_SIZE;
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    offsetRef.current = 0;
    setHasMore(true);
    setSourceReport([]);
    loadMoreData(true);
  };

  const handelRefreshExpense = async () => {
    if (canView) {
      offsetRef.current = 0;
      setHasMore(true);
      currentOffset.current = 0; // Fixed ref name if it was offsetRef
      setTotalRecords(0); // Reset total
      setSourceReport([]);
      setSelectedExpenses([]);
      await loadMoreData(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      fetchCompanyTeamList(setCompanyTeamLists, companyInfo.company_id);
    };

    fetchData();
  }, [companyInfo]);

  const a_application_login_id = Number(localStorage.getItem("UUID"));

  const isReportingPerson = (employeeId: number) => {
    const employee = companyTeamLists?.find((x: any) => x.id == employeeId);

    return employee?.reporting_member == a_application_login_id;
  };

  const handleEdit = (
    item: IExpenseDetailedReport,
    addUpdateStatus: string,
  ) => {
    if (canEdit) {
      setEditExpenseItem(item);
      setIsOpenEditModel(true);
      setCreateEditStatusFlag(addUpdateStatus);
    } else {
      setIsOpenEditModel(false);
      setCreateEditStatusFlag(addUpdateStatus);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleStatusChange = (
    item: IExpenseDetailedReport,
    amount: string,
    status: string,
  ) => {
    setIsOpenStatusModel(true);
    setEditExpenseStatusItem(item);
    setStatusFlag(status);
    setAmount(amount);
  };

  function openDeleteModel(ExpenseId: number | undefined) {
    if (canDelete) {
      setDeleteItemId(ExpenseId);
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openCreateProduct(addUpdateStatus: string) {
    if (canAdd) {
      setTeamId(a_application_login_id);
      setIsCreateModel(true);
      setCreateEditStatusFlag(addUpdateStatus);
    } else {
      setIsCreateModel(false);
      setCreateEditStatusFlag(addUpdateStatus);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

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

  const onSelectionChange = (event: { value: any[] }) => {
    const value = event.value || [];
    setSelectedExpenses(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectAll(true);
      setSelectedExpenses([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedExpenses([]);
    }
  };

  type ExpenseColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    bodyStyle?: React.CSSProperties;
    body: (rowData: IExpenseDetailedReport) => React.ReactNode;
  };

  const baseColumnDefs: ExpenseColumnDef[] = useMemo(
    () => [
      {
        key: "employee",
        label: "Expense By",
        header: "Expense By",
        width: "200px",
        bodyStyle: { width: "250px", textAlign: "left", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) => rowData.created_by_username || "-",
      },
      {
        key: "expense_date",
        label: "Expense Date",
        header: "Expense Date",
        width: "150px",
        bodyStyle: { width: "250px", textAlign: "center", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) =>
          rowData.expense_date ? formatDateToDDMMYYYY(rowData.expense_date) : "-",
      },
      {
        key: "expense_name",
        label: "Expense Type",
        header: "Expense Type",
        width: "200px",
        body: (rowData) => (
          <span style={{ backgroundColor: rowData.color }} className="badge rounded-pill">
            {rowData.expense_name || "-"}
          </span>
        ),
      },
      {
        key: "amount",
        label: "Amount",
        header: "Amount",
        width: "150px",
        bodyStyle: { width: "250px", textAlign: "right", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) => rowData.amount || "₹0(₹0)",
      },
      {
        key: "pass_amount",
        label: "Passed Amount",
        header: "Passed Amount",
        width: "150px",
        bodyStyle: { width: "250px", textAlign: "right", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) => rowData.pass_amount || "₹0(₹0)",
      },
      {
        key: "remark",
        label: "Remark",
        header: "Remark",
        width: "250px",
        bodyStyle: { width: "250px", textAlign: "left", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) => rowData.remark || "-",
      },
      {
        key: "status",
        label: "Status",
        header: "Status",
        width: "150px",
        bodyStyle: { width: "250px", textAlign: "left", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) => {
          const color =
            rowData.expense_status === 1
              ? "#ccc"
              : rowData.expense_status === 2
                ? "#06923E"
                : rowData.expense_status === 3
                  ? "#FF0000"
                  : "#eeeeee";

          const status =
            rowData.expense_status === 1
              ? "Pending"
              : rowData.expense_status === 2
                ? "Approved"
                : rowData.expense_status === 3
                  ? "Rejected"
                  : "-";
          return (
            <span style={{ backgroundColor: color }} className="badge rounded-pill">
              {status}
            </span>
          );
        },
      },
      {
        key: "created_date_time",
        label: "Created Date",
        header: "Created Date",
        width: "150px",
        bodyStyle: { width: "250px", textAlign: "center", paddingRight: "20px", fontSize: "14px" },
        body: (rowData) =>
          rowData.created_date_time ? formatDateToDDMMYYYY(rowData.created_date_time) : "-",
      },
      {
        key: "image",
        label: "Image",
        header: "Image",
        width: "100px",
        bodyStyle: { textAlign: "center", width: "100px" },
        body: (rowData) => {
          const visit_image = rowData.image;
          return visit_image !== null ? (
            <Button
              icon="pi pi-image"
              className="p-button-text"
              style={{ color: "green", fontSize: "18px" }}
              onClick={() => handleChangeImgViewer({ visit_image: visit_image })}
            />
          ) : (
            "-"
          );
        },
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
  } = useColumnPreferences("expense_detailed_report", baseColumnDefs);

  // "image" can't be represented in PDF/Excel/print text export — always excluded.
  const exportableColumns = visibleColumns.filter((col) => col.key !== "image");

  const getExportCellValue = (col: ExpenseColumnDef, exp: any): string => {
    switch (col.key) {
      case "employee":
        return exp.created_by_username ?? "-";
      case "expense_date":
        return exp.expense_date ?? "-";
      case "expense_name":
        return exp.expense_name ?? "-";
      case "amount":
        return exp.amount ?? "0";
      case "pass_amount":
        return exp.pass_amount ?? "0";
      case "remark":
        return exp.remark ?? "-";
      case "status":
        return exp.expense_status === 1
          ? "Pending"
          : exp.expense_status === 2
            ? "Approved"
            : exp.expense_status === 3
              ? "Rejected"
              : "-";
      case "created_date_time":
        return exp.created_date_time ?? "-";
      default:
        return "-";
    }
  };

  const exportColumns = exportableColumns.map((col) => ({
    title: col.label,
    dataKey: col.key,
  }));

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a2" });
    const filteredData = getFilteredData();
    const tableData = (
      (selectedExpenses?.length ?? 0 > 0) ? selectedExpenses : filteredData
    ).map((exp) => {
      const row: Record<string, any> = {};
      exportableColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, exp);
      });
      return row;
    });

        const totalAmount = tableData.reduce((sum, exp) => {
      const val = parseFloat(String(exp.amount).replace(/[^0-9.-]+/g, ""));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const totalPassAmount = tableData.reduce((sum, exp) => {
      const val = parseFloat(String(exp.pass_amount).replace(/[^0-9.-]+/g, ""));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    tableData.push({
      type: "Total",
      amount: totalAmount.toFixed(2),
      pass_amount: totalPassAmount.toFixed(2),
      remark: "",
      date: "",
      employee: "",
      status: "",
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`team_expense_report_${new Date().getTime()}.pdf`);
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
        doc.text("Expense Detailed Report", data.settings.margin.left, 10);
      },
    });

    doc.save(`expense_detailed_report_${new Date().getTime()}.pdf`);
  };

  const exportExcel = () => {
    const filteredData = getFilteredData();
    const exportData = (
      (selectedExpenses?.length ?? 0 > 0) ? selectedExpenses : filteredData
    ).map((exp) => {
      const row: any = {};
      exportableColumns.forEach((col) => {
        row[col.label] = getExportCellValue(col, exp);
      });
      return row;
    });

        const totalAmount = exportData.reduce((sum: number, row: any) => sum + (Number(row.Amount) || 0), 0);
    const totalPassAmount = exportData.reduce((sum: number, row: any) => sum + (Number(row["Pass Amount"]) || 0), 0);
    exportData.push({
      "Expense Type": "Total",
      Amount: totalAmount.toFixed(2),
      "Pass Amount": totalPassAmount.toFixed(2),
      Remark: "",
      Date: "",
      "Employee Name": "",
      Status: "",
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [{ wch: 30 }, { wch: 20 }];

    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAsExcelFile(excelBuffer, "expense_detailed_report");
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
      (selectedExpenses?.length ?? 0 > 0) ? selectedExpenses : filteredData;
    const printContent = `
    <html>
      <head>
        <title>Expense Detailed Report</title>
        <style>
          @page {
            size: A2 landscape;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 10mm;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          h1 {
            text-align: center;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <h1>Expense Detailed Report</h1>
        <table>
          <thead>
            <tr>
              ${exportColumns.map((col) => `<th>${col.title}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableData
              .map((exp) => {
                return `
                            <tr>
                            ${exportableColumns
                              .map((col) => `<td>${getExportCellValue(col, exp)}</td>`)
                              .join("")}
                            </tr>
                        `;
              })
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

  const handleDownloadImage = (
    imageUrl: string,
    fileName: string = "expense-image",
  ) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChangeImgViewer = (item: any) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  const actionBodyTemplate = (rowData: IExpenseDetailedReport) => {
    return (
      <Button
        icon="pi pi-cog"
        className="p-button-text"
        style={{
          color: "green",
        }}
        onClick={(e) => {
          setSelectedRow({
            ...rowData,
            amount: rowData.amount.split(" ")[1] || "0",
            pass_amount: rowData.pass_amount.split(" ")[1] || "0",
          });
          op.current?.toggle(e);

          requestAnimationFrame(() => {
            const panel = op.current?.getElement();

            if (panel) {
              panel.style.transform = "translate(50px, -25px)";
            }
          });
        }}
      />
    );
  };

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Expense Detailed Report
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PrimeReactProvider>
      <div>
        {canView ? (
          <div>
            <div
              className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
            >
              <h3
                style={{
                  fontSize: "20px",
                  paddingLeft: MobileFlag ? "10px" : "",
                }}
                className="dash-board-text-count"
              >
                Expense Detailed Report
              </h3>
              <br />
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
                  <Button
                    icon="pi pi-plus"
                    className="report_button"
                    style={{ backgroundColor: "rgb(245, 134, 52)" }}
                    rounded
                    onClick={() => openCreateProduct("createEdit")}
                    tooltip={`Add Contact`}
                    tooltipOptions={{
                      position: "top",
                      style: {
                        fontSize: "14px",
                      },
                    }}
                  />
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
                      top: "0",
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

                        if (dataArray.length === 0) return;

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

                        if (dataArray.length === 0) return;

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

                        if (dataArray.length === 0) return;

                        canPrint
                          ? printTable()
                          : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                      }}
                    >
                      <i
                        className="pi pi-print"
                        style={{ marginRight: "4px" }}
                      />
                      Print
                    </li>
                  </ul>

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
                value={dataArray}
                lazy
                resizableColumns
                columnResizeMode="fit"
                className="custom-centered-table"
                scrollable
                scrollHeight="80vh"
                filterDisplay="row"
                dataKey="id"
                virtualScrollerOptions={{
                  itemSize: 52,
                  lazy: true,
                  onLazyLoad: (event: { first: number; last: number }) => {
                    if (
                      event.last >= expenses.length - 1 &&
                      hasMore &&
                      !loading
                    ) {
                      loadMoreData();
                    }
                  },
                  appendOnly: true,
                  showLoader: false,
                  delay: 0,
                }}
                onSort={onSort}
                sortField={lazyState.sortField ?? undefined}
                sortOrder={lazyState.sortOrder}
                sortMode="single"
                onFilter={onFilter}
                filters={lazyState.filters}
                loading={loading}
                selection={selectedExpenses}
                onSelectionChange={onSelectionChange}
                selectAll={selectAll}
                onSelectAllChange={onSelectAllChange}
                selectionMode="multiple"
                tableStyle={{ tableLayout: "fixed", width: "100%" }}
                emptyMessage="No data found"
              >
                {(!MobileFlag ||
                  MobileFlag === undefined ||
                  MobileFlag === null) && (
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
                  field="actions"
                  headerClassName="center-header"
                  headerStyle={{
                    width: "55px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                  body={actionBodyTemplate}
                />
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
                      width: col.width || "150px",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      background: "#f8f9fa",
                      fontSize: "14px",
                    }}
                    bodyStyle={col.bodyStyle || { fontSize: "14px" }}
                    body={col.body}
                  />
                ))}
              </DataTable>
              <OverlayPanel ref={op} className="action-overlay">
                <ul className="list-unstyled m-0 p-0" id="dropLeft">
                  {selectedRow?.expense_status === 1 && (
                    <>
                      <li
                        className="listItem text-start"
                        role="button"
                        style={{
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!selectedRow) return;

                          setTeamId(selectedRow.a_application_login_id);

                          handleEdit(selectedRow, "createEdit");
                          op.current?.hide();
                        }}
                      >
                        Edit
                      </li>
                    </>
                  )}
                  {(selectedRow?.companyFlag === 1 ||
                    isReportingPerson(
                      selectedRow?.a_application_login_id || 0,
                    )) && (
                    <>
                      {selectedRow?.expense_status === 1 && (
                        <>
                          <li
                            className="listItem text-start"
                            role="button"
                            style={{
                              padding: "5px 10px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (!selectedRow) return;

                              setTeamId(selectedRow.a_application_login_id);

                              handleStatusChange(
                                selectedRow,
                                selectedRow.amount,
                                "pass",
                              );
                              op.current?.hide();
                            }}
                          >
                            Pass status
                          </li>

                          <li
                            className="listItem text-start"
                            role="button"
                            style={{
                              padding: "5px 10px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (!selectedRow) return;

                              setTeamId(selectedRow.a_application_login_id);

                              handleStatusChange(
                                selectedRow,
                                selectedRow.amount,
                                "reject",
                              );
                              op.current?.hide();
                            }}
                          >
                            Reject status
                          </li>
                        </>
                      )}
                    </>
                  )}
                  {(selectedRow?.expense_status === 1 ||
                    selectedRow?.companyFlag === 1) && (
                    <>
                      <li
                        className="listItem text-start"
                        role="button"
                        style={{
                          color: "red",
                          fontWeight: 600,
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!selectedRow) return;

                          setTeamId(selectedRow.a_application_login_id);

                          openDeleteModel(selectedRow.id);
                          op.current?.hide();
                        }}
                      >
                        Delete
                      </li>
                    </>
                  )}
                </ul>
              </OverlayPanel>
            </div>
          </div>
        ) : (
          <p className="text-danger p-1">{DEFAULT_MESSAGE_ERROR_PERMISSION}</p>
        )}
        <div
          style={{
            padding: "10px",
            background: "#f8f9fa",
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <b>Total Expenses: {dataArray.length}</b>
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
            filtersToShow={[1, 5, 27, 28]}
            pageId={1}
            initialFilterData={{
              ...filters.filterData,
            }}
            initialCheckedOptions={filters.checkedOptions}
            initialStartSearchDate={filters.startSearchDate}
            initialEndSearchDate={filters.endSearchDate}
            initialCheckedOptionsUser={filters.checkedOptionsUser}
            initialCheckedExpenseTypes={filters.checkedExpenseTypes}
            initialCheckedOptionsExpenseStatus={
              filters.checkedOptionsExpenseStatus
            }
            isApplyReport={1}
          />
        )}
        {viewerOpen && (
          <ImageViewer
            image={imageViewData}
            onClose={() => setViewerOpen(false)}
          />
        )}
        {isOpenCreateModel && (
          <CreateExpenseView
            show={isOpenCreateModel}
            createEditFlag={createEditStatusFlag}
            onHide={() => setIsCreateModel(false)}
            expenseToEdit={undefined}
            headerName="Create Expense"
            handelRefreshExpense={handelRefreshExpense}
            team_id={teamId}
          />
        )}
        {isOpenEditModel && (
          <CreateExpenseView
            show={isOpenEditModel}
            createEditFlag={createEditStatusFlag}
            onHide={() => setIsOpenEditModel(false)}
            expenseToEdit={editExpenseItem}
            headerName="Edit Expense"
            handelRefreshExpense={handelRefreshExpense}
            team_id={teamId}
          />
        )}
        {isOpenStatusModel && (
          <CreateExpenseView
            show={isOpenStatusModel}
            onHide={() => setIsOpenStatusModel(false)}
            expenseToEdit={editExpenseStatusItem}
            headerName={`${statusFlag} Status`}
            handelRefreshExpense={handelRefreshExpense}
            status={statusFlag}
            pass_amount={amount}
            team_id={teamId}
          />
        )}
        {isDeleteConfirmation && (
          <ConfirmationModal
            show={isDeleteConfirmation}
            onHide={() => {
              setIsDeleteConfirmation(false);
              setDeleteItemId(undefined);
            }}
            handleSubmit={() => {
              if (deleteItemId !== undefined) {
                handleDeleteExpense(
                  deleteItemId,
                  setIsDeleteConfirmation,
                  setLoading,
                  setSourceReport,
                  teamId,
                );
                setDeleteItemId(undefined);
              }
            }}
            title={"Delete this Product"}
            message={"Are You Sure You Want To Delete This Product?"}
            btn1="CANCEL"
            btn2="DELETE"
          />
        )}
      </div>
    </PrimeReactProvider>
  );
};

export default ExpenseDetailedReport;
