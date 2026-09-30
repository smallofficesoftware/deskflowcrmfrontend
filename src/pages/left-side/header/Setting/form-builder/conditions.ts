// Conditional (dependent) fields — plan items D2, D3, D5, D6.
//
// Line-for-line TypeScript copy of the backend's
// src/services/form_builder/formBuilderConditions.js (evaluateRule /
// evaluateVisibility / isRequired). Both sides run the same shared cases
// (conditions.fixtures.json, copied verbatim from the backend), so what the
// fill screen shows never differs from what the server accepts — the server
// still re-evaluates everything on save and is the one that counts.
//
// Field props: `conditions` ("Show this only when ...") and
// `required_conditions` ("Required only when ...") are
//   { match: "all" | "any", rules: [{ field, op, value?, row? }] }
// See the backend file for the full list of evaluation rules.

export type ConditionOperator = "is" | "is_not" | "is_empty" | "is_not_empty" | "contains" | "gt" | "lt" | "any_of";

export interface IConditionRule {
  field: string;
  op: ConditionOperator;
  value?: any;
  row?: string | number; // question-table row id (Phase 6)
}

export interface IConditionGroup {
  match?: "all" | "any";
  rules?: IConditionRule[];
}

export const CONDITION_OPERATORS: ConditionOperator[] = ["is", "is_not", "is_empty", "is_not_empty", "contains", "gt", "lt", "any_of"];
const OPERATOR_SET = new Set<string>(CONDITION_OPERATORS);

// Types that can't be the SOURCE of a rule: layout (no value), uploads (not
// part of the answers), repeater (a list of rows, not one value).
export const NON_SOURCE_TYPES = new Set(["section-header", "instruction", "file", "signature", "image", "repeater"]);
const BOOLEAN_TYPES = new Set(["checkbox", "switch"]);
const DATE_TYPES = new Set(["date", "datetime"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}([ T].*)?$/;

type AnyField = Record<string, any>;

function hasRules(group: IConditionGroup | null | undefined): boolean {
  return !!group && Array.isArray(group.rules) && group.rules.length > 0;
}

function isBlank(value: any): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return Number.isNaN(value.getTime());
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function isUnticked(value: any): boolean {
  return value === false || value === 0 || value === "0" || String(value).toLowerCase() === "false";
}

// A multi-select answer may arrive as an array, or as its stored JSON text.
function asList(field: AnyField | undefined, value: any): any[] | null {
  if (Array.isArray(value)) return value;
  if (field?.type === "multi-select" && typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* not JSON — treat as a plain value */
    }
  }
  return null;
}

function normalizeScalar(value: any): any {
  if (value === true) return 1;
  if (value === false) return 0;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true") return 1;
    if (lower === "false") return 0;
  }
  return value;
}

function toNumber(value: any): number | null {
  if (value == null || value === "" || typeof value === "object") return null;
  const num = Number(normalizeScalar(value));
  return Number.isFinite(num) ? num : null;
}

function scalarEquals(a: any, b: any): boolean {
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na != null && nb != null) return na === nb;
  if (a == null || b == null) return a == null && b == null;
  return String(normalizeScalar(a)).trim().toLowerCase() === String(normalizeScalar(b)).trim().toLowerCase();
}

function toTime(value: any): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== "string" || !DATE_PATTERN.test(value.trim())) return null;
  const t = new Date(value.trim().length === 10 ? `${value.trim()}T00:00:00` : value.trim()).getTime();
  return Number.isNaN(t) ? null : t;
}

function compare(field: AnyField | undefined, actual: any, expected: any): number | null {
  if (DATE_TYPES.has(field?.type) || (toTime(actual) != null && toTime(expected) != null)) {
    const ta = toTime(actual);
    const te = toTime(expected);
    if (ta == null || te == null) return null;
    return ta - te;
  }
  const na = toNumber(actual);
  const ne = toNumber(expected);
  if (na == null || ne == null) return null;
  return na - ne;
}

