import React from "react";

export type TProductKind = "" | "simple" | "parent" | "variant";

/** "All / Simple / Has variants / Variant" picker shared by the product lists. */
const ProductKindSelect = ({
  value,
  onChange,
  style,
}: {
  value: TProductKind;
  onChange: (kind: TProductKind) => void;
  style?: React.CSSProperties;
}) => (
  <select
    className="form-select form-select-sm"
    aria-label="Product type"
    title="Product type"
    value={value}
    onChange={(e) => onChange(e.target.value as TProductKind)}
    style={{ width: "auto", minWidth: 130, ...style }}
  >
    <option value="">All products</option>
    <option value="simple">Simple only</option>
    <option value="parent">Parent (has variants) only</option>
    <option value="variant">Variants only</option>
  </select>
);

export default ProductKindSelect;
