import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  DataTableFilterEvent,
  DataTableFilterMeta,
} from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import {
  ADJUSTMENT_TYPES,
  fetchCompensationAdjustmentApi,
  handleDeleteCompensationAdjustment,
  ICompensationAdjustmentView,
} from "../../../left-side/header/Setting/compensation-adjustments/CompensationAdjustmentsController";
import CreateCompensationAdjustmentsView from "../../../left-side/header/Setting/compensation-adjustments/CreateCompensationAdjustmentsView";

interface IPropsCompensationAdjustmentGridView {
  onHide: () => void;
}

const CompensationAdjustmentGridView = ({
  onHide,
}: IPropsCompensationAdjustmentGridView) => {
  const [adjustmentList, setAdjustmentList] = useState<
    ICompensationAdjustmentView[]
  >([]);
  const [loading, setLoading] = useState(false);

  const [displayAdjustmentList, setDisplayAdjustmentList] = useState<
    ICompensationAdjustmentView[]
  >([]);

  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const PAGE_SIZE = 30;
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableItem, setEditableItem] = useState<ICompensationAdjustmentView>(
    {
      id: 0,
      employee_id: 0,
      type_id: 0,
      adjustment_type: 0,
      hours_value: null,
      amount_value: null,
      apply_date: "",
      remark: "",
    },
  );

  const dt = useRef<DataTable<ICompensationAdjustmentView[]>>(null);
  const op = useRef<OverlayPanel>(null);
  const [selectedRow, setSelectedRow] =
    useState<ICompensationAdjustmentView | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    employee_name: {
      value: null,
      matchMode: "contains",
    },
    apply_date: {
      value: null,
      matchMode: "contains",
    },
    remark: {
      value: null,
      matchMode: "contains",
    },
  });

  const onFilter = (event: DataTableFilterEvent) => {
    setFilters(event.filters);
  };

  const canView = useCheckUserPermission(
    PAGE_ID.COMPENSATION_ADJUSTMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.COMPENSATION_ADJUSTMENT,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.COMPENSATION_ADJUSTMENT,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.COMPENSATION_ADJUSTMENT,
    PERMISSION_TYPE.DELETE,
  );

  useEscapeKey(onHide);

  useEffect(() => {
    if (canView) {
      setOffset(0);
      setHasMore(true);
      setAdjustmentList([]);
      setLoading(true);
      fetchCompensationAdjustmentApi(
        setAdjustmentList,
        setLoading,
        PAGE_SIZE,
        0,
        false,
      ).then((more) => setHasMore(more));
    }
  }, [canView]);

  const onVirtualLoad = (event: VirtualScrollerLazyEvent) => {
    // Safely get the last visible index
    const lastVisible =
      typeof event.last === "number"
        ? event.last
        : ((event.last as any)?.last ?? 0);

    const loadedCount = adjustmentList.length;

    // Buffer: start loading more when user is ~20 rows from the end of loaded data
    const buffer = 20;

    if (lastVisible + buffer >= loadedCount && !isFetchingMore && hasMore) {
      const nextOffset = offset + PAGE_SIZE;
      setIsFetchingMore(true);
      fetchCompensationAdjustmentApi(
        setAdjustmentList,
        setLoading,
        PAGE_SIZE,
        nextOffset,
        true, // append
      ).then((more) => {
        setOffset(nextOffset);
        setHasMore(more);
        setIsFetchingMore(false);
      });
    }
  };

  const filteredAndSortedData = useMemo(() => adjustmentList, [adjustmentList]); // simple — no heavy client-side filter/sort for now

  useEffect(() => {
    setDisplayAdjustmentList(filteredAndSortedData);
  }, [filteredAndSortedData]);

  const handleEdit = (item: ICompensationAdjustmentView) => {
    op.current?.hide();
    if (canEdit) {
      setEditableItem(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshList = async () => {
    if (canView) {
      setOffset(0);
      setHasMore(true);
      setAdjustmentList([]);
      setLoading(true);
      const more = await fetchCompensationAdjustmentApi(
        setAdjustmentList,
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

  const openDeleteModel = (itemId: number | undefined) => {
    op.current?.hide();
    if (canDelete) {
      if (itemId !== undefined) {
        setDeleteIds([itemId]);
        setIsDeleteConfirmation(true);
      } else {
        toast.error("No record selected for deletion");
      }
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
    await handleDeleteCompensationAdjustment(
      deleteIds,
      setIsDeleteConfirmation,
      setAdjustmentList,
      setLoading,
    );
    setDeleteIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const openCreateView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const getAdjBadgeStyle = (adjustmentType: number) => {
    const type = ADJUSTMENT_TYPES.find((a) => a.id === adjustmentType);
    if (!type) return {};
    return {
      backgroundColor: type.isCredit ? "#d4edda" : "#f8d7da",
      color: type.isCredit ? "#155724" : "#721c24",
      border: `1px solid ${type.isCredit ? "#c3e6cb" : "#f5c6cb"}`,
    };
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const actionBodyTemplate = (rowData: ICompensationAdjustmentView) => {
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

  return (
    <PrimeReactProvider>
      <div>
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <h3
            style={{ fontSize: "20px", paddingLeft: "12px" }}
            className="dash-board-text-count"
          >
            Compensation Adjustments
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
              tooltip={`Add Lable`}
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
            value={displayAdjustmentList}
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
              field="actions"
              headerClassName="center-header"
              headerStyle={{
                width: "43px",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              body={actionBodyTemplate}
            />
            <Column
              field="employee_name"
              header={<span>Employee Name</span>}
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
              body={(rowData: ICompensationAdjustmentView) => {
                return (
                  <span>
                    {rowData.employee_name || `EMP#${rowData.employee_id}`}
                  </span>
                );
              }}
            />
            <Column
              field="apply_date"
              header={<span>Apply Date</span>}
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
              body={(rowData: ICompensationAdjustmentView) => {
                return (
                  <span className="mx-1 text-muted" title="Apply Date">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{
                        marginBottom: "1px",
                        marginRight: "2px",
                      }}
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                    {formatDate(rowData.apply_date)}
                  </span>
                );
              }}
            />
            <Column
              field="remark"
              header={<span>Remark</span>}
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
              body={(rowData: ICompensationAdjustmentView) => {
                return (
                  <span
                    className="badge rounded-pill mx-1 px-2 py-1"
                    style={{
                      fontSize: "0.73rem",
                      ...getAdjBadgeStyle(rowData.adjustment_type),
                    }}
                  >
                    {rowData.remark}
                  </span>
                );
              }}
            />
          </DataTable>
          <OverlayPanel ref={op} className="action-overlay">
            <ul className="list-unstyled m-0 p-0" id="dropLeft">
              <li
                className="listItem"
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                role="button"
                onClick={(e) => {
                  e.stopPropagation();

                  if (!selectedRow) return;

                  if (canEdit) {
                    handleEdit(selectedRow);
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
                  fontSize: "12px",
                }}
                className="listItem"
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!selectedRow) return;

                  if (canEdit) {
                    openDeleteModel(selectedRow.id);
                    op.current?.hide();
                  } else {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }
                }}
              >
                Delete
              </li>
            </ul>
          </OverlayPanel>
        </div>
        {isDeleteConfirmation && (
          <ConfirmationModal
            show={isDeleteConfirmation}
            onHide={() => {
              setIsDeleteConfirmation(false);
              setDeleteIds([]);
            }}
            handleSubmit={handleDeleteSubmit}
            title={
              deleteIds.length > 1
                ? "Delete Compensation Adjustments"
                : "Delete this Compensation Adjustment"
            }
            message={`Are you sure you want to delete ${
              deleteIds.length > 1
                ? "these Compensation Adjustments"
                : "this Compensation Adjustment"
            }?`}
            btn1="CANCEL"
            btn2="DELETE"
          />
        )}
        {/* Create Modal */}
        {isCreateModel && (
          <CreateCompensationAdjustmentsView
            show={isCreateModel}
            onHide={() => setIsCreateModel(false)}
            setLoading={setLoading}
            headerName="Create Compensation Adjustment"
            handleRefreshList={handleRefreshList}
            productToEdit={undefined}
          />
        )}

        {/* Update Modal */}
        {isUpdateModel && (
          <CreateCompensationAdjustmentsView
            show={isUpdateModel}
            onHide={() => setIsUpdateModel(false)}
            setLoading={setLoading}
            headerName="Update Compensation Adjustment"
            handleRefreshList={handleRefreshList}
            productToEdit={editableItem}
          />
        )}
      </div>
    </PrimeReactProvider>
  );
};

export default CompensationAdjustmentGridView;
