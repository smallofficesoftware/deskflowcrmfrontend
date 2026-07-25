import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useContext, useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { AppContext } from "../../../../common/AppContext";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import RadioButtonModal from "../../../../components/model/RadioButtonModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { IFilterPayload } from "../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import AddRoutePlannerView from "../../../left-side/header/Setting/Route Planner/AddRoutePlannerView";
import RouteAssignContact from "../../../left-side/header/Setting/Route Planner/RouteAssignContact";
import RoutePlannerContactsList from "../../../left-side/header/Setting/Route Planner/RoutePlannerContactsList";
import { assignStatusToRoute, deleteRouteApi, fetchRouteList, fetchStageStatusApiForRoute, IRouteView } from "../../../left-side/header/Setting/Route Planner/RoutePlannerController";
import { IUserList } from "../../../left-side/LeftSideController";
import RightView from "../../../right-side/RightView";
import { formatDateToDDMMYYYY } from "../Salary Register/SalaryRegisterReport";

interface IPropsRoutesView {
    onHide: () => void;
}

const PAGE_SIZE = 30;

const RoutePlannerGridView = ({
    onHide,
}: IPropsRoutesView) => {

    const [routeList, setRouteList] = useState<IRouteView[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Modal visibility
    const [showAddRouteView, setShowAddRouteView] = useState(false);
    const [showUpdateRouteView, setShowUpdateRouteView] = useState(false);
    const [editableRoute, setEditableRoute] = useState<Partial<IRouteView>>({
        id: 0,
        employee_id: 0,
        start_date: "",
        end_date: "",
        country_id: 0,
        state_id: 0,
        city_id: 0,
        area_id: 0,
        remark: ""
    });

    const dropdownRefs = useRef<Record<number, HTMLUListElement | null>>({});

    const [deleteRouteIds, setDeleteRouteIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);


    const [openRouteAssignContact, setOpenRouteAssignContact] = useState<boolean>(false);
    const [routeId, setRouteId] = useState<number>(0);
    const [contactFilterObject, setContactFilterObject] = useState({
        country: 0,
        state: 0,
        city: 0,
        area: 0,
        country_name: "",
        state_name: "",
        city_name: "",
        area_name: "",
    });

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [hover, setHover] = useState(false);

    const [statusAssignRouteId, setStatusAssignRouteId] = useState<number>();
    const [routeCurrentStatus, setRouteCurrentStatus] = useState<number>();
    const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
        useState<boolean>(false);
    const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
        [],
    );

    const [isOpenContactList, setIsOpenContactList] = useState<boolean>(false);

    const { getFilter, setFilter, setFilters, clearFilters } =
        useCommonFilterStore();

    const filters = getFilter("Route_Planner_List_View");

    const [hasData, setHasData] = useState<boolean>(false);
    const [isModalFilterVisible, setIsModalFilterVisible] =
        useState<boolean>(false);

    const [showDashBoard, setshowDashBoard] = useState(false);
    const [showAichat, setshowAichat] = useState(false);
    const [contInfo, setcontInfo] = useState<IUserList>();
    const [editorContentToEdit, setEditorContentToEdit] = useState<string>("");
    const [isLoadContact, setIsLoadContact] = useState(false);
    const [noDataFound1, setNoDataFound1] = useState(false);
    const [searchTermFromRightSide, setSearchTermFromRightSide] =
        useState<string>("");
    const [idFromRightSide, setIdFromRightSide] = useState<number>(0);

    const {
        isEditContact,
        showRightSide,
        setShowRightSide,
        setCheckToken,
        setPermissions,
        setCompanyData,
    } = useContext(AppContext)!;

    const dt = useRef<DataTable<IRouteView[]>>(null);
    const op = useRef<OverlayPanel>(null);
    const [selectedRow, setSelectedRow] = useState<IRouteView | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [dataTablefilters, setDataTableFilters] = useState<DataTableFilterMeta>({
        id: {
            value: null,
            matchMode: "contains",
        },
        employee_name: {
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
        area_name: {
            value: null,
            matchMode: "contains",
        },
        stage_status_name: {
            value: null,
            matchMode: "contains",
        },
        start_date: {
            value: null,
            matchMode: "contains",
        },
        end_date: {
            value: null,
            matchMode: "contains",
        },
        remark: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setDataTableFilters(event.filters);
    };

    const canViewStatus = useCheckUserPermission(
        PAGE_ID.STATUS,
        PERMISSION_TYPE.VIEW,
    );
    const canViewSmartFilter = useCheckUserPermission(
        PAGE_ID.SMART_SEARCH_AND_FILTER,
        PERMISSION_TYPE.VIEW,
    );
    const canViewMsg = useCheckUserPermission(
        PAGE_ID.CONTACT_MESSAGE_HISTORY,
        PERMISSION_TYPE.VIEW,
    );

    useEffect(() => {
        if (!filters.startSearchDate || !filters.endSearchDate) {
            const [startDate, endDate] = getCurrentMonthDateRange();

            setFilters("Route_Planner_List_View", {
                ...filters,
                startSearchDate: startDate,
                endSearchDate: endDate,
                selectedDateArray: [
                    startDate,
                    endDate,
                ],
            });
        }
    }, []);

    useEscapeKey(onHide);

    // Click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.closest(".source-of-type-list-grid-options")) return;

            const insideDropdown = Object.values(dropdownRefs.current).some(
                (ref) => ref && ref.contains(target),
            );
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load on open
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        setRouteList([]);
        setLoading(true);
        fetchRouteList(
            setRouteList,
            setLoading,
            searchTerm,
            PAGE_SIZE,
            0,
            false,
            filters.startSearchDate,
            filters.endSearchDate,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
        ).then(
            setHasMore,
        );
    }, [
        searchTerm,
        filters.startSearchDate,
        filters.endSearchDate,
        filters.checkedOptionsStageStatus,
        filters.checkedOptionsUser,
    ]);

    const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {

        // Safely get the last visible index
        const lastVisible =
            typeof event.last === "number"
                ? event.last
                : ((event.last as any)?.last ?? 0);

        const loadedCount = routeList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data

        if (
            lastVisible >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchRouteList(
                setRouteList,
                setLoading,
                searchTerm,
                PAGE_SIZE,
                nextOffset,
                true, // append
                filters.startSearchDate,
                filters.endSearchDate,
                filters.checkedOptionsStageStatus,
                filters.checkedOptionsUser,
            ).then((more) => {
                setOffset(nextOffset);
                setHasMore(more);
                setIsFetchingMore(false);
            });
        }
    };

    const handleDeleteRoute = async () => {
        if (deleteRouteIds.length <= 0) return;

        await deleteRouteApi(deleteRouteIds, setIsDeleteConfirmation, setLoading);

        setDeleteRouteIds([]);
        handleRefreshRoutes();
        // If it fails (like having active production entries),
        // we keep the modal open or let the user close it, and the toast shows the error.
    };

    const handleRefreshRoutes = async () => {
        if (false) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            return;
        }
        setOffset(0);
        setHasMore(true);
        setRouteList([]);
        setLoading(true);
        const more = await fetchRouteList(
            setRouteList,
            setLoading,
            "",
            PAGE_SIZE,
            0,
            false,
            filters.startSearchDate,
            filters.endSearchDate,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
        );
        setHasMore(more);
    };

    const handleOpenRouteEdit = (item: IRouteView) => {
        setEditableRoute({
            id: item.id,
            employee_id: item.employee_id,
            start_date: item.start_date,
            end_date: item.end_date,
            country_id: item.country_id,
            state_id: item.state_id,
            city_id: item.city_id,
            area_id: item.area_id,
            remark: item.remark
        })
        setShowUpdateRouteView(true);
    };

    useEffect(() => {
        if (isModalAssignStatusVisible) {
            fetchStageStatusApiForRoute(
                setOptionRadioButtonStatus,
                routeCurrentStatus,
            );
        } else {
            setOptionRadioButtonStatus([]);
            setRouteCurrentStatus(0);
        }
    }, [isModalAssignStatusVisible]);

    const handleModalOpenStatusAssign = (
        id?: number | undefined,
        currentStatus?: number | undefined,
    ) => {
        if (canViewStatus) {
            if (id) {
                setStatusAssignRouteId(id);
            }

            if (currentStatus) {
                setRouteCurrentStatus(currentStatus);
            }
            setIsModalAssignStatusVisible(true);
        } else {
            setIsModalAssignStatusVisible(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleConfirmRadioButton = async (
        checkedOptions: number | undefined,
    ) => {
        if (!statusAssignRouteId || !checkedOptions) {
            return;
        }

        await assignStatusToRoute(
            setLoading,
            checkedOptions,
            statusAssignRouteId,
        );

        setTimeout(() => {
            handleRefreshRoutes();
        }, 100);

        setIsModalAssignStatusVisible(false);
    };

    const openFilterLabel = () => {
        if (canViewSmartFilter) {
            setIsModalFilterVisible(true);
        } else {
            setIsModalFilterVisible(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleFilterModalClose = () => {
        setIsModalFilterVisible(false);
    };

    const getCurrentMonthDateRange = () => {
        const now = new Date();

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return [startOfMonth, endOfMonth];
    };

    const handleConfirmFilter = async (
        filterPayload: IFilterPayload
    ) => {
        const [startDate, endDate] = getCurrentMonthDateRange();

        const updatedFilters = {
            ...filterPayload,
            checkedOptionsUser: filterPayload.checkedOptionsUser || [],
            checkedOptionsStageStatus: filterPayload.checkedOptionsStageStatus || [],
            startSearchDate: filterPayload?.startSearchDate || startDate,
            endSearchDate: filterPayload?.endSearchDate || endDate,
            selectedDateArray: [
                filterPayload?.startSearchDate || startDate,
                filterPayload?.endSearchDate || endDate,
            ],
        };

        setFilters("Route_Planner_List_View", updatedFilters);

        const hasData = updatedFilters.checkedOptionsUser.length > 0 ||
            updatedFilters.checkedOptionsStageStatus.length > 0;

        setHasData(hasData);

        setIsModalFilterVisible(false);
    };

    const handleOpenContactList = (routeId: number) => {
        setIsModalAssignStatusVisible(false);
        setOpenRouteAssignContact(false);
        setRouteId(routeId);
        setIsOpenContactList(true);
    }

    const openRightSide = (singleData: IUserList) => {
        if (canViewMsg) {
            setshowDashBoard(false);
            setShowRightSide(true);
            setshowAichat(false);
            setcontInfo(singleData);
            setEditorContentToEdit("");
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const openContactRightView = (item: IUserList | null) => {
        if (item === null) {
            setShowRightSide(false);
            return;
        }
        openRightSide(item);
    }

    const actionBodyTemplate = (rowData: IRouteView) => {
        return (
            <Button
                icon="pi pi-cog"
                className="p-button-text"
                style={{
                    color: "green",
                }}
                onClick={(e) => {
                    setSelectedRow(rowData);
                    op.current?.toggle(e);

                    requestAnimationFrame(() => {
                        const panel = op.current?.getElement();

                        if (panel) {
                            panel.style.transform = "translate(40px, -25px)";
                        }
                    });
                }}
            />
        );
    };

    const handleGlobalSearch = () => {
        const value = searchInputRef.current?.value || "";

        setSearchTerm(value);
    };

    return (
        <PrimeReactProvider>
            <div style={{ height: "100%" }}>
                <div>
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <h3
                            style={{ fontSize: "20px", paddingLeft: "12px" }}
                            className="dash-board-text-count"
                        >
                            Route Planner
                        </h3>
                        <div className="d-flex gap-2 align-items-center">
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="form-control"
                                placeholder="Search Id or Remark"
                                style={{
                                    width: "300px",
                                    marginTop: "10px",
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleGlobalSearch();
                                    }
                                }}
                            />
                            {searchTerm && (
                                <span
                                    className="clear-icon"
                                    onClick={() => {
                                        setSearchTerm("");
                                        if (searchInputRef.current) {
                                            searchInputRef.current.value = "";
                                        }
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#5f6368"
                                    >
                                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                    </svg>
                                </span>
                            )}
                            <Button
                                icon="pi pi-search"
                                className="report_button"
                                style={{ backgroundColor: "#4C4C4C" }}
                                rounded
                                onClick={handleGlobalSearch}
                                tooltip="Search"
                                tooltipOptions={{
                                    position: "top",
                                    style: {
                                        fontSize: "14px",
                                    },
                                }}
                            />
                            <Button
                                icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
                                className="report_button"
                                style={{ backgroundColor: "#4C4C4C" }}
                                rounded
                                onClick={openFilterLabel}
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
                                onClick={() =>
                                    true
                                        ? setShowAddRouteView(true)
                                        : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                                }
                                tooltip={`Add Holiday`}
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
                            ref={dt}
                            value={routeList}
                            loading={loading}
                            resizableColumns
                            columnResizeMode="fit"
                            scrollable
                            scrollHeight="90vh"
                            className="custom-centered-table"
                            tableStyle={{ tableLayout: "fixed", width: "100%" }}
                            emptyMessage="No data found"
                            filterDisplay="row"
                            virtualScrollerOptions={{
                                itemSize: PAGE_SIZE,
                                lazy: true,
                                onLazyLoad: onVirtualLoad, // ← use the fixed version above
                                showLoader: true,
                                // numToleratedItems: 10,               // optional: render a few more rows for smoothness
                                // delay: 100,                          // optional: small debounce
                            }}
                            filters={dataTablefilters}
                            onFilter={onFilter}
                        >
                            <Column
                                field="actions"
                                headerClassName="center-header"
                                headerStyle={{
                                    width: "60px",
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 1,
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
                                headerStyle={{
                                    width: "50px",
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span
                                            style={{
                                                color: "#f58634",
                                                marginRight: "5px",
                                            }}
                                        >
                                            #{rowData.id}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="employee_name"
                                header={
                                    <span>
                                        Employee Name
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
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span
                                            className="fw-semibold"
                                        >
                                            {rowData.employee_name || "-"}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="country_name"
                                header={
                                    <span>
                                        Country Name
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
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span>
                                            {rowData.country_name || "-"}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="state_name"
                                header={
                                    <span>
                                        State Name
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
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span>
                                            {rowData.state_name || "-"}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="city_name"
                                header={
                                    <span>
                                        City Name
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
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span>
                                            {rowData.city_name || "-"}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="area_name"
                                header={
                                    <span>
                                        Area Name
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
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span>
                                            {rowData.area_name || "-"}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="stage_status_name"
                                header={
                                    <span>
                                        Status
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
                                body={(rowData: IRouteView) => {
                                    if (!rowData.stage_status_name) {
                                        return "-";
                                    }

                                    return (
                                        <span
                                            style={{
                                                backgroundColor: rowData.stage_status_color
                                                    ? rowData.stage_status_color
                                                    : "#eeeeee ",
                                                fontWeight: "normal",
                                                fontSize: "10px",
                                            }}
                                            className="badge rounded-pill"
                                        >
                                            {rowData.stage_status_name}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="start_date"
                                header={
                                    <span>
                                        Start Date
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
                                bodyStyle={{ fontSize: "14px", textAlign: "center" }}
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span>
                                            {formatDateToDDMMYYYY(rowData.start_date) || "-"}
                                        </span>
                                    );
                                }}
                            />
                            <Column
                                field="end_date"
                                header={
                                    <span>
                                        End Date
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
                                bodyStyle={{ fontSize: "14px", textAlign: "center" }}
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span>
                                            {formatDateToDDMMYYYY(rowData.end_date) || "-"}
                                        </span>
                                    );
                                }}
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
                                    width: "250px",
                                    background: "#f8f9fa",
                                    fontSize: "14px",
                                }}
                                bodyStyle={{ fontSize: "14px" }}
                                body={(rowData: IRouteView) => {
                                    return (
                                        <span
                                            className="inquiry-front ms-1"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 4,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                whiteSpace: "normal",
                                                fontSize: "0.73rem"
                                            }}
                                        >
                                            {rowData.remark || "-"}
                                        </span>
                                    );
                                }}
                            />
                        </DataTable>
                        <OverlayPanel ref={op} className="action-overlay">
                            <ul className="list-unstyled m-0 p-0" id="dropLeft">
                                <li
                                    className="listItem"
                                    style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        if (!selectedRow)
                                            return;

                                        if (true) {

                                            handleOpenRouteEdit(selectedRow);
                                            op.current?.hide();

                                        } else {

                                            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                        }
                                    }}
                                >
                                    Edit
                                </li>
                                <li
                                    style={{
                                        color: "red",
                                        fontWeight: 600,
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                        fontSize: "12px"
                                    }}
                                    className="listItem"
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!selectedRow)
                                            return;

                                        if (true) {

                                            setDeleteRouteIds([selectedRow.id]);
                                            setIsDeleteConfirmation(true);
                                            op.current?.hide();

                                        } else {

                                            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                        }
                                    }}
                                >
                                    Delete
                                </li>
                                <li
                                    className="listItem"
                                    role="button"
                                    style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!selectedRow)
                                            return;

                                        setRouteId(selectedRow.id);
                                        handleModalOpenStatusAssign(
                                            selectedRow.id,
                                            selectedRow.status_id,
                                        );
                                        op.current?.hide();
                                    }}
                                >
                                    Assign Status
                                </li>
                                <li
                                    className="listItem"
                                    role="button"
                                    style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!selectedRow)
                                            return;

                                        setRouteId(selectedRow.id);
                                        setContactFilterObject({
                                            country: selectedRow.country_id,
                                            state: selectedRow.state_id,
                                            city: selectedRow.city_id,
                                            area: selectedRow.area_id,
                                            country_name: selectedRow.country_name,
                                            state_name: selectedRow.state_name,
                                            city_name: selectedRow.city_name,
                                            area_name: selectedRow.area_name,
                                        });

                                        setOpenRouteAssignContact(true);
                                        op.current?.hide();
                                    }}
                                >
                                    Assign Contact
                                </li>
                                <li
                                    className="listItem"
                                    role="button"
                                    style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!selectedRow)
                                            return;

                                        handleOpenContactList(selectedRow.id);
                                        op.current?.hide();
                                    }}
                                >
                                    Open Assigned Contact List
                                </li>
                            </ul>
                        </OverlayPanel>
                    </div>
                    {isDeleteConfirmation && (
                        <ConfirmationModal
                            show={isDeleteConfirmation}
                            onHide={() => {
                                setIsDeleteConfirmation(false);
                                setDeleteRouteIds([]);
                            }}
                            handleSubmit={handleDeleteRoute}
                            title={
                                deleteRouteIds.length > 1
                                    ? "Delete Routes"
                                    : "Delete Route"
                            }
                            message={`Are you sure you want to delete ${deleteRouteIds.length > 1 ? "these routes" : "this route"
                                }?`}
                            btn1="CANCEL"
                            btn2="DELETE"
                        />
                    )}
                    {showAddRouteView && (
                        <AddRoutePlannerView
                            show={showAddRouteView}
                            onHide={() => {
                                setShowAddRouteView(false);
                            }}
                            setLoading={setLoading}
                            headerName="Add Route"
                            handleRefreshRoutes={handleRefreshRoutes}
                            productToEdit={undefined}
                        />
                    )}

                    {showUpdateRouteView && (
                        <AddRoutePlannerView
                            show={showUpdateRouteView}
                            onHide={() => {
                                setShowUpdateRouteView(false);
                            }}
                            setLoading={setLoading}
                            headerName="Update Route"
                            handleRefreshRoutes={handleRefreshRoutes}
                            productToEdit={editableRoute}
                        />
                    )}

                    {openRouteAssignContact && (
                        <RouteAssignContact
                            show={openRouteAssignContact}
                            onHide={() => {
                                setOpenRouteAssignContact(false);
                            }}
                            routeId={routeId}
                            contactFilterObject={contactFilterObject}
                        />
                    )}

                    {isModalAssignStatusVisible && (
                        <RadioButtonModal
                            show={isModalAssignStatusVisible}
                            onHide={() => setIsModalAssignStatusVisible(false)}
                            handleSubmit={handleConfirmRadioButton}
                            title="Assign Status to Route"
                            message="Please select the Status for this contact."
                            btn1="Cancel"
                            btn2="Submit"
                            options={optionRadioButtonStatus}
                            selectedLabelIds={
                                routeList?.find((rt) => rt.id === statusAssignRouteId)?.status_id
                            }
                            contactId={routeId}
                            getOptionColor={(option) => option.color || "#eeeeee"}
                            getOptionName={(option) => option.name}
                            showColorBadge={true}
                        />
                    )}

                    {isModalFilterVisible && (
                        <CheckBoxFilterModal
                            show={isModalFilterVisible}
                            onHide={handleFilterModalClose}
                            handleSubmit={handleConfirmFilter}
                            title="Filter your Routes"
                            message="Please select the Labels , Source and Demography for the Contact."
                            btn1="Clear"
                            btn2="Apply"
                            filtersToShow={[1, 4, 5]}
                            pageId={1}
                            initialFilterData={filters.filterData}
                            initialStartSearchDate={filters.startSearchDate}
                            initialEndSearchDate={filters.endSearchDate}
                            initialCheckedOptions={filters.checkedOptions}
                            initialCheckedOptionsStageStatus={
                                filters.checkedOptionsStageStatus
                            }
                            stageandStatusOrderType={14}
                            initialCheckedOptionsUser={filters.checkedOptionsUser}
                        />
                    )}

                    {showRightSide && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: "70%",
                                height: "100%",
                                zIndex: 99999,
                                background: "#fff",
                                boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
                                display: "flex",
                            }}
                        >
                            <RightView
                                openCreateContact={() => { }}
                                closeCreateContact={() => { }}
                                showInquiryAllList={() => { }}
                                showReminder={() => { }}
                                showNotes={() => { }}
                                showMyTask={() => { }}
                                showMySupportTicket={() => { }}
                                showFilterContact={() => { }}
                                showMyCompany={() => { }}
                                showDashboard={() => { }}
                                showAichat={() => setshowAichat(true)}
                                getData={contInfo}
                                isDashBoardOpen={showDashBoard}
                                closeDashboard={() => setshowDashBoard(false)}
                                isAiModelopen={showAichat}
                                closeisAiModel={() => setshowAichat(false)}
                                contactsReload={setIsLoadContact}
                                setEditorContentToEdit={setEditorContentToEdit}
                                editorContentToEdit={editorContentToEdit}
                                setNoDataFound1={setNoDataFound1}
                                resetTrigger={0}
                                setRefreshContact={() => { }}
                                setSearchTermFromRightSide={setSearchTermFromRightSide}
                                setIdFromRightSide={setIdFromRightSide}
                            />
                        </div>
                    )}
                </div>
                {isOpenContactList && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "30vw",
                            minWidth: "350px",
                            height: "100%",
                            zIndex: 9999,
                            background: "#fff",
                            boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
                        }}
                    >
                        <RoutePlannerContactsList
                            show={isOpenContactList}
                            onHide={() => {
                                openContactRightView(null);
                                setIsOpenContactList(false);
                            }}
                            routeId={routeId}
                            openContactRightView={openContactRightView}
                            fromSideView={true}
                        />
                    </div>
                )}
            </div>
        </PrimeReactProvider>
    );
};

export default RoutePlannerGridView;