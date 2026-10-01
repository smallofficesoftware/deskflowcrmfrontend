import { useFormikContext } from "formik";
import { useEffect, useMemo, useRef, useState } from "react";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import {
  fetchLinkableCarts,
  ICartLinkSettings,
  ICreateAccountTransaction,
  ILinkableCart,
} from "./CreateAccountTransactionController";

// "Link to Cart" picker. Optional unless the company has Bill to Bill
// Payment on. Options depend on Payment Type (Receipt -> sales-side carts,
// Payment -> purchase-side carts) and are limited to the current contact.
const CartLinkField = ({
  contact_id,
  transactionId,
}: {
  contact_id: number;
  transactionId?: number;
}) => {
  const { values, setFieldValue } = useFormikContext<ICreateAccountTransaction>();
  const [carts, setCarts] = useState<ILinkableCart[]>([]);
  const [settings, setSettings] = useState<ICartLinkSettings>({
    bill_to_bill: false,
    block_overpayment: false,
  });
  const prevType = useRef<string | null>(null);

  useEffect(() => {
    // Selected cart may not be valid for a changed type, so reset it. Skip
    // the first run so an edited transaction keeps its existing link.
    if (prevType.current !== null && prevType.current !== values.type) {
      setFieldValue("cart_id", "");
    }
    prevType.current = values.type;
    if (!values.type) {
      setCarts([]);
      return;
    }
    fetchLinkableCarts(contact_id, values.type, setCarts, setSettings, transactionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.type, contact_id, transactionId]);

  // A reverse entry cannot be linked to a cart, so ticking Auto Reverse Entry
  // clears and locks the cart.
  const isAutoReverse = values.auto_reverse_entry === 1;
  useEffect(() => {
    if (isAutoReverse && values.cart_id) setFieldValue("cart_id", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoReverse]);

  const options = useMemo(
    () =>
      carts.map((c) => ({
        value: c.id,
        label: `${c.cart_type_name} ${c.cart_number || `#${c.id}`} | Total ${c.grand_total} | Available ${c.available_amount}`,
      })),
    [carts],
  );

  return (
    <div className="col-6 col-md-6">
      <div className="form-group">
        <label htmlFor="cart_id" className="mb-1 form_label">
          Link to Cart{" "}
          {settings.bill_to_bill && !isAutoReverse ? (
            <span className="text-danger">*</span>
          ) : (
            "(optional)"
          )}
        </label>
        <FormikCustomSearchDropdown
          name="cart_id"
          options={options}
          disabled={isAutoReverse}
        />
        {isAutoReverse && (
          <small className="text-muted d-block">
            Not available with Auto Reverse Entry.
          </small>
        )}
        {settings.block_overpayment && (
          <small className="text-muted">
            Amount cannot exceed the available amount of the cart.
          </small>
        )}
      </div>
    </div>
  );
};

export default CartLinkField;
