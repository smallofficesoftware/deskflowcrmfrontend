import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getForm,
  updateDraftForm,
  publishForm,
  discardDraftForm,
  togglePublicLink,
  regenerateShareToken,
  fieldTypeOptions,
  relatedModuleOptions,
  referenceMasterOptions,
  publicFormUrl,
  IFormBuilderField,
  IFormBuilderForm,
} from "./FormBuilderController";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";

interface Props {
  formId: number;
  onClose?: () => void;
}

let nextFieldId = -1; // negative, provisional client-side ids for never-published new fields until the server assigns real ones on save
const newFieldId = () => nextFieldId--;

function emptyField(): IFormBuilderField {
  return { id: newFieldId(), key: "", type: "text", label: "New Field", width: "full", visible_to: "both" };
}

// Builder's own field-management screen — a vertical list of field-config
// cards, NOT a pdfme drag/drop canvas (plan §7: this is a config-editing
// tool, a separate concern from how the rendered fill page looks — that
// correction only applied to the fill page's own layout, not this editor).
const FormBuilderEditorView: React.FC<Props> = ({ formId, onClose }) => {
  const [form, setForm] = useState<IFormBuilderForm | null>(null);
  const [fields, setFields] = useState<IFormBuilderField[]>([]);
  const [publishedKeys, setPublishedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getForm(formId);
      if (res?.data?.item) {
        const f = res.data.item as IFormBuilderForm;
        setForm(f);
        try {
          setFields(JSON.parse(f.schema_json || "[]"));
        } catch {
          setFields([]);
        }
        try {
          const published = JSON.parse(f.published_schema_json || "[]") as IFormBuilderField[];
          setPublishedKeys(new Set(published.map((p) => p.key)));
        } catch {
          setPublishedKeys(new Set());
        }
      }
    })();
  }, [formId]);

  const updateField = (index: number, patch: Partial<IFormBuilderField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };
  const removeField = (index: number) => setFields((prev) => prev.filter((_, i) => i !== index));
  const addField = () => setFields((prev) => [...prev, emptyField()]);
  const moveField = (index: number, dir: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const saveDraft = async () => {
    if (!form) return;
    setSaving(true);
    const res = await updateDraftForm({
      id: form.id,
      title: form.title,
      description: form.description,
      related_module: form.related_module,
      restrict_to_assigned_team: form.restrict_to_assigned_team,
      schema_json: fields,
    });
    setSaving(false);
    if (res?.ack === 1) toast.success("Draft saved");
  };

  const doPublish = async () => {
    if (!form) return;
    setPublishing(true);
    const res = await publishForm(form.id, form.version);
    setPublishing(false);
    if (res?.ack === 1) {
      toast.success("Form published");
      setPublishedKeys(new Set(fields.map((f) => f.key)));
      setForm(res.data.item);
    } else if (res?.code === 409) {
      toast.error("This form changed elsewhere — reload and try again");
    }
  };

  const isChoiceType = (t: string) => ["dropdown", "radio", "multi-select"].includes(t);
  const isRangedType = (t: string) => ["number", "rating", "text", "textarea"].includes(t);

  if (!form) return <div className="p-3">Loading...</div>;

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{form.title}</h4>
        <div>
          {onClose ? (
            <button className="btn btn-link" onClick={onClose}>
              Close
            </button>
          ) : null}
          <button className="btn btn-outline-secondary me-2" disabled={saving} onClick={saveDraft}>
            Save Draft
          </button>
          <button className="btn btn-outline-warning me-2" onClick={async () => (await discardDraftForm(form.id)) && window.location.reload()}>
            Discard Draft
          </button>
          <button className="btn fb-btn-primary" disabled={publishing} onClick={doPublish}>
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Related Module</label>
            <select
              className="form-control"
              value={form.related_module || ""}
              onChange={(e) => setForm({ ...form, related_module: e.target.value || null })}
            >
              <option value="">None</option>
              {relatedModuleOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="form-group form-check mt-4">
            <input
              type="checkbox"
              className="form-check-input"
              checked={!!form.restrict_to_assigned_team}
              onChange={(e) => setForm({ ...form, restrict_to_assigned_team: e.target.checked ? 1 : 0 })}
            />
            <label className="form-check-label">Restrict to assigned team members</label>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="form-group mt-2">
            <label className="pb-2 form_label d-block">Public link</label>
            {form.allow_public_submission ? (
              <div>
                <span className="badge bg-success me-2">Enabled</span>
                {publicFormUrl(form) ? (
                  <button
                    className="btn btn-sm fb-btn-outline-primary me-2"
                    onClick={() => {
                      const url = publicFormUrl(form);
                      if (!url) return;
                      navigator.clipboard.writeText(url).then(
                        () => toast.success("Link copied"),
                        () => toast.error("Could not copy — copy it from the address shown"),
                      );
                    }}
                  >
                    Copy Link
                  </button>
                ) : null}
                <button className="btn btn-sm btn-outline-secondary" onClick={async () => (await regenerateShareToken(form.id)) && window.location.reload()}>
                  Regenerate link
                </button>
                <button className="btn btn-sm btn-outline-danger ms-2" onClick={async () => (await togglePublicLink(form.id, false)) && window.location.reload()}>
                  Disable
                </button>
              </div>
            ) : (
              <button className="btn btn-sm fb-btn-outline-primary" onClick={async () => (await togglePublicLink(form.id, true)) && window.location.reload()}>
                Enable public link
              </button>
            )}
          </div>
        </div>
      </div>

      <h5>Fields</h5>
      {fields.map((field, index) => {
        const locked = publishedKeys.has(field.key);
        return (
          <div className="card mb-2 p-3" key={field.id}>
            <div className="row">
              <div className="col-12 col-md-3">
                <div className="form-group">
                  <label className="pb-2 form_label d-block">Label</label>
                  <input className="form-control" value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                </div>
              </div>
              <div className="col-12 col-md-2">
                <div className="form-group">
                  <label className="pb-2 form_label d-block">Key</label>
                  <input
                    className="form-control"
                    value={field.key}
                    disabled={locked}
                    placeholder="lowercase_snake_case"
                    onChange={(e) => updateField(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                  />
                </div>
              </div>
              <div className="col-12 col-md-2">
                <div className="form-group">
                  <label className="pb-2 form_label d-block">Type</label>
                  <select className="form-control" value={field.type} disabled={locked} onChange={(e) => updateField(index, { type: e.target.value })}>
                    {fieldTypeOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-2">
                <div className="form-group">
                  <label className="pb-2 form_label d-block">Width</label>
                  <select className="form-control" value={field.width || "full"} onChange={(e) => updateField(index, { width: e.target.value as any })}>
                    <option value="full">Full</option>
                    <option value="half">Half</option>
                    <option value="third">Third</option>
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="form-check mt-4">
                  <input type="checkbox" className="form-check-input" checked={!!field.required} onChange={(e) => updateField(index, { required: e.target.checked })} />
                  <label className="form-check-label">Required</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" checked={!!field.filterable} onChange={(e) => updateField(index, { filterable: e.target.checked })} />
                  <label className="form-check-label">Filterable</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" checked={!!field.unique} onChange={(e) => updateField(index, { unique: e.target.checked })} />
                  <label className="form-check-label">Unique</label>
                </div>
              </div>
            </div>

            {isChoiceType(field.type) ? (
              <div className="row">
                <div className="col-12">
                  <div className="form-group">
                    <label className="pb-2 form_label d-block">Options (comma-separated)</label>
                    <input
                      className="form-control"
                      value={(field.options || []).join(", ")}
                      onChange={(e) => updateField(index, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {field.type === "reference" ? (
              <div className="row">
                <div className="col-12 col-md-4">
                  <div className="form-group">
                    <label className="pb-2 form_label d-block">Master</label>
                    <select className="form-control" value={field.master || ""} onChange={(e) => updateField(index, { master: e.target.value })}>
                      <option value="">Select...</option>
                      {referenceMasterOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="form-group">
                    <label className="pb-2 form_label d-block">Cascades from field key</label>
                    <input className="form-control" value={field.cascades_from || ""} onChange={(e) => updateField(index, { cascades_from: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : null}

            {isRangedType(field.type) ? (
              <div className="row">
                <div className="col-12 col-md-3">
                  <div className="form-group">
                    <label className="pb-2 form_label d-block">Min</label>
                    <input type="number" className="form-control" value={field.min ?? ""} onChange={(e) => updateField(index, { min: e.target.value === "" ? null : Number(e.target.value) })} />
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="form-group">
                    <label className="pb-2 form_label d-block">Max</label>
                    <input type="number" className="form-control" value={field.max ?? ""} onChange={(e) => updateField(index, { max: e.target.value === "" ? null : Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            ) : null}

            {["text", "phone", "email"].includes(field.type) && form.related_module === "contact" ? (
              <div className="row">
                <div className="col-12 col-md-4">
                  <div className="form-group">
                    <label className="pb-2 form_label d-block">Use for duplicate-customer matching</label>
                    <select className="form-control" value={field.match_key || ""} onChange={(e) => updateField(index, { match_key: (e.target.value || null) as any })}>
                      <option value="">No</option>
                      <option value="email">Match by email</option>
                      <option value="phone">Match by phone</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {field.type === "file" ? (
              <div className="row">
                <div className="col-12 col-md-3">
                  <div className="form-check mt-2">
                    <input type="checkbox" className="form-check-input" checked={!!field.multiple} onChange={(e) => updateField(index, { multiple: e.target.checked })} />
                    <label className="form-check-label">Allow multiple files</label>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-2">
              <button className="btn btn-sm btn-outline-secondary me-1" disabled={index === 0} onClick={() => moveField(index, -1)}>
                ↑
              </button>
              <button className="btn btn-sm btn-outline-secondary me-1" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)}>
                ↓
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => removeField(index)}>
                Remove Field
              </button>
            </div>
          </div>
        );
      })}

      <button className="btn fb-btn-outline-primary" onClick={addField}>
        + Add Field
      </button>
    </div>
  );
};

export default FormBuilderEditorView;
