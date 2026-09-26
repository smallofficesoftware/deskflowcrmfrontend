import { fieldTypeOptions, IFormBuilderField, IFormBuilderForm } from "../FormBuilderController";

// ---------- Internal field name ("key") generation (plan A3) ----------
// Lowercase a-z0-9_, starts with a letter, max 60 chars, unique in the form.
export const KEY_MAX = 60;

export function keyFromLabel(label: string): string {
  let k = (label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!k) k = "field";
  if (!/^[a-z]/.test(k)) k = `f_${k}`;
  return k.slice(0, KEY_MAX).replace(/_+$/, "");
}

export function uniqueKey(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `_${n}`;
    const candidate = `${base.slice(0, KEY_MAX - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

// Every key in use except the field at `skipIndex` — top-level keys plus all
// repeater column keys, so a name is never reused anywhere in the form.
// `skipColumn` leaves out one repeater column (the one being renamed).
export function takenKeys(fields: IFormBuilderField[], skipIndex: number, skipColumn?: { fieldIndex: number; columnIndex: number }): Set<string> {
  const taken = new Set<string>();
  fields.forEach((f, i) => {
    if (i !== skipIndex && f.key) taken.add(f.key);
    (f.columns || []).forEach((c, ci) => {
      if (skipColumn && skipColumn.fieldIndex === i && skipColumn.columnIndex === ci) return;
      if (c.key) taken.add(c.key);
    });
  });
  return taken;
}

// Field ids: positive and never reused within a form. The server names a
// repeater's child table fbs_<form>_r<field id> and rejects ids <= 0, so the
// old negative provisional ids made a new repeater unpublishable; and an id
// reused from a deleted (published) repeater would point at its old table.
// seedFieldIds() is called on load with the draft AND published schema.
let idHighWater = 0;
export const newFieldId = () => ++idHighWater;
export function seedFieldIds(...lists: IFormBuilderField[][]) {
  lists.forEach((list) =>
    list.forEach((f) => {
      if (typeof f.id === "number" && f.id > idHighWater) idHighWater = f.id;
      (f.columns || []).forEach((c) => {
        if (typeof c.id === "number" && c.id > idHighWater) idHighWater = c.id;
      });
    }),
  );
}

export const isChoiceType = (t: string) => ["dropdown", "radio", "multi-select"].includes(t);
export const isRangedType = (t: string) => ["number", "rating", "text", "textarea", "currency", "percentage"].includes(t);
export const hasPlaceholder = (t: string) => ["text", "textarea", "phone", "email", "url", "number", "address", "currency", "percentage", "barcode"].includes(t);
export const hasDefaultValue = (t: string) => ["text", "textarea", "phone", "email", "url", "number", "dropdown", "radio", "currency", "percentage"].includes(t);
export const hasFormatCheck = (t: string) => ["text", "phone", "email"].includes(t);
export const isLayoutOnly = (t: string) => ["section-header", "instruction"].includes(t);

export const normOption = (o: string) => o.trim().toLowerCase();

// Types a repeater column may use: RepeaterFieldInput renders a plain text /
// number box or a file input per cell, and sub-repeaters/references are not
// allowed (plan §1, 1 level deep).
export const REPEATER_COLUMN_TYPES = ["text", "number", "phone", "email", "url", "calculation", "file", "image", "reference"];

export const typeLabel = (t: string) => fieldTypeOptions.find((o) => o.id === t)?.label || t;

// Palette groups (plan A1). Types flagged comingSoon in fieldTypeOptions are
// dropped, exactly like the Phase 1 type picker.
export const PALETTE_GROUPS: { title: string; types: string[] }[] = [
  { title: "Basic", types: ["text", "textarea", "number", "currency", "percentage", "phone", "email", "url", "address"] },
  { title: "Choice", types: ["dropdown", "radio", "multi-select", "checkbox", "switch", "rating", "consent"] },
  { title: "Date & Time", types: ["date", "datetime", "time"] },
  { title: "Files & Sign", types: ["file", "image", "signature", "location", "barcode"] },
  { title: "Layout", types: ["section-header", "instruction"] },
  { title: "Advanced", types: ["auto-number", "calculation", "question-table", "user", "customer-lookup", "repeater", "reference"] },
].map((g) => ({ ...g, types: g.types.filter((t) => fieldTypeOptions.some((o) => o.id === t && !o.comingSoon)) }));

export const TYPE_ICONS: Record<string, string> = {
  text: "pi pi-pencil",
  textarea: "pi pi-align-left",
  number: "pi pi-hashtag",
  phone: "pi pi-phone",
  email: "pi pi-envelope",
  url: "pi pi-link",
  address: "pi pi-map-marker",
  "auto-number": "pi pi-sort-numeric-up",
  user: "pi pi-user",
  time: "pi pi-clock",
  currency: "pi pi-wallet",
  percentage: "pi pi-percentage",
  location: "pi pi-map-marker",
  barcode: "pi pi-qrcode",
  calculation: "pi pi-calculator",
  "question-table": "pi pi-list",
  "customer-lookup": "pi pi-search",
  dropdown: "pi pi-chevron-circle-down",
  radio: "pi pi-circle",
  "multi-select": "pi pi-list",
  checkbox: "pi pi-check-square",
  switch: "pi pi-power-off",
  rating: "pi pi-star",
  date: "pi pi-calendar",
  datetime: "pi pi-clock",
  file: "pi pi-paperclip",
  image: "pi pi-image",
  signature: "pi pi-file-edit",
  "section-header": "pi pi-bookmark",
  instruction: "pi pi-info-circle",
  repeater: "pi pi-table",
  reference: "pi pi-database",
  consent: "pi pi-verified",
};

const DEFAULT_LABELS: Record<string, string> = {
  "section-header": "New Section",
  instruction: "Instruction",
  repeater: "Items",
  consent: "I agree to the terms",
};

// A new field of the given type, ready to pass the pre-save checks where it
// can (choices pre-filled, a repeater gets one column).
export function newField(type: string, taken: Set<string>): IFormBuilderField {
  const label = DEFAULT_LABELS[type] || typeLabel(type);
  const key = uniqueKey(keyFromLabel(label), taken);
  const field: IFormBuilderField = {
    id: newFieldId(),
    key,
    type,
    label,
    width: "full",
    visible_to: "both",
  };
  if (isChoiceType(type)) field.options = ["Option 1", "Option 2"];
  if (type === "repeater") {
    const colKey = uniqueKey(keyFromLabel("Item"), new Set([...Array.from(taken), key]));
    field.columns = [{ id: newFieldId(), key: colKey, type: "text", label: "Item" }];
  }
  if (type === "instruction") field.content = "";
  // A consent tick almost always must be agreed to before the form can be sent.
  if (type === "consent") {
    field.content = "";
    field.required = true;
  }
  // Question table: one empty question and a Yes / No answer to start from.
  if (type === "question-table") {
    field.questions = [{ id: "q1", text: "" }];
    field.answer_columns = [{ key: "answer", label: "Yes / No", type: "yes_no" }];
  }
  if (type === "calculation") {
    field.formula = "";
    field.result_type = "number";
    field.decimals = 2;
  }
  return field;
}

// Copy of a field with a fresh id and fresh, unique names (plan A6).
export function duplicateOf(field: IFormBuilderField, fields: IFormBuilderField[]): IFormBuilderField {
  const taken = takenKeys(fields, -1);
  const label = `${field.label} (copy)`;
  const key = uniqueKey(keyFromLabel(label), taken);
  taken.add(key);
  const columns = field.columns?.map((c) => {
    const ck = uniqueKey(keyFromLabel(c.label || c.key), taken);
    taken.add(ck);
    return { ...c, id: newFieldId(), key: ck };
  });
  return { ...JSON.parse(JSON.stringify(field)), id: newFieldId(), key, label, ...(columns ? { columns } : {}) };
}

// Index of the last field that belongs to the section starting at `i`
// (a section runs until the next section-header).
export function sectionEnd(fields: IFormBuilderField[], i: number): number {
  let j = i + 1;
  while (j < fields.length && fields[j].type !== "section-header") j++;
  return j - 1;
}

// Plain-language checks before save/publish (plan A8). Returns the first
// problem found, or null.
// Published names are never re-checked for format: they are fixed for good.
export function findFieldProblem(fields: IFormBuilderField[], publishedKeys: Set<string>): string | null {
  const seen = new Map<string, string>();
  const checkKey = (key: string, name: string): string | null => {
    if (!key || (!publishedKeys.has(key) && !/^[a-z][a-z0-9_]*$/.test(key))) {
      return `The internal name of "${name}" must start with a letter and use only letters, numbers and _`;
    }
    const other = seen.get(key);
    if (other !== undefined) return `Two fields have the same name ("${other}" and "${name}") — rename one`;
    seen.set(key, name);
    return null;
  };
  for (const f of fields) {
    const name = f.label?.trim();
    if (!name) return "Every field needs a name";
    if (f.type === "instruction" && !f.content?.trim()) return `Add some text to "${name}"`;
    const keyProblem = checkKey(f.key, name);
    if (keyProblem) return keyProblem;
    if (isChoiceType(f.type)) {
      const opts = f.options || [];
      if (!opts.length) return `Add at least one choice to "${name}"`;
      if (opts.some((o) => !o.trim())) return `"${name}" has an empty choice — fill it in or remove it`;
      if (new Set(opts.map(normOption)).size !== opts.length) return `"${name}" has the same choice twice — remove one`;
    }
    if (f.type === "repeater") {
      const cols = f.columns || [];
      if (!cols.length) return `Add at least one column to "${name}"`;
      for (const c of cols) {
        const colName = c.label?.trim();
        if (!colName) return `Every column in "${name}" needs a name`;
        const colProblem = checkKey(c.key, `${name} → ${colName}`);
        if (colProblem) return colProblem;
      }
    }
  }
  return null;
}

export function findFormProblem(form: IFormBuilderForm): string | null {
  if (!form.title?.trim()) return "Give the form a title (Form settings)";
  return null;
}

// Every key in a schema, repeater columns included.
export function allKeys(fields: IFormBuilderField[]): Set<string> {
  const keys = new Set<string>();
  fields.forEach((f) => {
    if (f.key) keys.add(f.key);
    (f.columns || []).forEach((c) => c.key && keys.add(c.key));
  });
  return keys;
}
