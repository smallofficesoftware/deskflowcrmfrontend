import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
} from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import ImportExcelForContactModal from "../../../../components/model/ImportExcelForContactModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import useMiracleFlagStore from "../../../../store/miracle/useMiracleFlagStore";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import BomMasterView from "../../../left-side/header/Setting/product/bom-master/BomMasterView";
import CreateProductView from "../../../left-side/header/Setting/product/create-product/CreateProductView";
import PrintBarcode from "../../../left-side/header/Setting/product/PrintBarcode";
import {
  fetchExportProductApi,
  IProductView,
  syncMiracleProduct,
} from "../../../left-side/header/Setting/product/ProductController";
import ProductStockMovement from "../../../left-side/header/Setting/product/ProductStockMovement";
import SerialNumberStockMovement from "../../../left-side/header/Setting/product/SerialNumberStockMovement";
import {
  fetchProductForReport,
  handleDeleteProduct,
} from "./ProductReportController";

interface IProductReport {
  onHide?: () => void;
}

const PAGE_SIZE = 50;
const ProductReport = ({ onHide }: IProductReport) => {
  const [loading, setLoading] = useState(false);

  const [productList, setProductList] = useState<IProductView[]>([]);

  const [globalSearchText, setGlobalSearchText] = useState("");

  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [refreshProduct, setRefreshProduct] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const openDropdownIdRef = useRef<number | null>(null);
  // Naya ref aur state
  const op = useRef<OverlayPanel>(null);
  const [activeRowData, setActiveRowData] = useState<IProductView | null>(null);

  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<IProductView>();
  const [productDropdown, setProductDropdown] = useState<any>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [productBarcode, setProductBarcode] = useState<string>("");
  const [isOpenBarcodeModal, setIsOpenBarcodeModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );
  const [editProductItem, setEditProductItem] = useState<IProductView>();
  const [isOpenStockMovement, setIsOpenStockMovement] = useState(false);
  const [stockMovementData, setStockMovementData] = useState<IProductView>();
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  const [isOpenDetailsModel, setIsOpenDetailsModel] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number>(0);
  const [checkAll, setCheckAll] = useState(false);

  const [issetShareId, setShareId] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalExcelProductVisible, setIsModalExcelProductVisible] =
    useState<boolean>(false);
  const [isModalExcelProductForImportUpdate, setIsModalExcelProductForUpdate] =
    useState<boolean>(false);
  const [isOpenStockMovementSNnumberWise, setIsOpenStockMovementSNnumberWise] =
    useState(false);
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const { filters, setFilters, setFilter } = useCommonFilterStore();
  const [hasData, setHasData] = useState<boolean>(false);

  const listInnerRef = useRef<HTMLElement | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const currentOffset = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(0);

  const canView = useCheckUserPermission(PAGE_ID.PRODUCT, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.PRODUCT, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.PRODUCT, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.DELETE,
  );
  const canExport = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.SHARE,
  );
  const canImport = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.IMPORT,
  );

  const [tablefilters, setTableFilters] = useState<DataTableFilterMeta>({
    product_name: {
      value: null,
      matchMode: "contains",
    },
    product_code: {
      value: null,
      matchMode: "contains",
    },
    group_name: {
      value: null,
      matchMode: "contains",
    },
    category_name: {
      value: null,
      matchMode: "contains",
    },
    unit: {
      value: null,
      matchMode: "contains",
    },
    product_barcode_number: {
      value: null,
      matchMode: "contains",
    },
    net_rate: {
      value: null,
      matchMode: "contains",
    },
    purchase_net_rate: {
      value: null,
      matchMode: "contains",
    },
  });

  const onFilter = (event: DataTableFilterEvent) => {
    setTableFilters(event.tablefilters);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  useEscapeKey(() => {
    if (
      !openDropdownId &&
      !activeRowData &&
      !isOpenStockMovement &&
      !isOpenEditModel &&
      !isOpenDetailsModel &&
      !isCreateModel &&
      !isProductMenuOpen
    ) {
      onHide?.();
    } else {
      setOpenDropdownId(null);
      setActiveRowData(null);
      setIsOpenStockMovement(false);
      setIsOpenEditModel(false);
      setIsOpenDetailsModel(false);
      setIsCreateModel(false);
      setIsProductMenuOpen(false);
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalSearch = () => {
    const value = searchInputRef.current?.value || "";

    setGlobalSearchText(value);
  };

  useEffect(() => {
    fetchProductForReport(
      0,
      ITEMS_PER_PAGE,
      setProductList,
      setLoading,
      debouncedSearchText,
      filters.selectedCategoryId,
      filters.selectedProductId,
    );
  }, [
    debouncedSearchText,
    filters.selectedCategoryId,
    filters.selectedProductId,
  ]);

  useEffect(() => {
    if (refreshProduct) {
      fetchProductForReport(
        0,
        ITEMS_PER_PAGE,
        setProductList,
        setLoading,
        debouncedSearchText,
      );
      setRefreshProduct(false);
    }
  }, [refreshProduct]);

  const loadPage = async (
    page: number,
    reset: boolean = false,
    searchText?: string,
    categoryId?: any,
    productId?: any,
  ) => {
    if (isFetchingRef.current) return;
    if (!hasMore && !reset) return;

    isFetchingRef.current = true;
    if (reset) setLoading(true);

    try {
      let newData: IProductView[] = [];

      await fetchProductForReport(
        page,
        PAGE_SIZE,
        (items) => {
          newData = items ?? [];
        },
        () => {},
        searchText ?? debouncedSearchText,
        categoryId ?? filters.selectedCategoryId,
        productId ?? filters.selectedProductId,
      );

      // If returned less than PAGE_SIZE → no more pages
      if (newData.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (reset) {
        setProductList(newData);
      } else {
        setProductList((prev) => [...prev, ...newData]);
      }

      // Advance to next page for subsequent lazy loads
      currentPageRef.current = page + 1;
    } catch {
      setHasMore(false);
    } finally {
      setTimeout(() => setLoading(false), 200);
      isFetchingRef.current = false;
    }
  };

  // ── Reset on filter / search change (same as SalesOrder's useEffect) ──
  useEffect(() => {
    currentPageRef.current = 0;
    setHasMore(true);
    loadPage(0, true);
  }, [
    debouncedSearchText,
    filters.selectedCategoryId,
    filters.selectedProductId,
  ]);

  // ── Refresh trigger (after create/edit/delete) ────────────────────────
  useEffect(() => {
    if (!refreshProduct) return;
    currentPageRef.current = 0;
    setHasMore(true);
    loadPage(0, true);
    setRefreshProduct(false);
  }, [refreshProduct]);

  // ── Refresh helper used by child modals ───────────────────────────────
  const handelRefreshProduct = async () => {
    if (!canView) return;
    currentPageRef.current = 0;
    setHasMore(true);
    await loadPage(0, true);
  };
  const setDropdownId = useCallback((id: number | null) => {
    openDropdownIdRef.current = id;
    setOpenDropdownId(id);
  }, []);

  const openStockMovement = (productName: IProductView) => {
    setDropdownId(null);
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

  const handleEdit = (item: IProductView) => {
    setDropdownId(null);
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

  const handleDetails = () => {
    setDropdownId(null);
    setIsOpenDetailsModel(true);
  };

  const handelSyncMiracleProduct = async (item?: any) => {
    setDropdownId(null);
    await syncMiracleProduct(setSyncLoading, item);
  };

  const openDeleteModel = (itemId: number) => {
    setDropdownId(null);
    setProductDropdown(null);
    setIsProductMenuOpen(false);
    setHasIdAvail(undefined);
    if (canDelete) {
      setDeleteItemId(itemId);
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

  const handleDeleteSubmit = async () => {
    if (!canDelete) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    await handleDeleteProduct(
      checkAll ? undefined : deleteItemId,
      setIsDeleteConfirmation,
      setLoading,
      checkAll ? { checkAll: 1 } : undefined,
    );

    setIsDeleteConfirmation(false);
    setDeleteItemId(0);
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
      fetchExportProductApi(globalSearchText, setShareId);
    } else {
      setShareId(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openModelImport = () => {
    if (canImport) {
      setIsModalExcelProductVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleConfirmProductImportExcel = async () => {
    setIsModalExcelProductVisible(false);
    await fetchProductForReport(
      0,
      ITEMS_PER_PAGE,
      setProductList,
      setLoading,
      debouncedSearchText,
    );
  };

  const openModelImportExportUpdate = () => {
    if (canImport) {
      setIsModalExcelProductForUpdate(true);
    } else {
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

  const handleConfirmProductImportExcelForUpdate = async () => {
    setIsModalExcelProductForUpdate(false);
    await fetchProductForReport(
      0,
      ITEMS_PER_PAGE,
      setProductList,
      setLoading,
      debouncedSearchText,
    );
  };

  const actionBodyTemplate = (rowData: IProductView): JSX.Element => {
    return (
      <div
        className="gap-2"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {rowData.id !== -1 && (
          <Button
            icon="pi pi-cog"
            className="p-button-text source-of-type-list-grid-options"
            style={{ color: "green", width: "2rem" }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveRowData(rowData); // Set active row
              op.current?.toggle(e); // Open the overlay menu
            }}
          />
        )}
      </div>
    );
  };
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;

    if (
      dropdownRef.current &&
      dropdownRef.current.contains(event.target as Node)
    ) {
      return;
    }

    setIsProductMenuOpen(false);
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
        setDropdownId(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const handleApplyFilters = async (filterData: any) => {
    setFilter(
      "selectedCategoryId",
      filterData?.selectedCategoryId?.value || "",
    );

    setFilter("selectedProductId", filterData?.selectedProductId?.value || "");

    setHasData(
      !!filterData?.selectedCategoryId || !!filterData?.selectedProductId,
    );

    setIsModalFilterVisible(false);
  };

  return (
    <PrimeReactProvider>
      <>
        <style>
          {`
    .p-button.source-of-type-list-grid-options:focus {
    box-shadow: none !important;
    outline: none !important;
    }`}
        </style>
        <div>
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <h3
              style={{ fontSize: "20px", paddingLeft: "12px" }}
              className="dash-board-text-count"
            >
              Products
            </h3>
            <div
              className="d-flex gap-2 align-items-center"
              style={{ position: "relative" }}
            >
              <div
                style={{
                  width: "300px",
                  zIndex: "999",
                  position: "relative",
                }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder="Search Anything for This Report"
                  style={{ width: "300px", marginTop: "10px" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGlobalSearch();
                    }
                  }}
                />
                {globalSearchText && (
                  <span
                    className="clear-icon"
                    onClick={() => {
                      setGlobalSearchText("");
                      if (searchInputRef.current) {
                        searchInputRef.current.value = "";
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                  </span>
                )}
              </div>
              <Button
                icon="pi pi-search"
                className="report_button"
                style={{ backgroundColor: "#4C4C4C" }}
                rounded
                onClick={handleGlobalSearch}
                tooltip="Search"
                tooltipOptions={{
                  position: "top",
                  style: {
                    fontSize: "14px",
                  },
                }}
              />
              <Button
                icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
                className="report_button"
                style={{ backgroundColor: "#4C4C4C" }}
                rounded
                onClick={() => setIsModalFilterVisible(true)}
                tooltip="Filter Report"
                tooltipOptions={{
                  position: "top",
                  style: {
                    fontSize: "14px",
                  },
                }}
              />

              <Button
                icon="pi pi-refresh"
                className="report_button"
                style={{ backgroundColor: "#4C4C4C" }}
                rounded
                onClick={handelRefreshProduct}
                tooltip="Refresh"
                tooltipOptions={{
                  position: "top",
                  style: {
                    fontSize: "14px",
                  },
                }}
              />

              <Button
                icon="pi pi-plus"
                className="report_button"
                style={{ backgroundColor: "rgb(245, 134, 52)" }}
                rounded
                onClick={() => {
                  if (canAdd) {
                    setIsCreateModel(true);
                  } else {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                  }
                }}
                tooltip={`Add Product`}
                tooltipOptions={{
                  position: "left",
                  style: {
                    fontSize: "14px",
                  },
                }}
              />
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <Button
                  icon="pi pi-ellipsis-v"
                  className="report_button"
                  style={{ backgroundColor: "#4C4C4C" }}
                  rounded
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductMenuOpen(!isProductMenuOpen);
                  }}
                  tooltip="More Option"
                  tooltipOptions={{
                    position: "top",
                    style: {
                      fontSize: "14px",
                    },
                  }}
                />

                <ul
                  className={`labelDropLeft-product labelDropLeft ${isProductMenuOpen ? "isVisible" : "isHidden"}`}
                  style={{
                    width: "177px",
                    top: "100%",
                    right: "0",
                    position: "absolute",
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
              </div>
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
              value={productList}
              loading={loading}
              resizableColumns
              columnResizeMode="fit"
              scrollable
              scrollHeight="flex"
              className="custom-centered-table"
              tableStyle={{ tableLayout: "fixed", width: "100%" }}
              emptyMessage="No data found"
              filterDisplay="row"
              filters={tablefilters}
              onFilter={onFilter}
              virtualScrollerOptions={{
                itemSize: 52,
                onLazyLoad: (event: { first: number; last: number }) => {
                  // Trigger next page when user scrolls near the bottom
                  if (
                    event.last >= productList.length - 1 &&
                    hasMore &&
                    !loading
                  ) {
                    loadPage(currentPageRef.current);
                  }
                },
                appendOnly: true,
                showLoader: false,
                delay: 0,
              }}
            >
              <Column
                field="actions"
                // header="Actions"
                headerClassName="center-header"
                headerStyle={{
                  width: "30px",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
                body={actionBodyTemplate}
              />
              <Column
                field="product_name"
                header={<span>Product Name</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.product_name}</span>
                )}
              />

              <Column
                field="product_code"
                header={<span>Product Code</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.product_code}</span>
                )}
              />

              <Column
                field="group_name"
                header={<span>Group Name</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.group_name}</span>
                )}
              />

              <Column
                field="category_name"
                header={<span>Category Name</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.category_name}</span>
                )}
              />

              <Column
                field="unit"
                header={<span>Unit</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => <span>{rowData.unit}</span>}
              />

              <Column
                field="product_barcode_number"
                header={<span>Product Barcode</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.product_barcode_number}</span>
                )}
              />

              <Column
                field="net_rate"
                header={<span>Sales Net Rate</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.net_rate}</span>
                )}
              />

              <Column
                field="purchase_net_rate"
                header={<span>Purchase Net Rate</span>}
                sortable
                filter
                filterPlaceholder="Search"
                filterMatchMode="contains"
                headerStyle={{
                  width: "200px",
                  background: "#f8f9fa",
                  fontSize: "14px",
                }}
                bodyStyle={{ fontSize: "14px" }}
                body={(rowData: IProductView) => (
                  <span>{rowData.purchase_net_rate}</span>
                )}
              />
            </DataTable>
            <OverlayPanel ref={op} dismissable closeOnEscape>
              {activeRowData && (
                <ul
                  style={{
                    margin: 0,
                    padding: "2px 0",
                    listStyle: "none",
                    minWidth: "auto",
                    fontSize: "14px",
                  }}
                >
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={() => {
                      openStockMovement(activeRowData);
                      op.current?.hide();
                    }}
                    style={{
                      margin: "5px 10px",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Stock Summary
                  </li>
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(activeRowData);
                      op.current?.hide();
                    }}
                    style={{
                      margin: "5px 10px",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
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
                      setSelectedProduct(activeRowData);
                      op.current?.hide();
                    }}
                    style={{
                      margin: "5px 10px",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Bill Of Materials
                  </li>
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(activeRowData);
                      setProductBarcode(activeRowData.product_barcode_number);
                      setIsOpenBarcodeModal(true);
                      op.current?.hide();
                    }}
                    style={{
                      margin: "5px 10px",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Print Barcode
                  </li>
                  {isFeatureEnabled && (
                    <li
                      className="listItem text-start"
                      role="button"
                      onClick={() => {
                        handelSyncMiracleProduct(activeRowData.id);
                        op.current?.hide();
                      }}
                      style={{
                        color: syncLoading ? "#E21F26" : "",
                        margin: "5px 10px",
                        height: "25px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {syncLoading ? "Syncing.." : "Sync Miracle"}
                    </li>
                  )}
                  <li
                    className="listItem text-start"
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModel(activeRowData.id);
                      op.current?.hide();
                    }}
                    style={{
                      color: "red",
                      fontWeight: "600",
                      margin: "5px 10px",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Delete
                  </li>
                </ul>
              )}
            </OverlayPanel>
          </div>
          {isCreateModel && (
            <CreateProductView
              show={isCreateModel}
              onHide={() => {
                setIsCreateModel(false);
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
          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => {
                setIsDeleteConfirmation(false);
                setDeleteItemId(0);
              }}
              handleSubmit={handleDeleteSubmit}
              title="Delete this Product"
              message="Are you sure you want to delete this product"
              btn1="CANCEL"
              btn2="DELETE"
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
          {isOpenBarcodeModal && (
            <PrintBarcode
              setIsOpenBarcodeModal={setIsOpenBarcodeModal}
              productBarcode={productBarcode}
              productName={selectedProduct?.product_name}
              productPrice={selectedProduct?.net_rate}
              productCode={selectedProduct?.product_code}
            />
          )}
          {isOpenStockMovement && (
            <ProductStockMovement
              show={isOpenStockMovement}
              onHide={() => setIsOpenStockMovement(false)}
              passDataInAddItem={stockMovementData}
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
          {isModalExcelProductVisible && (
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
          )}
          {isModalExcelProductForImportUpdate && (
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
          )}
          {isOpenStockMovementSNnumberWise && (
            <SerialNumberStockMovement
              show={isOpenStockMovementSNnumberWise}
              onHide={() => setIsOpenStockMovementSNnumberWise(false)}
              // passDataInAddItem={stockMovementData}
            />
          )}
          {isModalFilterVisible && (
            <CheckBoxFilterModal
              show={isModalFilterVisible}
              onHide={() => setIsModalFilterVisible(false)}
              handleSubmit={handleApplyFilters}
              title="Filter Reports"
              message="Please select the Dates and Team Members for the Report."
              btn1="Clear"
              btn2="Apply"
              filtersToShow={[7]}
              pageId={1}
              initialFilterData={{
                ...filters.filterData,
                category: filters.selectedCategoryId,
                product: filters.selectedProductId,
                contactId: filters.selectedContactId,
                productId: filters.selectedProductSearchId,
                orderlistselect: filters.selectedOrderListId,
              }}
              initialCheckedOptions={filters.checkedOptions}
              initialCheckedSourceTypes={filters.checkedSourceTypes}
              initialStartSearchDate={filters.startSearchDate}
              initialEndSearchDate={filters.endSearchDate}
              initialCheckedOptionsStageStatus={
                filters.checkedOptionsStageStatus
              }
              initialCheckedOptionsSeries={filters.checkedOptionsSeries}
              initialSelectedStockTypeId={filters.selectedStockTypeId}
              initialCheckedOptionsUser={filters.checkedOptionsUser}
              initialSelectedActiveId={filters.selectedActiveId}
              initialselectedOrderListId={filters.selectedOrderListId}
              initialSelectedDays={filters.selectedDays}
              selectedWarehouseIds={filters.selectedWarehouseIds}
              initialReferenceWiseContact={filters.referenceWiseContact}
              isApplyReport={1}
            />
          )}
        </div>
      </>
    </PrimeReactProvider>
  );
};

export default ProductReport;
