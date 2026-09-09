import React from "react";
import { IFormBuilderField } from "./FormBuilderController";
import { FIELD_TYPE_REGISTRY, colClassFor } from "./fieldTypes";
import ReferenceFieldInput from "./ReferenceFieldInput";
import RepeaterFieldInput from "./RepeaterFieldInput";

interface Props {
  fields: IFormBuilderField[];
  answers: Record<string, any>;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
  onFile: (key: string, file: File | null) => void;
  onRepeaterFile: (repeaterKey: string, rowIndex: number, subKey: string, file: File | null) => void;
  fetchReferenceOptions: (master: string, parentId?: number) => Promise<{ id: number; label: string }[]>;
}

// Shared by InternalFormFillView.tsx and PublicFormFillView.tsx (plan §7)
// — same field-type registry, same grid layout driven by each field's
// `width` (col-12/col-md-6/col-md-4, matching CreateContactView.tsx's real
// convention, not a Google-Forms single-column stack). Fields are grouped
// into Bootstrap rows, breaking to a new row whenever a full-width field or
// section-header is hit.
const FormFieldsRenderer: React.FC<Props> = ({
  fields,
  answers,
  errors = {},
  disabled,
  onChange,
  onFile,
  onRepeaterFile,
  fetchReferenceOptions,
}) => {
  const rows: IFormBuilderField[][] = [];
  let current: IFormBuilderField[] = [];
  for (const field of fields) {
    if (field.type === "section-header" || field.type === "repeater" || (field.width || "full") === "full") {
      if (current.length) rows.push(current);
      rows.push([field]);
      current = [];
      continue;
    }
    current.push(field);
  }
  if (current.length) rows.push(current);

  return (
    <>
      {rows.map((rowFields, i) => (
        <div className="row" key={i}>
          {rowFields.map((field) => {
            if (field.type === "reference") {
              const parentValue = field.cascades_from ? answers[field.cascades_from] : undefined;
              return (
                <div className={colClassFor(field)} key={field.key}>
                  <ReferenceFieldInput
                    field={field}
                    value={answers[field.key] ?? null}
                    onChange={(v) => onChange(field.key, v)}
                    parentValue={parentValue}
                    error={errors[field.key]}
                    disabled={disabled}
                    fetchOptions={fetchReferenceOptions}
                  />
                </div>
              );
            }
            if (field.type === "repeater") {
              return (
                <RepeaterFieldInput
                  key={field.key}
                  field={field}
                  rows={answers[field.key] || []}
                  onChange={(v) => onChange(field.key, v)}
                  onFile={(rowIndex, subKey, file) => onRepeaterFile(field.key, rowIndex, subKey, file)}
                  errors={errors[field.key] ? [errors[field.key]] : []}
                  disabled={disabled}
                />
              );
            }
            const Comp = FIELD_TYPE_REGISTRY[field.type];
            if (!Comp) return null;
            const isFileType = ["file", "signature", "image"].includes(field.type);
            return (
              <div className={colClassFor(field)} key={field.key}>
                <Comp
                  field={field}
                  value={answers[field.key]}
                  onChange={(v) => onChange(field.key, v)}
                  error={errors[field.key]}
                  disabled={disabled}
                  onFile={isFileType ? (f) => onFile(field.key, f) : undefined}
                />
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};

export default FormFieldsRenderer;
