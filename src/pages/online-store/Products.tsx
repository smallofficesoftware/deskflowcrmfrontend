import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import productImagePlaceholder from "../../assets/images/no_image.jpeg";
import {
    BACKEND_OF_SMALL_OFFICE_CRM_END_POINT,
    DEFAULT_STATUS_CODE_SUCCESS,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";
import { Product, useOnlineStore } from "../../store/onlineStore/useOnlineStore";

interface ProductsProps {
    qrCode: string;
}


const Products = ({ qrCode }: ProductsProps) => {
    const {
        products,
        setProducts,
        categories,
        companyData,
        searchTerm,
        setSearchTerm,
        setCurrencyData,
        currencyData,
        addToCart,
        customerData,
    } = useOnlineStore();

    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 20,
        total_count: 0,
        total_pages: 1,
        has_next_page: false,
        has_prev_page: false,
        next_page: null,
        prev_page: null,
    });

    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);

    const [productPriceFilter, setProductPriceFilter] = useState({
        minPrice: "",
        maxPrice: "",
    });

    const [loading, setLoading] = useState(true);
    const [customFields, setCustomFields] = useState<
        { title: string; reference_column_name: keyof Product }[]
    >([]);


    const openProductModal = (product: Product) => {
        setSelectedProduct(product);
        setShowProductModal(true);
    };

    const closeProductModal = () => {
        setShowProductModal(false);
        setSelectedProduct(null);
    };


    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const getProducts = async () => {
        try {
            setLoading(true);
            const params: any = {
                search: searchTerm || "",
                page: pagination.current_page,
                limit: pagination.per_page,
                sort_by: sortField,
                sort_order: sortOrder,
                mobile_number: customerData?.mobile_number || "",
            };

            // Multi-category support
            if (selectedCategories.length > 0 && searchTerm === "") {
                params.category_id = selectedCategories.join(",");
            }

            if (productPriceFilter.minPrice) params.min_price = productPriceFilter.minPrice;
            if (productPriceFilter.maxPrice) params.max_price = productPriceFilter.maxPrice;

            const query = new URLSearchParams(params).toString();
            const { data } = await axiosInstance.post(`/get-all-products/${qrCode}?${query}`);

            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                const api = data.data;
                setProducts(api.products || []);
                setPagination(api.pagination || pagination);
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomFields = async () => {
        const getUUID = await localStorage.getItem("UUID");
        const requestData = {
            a_application_login_id: String(getUUID),
            form_type: 4
        }
        try {
            const { data } = await axiosInstance.post(
                "getCustomFieldFrom", requestData
            );
            const fields = data?.data?.item || [];

            setCustomFields(
                fields.map((f: any) => ({
                    title: f.title,
                    reference_column_name: f.reference_column_name,
                }))
            );
        } catch (err) {
            console.error("Custom field API error", err);
        }
    };

    const getCurrencies = async () => {
        try {
            const payload = {
                table: "currencies",
                columns: "id,short_name,symbol,name,today_rate,isActive,isDelete",
                where: JSON.stringify({
                    id: companyData.currency_id,
                    isDelete: "0",
                    isActive: "1",
                }),
            };
            const { data } = await axiosInstance.post("mainCommonGet", payload);
            if (data.code === 200) {
                setCurrencyData(data.data[0]);
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    };

    useEffect(() => {
        if (companyData?.currency_id) getCurrencies();
        getProducts();
        fetchCustomFields();
    }, []);

    useEffect(() => {
        if (debouncedSearch.length > 0 && debouncedSearch.length < 3) return;
        getProducts();
    }, [
        pagination.current_page,
        debouncedSearch,
        selectedCategories,
        sortField,
        sortOrder,
        productPriceFilter.minPrice,
        productPriceFilter.maxPrice,
    ]);

    const changePage = (page: number) => {
        setPagination((prev) => ({ ...prev, current_page: page }));
    };

    const allSelected = selectedCategories.length === categories.length && categories.length > 0;
    const [categorySearch, setCategorySearch] = useState("");

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.category_name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const checked = e.target.checked;

        setPagination((p) => ({ ...p, current_page: 1 }));

        if (value === "all") {
            if (checked) {
                setSelectedCategories(categories.map((c) => c.id));
            } else {
                setSelectedCategories([]);
            }
            return;
        }

        // Normal category toggle
        setSelectedCategories((prev) => {
            const numValue = Number(value);
            if (checked) {
                return [...prev, numValue];
            }
            return prev.filter((id) => id !== numValue);
        });
    };

    return (
        <div className="container-fluid container-xl py-5">
            {/* Combined Search + Category Filter Row */}
            <div className="row mb-4 align-items-center g-3">
                {/* Product Search - Left on md+ */}
                <div className="col-12 col-md-6">
                    <input
                        type="search"
                        className="form-control form-control-lg shadow-sm"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => {
                            // If searchTerm is managed in zustand store:
                            setSearchTerm(e.target.value);
                            setPagination((p) => ({ ...p, current_page: 1 }));
                        }}
                        style={{ borderRadius: 12 }}
                    />
                </div>

                {/* Category Filter / Search message - Right on md+ */}
                <div className="col-12 col-md-6">
                    {searchTerm.length === 0 ? (
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={{
                                    borderRadius: "12px",
                                    padding: "12px 16px",
                                    fontWeight: 500,
                                    height: "48px",           // ← makes height same as search input
                                }}
                            >
                                {allSelected || selectedCategories.length === 0
                                    ? "All Categories"
                                    : `${selectedCategories.length} selected`}
                                <i className="bi bi-chevron-down ms-2"></i>
                            </button>

                            <ul
                                className="dropdown-menu w-100 p-3 shadow-lg"
                                style={{ maxHeight: "380px", overflowY: "auto" }}
                            >
                                <li className="px-2 pb-2 sticky-top bg-white" style={{ top: 0, zIndex: 10 }}>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Search categories..."
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </li>

                                <li><hr className="dropdown-divider my-2" /></li>

                                <li>
                                    <label className="dropdown-item d-flex align-items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            value="all"
                                            checked={allSelected}
                                            onChange={handleCategoryChange}
                                        />
                                        <span className="fw-bold">All Categories</span>
                                    </label>
                                </li>

                                <li><hr className="dropdown-divider my-2" /></li>

                                {filteredCategories.length === 0 ? (
                                    <li className="text-center text-muted py-3 small">
                                        No categories found
                                    </li>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <li key={category.id}>
                                            <label className="dropdown-item d-flex align-items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    value={category.id}
                                                    checked={selectedCategories.includes(category.id)}
                                                    onChange={handleCategoryChange}
                                                />
                                                {category.category_name}
                                            </label>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100">
                            <p className="mb-0">
                                Showing results for: <strong>{searchTerm}</strong>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            <div className="row g-1 justify-content-center mx-auto container-fluid container-xl">
                <style>{`
          .clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>

                {loading ? (
                    // Skeleton loading state - 8 cards (adjust number as needed)
                    Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="col-6 col-md-4 col-lg-3 col-xl-3">
                            <div className="product-container p-1 rounded-4">
                                <div className="card premium-card h-100 border-0 rounded-4 overflow-hidden">
                                    <Skeleton height={230} className="card-img-top" />
                                    <div className="card-body d-flex flex-column px-3">
                                        <Skeleton height={20} width="85%" className="mb-2" />
                                        <Skeleton height={16} width="60%" className="mb-2" />
                                        <div className="d-flex justify-content-between align-items-center mt-auto">
                                            <Skeleton height={24} width={80} />
                                            <Skeleton height={32} width={40} borderRadius={999} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : products.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <i className="bi bi-search text-muted" style={{ fontSize: "3rem" }}></i>
                        <h4 className="text-muted mt-3">No products found</h4>
                        <p className="text-muted">Try different search keywords or filters</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="col-6 col-md-4 col-lg-3 col-xl-3">
                            <div className="product-container p-1 rounded-4">
                                <div className="card premium-card h-100 border-0 rounded-4 overflow-hidden"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => openProductModal(product)}
                                >
                                    <div className="position-relative product-wrapper">
                                        <img
                                            src={
                                                product.product_img
                                                    ? `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/productImg/${product.product_img}`
                                                    : productImagePlaceholder
                                            }
                                            className="card-img-top product-img"
                                            alt={product.product_name}
                                        />
                                    </div>
                                    <div className="card-body d-flex flex-column px-3">
                                        <h6 className="fw-bold clamp-2">{product.product_name}</h6>
                                        <p className="text-muted small mb-2 clamp-2">
                                            {categories.find((c) => c.id === product.category_id)?.category_name || "—"}
                                        </p>
                                        <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-1">
                                            <span className="mb-0 fw-bold" style={{ color: "black" }}>
                                                {currencyData?.symbol || "₹"}
                                                {product?.price_list ? product.price_list.net_rate : product?.net_rate}
                                            </span>

                                            {product.closing_qty > 0 ? (
                                                <button
                                                    className="btn btn-primary btn-sm rounded-pill px-3"
                                                    style={{ backgroundColor: "#f58634" }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(product)
                                                    }}
                                                >
                                                    <i className="bi bi-cart-plus"></i>
                                                </button>
                                            ) : (
                                                <span className="fw-bold text-danger mt-1 mt-md-0 ms-md-2">
                                                    Out of stock
                                                </span>

                                            )}

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                    <ul className="pagination premium-pagination">
                        <li className={`page-item ${!pagination.has_prev_page ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => changePage(pagination.prev_page!)}
                                disabled={!pagination.has_prev_page}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                        </li>

                        {Array.from({ length: pagination.total_pages }).map((_, i) => (
                            <li
                                key={i}
                                className={`page-item ${pagination.current_page === i + 1 ? "active" : ""}`}
                            >
                                <button className="page-link" onClick={() => changePage(i + 1)}>
                                    {i + 1}
                                </button>
                            </li>
                        ))}

                        <li className={`page-item ${!pagination.has_next_page ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => changePage(pagination.next_page!)}
                                disabled={!pagination.has_next_page}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </li>
                    </ul>
                </div>
            )}

            {showProductModal && selectedProduct && (
                <div className="modal fade show d-block" tabIndex={-1}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content rounded-4">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedProduct.product_name}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeProductModal}
                                />
                            </div>

                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6 text-center">
                                        <img
                                            src={
                                                selectedProduct.product_img
                                                    ? `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/productImg/${selectedProduct.product_img}`
                                                    : productImagePlaceholder
                                            }
                                            alt={selectedProduct.product_name}
                                            className="img-fluid rounded-3"
                                            style={{ maxHeight: "300px" }}
                                        />
                                    </div>

                                    <div className="col-md-6">

                                        {/* Category */}
                                        <div className="d-flex mb-2">
                                            <div className="fw-bold me-2" >
                                                Category:
                                            </div>
                                            <div className="text-muted">
                                                {categories.find(c => c.id === selectedProduct.category_id)?.category_name || "—"}
                                            </div>
                                        </div>


                                        {/* Product Code */}
                                        {selectedProduct.product_code && (
                                            <div className="d-flex mb-2">
                                                <div className="fw-bold me-2" >
                                                    Product Code:
                                                </div>
                                                <div className="text-muted">
                                                    {selectedProduct.product_code}
                                                </div>
                                            </div>
                                        )}


                                        {/* Product Alias */}
                                        {selectedProduct.product_alias && (
                                            <div className="d-flex mb-2">
                                                <div className="fw-bold me-2" >
                                                    Product Alias:
                                                </div>
                                                <div className="text-muted">
                                                    {selectedProduct.product_alias}
                                                </div>
                                            </div>
                                        )}

                                        {/* Unit & Size */}
                                        {(selectedProduct.unit) && (
                                            <div className="d-flex mb-2">
                                                <div className="fw-bold me-2" >
                                                    Unit:
                                                </div>
                                                <div className="text-muted">
                                                    {selectedProduct.unit}
                                                </div>
                                            </div>
                                        )}
                                        {(selectedProduct.weight_or_size !== 0) && (
                                            <div className="d-flex mb-2">
                                                <div className="fw-bold me-2" >
                                                    Size:
                                                </div>
                                                <div className="text-muted">
                                                    {selectedProduct.weight_or_size}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {(selectedProduct.product_description) && (
                                            <div className="d-flex mb-2">
                                                <div className="fw-bold me-2">
                                                    Description:
                                                </div>
                                                <div className="text-muted">
                                                    {selectedProduct.product_description}
                                                </div>
                                            </div>
                                        )}
                                        {customFields.map((field) => {
                                            const value = selectedProduct[field.reference_column_name];

                                            if (!value) return null;

                                            return (
                                                <div key={field.reference_column_name} className="mb-2">
                                                    <div className="d-flex mb-2">
                                                        <div className="fw-bold me-2" >
                                                            {field.title}:
                                                        </div>
                                                        <div className="text-muted">
                                                            {String(value)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Price */}
                                        <div className="d-flex mb-2">
                                            <div className="fw-bold me-2" >
                                                Price:
                                            </div>
                                            <div >
                                                <p className="fs-5 fw-bold text-dark">
                                                    {currencyData?.symbol || "₹"}
                                                    {selectedProduct?.price_list
                                                        ? selectedProduct.price_list.net_rate
                                                        : selectedProduct?.net_rate}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stock */}
                                        <div className="d-flex mb-2">
                                            <div className="fw-bold me-2">
                                                Stock:
                                            </div>
                                            <div>
                                                <p
                                                    className={
                                                        selectedProduct.closing_qty > 0
                                                            ? "text-success fw-bold"
                                                            : "text-danger fw-bold"
                                                    }
                                                >
                                                    {selectedProduct.closing_qty > 0
                                                        ? `${selectedProduct.closing_qty} available`
                                                        : "Out of stock"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                {selectedProduct.closing_qty > 0 && (
                                    <button
                                        className="btn btn-primary rounded-pill px-4"
                                        style={{ backgroundColor: "#f58634" }}
                                        onClick={() => {
                                            addToCart(selectedProduct);
                                            closeProductModal();
                                        }}
                                    >
                                        Add to Cart
                                    </button>
                                )}
                                <button
                                    className="btn btn-outline-secondary rounded-pill px-4"
                                    onClick={closeProductModal}
                                >
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}


            {/* Your existing styles */}
            <style>{`
        .product-container {
          background: #ffffff;
          border-radius: 16px;
          transition: all 0.25s ease;
          border: 1px solid #dee2e6;
        }
        .product-wrapper {
          overflow: hidden;
        }
        .product-img {
          height: 230px;
          width: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }
        .premium-card:hover .product-img {
          transform: scale(1.08);
        }
        @media (max-width: 576px) {
          .product-img {
            height: 170px;
          }
        }
        .premium-pagination .page-item .page-link {
          border: none;
          margin: 0 4px;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 500;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transition: all 0.25s ease;
          color: #555;
        }
        .premium-pagination .page-item .page-link:hover {
          background: #f1f1f1;
        }
        .premium-pagination .page-item.active .page-link {
          background: linear-gradient(90deg, #007bff, #6610f2);
          color: white;
        }
        .premium-pagination .page-item.disabled .page-link {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
};

export default Products;