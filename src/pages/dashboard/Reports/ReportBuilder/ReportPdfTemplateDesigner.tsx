import { Designer } from "@pdfme/ui";
import { image, table, text } from "@pdfme/schemas";
import React, { useEffect, useRef, useState } from "react";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../../../helpers/AppConstants";
import {
  IDocumentTemplateFull,
  IDocumentTemplateListItem,
  createDocumentTemplate,
  deleteDocumentTemplate,
  discardDraftChanges,
  getDocumentTemplate,
  listDocumentTemplates,
  listTemplateVersions,
  publishDocumentTemplate,
  restoreTemplateVersion,
  setDefaultDocumentTemplate,
  updateDocumentTemplateDraft,
} from "../../../left-side/header/Setting/document-designer/DocumentDesignerController";

const plugins = { text, table, image };
const BLANK_TEMPLATE = { basePdf: { width: 210, height: 297, padding: [15, 10, 15, 10] }, schemas: [[]] };

async function loadDesignerFonts() {
  const files = ["Poppins-Regular.ttf", "Poppins-Bold.ttf", "Poppins-SemiBold.ttf"];
  const [regular, bold, semiBold] = await Promise.all(
    files.map((f) => fetch(`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/fonts/${f}`).then((r) => r.arrayBuffer())),
  );
  return {
    Poppins: { data: regular, fallback: true },
    "Poppins Bold": { data: bold },
    "Poppins SemiBold": { data: semiBold },
  };
}

interface IReportPdfTemplateDesignerProps {
  docType: string; // "report_" + report_definition_id — see backend/src/services/report_builder/reportPdfExport.js
  reportName: string;
  onClose: () => void;
}

