import { Button, Form } from "react-bootstrap";
import RulesEditor, { IRule } from "./RulesEditor";

// The Condition step's branches: [{ id, sourceHandle, rules, match }].
// Each branch is its own output wire on the node (see GenericNode.tsx).
export interface ICondition {
  id: string;
  sourceHandle?: string;
  rules: IRule[];
  match?: "AND" | "OR";
}

interface IProps {
  conditions: ICondition[];
  operators: string[];
  onChange: (conditions: ICondition[]) => void;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || `branch_${Date.now()}`;

const ConditionsEditor = ({ conditions, operators, onChange }: IProps) => {
  const list = conditions || [];

  const update = (i: number, patch: Partial<ICondition>) => onChange(list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => {
    const id = `branch_${list.length + 1}`;
    onChange([...list, { id, sourceHandle: id, rules: [], match: "AND" }]);
  };

  return (
    <div>
      {list.map((cond, i) => (
        <div key={i} className="border rounded p-2 mb-2" style={{ background: "#fafbfc" }}>
          <div className="d-flex gap-2 align-items-center mb-2">
            <strong className="small">Branch {i + 1}</strong>
            <Form.Control
              size="sm"
              placeholder="wire name (letters/numbers/_)"
              value={cond.sourceHandle || cond.id}
              onChange={(e) => {
                const handle = slugify(e.target.value);
                update(i, { id: handle, sourceHandle: handle });
              }}
              style={{ maxWidth: 200 }}
            />
            <Form.Select
              size="sm"
              value={cond.match || "AND"}
              onChange={(e) => update(i, { match: e.target.value as "AND" | "OR" })}
              style={{ maxWidth: 90 }}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </Form.Select>
            <Button size="sm" variant="outline-danger" className="ms-auto" onClick={() => remove(i)}>
              Remove branch
            </Button>
          </div>
          <RulesEditor rules={cond.rules || []} operators={operators} onChange={(rules) => update(i, { rules })} />
        </div>
      ))}
      <Button size="sm" variant="outline-secondary" onClick={add}>
        + Add branch
      </Button>
      <div className="text-muted small mt-1">First matching branch wins. Anything else goes down "no_match".</div>
    </div>
  );
};

export default ConditionsEditor;
