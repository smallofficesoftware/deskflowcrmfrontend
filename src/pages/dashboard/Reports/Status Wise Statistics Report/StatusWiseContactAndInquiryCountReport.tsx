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
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ExportExcelMenuItem from "../../../../components/ExportExcelMenuItem";
import ExportPdfMenuItem from "../../../../components/ExportPdfMenuItem";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import { fetchStatusWise, IStatusWiseContactCountReport } from "./StatusWiseContactAndInquiryCountReportController";

interface LazyTableState {
    first: number;
    rows: number;
    page: number;
    sortField?: string | null;
    sortOrder?: SortOrder | null;
    filters: DataTableFilterMeta;
}

interface IPropsStatusWiseContactCountReport {
    selectedDates?: Date[];
    MobileToken?: string;
    getID?: string;
    MobileFlag?: string;
    selectedStatus?: string[] | null;
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

const StatusWiseContactAndInquiryCountReport = ({
    selectedDates,
    MobileToken,
    getID,
    MobileFlag,
    selectedStatus,
    onHide,
}: IPropsStatusWiseContactCountReport) => {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCustomers, setSelectedCustomers] = useState<IStatusWiseContactCountReport[]>(
        [],
    );


    const [selectReportType, setSelectReportType] = useState("");
    const [hasData, setHasData] = useState<boolean>(false);
    const { getFilter, setFilter, setFilters, clearFilters } =
        useCommonFilterStore();

    const filters = getFilter("status_wise_contact_statistics_report");
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
        const [startDate, endDate] = getCurrentMonthDateRange();

