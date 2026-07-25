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
import { TOnChangeInput } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import BomMasterView from "../product/bom-master/BomMasterView";
import { IProductView } from "../product/ProductController";
import {
  createBillOfMaterials,
  fetchBillOfMaterialsApi,
  fetchProductApi,
  handleDeleteBillOfMaterials,
  IBillOfMaterialsView,
  updateBillOfMaterials,
} from "./BillOfMaterialsController";

interface IPropsMaterialsView {
  isBillOfMaterialsView: boolean;
  closeBillOfMaterialsView: () => void;
}

const BillOfMaterialsView = ({
  isBillOfMaterialsView,
  closeBillOfMaterialsView,
}: IPropsMaterialsView) => {
  const [billOfMaterialsLists, setBillOfMaterialsLists] = useState<
    IBillOfMaterialsView[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hover, setHover] = useState(false);
  const [materialsInput, setMaterialsInput] = useState("");
  const [materialsHexColorInput, setMaterialsHexColorInput] = useState("#999999");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const categoryRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {}
  );
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteMaterialsIds, setDeleteMaterialsIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editMaterialsId, setEditMaterialsId] = useState<number | undefined>(
    undefined
  );
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  const [materialsError, setMaterialsError] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isBomDetailsOpen, setIsBomDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProductView>();
  const [productIdForDelete, setProductIdForDelete] = useState<number>(0);

  const canView = useCheckUserPermission(
    PAGE_ID.BILL_OF_MATERIALS,
    PERMISSION_TYPE.VIEW
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.BILL_OF_MATERIALS,
    PERMISSION_TYPE.ADD
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.BILL_OF_MATERIALS,
    PERMISSION_TYPE.EDIT
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.BILL_OF_MATERIALS,
    PERMISSION_TYPE.DELETE
  );

  useEscapeKey(closeBillOfMaterialsView);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    // You can add debounce here if needed
    if (value.length >= 1 || value === "") {
      setTimeout(() => {
        fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading, value); // Pass searchTerm if your API supports it
      }, 600);
    }
  };

  const handleChange = (event: TOnChangeInput) => {
    const value = event.target.value;
    setMaterialsInput(value);
    setMaterialsError(value ? "" : "Name is required");
  };

  const handleChangeHexColor = (event: TOnChangeInput) => {
    setMaterialsHexColorInput(event.target.value);
  };

  const clearForm = () => {
    setMaterialsInput("");
    setMaterialsHexColorInput("#999999");
    setIsEditing(false);
    setEditMaterialsId(undefined);
  };

  const handleSubmit = () => {
    if (materialsInput.trim() === "") {
      setMaterialsError("Name is required");
      return;
    }

    setMaterialsError("");

    if (materialsInput) {
      if (isEditing && editMaterialsId !== undefined) {
        updateBillOfMaterials(
          {
            bill_of_materials_name: materialsInput,
            bill_of_materials_color: materialsHexColorInput,
          },
          setBillOfMaterialsLists,
          editMaterialsId,
          setLoading,
          clearForm
        );
      } else {
        if (!canAdd) {
          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
          return;
        }
        createBillOfMaterials(
          {
            bill_of_materials_name: materialsInput,
            bill_of_materials_color: materialsHexColorInput,
          },
          setBillOfMaterialsLists,
          setLoading,
          clearForm
        );
      }
    }
  };

  const toggleDropdownCategory = (materialsId: number | undefined) => {
    if (materialsId === undefined) return;
    setIsActionDropdownOpen(false);

    setOpenDropdownId(materialsId);
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
    if (canView && isBillOfMaterialsView) {
      fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading);
    }
  }, [isBillOfMaterialsView, canView]);

  const handleEdit = async (item: IBillOfMaterialsView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      await fetchProductApi(setSelectedProduct, setLoading, `${item.product_id}`, "");
      console.log("fffffff", selectedProduct);
      setIsBomDetailsOpen(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshCategory = async () => {
    if (canView) {
      await fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteModel = (productId: number | undefined) => {
    setOpenDropdownId(null);
    if (canDelete) {
      if (productId !== undefined) {
        setProductIdForDelete(productId);
        setIsDeleteConfirmation(true);
      } else {
        toast.error("No Name selected for deletion");
      }
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No Task categories selected");
      return;
    }
    if (canDelete) {
      setDeleteMaterialsIds(selectedIds);
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
      const totalSelectable = billOfMaterialsLists.filter(
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
      const allIds = billOfMaterialsLists
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

    await handleDeleteBillOfMaterials(
      productIdForDelete,
      setIsDeleteConfirmation,
      setBillOfMaterialsLists,
      setLoading
    );
    setDeleteMaterialsIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const handlePrintView = (item: IBillOfMaterialsView) => {
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/BomPdfView/${item.product_id}/${item.id}`;
    const myWindow = window.open(supportURL, "_blank");
  };



  return (
    <>
      {isBillOfMaterialsView ? (
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
                onClick={closeBillOfMaterialsView}
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
              <h2>Bill Of Materials</h2>
            </div>
            <div className="text-end mb-2">
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
          {canView && (
            <div className="h-text">
              <div className="head">
                <div>
                  <div className="search-bar">
                    <div className="add-source-of-type-section">
                      <input
                        type="text"
                        title="Search BOM Name"
                        placeholder="Search BOM Name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        maxLength={100}
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
                        onClick={() => {
                          setSearchTerm("");
                          handleRefreshCategory()
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                        </svg>
                      </span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chats */}
          <div className="chats-notifications">
            <div className="h-text">
              {canView ? (
                loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <div className="source-of-type-list-grid-main" key={index}>
                      <Skeleton height={40} style={{ margin: "8px" }} />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="source-of-type-list-grid-block">
                      <div className="source-of-type-list-grid-main" style={{ overflowY: "auto", maxHeight: "calc(100vh - 245px)", padding: "10px" }}>
                        {selectedIds.length > 0 && (
                          <div className="pb-2">
                            <span className="selected-btn rounded-5">
                              {/* <input
                                  type="checkbox"
                                  className="custom Esteban-checkbox mx-1"
                                  checked={isAllSelected}
                                  onChange={handleSelectAll}
                                /> */}
                              <button
                                className="border-0 ms-2"
                                onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                              >
                                Actions
                              </button>
                              {isActionDropdownOpen && (
                                <ul className="labelDropLeft" ref={actionDropdownRef}>
                                  <li onClick={openDeleteSelected}>Delete Selected</li>
                                </ul>
                              )}
                            </span>
                          </div>
                        )}

                        {billOfMaterialsLists.length === 0 ? (
                          <p className="text-center pt-5">No Bill of Materials Found</p>
                        ) : (
                          billOfMaterialsLists.map((item) => (
                            <div
                              key={item.id}
                              className="source-of-type-list-grid-list"
                              style={{ position: "relative" }}
                            >
                              {/* <input
                                  type="checkbox"
                                  className="custom-checkbox mx-1"
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => toggleSelection(item.id)}
                                /> */}

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  // padding: "12px 14px",
                                  // border: "1px solid #eee",
                                  // borderRadius: "10px",
                                  backgroundColor: "#fff",
                                  // boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                  marginBottom: "10px",
                                }}
                              >
                                {/* LEFT SECTION */}
                                <div style={{ flex: 1 }}>
                                  {/* BOM Name with ID */}
                                  <div style={{ fontSize: "15px", fontWeight: "500", color: "#333" }}>
                                    <span style={{ fontWeight: "bold", color: "#000" }}>
                                      {item.bom_number}
                                    </span>{" "}
                                    {item.bom_name}
                                  </div>

                                  {/* Product Info */}
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#333",
                                      marginTop: "6px",
                                    }}
                                  >
                                    Product:{" "}
                                    <strong style={{ color: "#666" }}>
                                      {item.product_name || "N/A"}
                                    </strong>
                                    {item.product_code && (
                                      <span style={{ color: "#888" }}> ({item.product_code})</span>
                                    )}
                                  </div>

                                  {/* Created Date */}
                                  <div style={{ fontSize: "13px", color: "#333" }}>
                                    Created:{" "}
                                    <strong style={{ color: "#666" }}>
                                      {item.created_date_time
                                        ? new Date(item.created_date_time).toLocaleString()
                                        : "N/A"}
                                    </strong>
                                  </div>

                                  {/* Modified Date */}
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#333",
                                    }}
                                  >
                                    Modified:{" "}
                                    <strong style={{ color: "#666" }}>
                                      {item.modified_date
                                        ? new Date(item.modified_date).toLocaleString()
                                        : "N/A"}
                                    </strong>
                                  </div>
                                </div>

                                {/* RIGHT SECTION (DATES) */}
                                <div
                                  style={{
                                    textAlign: "right",
                                    margin: "0 10px 0 10px",
                                    minWidth: "160px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    alignSelf: "stretch"
                                  }}
                                >

                                  {/* Created By */}
                                  {item.createdByName && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#888",
                                        marginTop: "4px",
                                      }}
                                    >
                                      <strong>Created by:</strong>
                                      <br />
                                      {item.createdByName}
                                    </div>
                                  )}
                                </div>
                                <button
                                  className="icon-more float-end"
                                  // style={{ marginTop: "-16%" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDropdownCategory(item.id);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 19 20"
                                    width="19"
                                    height="20"
                                    className="hide animate__animated animate__fadeInUp"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                    ></path>
                                  </svg>
                                </button>
                                <ul
                                  className={`labelDropLeft ${openDropdownId === item.id ? "isVisible" : "isHidden"}`}
                                  ref={(el) => (dropdownContactRef.current[item.id] = el)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    // position: "absolute",
                                    // left: "10px",
                                    // bottom: "1px",
                                    width: "120px",
                                    marginLeft: "68%",
                                    // background: "#fff",
                                    // borderRadius: "6px",
                                    // boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    // listStyle: "none",
                                    // padding: "6px 0",
                                    // minWidth: "120px",
                                    // zIndex: 1000
                                    top: "-55px"
                                  }}
                                >
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(item);
                                    }}
                                  >
                                    Edit
                                  </li>
                                  <li
                                    className="listItem"
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintView(item);
                                    }}
                                  >
                                    Print
                                  </li>
                                  <li
                                    style={{ color: "red", fontWeight: "600" }}
                                    className="listItem"
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteModel(item.product_id);
                                    }}
                                  >
                                    Delete
                                  </li>
                                </ul>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )
              ) : (
                <p className="text-danger p-1">{DEFAULT_MESSAGE_ERROR_PERMISSION}</p>
              )}
            </div>
          </div>

          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => {
                setIsDeleteConfirmation(false);
                setProductIdForDelete(0);
                setDeleteMaterialsIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title={
                deleteMaterialsIds.length > 1
                  ? "Delete Names"
                  : "Delete this Name"
              }
              message={`Are you sure you want to delete ${deleteMaterialsIds.length > 1
                ? "these Names"
                : "this Name"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}

        </div>
      ) : null}
      {isBomDetailsOpen && selectedProduct && (
        <BomMasterView
          show={isBomDetailsOpen}
          onHide={() => setIsBomDetailsOpen(false)}
          product={selectedProduct}
          handleRefreshCategory={handleRefreshCategory}
        />
      )}
    </>
  );
};

export default BillOfMaterialsView;