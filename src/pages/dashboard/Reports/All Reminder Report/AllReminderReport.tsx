import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { PrimeReactProvider } from "primereact/api";
import { OverlayPanel } from "primereact/overlaypanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ReminderModal from "../../../../components/model/ReminderModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import {
  ColumnDef,
  useColumnPreferences,
} from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  createReminderForMy,
  IReminderList,
  updateContactFormReminder,
  updateOrderFormReminder,
  updateInquiryFormReminder,
} from "../../../left-side/header/list-reminder/ListReminderController";
import { axiosInstance } from "../../../../services/axiosInstance";
import {
  exportTaskAndSupportTicketData,
  fetchTaskReport,
  IReminderItem,
} from "./AllReminderController";
// import { axiosInstance } from "../../../../services/axiosInstance";

interface IReminderReportProps {
  selectedDates?: Date[];
  selectedTeamMembers?: string[] | null;
  selectedStageStatus?: string[] | null;
  title?: string;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  globalSearch?: string;
  is_support_ticket_flag?: number; // probably unused now
  selectedContactId?: string | null;
  referenceWiseContact?: number;
  onHide?: () => void;
}

const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr || dateStr === "0000-00-00" || dateStr.includes("undefined")) {
    return "-";
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "-";
  }
};

const AllReminderReport = ({
  selectedDates,
  selectedTeamMembers,
  globalSearch,
  MobileToken,
  getID,
  MobileFlag,
  is_support_ticket_flag, // probably ignore now
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IReminderReportProps) => {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<IReminderItem[]>([]);
  const [displayReminders, setDisplayReminders] = useState<IReminderItem[]>([]);
  const [selectedReminders, setSelectedReminders] = useState<IReminderItem[]>(
    [],
  );
  const [selectedRow, setSelectedRow] = useState<IReminderItem | null>(null);
  const [selectedReminderItem, setSelectedReminderItem] = useState<IReminderItem | null>(null);
  const [isReminderConfirmationStatus, setIsReminderConfirmationStatus] = useState(false);
  const op = useRef<OverlayPanel>(null);
  const [hasMore, setHasMore] = useState(true);

  const [isSetReminderConfirmation, setIsSetReminderConfirmation] =
    useState(false);
  const title = "All Reminders";

  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const isInitialLoad = useRef(true);
  const [
    isReminderConfirmationStatusData,
    setIsReminderConfirmationStatusData,
  ] = useState<IReminderList>();

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("allreminder_report");
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

    setFilters("allreminder_report", updatedFilters);

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

      setFilters("allreminder_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.REMINDER_REPORT,
    PERMISSION_TYPE.SHARE,
  ); // ← update PAGE_ID if you have separate for reminder
  const canPrint = useCheckUserPermission(
    PAGE_ID.REMINDER_REPORT,
    PERMISSION_TYPE.PRINT,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.REMINDER_REPORT,
    PERMISSION_TYPE.ADD,
  );
  const canApprove = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.APPROVE,
  );

  // Reset & reload when filters change
  useEffect(() => {
    setReminders([]);
    setDisplayReminders([]);
    currentOffset.current = 0;
    isInitialLoad.current = true;
    setHasMore(true);
    loadReminders(0, 50, true);
  }, [
    filters.selectedDateArray,
    filters.checkedOptionsUser,
    debouncedSearchText,
    MobileToken,
    getID,
    MobileFlag,
    filters.selectedContactId,
    filters.referenceWiseContact,
  ]);

  const loadReminders = async (
    offset: number,
    limit: number,
    reset = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchTaskReport(
        // ← this still works — just returns IReminderItem[]
        undefined,
        filters.selectedDateArray,
        filters.checkedOptionsUser,
        MobileToken,
        getID,
        MobileFlag,
        undefined, // selectedStageStatus — remove if not used
        offset,
        limit,
        debouncedSearchText,
        is_support_ticket_flag,
        filters.selectedContactId,
        filters.referenceWiseContact,
      );

      if (newData.length < limit) {
        setHasMore(false);
      }

      if (reset) {
        setReminders(newData);
      } else {
        setReminders((prev) => [...prev, ...newData]);
      }

      currentOffset.current = offset + newData.length;
    } catch (err) {
      setHasMore(false);
      console.error(err);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
      isInitialLoad.current = false;
    }
  };

  const handleRefresh = async () => {
    setReminders([]);
    setDisplayReminders([]);
    currentOffset.current = 0;
    isInitialLoad.current = true;
    setHasMore(true);
    loadReminders(0, 50, true);
  };

  const onVirtualScroller = (event: any) => {
    if (event.last === reminders.length && hasMore && !isLoadingMore.current) {
      loadReminders(currentOffset.current, 50);
    }
  };

  const filteredAndSortedData = useMemo(() => reminders, [reminders]); // simple — no heavy client-side filter/sort for now

  useEffect(() => {
    setDisplayReminders(filteredAndSortedData);
  }, [filteredAndSortedData]);

  const onSelectionChange = (e: { value: IReminderItem[] }) => {
    setSelectedReminders(e.value);
  };

  const handleChangeReminderComplete = (reminderData: IReminderItem) => {
    if (canApprove) {
      setSelectedReminderItem(reminderData);
      setIsReminderConfirmationStatus(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleChangeStatusOfReminder = async () => {
    if (!selectedReminderItem) return;

    const date = new Date();
    const formattedDateTime = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours(),
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
      date.getSeconds(),
    ).padStart(2, "0")}`;

    const requestData = {
      table: "reminder_messages",
      where: `{"id":"${selectedReminderItem.id}"}`,
      data: `{"status":"1", "completed_date_time":"${formattedDateTime}"}`,
    };

    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        if ((selectedReminderItem as any).reference_table) {
          switch ((selectedReminderItem as any).reference_table) {
            case "contact_message_histories":
              await updateContactFormReminder(
                (selectedReminderItem as any).reference_id,
              );
              break;
            case "cart_quotation":
            case "cart_order":
            case "cart_invoice":
            case "cart_purchase_order":
              await updateOrderFormReminder(
                (selectedReminderItem as any).reference_id,
              );
              break;
            case "inquiries":
              await updateInquiryFormReminder(
                (selectedReminderItem as any).reference_id,
              );
              break;
            default:
              break;
          }
        }
        setIsReminderConfirmationStatus(false);
        toast.success("Reminder completed successfully");
        currentOffset.current = 0;
        setHasMore(true);
        loadReminders(0, 50, true);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  type ReminderColumnDef = ColumnDef & {
    header: React.ReactNode;
    width?: string;
    filterMatchMode?: string;
    body: (rowData: IReminderItem) => React.ReactNode;
  };

  const baseColumnDefs: ReminderColumnDef[] = useMemo(() => {
    const defs: ReminderColumnDef[] = [
      {
        key: "id",
        label: "ID",
        header: "ID",
        width: "80px",
        body: (rowData) => rowData.id,
      },
      {
        key: "contact_name",
        label: "Contact Name",
        header: (
          <span>
            Contact <br /> Name
          </span>
        ),
        width: "180px",
        body: (rowData) => rowData.contact_name,
      },
      {
        key: "reminder_data_time",
        label: "Reminder Date & Time",
        header: (
          <span>
            Reminder <br /> Date & Time
          </span>
        ),
        width: "180px",
        body: (row) => formatDateTime(row.reminder_data_time),
      },
      {
        key: "status_display",
        label: "Status",
        header: "Status",
        width: "120px",
        body: (row) => (
          <span
            style={{
              backgroundColor:
                row.status_display === "Completed" || row.status === 1
                  ? "#28a745"
                  : "#dc3545",
              color: "white",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "13px",
              cursor:
                row.status_display === "Completed" || row.status === 1
                  ? "default"
                  : "pointer",
              display: "inline-block",
            }}
            onClick={() => {
              if (row.status_display !== "Completed" && row.status !== 1) {
                handleChangeReminderComplete(row);
              }
            }}
            title={
              row.status_display !== "Completed" && row.status !== 1
                ? "Click to Mark as Completed"
                : undefined
            }
          >
            {row.status_display || (row.status === 1 ? "Completed" : "Due")}
          </span>
        ),
      },
      {
        key: "completed_date_time",
        label: "Completed On",
        header: (
          <span>
            Completed <br /> On
          </span>
        ),
        width: "180px",
        body: (row) => formatDateTime(row.completed_date_time),
      },
      {
        key: "assigned_to_name",
        label: "Assigned To",
        header: "Assigned To",
        width: "160px",
        body: (rowData) => rowData.assigned_to_name,
      },
      {
        key: "created_by_username",
        label: "Created By",
        header: "Created By",
        width: "160px",
        body: (rowData) => rowData.created_by_username,
      },
      {
        key: "remark",
        label: "Remark",
        header: "Remark",
        width: "220px",
        body: (row) =>
          row.remark?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") ||
          "-",
      },
    ];

    return defs;
  }, []);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("all_reminder_report", baseColumnDefs);

  const getExportCellValue = (
    col: ReminderColumnDef,
    item: IReminderItem,
    format: "plain" | "html" = "plain",
  ): string => {
    switch (col.key) {
      case "reminder_data_time":
        return formatDateTime(item.reminder_data_time);
      case "completed_date_time":
        return formatDateTime(item.completed_date_time);
      case "remark":
        if (format === "html") return item.remark || "-";
        return (
          item.remark?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") ||
          "-"
        );
      default:
        return (item as any)[col.key] ?? "-";
    }
  };

  const exportPdf = () => {
    const dataToExport =
      selectedReminders.length > 0 ? selectedReminders : displayReminders;

    const tableData = dataToExport.map((item) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, item, "plain");
      });
      return rowData;
    });

        tableData.push({
      id: `Total Reminders: ${dataToExport.length}`,
      contact_name: "",
      reminder_data_time: "",
      status_display: "",
      completed_date_time: "",
      assigned_to_name: "",
      created_by_username: "",
      remark: "",
    } as any);

    if (tableData.length === 0) {
      const doc = new jsPDF();
      doc.text("No reminders to export", 10, 10);
      doc.save(`${title}_report_${Date.now()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1 && data.row.section === "body") {
          data.cell.styles.fontStyle = "bold";
        }
      },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: () => {
        doc.text(`${title} Report`, 14, 15);
      },
    });

    doc.save(`${title}_report_${Date.now()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allReminders = await exportTaskAndSupportTicketData<IReminderItem>(
        (offset, limit) =>
          fetchTaskReport(
            undefined,
            filters.selectedDateArray,
            filters.checkedOptionsUser,
            MobileToken,
            getID,
            MobileFlag,
            undefined,
            offset,
            limit,
            debouncedSearchText,
            is_support_ticket_flag,
            filters.selectedContactId,
          ),
        500,
      );

      if (!allReminders.length) {
        toast.warn("No reminders to export");
        return;
      }

      const exportData = (
        selectedReminders.length > 0 ? selectedReminders : allReminders
      ).map((item) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, item, "plain");
        });
        return row;
      });

            exportData.push({
        ID: `Total Reminders: ${exportData.length}`,
        "Contact Name": "",
        "Reminder Date & Time": "",
        Status: "",
        "Completed On": "",
        "Assigned To": "",
        "Created By": "",
        Remark: "",
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = {
        Sheets: { Reminders: worksheet },
        SheetNames: ["Reminders"],
      };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${title}_report_${Date.now()}.xlsx`);
    } catch (err) {
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  const printTable = () => {
    const dataToExport =
      selectedReminders.length > 0 ? selectedReminders : displayReminders;

    const printContent = `
      <html>
        <head><title>${title} Report</title>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f2f2f2; }
          h1 { text-align: center; }
        </style>
        </head>
        <body>
          <h1>${title} Report</h1>
          <table>
            <thead>
              <tr>${visibleColumns.map((c) => `<th>${c.label}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${dataToExport
                .map(
                  (item) => `
                <tr>
                  ${visibleColumns
                    .map(
                      (col) =>
                        `<td>${getExportCellValue(col, item, "html")}</td>`,
                    )
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f2f2f2;">
                <td colspan="8">Total Reminders: ${dataToExport.length}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };
  // console.log("data",displayReminders)

  // const fetchConactMessageApiForRemark = async () => {
  //   try {
  //     // const htmlRemark = newData.remark;

  //     // Convert HTML -> editable plain text:
  //     const textRemark = htmlRemark
  //       .replace(/<br\s*\/?>/gi, "\n") // replace <br> with newline
  //       .replace(/<[^>]+>/g, ""); // remove other HTML tags

  //     setRemark(textRemark);
  //   } catch (error) {
  //     console.error("Error fetching contact message:", error);
  //     setRemark(""); // Clear in case of error
  //   }
  // };

  return (
    <PrimeReactProvider value={{ hideOverlaysOnDocumentScrolling: true }}>
      <div>
        <div
          className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
        >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          {title}
        </h3>

        {/* {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && ( */}
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
              onClick={() => {
                if (canAdd) {
                  setIsSetReminderConfirmation(true);
                  setIsReminderConfirmationStatusData(undefined);
                } else {
                  toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }
              }}
              tooltip={`Add Reminder`}
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

                    if (reminders.length === 0) return;

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

                    if (reminders.length === 0) return;

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

                    if (reminders.length === 0) return;

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
        {/* )} */}
      </div>

      <div className="report_card" style={{ height: "90vh", display: "block" }}>
        <DataTable
          value={displayReminders}
          scrollable
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 52,
            lazy: true,
            onLazyLoad: onVirtualScroller,
            loading: loading && isInitialLoad.current,
          }}
          dataKey="id"
          loading={loading}
          selection={selectedReminders}
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No reminders found"
          footer={
            <div
              style={{
                padding: "10px",
                background: "#f8f9fa",
                textAlign: "right",
              }}
            >
              Total Reminders: {displayReminders.length}{" "}
              {hasMore && "(loading more...)"}
            </div>
          }
        >
          {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && (
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem" }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}

          <Column
            header=""
            headerStyle={{ width: "50px", position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa" }}
            bodyStyle={{ textAlign: "center" }}
            body={(rowData: IReminderItem) => (
              <Button
                icon="pi pi-cog"
                className="p-button-text p-0"
                style={{ color: "green", width: "24px", height: "24px" }}
                onClick={(e) => {
                  setSelectedRow(rowData);
                  op.current?.toggle(e);
                  requestAnimationFrame(() => {
                    const panel = op.current?.getElement();
                    if (panel) panel.style.transform = "translate(40px, -25px)";
                  });
                }}
              />
            )}
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
                ...(col.key === "remark"
                  ? {
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      maxWidth: "220px",
                    }
                  : {}),
              }}
              body={col.body}
            />
          ))}
        </DataTable>
      </div>

      {/* Actions OverlayPanel */}
      <OverlayPanel ref={op} className="action-overlay">
        {selectedRow && (
          <ul className="list-unstyled m-0 p-0" id="dropLeft">
            {selectedRow.status_display !== "Completed" && selectedRow.status !== 1 && (
              <li
                className="listItem text-start"
                style={{ padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  op.current?.hide();
                  handleChangeReminderComplete(selectedRow);
                }}
              >
                Complete Reminder
              </li>
            )}
          </ul>
        )}
      </OverlayPanel>

      {/* Complete Reminder Confirmation Modal */}
      {isReminderConfirmationStatus && (
        <ConfirmationModal
          show={isReminderConfirmationStatus}
          onHide={() => setIsReminderConfirmationStatus(false)}
          handleSubmit={handleChangeStatusOfReminder}
          title="Change Status"
          message="Are you sure you want to complete this reminder?"
          btn1="CANCEL"
          btn2="COMPLETE"
        />
      )}

      {isSetReminderConfirmation && (
        <ReminderModal
          show={isSetReminderConfirmation}
          onHide={() => setIsSetReminderConfirmation(false)}
          handleSubmit={async (data) => {
            createReminderForMy(
              {
                dateTime: data.dateTime,
                remark: data.remark,
                status: data.status,

                // ✅ ALWAYS prefer selectedCategory
                selectedCategory: data.selectedCategory,

                // ✅ OPTIONAL CONTEXT DATA
                referenceTable: null,
                referenceId: null,
                contactMastersId:
                  isReminderConfirmationStatusData?.contact_masters_id ?? null,
                mobileNumber:
                  isReminderConfirmationStatusData?.mobile_number ?? undefined,
                contactMessage:
                  isReminderConfirmationStatusData?.contact_message ??
                  undefined,
              },
              setIsSetReminderConfirmation,
              setLoading,
              () => {},
              () => {},
              () => {},
              "",
              "",
              () => {},
            );
            // Refresh THIS report's list after the call
            setReminders([]);
            setDisplayReminders([]);
            currentOffset.current = 0;
            isInitialLoad.current = true;
            setHasMore(true);
            loadReminders(0, 50, true);
          }}
          title={"Set Reminder"}
          message={"Set a new reminder"}
          btn1="CANCEL"
          btn2="Set Reminder"
          remarkMsg={""}
          request_flag={""}
          ContactMessageId={undefined}
        />
      )}
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 5, 18]}
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
    </PrimeReactProvider>
  );
};

export default AllReminderReport;
