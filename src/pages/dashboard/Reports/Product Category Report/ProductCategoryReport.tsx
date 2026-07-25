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
import { ICategoryView } from "../../../left-side/header/Setting/category/CategoryController";
import CreateCategoryView from "../../../left-side/header/Setting/category/CreateCategoryView";
import { fetchCategoriesReport, handleDeleteCategory } from "./ProductCategoryReportController";

interface IPropsCategoryReport {
    onHide?: () => void
}

const ProductCategoryReport = ({
    onHide
}: IPropsCategoryReport) => {
    const [loading, setLoading] = useState(false);
    const [categoryList, setCategoryList] = useState<ICategoryView[]>([]);
    const [globalSearchText, setGlobalSearchText] = useState("");

    const [debouncedSearchText, setDebouncedSearchText] = useState("");

    const searchInputRef = useRef<HTMLInputElement>(null);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<ICategoryView>({
        category_name: "",
        id: 0,
        color: "",
        created_date_time: "",
        group_id: 0,
        group_name: "",
    });

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [deleteCategoryId, setDeleteCategoryId] = useState<number>(0);

    const canView = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.DELETE);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        category_name: {
            value: null,
            matchMode: "contains",
        },
        group_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const handleRefreshCategory = async () => {
        if (canView) {
            await fetchCategoriesReport(
                setCategoryList,
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
        fetchCategoriesReport(
            setCategoryList,
            setLoading
        );
    }, []);

    const handleEdit = (item: ICategoryView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (categoryId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (categoryId !== undefined) {
                setDeleteCategoryId(categoryId);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No category selected for deletion");
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

        await handleDeleteCategory(
            deleteCategoryId,
            setIsDeleteConfirmation,
            setLoading
        );
        handleRefreshCategory();
        setDeleteCategoryId(0);
    };

    const actionBodyTemplate = useCallback((rowData: ICategoryView) => {
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
                                marginLeft: "15%",
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
                    Product Category
                </h3>
                <div className="d-flex gap-2 align-items-center">

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
                        tooltip={`Add Category`}
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
                    value={categoryList}
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
                        field="category_name"
                        header={
                            <span>
                                Category Name
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
                        body={(rowData: ICategoryView) => {
                            return (
                                <span
                                    style={{
                                        backgroundColor: rowData.color
                                            ? rowData.color
                                            : "#eeeeee"
                                    }}
                                    className="badge rounded-pill"
                                >
                                    {rowData.category_name}
                                </span>
                            );
                        }}
                    />
                    <Column
                        field="group_name"
                        header={
                            <span>
                                Group Name
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
                        body={(rowData: ICategoryView) => {
                            return (
                                <span>
                                    {rowData.group_name || "-"}
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {isCreateModel && (
                <CreateCategoryView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Category"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateCategoryView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Department"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteCategoryId(0);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title="Delete this Category"
                    message="Are you sure you want to delete this category"
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default ProductCategoryReport;