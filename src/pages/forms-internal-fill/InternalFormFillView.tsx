import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import FormFieldsRenderer from "../left-side/header/Setting/form-builder/FormFieldsRenderer";
import RelatedRecordPicker from "../left-side/header/Setting/form-builder/RelatedRecordPicker";
import FormBuilderBrandStyles from "../left-side/header/Setting/form-builder/formBuilderBrandStyles";
import { buildInitialAnswers } from "../left-side/header/Setting/form-builder/fieldTypes";
import { evaluateVisibility } from "../left-side/header/Setting/form-builder/conditions";
import { approvalStagesOf, laterStageKeys, parseSettings } from "../left-side/header/Setting/form-builder/approval";
import { validateFormatPresets } from "../left-side/header/Setting/form-builder/formatPresets";
import { localizeFields, secondLanguageName } from "../left-side/header/Setting/form-builder/language";
import {
  getForm,
  createSubmission,
  getDraft,
  saveDraft,
  getReferenceOptions,
  IFormBuilderField,
  IRestricted,
} from "../left-side/header/Setting/form-builder/FormBuilderController";

interface Props {
  formId: number;
  onSubmitted?: (submissionId: number) => void;
  // The due day of a recurring form this fill answers (plan Q1); without it, today's due entry is used.
  scheduleEntryId?: number;
  // A saved draft to carry on with (plan M7).
  draftId?: number;
  onDraftSaved?: () => void;
}

