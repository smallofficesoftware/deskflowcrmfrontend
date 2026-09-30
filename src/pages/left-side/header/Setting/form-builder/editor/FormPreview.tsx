import React, { useMemo, useState } from "react";
import { getReferenceOptions, IFormBuilderField } from "../FormBuilderController";
import FormFieldsRenderer from "../FormFieldsRenderer";
import { buildInitialAnswers } from "../fieldTypes";

interface Props {
  title: string;
  description?: string;
  fields: IFormBuilderField[];
}

// Live preview (plan A5): the REAL fill renderer (FormFieldsRenderer +
// fieldTypes.ts), interactive but with no submit. Mobile = a ~375px frame;
// bootstrap's col-md-* classes follow the browser window, not the frame, so
// in mobile mode every field is shown full width (what a phone gets) and the
// frame carries fb-force-mobile, which switches repeaters to stacked cards
// exactly like the fill screens' small-screen CSS.
const FormPreview: React.FC<Props> = ({ title, description, fields }) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [answers, setAnswers] = useState<Record<string, any>>(() => buildInitialAnswers(fields));
  const shownFields = useMemo(
    () => (device === "mobile" ? fields.map((f) => ({ ...f, width: "full" as const })) : fields),
    [device, fields],
  );

  return (
    <div>
      <div className="d-flex align-items-center justify-content-center flex-wrap mb-3" style={{ gap: 8 }}>
        <div className="fb-seg" role="group" aria-label="Preview width">
          <button type="button" className={device === "desktop" ? "active" : ""} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
            <i className="pi pi-desktop" /> Desktop
          </button>
          <button type="button" className={device === "mobile" ? "active" : ""} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
            <i className="pi pi-mobile" /> Mobile
          </button>
        </div>
        <button type="button" className="btn btn-sm btn-link" onClick={() => setAnswers(buildInitialAnswers(fields))}>
          Clear answers
        </button>
      </div>
      <div className="fb-preview-wrap">
        <div className={`fb-preview-frame${device === "mobile" ? " fb-preview-mobile fb-force-mobile" : ""}`}>
          <h4 className="mb-1">{title}</h4>
          {description ? <p className="text-muted mb-3">{description}</p> : null}
          {!fields.length ? <div className="text-muted">No fields yet.</div> : null}
          <FormFieldsRenderer
            fields={shownFields}
            answers={answers}
            newEntry
            onChange={(key, value) => setAnswers((prev) => ({ ...prev, [key]: value }))}
            onFile={() => undefined}
            onRepeaterFile={() => undefined}
            fetchReferenceOptions={async (master, parentId) => {
              const res = await getReferenceOptions(master, parentId);
              return res?.data?.item || [];
            }}
          />
          <div className="fb-submit-bar">
            <button type="button" className="btn fb-btn-primary mt-3" disabled title="Preview only — nothing is submitted">
              Submit (preview only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
