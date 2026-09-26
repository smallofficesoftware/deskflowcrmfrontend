import { Button, Form } from "react-bootstrap";

// One rule: { field, operator, value }. Shared by trigger filters,
// Condition and If/Else (rules type + conditions type build on this).
export interface IRule {
  field: string;
  operator: string;
  value?: string;
}

interface IProps {
  rules: IRule[];
  operators: string[];
  onChange: (rules: IRule[]) => void;
}

const NO_VALUE_OPS = new Set(["is_empty", "is_not_empty"]);

const RulesEditor = ({ rules, operators, onChange }: IProps) => {
  const list = rules || [];

  const update = (i: number, patch: Partial<IRule>) => {
    const next = list.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  };
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, { field: "", operator: operators[0] || "equals", value: "" }]);

  return (
    <div>
      {list.map((rule, i) => (
        <div key={i} className="d-flex gap-2 mb-2 align-items-start">
          <Form.Control
            size="sm"
            placeholder="record.field or contact.custom_fields.x"
            value={rule.field}
            onChange={(e) => update(i, { field: e.target.value })}
            style={{ flex: 2 }}
          />
          <Form.Select
            size="sm"
            value={rule.operator}
            onChange={(e) => update(i, { operator: e.target.value })}
            style={{ flex: 1.4 }}
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {op.replace(/_/g, " ")}
              </option>
            ))}
          </Form.Select>
          {!NO_VALUE_OPS.has(rule.operator) && (
            <Form.Control
              size="sm"
              placeholder="value or {{variable}}"
              value={rule.value ?? ""}
              onChange={(e) => update(i, { value: e.target.value })}
              style={{ flex: 2 }}
            />
          )}
          <Button size="sm" variant="outline-danger" onClick={() => remove(i)}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline-secondary" onClick={add}>
        + Add rule
      </Button>
    </div>
  );
};

export default RulesEditor;
