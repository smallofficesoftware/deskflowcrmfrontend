import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import {
  fetchAllOrdersByCustomer,
  fetchOrderItemsByCart,
  IOption,
  searchBomProducts,
  searchCustomers,
} from "../JobCardController";
import { JobCardMode } from "../JobCardTypes";
import CustomSearchDropdown from "../../../../../../components/CustomSearchDropdown";

interface IProps {
  mode: JobCardMode;
  selectedCustomer: number | null;
  selectedOrder: number | null;
  selectedOrderItem: number | null;
  selectedProduct: number | null;
  productQty: string;
  loadingDetails: boolean;
  onModeChange: (mode: JobCardMode) => void;
  onCustomerChange: (id: number) => void;
  onOrderChange: (id: number) => void;
  onItemChange: (id: number) => void;
  onProductChange: (id: number) => void;
  onProductQtyChange: (v: string) => void;
  onLoad: () => void;
}

const MODES: { id: JobCardMode; label: string; icon: string }[] = [
  { id: "order", label: "From Order", icon: "📋" },
  { id: "product", label: "Direct Product", icon: "🏭" },
  { id: "customer", label: "For Customer", icon: "👤" },
];

const SelectRow = ({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="mb-3">
    <label className="form-label fw-semibold" style={{ fontSize: "0.82rem" }}>
      {label} {required && <span className="text-danger">*</span>}
    </label>
    {children}
  </div>
);

const ItemSelectSection = ({
  mode,
  selectedCustomer,
  selectedOrder,
  selectedOrderItem,
  selectedProduct,
  productQty,
  loadingDetails,
  onModeChange,
  onCustomerChange,
  onOrderChange,
  onItemChange,
  onProductChange,
  onProductQtyChange,
  onLoad,
}: IProps) => {
  const parsedQty = Number(productQty);

  const canLoad = (() => {
    if (parsedQty <= 0) return false;
    if (mode === "order")
      return !!selectedCustomer && !!selectedOrder && !!selectedOrderItem;
    if (mode === "product") return !!selectedProduct;
    if (mode === "customer") return !!selectedCustomer && !!selectedProduct;
    return false;
  })();

  // ── Local option state (mirror selected option for label display) ──
  const [customerOption, setCustomerOption] =
    useState<SingleValue<IOption>>(null);
  const [orderOption, setOrderOption] = useState<SingleValue<IOption>>(null);
  const [orderItemOption, setOrderItemOption] =
    useState<SingleValue<IOption>>(null);
  const [productOption, setProductOption] = useState<SingleValue<IOption>>(null);

  // ── Eagerly loaded lists for Order and Order Item ──
  const [orderList, setOrderList] = useState<IOption[]>([]);
  const [orderItemList, setOrderItemList] = useState<IOption[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  // Sync display options when parent resets selections
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerOption(null);
      setOrderList([]);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (!selectedOrder) {
      setOrderOption(null);
      setOrderItemList([]);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedOrderItem) setOrderItemOption(null);
  }, [selectedOrderItem]);

  useEffect(() => {
    if (!selectedProduct) setProductOption(null);
  }, [selectedProduct]);

  // Load ALL orders for the selected customer (order mode only)
  useEffect(() => {
    if (mode !== "order" || !selectedCustomer) {
      setOrderList([]);
      return;
    }
    let cancelled = false;
    setLoadingOrders(true);
    fetchAllOrdersByCustomer(selectedCustomer)
      .then((list) => {
        if (!cancelled) setOrderList(list);
      })
      .catch(() => {
        if (!cancelled) setOrderList([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer, mode]);

  // Load ALL items for the selected order (order mode only)
  useEffect(() => {
    if (mode !== "order" || !selectedOrder) {
      setOrderItemList([]);
      return;
    }
    let cancelled = false;
    setLoadingOrderItems(true);
    fetchOrderItemsByCart(selectedOrder)
      .then((list) => {
        if (!cancelled) setOrderItemList(list);
      })
      .catch(() => {
        if (!cancelled) setOrderItemList([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrderItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedOrder, mode]);

  // ── Async loaders ──
  const loadCustomerOptions = async (inputValue: string): Promise<IOption[]> => {
    const result = await searchCustomers(inputValue);
    return result || [];
  };

  const loadProductOptions = async (inputValue: string): Promise<IOption[]> => {
    const result = await searchBomProducts(inputValue);
    return result || [];
  };

  // ── Change handlers ──
  const handleCustomerSelect = (option: SingleValue<IOption>) => {
    setCustomerOption(option);
    onCustomerChange(option ? Number(option.value) : 0);
  };

  const handleOrderSelect = (option: SingleValue<IOption>) => {
    setOrderOption(option);
    onOrderChange(option ? Number(option.value) : 0);
  };

  const handleOrderItemSelect = (option: SingleValue<IOption>) => {
    setOrderItemOption(option);
    onItemChange(option ? Number(option.value) : 0);
  };

  const handleProductSelect = (option: SingleValue<IOption>) => {
    setProductOption(option);
    onProductChange(option ? Number(option.value) : 0);
  };

  const showCustomer = mode === "order" || mode === "customer";
  const showOrderChain = mode === "order";
  const showProduct = mode === "product" || mode === "customer";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* ── Mode toggle ── */}
      <div
        className="d-flex mb-4"
        style={{
          border: "1.5px solid #f0ece8",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "none",
                background: active ? "#f58634" : "#fff",
                color: active ? "#fff" : "#6c757d",
                fontWeight: active ? 700 : 500,
                fontSize: "0.78rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span className="me-1">{m.icon}</span>
              {m.label}
            </button>
          );
        })}
      </div>

      <p className="text-muted mb-4" style={{ fontSize: "0.82rem" }}>
        {mode === "order" && (
          <>
            Select a <strong>customer</strong>, their <strong>order</strong>, the
            specific <strong>item</strong>, and the{" "}
            <strong>quantity to produce</strong>.
          </>
        )}
        {mode === "product" && (
          <>
            Select a <strong>product</strong> (only products with a BOM) and the{" "}
            <strong>quantity to produce</strong>.
          </>
        )}
        {mode === "customer" && (
          <>
            Select a <strong>customer</strong>, a <strong>product</strong> (only
            products with a BOM), and the{" "}
            <strong>quantity to produce</strong>.
          </>
        )}
      </p>

      {/* Customer */}
      {showCustomer && (
        <SelectRow label="Customer">
          <CustomSearchDropdown
            isAsync={true}
            loadOptions={loadCustomerOptions}
            value={customerOption}
            onChange={handleCustomerSelect}
            className="w-100"
            placeholder="Search customer..."
          />
        </SelectRow>
      )}

      {/* Order + Order Item (order mode only) */}
      {showOrderChain && (
        <>
          <SelectRow label="Order">
            <CustomSearchDropdown
              options={orderList}
              value={orderOption}
              onChange={handleOrderSelect}
              className="w-100"
              placeholder={
                !selectedCustomer
                  ? "Select a customer first..."
                  : loadingOrders
                    ? "Loading orders…"
                    : orderList.length === 0
                      ? "No orders found"
                      : "Select order..."
              }
              isDisabled={!selectedCustomer || loadingOrders}
            />
          </SelectRow>

          <SelectRow label="Order Item">
            <CustomSearchDropdown
              options={orderItemList}
              value={orderItemOption}
              onChange={handleOrderItemSelect}
              className="w-100"
              placeholder={
                !selectedOrder
                  ? "Select an order first..."
                  : loadingOrderItems
                    ? "Loading items…"
                    : orderItemList.length === 0
                      ? "No BOM items found"
                      : "Select item..."
              }
              isDisabled={!selectedOrder || loadingOrderItems}
            />
            {!selectedOrder && selectedCustomer && (
              <div className="text-muted mt-1" style={{ fontSize: "0.73rem" }}>
                Select an order first
              </div>
            )}
          </SelectRow>
        </>
      )}

      {/* Product (product / customer mode) */}
      {showProduct && (
        <SelectRow label="Product">
          <CustomSearchDropdown
            isAsync={true}
            loadOptions={loadProductOptions}
            value={productOption}
            onChange={handleProductSelect}
            className="w-100"
            placeholder="Search product..."
          />
        </SelectRow>
      )}

      {/* Product Qty */}
      <SelectRow label="Product Qty">
        <input
          type="number"
          className="form-control form-control-sm"
          placeholder="How many qty to generate?"
          min={1}
          value={productQty}
          onChange={(e) => onProductQtyChange(e.target.value)}
        />
        {productQty && parsedQty <= 0 && (
          <div className="text-danger mt-1" style={{ fontSize: "0.73rem" }}>
            Qty must be greater than 0
          </div>
        )}
      </SelectRow>

      {/* Load button */}
      <div className="d-flex justify-content-end mt-4">
        <button
          className="btn btn-sm text-white"
          style={{
            background: canLoad
              ? "linear-gradient(135deg,#f58634,#e0732a)"
              : "#adb5bd",
            minWidth: 160,
            cursor: canLoad ? "pointer" : "not-allowed",
          }}
          disabled={!canLoad || loadingDetails}
          onClick={onLoad}
        >
          {loadingDetails ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                style={{ width: 12, height: 12, borderWidth: 2 }}
              />
              Loading…
            </>
          ) : (
            "View Job Card →"
          )}
        </button>
      </div>
    </div>
  );
};

export default ItemSelectSection;
