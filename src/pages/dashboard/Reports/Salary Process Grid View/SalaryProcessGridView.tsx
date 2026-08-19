import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { fetchProcessAttendanceApi, IProcessAttendanceView } from "../../../left-side/header/Setting/salary-process/SalaryProcessController";
import SalaryProcessModel from "../../../left-side/header/Setting/salary-process/SalaryProcessModel";

const months: any = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

interface IPropsSalaryProcessGridView {
    onHide: () => void;
}

const SalaryProcessGridView = ({
    onHide
}: IPropsSalaryProcessGridView) => {
    const [processAttendanceList, setProcessAttendanceList] = useState<
        IProcessAttendanceView[]
    >([]);
    const [loading, setLoading] = useState(false);

    const [showProcessAttendance, setShowProcessAttendance] = useState(false);

    const [displayProcessAttendanceList, setDisplayProcessAttendanceList] = useState<
        IProcessAttendanceView[]
    >([]);

    const dt = useRef<DataTable<IProcessAttendanceView[]>>(null);

    const PAGE_SIZE = 30;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const [selectedMonth, setSelectedMonth] = useState<number>();
    const [selectedYear, setSelectedYear] = useState<number>();

    const op = useRef<OverlayPanel>(null);
    const [selectedRow, setSelectedRow] = useState<IProcessAttendanceView | null>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        month: {
            value: null,
            matchMode: "contains",
        },
        last_modified_date: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    const canView = useCheckUserPermission(
        PAGE_ID.SALARY_PROCESS,
        PERMISSION_TYPE.VIEW,
    );

    const canAdd = useCheckUserPermission(
        PAGE_ID.SALARY_PROCESS,
        PERMISSION_TYPE.ADD,
    );

    const canEdit = useCheckUserPermission(
        PAGE_ID.SALARY_PROCESS,
        PERMISSION_TYPE.EDIT,
    );

    useEscapeKey(onHide);

    useEffect(() => {
        if (canView) {
            setOffset(0);
            setHasMore(true);
            setProcessAttendanceList([]);
            setLoading(true);
            fetchProcessAttendanceApi(
                setProcessAttendanceList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
            ).then((more) => setHasMore(more));
        }
    }, [canView]);

    const handleRefresh = async () => {
        if (!canView) return;
        setOffset(0);
        setHasMore(true);
        setProcessAttendanceList([]);
        setLoading(true);
        const more = await fetchProcessAttendanceApi(
            setProcessAttendanceList,
            setLoading,
            PAGE_SIZE,
            0,
            false,
        );
        setHasMore(more);
    };

    const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {
        // Safely get the last visible index
        const lastVisible =
            typeof event.last === "number"
                ? event.last
                : ((event.last as any)?.last ?? 0);

        const loadedCount = processAttendanceList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data
        const buffer = 20;

        if (
            lastVisible + buffer >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchProcessAttendanceApi(
                setProcessAttendanceList,
                setLoading,
                PAGE_SIZE,
                nextOffset,
                true, // append
            ).then((more) => {
                setOffset(nextOffset);
                setHasMore(more);
                setIsFetchingMore(false);
            });
        }
    };

    const filteredAndSortedData = useMemo(() => processAttendanceList, [processAttendanceList]); // simple — no heavy client-side filter/sort for now

    useEffect(() => {
        setDisplayProcessAttendanceList(filteredAndSortedData);
    }, [filteredAndSortedData]);

    const handleRefreshList = async () => {
        if (canView) {
            setOffset(0);
            setHasMore(true);
            setProcessAttendanceList([]);
            setLoading(true);
            const more = await fetchProcessAttendanceApi(
                setProcessAttendanceList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
            );
            setHasMore(more);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handelClickProcessAttendance = async () => {
        setShowProcessAttendance(true);
    };

    const actionBodyTemplate = (rowData: IProcessAttendanceView) => {
        return (
            <Button
                icon="pi pi-cog"
                className="p-button-text source-of-type-list-grid-options"
                style={{
                    color: "green",
                }}
                onClick={(e) => {
                    setSelectedRow(rowData);
                    op.current?.toggle(e);

                    requestAnimationFrame(() => {
                        const panel = op.current?.getElement();

                        if (panel) {
                            panel.style.transform = "translate(40px, -25px)";
                        }
                    });
                }}
            />
        );
    };

    return (
        <PrimeReactProvider>
            <div>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <h3
                        style={{ fontSize: "20px", paddingLeft: "12px" }}
                        className="dash-board-text-count"
                    >
                        Salary Process
                    </h3>
                    <div className="d-flex gap-2 align-items-center">
                        <div
                            className="ICON"
                            style={{ marginRight: "20px" }}
                        >
                            <button
                                style={{ backgroundColor: "rgb(255, 125, 18)" }}
                                className="btn btn-sm text-white d-flex align-items-center gap-2"
                                onClick={() => {
                                    op.current?.hide();
                                    canAdd
                                        ? handelClickProcessAttendance()
                                        : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                                }}
                                title="Generate Salary"
                            >
                                Generate Salary
                            </button>
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
                    </div>
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
                        value={displayProcessAttendanceList}
                        loading={loading}
                        resizableColumns
                        columnResizeMode="fit"
                        scrollable
                        scrollHeight="90vh"
                        className="custom-centered-table"
                        tableStyle={{ tableLayout: "fixed", width: "100%" }}
                        emptyMessage="No data found"
                        filterDisplay="row"
                        virtualScrollerOptions={{
                            itemSize: PAGE_SIZE,
                            lazy: true,
                            onLazyLoad: onVirtualLoad, // ← use the fixed version above
                            showLoader: true,
                            // numToleratedItems: 10,               // optional: render a few more rows for smoothness
                            // delay: 100,                          // optional: small debounce
                        }}
                        filters={filters}
                        onFilter={onFilter}
                    >
                        <Column
                            field="actions"
                            headerClassName="center-header"
                            headerStyle={{
                                width: "30px",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                            }}
                            body={actionBodyTemplate}
                        />
                        <Column
                            field="month"
                            header={
                                <span>
                                    Salary Month
                                </span>
                            }
                            sortable
                            filter
                            filterPlaceholder="Search"
                            filterMatchMode="contains"
                            headerStyle={{
                                width: "250px",
                                background: "#f8f9fa",
                                fontSize: "14px",
                            }}
                            bodyStyle={{ fontSize: "14px" }}
                            body={(rowData: IProcessAttendanceView) => {
                                return (
                                    <span>
                                        {months[Number(rowData.month)]}-{rowData.year}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="last_modified_date"
                            header={
                                <span>
                                    Process Time
                                </span>
                            }
                            sortable
                            filter
                            filterPlaceholder="Search"
                            filterMatchMode="contains"
                            headerStyle={{
                                width: "250px",
                                background: "#f8f9fa",
                                fontSize: "14px",
                            }}
                            bodyStyle={{ fontSize: "14px" }}
                            body={(rowData: IProcessAttendanceView) => {
                                return (
                                    <span>
                                        {formatDateTime(rowData.last_modified_date)}
                                    </span>
                                );
                            }}
                        />
                    </DataTable>
                    <OverlayPanel ref={op} className="action-overlay">
                        <ul className="list-unstyled m-0 p-0">
                            <li
                                className="listItem"
                                style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px", color: "#000" }}
                                onClick={() => {

                                    if (!selectedRow)
                                        return;

                                    if (canEdit) {

                                        setSelectedMonth(Number(selectedRow.month));

                                        setSelectedYear(Number(selectedRow.year));

                                        handelClickProcessAttendance();

                                        op.current?.hide();

                                    } else {

                                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                    }
                                }}
                            >
                                Re Calculate
                            </li>
                        </ul>
                    </OverlayPanel>
                </div>
                {showProcessAttendance && (
                    <SalaryProcessModel
                        show={showProcessAttendance}
                        onHide={() => {
                            setShowProcessAttendance(false);
                        }}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onComplete={handleRefreshList}
                    />
                )}
            </div>
        </PrimeReactProvider>
    );
};

export default SalaryProcessGridView;