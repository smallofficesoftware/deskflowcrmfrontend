import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import ImportExcelForContactModal from "../../../../../components/model/ImportExcelForContactModal";
import { useTheme } from "../../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import {
  ADJUSTMENT_TYPES,
  fetchCompensationAdjustmentApi,
  handleDeleteCompensationAdjustment,
  ICompensationAdjustmentView,
  isHoursType,
} from "./CompensationAdjustmentsController";
import CreateCompensationAdjustmentsView from "./CreateCompensationAdjustmentsView";

interface IPropsCompensationAdjustmentView {
  isCompensationAdjustmentView: boolean;
  closeCompensationAdjustmentView: () => void;
}

const CompensationAdjustmentsView = ({
  isCompensationAdjustmentView,
  closeCompensationAdjustmentView,
}: IPropsCompensationAdjustmentView) => {
  const [adjustmentList, setAdjustmentList] = useState<
    ICompensationAdjustmentView[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();

  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const PAGE_SIZE = 30;
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [isModalExcelVisible, setIsModalExcelVisible] = useState<boolean>(false);
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

  useEscapeKey(closeCompensationAdjustmentView);

  const toggleDropdown = (itemId: number | undefined) => {
    if (itemId === undefined) return;
    setOpenDropdownId((prevId) => (prevId === itemId ? null : itemId));
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest(".selected-btn");

    if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
      setOpenDropdownId(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  useEffect(() => {
    if (canView && isCompensationAdjustmentView) {
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
  }, [isCompensationAdjustmentView, canView]);

  // On-scroll: fetch next page from API when near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 60;

      if (nearBottom && !isFetchingMore && hasMore) {
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

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [offset, hasMore, isFetchingMore]);

  const handleEdit = (item: ICompensationAdjustmentView) => {
    setOpenDropdownId(null);
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
    setOpenDropdownId(null);
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

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No records selected");
      return;
    }
    if (canDelete) {
      setDeleteIds(selectedIds);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable = adjustmentList.filter((c) => c.id !== -1).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = adjustmentList
        .map((c) => c.id)
        .filter((id): id is number => id !== -1 && id !== undefined);
      setSelectedIds(allIds);
      setIsAllSelected(true);
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

  const handleConfirmImportExcel = async () => {
    setIsModalExcelVisible(false);
    handleRefreshList();
  };

  // Helper: get badge style for adjustment type
  const getAdjBadgeStyle = (adjustmentType: number) => {
    const type = ADJUSTMENT_TYPES.find((a) => a.id === adjustmentType);
    if (!type) return {};
    return {
      backgroundColor: type.isCredit ? "#d4edda" : "#f8d7da",
      color: type.isCredit ? "#155724" : "#721c24",
      border: `1px solid ${type.isCredit ? "#c3e6cb" : "#f5c6cb"}`,
    };
  };

  const formatValue = (item: ICompensationAdjustmentView): string => {
    if (isHoursType(item.adjustment_type)) {
      return item.hours_value != null ? `${item.hours_value} hrs` : "—";
    }
    return item.amount_value != null ? `₹${item.amount_value}` : "—";
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

  return (
    <>
      {isCompensationAdjustmentView ? (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
        >
          {/* Header */}
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons"
                data-tab="2"
                title="Back"
                aria-label="Back"
                onClick={closeCompensationAdjustmentView}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>
              </div>
            </div>

            <div className="newText">
              <h2>Compensation Adjustments</h2>
            </div>

            <div className="text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "100px" }}
              >
                <button
                  className="icons"
                  onClick={openCreateView}
                  title="Create Compensation Adjustment"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#fff"
                  >
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button>
              </div>
              <div
                className="ICON"
                style={{ position: "absolute", right: "60px" }}
              >
                <button
                  className="icons"
                  onClick={() => {
                    if (canAdd) {
                      setIsModalExcelVisible(true);
                    } else {
                      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    }
                  }}
                  title="Import Excel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="26px"
                    viewBox="0 -960 960 960"
                    width="26px"
                    fill="#fff"
                  >
                    <path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                  </svg>
                </button>
              </div>
              <div
                className="ICON"
                style={{ position: "absolute", right: "20px" }}
              >
                <button
                  className="icons"
                  onClick={handleRefreshList}
                  title="Refresh"
                >
                  <svg width="30" height="30" viewBox="0 0 50 50">
                    <path
                      fill="currentColor"
                      d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                    />
                    <path
                      fill="currentColor"
                      d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                    />
                    <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                    <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="chats-notifications" ref={scrollContainerRef}>
            <div className="block">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, index) => (
                        <div
                          className="source-of-type-list-grid-main"
                          key={index}
                        >
                          <div className="source-of-type-list-grid-list">
                            <div
                              style={{
                                display: "inline-block",
                                marginLeft: "8px",
                                width: "100%",
                              }}
                            >
                              <Skeleton
                                width="90%"
                                height="28px"
                                duration={5}
                                borderRadius={6}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            <p
                              className={`${
                                adjustmentList.length > 0
                                  ? ""
                                  : "text-center pt-5"
                              }`}
                            >
                              {adjustmentList.length > 0 ? "" : "No Data Found"}
                            </p>

                            {/* List items */}
                            {adjustmentList.map((item, index) => {
                              const adjType = ADJUSTMENT_TYPES.find(
                                (a) => a.id === item.adjustment_type,
                              );
                              return (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                  style={{
                                    minHeight: "48px",
                                    alignItems: "center",
                                  }}
                                >
                                  {/* Employee name */}
                                  <span
                                    className="fw-semibold mx-1"
                                    style={{
                                      fontSize: "0.83rem",
                                      minWidth: "80px",
                                    }}
                                    title={
                                      item.employee_name ||
                                      `EMP#${item.employee_id}`
                                    }
                                  >
                                    {item.employee_name ||
                                      `EMP#${item.employee_id}`}
                                  </span>

                                  {/* Adjustment type badge */}
                                  <span
                                    className="badge rounded-pill mx-1 px-2 py-1"
                                    style={{
                                      fontSize: "0.73rem",
                                      ...getAdjBadgeStyle(item.adjustment_type),
                                    }}
                                  >
                                    {adjType?.isCredit ? "+" : "−"}{" "}
                                    {adjType?.name ??
                                      `Type ${item.adjustment_type}`}
                                  </span>

                                  {/* Value */}
                                  <span
                                    className="mx-1"
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "0.82rem",
                                      color: adjType?.isCredit
                                        ? "#155724"
                                        : "#721c24",
                                    }}
                                  >
                                    {formatValue(item)}
                                  </span>

                                  {/* Apply date */}
                                  <span
                                    className="mx-1 text-muted"
                                    style={{ fontSize: "0.76rem" }}
                                    title="Apply Date"
                                  >
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
                                    {formatDate(item.apply_date)}
                                  </span>

                                  {/* Remark */}
                                  {item.remark && (
                                    <span
                                      className="mx-1 text-muted"
                                      style={{
                                        fontSize: "0.74rem",
                                        maxWidth: "90px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "inline-block",
                                        verticalAlign: "middle",
                                      }}
                                      title={item.remark}
                                    >
                                      {item.remark}
                                    </span>
                                  )}

                                  {/* Options */}
                                  {item.id !== -1 && item.id !== -2 && (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdown(item.id);
                                        }}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 19 20"
                                          width="22px"
                                          height="22px"
                                          className="hide animate__animated animate__fadeInUp"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                          ></path>
                                        </svg>
                                      </button>
                                      <ul
                                        className={`source-of-types-options ${
                                          openDropdownId === item.id
                                            ? "isVisible"
                                            : "isHidden"
                                        }`}
                                        id="dropLeft"
                                        ref={(el) =>
                                          (dropdownContactRef.current[item.id] =
                                            el)
                                        }
                                        style={{
                                          width: "120px",
                                          marginLeft: "60%",
                                        }}
                                      >
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            handleEdit(item);
                                          }}
                                        >
                                          Edit
                                        </li>
                                        <li
                                          style={{
                                            color: "red",
                                            fontWeight: 600,
                                          }}
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            openDeleteModel(item.id);
                                          }}
                                        >
                                          Delete
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bottom loader while fetching more from API */}
                        {isFetchingMore && (
                          <div className="source-of-type-list-grid-main">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                className="source-of-type-list-grid-list"
                                key={`more-skeleton-${i}`}
                              >
                                <div
                                  style={{
                                    display: "inline-block",
                                    marginLeft: "8px",
                                    width: "100%",
                                  }}
                                >
                                  <Skeleton
                                    width="90%"
                                    height="28px"
                                    duration={5}
                                    borderRadius={6}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* End of list indicator */}
                        {!isFetchingMore &&
                          !hasMore &&
                          adjustmentList.length > 0 && (
                            <div
                              className="text-center text-muted py-2"
                              style={{ fontSize: "0.76rem" }}
                            >
                              — {adjustmentList.length} record
                              {adjustmentList.length !== 1 ? "s" : ""} —
                            </div>
                          )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-danger p-1">
                    {DEFAULT_MESSAGE_ERROR_PERMISSION}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Delete Confirmation */}
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
        </div>
      ) : null}

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

      {/* Import Modal */}
      {isModalExcelVisible && (
        <ImportExcelForContactModal
          show={isModalExcelVisible}
          onHide={() => setIsModalExcelVisible(false)}
          handleSubmit={() => handleConfirmImportExcel()}
          title={"Import Excel For Compensation Adjustment"}
          message={"Please Import excel as per sample excel"}
          btn1="Cancel"
          btn2="Import"
          sampleLocation="sampleCompensationAdjustment.xlsx"
          potions={7}
        />
      )}
    </>
  );
};

export default CompensationAdjustmentsView;
