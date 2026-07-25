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
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { IOption } from "../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { ICompany } from "../../../left-side/header/Setting/custom-inquiry-from/CustomInquiryFromController";
import CreateLeaveView from "../../../left-side/header/Setting/leave/create-leave/CreateLeaveView";
import { handleDeleteLeave, ILeaveView } from "../../../left-side/header/Setting/leave/LeaveController";
import { fetchLeaveReportApi } from "./LeaveManagementReportController";

interface IPropsLeaveReportView {
    team_id?: number;
    onHide?: () => void;
}
const LeaveManagementReport = ({
    team_id,
    onHide
}: IPropsLeaveReportView) => {

    const [loading, setLoading] = useState(false);
    const [companyTitle, setCompanyTitle] = useState<ICompany | undefined>();
    const [globalSearchText, setGlobalSearchText] = useState("");
    const [selectedOrderList, setSelectedOrderList] = useState<IOption | null>(
        null,
    );
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [OrderListError, setOrderListError] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        id: {
            value: null,
            matchMode: "contains",
        },
        leave_type: {
            value: null,
            matchMode: "contains",
        },
        leave_status: {
            value: null,
            matchMode: "contains",
        },
        leave_duration: {
            value: null,
            matchMode: "contains",
        },
        leave_date: {
            value: null,
            matchMode: "contains",
        },
        reporting_date: {
            value: null,
            matchMode: "contains",
        },
        remark: {
            value: null,
            matchMode: "contains",
        },
        created_by_username: {
            value: null,
            matchMode: "contains",
        },
        created_date_time: {
            value: null,
            matchMode: "contains",
        },
    });
    const getUUID: any = localStorage.getItem("UUID");

    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownStageStatusRef = useRef<
        Record<number, HTMLUListElement | null>
    >({});

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
    const [selectedPageType, setSelectedPageType] =
        useState<SingleValue<IOption> | null>(null);
    const [leaveLists, setLeaveList] = useState<ILeaveView[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isOpenCreateModel, setIsCreateModel] = useState(false);
    const [createEditStatusFlag, setCreateEditStatusFlag] = useState<string>("");
    const [refreshProduct, setRefreshProduct] = useState(false);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {}
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const [deleteItemId, setDeleteItemId] = useState<number | undefined>(
        undefined
    );
    const [leaveDropdown, setLeaveDropdown] = useState<any>(null);
    const [hasIdAvail, setHasIdAvail] = useState<number>();
    const [isOpenEditModel, setIsOpenEditModel] = useState(false);
    const [isOpenViewModel, setIsOpenViewModel] = useState(false);
    const [isOpenStatusModel, setIsOpenStatusModel] = useState(false);
    const [editLeaveStatusItem, setEditLeaveStatusItem] =
        useState<ILeaveView>();
    const [statusFlag, setStatusFlag] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [editLeaveItem, setEditLeaveItem] = useState<ILeaveView>();
    const [viewLeaveItem, setViewLeaveItem] = useState<ILeaveView>();

    const [searchOpen, setSearchOpen] = useState(false);


    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {

        fetchLeaveReportApi(
            setLeaveList,
            setLoading,
            searchTerm,
        );


    }, []);

    useEscapeKey(() => {
        if (
            !isOpenCreateModel &&
            !openDropdownId &&
            !isOpenEditModel &&
            !isOpenViewModel &&
            !isOpenStatusModel &&
            !isDeleteConfirmation
        ) {
            onHide?.();
        } else {
            setIsCreateModel(false);
            setOpenDropdownId(null);
            setIsOpenEditModel(false);
            setIsOpenViewModel(false);
            setIsOpenStatusModel(false);
            setIsDeleteConfirmation(false);
        }
    })


    const canView = useCheckUserPermission(
        PAGE_ID.LEAVE,
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(PAGE_ID.LEAVE, PERMISSION_TYPE.ADD);

    const canEdit = useCheckUserPermission(
        PAGE_ID.LEAVE,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.LEAVE,
        PERMISSION_TYPE.DELETE
    );
    const handleEdit = (item: ILeaveView, addUpdateStatus: string) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditLeaveItem(item);
            setIsOpenEditModel(true);
            setLeaveDropdown(null);
            setCreateEditStatusFlag(addUpdateStatus);
        } else {
            setLeaveDropdown(null);
            setIsOpenEditModel(false);
            setCreateEditStatusFlag(addUpdateStatus);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleView = (item: ILeaveView, addUpdateStatus: string) => {
        setOpenDropdownId(null);
        if (canView) {
            setViewLeaveItem(item);
            setIsOpenViewModel(true);
            setLeaveDropdown(null);
            setCreateEditStatusFlag(addUpdateStatus);
        } else {
            setLeaveDropdown(null);
            setIsOpenViewModel(false);
            setCreateEditStatusFlag(addUpdateStatus);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    function openDeleteModel(ExpenseId: number | undefined) {
        setOpenDropdownId(null);
        if (canDelete) {
            setDeleteItemId(ExpenseId);
            setIsDeleteConfirmation(true);
        } else {
            setIsDeleteConfirmation(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }

    // const handleClickOutside = (event: MouseEvent) => {
    //     const target = event.target as HTMLElement;

    //     const clickedOnButton = target.closest('.icon-more');
    //     if (clickedOnButton) return;

    //     const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
    //         (ref) => ref && ref.contains(target)
    //     );

    //     if (!clickedInsideDropdown) {
    //         setOpenDropdownId(null);
    //         setLeaveDropdown({});
    //         setHasIdAvail(undefined);
    //     }
    // };

    const handleStatusChange = (
        item: ILeaveView,
        status: string
    ) => {
        setOpenDropdownId(null);
        setIsOpenStatusModel(true);
        setEditLeaveStatusItem(item);
        setStatusFlag(status);
        setAmount(amount);
    };

    // useEffect(() => {
    //     document.addEventListener("mousedown", handleClickOutside);
    //     return () => {
    //         document.removeEventListener("mousedown", handleClickOutside);
    //     };
    // }, []);

    useEffect(() => {
        if (refreshProduct) {
            const fetchData = async () => {
                await fetchLeaveReportApi(setLeaveList, setLoading, searchTerm, team_id);
                setRefreshProduct(false);
            };
            fetchData();
        }
    }, [refreshProduct]);

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
                        {rowData.leave_status === 1 && (
                            <>
                                <li
                                    className="listItem"
                                    role="button"
                                    onClick={() =>
                                        handleEdit(
                                            rowData,
                                            "createEdit"
                                        )
                                    }
                                    style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                >
                                    Edit
                                </li>
                            </>
                        )}
                        {rowData.leave_status !== 1 && (
                            <>
                                <li
                                    className="listItem"
                                    role="button"
                                    onClick={() =>
                                        handleView(
                                            rowData,
                                            "createEdit"
                                        )
                                    }
                                    style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                >
                                    View Details
                                </li>
                            </>
                        )}
                        {rowData.companyFlag === 1 && (
                            <>
                                {rowData.leave_status ===
                                    1 && (
                                        <>
                                            <li
                                                className="listItem text-start"
                                                role="button"
                                                onClick={() =>
                                                    handleStatusChange(
                                                        rowData,
                                                        "pass"
                                                    )
                                                }
                                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                            >
                                                Pass status
                                            </li>

                                            <li
                                                className="listItem text-start"
                                                role="button"
                                                onClick={() =>
                                                    handleStatusChange(
                                                        rowData,
                                                        "reject"
                                                    )
                                                }
                                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                            >
                                                Reject status
                                            </li>
                                        </>
                                    )}
                            </>
                        )}
                        {(rowData.leave_status === 1 || (rowData.companyFlag === 1)) && (
                            <>
                                <li
                                    className="listItem text-start"

                                    role="button"
                                    onClick={() =>
                                        openDeleteModel(rowData.id)
                                    }
                                    style={{
                                        color: '#dc3545', fontWeight: 'bold', margin: "0 10px", height: "25px", display: "flex", alignItems: "center"
                                    }}
                                >
                                    Delete
                                </li>
                            </>
                        )}
                    </ul>
                </>
            </div>
        );
    }, [openDropdownId, canEdit, canDelete]);

    const leaveStatusBodyTemplate = (rowData: ILeaveView) => {
        return (
            <span
            >
                {rowData.leave_status === 1 ? (
                    <span
                        style={{
                            backgroundColor: "#ccc",
                            color: "#fff",
                            height: "20px",
                        }}
                        className="badge rounded-pill ml-1"
                    >
                        Pending
                    </span>
                ) : rowData.leave_status === 2 ? (
                    <span
                        style={{
                            backgroundColor: "#06923E",
                            color: "#fff",
                            height: "20px",
                        }}
                        className="badge rounded-pill ml-1"
                    >
                        Pass
                    </span>
                ) : rowData.leave_status === 3 ? (
                    <span
                        style={{
                            backgroundColor: "#FF0000",
                            color: "#fff",
                            height: "20px",
                        }}
                        className="badge rounded-pill ml-1"
                    >
                        Reject
                    </span>
                ) : (
                    ""
                )}
            </span>
        );
    };

    function openCreateProduct(addUpdateStatus: string) {
        if (canAdd) {
            setIsCreateModel(true);
            setCreateEditStatusFlag(addUpdateStatus);
        } else {
            setIsCreateModel(false);
            setCreateEditStatusFlag(addUpdateStatus);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }


    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Leave Management
                </h3>
                <div className="d-flex gap-2 align-items-center">

                    <Button
                        icon="pi pi-plus"
                        className="report_button"
                        style={{ backgroundColor: "rgb(245, 134, 52)" }}
                        rounded
                        onClick={() => openCreateProduct("createEdit")}

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
                    value={leaveLists}
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
                        }}
                        body={actionBodyTemplate}
                    />
                    <Column
                        field="id"
                        header={
                            <span>
                                Id
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "60px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => rowData.id}
                    />

                    <Column
                        field="leave_type"
                        header={
                            <span>
                                Leave Type
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "150px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => {
                            return (
                                <span
                                    style={{
                                        backgroundColor: rowData.color
                                            ? rowData.color
                                            : "#eeeeee"
                                    }}
                                    className="badge rounded-pill"
                                >
                                    {rowData.leave_type}
                                </span>
                            );
                        }}
                    />
                    <Column
                        field="leave_status"
                        header={
                            <span>
                                Leave Status
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "140px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={leaveStatusBodyTemplate}
                    />
                    <Column
                        field="leave_duration"
                        header={
                            <span>
                                Leave Duration
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "150px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => {
                            return (
                                <span>
                                    {rowData.leave_duration == "1" ? "First Half" : rowData.leave_duration == "2" ? "Second Half" : "Full Day"}
                                </span>
                            );
                        }}

                    />
                    <Column
                        field="leave_date"
                        header={
                            <span>
                                Leave Date
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "150px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => rowData.leave_date}

                    />
                    <Column
                        field="reporting_date"
                        header={
                            <span>
                                Reporting Date
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "150px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => rowData.reporting_date}
                    />

                    <Column
                        field="created_by_username"
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
                            width: "100px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => rowData.created_by_username}
                    />

                    <Column
                        field="remark"
                        header={
                            <span>
                                Remark
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
                        body={(rowData: ILeaveView) => rowData.remark}

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
                            width: "100px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: ILeaveView) => rowData.created_date_time}
                    />
                </DataTable>
            </div>
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteItemId(undefined);
                    }}
                    handleSubmit={() => {
                        if (deleteItemId !== undefined) {
                            handleDeleteLeave(
                                deleteItemId,
                                setIsDeleteConfirmation,
                                setLoading,
                                setLeaveList,
                                team_id
                            );
                            setDeleteItemId(undefined);
                        }
                    }}
                    title={"Delete this Product"}
                    message={"Are You Sure You Want To Delete This Product?"}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isOpenCreateModel && (
                <CreateLeaveView
                    show={isOpenCreateModel}
                    createEditFlag={createEditStatusFlag}
                    onHide={() => setIsCreateModel(false)}
                    leaveToEdit={undefined}
                    headerName="Apply Leave"
                    setRefreshLeave={setRefreshProduct}
                    team_id={getUUID}

                />
            )}

            {isOpenEditModel && (
                <CreateLeaveView
                    show={isOpenEditModel}
                    createEditFlag={createEditStatusFlag}
                    onHide={() => setIsOpenEditModel(false)}
                    leaveToEdit={editLeaveItem}
                    headerName="Edit Leave"
                    setRefreshLeave={setRefreshProduct}
                    team_id={getUUID}
                />
            )}

            {isOpenViewModel && (
                <CreateLeaveView
                    show={isOpenViewModel}
                    createEditFlag={createEditStatusFlag}
                    onHide={() => setIsOpenViewModel(false)}
                    leaveToEdit={viewLeaveItem}
                    headerName="View Leave Details"
                    setRefreshLeave={setRefreshProduct}
                    team_id={getUUID}
                    isViewOnly={true}
                />
            )}
            {isOpenStatusModel && (
                <CreateLeaveView
                    show={isOpenStatusModel}
                    onHide={() => setIsOpenStatusModel(false)}
                    leaveToEdit={editLeaveStatusItem}
                    headerName={`${statusFlag} Status`}
                    setRefreshLeave={setRefreshProduct}
                    status={statusFlag}
                    team_id={team_id}
                />
            )}

        </div >
    );
};

export default LeaveManagementReport;