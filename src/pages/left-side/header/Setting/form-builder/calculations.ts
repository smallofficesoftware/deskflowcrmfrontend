// Calculation fields (plan items H, O5, O6) — the live numbers on the fill
// screen. TypeScript copy of the backend's formBuilderCalculations.js
// applyCalculations, run on the raw answers (the server recomputes from the
// validated ones on save and is the number that counts).
//
// computeCalculations(fields, answers) -> {
//   top:  { <calculation key>: number | "YYYY-MM-DD" | null },
//   rows: { <repeater key>: [{ <calculation column key>: value | null }, ...] }
// }

import { evaluateVisibility } from "./conditions";
import { evaluateFormula, FormulaResult, parseFormula, ResolvedRef, roundResult } from "./formula";
import { IFormBuilderField } from "./FormBuilderController";
import { scoreQuestionTable, visibleQuestionIds } from "./questionTable";

export const MAX_DECIMALS = 4;
const SCORE_PARTS = ["score", "max_score", "answered"];

export function decimalsOf(field: IFormBuilderField): number {
  const d = Number(field.decimals);
  return Number.isInteger(d) && d >= 0 && d <= MAX_DECIMALS ? d : 2;
}

export function resultTypeOf(field: IFormBuilderField): "number" | "date" {
  return field.result_type === "date" ? "date" : "number";
}

// Label for a number from the field's result_ranges (highest "from" reached).
export function resultLabelFor(field: IFormBuilderField, value: any): string | null {
  const ranges: { from: any; label: any }[] = Array.isArray(field.result_ranges) ? field.result_ranges : [];
  if (value == null || !Number.isFinite(Number(value))) return null;
  const sorted = ranges
    .filter((r) => r && Number.isFinite(Number(r.from)) && String(r.label ?? "").trim())
    .sort((a, b) => Number(a.from) - Number(b.from));
  let hit: { from: any; label: any } | null = null;
  for (const r of sorted) if (Number(value) >= Number(r.from)) hit = r;
  return hit ? String(hit.label).trim() : null;
}

function refsOf(field: IFormBuilderField): string[] {
  try {
    return parseFormula(field.formula).refs;
  } catch {
    return [];
  }
}
const headOf = (ref: string) => ref.split(".")[0];

function partitionTopLevel(fields: IFormBuilderField[]) {
  const calcs = fields.filter((f) => f.type === "calculation");
  const byKey = new Map(calcs.map((f) => [f.key, f]));
  const repeaterKeys = new Set(fields.filter((f) => f.type === "repeater").map((f) => f.key));
  const usesRepeater = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of calcs) {
      if (usesRepeater.has(c.key)) continue;
      const hit = refsOf(c).some((r) => (r.includes(".") && repeaterKeys.has(headOf(r))) || (byKey.has(headOf(r)) && usesRepeater.has(headOf(r))));
      if (hit) {
        usesRepeater.add(c.key);
        changed = true;
      }
    }
  }
  return { calcs, usesRepeater };
}

// Order calculations so each comes after the ones it uses (a cycle gives []).
export function orderCalculations(calcs: IFormBuilderField[]): IFormBuilderField[] {
  const byKey = new Map(calcs.map((f) => [f.key, f]));
  const state = new Map<IFormBuilderField, number>();
  const order: IFormBuilderField[] = [];
  let cycle = false;
  function visit(f: IFormBuilderField) {
    if (cycle || state.get(f) === 2) return;
    if (state.get(f) === 1) {
      cycle = true;
      return;
    }
    state.set(f, 1);
    for (const ref of refsOf(f)) {
      const dep = byKey.get(headOf(ref));
      if (dep) visit(dep);
      if (cycle) return;
    }
    state.set(f, 2);
    order.push(f);
  }
  calcs.forEach(visit);
  return cycle ? [] : order;
}

const todayText = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function toRefValue(field: IFormBuilderField, value: any): ResolvedRef {
  return { type: field.type, value };
}

function finalValue(field: IFormBuilderField, result: FormulaResult): number | string | null {
  const rounded = roundResult(result, decimalsOf(field));
  if (resultTypeOf(field) === "date") return rounded.kind === "date" ? rounded.value : null;
  return rounded.kind === "number" ? rounded.value : null;
}

