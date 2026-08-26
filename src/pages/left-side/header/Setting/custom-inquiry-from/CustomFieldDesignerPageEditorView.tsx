import { image, table, text } from "@pdfme/schemas";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { newRightsForPrint } from "../../../../../common/SharedFunction";
import { extendPluginWithFieldSettings, setFieldSettingsDictionary } from "../../../../../common/pdfmeDesigner/pdfmeFieldSettingsPlugin";
import { PDFME_HIDE_NATIVE_PAGE_MENU_CSS } from "../../../../../common/pdfmeDesigner/pdfmeStyles";
import { usePageManipulation } from "../../../../../common/pdfmeDesigner/usePageManipulation";
import { useDesignerInstance } from "../../../../../common/pdfmeDesigner/useDesignerInstance";
import { PAGE_ID } from "../../../../../helpers/AppEnum";
import { axiosInstance } from "../../../../../services/axiosInstance";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import PromptModal from "../../../../../components/model/PromptModal";
import {
  applyOptionsToDraft,
  createDocumentTemplate,
  getDataDictionary,
  getDocumentTemplate,
  publishDocumentTemplate,
} from "../document-designer/DocumentDesignerController";

// Dedicated editor for the "Document Designer Page" custom field type
// (data_type 14) — reached ONLY from DesignerPageDataSourceView.tsx's "Open
// Document Designer" / per-source "Edit" actions
// (/custom-field/designer-page-editor?fieldId=&fieldTitle=&docType=&
// autoNew=1 or &openTemplateId=&sourceRowId=). Deliberately a separate
// component/route from DocumentDesignerView.tsx (/document-designer, the
// normal per-doc-type template manager), not that same component branching
// on a query param — the two are purely independent code, sharing only the
// backend API surface (DocumentDesignerController.ts).
//
// Font loading, the field-settings propPanel merge, the Designer mount
// routine, and Page Before/After/Remove Page all live in
// src/common/pdfmeDesigner/ now — shared with DocumentDesignerView.tsx and
// ProductPageDesignerEditorView.tsx, so a fix there fixes it here too.
const plugins = {
  text: extendPluginWithFieldSettings(text, "textFieldSettings", true),
  table,
  image: extendPluginWithFieldSettings(image, "imageFieldSettings", false),
};

// Seeds a fresh page with the SAME "Header: Details" company banner
// Document Designer's own templates start from (companyName/companyAddress/
// pageNumber in basePdf.staticSchema) — a truly empty canvas (no staticSchema
// at all) left this editor showing nothing at all on first open, which read
// as "the header setting isn't working here." No company-specific data is
// baked in (content stays pdfme's own "Type Something..." placeholder —
// real values are injected fresh at generate time via withCompanyHeader,
// never stored), so this is safe to hardcode: it's byte-identical to what
// POST document-templates/apply-options {header:{headerVariant:"details"}}
// itself returns for a blank template (captured directly from that endpoint,
// not hand-reconstructed). The header-variant dropdown below lets the admin
// switch to Image/Logo Left/Logo Right once the page is first saved.
const BLANK_TEMPLATE = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [25, 10, 15, 10],
    headerVariant: "details",
    footerImage: false,
    headerHeightMM: 18,
    footerHeightMM: 15,
    staticSchema: [
      {
        name: "companyName", type: "text", content: "Type Something...",
        position: { x: 10, y: 5 }, width: 190, height: 8, rotate: 0,
        alignment: "center", verticalAlignment: "middle", fontSize: 14,
        textFormat: "plain", overflow: "visible", fontVariantFallback: "synthetic",
        lineHeight: 1, characterSpacing: 0, fontColor: "#000000",
        backgroundColor: "#cfcfcf", borderColor: "#000000",
        borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        opacity: 1, strikethrough: false, underline: false, dataSource: "companyName",
      },
      {
        name: "companyAddress", type: "text", content: "Type Something...",
        position: { x: 10, y: 13 }, width: 190, height: 10, rotate: 0,
        alignment: "center", verticalAlignment: "top", fontSize: 8,
        textFormat: "plain", overflow: "visible", fontVariantFallback: "synthetic",
        lineHeight: 1.3, characterSpacing: 0, fontColor: "#000000",
        backgroundColor: "", borderColor: "#000000",
        borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        opacity: 1, strikethrough: false, underline: false, dataSource: "companyAddress",
      },
      {
        name: "pageNumber", type: "text", content: "Page {currentPage} of {totalPages}",
        position: { x: 180, y: 287 }, width: 20, height: 5, rotate: 0,
        alignment: "right", verticalAlignment: "top", fontSize: 8,
        textFormat: "plain", overflow: "visible", fontVariantFallback: "synthetic",
        lineHeight: 1, characterSpacing: 0, fontColor: "#000000",
        backgroundColor: "", borderColor: "#000000",
        borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        opacity: 1, strikethrough: false, underline: false, dataSource: "pageNumber", readOnly: true,
      },
    ],
  },
  schemas: [[]],
};

