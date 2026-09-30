import React, { useEffect, useState } from "react";
import { getProductFillValues, IFormBuilderField } from "./FormBuilderController";

interface Option {
  id: number;
  label: string;
}

interface Props {
  column: IFormBuilderField; // type === "reference", master === "product"
  value: number | null;
  disabled?: boolean;
  formId?: number;
  fetchOptions: (master: string, parentId?: number) => Promise<Option[]>;
  onChange: (value: number | null) => void;
  // Copy the product's rate / unit / code into sibling cells of this row
  // (plan N5) — still editable afterwards.
  onFill: (values: Record<string, string>) => void;
}

// A repeater column that picks a product (plan N5). Narrow, deliberate
// exception to "a repeater column is a plain scalar" — just this one master,
// so a quotation-style line item can look up its own price. A bare <select>
// (no label — the table header already names the column), unlike the
// top-level Reference field.
const ProductCellSelect: React.FC<Props> = ({ column, value, disabled, formId, fetchOptions, onChange, onFill }) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOptions("product")
      .then((opts) => {
        if (!cancelled) setOptions(opts || []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (id: number | null) => {
    onChange(id);
    if (!id || !formId || !column.product_fill_map) return;
    const res = await getProductFillValues(formId, id);
    if (res?.ack !== 1 || !res.data?.item) return;
    const product = res.data.item;
    const values: Record<string, string> = {};
    Object.entries(column.product_fill_map).forEach(([productColumn, targetKey]) => {
      if (targetKey && product[productColumn] != null) values[targetKey as string] = String(product[productColumn]);
    });
    if (Object.keys(values).length) onFill(values);
  };

  return (
    <select className="form-control" value={value ?? ""} disabled={disabled || loading} onChange={(e) => pick(e.target.value ? Number(e.target.value) : null)}>
      <option value="">{loading ? "Loading…" : "Select…"}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default ProductCellSelect;
