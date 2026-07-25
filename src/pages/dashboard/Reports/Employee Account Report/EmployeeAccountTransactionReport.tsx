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
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportAccountReport,
  fetchEmployeeAccountTransactions,
  IEmployeeAccountTransaction,
  PDFemployeeAccountv1,
} from "./EmployeeAccountTransactionReportController";

interface IPropAccountOutstandingReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedTeamMembers?: string[] | null;
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

const EmployeeTransactionReports = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  selectedTeamMembers,
  onHide,
}: IPropAccountOutstandingReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedTransactions, setSelectedTransactions] = useState<
    IEmployeeAccountTransaction[]
  >([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isPDFDownloadLoading, setIsPDFDownloadLoading] =
    useState<boolean>(false);
  const [currencyName, setCurrencyName] = useState<any>();

  const [transactions, setTransactions] = useState<
    IEmployeeAccountTransaction[]
  >([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    IEmployeeAccountTransaction[]
  >([]);
  const [apiParams, setApiParams] = useState({ ul: 0, ll: 50 });
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const currentOffset = useRef(0);

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
      created_name: { value: null, matchMode: "contains" },
      remark: { value: null, matchMode: "contains" },
    },
  });

  const [hasData, setHasData] = useState<boolean>(false);
  const { filters, setFilters, setFilter } = useCommonFilterStore();
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const canShareAccount = useCheckUserPermission(
    PAGE_ID.EMP_ACCOUNT_HISTORY,
    PERMISSION_TYPE.SHARE,
  );

  const canPrintAccount = useCheckUserPermission(
    PAGE_ID.EMP_ACCOUNT_HISTORY,
    PERMISSION_TYPE.PRINT,
  );

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

    setFilters(updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
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

      setFilters({
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

  const dt = useRef<DataTable<IEmployeeAccountTransaction[]>>(null);

  useEffect(() => {
    if (!Array.isArray(transactions)) {
      console.warn("Transactions is not an array:", transactions);
      setFilteredTransactions([]);
      setTotalRecords(0);
      return;
    }

    let result = [...transactions];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      const filterValue = getFilterValue(meta);
      if (filterValue !== null && filterValue !== "") {
        const value = filterValue.toString().toLowerCase();
        result = result.filter((item) => {
          const fieldValue = item[field as keyof IEmployeeAccountTransaction];
          if (fieldValue == null) return false;
          return fieldValue.toString().toLowerCase().includes(value);
        });
      }
    });

    if (lazyState.sortField) {
      result.sort((a, b) => {
        const aValue =
          a[lazyState.sortField as keyof IEmployeeAccountTransaction];
        const bValue =
          b[lazyState.sortField as keyof IEmployeeAccountTransaction];

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

  useEffect(() => {
    setTransactions([]);
    setSelectedTransactions([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadAccountData(0, 50, true);
  }, [filters.selectedDateArray, filters.checkedOptionsUser]);

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
      const newData = await fetchEmployeeAccountTransactions(
        filters.selectedDateArray,
        MobileToken,
        getID,
        MobileFlag,
        filters.checkedOptionsUser,
        offset,
        limit,
        setCurrencyName,
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

  const onSelectionChange = (event: {
    value: IEmployeeAccountTransaction[];
  }) => {
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

  //   const openPrint = (id: number) => {
  //     // openInNewTabPrint(`/OrderPrintViewV${viewFormate}`, id);
  //     let baseURL = window.location.origin;
  //     const printUrl = `${baseURL}/AccountPrintView1/${id}`;
  //     const myWindow = window.open(
  //       printUrl,
  //       "_blank",
  //       "width=1000,height=1000"
  //     );

  //     if (myWindow) {
  //       let isPrinted = false;
  //       myWindow.onload = () => {
  //         const checkContent = setInterval(() => {
  //           const contentElement =
  //             myWindow.document.querySelector("body > *");
  //           if (
  //             contentElement &&
  //             myWindow.document.readyState === "complete"
  //           ) {
  //             clearInterval(checkContent);

  //             if (!isPrinted) {
  //               isPrinted = true;
  //               setTimeout(() => {
  //                 myWindow.print();
  //               }, 2000);
  //               myWindow.onafterprint = () => {
  //                 myWindow.close();
  //               };
  //               myWindow.addEventListener("afterprint", () => {
  //                 myWindow.close();
  //               });
  //             }
  //           } else {
  //             console.log("waiting...");
  //           }
  //         }, 100);
  //       };
  //       myWindow.addEventListener("beforeunload", () => {
  //         if (!isPrinted) {
  //           isPrinted = true;
  //         }
  //       });
  //       setTimeout(() => {
  //         if (!isPrinted) {
  //           myWindow.close();
  //         }
  //       }, 10000);
  //     } else {
  //       console.error("Failed to open print");
  //     }
  //   };

  const finalBalanceInfo = filteredTransactions.reduce(
    (acc, txn) => {
      // Extract number and symbol from amountswithcurrency (e.g., "$ 500.00" → symbol: "$", value: 500)
      const match = txn.amountwithcurrency?.match(
        /^([^\d\s]*[\s]*)?([\d,]+\.?\d*)/,
      );
      const symbol = match?.[1]?.trim() || "₹"; // fallback to ₹
      const numericValue = parseFloat(match?.[2]?.replace(/,/g, "") || "0");

      if (txn.typeItem?.toLowerCase() === "credit") {
        acc.total += numericValue;
      } else if (txn.typeItem?.toLowerCase() === "debit") {
        acc.total -= numericValue;
      }

      // Remember the symbol (prefer non-empty, non-numeric symbol)
      if (!acc.symbol && symbol && !/^\d+$/.test(symbol)) {
        acc.symbol = symbol;
      }

      return acc;
    },
    { total: 0, symbol: "" },
  );

  const { total: finalBalance, symbol: balanceSymbol } = finalBalanceInfo;

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

  const exportPdf = () => {
    const dataToExport =
      selectedTransactions.length > 0 ? selectedTransactions : getExportData();

    const tableData = dataToExport.map((txn) => ({
      ID: txn.acc_series || "-",
      "Employee Name": `(${txn.username})` || "-",
      "Contact Phone": txn.recovery_mobile || "-",
      "Payment Type": txn.typeItem,
      "Payment Mode": txn.modeItem,
      [`Amount (${currencyName})`]:
        txn.amountwithoutcurrency || `${txn.amount}`,
      "Payment Date & Time": `${formatDateTime(txn.payment_date_time)}`,
      // "Approver ID": txn.approve_by_a_application_login_id,
      "Approved By": txn.approved_name || "-",
      "Created By": txn.created_name || "-",
      Remark:
        txn.remark.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") || "-",
      // "Approve Date": txn.approve_date_time
      //   ? new Date(txn.approve_date_time).toLocaleDateString()
      //   : "-",
      // "Ref ID": txn.reference_id,
      // "Ref Table": txn.reference_table || "-",
      // "Created At": new Date(txn.created_date_time).toLocaleDateString(),
      // "Timestamp": new Date(txn.s_timestemp).toLocaleDateString(),
      // "Is Active": txn.isActive === 1 ? "Yes" : "No",
    }));

    if (tableData.length === 0) {
      const doc = new jsPDF();
      doc.text("No data available", 10, 10);
      doc.save(`employee_account_transactions_${Date.now()}.pdf`);
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    autoTable(doc, {
      head: [Object.keys(tableData[0])],
      body: tableData.map((row) => Object.values(row)),
      theme: "grid",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: () => {
        doc.setFontSize(16);
        doc.text("Employee Account Transactions Report", 14, 15);
      },
    });
    doc.save(`employee_account_transactions_${Date.now()}.pdf`);
  };

  const formatDate = (value: any) => {
    console.log("aaaaa", value);
    if (!value) return "";
    const date = new Date(value);
    return date.getTime();
    // return isNaN(date.getTime())
    //   ? ""
    //   : date.toISOString().split("T")[0];
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

  const exportExcel = async () => {
    try {
      setLoading(false);

      const allTransactions =
        await exportAccountReport<IEmployeeAccountTransaction>(
          (offset, limit) =>
            fetchEmployeeAccountTransactions(
              filters.selectedDateArray,
              MobileToken,
              getID,
              MobileFlag,
              filters.checkedOptionsUser,
              offset,
              limit,
              setCurrencyName,
            ),
          500,
        );

      if (!allTransactions.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedTransactions.length > 0 ? selectedTransactions : allTransactions
      ).map((txn) => ({
        ID: txn.acc_series ?? "-",
        "Contact Name": txn.username ?? "",
        "Contact Phone": txn.recovery_mobile ?? "-",
        "Payment Type": txn.typeItem ?? "-",
        "Payment Mode": txn.modeItem ?? "-",
        [`Amount (${currencyName})`]:
          txn.amountwithoutcurrency || txn.amount || "-",
        "Payment Date & Time": `${formatDateTime(txn.payment_date_time)}`,
        "Approved By": txn.approved_name ?? "-",
        "Created By": txn.created_name ?? "-",
        Remark:
          txn.remark.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") ??
          "-",
      }));

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

      saveAsExcelFile(excelBuffer, "employee_account_transactions_full");
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
          <title>Employee Account Transactions</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Employee Account Transactions</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Contact Details</th>
                <th>Payment Type</th>
                <th>Payment Mode</th>
                <th>Amount (${currencyName})</th>
                <th>Payment Date & Time</th>
                <th>Approved By</th>
                <th>Created By</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (txn) => `
                <tr>
                  <td>${txn.acc_series || "-"}</td>
      <td>${
        [txn.username, txn.recovery_mobile].filter(Boolean).join(" - ") || "-"
      }</td>
                  <td>${txn.typeItem}</td>
                  <td>${txn.modeItem}</td>
                  <td>${txn.amountwithoutcurrency || `${txn.amount}`}</td>
                  <td>${formatDateTime(txn.payment_date_time)}</td>
                  <td>${txn.approved_name || "-"}</td>
                  <td>${txn.created_name || "-"}</td>
                  <td>${txn.remark || "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win?.document.write(printContent);
    win?.document.close();
    win?.print();
  };

  const openPrint = (id: number) => {
    // openInNewTabPrint(`/OrderPrintViewV${viewFormate}`, id);
    let baseURL = window.location.origin;
    const printUrl = `${baseURL}/EmployeeAccountPrintView1/${id}`;
    const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

    if (myWindow) {
      let isPrinted = false;
      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 2000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
            console.log("waiting...");
          }
        }, 100);
      };
      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });
      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    } else {
      console.error("Failed to open print");
    }
  };

  // const paginatedData = filteredTransactions.slice(lazyState.first, lazyState.first + lazyState.rows);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Employee Account Transactions
        </h3>

        {!MobileFlag && (
          <div
            className="d-flex gap-2 align-items-center"
            style={{ position: "relative" }}
          >
            {/* <div
              style={{
                width: "300px",
                zIndex: "999",
                position: "relative",
              }}
            >
              <input
                ref={searchInputRef}
                type="text"
                className="form-control"
                placeholder="Search Anything for This Report"
                style={{ width: "300px", marginTop: "10px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGlobalSearch();
                  }
                }}
              />
              {globalSearchText && (
                <span className="clear-icon" onClick={() => {
                  setGlobalSearchText("")
                  if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                  }
                }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                  </svg>
                </span>
              )}
            </div> */}
            {/* <Button
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
            /> */}
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
                bottom: "-110px",
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
                <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
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
          // sortField={lazyState.sortField}
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
              Closing Balance:
              <span
                style={{
                  color: finalBalance >= 0 ? "green" : "red",
                  marginLeft: "8px",
                }}
              >
                {balanceSymbol}{" "}
                {Math.abs(finalBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {finalBalance >= 0 ? " (Cr)" : " (Dr)"}
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
                    style={{ marginRight: "15px" }}
                    onClick={() => {
                      if (canShareAccount) {
                        PDFemployeeAccountv1(
                          rowData.id,
                          setIsPDFDownloadLoading,
                        );
                      } else {
                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                      }
                    }}
                    // onClick={() => handleDownload(rowData.id, handleHide)}
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="green"
                  >
                    <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                  </svg>

                  <svg
                    style={{ marginRight: "15px" }}
                    onClick={() => {
                      if (canPrintAccount) {
                        openPrint(rowData.id);
                      } else {
                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                      }
                    }}
                    // onClick={() => openPrint(rowData.id, viewFormate)}
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
          <Column
            field="acc_series"
            header="ID"
            sortable
            style={{ width: "50px" }}
          />

          <Column
            field="contact_masters_id"
            header={
              <span>
                Employee <br /> Details
              </span>
            }
            sortable
            style={{ width: "250px" }}
            body={(rowData: IEmployeeAccountTransaction) => {
              const emp = rowData.username || "";
              const mobile = rowData.recovery_mobile || "";

              let parts = [];

              if (emp) {
                parts.push(emp);
              }

              if (mobile) {
                parts.push(mobile);
              }

              return parts.length > 0 ? parts.join(" - ") : "-";
            }}
          />

          <Column
            field="typeItem"
            header={
              <span>
                Payment <br /> Type
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search type"
            style={{ width: "200px" }}
            body={(rowData: IEmployeeAccountTransaction) => {
              const type = rowData.typeItem || "";
              let color = "black"; // default

              if (type.toLowerCase() === "credit") {
                color = "green";
              } else if (type.toLowerCase() === "debit") {
                color = "red";
              }

              return <span style={{ color, fontWeight: "bold" }}>{type}</span>;
            }}
          />

          <Column
            field="modeItem"
            header={
              <span>
                Payment <br /> Mode
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search mode"
            style={{ width: "200px" }}
          />

          <Column
            field="amount"
            header="Amount"
            sortable
            body={(rowData: IEmployeeAccountTransaction) =>
              rowData.amountwithcurrency ||
              `₹${rowData.amount?.toLocaleString() || "0.00"}`
            }
            style={{ textAlign: "right", width: "150px" }}
          />

          <Column
            field="payment_date_time"
            header={
              <span>
                Payment <br />
                Date & Time
              </span>
            }
            sortable
            body={(rowData: IEmployeeAccountTransaction) =>
              rowData.payment_date_time || "-"
            }
            style={{ width: "200px" }}
          />

          <Column
            field="approved_name"
            header={
              <span>
                Approved <br /> By
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search approver"
            body={(rowData: IEmployeeAccountTransaction) =>
              rowData.approved_name || "-"
            }
            style={{ width: "200px" }}
          />
          <Column
            field="created_name"
            header={
              <span>
                Created <br /> By
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search approver"
            body={(rowData: IEmployeeAccountTransaction) =>
              rowData.created_name || "-"
            }
            style={{ width: "200px" }}
          />

          <Column
            field="remark"
            header="Remark"
            filter
            filterPlaceholder="Search remark"
            style={{ minWidth: "200px" }}
            body={(rowData: IEmployeeAccountTransaction) => (
              <div
                dangerouslySetInnerHTML={{ __html: rowData.remark || "-" }}
              />
            )}
          />
        </DataTable>
        <div className="mb-3 p-3 bg-light rounded"></div>
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

export default EmployeeTransactionReports;
