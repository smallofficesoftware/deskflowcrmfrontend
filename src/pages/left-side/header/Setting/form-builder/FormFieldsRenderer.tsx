import React, { useMemo, useState } from "react";
import { IFormBuilderField, IRestricted } from "./FormBuilderController";
import { FIELD_TYPE_REGISTRY, colClassFor } from "./fieldTypes";
import { evaluateVisibility, isRequired } from "./conditions";
import ReferenceFieldInput from "./ReferenceFieldInput";
import RepeaterFieldInput from "./RepeaterFieldInput";
import CustomerLookupInput from "./CustomerLookupInput";
import QuestionTableInput from "./QuestionTableInput";
import { computeCalculations } from "./calculations";
import { scoreQuestionTable, visibleQuestionIds } from "./questionTable";
import { checkFormat, presetFor } from "./formatPresets";
import FillResponsiveStyles from "./FillResponsiveStyles";

interface Props {
  fields: IFormBuilderField[];
  answers: Record<string, any>;
  errors?: Record<string, string>;
  disabled?: boolean;
  // True when filling a brand-new entry (both fill views today); an edit
  // screen leaves it off so a masked Aadhaar value left unchanged passes.
  newEntry?: boolean;
  // Date edit rules (plan C): can this user change locked dates? Public
  // forms never can (the server sets those dates, so they are left out).
  canChangeDates?: boolean;
  isPublic?: boolean;
  // Customer lookup (plan F): the form being filled (the search checks the caller
  // can fill it) and labels of already-saved customers (edit screen).
  formId?: number;
  initialLabels?: Record<string, string>;
  // Auto Number: may this user type a number? (form permission "override_auto_number")
  canOverrideAutoNumber?: boolean;
  // Fields this user may not fully see or change (plan O8): hidden are left out,
  // masked show as ••••, read-only can't be edited.
  restricted?: IRestricted | null;
  onChange: (key: string, value: any) => void;
  onFile: (key: string, file: File | null) => void;
  onRepeaterFile: (repeaterKey: string, rowIndex: number, subKey: string, file: File | null) => void;
  fetchReferenceOptions: (master: string, parentId?: number) => Promise<{ id: number; label: string }[]>;
}

