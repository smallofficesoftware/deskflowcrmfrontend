import React from "react";
import { IFormBuilderField } from "./FormBuilderController";
import SignaturePad from "./SignaturePad";

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

function wrap(field: IFormBuilderField, error: string | undefined, control: React.ReactNode) {
  return React.createElement(
    "div",
    { className: "form-group" },
    React.createElement(Label, { field }),
    control,
    React.createElement(ErrorText, { error }),
  );
}

const TextFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: "text",
      className: baseInputClass(error),
      value: value ?? "",
      disabled,
      placeholder: field.help_text || "",
      onChange: (e: any) => onChange(e.target.value),
    }),
  );

const TextAreaFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement("textarea", {
      className: baseInputClass(error),
      rows: 3,
      value: value ?? "",
      disabled,
      onChange: (e: any) => onChange(e.target.value),
    }),
  );

const NumberFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: "number",
      className: baseInputClass(error),
      value: value ?? "",
      disabled,
      min: field.min ?? undefined,
      max: field.max ?? undefined,
      onChange: (e: any) => onChange(e.target.value === "" ? null : Number(e.target.value)),
    }),
  );

const DateFill: React.FC<FieldFillProps> = ({ field, value, onChange, error, disabled }) =>
  wrap(
    field,
    error,
    React.createElement("input", {
      type: field.type === "datetime" ? "datetime-local" : "date",
      className: baseInputClass(error),
      value: value ?? "",
      disabled,
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
        ...(field.options || []).map((opt) => React.createElement("option", { key: opt, value: opt }, opt)),
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
      (field.options || []).map((opt) =>
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
          React.createElement("label", { className: "form-check-label" }, opt),
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
      (field.options || []).map((opt) =>
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
          React.createElement("label", { className: "form-check-label" }, opt),
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

export const FIELD_TYPE_REGISTRY: Record<string, React.FC<FieldFillProps>> = {
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
  switch: CheckboxFill,
  dropdown: DropdownFill,
  radio: RadioFill,
  "multi-select": MultiSelectFill,
  file: FileFill,
  signature: SignatureFill,
  image: FileFill,
  "section-header": SectionHeaderFill,
  // reference and repeater are rendered by their own dedicated components
  // (ReferenceFieldInput.tsx, RepeaterFieldInput.tsx) — too stateful
  // (cascading fetch, nested row list) to fit this simple value/onChange
  // shape, wired in directly by the fill views instead of through this map.
};

export function colClassFor(field: IFormBuilderField): string {
  if (field.type === "section-header") return "col-12";
  return WIDTH_TO_COL_CLASS[field.width || "full"] || "col-12";
}
