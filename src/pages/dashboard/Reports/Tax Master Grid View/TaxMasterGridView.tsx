import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import AddTaxMasterView from "../../../left-side/header/Setting/tax master/AddTaxMasterView";
import { deleteTax, fetchTaxApi, ITaxView } from "../../../left-side/header/Setting/tax master/TaxMasterController";

export interface IPropsTaxGridView {
    onHide: () => void;
}

const TaxMasterGridView = ({
    onHide,
}: IPropsTaxGridView) => {
    const [taxList, setTaxList] = useState<ITaxView[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const [isCreateModel, setIsCreateModel] = useState(false);
    const [isUpdateModel, setIsUpdateModel] = useState(false);

    const [editableTax, setEditableTax] = useState<
        ITaxView | undefined
    >();

    const [deleteTaxIds, setDeleteTaxIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {},
    );

    const PAGE_SIZE = 30;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const dt = useRef<DataTable<ITaxView[]>>(null);
    const op = useRef<OverlayPanel>(null);
    const [selectedRow, setSelectedRow] = useState<ITaxView | null>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        value: {
            value: null,
            matchMode: "contains",
        },
        name: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        const fetchTax = async () => {
            if (true) {
                setOffset(0);
                setHasMore(true);
                setTaxList([]);
                setLoading(true);
                fetchTaxApi(
                    setTaxList,
                    setLoading,
                    PAGE_SIZE,
                    0,
                    false,
                ).then((more) => setHasMore(more));
            }
        };

        fetchTax();
    }, []);

    const handleRefresh = async () => {
        setOffset(0);
        setHasMore(true);
        setTaxList([]);
        setLoading(true);
        const more = await fetchTaxApi(
            setTaxList,
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

        const loadedCount = taxList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data

        if (
            lastVisible >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchTaxApi(
                setTaxList,
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

    const handleRefreshTax = async () => {
        if (true) {
            setOffset(0);
            setHasMore(true);
            setTaxList([]);
            setLoading(true);
            const more = await fetchTaxApi(
                setTaxList,
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

    const handleDeleteTax = async () => {
        // if (!canDelete) {
        //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        //     return;
        // }

        await deleteTax(deleteTaxIds, setIsDeleteConfirmation, setLoading);
        setDeleteTaxIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
        handleRefreshTax();
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

    const handleEdit = (item: ITaxView) => {
        if (true) {
            setEditableTax(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (itemId: number | undefined) => {
        if (true) {
            if (itemId !== undefined) {
                setDeleteTaxIds([itemId]);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No record selected for deletion");
            }
        } else {
            setIsDeleteConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const actionBodyTemplate = (rowData: ITaxView) => {
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
                        Tax Master
                    </h3>
                    <div className="d-flex gap-2 align-items-center">
                        <Button
                            icon="pi pi-plus"
                            className="report_button"
                            style={{ backgroundColor: "rgb(245, 134, 52)" }}
                            rounded
                            onClick={openCreateView}
                            tooltip={`Add Holiday`}
                            tooltipOptions={{
                                position: "left",
                                style: {
                                    fontSize: "14px",
                                },
                            }}
                        />
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
                        value={taxList}
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
                                width: "25px",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                            }}
                            body={actionBodyTemplate}
                        />
                        <Column
                            field="value"
                            header={
                                <span>
                                    Tax Value
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
                            body={(rowData: ITaxView) => {
                                return (
                                    <span>
                                        {rowData.value || "-"}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="name"
                            header={
                                <span>
                                    Tax Name
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
                            body={(rowData: ITaxView) => {
                                return (
                                    <span
                                        className="mx-1 text-muted"
                                        title="Apply Date"
                                    >
                                        {rowData.name || "-"}
                                    </span>
                                );
                            }}
                        />
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
                            setDeleteTaxIds([]);
                        }}
                        handleSubmit={handleDeleteTax}
                        title={
                            deleteTaxIds.length > 1
                                ? "Delete Taxs"
                                : "Delete Tax"
                        }
                        message={`Are you sure you want to delete ${deleteTaxIds.length > 1 ? "these Taxs" : "this Tax"
                            }?`}
                        btn1="CANCEL"
                        btn2="DELETE"
                    />
                )}
                {isCreateModel && (
                    <AddTaxMasterView
                        show={isCreateModel}
                        onHide={() => setIsCreateModel(false)}
                        headerName="Create Tax"
                        productToEdit={undefined}
                        setLoading={setLoading}
                        handleRefreshTax={handleRefreshTax}
                    />
                )}
                {isUpdateModel && editableTax && (
                    <AddTaxMasterView
                        show={isUpdateModel}
                        onHide={() => setIsUpdateModel(false)}
                        headerName="Update Tax"
                        productToEdit={editableTax}
                        setLoading={setLoading}
                        handleRefreshTax={handleRefreshTax}
                    />
                )}
            </div>
        </PrimeReactProvider>
    );
};

export default TaxMasterGridView;
