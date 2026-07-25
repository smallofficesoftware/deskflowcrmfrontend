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
import CreateExpenseTypeView from "../../../left-side/header/Setting/expense-type/CreateExpenseTypeView";
import { handleDeleteExpenseType, IExpenseTypeView } from "../../../left-side/header/Setting/expense-type/ExpenseTypeController";
import { fetchExpenseTypeApi } from "./ExpenseTypesReportController";

interface IWhatsappTemplateReport {
    onHide?: () => void;
}

const ExpenseTypesReport = ({ onHide }: IWhatsappTemplateReport) => {
    const [loading, setLoading] = useState(false);
    const [expenseTypeList, setExpenseTypeList] = useState<IExpenseTypeView[]>([]);
    const [globalSearchText, setGlobalSearchText] = useState("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        source_name: {
            value: null,
            matchMode: "contains",
        },
    });
    const actionDropdownRef = useRef<HTMLUListElement>(null);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {},
    );
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableExpenseType, setEditableExpenseType] = useState<IExpenseTypeView>({
        id: 0,
        expense_name: "",
        color: "",
        expense_subtype: 0,
        compulsory_image: 0,
        min_time: "",
        max_time: "",
        min_amount: 0,
        max_amount: 0,
        fix_amount: 0,
        amount_per_km: 0,
        created_date_time: "",
    });
    const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchExpenseTypeApi(
            setExpenseTypeList,
            setLoading
        );
    }, []);

    useEscapeKey(() => {
        if (
            !openDropdownId
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null);
        }
    });

    const canView = useCheckUserPermission(
        PAGE_ID.EXPENSE_TYPE,
        PERMISSION_TYPE.VIEW,
    );
    const canAdd = useCheckUserPermission(
        PAGE_ID.EXPENSE_TYPE,
        PERMISSION_TYPE.ADD,
    );
    const canEdit = useCheckUserPermission(
        PAGE_ID.EXPENSE_TYPE,
        PERMISSION_TYPE.EDIT,
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.EXPENSE_TYPE,
        PERMISSION_TYPE.DELETE,
    );

    const handleRefreshExpenseType = async () => {
        if (canView) {
            await fetchExpenseTypeApi(setExpenseTypeList, setLoading);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleEdit = (item: IExpenseTypeView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableExpenseType(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleDelete = (itemId: number) => {
        setOpenDropdownId(null);
        if (canDelete) {
            // setExpenseTypeDropdown({});
            setDeleteItemIds([itemId]);
            setIsDeleteConfirmation(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest(".source-of-type-list-grid-options");
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(
            dropdownContactRef.current,
        ).some((ref) => ref && ref.contains(target));

        const clickedInsideActionDropdown =
            actionDropdownRef.current?.contains(target) ||
            target.closest(".selected-btn");

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

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteExpenseType(
            deleteItemIds,
            setIsDeleteConfirmation,
            setExpenseTypeList,
            setLoading,
        );
        setIsDeleteConfirmation(false);
        setDeleteItemIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };

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
                        ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                        style={{
                            width: "150px",
                            marginLeft: "15%",
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
                    Expense Type
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
                        tooltip={`Add Expense Type`}
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
                    value={expenseTypeList}
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
                        field="expense_name"
                        header={
                            <span>
                                Expense Name
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
                        body={(rowData: IExpenseTypeView) => {
                            return (
                                <span
                                    style={{
                                        backgroundColor: rowData.color
                                            ? rowData.color
                                            : "#eeeeee"
                                    }}
                                    className="badge rounded-pill"
                                >
                                    {rowData.expense_name}
                                </span>
                            );
                        }}
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
                    title={
                        deleteItemIds.length > 1
                            ? "Delete Expense Types"
                            : "Delete this Expense Type"
                    }
                    message={`Are you sure you want to delete ${deleteItemIds.length > 1
                        ? "these expense types"
                        : "this expense type"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isCreateModel && (
                <CreateExpenseTypeView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Expense Type"
                    handleRefreshExpenseType={handleRefreshExpenseType}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateExpenseTypeView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Expense Type"
                    handleRefreshExpenseType={handleRefreshExpenseType}
                    productToEdit={editableExpenseType}
                />
            )}
        </div>
    );
};

export default ExpenseTypesReport;