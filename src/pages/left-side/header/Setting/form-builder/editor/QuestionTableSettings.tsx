import React, { useState } from "react";
import { IFormBuilderField } from "../FormBuilderController";
import {
  ANSWER_COLUMN_TYPES,
  answerColumnsOf,
  choicesFor,
  EXTRA_COLUMN_TYPES,
  IAnswerColumn,
  IQuestion,
  MAIN_ANSWER_KEY,
  newQuestion,
  questionsOf,
} from "../questionTable";

interface Props {
  field: IFormBuilderField;
  onPatch: (patch: Partial<IFormBuilderField>, tag?: string) => void;
}

// A question may only wait for a question ABOVE it, so drop any rule that
// now points at a removed or later question (after a move or delete).
function sanitize(field: IFormBuilderField, questions: IQuestion[]): IQuestion[] {
  const order = new Map(questions.map((q, i) => [String(q.id), i]));
  return questions.map((q, index) => {
    const rules = q.conditions?.rules || [];
    const kept = rules.filter((r) => r.field !== field.key || (order.has(String(r.row)) && (order.get(String(r.row)) as number) < index));
    if (kept.length === rules.length) return q;
    return { ...q, conditions: kept.length ? { ...q.conditions, rules: kept } : undefined };
  });
}

// Editor settings for a Question table (plan item G): the numbered questions,
// the answer type, extra columns, scoring, and "show this question only when
// an earlier question was answered ..." rules.
const QuestionTableSettings: React.FC<Props> = ({ field, onPatch }) => {
  const [paste, setPaste] = useState("");
  const questions = questionsOf(field);
  const columns = answerColumnsOf(field);
  const main = columns[0];
  const extras = columns.slice(1);
  const choices = choicesFor(main.type);

  const setQuestions = (next: IQuestion[]) => onPatch({ questions: sanitize(field, next) }, "questions");
  const patchQuestion = (i: number, patch: Partial<IQuestion>) => setQuestions(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= questions.length) return;
    const next = [...questions];
    [next[i], next[t]] = [next[t], next[i]];
    setQuestions(next);
  };
  const addQuestion = (text = "") => setQuestions([...questions, { ...newQuestion({ ...field, questions } as IFormBuilderField), text }]);

  const setColumns = (next: IAnswerColumn[]) => onPatch({ answer_columns: next }, "answer_columns");
  const setMain = (patch: Partial<IAnswerColumn>) => {
    const nextMain = { ...main, key: MAIN_ANSWER_KEY, ...patch };
    setColumns([nextMain, ...extras]);
    // Points only make sense for choice answers.
    if (patch.type && !choicesFor(patch.type) && field.scored) onPatch({ answer_columns: [nextMain, ...extras], scored: false });
  };
  const addExtra = () => {
    const used = new Set(columns.map((c) => c.key));
    let n = columns.length + 1;
    while (used.has(`c${n}`)) n += 1;
    setColumns([...columns, { key: `c${n}`, label: `Column ${columns.length + 1}`, type: "text" }]);
  };

  const setCondition = (i: number, rowId: string, value: string) => {
    if (!rowId) return patchQuestion(i, { conditions: undefined });
    patchQuestion(i, { conditions: { match: "all", rules: [{ field: field.key, row: rowId, op: "is", value }] } });
  };

  return (
    <div>
      <div className="form-group">
        <label className="pb-2 form_label d-block">Answer type</label>
        <select className="form-control" value={main.type} onChange={(e) => setMain({ type: e.target.value })}>
          {ANSWER_COLUMN_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="pb-2 form_label d-block">Answer column heading</label>
        <input className="form-control" value={main.label} onChange={(e) => setMain({ label: e.target.value })} />
      </div>

      <label className="pb-2 form_label d-block">Extra columns (optional)</label>
      {extras.map((c, i) => (
        <div key={c.key} className="d-flex mb-1" style={{ gap: 4 }}>
          <input
            className="form-control form-control-sm"
            value={c.label}
            aria-label="Column heading"
            onChange={(e) => setColumns(columns.map((x) => (x.key === c.key ? { ...x, label: e.target.value } : x)))}
          />
          <select
            className="form-control form-control-sm"
            value={c.type}
            aria-label="Column type"
            onChange={(e) => setColumns(columns.map((x) => (x.key === c.key ? { ...x, type: e.target.value } : x)))}
          >
            {EXTRA_COLUMN_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm btn-outline-danger" aria-label={`Remove column ${i + 2}`} onClick={() => setColumns(columns.filter((x) => x.key !== c.key))}>
            <i className="pi pi-trash" />
          </button>
        </div>
      ))}
      {columns.length < 6 ? (
        <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={addExtra}>
          <i className="pi pi-plus" /> Add a column
        </button>
      ) : null}

      {choices ? (
        <div className="form-check mb-3">
          <input id={`qt-scored-${field.id}`} type="checkbox" className="form-check-input" checked={!!field.scored} onChange={(e) => onPatch({ scored: e.target.checked })} />
          <label className="form-check-label" htmlFor={`qt-scored-${field.id}`}>
            Give points ({choices[0]} = 1, {choices[1]} = 0) and show a score
          </label>
          <small className="text-muted d-block">Use the score in a Calculation field, e.g. [{field.key || "table"}.score].</small>
        </div>
      ) : null}

      <label className="pb-2 form_label d-block">Questions</label>
      {questions.map((q, i) => {
        const earlier = questions.slice(0, i);
        const rule = q.conditions?.rules?.[0];
        const refQuestion = questions.find((x) => String(x.id) === String(rule?.row));
        return (
          <div key={q.id} className="p-2 mb-2 rounded" style={{ background: "#F7F7F7", border: "1px solid #E5E5E5" }}>
            <div className="d-flex align-items-start" style={{ gap: 4 }}>
              <span className="pt-1" style={{ minWidth: 20 }}>
                {i + 1}.
              </span>
              <textarea
                className={`form-control form-control-sm${q.text.trim() ? "" : " is-invalid"}`}
                rows={2}
                value={q.text}
                placeholder="Type the question"
                aria-label={`Question ${i + 1}`}
                onChange={(e) => patchQuestion(i, { text: e.target.value })}
              />
            </div>
            <div className="d-flex flex-wrap align-items-center mt-1" style={{ gap: 6 }}>
              <div className="form-check mb-0">
                <input id={`qt-req-${field.id}-${q.id}`} type="checkbox" className="form-check-input" checked={!!q.required} onChange={(e) => patchQuestion(i, { required: e.target.checked })} />
                <label className="form-check-label" htmlFor={`qt-req-${field.id}-${q.id}`}>
                  Required
                </label>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                <i className="pi pi-arrow-up" />
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i === questions.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                <i className="pi pi-arrow-down" />
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} aria-label="Remove question">
                <i className="pi pi-trash" />
              </button>
            </div>
            {earlier.length > 0 ? (
              <div className="mt-2">
                <small className="text-muted d-block">Show this question</small>
                <select className="form-control form-control-sm" value={rule?.row ?? ""} onChange={(e) => setCondition(i, e.target.value, choices ? choices[0] : "")} aria-label="Show this question">
                  <option value="">Always</option>
                  {earlier.map((x, j) => (
                    <option key={x.id} value={x.id}>
                      Only when question {j + 1} is answered…
                    </option>
                  ))}
                </select>
                {rule ? (
                  choices ? (
                    <select className="form-control form-control-sm mt-1" value={rule.value ?? ""} onChange={(e) => setCondition(i, String(rule.row), e.target.value)} aria-label="Answer">
                      {choices.map((c) => (
                        <option key={c} value={c}>
                          {c === "NA" ? "N/A" : c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-control form-control-sm mt-1" value={rule.value ?? ""} onChange={(e) => setCondition(i, String(rule.row), e.target.value)} aria-label="Answer" />
                  )
                ) : null}
                {rule && refQuestion ? <small className="text-muted d-block mt-1">Shown only when “{refQuestion.text || `question ${questions.indexOf(refQuestion) + 1}`}” is answered “{rule.value}”.</small> : null}
              </div>
            ) : null}
          </div>
        );
      })}
      <button type="button" className="btn btn-sm fb-btn-outline-primary mb-2" onClick={() => addQuestion()}>
        <i className="pi pi-plus" /> Add a question
      </button>
      <div className="form-group">
        <label className="pb-1 form_label d-block">Paste many questions (one per line)</label>
        <textarea className="form-control" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mt-1"
          disabled={!paste.trim()}
          onClick={() => {
            const lines = paste
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            let next = [...questions];
            lines.forEach((text) => {
              next = [...next, { ...newQuestion({ ...field, questions: next } as IFormBuilderField), text }];
            });
            setQuestions(next);
            setPaste("");
          }}
        >
          Add these
        </button>
      </div>
    </div>
  );
};

export default QuestionTableSettings;
