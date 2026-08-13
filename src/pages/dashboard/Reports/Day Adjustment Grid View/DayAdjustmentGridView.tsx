import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import AddDayAdjustmentView from "../../../left-side/header/Setting/Day Adjustment/AddDayAdjustmentView";
import { deleteAdjustment, fetchAdjustmentApi, holidayOptions, IAdjustmentView } from "../../../left-side/header/Setting/Day Adjustment/DayAdjustmentController";

export interface IPropsAdjustmentGridView {
    onHide: () => void;
}

const DayAdjustmentGridView = ({
    onHide,
}: IPropsAdjustmentGridView) => {

    const [adjustmentList, setAdjustmentList] = useState<IAdjustmentView[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const [isCreateModel, setIsCreateModel] = useState(false);
    const [isUpdateModel, setIsUpdateModel] = useState(false);

    const [editableAdjustment, setEditableAdjustment] = useState<
        IAdjustmentView | undefined
    >();

    const [deleteAdjustmentIds, setDeleteAdjustmentIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {},
    );

    const PAGE_SIZE = 15;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const dt = useRef<DataTable<IAdjustmentView[]>>(null);
    const op = useRef<OverlayPanel>(null);
    const [selectedRow, setSelectedRow] = useState<IAdjustmentView | null>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        date: {
            value: null,
            matchMode: "contains",
        },
        adjustment_date: {
            value: null,
            matchMode: "contains",
        },
        type_of_holiday: {
            value: null,
            matchMode: "contains",
        },
        employee_name: {
            value: null,
            matchMode: "contains",
        },
        description: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        const fetchAdjustments = async () => {
            setOffset(0);
            setHasMore(true);
            setAdjustmentList([]);
            setLoading(true);
            fetchAdjustmentApi(
                setAdjustmentList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
            ).then((more) => setHasMore(more));
        };

        fetchAdjustments();
    }, []);

    const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {

        // Safely get the last visible index
        const lastVisible =
            typeof event.last === "number"
                ? event.last
                : ((event.last as any)?.last ?? 0);

        const loadedCount = adjustmentList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data

        if (
            lastVisible >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchAdjustmentApi(
                setAdjustmentList,
                setLoading,
                PAGE_SIZE,
                nextOffset,
                true,
            ).then((more) => {
                setOffset(nextOffset);
                setHasMore(more);
                setIsFetchingMore(false);
            });
        }
    };

    const handleRefreshAdjustment = async () => {
        if (true) {
            setOffset(0);
            setHasMore(true);
            setAdjustmentList([]);
            setLoading(true);
            const more = await fetchAdjustmentApi(
                setAdjustmentList,
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

    const handleDeleteAdjustment = async () => {
        // if (!canDelete) {
        //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        //     return;
        // }

        await deleteAdjustment(deleteAdjustmentIds, setIsDeleteConfirmation, setLoading);
        setDeleteAdjustmentIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
        handleRefreshAdjustment();
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedInsideDropdown = Object.values(
            dropdownContactRef.current,
        ).some((ref) => ref && ref.contains(target));

        if (!clickedInsideDropdown) {
            setOpenDropdownId(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEscapeKey(() => {
        if (!openDropdownId && !isDeleteConfirmation) {
            onHide();
        } else {
            setOpenDropdownId(null);
            setIsDeleteConfirmation(false);
        }
    });

    const openCreateView = () => {
        if (true) {
            setIsCreateModel(true);
        } else {
            setIsCreateModel(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    type AdjustmentGridColumnDef = ColumnDef & {
        header: React.ReactNode;
        width?: string;
        body: (rowData: IAdjustmentView) => React.ReactNode;
    };

    const baseColumnDefs: AdjustmentGridColumnDef[] = useMemo(
        () => [
            {
                key: "date",
                label: "Date",
                header: <span>Date</span>,
                width: "250px",
                body: (rowData) => (
                    <span>
                        {rowData.date
                            ? new Date(rowData.date).toLocaleDateString("en-GB")
                            : "-"}
                    </span>
                ),
            },
            {
                key: "adjustment_date",
                label: "Adjustment Date",
                header: <span>Adjustment Date</span>,
                width: "250px",
                body: (rowData) => (
                    <span className="mx-1 text-muted">
                        {rowData.adjustment_date
                            ? new Date(rowData.adjustment_date).toLocaleDateString("en-GB")
                            : "-"}
                    </span>
                ),
            },
            {
                key: "type_of_holiday",
                label: "Holiday Type",
                header: <span>Holiday Type</span>,
                width: "250px",
                body: (rowData) => (
                    <span className="mx-1 text-muted">
                        {holidayOptions.find((opt) => opt.value === rowData.type_of_holiday)?.label || "-"}
                    </span>
                ),
            },
            {
                key: "employee_name",
                label: "Employee",
                header: <span>Employee</span>,
                width: "250px",
                body: (rowData) => (
                    <div
                        className="mx-1 text-muted"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            whiteSpace: "normal",
                        }}
                    >
                        {rowData.employee_name || "-"}
                    </div>
                ),
            },
            {
                key: "description",
                label: "Description",
                header: <span>Description</span>,
                width: "250px",
                body: (rowData) => (
                    <div
                        className="mx-1 text-muted"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            whiteSpace: "normal",
                        }}
                    >
                        {rowData.description || "-"}
                    </div>
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
    } = useColumnPreferences("day_adjustment_grid_view", baseColumnDefs);

    const actionBodyTemplate = (rowData: IAdjustmentView) => {
        return (
            <Button
                icon="pi pi-cog"
                className="p-button-text"
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
                        Day Adjustment
                    </h3>
                    <div className="d-flex gap-2 align-items-center">
                        <Button
                            icon="pi pi-plus"
                            className="report_button"
                            style={{ backgroundColor: "rgb(245, 134, 52)" }}
                            rounded
                            onClick={openCreateView}
                            tooltip={`Add Day Adjustment`}
                            tooltipOptions={{
                                position: "left",
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
                        value={adjustmentList}
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
                                    width: col.width || "250px",
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={col.body}
                            />
                        ))}
                    </DataTable>
                    <OverlayPanel ref={op} className="action-overlay">
                        <ul className="list-unstyled m-0 p-0" id="dropLeft">
                            <li
                                className="listItem"
                                style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();

                                    if (!selectedRow)
                                        return;

                                    if (true) {

                                        setEditableAdjustment(selectedRow);
                                        setIsUpdateModel(true);
                                        op.current?.hide();

                                    } else {

                                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                    }
                                }}
                            >
                                Edit
                            </li>
                            <li
                                style={{
                                    color: "red",
                                    fontWeight: 600,
                                    padding: "5px 10px",
                                    cursor: "pointer",
                                    fontSize: "12px"
                                }}
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!selectedRow)
                                        return;

                                    if (true) {

                                        setDeleteAdjustmentIds([selectedRow.id]);
                                        setIsDeleteConfirmation(true);
                                        op.current?.hide();

                                    } else {

                                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                    }
                                }}
                            >
                                Delete
                            </li>
                        </ul>
                    </OverlayPanel>
                </div>
                {isDeleteConfirmation && (
                    <ConfirmationModal
                        show={isDeleteConfirmation}
                        onHide={() => {
                            setIsDeleteConfirmation(false);
                            setDeleteAdjustmentIds([]);
                        }}
                        handleSubmit={handleDeleteAdjustment}
                        title={
                            deleteAdjustmentIds.length > 1
                                ? "Delete Day Adjustment"
                                : "Delete Day Adjustment"
                        }
                        message={`Are you sure you want to delete ${deleteAdjustmentIds.length > 1 ? "these Day Adjustment" : "this Day Adjustment"
                            }?`}
                        btn1="CANCEL"
                        btn2="DELETE"
                    />
                )}
                {isCreateModel && (
                    <AddDayAdjustmentView
                        show={isCreateModel}
                        onHide={() => setIsCreateModel(false)}
                        headerName="Add Day Adjustment"
                        productToEdit={undefined}
                        setLoading={setLoading}
                        handleRefreshAdjustment={handleRefreshAdjustment}
                    />
                )}
                {isUpdateModel && editableAdjustment && (
                    <AddDayAdjustmentView
                        show={isUpdateModel}
                        onHide={() => setIsUpdateModel(false)}
                        headerName="Update Day Adjustment"
                        productToEdit={editableAdjustment}
                        setLoading={setLoading}
                        handleRefreshAdjustment={handleRefreshAdjustment}
                    />
                )}
            </div>
        </PrimeReactProvider>
    );
};

export default DayAdjustmentGridView;
