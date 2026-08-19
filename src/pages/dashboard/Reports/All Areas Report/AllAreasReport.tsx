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
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { IOption } from "../../../../helpers/AppInterface";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import AddAreaView from "../../../left-side/header/Setting/areas/AddAreaView";
import { fetchAreasApi, fetchCitiesApi, fetchCountriesApi, fetchStatesApi, handleDeleteAreas, IAreasView, ICitiesView, ICountriesView, IStatesView } from "../../../left-side/header/Setting/areas/AreasController";
import { fetchCompanyApi, ICompany } from "../../../left-side/list-company/ListCompanyController";

interface IPropsCitiesReport {
    selectedDemography?: {
        country?: string;
        state?: string;
        city?: string;
        area?: string;
    } | null;
    onHide?: () => void;
}

const AllAreasReport = ({
    selectedDemography,
    onHide
}: IPropsCitiesReport) => {
    const [loading, setLoading] = useState(false);
    const [areaList, setAreaList] = useState<IAreasView[]>([]);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isModalFilterVisible, setIsModalFilterVisible] =
        useState<boolean>(false);
    const { getFilter, setFilters, setFilter } = useCommonFilterStore();
    const filters = getFilter("all_areas_report");
    const [hasData, setHasData] = useState<boolean>(false);
    const [tablefilters, setTableFilters] = useState<DataTableFilterMeta>({
        area_name: {
            value: null,
            matchMode: "contains",
        },
        city_name: {
            value: null,
            matchMode: "contains",
        },
        state_name: {
            value: null,
            matchMode: "contains",
        },
        country_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const actionDropdownRef = useRef<HTMLUListElement>(null);
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});

    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<IAreasView>({
        id: 0,
        area_name: "",
        city_id: 0,
        state_id: 0,
        country_id: 0,
        isDelete: 0,
        isActive: 0,
    });

    const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const [citiesList, setCitiesList] = useState<ICitiesView[]>([]);
    const [statesList, setStatesList] = useState<IStatesView[]>([]);
    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
    const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
    const [noDataFound, setNoDataFound] = useState(false);
    const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();

    const [countryIdInput, setCountryIdInput] = useState<number | null>(null);
    const [stateIdInput, setStateIdInput] = useState<number | null>(null);
    const [cityIdInput, setCityIdInput] = useState<number | null>(null);

    const [countryError, setCountryError] = useState("");
    const [stateError, setStateError] = useState("");
    const [cityError, setCityError] = useState("");

    const onFilter = (event: DataTableFilterEvent) => {
        setTableFilters(event.filters);
    };

    const canView = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.EDIT);
    const canDelete = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.DELETE);

    // Stringify the dependency so React can compare the object values properly
    const searchDependencies = JSON.stringify({
        selectedDemography: selectedDemography,
        countryIdInput: countryIdInput
    });

    useEffect(() => {
        const fetchCountryOptions = async () => {
            await fetchCountriesApi(setCountriesList, setLoading);
        }

        fetchCountryOptions();
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

    useEffect(() => {
        const fetchCompanyData = async () => {
            await fetchCompanyApi(
                setCompanyLists,
                "",
                setNoDataFound,
                setCompanyJoinOrCreate,
                setLoading,
            );
        };

        fetchCompanyData();
    }, [])

    useEffect(() => {
        setCountryIdInput(companyLists[0]?.country_id);
        setStateIdInput(companyLists[0]?.state_id);
        setCityIdInput(companyLists[0]?.city_id)
    }, [companyLists]);

    useEffect(() => {
        const fetchStatesOptions = async () => {
            await fetchStatesApi(setStatesList, setLoading, countryIdInput);
        }

        fetchStatesOptions();
    }, [countryIdInput]);

    useEffect(() => {
        const fetchCitiesOptions = async () => {
            await fetchStatesApi(setStatesList, setLoading, countryIdInput);
        }

        fetchCitiesOptions();
    }, [stateIdInput]);

    useEffect(() => {
        if (canView) {
            const fetchAreas = async () => {
                // Now TypeScript knows .country exists on selectedDemography
                const targetCountryId = selectedDemography?.country
                    ? Number(selectedDemography.country)
                    : countryIdInput;

                await fetchStatesApi(setStatesList, setLoading, targetCountryId);

                const targetStateId = selectedDemography?.state
                    ? Number(selectedDemography.state)
                    : stateIdInput;

                await fetchCitiesApi(setCitiesList, setLoading, targetCountryId, targetStateId);

                const targetCityId = selectedDemography?.city
                    ? Number(selectedDemography.city)
                    : cityIdInput;

                if (targetCountryId && targetStateId && targetCityId) {
                    await fetchAreasApi(setAreaList, setLoading, targetCountryId, targetStateId, targetCityId);
                }
            };

            fetchAreas();
        }
    }, [searchDependencies, canView, isModalFilterVisible]);

    const handleRefreshAreas = async () => {
        await fetchCountriesApi(setCountriesList, setLoading);
        if (countryIdInput) {
            await fetchStatesApi(setStatesList, setLoading, countryIdInput);
            if (stateIdInput) {
                await fetchCitiesApi(setCitiesList, setLoading, countryIdInput, stateIdInput);
                await fetchAreasApi(setAreaList, setLoading, countryIdInput, stateIdInput, cityIdInput);
            } else {
                setCitiesList([]);
                setAreaList([]);
            }
        } else {
            setStatesList([]);
            setCitiesList([]);
            setAreaList([]);
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

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenDropdownId(null);
                setIsActionDropdownOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscKey);

        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    const handleEdit = (item: IAreasView) => {
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
            // setDepartmentDropdown({});
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

        await handleDeleteAreas(
            deleteItemIds,
            setIsDeleteConfirmation,
            setAreaList,
            setLoading,
            countryIdInput,
            stateIdInput,
            cityIdInput
        );

        setIsDeleteConfirmation(false);
        setDeleteItemIds([]);
        setSelectedIds([]);
        setIsAllSelected(false);
    };

    const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
        const newCountryId = selectedOption ? Number(selectedOption.value) : null;
        setCountryIdInput(newCountryId);
        setCountryError(selectedOption ? "" : "Country is required");
        setStateIdInput(null);
        setStateError("");
        setCitiesList([]);
        if (newCountryId && canView) {
            fetchStatesApi(setStatesList, setLoading, newCountryId);
            fetchCitiesApi(setCitiesList, setLoading, newCountryId, null);
        } else {
            setStatesList([]);
            setCitiesList([]);
        }
    };

    const handleStateChange = (selectedOption: SingleValue<IOption>) => {
        const newStateId = selectedOption ? Number(selectedOption.value) : null;
        setStateIdInput(newStateId);
        setStateError(selectedOption ? "" : "State is required");
        if (newStateId && countryIdInput && canView) {
            fetchCitiesApi(setCitiesList, setLoading, countryIdInput, newStateId);
        } else {
            setCitiesList([]);
        }
    };

    const handleCityChange = (selectedOption: SingleValue<IOption>) => {
        const newCityId = selectedOption ? Number(selectedOption.value) : null;
        setCityIdInput(newCityId);
        setCityError(selectedOption ? "" : "City is required");
        if (newCityId && countryIdInput && stateIdInput && canView) {
            fetchAreasApi(setAreaList, setLoading, countryIdInput, stateIdInput, newCityId);
        } else {
            setAreaList([]);
        }
    };

    const handleApplyFilters = async (data: any) => {
        // 1. Send the raw data to the Zustand store
        setFilters("all_areas_report", data);

        // 2. Visual indicator that filters are active
        setHasData(Object.keys(data?.filterData || {}).length > 0);

        // 3. Close the modal
        setIsModalFilterVisible(false);
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

    type AreaColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        body: (rowData: IAreasView) => React.ReactNode;
    };

    const baseColumnDefs: AreaColumnDef[] = useMemo(() => {
        return [
            {
                key: "area_name",
                label: "Area Name",
                header: <span>Area Name</span>,
                width: "150px",
                body: (rowData) => <span>{rowData.area_name}</span>,
            },
            {
                key: "city_name",
                label: "City Name",
                header: <span>City Name</span>,
                width: "150px",
                body: (rowData) => (
                    <span>
                        {(citiesList.find((c) => c.id === rowData.city_id))?.city_name}
                    </span>
                ),
            },
            {
                key: "state_name",
                label: "State Name",
                header: <span>State Name</span>,
                width: "150px",
                body: (rowData) => (
                    <span>
                        {(statesList.find((s) => s.id === rowData.state_id))?.state_name}
                    </span>
                ),
            },
            {
                key: "country_name",
                label: "Country Name",
                header: <span>Country Name</span>,
                width: "150px",
                body: (rowData) => (
                    <span>
                        {(countriesList.find((c) => c.id === rowData.country_id))?.country_name}
                    </span>
                ),
            },
        ];
    }, [citiesList, statesList, countriesList]);

    const {
        visibleColumns,
        orderedColumns,
        hiddenKeys,
        toggleColumn,
        reorderColumns,
        resetColumns,
    } = useColumnPreferences("all_areas_report", baseColumnDefs);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    All Areas
                </h3>
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={() => setIsModalFilterVisible(true)}
                        tooltip="Filter Report"
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
                        tooltip={`Add State`}
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
                        onClick={handleRefreshAreas}
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
                    value={areaList}
                    loading={loading}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    className="custom-centered-table"
                    tableStyle={{ tableLayout: "fixed", width: "100%" }}
                    emptyMessage="No data found"
                    filterDisplay="row"
                    filters={tablefilters}
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
                    title={deleteItemIds.length > 1 ? "Delete States" : "Delete this State"}
                    message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these states" : "this state"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isCreateModel && (
                <AddAreaView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Add Area"
                    productToEdit={undefined}
                    handleRefreshAreas={handleRefreshAreas}
                    handleOutsideCountryChange={handleCountryChange}
                    handleOutsideStateChange={handleStateChange}
                    handleOutsideCityChange={handleCityChange}
                />
            )}
            {isUpdateModel && (
                <AddAreaView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Area"
                    productToEdit={editableProduct}
                    handleRefreshAreas={handleRefreshAreas}
                    handleOutsideCountryChange={handleCountryChange}
                    handleOutsideStateChange={handleStateChange}
                    handleOutsideCityChange={handleCityChange}
                />
            )}
            {isModalFilterVisible && (
                <CheckBoxFilterModal
                    show={isModalFilterVisible}
                    onHide={() => setIsModalFilterVisible(false)}
                    handleSubmit={handleApplyFilters}
                    title="Filter Reports"
                    message="Please select the Dates and Team Members for the Report."
                    btn1="Clear"
                    btn2="Apply"
                    filtersToShow={[6]}
                    pageId={PAGE_ID.CITIES}
                    initialFilterData={{
                        ...filters.filterData,
                    }}
                    isApplyReport={1}
                />
            )}
        </div>
    );
};

export default AllAreasReport;