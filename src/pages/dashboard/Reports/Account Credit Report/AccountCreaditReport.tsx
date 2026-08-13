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
  type DataTableFilterMetaData,
  type DataTableOperatorFilterMetaData,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { PDFaccountv1 } from "../../../right-side/list-account-transaction/ListAccounTransactionController";
import {
  exportAccountCreditData,
  fetchAccountTransactions,
  IAccountTransaction,
} from "./AccountCreditReportController";

interface IPropAccountOutstandingReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedTeamMembers?: string[] | null;
  globalSearch?: string;
  credit_debit_flag?: number; // Now expected to be used only for credit (e.g., 1 = credit)
  selectedContactId?: string | null;
  referenceWiseContact?: number;
  onHide?: () => void;
}

const getFilterValue = (
  meta: DataTableFilterMetaData | DataTableOperatorFilterMetaData,
): string | null => {
  if ("value" in meta) {
    return meta.value as string | null;
  }
  if ("constraints" in meta) {
    const constraints = Object.values(meta.constraints);
    return constraints.length > 0
      ? (constraints[0].value as string | null)
      : null;
  }
  return null;
};

interface LazyState {
  first: number;
  rows: number;
  page: number;
  sortField: string | null;
  sortOrder: SortOrder | null;
  filters: DataTableFilterMeta;
}

const AccountCreaditReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  selectedTeamMembers,
  globalSearch,
  credit_debit_flag,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IPropAccountOutstandingReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedTransactions, setSelectedTransactions] = useState<
    IAccountTransaction[]
  >([]);
  const [selectAll, setSelectAll] = useState(false);

  const [transactions, setTransactions] = useState<IAccountTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    IAccountTransaction[]
  >([]);
  const [apiParams, setApiParams] = useState({ ul: 0, ll: 50 });
  const [currencyName, setCurrencyName] = useState<any>();

  const isPaginationCall = useRef(false);
  const dt = useRef<DataTable<IAccountTransaction[]>>(null);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const currentOffset = useRef(0);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();
  const filters = getFilter("account_credit_report");
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

    setFilters("account_credit_report", updatedFilters);

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

      setFilters("account_credit_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const canShareAccount = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintAccount = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyState>({
    first: 0,
    rows: 50,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      // id: { value: null, matchMode: "contains" },
      acc_series: { value: null, matchMode: "contains" },
      contact_masters_id: { value: null, matchMode: "contains" },
      typeItem: { value: null, matchMode: "contains" },
      modeItem: { value: null, matchMode: "contains" },
      amount: { value: null, matchMode: "contains" },
      payment_date_time: { value: null, matchMode: "contains" },
      approved_name: { value: null, matchMode: "contains" },
      remark: { value: null, matchMode: "contains" },
    },
  });
  useEffect(() => {
    if (!Array.isArray(transactions)) {
      setFilteredTransactions([]);
      setTotalRecords(0);
      return;
    }

    // Only include Credit transactions
    let result = transactions.filter(
      (txn) => txn.typeItem?.toLowerCase() === "credit",
    );

    // Apply column filters
    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      const filterValue = getFilterValue(meta);
      if (filterValue !== null && filterValue !== "") {
        const value = filterValue.toString().toLowerCase();
        result = result.filter((item) => {
          const fieldValue = item[field as keyof IAccountTransaction];
          if (fieldValue == null) return false;
          return fieldValue.toString().toLowerCase().includes(value);
        });
      }
    });

    // Apply sorting
    if (lazyState.sortField) {
      result.sort((a, b) => {
        const aValue = a[lazyState.sortField as keyof IAccountTransaction];
        const bValue = b[lazyState.sortField as keyof IAccountTransaction];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        else if (aValue < bValue) comparison = -1;
        return lazyState.sortOrder === -1 ? -comparison : comparison;
      });
    }

    setFilteredTransactions(result);
    setTotalRecords(result.length);
  }, [transactions, lazyState]);

  // const onPage = async (event: DataTablePageEvent) => {
  //   const currentPage = event.page ?? 0;
  //   const ll = (currentPage + 1) * 50;
  //   const ul = 50;

  //   isPaginationCall.current = true;

  //   setLazyState((prev) => ({
  //     ...prev,
  //     first: event.first,
  //     rows: event.rows,
  //     page: currentPage,
  //   }));

  //   setApiParams({ ul, ll });
  //   setLoading(true);

  //   try {
  //     await fetchAccountTransactions(
  //       setTransactions,
  //       selectedDates,
  //       MobileToken,
  //       getID,
  //       MobileFlag,
  //       selectedTeamMembers,
  //       ul,
  //       ll,
  //       debouncedGlobalSearch,
  //       credit_debit_flag
  //     );
  //     setLoading(false);
  //   } catch (err) {
  //     console.error("Error fetching paginated data:", err);
  //     setLoading(false);
  //   } finally {
  //     setTimeout(() => {
  //       isPaginationCall.current = false;
  //     }, 100);
  //   }
  // };

  useEffect(() => {
    setTransactions([]);
    setSelectedTransactions([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadAccountData(0, 50, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
    credit_debit_flag,
    filters.selectedContactId,
    filters.referenceWiseContact,
    filters.checkedOptionsPaymentBy,
  ]);

  const loadAccountData = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchAccountTransactions(
        filters.selectedDateArray,
        MobileToken,
        getID,
        MobileFlag,
        filters.checkedOptionsUser,
        offset,
        limit,
        debouncedSearchText,
        credit_debit_flag,
        setCurrencyName,
        filters.selectedContactId,
        filters.referenceWiseContact,
        filters.checkedOptionsPaymentBy,
      );
      if (newData.length < limit) {
        setHasMore(false);
      }

      if (reset) {
        setTransactions(newData);
      } else {
        setTransactions((prev) => {
          const updated = [...prev];
          updated.splice(prev.length, 0, ...newData);
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
      sortField: event.sortField as string,
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

  const onSelectionChange = (event: { value: IAccountTransaction[] }) => {
    const value = event.value;
    setSelectedTransactions(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedTransactions([...filteredTransactions]);
    } else {
      setSelectAll(false);
      setSelectedTransactions([]);
    }
  };

  const openPrint = (id: number) => {
    let baseURL = window.location.origin;
    const printUrl = `${baseURL}/AccountPrintView1/${id}`;
    const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

    if (myWindow) {
      let isPrinted = false;
      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          if (myWindow.document.readyState === "complete") {
            clearInterval(checkContent);
            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
                myWindow.onafterprint = () => myWindow.close();
              }, 2000);
            }
          }
        }, 100);
      };
      setTimeout(() => {
        if (!isPrinted) myWindow.close();
      }, 10000);
    }
  };

  // Only sum Credit amounts
  const totalCreditAmount = filteredTransactions.reduce(
    (acc, txn) => {
      const match = txn.amountwithcurrency?.match(
        /^([^\d\s]*[\s]*)?([\d,]+\.?\d*)/,
      );
      const symbol = match?.[1]?.trim() || "₹";
      const numericValue = parseFloat(match?.[2]?.replace(/,/g, "") || "0");

      if (!acc.symbol && symbol && !/^\d+$/.test(symbol)) {
        acc.symbol = symbol;
      }

      return { total: acc.total + numericValue, symbol: acc.symbol || symbol };
    },
    { total: 0, symbol: "₹" },
  );

  const { total: finalBalance, symbol: balanceSymbol } = totalCreditAmount;

  const getExportData = () => {
    const start = lazyState.first;
    const end = start + lazyState.rows;
    return filteredTransactions.slice(start, end);
  };

  const formatDateTime = (dateStr: string | undefined | null): string => {
    if (
      !dateStr ||
      dateStr === "-" ||
      dateStr.includes("undefined") ||
      dateStr.includes("0000-00-00")
    ) {
      return "-";
    }

    try {
      let date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        const parts = dateStr.match(
          /(\d+)[-/](\d+)[-/](\d+)\s+(\d+):(\d+):?(\d+)?/,
        );

        if (parts) {
          let year: number, month: number, day: number;

          if (parts[1].length === 4) {
            year = Number(parts[1]);
            month = Number(parts[2]);
            day = Number(parts[3]);
          } else {
            day = Number(parts[1]);
            month = Number(parts[2]);
            year = Number(parts[3]);
          }

          const hours = Number(parts[4]);
          const minutes = Number(parts[5]);
          const seconds = parts[6] ? Number(parts[6]) : 0;

          date = new Date(year, month - 1, day, hours, minutes, seconds);
        }
      }

      if (isNaN(date.getTime())) return "-";

      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yyyy = String(date.getFullYear());

      const hh = String(date.getHours()).padStart(2, "0");
      const mins = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");

      return `${dd}/${mm}/${yyyy} - ${hh}:${mins}:${ss}`;
    } catch (error) {
      return "-";
    }
  };

  type AccountColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body?: (rowData: IAccountTransaction) => React.ReactNode;
  };

  const baseColumnDefs: AccountColumnDef[] = useMemo(
    () => [
      {
        key: "acc_series",
        label: "ID",
        header: "ID",
        width: "80px",
      },
      {
        key: "contact_masters_id",
        label: "Contact Details",
        header: (
          <span>
            Contact <br /> Details
          </span>
        ),
        body: (rowData) => {
          const company = rowData.contact_companyName || "";
          const contact = rowData.contact_name || "";
          const mobile = rowData.contact_mobileNumber || "";
          let parts = [];
          if (company || contact)
            parts.push(
              company && contact
                ? `${company} (${contact})`
                : company || contact,
            );
          if (mobile) parts.push(mobile);
          return parts.length > 0 ? parts.join(" - ") : "-";
        },
      },
      {
        key: "typeItem",
        label: "Payment Type",
        header: (
          <span>
            Payment <br /> Type
          </span>
        ),
        body: () => (
          <span style={{ color: "green", fontWeight: "bold" }}>Credit</span>
        ),
      },
      {
        key: "modeItem",
        label: "Payment Mode",
        header: (
          <span>
            Payment <br /> Mode
          </span>
        ),
      },
      {
        key: "amount",
        label: "Amount",
        header: "Amount",
        body: (rowData) =>
          rowData.amountwithcurrency ||
          `₹${rowData.amount?.toLocaleString() || "0.00"}`,
      },
      {
        key: "payment_date_time",
        label: "Payment Date & Time",
        header: (
          <span>
            Payment <br />
            Date & Time
          </span>
        ),
        body: (rowData) => rowData.payment_date_time || "-",
      },
      {
        key: "approved_name",
        label: "Approved By",
        header: (
          <span>
            Approved <br /> By
          </span>
        ),
        body: (rowData) => rowData.approved_name || "-",
      },
      {
        key: "remark",
        label: "Remark",
        header: "Remark",
        body: (rowData) => (
          <div
            dangerouslySetInnerHTML={{ __html: rowData.remark || "-" }}
          />
        ),
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
  } = useColumnPreferences("account_credit_report", baseColumnDefs);

  const getExportCellValue = (
    col: AccountColumnDef,
    txn: IAccountTransaction,
  ): string => {
    switch (col.key) {
      case "contact_masters_id": {
        const company = txn.contact_companyName || "";
        const contact = txn.contact_name || "";
        const mobile = txn.contact_mobileNumber || "";
        const parts: string[] = [];
        if (company || contact) {
          parts.push(
            company && contact ? `${company} (${contact})` : company || contact,
          );
        }
        if (mobile) parts.push(mobile);
        return parts.length > 0 ? parts.join(" - ") : "-";
      }
      case "typeItem":
        return "Credit";
      case "amount":
        return (
          txn.amountwithcurrency ||
          `₹${txn.amount?.toLocaleString() || "0.00"}`
        );
      case "payment_date_time":
        return formatDateTime(txn.payment_date_time);
      case "remark":
        return (
          (txn.remark || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") ||
          "-"
        );
      default:
        return (txn as any)[col.key] ?? "-";
    }
  };

  const exportPdf = () => {
    const dataToExport =
      selectedTransactions.length > 0 ? selectedTransactions : getExportData();

    const tableData = dataToExport.map((txn) => {
      const row: any = {};
      visibleColumns.forEach((col) => {
        row[col.key] = getExportCellValue(col, txn);
      });
      return row;
    });

    if (tableData.length === 0) {
      const doc = new jsPDF();
      doc.text("No credit transactions available", 10, 10);
      doc.save(`credit_report_${Date.now()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: () => {
        doc.setFontSize(16);
        doc.text("Account Credit Report", 14, 15);
      },
    });
    doc.save(`credit_report_${Date.now()}.pdf`);
  };

  // const formatDate = (value: any) => {
  //   if (!value) return "";
  //   const date = new Date(value);
  //   // return isNaN(date.getTime())
  //   //   ? ""
  //   //   : date.toISOString().split("T")[0];
  // };

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

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allTransactions =
        await exportAccountCreditData<IAccountTransaction>(
          (offset, limit) =>
            fetchAccountTransactions(
              filters.selectedDateArray,
              MobileToken,
              getID,
              MobileFlag,
              filters.checkedOptionsUser,
              offset,
              limit,
              debouncedSearchText,
              credit_debit_flag,
              setCurrencyName,
              filters.selectedContactId,
              undefined,
              filters.checkedOptionsPaymentBy,
            ),
          500,
        );

      if (!allTransactions.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedTransactions.length > 0 ? selectedTransactions : allTransactions
      ).map((txn) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, txn);
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 25 }));

      const workbook = {
        Sheets: { Transactions: worksheet },
        SheetNames: ["Transactions"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "account_transactions_full");
    } catch (error) {
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  const printTable = () => {
    const dataExport = getExportData();
    const data =
      selectedTransactions.length > 0 ? selectedTransactions : dataExport;
    const printContent = `
      <html>
        <head>
          <title>Credit Report</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Account Credit Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (txn) => `
                <tr>
                  ${visibleColumns
                    .map(
                      (col) => `<td>${getExportCellValue(col, txn)}</td>`,
                    )
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div style="margin-top: 30px; text-align: right; font-weight: bold;">
            Total Credit: ${balanceSymbol} ${finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Cr)
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win?.document.write(printContent);
    win?.document.close();
    win?.print();
  };

  const paginatedData = filteredTransactions.slice(
    lazyState.first,
    lazyState.first + lazyState.rows,
  );

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Account Credit
        </h3>

        {!MobileFlag && (
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

                      if (transactions.length === 0) return;

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

                      if (transactions.length === 0) return;

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

                      if (transactions.length === 0) return;

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

              <ColumnsButton
                columns={orderedColumns}
                hiddenKeys={hiddenKeys}
                onToggle={toggleColumn}
                onReorder={reorderColumns}
                onReset={resetColumns}
              />
            </div>
          </div>
        )}
      </div>

      <div className="report_card" style={{ height: "90vh" }}>
        <DataTable
          ref={dt}
          value={transactions}
          totalRecords={totalRecords}
          lazy
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollable
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 52, // Adjust to your actual row height (inspect in dev tools)
            lazy: true,
            onLazyLoad: (event: { first: number; last: number }) => {
              if (
                event.last >= transactions.length - 1 &&
                hasMore &&
                !loading
              ) {
                loadAccountData(currentOffset.current, 50);
              }
            },
            appendOnly: true, // Key fix: prevents DOM reset and scroll jump
            showLoader: true,
            delay: 0,
          }}
          rows={lazyState.rows}
          first={lazyState.first}
          // onPage={onPage}
          onSort={onSort}
          selection={selectedTransactions}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          sortOrder={lazyState.sortOrder}
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          tableStyle={{ minWidth: "80rem" }}
          footer={
            <div
              className="closing-balance-footer"
              style={{
                fontWeight: "bold",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                textAlign: "right",
                borderTop: "2px solid #dee2e6",
                position: "sticky",
                bottom: 0,
                zIndex: 1,
              }}
            >
              Total Credit Balance:
              <span style={{ color: "green", marginLeft: "8px" }}>
                {balanceSymbol}{" "}
                {finalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                (Cr)
              </span>
            </div>
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

          {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && (
            <Column
              field="actions"
              header="Actions"
              headerStyle={{
                width: "165px",
                textAlign: "center",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              body={(rowData: any) => (
                <div>
                  <svg
                    style={{ marginRight: "15px", cursor: "pointer" }}
                    onClick={() => {
                      if (canShareAccount) {
                        PDFaccountv1(rowData.id, () => {});
                      } else {
                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                      }
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="green"
                  >
                    <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                  </svg>

                  <svg
                    style={{ marginRight: "15px", cursor: "pointer" }}
                    onClick={() => {
                      if (canPrintAccount) {
                        openPrint(rowData.id);
                      } else {
                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                      }
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    height="22px"
                    viewBox="0 -960 960 960"
                    width="22px"
                    fill="green"
                  >
                    <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" />
                  </svg>
                </div>
              )}
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
              bodyStyle={{
                fontSize: "14px",
                textAlign: col.key === "amount" ? "right" : undefined,
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
          filtersToShow={[1, 5, 18, 26]}
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
          initialcheckedPaymentBy={filters.checkedOptionsPaymentBy}
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

export default AccountCreaditReport;
