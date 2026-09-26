import React from "react";
import { IFormBuilderField } from "./FormBuilderController";
import { FIELD_TYPE_REGISTRY } from "./fieldTypes";
import { evaluateVisibility } from "./conditions";
import ProductCellSelect from "./ProductCellSelect";

interface Props {
  field: IFormBuilderField; // type === "repeater"
  rows: Record<string, any>[];
  onChange: (rows: Record<string, any>[]) => void;
  onFile: (rowIndex: number, subKey: string, file: File | null) => void;
  errors?: string[];
  disabled?: boolean;
  // Worked-out values of the calculation columns, one object per row.
  computedRows?: Record<string, number | string | null>[];
  // The form around this table, so a column's "show only when" rule can look at
  // this row's other cells and at the form's own fields.
  outerFields?: IFormBuilderField[];
  outerAnswers?: Record<string, any>;
  outerVisible?: Set<string>;
  // Needed only for a product column (plan N5): the form being filled and the option lookup.
  formId?: number;
  fetchReferenceOptions?: (master: string, parentId?: number) => Promise<{ id: number; label: string }[]>;
}

// Repeater sub-fields are capped at 1 level deep (plan §1) — every column
// here is a scalar or file type, never another repeater. The one reference
// allowed is a product column (plan N5) for quotation-style line items.
const RepeaterFieldInput: React.FC<Props> = ({ field, rows, onChange, onFile, errors, disabled, computedRows, outerFields, outerAnswers, outerVisible, formId, fetchReferenceOptions }) => {
  const columns = field.columns || [];

  const updateCell = (rowIndex: number, key: string, value: any) => {
    const next = rows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r));
    onChange(next);
  };

  const patchCells = (rowIndex: number, values: Record<string, any>) => {
    onChange(rows.map((r, i) => (i === rowIndex ? { ...r, ...values } : r)));
  };

  const addRow = () => onChange([...rows, {}]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="form-group col-12">
      <label className="pb-2 form_label d-block">
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>
      {errors && errors.length > 0 ? <div className="field-error text-danger mb-2">{errors.join("; ")}</div> : null}
      <div className="table-responsive fb-repeater-scroll">
        <table className="table table-bordered table-sm fb-repeater-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowVisible = evaluateVisibility(
                columns,
                row,
                outerFields && outerAnswers && outerVisible ? { fields: outerFields, answers: outerAnswers, visible: outerVisible } : null,
              );
              return (
              <tr key={rowIndex}>
                {columns.map((col) => {
                  if (col.key && !rowVisible.has(col.key)) {
                    return (
                      <td key={col.key} data-label={col.label} className="text-muted">
                        —
                      </td>
                    );
                  }
                  if (["file", "signature", "image"].includes(col.type)) {
                    return (
                      <td key={col.key} data-label={col.label}>
                        <input
                          type="file"
                          className="form-control"
                          disabled={disabled}
                          onChange={(e) => onFile(rowIndex, col.key, e.target.files?.[0] || null)}
                        />
                      </td>
                    );
                  }
                  if (col.type === "reference" && col.master === "product" && fetchReferenceOptions) {
                    return (
                      <td key={col.key} data-label={col.label}>
                        <ProductCellSelect
                          column={col}
                          value={row[col.key] ?? null}
                          disabled={disabled}
                          formId={formId}
                          fetchOptions={fetchReferenceOptions}
                          onChange={(v) => updateCell(rowIndex, col.key, v)}
                          onFill={(values) => patchCells(rowIndex, values)}
                        />
                      </td>
                    );
                  }
                  if (col.type === "calculation") {
                    const value = computedRows?.[rowIndex]?.[col.key];
                    const decimals = Number.isInteger(col.decimals) ? (col.decimals as number) : 2;
                    return (
                      <td key={col.key} data-label={col.label}>
                        <input
                          className="form-control"
                          readOnly
                          tabIndex={-1}
                          aria-label={col.label}
                          style={{ background: "#F7F7F7" }}
                          value={
                            value == null || value === ""
                              ? ""
                              : typeof value === "number"
                                ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
                                : String(value)
                          }
                        />
                      </td>
                    );
                  }
                  const Comp = FIELD_TYPE_REGISTRY[col.type];
                  return (
                    <td key={col.key} data-label={col.label}>
                      {Comp ? (
                        <input
                          type={col.type === "number" ? "number" : "text"}
                          className="form-control"
                          value={row[col.key] ?? ""}
                          disabled={disabled}
                          onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                        />
                      ) : null}
                    </td>
                  );
                })}
                <td className="fb-rep-actions">
                  <button type="button" className="btn btn-sm btn-outline-danger" disabled={disabled} onClick={() => removeRow(rowIndex)}>
                    Remove
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-sm fb-btn-outline-primary fb-repeater-add" disabled={disabled} onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
};

export default RepeaterFieldInput;
