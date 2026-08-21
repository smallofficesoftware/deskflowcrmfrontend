import { Designer } from "@pdfme/ui";
import { image, table, text } from "@pdfme/schemas";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { newRightsForPrint } from "../../../../../common/SharedFunction";
import { PAGE_ID } from "../../../../../helpers/AppEnum";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../../../../helpers/AppConstants";
import PromptModal from "../../../../../components/model/PromptModal";
import {
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
// backend API surface (DocumentDesignerController.ts) and the plugin/font
// mounting mechanics, which is real duplication but keeps each file's
// control flow readable on its own rather than threaded through "is this
// pick mode?" branches everywhere.
const plugins = { text, table, image };

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

const BLANK_TEMPLATE = { basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] }, schemas: [[]] };

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

  const designerContainerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const fontsPromiseRef = useRef<Promise<any> | null>(null);

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

  useEffect(() => {
    (async () => {
      const dict = await getDataDictionary(docType);
      setDictionary(dict || []);
    })();
  }, [docType]);

  const currentDataSource: string | undefined = selectedField?.schema?.dataSource || undefined;
  const isFieldBound = !!currentDataSource;
  const visibilityMode: "always" | "hideIfEmpty" =
    selectedField?.schema?.visibilityCondition?.mode === "hideIfEmpty" ? "hideIfEmpty" : "always";

  const updateSelectedFieldSchema = async (mutate: (field: any) => void) => {
    if (!selectedField || !designerRef.current) return;
    const cloned = structuredClone(designerRef.current.getTemplate());
    const field = cloned.schemas[selectedField.pageIndex][selectedField.schemaIndex];
    mutate(field);
    designerRef.current.updateTemplate(cloned);
    setSelectedField({ ...selectedField, schema: field });
    await saveDraftSilently();
  };

  const setFieldDataSource = (value: string | null) => {
    updateSelectedFieldSchema((field) => {
      if (value) field.dataSource = value;
      else delete field.dataSource;
    });
  };

  const setFieldVisibility = (mode: "always" | "hideIfEmpty") => {
    updateSelectedFieldSchema((field) => {
      if (mode === "hideIfEmpty") field.visibilityCondition = { mode: "hideIfEmpty" };
      else delete field.visibilityCondition;
    });
  };

  const insertTokenIntoSelectedField = (key: string) => {
    updateSelectedFieldSchema((field) => {
      const current = typeof field.content === "string" ? field.content : "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      field.content = `${current}${separator}{{${key}}}`;
    });
  };

  const [promptDialog, setPromptDialog] = useState<{
    title: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
  } | null>(null);

  const askPrompt = (title: string, onSubmit: (value: string) => void, defaultValue?: string) => {
    setPromptDialog({ title, onSubmit, defaultValue });
  };

  if (!fontsPromiseRef.current) {
    fontsPromiseRef.current = loadDesignerFonts();
  }

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
      options: {
        zoomLevel: 1,
        maxZoom: 500,
        font,
        sidebarOpen: true,
        theme: { token: { colorPrimary: "#f58634" } },
      },
    });
    designerRef.current.onChangeSelection((selection) => {
      const schemas = selection.schemas;
      setSelectedField(
        schemas.length === 1
          ? { name: schemas[0].name, pageIndex: schemas[0].pageIndex, schemaIndex: schemas[0].schemaIndex, schema: schemas[0].schema }
          : null,
      );
    });
  };

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

  // No setLoading()/full-screen overlay — used both by the manual
  // "Save Draft" button (which wraps this with the overlay itself, below)
  // and by updateSelectedFieldSchema's auto-save on every field-panel
  // change. The overlay on every single radio click read as the whole
  // page "refreshing".
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
        .dd-sidebar { width: 280px; flex-shrink: 0; border-right: 1px solid #ddd; padding: 12px; overflow-y: auto; }
        .dd-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        @media (max-width: 768px) {
          .dd-layout { flex-direction: column; height: auto; min-height: unset; }
          .dd-sidebar { width: 100%; max-height: 260px; border-right: none; border-bottom: 1px solid #ddd; }
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
      `}</style>
      <div className="dd-sidebar">
        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <h5 style={{ fontSize: 14 }}>{openTemplateId ? "Editing Source" : "New Source"}</h5>
        <p style={{ fontSize: 12, color: "#666" }}>
          Build the page below, then use the "Use This Template" button at the top to name and save it.
        </p>
      </div>

      <div className="dd-main">
        <div style={{ padding: "8px 12px", background: "#fff3cd", borderBottom: "1px solid #ffe69c", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
        </div>
        {selectedField && (
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #ddd", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#f8f9fa" }}>
            <strong style={{ fontSize: 12 }}>Field: {selectedField.name}</strong>
            <label className="form-check-label d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
              <input type="radio" name="bindMode" checked={!isFieldBound} onChange={() => setFieldDataSource(null)} />
              Static Text
            </label>
            <label className="form-check-label d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
              <input
                type="radio"
                name="bindMode"
                checked={isFieldBound}
                onChange={() => {
                  if (dictionary.length > 0) setFieldDataSource(dictionary[0].key);
                }}
              />
              Bound to Data
            </label>
            {isFieldBound && (
              <select
                className="form-select form-select-sm"
                style={{ width: 220 }}
                value={currentDataSource || ""}
                onChange={(e) => setFieldDataSource(e.target.value)}
              >
                {Object.entries(
                  dictionary.reduce((groups: Record<string, typeof dictionary>, d) => {
                    (groups[d.group] = groups[d.group] || []).push(d);
                    return groups;
                  }, {}),
                ).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            <div style={{ flex: 1 }} />
            <strong style={{ fontSize: 12 }}>Visibility:</strong>
            <select
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={visibilityMode}
              onChange={(e) => setFieldVisibility(e.target.value as "always" | "hideIfEmpty")}
            >
              <option value="always">Always show</option>
              <option value="hideIfEmpty">Hide if empty</option>
            </select>
          </div>
        )}
        {selectedField && selectedField.schema?.type === "text" && (
          <div style={{ padding: "6px 12px", borderBottom: "1px solid #ddd", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", background: "#fff" }}>
            <strong style={{ fontSize: 11, color: "#666" }}>Insert token:</strong>
            {dictionary.map((d) => (
              <button
                key={d.key}
                type="button"
                className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: 10, padding: "1px 6px" }}
                title={`${d.group}: ${d.label}`}
                onClick={() => insertTokenIntoSelectedField(d.key)}
              >
                {`{{${d.key}}}`}
              </button>
            ))}
          </div>
        )}
        <div style={{ padding: "4px 12px", fontSize: 12, color: "#666" }}>{status}</div>
        <div ref={designerContainerRef} style={{ flex: 1, minHeight: 480 }} />
      </div>

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
