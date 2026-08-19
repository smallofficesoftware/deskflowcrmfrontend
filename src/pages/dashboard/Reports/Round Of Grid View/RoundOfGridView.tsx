import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { fetchRoundOffApi, IRoundOffView, updateRoundOff } from "../../../left-side/header/Setting/round of master/RoundOfMasterController";

export interface IPropsRoundOffGridView {
    onHide: () => void;
}

const RoundOffMasterGridView = ({
    onHide,
}: IPropsRoundOffGridView) => {

    const [roundOffList, setRoundOffList] = useState<IRoundOffView[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const latestRow = useRef<IRoundOffView>();

    const [deleteRoundOffIds, setDeleteRoundOffIds] = useState<number[]>([]);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {},
    );

    const PAGE_SIZE = 30;
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const dt = useRef<DataTable<IRoundOffView[]>>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        minutes: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        const fetchRoundOffs = async () => {
            setOffset(0);
            setHasMore(true);
            setRoundOffList([]);
            setLoading(true);
            fetchRoundOffApi(
                setRoundOffList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
            ).then((more) => setHasMore(more));
        };

        fetchRoundOffs();
    }, []);

    const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {

        // Safely get the last visible index
        const lastVisible =
            typeof event.last === "number"
                ? event.last
                : ((event.last as any)?.last ?? 0);

        const loadedCount = roundOffList.length;

        // Buffer: start loading more when user is ~20 rows from the end of loaded data

        if (
            lastVisible >= loadedCount &&
            !isFetchingMore &&
            hasMore
        ) {
            const nextOffset = offset + PAGE_SIZE;
            setIsFetchingMore(true);
            fetchRoundOffApi(
                setRoundOffList,
                setLoading,
                PAGE_SIZE,
                nextOffset,
                true,
            ).then((more) => {
                setOffset(nextOffset);
                setHasMore(more);
                setIsFetchingMore(false);
            });
        }
    };

    const handleRefreshRoundOff = async () => {
        if (true) {
            setOffset(0);
            setHasMore(true);
            setRoundOffList([]);
            setLoading(true);
            const more = await fetchRoundOffApi(
                setRoundOffList,
                setLoading,
                PAGE_SIZE,
                0,
                false,
            );
            setHasMore(more);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    // const handleDeleteRoundOff = async () => {
    //     // if (!canDelete) {
    //     //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    //     //     return;
    //     // }

    //     // await deleteRoundOff(deleteRoundOffIds, setIsDeleteConfirmation, setLoading);
    //     setDeleteRoundOffIds([]);
    //     setSelectedIds([]);
    //     setIsAllSelected(false);
    //     handleRefreshRoundOff();
    // };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedInsideDropdown = Object.values(
            dropdownContactRef.current,
        ).some((ref) => ref && ref.contains(target));

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

    useEscapeKey(() => {
        if (!openDropdownId && !isDeleteConfirmation) {
            onHide();
        } else {
            setOpenDropdownId(null);
            setIsDeleteConfirmation(false);
        }
    });

    const handleConversionChange = (id: number, value: number) => {
        if (value > 59 || value < 0) return;

        let updatedRow: IRoundOffView | undefined;

        setRoundOffList((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;

                updatedRow = {
                    ...item,
                    conversion_minutes: value,
                };

                latestRow.current = updatedRow;

                return updatedRow;
            })
        );
    };

    useEffect(() => {
        const handleEnter = async (e: KeyboardEvent) => {
            if (e.key === "Enter" && latestRow.current) {
                await updateRoundOff(latestRow.current, setLoading);
                handleRefreshRoundOff();
            }
        };

        window.addEventListener("keydown", handleEnter);

        return () => window.removeEventListener("keydown", handleEnter);
    }, [latestRow]);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Round Off
                </h3>
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshRoundOff}
                        tooltip="Refresh"
                        tooltipOptions={{
                            position: "top",
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
                    value={roundOffList}
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
                    filters={filters}
                    onFilter={onFilter}
                >
                    <Column
                        field="minutes"
                        header={
                            <span>
                                Minutes
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
                        body={(rowData: IRoundOffView) => {
                            return (
                                <span>
                                    {rowData.minutes
                                        ? rowData.minutes
                                        : "-"}
                                </span>
                            );
                        }}
                    />
                    <Column
                        field="conversion_minutes"
                        header={
                            <span>
                                Conversion Minutes
                            </span>
                        }
                        headerStyle={{
                            width: "250px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: IRoundOffView) => {
                            return (
                                <input
                                    type="number"
                                    className="form-control m-0"
                                    style={{ padding: "5px", height: "30px", width: "150px" }}
                                    min={0}
                                    max={59}
                                    value={rowData.conversion_minutes}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) =>
                                        handleConversionChange(rowData.id, Number(e.target.value))
                                    }
                                />
                            );
                        }}
                    />
                </DataTable>
            </div>
            {/* {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => {
                        setIsDeleteConfirmation(false);
                        setDeleteRoundOffIds([]);
                    }}
                    handleSubmit={handleDeleteRoundOff}
                    title={
                        deleteRoundOffIds.length > 1
                            ? "Delete Day Round Of"
                            : "Delete Day Round Of"
                    }
                    message={`Are you sure you want to delete ${deleteRoundOffIds.length > 1 ? "these Day Round Of" : "this Day Round Of"
                        }?`}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )} */}
        </div>
    );
};

export default RoundOffMasterGridView;