// Question-table single-row target (Phase 6 decides the grid's storage
// shape; accepts both { rowId: answer } and [{ id, answer|value }]).
function readRowValue(value: any, row: string | number): any {
  if (value == null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    const hit = value.find((r) => r && String(r.id ?? r.row) === String(row));
    if (!hit) return null;
    return hit.answer !== undefined ? hit.answer : hit.value;
  }
  const cell = value[row];
  if (cell && typeof cell === "object" && !Array.isArray(cell)) return cell.answer !== undefined ? cell.answer : cell.value;
  return cell === undefined ? null : cell;
}

interface Source {
  field?: AnyField;
  value?: any;
  hidden?: boolean;
  missing?: boolean;
}

// One rule against an already-resolved source { field, value }.
export function evaluateRule(rule: IConditionRule | null | undefined, source: Source): boolean {
  if (!rule || !OPERATOR_SET.has(rule.op)) return false;
  const field = source.field;
  let value = source.value;
  if (rule.row != null && rule.row !== "") value = readRowValue(value, rule.row);
  const list = asList(field, value);

  const empty = isBlank(list ?? value) || (BOOLEAN_TYPES.has(field?.type) && isUnticked(value));

  switch (rule.op) {
    case "is_empty":
      return empty;
    case "is_not_empty":
      return !empty;
    case "is":
      if (list) return list.some((v) => scalarEquals(v, rule.value));
      if (BOOLEAN_TYPES.has(field?.type)) return scalarEquals(empty ? 0 : 1, rule.value);
      return !isBlank(value) && scalarEquals(value, rule.value);
    case "is_not":
      if (list) return !list.some((v) => scalarEquals(v, rule.value));
      if (BOOLEAN_TYPES.has(field?.type)) return !scalarEquals(empty ? 0 : 1, rule.value);
      return isBlank(value) || !scalarEquals(value, rule.value);
    case "contains": {
      if (rule.value == null || rule.value === "") return false;
      if (list) return list.some((v) => scalarEquals(v, rule.value));
      if (isBlank(value)) return false;
      return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
    }
    case "gt":
    case "lt": {
      if (empty) return false;
      const diff = compare(field, value, rule.value);
      if (diff == null) return false;
      return rule.op === "gt" ? diff > 0 : diff < 0;
    }
    case "any_of": {
      const options = Array.isArray(rule.value) ? rule.value : rule.value == null ? [] : [rule.value];
      if (options.length === 0 || empty) return false;
      const answers = list || [BOOLEAN_TYPES.has(field?.type) ? 1 : value];
      return answers.some((a) => options.some((o: any) => scalarEquals(a, o)));
    }
    default:
      return false;
  }
}

function evaluateGroup(group: IConditionGroup | null | undefined, lookup: (key: any) => Source): boolean {
  if (!group || !hasRules(group)) return true;
  const results = (group.rules || []).map((rule) => {
    const source = lookup(rule?.field);
    if (!source || source.hidden || source.missing) return false;
    return evaluateRule(rule, source);
  });
  return group.match === "any" ? results.some(Boolean) : results.every(Boolean);
}

// One rule group against a plain list of top-level fields (rules that are
// not part of a field's own conditions, e.g. a question-table row's "show
// this question only when ..."). Mirrors the backend's evaluateConditionGroup.
export function evaluateConditionGroup(
  group: IConditionGroup | null | undefined,
  fields: AnyField[],
  answers: Record<string, any> | null | undefined,
  visibleSet: Set<string>,
): boolean {
  const byKey = keyMap(Array.isArray(fields) ? fields : []);
  const values: Record<string, any> = answers && typeof answers === "object" ? answers : {};
  return evaluateGroup(group, (key) => {
    const f = key != null ? byKey.get(key) : undefined;
    if (!f || NON_SOURCE_TYPES.has(f.type)) return { missing: true };
    if (!(visibleSet instanceof Set) || !visibleSet.has(key)) return { hidden: true };
    return { field: f, value: values[key] };
  });
}

// field -> the section-header it sits under (top-level lists only).
function sectionMap(fields: AnyField[]): Map<AnyField, AnyField> {
  const map = new Map<AnyField, AnyField>();
  let current: AnyField | null = null;
  for (const f of fields) {
    if (!f || typeof f !== "object") continue;
    if (f.type === "section-header") {
      current = f;
      continue;
    }
    if (current) map.set(f, current);
  }
  return map;
}

