import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../../components/model/CheckBoxFilterModal";
import CheckBoxModal from "../../../../../components/model/CheckBoxModal";
import RadioButtonModal from "../../../../../components/model/RadioButtonModal";
import { useTheme } from "../../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import {
  IFilterData,
  IFilterPayload,
} from "../../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { useCompanyStore } from "../../../../../store/company/useCompanyStore";
import { fetchAllCompanyApi } from "../../../LeftSideController";
import { fetchDepartmentsApi } from "../../../list-company/EditTeamMemberController";
import { fetchLabelApi } from "../label/LabelController";
import {
  deleteJobCardApi,
  fetchJobCardList,
  fetchStageStatusApiForJobCard,
  updateLabelOrStatusOrTeamMember,
} from "./JobCardController";
import { IJobCardListItem } from "./JobCardTypes";
import JobCardView from "./JobCardView";
import ProductionEntryListModel from "./ProductionEntryListModel";

interface IProps {
  show: boolean;
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

interface FilterParams {
  filterData: IFilterData | null;
  checkedOptions: any[];
  checkedOptionsStageStatus: any[];
  assignedByMultiTeamMember?: any[];
  createdByMultiTeamMember?: any[];
  labelwiseContactShowAndOrNot: number;
}

const JobCardListView = ({ show, onHide }: IProps) => {
  const companyInfo = useCompanyStore((state) => state.companyInfo);
  const [jobCardList, setJobCardList] = useState<IJobCardListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Modal visibility
  const [showJobCard, setShowJobCard] = useState(false);
  const [showProductionEntry, setShowProductionEntry] = useState(false);
  const [showEditJobCard, setShowEditJobCard] = useState(false);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<number | null>(
    null,
  );
  const [selectedJobCardId, setSelectedJobCardId] = useState<number | null>(
    null,
  );
  const [selectedJobCardProdQty, setSelectedJobCardProdQty] = useState<
    number | null
  >(null);
  const [selectedJobCardItem, setSelectedJobCardItem] =
    useState<IJobCardListItem | null>(null);

  // Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLUListElement | null>>({});

  const [deleteJobCardId, setDeleteJobCardId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { darkMode } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [jobId, setJobId] = useState<number>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [options, setOptions] = useState<any[]>([]);

  const [statusAssignJobId, setStatusAssignJobId] = useState<number>();
  const [jobCurrentStatus, setJobCurrentStatus] = useState<number>();
  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
    useState<boolean>(false);
  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
    [],
  );

  const [userAssignJobId, setUserAssignJobId] = useState<number>();
  const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
    useState<boolean>(false);
  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [hasData, setHasData] = useState<boolean>(false);
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [filterParams, setFilterParams] = useState<FilterParams>({
    filterData: null,
    checkedOptions: [],
    checkedOptionsStageStatus: [],
    assignedByMultiTeamMember: [],
    createdByMultiTeamMember: [],
    labelwiseContactShowAndOrNot: 0,
  });

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hover, setHover] = useState(false);


  const canView = useCheckUserPermission(
    PAGE_ID.JOB_CARD,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(PAGE_ID.JOB_CARD, PERMISSION_TYPE.ADD);
  const canDelete = useCheckUserPermission(
    PAGE_ID.JOB_CARD,
    PERMISSION_TYPE.DELETE,
  );
  const canPrint = useCheckUserPermission(
    PAGE_ID.JOB_CARD,
    PERMISSION_TYPE.PRINT,
  );

  const canViewLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.VIEW,
  );
  const canViewStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canAddAssignTeamMember = useCheckUserPermission(
    PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
    PERMISSION_TYPE.ADD,
  );

