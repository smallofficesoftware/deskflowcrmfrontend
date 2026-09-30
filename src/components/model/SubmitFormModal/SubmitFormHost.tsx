import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import InternalFormFillView from "../../../pages/forms-internal-fill/InternalFormFillView";
import {
  IFormBuilderForm,
  listPublishedFormsForFilling,
  relatedModuleOptions,
} from "../../../pages/left-side/header/Setting/form-builder/FormBuilderController";
import { useSubmitFormStore } from "../../../store/forms/useSubmitFormStore";

// Mounted once (App.tsx). Every module's "Submit Form" menu item calls
// openSubmitForm(module, recordId); this finds the published forms linked to
// that module - none: tell the user, one: open it straight away, several:
// pick from a list first - and fills the chosen form already linked to the record.
const SubmitFormHost: React.FC = () => {
  const target = useSubmitFormStore((s) => s.target);
  const closeSubmitForm = useSubmitFormStore((s) => s.closeSubmitForm);

  const [forms, setForms] = useState<IFormBuilderForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  useEffect(() => {
    if (!target) {
      setForms([]);
      setSelectedFormId(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setSelectedFormId(null);
    (async () => {
      const res = await listPublishedFormsForFilling();
      if (cancelled) return;
      const all: IFormBuilderForm[] = res?.data?.item || [];
      const matching = all.filter((f) => f.related_module === target.relatedModule);
      setLoading(false);
      if (matching.length === 0) {
        const label =
          relatedModuleOptions.find((o) => o.id === target.relatedModule)?.label || target.relatedModule;
        toast.info(`No published form is linked to ${label}. Create one in Form Builder and set its Related Module.`);
        closeSubmitForm();
        return;
      }
      setForms(matching);
      if (matching.length === 1) setSelectedFormId(matching[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, [target, closeSubmitForm]);

  if (!target || loading) return null;

  const selectedForm = forms.find((f) => f.id === selectedFormId) || null;
  // Several forms and none picked yet -> the list; otherwise the fill screen.
  const showPicker = forms.length > 1 && !selectedForm;

  return (
    <div
      onClick={closeSubmitForm}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(98vw, 820px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#f58634 0%,#e0732a 100%)",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div className="d-flex align-items-center gap-2">
            {forms.length > 1 && selectedForm && (
              <button
                type="button"
                onClick={() => setSelectedFormId(null)}
                title="Back to forms"
                style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 6, color: "#fff", width: 30, height: 30 }}
              >
                ‹
              </button>
            )}
            <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
              {showPicker ? "Select a form to submit" : selectedForm?.title || "Submit Form"}
            </h5>
          </div>
          <button
            type="button"
            onClick={closeSubmitForm}
            style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 6, color: "#fff", width: 30, height: 30, fontSize: "1.1rem" }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {showPicker ? (
            <div className="p-3 d-flex flex-column gap-2">
              {forms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFormId(f.id)}
                  className="text-start"
                  style={{ border: "1.5px solid #e9ecef", borderRadius: 8, background: "#fff", padding: "10px 14px" }}
                >
                  <div className="fw-semibold">{f.title}</div>
                  {f.description ? (
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {f.description}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : selectedForm ? (
            <InternalFormFillView
              key={selectedForm.id}
              formId={selectedForm.id}
              presetRelatedRecordId={target.recordId}
              onSubmitted={closeSubmitForm}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SubmitFormHost;
