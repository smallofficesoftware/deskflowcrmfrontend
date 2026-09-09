import React, { useEffect, useState } from "react";
import { IFormBuilderField } from "./FormBuilderController";

interface Option {
  id: number;
  label: string;
}

interface Props {
  field: IFormBuilderField;
  value: number | null;
  onChange: (value: number | null) => void;
  parentValue?: number | null; // value of the field this cascades_from (if any)
  error?: string;
  disabled?: boolean;
  // Injected by the fill view so the same component works for both the
  // authenticated internal fill and the anonymous public fill (plan §1
  // "one shared cascading-dropdown component... calls whichever
  // reference-options endpoint matches the fill context").
  fetchOptions: (master: string, parentId?: number) => Promise<Option[]>;
}

const ReferenceFieldInput: React.FC<Props> = ({ field, value, onChange, parentValue, error, disabled, fetchOptions }) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (field.cascades_from && !parentValue) {
      setOptions([]);
      return;
    }
    setLoading(true);
    fetchOptions(field.master || "", parentValue || undefined)
      .then((opts) => {
        if (!cancelled) setOptions(opts || []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.master, parentValue]);

  return (
    <div className="form-group">
      <label className="pb-2 form_label text-truncate d-block" title={field.label}>
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>
      <select
        className={`form-control${error ? " is-invalid input-box-error" : ""}`}
        value={value ?? ""}
        disabled={disabled || (!!field.cascades_from && !parentValue) || loading}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{loading ? "Loading..." : "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <div className="field-error text-danger">{error}</div> : null}
    </div>
  );
};

export default ReferenceFieldInput;
