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
import CheckBoxModal from "../../../../components/model/CheckBoxModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import AddWarehouseView from "../../../left-side/header/Setting/warehouse/AddWarehouseView";
import { fetchAllCompanyApi, handleDeleteWarehouse, IWarehouseView, updateUserCheckBox } from "../../../left-side/header/Setting/warehouse/WarehouseController";
import { fetchDepartmentsApi } from "../../../left-side/list-company/EditTeamMemberController";
import { fetchWarehouseApi } from "./WarehouseReportController";

interface IWarehouseReport {
    onHide?: () => void;
}

const WarehouseReport = ({
    onHide
}: IWarehouseReport) => {
    const [loading, setLoading] = useState(false);
    const [warehouseLists, setWarehouseList] = useState<IWarehouseView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<IWarehouseView>({
        warehouse_name: "",
        id: 0,
        warehouse_color: "",
        created_date_time: "",
        assigned_team_member: "",
    });

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [deleteWarehouseIds, setDeleteWarehouseIds] = useState<number[]>([]);

    const [userAssignTaskId, setUserAssignTaskId] = useState<number>();
    const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
        useState<boolean>(false);
    const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
    const [editWarehouseId, setEditWarehouseId] = useState<any>(
        undefined
    );
    const [departments, setDepartments] = useState<any[]>([]);

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        warehouse_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        if (isModalAssignUserVisible) {
            fetchAllCompanyApi(setOptionJoinCompany);
            fetchDepartmentsApi(setDepartments);
        }
    }, [
        isModalAssignUserVisible,
    ]);

    useEffect(() => {
        fetchWarehouseApi(
            setWarehouseList,
            setLoading
        );
    }, []);

    useEscapeKey(() => {
        if (
            !openDropdownId &&
            !isUpdateModel &&
            !isCreateModel &&
            !isModalAssignUserVisible
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null);
            setIsUpdateModel(false);
            setIsCreateModel(false);
            setIsModalAssignUserVisible(false);
        }
    });

    const getOptionName = (option: { username: string; department: number }) => {
        const departmentObj = departments.find(
            (item) => item.id === option.department,
        );

        if (departmentObj) {
            return `${option.username} (${departmentObj.department_name})`;
        }

        return option.username;
    };

    const canView = useCheckUserPermission(
        PAGE_ID.WAREHOUSE,           // ← hopefully you have this enum value
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(PAGE_ID.WAREHOUSE, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(
        PAGE_ID.WAREHOUSE,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.WAREHOUSE,
        PERMISSION_TYPE.DELETE
    );

    const handleRefreshWarehouse = async () => {
        if (canView) {
            await fetchWarehouseApi(setWarehouseList, setLoading);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleEdit = (item: IWarehouseView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (warehouseId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (warehouseId !== undefined) {
                setDeleteWarehouseIds([warehouseId]);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No warehouse selected for deletion");
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

        await handleDeleteWarehouse(
            deleteWarehouseIds,
            setIsDeleteConfirmation,
            setWarehouseList,
            setLoading
        );
        setDeleteWarehouseIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };

    const handleModalOpenUserAssign = (id?: number | undefined) => {
        setOpenDropdownId(null);
        if (canAdd) {
            setUserAssignTaskId(id);
            setIsModalAssignUserVisible(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleConfirmAssignUser = async (
        contactId: number | undefined,
        checkedOptions: any[],
    ) => {

        let idsToUpdate: number | number[];

        if (selectedIds.length > 0) {
            idsToUpdate = selectedIds;

        } else if (contactId !== undefined) {
            idsToUpdate = contactId;

        } else {
            console.log("No ID Found");
            return;
        }

        await updateUserCheckBox(idsToUpdate, checkedOptions, setLoading, setWarehouseList);

        setIsAllSelected(false);
        setSelectedIds([]);
        setIsModalAssignUserVisible(false);
    };

    const actionBodyTemplate = useCallback((rowData: IWarehouseView) => {
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
                            <li style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }} className="listItem" role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    openDeleteModel(rowData.id);
                                }}
                            >
                                Delete
                            </li>
                            <li
                                className="listItem"
                                role="button"
                                onClick={() => {
                                    handleModalOpenUserAssign(rowData.id);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                <span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="15"
                                        viewBox="0 -960 960 960"
                                        width="15"
                                        fill="currentColor"
                                    >
                                        <path d="M216-144q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h171q8-32 34.03-52t59-20Q513-888 539-868t34 52h171q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm264-624q10.4 0 17.2-6.8 6.8-6.8 6.8-17.2 0-10.4-6.8-17.2-6.8-6.8-17.2-6.8-10.4 0-17.2 6.8-6.8 6.8-6.8 17.2 0 10.4 6.8 17.2 6.8 6.8 17.2 6.8ZM216-269q56-46 124-68.5T480-360q72 0 140 22t124 69v-475H216v475Zm264.24-139Q540-408 582-450.24q42-42.24 42-102T581.76-654q-42.24-42-102-42T378-653.76q-42 42.24-42 102T378.24-450q42.24 42 102 42ZM265-216h430q-46-35-101-53.5T480-288q-59 0-113.5 18.5T265-216Zm215-264q-30 0-51-21t-21-51q0-30 21-51t51-21q30 0 51 21t21 51q0 30-21 51t-51 21Zm0-72Z" />
                                    </svg>
                                </span>{" "}
                                Assign to Team Member
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
                    All Warehouse
                </h3>
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshWarehouse}
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
                        tooltip={`Add Source`}
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
                    value={warehouseLists}
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
                        field="warehouse_name"
                        header={
                            <span>
                                Warehouse Name
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
                        body={(rowData: IWarehouseView) => {
                            return (
                                <span
                                    style={{
                                        backgroundColor: rowData.warehouse_color
                                            ? rowData.warehouse_color
                                            : "#eeeeee"
                                    }}
                                    className="badge rounded-pill"
                                >
                                    {rowData.warehouse_name}
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {isCreateModel && (
                <AddWarehouseView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Add Warehouse"
                    handleRefreshWarehouse={handleRefreshWarehouse}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <AddWarehouseView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Warehouse"
                    handleRefreshWarehouse={handleRefreshWarehouse}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteWarehouseIds([]);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title={
                        deleteWarehouseIds.length > 1
                            ? "Delete Warehouses"
                            : "Delete this Warehouse"
                    }
                    message={`Are you sure you want to delete ${deleteWarehouseIds.length > 1
                        ? "these warehouses"
                        : "this warehouse"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isModalAssignUserVisible && (
                <CheckBoxModal
                    show={isModalAssignUserVisible}
                    onHide={() => setIsModalAssignUserVisible(false)}
                    handleSubmit={handleConfirmAssignUser}
                    title="Assign your User"
                    message="Please select the Users for this Warehouse"
                    btn1="Cancel"
                    btn2="Submit"
                    options={optionJoinCompany}
                    selectedLabelIds={
                        warehouseLists.find(
                            (item) =>
                                item.id === (userAssignTaskId ?? Number(editWarehouseId?.id)),
                        )?.assigned_team_member
                    }
                    contactId={userAssignTaskId ?? editWarehouseId?.id}
                    getOptionName={getOptionName}
                    showColorBadge={false}
                />
            )}
        </div>
    );
};

export default WarehouseReport;