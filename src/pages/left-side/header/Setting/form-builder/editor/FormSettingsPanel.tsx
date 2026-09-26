import React from "react";
import { toast } from "react-toastify";
import { IFormBuilderForm, publicFormUrl, relatedModuleOptions } from "../FormBuilderController";

interface Props {
  form: IFormBuilderForm;
  onChange: (patch: Partial<IFormBuilderForm>) => void;
  onTogglePublic: (enable: boolean) => void;
  onRegenerateLink: () => void;
  busy?: boolean;
}

// Form-level settings (title, related module, team restriction, public
// link), opened from the top bar's "Form settings" button.
const FormSettingsPanel: React.FC<Props> = ({ form, onChange, onTogglePublic, onRegenerateLink, busy }) => {
  const url = publicFormUrl(form);
  return (
    <div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-form-title">
          Form title
        </label>
        <input
          id="fb-form-title"
          className={`form-control${!form.title?.trim() ? " is-invalid" : ""}`}
          value={form.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-form-desc">
          Description
        </label>
        <textarea
          id="fb-form-desc"
          className="form-control"
          rows={3}
          placeholder="Shown under the title on the public form"
          value={form.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-form-module">
          Related Module
        </label>
        <select
          id="fb-form-module"
          className="form-control"
          value={form.related_module || ""}
          onChange={(e) => onChange({ related_module: e.target.value || null })}
        >
          <option value="">None</option>
          {relatedModuleOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-check mb-3">
        <input
          id="fb-form-restrict"
          type="checkbox"
          className="form-check-input"
          checked={!!form.restrict_to_assigned_team}
          onChange={(e) => onChange({ restrict_to_assigned_team: e.target.checked ? 1 : 0 })}
        />
        <label className="form-check-label" htmlFor="fb-form-restrict">
          Restrict to assigned team members
        </label>
      </div>
      <div className="form-group">
        <label className="pb-2 form_label d-block">Public link</label>
        {form.allow_public_submission ? (
          <div className="d-flex flex-wrap" style={{ gap: 6 }}>
            <span className="badge bg-success align-self-center">Enabled</span>
            {url ? (
              <button
                type="button"
                className="btn btn-sm fb-btn-outline-primary"
                onClick={() => {
                  navigator.clipboard.writeText(url).then(
                    () => toast.success("Link copied"),
                    () => toast.error("Could not copy — copy it from the address shown"),
                  );
                }}
              >
                Copy Link
              </button>
            ) : null}
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={onRegenerateLink}>
              Regenerate link
            </button>
            <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => onTogglePublic(false)}>
              Disable
            </button>
            {url ? <small className="text-muted w-100 text-break">{url}</small> : null}
          </div>
        ) : (
          <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={busy} onClick={() => onTogglePublic(true)}>
            Enable public link
          </button>
        )}
      </div>
    </div>
  );
};

export default FormSettingsPanel;
