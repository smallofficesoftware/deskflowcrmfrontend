import React, { useMemo, useRef } from "react";
import { IFormBuilderField } from "../FormBuilderController";
import { findFormulaProblem, FORMULA_FUNCTIONS } from "../formula";
import { MAX_DECIMALS } from "../calculations";

interface Props {
  field: IFormBuilderField;
  fields: IFormBuilderField[]; // the whole top-level form
  onPatch: (patch: Partial<IFormBuilderField>, tag?: string) => void;
}

const LAYOUT_OR_FILE = new Set(["section-header", "instruction", "file", "signature", "image"]);
const OPERATORS = ["+", "-", "*", "/", "(", ")"];
const FUNCTION_HELP: Record<string, string> = {
  SUM: "SUM(list) — add up",
  MIN: "MIN(list) — smallest",
  MAX: "MAX(list) — largest",
  AVG: "AVG(list) — average",
  COUNT: "COUNT(list) — how many filled",
  ROUND: "ROUND(x, 2) — round to 2 decimals",
  ABS: "ABS(x) — remove the minus sign",
  IF: "IF(test, then, else) — e.g. IF([score] >= 50, 1, 0)",
  ADD_DAYS: "ADD_DAYS(date, 7) — date plus days",
  DAYS_BETWEEN: "DAYS_BETWEEN(from, to) — days between two dates",
  AGE_YEARS: "AGE_YEARS(birth date) — age in years",
  TODAY: "TODAY() — today's date",
};

// What a formula on this form may refer to, with the plain name shown on the
// buttons: top-level data fields, repeater columns, question-table scores.
export function referenceChoices(fields: IFormBuilderField[], selfKey: string): { ref: string; label: string }[] {
  const out: { ref: string; label: string }[] = [];
  fields.forEach((f) => {
    if (!f.key || f.key === selfKey || LAYOUT_OR_FILE.has(f.type)) return;
    if (f.type === "repeater") {
      (f.columns || []).forEach((c) => {
        if (c.key && !LAYOUT_OR_FILE.has(c.type)) out.push({ ref: `${f.key}.${c.key}`, label: `${f.label} → ${c.label} (all rows)` });
      });
      return;
    }
    out.push({ ref: f.key, label: f.label });
    if (f.type === "question-table") {
      out.push({ ref: `${f.key}.score`, label: `${f.label} → score` });
      out.push({ ref: `${f.key}.max_score`, label: `${f.label} → best possible score` });
      out.push({ ref: `${f.key}.answered`, label: `${f.label} → questions answered` });
    }
  });
  return out;
}

// Formula text box with click-to-insert field names, operators and
// functions, plus an inline check that says what is wrong in plain words
// (plan item H1, H4). Used for a top-level Calculation field and, with
// `rowChoices`, for a Calculation column inside a repeating table.
export const FormulaBox: React.FC<{
  value: string;
  choices: { ref: string; label: string }[];
  onChange: (formula: string) => void;
  id: string;
}> = ({ value, choices, onChange, id }) => {
  const area = useRef<HTMLTextAreaElement>(null);
  const known = useMemo(() => new Set(choices.map((c) => c.ref)), [choices]);
  const problem = value.trim() ? findFormulaProblem(value, known) : null;

  const insert = (text: string) => {
    const el = area.current;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label d-block" htmlFor={id}>
        Formula
      </label>
      <textarea
        id={id}
        ref={area}
        className={`form-control${problem ? " is-invalid" : ""}`}
        rows={3}
        spellCheck={false}
        placeholder="e.g. [qty] * [rate]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: "monospace" }}
      />
      {problem ? <div className="text-danger small mt-1">{problem}</div> : value.trim() ? <div className="text-success small mt-1">Formula looks fine.</div> : null}

      <small className="text-muted d-block mt-2">Click to add a field</small>
      <div className="d-flex flex-wrap" style={{ gap: 4, maxHeight: 130, overflowY: "auto" }}>
        {choices.length === 0 ? <small className="text-muted">Add number or date fields to the form first.</small> : null}
        {choices.map((c) => (
          <button key={c.ref} type="button" className="btn btn-sm btn-outline-secondary" title={`[${c.ref}]`} onClick={() => insert(`[${c.ref}]`)}>
            {c.label}
          </button>
        ))}
      </div>
      <small className="text-muted d-block mt-2">Signs</small>
      <div className="d-flex flex-wrap" style={{ gap: 4 }}>
        {OPERATORS.map((o) => (
          <button key={o} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => insert(` ${o} `)} style={{ minWidth: 34 }}>
            {o}
          </button>
        ))}
      </div>
      <small className="text-muted d-block mt-2">Functions</small>
      <div className="d-flex flex-wrap" style={{ gap: 4 }}>
        {FORMULA_FUNCTIONS.map((fn) => (
          <button key={fn} type="button" className="btn btn-sm btn-outline-secondary" title={FUNCTION_HELP[fn]} onClick={() => insert(fn === "TODAY" ? "TODAY()" : `${fn}(`)}>
            {fn}
          </button>
        ))}
      </div>
    </div>
  );
};

