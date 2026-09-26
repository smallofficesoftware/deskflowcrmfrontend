import React from "react";
import { IFormBuilderField } from "./FormBuilderController";
import SignaturePad from "./SignaturePad";
import LocationInput from "./LocationInput";
import BarcodeInput from "./BarcodeInput";
import ImageCaptureInput from "./ImageCaptureInput";
import { decimalsOf, resultLabelFor, resultTypeOf } from "./calculations";
import { presetFor, transformPresetInput } from "./formatPresets";

// width -> the app's own bootstrap grid classes (verified against
// CreateContactView.tsx: col-12 col-md-4 rows, not a Google-Forms
// single-column stack — plan §7 correction).
export const WIDTH_TO_COL_CLASS: Record<string, string> = {
  full: "col-12",
  half: "col-12 col-md-6",
  third: "col-12 col-md-4",
};

export interface FieldFillProps {
  field: IFormBuilderField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  onFile?: (file: File | null) => void;
  onBlur?: () => void;
  // Calculation fields: the live worked-out value (the server recomputes on save).
  computed?: number | string | null;
  // Auto Number: this user may type a number instead of the automatic one.
  canOverride?: boolean;
}

const baseInputClass = (error?: string) => `form-control${error ? " is-invalid input-box-error" : ""}`;

function Label({ field }: { field: IFormBuilderField }) {
  return React.createElement(
    "label",
    { className: "pb-2 form_label text-truncate d-block", title: field.label },
    field.label,
    field.required ? React.createElement("span", { className: "text-danger" }, " *") : null,
  );
}

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return React.createElement("div", { className: "field-error text-danger" }, error);
}

// Help text sits under the field as small muted text (plan A7); the
// placeholder is its own setting now.
function HelpText({ field }: { field: IFormBuilderField }) {
  if (!field.help_text) return null;
  return React.createElement("small", { className: "form-text text-muted d-block" }, field.help_text);
}

function wrap(field: IFormBuilderField, error: string | undefined, control: React.ReactNode) {
  return React.createElement(
    "div",
    { className: "form-group" },
    React.createElement(Label, { field }),
    control,
    React.createElement(HelpText, { field }),
    React.createElement(ErrorText, { error }),
  );
}

const placeholderFor = (field: IFormBuilderField) => field.placeholder || "";

const TextFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled, onBlur }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: "text",
      className: baseInputClass(error),
      value: value ?? "",
      disabled,
      placeholder: placeholderFor(field),
      inputMode: presetFor(field)?.inputMode,
      onChange: (e: any) => onChange(transformPresetInput(field, e.target.value)),
      onBlur,
    }),
  );

const TextAreaFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled, onBlur }) =>
  wrap(
    field,
    error,
    React.createElement("textarea", {
      className: baseInputClass(error),
      rows: 3,
      value: value ?? "",
      disabled,
      placeholder: placeholderFor(field),
      onChange: (e: any) => onChange(e.target.value),
      onBlur,
    }),
  );

const NumberFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled, onBlur }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: "number",
      className: baseInputClass(error),
      value: value ?? "",
      disabled,
      placeholder: placeholderFor(field),
      min: field.min ?? undefined,
      max: field.max ?? undefined,
      onChange: (e: any) => onChange(e.target.value === "" ? null : Number(e.target.value)),
      onBlur,
    }),
  );

// Date edit rule limits (plan C2): "no more than N days in the past" and
// "no future dates" become the picker's min / max so the wrong day can't be
// chosen. The server enforces the same limits on save.
function dateLimits(field: IFormBuilderField): { min?: string; max?: string } {
  const rule = field.edit_rule;
  if (!rule) return {};
  const isDateTime = field.type === "datetime";
  const fmt = (d: Date, endOfDay: boolean) => {
    const day = localToday(d);
    return isDateTime ? `${day}T${endOfDay ? "23:59" : "00:00"}` : day;
  };
  const limits: { min?: string; max?: string } = {};
  if (rule.past_days != null && rule.past_days !== "" && Number.isFinite(Number(rule.past_days))) {
    const from = new Date();
    from.setDate(from.getDate() - Number(rule.past_days));
    limits.min = fmt(from, false);
  }
  if (rule.allow_future === false) limits.max = fmt(new Date(), true);
  return limits;
}

// Time of day (plan O3).
const TimeFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: "time",
      className: baseInputClass(error),
      value: value ? String(value).slice(0, 5) : "",
      disabled,
      onChange: (e: any) => onChange(e.target.value),
    }),
  );

// Amount in rupees / percentage (plan O3): a number box with the sign beside it.
const affixFill = (side: "₹" | "%"): React.FC<FieldFillProps> => ({ field, value, onChange, error, disabled, onBlur }) =>
  wrap(
    field,
    error,
    React.createElement(
      "div",
      { className: "input-group" },
      side === "₹" ? React.createElement("span", { className: "input-group-text" }, "₹") : null,
      React.createElement("input", {
        type: "number",
        inputMode: "decimal",
        step: "0.01",
        className: baseInputClass(error),
        value: value ?? "",
        disabled,
        placeholder: placeholderFor(field),
        min: field.min ?? (side === "%" ? 0 : undefined),
        max: field.max ?? (side === "%" ? 100 : undefined),
        onChange: (e: any) => onChange(e.target.value === "" ? null : Number(e.target.value)),
        onBlur,
      }),
      side === "%" ? React.createElement("span", { className: "input-group-text" }, "%") : null,
    ),
  );
