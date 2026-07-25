import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import {
  fetchAllOrdersByCustomer,
  fetchOrderItemsByCart,
  IOption,
  searchCustomers,
} from "../JobCardController";
import CustomSearchDropdown from "../../../../../../components/CustomSearchDropdown";

interface IProps {
  selectedCustomer: number | null;
  selectedOrder: number | null;
  selectedOrderItem: number | null;
  productQty: string;
  loadingDetails: boolean;
  onCustomerChange: (id: number) => void;
  onOrderChange: (id: number) => void;
  onItemChange: (id: number) => void;
  onProductQtyChange: (v: string) => void;
  onLoad: () => void;
}

const SelectRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="mb-3">
    <label className="form-label fw-semibold" style={{ fontSize: "0.82rem" }}>
      {label} <span className="text-danger">*</span>
    </label>
    {children}
  </div>
);

const ItemSelectSection = ({
  selectedCustomer,
  selectedOrder,
  selectedOrderItem,
  productQty,
  loadingDetails,
  onCustomerChange,
  onOrderChange,
  onItemChange,
  onProductQtyChange,
  onLoad,
}: IProps) => {
  const parsedQty = Number(productQty);
  const canLoad =
    !!selectedCustomer &&
    !!selectedOrder &&
    !!selectedOrderItem &&
    parsedQty > 0;

  // ── Local option state ──
  // CustomSearchDropdown needs the full {value,label} option object for display,
  // while the parent (JobCardView) only tracks raw numeric ids. These mirror
  // the selected option locally so the dropdown can show the chosen label.
  const [customerOption, setCustomerOption] =
    useState<SingleValue<IOption>>(null);
  const [orderOption, setOrderOption] = useState<SingleValue<IOption>>(null);
  const [orderItemOption, setOrderItemOption] =
    useState<SingleValue<IOption>>(null);

  // ── Eagerly loaded static lists for Order and Order Item ──
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

  // Load ALL orders for the selected customer immediately (no search term)
  useEffect(() => {
    if (!selectedCustomer) {
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
  }, [selectedCustomer]);

  // Load ALL items for the selected order immediately
  useEffect(() => {
    if (!selectedOrder) {
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
  }, [selectedOrder]);

  // ── Customer: still async search-as-you-type ──
  const loadCustomerOptions = async (
    inputValue: string,
  ): Promise<IOption[]> => {
    const result = await searchCustomers(inputValue);
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

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <p className="text-muted mb-4" style={{ fontSize: "0.82rem" }}>
        Select a <strong>customer</strong>, their <strong>order</strong>, the
        specific <strong>item</strong>, and the{" "}
        <strong>quantity to produce</strong>.
      </p>

      {/* Customer — async search */}
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

      {/* Order — static list, loads all on customer selection */}
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
        {loadingOrders && (
          <div className="text-muted mt-1" style={{ fontSize: "0.73rem" }}>
            <span
              className="spinner-border spinner-border-sm me-1"
              style={{ width: 10, height: 10, borderWidth: 2 }}
            />
            Loading orders…
          </div>
        )}
        {!selectedCustomer && (
          <div className="text-muted mt-1" style={{ fontSize: "0.73rem" }}>
            Select a customer first
          </div>
        )}
      </SelectRow>

      {/* Order Item — static list, loads all on order selection */}
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
                  ? "No items found"
                  : "Select item..."
          }
          isDisabled={!selectedOrder || loadingOrderItems}
        />
        {loadingOrderItems && (
          <div className="text-muted mt-1" style={{ fontSize: "0.73rem" }}>
            <span
              className="spinner-border spinner-border-sm me-1"
              style={{ width: 10, height: 10, borderWidth: 2 }}
            />
            Loading items…
          </div>
        )}
        {!selectedOrder && selectedCustomer && (
          <div className="text-muted mt-1" style={{ fontSize: "0.73rem" }}>
            Select an order first
          </div>
        )}
      </SelectRow>

      {/* Product Qty */}
      <SelectRow label="Product Qty">
        <input
          type="number"
          className="form-control form-control-sm"
          placeholder="How many qty to generate?"
          min={1}
          value={productQty}
          disabled={!selectedOrderItem}
          onChange={(e) => onProductQtyChange(e.target.value)}
        />
        {!selectedOrderItem && (
          <div className="text-muted mt-1" style={{ fontSize: "0.73rem" }}>
            Select an item first
          </div>
        )}
        {selectedOrderItem && productQty && parsedQty <= 0 && (
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
