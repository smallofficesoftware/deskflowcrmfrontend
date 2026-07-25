import { useCallback, useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useTheme } from "../../../../components/ThemeContext";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { useEscapeKey } from "../../../../common/SharedFunction";
import { deleteJobCardApi, fetchJobCardList } from "../../../left-side/header/Setting/job-card/JobCardController";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { IJobCardListItem } from "../../../left-side/header/Setting/job-card/JobCardTypes";
import JobCardView from "../../../left-side/header/Setting/job-card/JobCardView";
import ProductionEntryListModel from "../../../left-side/header/Setting/job-card/ProductionEntryListModel";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterEvent, DataTableFilterMeta } from "primereact/datatable";
import { PrimeReactProvider } from "primereact/api";
import { OverlayPanel } from "primereact/overlaypanel";

interface IProps {
  onHide: () => void;
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
};

const PAGE_SIZE = 30;

const JobCardGridView = ({ onHide }: IProps) => {
  const [jobCardList, setJobCardList] = useState<IJobCardListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Modal visibility
  const [showJobCard, setShowJobCard] = useState(false);
  const [showProductionEntry, setShowProductionEntry] = useState(false);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<number | null>(
    null,
  );
  const [selectedJobCardItem, setSelectedJobCardItem] =
    useState<IJobCardListItem | null>(null);

  // Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLUListElement | null>>({});

  const op = useRef<OverlayPanel>(null);
  const [selectedRow, setSelectedRow] = useState<IJobCardListItem | null>(null);

  const [deleteJobCardId, setDeleteJobCardId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    id: {
      value: null,
      matchMode: "contains",
    },
    leave_type: {
      value: null,
      matchMode: "contains",
    },
    leave_status: {
      value: null,
      matchMode: "contains",
    },
    leave_duration: {
      value: null,
      matchMode: "contains",
    },
    leave_date: {
      value: null,
      matchMode: "contains",
    },
    reporting_date: {
      value: null,
      matchMode: "contains",
    },
    remark: {
      value: null,
      matchMode: "contains",
    },
    created_by_username: {
      value: null,
      matchMode: "contains",
    },
    created_date_time: {
      value: null,
      matchMode: "contains",
    },
  });
  const onFilter = (event: DataTableFilterEvent) => {
    setFilters(event.filters);
  };

  const { darkMode } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const canView = useCheckUserPermission(
    /* PAGE_ID.JOB_CARD */ PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    /* PAGE_ID.JOB_CARD */ PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.ADD,
  );

  useEscapeKey(onHide);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".source-of-type-list-grid-options")) return;
      const insideDropdown = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(target),
      );
      if (!insideDropdown) setOpenDropdownId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdownId(null);
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Load on open
  useEffect(() => {
    if (!canView) return;
    setOffset(0);
    setHasMore(true);
    setJobCardList([]);
    setLoading(true);
    fetchJobCardList(setJobCardList, setLoading, PAGE_SIZE, 0, false).then(
      setHasMore,
    );
  }, [canView]);

  // Infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (
        scrollTop + clientHeight >= scrollHeight - 60 &&
        !isFetchingMore &&
        hasMore
      ) {
        const nextOffset = offset + PAGE_SIZE;
        setIsFetchingMore(true);
        fetchJobCardList(
          setJobCardList,
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
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [offset, hasMore, isFetchingMore]);

  const confirmDeleteJobCard = async () => {
    if (!deleteJobCardId) return;
    setIsDeleting(true);

    const success = await deleteJobCardApi(deleteJobCardId);

    setIsDeleting(false);
    if (success) {
      setDeleteJobCardId(null);
      handleRefresh(); // Reload the list
    }
    // If it fails (like having active production entries),
    // we keep the modal open or let the user close it, and the toast shows the error.
  };

  const handleRefresh = async () => {
    if (!canView) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    setOffset(0);
    setHasMore(true);
    setJobCardList([]);
    setLoading(true);
    const more = await fetchJobCardList(
      setJobCardList,
      setLoading,
      PAGE_SIZE,
      0,
      false,
    );
    setHasMore(more);
  };

  const handleOpenProductionEntry = (item: IJobCardListItem) => {
    setSelectedOrderItemId(item.id);
    setSelectedJobCardItem(item);
    op.current?.hide();
    setShowProductionEntry(true);
  };

  const actionBodyTemplate = (item: IJobCardListItem) => {
    return (
      <Button
        icon="pi pi-cog"
        className="p-button-text"
        style={{ color: "green" }}
        onClick={(e) => {
          setSelectedRow(item);
          op.current?.toggle(e);
          requestAnimationFrame(() => {
            const panel = op.current?.getElement();
            if (panel) panel.style.transform = "translate(40px, -25px)";
          });
        }}
      />
    );
  };

  return (
    <PrimeReactProvider>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          Job Card
        </h3>
        <div className="d-flex gap-2 align-items-center">

          <Button
            icon="pi pi-plus"
            className="report_button"
            style={{ backgroundColor: "rgb(245, 134, 52)" }}
            rounded
            onClick={() =>
              canAdd
                ? setShowJobCard(true)
                : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
            }

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
          value={jobCardList}
          loading={loading}
          resizableColumns
          columnResizeMode="fit"
          scrollable
          scrollHeight="flex"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No Data Found"
          filterDisplay="row"
          filters={filters}
          onFilter={onFilter}
          key={openDropdownId}
        >
          <Column
            field="actions"
            headerClassName="center-header"
            headerStyle={{ width: "50px", position: "sticky", top: 0 }}
            body={actionBodyTemplate}
          />
          <Column
            field="id"
            header={<span>Id</span>}
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "70px",
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px"}}
            body={(rowData: IJobCardListItem) => `#${rowData.id}`}
          />
          <Column
            field="item_name"
            header={<span>Item Name</span>}
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "180px",
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IJobCardListItem) => rowData.item_name}
          />
          <Column
            field="order_no"
            header={<span>Order No</span>}
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "140px",
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IJobCardListItem) => rowData.order_no}
          />
          <Column
            field="customer_name"
            header={<span>Customer</span>}
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "160px",
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IJobCardListItem) => rowData.customer_name}
          />
          <Column
            field="product_qty"
            header={<span>Qty</span>}
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "110px",
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IJobCardListItem) =>
              rowData.product_qty != null
                ? `${rowData.product_qty} ${rowData.unit ?? ""}`
                : ""
            }
          />
          <Column
            field="last_modified_date"
            header={<span>Last Modified</span>}
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "170px",
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IJobCardListItem) =>
              rowData.last_modified_date
                ? formatDateTime(rowData.last_modified_date)
                : ""
            }
          />
        </DataTable>
        <OverlayPanel ref={op} className="action-overlay">
          <ul className="list-unstyled m-0 p-0" id="dropLeft">
            <li className="listItem" style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedRow) return;
                handleOpenProductionEntry(selectedRow);
                op.current?.hide();
              }}
            >
              ⚙️ Production Entry
            </li>
            <li className="listItem" style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedRow) return;
                window.open(`/JobCardPdfView/${selectedRow.id}`, "_blank");
                op.current?.hide();
              }}
            >
              🖨️ Print Job Card
            </li>
            <li className="listItem" style={{ padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedRow) return;
                window.open(`/JobCardFullPdfView/${selectedRow.id}`, "_blank");
                op.current?.hide();
              }}
            >
              📑 Master Report
            </li>
            <li className="listItem" style={{ color: "red", fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedRow) return;
                setDeleteJobCardId(selectedRow.id);
                op.current?.hide();
              }}
            >
              🗑️ Delete Job Card
            </li>
          </ul>
        </OverlayPanel>
      </div>


      {/* New Job Card modal */}
      {showJobCard && (
        <JobCardView
          show={showJobCard}
          onHide={() => setShowJobCard(false)}
          onComplete={handleRefresh}
        />
      )}

      {deleteJobCardId && (
        <div
          onClick={() => !isDeleting && setDeleteJobCardId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1080,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(90vw, 420px)",
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
              borderTop: "6px solid #f58634",
            }}
          >
            <h5 className="mb-2 fw-bold" style={{ color: "#374151" }}>
              Confirm Deletion
            </h5>
            <p className="text-muted mb-4" style={{ fontSize: "0.88rem" }}>
              Are you sure you want to delete this Job Card?
              <br />
              <br />
              <span className="text-danger fw-semibold">
                Note: You can only delete this Job Card if all associated
                Production Entries have been deleted first.
              </span>
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-light border"
                onClick={() => setDeleteJobCardId(null)}
                disabled={isDeleting}
                style={{ minWidth: "90px" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-danger text-white d-flex align-items-center justify-content-center"
                onClick={confirmDeleteJobCard}
                disabled={isDeleting}
                style={{
                  minWidth: "120px",
                  border: "#f58634",
                  backgroundColor: "#f58634",
                }}
              >
                {isDeleting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      style={{ width: 12, height: 12, borderWidth: 2 }}
                    />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Entry: list modal (shows existing entries, + Add opens the form) */}
      {showProductionEntry && selectedOrderItemId && (
        <ProductionEntryListModel
          show={showProductionEntry}
          onHide={() => setShowProductionEntry(false)}
          jobId={selectedOrderItemId}
          itemName={selectedJobCardItem?.item_name}
          orderNo={selectedJobCardItem?.order_no}
          order_item_id={selectedJobCardItem?.order_item_id || 0}
        />
      )}
    </PrimeReactProvider>
  );
};

export default JobCardGridView;