  const canViewSmartFilter = useCheckUserPermission(
    PAGE_ID.SMART_SEARCH_AND_FILTER,
    PERMISSION_TYPE.VIEW,
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
    if (!canView || !show) return;
    setOffset(0);
    setHasMore(true);
    setJobCardList([]);
    setLoading(true);
    fetchJobCardList(
      setJobCardList,
      setLoading,
      searchTerm,
      PAGE_SIZE,
      0,
      false,
      filterParams.checkedOptions,
      filterParams.checkedOptionsStageStatus,
      filterParams.assignedByMultiTeamMember,
      filterParams.createdByMultiTeamMember,
      filterParams.labelwiseContactShowAndOrNot,
    ).then(setHasMore);
  }, [
    show,
    canView,
    searchTerm,
    filterParams.checkedOptions,
    filterParams.checkedOptionsStageStatus,
    filterParams.assignedByMultiTeamMember,
    filterParams.createdByMultiTeamMember,
    filterParams.labelwiseContactShowAndOrNot,
  ]);

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
          searchTerm,
          PAGE_SIZE,
          nextOffset,
          true,
          filterParams.checkedOptions,
          filterParams.checkedOptionsStageStatus,
          filterParams.assignedByMultiTeamMember,
          filterParams.createdByMultiTeamMember,
          filterParams.labelwiseContactShowAndOrNot,
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
      "",
      PAGE_SIZE,
      0,
      false,
      filterParams.checkedOptions,
      filterParams.checkedOptionsStageStatus,
      filterParams.assignedByMultiTeamMember,
      filterParams.createdByMultiTeamMember,
      filterParams.labelwiseContactShowAndOrNot,
    );
    setHasMore(more);
  };

  const handleOpenProductionEntry = (item: IJobCardListItem) => {
    setSelectedOrderItemId(item.id);
    setSelectedJobCardItem(item);
    setOpenDropdownId(null);
    setShowProductionEntry(true);
  };

  const handleOpenJobCardEdit = (item: IJobCardListItem) => {
    setSelectedJobCardId(item.id);
    setSelectedJobCardProdQty(item.product_qty ?? 0);
    setOpenDropdownId(null);
    setShowEditJobCard(true);
  };

  useEffect(() => {
    if (isModalVisible) {
      fetchLabelApi(setOptions, setLoading);
    }
    if (isModalAssignUserVisible) {
      fetchAllCompanyApi(setOptionJoinCompany);
      fetchDepartmentsApi(setDepartments);
    }
    if (isModalAssignStatusVisible) {
      fetchStageStatusApiForJobCard(
        setOptionRadioButtonStatus,
        jobCurrentStatus,
      );
    } else {
      setOptionRadioButtonStatus([]);
      setJobCurrentStatus(0);
    }
  }, [isModalVisible, isModalAssignUserVisible, isModalAssignStatusVisible]);

  const handleModalOpen = (id?: number | undefined) => {
    if (canViewLabel) {
      if (id) {
        setJobId(id);
      }
      setIsModalVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleConfirm = async (
    jobId: number | undefined,
    checkedOptions: any[],
  ) => {
    try {
      await updateLabelOrStatusOrTeamMember(
        setLoading,
        checkedOptions,
        jobId,
        "label_assignmet",
      );

      setTimeout(() => {
        handleRefresh();
      }, 100);

      setIsModalVisible(false);
    } catch (error) {
      console.error("Error in handleConfirm:", error);
      setLoading(false);
    }
  };

  const handleModalOpenStatusAssign = (
    id?: number | undefined,
    currentStatus?: number | undefined,
  ) => {
    if (canViewStatus) {
      if (id) {
        setStatusAssignJobId(id);
      }

      if (currentStatus) {
        setJobCurrentStatus(currentStatus);
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
    if (!statusAssignJobId || !checkedOptions) {
      return;
    }

    await updateLabelOrStatusOrTeamMember(
      setLoading,
      checkedOptions,
      statusAssignJobId,
      "status_assignment",
    );

    setTimeout(() => {
      handleRefresh();
    }, 100);

    setIsModalAssignStatusVisible(false);
  };

  const handleModalOpenUserAssign = (id?: number | undefined) => {
    if (canAddAssignTeamMember) {
      if (id) {
        setUserAssignJobId(id);
      }
      setIsModalAssignUserVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const getOptionName = (option: { username: string; department: number }) => {
    const departmentObj = departments?.find(
      (item) => item.id === option.department,
    );

    if (departmentObj) {
      return `${option.username} (${departmentObj.department_name})`;
    }
    return option.username;
  };

  const handleConfirmAssignUser = async (
    jobId: number | undefined,
    checkedOptions: any[],
    isOverrideExistingContactCheckbox?: boolean,
  ) => {
    await updateLabelOrStatusOrTeamMember(
      setLoading,
      checkedOptions,
      userAssignJobId,
      "team_assignment",
    );

    setTimeout(() => {
      handleRefresh();
    }, 100);

    setIsModalAssignUserVisible(false);
  };

  const openFilterLabel = () => {
    if (canViewSmartFilter) {
      setIsModalFilterVisible(true);
    } else {
      setIsModalFilterVisible(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
    const {
      filterData,
      checkedOptionsLabel: checkedOptions,
      checkedOptionsStageStatus,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      labelAndOr: labelwiseContactShowAndOrNot,
    } = filterPayload;

    // ✅ Update local filter state
    setFilterParams({
      filterData,
      checkedOptions: checkedOptions ?? [],
      checkedOptionsStageStatus: checkedOptionsStageStatus ?? [],
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      labelwiseContactShowAndOrNot: labelwiseContactShowAndOrNot ?? 0,
    });

    // ✅ Decide if any filter applied
    const isFilterApplied =
      (checkedOptions?.length ?? 0) > 0 ||
      (checkedOptionsStageStatus?.length ?? 0) > 0 ||
      (assignedByMultiTeamMember?.length ?? 0) > 0 ||
      (createdByMultiTeamMember?.length ?? 0) > 0;

    setHasData(isFilterApplied);

    setIsModalFilterVisible(false);
  };

  const handleFilterModalClose = () => {
    setIsModalFilterVisible(false);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  return (
    <>
      {show && (
        <div
          className="notifications animate__animated animate__fadeInLeft leftSide"
          id="notifications"
        >
          {/* Header */}
          <div className="header-Chat">
            <div className="ICON">
              <div
                role="button"
                className="icons"
                title="Back"
                onClick={onHide}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                  />
                </svg>
              </div>
            </div>

            <div className="newText">
              <h2>Job Card</h2>
            </div>

            <div className="text-end mb-2">
              {/* + New Job Card button */}
              <div
                className="ICON"
                style={{ position: "absolute", right: "60px" }}
              >
                <button className="icons " onClick={openFilterLabel}>
                  <span title="Filter Job Card">
                    {hasData ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill={hasData ? "red" : "currentColor"}
                      >
                        <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                      </svg>
                    ) : (
                      <svg
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill={hasData ? "red" : "currentColor"}
                      >
                        <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                      </svg>
                    )}
                  </span>
                </button>

                <button
                  // style={{ backgroundColor: "rgb(255, 125, 18)" }}
                  className="icons text-white"
                  title="New Job Card"
                  onClick={() =>
                    canAdd
                      ? setShowJobCard(true)
                      : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)
                  }
                >
                  <span title="Create Product" className="text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Refresh button */}
              <div
                className="ICON"
                style={{ position: "absolute", right: "20px" }}
              >
                <button
                  className="icons"
                  onClick={handleRefresh}
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

          <div className="d-flex flex-column" style={{ height: "calc(100% - 110px)" }}>
            {true ? (
              <div className="search-bar">
                <div>
                  <button className="search">
                    <span className="">
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                        ></path>
                      </svg>
                    </span>
                  </button>

                  <span className="go-back">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                      ></path>
                    </svg>
                  </span>

                  <input
                    type="text"
                    title="Search Order No., Product Name or Customer Name"
                    aria-label="Search Order No., Product Name or Customer Name"
                    placeholder="Search Job"
                    maxLength={SMALL_TEXT_LENGTH}
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (<span
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: hover ? "#111827" : "#9ca3af"
                    }}
                    onClick={() => setSearchTerm("")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                  </span>)}
                </div>
              </div>
            ) : (
              <span></span>
            )}

            {/* Content */}
            <div className="chats-notifications" ref={scrollContainerRef} style={{ height: "calc(100% - 38px)" }}>
              <div className="block" style={{ padding: "10px 15px" }}>
                <div className="h-text">
                  {canView ? (
                    <div>
                      {loading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                          <div className="source-of-type-list-grid-main" key={i}>
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
                              {jobCardList.length === 0 && (
                                <p className="text-center pt-5">No Data Found</p>
                              )}

                              {jobCardList.map((item) => (
                                <div
                                  key={item.id}
                                  className="source-of-type-list-grid-list"
                                  style={{
                                    minHeight: "52px",
                                    alignItems: "center",
                                    display: "flex", // Ensure flex is active for the row
                                  }}
                                >
                                  {/* Item info */}
                                  <div
                                    className="mx-1 d-flex flex-column"
                                    style={{ overflow: "hidden", width: "70%" }}
                                  >
                                    <span
                                      className="fw-semibold"
                                      style={{ fontSize: "0.83rem" }}
                                    >
                                      {/* 👇 Added Job Card ID here 👇 */}
                                      <span
                                        style={{
                                          color: "#f58634",
                                          marginRight: "5px",
                                        }}
                                      >
                                        #{item.id}
                                      </span>
                                      {/* 👆 ======================= 👆 */}

                                      {item.item_name}
                                      {item.order_no && (
                                        <span
                                          className="text-muted fw-normal ms-1"
                                          style={{ fontSize: "0.76rem" }}
                                        >
                                          ({item.order_no})
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className="text-muted fw-semibold"
                                      style={{ fontSize: "0.73rem" }}
                                    >
                                      Customer: {item.customer_name}
                                    </span>
                                    {item.product_qty != null && (
                                      <span
                                        className="text-muted fw-semibold"
                                        style={{ fontSize: "0.73rem" }}
                                      >
                                        Qty: {item.product_qty} {item.unit}
                                      </span>
                                    )}
                                    {/* <span
                                    className="text-muted"
                                    style={{ fontSize: "0.73rem" }}
                                  >
                                    {item.customer_name}
                                    {item.product_qty != null
                                      ? ` · Qty: ${item.product_qty} ${item.unit}`
                                      : ""}
                                    {item.last_modified_date
                                      ? ` · ${formatDateTime(item.last_modified_date)}`
                                      : ""}
                                  </span> */}
                                    <span className="text-start">
                                      {item.label_color && item.label_name
                                        ? item.label_color
                                          .split(",")
                                          .map((color, index) => (
                                            <span
                                              key={index}
                                              style={{
                                                display: "inline-block",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  backgroundColor: color.trim(),
                                                  borderRadius: "8px",
                                                  fontSize: "10px",
                                                  marginRight: "4px",
                                                  fontWeight: "normal",
                                                }}
                                                className="badge"
                                              >
                                                {item.label_name
                                                  .split(",")
                                                [index].trim()}
                                              </span>
                                            </span>
                                          ))
                                        : ""}
                                    </span>
                                  </div>

                                  {/* 👇 NEW: Wrap the button and dropdown in a relative container 👇 */}
                                  <div
                                    className="text-end d-flex flex-column align-items-end"
                                    style={{
                                      position: "relative",
                                      alignSelf: "stretch",
                                      width: "30%",
                                    }}
                                  >
                                    {/* Dropdown toggle */}
                                    <button
                                      className="source-of-type-list-grid-options mb-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId((prev) =>
                                          prev === item.id ? null : item.id,
                                        );
                                      }}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        width: "36px",
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
                                        />
                                      </svg>
                                    </button>

                                    {/* Dropdown menu */}
                                    <ul
                                      className={`source-of-types-options ${openDropdownId === item.id ? "isVisible" : "isHidden"} text-start`}
                                      id="dropLeft"
                                      ref={(el) =>
                                        (dropdownRefs.current[item.id] = el)
                                      }
                                      style={{
                                        position: "absolute",
                                        right: "35%",
                                        top: "0",
                                        width: "180px", // 👈 Slightly widened to fit the new text
                                        zIndex: 1050,
                                        margin: "4px 0 0 0",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                        borderRadius: "6px",
                                        backgroundColor: "#fff",
                                      }}
                                    >
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenJobCardEdit(item);
                                          setOpenDropdownId(null);
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="18px"
                                          viewBox="0 -960 960 960"
                                          width="18px"
                                          fill="currentColor"
                                        >
                                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                                        </svg>{" "}
                                        Edit Job Card
                                      </li>
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenProductionEntry(item);
                                          setOpenDropdownId(null);
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        ⚙️ Production Entry
                                      </li>

                                      {/* 👇 NEW: Print Basic Job Card 👇 */}
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (canPrint) {
                                            window.open(
                                              `/JobCardPdfView/${item.id}`,
                                              "_blank",
                                            );
                                            setOpenDropdownId(null);
                                          } else {
                                            toast.error(
                                              DEFAULT_MESSAGE_ERROR_PERMISSION,
                                            );
                                          }
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                      >
                                        🖨️ Print Job Card
                                      </li>

                                      {/* 👇 NEW: Print Master Report (Includes Production) 👇 */}
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (canPrint) {
                                            window.open(
                                              `/JobCardFullPdfView/${item.id}`,
                                              "_blank",
                                            );
                                            setOpenDropdownId(null);
                                          } else {
                                            toast.error(
                                              DEFAULT_MESSAGE_ERROR_PERMISSION,
                                            );
                                          }
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                      >
                                        📑 Master Report
                                      </li>

                                      {/* 👇 NEW: Print Required Material 👇 */}
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (canPrint) {
                                            window.open(
                                              `/RequiredMaterialPdfView/${item.id}`,
                                              "_blank",
                                            );
                                            setOpenDropdownId(null);
                                          } else {
                                            toast.error(
                                              DEFAULT_MESSAGE_ERROR_PERMISSION,
                                            );
                                          }
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                      >
                                        📋 Required Material Print
                                      </li>

                                      <li
                                        className="listItem"
                                        role="button"
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                        onClick={() => {
                                          handleModalOpen(item.id);
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        {/* <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120v-640q0-33 23.5-56.5T280-840h240v80H280v518l200-86 200 86v-278h80v400L480-240 200-120Zm80-640h240-240Zm400 160v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" /></svg> */}
                                        Assign label
                                      </li>

                                      <li
                                        className="listItem"
                                        role="button"
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                        onClick={() => {
                                          handleModalOpenStatusAssign(
                                            item.id,
                                            item.status_id,
                                          );
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        Assign Status
                                      </li>

                                      <li
                                        className="listItem"
                                        role="button"
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                        onClick={() => {
                                          handleModalOpenUserAssign(item.id);
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        Assign Team Member
                                      </li>

                                      {/* Existing Delete Option */}
                                      <li
                                        className="listItem text-danger"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (canDelete) {
                                            setDeleteJobCardId(item.id);
                                            setOpenDropdownId(null);
                                          } else {
                                            toast.error(
                                              DEFAULT_MESSAGE_ERROR_PERMISSION,
                                            );
                                          }
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          borderTop: "1px solid #f8f9fa",
                                        }}
                                      >
                                        🗑️ Delete Job Card
                                      </li>
                                    </ul>

                                    {item.stage_status_name && (
                                      <span
                                        style={{
                                          backgroundColor: item.stage_status_color
                                            ? item.stage_status_color
                                            : "#eeeeee ",
                                          fontWeight: "normal",
                                          fontSize: "10px",
                                        }}
                                        className="badge rounded-pill"
                                      >
                                        {item.stage_status_name}
                                      </span>
                                    )}

                                    {item.last_modified_date && (
                                      <span
                                        className="text-muted"
                                        style={{ fontSize: "0.73rem" }}
                                      >
                                        {formatDateTime(item.last_modified_date)}
                                      </span>
                                    )}

                                    <span
                                      className="text-muted"
                                      style={{
                                        fontSize: "0.73rem",
                                        cursor: "pointer",
                                      }}
                                      title={item.assined_team_person_list}
                                    >
                                      {item.teamMemberName}
                                    </span>
                                  </div>
                                  {/* 👆 END WRAPPER 👆 */}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Bottom skeleton while fetching more */}
                          {isFetchingMore && (
                            <div className="source-of-type-list-grid-main">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                  className="source-of-type-list-grid-list"
                                  key={`more-${i}`}
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

                          {/* End of list */}
                          {!isFetchingMore &&
                            !hasMore &&
                            jobCardList.length > 0 && (
                              <div
                                className="text-center text-muted py-2"
                                style={{ fontSize: "0.76rem" }}
                              >
                                — {jobCardList.length} record
                                {jobCardList.length !== 1 ? "s" : ""} —
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
          </div>
        </div>
      )}

      {/* New Job Card modal */}
      {showJobCard && (
        <JobCardView
          show={showJobCard}
          onHide={() => setShowJobCard(false)}
          onComplete={handleRefresh}
        />
      )}

      {showEditJobCard && (
        <JobCardView
          show={showEditJobCard}
          onHide={() => setShowEditJobCard(false)}
          onComplete={handleRefresh}
          editJobCardId={selectedJobCardId ?? 0}
          initialProductQty={selectedJobCardProdQty ?? 0}
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
          isStockCheckRequired={companyInfo.is_strict_check_product_stock == 2}
          order_item_id={selectedJobCardItem?.order_item_id || 0}
        />
      )}

      {isModalVisible && (
        <CheckBoxModal
          show={isModalVisible}
          onHide={handleModalClose}
          handleSubmit={handleConfirm}
          title="Assign Labels to Jobs"
          btn1="Cancel"
          btn2="Submit"
          options={options}
          // selectedLabelIds={selectedLabelIds}
          selectedLabelIds={
            jobCardList?.find((job) => job.id === jobId)?.label_ids
          }
          contactId={jobId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.lable_name}
          showColorBadge={true}
        />
      )}

      {isModalAssignStatusVisible && (
        <RadioButtonModal
          show={isModalAssignStatusVisible}
          onHide={() => setIsModalAssignStatusVisible(false)}
          handleSubmit={handleConfirmRadioButton}
          title="Assign Status to Jobs"
          message="Please select the Status for this contact."
          btn1="Cancel"
          btn2="Submit"
          options={optionRadioButtonStatus}
          selectedLabelIds={
            jobCardList?.find((job) => job.id === statusAssignJobId)?.status_id
          }
          contactId={jobId}
          getOptionColor={(option) => option.color || "#eeeeee"}
          getOptionName={(option) => option.name}
          showColorBadge={true}
        />
      )}

      {isModalAssignUserVisible && (
        <CheckBoxModal
          show={isModalAssignUserVisible}
          onHide={() => setIsModalAssignUserVisible(false)}
          handleSubmit={handleConfirmAssignUser}
          title="Assign your User"
          message="Please select the Users for this Job."
          btn1="Cancel"
          btn2="Submit"
          options={optionJoinCompany}
          selectedLabelIds={
            jobCardList?.find((job) => job.id === userAssignJobId)
              ?.team_assign_ids
          }
          contactId={jobId}
          getOptionName={getOptionName}
          showColorBadge={false}
          smallInfoMessage={
            "Clearing all checkboxes will unassign every selected Team Member"
          }
          hideSmallInfoMessageInCheck={true}
          isContactAssigedTeamMemberBirfercationShow={true}
        />
      )}

      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={handleFilterModalClose}
          handleSubmit={handleConfirmFilter}
          title="Filter your Contact"
          message="Please select the Labels , Source and Demography for the Contact."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[2, 4, 9]}
          pageId={1}
          initialFilterData={filterParams.filterData}
          initialCheckedOptions={filterParams.checkedOptions}
          initialCheckedOptionsStageStatus={
            filterParams.checkedOptionsStageStatus
          }
          stageandStatusOrderType={13}
          initialCheckedAssignedByMultiTeamMember={
            filterParams.assignedByMultiTeamMember
          }
          initialCheckedCreatedByMultiTeamMember={
            filterParams.createdByMultiTeamMember
          }
          labelFilderApplyAndOr={filterParams.labelwiseContactShowAndOrNot}
        />
      )}
    </>
  );
};

export default JobCardListView;
