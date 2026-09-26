import React from "react";
import { IFormBuilderField } from "./FormBuilderController";
import { answerColumnsOf, choicesFor, IAnswerColumn, MAIN_ANSWER_KEY, questionsOf, QuestionStats } from "./questionTable";

interface Props {
  field: IFormBuilderField;
  value: any; // { q1: { answer: "Yes", c2: "..." }, ... } (or its JSON text)
  visibleIds: Set<string>;
  stats?: QuestionStats;
  error?: string;
  disabled?: boolean;
  onChange: (grid: Record<string, Record<string, any>>) => void;
}

function asGrid(value: any): Record<string, Record<string, any>> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : {};
}

// Question table fill (plan item G): numbered questions, an answer column
// (Yes / No, Pass / Fail, text, number, tick) and optional extra columns.
// Questions hidden by their own "show only when" rule are not shown.
const QuestionTableInput: React.FC<Props> = ({ field, value, visibleIds, stats, error, disabled, onChange }) => {
  const grid = asGrid(value);
  const columns = answerColumnsOf(field);
  const questions = questionsOf(field);

  const setCell = (qid: string, column: IAnswerColumn, cell: any) => {
    const row = { ...(grid[qid] || {}) };
    if (cell === "" || cell === null || cell === undefined) delete row[column.key];
    else row[column.key] = cell;
    const next = { ...grid };
    if (Object.keys(row).length) next[qid] = row;
    else delete next[qid];
    onChange(next);
  };

  const control = (q: { id: string; text: string }, column: IAnswerColumn) => {
    const qid = String(q.id);
    const current = grid[qid]?.[column.key];
    const label = `${q.text} — ${column.label}`;
    const choices = choicesFor(column.type);
    if (choices) {
      return (
        <div className="btn-group" role="radiogroup" aria-label={label}>
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={current === c}
              disabled={disabled}
              className={`btn btn-sm ${current === c ? "fb-btn-primary" : "btn-outline-secondary"}`}
              // Clicking the chosen answer again clears it.
              onClick={() => setCell(qid, column, current === c ? "" : c)}
            >
              {c === "NA" ? "N/A" : c}
            </button>
          ))}
        </div>
      );
    }
    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          className="form-check-input"
          aria-label={label}
          checked={!!current}
          disabled={disabled}
          onChange={(e) => setCell(qid, column, e.target.checked ? 1 : "")}
        />
      );
    }
    return (
      <input
        type={column.type === "number" ? "number" : "text"}
        className="form-control form-control-sm"
        aria-label={label}
        value={current ?? ""}
        disabled={disabled}
        onChange={(e) => setCell(qid, column, column.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)}
      />
    );
  };

  const shown = questions.filter((q) => visibleIds.has(String(q.id)));

  return (
    <div className="form-group col-12">
      <label className="pb-2 form_label d-block">
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>
      {error ? <div className="field-error text-danger mb-2">{error}</div> : null}
      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle">
          <thead>
            <tr>
              <th style={{ width: 44 }}>No.</th>
              <th>Question</th>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((q) => (
              <tr key={q.id}>
                <td>{questions.indexOf(q) + 1}</td>
                <td>
                  {q.text}
                  {q.required ? <span className="text-danger"> *</span> : null}
                </td>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.label}>
                    {control(q, c)}
                  </td>
                ))}
              </tr>
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-muted">
                  No questions to answer.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {field.scored && stats ? (
        <small className="text-muted" aria-live="polite">
          Score: <strong>{stats.score}</strong> out of {stats.max_score} · {stats.answered} answered
        </small>
      ) : null}
    </div>
  );
};

export default QuestionTableInput;
export { MAIN_ANSWER_KEY };
