import React, { useState } from "react";
import LazyBoundary from "../../../../../../components/LazyBoundary";
import { lazyWithRetry as lazy } from "../../../../../../common/lazyWithRetry";
import { exportBlankFormPdf, IFormBuilderForm } from "../FormBuilderController";
import { IFormSettings, parseSettings } from "../approval";

// The Designer pulls in pdfme (several MB), so it loads only when the form's print layout is opened for design.
const DocumentDesignerView = lazy(() => import("../../document-designer/DocumentDesignerView"));

interface Props {
  form: IFormBuilderForm;
  onSettingsChange: (settings: IFormSettings) => void;
}

const EMPTY_OPTIONS: { id: "dash" | "line" | "hide"; label: string }[] = [
  { id: "dash", label: "A dash (Company: -)" },
  { id: "line", label: "A blank line to write on (Company: ________)" },
  { id: "hide", label: "Leave the field out" },
];

// "Print" in Form settings (plan item K): how an unanswered field prints, the
// print layout designer, and a blank copy for offline use. ("Save as template"
// was removed - Duplicate on the forms list covers it.)
const FormPrintPanel: React.FC<Props> = ({ form, onSettingsChange }) => {
  const settings = parseSettings(form.settings_json);
  const emptyMode = (settings.print?.empty_fields as "dash" | "line" | "hide") || "dash";
  const published = !!form.published_schema_json;
  const [designing, setDesigning] = useState(false);

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

      {designing ? (
        <LazyBoundary>
          <DocumentDesignerView reportMode={{ docType: `form_${form.id}`, reportName: form.title, onClose: () => setDesigning(false) }} />
        </LazyBoundary>
      ) : null}
    </div>
  );
};

export default FormPrintPanel;
