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
import CreateUnitView from "./CreateUnitView";
import {
  fetchUnitApi,
  handleDeleteUnit,
  IUnitView
} from "./UnitMasterController";

interface IPropsUnit {
  isUnitView: boolean;
  closeUnitView: () => void;
}

const UnitMasterView = ({
  isUnitView,
  closeUnitView,
}: IPropsUnit) => {
  const [unitLists, setUnitList] = useState<
    IUnitView[]
  >([]);
  // const [unitInput, setUnitInputInput] = useState("");
  // const [allowPoints, setAllowPoints] = useState<"" | "1" | "0">("");// Default to Yes (1)
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  // const categoryRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {}
  );
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteUnitIds, setDeleteUnitIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editUnitId, setEditUnitId] = useState<number | undefined>(
  //   undefined
  // );
  // const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  // const [unitError, setUnitError] = useState("");
  // const [allowdQtyError, setAllowdQtyError] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditaleProduct] = useState<IUnitView>({
    unit: "",
    id: 0,
    is_point_value_allow: "", // New field: 1 = Yes, 0 = No
    created_date_time: "",
  })

  const canView = useCheckUserPermission(
    PAGE_ID.UNIT_MASTER,
    PERMISSION_TYPE.VIEW
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.UNIT_MASTER,
    PERMISSION_TYPE.ADD
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.UNIT_MASTER,
    PERMISSION_TYPE.EDIT
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.UNIT_MASTER,
    PERMISSION_TYPE.DELETE
  );

  useEscapeKey(closeUnitView);

  // const handleChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setUnitInputInput(value);
  //   setUnitError(value ? "" : "Unit name is required");
  //   setAllowdQtyError(value ? "" : "Please Select You Are Allowed Qty in Points");
  // };

  // const handleAllowPointsChange = (
  //   event: React.ChangeEvent<HTMLSelectElement>
  // ) => {
  //   const value = event.target.value as "" | "1" | "0";
  //   setAllowPoints(value);
  //   setAllowdQtyError(value ? "" : "Please Select You Are Allowed Qty in Points");
  // };

  // const clearForm = () => {
  //   setUnitInputInput("");
  //   setAllowPoints("1");
  //   setIsEditing(false);
  //   setEditUnitId(undefined);
  // };
  // const handleSubmit = () => {
  //   let isValid = true;

  //   if (unitInput.trim() === "") {
  //     setUnitError("Unit name is required");
  //     isValid = false;
  //   } else {
  //     setUnitError("");
  //   }

  //   if (allowPoints === "") {
  //     setAllowdQtyError("Please Select You Are Allowed Qty in Points");
  //     isValid = false;
  //   } else {
  //     setAllowdQtyError("");
  //   }

  //   if (!isValid) return;

  //   if (isEditing && editUnitId !== undefined) {
  //     updateUnit(
  //       {
  //         unit: unitInput,
  //         is_point_value_allow: allowPoints,
  //       },
  //       editUnitId,
  //       setLoading,
  //       clearForm
  //     );
  //   } else {
  //     if (!canAdd) {
  //       toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //       return;
  //     }

  //     createUnitMaster(
  //       {
  //         unit: unitInput,
  //         is_point_value_allow: allowPoints,
  //       },
  //       setLoading,
  //       clearForm
  //     );
  //   }
  // };


  const toggleDropdownCategory = (categoryId: number | undefined) => {
    if (categoryId === undefined) return;
    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      // If clicking the same dropdown, close it
      return prevId === categoryId ? null : categoryId;
    });
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if clicked on individual category dropdown button
    const clickedOnButton = target.closest('.source-of-type-list-grid-options');
    if (clickedOnButton) return;

    // Check if clicked inside individual category dropdown
    const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
      (ref) => ref && ref.contains(target)
    );

    // Check if clicked on action dropdown button or inside action dropdown
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

  useEffect(() => {
    if (canView && isUnitView) {
      fetchUnitApi(setUnitList, setLoading);
    }
  }, [isUnitView, canView]);

  const handleEdit = (item: IUnitView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setUnitInputInput(item.unit);
      // setAllowPoints(item.is_point_value_allow === "1" ? "1" : "0");
      // setIsEditing(true);
      // setEditUnitId(item.id);
      // setUnitError("");
      // setAllowdQtyError("");
      setEditaleProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshCategory = async () => {
    if (canView) {
      await fetchUnitApi(setUnitList, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteModel = (categoryId: number | undefined) => {
    setOpenDropdownId(null);
    if (canDelete) {
      if (categoryId !== undefined) {
        setDeleteUnitIds([categoryId]);
        setIsDeleteConfirmation(true);
      } else {
        toast.error("No Unit selected for deletion");
      }
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No Units selected");
      return;
    }
    if (canDelete) {
      setDeleteUnitIds(selectedIds);
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
      const totalSelectable = unitLists.filter(
        (c) => c.id !== -1
      ).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = unitLists
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

    await handleDeleteUnit(
      deleteUnitIds,
      setIsDeleteConfirmation,
      setUnitList,
      setLoading
    );
    setDeleteUnitIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const openCreateUnitView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isUnitView ? (
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
                onClick={closeUnitView}
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
              <h2>Product Unit</h2>
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
                  onClick={openCreateUnitView}
                  title="Create Unit"
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
                  onClick={handleRefreshCategory}
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
                      Enter Unit Name
                      <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="search-bar">
                      <div className="add-source-of-type-section">
                        <input
                          type="text"
                          title="Category"
                          maxLength={BIG_TEXT_LENGTH}
                          placeholder="Add Product Unit"
                          value={unitInput}
                          onChange={(e) => handleChange(e)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    {unitError && (
                      <span className="text-danger">{unitError}</span>
                    )}
                  </div>
                  <div className="col-12 d-flex align-items-center mx-1">
                    <label
                      className="form-check-label"
                      htmlFor="flexCheckDefault"
                    >
                      <h4>
                        Is Allowed To Qty In Points
                        <span className="text-danger">*</span>
                      </h4>
                    </label>
                    <select
                      className="form-select mx-1"
                      value={allowPoints}
                      onChange={handleAllowPointsChange}
                      style={{ width: "100px", height: "38px" }}
                    >
                      <option value="">Select Option</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>

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
                  <div className="col-12">
                    {allowdQtyError && (
                      <span className="text-danger">{allowdQtyError}</span>
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
                                    title="Select All Category"
                                    onChange={handleSelectAll}
                                  />
                                  <div className="position-relative d-inline-block ms-1 dropdown-end">
                                    <button
                                      className="border-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
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
                                          Delete Selected Category
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                </span>
                              </div>
                            )}

                            <p
                              className={`${unitLists.length > 0
                                ? ""
                                : "text-center pt-5"
                                }`}
                            >
                              {unitLists.length > 0
                                ? ""
                                : "No Data Found"}
                            </p>

                            {unitLists &&
                              unitLists.map((item, index) => (
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
                                      marginLeft: "5px",
                                      color: "black"
                                    }}
                                    className="badge rounded-pill"
                                    title={item.unit}
                                  >
                                    {item.unit}
                                  </span>

                                  <span className="ms-2 text-muted small">
                                    (Allowed To Qty In Points: {item.is_point_value_allow == "1" ? "Yes" : "No"})
                                  </span>

                                  {item.id !== -1 && (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsActionDropdownOpen(false);
                                          toggleDropdownCategory(item.id);
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
                                        className={`source-of-types-options ${openDropdownId === item.id ? "isVisible" : "isHidden"
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
                                          style={{ color: "red", fontWeight: "600" }}
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
                setDeleteUnitIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title={
                deleteUnitIds.length > 1
                  ? "Delete Unit"
                  : "Delete this Unit"
              }
              message={`Are you sure you want to delete ${deleteUnitIds.length > 1
                ? "these Units"
                : "this Unit"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <CreateUnitView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Unit"
          handleRefreshCategory={handleRefreshCategory}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreateUnitView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Unit"
          handleRefreshCategory={handleRefreshCategory}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default UnitMasterView;