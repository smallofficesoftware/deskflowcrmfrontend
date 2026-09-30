import { Form } from "react-bootstrap";
import { IFieldDef, IFieldOption } from "../automationTypes";
import ConditionsEditor from "./ConditionsEditor";
import KeyValueEditor from "./KeyValueEditor";
import RulesEditor from "./RulesEditor";

// Renders every field type the catalog defines (see automationTypes.ts /
// backend catalog.js). One instance renders one node's whole parameter
// panel, or a trigger's config panel - both are just IFieldDef[].
//
// Known simplification (P1c v1): `user` / `users` / `ref` fields (team
// member and master-data pickers - stages, labels, products, ...) are
// plain ID inputs with a hint, not live searchable pickers. The values a
// flow saves are the same numeric ids the rest of the CRM already uses, so
// upgrading to a real picker later is a UI-only change, not a data change.

interface IProps {
  fields: IFieldDef[];
  values: Record<string, any>;
  operators: string[];
  onChange: (key: string, value: any) => void;
}

const optionLabel = (o: IFieldOption | string | number) => (typeof o === "object" ? o.label : String(o));
const optionValue = (o: IFieldOption | string | number) => (typeof o === "object" ? o.value : o);

const isVisible = (field: IFieldDef, values: Record<string, any>) => {
  if (!field.showIf) return true;
  return Object.entries(field.showIf).every(([key, want]) => {
    const got = values[key] ?? undefined;
    const wantList = Array.isArray(want) ? want : [want];
    return wantList.map(String).includes(String(got));
  });
};

const SPECIAL_LABELS: Record<string, string> = {
  contact: "the contact",
  assigned_user: "assigned team member",
  manager: "assigned member's manager",
  run_as: "automation's run-as user",
  custom: "custom (enter below)",
};

const FieldEditor = ({ fields, values, operators, onChange }: IProps) => {
  return (
    <>
      {fields.filter((f) => isVisible(f, values)).map((field) => {
        const value = values[field.key] ?? field.default ?? "";
        const label = (
          <Form.Label className="small fw-semibold mb-1">
            {field.label}
            {field.required && <span className="text-danger"> *</span>}
          </Form.Label>
        );

        let control: JSX.Element;
        switch (field.type) {
          case "boolean":
            control = (
              <Form.Check
                type="switch"
                checked={!!value}
                onChange={(e) => onChange(field.key, e.target.checked)}
                label={field.help}
              />
            );
            break;

          case "number":
            control = (
              <Form.Control
                size="sm"
                type="number"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={field.placeholder}
              />
            );
            break;

          case "textarea":
            control = (
              <Form.Control
                as="textarea"
                rows={3}
                size="sm"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            );
            break;

          case "select": {
            const opts = field.options || [];
            control = (
              <Form.Select size="sm" value={value} onChange={(e) => onChange(field.key, e.target.value)}>
                <option value="" disabled hidden>
                  Choose…
                </option>
                {opts.map((o) => (
                  <option key={String(optionValue(o))} value={optionValue(o)}>
                    {optionLabel(o)}
                  </option>
                ))}
              </Form.Select>
            );
            break;
          }

          case "multiselect": {
            const opts = field.options;
            const selected: (string | number)[] = Array.isArray(value) ? value : [];
            if (opts && opts.length) {
              control = (
                <div className="d-flex flex-wrap gap-3">
                  {opts.map((o) => {
                    const v = optionValue(o);
                    const checked = selected.map(String).includes(String(v));
                    return (
                      <Form.Check
                        key={String(v)}
                        type="checkbox"
                        label={optionLabel(o)}
                        checked={checked}
                        onChange={() =>
                          onChange(field.key, checked ? selected.filter((s) => String(s) !== String(v)) : [...selected, v])
                        }
                      />
                    );
                  })}
                </div>
              );
            } else {
              control = (
                <Form.Control
                  size="sm"
                  placeholder="comma separated (e.g. field_a, field_b)"
                  value={Array.isArray(value) ? value.join(", ") : value}
                  onChange={(e) =>
                    onChange(
                      field.key,
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              );
            }
            break;
          }

          case "user":
          case "users": {
            const specials = field.special || [];
            const isMulti = field.type === "users";
            control = (
              <>
                <Form.Control
                  size="sm"
                  placeholder={isMulti ? "IDs comma separated, or a keyword" : "Team member ID, or a keyword"}
                  value={Array.isArray(value) ? value.join(", ") : value}
                  onChange={(e) =>
                    onChange(
                      field.key,
                      isMulti ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : e.target.value
                    )
                  }
                />
                {specials.length > 0 && (
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    Keywords: {specials.map((s) => SPECIAL_LABELS[s] || s).join(", ")}
                  </div>
                )}
              </>
            );
            break;
          }

          case "ref":
            control = (
              <>
                <Form.Control
                  size="sm"
                  placeholder={field.multiple ? `${field.ref} id(s), comma separated` : `${field.ref} id`}
                  value={Array.isArray(value) ? value.join(", ") : value}
                  onChange={(e) =>
                    onChange(
                      field.key,
                      field.multiple ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : e.target.value
                    )
                  }
                />
                <div className="text-muted" style={{ fontSize: 11 }}>
                  From: {field.ref}
                </div>
              </>
            );
            break;

          case "datetime":
            control = (
              <Form.Control
                size="sm"
                placeholder="2026-10-01 09:00 or {{variable}}"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            );
            break;

          case "template":
            control = (
              <Form.Control
                size="sm"
                placeholder={field.placeholder || "text, {{variable}} allowed"}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                type={field.secret ? "password" : "text"}
              />
            );
            break;

          case "keyvalue":
            control = (
              <KeyValueEditor
                rows={Array.isArray(value) ? value : []}
                keyName="key"
                valueName="value"
                keyLabel={field.keyLabel}
                valueLabel={field.valueLabel}
                onChange={(rows) => onChange(field.key, rows)}
              />
            );
            break;

          case "fields":
            control = (
              <KeyValueEditor
                rows={Array.isArray(value) ? value : []}
                keyName="field"
                valueName="value"
                keyLabel="Field"
                valueLabel="Value ({{ }} allowed)"
                keyPlaceholder={field.ref ? `${field.ref} column` : "field"}
                onChange={(rows) => onChange(field.key, rows)}
              />
            );
            break;

          case "rules":
            control = (
              <RulesEditor rules={Array.isArray(value) ? value : []} operators={operators} onChange={(rules) => onChange(field.key, rules)} />
            );
            break;

          case "conditions":
            control = (
              <ConditionsEditor
                conditions={Array.isArray(value) ? value : []}
                operators={operators}
                onChange={(conditions) => onChange(field.key, conditions)}
              />
            );
            break;

          case "text":
          default:
            control = (
              <Form.Control
                size="sm"
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            );
        }

        return (
          <div className="mb-3" key={field.key}>
            {field.type !== "boolean" && label}
            {control}
            {field.help && field.type !== "boolean" && <div className="text-muted" style={{ fontSize: 11 }}>{field.help}</div>}
          </div>
        );
      })}
    </>
  );
};

export default FieldEditor;
