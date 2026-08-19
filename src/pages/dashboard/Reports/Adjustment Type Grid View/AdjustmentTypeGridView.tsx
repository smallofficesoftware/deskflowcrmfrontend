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
import AddAdjustmentTypeView from "../../../left-side/header/Setting/adjustment type/AddAdjustmentTypeView";
import { deleteAdjustmentType, fetchAdjustmentTypeApi, IAdjustmentTypeView, METHOD_TYPES, MODE_TYPES } from "../../../left-side/header/Setting/adjustment type/AdjustmentTypeController";

export interface IPropsAdjustmentTypeGridView {
    onHide: () => void;
}

const AdjustmentTypeGridView = ({
    onHide,
}: IPropsAdjustmentTypeGridView) => {
    const [adjustmentTypeList, setAdjustmentTypeList] = useState<IAdjustmentTypeView[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const [isCreateModel, setIsCreateModel] = useState(false);
    const [isUpdateModel, setIsUpdateModel] = useState(false);

    const [editableAdjustmentType, setEditableAdjustmentType] = useState<
        IAdjustmentTypeView | undefined
    >();

    const [deleteAdjustmentTypeIds, setDeleteAdjustmentTypeIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {},
    );

    const PAGE_SIZE = 30;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const dt = useRef<DataTable<IAdjustmentTypeView[]>>(null);
    const op = useRef<OverlayPanel>(null);
    const [selectedRow, setSelectedRow] = useState<IAdjustmentTypeView | null>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        method: {
            value: null,
            matchMode: "contains",
        },
        mode: {
            value: null,
            matchMode: "contains",
        },
        name: {
            value: null,
            matchMode: "contains",
        },
        knowledge_info: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        const fetchAdjustmentTypes = async () => {
            if (true) {
                setOffset(0);
                setHasMore(true);
                setAdjustmentTypeList([]);
                setLoading(true);
                fetchAdjustmentTypeApi(
                    setAdjustmentTypeList,
                    setLoading,
                    PAGE_SIZE,
                    0,
                    false,
                ).then((more) => setHasMore(more));
            }
        };

        fetchAdjustmentTypes();
    }, []);

    const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {

        // Safely get the last visible index
        const lastVisible =
            typeof event.last === "number"
                ? event.last
                : ((event.last as any)?.last ?? 0);

        const loadedCount = adjustmentTypeList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data

        if (
            lastVisible >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchAdjustmentTypeApi(
                setAdjustmentTypeList,
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

    const handleRefreshAdjustmentType = async () => {
        if (true) {
            setOffset(0);
            setHasMore(true);
            setAdjustmentTypeList([]);
            setLoading(true);
            const more = await fetchAdjustmentTypeApi(
                setAdjustmentTypeList,
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

    const handleDeleteAdjustmentType = async () => {
        // if (!canDelete) {
        //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        //     return;
        // }

        await deleteAdjustmentType(deleteAdjustmentTypeIds, setIsDeleteConfirmation, setLoading);
        setDeleteAdjustmentTypeIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
        handleRefreshAdjustmentType();
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest(".icon-more");
        if (clickedOnButton) return;

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

    const handleEdit = (item: IAdjustmentTypeView) => {
        if (true) {
            setEditableAdjustmentType(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openCreateView = () => {
        if (true) {
            setIsCreateModel(true);
        } else {
            setIsCreateModel(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const actionBodyTemplate = (rowData: IAdjustmentTypeView) => {
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

    type AdjustmentColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        body: (rowData: IAdjustmentTypeView) => React.ReactNode;
    };

    const baseColumnDefs: AdjustmentColumnDef[] = useMemo(
        () => [
            {
                key: "method",
                label: "Applied On",
                header: <span>Applied On</span>,
                width: "250px",
                body: (rowData) => (
                    <span>
                        {rowData.method
                            ? METHOD_TYPES.find((m) => m.id === rowData.method)?.name
                            : "-"}
                    </span>
                ),
            },
            {
                key: "mode",
                label: "Mode",
                header: <span>Mode</span>,
                width: "250px",
                body: (rowData) => (
                    <span className="mx-1 text-muted">
                        {rowData.mode
                            ? MODE_TYPES.find((m) => m.id === rowData.mode)?.name
                            : "-"}
                    </span>
                ),
            },
            {
                key: "name",
                label: "Name",
                header: <span>Name</span>,
                width: "250px",
                body: (rowData) => (
                    <span className="mx-1 text-muted">{rowData.name || "-"}</span>
                ),
            },
            {
                key: "knowledge_info",
                label: "Knowledge Info",
                header: <span>Knowledge Info</span>,
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
                        {rowData.knowledge_info || "-"}
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
    } = useColumnPreferences("adjustment_type_grid_view", baseColumnDefs);

    return (
        <PrimeReactProvider>
            <div>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <h3
                        style={{ fontSize: "20px", paddingLeft: "12px" }}
                        className="dash-board-text-count"
                    >
                        Adjustment Type
                    </h3>
                    <div className="d-flex gap-2 align-items-center">
                        <Button
                            icon="pi pi-plus"
                            className="report_button"
                            style={{ backgroundColor: "rgb(245, 134, 52)" }}
                            rounded
                            onClick={openCreateView}
                            tooltip={`Add Adjustment Type`}
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
                        value={adjustmentTypeList}
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
                                width: "45px",
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

                                        handleEdit(selectedRow);
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

                                        setDeleteAdjustmentTypeIds([selectedRow.id]);
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
                            setDeleteAdjustmentTypeIds([]);
                        }}
                        handleSubmit={handleDeleteAdjustmentType}
                        title={
                            deleteAdjustmentTypeIds.length > 1
                                ? "Delete Adjustment Types"
                                : "Delete Adjustment Type"
                        }
                        message={`Are you sure you want to delete ${deleteAdjustmentTypeIds.length > 1 ? "these Adjustment Types" : "this Adjustment Type"
                            }?`}
                        btn1="CANCEL"
                        btn2="DELETE"
                    />
                )}
                {isCreateModel && (
                    <AddAdjustmentTypeView
                        show={isCreateModel}
                        onHide={() => setIsCreateModel(false)}
                        headerName="Add Adjustment Type"
                        productToEdit={undefined}
                        setLoading={setLoading}
                        handleRefreshAdjustmentType={handleRefreshAdjustmentType}
                    />
                )}
                {isUpdateModel && editableAdjustmentType && (
                    <AddAdjustmentTypeView
                        show={isUpdateModel}
                        onHide={() => setIsUpdateModel(false)}
                        headerName="Update Adjustment Type"
                        productToEdit={editableAdjustmentType}
                        setLoading={setLoading}
                        handleRefreshAdjustmentType={handleRefreshAdjustmentType}
                    />
                )}
            </div>
        </PrimeReactProvider>
    );
};

export default AdjustmentTypeGridView;