function keyMap(fields: AnyField[]): Map<string, AnyField> {
  const map = new Map<string, AnyField>();
  for (const f of fields) {
    if (f && f.key && !map.has(f.key)) map.set(f.key, f);
  }
  return map;
}

export interface OuterContext {
  fields: AnyField[];
  answers: Record<string, any>;
  visible: Set<string>;
}

// Set of keys of every visible field (layout fields included when they have
// a key). `outer` is only for repeater rows: { fields, answers, visible }.
export function evaluateVisibility(fields: AnyField[], answers: Record<string, any> | null | undefined, outer: OuterContext | null = null): Set<string> {
  const list = Array.isArray(fields) ? fields.filter((f) => f && typeof f === "object") : [];
  const values: Record<string, any> = answers && typeof answers === "object" ? answers : {};
  const byKey = keyMap(list);
  const sections = sectionMap(list);
  const outerByKey = outer ? keyMap(Array.isArray(outer.fields) ? outer.fields : []) : null;
  const state = new Map<AnyField, "visiting" | boolean>();

  function lookup(key: any): Source {
    if (key != null && byKey.has(key)) {
      const f = byKey.get(key) as AnyField;
      if (NON_SOURCE_TYPES.has(f.type)) return { missing: true };
      if (!isVisible(f)) return { hidden: true };
      return { field: f, value: values[key] };
    }
    if (outer && outerByKey && key != null && outerByKey.has(key)) {
      const f = outerByKey.get(key) as AnyField;
      if (NON_SOURCE_TYPES.has(f.type)) return { missing: true };
      if (!(outer.visible instanceof Set) || !outer.visible.has(key)) return { hidden: true };
      return { field: f, value: (outer.answers || {})[key] };
    }
    return { missing: true };
  }

  function isVisible(field: AnyField): boolean {
    if (state.has(field)) {
      const s = state.get(field);
      return s === "visiting" ? false : (s as boolean);
    }
    state.set(field, "visiting");
    let visible = true;
    const section = sections.get(field);
    if (section && !isVisible(section)) visible = false;
    if (visible) visible = evaluateGroup(field.conditions, lookup);
    state.set(field, visible);
    return visible;
  }

  const visibleKeys = new Set<string>();
  for (const f of list) {
    if (isVisible(f) && f.key) visibleKeys.add(f.key);
  }
  return visibleKeys;
}

// Is this field required right now? Only a visible field can be required;
// then it is when `required` is set or its required_conditions are met.
export function isRequired(
  field: AnyField | null | undefined,
  answers: Record<string, any> | null | undefined,
  visibleSet: Set<string>,
  options: { fields?: AnyField[]; outer?: OuterContext | null } = {},
): boolean {
  if (!field || !field.key || !(visibleSet instanceof Set) || !visibleSet.has(field.key)) return false;
  if (field.required) return true;
  if (!hasRules(field.required_conditions)) return false;

  const values: Record<string, any> = answers && typeof answers === "object" ? answers : {};
  const byKey = keyMap(Array.isArray(options.fields) ? options.fields : []);
  const outer = options.outer || null;
  const outerByKey = outer ? keyMap(Array.isArray(outer.fields) ? outer.fields : []) : null;

  const lookup = (key: any): Source => {
    if (key == null) return { missing: true };
    if (byKey.has(key) || (!outerByKey?.has(key) && key in values)) {
      const f = byKey.get(key) || { key };
      if (NON_SOURCE_TYPES.has(f.type)) return { missing: true };
      if (!visibleSet.has(key)) return { hidden: true };
      return { field: f, value: values[key] };
    }
    if (outer && outerByKey && outerByKey.has(key)) {
      const f = outerByKey.get(key) as AnyField;
      if (NON_SOURCE_TYPES.has(f.type)) return { missing: true };
      if (!(outer.visible instanceof Set) || !outer.visible.has(key)) return { hidden: true };
      return { field: f, value: (outer.answers || {})[key] };
    }
    return { missing: true };
  };
  return evaluateGroup(field.required_conditions, lookup);
}
