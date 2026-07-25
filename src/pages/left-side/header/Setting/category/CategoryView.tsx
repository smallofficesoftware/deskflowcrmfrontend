import React, { useEffect, useRef, useState } from "react";
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
import {
  fetchCategoriesWithGroup,
  handleDeleteCategory,
  ICategoryView
} from "./CategoryController";
import CreateCategoryView from "./CreateCategoryView";

interface IPropsCategoryView {
  isCategoryView: boolean;
  closeCategoryView: () => void;
}

const CategoryView = ({
  isCategoryView,
  closeCategoryView,
}: IPropsCategoryView) => {
  const [categoryLists, setCategoryList] = useState<ICategoryView[]>([]);
  // const [categoryInput, setCategoryInputInput] = useState("");
  // const [categoryHexColorInput, setCategoryHexColorInput] = useState("#999999");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  // const categoryRefDropdown = useRef<HTMLButtonElement>(null);
  // const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
  // const [categoryDropdown, setCategoryDropdown] = useState<any>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [deleteCategoryIds, setDeleteCategoryIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editCategoryId, setEditCategoryId] = useState<number | undefined>(undefined);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  // const [categoryError, setCategoryError] = useState("");
  // const [countryError, setCountryError] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

  // ── Group / Country related states ──
  // const [countriesList, setCountriesList] = useState<IGroupView[]>([]);
  // const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const dropdownStateRef = useRef<Record<number, HTMLUListElement | null>>({});

  const canView = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.DELETE);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<ICategoryView>({
    category_name: "",
    id: 0,
    color: "",
    created_date_time: "",
    group_id: 0,
    group_name: "",
  });

  useEscapeKey(closeCategoryView);

  // const handleChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setCategoryInputInput(value);
  //   setCategoryError(value.trim() ? "" : "Category name is required");
  // };

  // const handleCountryChange = (selectedOption: any) => {
  //   if (selectedOption) {
  //     setSelectedGroupId(Number(selectedOption.value));
  //     setCountryError("");
  //   } else {
  //     setSelectedGroupId(null);
  //     setCountryError("Group is required");
  //   }
  // };

  // const handleChangeHexColor = (event: TOnChangeInput) => {
  //   setCategoryHexColorInput(event.target.value);
  // };

  // const clearForm = () => {
  //   setCategoryInputInput("");
  //   setCategoryHexColorInput("#999999");
  //   setSelectedGroupId(null);
  //   setIsEditing(false);
  //   setEditCategoryId(undefined);
  //   setCategoryError("");
  //   setCountryError("");
  // };

  // const validateForm = () => {
  //   let hasError = false;

  //   if (!categoryInput.trim()) {
  //     setCategoryError("Category name is required");
  //     hasError = true;
  //   }

  //   if (!selectedGroupId) {
  //     setCountryError("Group is required");
  //     hasError = true;
  //   }

  //   return !hasError;
  // };

  // const handleSubmit = () => {
  //   if (!validateForm()) return;

  //   const payload = {
  //     category_name: categoryInput.trim(),
  //     color: categoryHexColorInput,
  //     group_id: selectedGroupId!, // we already checked it's not null
  //   };

  //   if (isEditing && editCategoryId !== undefined) {
  //     if (!canEdit) {
  //       toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //       return;
  //     }
  //     updateCategory(payload, editCategoryId, setLoading, clearForm);
  //   } else {
  //     if (!canAdd) {
  //       toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //       return;
  //     }
  //     createCategory(payload, setLoading, clearForm);
  //   }
  // };

  const toggleDropdownCategory = (categoryId: number) => {
    setOpenActionMenuId((prev) =>
      prev === categoryId ? null : categoryId
    );
  };



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Ignore clicks on the 3-dot buttons
      if (target.closest(".source-of-type-list-grid-options")) {
        return;
      }

      // Ignore clicks inside any opened action menu
      if (target.closest(".source-of-types-options.isVisible")) {
        return;
      }

      // Ignore bulk action dropdown
      if (target.closest(".selected-btn") || actionDropdownRef.current?.contains(target)) {
        return;
      }

      setOpenActionMenuId(null);
      setIsActionDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenActionMenuId(null);
        setIsActionDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  useEffect(() => {
    if (canView && isCategoryView) {
      fetchCategoriesWithGroup(setCategoryList, setLoading);
    }
  }, [isCategoryView, canView]);

  // useEffect(() => {
  //   if (canView) {
  //     fetchProductGroupApi(setCountriesList, setLoading);
  //   }
  // }, [canView]);

  useEffect(() => {
    setOpenActionMenuId(null);
    setIsActionDropdownOpen(false);
  }, [categoryLists.length]);

  const handleEdit = (item: ICategoryView) => {
    setOpenActionMenuId(null);

    if (canEdit) {
      // setCategoryInputInput(item.category_name);
      // setCategoryHexColorInput(item.color || "#999999");
      // setSelectedGroupId(item.group_id || null);   // ← important
      // setIsEditing(true);
      // setEditCategoryId(item.id);
      // setCategoryError("");
      // setCountryError("");
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshCategory = async () => {
    if (canView) {
      await fetchCategoriesWithGroup(setCategoryList, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteModel = (categoryId: number | undefined) => {
    setOpenActionMenuId(null);

    if (canDelete) {
      if (categoryId !== undefined) {
        setDeleteCategoryIds([categoryId]);
        setIsDeleteConfirmation(true);
      } else {
        toast.error("No category selected for deletion");
      }
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No categories selected");
      return;
    }
    if (canDelete) {
      setDeleteCategoryIds(selectedIds);
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
      const totalSelectable = categoryLists.filter((c) => c.id !== -1).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = categoryLists
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

    await handleDeleteCategory(
      deleteCategoryIds,
      setIsDeleteConfirmation,
      setCategoryList,
      setLoading
    );
    setDeleteCategoryIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  // const countryOptions = countriesList.map((country) => ({
  //   value: String(country.id),
  //   label: country.group_name,
  // }));

  const thStyle: React.CSSProperties = {
    padding: "10px",
    textAlign: "left",
    borderBottom: "2px solid #ccc",
    fontWeight: 600,
    fontSize: "14px",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px",
    fontSize: "14px",
  };

  const openCreateCategoryView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isCategoryView ? (
        <div className="notifications animate__animated animate__fadeInLeft" id="notifications">
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
                onClick={closeCategoryView}
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
              <h2>Product Category</h2>
            </div>

            <div className="text-end mb-2">
              <div className="ICON" style={{ position: "absolute", right: "60px" }}>
                <button className="icons" onClick={openCreateCategoryView} title="Create Product Category">
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
              <div className="ICON" style={{ position: "absolute", right: "20px" }}>
                <button className="icons" onClick={handleRefreshCategory} title="Refresh">
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

          {/* Form & List */}
          <div className="chats-notifications">
            <div className="block">
              <div className="h-text">
                {/* <div className="head" style={{ display: "block" }}> */}
                {/* Country / Group Dropdown */}
                {/* <div className="col-12 mt-1">
                    <label className="form-check-label">
                      <h4>
                        Product Group<span className="text-danger">*</span>
                      </h4>
                    </label>
                    <CustomSearchDropdown
                      options={countryOptions}
                      value={
                        countryOptions.find(
                          (option) => option.value === String(selectedGroupId)
                        ) || null
                      }
                      onChange={handleCountryChange}
                      className="w-100"
                      placeholder="Select Group..."
                    />
                    {countryError && (
                      <span className="text-danger d-block mt-1">{countryError}</span>
                    )}
                  </div> */}

                {/* Category Name + Color */}
                {/* <label className="form-check-label" htmlFor="flexCheckDefault">
                    <h4>
                      Enter Product Category Name <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="col-10">
                      <div className="search-bar">
                        <div className="add-source-of-type-section">
                          <input
                            type="text"
                            title="Category"
                            maxLength={BIG_TEXT_LENGTH}
                            placeholder="Add Product category"
                            value={categoryInput}
                            onChange={(e) => handleChange(e)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                      <input
                        type="color"
                        value={categoryHexColorInput}
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
                    {categoryError && (
                      <span className="text-danger">{categoryError}</span>
                    )}
                  </div>
                </div> */}

                {/* List of Categories */}
                {canView ? (
                  <div>
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
                                        setOpenActionMenuId(null);
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
                              className={`${categoryLists.length > 0 ? "" : "text-center pt-5"}`}
                            >
                              {categoryLists.length > 0 ? "" : "No Data Found"}
                            </p>

                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginTop: "10px",
                              }}
                            >
                              <thead>
                                <tr style={{ background: "#f5f5f5" }}>
                                  <th style={thStyle}></th>
                                  <th style={thStyle}>Category Name</th>
                                  <th style={thStyle}>Group Name</th>
                                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                                </tr>
                              </thead>

                              <tbody>
                                {categoryLists?.map((item, index) => (
                                  <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                                    {/* Checkbox Column */}
                                    <td style={tdStyle}>
                                      {item.id !== -1 && (
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox"
                                          checked={selectedIds.includes(item.id)}
                                          onChange={() => toggleSelection(item.id)}
                                        />
                                      )}
                                    </td>

                                    {/* Category Name */}
                                    <td style={tdStyle}>
                                      <span
                                        style={{
                                          backgroundColor: item.color || "#999999",
                                          padding: "4px 10px",
                                          borderRadius: "20px",
                                          color: "#fff",
                                          fontSize: "13px",
                                        }}
                                      >
                                        {item.category_name}
                                      </span>
                                    </td>

                                    {/* Group Name (Normal Text) */}
                                    <td style={tdStyle}>
                                      {item.group_name || "-"}
                                    </td>

                                    {/* Actions */}
                                    <td style={{ ...tdStyle, textAlign: "center", position: "relative" }}>
                                      {item.id !== -1 && (
                                        <>
                                          <button
                                            className="source-of-type-list-grid-options"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsActionDropdownOpen(false);
                                              toggleDropdownCategory(item.id);
                                            }}
                                          >
                                            <svg viewBox="0 0 24 24" width="20" height="20">
                                              <path
                                                fill="currentColor"
                                                d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                              />
                                            </svg>
                                          </button>

                                          <ul
                                            className={`source-of-types-options-status source-of-types-options ${openActionMenuId === item.id ? "isVisible" : "isHidden"
                                              }`}
                                            id="dropLeft"
                                            ref={(el) => (dropdownStateRef.current[item.id] = el)}
                                            style={{ width: "120px" }}
                                          >
                                            <li
                                              className="listItem text-start"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(item);
                                                setOpenActionMenuId(null);
                                              }}
                                            >
                                              Edit
                                            </li>

                                            <li
                                              style={{ color: "red", fontWeight: "600" }}
                                              className="listItem text-start"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDeleteModel(item.id);
                                                setOpenActionMenuId(null);
                                              }}
                                            >
                                              Delete
                                            </li>
                                          </ul>
                                        </>
                                      )}
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
                setDeleteCategoryIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title={deleteCategoryIds.length > 1 ? "Delete Categories" : "Delete this Category"}
              message={`Are you sure you want to delete ${deleteCategoryIds.length > 1 ? "these categories" : "this category"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <CreateCategoryView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Category"
          handleRefreshCategory={handleRefreshCategory}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreateCategoryView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Department"
          handleRefreshCategory={handleRefreshCategory}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default CategoryView;