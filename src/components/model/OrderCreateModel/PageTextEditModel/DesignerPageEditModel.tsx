import React, { useEffect, useState } from "react";

import { ICustomInquiryFromList } from "../../../../pages/left-side/header/Setting/custom-inquiry-from/CustomInquiryFromController";
import { fetchAllDocumentTemplatesForPicker } from "../../../../pages/order-print-view/orderPrintController";

// Sibling to PageTextEditModel.tsx, same "pick from this field's own
// sources, editable per-order via this button" shape (data_type 11/12's
// local-mode usage in OrderCreateModal.tsx) — but the source here is a
// document_print_templates id, not typed text/URL. Multiple sources can be
// picked per field (checkboxes, not a single <select>) — an order can
// attach several Designer Pages from the one field at once; the stored
// value is a comma-joined id list, split back out per-id by
// orderInputMapper.js's buildExtraPages at generate time. Options come from
// this field's own admin-curated sources (__dropdownSources, sourced from
// dropdownDataMap — the same custom_field_form_datavalues rows the
// "Add Data source" admin screen manages), never a raw dump of every
// company template — staff picking per-order shouldn't be able to attach an
// unrelated doc type's template just because the company happens to own one.
const DesignerPageEditModel = ({
  show,
  onHide,
  designerPageFields,
  onLocalDataSourceChange,
}: {
  show: boolean;
  onHide: () => void;
  designerPageFields: (ICustomInquiryFromList & { __dropdownSources?: string[] })[];
  onLocalDataSourceChange: (fieldName: string, templateId: string) => void;
}) => {
  // Only fetched to resolve id -> template_name/doc_type for display —
  // the pickable list itself is __dropdownSources, not this.
  const [templates, setTemplates] = useState<
    { id: number; doc_type: string; template_name: string; is_default: number }[]
  >([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!show) return;
    fetchAllDocumentTemplatesForPicker().then(setTemplates);
    const initial: Record<string, string[]> = {};
    designerPageFields.forEach((field) => {
      initial[field.reference_column_name] = (field.data_sorce || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    });
    setSelections(initial);
  }, [show, designerPageFields]);

  const toggleSelection = (fieldName: string, templateId: string, checked: boolean) => {
    setSelections((prev) => {
      const current = prev[fieldName] || [];
      const next = checked ? [...current, templateId] : current.filter((id) => id !== templateId);
      return { ...prev, [fieldName]: next };
    });
  };

  const handleSave = () => {
    Object.entries(selections).forEach(([fieldName, templateIds]) => {
      onLocalDataSourceChange(fieldName, templateIds.join(","));
    });
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal1">
      <div className="modal-content1" style={{ maxHeight: "80%", width: "60%", overflow: "scroll" }}>
        <span className="close" onClick={onHide}>
          ×
        </span>
        <h2 className="modal-title1 form_header_text">Edit Designer Page</h2>
        <div className="m-title-2 col-12">
          <div className="head" style={{ padding: "10px" }}>
            {designerPageFields.length === 0 && <p>No Document Designer Page field configured.</p>}
            {designerPageFields.map((field) => (
              <div key={field.reference_column_name} className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  {field.title}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(field.__dropdownSources || []).map((templateId) => {
                    const t = templates.find((tpl) => String(tpl.id) === String(templateId));
                    const checked = (selections[field.reference_column_name] || []).includes(templateId);
                    return (
                      <label key={templateId} style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleSelection(field.reference_column_name, templateId, e.target.checked)}
                        />
                        {t?.template_name || templateId}
                      </label>
                    );
                  })}
                </div>
                {(field.__dropdownSources || []).length === 0 && (
                  <small className="text-muted">
                    No data sources set yet — add one via Setting → Custom Field → "Add Data source".
                  </small>
                )}
              </div>
            ))}
            {designerPageFields.length > 0 && (
              <div style={{ textAlign: "right" }}>
                <button className="modal-button2" onClick={handleSave}>
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerPageEditModel;