const CurrencyFill = affixFill("₹");
const PercentageFill = affixFill("%");

const DateFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: field.type === "datetime" ? "datetime-local" : "date",
      className: baseInputClass(error),
      value: value ?? "",
      disabled,
      ...dateLimits(field),
      onChange: (e: any) => onChange(e.target.value),
    }),
  );

const DropdownFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement(
      "select",
      { className: baseInputClass(error), value: value ?? "", disabled, onChange: (e: any) => onChange(e.target.value) },
      [
        React.createElement("option", { key: "_empty", value: "" }, "Select..."),
        ...(field.options || []).map((opt, i) => React.createElement("option", { key: opt, value: opt }, field.option_labels?.[i] ?? opt)),
      ],
    ),
  );

const RadioFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement(
      "div",
      null,
      (field.options || []).map((opt, i) =>
        React.createElement(
          "div",
          { className: "form-check", key: opt },
          React.createElement("input", {
            type: "radio",
            className: "form-check-input",
            checked: value === opt,
            disabled,
            onChange: () => onChange(opt),
          }),
          React.createElement("label", { className: "form-check-label" }, field.option_labels?.[i] ?? opt),
        ),
      ),
    ),
  );

const MultiSelectFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) => {
  const selected: string[] = Array.isArray(value) ? value : [];
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  };
  return wrap(
    field,
    error,
    React.createElement(
      "div",
      null,
      (field.options || []).map((opt, i) =>
        React.createElement(
          "div",
          { className: "form-check", key: opt },
          React.createElement("input", {
            type: "checkbox",
            className: "form-check-input",
            checked: selected.includes(opt),
            disabled,
            onChange: () => toggle(opt),
          }),
          React.createElement("label", { className: "form-check-label" }, field.option_labels?.[i] ?? opt),
        ),
      ),
    ),
  );
};

const RatingFill: React.FC<FieldFillProps> = ({ field, value, onChange, disabled }) => {
  const max = field.max || 5;
  return wrap(
    field,
    undefined,
    React.createElement(
      "div",
      null,
      Array.from({ length: max }, (_, i) => i + 1).map((star) =>
        React.createElement(
          "span",
          {
            key: star,
            style: { cursor: disabled ? "default" : "pointer", fontSize: 20, marginRight: 4, color: (value || 0) >= star ? "#f5a623" : "#ccc" },
            onClick: () => !disabled && onChange(star),
          },
          "★",
        ),
      ),
    ),
  );
};

const CheckboxFill: React.FC<FieldFillProps> = ({ field, value, onChange, disabled }) =>
  React.createElement(
    "div",
    { className: "form-group form-check" },
    React.createElement("input", {
      type: "checkbox",
      className: "form-check-input",
      checked: !!value,
      disabled,
      onChange: (e: any) => onChange(e.target.checked ? 1 : 0),
    }),
    React.createElement(Label, { field }),
    React.createElement(HelpText, { field }),
  );

// "I agree to the terms" tick (plan M2): the terms/notice text (field.content,
// same as an Instruction block) sits above the tick, so the visitor always
// sees what they're agreeing to. An unticked consent fails validation even
// when the field isn't otherwise marked required — see formBuilderSubmission
// Service.js's consent handling, which this mirrors.
const ConsentFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  React.createElement(
    "div",
    { className: "form-group" },
    field.content ? React.createElement("div", { className: "text-muted mb-2", style: { whiteSpace: "pre-wrap", fontSize: 13 } }, field.content) : null,
    React.createElement(
      "div",
      { className: `form-check${error ? " is-invalid" : ""}` },
      React.createElement("input", {
        type: "checkbox",
        className: "form-check-input",
        checked: !!value,
        disabled,
        onChange: (e: any) => onChange(e.target.checked ? 1 : 0),
      }),
      React.createElement(Label, { field }),
    ),
    React.createElement(ErrorText, { error }),
  );

const FileFill: React.FC<FieldFillProps> = ({ field, error, disabled, onFile }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: field.type === "image" ? "file" : "file",
      accept: field.type === "image" || field.type === "signature" ? "image/*" : undefined,
      className: baseInputClass(error),
      disabled,
      multiple: field.type === "file" && field.multiple,
      onChange: (e: any) => onFile?.(e.target.files?.[0] || null),
    }),
  );

const SignatureFill: React.FC<FieldFillProps> = ({ field, error, disabled, onFile }) =>
  wrap(field, error, React.createElement(SignaturePad, { onCapture: (f: File | null) => onFile?.(f), disabled }));

const SectionHeaderFill: React.FC<FieldFillProps> = ({ field }) =>
  React.createElement("h5", { className: "mt-3 mb-2" }, field.label);

