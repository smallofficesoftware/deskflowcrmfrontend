import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CheckBoxModal from "../../../../../components/model/CheckBoxModal";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { fetchDepartmentsApi } from "../../../list-company/EditTeamMemberController";
import AddWarehouseView from "./AddWarehouseView";
import {
  fetchAllCompanyApi,
  fetchWarehouseApi,
  handleDeleteWarehouse,
  IWarehouseView,
  updateUserCheckBox
} from "./WarehouseController"; // ← change filename & exports accordingly

interface IPropsWarehouseView {
  isWarehouseView: boolean;
  closeWarehouseView: () => void;
}

const WarehouseView = ({
  isWarehouseView,
  closeWarehouseView,
}: IPropsWarehouseView) => {
  const [warehouseLists, setWarehouseList] = useState<IWarehouseView[]>([]);
  // const [warehouseInput, setWarehouseInput] = useState("");
  // const [warehouseHexColorInput, setWarehouseHexColorInput] = useState("#999999");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {}
  );
  const [warehouseDropdown, setWarehouseDropdown] = useState<any>(null);
  const [deleteWarehouseIds, setDeleteWarehouseIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editWarehouseId, setEditWarehouseId] = useState<any>(
    undefined
  );
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  // const [warehouseError, setWarehouseError] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<IWarehouseView>({
    warehouse_name: "",
    id: 0,
    warehouse_color: "",
    created_date_time: "",
    assigned_team_member: "",
  });

  const canView = useCheckUserPermission(
    PAGE_ID.WAREHOUSE,           // ← hopefully you have this enum value
    PERMISSION_TYPE.VIEW
  );
  const canAdd = useCheckUserPermission(PAGE_ID.WAREHOUSE, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(
    PAGE_ID.WAREHOUSE,
    PERMISSION_TYPE.EDIT
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.WAREHOUSE,
    PERMISSION_TYPE.DELETE
  );

  useEscapeKey(closeWarehouseView);

  // const handleChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setWarehouseInput(value);
  //   setWarehouseError(value ? "" : "Warehouse name is required");
  // };

  // const handleChangeHexColor = (event: TOnChangeInput) => {
  //   setWarehouseHexColorInput(event.target.value);
  // };

  // const clearForm = () => {
  //   setWarehouseInput("");
  //   setWarehouseHexColorInput("#999999");
  //   setIsEditing(false);
  //   setEditWarehouseId(undefined);
  // };

  // const handleSubmit = () => {
  //   if (warehouseInput.trim() === "") {
  //     setWarehouseError("Warehouse name is required");
  //     return;
  //   }

  //   setWarehouseError("");

  //   if (warehouseInput) {
  //     if (isEditing && editWarehouseId !== undefined) {
  //       updateWarehouse(
  //         {
  //           warehouse_name: warehouseInput,
  //           warehouse_color: warehouseHexColorInput,
  //         },
  //         editWarehouseId,
  //         setLoading,
  //         clearForm
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createWarehouse(
  //         {
  //           warehouse_name: warehouseInput,
  //           warehouse_color: warehouseHexColorInput,
  //         },
  //         setLoading,
  //         clearForm
  //       );
  //     }
  //   }
  // };

  const toggleDropdownWarehouse = (warehouseId: number | undefined) => {
    if (warehouseId !== undefined) {
      setIsActionDropdownOpen(false);
      setWarehouseDropdown((prev: any) => {
        if (prev && prev[warehouseId] === true) {
          return {};
        }
        return { [warehouseId]: true };
      });
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if clicked on individual warehouse dropdown button
    const clickedOnButton = target.closest('.source-of-type-list-grid-options');
    if (clickedOnButton) return;

    // Check if clicked inside individual warehouse dropdown
    const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
      (ref) => ref && ref.contains(target)
    );

    // Check if clicked on action dropdown button or inside action dropdown
    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest('.selected-btn');

    if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
      setWarehouseDropdown({});
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
        setWarehouseDropdown({});
        setIsActionDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (canView && isWarehouseView) {
      fetchWarehouseApi(setWarehouseList, setLoading);
    }
  }, [isWarehouseView, canView]);

  useEffect(() => {
    setWarehouseDropdown({});
    setIsActionDropdownOpen(false);
  }, [warehouseLists.length]);

  const handleEdit = (item: IWarehouseView) => {
    setWarehouseDropdown({});

    if (canEdit) {
      // setWarehouseInput(item.warehouse_name);
      // setWarehouseHexColorInput(item.warehouse_color || "#999999");
      // setIsEditing(true);
      // setEditWarehouseId(item.id);
      // setWarehouseError("");
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshWarehouse = async () => {
    if (canView) {
      await fetchWarehouseApi(setWarehouseList, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteModel = (warehouseId: number | undefined) => {
    setWarehouseDropdown({});

    if (canDelete) {
      if (warehouseId !== undefined) {
        setDeleteWarehouseIds([warehouseId]);
        setIsDeleteConfirmation(true);
      } else {
        toast.error("No warehouse selected for deletion");
      }
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No warehouses selected");
      return;
    }
    if (canDelete) {
      setDeleteWarehouseIds(selectedIds);
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
      const totalSelectable = warehouseLists.filter((c) => c.id !== -1).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = warehouseLists
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

    await handleDeleteWarehouse(
      deleteWarehouseIds,
      setIsDeleteConfirmation,
      setWarehouseList,
      setLoading
    );
    setDeleteWarehouseIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
    useState<boolean>(false);
  const [userAssignTaskId, setUserAssignTaskId] = useState<number>();

  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const canAddAssignTeamMember = useCheckUserPermission(
    PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
    PERMISSION_TYPE.ADD,
  );

  useEffect(() => {
    if (isModalAssignUserVisible) {
      fetchAllCompanyApi(setOptionJoinCompany);
      fetchDepartmentsApi(setDepartments);
    }
  }, [
    isModalAssignUserVisible,
  ]);
  const getOptionName = (option: { username: string; department: number }) => {
    const departmentObj = departments.find(
      (item) => item.id === option.department,
    );

    if (departmentObj) {
      return `${option.username} (${departmentObj.department_name})`;
    }

    return option.username;
  };

  const handleModalOpenUserAssign = (id?: number | undefined) => {
    if (canAddAssignTeamMember) {
      setUserAssignTaskId(id);
      setIsModalAssignUserVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmAssignUser = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {

    let idsToUpdate: number | number[];

    if (selectedIds.length > 0) {
      idsToUpdate = selectedIds;

    } else if (contactId !== undefined) {
      idsToUpdate = contactId;

    } else {
      console.log("No ID Found");
      return;
    }

    await updateUserCheckBox(idsToUpdate, checkedOptions, setLoading, setWarehouseList);

    setIsAllSelected(false);
    setSelectedIds([]);
    setIsModalAssignUserVisible(false);
  };

  const openAddWarehouseView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isWarehouseView ? (
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
                aria-label="New chat"
                onClick={closeWarehouseView}
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
              <h2>Warehouse</h2>
            </div>
            <div className="text-end mb-2">
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "60px",
                }}
              >
                <button
                  className="icons"
                  onClick={openAddWarehouseView}
                  title="Add Warehouse"
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
                  onClick={handleRefreshWarehouse}
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

          {/* Chats */}
          <div className="chats-notifications">
            <div className="block">
              <div className="h-text">
                {/* <div className="head" style={{ display: "block" }}>
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    <h4>
                      Enter Warehouse Name
                      <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="col-10">
                      <div className="search-bar">
                        <div className="add-source-of-type-section">
                          <input
                            type="text"
                            title="Warehouse"
                            maxLength={BIG_TEXT_LENGTH}
                            placeholder="Add Warehouse"
                            value={warehouseInput}
                            onChange={(e) => handleChange(e)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                      <input
                        type="color"
                        value={warehouseHexColorInput}
                        className="mx-1"
                        onChange={(e) => handleChangeHexColor(e)}
                      />
                      <button className="" onClick={handleSubmit}>
                        <span>
                          {isEditing ? (
                            <svg
                              data-name="Layer 1"
                              height={24}
                              id="Layer_1"
                              viewBox="0 0 200 200"
                            >
                              <path
                                fill="currentColor"
                                d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                              />
                            </svg>
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
                  <div className="col-12">
                    {warehouseError && (
                      <span className="text-danger">{warehouseError}</span>
                    )}
                  </div>
                </div> */}
                {canView ? (
                  <div>
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
                            {selectedIds.length > 0 && (
                              <div className="pb-1">
                                <span
                                  className="selected-btn rounded-5"
                                  style={{
                                    width: "fit-content",
                                    height: "fit-content",
                                    paddingTop: "0.100rem",
                                    paddingBottom: "0.375rem",
                                    paddingLeft: "0.20rem",
                                    paddingRight: "0.75rem",
                                    marginLeft: "0",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="custom Esteban-checkbox mx-1"
                                    checked={isAllSelected}
                                    title="Select All Warehouse"
                                    onChange={handleSelectAll}
                                  />
                                  <div className="position-relative d-inline-block ms-1 dropdown-end">
                                    <button
                                      className="border-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Close individual warehouse dropdowns when opening action dropdown
                                        setWarehouseDropdown({});
                                        setIsActionDropdownOpen((prev) => !prev);
                                      }}
                                      disabled={selectedIds.length === 0}
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
                                          left: -40,
                                          minWidth: "220px",
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
                                          Delete Selected Warehouse
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                </span>
                              </div>
                            )}

                            <p
                              className={`${warehouseLists.length > 0
                                ? ""
                                : "text-center pt-5"
                                }`}
                            >
                              {warehouseLists.length > 0 ? "" : "No Data Found"}
                            </p>

                            {warehouseLists &&
                              warehouseLists.map((item, index) => (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                  style={{ minHeight: "40px" }}
                                >
                                  {item.id !== -1 && (
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox mx-1"
                                      checked={selectedIds.includes(item.id)}
                                      onChange={() => toggleSelection(item.id)}
                                    />
                                  )}
                                  <span
                                    style={{
                                      backgroundColor: item.warehouse_color || "#999999",
                                      marginLeft: "5px",
                                    }}
                                    className="badge rounded-pill"
                                    title={item.warehouse_name}
                                  >
                                    {item.warehouse_name}
                                  </span>

                                  {item.id !== -1 && (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsActionDropdownOpen(false);
                                          toggleDropdownWarehouse(item.id);
                                        }}
                                      >
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
                                      </button>
                                      <ul
                                        className={`labelDropLeft ${warehouseDropdown && warehouseDropdown[item.id] === true
                                          ? "isVisible"
                                          : "isHidden"
                                          }`}
                                        id="dropLeft"
                                        ref={(el) => {
                                          if (el) {
                                            dropdownContactRef.current[item.id] = el;
                                          } else {
                                            delete dropdownContactRef.current[item.id];
                                          }
                                        }}
                                        style={{
                                          width: "100%",
                                          marginTop: "20px"
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(item);
                                            setWarehouseDropdown({});
                                          }}
                                        >
                                          Edit
                                        </li>
                                        <li
                                          style={{ color: "red", fontWeight: "600" }}
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModel(item.id);
                                            setWarehouseDropdown({});
                                          }}
                                        >
                                          Delete
                                        </li>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() => {
                                            handleModalOpenUserAssign(item.id);
                                            setIsActionDropdownOpen(false);
                                          }}
                                        >
                                          <span>
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              height="15"
                                              viewBox="0 -960 960 960"
                                              width="15"
                                              fill="currentColor"
                                            >
                                              <path d="M216-144q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h171q8-32 34.03-52t59-20Q513-888 539-868t34 52h171q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm264-624q10.4 0 17.2-6.8 6.8-6.8 6.8-17.2 0-10.4-6.8-17.2-6.8-6.8-17.2-6.8-10.4 0-17.2 6.8-6.8 6.8-6.8 17.2 0 10.4 6.8 17.2 6.8 6.8 17.2 6.8ZM216-269q56-46 124-68.5T480-360q72 0 140 22t124 69v-475H216v475Zm264.24-139Q540-408 582-450.24q42-42.24 42-102T581.76-654q-42.24-42-102-42T378-653.76q-42 42.24-42 102T378.24-450q42.24 42 102 42ZM265-216h430q-46-35-101-53.5T480-288q-59 0-113.5 18.5T265-216Zm215-264q-30 0-51-21t-21-51q0-30 21-51t51-21q30 0 51 21t21 51q0 30-21 51t-51 21Zm0-72Z" />
                                            </svg>
                                          </span>{" "}
                                          Assign to Team Member
                                        </li>

                                      </ul>
                                    </>
                                  )}
                                </div>
                              ))}
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
                setDeleteWarehouseIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title={
                deleteWarehouseIds.length > 1
                  ? "Delete Warehouses"
                  : "Delete this Warehouse"
              }
              message={`Are you sure you want to delete ${deleteWarehouseIds.length > 1
                ? "these warehouses"
                : "this warehouse"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isModalAssignUserVisible && (
        <CheckBoxModal
          show={isModalAssignUserVisible}
          onHide={() => setIsModalAssignUserVisible(false)}
          handleSubmit={handleConfirmAssignUser}
          title="Assign your User"
          message="Please select the Users for this Warehouse"
          btn1="Cancel"
          btn2="Submit"
          options={optionJoinCompany}
          selectedLabelIds={
            warehouseLists.find(
              (item) =>
                item.id === (userAssignTaskId ?? Number(editWarehouseId?.id)),
            )?.assigned_team_member
          }
          contactId={userAssignTaskId ?? editWarehouseId?.id}
          getOptionName={getOptionName}
          showColorBadge={false}
        />
      )}
      {isCreateModel && (
        <AddWarehouseView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Add Warehouse"
          handleRefreshWarehouse={handleRefreshWarehouse}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <AddWarehouseView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Warehouse"
          handleRefreshWarehouse={handleRefreshWarehouse}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default WarehouseView;