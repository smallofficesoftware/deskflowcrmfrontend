import React from "react";
import { IFormBuilderField } from "./FormBuilderController";
import { FIELD_TYPE_REGISTRY } from "./fieldTypes";

interface Props {
  field: IFormBuilderField; // type === "repeater"
  rows: Record<string, any>[];
  onChange: (rows: Record<string, any>[]) => void;
  onFile: (rowIndex: number, subKey: string, file: File | null) => void;
  errors?: string[];
  disabled?: boolean;
}

// Repeater sub-fields are capped at 1 level deep (plan §1) — every column
// here is a scalar or file type, never another repeater/reference (the
// builder enforces that when configuring a repeater's own columns).
const RepeaterFieldInput: React.FC<Props> = ({ field, rows, onChange, onFile, errors, disabled }) => {
  const columns = field.columns || [];

  const updateCell = (rowIndex: number, key: string, value: any) => {
    const next = rows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r));
    onChange(next);
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
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => {
                  if (["file", "signature", "image"].includes(col.type)) {
                    return (
                      <td key={col.key}>
                        <input
                          type="file"
                          className="form-control"
                          disabled={disabled}
                          onChange={(e) => onFile(rowIndex, col.key, e.target.files?.[0] || null)}
                        />
                      </td>
                    );
                  }
                  const Comp = FIELD_TYPE_REGISTRY[col.type];
                  return (
                    <td key={col.key}>
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
                <td>
                  <button type="button" className="btn btn-sm btn-outline-danger" disabled={disabled} onClick={() => removeRow(rowIndex)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={disabled} onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
};

export default RepeaterFieldInput;