const CustomFieldDesignerPageEditorView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get("fieldId");
  const fieldTitle = searchParams.get("fieldTitle") || "";
  const docType = searchParams.get("docType") || "quotation";
  const autoNew = searchParams.get("autoNew") === "1";
  const openTemplateId = searchParams.get("openTemplateId");
  const sourceRowId = searchParams.get("sourceRowId");
  const autoNewFiredRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const [rights, setRights] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const result = await newRightsForPrint(PAGE_ID.DOCUMENT_DESIGNER_RIGHTS, localStorage.getItem("UUID"));
      setRights(result || {});
    })();
  }, []);
  const canView = rights?.view === 1;

  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentTemplateName, setCurrentTemplateName] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [dictionary, setDictionary] = useState<{ key: string; label: string; group: string }[]>([]);
  const [selectedField, setSelectedField] = useState<{
    name: string;
    pageIndex: number;
    schemaIndex: number;
    schema: any;
  } | null>(null);
  const { designerContainerRef, designerRef, designerMounted, mountOrUpdateDesigner } = useDesignerInstance(
    plugins,
    setSelectedField,
  );

  useEffect(() => {
    (async () => {
      const dict = await getDataDictionary(docType);
      setDictionary(dict || []);
    })();
  }, [docType]);
  setFieldSettingsDictionary(dictionary);

  // Same "live on the draft" header swap as DocumentDesignerView.tsx — works
  // on a blank canvas too (applyTemplateOptions rebuilds basePdf.staticSchema
  // fresh from getTemplate(), doesn't require one to already exist). Only
  // usable once a real row exists (currentTemplateId), same as Save
  // Draft/Publish here — a fresh autoNew session must be saved via "Use This
  // Template" first.
  const applyHeaderVariant = async (headerVariant: string) => {
    if (!currentTemplateId || !designerRef.current) return;
    const updated = await applyOptionsToDraft(currentTemplateId, docType, { header: { headerVariant } });
    if (updated) designerRef.current.updateTemplate(updated);
  };

  const [promptDialog, setPromptDialog] = useState<{
    title: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
  } | null>(null);

  const askPrompt = (title: string, onSubmit: (value: string) => void, defaultValue?: string) => {
    setPromptDialog({ title, onSubmit, defaultValue });
  };

  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const { targetPageNumber, setTargetPageNumber, addPageBefore, addPageAfter, removeCurrentPage } = usePageManipulation(
    designerRef,
    selectedField,
    askConfirm,
  );

  const openTemplate = async (id: number) => {
    setLoading(true);
    const full = await getDocumentTemplate(docType, id);
    setLoading(false);
    if (!full) {
      // getDocumentTemplate already toasts the reason (network failure or
      // ack:0 "Template not found") — a stale/deleted source id reached via
      // "Edit" in DesignerPageDataSourceView.tsx's list would otherwise
      // leave this page's canvas silently blank with no way forward.
      navigate(-1);
      return;
    }
    setCurrentTemplateId(full.id);
    setCurrentTemplateName(full.template_name);
    mountOrUpdateDesigner(JSON.parse(full.draft_template_json));
  };

  useEffect(() => {
    if (!fieldId) return;
    if (openTemplateId) {
      openTemplate(Number(openTemplateId));
      return;
    }
    if (autoNew && !autoNewFiredRef.current) {
      autoNewFiredRef.current = true;
      // Deliberately NOT calling createDocumentTemplate here — that would
      // persist a real row the moment this page opens, before the user has
      // done anything, so canceling/navigating away without finishing would
      // leave an orphaned "Untitled Designer Page" cluttering this doc
      // type's real template list. The blank canvas stays purely in-memory
      // (currentTemplateId null) until "Use This Template" is clicked,
      // which creates it then.
      setCurrentTemplateId(null);
      setCurrentTemplateName(null);
      setSelectedField(null);
      mountOrUpdateDesigner(BLANK_TEMPLATE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  const saveDraftSilently = async () => {
    if (!currentTemplateId || !designerRef.current) return;
    const template = designerRef.current.getTemplate();
    const ok = await axiosInstance.post("document-templates/update", {
      company_masters_id: localStorage.getItem("COMPANY_ID"),
      a_application_login_id: localStorage.getItem("UUID"),
      id: currentTemplateId,
      template_json: template,
    });
    if (ok.data?.ack === 1) setStatus("Draft saved.");
  };

  const handleUseAsDataSource = async () => {
    // currentTemplateId is null for a fresh autoNew session (nothing
    // persisted yet) — expected here, not a guard failure; only designerRef
    // needs to actually be mounted.
    if (!fieldId || !designerRef.current) return;
    askPrompt(
      "Name this Data Source",
      async (name) => {
        setSaving(true);
        try {
          const getUUID = localStorage.getItem("UUID");
          let templateId = currentTemplateId;

          if (!templateId) {
            // Never-saved autoNew session — create it now, for real, with
            // the name the user just gave it.
            const created = await createDocumentTemplate(
              docType,
              name || "Untitled Designer Page",
              designerRef.current.getTemplate(),
              "extra_page",
            );
            if (!created) {
              toast.error("Failed to create template");
              return;
            }
            templateId = created.id;
            setCurrentTemplateId(created.id);
          } else if (name && name !== currentTemplateName) {
            await axiosInstance.post("document-templates/update", {
              company_masters_id: localStorage.getItem("COMPANY_ID"),
              a_application_login_id: getUUID,
              id: templateId,
              template_name: name,
            });
          }

          // generateDocument.js's buildDesignerPageBytes reads
          // published_template_json, not the draft — without this, the
          // page would silently never render (no error, just absent from
          // the generated PDF).
          if (currentTemplateId) await saveDraftSilently();
          await publishDocumentTemplate(templateId);
          await axiosInstance.post("createCustomFieldDatavalues", {
            a_application_login_id: getUUID,
            custom_field_master_id: fieldId,
            data_source: String(templateId),
            editValue: sourceRowId ? Number(sourceRowId) : 0,
          });
          toast.success("Data source saved");
          navigate(-1);
        } catch (e) {
          console.error(e);
          toast.error("Failed to save source");
        } finally {
          setSaving(false);
        }
      },
      currentTemplateName || undefined,
    );
  };

  if (!fieldId) {
    return <div className="p-4">Missing field — open this page via a custom field's "Add Data source" action.</div>;
  }

  if (rights === null) {
    return <div className="p-4">Loading...</div>;
  }

  if (!canView) {
    return <div className="p-4">You don't have permission to view this page.</div>;
  }

  return (
    <div className="dd-layout">
      <style>{`
        .dd-layout { display: flex; height: 100vh; }
        .dd-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        @media (max-width: 768px) {
          .dd-layout { flex-direction: column; height: auto; min-height: unset; }
        }
        .dd-layout .btn-primary { background-color: #f58634; border-color: #f58634; }
        .dd-layout .btn-primary:hover, .dd-layout .btn-primary:focus { background-color: #d9701f; border-color: #d9701f; }
        .dd-layout .btn-outline-primary { color: #f58634; border-color: #f58634; }
        .dd-layout .btn-outline-primary:hover { background-color: #f58634; border-color: #f58634; color: #fff; }
        .dd-layout input[type="checkbox"]:checked,
        .dd-layout input[type="radio"]:checked { background-color: #f58634; border-color: #f58634; }
        .dd-layout .form-select:focus,
        .dd-layout .form-control:focus,
        .dd-layout input:focus { border-color: #f58634; box-shadow: 0 0 0 0.2rem rgba(245, 134, 52, 0.25); }
        ${PDFME_HIDE_NATIVE_PAGE_MENU_CSS}
      `}</style>
      <div className="dd-main">
        <div style={{ padding: "8px 12px", background: "#fff3cd", borderBottom: "1px solid #ffe69c", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
            &larr; Back
          </button>
          <strong style={{ fontSize: 12 }}>
            Picking a Designer Page{fieldTitle ? ` for "${fieldTitle}"` : ""} — open/build a template below, then:
          </strong>
          <button
            className="btn btn-sm"
            style={{ background: "#f58634", color: "#fff" }}
            onClick={handleUseAsDataSource}
            disabled={saving}
          >
            {saving ? "Saving..." : "Use This Template"}
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <div style={{ flex: 1 }} />
          <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }} title="Page these buttons act on">
            Page
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 55 }}
              min={1}
              value={targetPageNumber}
              onChange={(e) => setTargetPageNumber(Number(e.target.value))}
              disabled={!designerMounted}
            />
          </label>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={addPageBefore}
            disabled={!designerMounted}
            title="Inserts a blank page before the page number above"
          >
            + Page Before
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={addPageAfter}
            disabled={!designerMounted}
            title="Inserts a blank page after the page number above"
          >
            + Page After
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={removeCurrentPage}
            disabled={!designerMounted}
            title="Removes the page number above"
          >
            Remove Page
          </button>
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            onChange={(e) => applyHeaderVariant(e.target.value)}
            defaultValue="details"
            disabled={!currentTemplateId}
            title={!currentTemplateId ? "Save via \"Use This Template\" first" : "Company header style for this page"}
          >
            <option value="details">Header: Details</option>
            <option value="image">Header: Image</option>
            <option value="logoLeft">Header: Logo Left</option>
            <option value="logoRight">Header: Logo Right</option>
          </select>
        </div>
        <div style={{ padding: "4px 12px", fontSize: 12, color: "#666" }}>{status}</div>
        <div ref={designerContainerRef} style={{ flex: 1, minHeight: 480 }} />
      </div>

      <ConfirmationModal
        show={!!confirmDialog}
        onHide={() => setConfirmDialog(null)}
        handleSubmit={() => {
          confirmDialog?.onConfirm();
          setConfirmDialog(null);
        }}
        title="Please Confirm"
        message={confirmDialog?.message}
        btn1="Cancel"
        btn2="Confirm"
      />

      <PromptModal
        show={!!promptDialog}
        onHide={() => setPromptDialog(null)}
        onSubmit={(value) => {
          promptDialog?.onSubmit(value);
          setPromptDialog(null);
        }}
        title={promptDialog?.title || ""}
        defaultValue={promptDialog?.defaultValue}
      />

      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          Loading...
        </div>
      )}
    </div>
  );
};

export default CustomFieldDesignerPageEditorView;