        setFilters("status_wise_contact_statistics_report", {
            ...filters,
            startSearchDate: startDate,
            endSearchDate: endDate,
            selectedDateArray: [startDate, endDate],
        });
    }, []);

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

        setFilters("status_wise_contact_statistics_report", updatedFilters);

        setHasData(Object.keys(updatedFilters || {}).length > 0);

        setIsModalFilterVisible(false);
    };

    const getCurrentMonthDateRange = () => {
        const now = new Date();

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return [startOfMonth, endOfMonth];
    };

    const canShare = useCheckUserPermission(
        PAGE_ID.STATUS_REPORT,
        PERMISSION_TYPE.SHARE,
    );

    const canPrint = useCheckUserPermission(
        PAGE_ID.STATUS_REPORT,
        PERMISSION_TYPE.PRINT,
    );

    const [lazyState, setLazyState] = useState<LazyTableState>({
        first: 0,
        rows: 50,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {
            status_name: { value: null, matchMode: "contains" },
            contactCount: { value: null, matchMode: "contains" },
            inquiryCount: { value: null, matchMode: "contains" },
        },
    });
    const [statusWiseReport, setStatusWiseReport] = useState<IStatusWiseContactCountReport[]>([]);
    const [error, setError] = useState<string | null>(null);

    const dt = useRef<DataTable<IStatusWiseContactCountReport[]>>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setLazyState((prev) => ({ ...prev, first: 0, page: 0 }));

                await fetchStatusWise(
                    setStatusWiseReport,
                    filters.selectedDateArray,
                    MobileToken,
                    getID,
                    MobileFlag,
                    filters.checkedOptionsStageStatus,
                    0,
                    lazyState.rows,
                    setTotalRecords,
                );
            } catch (err: any) {
                if (isMounted) {
                    setError(err?.message || "Failed to fetch Label data");
                    setStatusWiseReport([]);
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
        };
    }, [
        filters.selectedDateArray,
        filters.checkedOptionsStageStatus,
    ]);

    const handleRefresh = async () => {
        setLoading(true);
        setLazyState((prev) => ({ ...prev, first: 0, page: 0 }));
        await fetchStatusWise(
            setStatusWiseReport,
            filters.selectedDateArray,
            MobileToken,
            getID,
            MobileFlag,
            filters.checkedOptionsStageStatus,
            0,
            lazyState.rows,
            setTotalRecords,
        );
        setLoading(false);
    };

    const dataArray: IStatusWiseContactCountReport[] = statusWiseReport
        ? statusWiseReport.map((item) => ({
            status_name: item.status_name || "-",
            contactCount: item.contactCount ?? "-",
            inquiryCount: item.inquiryCount ?? "-",
        }))
        : [];

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

    const onPage = async (event: DataTablePageEvent) => {
        setLazyState((prev) => ({
            ...prev,
            first: event.first,
            rows: event.rows,
            page: event.page ?? 0,
        }));

        setLoading(true);

        try {
            await fetchStatusWise(
                setStatusWiseReport,
                filters.selectedDateArray,
                MobileToken,
                getID,
                MobileFlag,
                filters.checkedOptionsStageStatus,
                event.first,
                event.rows,
                setTotalRecords,
            );
        } catch (err) {
            console.error("Error fetching paginated status wise data:", err);
        } finally {
            setLoading(false);
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

    const onSelectionChange = (event: { value: IStatusWiseContactCountReport[] }) => {
        const value = event.value;
        setSelectedCustomers(value);
        setSelectAll(value.length === dataArray.length);
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

    type StatusColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        body: (rowData: IStatusWiseContactCountReport) => React.ReactNode;
    };

    const baseColumnDefs: StatusColumnDef[] = useMemo(
        () => [
            {
                key: "status_name",
                label: "Status Name",
                header: "Status Name",
                width: "200px",
                body: (rowData) => rowData.status_name || "-",
            },
            {
                key: "contactCount",
                label: "Contact Count",
                header: "Contact Count",
                width: "150px",
                body: (rowData) => rowData.contactCount,
            },
            {
                key: "inquiryCount",
                label: "Inquiry Count",
                header: "Inquiry Count",
                width: "150px",
                body: (rowData) => rowData.inquiryCount,
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
    } = useColumnPreferences("status_wise_statistics_report", baseColumnDefs);

    const getExportCellValue = (
        col: StatusColumnDef,
        customer: any,
    ): any => {
        if (col.key === "status_name") return customer.status_name || "-";
        if (col.key === "contactCount") return customer.contactCount ?? 0;
        if (col.key === "inquiryCount") return customer.inquiryCount ?? 0;
        return customer[col.key] ?? "-";
    };

    const printTable = () => {
        const filteredData = getFilteredData();
        const tableData =
            selectedCustomers.length > 0 ? selectedCustomers : filteredData;
        const printContent = `
      <html>
        <head>
          <title>Status Wise Contact And Inquiry Count Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Status Wise Contact And Inquiry Count Report</h1>
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
                    Status Wise Contact And Inquiry Count Report
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
                    Status Wise Contact And Inquiry Count Report
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
                                className={`labelDropLeft ${isExportDropdownOpen ? "isVisible" : "isHidden"
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
                                    reportType="status_wise_statistics_report"
                                    filters={{
                                        selected_dates: filters.selectedDateArray,
                                        selectedStatus: filters.checkedOptionsStageStatus,
                                    }}
                                    columns={visibleColumns}
                                    fileName="status_wise_contact_count_report"
                                    canShare={canShare}
                                    disabled={dataArray.length === 0}
                                    onSelect={() => setIsExportDropdownOpen(false)}
                                    selectedRows={selectedCustomers}
                                />

                                <ExportPdfMenuItem
                                    reportType="status_wise_statistics_report"
                                    filters={{
                                        selected_dates: filters.selectedDateArray,
                                        selectedStatus: filters.checkedOptionsStageStatus,
                                    }}
                                    columns={visibleColumns}
                                    fileName="status_wise_contact_count_report"
                                    canShare={canShare}
                                    disabled={dataArray.length === 0}
                                    onSelect={() => setIsExportDropdownOpen(false)}
                                    selectedRows={selectedCustomers}
                                />

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
                    filterDisplay="row"
                    dataKey="status_name"
                    paginator
                    lazy
                    first={lazyState.first}
                    rows={lazyState.rows}
                    onPage={onPage}
                    rowsPerPageOptions={[25, 50, 100, 200]}
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
                    message="Please select the Dates and Status for the Report."
                    btn1="Clear"
                    btn2="Apply"
                    filtersToShow={[1, 4]}
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

export default StatusWiseContactAndInquiryCountReport;
