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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import AddCountryView from "../../../left-side/header/Setting/countries/AddCountryView";
import { handleDeleteCountries, ICountriesView } from "../../../left-side/header/Setting/countries/CountriesController";
import { fetchCountriesApi } from "./AllCountriesReportController";

interface IAllCountriesReport {
    onHide?: () => void;
}

const AllCountriesReport = ({ onHide }: IAllCountriesReport) => {
    const [loading, setLoading] = useState(false);
    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
    const [globalSearchText, setGlobalSearchText] = useState("");
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [debouncedSearchText, setDebouncedSearchText] = useState("");

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        country_name: {
            value: null,
            matchMode: "contains",
        },
        country_code: {
            value: null,
            matchMode: "contains",
        },
        country_iso: {
            value: null,
            matchMode: "contains",
        },
    });
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
    const actionDropdownRef = useRef<HTMLUListElement>(null);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<ICountriesView>({
        country_name: "",
        id: 0,
        country_code: "",
        country_iso: "",
    });
    const [countryDropdown, setCountryDropdown] = useState<any>({});
    const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        fetchCountriesApi(
            setCountriesList,
            setLoading
        );
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

    const canView = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.DELETE);

    const handleRefreshCountries = async () => {
        if (canView) {
            await fetchCountriesApi(setCountriesList, setLoading);
        }
    };

    const handleEdit = (item: ICountriesView) => {
        setOpenDropdownId(null);
        if (canEdit) {
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest('.source-of-type-list-grid-options');
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
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

    const handleDelete = (itemId: number) => {
        setOpenDropdownId(null);
        if (canDelete) {
            setCountryDropdown({});
            setDeleteItemIds([itemId]);
            setIsDeleteConfirmation(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };
    const handleDeleteSubmit = async () => {
        if (!canDelete) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }

        await handleDeleteCountries(
            deleteItemIds,
            setIsDeleteConfirmation,
            setCountriesList,
            setLoading
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
                            marginLeft: "18%",
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

    type CountryColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        body: (rowData: ICountriesView) => React.ReactNode;
    };

    const baseColumnDefs: CountryColumnDef[] = useMemo(() => {
        return [
            {
                key: "country_name",
                label: "Country Name",
                header: <span>Country Name</span>,
                width: "200px",
                body: (rowData) => (
                    <span style={{ color: "black" }} className="badge rounded-pill">
                        {rowData.country_name}
                        {rowData.country_code && ` (${rowData.country_code})`}
                        {rowData.country_iso && ` [${rowData.country_iso}]`}
                    </span>
                ),
            },
        ];
    }, []);

    const {
        visibleColumns,
        orderedColumns,
        hiddenKeys,
        toggleColumn,
        reorderColumns,
        resetColumns,
    } = useColumnPreferences("all_countries_report", baseColumnDefs);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    All Countries
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
                        tooltip={`Add Source`}
                        tooltipOptions={{
                            position: "left",
                            style: {
                                fontSize: "14px",
                            },
                        }}
                    />

                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshCountries}
                        tooltip="Refresh"
                        tooltipOptions={{
                            position: "top",
                            style: {
                                fontSize: "14px",
                            },
                        }}
                    />

                    <ColumnsButton
                        columns={orderedColumns}
                        hiddenKeys={hiddenKeys}
                        onToggle={toggleColumn}
                        onReorder={reorderColumns}
                        onReset={resetColumns}
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
                    value={countriesList}
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
                    {visibleColumns.map((col) => (
                        <Column
                            key={col.key}
                            field={col.key}
                            header={col.header}
                            sortable
                            filter
                            filterField={col.key}
                            filterPlaceholder="Search"
                            filterMatchMode={col.filterMatchMode || "contains"}
                            headerStyle={{
                                width: col.width || "150px",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                                background: "#f8f9fa",
                                fontSize: "14px",
                            }}
                            bodyStyle={{ fontSize: "14px" }}
                            body={col.body}
                        />
                    ))}
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
                    title={deleteItemIds.length > 1 ? "Delete Countries" : "Delete this Country"}
                    message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these countries" : "this country"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isCreateModel && (
                <AddCountryView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Add Country"
                    handleRefreshCountries={handleRefreshCountries}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <AddCountryView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Country"
                    handleRefreshCountries={handleRefreshCountries}
                    productToEdit={editableProduct}
                />
            )}
        </div>
    );
};

export default AllCountriesReport;