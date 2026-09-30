import React, { useState } from "react";
import { toast } from "react-toastify";
import DocumentDesignerView from "../../document-designer/DocumentDesignerView";
import { exportBlankFormPdf, IFormBuilderForm, saveTemplateFromForm } from "../FormBuilderController";
import { IFormSettings, parseSettings } from "../approval";

interface Props {
  form: IFormBuilderForm;
  onSettingsChange: (settings: IFormSettings) => void;
}

const EMPTY_OPTIONS: { id: "dash" | "line" | "hide"; label: string }[] = [
  { id: "dash", label: "A dash (Company: -)" },
  { id: "line", label: "A blank line to write on (Company: ________)" },
  { id: "hide", label: "Leave the field out" },
];

// "Print and templates" in Form settings (plan items K, L3): how an unanswered
// field prints, the print layout designer, a blank copy for offline use, and
// "Save as template".
const FormPrintPanel: React.FC<Props> = ({ form, onSettingsChange }) => {
  const settings = parseSettings(form.settings_json);
  const emptyMode = (settings.print?.empty_fields as "dash" | "line" | "hide") || "dash";
  const published = !!form.published_schema_json;
  const [designing, setDesigning] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    const res = await saveTemplateFromForm(form.id, templateName.trim());
    setSaving(false);
    if (res?.ack === 1) {
      toast.success("Template saved — pick it under “Start from” when you create a new form");
      setTemplateName("");
    }
  };

  return (
    <div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-print-empty">
          On the printed PDF, an unanswered field shows
        </label>
        <select
          id="fb-print-empty"
          className="form-control"
          value={emptyMode}
          onChange={(e) => onSettingsChange({ ...settings, print: { ...(settings.print || {}), empty_fields: e.target.value } })}
        >
          {EMPTY_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <small className="text-muted d-block">Fields hidden by a “show only when” rule are never printed.</small>
      </div>

      <div className="d-flex flex-wrap mb-3" style={{ gap: 6 }}>
        <button
          type="button"
          className="btn btn-sm fb-btn-outline-primary"
          disabled={!published}
          title={published ? "Move things around, add your logo, change fonts" : "Publish the form first"}
          onClick={() => setDesigning(true)}
        >
          <i className="pi pi-file-pdf" /> Design the print layout
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={!published}
          onClick={async () => {
            const res = await exportBlankFormPdf(form.id);
            if (res?.data?.fileUrl) window.open(res.data.fileUrl, "_blank");
          }}
        >
          Print blank form
        </button>
      </div>
      <small className="text-muted d-block mb-3">
        The print layout is made for you and follows the form. Once you design it yourself it stays exactly as you left it. (“Preview with real data” inside the designer isn't available for forms — use
        the PDF button on an entry to check.)
      </small>

      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-template-name">
          Save this form as a template
        </label>
        <div className="input-group">
          <input id="fb-template-name" className="form-control" value={templateName} maxLength={150} placeholder="Template name" onChange={(e) => setTemplateName(e.target.value)} />
          <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={saving || !templateName.trim()} onClick={saveTemplate}>
            Save
          </button>
        </div>
        <small className="text-muted d-block">Saves the fields as they are in the editor now (including unsaved-to-published changes).</small>
      </div>

      {designing ? <DocumentDesignerView reportMode={{ docType: `form_${form.id}`, reportName: form.title, onClose: () => setDesigning(false) }} /> : null}
    </div>
  );
};

export default FormPrintPanel;
