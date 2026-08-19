import "primeicons/primeicons.css";
import { PrimeReactProvider } from 'primereact/api';
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { formatDateAndTime, useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import StockAdjustmentModel from "../../../left-side/header/Setting/stock-adjustment/StockAdjustmentModel";
import { handleDeleteStockAdjustment, IStockAdjustmentView } from "../../../left-side/header/Setting/stock-adjustment/StockAdjustmentViewController";
import { fetchStockAdjustmentApi } from "./StockAdjustmentReportController";

interface IStockAdjustmentReport {
    onHide?: () => void;
}

const StockAdjustmentReport = ({ onHide }: IStockAdjustmentReport) => {
    const [loading, setLoading] = useState(false);
    const [stockAdjustmentList, setStockAdjustmentList] = useState<IStockAdjustmentView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const [isOpenCreateModel, setIsCreateModel] = useState(false);
    const [refreshStockAdjustment, setRefreshStockAdjustment] =
        useState<boolean>(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [hasIdAvail, setHasIdAvail] = useState<number>();

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
    const [deleteItemIds, setDeleteItemIds] = useState<number>();
    const [stockAdjustmentDropdown, setStockAdjustmentDropdown] =
        useState<any>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        machine_name: {
            value: null,
            matchMode: "contains",
        },
    });
    const op = useRef<OverlayPanel>(null);
    const [activeRowData, setActiveRowData] = useState<IStockAdjustmentView | null>(null);

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchStockAdjustmentApi(
            setStockAdjustmentList,
            setLoading,
            searchTerm

        );
    }, []);

    useEscapeKey(() => {
        if (onHide) {
            onHide?.();
        }
    });

    const canView = useCheckUserPermission(
        PAGE_ID.STOCK_ADJUSTMENT,
        PERMISSION_TYPE.VIEW,
    );
    const canEdit = useCheckUserPermission(
        PAGE_ID.STOCK_ADJUSTMENT,
        PERMISSION_TYPE.EDIT,
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.STOCK_ADJUSTMENT,
        PERMISSION_TYPE.DELETE,
    );

    const canAdd = useCheckUserPermission(
        PAGE_ID.STOCK_ADJUSTMENT,
        PERMISSION_TYPE.ADD,
    );

    useEffect(() => {
        if (refreshStockAdjustment && canView) {
            fetchStockAdjustmentApi(
                setStockAdjustmentList,
                setLoading,
                searchTerm,
            );
            setRefreshStockAdjustment(false);
        }
    }, [refreshStockAdjustment, searchTerm]);

    const handleRefreshStockAdjustment = async () => {
        fetchStockAdjustmentApi(
            setStockAdjustmentList,
            setLoading,
            searchTerm
        );
    };

    const handlePrintViewOpen = (stock_id: number) => {
        setOpenDropdownId(null);
        const getUUID = localStorage.getItem("UUID");
        const baseURL = window.location.origin;
        const supportURL = `${baseURL}/StockAdjustmentPrintView/${stock_id}`;
        const myWindow = window.open(supportURL, "_blank");
    };

    const openDeleteModel = (itemId: number) => {
        setOpenDropdownId(null);
        setHasIdAvail(undefined);
        if (canDelete) {
            setDeleteItemIds(itemId);
            setIsDeleteConfirmation(true);
            setStockAdjustmentDropdown(null);
        } else {
            setIsDeleteConfirmation(false);
            setStockAdjustmentDropdown(null);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteStockAdjustment(
            deleteItemIds || 0,
            setIsDeleteConfirmation,
            setLoading,
            setStockAdjustmentList,
        );

        setIsDeleteConfirmation(false);
        setDeleteItemIds(0);
    };

    const actionBodyTemplate = useCallback((rowData: IStockAdjustmentView) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rowData.id !== -1 && (
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowData(rowData); // Set active row
                            op.current?.toggle(e); // Open Overlay Panel
                        }}
                    />
                )}
            </div>
        );
    }, []);

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest('.source-of-type-list-grid-options');
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
            (ref) => ref && ref.contains(target)
        );

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

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener("keydown", handleEscKey);

        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    return (
        <PrimeReactProvider>
            <>
                <style>
                    {`
                .p-button.source-of-type-list-grid-options:focus {
                box-shadow: none !important;
                outline: none !important;
                }
            `}
                </style>
                <div>
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <h3
                            style={{ fontSize: "20px", paddingLeft: "12px" }}
                            className="dash-board-text-count"
                        >
                            Stock Adjustment
                        </h3>
                        <div className="d-flex gap-2 align-items-center">
                            <Button
                                icon="pi pi-refresh"
                                className="report_button"
                                style={{ backgroundColor: "#4C4C4C" }}
                                rounded
                                onClick={handleRefreshStockAdjustment}
                                tooltip="Refresh"
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
                                        setIsCreateModel(true);
                                    } else {
                                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                    }
                                }}
                                tooltip={`Add Process`}
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
                            value={stockAdjustmentList}
                            loading={loading}
                            resizableColumns
                            columnResizeMode="fit"
                            scrollable
                            scrollHeight="85vh"
                            className="custom-centered-table"
                            tableStyle={{ tableLayout: "fixed", width: "100%" }}
                            emptyMessage="No data found"
                            filterDisplay="row"
                            filters={filters}
                            onFilter={onFilter}
                            key={openDropdownId}
                            virtualScrollerOptions={{ itemSize: 52 }}
                        >
                            <Column
                                field="actions"
                                headerClassName="center-header"
                                headerStyle={{
                                    width: "70px",
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 1,
                                }}
                                body={actionBodyTemplate}
                            />
                            <Column
                                field="cart_number"
                                header={
                                    <span>
                                        Cart Number
                                    </span>
                                }
                                sortable
                                filter
                                filterPlaceholder="Search"
                                filterMatchMode="contains"
                                headerStyle={{
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IStockAdjustmentView) => rowData.cart_number}
                            />
                            <Column
                                field="total_qty"
                                header={
                                    <span>
                                        Total Qty
                                    </span>
                                }
                                sortable
                                filter
                                filterPlaceholder="Search"
                                filterMatchMode="contains"
                                headerStyle={{
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IStockAdjustmentView) => rowData.total_qty}
                            />
                            <Column
                                field="created_by_name"
                                header={
                                    <span>
                                        Created By
                                    </span>
                                }
                                sortable
                                filter
                                filterPlaceholder="Search"
                                filterMatchMode="contains"
                                headerStyle={{
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IStockAdjustmentView) => rowData.created_by_name}
                            />
                            <Column
                                field="created_date_time"
                                header={
                                    <span>
                                        Created Date-Time
                                    </span>
                                }
                                sortable
                                filter
                                filterPlaceholder="Search"
                                filterMatchMode="contains"
                                headerStyle={{
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IStockAdjustmentView) => formatDateAndTime(rowData.created_date_time)}
                            />
                            <Column
                                field="cart_date"
                                header={
                                    <span>
                                        Transfer Date
                                    </span>
                                }
                                sortable
                                filter
                                filterPlaceholder="Search"
                                filterMatchMode="contains"
                                headerStyle={{
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IStockAdjustmentView) => formatDateAndTime(rowData.cart_date)}
                            />
                        </DataTable>
                        <OverlayPanel ref={op} dismissable closeOnEscape>
                            {activeRowData && (
                                <ul
                                    style={{
                                        margin: 0,
                                        padding: "2px 0",
                                        listStyle: "none",
                                        minWidth: "auto",
                                        fontSize: "14px"
                                    }}
                                >
                                    <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrintViewOpen(activeRowData.id);
                                            op.current?.hide();
                                        }}
                                        style={{ margin: "5px 10px", height: "25px", display: "flex", alignItems: "center" }}
                                    >
                                        View Print
                                    </li>
                                    <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModel(activeRowData.id);
                                            op.current?.hide();
                                        }}
                                        style={{ color: "red", fontWeight: "600", margin: "5px 10px", height: "25px", display: "flex", alignItems: "center" }}
                                    >
                                        Delete
                                    </li>
                                </ul>
                            )}
                        </OverlayPanel>
                    </div>
                    {isOpenCreateModel && (
                        <StockAdjustmentModel
                            show={isOpenCreateModel}
                            onHide={() => {
                                setIsCreateModel(false);
                            }}
                            flag={1}
                            where_action={1}
                            setRefreshStockAdjustment={setRefreshStockAdjustment}
                        />
                    )}
                    {isDeleteConfirmation && (
                        <ConfirmationModal
                            show={isDeleteConfirmation}
                            onHide={() => {
                                setIsDeleteConfirmation(false);
                                setDeleteItemIds(0);
                            }}
                            handleSubmit={handleDeleteSubmit}
                            title={"Delete this Stock Adjustment"}
                            message={`Are you sure you want to delete this Stock Adjustment ?`}
                            btn1="CANCEL"
                            btn2="DELETE"
                        />
                    )}
                </div>
            </>
        </PrimeReactProvider>
    );
};

export default StockAdjustmentReport;