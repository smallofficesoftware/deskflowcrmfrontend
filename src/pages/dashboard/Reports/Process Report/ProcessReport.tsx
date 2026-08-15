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
import CreateProcessMasterView from "../../../left-side/header/Setting/process-master/CreateProcessMasterView";
import { handleDeleteProcess, IProcessView } from "../../../left-side/header/Setting/process-master/ProcessMasterController";
import { fetchProcessApi } from "./ProcessReportController";

interface IProcessReport {
    onHide?: () => void;
}

const ProcessReport = ({
    onHide
}: IProcessReport) => {
    const [loading, setLoading] = useState(false);
    const [processList, setProcessList] = useState<IProcessView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<IProcessView>({
        process_name: "",
        id: 0,
        color: "",
        created_date_time: "",
    });

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        process_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [hasIdAvail, setHasIdAvail] = useState<number>();

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchProcessApi(
            setProcessList,
            setLoading
        );
    }, []);

    useEscapeKey(() => {
        if (
            !openDropdownId &&
            !isUpdateModel &&
            !isCreateModel
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null);
            setIsUpdateModel(false);
            setIsCreateModel(false);
        }
    });

    const canView = useCheckUserPermission(
        PAGE_ID.MACHINE_MANAGEMENTS,
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(
        PAGE_ID.MACHINE_MANAGEMENTS,
        PERMISSION_TYPE.ADD
    );

    const canEdit = useCheckUserPermission(
        PAGE_ID.MACHINE_MANAGEMENTS,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.MACHINE_MANAGEMENTS,
        PERMISSION_TYPE.DELETE
    );

    const handelRefreshprocess = async () => {
        if (canView) {
            await fetchProcessApi(setProcessList, setLoading);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleEdit = (item: IProcessView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (processId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (processId !== undefined) {
                setHasIdAvail((prev) =>
                    prev === processId ? undefined : processId,
                );
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No Unit selected for deletion");
            }
        } else {
            setIsDeleteConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const actionBodyTemplate = useCallback((rowData: IProcessView) => {
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
                    Process
                </h3>
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handelRefreshprocess}
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
                    value={processList}
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
                        field="process_name"
                        header={
                            <span>
                                Process Name
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
                        body={(rowData: IProcessView) => {
                            return (
                                <span
                                    style={{
                                        backgroundColor: rowData.color
                                            ? rowData.color
                                            : "#eeeeee"
                                    }}
                                    className="badge rounded-pill"
                                >
                                    {rowData.process_name}
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {isCreateModel && (
                <CreateProcessMasterView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Process"
                    handelRefreshprocess={handelRefreshprocess}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateProcessMasterView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Process"
                    handelRefreshprocess={handelRefreshprocess}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => setIsDeleteConfirmation(false)}
                    handleSubmit={() =>
                        handleDeleteProcess(
                            hasIdAvail,
                            setIsDeleteConfirmation,
                            setProcessList,
                            setLoading
                        )
                    }
                    title={"Delete this Process"}
                    message={"Are You Sure You Want To Delete This Process?"}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default ProcessReport;