// Static text block (plan M1) — e.g. "Take sign of division head", terms and
// conditions. Line breaks preserved; never produces an answer value.
const InstructionFill: React.FC<FieldFillProps> = ({ field }) =>
  field.content
    ? React.createElement(
        "div",
        { className: "form-group text-muted", style: { whiteSpace: "pre-wrap" } },
        field.content,
      )
    : null;

// Reserved v2 types (customer-lookup, question-table, calculation, user) —
// not buildable yet; render nothing so a schema that carries one still loads
// instead of crashing.
// Calculation (plan H, O5, O6): read-only, worked out live from the other
// answers; a result label ("Pass") shows beside a number when the builder set
// result ranges.
const CalculationFill: React.FC<FieldFillProps> = ({ field, computed }) => {
  const isDate = resultTypeOf(field) === "date";
  const text =
    computed == null || computed === ""
      ? ""
      : isDate
        ? String(computed)
        : Number(computed).toLocaleString(undefined, { minimumFractionDigits: decimalsOf(field), maximumFractionDigits: decimalsOf(field) });
  const label = isDate ? null : resultLabelFor(field, computed);
  return wrap(
    field,
    undefined,
    React.createElement(
      "div",
      { className: "d-flex align-items-center", style: { gap: 8 } },
      React.createElement("input", {
        className: "form-control",
        value: text,
        readOnly: true,
        tabIndex: -1,
        placeholder: "Worked out automatically",
        "aria-label": field.label,
        style: { background: "#F7F7F7" },
      }),
      label ? React.createElement("span", { className: "badge bg-secondary", style: { fontWeight: 600 } }, label) : null,
    ),
  );
};

// Auto number: the server assigns it (and ignores any client value), so show a
// read-only box and never call onChange.
const AutoNumberFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, canOverride }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: "text",
      className: baseInputClass(error),
      value: value ?? "",
      disabled: !canOverride,
      readOnly: !canOverride,
      maxLength: 100,
      placeholder: canOverride ? "Leave empty to number automatically" : "Auto — assigned on save",
      onChange: canOverride ? (e: any) => onChange(e.target.value) : undefined,
    }),
  );

export const FIELD_TYPE_REGISTRY: Partial<Record<string, React.FC<FieldFillProps>>> = {
  text: TextFill,
  phone: TextFill,
  email: TextFill,
  url: TextFill,
  textarea: TextAreaFill,
  address: TextAreaFill,
  number: NumberFill,
  rating: RatingFill,
  date: DateFill,
  datetime: DateFill,
  checkbox: CheckboxFill,
  consent: ConsentFill,
  switch: CheckboxFill,
  dropdown: DropdownFill,
  radio: RadioFill,
  "multi-select": MultiSelectFill,
  file: FileFill,
  signature: SignatureFill,
  image: ImageCaptureInput,
  time: TimeFill,
  currency: CurrencyFill,
  percentage: PercentageFill,
  location: LocationInput,
  barcode: BarcodeInput,
  "section-header": SectionHeaderFill,
  instruction: InstructionFill,
  "auto-number": AutoNumberFill,
  calculation: CalculationFill,
  // reference and repeater are rendered by their own dedicated components
  // (ReferenceFieldInput.tsx, RepeaterFieldInput.tsx) — too stateful
  // (cascading fetch, nested row list) to fit this simple value/onChange
  // shape, wired in directly by the fill views instead of through this map.
};

export function colClassFor(field: IFormBuilderField): string {
  if (field.type === "section-header" || field.type === "instruction") return "col-12";
  return WIDTH_TO_COL_CLASS[field.width || "full"] || "col-12";
}

// Types whose builder-set `default` is copied into a new submission.
export const DEFAULTABLE_TYPES = ["text", "textarea", "phone", "email", "url", "number", "dropdown", "radio", "currency", "percentage"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const localToday = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const localNow = (d: Date) => `${localToday(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// Starting answers for a NEW submission only (never used when an existing
// submission is being edited): "Default to today" date/datetime fields and
// builder-set default values.
export function buildInitialAnswers(fields: IFormBuilderField[]): Record<string, any> {
  const now = new Date();
  const answers: Record<string, any> = {};
  fields.forEach((f) => {
    if (!f.key) return;
    // A date nobody may change ("never editable") always starts as today.
    if ((f.default_today || f.edit_rule?.mode === "never") && (f.type === "date" || f.type === "datetime")) {
      answers[f.key] = f.type === "datetime" ? localNow(now) : localToday(now);
      return;
    }
    // Team member field: start with the person filling the form (plan E2).
    if (f.type === "user" && f.default_current_user) {
      const me = Number(localStorage.getItem("UUID"));
      if (Number.isInteger(me) && me > 0) answers[f.key] = me;
      return;
    }
    if (DEFAULTABLE_TYPES.includes(f.type) && f.default !== undefined && f.default !== null && f.default !== "") {
      if (f.type === "number" || f.type === "currency" || f.type === "percentage") {
        const n = Number(f.default);
        if (!Number.isNaN(n)) answers[f.key] = n;
        return;
      }
      answers[f.key] = f.default;
    }
  });
  return answers;
}