export interface ComputedCalculations {
  top: Record<string, number | string | null>;
  rows: Record<string, Record<string, number | string | null>[]>;
}

export function computeCalculations(fields: IFormBuilderField[], answers: Record<string, any>): ComputedCalculations {
  const out: ComputedCalculations = { top: {}, rows: {} };
  const hasCalc = fields.some((f) => f.type === "calculation" || (f.type === "repeater" && (f.columns || []).some((c) => c.type === "calculation")));
  if (!hasCalc) return out;

  const today = todayText();
  const safeAnswers = answers || {};
  const visible = evaluateVisibility(fields, safeAnswers);
  const byKey = new Map(fields.filter((f) => f.key).map((f) => [f.key, f]));

  // Question table scores, from the visible questions.
  const stats: Record<string, ReturnType<typeof scoreQuestionTable>> = {};
  fields
    .filter((f) => f.type === "question-table")
    .forEach((f) => {
      const grid = safeAnswers[f.key];
      const parsed = typeof grid === "string" ? safeParse(grid) : grid;
      stats[f.key] = scoreQuestionTable(f, parsed, visibleQuestionIds(f, { ...safeAnswers, [f.key]: parsed }, fields, visible));
    });

  const resolveTop = (name: string): ResolvedRef | null => {
    const [head, tail] = name.split(".");
    const f = byKey.get(head);
    if (!f) return null;
    if (tail) {
      if (f.type === "repeater") {
        const rows = Array.isArray(safeAnswers[head]) ? safeAnswers[head] : [];
        const col = (f.columns || []).find((c) => c.key === tail);
        const isCalc = col?.type === "calculation";
        return { type: "list", value: rows.map((r: any, i: number) => (isCalc ? out.rows[head]?.[i]?.[tail] ?? null : r?.[tail])) };
      }
      if (f.type === "question-table" && SCORE_PARTS.includes(tail)) return { type: "number", value: (stats[head] as any)?.[tail] ?? 0 };
      return null;
    }
    if (!visible.has(head)) return null;
    if (f.type === "calculation") return { type: resultTypeOf(f) === "date" ? "date" : "number", value: out.top[head] ?? null };
    return toRefValue(f, safeAnswers[head]);
  };

  const { calcs, usesRepeater } = partitionTopLevel(fields);
  const order = orderCalculations(calcs);
  const runTop = (f: IFormBuilderField) => {
    if (!visible.has(f.key)) {
      out.top[f.key] = null;
      return;
    }
    out.top[f.key] = finalValue(f, evaluateFormula(f.formula, { resolve: resolveTop, today }));
  };

  order.filter((f) => !usesRepeater.has(f.key)).forEach(runTop);

  for (const rep of fields.filter((f) => f.type === "repeater")) {
    const cols = Array.isArray(rep.columns) ? rep.columns : [];
    const rowCalcs = cols.filter((c) => c.type === "calculation");
    const rows = Array.isArray(safeAnswers[rep.key]) ? safeAnswers[rep.key] : [];
    out.rows[rep.key] = rows.map(() => ({}));
    if (rowCalcs.length === 0) continue;
    const rowOrder = orderCalculations(rowCalcs);
    rows.forEach((rawRow: any, i: number) => {
      const row = rawRow || {};
      const resolveRow = (name: string): ResolvedRef | null => {
        if (!name.includes(".")) {
          const col = cols.find((c) => c.key === name);
          if (col) {
            if (col.type === "calculation") return { type: resultTypeOf(col) === "date" ? "date" : "number", value: out.rows[rep.key][i][name] ?? null };
            return toRefValue(col, row[name]);
          }
        }
        return resolveTop(name);
      };
      for (const c of rowOrder) {
        out.rows[rep.key][i][c.key] = finalValue(c, evaluateFormula(c.formula, { resolve: resolveRow, today }));
      }
    });
  }

  order.filter((f) => usesRepeater.has(f.key)).forEach(runTop);
  return out;
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
