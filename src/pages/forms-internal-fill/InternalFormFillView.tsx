import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import FormFieldsRenderer from "../left-side/header/Setting/form-builder/FormFieldsRenderer";
import RelatedRecordPicker from "../left-side/header/Setting/form-builder/RelatedRecordPicker";
import FormBuilderBrandStyles from "../left-side/header/Setting/form-builder/formBuilderBrandStyles";
import {
  getForm,
  createSubmission,
  getReferenceOptions,
  IFormBuilderField,
} from "../left-side/header/Setting/form-builder/FormBuilderController";

interface Props {
  formId: number;
  onSubmitted?: (submissionId: number) => void;
}

// Internal, logged-in fill page — shares FormFieldsRenderer/fieldTypes.ts/
// ReferenceFieldInput.tsx with PublicFormFillView.tsx (plan §7); only the
// data-fetching layer (authenticated axiosInstance vs. anonymous public
// client) and the related-record picker's presence differ.
const InternalFormFillView: React.FC<Props> = ({ formId, onSubmitted }) => {
  const [fields, setFields] = useState<IFormBuilderField[]>([]);
  const [title, setTitle] = useState("");
  const [relatedModule, setRelatedModule] = useState<string | null>(null);
  const [relatedRecordId, setRelatedRecordId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<{ key: string; file: File }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getForm(formId);
      if (res?.data?.item) {
        const form = res.data.item;
        setTitle(form.title);
        setRelatedModule(form.related_module || null);
        try {
          const parsed = JSON.parse(form.published_schema_json || "[]");
          setFields(Array.isArray(parsed) ? parsed : []);
        } catch {
          setFields([]);
        }
      }
      setLoading(false);
    })();
  }, [formId]);

  const handleChange = (key: string, value: any) => setAnswers((prev) => ({ ...prev, [key]: value }));
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
    setErrors({});
    setSubmitting(true);
    const extra: Record<string, any> = {};
    if (relatedModule && relatedRecordId) extra.related_record_id = relatedRecordId;
    const res = await createSubmission(formId, answers, files, extra);
    setSubmitting(false);
    if (res?.ack === 1) {
      toast.success(res.ack_msg || "Submitted");
      onSubmitted?.(res.data?.item?.id);
      setAnswers({});
      setFiles([]);
    } else if (res?.ack_msg) {
      setErrors({ _form: res.ack_msg });
    }
  };

  if (loading) return <div className="p-3">Loading...</div>;

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <h4 className="mb-3">{title}</h4>
      {errors._form ? <div className="alert alert-danger">{errors._form}</div> : null}

      {relatedModule ? (
        <RelatedRecordPicker relatedModule={relatedModule} value={relatedRecordId} onChange={setRelatedRecordId} />
      ) : null}

      <FormFieldsRenderer
        fields={fields}
        answers={answers}
        errors={errors}
        onChange={handleChange}
        onFile={handleFile}
        onRepeaterFile={handleRepeaterFile}
        fetchReferenceOptions={async (master, parentId) => {
          const res = await getReferenceOptions(master, parentId);
          return res?.data?.item || [];
        }}
      />

      <button type="button" className="btn fb-btn-primary mt-3" disabled={submitting} onClick={handleSubmit}>
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
};

export default InternalFormFillView;
