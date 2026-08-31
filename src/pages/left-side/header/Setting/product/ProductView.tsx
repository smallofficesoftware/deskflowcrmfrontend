import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { useTheme } from "../../../../../components/ThemeContext";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import ImportExcelForContactModal from "../../../../../components/model/ImportExcelForContactModal";
import {
  BIG_WIDTH_FOR_TEXT,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
  SMALL_WIDTH_FOR_TEXT,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import useMiracleFlagStore from "../../../../../store/miracle/useMiracleFlagStore";
import PrintBarcode from "./PrintBarcode";
import {
  fetchExportProductApi,
  fetchProductApi,
  handleDeleteProduct,
  IProductView,
  syncMiracleProduct,
} from "./ProductController";
import ProductStockMovement from "./ProductStockMovement";
import SerialNumberStockMovement from "./SerialNumberStockMovement";
import BomMasterView from "./bom-master/BomMasterView";
import CreateProductView from "./create-product/CreateProductView";
import ProductSyncModal from "./miracle/ProductSyncModal";

interface IPropsProductView {
  isProductView: boolean;
  closeProductView: () => void;
  searchTermFromRightSide: string;
  setSearchTermFromRightSide: (data: string) => void;
}

const ProductView = ({
  isProductView,
  closeProductView,
  searchTermFromRightSide,
  setSearchTermFromRightSide,
}: IPropsProductView) => {
  const [productLists, setProductList] = useState<IProductView[]>([]);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [Currency, setCurrency] = useState<any>([]);
  const [productDropdown, setProductDropdown] = useState<any>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isOpenStockMovement, setIsOpenStockMovement] = useState(false);
  const [stockMovementData, setStockMovementData] = useState<IProductView>();
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  const [isOpenDetailsModel, setIsOpenDetailsModel] = useState(false);
  const [isOpenBarcodeModal, setIsOpenBarcodeModal] = useState(false);
  const [productBarcode, setProductBarcode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const { darkMode } = useTheme();
  const [editProductItem, setEditProductItem] = useState<IProductView>();
  const [selectedProduct, setSelectedProduct] = useState<IProductView>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalExcelProductVisible, setIsModalExcelProductVisible] =
    useState<boolean>(false);
  const [isModalExcelProductForImportUpdate, setIsModalExcelProductForUpdate] =
    useState<boolean>(false);
  const [isModalFetchMiracleProducts, setIsModalFetchMiracleProducts] =
    useState<boolean>(false);

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [refreshProduct, setRefreshProduct] = useState(false);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  const [issetShareId, setShareId] = useState<boolean>(false);
  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const productMenuRef = useRef<HTMLUListElement>(null);

  const [isOpenStockMovementSNnumberWise, setIsOpenStockMovementSNnumberWise] =
    useState(false);

  const canView = useCheckUserPermission(PAGE_ID.PRODUCT, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.PRODUCT, PERMISSION_TYPE.ADD);
  const canImport = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.IMPORT,
  );
  const canEdit = useCheckUserPermission(PAGE_ID.PRODUCT, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.DELETE,
  );
  const canExport = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.SHARE,
  );

  let itemsPerPage = ITEMS_PER_PAGE;

  useEscapeKey(closeProductView);

  const toggleDropdownProduct = (productId: number | undefined) => {
    if (productId !== undefined) {
      setIsActionDropdownOpen(false);

      if (hasIdAvail === productId && productDropdown) {
        setHasIdAvail(undefined);
        setProductDropdown(null);
      } else {
        setHasIdAvail(productId);
        setProductDropdown(true);
      }
    }
  };

  const handleEdit = (item: IProductView) => {
    setProductDropdown(null);
    setHasIdAvail(undefined);

    if (canEdit) {
      setEditProductItem(item);
      setIsOpenEditModel(true);
      setProductDropdown(null);
      setIsProductMenuOpen(false);
    } else {
      setProductDropdown(null);
      setIsOpenEditModel(false);
      setIsProductMenuOpen(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelSyncMiracleProduct = (item?: any) => {
    syncMiracleProduct(setSyncLoading, item);
  };

  const handleDetails = () => {
    setIsOpenDetailsModel(true);
  };

  useEffect(() => {
    if (canView && isProductView) {
      fetchProductApi(0, itemsPerPage, setProductList, setLoading, searchTerm);
    }
  }, [isProductView, canView]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // 1. Clicked on any "More" button → don't close anything
    if (target.closest(".icon-more")) return;

    // 2. Check existing dropdowns
    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest(".selected-btn");

    // 3. NEW: Check Product Menu Dropdown
    const clickedInsideProductMenu = productMenuRef.current?.contains(target);

    // Close all dropdowns if clicked outside
    if (
      !clickedInsideDropdown &&
      !clickedInsideActionDropdown &&
      !clickedInsideProductMenu
    ) {
      setProductDropdown(null);
      setHasIdAvail(undefined);
      setIsActionDropdownOpen(false);
      setIsProductMenuOpen(false); // ← Add this line
    }
  };

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProductDropdown(null);
        setHasIdAvail(undefined);
        setIsActionDropdownOpen(false);
        setIsProductMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    document.addEventListener("click", handleClickOutside);
    // document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("click", handleClickOutside);
      // document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handelRefreshProduct = async () => {
    if (canView) {
      await fetchProductApi(0, itemsPerPage, setProductList, setLoading, "");
    }
  };

  const handleConfirmProductImportExcel = async () => {
    setIsModalExcelProductVisible(false);
    await fetchProductApi(0, itemsPerPage, setProductList, setLoading, "");
  };
  const handleConfirmProductImportExcelForUpdate = async () => {
    setIsModalExcelProductForUpdate(false);
    await fetchProductApi(0, itemsPerPage, setProductList, setLoading, "");
  };

  const openSearch = () => {
    if (canView) {
      setSearchOpen(!searchOpen);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = event.target.value;
  //   setSearchTerm(value);
  //   if (value.length >= 3 || value === "") {
  //     if (searchTimeout) {
  //       clearTimeout(searchTimeout);
  //     }
  //     setSearchTimeout(
  //       setTimeout(() => {
  //         fetchProductApi(0, itemsPerPage, setProductList, setLoading, value);
  //       }, 1000)
  //     );
  //   }
  // };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Only call API after user stops typing for 1 second
    const newTimeout = setTimeout(() => {
      fetchProductApi(0, itemsPerPage, setProductList, setLoading, value);
    }, 1000);

    setSearchTimeout(newTimeout);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(!searchOpen);
    setSearchTimeout(
      setTimeout(() => {
        fetchProductApi(0, itemsPerPage, setProductList, setLoading, "");
      }, 1000),
    );
  };

  const openModelImport = () => {
    if (canImport) {
      setIsModalExcelProductVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const openModelImportExportUpdate = () => {
    if (canImport) {
      setIsModalExcelProductForUpdate(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openModelFetchMiracleProducts = () => {
    if (canImport) {
      setIsModalFetchMiracleProducts(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteModel = (itemId: number) => {
    setProductDropdown(null);
    setIsProductMenuOpen(false);
    setHasIdAvail(undefined);
    if (canDelete) {
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
      setProductDropdown(null);
      setIsProductMenuOpen(false);
    } else {
      setIsDeleteConfirmation(false);
      setProductDropdown(null);
      setIsProductMenuOpen(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openStockMovement = (productName: IProductView) => {
    setProductDropdown(null);
    setIsProductMenuOpen(false);
    setHasIdAvail(undefined);
    if (canView) {
      setIsOpenStockMovement(true);
      setIsProductMenuOpen(false);
      setStockMovementData(productName);
    } else {
      setIsOpenStockMovement(false);
      setIsProductMenuOpen(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const openStockMovementSNnumberWise = () => {
    setProductDropdown(null);
    setHasIdAvail(undefined);
    if (canView) {
      setIsOpenStockMovementSNnumberWise(true);
    } else {
      setIsOpenStockMovementSNnumberWise(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openCreateProduct = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (searchTermFromRightSide === "Create Product") {
      openCreateProduct();
    }
  }, []);

  useEffect(() => {
    if (refreshProduct) {
      fetchProductApi(0, itemsPerPage, setProductList, setLoading, searchTerm);
      setRefreshProduct(false);
    }
  }, [refreshProduct, itemsPerPage, searchTerm]);

  // useEffect(() => {
  //   fetchProductApi(0, ITEMS_PER_PAGE, (newItems) => setProductList(newItems), setLoading, searchTerm);
  // }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      const el = listInnerRef.current;
      if (el && !loading) {
        const isBottomReached =
          el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (isBottomReached) {
          fetchProductApi(
            currentPage + 1,
            ITEMS_PER_PAGE,
            (newItems) => {
              if (newItems.length > 0) {
                setProductList((prev) => [...prev, ...newItems]);
                setCurrentPage((prevPage) => prevPage + 1);
              }
            },
            setLoading,
            searchTerm,
          );
        }
      }
    };

    const el = listInnerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [currentPage, searchTerm, loading]);

  const toggleSelection = (id: number) => {
    setCheckAll(false);
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable =
        productLists?.filter((c) => c.id !== -1).length || 0;
      setIsAllSelected(newSelected.length === totalSelectable && !checkAll);
      return newSelected;
    });
  };
  const handleSelectAll = () => {
    if (isAllSelected || checkAll) {
      setSelectedIds([]);
      setIsAllSelected(false);
      setCheckAll(false);
    } else {
      setSelectedIds([]);
      setIsAllSelected(true);
      setCheckAll(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0 && !checkAll) {
      toast.error("No products selected");
      return;
    }
    if (canDelete) {
      if (checkAll) {
        setDeleteItemIds([]);
      } else {
        setDeleteItemIds(selectedIds);
      }
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

    await handleDeleteProduct(
      checkAll ? undefined : deleteItemIds,
      setIsDeleteConfirmation,
      setLoading,
      setProductList,
      checkAll ? { checkAll: 1 } : undefined,
    );

    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
    setCheckAll(false);
  };

  const handelExportExcel = async () => {
    if (canExport) {
      setShareId(true);
    } else {
      setShareId(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleExportClick = async () => {
    if (canExport) {
      fetchExportProductApi(searchTerm, setShareId);
    } else {
      setShareId(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  return (
    <>
      {isProductView ? (
        <div
          className="leftSide animate__animated animate__fadeInLeft"
          id="notifications"
        >
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons text-light"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeProductView}
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
              <h2>Products</h2>
            </div>
            <div className="col-8 text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "1px" }}
              >
                {isFeatureEnabled && (
                  <button
                    className="icons text-white"
                    onClick={() => handelSyncMiracleProduct()}
                  >
                    <span title="Sync Miracle" className="text-white">
                      {syncLoading ? (
                        <svg
                          className="spin"
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 0 50 50"
                          width="24px"
                          fill="currentColor"
                        >
                          <circle
                            cx="25"
                            cy="25"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="90"
                            strokeDashoffset="60"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="currentColor"
                        >
                          <path d="m356-300 204-204v90h80v-226H414v80h89L300-357l56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                        </svg>
                      )}
                    </span>
                  </button>
                )}
                <button
                  className="icons text-white"
                  onClick={openCreateProduct}
                >
                  <span title="Create Product" className="text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="26px"
                      viewBox="0 -960 960 960"
                      width="26px"
                      fill="currentColor"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </span>
                </button>
                <button
                  className="icons text-white"
                  onClick={openSearch}
                  title="Search"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                    ></path>
                  </svg>
                </button>
                <button
                  className="icons text-light"
                  onClick={handelRefreshProduct}
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
                <>
                  <button
                    className="icon-more icons text-white"
                    onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
                    title="More Options"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 19 20"
                      width="22"
                      height="22"
                      fill="#fff"
                    >
                      <path d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <ul
                    className={`labelDropLeft-product labelDropLeft ${isProductMenuOpen ? "isVisible" : "isHidden"}`}
                    ref={productMenuRef}
                    style={{
                      width: "177px",
                      top: "calc(100% + 8px)",
                      right: "10px",
                    }}
                  >
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        handelExportExcel();
                        setIsProductMenuOpen(false);
                      }}
                    >
                      Export Products
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        openModelImport();
                        setIsProductMenuOpen(false);
                      }}
                    >
                      Import Products
                    </li>
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        openModelImportExportUpdate();
                        setIsProductMenuOpen(false);
                      }}
                    >
                      Update Products
                    </li>
                    {isFeatureEnabled && (
                      <li
                        className="listItem text-start"
                        role="button"
                        onClick={() => {
                          openModelFetchMiracleProducts();
                          setIsProductMenuOpen(false);
                        }}
                      >
                        Fetch From Miracle
                      </li>
                    )}
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        openStockMovementSNnumberWise();
                        setIsProductMenuOpen(false);
                      }}
                    >
                      SN.NO Wise Stock Check
                    </li>
                  </ul>
                </>
              </div>
            </div>
          </div>
          {searchOpen && (
            <div className="header-search" style={{ zIndex: "1" }}>
              <div className="search-bar">
                <div className="d-flex justify-content-between">
                  <button className="search">
                    <span>
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
                    title="Search"
                    aria-label="Search or start new chat"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-message-input"
                  />
                  <span
                    role="button"
                    className="p-1"
                    onClick={handleSearchClear}
                  >
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M280-80q-83 0-141.5-58.5T80-280q0-83 58.5-141.5T280-480q83 0 141.5 58.5T480-280q0 83-58.5 141.5T280-80Zm544-40L568-376q-12-13-25.5-26.5T516-428q38-24 61-64t23-88q0-75-52.5-127.5T420-760q-75 0-127.5 52.5T240-580q0 6 .5 11.5T242-557q-18 2-39.5 8T164-535q-2-11-3-22t-1-23q0-109 75.5-184.5T420-840q109 0 184.5 75.5T680-580q0 43-13.5 81.5T629-428l251 252-56 56Zm-615-61 71-71 70 71 29-28-71-71 71-71-28-28-71 71-71-71-28 28 71 71-71 71 28 28Z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="chats-notifications" ref={listInnerRef}>
            <div className="block p-0">
              <div className="h-text">
                {(selectedIds.length > 0 || checkAll) && (
                  <span
                    className="selected-btn rounded-5"
                    style={{
                      width: "fit-content",
                      height: "fit-content",
                      paddingTop: "0.375rem",
                      paddingBottom: "0.375rem",
                      paddingLeft: "0.75rem",
                      paddingRight: "0.75rem",
                      position: "relative",
                      top: "10px",
                      left: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="custom-checkbox mx-1"
                      checked={isAllSelected || checkAll}
                      title="Select All Products"
                      onChange={handleSelectAll}
                    />
                    <div className="position-relative d-inline-block ms-1 dropdown-end">
                      <button
                        className="border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductDropdown(null);
                          setIsProductMenuOpen(false);
                          setHasIdAvail(undefined);
                          setIsActionDropdownOpen((prev) => !prev);
                        }}
                        disabled={selectedIds.length === 0 && !checkAll}
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
                            Delete Selected Products
                          </li>
                        </ul>
                      )}
                    </div>
                  </span>
                )}
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div className="chats h-100" key={index}>
                          <button className="block chat-list">
                            <div>
                              <Skeleton
                                width="100%"
                                height="100%"
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                            <div className="h-text ps-2">
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <>
                        <div
                          className="chats h-100"
                          style={{ paddingBottom: "100px" }}
                        >
                          <p
                            className={`${productLists && productLists?.length > 0 ? "" : "text-center pt-5"}`}
                          ></p>
                          {/* {productLists.length === 0 && <p className="no_found">No Product found</p>} */}
                          {productLists && productLists?.length > 0 ? (
                            productLists.map((item, index) => (
                              <div
                                key={index}
                                className="block chat-list"
                                style={{ padding: "6px" }}
                              >
                                <div className="h-text ps-2">
                                  <div
                                    className="d-flex"
                                    style={{ flexWrap: "wrap" }}
                                  >
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        display: "flex",
                                        alignItems: "center",
                                        position: "relative",
                                      }}
                                    >
                                      {item.id !== -1 && (
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox mx-1"
                                          checked={
                                            checkAll ||
                                            selectedIds.includes(item.id)
                                          }
                                          onChange={() =>
                                            toggleSelection(item.id)
                                          }
                                          style={{ flexShrink: 0 }}
                                        />
                                      )}
                                      <h2
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          whiteSpace: "normal",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          fontWeight: "bold",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          color: "black",
                                          marginLeft: "5px",
                                          maxWidth: "300px",
                                          width: "300px",
                                        }}
                                      >
                                        {item.product_name}
                                      </h2>
                                    </div>
                                  </div>
                                  {item.id === -1 ? (
                                    <span></span>
                                  ) : (
                                    <>
                                      <button
                                        className="icon-more"
                                        style={{
                                          marginTop: "-16%",
                                          position: "absolute",
                                          right: "10px",
                                          top: "70px",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsActionDropdownOpen(false);
                                          toggleDropdownProduct(item.id);
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
                                        className={`labelDropLeft-product labelDropLeft ${
                                          hasIdAvail === item.id &&
                                          productDropdown
                                            ? "isVisible"
                                            : "isHidden"
                                        } `}
                                        id="dropLeft"
                                        ref={(el) =>
                                          (dropdownContactRef.current[item.id] =
                                            el)
                                        }
                                        style={{
                                          width: "126px",
                                          top: "-35%",
                                          right: "35px",
                                        }}
                                      >
                                        <li
                                          className="listItem text-start"
                                          role="button"
                                          onClick={() =>
                                            openStockMovement(item)
                                          }
                                        >
                                          Stock Summary
                                        </li>
                                        <li
                                          className="listItem text-start"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(item);
                                          }}
                                        >
                                          Edit
                                        </li>
                                        <li
                                          className="listItem text-start"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDetails();
                                            setSelectedProduct(item);
                                          }}
                                        >
                                          Bill Of Materials
                                        </li>
                                        <li
                                          className="listItem text-start"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const params = new URLSearchParams({
                                              productId: String(item.id),
                                              productTitle: item.product_name || "",
                                            });
                                            if (item.document_template_id) {
                                              params.set("openTemplateId", String(item.document_template_id));
                                            }
                                            // New tab — same reasoning as the
                                            // Document Designer Page custom
                                            // field's "Add Data source": don't
                                            // disrupt this product list's own
                                            // open menu/scroll/filter state.
                                            window.open(`/product/designer-page-editor?${params.toString()}`, "_blank");
                                          }}
                                        >
                                          Product Page Designer
                                        </li>
                                        <li
                                          className="listItem text-start"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setProductDropdown(null);
                                            setIsProductMenuOpen(false);
                                            setHasIdAvail(undefined);
                                            setSelectedProduct(item);
                                            setProductBarcode(
                                              item.product_barcode_number,
                                            );
                                            setIsOpenBarcodeModal(true);
                                          }}
                                        >
                                          Print Barcode
                                        </li>
                                        {isFeatureEnabled && (
                                          <li
                                            className="listItem text-start"
                                            role="button"
                                            onClick={(e) => {
                                              handelSyncMiracleProduct(item.id);
                                            }}
                                            style={{
                                              color: syncLoading
                                                ? "#E21F26"
                                                : "",
                                            }}
                                          >
                                            {syncLoading
                                              ? "Syncing.."
                                              : "Sync Miracle"}
                                          </li>
                                        )}
                                        <li
                                          style={{
                                            color: "red",
                                            fontWeight: "600",
                                          }}
                                          className="listItem text-start"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModel(item.id);
                                          }}
                                        >
                                          Delete
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Product Category Name</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.category_name
                                          ? item.category_name
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Product Alias</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.product_alias
                                          ? item.product_alias
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Product Code</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.product_code
                                          ? item.product_code
                                          : "N/A"}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Product Barcode</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.product_barcode_number
                                          ? item.product_barcode_number
                                          : "-"}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Unit Name</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.unit ? item.unit : "-"}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Group Name</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.group_name
                                          ? item.group_name
                                          : "-"}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Sale Net Rate</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.rate ? item.rate : "-"}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Purchase Net Rate</b> :
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${BIG_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.purchase_rate
                                          ? item.purchase_rate
                                          : "-"}
                                      </h4>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="no_found">No Product found</p>
                          )}
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
        </div>
      ) : null}
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => {
            setIsDeleteConfirmation(false);
            setDeleteItemIds([]);
          }}
          handleSubmit={handleDeleteSubmit}
          title={
            checkAll
              ? "Delete All Products"
              : deleteItemIds.length > 1
                ? "Delete Products"
                : "Delete this Product"
          }
          message={`Are you sure you want to delete ${checkAll ? "all products" : deleteItemIds.length > 1 ? "these products" : "this product"}?`}
          btn1="CANCEL"
          btn2="DELETE"
        />
      )}
      {issetShareId && (
        <ConfirmationModal
          show={issetShareId}
          onHide={() => setShareId(false)}
          handleSubmit={handleExportClick}
          title={"Export Products?"}
          message={"Are you sure you want to Export Products?"}
          btn1="CANCEL"
          btn2="Export"
        />
      )}
      {isOpenStockMovement && (
        <ProductStockMovement
          show={isOpenStockMovement}
          onHide={() => setIsOpenStockMovement(false)}
          passDataInAddItem={stockMovementData}
        />
      )}
      {isOpenStockMovementSNnumberWise && (
        <SerialNumberStockMovement
          show={isOpenStockMovementSNnumberWise}
          onHide={() => setIsOpenStockMovementSNnumberWise(false)}
          // passDataInAddItem={stockMovementData}
        />
      )}
      {isOpenCreateModel && (
        <CreateProductView
          show={isOpenCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            setSearchTermFromRightSide("");
          }}
          productToEdit={undefined}
          headerName="Create Product"
          setRefreshProduct={setRefreshProduct}
        />
      )}
      {isOpenEditModel && (
        <CreateProductView
          show={isOpenEditModel}
          onHide={() => setIsOpenEditModel(false)}
          productToEdit={editProductItem}
          headerName="Edit Product"
          setRefreshProduct={setRefreshProduct}
        />
      )}

      {isOpenDetailsModel && selectedProduct && (
        <BomMasterView
          show={isOpenDetailsModel}
          handelRefreshProduct={handelRefreshProduct}
          onHide={() => setIsOpenDetailsModel(false)}
          product={selectedProduct}
        />
      )}
      <ImportExcelForContactModal
        show={isModalExcelProductVisible}
        onHide={() => setIsModalExcelProductVisible(false)}
        handleSubmit={() => handleConfirmProductImportExcel()}
        title={"Import Excel For Product"}
        message={"Please Import excel as per sample Product"}
        btn1="Cancel"
        btn2="Import"
        sampleLocation="sampleProduct.xlsx"
        potions={2}
      />
      <ImportExcelForContactModal
        show={isModalExcelProductForImportUpdate}
        onHide={() => setIsModalExcelProductForUpdate(false)}
        handleSubmit={() => handleConfirmProductImportExcelForUpdate()}
        title={"Import Updated Data For Product"}
        message={"Please Import excel as per sample Product"}
        btn1="Cancel"
        btn2="Import"
        sampleLocation="sampleProductForUpdate.xlsx"
        potions={5}
      />
      {isModalFetchMiracleProducts && (
        <ProductSyncModal
          show={isModalFetchMiracleProducts}
          onClose={() => setIsModalFetchMiracleProducts(false)}
        />
      )}
      {isOpenBarcodeModal && (
        <PrintBarcode
          setIsOpenBarcodeModal={setIsOpenBarcodeModal}
          productBarcode={productBarcode}
          productName={selectedProduct?.product_name}
          productPrice={selectedProduct?.net_rate}
          productCode={selectedProduct?.product_code}
        />
      )}
    </>
  );
};

export default ProductView;
