import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { fetchCompanyForTitle, ICompany } from "../custom-inquiry-from/CustomInquiryFromController";
import CreateStageStatusView from "./CreateStageStatusView";
import {
  fetchStageStatusApi,
  handleDeleteStageStatus,
  IStageStatusView,
  orderTypesStageList,
  updateDisplayOrder
} from "./StageStatusController";

interface IPropsStageStatus {
  isStageStatusView: boolean;
  closeStageStatusView: () => void;
}

const StageStatusView = ({
  isStageStatusView,
  closeStageStatusView,
}: IPropsStageStatus) => {
  const [stagestatusLists, setStageStatusList] = useState<IStageStatusView[]>(
    [],
  );
  const [titleList, setTitleList] = useState<ICompany | undefined>();
  // const [stagestatusInput, setStageStatusInput] = useState("");
  // const [displayOrderInput, setDisplayOrderInput] = useState<{
  //   [key: number]: string;
  // }>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [displayOrders, setDisplayOrders] = useState<{ [key: number]: number }>(
    {},
  );
  // const [stagestatusHexColorInput, setStageStatusHexColorInput] =
  //   useState("#999999");
  const stagestatusRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownStageStatusRef = useRef<
    Record<number, HTMLUListElement | null>
  >({});
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [stagestatusDropdown, setStageStatusDropdown] = useState<any>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editStageStatusId, setEditStageStatusId] = useState<
  //   number | undefined
  // >(undefined);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const [selectedOrderList, setSelectedOrderList] = useState<IOption | null>(
    null,
  );
  // const [editSelectedOrderId, setEditSelectedOrderId] = useState("");
  // const [selectedDisplayOrderList, setSelectedDisplayOrderList] =
  //   useState<any>(false);
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  // const [stagestatusError, setstagestatusError] = useState("");
  const [OrderListError, setOrderListError] = useState("");
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isStatusInputReadOnly, setIsStatusInputReadOnly] = useState(false);
  // const [teamPersonList, setTeamPersonList] = useState<any>([]);
  // const [
  //   selectedTeamPersonToChangeStatus,
  //   setSelectedTeamPersonToChangeStatus,
  // ] = useState<any[]>([]);
  // const [
  //   selectedTeamPersonToShowStatusData,
  //   setSelectedTeamPersonToShowStatusData,
  // ] = useState<any[]>([]);
  const [selectedStatusType, setSelectedStatusType] = useState<any>({
    label: "Neutral",
    value: "0",
  });
  // const [visibility, setVisibility] = useState<0 | 1>(0);  // 0 = internal, 1 = external
  // const [selectedPageType, setSelectedPageType] =
  //   useState<SingleValue<IOption> | null>(null);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<IStageStatusView>({
    order_type: 0,
    name: "",
    id: 0,
    color: "",
    display_order_type: 0,
    change_status_team_ids: "",
    show_status_data_team_ids: "",
    status_type: "",
    change_status_usernames: "",
    show_status_data_usernames: "",
    visibility: 0,
  });

  const canView = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.DELETE,
  );

  useEscapeKey(closeStageStatusView);

  useEffect(() => {
    if (!canView) return;
    if (!isStageStatusView) return;

    fetchCompanyForTitle(setTitleList);
  }, [canView, isStageStatusView])

  // const handelChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setStageStatusInput(value);
  //   setstagestatusError(value ? "" : "Stage and Status Name is required");
  // };

  // const handleDisplayorderChange = (event: TOnChangeInput, itemId: number) => {
  //   const value = event.target.value;
  //   setDisplayOrderInput((prev: any) => ({
  //     ...prev,
  //     [itemId]: value,
  //   }));
  // };

  // const handelChangeHexColor = (event: TOnChangeInput) => {
  //   setStageStatusHexColorInput(event.target.value);
  // };

  // const clearForm = () => {
  //   setStageStatusInput("");
  //   setStageStatusHexColorInput("#999999");
  //   setIsEditing(false);
  //   setSelectedOrderList(false || null);
  //   setSelectedDisplayOrderList(false);
  //   setEditStageStatusId(undefined);
  //   setIsStatusInputReadOnly(false);
  //   setIsStatusInputReadOnly(false);
  //   setSelectedTeamPersonToChangeStatus([]);
  //   setSelectedTeamPersonToShowStatusData([]);
  //   setSelectedStatusType([{ label: "Neutral", value: "0" }]);
  //   setVisibility(0);
  // };

  // const handelSubmit = () => {
  //   if (stagestatusInput.trim() === "") {
  //     setstagestatusError("Stage and Status is required");
  //     return;
  //   }
  //   if (!selectedOrderList) setOrderListError("Please Select Type");

  //   if (stagestatusInput && selectedOrderList) {
  //     if (isEditing && editStageStatusId !== undefined) {
  //       updateStageStatus(
  //         {
  //           name: stagestatusInput,
  //           color: stagestatusHexColorInput,
  //           order_type: Number(selectedOrderList.value),
  //           change_status_team_ids: selectedTeamPersonToChangeStatus,
  //           show_status_data_team_ids: selectedTeamPersonToShowStatusData,
  //           status_type: selectedStatusType.value,
  //           visibility: visibility
  //         },
  //         setLoading,
  //         editStageStatusId,
  //         clearForm,
  //         Number(selectedOrderList?.value),
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createStageStatus(
  //         {
  //           name: stagestatusInput,
  //           color: stagestatusHexColorInput,
  //           order_type: Number(selectedOrderList?.value),
  //           change_status_team_ids: selectedTeamPersonToChangeStatus,
  //           show_status_data_team_ids: selectedTeamPersonToShowStatusData,
  //           status_type: selectedStatusType.value,
  //           visibility: visibility
  //         },
  //         setLoading,
  //         clearForm,
  //         Number(selectedOrderList?.value),
  //       );
  //     }
  //   }
  // };

  const toggleDropdownStageStatus = (stagestatusId: number | undefined) => {
    if (stagestatusId === undefined) return;

    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      return prevId === stagestatusId ? null : stagestatusId;
    });
  };

  useEffect(() => {
    if (!canView) return;
    if (!isStageStatusView) return;
    if (!selectedOrderList?.value) return;

    fetchStageStatusApi(
      setStageStatusList,
      setLoading,
      Number(selectedOrderList.value),
    );
    // fetchAllCompanyApi();
  }, [isStageStatusView, canView, selectedOrderList]);

  const handleEdit = (item: IStageStatusView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setOrderListError("");
      // setstagestatusError("");
      // setStageStatusDropdown(null);
      // setStageStatusInput(item.name);
      // setStageStatusHexColorInput(item.color || "#999999");
      // setIsEditing(true);
      // setEditStageStatusId(item.id);
      // setVisibility(
      //   item.visibility === 1 ? 1 : 0
      // );
      // const change_status_team_person_arr = item.change_status_team_ids
      //   ? item.change_status_team_ids.split(",")
      //   : [];
      // const show_status_data_team_ids_arr = item.show_status_data_team_ids
      //   ? item.show_status_data_team_ids.split(",")
      //   : [];

      // const change_status_team_person = change_status_team_person_arr.map(
      //   (v) => {
      //     const tt = teamsPersonStatusOptions.find(
      //       (option: { value: string }) => String(option.value) === String(v),
      //     );
      //     return tt;
      //   },
      // );

      // const show_status_data_team = show_status_data_team_ids_arr.map((v) => {
      //   const tt = teamsPersonStatusOptions.find(
      //     (option: { value: string }) => String(option.value) === String(v),
      //   );
      //   return tt;
      // });

      // const selectedCategoryOption =
      //   orderDisplayOptions.find(
      //     (option: { value: string }) =>
      //       option.value === String(item.order_type),
      //   ) || null;

      // const selectedStatusTypeOption = [
      //   { label: "Neutral", value: "0" },
      //   { label: "Negative", value: "1" },
      //   { label: "Positive", value: "2" },
      // ].find(
      //   (option: { value: string }) =>
      //     option.value === String(item.status_type),
      // );

      // setSelectedTeamPersonToChangeStatus(change_status_team_person);
      // setSelectedTeamPersonToShowStatusData(show_status_data_team);
      // setSelectedStatusType(selectedStatusTypeOption);
      // setSelectedOrderList(selectedCategoryOption);
      // setEditSelectedOrderId(String(item.order_type));
      // setIsStatusInputReadOnly(item.id < 0);
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable = stagestatusLists.filter((s) => s.id >= 0).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = stagestatusLists
        .map((s) => s.id)
        .filter((id): id is number => id >= 0);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No stage statuses selected");
      return;
    }
    if (canDelete) {
      setDeleteItemIds(selectedIds);
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

    await handleDeleteStageStatus(
      deleteItemIds,
      setIsDeleteConfirmation,
      setStageStatusList,
      setLoading,
      Number(selectedOrderList?.value),
    );
    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownStageStatusRef.current,
    ).some((ref) => ref && ref.contains(target));

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest(".selected-btn");

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

  const handleDelete = (itemId: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      setStageStatusDropdown({});
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
    }
  };

  const handleOrderDisplayChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedOrderList(selectedOption);
    setOrderListError(selectedOption ? "" : "Please Select Type");
  };

  const handleStatusChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedStatusType(selectedOption);
  };

  const customLabels: Record<string, string> = {
    "3": titleList?.quotation_title || "Quotation",
    "4": titleList?.order_title || "Sales Order",
    "5": titleList?.invoice_title || "Sales Invoice",
    "9": titleList?.return_sales_invoice_title || "Return Sales Invoice",
    "6": titleList?.purchase_title || "Purchase Invoice",
    "7": titleList?.purchase_order_title || "Purchase Order",
    "10":
      titleList?.return_purchase_invoice_title ||
      "Return Purchase Invoice",
    "11": titleList?.dispatch_title || "Dispatch",
    "12": titleList?.inward_title || "Goods Received Note",
  };

  const orderDisplayOptions = orderTypesStageList?.map((option) => ({
    value: option.id,
    label: customLabels[String(option.id)] || option.order_type_display,
  }));

  const handleRefreshStageStatus = async () => {
    await fetchStageStatusApi(
      setStageStatusList,
      setLoading,
      Number(selectedOrderList?.value),
    );
  };

  const handleDisplayOrderChange = async (
    id: number,
    value: number | string,
  ) => {
    setDisplayOrders((prev: any) => ({
      ...prev,
      [id]: value,
    }));
    if (value !== 0) {
      updateDisplayOrder(
        {
          display_order_type: value,
        },
        id,
      );
    }
  };

  // const fetchAllCompanyApi = async () => {
  //   const token = await localStorage.getItem("token");
  //   const getUUID = await localStorage.getItem("UUID");

  //   const requestData = {
  //     a_application_login_id: getUUID,
  //   };
  //   try {
  //     const data = await axiosInstance.post("my-team", requestData, {
  //       headers: {
  //         Authorization: `${token}`,
  //       },
  //     });
  //     if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
  //       setTeamPersonList([]);
  //     }
  //     setTeamPersonList(data.data.data.item);
  //   } catch (error: any) {
  //     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  //   }
  // };

  // let teamsPersonStatusOptions: any[] = [];
  // teamPersonList.map((t: any) =>
  //   teamsPersonStatusOptions.push({
  //     value: t.id,
  //     label: t.username,
  //   }),
  // );

  const renderNamesWithTooltip = (names: any) => {
    if (!Array.isArray(names) || names.length === 0) return " ";

    if (names.length === 1) {
      return names[0];
    }

    const fullText = names.join(", ");

    return (
      <span title={fullText} style={{ cursor: "pointer" }}>
        {names[0]}...
      </span>
    );
  };

  const openCreateStageStatusView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isStageStatusView ? (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
        >
          <style>
            {`
              .table-container {
                width: 100%;
                overflow-x: auto;
              }
              .table {
                table-layout: fixed;
                width: 100%;
                border-collapse: collapse;
              }
              .table th, .table td {
                padding: 8px;
                text-align: left;
                vertical-align: middle;
                text-overflow: ellipsis;
              }
              .checkbox-column {
                width: 15%;
              }
              .type-column {
                width: 25%;
              }
              .status-column {
                width: 25%;
                min-width: 100px;
                max-width: 100px;
              }
              .display-order-column {
                width: 25%;
              }
              .action-column {
                width: 25%;
                text-align: right;
              }
              .source-of-types-options {
                position: absolute;
                z-index: 1000;
                background: ${darkMode ? "#333" : "#fff"};
                border: 1px solid ${darkMode ? "#555" : "#ccc"};
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                width: 120px;
                right: 10px;
              }
              .source-of-types-options.isVisible {
                display: block;
              }
              .source-of-types-options.isHidden {
                display: none;
              }
              .source-of-types-options li {
                padding: 8px;
                cursor: pointer;
              }
              .source-of-types-options li:last-child {
                border-bottom: none;
              }
              .source-of-types-options li:hover {
                background: ${darkMode ? "#444" : "#f0f0f0"};
              }
            `}
          </style>
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeStageStatusView}
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
              <h2>Stages & Status</h2>
            </div>
            <div className="col-1 text-end mb-2">
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "60px",
                }}
              >
                <button
                  className="icons"
                  onClick={openCreateStageStatusView}
                  title="Create Stage & Status"
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
                style={{
                  position: "absolute",
                  right: "20px",
                }}
              >
                <button
                  className="icons"
                  onClick={handleRefreshStageStatus}
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
          <div className="chats-notifications">
            <div className="block">
              <div className="h-text">
                <div className="head" style={{ display: "block" }}>
                  {/* <div className="col-12 ">
                    <p className="thanks text-danger">
                      If you want to set a sequence, start from 1 and continue
                      onward.
                    </p>
                  </div> */}
                  <div className="col-12">
                    <label
                      className="form-check-label"
                      htmlFor="flexCheckDefault"
                    >
                      <h4>
                        Type
                        {/* <span className="text-danger">*</span> */}
                      </h4>
                    </label>
                    <div className="">
                      <div className="add-source-of-type-section ">
                        <CustomSearchDropdown
                          options={orderDisplayOptions}
                          value={selectedOrderList}
                          onChange={handleOrderDisplayChange}
                          className="w-100"
                          isDisabled={
                            isStatusInputReadOnly ? "disabled" : false
                          }
                        />
                      </div>
                    </div>
                    {/* {OrderListError && (
                      <span className="text-danger">{OrderListError}</span>
                    )} */}
                  </div>

                  {/* <div className="col-12 mt-1">
                    <label className="form-check-label">
                      <h4>Who can change the status</h4>
                    </label>
                    <div className="">
                      <div className="add-status-action-teams-section">
                        <MultiSelect
                          options={teamsPersonStatusOptions}
                          value={selectedTeamPersonToChangeStatus}
                          onChange={(selected: any) => {
                            setSelectedTeamPersonToChangeStatus(selected);
                          }}
                          isSelectAll={false}
                          menuPlacement="bottom"
                          menuStyle={{
                            left: "90%",
                            right: "auto",
                            transform: "none",
                            height: "42px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 mt-1">
                    <label className="form-check-label">
                      <h4>Who can see this status data.</h4>
                    </label>
                    <div>
                      <div className="add-status-action-teams-to-show-data-section">
                        <MultiSelect
                          options={teamsPersonStatusOptions}
                          value={selectedTeamPersonToShowStatusData}
                          onChange={(selected: any) => {
                            setSelectedTeamPersonToShowStatusData(selected);
                          }}
                          isSelectAll={false}
                          menuPlacement="bottom"
                          menuStyle={{
                            left: "90%",
                            right: "auto",
                            transform: "none",
                            height: "42px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 mt-1">
                    <label
                      className="form-check-label"
                      htmlFor="flexCheckDefault"
                    >
                      <h4>
                        Set Status Type
                        <span className="text-danger">*</span>
                      </h4>
                    </label>
                    <div className="">
                      <div className="add-source-of-type-section ">
                        <CustomSearchDropdown
                          options={[
                            { label: "Neutral", value: "0" },
                            { label: "Negative", value: "1" },
                            { label: "Positive", value: "2" },
                          ]}
                          value={selectedStatusType}
                          onChange={handleStatusChange}
                          className="w-100"
                          isDisabled={
                            isStatusInputReadOnly ? "disabled" : false
                          }
                        />
                      </div>
                    </div>
                    {OrderListError && (
                      <span className="text-danger">{OrderListError}</span>
                    )}
                  </div>
                  <div className="col-12 mt-1">
                    <label className="form-check-label">
                      <h4>Visibility</h4>
                    </label>
                    <div className="d-flex gap-4 mt-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="visibility"
                          id="internal"
                          value="0"
                          checked={visibility === 0}
                          onChange={() => setVisibility(0)}
                        />
                        <label className="form-check-label" htmlFor="internal">
                          Internal
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="visibility"
                          id="external"
                          value="1"
                          checked={visibility === 1}
                          onChange={() => setVisibility(1)}
                        />
                        <label className="form-check-label" htmlFor="external">
                          External
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 mt-1">
                    <label
                      className="form-check-label"
                      htmlFor="flexCheckDefault"
                    >
                      <h4>
                        Enter Stages & Status Name
                        <span className="text-danger">*</span>
                      </h4>
                    </label>
                    <div className="col-12 d-flex">
                      <div className="col-10">
                        <div className="search-bar ">
                          <div className="add-source-of-type-section ">
                            <input
                              type="text"
                              title="Add Stages & Status Name"
                              placeholder="Add Stages & Status Name"
                              maxLength={SMALL_TEXT_LENGTH}
                              value={stagestatusInput}
                              onChange={(e) => handelChange(e)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handelSubmit();
                                }
                              }}
                            // readOnly={isStatusInputReadOnly}
                            />
                          </div>
                        </div>
                        {stagestatusError && (
                          <span className="text-danger">
                            {stagestatusError}
                          </span>
                        )}
                      </div>
                      <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                        <input
                          type="color"
                          value={stagestatusHexColorInput}
                          className="mx-1"
                          onChange={(e) => handelChangeHexColor(e)}
                          onKeyDown={(e) => {
                            if (stagestatusInput.trim() === "") {
                              setstagestatusError(
                                "Stage and Status is required",
                              );
                              return;
                            }
                            if (e.key === "Enter") {
                              handelSubmit();
                            }
                          }}
                        />
                        <button className="" onClick={handelSubmit}>
                          <span>
                            {isEditing ? (
                              <span>
                                <svg
                                  data-name="Layer 1"
                                  height={24}
                                  id="Layer_1"
                                  viewBox="0 0 200 200"
                                >
                                  <title />
                                  <path
                                    fill="currentColor"
                                    d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                  />
                                </svg>
                              </span>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="26px"
                                viewBox="0 -960 960 960"
                                width="26px"
                                fill="#5f6368"
                              >
                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                              </svg>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div> */}
                </div>
                {canView ? (
                  <div className="table-container">
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <div
                          className="source-of-type-list-grid-main"
                          key={index}
                        >
                          <div className="source-of-type-list-grid-list">
                            <div
                              style={{
                                display: "inline-block",
                                marginLeft: "8px",
                              }}
                            >
                              <Skeleton
                                width="100px"
                                height="25px"
                                duration={5}
                                borderRadius={50}
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
                            {/* Bulk Action Bar */}
                            {/* {selectedIds.length > 0 && (
                              <div className="d-flex align-items-center mb-3 p-2 bg-light rounded">
                                <span className="selected-btn rounded-5 d-inline-flex align-items-center" style={{ padding: "0.375rem 0.75rem", marginRight: "10px" }}>
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox mx-1"
                                    checked={isAllSelected}
                                    title="Select All Stage Statuses"
                                    onChange={handleSelectAll}
                                  />
                                  <div className="position-relative d-inline-block ms-1 dropdown-end">
                                    <button
                                      className="border-0 bg-transparent"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setIsActionDropdownOpen(prev => !prev);
                                      }}
                                      disabled={selectedIds.length === 0}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 20" width="22px" height="22px">
                                        <path fill="currentColor" d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z" />
                                      </svg>
                                    </button>
                                    {isActionDropdownOpen && (
                                      <ul className="dropdown-menu show shadow" style={{ position: "absolute", minWidth: "250px", top: "100%", left: 0, zIndex: 1000 }} ref={actionDropdownRef}>
                                        <li className="dropdown-item d-flex align-items-center" role="button" onClick={() => { openDeleteSelected(); setIsActionDropdownOpen(false); }}>
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                                            <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" />
                                          </svg>
                                          Delete Selected Stage Statuses
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                </span>
                                <span className="text-muted">{selectedIds.length} selected</span>
                              </div>
                            )} */}

                            {/* Cards List - Ek row mein ek hi item */}
                            {stagestatusLists.length === 0 ? (
                              <div className="text-center py-5 text-muted">
                                No Data Found Please Select Type
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-3">
                                {stagestatusLists.map((item) => (
                                  <button
                                    key={item.id}
                                    className="w-100 text-start border rounded shadow-sm p-3 bg-white hover-bg-light position-relative"
                                    style={{
                                      fontSize: "0.78rem",
                                      lineHeight: "1.3",
                                      transition: "background-color 0.2s",
                                    }}
                                    onClick={() => {
                                      // Yahan aap card click par kya karna chahte ho (jaise edit open karna)
                                      // Abhi ke liye kuch nahi, ya handleEdit(item) daal sakte ho
                                    }}
                                  >
                                    {/* Checkbox - Top Left */}
                                    {/* {item.id >= 0 && (
                                      <div className="position-absolute top-0 start-0 p-2">
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox form-check-input"
                                          style={{ width: "10px", height: "10px" }}
                                          checked={selectedIds.includes(item.id)}
                                          onChange={(e) => {
                                            e.stopPropagation(); // Button click ko rokta hai
                                            toggleSelection(item.id);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )} */}

                                    {/* Actions Dropdown - Top Right */}
                                    <div className="position-absolute top-0 end-0 p-2">
                                      <div className="dropdown">
                                        <button
                                          className="source-of-type-list-grid-options"
                                          id="source-of-types-options-id"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsActionDropdownOpen(false);
                                            toggleDropdownStageStatus(item?.id);
                                          }}
                                          ref={stagestatusRefDropdown}
                                        >
                                          <span>
                                            <svg
                                              viewBox="0 0 24 24"
                                              width="24"
                                              height="24"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                              ></path>
                                            </svg>
                                          </span>
                                        </button>
                                        <ul
                                          className={`source-of-types-options-status source-of-types-options ${openDropdownId === item.id
                                            ? "isVisible"
                                            : "isHidden"
                                            }`}
                                          id="dropLeft"
                                          ref={(el) =>
                                          (dropdownStageStatusRef.current[
                                            item.id
                                          ] = el)
                                          }
                                          style={{
                                            width: "120px",
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
                                          {item.id > 0 && (
                                            <li
                                              style={{
                                                color: "red",
                                                fontWeight: "600",
                                              }}
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(null);
                                                handleDelete(item.id);
                                              }}
                                            >
                                              Delete
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    </div>

                                    {/* Main Content - Sab left side, chhota font */}
                                    <div className="">
                                      {" "}
                                      {/* Right side dropdown ke liye space */}
                                      <div className="mb-1">
                                        <strong>Type:</strong>{" "}
                                        <span className="text-muted">
                                          {customLabels[
                                            String(item.order_type)
                                          ] ||
                                            orderTypesStageList.find(
                                              (o) =>
                                                Number(o.id) ===
                                                item.order_type,
                                            )?.order_type_display ||
                                            "-"}
                                        </span>
                                      </div>
                                      <div className="mb-1">
                                        <strong>Status:</strong>{" "}
                                        <span
                                          className="badge rounded-pill px-2 py-1"
                                          style={{
                                            backgroundColor:
                                              item.color || "#999999",
                                            fontSize: "0.68rem",
                                          }}
                                        >
                                          {item.name}
                                        </span>
                                      </div>
                                      <div className="mb-1">
                                        <strong>Display Order:</strong>{" "}
                                        <input
                                          type="text"
                                          className="form-control form-control-sm d-inline-block border-bottom rounded-0 shadow-none"
                                          style={{
                                            width: "60px",
                                            fontSize: "0.75rem",
                                            padding: "2px 4px",
                                            background: "transparent",
                                          }}
                                          value={
                                            displayOrders[item.id] !== undefined
                                              ? displayOrders[item.id]
                                              : item.display_order_type || "0"
                                          }
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^-?$|^-?\d+$/.test(val)) {
                                              handleDisplayOrderChange(
                                                item.id,
                                                val,
                                              );
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()} // Input focus par button click na ho
                                        />
                                      </div>
                                      <div className="mb-1">
                                        <strong>Visibility:</strong>{" "}
                                        <span className="text-muted">
                                          {item.visibility === 0 ? "Internal" : "External"}
                                        </span>
                                      </div>
                                      <div className="border-top pt-2">
                                        <small className="d-block text-muted mb-0">
                                          <strong>
                                            Who can change the status:
                                          </strong>{" "}
                                          {renderNamesWithTooltip(
                                            item.change_status_usernames,
                                          )}
                                        </small>

                                        <small className="d-block text-muted">
                                          <strong>
                                            Who can show this status data:
                                          </strong>{" "}
                                          {renderNamesWithTooltip(
                                            item.show_status_data_usernames,
                                          )}
                                        </small>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
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
          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => {
                setIsDeleteConfirmation(false);
                setDeleteItemIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title={
                deleteItemIds.length > 1
                  ? "Delete Stage Statuses"
                  : "Delete this Stage and Status"
              }
              message={`Are you sure you want to delete ${deleteItemIds.length > 1
                ? "these stage statuses"
                : "this stage and status"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <CreateStageStatusView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Stage & Status"
          // handleRefreshStageStatus={handleRefreshStageStatus}
          productToEdit={undefined}
          handleOutsideOrderDisplayChange={handleOrderDisplayChange}
        />
      )}
      {isUpdateModel && (
        <CreateStageStatusView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Stage & Status"
          // handleRefreshStageStatus={handleRefreshStageStatus}
          productToEdit={editableProduct}
          handleOutsideOrderDisplayChange={handleOrderDisplayChange}
        />
      )}
    </>
  );
};

export default StageStatusView;
