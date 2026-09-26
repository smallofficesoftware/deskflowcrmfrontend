import React from "react";
import { CONTACT_LOOKUP_COLUMNS, IFormBuilderField } from "../FormBuilderController";

interface Props {
  field: IFormBuilderField;
  fields: IFormBuilderField[];
  onChange: (map: Record<string, string>) => void;
}

// Form field types a customer detail can be copied into.
const TARGET_TYPES = ["text", "textarea", "phone", "email", "address", "url"];

// Editor settings for a Customer lookup field (plan item F2): for each
// customer detail, which field on this form should receive it. The person
// filling the form can still change what was copied in.
const CustomerLookupSettings: React.FC<Props> = ({ field, fields, onChange }) => {
  const map: Record<string, string> = field.lookup_map || {};
  const targets = fields.filter((f) => f.key && f.key !== field.key && TARGET_TYPES.includes(f.type));

  const set = (column: string, key: string) => {
    const next = { ...map };
    if (key) next[column] = key;
    else delete next[column];
    onChange(next);
  };

  return (
    <div>
      <p className="text-muted" style={{ fontSize: 13 }}>
        When someone picks a customer, these details are filled in for them. They can still change them.
      </p>
      {targets.length === 0 ? <small className="text-muted d-block mb-2">Add text, phone, email or address fields to this form to receive the details.</small> : null}
      {Object.entries(CONTACT_LOOKUP_COLUMNS).map(([column, label]) => {
        const taken = new Set(Object.entries(map).filter(([c]) => c !== column).map(([, k]) => k));
        return (
          <div className="form-group" key={column}>
            <label className="pb-1 form_label d-block" htmlFor={`fb-lk-${field.id}-${column}`}>
              {label} goes into
            </label>
            <select id={`fb-lk-${field.id}-${column}`} className="form-control" value={map[column] || ""} onChange={(e) => set(column, e.target.value)}>
              <option value="">Don't fill anything</option>
              {targets
                .filter((f) => !taken.has(f.key) || f.key === map[column])
                .map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
            </select>
          </div>
        );
      })}
    </div>
  );
};

export default CustomerLookupSettings;
