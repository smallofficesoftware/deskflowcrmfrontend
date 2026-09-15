import React from "react";

export interface TemplateSidebarItem {
  id: number;
  template_name: string;
  is_default?: number;
  has_unpublished_changes?: number;
}

interface TemplateSidebarProps {
  templates: TemplateSidebarItem[];
  currentTemplateId: number | null;
  onOpen: (id: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRename: (id: number, currentName: string) => void;
  onDuplicate: (id: number) => void;
  onExport: (id: number, name: string) => void;
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
}

// Per-template-row list — reorder/rename/duplicate/export/set-default/delete —
// factored out of DocumentDesignerView.tsx's own Templates accordion tab so
// ReportPdfTemplateDesigner.tsx (Report Builder > Manage Templates) shares
// the exact same row UI instead of a hand-copied, drifting-over-time subset.
// Deliberately just the row list, not the "+ New Template"/Browse Gallery/
// Import cluster above it or the doc-type switcher — those differ per
// caller (Document Designer has a doc-type select + a system-template
// gallery, Report Designer has neither), so callers keep rendering their own
// header controls above this component rather than it growing an
// increasingly-conditional "extras" slot for markup only one caller uses.
const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  templates,
  currentTemplateId,
  onOpen,
  onMove,
  onRename,
  onDuplicate,
  onExport,
  onSetDefault,
  onDelete,
}) => {
  return (
    <>
      {templates.map((t, index) => (
        <div
          key={t.id}
          style={{
            border: currentTemplateId === t.id ? "2px solid #f58634" : "1px solid #ddd",
            borderRadius: 4,
            padding: 8,
            marginBottom: 8,
            cursor: "pointer",
          }}
          onClick={() => onOpen(t.id)}
        >
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {t.is_default ? "★ " : ""}
            {t.template_name}
            {t.has_unpublished_changes ? (
              <span className="badge bg-warning text-dark ms-1" style={{ fontSize: 9 }}>
                unpublished changes
              </span>
            ) : null}
          </div>
          <div className="d-flex flex-wrap gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm btn-link p-0" onClick={() => onMove(index, -1)} disabled={index === 0}>▲</button>
            <button className="btn btn-sm btn-link p-0" onClick={() => onMove(index, 1)} disabled={index === templates.length - 1}>▼</button>
            <button className="btn btn-sm btn-link p-0" onClick={() => onRename(t.id, t.template_name)}>Rename</button>
            <button className="btn btn-sm btn-link p-0" onClick={() => onDuplicate(t.id)}>Duplicate</button>
            <button className="btn btn-sm btn-link p-0" onClick={() => onExport(t.id, t.template_name)}>Export</button>
            {!t.is_default ? (
              <button className="btn btn-sm btn-link p-0" onClick={() => onSetDefault(t.id)}>Set Default</button>
            ) : null}
            <button
              className="btn btn-sm btn-link p-0 text-danger"
              onClick={() => onDelete(t.id)}
              disabled={templates.length <= 1}
              title={templates.length <= 1 ? "Can't delete the only remaining template" : ""}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default TemplateSidebar;
