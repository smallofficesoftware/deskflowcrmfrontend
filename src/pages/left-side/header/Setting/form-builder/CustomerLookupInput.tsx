import React, { useEffect, useRef, useState } from "react";
import { IFormBuilderField, searchCustomers } from "./FormBuilderController";

export interface ICustomerHit {
  id: number;
  label: string;
  [column: string]: any; // person_name, company_name, mobile_number, email_id, city, address, pincode, gst_number
}

interface Props {
  field: IFormBuilderField;
  value: number | null;
  // Label of the already-saved customer (edit screen); a freshly picked
  // customer's label comes from the search hit.
  initialLabel?: string;
  formId?: number; // the search endpoint checks the caller can fill this form
  error?: string;
  disabled?: boolean;
  onChange: (id: number | null) => void;
  // Copy the chosen customer's details into the mapped form fields
  // (field.lookup_map: contact column -> form field key). Still editable.
  onFill: (values: Record<string, string>) => void;
}

const MIN_CHARS = 2;

// Customer lookup field (plan item F1, F2): type a name, company or mobile
// number, pick the customer from the list, and the mapped fields fill
// themselves. Internal forms only.
const CustomerLookupInput: React.FC<Props> = ({ field, value, initialLabel, formId, error, disabled, onChange, onFill }) => {
  const [text, setText] = useState("");
  const [hits, setHits] = useState<ICustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pickedLabel, setPickedLabel] = useState(initialLabel || "");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLabel) setPickedLabel(initialLabel);
  }, [initialLabel]);

  // Debounced search.
  useEffect(() => {
    if (!formId || text.trim().length < MIN_CHARS) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchCustomers(formId, text.trim());
      if (cancelled) return;
      setHits(res?.ack === 1 ? res.data?.items || [] : []);
      setSearching(false);
      setOpen(true);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, formId]);

  // Close the list when clicking elsewhere.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (hit: ICustomerHit) => {
    onChange(hit.id);
    setPickedLabel(hit.label);
    setText("");
    setHits([]);
    setOpen(false);
    const values: Record<string, string> = {};
    Object.entries(field.lookup_map || {}).forEach(([column, targetKey]) => {
      if (targetKey) values[targetKey as string] = hit[column] == null ? "" : String(hit[column]);
    });
    if (Object.keys(values).length) onFill(values);
  };

  const clear = () => {
    onChange(null);
    setPickedLabel("");
  };

  return (
    <div className="form-group" ref={box} style={{ position: "relative" }}>
      <label className="pb-2 form_label text-truncate d-block" title={field.label}>
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>

      {value ? (
        <div className={`form-control d-flex align-items-center${error ? " is-invalid input-box-error" : ""}`} style={{ gap: 8 }}>
          <i className="pi pi-user" style={{ fontSize: 12 }} />
          <span className="text-truncate me-auto" title={pickedLabel}>
            {pickedLabel || `Customer #${value}`}
          </span>
          {!disabled ? (
            <button type="button" className="btn btn-sm p-0 border-0" aria-label="Choose a different customer" onClick={clear}>
              <i className="pi pi-times" style={{ fontSize: 11 }} />
            </button>
          ) : null}
        </div>
      ) : (
        <input
          className={`form-control${error ? " is-invalid input-box-error" : ""}`}
          value={text}
          disabled={disabled || !formId}
          placeholder={formId ? "Type a name, company or mobile number" : "Customer search works on the real form"}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => hits.length && setOpen(true)}
        />
      )}

      {open && !value ? (
        <div
          className="bg-white border rounded shadow-sm"
          style={{ position: "absolute", zIndex: 20, left: 0, right: 0, maxHeight: 240, overflowY: "auto" }}
          role="listbox"
        >
          {searching ? <div className="p-2 text-muted">Searching…</div> : null}
          {!searching && hits.length === 0 ? <div className="p-2 text-muted">No customer found — you can type the details yourself below.</div> : null}
          {hits.map((hit) => (
            <button
              key={hit.id}
              type="button"
              role="option"
              aria-selected={false}
              className="d-block w-100 text-start btn btn-light border-0 rounded-0 py-2"
              onClick={() => pick(hit)}
            >
              <span className="d-block">{hit.label}</span>
              <small className="text-muted">{[hit.mobile_number, hit.city].filter(Boolean).join(" · ")}</small>
            </button>
          ))}
        </div>
      ) : null}
      {error ? <div className="field-error text-danger">{error}</div> : null}
    </div>
  );
};

export default CustomerLookupInput;