// Internal, logged-in fill page — shares FormFieldsRenderer/fieldTypes.ts/
// ReferenceFieldInput.tsx with PublicFormFillView.tsx (plan §7); only the
// data-fetching layer (authenticated axiosInstance vs. anonymous public
// client) and the related-record picker's presence differ.
const InternalFormFillView: React.FC<Props> = ({ formId, onSubmitted, scheduleEntryId, draftId, onDraftSaved }) => {
  const [fields, setFields] = useState<IFormBuilderField[]>([]);
  const [title, setTitle] = useState("");
  const [relatedModule, setRelatedModule] = useState<string | null>(null);
  const [relatedRecordId, setRelatedRecordId] = useState<number | null>(null);
  // Date edit rules (plan C): may this user change locked dates?
  const [canChangeDates, setCanChangeDates] = useState(false);
  const [canOverrideAutoNumber, setCanOverrideAutoNumber] = useState(false);
  const [restricted, setRestricted] = useState<IRestricted | null>(null);
  // Approval stages (plan I): the person filling is stage 1; later stages' fields are filled by others.
  const [stages, setStages] = useState(() => [] as ReturnType<typeof approvalStagesOf>);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<{ key: string; file: File }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | undefined>(draftId);
  // Second language (plan M8): the form's translated labels, only shown once switched on.
  const [languageName, setLanguageName] = useState<string | null>(null);
  const [showSecondLanguage, setShowSecondLanguage] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getForm(formId);
      if (res?.data?.item) {
        const form = res.data.item;
        setTitle(form.title);
        setRelatedModule(form.related_module || null);
        setCanChangeDates(!!form.can_change_dates);
        setCanOverrideAutoNumber(!!form.my_form_permissions?.override_auto_number);
        setRestricted(form.restricted || null);
        setStages(approvalStagesOf(parseSettings(form.published_settings_json)));
        setLanguageName(secondLanguageName(parseSettings(form.published_settings_json)));
        try {
          const parsed = JSON.parse(form.published_schema_json || "[]");
          const list: IFormBuilderField[] = Array.isArray(parsed) ? parsed : [];
          setFields(list);
          // This screen only creates new submissions, so defaults
          // ("Default to today", default values) always apply here.
          const initial = buildInitialAnswers(list);
          // Carrying on with a draft: what was typed comes back over the defaults.
          if (draftId) {
            const draft = await getDraft(draftId);
            if (draft?.ack === 1) Object.assign(initial, draft.data.item.answers || {});
          }
          setAnswers(initial);
        } catch {
          setFields([]);
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const handleFile = (key: string, file: File | null) => {
    setFiles((prev) => {
      const rest = prev.filter((f) => f.key !== key);
      return file ? [...rest, { key, file }] : rest;
    });
  };
  const handleRepeaterFile = (repeaterKey: string, rowIndex: number, subKey: string, file: File | null) => {
    // Repeater file sub-fields upload under a path-style field key (matches
    // form_builder_submission_files.field_key's "line_items[2].receipt"
    // convention, plan §1).
    handleFile(`${repeaterKey}[${rowIndex}].${subKey}`, file);
  };

  const handleSubmit = async () => {
    // Fields hidden by a "show only when" rule are not checked.
    const visibleKeys = evaluateVisibility(fields, answers);
    const formatErrors = validateFormatPresets(
      fields.filter((f) => !f.key || visibleKeys.has(f.key)),
      answers,
      { newEntry: true },
    );
    if (Object.keys(formatErrors).length) {
      setErrors(formatErrors);
      toast.error("Please correct the highlighted fields");
      return;
    }
    setErrors({});
    setSubmitting(true);
    const extra: Record<string, any> = {};
    if (relatedModule && relatedRecordId) extra.related_record_id = relatedRecordId;
    if (scheduleEntryId) extra.schedule_entry_id = scheduleEntryId;
    if (currentDraftId) extra.draft_id = currentDraftId;
    const res = await createSubmission(formId, answers, files, extra);
    setSubmitting(false);
    if (res?.ack === 1) {
      toast.success(stages.length >= 2 ? `Submitted — now waiting for ${stages[1].name}` : res.ack_msg || "Submitted");
      onSubmitted?.(res.data?.item?.id);
      setAnswers(buildInitialAnswers(fields));
      setFiles([]);
      setCurrentDraftId(undefined);
    } else if (res?.ack_msg) {
      setErrors({ _form: res.ack_msg });
    }
  };

  // "Save and continue later" (plan M7): keeps what is typed so far — nothing is
  // checked and no number is given until the form is really submitted.
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    const res = await saveDraft(formId, answers, currentDraftId);
    setSavingDraft(false);
    if (res?.ack === 1) {
      setCurrentDraftId(res.data.item.id);
      toast.success("Draft saved — carry on later from \"My drafts\"");
      onDraftSaved?.();
    }
  };
  const hasUnsavedKinds = fields.some((f) => f.type === "file" || f.type === "image" || f.type === "signature" || (f as any).format_preset === "aadhaar");

  if (loading) return <div className="p-3">Loading...</div>;

  return (
    <div className="p-2 p-md-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-start mb-3">
        <h4 className="text-break mb-0">{title}</h4>
        {languageName ? (
          <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0 ms-2" onClick={() => setShowSecondLanguage((v) => !v)}>
            {showSecondLanguage ? "English" : languageName}
          </button>
        ) : null}
      </div>
      {errors._form ? <div className="alert alert-danger">{errors._form}</div> : null}

      {relatedModule ? (
        <RelatedRecordPicker relatedModule={relatedModule} value={relatedRecordId} onChange={setRelatedRecordId} />
      ) : null}

      <FormFieldsRenderer
        fields={localizeFields(fields, showSecondLanguage)}
        answers={answers}
        errors={errors}
        newEntry
        formId={formId}
        canChangeDates={canChangeDates}
        canOverrideAutoNumber={canOverrideAutoNumber}
        restricted={stages.length >= 2 ? { hidden: [...(restricted?.hidden || []), ...laterStageKeys(fields, stages)], masked: restricted?.masked || [], readonly: restricted?.readonly || [] } : restricted}
        onChange={handleChange}
        onFile={handleFile}
        onRepeaterFile={handleRepeaterFile}
        fetchReferenceOptions={async (master, parentId) => {
          const res = await getReferenceOptions(master, parentId);
          return res?.data?.item || [];
        }}
      />

      {hasUnsavedKinds ? <small className="text-muted d-block mt-2">A saved draft keeps what you typed, but not photos, files, signatures or Aadhaar numbers — add those when you finish.</small> : null}

      {/* Sticks to the bottom of the screen on phones (FillResponsiveStyles). */}
      <div className="fb-submit-bar">
        <button type="button" className="btn fb-btn-primary mt-3" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
        <button type="button" className="btn btn-outline-secondary mt-3 ms-2" disabled={savingDraft || submitting} onClick={handleSaveDraft}>
          {savingDraft ? "Saving..." : "Save draft"}
        </button>
      </div>
    </div>
  );
};

export default InternalFormFillView;
