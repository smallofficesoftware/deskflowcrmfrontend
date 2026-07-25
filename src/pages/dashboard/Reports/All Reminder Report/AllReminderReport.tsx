import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ReminderModal from "../../../../components/model/ReminderModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  createReminderForMy,
  IReminderList,
} from "../../../left-side/header/list-reminder/ListReminderController";
import {
  exportTaskAndSupportTicketData,
  fetchTaskReport,
  IReminderItem,
} from "./AllReminderController"; // ← update import name if needed
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

  // ─── Export columns ────────────────────────────────────────
  const exportColumns = [
    { title: "ID", dataKey: "id" },
    { title: "Contact Name", dataKey: "contact_name" },
    { title: "Reminder Date & Time", dataKey: "reminder_data_time" },
    { title: "Status", dataKey: "status_display" },
    { title: "Completed On", dataKey: "completed_date_time" },
    { title: "Assigned To", dataKey: "assigned_to_name" },
    { title: "Created By", dataKey: "created_by_username" },
    { title: "Remark", dataKey: "remark" },
  ];

  const exportPdf = () => {
    const dataToExport =
      selectedReminders.length > 0 ? selectedReminders : displayReminders;

    const tableData = dataToExport.map((item) => ({
      id: item.id || "-",
      contact_name: item.contact_name || "-",
      reminder_data_time: formatDateTime(item.reminder_data_time),
      status_display: item.status_display || "-",
      completed_date_time: formatDateTime(item.completed_date_time),
      assigned_to_name: item.assigned_to_name || "-",
      created_by_username: item.created_by_username || "-",
      remark:
        item.remark?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") ||
        "-",
    }));

    if (tableData.length === 0) {
      const doc = new jsPDF();
      doc.text("No reminders to export", 10, 10);
      doc.save(`${title}_report_${Date.now()}.pdf`);
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
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
      ).map((item) => ({
        ID: item.id || "-",
        "Contact Name": item.contact_name || "-",
        "Reminder Date & Time": formatDateTime(item.reminder_data_time),
        Status: item.status_display || "-",
        "Completed On": formatDateTime(item.completed_date_time),
        "Assigned To": item.assigned_to_name || "-",
        "Created By": item.created_by_username || "-",
        Remark:
          item.remark?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") ||
          "-",
      }));

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
              <tr>${exportColumns.map((c) => `<th>${c.title}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${dataToExport
                .map(
                  (item) => `
                <tr>
                  <td>${item.id || "-"}</td>
                  <td>${item.contact_name || "-"}</td>
                  <td>${formatDateTime(item.reminder_data_time)}</td>
                  <td>${item.status_display || "-"}</td>
                  <td>${formatDateTime(item.completed_date_time)}</td>
                  <td>${item.assigned_to_name || "-"}</td>
                  <td>${item.created_by_username || "-"}</td>
                  <td>${item.remark || "-"}</td>
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
            field="id"
            header="ID"
            sortable
            headerStyle={{ width: "80px" }}
          />
          <Column
            field="contact_name"
            header={
              <span>
                Contact <br /> Name
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search contact..."
            headerStyle={{ width: "180px" }}
          />
          <Column
            field="reminder_data_time"
            header={
              <span>
                Reminder <br /> Date & Time
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search..."
            headerStyle={{ width: "180px" }}
            body={(row) => formatDateTime(row.reminder_data_time)}
          />
          <Column
            field="status_display"
            header="Status"
            sortable
            filter
            filterPlaceholder="Search..."
            headerStyle={{ width: "120px" }}
            body={(row) => (
              <span
                style={{
                  backgroundColor:
                    row.status_display === "Completed" ? "#28a745" : "#dc3545",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
              >
                {row.status_display || "-"}
              </span>
            )}
          />
          <Column
            field="completed_date_time"
            header={
              <span>
                Completed <br /> On
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search..."
            headerStyle={{ width: "180px" }}
            body={(row) => formatDateTime(row.completed_date_time)}
          />
          <Column
            field="assigned_to_name"
            header="Assigned To"
            sortable
            filter
            filterPlaceholder="Search..."
            headerStyle={{ width: "160px" }}
          />
          <Column
            field="created_by_username"
            header="Created By"
            sortable
            filter
            filterPlaceholder="Search..."
            headerStyle={{ width: "160px" }}
          />
          <Column
            field="remark"
            header="Remark"
            sortable
            filter
            filterPlaceholder="Search remark..."
            headerStyle={{ width: "220px" }}
            bodyStyle={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "220px",
            }}
            body={(row) =>
              row.remark
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<[^>]+>/g, "") || "-"
            }
          />
        </DataTable>
      </div>
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
  );
};

export default AllReminderReport;
