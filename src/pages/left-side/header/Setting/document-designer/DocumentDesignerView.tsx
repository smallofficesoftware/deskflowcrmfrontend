import { Designer } from "@pdfme/ui";
import { image, table, text } from "@pdfme/schemas";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { newRightsForPrint } from "../../../../../common/SharedFunction";
import { PAGE_ID } from "../../../../../helpers/AppEnum";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../../../../helpers/AppConstants";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import PromptModal from "../../../../../components/model/PromptModal";
import {
  IDocumentTemplateFull,
  IDocumentTemplateListItem,
  applyOptionsToDraft,
  copyFromSystemTemplate,
  createDocumentTemplate,
  deleteDocumentTemplate,
  discardDraftChanges,
  duplicateDocumentTemplate,
  exportDocumentTemplate,
  getDataDictionary,
  getDocumentTemplate,
  importDocumentTemplate,
  listDocumentTemplates,
  listSystemTemplates,
  listTemplateVersions,
  publishDocumentTemplate,
  reorderDocumentTemplates,
  restoreTemplateVersion,
  setDefaultDocumentTemplate,
} from "./DocumentDesignerController";

// All 10 cart-shaped doc types templates.js's DOC_TYPES / dataDictionary.js's
// CART_DOC_DICTIONARY / orderServices.js's PDFME_DOC_TYPE_BY_CART_TYPE
// support, plus 4 non-cart system documents (accountStatement,
// accountTransaction, taskDueList, shippingLabel) whose canvas is editable
// here but whose header-variant/column-toggle toolbar and "real data"
// preview stay cart-only — see CART_SHAPED_DOC_TYPES below. Stock In/Out
// still needs its own engine + dictionary before it can be added.
const SUPPORTED_DOC_TYPES = [
  { id: "quotation", label: "Quotation" },
  { id: "salesOrder", label: "Sales Order" },
  { id: "salesInvoice", label: "Sales Invoice" },
  { id: "purchaseOrder", label: "Purchase Order" },
  { id: "purchaseInvoice", label: "Purchase Invoice" },
  { id: "returnSalesInvoice", label: "Return Sales Invoice" },
  { id: "returnPurchaseInvoice", label: "Return Purchase Invoice" },
  { id: "inward", label: "Goods Received Note (GRN)" },
  { id: "dispatch", label: "Dispatch" },
  { id: "proformaInvoice", label: "Proforma Invoice" },
  { id: "accountStatement", label: "Account Statement" },
  { id: "accountTransaction", label: "Account Transaction" },
  { id: "taskDueList", label: "Task Due List" },
  { id: "shippingLabel", label: "Shipping Label" },
];
// listOrder's own order_type filter — mirrors orderServices.js's
// PDFME_DOC_TYPE_BY_CART_TYPE (cart.type), just keyed the other direction.
const CART_TYPE_BY_DOC_TYPE: Record<string, number> = {
  quotation: 1,
  salesOrder: 2,
  salesInvoice: 3,
  purchaseInvoice: 4,
  purchaseOrder: 5,
  returnSalesInvoice: 6,
  returnPurchaseInvoice: 7,
  inward: 8,
  dispatch: 9,
  proformaInvoice: 12,
};
// Header-variant/column-toggle toolbar and "Generate Preview" (real order
// data or the cart-shaped sample data) only make sense for the 10 cart docs
// above — the 4 system doc types have their own fixed layout/sample data
// that applyOptionsToDraft and previewDocumentTemplate don't know how to
// touch yet (backend guards + rejects both for non-cart-shaped doc_types).
const CART_SHAPED_DOC_TYPES = new Set(Object.keys(CART_TYPE_BY_DOC_TYPE));
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

