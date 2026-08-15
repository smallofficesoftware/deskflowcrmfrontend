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
import CreateStageStatusView from "../../../left-side/header/Setting/stage-status/CreateStageStatusView";
import { handleDeleteStageStatus, IStageStatusView } from "../../../left-side/header/Setting/stage-status/StageStatusController";
import { fetchCompanyApi, fetchStageStatusApi, ICompanyReport, orderTypesStageStatusList } from "./StagesStatusReportController";

interface IStagesStatusReport {
    onHide?: () => void;
}

const StagesStatusReport = ({ onHide }: IStagesStatusReport) => {
    const [loading, setLoading] = useState(false);
    const [stageStatusList, setStageStatusList] = useState<IStageStatusView[]>([]);
    const [titleList, setTitleList] = useState<ICompanyReport[]>([]);
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [globalSearchText, setGlobalSearchText] = useState("");
    const [selectedOrderList, setSelectedOrderList] = useState<IOption | null>(
        null,
    );
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [OrderListError, setOrderListError] = useState("");
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

    const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownStageStatusRef = useRef<
        Record<number, HTMLUListElement | null>
    >({});
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<IStageStatusView>({
        order_type: 0,
        name: "",
        id: 0,
        color: "",
        display_order_type: 0,
        change_status_team_ids: "",
        show_status_data_team_ids: "",
        status_type: "",
        change_status_usernames: "",
        show_status_data_usernames: "",
        visibility: 0,
    });
    const [stagestatusDropdown, setStageStatusDropdown] = useState<any>(null);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const actionDropdownRef = useRef<HTMLUListElement>(null);


    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {

        fetchStageStatusApi(
            setStageStatusList,
            setLoading,
            Number(selectedOrderList?.value),
        );

        fetchCompanyApi(setTitleList);

    }, []);

    useEscapeKey(() => {
        if (
            !isCreateModel &&
            !openDropdownId &&
            !isUpdateModel
        ) {
            onHide?.();
        } else {
            setIsCreateModel(false);
            setOpenDropdownId(null);
            setIsUpdateModel(false);
        }
    });

    const customLabels: Record<string, string> = {
        "3": titleList?.[0]?.quotation_title || "Quotation",
        "4": titleList?.[0]?.order_title || "Sales Order",
        "11": titleList?.[0]?.dispatch_title || "Dispatch",
        "5": titleList?.[0]?.invoice_title || "Sales Invoice",
        "9": titleList?.[0]?.return_sales_invoice_title || "Return Sales Invoice",
        "7": titleList?.[0]?.purchase_order_title || "Purchase Order",
        "12": titleList?.[0]?.inward_title || "Goods Received Note",
        "6": titleList?.[0]?.purchase_title || "Purchase Invoice",
        "10": titleList?.[0]?.return_purchase_invoice_title || "Return Purchase Invoice",
    };

    const orderDisplayOptions = orderTypesStageStatusList?.map(
        (option: {
            id: string;
            order_type_display: string;
        }) => ({
            value: Number(option.id),
            label:
                customLabels[String(option.id)] ||
                option.order_type_display,
        })
    );

    const visibilityBodyTemplate = (rowData: IStageStatusView) => {
        return (
            <span
            >
                {rowData.visibility === 1 ? "External" : "Internal"}
            </span>
        );
    };
    const canView = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(
        PAGE_ID.STATUS,
        PERMISSION_TYPE.DELETE,
    );

    const handleRefreshStageStatus = async () => {
        await fetchStageStatusApi(
            setStageStatusList,
            setLoading,
            Number(selectedOrderList?.value),
        );
    };

    const handleOrderDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedOrderList(selectedOption);
        setOrderListError(selectedOption ? "" : "Please Select Type");
    };

    const handleEdit = (item: IStageStatusView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleDelete = (itemId: number) => {
        setOpenDropdownId(null);
        if (canDelete) {
            setStageStatusDropdown({});
            setDeleteItemIds([itemId]);
            setIsDeleteConfirmation(true);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteStageStatus(
            deleteItemIds,
            setIsDeleteConfirmation,
            setStageStatusList,
            setLoading,
            Number(selectedOrderList?.value),
        );
        setIsDeleteConfirmation(false);
        setDeleteItemIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest(".source-of-type-list-grid-options");
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(
            dropdownStageStatusRef.current,
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
                        ref={(el) => (dropdownStageStatusRef.current[rowData.id] = el)}
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
                            style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Edit
                        </li>
                        {rowData.id > 0 && <li
                            style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
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
                    Stages & Status
                </h3>
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshStageStatus}
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
                        tooltip={`Add Stages & Status`}
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
                    value={stageStatusList}
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
                        body={(rowData: IStageStatusView) => {
                            const selectedType = orderDisplayOptions.find(
                                (option: { value: number; label: string }) =>
                                    Number(option.value) === rowData.order_type
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
                                Stage & Status Name
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
                        body={(rowData: IStageStatusView) => (
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
                        body={(rowData: IStageStatusView) => rowData.display_order_type}
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
                            ? "Delete Stage Statuses"
                            : "Delete this Stage and Status"
                    }
                    message={`Are you sure you want to delete ${deleteItemIds.length > 1
                        ? "these stage statuses"
                        : "this stage and status"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isCreateModel && (
                <CreateStageStatusView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Stage & Status"
                    handleRefreshStageStatus={handleRefreshStageStatus}
                    productToEdit={undefined}
                    handleOutsideOrderDisplayChange={handleOrderDisplayChange}
                />
            )}
            {isUpdateModel && (
                <CreateStageStatusView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Stage & Status"
                    handleRefreshStageStatus={handleRefreshStageStatus}
                    productToEdit={editableProduct}
                    handleOutsideOrderDisplayChange={handleOrderDisplayChange}
                />
            )}
        </div>
    );
};

export default StagesStatusReport;