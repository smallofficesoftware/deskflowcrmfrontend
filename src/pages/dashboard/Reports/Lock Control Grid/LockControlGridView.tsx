import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import AddLockControlView from "../../../left-side/header/Setting/lock-control/AddLockControlView";
import { deleteLockControl, fetchLockControlApi, ILockControlView } from "../../../left-side/header/Setting/lock-control/LockControlController";

interface IPropsLockControlGridView {
    onHide: () => void;
}

const LockControlGridView = ({
    onHide
}: IPropsLockControlGridView) => {

    const [lockControlList, setLockControlList] = useState<
        ILockControlView[]
    >([]);
    const [loading, setLoading] = useState(false);

    const [displaylockControlList, setDisplaylockControlList] = useState<
        ILockControlView[]
    >([]);

    const [deleteLockControlIds, setDeleteLockControlIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const PAGE_SIZE = 50;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);

    const dt = useRef<DataTable<ILockControlView[]>>(null);
    const op = useRef<OverlayPanel>(null);
    const [selectedRow, setSelectedRow] = useState<ILockControlView | null>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        month: {
            value: null,
            matchMode: "contains",
        },
        year: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    const canView = useCheckUserPermission(
        PAGE_ID.HOLIDAY_MASTER,
        PERMISSION_TYPE.VIEW,
    );
    const canAdd = useCheckUserPermission(
        PAGE_ID.HOLIDAY_MASTER,
        PERMISSION_TYPE.ADD,
    );
    const canEdit = useCheckUserPermission(
        PAGE_ID.HOLIDAY_MASTER,
        PERMISSION_TYPE.EDIT,
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.HOLIDAY_MASTER,
        PERMISSION_TYPE.DELETE,
    );

    useEscapeKey(onHide);

    useEffect(() => {
        if (canView) {
            setOffset(0);
            setHasMore(true);
            setLockControlList([]);
            setLoading(true);
            fetchLockControlApi(
                setLockControlList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
            ).then((more: boolean) => setHasMore(more));
        }
    }, [canView]);

    const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {

        // Safely get the last visible index
        const lastVisible =
            typeof event.last === "number"
                ? event.last
                : ((event.last as any)?.last ?? 0);

        const loadedCount = lockControlList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data

        if (
            lastVisible >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchLockControlApi(
                setLockControlList,
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

    const filteredAndSortedData = useMemo(() => lockControlList, [lockControlList]); // simple — no heavy client-side filter/sort for now

    useEffect(() => {
        setDisplaylockControlList(filteredAndSortedData);
    }, [filteredAndSortedData]);

    const handleRefreshLockControl = async () => {
        if (canView) {
            setOffset(0);
            setHasMore(true);
            setLockControlList([]);
            setLoading(true);
            const more = await fetchLockControlApi(
                setLockControlList,
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

    const openDeleteModel = (itemId: number | undefined) => {
        if (canDelete) {
            if (itemId !== undefined) {
                setDeleteLockControlIds([itemId]);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No record selected for deletion");
            }
        } else {
            setIsDeleteConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleDeleteLockControl = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }
        await deleteLockControl(
            deleteLockControlIds,
            setIsDeleteConfirmation,
            setLoading,
        );
        setDeleteLockControlIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
        handleRefreshLockControl();
    };

    const openCreateView = () => {
        if (canAdd) {
            setIsCreateModel(true);
        } else {
            setIsCreateModel(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const actionBodyTemplate = (rowData: ILockControlView) => {
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

    const getMonthName = (month: number | string): string => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ];
        const idx = Number(month) - 1;
        return months[idx] ?? "-";
    };

    return (
        <PrimeReactProvider>
            <div>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <h3
                        style={{ fontSize: "20px", paddingLeft: "12px" }}
                        className="dash-board-text-count"
                    >
                        Lock Control
                    </h3>
                    <div className="d-flex gap-2 align-items-center">
                        <Button
                            icon="pi pi-plus"
                            className="report_button"
                            style={{ backgroundColor: "rgb(245, 134, 52)" }}
                            rounded
                            onClick={openCreateView}
                            tooltip={`Add Lock Control`}
                            tooltipOptions={{
                                position: "left",
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
                        value={displaylockControlList}
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
                                    Month
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
                            body={(rowData: ILockControlView) => {
                                return (
                                    <span>
                                        {getMonthName(rowData.month)}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="year"
                            header={
                                <span>
                                    Year
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
                            body={(rowData: ILockControlView) => {
                                return (
                                    <span
                                        className="mx-1 text-muted"
                                        title="Apply Date"
                                    >
                                        {rowData.year || "-"}
                                    </span>
                                );
                            }}
                        />
                    </DataTable>
                    <OverlayPanel ref={op} className="action-overlay">
                        <ul className="list-unstyled m-0 p-0" id="dropLeft">
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

                                    if (canEdit) {

                                        openDeleteModel(selectedRow.id);
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
                            setDeleteLockControlIds([]);
                        }}
                        handleSubmit={handleDeleteLockControl}
                        title={
                            deleteLockControlIds.length > 1
                                ? "Delete Lock Controls"
                                : "Delete Lock Control"
                        }
                        message={`Are you sure you want to delete ${deleteLockControlIds.length > 1 ? "these Lock Controls" : "this Lock Control"
                            }?`}
                        btn1="CANCEL"
                        btn2="DELETE"
                    />
                )}
                {isCreateModel && (
                    <AddLockControlView
                        show={isCreateModel}
                        onHide={() => setIsCreateModel(false)}
                        headerName="Create Lock Control"
                        productToEdit={undefined}
                        setLoading={setLoading}
                        handleRefreshLockControl={handleRefreshLockControl}
                    />
                )}
            </div>
        </PrimeReactProvider>
    );
};

export default LockControlGridView;