// Reuses document_print_templates end-to-end (same table/routes/controller
// functions Document Designer already uses, see DocumentDesignerController.ts)
// with doc_type = "report_<id>" — no new backend template CRUD, this
// component is just DocumentDesignerView.tsx's mount pattern (Designer
// class, useEffect/useRef) parameterized for that convention. Trimmed vs.
// Document Designer: no reorder/import/export/system-gallery (no report
// analogue), version history + restore kept.
const ReportPdfTemplateDesigner: React.FC<IReportPdfTemplateDesignerProps> = ({ docType, reportName, onClose }) => {
  const designerContainerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const fontsPromiseRef = useRef<Promise<any> | null>(null);

  const [templates, setTemplates] = useState<IDocumentTemplateListItem[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentTemplateFull, setCurrentTemplateFull] = useState<IDocumentTemplateFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  if (!fontsPromiseRef.current) {
    fontsPromiseRef.current = loadDesignerFonts();
  }

  const refreshTemplates = async () => {
    const list = await listDocumentTemplates(docType);
    setTemplates(list);
    return list;
  };

  const mountOrUpdateDesigner = async (template: any) => {
    if (designerRef.current) {
      designerRef.current.updateTemplate(template);
      return;
    }
    const font = await fontsPromiseRef.current;
    if (!designerContainerRef.current) return;
    designerRef.current = new Designer({
      domContainer: designerContainerRef.current,
      template,
      plugins,
      options: { zoomLevel: 1, maxZoom: 500, font, sidebarOpen: true, theme: { token: { colorPrimary: "#f58634" } } },
    });
  };

  const openTemplate = async (id?: number) => {
    setLoading(true);
    const full = await getDocumentTemplate(docType, id);
    setLoading(false);
    if (!full) return;
    setCurrentTemplateId(full.id);
    setCurrentTemplateFull(full);
    mountOrUpdateDesigner(JSON.parse(full.draft_template_json));
  };

  useEffect(() => {
    (async () => {
      const list = await refreshTemplates();
      if (list.length > 0) {
        await openTemplate(list[0].id);
      } else {
        setCurrentTemplateId(null);
        setCurrentTemplateFull(null);
        mountOrUpdateDesigner(BLANK_TEMPLATE);
      }
    })();
    return () => {
      designerRef.current?.destroy();
      designerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  const handleNewTemplate = async () => {
    const name = window.prompt("Template name", `${reportName} Template ${templates.length + 1}`);
    if (!name) return;
    const startingTemplate = currentTemplateFull ? JSON.parse(currentTemplateFull.draft_template_json) : BLANK_TEMPLATE;
    const created = await createDocumentTemplate(docType, name, startingTemplate);
    if (created) {
      await refreshTemplates();
      setCurrentTemplateId(created.id);
      setCurrentTemplateFull(created);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentTemplateId || !designerRef.current) return;
    const template = designerRef.current.getTemplate();
    const ok = await updateDocumentTemplateDraft(currentTemplateId, template);
    if (ok) await refreshTemplates();
  };

  const handlePublish = async () => {
    if (!currentTemplateId) return;
    await handleSaveDraft();
    const ok = await publishDocumentTemplate(currentTemplateId);
    if (ok) await refreshTemplates();
  };

  const handleDiscardDraft = async () => {
    if (!currentTemplateId) return;
    const ok = await discardDraftChanges(currentTemplateId);
    if (ok) await openTemplate(currentTemplateId);
  };

  const handleSetDefault = async () => {
    if (!currentTemplateId) return;
    const ok = await setDefaultDocumentTemplate(currentTemplateId, docType);
    if (ok) await refreshTemplates();
  };

  const handleDelete = async () => {
    if (!currentTemplateId) return;
    if (!window.confirm("Delete this template?")) return;
    const ok = await deleteDocumentTemplate(currentTemplateId, docType);
    if (ok) {
      const list = await refreshTemplates();
      if (list.length > 0) await openTemplate(list[0].id);
      else {
        setCurrentTemplateId(null);
        setCurrentTemplateFull(null);
        mountOrUpdateDesigner(BLANK_TEMPLATE);
      }
    }
  };

  const handleShowVersions = async () => {
    if (!currentTemplateId) return;
    const rows = await listTemplateVersions(currentTemplateId);
    setVersions(rows);
    setShowVersions(true);
  };

  const handleRestoreVersion = async (version_number: number) => {
    if (!currentTemplateId) return;
    const ok = await restoreTemplateVersion(currentTemplateId, version_number);
    if (ok) {
      setShowVersions(false);
      await openTemplate(currentTemplateId);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050, display: "flex" }}>
      <div style={{ background: "#fff", margin: 20, flex: 1, display: "flex", flexDirection: "column", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #eee" }}>
          <strong>PDF Templates — {reportName}</strong>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ width: 220, borderRight: "1px solid #eee", padding: 10, overflowY: "auto" }}>
            <button className="btn btn-sm btn-primary w-100 mb-2" onClick={handleNewTemplate}>
              + New Template
            </button>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => openTemplate(t.id)}
                style={{
                  padding: "6px 8px",
                  marginBottom: 4,
                  borderRadius: 4,
                  cursor: "pointer",
                  background: t.id === currentTemplateId ? "#fdece0" : "transparent",
                  fontSize: 13,
                }}
              >
                {t.template_name}
                {!!t.is_default && <span className="badge bg-success ms-1">Default</span>}
                {!!t.has_unpublished_changes && <span className="badge bg-warning text-dark ms-1">Draft</span>}
              </div>
            ))}
            {templates.length === 0 && !loading && (
              <div className="text-muted" style={{ fontSize: 12 }}>
                No templates yet — export this report's PDF once, or click New Template.
              </div>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, padding: 8, borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
              <button className="btn btn-sm btn-outline-primary" disabled={!currentTemplateId} onClick={handleSaveDraft}>
                Save Draft
              </button>
              <button className="btn btn-sm btn-success" disabled={!currentTemplateId} onClick={handlePublish}>
                Publish
              </button>
              <button className="btn btn-sm btn-outline-secondary" disabled={!currentTemplateId} onClick={handleDiscardDraft}>
                Discard Draft
              </button>
              <button className="btn btn-sm btn-outline-secondary" disabled={!currentTemplateId} onClick={handleSetDefault}>
                Set Default
              </button>
              <button className="btn btn-sm btn-outline-secondary" disabled={!currentTemplateId} onClick={handleShowVersions}>
                Version History
              </button>
              <button className="btn btn-sm btn-outline-danger" disabled={!currentTemplateId} onClick={handleDelete}>
                Delete
              </button>
            </div>
            {showVersions && (
              <div style={{ padding: 8, borderBottom: "1px solid #eee", maxHeight: 140, overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 12 }}>Version History</strong>
                  <button className="btn btn-sm btn-link" onClick={() => setShowVersions(false)}>
                    Close
                  </button>
                </div>
                {versions.map((v) => (
                  <div key={v.version_number} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                    <span>
                      v{v.version_number} — {v.created_date_time} {v.change_note ? `(${v.change_note})` : ""}
                    </span>
                    <button className="btn btn-sm btn-link" onClick={() => handleRestoreVersion(v.version_number)}>
                      Restore
                    </button>
                  </div>
                ))}
                {versions.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>No versions yet — publish once to create one.</div>}
              </div>
            )}
            <div ref={designerContainerRef} style={{ flex: 1, minHeight: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPdfTemplateDesigner;
