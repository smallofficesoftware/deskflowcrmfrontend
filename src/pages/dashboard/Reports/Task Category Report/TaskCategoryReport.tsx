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
import CreateTaskCategoryView from "../../../left-side/header/Setting/task-category/CreateTaskCategoryView";
import { handleDeleteTaskCategory } from "../../../left-side/header/Setting/task-category/TaskCategoryController";
import { ITaskCategoryView } from "../../../left-side/LeftSideController";
import { fetchTaskCategoryApi } from "./TaskCategoryReportController";

interface ITaskCategoryReport {
    onHide?: () => void;
}

const TaskCategoryReport = ({ onHide }: ITaskCategoryReport) => {
    const [loading, setLoading] = useState(false);

    const [taskCategoryList, setTaskCategoryList] = useState<ITaskCategoryView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);

    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [isModalFilterVisible, setIsModalFilterVisible] =
        useState<boolean>(false);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        task_category_name: {
            value: null,
            matchMode: "contains",
        },
        visibility: {
            value: null,
            matchMode: "contains",
        },
    });

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const actionDropdownRef = useRef<HTMLUListElement>(null);
    const [deleteCategoryIds, setDeleteCategoryIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<ITaskCategoryView>({
        task_category_name: "",
        id: 0,
        task_color: "",
        created_date_time: "",
        visibility: 0,
        is_assigned_widget: "",
    });
    const [isAllSelected, setIsAllSelected] = useState(false);


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(globalSearchText?.trim() ?? "");
        }, 400);

        return () => clearTimeout(timer);
    }, [globalSearchText]);

    useEffect(() => {
        let filteredData = [...taskCategoryList];

        if (debouncedSearchText) {
            filteredData = filteredData.filter((item) =>
                item.task_category_name
                    ?.toLowerCase()
                    .includes(debouncedSearchText.toLowerCase())
            );
        }

        setTaskCategoryList(filteredData);
    }, [debouncedSearchText]);

    const handleGlobalSearch = () => {
        const value = searchInputRef.current?.value || "";

        setGlobalSearchText(value);
    };

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchTaskCategoryApi(
            setTaskCategoryList,
            setLoading
        );
    }, []);

    useEscapeKey(() => {
        if (
            !openDropdownId
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null)
        }
    });

    const visibilityBodyTemplate = (rowData: ITaskCategoryView) => {
        return (
            <span
            >
                {rowData.visibility === 1 ? "External" : "Internal"}
            </span>
        );
    };
    const canAdd = useCheckUserPermission(
        PAGE_ID.TASK_CATEGORY,
        PERMISSION_TYPE.ADD
    );

    const canView = useCheckUserPermission(
        PAGE_ID.TASK_CATEGORY,
        PERMISSION_TYPE.VIEW
    );
    const canEdit = useCheckUserPermission(
        PAGE_ID.TASK_CATEGORY,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.TASK_CATEGORY,
        PERMISSION_TYPE.DELETE
    );
    const canAddAssignTeamMember = useCheckUserPermission(
        PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
        PERMISSION_TYPE.ADD,
    );
    let applicationId = localStorage.getItem("UUID");


    const handleRefreshCategory = async () => {
        if (canView) {
            await fetchTaskCategoryApi(setTaskCategoryList, setLoading);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteSelected = () => {
        if (selectedIds.length === 0) {
            toast.error("No Task categories selected");
            return;
        }
        if (canDelete) {
            setDeleteCategoryIds(selectedIds);
            setIsDeleteConfirmation(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };
    const openDeleteModel = (categoryId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (categoryId !== undefined) {
                setDeleteCategoryIds([categoryId]);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No Task category selected for deletion");
            }
        } else {
            setIsDeleteConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const toggleDropdownCategory = (categoryId: number | undefined) => {
        if (categoryId === undefined) return;
        console.log("TOGGLE CALLED:", categoryId);
        setIsActionDropdownOpen(false);

        setOpenDropdownId(categoryId);
        console.log("PREV:", categoryId);
    };


    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Check if clicked on individual category dropdown button
        const clickedOnButton = target.closest('.source-of-type-list-grid-options');
        if (clickedOnButton) return;

        // Check if clicked inside individual category dropdown
        const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
            (ref) => ref && ref.contains(target)
        );

        // Check if clicked on action dropdown button or inside action dropdown
        const clickedInsideActionDropdown =
            actionDropdownRef.current?.contains(target) ||
            target.closest('.selected-btn');

        if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
            setOpenDropdownId(null);
            setIsActionDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleEdit = (item: ITaskCategoryView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            // setCategoryInputInput(item.task_category_name);
            // setCategoryHexColorInput(item.task_color || "#999999");
            // setIsEditing(true);
            // setEditCategoryId(item.id);
            // setCategoryError("");
            // setVisibility(
            //   item.visibility === 1 ? 1 : 0
            // );
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteTaskCategory(
            deleteCategoryIds,
            setIsDeleteConfirmation,
            setTaskCategoryList,
            setLoading
        );
        setDeleteCategoryIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };
    const actionBodyTemplate = useCallback((rowData: any) => {
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
                                console.log("CLICKED:", rowData.id, "current open:", openDropdownId);
                                setIsActionDropdownOpen(false);
                                setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                            }}
                        />

                        <ul
                            ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                            style={{
                                width: "100px",
                                marginLeft: "12%",
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
                                    setOpenDropdownId(null);
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
                            {/* {applicationId &&
                                (
                                    rowData?.is_assigned_widget
                                        ?.split(",")
                                        ?.map((id: any) => id.trim())
                                        ?.includes(applicationId.toString())
                                ) ? (
                                <li
                                    className="listItem"
                                    role="button"
                                    onClick={(e) => {
                                        handleAssignWidgetDirectly(rowData.id, 2);
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                    }}
                                >
                                    Remove Widget
                                </li>

                            ) : (
                                <li
                                    className="listItem"
                                    role="button"
                                    onClick={(e) => {
                                        handleAssignWidgetDirectly(rowData.id, 1);
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                    }}
                                >

                                    Add Widget
                                </li>

                            )} */}
                        </ul>
                    </>
                )}
            </div>
        );
    }, [openDropdownId, canEdit, canDelete]);

    // const handleAssignWidgetDirectly = async (
    //     id?: number,
    //     request_flag?: any// 1 = add , 2 = remove
    // ) => {

    //     if (!canAddAssignTeamMember) {
    //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    //         return;
    //     }

    //     try {

    //         setLoading(true);

    //         const success = await updateUserCheckBox(
    //             id,
    //             request_flag,
    //             setLoading,
    //             setTaskCategoryList
    //         );

    //         if (success) {
    //             toast.success(
    //                 request_flag == 1
    //                     ? "Widget added successfully"
    //                     : "Widget removed successfully"
    //             );
    //         }

    //     } catch (error) {

    //         toast.error(
    //             request_flag == 1
    //                 ? "Failed to add widget"
    //                 : "Failed to remove widget"
    //         );

    //     } finally {

    //         setLoading(false);

    //     }

    // };

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Task Category
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
                        tooltip={`Add Task Category`}
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
                    value={taskCategoryList}
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
                            width: "30px",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                        }}
                        body={actionBodyTemplate}
                    />
                    <Column
                        field="task_category_name"
                        header={
                            <span>
                                Task Category Name
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "200px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ITaskCategoryView) => (
                            <span
                                style={{
                                    backgroundColor: rowData.task_color
                                        ? rowData.task_color
                                        : "#eeeeee"
                                }}
                                className="badge rounded-pill"
                            >
                                {rowData.task_category_name}
                            </span>
                        )}
                    />

                    <Column
                        field="visibility"
                        header={
                            <span>
                                Visibility
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "200px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={visibilityBodyTemplate}
                    />
                </DataTable>
            </div>
            {isCreateModel && (
                <CreateTaskCategoryView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Task Category"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateTaskCategoryView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Task Category"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteCategoryIds([]);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title={
                        deleteCategoryIds.length > 1
                            ? "Delete Task Categories"
                            : "Delete this Task Category"
                    }
                    message={`Are you sure you want to delete ${deleteCategoryIds.length > 1
                        ? "these Task categories"
                        : "this Task category"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default TaskCategoryReport;