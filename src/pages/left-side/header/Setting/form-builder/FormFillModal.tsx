import React from "react";
import InternalFormFillView from "../../../../forms-internal-fill/InternalFormFillView";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";

interface Props {
  formId: number;
  title: string;
  onClose: () => void;
  onSubmitted: () => void;
}

// Popup around InternalFormFillView - same look as the fill popup in
// FormBuilderListView, used by the Submissions screen's "Fill Form" button.
const FormFillModal: React.FC<Props> = ({ formId, title, onClose, onSubmitted }) => (
  <div
    onClick={onClose}
    style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ width: "min(98vw, 820px)", maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}
    >
      <FormBuilderBrandStyles />
      <div
        style={{ background: "linear-gradient(135deg,#f58634 0%,#e0732a 100%)", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
      >
        <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>{title || "Fill Form"}</h5>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 6, color: "#fff", width: 30, height: 30, fontSize: "1.1rem" }}
        >
          ×
        </button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        <InternalFormFillView formId={formId} onSubmitted={onSubmitted} key={formId} />
      </div>
    </div>
  </div>
);

export default FormFillModal;
