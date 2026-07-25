import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateTaskTemplateView from "./CreateTaskTemplateView";
import {
  fetchCompanyApi,
  fetchTaskTemplateApi,
  handleDeleteTaskTemplate,
  ICompanyView,
  ITaskTemplateView,
  orderTypesStageList,
  updateDisplayOrder
} from "./TaskTemplateController";
import TaskTemplateDataSourceView from "./TaskTemplateDataSourceView";

interface IPropsTaskTemplate {
  isTaskTemplateView: boolean;
  closeTaskTemplateView: () => void;
}

const TaskTemplateView = ({
  isTaskTemplateView,
  closeTaskTemplateView,
}: IPropsTaskTemplate) => {
  const [tasktemplateLists, setTaskTemplateList] = useState<ITaskTemplateView[]>([]);
  const [titleList, setTitleList] = useState<ICompanyView[]>([]);
  // const [tasktemplateInput, setTaskTemplateInput] = useState("");
  // const [displayOrderInput, setDisplayOrderInput] = useState<{
  //   [key: number]: string;
  // }>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [displayOrders, setDisplayOrders] = useState<{ [key: number]: number }>({});
  // const [tasktemplateHexColorInput, setTaskTemplateHexColorInput] = useState("#999999");
  const tasktemplateRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownTaskTemplateRef = useRef<Record<number, HTMLUListElement | null>>({});
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [tasktemplateDropdown, setTaskTemplateDropdown] = useState<any>(null);
  // const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editTaskTemplateId, setEditTaskTemplateId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  // const [selectedOrderList, setSelectedOrderList] = useState<any>(false);
  // const [editSelectedOrderId, setEditSelectedOrderId] = useState("");
  // const [selectedDisplayOrderList, setSelectedDisplayOrderList] = useState<any>(false);
  // const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  // const [tasktemplateError, settasktemplateError] = useState("");
  // const [OrderListError, setOrderListError] = useState("");
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  // const [isStatusInputReadOnly, setIsStatusInputReadOnly] = useState(false);
  const [isAddDataSource, setIsAddDataSource] = useState(false);
  const [title, setTitle] = useState("");
  const [addDataSourceItem, setAddDataSourceItem] =
    useState<ITaskTemplateView>();

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<ITaskTemplateView>({
    templete_type: 0,
    name: "",
    id: 0,
    color: "",
    display_order_type: 0,
  });


  const canView = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.DELETE);

  useEscapeKey(closeTaskTemplateView);

  // const handelChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setTaskTemplateInput(value);
  //   settasktemplateError(value ? "" : "Stage and Status Name is required");
  // };

  // const handleDisplayorderChange = (event: TOnChangeInput, itemId: number) => {
  //   const value = event.target.value;
  //   setDisplayOrderInput((prev: any) => ({
  //     ...prev,
  //     [itemId]: value,
  //   }));
  // };

  // const handelChangeHexColor = (event: TOnChangeInput) => {
  //   setTaskTemplateHexColorInput(event.target.value);
  // };

  // const clearForm = () => {
  //   setTaskTemplateInput("");
  //   setTaskTemplateHexColorInput("#999999");
  //   setIsEditing(false);
  //   setSelectedOrderList(false || null);
  //   setSelectedDisplayOrderList(false);
  //   setEditTaskTemplateId(undefined);
  //   setIsStatusInputReadOnly(false);

  // };

  // const handelSubmit = () => {
  //   if (tasktemplateInput.trim() === "") {
  //     settasktemplateError("Stage and Status is required");
  //     return;
  //   }
  //   if (!selectedOrderList) setOrderListError("Please Select Type");

  //   if (tasktemplateInput && selectedOrderList) {
  //     if (isEditing && editTaskTemplateId !== undefined) {
  //       updateTaskTemplate(
  //         {
  //           name: tasktemplateInput,
  //           color: tasktemplateHexColorInput,
  //           templete_type: selectedOrderList.value,
  //         },
  //         setLoading,
  //         editTaskTemplateId,
  //         clearForm
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createTaskTemplate(
  //         {
  //           name: tasktemplateInput,
  //           color: tasktemplateHexColorInput,
  //           templete_type: selectedOrderList?.value,
  //         },
  //         setLoading,
  //         clearForm
  //       );
  //     }
  //   }
  // };

  const toggleDropdownTaskTemplate = (tasktemplateId: number | undefined) => {
    if (tasktemplateId === undefined) return;

    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      return prevId === tasktemplateId ? null : tasktemplateId;
    });
  };

  useEffect(() => {
    if (canView) {
      if (isTaskTemplateView) {
        fetchTaskTemplateApi(setTaskTemplateList, setLoading);
      }
      fetchCompanyApi(setTitleList);
    }
  }, [isTaskTemplateView, canView]);

  const handleEdit = (item: ITaskTemplateView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setOrderListError("");
      // settasktemplateError("");
      // setTaskTemplateDropdown(null);
      // setTaskTemplateInput(item.name);
      // setTaskTemplateHexColorInput(item.color || "#999999");
      // setIsEditing(true);
      // setEditTaskTemplateId(item.id);
      // const selectedCategoryOption = orderDisplayOptions.find(
      //   (option: { value: string }) => option.value === String(item.templete_type)
      // );
      // setSelectedOrderList(selectedCategoryOption);
      // setEditSelectedOrderId(String(item.templete_type));
      // setIsStatusInputReadOnly(item.id < 0);
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const dataSource = (item: ITaskTemplateView) => {
    setIsAddDataSource(true);
    setAddDataSourceItem(item);
    setTitle(item.name)
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable = tasktemplateLists.filter((s) => s.id >= 0).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = tasktemplateLists
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

    await handleDeleteTaskTemplate(
      deleteItemIds,
      setIsDeleteConfirmation,
      setTaskTemplateList,
      setLoading
    );
    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest('.source-of-type-list-grid-options');
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(dropdownTaskTemplateRef.current).some(
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

  const handleDelete = (itemId: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      setTaskTemplateDropdown({});
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
    }
  };

  // const handleOrderDisplayChange = (selectedOption: SingleValue<IOption>) => {
  //   setSelectedOrderList(selectedOption);
  //   setOrderListError(selectedOption ? "" : "Please Select Type");
  // };

  // const customLabels: Record<string, string> = {
  //   "5": titleList?.[0]?.quotation_title || "Quotation",
  //   "6": titleList?.[0]?.order_title || "Sales Order",
  //   "7": titleList?.[0]?.invoice_title || "Sales Invoice",
  //   "8": titleList?.[0]?.return_sales_invoice_title || "Return Sales Invoice",
  //   "9": titleList?.[0]?.purchase_order_title || "Purchase Order",
  //   "10": titleList?.[0]?.purchase_title || "Purchase Invoice",
  //   "11": titleList?.[0]?.return_purchase_invoice_title || "Return Purchase Invoice",
  // };

  const customLabels: Record<string, string> = {
    "5": titleList?.[0]?.quotation_title || "Quotation",
    "6": titleList?.[0]?.order_title || "Sales Order",
    "7": titleList?.[0]?.invoice_title || "Sales Invoice",
    "8": titleList?.[0]?.purchase_title || "Purchase Invoice",
    "9": titleList?.[0]?.purchase_order_title || "Purchase Order",
    "10": titleList?.[0]?.return_sales_invoice_title || "Return Sales Invoice",
    "11": titleList?.[0]?.return_purchase_invoice_title || "Return Purchase Invoice",
    "12": titleList?.[0]?.inward_title || "Goods Received Note",
    "13": titleList?.[0]?.dispatch_title || "Dispatch",
  };
  const orderDisplayOptions = orderTypesStageList?.map((option) => ({
    value: option.id,
    label: customLabels[String(option.id)] || option.order_type_display,
  }));

  const handleRefreshTaskTemplate = async () => {
    await fetchTaskTemplateApi(setTaskTemplateList, setLoading);
  };

  const handleDisplayOrderChange = async (id: number, value: number | string) => {
    setDisplayOrders((prev: any) => ({
      ...prev,
      [id]: value,
    }));
    if (value !== 0) {
      updateDisplayOrder(
        {
          display_order_type: value,
        },
        id
      );
    }
  };

  const openCreateTaskTemplateView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isTaskTemplateView ? (
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
    
    /* Updated styles */
    .table tbody tr {
      position: relative;
    }
    
    .table tbody tr .checkbox-column {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .table tbody tr:hover .checkbox-column,
    .table tbody tr .checkbox-column.show-checkbox {
      opacity: 1;
    }
    
    .type-column, .status-column {
      position: relative;
    }
    
    .truncate-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
    }
    
    .truncate-wrapper {
      position: relative;
      display: inline-block;
      width: 100%;
    }
    
    .truncate-wrapper:hover .hover-tooltip {
      display: block;
    }
    
    .hover-tooltip {
      display: none;
      position: absolute;
      left: 0;
      top: calc(100% + 4px);
      background: ${darkMode ? "#2a2a2a" : "#fff"};
      color: ${darkMode ? "#fff" : "#000"};
      z-index: 10000;
      padding: 8px 12px;
      border: 1px solid ${darkMode ? "#555" : "#ccc"};
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      min-width: 150px;
      white-space: normal;
      word-wrap: break-word;
      pointer-events: none;
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
      width: 30%;
    }
    .action-column {
      width: 15%;
    }
    .source-of-types-options {
      position: absolute;
      z-index: 1000;
      background: ${darkMode ? "#333" : "#fff"};
      border: 1px solid ${darkMode ? "#555" : "#ccc"};
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .source-of-types-options.isVisible {
      display: block;
    }
    .source-of-types-options.isHidden {
      display: none;
    }
    .source-of-types-options li {
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
                onClick={closeTaskTemplateView}
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
              <h2>Task Template</h2>
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
                  onClick={openCreateTaskTemplateView}
                  title="Create Task Template"
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
                  onClick={handleRefreshTaskTemplate}
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
                {/* <div className="head" style={{ display: "block" }}>
                  <div className="col-12 ">
                    <p className="thanks">
                      If you want to set a sequence, start from 1 and continue onward.
                    </p>
                  </div>
                  <div className="col-12 mt-1">
                    <label className="form-check-label" htmlFor="flexCheckDefault">
                      <h4>
                        Type
                        <span className="text-danger">*</span>
                      </h4>
                    </label>
                    <div className="">
                      <div className="add-source-of-type-section ">
                        <CustomSearchDropdown
                          options={orderDisplayOptions}
                          value={selectedOrderList}
                          onChange={handleOrderDisplayChange}
                          className="w-100"
                          isDisabled={isStatusInputReadOnly ? "disabled" : false}
                        />
                      </div>
                    </div>
                    {OrderListError && (
                      <span className="text-danger">{OrderListError}</span>
                    )}
                  </div>
                  <label className="form-check-label" htmlFor="flexCheckDefault">
                    <h4>
                      Enter Task Template Name
                      <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="col-10">
                      <div className="search-bar ">
                        <div className="add-source-of-type-section ">
                          <input
                            type="text"
                            title="Add Task Template Name"
                            placeholder="Add Task Template Name"
                            maxLength={SMALL_TEXT_LENGTH}
                            value={tasktemplateInput}
                            onChange={(e) => handelChange(e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handelSubmit();
                              }
                            }}
                            readOnly={isStatusInputReadOnly}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                      <input
                        type="color"
                        value={tasktemplateHexColorInput}
                        className="mx-1"
                        onChange={(e) => handelChangeHexColor(e)}
                        onKeyDown={(e) => {
                          if (tasktemplateInput.trim() === "") {
                            settasktemplateError("Stage and Status is required");
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
                  {tasktemplateError && (
                    <span className="text-danger">{tasktemplateError}</span>
                  )}
                </div> */}
                {canView ? (
                  <div className="table-container">
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <div className="source-of-type-list-grid-main" key={index}>
                          <div className="source-of-type-list-grid-list">
                            <div style={{ display: "inline-block", marginLeft: "8px" }}>
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
                            <table className="table table-bordered table-sm">
                              <thead>
                                <tr>
                                  <th className="checkbox-column">
                                    {selectedIds.length > 0 && (
                                      <span
                                        className="selected-btn rounded-5"
                                        style={{
                                          width: "fit-content",
                                          height: "fit-content",
                                          paddingTop: "0.375rem",
                                          paddingBottom: "0.375rem",
                                          paddingLeft: "0.75rem",
                                          paddingRight: "0.75rem",
                                          marginRight: "10px",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox mx-1"
                                          checked={isAllSelected}
                                          title="Select All Stage Statuses"
                                          onChange={handleSelectAll}
                                        />
                                        <div className="position-relative d-inline-block ms-1 dropdown-end">
                                          <button
                                            className="border-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenDropdownId(null);
                                              setIsActionDropdownOpen((prev) => !prev);
                                            }} disabled={selectedIds.length === 0}
                                          >
                                            <span className="contact-btn-search-text">
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
                                            </span>
                                          </button>
                                          {isActionDropdownOpen && (
                                            <ul
                                              className="labelDropLeft isVisible"
                                              style={{
                                                position: "absolute",
                                                minWidth: "250px",
                                                background: "#fff",
                                                border: "1px solid #ddd",
                                                borderRadius: "5px",
                                                zIndex: "1000",
                                                overflowY: "auto",
                                                height: "5vh",
                                              }}
                                              ref={actionDropdownRef}
                                            >
                                              <li
                                                // className="listItem-contact-tabs mb-1"
                                                className="listItem"
                                                role="button"
                                                onClick={() => {
                                                  openDeleteSelected();
                                                  setIsActionDropdownOpen(false);
                                                }}
                                              >
                                                <span>
                                                  <svg
                                                    width="15"
                                                    height="15"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                  >
                                                    <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                                  </svg>
                                                </span>{" "}
                                                Delete Selected Task Template
                                              </li>
                                            </ul>
                                          )}
                                        </div>
                                      </span>
                                    )}
                                  </th>
                                  <th className="type-column">Type</th>
                                  <th className="status-column" style={{ overflow: "hidden" }}>Template</th>
                                  <th className="display-order-column">Display Order</th>
                                  <th className="action-column"></th>
                                </tr>
                              </thead>
                              <tbody>
                                <p
                                  className={`${tasktemplateLists.length > 0 ? "" : " text-center pt-5"}`}
                                >
                                  {tasktemplateLists.length > 0 ? "" : "No Data Found"}
                                </p>
                                {tasktemplateLists &&
                                  tasktemplateLists.map((item, index) => (
                                    <tr key={index}>
                                      <td className={`checkbox-column ${selectedIds.length > 0 ? 'show-checkbox' : ''}`}>
                                        {item.id >= 0 && (
                                          <input
                                            type="checkbox"
                                            className="custom-checkbox mx-1"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                          />
                                        )}
                                      </td>
                                      <td className="type-column">
                                        <div className="truncate-wrapper">
                                          <span className="truncate-text">
                                            {customLabels[String(item.templete_type)] ||
                                              orderTypesStageList.find(
                                                (option) => Number(option.id) === item.templete_type
                                              )?.order_type_display ||
                                              ""}
                                          </span>
                                          <div className="hover-tooltip">
                                            {customLabels[String(item.templete_type)] ||
                                              orderTypesStageList.find(
                                                (option) => Number(option.id) === item.templete_type
                                              )?.order_type_display ||
                                              ""}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="status-column">
                                        <div className="truncate-wrapper">
                                          <span className="truncate-text">
                                            <span
                                              style={{
                                                backgroundColor: item.color ? item.color : "#999999",
                                                textAlign: "left",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                display: "block",
                                              }}
                                              className="badge rounded-pill"
                                            >
                                              {item.name}
                                            </span>
                                          </span>
                                          <div className="hover-tooltip">
                                            <span
                                              style={{
                                                backgroundColor: item.color ? item.color : "#999999",
                                                display: "inline-block",
                                                padding: "4px 8px",
                                              }}
                                              className="badge rounded-pill"
                                            >
                                              {item.name}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="display-order-column">
                                        <input
                                          type="text"
                                          className="w-75"
                                          style={{ textAlign: "right" }}
                                          title="Display Order"
                                          value={
                                            displayOrders[item.id] !== undefined
                                              ? displayOrders[item.id]
                                              : item.display_order_type || "0"
                                          }
                                          onChange={(e) => {
                                            const newValue = e.target.value;
                                            if (/^-?$|^-?\d+$/.test(newValue)) {
                                              handleDisplayOrderChange(item.id, newValue);
                                            }
                                          }}
                                        />
                                      </td>
                                      <td className="action-column">

                                        <button
                                          className="source-of-type-list-grid-options"
                                          id="source-of-types-options-id"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsActionDropdownOpen(false);
                                            toggleDropdownTaskTemplate(item?.id);
                                          }} ref={tasktemplateRefDropdown}
                                        >
                                          <span>
                                            <svg viewBox="0 0 24 24" width="24" height="24">
                                              <path
                                                fill="currentColor"
                                                d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                              ></path>
                                            </svg>
                                          </span>
                                        </button>
                                        <ul
                                          className={`source-of-types-options-status source-of-types-options ${openDropdownId === item.id ? "isVisible" : "isHidden"
                                            }`}
                                          id="dropLeft"
                                          ref={(el) => (dropdownTaskTemplateRef.current[item.id] = el)}
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
                                            className="listItem"
                                            role="button"
                                            onClick={() =>
                                              dataSource(item)
                                            }
                                          >
                                            View Data sources
                                          </li>
                                          {item.id > 0 && <li
                                            style={{ color: "red", fontWeight: "600" }}
                                            className="listItem"
                                            role="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenDropdownId(null);
                                              handleDelete(item.id);
                                            }}
                                          >
                                            Delete
                                          </li>}
                                        </ul>

                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-danger p-1">{DEFAULT_MESSAGE_ERROR_PERMISSION}</p>
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
              title={deleteItemIds.length > 1 ? "Delete Task Templates" : "Delete this Task Templates"}
              showPermission
              permissionText={"Deleting this template will permanently remove its tasks. I agree."}
              message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these Task Templates" : "this Task Templates"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}



        </div>

      ) : null}
      {isAddDataSource && (
        <TaskTemplateDataSourceView
          show={isAddDataSource}
          onHide={() => setIsAddDataSource(false)}
          passDataInAddItem={addDataSourceItem}
          title={title}
        />
      )}
      {isCreateModel && (
        <CreateTaskTemplateView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Task Template"
          handleRefreshTaskTemplate={handleRefreshTaskTemplate}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreateTaskTemplateView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Task Template"
          handleRefreshTaskTemplate={handleRefreshTaskTemplate}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default TaskTemplateView;