const DocumentDesignerView: React.FC = () => {
  const navigate = useNavigate();
  // AppContext.permissions is only populated by LeftSideView's onLoad call —
  // this page is reached as its own top-level route (not one of the
  // state-toggled panels other Setting sub-pages use, which stay nested
  // inside an already-mounted LeftSideView), so a direct/hard-reloaded
  // navigation here never mounts LeftSideView at all and permissions would
  // stay empty forever. Fetch this page's own rights independently instead —
  // same pattern PrintSettingModal already uses for the same reason
  // (see newRightsForPrint in SharedFunction.tsx).
  const [rights, setRights] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const result = await newRightsForPrint(PAGE_ID.DOCUMENT_DESIGNER_RIGHTS, localStorage.getItem("UUID"));
      setRights(result || {});
    })();
  }, []);
  const canView = rights?.view === 1;
  const canEdit = rights?.edit === 1;
  const canAdd = rights?.add === 1;

  const designerContainerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const fontsPromiseRef = useRef<Promise<any> | null>(null);

  const [docType, setDocType] = useState<string>("quotation");
  const [templates, setTemplates] = useState<IDocumentTemplateListItem[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentTemplateFull, setCurrentTemplateFull] = useState<IDocumentTemplateFull | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTemplates, setGalleryTemplates] = useState<any[]>([]);
  const [showPreviewPicker, setShowPreviewPicker] = useState(false);
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewOrders, setPreviewOrders] = useState<any[]>([]);
  const [hasAnyOrders, setHasAnyOrders] = useState<boolean | null>(null);

  // Data-binding + visibility panel for the currently-selected canvas field
  // (§3/§6 — "Static Text / Bound to Data" toggle sourced from the real
  // data dictionary, and a "Hide if empty" visibility condition). Both are
  // read/written directly on the selected field's schema object; nothing
  // here is persisted until the user hits Save Draft, same as any other
  // canvas edit.
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
    // Our panel's visibility/values are driven by our OWN selectedField
    // state, not pdfme's internal selection — deliberately not calling
    // designer.selectSchemas() here to re-highlight the field on canvas.
    // Chaining that immediately after updateTemplate() raced pdfme's own
    // internal React tree (it bundles its own separate React copy) into a
    // "Maximum update depth exceeded" loop (React error #185). The field
    // stays selected in OUR panel regardless; it just may not stay visually
    // highlighted on the canvas itself after a change.
    setSelectedField({ ...selectedField, schema: field });
    // Generate Preview/Publish read draft_template_json back FROM THE
    // SERVER — they never see designer.getTemplate()'s in-memory state.
    // A binding/visibility change that only lives on the canvas until
    // someone remembers to click Save Draft looks like it silently does
    // nothing the moment you hit Preview. Persist immediately instead —
    // silently, no full-screen overlay (this fires on every radio click).
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

  // Mail-merge style: append a {{key}} token to the selected field's own
  // content, independent of dataSource/visibility binding above — a field
  // stays "Static Text" with a free paragraph that happens to contain
  // tokens, resolved server-side by orderInputMapper.js's
  // applyTokenSubstitution at generate time. No cursor-position tracking —
  // always appends to the end of whatever's already typed on canvas.
  const insertTokenIntoSelectedField = (key: string) => {
    updateSelectedFieldSchema((field) => {
      const current = typeof field.content === "string" ? field.content : "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      field.content = `${current}${separator}{{${key}}}`;
    });
  };

  // Themed replacements for window.confirm()/window.prompt() — one shared
  // pending-action slot each, driven by the same ConfirmationModal/
  // PromptModal components the rest of the app uses, so these always match
  // the current theme instead of a native browser dialog.
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [promptDialog, setPromptDialog] = useState<{
    title: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
  } | null>(null);

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const askPrompt = (title: string, onSubmit: (value: string) => void, defaultValue?: string) => {
    setPromptDialog({ title, onSubmit, defaultValue });
  };

  if (!fontsPromiseRef.current) {
    fontsPromiseRef.current = loadDesignerFonts();
  }

  const refreshTemplates = async () => {
    const list = await listDocumentTemplates(docType);
    setTemplates(list);
    return list;
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

  useEffect(() => {
    (async () => {
      const list = await refreshTemplates();
      if (list.length > 0) {
        await openTemplate(list[0].id);
      } else {
        // A company with the flag on but zero templates yet for THIS doc
        // type (e.g. just switched to Sales Order for the first time) —
        // reset the canvas to a genuinely blank shape rather than leaving
        // the previous doc type's real template visibly mounted, which
        // "New Template" would otherwise silently clone as its starting
        // shape.
        setCurrentTemplateId(null);
        setCurrentTemplateFull(null);
        setSelectedField(null);
        mountOrUpdateDesigner({ basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] }, schemas: [[]] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  const requireEdit = () => {
    if (!canEdit && !canAdd) {
      toast.error("You don't have permission to do this");
      return false;
    }
    return true;
  };

  const handleNewTemplate = async () => {
    if (!requireEdit()) return;
    askPrompt("Name this template (e.g. \"Detailed (Enterprise)\")", async (name) => {
      // Start from the currently-open canvas's own default shape if one is
      // mounted, else pdfme's own blank default — designer.getTemplate() is
      // always available once mounted since a template list is never empty
      // in practice, but guard for the true first-run empty state anyway.
      const startingTemplate = designerRef.current ? designerRef.current.getTemplate() : null;
      if (!startingTemplate) {
        toast.error("Open or create a template first");
        return;
      }
      const created = await createDocumentTemplate(docType, name, startingTemplate);
      if (created) {
        await refreshTemplates();
        await openTemplate(created.id);
        toast.success("Template created");
      }
    });
  };

  // No setLoading()/full-screen overlay here — used both by the manual
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
    if (ok.data?.ack === 1) {
      setStatus("Draft saved.");
      await refreshTemplates();
    }
  };

  const handleSaveDraft = async () => {
    if (!requireEdit() || !currentTemplateId || !designerRef.current) return;
    setLoading(true);
    await saveDraftSilently();
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!requireEdit() || !currentTemplateId) return;
    await handleSaveDraft();
    const ok = await publishDocumentTemplate(currentTemplateId);
    if (ok) {
      await refreshTemplates();
      setStatus("Published — this is now what generates for real Quotations.");
    }
  };

  const handleDiscardDraft = async () => {
    if (!requireEdit() || !currentTemplateId) return;
    askConfirm("Discard unsaved changes and revert to the last published version?", async () => {
      const ok = await discardDraftChanges(currentTemplateId);
      if (ok) {
        await openTemplate(currentTemplateId);
        await refreshTemplates();
        setStatus("Draft discarded.");
      }
    });
  };

  const handleDuplicate = async (id: number) => {
    if (!requireEdit()) return;
    const created = await duplicateDocumentTemplate(id, docType);
    if (created) {
      await refreshTemplates();
      await openTemplate(created.id);
      toast.success("Template duplicated");
    }
  };

  const handleRename = async (id: number, currentName: string) => {
    if (!requireEdit()) return;
    askPrompt(
      "Rename template",
      async (name) => {
        if (name === currentName) return;
        await axiosInstance.post("document-templates/update", {
          company_masters_id: localStorage.getItem("COMPANY_ID"),
          a_application_login_id: localStorage.getItem("UUID"),
          id,
          template_name: name,
        });
        await refreshTemplates();
      },
      currentName,
    );
  };

  const handleSetDefault = async (id: number) => {
    if (!requireEdit()) return;
    const ok = await setDefaultDocumentTemplate(id, docType);
    if (ok) await refreshTemplates();
  };

  const handleDelete = async (id: number) => {
    if (!requireEdit()) return;
    if (templates.length <= 1) return; // last-remaining guard, button is disabled too
    askConfirm("Delete this template? This cannot be undone.", async () => {
      const ok = await deleteDocumentTemplate(id, docType);
      if (ok) {
        toast.success("Template deleted");
        const list = await refreshTemplates();
        if (currentTemplateId === id && list.length > 0) {
          await openTemplate(list[0].id);
        }
      }
    });
  };

  const moveTemplate = async (index: number, direction: -1 | 1) => {
    if (!requireEdit()) return;
    const target = index + direction;
    if (target < 0 || target >= templates.length) return;
    const reordered = [...templates];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setTemplates(reordered);
    await reorderDocumentTemplates(docType, reordered.map((t) => t.id));
  };

  const openVersionHistory = async () => {
    if (!currentTemplateId) return;
    const list = await listTemplateVersions(currentTemplateId);
    setVersions(list);
    setShowVersions(true);
  };

  const handleRestoreVersion = async (version_number: number) => {
    if (!currentTemplateId) return;
    askConfirm(`Restore version ${version_number}? Current state will be saved as a new version first.`, async () => {
      const ok = await restoreTemplateVersion(currentTemplateId, version_number);
      if (ok) {
        setShowVersions(false);
        await openTemplate(currentTemplateId);
        await refreshTemplates();
      }
    });
  };

  const openGallery = async () => {
    const list = await listSystemTemplates(docType);
    setGalleryTemplates(list);
    setShowGallery(true);
  };

  const handleCopyFromGallery = async (system_template_id: number) => {
    if (!requireEdit()) return;
    const created = await copyFromSystemTemplate(system_template_id, docType);
    if (created) {
      setShowGallery(false);
      await refreshTemplates();
      await openTemplate(created.id);
      toast.success("Template added from gallery");
    }
  };

  const handleExport = async (id: number, name: string) => {
    const result = await exportDocumentTemplate(id);
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]+/gi, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    if (!requireEdit()) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const created = await importDocumentTemplate(
        parsed.doc_type || docType,
        parsed.template_name || "Imported Template",
        parsed.template_json,
      );
      if (created) {
        await refreshTemplates();
        await openTemplate(created.id);
        toast.success("Template imported");
      }
    } catch (e) {
      toast.error("Invalid template file");
    }
  };

  // Header-variant / column-toggle toolbar — applied live to the draft via
  // apply-options, not deferred to Save Draft.
  const applyHeaderVariant = async (headerVariant: string) => {
    if (!requireEdit() || !currentTemplateId) return;
    const updated = await applyOptionsToDraft(currentTemplateId, docType, { header: { headerVariant } });
    if (updated && designerRef.current) {
      designerRef.current.updateTemplate(updated);
    }
  };

  const applyColumnToggle = async (key: string, value: boolean) => {
    if (!requireEdit() || !currentTemplateId) return;
    const updated = await applyOptionsToDraft(currentTemplateId, docType, {
      columnOptions: { [key]: value },
    });
    if (updated && designerRef.current) {
      designerRef.current.updateTemplate(updated);
    }
  };

  // "Product Page Designer" toggle — per-template (not company-wide, not a
  // draft/publish concept), applies immediately. When on, generate-time
  // splices each cart item's own product page (products.document_template_id,
  // set via Product Master's "Product Page Designer" action) after this
  // document, one per item in cart order (generateDocument.js).
  const toggleIncludeProductPages = async (value: boolean) => {
    if (!requireEdit() || !currentTemplateId) return;
    const ok = await axiosInstance.post("document-templates/update", {
      company_masters_id: localStorage.getItem("COMPANY_ID"),
      a_application_login_id: localStorage.getItem("UUID"),
      id: currentTemplateId,
      include_product_pages: value,
    });
    if (ok.data?.ack === 1 && currentTemplateFull) {
      setCurrentTemplateFull({ ...currentTemplateFull, include_product_pages: value ? 1 : 0 });
    }
  };

  // Generate Preview — real order data whenever it exists, sample data only
  // as an empty-state fallback (§6).
  const openPreviewPicker = async () => {
    if (!currentTemplateId) return;
    const login_id = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("listOrder", {
      a_application_login_id: login_id,
      order_type: CART_TYPE_BY_DOC_TYPE[docType] || 1,
      searchTerm: "",
      ul: 0,
      ll: 10,
    });
    const orders = data?.data?.item || data?.data || [];
    setHasAnyOrders(orders.length > 0);
    if (orders.length === 0) {
      await runPreview(undefined);
      return;
    }
    setPreviewOrders(orders);
    setShowPreviewPicker(true);
  };

  const searchPreviewOrders = async (term: string) => {
    setPreviewSearch(term);
    const login_id = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("listOrder", {
      a_application_login_id: login_id,
      order_type: CART_TYPE_BY_DOC_TYPE[docType] || 1,
      searchTerm: term,
      ul: 0,
      ll: 20,
    });
    setPreviewOrders(data?.data?.item || data?.data || []);
  };

  const runPreview = async (cart_id?: number) => {
    if (!currentTemplateId) return;
    setStatus("Generating preview...");
    const { data } = await axiosInstance.post("document-templates/preview", {
      company_masters_id: localStorage.getItem("COMPANY_ID"),
      id: currentTemplateId,
      cart_id,
    });
    if (data?.ack === 1) {
      const byteChars = atob(data.data.item.pdfBase64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setStatus("Preview opened in new tab.");
      setShowPreviewPicker(false);
    } else {
      toast.error(data?.ack_msg || "Preview failed");
      setStatus("Preview failed.");
    }
  };

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
        /* Accent color: orange (#f58634), not bootstrap's default blue —
           scoped to this page only, doesn't touch shared bootstrap classes
           used elsewhere in the app. */
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
        <select
          className="form-select form-select-sm mb-2"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          {SUPPORTED_DOC_TYPES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <h5>{SUPPORTED_DOC_TYPES.find((d) => d.id === docType)?.label} Templates</h5>
        <div className="d-flex flex-column gap-2 mb-3">
          <button className="btn btn-sm btn-primary" onClick={handleNewTemplate} disabled={!canAdd && !canEdit}>
            + New Template
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={openGallery}>
            Browse Gallery
          </button>
          <label className="btn btn-sm btn-outline-secondary mb-0">
            Import
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

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
            onClick={() => openTemplate(t.id)}
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
              <button className="btn btn-sm btn-link p-0" onClick={() => moveTemplate(index, -1)} disabled={index === 0}>▲</button>
              <button className="btn btn-sm btn-link p-0" onClick={() => moveTemplate(index, 1)} disabled={index === templates.length - 1}>▼</button>
              <button className="btn btn-sm btn-link p-0" onClick={() => handleRename(t.id, t.template_name)}>Rename</button>
              <button className="btn btn-sm btn-link p-0" onClick={() => handleDuplicate(t.id)}>Duplicate</button>
              <button className="btn btn-sm btn-link p-0" onClick={() => handleExport(t.id, t.template_name)}>Export</button>
              {!t.is_default ? (
                <button className="btn btn-sm btn-link p-0" onClick={() => handleSetDefault(t.id)}>Set Default</button>
              ) : null}
              <button
                className="btn btn-sm btn-link p-0 text-danger"
                onClick={() => handleDelete(t.id)}
                disabled={templates.length <= 1}
                title={templates.length <= 1 ? "Can't delete the only remaining template" : ""}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="dd-main">
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #ddd", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {CART_SHAPED_DOC_TYPES.has(docType) && (
            <>
              <select className="form-select form-select-sm" style={{ width: 160 }} onChange={(e) => applyHeaderVariant(e.target.value)} defaultValue="details">
                <option value="details">Header: Details</option>
                <option value="image">Header: Image</option>
                <option value="logoLeft">Header: Logo Left</option>
                <option value="logoRight">Header: Logo Right</option>
              </select>
              {["hsn", "discount", "cgst", "sgst", "igst", "image"].map((key) => (
                <label key={key} className="form-check-label d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                  <input type="checkbox" className="form-check-input" onChange={(e) => applyColumnToggle(key, e.target.checked)} />
                  {key.toUpperCase()}
                </label>
              ))}
              <label className="form-check-label d-flex align-items-center gap-1" style={{ fontSize: 12 }} title="Splice each cart item's own Product Page Designer page after this document, in item order">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={!!currentTemplateFull?.include_product_pages}
                  onChange={(e) => toggleIncludeProductPages(e.target.checked)}
                />
                Show product-wise pages
              </label>
            </>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm btn-outline-secondary" onClick={openVersionHistory} disabled={!currentTemplateId}>Version History</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleDiscardDraft} disabled={!currentTemplateId}>Discard Draft</button>
          <button className="btn btn-sm btn-secondary" onClick={handleSaveDraft} disabled={!currentTemplateId}>Save Draft</button>
          {CART_SHAPED_DOC_TYPES.has(docType) && (
            <button className="btn btn-sm btn-outline-primary" onClick={openPreviewPicker} disabled={!currentTemplateId}>Generate Preview</button>
          )}
          <button className="btn btn-sm" style={{ background: "#f58634", color: "#fff" }} onClick={handlePublish} disabled={!currentTemplateId}>
            Publish
          </button>
        </div>
        {selectedField && (
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #ddd", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#f8f9fa" }}>
            <strong style={{ fontSize: 12 }}>Field: {selectedField.name}</strong>
            <label className="form-check-label d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
              <input
                type="radio"
                name="bindMode"
                checked={!isFieldBound}
                onChange={() => setFieldDataSource(null)}
              />
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

      {showVersions && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 420, marginTop: "5%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Version History</h5>
              <span className="close" onClick={() => setShowVersions(false)}>&times;</span>
            </div>
            {versions.length === 0 ? <p>No published versions yet.</p> : null}
            {versions.map((v) => (
              <div key={v.version_number} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                  <div>Version {v.version_number}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{v.change_note || ""} {v.created_date_time}</div>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleRestoreVersion(v.version_number)}>Restore</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGallery && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 420, marginTop: "5%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>System Template Gallery</h5>
              <span className="close" onClick={() => setShowGallery(false)}>&times;</span>
            </div>
            {galleryTemplates.length === 0 ? <p>No gallery templates for this document type yet.</p> : null}
            {galleryTemplates.map((g) => (
              <div key={g.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                  <div style={{ fontWeight: 600 }}>{g.template_name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{g.description}</div>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleCopyFromGallery(g.id)}>Use This</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreviewPicker && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 420, marginTop: "5%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Preview with Real Order Data</h5>
              <span className="close" onClick={() => setShowPreviewPicker(false)}>&times;</span>
            </div>
            <input
              className="form-control form-control-sm mb-2"
              placeholder="Search by order number..."
              value={previewSearch}
              onChange={(e) => searchPreviewOrders(e.target.value)}
            />
            {previewOrders.map((o) => (
              <div key={o.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                  <div style={{ fontWeight: 600 }}>{o.cart_number}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{o.to_customer_name}</div>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => runPreview(o.id)}>Preview</button>
              </div>
            ))}
          </div>
        </div>
      )}

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

export default DocumentDesignerView;
