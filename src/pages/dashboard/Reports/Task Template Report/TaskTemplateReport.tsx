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
import CreateTaskTemplateView from "../../../left-side/header/Setting/task-template/CreateTaskTemplateView";
import { handleDeleteTaskTemplate, ITaskTemplateView } from "../../../left-side/header/Setting/task-template/TaskTemplateController";
import TaskTemplateDataSourceView from "../../../left-side/header/Setting/task-template/TaskTemplateDataSourceView";
import {
    fetchCompanyApi,
    fetchTaskTemplateApi,
    ICompanyView,
    ITaskTemplate,
    orderTypesStageList
} from "./TaskTemplateReportController";

interface ITaskTemplateReport {
    onHide?: () => void;
}

const TaskTemplateReport = ({
    onHide
}: ITaskTemplateReport) => {
    const [loading, setLoading] = useState(false);
    const [tasktemplateLists, setTaskTemplateList] = useState<ITaskTemplate[]>([]);
    const [titleList, setTitleList] = useState<ICompanyView[]>([]);
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);

    const [globalSearchText, setGlobalSearchText] = useState("");

    const [debouncedSearchText, setDebouncedSearchText] = useState("");

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        name: {
            value: null,
            matchMode: "contains",
        },
        templete_type: {
            value: null,
            matchMode: "contains",
        },
    });

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const dropdownTaskTemplateRef = useRef<Record<number, HTMLUListElement | null>>({});
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<ITaskTemplateView>({
        templete_type: 0,
        name: "",
        id: 0,
        color: "",
        display_order_type: 0,
    });
    const [isAddDataSource, setIsAddDataSource] = useState(false);
    const [title, setTitle] = useState("");
    const [addDataSourceItem, setAddDataSourceItem] =
        useState<ITaskTemplateView>();
    const [tasktemplateDropdown, setTaskTemplateDropdown] = useState<any>(null);
    const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const actionDropdownRef = useRef<HTMLUListElement>(null);


    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {

        fetchTaskTemplateApi(
            setTaskTemplateList,
            setLoading
        );

        fetchCompanyApi(setTitleList);

    }, []);

    useEscapeKey(() => {
        if (
            !isCreateModel &&
            !openDropdownId &&
            !isUpdateModel &&
            !isAddDataSource
        ) {
            onHide?.();
        } else {
            setIsCreateModel(false);
            setOpenDropdownId(null);
            setIsUpdateModel(false);
            setIsAddDataSource(false);
        }
    });

    const customLabels: Record<string, string> = {
        "5": titleList?.[0]?.quotation_title || "Quotation",
        "6": titleList?.[0]?.order_title || "Sales Order",
        "7": titleList?.[0]?.invoice_title || "Sales Invoice",
        "8": titleList?.[0]?.purchase_title || "Purchase Invoice",
        "9": titleList?.[0]?.purchase_order_title || "Purchase Order",
        "10": titleList?.[0]?.return_sales_invoice_title || "Return Sales Invoice",
        "11": titleList?.[0]?.return_purchase_invoice_title || "Return Purchase Invoice",
        "12": titleList?.[0]?.inward_title || "Goods Received Note",
        "13": titleList?.[0]?.dispatch_title || "Dispatch",
    };

    const orderDisplayOptions = orderTypesStageList?.map(
        (option: {
            id: number;
            order_type_display: string;
        }) => ({
            value: option.id,
            label:
                customLabels[String(option.id)] ||
                option.order_type_display,
        })
    );

    const canAdd = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.ADD);
    const canView = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.VIEW);
    const canEdit = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.DELETE);

    const handleRefreshTaskTemplate = async () => {
        await fetchTaskTemplateApi(setTaskTemplateList, setLoading);
    };

    const handleEdit = (item: ITaskTemplateView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };
    const dataSource = (item: ITaskTemplateView) => {
        setIsAddDataSource(true);
        setAddDataSourceItem(item);
        setTitle(item.name)
    };
    const handleDelete = (itemId: number) => {
        setOpenDropdownId(null);
        if (canDelete) {
            setTaskTemplateDropdown({});
            setDeleteItemIds([itemId]);
            setIsDeleteConfirmation(true);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteTaskTemplate(
            deleteItemIds,
            setIsDeleteConfirmation,
            setTaskTemplateList,
            setLoading
        );
        setIsDeleteConfirmation(false);
        setDeleteItemIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest('.source-of-type-list-grid-options');
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(dropdownTaskTemplateRef.current).some(
            (ref) => ref && ref.contains(target)
        );

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

    const actionBodyTemplate = useCallback((rowData: any) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsActionDropdownOpen(false);
                            setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                        }}
                    />

                    <ul
                        ref={(el) => (dropdownTaskTemplateRef.current[rowData.id] = el)}
                        style={{
                            width: "150px",
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
                        <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleEdit(rowData);
                            }}
                            style={{ marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Edit
                        </li>
                        <li
                            className="listItem"
                            role="button"
                            onClick={() => {
                                setOpenDropdownId(null);
                                dataSource(rowData)
                            }}
                            style={{ marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            View Data sources
                        </li>
                        {rowData.id > 0 && <li
                            style={{ color: "red", fontWeight: "600", marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleDelete(rowData.id);
                            }}
                        >
                            Delete
                        </li>}
                    </ul>
                </>
            </div>
        );
    }, [openDropdownId, canEdit, canDelete]);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Task Template
                </h3>

                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshTaskTemplate}
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
                        tooltip={`Add Task Template`}
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
                    value={tasktemplateLists}
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
                        field="templete_type"
                        header={
                            <span>
                                Type
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "100px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ITaskTemplate) => {
                            const selectedType = orderDisplayOptions.find(
                                (option: { value: number; label: string }) =>
                                    Number(option.value) === rowData.templete_type
                            );
                            return (
                                <span>
                                    {selectedType?.label || "-"}
                                </span>
                            );
                        }}
                    />

                    <Column
                        field="name"
                        header={
                            <span>
                                Template Name
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
                        body={(rowData: ITaskTemplate) => (
                            <span
                                style={{
                                    backgroundColor: rowData.color
                                        ? rowData.color
                                        : "#eeeeee"
                                }}
                                className="badge rounded-pill"
                            >
                                {rowData.name}
                            </span>
                        )}
                    />
                    <Column
                        field="display_order_type"
                        header={
                            <span>
                                Display Order Type
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "100px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ITaskTemplate) => rowData.display_order_type}
                    />
                </DataTable>
            </div>
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteItemIds([]);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title={deleteItemIds.length > 1 ? "Delete Task Templates" : "Delete this Task Templates"}
                    showPermission
                    permissionText={"Deleting this template will permanently remove its tasks. I agree."}
                    message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these Task Templates" : "this Task Templates"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isCreateModel && (
                <CreateTaskTemplateView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Task Template"
                    handleRefreshTaskTemplate={handleRefreshTaskTemplate}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateTaskTemplateView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Task Template"
                    handleRefreshTaskTemplate={handleRefreshTaskTemplate}
                    productToEdit={editableProduct}
                />
            )}
            {isAddDataSource && (
                <TaskTemplateDataSourceView
                    show={isAddDataSource}
                    onHide={() => setIsAddDataSource(false)}
                    passDataInAddItem={addDataSourceItem}
                    title={title}
                />
            )}
        </div>
    );
};

export default TaskTemplateReport;