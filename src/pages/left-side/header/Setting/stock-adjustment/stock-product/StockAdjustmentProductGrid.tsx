import React, { useCallback, useEffect, useRef, useState } from "react";
import StockAdjustmentProductCard from "./StockAdjustmentProductCard";
import StockAdjustmentProductSkeleton from "./StockAdjustmentProductSkeleton";
import { StockProduct } from "./stocktypes";
import { fetchProductStockList } from "../StockAdjustmentController";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  SMALL_TEXT_LENGTH,
} from "../../../../../../helpers/AppConstants";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../../components/CustomSearchDropdown";
import { fetchCategoryApiForOrder } from "../../../../../../components/model/OrderCreateModel/OrderCreateModelController";
import { SingleValue } from "react-select";
import { IOption } from "../../../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../../../hooks/useCheckUserPermission";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../../helpers/AppEnum";
import { TReactSetState } from "../../../../../../helpers/AppType";

interface Props {
  onSelect: (product: StockProduct) => void;
  search?: string;
  category?: { label: string; value: string } | null;
  selected: StockProduct[];
  setIsProductGridShow: TReactSetState<boolean>;
  isProductGridShow: boolean;
}

const ITEMS_PER_PAGE = 20;

const StockAdjustmentProductGrid: React.FC<Props> = ({
  onSelect,
  selected,
  isProductGridShow,
  setIsProductGridShow,
  // search = "",
  // category = null,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [category, setSelectedCategory] = useState<any>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const canViewCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.VIEW,
  );

  // Fetch Data
  const loadProducts = useCallback(
    async (pageNumber: number) => {
      if (loadingRef.current || !hasMoreRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      const newItems = await fetchProductStockList(
        pageNumber,
        ITEMS_PER_PAGE,
        search,
        0,
        category,
        setProducts,
      );

      if (newItems.length < ITEMS_PER_PAGE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }

      loadingRef.current = false;
      setLoading(false);
    },
    [search, category],
  ); // ONLY stable deps

  useEffect(() => {
    if (canViewCategory) {
      fetchCategoryApiForOrder(setCategoryList);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }, []);

  // Initial Load + Reset on search/category change
  useEffect(() => {
    setProducts([]);
    setPage(0);

    hasMoreRef.current = true;
    loadingRef.current = false;
    searchInputRef.current?.focus();
    setHasMore(true);
  }, [search, category]);

  useEffect(() => {
    if (canViewProduct) {
      loadProducts(page);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }, [page, loadProducts]);

  // Scroll Handler (Infinite Scroll)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || loadingRef.current || !hasMoreRef.current) return;

    const threshold = 100;

    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setPage((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        setSearch(searchTerm.trim());
      } else if (searchTerm.length === 0) {
        setSearch(""); // reset search
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (searchTerm.trim().length >= 3) {
        setSearch(searchTerm.trim());
      } else {
        toast.error("Enter at least 3 characters");
      }
    }
  };

  const categoryOptions = categoryList.map((category: any) => ({
    value: category.id,
    label: category.category_name,
  }));

  const handleCategoryChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedCategory(selectedOption);
  };

  const openCloseRight = async () => {
    setIsProductGridShow(!isProductGridShow);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
        }}
      >
        {/* Search Input */}
        <div className="search-bar-order" style={{ flex: 1 }}>
          <div style={{ width: "100%", position: "relative" }}>
            <button className="search" style={{ left: "10px" }}>
              <span>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                  />
                </svg>
              </span>
            </button>

            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              ref={searchInputRef}
              maxLength={SMALL_TEXT_LENGTH}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                height: "40px",
                paddingLeft: "40px", // space for icon
              }}
            />
          </div>
        </div>

        {/* Dropdown */}
        <div style={{ width: "200px" }}>
          <CustomSearchDropdown
            options={categoryOptions}
            value={category}
            onChange={handleCategoryChange}
            className="w-100"
          />
        </div>
        <div>
          <span className="close px-2" onClick={openCloseRight}>
            {isProductGridShow ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="currentColor"
              >
                <path d="M300-640v320l160-160-160-160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="currentColor"
              >
                <path d="M460-320v-320L300-480l160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z" />
              </svg>
            )}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div className="row g-2">
          {products.map((product) => (
            <div key={product.id} className="col-6 col-sm-4 col-md-3 col-lg-3">
              <StockAdjustmentProductCard
                product={product}
                onClick={onSelect}
                selected={selected}
              />
            </div>
          ))}

          {/* Loader */}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="col-6 col-sm-4 col-md-3 col-lg-3"
              >
                <StockAdjustmentProductSkeleton />
              </div>
            ))}
        </div>

        {/* No More Data */}
        {!hasMore && (
          <div className="text-center text-muted py-2">No more products</div>
        )}
      </div>
    </>
  );
};

export default React.memo(StockAdjustmentProductGrid);
