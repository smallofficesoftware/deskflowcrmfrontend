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
import CreatePaymentTypeView from "../../../left-side/header/Setting/payment-type/CreatePaymentTypeView";
import { IPaymentTypeView } from "../../../left-side/header/Setting/payment-type/PaymentTypeController";
import { fetchPaymentTypeReport, handleDeletePaymentTypeFromReport } from "./PaymentTypeReportController";

interface IPaymentTypeReport {
    onHide?: () => void;
}

const PaymentTypeReport = ({ onHide }: IPaymentTypeReport) => {
    const [loading, setLoading] = useState(false);
    const [paymentTypeList, setPaymentTypeList] = useState<IPaymentTypeView[]>([]);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [deleteTypeId, setDeleteTypeId] = useState<number>(0);

    // ✅ number | null — dusri file ki tarah
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const [editableProduct, setEditableProduct] = useState<IPaymentTypeView>({
        payment_type_name: "",
        id: 0,
        payment_color: "",
        transaction_type: 0,
        created_date_time: "",
    });

    const canAdd = useCheckUserPermission(PAGE_ID.PAYMENT_TYPE, PERMISSION_TYPE.ADD);
    const canView = useCheckUserPermission(PAGE_ID.PAYMENT_TYPE, PERMISSION_TYPE.VIEW);
    const canEdit = useCheckUserPermission(PAGE_ID.PAYMENT_TYPE, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(PAGE_ID.PAYMENT_TYPE, PERMISSION_TYPE.DELETE);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        payment_type_name: { value: null, matchMode: "contains" },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchPaymentTypeReport(setPaymentTypeList, setLoading);
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

    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }
        await handleDeletePaymentTypeFromReport(deleteTypeId, setIsDeleteConfirmation, setLoading);
        setDeleteTypeId(0);
        handleRefreshCategory();
    };

    const handleRefreshCategory = async () => {
        if (canView) {
            await fetchPaymentTypeReport(setPaymentTypeList, setLoading);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleEdit = (item: IPaymentTypeView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (typeId: number | undefined) => {
        setOpenDropdownId(null);
        if (canDelete) {
            if (typeId !== undefined) {
                setDeleteTypeId(typeId);
                setIsDeleteConfirmation(true);
            } else {
                toast.error("No Payment Type selected for deletion");
            }
        } else {
            setIsDeleteConfirmation(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const actionBodyTemplate = useCallback((rowData: IPaymentTypeView) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rowData.id !== -1 && rowData.id !== -2 && (
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
            <style>{`.source-of-types-options.isVisible {
    display: block !important;
}

.source-of-types-options.isHidden {
    display: none !important;
}

/* PrimeReact DataTable ke td overflow fix */
.custom-centered-table .p-datatable-wrapper,
.custom-centered-table .p-datatable-tbody > tr > td {
    overflow: visible !important;
}`}</style>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3 style={{ fontSize: "20px", paddingLeft: "12px" }} className="dash-board-text-count">
                    Payment Type
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
                            if (canAdd) setIsCreateModel(true);
                            else toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }}
                        tooltip="Add Payment Type"
                        tooltipOptions={{ position: "left", style: { fontSize: "14px" } }}
                    />
                </div>
            </div>

            <div className="report_card" style={{ height: "90vh", display: "flex", flexDirection: "column" }}>
                <DataTable
                    value={paymentTypeList}
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
                        field="payment_type_name"
                        header="Payment Type Name"
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{ background: "#f8f9fa", fontSize: "14px" }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: IPaymentTypeView) => (
                            <span
                                style={{ backgroundColor: rowData.payment_color || "#eeeeee" }}
                                className="badge rounded-pill"
                            >
                                {rowData.payment_type_name}
                            </span>
                        )}
                    />
                </DataTable>
            </div>

            {/* Modals */}
            {isCreateModel && (
                <CreatePaymentTypeView
                    show={isCreateModel}
                    onHide={() => setIsCreateModel(false)}
                    setLoading={setLoading}
                    headerName="Create Payment Type"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreatePaymentTypeView
                    show={isUpdateModel}
                    onHide={() => setIsUpdateModel(false)}
                    setLoading={setLoading}
                    headerName="Update Payment Type"
                    handleRefreshCategory={handleRefreshCategory}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => { setIsDeleteConfirmation(false); setDeleteTypeId(0); }}
                    handleSubmit={handleDeleteSubmit}
                    title="Delete this Payment Type"
                    message="Are you sure you want to delete this Payment Type?"
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default PaymentTypeReport;