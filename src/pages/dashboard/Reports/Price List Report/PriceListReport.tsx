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
import CreatePriceListView from "../../../left-side/header/Setting/priceList/CreatePriceListView";
import { IPriceListView } from "../../../left-side/header/Setting/priceList/PriceListController";
import PriceListItemView from "../../../left-side/header/Setting/priceList/PriceListItemView";
import { fetchPriceListForReport, handleDeletePriceList } from "./PriceListReportController";

interface IPropsPriceListReport {
    onHide?: () => void
}

const PriceListReport = ({
    onHide
}: IPropsPriceListReport) => {
    const [loading, setLoading] = useState(false);
    const [priceListList, setPriceListList] = useState<IPriceListView[]>([]);
    const [globalSearchText, setGlobalSearchText] = useState("");

    const [debouncedSearchText, setDebouncedSearchText] = useState("");

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const [passDataInAddItem, setPassDataInAddItem] = useState<IPriceListView>();
    const [isPriceListItemShow, setIsPriceListItemShow] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [deleteItemId, setDeleteItemId] = useState<number>(0);
    const [editableProduct, setEditableProduct] = useState<IPriceListView>({
        price_list_name: "",
        id: 0,
        effective_from: "",
        created_date_time: "",
        country_id: "",
        state_id: "",
        city_id: "",
        city_name: "",
        state_name: "",
        country_name: "",
    });

    const canView = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.DELETE);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        price_list_name: {
            value: null,
            matchMode: "contains",
        },
        effective_from: {
            value: null,
            matchMode: "contains",
        },
        country_name: {
            value: null,
            matchMode: "contains",
        },
        state_name: {
            value: null,
            matchMode: "contains",
        },
        city_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEscapeKey(() => {
        if (
            !openDropdownId &&
            !isPriceListItemShow
        ) {
            onHide?.()
        } else {
            setOpenDropdownId(null);
            setIsPriceListItemShow(false);
        }
    })

    useEffect(() => {
        fetchPriceListForReport(
            setPriceListList,
            setLoading
        );
    }, []);

    const handelRefreshProduct = async () => {
        await fetchPriceListForReport(
            setPriceListList,
            setLoading
        );
    };

    const handelPriceListAddItem = (item: IPriceListView) => {
        setOpenDropdownId(null);
        if (canView) {
            setPassDataInAddItem(item);
            setIsPriceListItemShow(true);
        } else {
            setIsPriceListItemShow(false);
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleEdit = async (item: IPriceListView) => {
        setOpenDropdownId(null);

        if (canEdit) {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openDeleteModel = (itemId: number) => {
        setOpenDropdownId(null);
        if (canDelete) {
            setDeleteItemId(itemId);
            setIsDeleteConfirmation(true);
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

        await handleDeletePriceList(
            deleteItemId,
            setIsDeleteConfirmation,
            setLoading
        );

        handelRefreshProduct();
        setIsDeleteConfirmation(false);
        setDeleteItemId(0);
    };

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

    const actionBodyTemplate = useCallback((rowData: IPriceListView) => {
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
                                    handelPriceListAddItem(rowData);
                                }}
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Add Item / View
                            </li>
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
                        </ul>
                    </>
                )}
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
                    Price List
                </h3>
                <div className="d-flex gap-2 align-items-center">

                    <Button
                        icon="pi pi-plus"
                        className="report_button"
                        style={{ backgroundColor: "rgb(245, 134, 52)" }}
                        rounded
                        onClick={() => {
                            if (canAdd) {
                                setOpenDropdownId(null);
                                setIsCreateModel(true);
                            } else {
                                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                            }
                        }}
                        tooltip={`Add Price List`}
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
                    value={priceListList}
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
                        field="price_list_name"
                        header={
                            <span>
                                Price List Name
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
                        body={(rowData: IPriceListView) => {
                            return (
                                <span>
                                    {rowData.price_list_name}
                                </span>
                            );
                        }}
                    />

                    <Column
                        field="effective_from"
                        header={
                            <span>
                                Effective From
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
                        body={(rowData: IPriceListView) => {
                            return (
                                <span>
                                    {rowData.effective_from}
                                </span>
                            );
                        }}
                    />

                    <Column
                        field="country_name"
                        header={
                            <span>
                                Country
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
                        body={(rowData: IPriceListView) => {
                            return (
                                <span>
                                    {rowData.country_name}
                                </span>
                            );
                        }}
                    />

                    <Column
                        field="state_name"
                        header={
                            <span>
                                State
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
                        body={(rowData: IPriceListView) => {
                            return (
                                <span>
                                    {rowData.state_name}
                                </span>
                            );
                        }}
                    />

                    <Column
                        field="city_name"
                        header={
                            <span>
                                City
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
                        body={(rowData: IPriceListView) => {
                            return (
                                <span>
                                    {rowData.city_name}
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {isPriceListItemShow && (
                <PriceListItemView
                    show={isPriceListItemShow}
                    onHide={() => setIsPriceListItemShow(false)}
                    title={"Price List Item"}
                    btn1={"Cancel"}
                    btn2={"Save"}
                    passDataInAddItem={passDataInAddItem}
                />
            )}
            {isCreateModel && (
                <CreatePriceListView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Price List"
                    handelRefreshProduct={handelRefreshProduct}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreatePriceListView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Price List"
                    handelRefreshProduct={handelRefreshProduct}
                    productToEdit={editableProduct}
                />
            )}
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteItemId(0);
                    }}
                    handleSubmit={handleDeleteSubmit}
                    title="Delete this Price List"
                    message="this price list"
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div>
    );
};

export default PriceListReport;