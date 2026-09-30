import React from "react";
import { IFormBuilderField } from "../FormBuilderController";
import { ConditionOperator, IConditionGroup, IConditionRule, NON_SOURCE_TYPES } from "../conditions";

interface Props {
  // Sentence shown in front of the rules, e.g. "Show this only when".
  title: string;
  // Short name of the target used in the empty-state hint.
  hint: string;
  group: IConditionGroup | undefined;
  field: IFormBuilderField; // the field the rule belongs to (never a source of its own rule)
  fields: IFormBuilderField[];
  onChange: (group: IConditionGroup | undefined) => void;
}

type OpDef = { id: ConditionOperator; label: string };

const OP_LABEL: Record<ConditionOperator, string> = {
  is: "is",
  is_not: "is not",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  contains: "contains",
  gt: "is greater than",
  lt: "is less than",
  any_of: "is any of",
};

const DATE_OP_LABEL: Partial<Record<ConditionOperator, string>> = { gt: "is after", lt: "is before" };

// Operators that make sense for a source field's type — a non-technical
// user is only offered what can actually be answered.
function operatorsFor(source: IFormBuilderField | undefined): OpDef[] {
  const pick = (ids: ConditionOperator[], date = false): OpDef[] => ids.map((id) => ({ id, label: (date && DATE_OP_LABEL[id]) || OP_LABEL[id] }));
  if (!source) return pick(["is"]);
  switch (source.type) {
    case "dropdown":
    case "radio":
      return pick(["is", "is_not", "any_of", "is_empty", "is_not_empty"]);
    case "multi-select":
      return pick(["contains", "any_of", "is_empty", "is_not_empty"]);
    case "checkbox":
    case "switch":
      return pick(["is"]);
    case "number":
    case "rating":
    case "calculation":
    case "currency":
    case "percentage":
      return pick(["is", "is_not", "gt", "lt", "is_empty", "is_not_empty"]);
    case "date":
    case "datetime":
      return pick(["is", "gt", "lt", "is_empty", "is_not_empty"], true);
    case "text":
    case "textarea":
    case "phone":
    case "email":
    case "url":
    case "address":
    case "barcode":
      return pick(["is", "is_not", "contains", "is_empty", "is_not_empty"]);
    default:
      return pick(["is_empty", "is_not_empty"]);
  }
}

const NO_VALUE_OPS = new Set<ConditionOperator>(["is_empty", "is_not_empty"]);

const ConditionEditor: React.FC<Props> = ({ title, hint, group, field, fields, onChange }) => {
  const rules: IConditionRule[] = group?.rules || [];
  const match = group?.match || "all";
  const sources = fields.filter((f) => f.key && f.key !== field.key && !NON_SOURCE_TYPES.has(f.type));

  const commit = (nextRules: IConditionRule[], nextMatch = match) => {
    onChange(nextRules.length ? { match: nextMatch, rules: nextRules } : undefined);
  };
  const setRule = (i: number, patch: Partial<IConditionRule>) => commit(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRule = () => {
    const first = sources[0];
    if (!first) return;
    commit([...rules, { field: first.key, op: operatorsFor(first)[0].id }]);
  };
  const removeRule = (i: number) => commit(rules.filter((_, idx) => idx !== i));

  const changeSource = (i: number, key: string) => {
    const source = sources.find((f) => f.key === key);
    // A new source field resets the operator/value — the old ones may not fit.
    setRule(i, { field: key, op: operatorsFor(source)[0].id, value: undefined });
  };

  const valueInput = (rule: IConditionRule, i: number, source: IFormBuilderField | undefined) => {
    if (NO_VALUE_OPS.has(rule.op)) return null;
    const type = source?.type;
    const options = source?.options || [];
    if (rule.op === "any_of") {
      const picked: string[] = Array.isArray(rule.value) ? rule.value : [];
      return (
        <div className="mt-1">
          {options.map((o) => (
            <div className="form-check" key={o}>
              <input
                type="checkbox"
                className="form-check-input"
                id={`cond-${field.id}-${i}-${o}`}
                checked={picked.includes(o)}
                onChange={(e) => setRule(i, { value: e.target.checked ? [...picked, o] : picked.filter((p) => p !== o) })}
              />
              <label className="form-check-label" htmlFor={`cond-${field.id}-${i}-${o}`}>
                {o}
              </label>
            </div>
          ))}
          {!options.length ? <small className="text-muted">This field has no choices yet.</small> : null}
        </div>
      );
    }
    if (type === "dropdown" || type === "radio" || type === "multi-select") {
      return (
        <select className="form-control mt-1" value={rule.value ?? ""} onChange={(e) => setRule(i, { value: e.target.value })}>
          <option value="">Pick a value…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (type === "checkbox" || type === "switch") {
      return (
        <select className="form-control mt-1" value={rule.value ?? ""} onChange={(e) => setRule(i, { value: e.target.value === "" ? undefined : Number(e.target.value) })}>
          <option value="">Pick…</option>
          <option value={1}>Ticked / Yes</option>
          <option value={0}>Not ticked / No</option>
        </select>
      );
    }
    const inputType = type === "date" ? "date" : type === "datetime" ? "datetime-local" : ["number", "rating", "calculation", "currency", "percentage"].includes(type || "") ? "number" : "text";
    return (
      <input
        type={inputType}
        className="form-control mt-1"
        value={rule.value ?? ""}
        onChange={(e) => setRule(i, { value: inputType === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value })}
      />
    );
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label d-block">{title}</label>
      {rules.length === 0 ? <small className="text-muted d-block mb-2">{sources.length ? `No rule — ${hint}.` : "Add another field to the form first, then you can use it in a rule."}</small> : null}

      {rules.length > 1 ? (
        <div className="mb-2">
          <select className="form-control" value={match} onChange={(e) => commit(rules, e.target.value as "all" | "any")} aria-label="Match all or any rule">
            <option value="all">All of these are true</option>
            <option value="any">Any one of these is true</option>
          </select>
        </div>
      ) : null}

      {rules.map((rule, i) => {
        const source = sources.find((f) => f.key === rule.field);
        const ops = operatorsFor(source);
        return (
          <div key={i} className="p-2 mb-2 rounded" style={{ background: "#F7F7F7", border: "1px solid #E5E5E5" }}>
            <select className={`form-control${source ? "" : " is-invalid"}`} value={rule.field} onChange={(e) => changeSource(i, e.target.value)} aria-label="Field">
              {!source ? <option value={rule.field}>(field was deleted)</option> : null}
              {sources.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <select className="form-control mt-1" value={rule.op} onChange={(e) => setRule(i, { op: e.target.value as ConditionOperator, value: undefined })} aria-label="Condition">
              {ops.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            {valueInput(rule, i, source)}
            <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => removeRule(i)}>
              <i className="pi pi-trash" /> Remove rule
            </button>
          </div>
        );
      })}

      <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={!sources.length} onClick={addRule}>
        <i className="pi pi-plus" /> Add a rule
      </button>
    </div>
  );
};

export default ConditionEditor;
