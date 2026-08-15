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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import CreateUnitView from "../../../left-side/header/Setting/product-unit/CreateUnitView";
import { IUnitView } from "../../../left-side/header/Setting/product-unit/UnitMasterController";
import { fetchUnitForReports, handleDeleteUnit } from "./ProductUnitReportController";

interface IPropsUnitReport {
    onHide?: () => void
}

const ProductUnitReport = ({
    onHide
}: IPropsUnitReport) => {
    const [loading, setLoading] = useState(false);

    const [unitList, setUnitList] = useState<IUnitView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");

    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditaleProduct] = useState<IUnitView>({
        unit: "",
        id: 0,
        is_point_value_allow: "", // New field: 1 = Yes, 0 = No
        created_date_time: "",
    })

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [deleteUnitId, setDeleteUnitId] = useState<number>(0);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const canView = useCheckUserPermission(
        PAGE_ID.UNIT_MASTER,
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(
        PAGE_ID.UNIT_MASTER,
        PERMISSION_TYPE.ADD
    );
    const canEdit = useCheckUserPermission(
        PAGE_ID.UNIT_MASTER,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.UNIT_MASTER,
        PERMISSION_TYPE.DELETE
    );

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        unit: {
            value: null,
            matchMode: "contains",
        },
        is_point_value_allow: {
            value: null,
            matchMode: "contains",
        },
    });

    const handleRefreshCategory = async () => {
        if (canView) {
            await fetchUnitForReports(
                setUnitList,
                setLoading
            );
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEscapeKey(() => {
        if (
            !openDropdownId
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null);
        }
    })

    useEffect(() => {
        fetchUnitForReports(
            setUnitList,
            setLoading
        );
    }, []);

    const handleEdit = (item: IUnitView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditaleProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (categoryId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (categoryId !== undefined) {
                setDeleteUnitId(categoryId);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No Unit selected for deletion");
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

        await handleDeleteUnit(
            deleteUnitId,
            setIsDeleteConfirmation,
            setLoading
        );

        handleRefreshCategory();
        setDeleteUnitId(0);
    };

    const actionBodyTemplate = useCallback((rowData: IUnitView) => {
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
                                display: openDropdownId === rowData.id ? "block" : "none",  // ✅ inline style
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

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Product Unit
                </h3>
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshCategory}
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
                        tooltip={`Add Unit`}
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
                    value={unitList}
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
                    <Column
                        field="unit"
                        header={
                            <span>
                                Unit Name
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
                        body={(rowData: IUnitView) => (
                            <span>
                                {rowData.unit}
                            </span>
                        )}
                    />

                    <Column
                        field="is_point_value_allow"
                        header={
                            <span>
                                Allowed To Qty In Points
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
                        body={(rowData: IUnitView) => (
                            <span>
                                {rowData.is_point_value_allow == "1" ? "Yes" : "No"}
                            </span>
                        )}
                    />
                </DataTable>
            </div>
            {isCreateModel && (
                <CreateUnitView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Unit"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateUnitView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Unit"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteUnitId(0);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title="Delete this Unit"
                    message="Are you sure you want to delete this Unit"
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default ProductUnitReport;