// Editor settings for a Calculation field (plan H1, O5, O6): the formula,
// number-or-date result, decimals, and optional result labels.
const CalculationSettings: React.FC<Props> = ({ field, fields, onPatch }) => {
  const choices = useMemo(() => referenceChoices(fields, field.key), [fields, field.key]);
  const resultType = field.result_type === "date" ? "date" : "number";
  const ranges = field.result_ranges || [];
  const setRanges = (next: { from: number; label: string }[]) => onPatch({ result_ranges: next.length ? next : undefined }, "result_ranges");

  return (
    <div>
      <FormulaBox id={`fb-formula-${field.id}`} value={field.formula || ""} choices={choices} onChange={(formula) => onPatch({ formula }, "formula")} />

      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor={`fb-restype-${field.id}`}>
          The answer is
        </label>
        <select id={`fb-restype-${field.id}`} className="form-control" value={resultType} onChange={(e) => onPatch({ result_type: e.target.value as "number" | "date" })}>
          <option value="number">A number</option>
          <option value="date">A date (e.g. due date = received + 7 days)</option>
        </select>
      </div>

      {resultType === "number" ? (
        <>
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`fb-dec-${field.id}`}>
              Decimal places
            </label>
            <select id={`fb-dec-${field.id}`} className="form-control" value={Number.isInteger(field.decimals) ? field.decimals : 2} onChange={(e) => onPatch({ decimals: Number(e.target.value) })}>
              {Array.from({ length: MAX_DECIMALS + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <label className="pb-2 form_label d-block">Result labels (optional)</label>
          <small className="text-muted d-block mb-1">For example “from 0 = Fail, from 50 = Pass” shows Pass or Fail beside the number.</small>
          {ranges.map((r, i) => (
            <div key={i} className="d-flex align-items-center mb-1" style={{ gap: 4 }}>
              <span>from</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ maxWidth: 90 }}
                value={r.from}
                aria-label="From this number"
                onChange={(e) => setRanges(ranges.map((x, j) => (j === i ? { ...x, from: Number(e.target.value) } : x)))}
              />
              <span>=</span>
              <input
                className="form-control form-control-sm"
                value={r.label}
                aria-label="Label"
                placeholder="e.g. Pass"
                onChange={(e) => setRanges(ranges.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <button type="button" className="btn btn-sm btn-outline-danger" aria-label="Remove label" onClick={() => setRanges(ranges.filter((_, j) => j !== i))}>
                <i className="pi pi-trash" />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRanges([...ranges, { from: 0, label: "" }])}>
            <i className="pi pi-plus" /> Add a label
          </button>
        </>
      ) : null}
      <small className="text-muted d-block mt-3">The answer is worked out automatically and can't be typed in. An empty field counts as 0.</small>
    </div>
  );
};

export default CalculationSettings;
