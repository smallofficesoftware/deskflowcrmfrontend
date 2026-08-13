import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { formatDateAndTime, useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { fetchProductApi, handleDeleteBillOfMaterials, IBillOfMaterialsView } from "../../../left-side/header/Setting/bill-of-materials/BillOfMaterialsController";
import BomMasterView from "../../../left-side/header/Setting/product/bom-master/BomMasterView";
import { IProductView } from "../../../left-side/header/Setting/product/ProductController";
import { fetchBillOfMaterialsApi } from "./BillOfMaterialReportController";

interface IBillOfMaterialReport {
    onHide?: () => void;
}

const BillOfMaterialReport = ({
    onHide
}: IBillOfMaterialReport) => {
    const [loading, setLoading] = useState(false);
    const [billOfMaterialsLists, setBillOfMaterialsLists] = useState<IBillOfMaterialsView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const [selectedProduct, setSelectedProduct] = useState<IProductView>();
    const [isBomDetailsOpen, setIsBomDetailsOpen] = useState(false);
    const [productIdForDelete, setProductIdForDelete] = useState<number>(0);
    const [deleteMaterialsIds, setDeleteMaterialsIds] = useState<number[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const canView = useCheckUserPermission(
        PAGE_ID.BILL_OF_MATERIALS,
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(
        PAGE_ID.BILL_OF_MATERIALS,
        PERMISSION_TYPE.ADD
    );
    const canEdit = useCheckUserPermission(
        PAGE_ID.BILL_OF_MATERIALS,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.BILL_OF_MATERIALS,
        PERMISSION_TYPE.DELETE
    );

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        machine_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchBillOfMaterialsApi(
            setBillOfMaterialsLists,
            setLoading
        );
    }, []);

    useEscapeKey(() => {
        if (
            !openDropdownId &&
            !isBomDetailsOpen
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null);
            setIsBomDetailsOpen(false);
        }
    });

    const handleRefreshCategory = async () => {
        if (canView) {
            await fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleEdit = async (item: IBillOfMaterialsView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            await fetchProductApi(setSelectedProduct, setLoading, `${item.product_id}`, "");
            setIsBomDetailsOpen(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handlePrintView = (item: IBillOfMaterialsView) => {
        const baseURL = window.location.origin;
        const supportURL = `${baseURL}/BomPdfView/${item.product_id}/${item.id}`;
        const myWindow = window.open(supportURL, "_blank");
    };

    const openDeleteModel = (productId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (productId !== undefined) {
                setProductIdForDelete(productId);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No Name selected for deletion");
            }
        } else {
            setIsDeleteConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteBillOfMaterials(
            productIdForDelete,
            setIsDeleteConfirmation,
            setBillOfMaterialsLists,
            setLoading
        );
        setDeleteMaterialsIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };

    const actionBodyTemplate = useCallback((rowData: IBillOfMaterialsView) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rowData.id !== -1 && (
                    <>
                        <Button
                            icon="pi pi-cog"
                            className="p-button-text source-of-type-list-grid-options"
                            style={{ color: "green", width: "2rem" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                            }}
                        />

                        <ul
                            ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                            style={{
                                width: "100px",
                                marginLeft: "10%",
                                height: "auto",
                                display: openDropdownId === rowData.id ? "block" : "none",
                                position: "absolute",
                                zIndex: 9999,
                                background: "#fff",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                                borderRadius: "6px",
                                padding: "5px 0",
                                listStyle: "none",
                            }}
                        >
                            <li className="listItem" role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(rowData);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Edit
                            </li>
                            <li
                                className="listItem"
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintView(rowData);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Print
                            </li>
                            <li style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }} className="listItem" role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    openDeleteModel(rowData.id);
                                }}
                            >
                                Delete
                            </li>
                        </ul>
                    </>
                )}
            </div>
        );
    }, [openDropdownId, canEdit, canDelete]);

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

    type BomColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        body: (rowData: IBillOfMaterialsView) => React.ReactNode;
    };

    const baseColumnDefs: BomColumnDef[] = useMemo(() => [
        {
            key: "bom_number",
            label: "Bom Number",
            header: <span>Bom Number</span>,
            body: (rowData) => rowData.bom_number,
        },
        {
            key: "bom_name",
            label: "BOM Name",
            header: <span>BOM Name</span>,
            body: (rowData) => rowData.bom_name,
        },
        {
            key: "product_name",
            label: "Product Name",
            header: <span>Product Name</span>,
            body: (rowData) => rowData.product_name,
        },
        {
            key: "createdByName",
            label: "Created By",
            header: <span>Created By</span>,
            body: (rowData) => rowData.createdByName,
        },
        {
            key: "created_date_time",
            label: "Created Date-Time",
            header: <span>Created Date-Time</span>,
            body: (rowData) => formatDateAndTime(rowData.created_date_time),
        },
    ], []);

    const {
        visibleColumns,
        orderedColumns,
        hiddenKeys,
        toggleColumn,
        reorderColumns,
        resetColumns,
    } = useColumnPreferences("bill_of_material_report", baseColumnDefs);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Bill Of Material
                </h3>
                <ColumnsButton
                    columns={orderedColumns}
                    hiddenKeys={hiddenKeys}
                    onToggle={toggleColumn}
                    onReorder={reorderColumns}
                    onReset={resetColumns}
                />
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
                    value={billOfMaterialsLists}
                    loading={loading}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    className="custom-centered-table"
                    tableStyle={{ tableLayout: "fixed", width: "100%" }}
                    emptyMessage="No data found"
                    filterDisplay="row"
                    filters={filters}
                    onFilter={onFilter}
                    key={openDropdownId}
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
            {isBomDetailsOpen && selectedProduct && (
                <BomMasterView
                    show={isBomDetailsOpen}
                    onHide={() => setIsBomDetailsOpen(false)}
                    product={selectedProduct}
                    handelRefreshProduct={handleRefreshCategory}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setProductIdForDelete(0);
                        setDeleteMaterialsIds([]);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title={
                        deleteMaterialsIds.length > 1
                            ? "Delete Names"
                            : "Delete this Name"
                    }
                    message={`Are you sure you want to delete ${deleteMaterialsIds.length > 1
                        ? "these Names"
                        : "this Name"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default BillOfMaterialReport;