// A date / datetime field this user may not change (plan C2): "never
// editable", or "only with the change-dates permission" without it.
export function isLockedDate(field: IFormBuilderField, canChangeDates: boolean): boolean {
  if (field.type !== "date" && field.type !== "datetime") return false;
  const mode = field.edit_rule?.mode;
  return mode === "never" || (mode === "permission" && !canChangeDates);
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
  newEntry,
  canChangeDates = false,
  isPublic = false,
  formId,
  initialLabels,
  canOverrideAutoNumber = false,
  restricted = null,
  onChange,
  onFile,
  onRepeaterFile,
  fetchReferenceOptions,
}) => {
  // Format-preset (plan O1) messages raised on blur; submit-time errors from
  // the parent view (`errors`) take precedence.
  const [blurErrors, setBlurErrors] = useState<Record<string, string>>({});
  const runFormatCheck = (field: IFormBuilderField, value: any) => {
    const msg = checkFormat(field, value, { newEntry });
    setBlurErrors((prev) => {
      if ((prev[field.key] || null) === msg) return prev;
      const next = { ...prev };
      if (msg) next[field.key] = msg;
      else delete next[field.key];
      return next;
    });
  };

  // "Show only when" / "Required only when" rules (plan D): which fields are
  // visible right now, and which are required because of their rule. The
  // server re-checks everything on save.
  const hiddenKeys = useMemo(() => new Set(restricted?.hidden || []), [restricted]);
  const maskedKeys = useMemo(() => new Set(restricted?.masked || []), [restricted]);
  const readonlyKeys = useMemo(() => new Set(restricted?.readonly || []), [restricted]);
  const isLocked = (key: string) => !!disabled || readonlyKeys.has(key);

  const shownFields = useMemo(() => {
    const visible = evaluateVisibility(fields, answers);
    return fields
      .filter((f) => !f.key || (visible.has(f.key) && !hiddenKeys.has(f.key)))
      .filter((f) => !(isPublic && isLockedDate(f, canChangeDates)))
      .map((f) => {
        const required = isRequired(f, answers, visible, { fields });
        return required === !!f.required ? f : { ...f, required };
      });
  }, [fields, answers, isPublic, canChangeDates, hiddenKeys]);

  // Live calculations and question-table state, from the answers so far.
  const calc = useMemo(() => computeCalculations(fields, answers), [fields, answers]);
  const visibleAll = useMemo(() => evaluateVisibility(fields, answers), [fields, answers]);

  const rows: IFormBuilderField[][] = [];
  let current: IFormBuilderField[] = [];
  for (const field of shownFields) {
    if (field.type === "section-header" || field.type === "instruction" || field.type === "repeater" || field.type === "question-table" || (field.width || "full") === "full") {
      if (current.length) rows.push(current);
      rows.push([field]);
      current = [];
      continue;
    }
    current.push(field);
  }
  if (current.length) rows.push(current);

  return (
    <div className="fb-fill">
      <FillResponsiveStyles />
      {rows.map((rowFields, i) => (
        <div className="row" key={i}>
          {rowFields.map((field) => {
            if (maskedKeys.has(field.key)) {
              return (
                <div className={colClassFor(field)} key={field.key}>
                  <div className="form-group">
                    <label className="pb-2 form_label text-truncate d-block" title={field.label}>
                      {field.label}
                    </label>
                    <input className="form-control" value="••••" readOnly disabled aria-label={`${field.label} (restricted)`} />
                    <small className="text-muted">Restricted — you don't have permission to see or change this.</small>
                  </div>
                </div>
              );
            }
            if (field.type === "question-table") {
              const grid = answers[field.key];
              const visibleIds = visibleQuestionIds(field, answers, fields, visibleAll);
              return (
                <QuestionTableInput
                  key={field.key}
                  field={field}
                  value={grid}
                  visibleIds={visibleIds}
                  stats={scoreQuestionTable(field, typeof grid === "string" ? undefined : grid, visibleIds)}
                  error={errors[field.key]}
                  disabled={isLocked(field.key)}
                  onChange={(v) => onChange(field.key, v)}
                />
              );
            }
            if (field.type === "customer-lookup") {
              return (
                <div className={colClassFor(field)} key={field.key}>
                  <CustomerLookupInput
                    field={field}
                    value={answers[field.key] ?? null}
                    initialLabel={initialLabels?.[field.key]}
                    formId={formId}
                    error={errors[field.key]}
                    disabled={isLocked(field.key)}
                    onChange={(v) => onChange(field.key, v)}
                    onFill={(values) => Object.entries(values).forEach(([k, v]) => onChange(k, v))}
                  />
                </div>
              );
            }
            if (field.type === "reference" || field.type === "user") {
              const parentValue = field.cascades_from ? answers[field.cascades_from] : undefined;
              return (
                <div className={colClassFor(field)} key={field.key}>
                  <ReferenceFieldInput
                    field={field.type === "user" ? { ...field, master: "user" } : field}
                    value={answers[field.key] ?? null}
                    onChange={(v) => onChange(field.key, v)}
                    parentValue={parentValue}
                    error={errors[field.key]}
                    disabled={isLocked(field.key)}
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
                  disabled={isLocked(field.key)}
                  computedRows={calc.rows[field.key]}
                  outerFields={fields}
                  outerAnswers={answers}
                  outerVisible={visibleAll}
                  formId={formId}
                  fetchReferenceOptions={fetchReferenceOptions}
                />
              );
            }
            const Comp = FIELD_TYPE_REGISTRY[field.type];
            if (!Comp) return null;
            const isFileType = ["file", "signature", "image"].includes(field.type);
            const hasPreset = !!presetFor(field);
            return (
              <div className={colClassFor(field)} key={field.key}>
                <Comp
                  field={field}
                  value={answers[field.key]}
                  onChange={(v) => {
                    // Once a format message is showing, re-check as they type so
                    // it clears the moment the value is fixed.
                    if (hasPreset && blurErrors[field.key]) runFormatCheck(field, v);
                    onChange(field.key, v);
                  }}
                  error={errors[field.key] || blurErrors[field.key]}
                  disabled={isLocked(field.key) || isLockedDate(field, canChangeDates)}
                  onFile={isFileType ? (f) => onFile(field.key, f) : undefined}
                  onBlur={hasPreset ? () => runFormatCheck(field, answers[field.key]) : undefined}
                  computed={field.type === "calculation" ? calc.top[field.key] : undefined}
                  canOverride={field.type === "auto-number" ? canOverrideAutoNumber : undefined}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default FormFieldsRenderer;
