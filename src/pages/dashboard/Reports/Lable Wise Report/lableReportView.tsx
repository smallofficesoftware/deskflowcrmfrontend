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
  type DataTablePageEvent,
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
import {
  exportAllLabelWiseData,
  fetchLabelWiseForExport,
  fetchLable,
  ILableReport,
} from "./lableReportController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IProplableReportReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedLabels?: string[] | null;
  selectedTeamMembers?: string[] | null;
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

const AlllableReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  selectedLabels,
  selectedTeamMembers,
  globalSearch,
  onHide,
}: IProplableReportReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<ILableReport[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<ILableReport[]>(
    [],
  );

  const isPaginationCall = useRef(false);
  const [apiParams, setApiParams] = useState({ ul: 0, ll: 50 });

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("label_wise_contact_statistics_report");
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
      checkedOptions: data.checkedOptionsLabel || [],
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("label_wise_contact_statistics_report", updatedFilters);

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

      setFilters("label_wise_contact_statistics_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.LABEL_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.LABEL_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 49,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      person_name: { value: null, matchMode: "contains" },
      mobile_number: { value: null, matchMode: "contains" },
      lable_name: { value: null, matchMode: "contains" },
      status_name: { value: null, matchMode: "contains" },
      contactCount: { value: null, matchMode: "contains" },
      inquiryCount: { value: null, matchMode: "contains" },
    },
  });
  const [lableReport, setLableReport] = useState<ILableReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<ILableReport[]>>(null);
  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip if pagination call is in progress
    if (isPaginationCall.current) {
      isPaginationCall.current = false;
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setLazyState((prev) => ({ ...prev, first: 0, page: 0 }));

        await fetchLable(
          setLableReport,
          filters.selectedDateArray,
          MobileToken,
          getID,
          MobileFlag,
          filters.checkedOptions,
          filters.checkedOptionsUser,
          0,
          50,
          debouncedSearchText,
        );
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to fetch Label data");
          setLableReport([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (networkTimeout.current) clearTimeout(networkTimeout.current);
    };
  }, [
    filters.selectedDateArray,
    filters.checkedOptions,
    filters.checkedOptionsUser,
    debouncedSearchText,
  ]);

  const dataArray: ILableReport[] = lableReport
    ? lableReport.map((item) => ({
        lable_name: item.lable_name || "-",
        contactCount: item.contactCount || "-",
        inquiryCount: item.inquiryCount || "-",
      }))
    : [];

  useEffect(() => {
    loadLazyData();
    return () => {
      if (networkTimeout.current) clearTimeout(networkTimeout.current);
    };
  }, [lazyState, lableReport]);

  const getFilteredData = () => {
    let filteredData = [...dataArray];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;
        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;

          // Handle numbers for contactCount and inquiryCount
          const fieldStr = (
            typeof fieldValue === "number"
              ? fieldValue.toString()
              : fieldValue.toString()
          ).toLowerCase();

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

  const loadLazyData = () => {
    setLoading(true);
    if (networkTimeout.current) clearTimeout(networkTimeout.current);

    networkTimeout.current = setTimeout(() => {
      const filteredData = getFilteredData();
      const start = lazyState.first;
      const end = start + lazyState.rows;
      setCustomers(filteredData.slice(start, end));
      setTotalRecords(filteredData.length);
      setLoading(false);
    }, 250);
  };

  const onPage = async (event: DataTablePageEvent) => {
    const currentPage = event.page ?? 0;
    const ul = currentPage * 50; // upper limit (starting point)
    const ll = 50; // lower limit (ending point)

    isPaginationCall.current = true;

    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: currentPage,
    }));

    setLoading(true);

    try {
      await fetchLable(
        setLableReport,
        filters.selectedDateArray,
        MobileToken,
        getID,
        MobileFlag,
        filters.checkedOptions,
        filters.checkedOptionsUser,
        ul,
        ll,
        debouncedSearchText,
      );
    } catch (err) {
      console.error("Error fetching paginated label data:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isPaginationCall.current = false;
      }, 100);
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

  const onSelectionChange = (event: { value: ILableReport[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectAll(true);
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  type LableColumnDef = ColumnDef & {
    header: React.ReactNode;
    filterMatchMode?: string;
    width?: string;
    body: (rowData: ILableReport) => React.ReactNode;
  };

  const baseColumnDefs: LableColumnDef[] = useMemo(
    () => [
      {
        key: "lable_name",
        label: "Label Name",
        header: "Label Name",
        width: "200px",
        body: (rowData) => rowData.lable_name || "-",
      },
      {
        key: "contactCount",
        label: "Contact Count",
        header: "Contact Count",
        width: "150px",
        body: (rowData) => rowData.contactCount ?? "-",
      },
      {
        key: "inquiryCount",
        label: "Inquiry Count",
        header: "Inquiry Count",
        width: "150px",
        body: (rowData) => rowData.inquiryCount ?? "-",
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
  } = useColumnPreferences("label_wise_report", baseColumnDefs);

  const getExportCellValue = (col: LableColumnDef, customer: any): any => {
    if (col.key === "lable_name") return customer.lable_name || "-";
    if (col.key === "contactCount") return customer.contactCount ?? 0;
    if (col.key === "inquiryCount") return customer.inquiryCount ?? 0;
    return customer[col.key] ?? "-";
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const filteredData = getFilteredData();
    const tableData = (
      selectedCustomers.length > 0 ? selectedCustomers : filteredData
    ).map((customer) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, customer);
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`all_label_report_${new Date().getTime()}.pdf`);
      return;
    }

    const exportColumns = visibleColumns.map((col) => ({
      title: col.label,
      dataKey: col.key,
    }));

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
        doc.text("All Label Report", data.settings.margin.left, 10);
      },
    });

    doc.save(`all_label_report_${new Date().getTime()}.pdf`);
  };

  // const exportExcel = () => {
  //   const filteredData = getFilteredData();
  //   const exportData = (selectedCustomers.length > 0 ? selectedCustomers : filteredData).map((customer) => ({
  //     Label_Name: customer.lable_name || "-",
  //     Contact_Count: customer.contactCount || "-",
  //     Inquiry_Count: customer.inquiryCount || "-",
  //   }));
  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];

  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "labels");
  // };

  const exportExcel = async () => {
    try {
      setLoading(false);

      const allContacts = await exportAllLabelWiseData(
        (offset, limit) =>
          fetchLabelWiseForExport(
            filters.selectedDateArray,
            MobileToken,
            getID,
            MobileFlag,
            filters.checkedOptions,
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

      const exportData = (
        selectedCustomers.length > 0 ? selectedCustomers : allContacts
      ).map((customer) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, customer);
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = visibleColumns.map(() => ({ wpx: 180 }));

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Label Wise Report");

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "label_Wise_Static_Report");

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export source wise data");
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
          <title>All Label Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>All Label Report</h1>
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

  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          All Label
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
          All Label
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
          <ColumnsButton
            columns={orderedColumns}
            hiddenKeys={hiddenKeys}
            onToggle={toggleColumn}
            onReorder={reorderColumns}
            onReset={resetColumns}
          />
        </div>
        {/* )} */}
      </div>

      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          ref={dt}
          value={dataArray}
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollable
          scrollHeight="65vh"
          virtualScrollerOptions={{
            itemSize: 50,
          }}
          filterDisplay="row"
          dataKey="lable_name"
          totalRecords={totalRecords}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
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
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 2, 5]}
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

export default AlllableReport;
