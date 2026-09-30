// Question table field (plan item G) — frontend helpers. TypeScript copy of
// the parts of the backend's formBuilderQuestionTable.js the screens need:
// the column / question lists with their defaults, which questions are
// visible, and the score. The server validates and stores the grid; this
// only drives what the fill screen shows.
//
// Saved / submitted value: { "q1": { "answer": "Yes", "c2": "SP-1" }, ... }
// (the main answer is always stored under "answer").

import { evaluateConditionGroup } from "./conditions";
import { IFormBuilderField } from "./FormBuilderController";

export const MAIN_ANSWER_KEY = "answer";
export const ANSWER_COLUMN_TYPES: { id: string; label: string }[] = [
  { id: "yes_no", label: "Yes / No" },
  { id: "yes_no_na", label: "Yes / No / Not applicable" },
  { id: "pass_fail", label: "Pass / Fail" },
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "checkbox", label: "Tick box" },
];
export const EXTRA_COLUMN_TYPES: { id: string; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
];

export interface IQuestion {
  id: string;
  text: string;
  required?: boolean;
  conditions?: { match?: "all" | "any"; rules?: { field: string; op: string; value?: any; row?: string }[] };
  points?: Record<string, number>;
}
export interface IAnswerColumn {
  key: string;
  label: string;
  type: string;
}

const CHOICES: Record<string, string[]> = {
  yes_no: ["Yes", "No"],
  yes_no_na: ["Yes", "No", "NA"],
  pass_fail: ["Pass", "Fail"],
};
const DEFAULT_POINTS: Record<string, Record<string, number>> = {
  yes_no: { Yes: 1, No: 0 },
  yes_no_na: { Yes: 1, No: 0 },
  pass_fail: { Pass: 1, Fail: 0 },
};

export const choicesFor = (type: string): string[] | null => CHOICES[type] || null;

export function answerColumnsOf(field: IFormBuilderField): IAnswerColumn[] {
  const columns: IAnswerColumn[] = Array.isArray(field.answer_columns) ? field.answer_columns.filter((c: any) => c && typeof c === "object") : [];
  return columns.length ? columns : [{ key: MAIN_ANSWER_KEY, label: "Answer", type: "yes_no" }];
}

export function questionsOf(field: IFormBuilderField): IQuestion[] {
  return Array.isArray(field.questions) ? field.questions.filter((q: any) => q && typeof q === "object" && q.id != null) : [];
}

// Which questions are visible for these answers ("show this question only
// when ..." rules on rows of this table or on other fields).
export function visibleQuestionIds(
  field: IFormBuilderField,
  answers: Record<string, any>,
  fields: IFormBuilderField[],
  visibleSet: Set<string>,
): Set<string> {
  const ids = new Set<string>();
  for (const q of questionsOf(field)) {
    const group = q.conditions;
    const ok = !group || !Array.isArray(group.rules) || group.rules.length === 0 || evaluateConditionGroup(group as any, fields, answers, visibleSet);
    if (ok) ids.add(String(q.id));
  }
  return ids;
}

export interface QuestionStats {
  score: number;
  max_score: number;
  answered: number;
}

// Score of a grid (only when field.scored) — same rules as the backend.
export function scoreQuestionTable(field: IFormBuilderField, grid: any, visibleIds: Set<string> | null = null): QuestionStats {
  const stats: QuestionStats = { score: 0, max_score: 0, answered: 0 };
  if (!grid || typeof grid !== "object") return stats;
  const main = answerColumnsOf(field)[0];
  for (const q of questionsOf(field)) {
    const qid = String(q.id);
    if (visibleIds && !visibleIds.has(qid)) continue;
    const cell = grid[qid];
    const answer = cell ? cell[MAIN_ANSWER_KEY] : undefined;
    if (answer !== undefined && answer !== "") stats.answered += 1;
    if (!field.scored) continue;
    const points = q.points && typeof q.points === "object" ? q.points : DEFAULT_POINTS[main.type];
    if (!points) continue;
    if (answer === "NA") continue;
    const values = Object.values(points).map(Number).filter(Number.isFinite);
    if (values.length > 0) stats.max_score += Math.max(...values);
    if (answer !== undefined && Number.isFinite(Number(points[answer]))) stats.score += Number(points[answer]);
  }
  return stats;
}

// A new question with an id that has never been used in this table.
export function newQuestion(field: IFormBuilderField): IQuestion {
  const used = new Set(questionsOf(field).map((q) => String(q.id)));
  let n = used.size + 1;
  while (used.has(`q${n}`)) n += 1;
  return { id: `q${n}`, text: "" };
}
