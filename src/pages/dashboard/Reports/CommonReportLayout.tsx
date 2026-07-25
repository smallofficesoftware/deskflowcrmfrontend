import React, {
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { Button } from "primereact/button";
import CheckBoxFilterModal from "../../../components/model/CheckBoxFilterModal";


interface FilterConfig {
    title?: string;
    message?: string;
    filtersToShow?: number[];
    pageId?: number;
    stageandStatusOrderType?: number;
    filtershowSeriesOrderType?: string;
}

interface MoreOption {
    label: string;
    icon?: string;
    onClick?: () => void;
}

interface FiltersType {
    filterData?: any;

    selectedCategoryId?: any;
    selectedProductId?: any;
    selectedContactId?: any;
    selectedProductSearchId?: any;
    selectedOrderListId?: any;

    checkedOptions?: any[];
    checkedSourceTypes?: any[];

    startSearchDate?: Date | null;
    endSearchDate?: Date | null;

    checkedOptionsStageStatus?: any[];
    checkedOptionsSeries?: any[];

    selectedStockTypeId?: any;

    checkedOptionsUser?: any[];

    selectedActiveId?: any;

    selectedDays?: any;

    selectedWarehouseIds?: any[];

    referenceWiseContact?: any;
    isFilterApplied?: boolean;
}

interface ChildrenProps {
    filters: FiltersType;
    debouncedSearchText: string;
    reportSelectedDates: Date[];
    setFilters: React.Dispatch<
        React.SetStateAction<FiltersType>
    >;
    globalSearchText: string;
    setGlobalSearchText: React.Dispatch<
        React.SetStateAction<string>
    >;
    hasData: boolean;
}

interface CommonReportLayoutProps {
    title?: string;

    children?:
    | ReactNode
    | ((props: ChildrenProps) => ReactNode);

    filterConfig?: FilterConfig;

    onApplyFilters?: (data: any) => void;

    onSearch?: (value: string) => void;

    onExportExcel?: () => void;
    onExportPdf?: () => void;
    onPrint?: () => void;

    showAddButton?: boolean;
    addButtonLabel?: string;
    onAddClick?: () => void;

    showSearchButton?: boolean;
    showFilterButton?: boolean;
    showExportButton?: boolean;

    MobileFlag?: boolean;

    moreOptions?: MoreOption[];

    customButtons?: ReactNode;

    initialFilters?: FiltersType;

    selectedIds?: any[];
}

const CommonReportLayout: React.FC<
    CommonReportLayoutProps
> = ({
    children,

    filterConfig = {},

    onApplyFilters,

    onSearch,

    onExportExcel,
    onExportPdf,
    onPrint,

    showAddButton = false,
    addButtonLabel = "Add",
    onAddClick,

    showSearchButton = true,
    showFilterButton = true,
    showExportButton = true,

    MobileFlag = false,

    moreOptions = [],

    customButtons = null,

    initialFilters = {},

    selectedIds = [],
}) => {

        // =========================
        // STATES
        // =========================

        const [filters, setFilters] =
            useState<FiltersType>(initialFilters);

        const [hasData, setHasData] =
            useState<boolean>(false);

        const [
            isModalFilterVisible,
            setIsModalFilterVisible,
        ] = useState<boolean>(false);

        const [
            isExportDropdownOpen,
            setIsExportDropdownOpen,
        ] = useState<boolean>(false);

        const [
            globalSearchText,
            setGlobalSearchText,
        ] = useState<string>("");

        const [
            debouncedSearchText,
            setDebouncedSearchText,
        ] = useState<string>("");

        // =========================
        // REFS
        // =========================

        const searchInputRef =
            useRef<HTMLInputElement>(null);

        // =========================
        // DEBOUNCE SEARCH
        // =========================

        useEffect(() => {

            const timer = setTimeout(() => {
                setDebouncedSearchText(
                    globalSearchText
                );
            }, 400);

            return () => clearTimeout(timer);

        }, [globalSearchText]);

        // =========================
        // DEFAULT MONTH DATE
        // =========================

        const getCurrentMonthDateRange = () => {

            const now = new Date();

            const startOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

            const endOfMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            );

            return [
                startOfMonth,
                endOfMonth,
            ];
        };

        // =========================
        // INITIAL DATES
        // =========================

        useEffect(() => {

            if (
                !filters.startSearchDate ||
                !filters.endSearchDate
            ) {

                const [
                    startDate,
                    endDate,
                ] = getCurrentMonthDateRange();

                setFilters((prev) => ({
                    ...prev,
                    startSearchDate: startDate,
                    endSearchDate: endDate,
                }));
            }

        }, []);

        // =========================
        // REPORT SELECTED DATES
        // =========================

        const reportSelectedDates =
            useMemo(() => {

                return [
                    filters.startSearchDate,
                    filters.endSearchDate,
                ].filter(Boolean) as Date[];

            }, [
                filters.startSearchDate,
                filters.endSearchDate,
            ]);

        // =========================
        // SEARCH
        // =========================

        const handleGlobalSearch = () => {

            const value =
                searchInputRef.current?.value || "";

            setGlobalSearchText(value);

            onSearch?.(value);
        };

        // =========================
        // APPLY FILTERS
        // =========================

        const handleConfirmFilter = (
            filterPayload: any
        ) => {

            const {
                filterData,
                checkedOptionsLabel,
                checkedOptionsSourceType,
                startSearchDate,
                endSearchDate,
                checkedOptionsStageStatus,
                checkedOptionsSeries,
                checkedOptionsUser,
                selectedCategoryId,
                selectedStockTypeId,
                selectedProductId,
                selectedActiveId,
                selectedDays,
                selectedWarehouseIds,
                selectedContactId,
                selectedProductSearchId,
                selectedOrderListId,
                referenceWiseContact = 1,
            } = filterPayload;

            const isFilterApplied =
                (
                    (checkedOptionsLabel?.length ?? 0) > 0 ||

                    (checkedOptionsSourceType?.length ?? 0) > 0 ||

                    Boolean(filterData?.country) ||

                    Boolean(filterData?.state) ||

                    Boolean(filterData?.city) ||

                    Boolean(filterData?.area) ||

                    Boolean(startSearchDate) ||

                    Boolean(endSearchDate) ||

                    (checkedOptionsStageStatus?.length ?? 0) > 0 ||

                    (checkedOptionsSeries?.length ?? 0) > 0 ||

                    (checkedOptionsUser?.length ?? 0) > 0 ||

                    Boolean(selectedActiveId) ||

                    Boolean(selectedDays) ||

                    Boolean(selectedWarehouseIds) ||

                    Boolean(selectedCategoryId) ||

                    Boolean(selectedContactId) ||

                    Boolean(selectedProductSearchId) ||

                    Boolean(selectedStockTypeId) ||

                    Boolean(selectedOrderListId) ||

                    Boolean(selectedProductId)
                );

            setFilters({

                filterData,

                checkedOptions:
                    checkedOptionsLabel || [],

                checkedSourceTypes:
                    checkedOptionsSourceType || [],

                startSearchDate:
                    startSearchDate || null,

                endSearchDate:
                    endSearchDate || null,

                checkedOptionsStageStatus:
                    checkedOptionsStageStatus || [],

                checkedOptionsSeries:
                    checkedOptionsSeries || [],

                checkedOptionsUser:
                    checkedOptionsUser || [],

                selectedCategoryId:
                    selectedCategoryId || null,

                selectedContactId:
                    selectedContactId || null,

                selectedProductSearchId:
                    selectedProductSearchId || null,

                selectedStockTypeId:
                    selectedStockTypeId || null,

                selectedProductId:
                    selectedProductId || null,

                selectedActiveId,

                selectedDays,

                selectedWarehouseIds,

                selectedOrderListId:
                    selectedOrderListId || null,

                referenceWiseContact,

                isFilterApplied,
            });

            setHasData(isFilterApplied);

            setIsModalFilterVisible(false);

            onApplyFilters?.(filterPayload);
        };

        // =========================
        // RETURN
        // =========================

        return (
            <>

                {!MobileFlag && (

                    <div
                        className="d-flex gap-2 align-items-center"
                    >

                        {/* SEARCH */}

                        {showSearchButton && (
                            <>

                                <div
                                    style={{
                                        width: "300px",
                                        zIndex: "999",
                                        position: "relative",
                                    }}
                                >

                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        className="form-control"
                                        placeholder="Search Anything for This Report"
                                        style={{
                                            width: "300px",
                                            marginTop: "10px",
                                        }}
                                        defaultValue={
                                            globalSearchText
                                        }
                                        onChange={(e) =>
                                            setGlobalSearchText(
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={(e) => {

                                            if (
                                                e.key === "Enter"
                                            ) {
                                                handleGlobalSearch();
                                            }

                                        }}
                                    />

                                    {/* CLEAR SEARCH */}

                                    {globalSearchText && (
                                        <span
                                            className="clear-icon"
                                            onClick={() => {

                                                setGlobalSearchText("");

                                                if (
                                                    searchInputRef.current
                                                ) {
                                                    searchInputRef.current.value =
                                                        "";
                                                }
                                            }}
                                        >
                                            ✕
                                        </span>
                                    )}
                                </div>

                                <Button
                                    icon="pi pi-search"
                                    className="report_button"
                                    style={{
                                        backgroundColor:
                                            "#4C4C4C",
                                    }}
                                    rounded
                                    onClick={
                                        handleGlobalSearch
                                    }
                                    tooltip="Search"
                                />

                            </>
                        )}

                        {/* FILTER BUTTON */}

                        {showFilterButton && (
                            <Button
                                icon={
                                    hasData
                                        ? "pi pi-filter-slash"
                                        : "pi pi-filter"
                                }
                                className="report_button"
                                style={{
                                    backgroundColor:
                                        "#4C4C4C",
                                }}
                                rounded
                                onClick={() =>
                                    setIsModalFilterVisible(
                                        true
                                    )
                                }
                                tooltip="Filter Report"
                            />
                        )}

                        {/* ADD BUTTON */}

                        {showAddButton && (
                            <Button
                                icon="pi pi-plus"
                                className="report_button"
                                style={{
                                    backgroundColor:
                                        "rgb(245, 134, 52)",
                                }}
                                rounded
                                onClick={onAddClick}
                                tooltip={addButtonLabel}
                            />
                        )}

                        {/* CUSTOM BUTTONS */}

                        {customButtons}

                        {/* EXPORT BUTTON */}

                        {showExportButton && (

                            <div
                                style={{
                                    position: "relative",
                                }}
                            >

                                <Button
                                    icon="pi pi-ellipsis-v"
                                    className="report_button"
                                    style={{
                                        backgroundColor:
                                            "#4C4C4C",
                                    }}
                                    rounded
                                    onClick={(e) => {

                                        e.stopPropagation();

                                        setIsExportDropdownOpen(
                                            (prev) => !prev
                                        );
                                    }}
                                    tooltip="More Option"
                                />

                                {/* DROPDOWN */}

                                <ul
                                    className={`labelDropLeft ${isExportDropdownOpen
                                        ? "isVisible"
                                        : "isHidden"
                                        }`}
                                    style={{
                                        width: "170px",
                                        position: "absolute",
                                        right: "25px",
                                        top: "30px",
                                        zIndex: 1000,
                                        maxHeight:
                                            "calc(100vh - 120px)",
                                        overflowY: "auto",
                                        scrollbarWidth:
                                            "none",
                                        background: "white",
                                        listStyle: "none",
                                        padding: "0",
                                        borderRadius: "10px",
                                        boxShadow:
                                            "0 2px 10px rgba(0,0,0,0.2)",
                                    }}
                                >

                                    {/* EXCEL */}

                                    {onExportExcel && (
                                        <li
                                            className="listItem text-start"
                                            role="button"
                                            onClick={() => {

                                                setIsExportDropdownOpen(
                                                    false
                                                );

                                                onExportExcel();
                                            }}
                                        >
                                            Export Excel
                                        </li>
                                    )}

                                    {/* PDF */}

                                    {onExportPdf && (
                                        <li
                                            className="listItem text-start"
                                            role="button"
                                            onClick={() => {

                                                setIsExportDropdownOpen(
                                                    false
                                                );

                                                onExportPdf();
                                            }}
                                        >
                                            Export PDF
                                        </li>
                                    )}

                                    {/* PRINT */}

                                    {onPrint && (
                                        <li
                                            className="listItem text-start"
                                            role="button"
                                            onClick={() => {

                                                setIsExportDropdownOpen(
                                                    false
                                                );

                                                onPrint();
                                            }}
                                        >
                                            Print
                                        </li>
                                    )}

                                    {/* DYNAMIC OPTIONS */}

                                    {moreOptions.map(
                                        (
                                            item,
                                            index
                                        ) => (

                                            <li
                                                key={index}
                                                className="listItem text-start"
                                                role="button"
                                                onClick={() => {

                                                    setIsExportDropdownOpen(
                                                        false
                                                    );

                                                    item.onClick?.();
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems:
                                                            "center",
                                                    }}
                                                >

                                                    <span>
                                                        {item.label}
                                                    </span>

                                                    {item.icon && (
                                                        <i
                                                            className={
                                                                item.icon
                                                            }
                                                            style={{
                                                                fontSize:
                                                                    "10px",
                                                            }}
                                                        />
                                                    )}

                                                </div>
                                            </li>
                                        )
                                    )}

                                    {/* MULTI PRINT */}

                                    {selectedIds.length >
                                        0 && (
                                            <li
                                                className="listItem text-start"
                                                role="button"
                                            >
                                                Generate Multi Print
                                            </li>
                                        )}

                                </ul>
                            </div>
                        )}

                    </div>
                )}


                {/* FILTER MODAL */}

                {showFilterButton && (
                    <CheckBoxFilterModal
                        show={
                            isModalFilterVisible
                        }
                        onHide={() =>
                            setIsModalFilterVisible(
                                false
                            )
                        }
                        handleSubmit={
                            handleConfirmFilter
                        }
                        title={
                            filterConfig.title ||
                            "Filter Reports"
                        }
                        message={
                            filterConfig.message ||
                            "Please select filters"
                        }
                        btn1="Clear"
                        btn2="Apply"
                        filtersToShow={
                            filterConfig.filtersToShow ||
                            []
                        }
                        pageId={Number(filterConfig.pageId)}

                        stageandStatusOrderType={
                            filterConfig.stageandStatusOrderType
                        }
                        filtershowSeriesOrderType={
                            filterConfig.filtershowSeriesOrderType
                        }
                        initialFilterData={{
                            ...filters.filterData,

                            category:
                                filters.selectedCategoryId,

                            product:
                                filters.selectedProductId,

                            contactId:
                                filters.selectedContactId,

                            productId:
                                filters.selectedProductSearchId,

                            orderlistselect:
                                filters.selectedOrderListId,
                        }}
                        initialCheckedOptions={
                            filters.checkedOptions
                        }
                        initialCheckedSourceTypes={
                            filters.checkedSourceTypes
                        }
                        initialStartSearchDate={
                            filters.startSearchDate
                        }
                        initialEndSearchDate={
                            filters.endSearchDate
                        }
                        initialCheckedOptionsStageStatus={
                            filters.checkedOptionsStageStatus
                        }
                        initialCheckedOptionsSeries={
                            filters.checkedOptionsSeries
                        }
                        initialSelectedStockTypeId={
                            filters.selectedStockTypeId
                        }
                        initialCheckedOptionsUser={
                            filters.checkedOptionsUser
                        }
                        initialSelectedActiveId={
                            filters.selectedActiveId
                        }
                        initialselectedOrderListId={
                            filters.selectedOrderListId
                        }
                        initialSelectedDays={
                            filters.selectedDays
                        }
                        selectedWarehouseIds={
                            String(filters.selectedWarehouseIds || "")
                        }
                        initialReferenceWiseContact={
                            filters.referenceWiseContact
                        }
                        isApplyReport={1}
                    />
                )}

                {/* REPORT CONTENT */}

                <div>

                    {typeof children === "function"
                        ? children({
                            filters,
                            debouncedSearchText,
                            reportSelectedDates,
                            setFilters,
                            globalSearchText,
                            setGlobalSearchText,
                            hasData,
                        })
                        : children}

                </div>

            </>
        );
    };

export default CommonReportLayout;