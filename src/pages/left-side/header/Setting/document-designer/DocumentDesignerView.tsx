import { ellipse, image, line, list, table, text } from "@pdfme/schemas";
import React, { useEffect, useState } from "react";
import { Accordion } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { newRightsForPrint } from "../../../../../common/SharedFunction";
import { customRectangle } from "../../../../../common/pdfmeDesigner/customRectanglePlugin";
import {
  extendPluginWithFieldSettings,
  setFieldSettingsDictionary,
} from "../../../../../common/pdfmeDesigner/pdfmeFieldSettingsPlugin";
import { PDFME_HIDE_NATIVE_PAGE_MENU_CSS } from "../../../../../common/pdfmeDesigner/pdfmeStyles";
import TemplateSidebar from "../../../../../common/pdfmeDesigner/TemplateSidebar";
import { usePageManipulation } from "../../../../../common/pdfmeDesigner/usePageManipulation";
import { useDesignerInstance } from "../../../../../common/pdfmeDesigner/useDesignerInstance";
import { PAGE_ID } from "../../../../../helpers/AppEnum";
import { axiosInstance } from "../../../../../services/axiosInstance";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import PromptModal from "../../../../../components/model/PromptModal";
import { previewReportPdf, verifyReportPin } from "../../../../dashboard/Reports/ReportBuilder/ReportBuilderController";
import { fetchCompanyKeyApi, ICompany } from "../../../LeftSideController";
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
  setPinRequiredHandler,
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
  { id: "pendingSalesOrder", label: "Pending Sales Order" },
  { id: "pendingPurchaseOrder", label: "Pending Purchase Order" },
  { id: "accountStatement", label: "Account Statement" },
  { id: "accountTransaction", label: "Account Transaction" },
  { id: "taskDueList", label: "Task Due List" },
  { id: "shippingLabel", label: "Shipping Label" },
  { id: "contactAddress", label: "Contact Address Label" },
  { id: "contactEnvelope", label: "Contact Envelope" },
  { id: "employeeAccountStatement", label: "Team Account Statement" },
  { id: "employeeAccountTransaction", label: "Team Account Transaction" },
];
// Page-size toolbar presets, in mm (pdfme's basePdf unit) — A4/A5 portrait.
// "Custom" reveals two number inputs instead of a fixed width/height.
const PAGE_SIZE_PRESETS: Record<"A4" | "A5", { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
};
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
  // Pending Sales/Purchase Order are a distinct doc_type from their
  // confirmed-order counterpart, but render off the same cart shape/type —
  // real-data preview and the header-variant/column toolbar work the same
  // way as salesOrder/purchaseOrder.
  pendingSalesOrder: 2,
  pendingPurchaseOrder: 5,
};
// Header-variant/column-toggle toolbar and "Generate Preview" (real order
// data or the cart-shaped sample data) only make sense for the 10 cart docs
// above — the 4 system doc types have their own fixed layout/sample data
// that applyOptionsToDraft and previewDocumentTemplate don't know how to
// touch yet (backend guards + rejects both for non-cart-shaped doc_types).
const CART_SHAPED_DOC_TYPES = new Set(Object.keys(CART_TYPE_BY_DOC_TYPE));

// Mirrors buildTemplate.js's own HEADER_RELATIVE_FIELD_NAMES/shiftFieldY
// exactly (backend-only, not importable from a Node module here) — used by
// applyMargins below so a manual top-margin edit shifts docTitle/buyer-info/
// items-table the same way a header-height change already does via the
// backend rebuild applyHeaderOptions goes through. totalsBlock/
// grandTotalWords/termsAndConditions/signatureLine are deliberately
// excluded — anchored near the page bottom, independent of header height.
const HEADER_RELATIVE_FIELD_NAMES = new Set([
  "docTitle",
  "originalDuplicate",
  "buyerLabel",
  "buyerCompanyName",
  "buyerContactName",
  "buyerPhoneLabel",
  "buyerPhone",
  "buyerEmailLabel",
  "buyerEmail",
  "billingAddressLabel",
  "billingAddress",
  "shippingAddressLabel",
  "shippingAddress",
  "buyerGSTINLabel",
  "buyerGSTIN",
  "supplyToLabel",
  "supplyTo",
  "orderNumberLabel",
  "orderNumber",
  "orderDateTimeLabel",
  "orderDateTime",
  "contactPersonLabel",
  "contactPerson",
  "itemsTable",
]);

// Mirrors backend's withCompanyHeader (templates.js) field-for-field, but
// client-side and display-only — shows this company's REAL name/address/
// logo/header-footer-signature images on the editing canvas instead of
// buildTemplate.js's generic "COMPANY NAME" placeholder, the same gap
// Document Designer's real generate-time path doesn't have (it always runs
// through the real withCompanyHeader). Safe to let this get saved back into
// draft_template_json along with everything else — generate() always
// overwrites these exact same dataSource-keyed fields' content with real
// data again regardless of whatever was last saved, so a stale value here
// is purely cosmetic (corrected the next time this page loads) and never
// reaches an actual generated PDF.
// Mirrors backend-document-designer's paperSize.js scaleTemplate/scaleField/
// scaleBoxDimension/scaleCellStyles field-for-field (not importable from a
// Node module here). Deliberately NOT the same code path as
// applyTemplateOptions' own pageSize branch, which rebuilds a FRESH default
// template and scales THAT — fine for backend's own narrow original use,
// wrong for us: it would silently discard every manual edit the user made
// (moved/resized fields, added new ones, restyled text) on every page-size
// change. This scales the ACTUAL currently-loaded template in place instead,
// preserving all of that.
function scaleBoxDimension(box: any, scale: number) {
  if (!box || typeof box !== "object") return box;
  const out = { ...box };
  for (const k of ["top", "right", "bottom", "left"]) {
    if (typeof box[k] === "number") out[k] = box[k] * scale;
  }
  return out;
}

function scaleCellStyles(styles: any, scale: number) {
  if (!styles) return styles;
  return {
    ...styles,
    fontSize: typeof styles.fontSize === "number" ? styles.fontSize * scale : styles.fontSize,
    padding: scaleBoxDimension(styles.padding, scale),
    borderWidth:
      typeof styles.borderWidth === "number" ? styles.borderWidth * scale : scaleBoxDimension(styles.borderWidth, scale),
  };
}

function scaleField(field: any, scale: number) {
  const scaled = {
    ...field,
    position: { x: field.position.x * scale, y: field.position.y * scale },
    width: field.width * scale,
    height: field.height * scale,
  };
  if (typeof scaled.fontSize === "number") scaled.fontSize *= scale;
  if (typeof scaled.padding === "number") scaled.padding *= scale;
  else if (scaled.padding) scaled.padding = scaleBoxDimension(scaled.padding, scale);
  if (typeof scaled.borderWidth === "number") scaled.borderWidth *= scale;
  else if (scaled.borderWidth) scaled.borderWidth = scaleBoxDimension(scaled.borderWidth, scale);
  if (scaled.headStyles) scaled.headStyles = scaleCellStyles(scaled.headStyles, scale);
  if (scaled.bodyStyles) scaled.bodyStyles = scaleCellStyles(scaled.bodyStyles, scale);
  if (scaled.tableStyles) {
    scaled.tableStyles = {
      ...scaled.tableStyles,
      borderWidth: typeof scaled.tableStyles.borderWidth === "number" ? scaled.tableStyles.borderWidth * scale : scaled.tableStyles.borderWidth,
    };
  }
  // headWidthPercentages/columnStyles are already relative (%) — no scaling.
  return scaled;
}

// Uniform scale = min(widthRatio, heightRatio), anchored top-left, so it
// always fits without distorting proportions — same as the backend's own.
function scaleTemplateInPlace(template: any, targetWidth: number, targetHeight: number) {
  const { width: currentWidth, height: currentHeight } = template.basePdf;
  const scale = Math.min(targetWidth / currentWidth, targetHeight / currentHeight);
  if (Math.abs(scale - 1) < 1e-6) return { ...template, basePdf: { ...template.basePdf, width: targetWidth, height: targetHeight } };

  return {
    ...template,
    basePdf: {
      ...template.basePdf,
      width: targetWidth,
      height: targetHeight,
      padding: (template.basePdf.padding || []).map((p: number) => p * scale),
      staticSchema: (template.basePdf.staticSchema || []).map((f: any) => scaleField(f, scale)),
    },
    schemas: template.schemas.map((page: any[]) => page.map((f: any) => scaleField(f, scale))),
  };
}

const injectRealCompanyHeaderData = (template: any, companyData: any) => {
  if (!companyData || !template?.basePdf?.staticSchema) return template;
  const contactLine = `Mo.: ${companyData.company_contact ?? ""}  Email: ${companyData.company_email ?? ""}  GSTIN: ${companyData.gst_number ?? ""}  State: ${companyData.state_name ?? ""}`;
  const addressLine = `Address: ${companyData.address ?? ""}\n${contactLine}`;
  const combinedBlock = `${companyData.company_name ?? ""}\n${addressLine}`;
  // fetchCompanyKeyApi's "company" endpoint (companyService.js's
  // getAllCompany) already prepends COMPANY_IMG_LINK_EXTENDED
  // (BACKEND_URL + "/companyImg/") server-side — these are already
  // complete, directly loadable URLs, not raw filenames. Re-prefixing them
  // here produced "http://host/companyImg/http://host/companyImg/...".
  const headerImageUrl = companyData.header_img || "";
  const logoUrl = companyData.company_logo || "";
  const footerImageUrl = companyData.footer_img || "";
  const signUrl = companyData.company_sign || "";

  return {
    ...template,
    basePdf: {
      ...template.basePdf,
      staticSchema: template.basePdf.staticSchema.map((field: any) => {
        const key = field.dataSource || field.name;
        if (key === "companyName") return { ...field, content: companyData.company_name ?? "" };
        if (key === "companyAddress") return { ...field, content: addressLine };
        if (key === "companyDetailsWithLogo") return { ...field, content: combinedBlock };
        if (key === "companyHeaderImage" && headerImageUrl) return { ...field, content: headerImageUrl };
        if (key === "companyLogo" && logoUrl) return { ...field, content: logoUrl };
        if (key === "companyFooterImage" && footerImageUrl) return { ...field, content: footerImageUrl };
        if (key === "companySignatureImage" && signUrl) return { ...field, content: signUrl };
        return field;
      }),
    },
  };
};

// Column-toggle checkboxes (HSN/Discount/CGST/SGST/IGST/Image) merged into
// the itemsTable field's OWN pdfme sidebar panel, instead of a generic
// always-visible toolbar row — these values are conceptually properties of
// that one field. The actual toggle logic (applyColumnToggle, unchanged)
// lives inside the component and closes over changing React state
// (currentTemplateId/docType), but this plugin object is only ever built
// once at module scope — `columnToggleBridge` is the stable indirection that
// lets the widget always call whatever the LATEST applyColumnToggle closure
// is, synced from inside the component on every render (same "bridge"
// pattern src/common/pdfmeDesigner/pdfmeFieldSettingsPlugin.ts uses to
// connect its own module-scope plugin objects to React state).
const columnToggleBridge = {
  current: (_columnOptions: Record<string, boolean>, _changeSchemas: any, _schemaId: string) => {},
};
const ITEMS_TABLE_COLUMN_KEYS = ["hsn", "discount", "cgst", "sgst", "igst", "image"];

// Vanilla-DOM propPanel widget — pdfme's own `select` plugin extends `text`'s
// propPanel with a custom widget the exact same way (addOptions), confirmed
// via @pdfme/schemas' own source. `rootElement` is where we mount plain DOM;
// pdfme doesn't run this through React.
const itemsTableColumnsWidget = (props: any) => {
  const { rootElement, activeSchema, changeSchemas } = props;
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "10px";
  // Built up front, then wired with change listeners below — each listener
  // reads every sibling checkbox's LIVE checked state at click time (not
  // `activeSchema.columnOptions` from whenever this widget happened to be
  // mounted). pdfme doesn't reliably re-invoke this mount function on every
  // value change, so a listener closing over `activeSchema` would keep
  // merging against a stale snapshot from first mount — confirmed bug: only
  // the most recently clicked column ever stuck, because every toggle after
  // the first was merging against that same stale (mostly-empty) base
  // instead of the previous click's real result.
  const inputs: Record<string, HTMLInputElement> = {};
  ITEMS_TABLE_COLUMN_KEYS.forEach((key) => {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "4px";
    label.style.fontSize = "12px";
    label.style.cursor = "pointer";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!activeSchema?.columnOptions?.[key];
    inputs[key] = input;
    label.appendChild(input);
    label.appendChild(document.createTextNode(key.toUpperCase()));
    container.appendChild(label);
  });
  ITEMS_TABLE_COLUMN_KEYS.forEach((key) => {
    inputs[key].addEventListener("change", () => {
      const mergedColumnOptions: Record<string, boolean> = {};
      ITEMS_TABLE_COLUMN_KEYS.forEach((k) => {
        mergedColumnOptions[k] = inputs[k].checked;
      });
      columnToggleBridge.current(mergedColumnOptions, changeSchemas, activeSchema.id);
    });
  });
  rootElement.appendChild(container);
};

const extendedTable: any = {
  ...(table as any),
  propPanel: {
    ...(table as any).propPanel,
    widgets: { ...(table as any).propPanel.widgets, itemsTableColumns: itemsTableColumnsWidget },
    schema: (propPanelProps: any) => {
      const base =
        typeof (table as any).propPanel.schema === "function"
          ? (table as any).propPanel.schema(propPanelProps)
          : (table as any).propPanel.schema;
      // Only the invoice items table gets these — not every table field
      // anyone might drag onto canvas.
      if (propPanelProps?.activeSchema?.name !== "itemsTable") return base;
      return {
        ...base,
        itemsTableColumnsCard: {
          title: "Columns (HSN / Discount / GST / Image)",
          type: "string",
          widget: "Card",
          span: 24,
          properties: {
            columnsToggle: { type: "void", widget: "itemsTableColumns", span: 24 },
          },
        },
      };
    },
  },
};

// Field data-binding/visibility/insert-token controls, merged into pdfme's
// own per-field sidebar the same way as the column toggles above —
// extendPluginWithFieldSettings lives in src/common/pdfmeDesigner/ now,
// shared with CustomFieldDesignerPageEditorView.tsx and
// ProductPageDesignerEditorView.tsx.
const plugins = {
  text: extendPluginWithFieldSettings(text, "textFieldSettings", true),
  table: extendedTable,
  image: extendPluginWithFieldSettings(image, "imageFieldSettings", false),
  // Plain @pdfme/schemas built-ins — pure layout/decoration elements, no
  // real per-record data to bind, so left un-wrapped (same as `table`
  // above already was before its own itemsTable-specific extension).
  rectangle: customRectangle,
  ellipse,
  line,
  list,
};

interface IDocumentDesignerViewProps {
  // Report Builder's "Manage Templates" (ReportPdfTemplateDesigner.tsx used
  // to be a separate, hand-copied component) now mounts THIS component
  // instead, in report mode — same toolbar/sidebar/canvas/page-manipulation/
  // field-settings/version-history, just doc_type fixed to "report_<id>"
  // (no doc-type switcher, no Browse Gallery/Import — no report analogue
  // for either) and a different Generate Preview data source (live report
  // rows, not a cart-order picker). Rendered as a modal overlay instead of
  // the full-page route in this mode.
  reportMode?: {
    docType: string;
    reportName: string;
    onClose: () => void;
  };
}

const DocumentDesignerView: React.FC<IDocumentDesignerViewProps> = ({ reportMode }) => {
  const navigate = useNavigate();
  // AppContext.permissions is only populated by LeftSideView's onLoad call —
  // this page is reached as its own top-level route (not one of the
  // state-toggled panels other Setting sub-pages use, which stay nested
  // inside an already-mounted LeftSideView), so a direct/hard-reloaded
  // navigation here never mounts LeftSideView at all and permissions would
  // stay empty forever. Fetch this page's own rights independently instead —
  // same pattern PrintSettingModal already uses for the same reason
  // (see newRightsForPrint in SharedFunction.tsx).
  //
  // reportMode bypasses this entirely rather than gating on
  // DOCUMENT_DESIGNER_RIGHTS — Report Builder's Manage Templates has its own,
  // separate rights concept (report_definition_team_rights); a login granted
  // report-builder access but with no Document Designer permission row would
  // otherwise be silently locked out of a screen they could already reach.
  const [rights, setRights] = useState<any>(null);
  useEffect(() => {
    if (reportMode) return;
    (async () => {
      const result = await newRightsForPrint(PAGE_ID.DOCUMENT_DESIGNER_RIGHTS, localStorage.getItem("UUID"));
      setRights(result || {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const canView = reportMode ? true : rights?.view === 1;
  const canEdit = reportMode ? true : rights?.edit === 1;
  const canAdd = reportMode ? true : rights?.add === 1;

  // Same independent-fetch reasoning as `rights` above — AppContext's
  // companyData is only populated by LeftSideView's onLoad, which a direct
  // navigation to this top-level route never mounts. Needed so the canvas
  // can show this company's REAL header/footer/logo while editing (see
  // injectRealCompanyHeaderData below) instead of buildTemplate.js's
  // generic "COMPANY NAME" placeholder — real substitution only otherwise
  // happens at actual PDF-generation time (withCompanyHeader, backend-side).
  const [companyData, setCompanyData] = useState<ICompany | undefined>(undefined);
  useEffect(() => {
    fetchCompanyKeyApi(setCompanyData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [docType, setDocType] = useState<string>(reportMode?.docType || "quotation");
  const [templates, setTemplates] = useState<IDocumentTemplateListItem[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentTemplateFull, setCurrentTemplateFull] = useState<IDocumentTemplateFull | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  // Whole right-side accordion panel (Templates/Header/Page) — collapses to
  // give the canvas full width, independent of each section's own
  // collapse/expand (that's react-bootstrap Accordion's own per-item
  // behavior, unaffected by this).
  const [showAccordionPanel, setShowAccordionPanel] = useState(true);

  // Page size toolbar (A4/A5/Custom) — a plain basePdf.width/height edit on
  // whatever's currently mounted, same "live canvas edit, persisted on Save
  // Draft" contract as dragging/resizing a field. Kept outside
  // CART_SHAPED_DOC_TYPES since page size is universal, not cart-specific.
  const [pageSizeMode, setPageSizeMode] = useState<"A4" | "A5" | "custom">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [customPageWidth, setCustomPageWidth] = useState(210);
  const [customPageHeight, setCustomPageHeight] = useState(297);
  // basePdf.padding order is [top, right, bottom, left] (buildTemplate.js's
  // own convention) — reflects whatever's mounted, editable independently of
  // page size/orientation. A cart doc's top/bottom start out computed from
  // its header/footer banner height (buildDocTemplate) — overriding them
  // here is a deliberate manual choice with the same "no auto-reflow"
  // caveat orientation/custom page size already have: fields don't move
  // themselves to clear a shrunk margin.
  const [marginTop, setMarginTop] = useState(15);
  const [marginRight, setMarginRight] = useState(10);
  const [marginBottom, setMarginBottom] = useState(15);
  const [marginLeft, setMarginLeft] = useState(10);
  // Header/footer toolbar needs to know the CURRENT variant/heights to
  // render controls as controlled (not just on change) and to show the
  // height input only for the "image" header variant, initialized from
  // whatever's mounted.
  const [headerVariant, setHeaderVariant] = useState("details");
  const [headerHeightMM, setHeaderHeightMM] = useState(28.5);
  const [footerImage, setFooterImage] = useState(false);
  const [footerHeightMM, setFooterHeightMM] = useState(28.5);
  const [pageBorder, setPageBorder] = useState(false);
  const [pageBorderColor, setPageBorderColor] = useState("#000000");
  const [pageBorderWidth, setPageBorderWidth] = useState(0.5);

  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTemplates, setGalleryTemplates] = useState<any[]>([]);
  const [showPreviewPicker, setShowPreviewPicker] = useState(false);
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewOrders, setPreviewOrders] = useState<any[]>([]);
  // Report mode's own Generate Preview (live report rows, not a cart-order
  // picker) — the /report-definitions/:id/... routes are report-definition-
  // scoped, not doc_type-scoped like the template CRUD routes are, so the
  // raw id needs recovering from reportMode.docType's "report_<id>" convention
  // (ReportBuilderListView.tsx's own construction of it, mirrored backend-side
  // by reportPdfExport.js's reportDocType()).
  const reportDefinitionId = reportMode ? Number(reportMode.docType.replace(/^report_/, "")) : null;
  const [reportPreviewing, setReportPreviewing] = useState(false);

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
  setFieldSettingsDictionary(dictionary);

  const { designerContainerRef, designerRef, designerMounted, mountOrUpdateDesigner: mountDesignerRaw } = useDesignerInstance(
    plugins,
    setSelectedField,
  );
  // Page-size toolbar needs to reflect whatever's actually mounted — wrap
  // the shared hook's mount function so every call also syncs it, same as
  // this file did before extracting the shared mount routine.
  const mountOrUpdateDesigner = (template: any) => {
    syncPageSizeFromTemplate(template);
    syncHeaderOptionsFromTemplate(template);
    return mountDesignerRaw(injectRealCompanyHeaderData(template, companyData));
  };

  // companyData resolves asynchronously (see the fetchCompanyKeyApi effect
  // above), and so does the Designer itself mounting (useDesignerInstance
  // awaits a font fetch + a container-ready retry loop before it sets
  // designerMounted) — whichever of the two finishes LAST is what actually
  // needs to trigger the re-apply. Depending on [companyData] alone missed
  // the (very real) case where company data resolves first: designerRef.current
  // is still null at that moment, this effect no-ops, and since companyData
  // never changes again, it silently never retries — the canvas stays on
  // placeholders (mountOrUpdateDesigner's own injection, captured by the
  // one-shot init effect, ran with companyData still undefined). Watching
  // designerMounted too covers that ordering as well.
  useEffect(() => {
    if (!companyData || !designerRef.current) return;
    designerRef.current.updateTemplate(injectRealCompanyHeaderData(designerRef.current.getTemplate(), companyData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyData, designerMounted]);

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

  // Owner+PIN gate (requireReportPin, backend's reportPinAuth.js). Asked
  // upfront on page open (pinVerified below gates the whole page, same
  // pattern ReportBuilderView.tsx uses) rather than only when a gated
  // action is attempted. showPinModal/pinResolveRef stay as a fallback for
  // the 2h token expiring while the page is still open — postGated
  // (DocumentDesignerController.ts) can re-prompt right here and retry the
  // one call, instead of failing outright. Same verifyReportPin
  // ReportBuilderView.tsx uses — one PIN, either page.
  // A verified PIN already left a REPORT_PIN_TOKEN in localStorage — trust
  // it optimistically instead of re-prompting on every mount/reload. A
  // stale/expired one is already handled by postGated's retry above, not a
  // new failure mode this introduces.
  // reportMode is the one exception — dashboardRouter.js's backend routes
  // dropped requireReportPin entirely (Dashboard no longer needs the owner
  // PIN at all), so that mode always starts pre-verified. Document
  // Designer's own routes (document_print_templates) still require it,
  // unchanged.
  const [pinVerified, setPinVerified] = useState(() => !!reportMode || !!localStorage.getItem("REPORT_PIN_TOKEN"));
  const [showPinModal, setShowPinModal] = useState(false);
  const pinResolveRef = React.useRef<((verified: boolean) => void) | null>(null);
  useEffect(() => {
    setPinRequiredHandler(() => {
      setShowPinModal(true);
      return new Promise<boolean>((resolve) => {
        pinResolveRef.current = resolve;
      });
    });
    return () => setPinRequiredHandler(null);
  }, []);
  const handlePinSubmit = async (pin: string) => {
    const ok = await verifyReportPin(pin);
    setShowPinModal(false);
    if (ok) setPinVerified(true);
    pinResolveRef.current?.(ok);
    pinResolveRef.current = null;
  };
  const handlePinCancel = () => {
    setShowPinModal(false);
    pinResolveRef.current?.(false);
    pinResolveRef.current = null;
  };

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
    const template = JSON.parse(full.draft_template_json);
    mountOrUpdateDesigner(template);
    maybeAutoEnableFooterImage(full.id, template);
  };

  // Reflects whatever's actually mounted into the page-size toolbar — a
  // template whose basePdf doesn't match either preset (most fixed-layout
  // system templates like shippingLabel/contactEnvelope) shows as "Custom"
  // with its real dimensions, rather than silently defaulting to A4.
  const syncPageSizeFromTemplate = (template: any) => {
    const width = template?.basePdf?.width;
    const height = template?.basePdf?.height;
    if (typeof width !== "number" || typeof height !== "number") return;
    const presetKeys = Object.keys(PAGE_SIZE_PRESETS) as ("A4" | "A5")[];
    const portraitMatch = presetKeys.find(
      (key) => PAGE_SIZE_PRESETS[key].width === width && PAGE_SIZE_PRESETS[key].height === height,
    );
    // A preset rotated 90° (e.g. A4 saved as 297x210) still counts as that
    // preset — just in landscape — rather than falling through to "Custom".
    const landscapeMatch = presetKeys.find(
      (key) => PAGE_SIZE_PRESETS[key].width === height && PAGE_SIZE_PRESETS[key].height === width,
    );
    if (portraitMatch) {
      setPageSizeMode(portraitMatch);
      setOrientation("portrait");
    } else if (landscapeMatch) {
      setPageSizeMode(landscapeMatch);
      setOrientation("landscape");
    } else {
      setPageSizeMode("custom");
      setOrientation(width > height ? "landscape" : "portrait");
    }
    setCustomPageWidth(width);
    setCustomPageHeight(height);

    const padding = template?.basePdf?.padding;
    if (Array.isArray(padding) && padding.length === 4) {
      const [top, right, bottom, left] = padding;
      setMarginTop(top);
      setMarginRight(right);
      setMarginBottom(bottom);
      setMarginLeft(left);
    }
  };

  // Reflects whatever's actually mounted into the header/footer toolbar —
  // same reasoning as syncPageSizeFromTemplate above. Falls back to the
  // builder's own defaults (buildTemplate.js's buildHeaderFields/
  // buildFooterFields) for a template saved before these existed on basePdf.
  const syncHeaderOptionsFromTemplate = (template: any) => {
    setHeaderVariant(template?.basePdf?.headerVariant || "details");
    setHeaderHeightMM(template?.basePdf?.headerHeightMM ?? 28.5);
    setFooterImage(!!template?.basePdf?.footerImage);
    setFooterHeightMM(template?.basePdf?.footerHeightMM ?? 28.5);
    setPageBorder(!!template?.basePdf?.pageBorder);
    setPageBorderColor(template?.basePdf?.pageBorderColor || "#000000");
    setPageBorderWidth(template?.basePdf?.pageBorderWidth ?? 0.5);
  };

  // Applies a new page size to whatever's currently on the canvas and
  // persists it immediately (same "apply now" feel as header-variant/column
  // toggles), rather than waiting for a manual Save Draft click.
  const applyPageSize = async (width: number, height: number) => {
    if (!requireEdit() || !currentTemplateId || !designerRef.current) return;
    if (!width || !height) return;
    // Proportionally rescales the ACTUAL currently-loaded template (header/
    // footer banners, content fields, items table, page border, page
    // number — everything) to fit the new dimensions, preserving whatever
    // the user has manually customized. See scaleTemplateInPlace above for
    // why this isn't routed through the backend's own pageSize rebuild.
    const template = designerRef.current.getTemplate();
    const updated = scaleTemplateInPlace(template, width, height);
    designerRef.current.updateTemplate(updated);
    // Margins/header-height/footer-height/border-width toolbar state all
    // read off basePdf values that just got scaled — re-sync so they show
    // the new (scaled) numbers instead of the stale pre-scale ones.
    syncPageSizeFromTemplate(updated);
    syncHeaderOptionsFromTemplate(updated);
    await saveDraftSilently();
  };

  // Margins are independent of page size/orientation — changing one never
  // touches the other via this function.
  const applyMargins = async (top: number, right: number, bottom: number, left: number) => {
    if (!requireEdit() || !currentTemplateId || !designerRef.current) return;
    const template = designerRef.current.getTemplate();
    // Full Page Border's left/right tracks the content margin
    // (buildPageBorderField, backend-side) but top/bottom stays a small
    // fixed inset independent of it — on purpose, so the header/footer
    // banners land INSIDE the frame instead of being excluded from it.
    // Patching padding here without also repositioning an existing
    // pageBorder field's x/width would leave it framing the OLD left/right
    // margin, since this whole function is a direct client-side basePdf
    // edit that never goes through the backend rebuild applyHeaderOptions
    // uses — y/height are left untouched on purpose (not tied to top/bottom
    // margin).
    const { width: pageWidth } = template.basePdf;
    const staticSchema = (template.basePdf.staticSchema || []).map((field: any) =>
      field.name === "pageBorder"
        ? { ...field, position: { ...field.position, x: left }, width: pageWidth - left - right }
        : field,
    );
    // Same reasoning — a top-margin change needs docTitle/buyer-info/
    // items-table shifted down/up to clear it, same as applyHeaderOptions'
    // deltaY shift already does for a header-height change (that path goes
    // through the backend rebuild, this one is a direct client-side edit
    // that would otherwise skip it entirely, leaving content overlapping
    // the header or floating in a gap that no longer matches the margin).
    const oldTop = template.basePdf.padding?.[0] ?? top;
    const deltaY = top - oldTop;
    const schemas =
      deltaY === 0
        ? template.schemas
        : template.schemas.map((page: any[]) =>
            page.map((field: any) =>
              HEADER_RELATIVE_FIELD_NAMES.has(field.name)
                ? { ...field, position: { ...field.position, y: field.position.y + deltaY } }
                : field,
            ),
          );
    const updated = { ...template, schemas, basePdf: { ...template.basePdf, padding: [top, right, bottom, left], staticSchema } };
    designerRef.current.updateTemplate(updated);
    await saveDraftSilently();
  };

  // Width/height for a given size preset (or the current custom values) in
  // the given orientation — swaps the two dimensions only when the base
  // shape doesn't already match the requested orientation, so re-picking the
  // SAME orientation twice is a no-op rather than an accidental double-swap.
  const dimensionsFor = (mode: "A4" | "A5" | "custom", orient: "portrait" | "landscape") => {
    const base = mode === "custom" ? { width: customPageWidth, height: customPageHeight } : PAGE_SIZE_PRESETS[mode];
    const isLandscape = base.width > base.height;
    if ((orient === "landscape") === isLandscape) return base;
    return { width: base.height, height: base.width };
  };

  const handlePageSizeModeChange = (mode: "A4" | "A5" | "custom") => {
    setPageSizeMode(mode);
    if (mode === "A4" || mode === "A5") {
      const { width, height } = dimensionsFor(mode, orientation);
      applyPageSize(width, height);
    }
  };

  const handleOrientationChange = (orient: "portrait" | "landscape") => {
    setOrientation(orient);
    const { width, height } = dimensionsFor(pageSizeMode, orient);
    applyPageSize(width, height);
  };

  // Page Before/After/Remove Page — shared with CustomFieldDesignerPageEditorView.tsx
  // and ProductPageDesignerEditorView.tsx (src/common/pdfmeDesigner/
  // usePageManipulation.ts); requireEdit is referenced lazily (only called
  // once these buttons are actually clicked, by which point it's already
  // defined further down this same component) so it doesn't need to be
  // declared before this hook call.
  const { targetPageNumber, setTargetPageNumber, addPageBefore, addPageAfter, removeCurrentPage } = usePageManipulation(
    designerRef,
    selectedField,
    askConfirm,
    () => requireEdit(),
  );

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

  // No setLoading()/full-screen overlay here — used by the manual "Save
  // Draft" button, which wraps this with the overlay itself, below.
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

  // Header/footer toolbar — applied live to the draft via apply-options,
  // not deferred to Save Draft. Always carries ALL FOUR fields (current
  // state for whichever ones the caller doesn't override) — applyTemplateOptions'
  // header branch rebuilds from scratch via getTemplate(), which defaults
  // any omitted field back to its built-in default, silently discarding a
  // custom header height, variant, or footer setting the moment any ONE of
  // them changes.
  const applyHeaderOptions = async (overrides: {
    headerVariant?: string;
    headerHeightMM?: number;
    footerImage?: boolean;
    footerHeightMM?: number;
    pageBorder?: boolean;
    pageBorderColor?: string;
    pageBorderWidth?: number;
  }) => {
    if (!requireEdit() || !currentTemplateId) return;
    const next = {
      headerVariant,
      headerHeightMM,
      footerImage,
      footerHeightMM,
      pageBorder,
      pageBorderColor,
      pageBorderWidth,
      // Backend's own defaults are 10mm each — without sending the CURRENT
      // values here, any header/footer/border option change (this is the
      // only path that reaches buildDocTemplate) would silently reset a
      // custom left/right margin set via the Margins toolbar back to 10.
      marginLeft,
      marginRight,
      ...overrides,
    };
    // Header rebuilds can add/remove/rename header-block fields entirely
    // (e.g. "Details" -> "Image" swaps text fields for an image field), so
    // re-selecting by name is a best-effort match, not guaranteed — if the
    // named field no longer exists, selectSchemas() just selects nothing
    // rather than throwing.
    const target = selectedField ? { name: selectedField.name, pageIndex: selectedField.pageIndex } : null;
    const updated = await applyOptionsToDraft(currentTemplateId, docType, { header: next });
    if (updated && designerRef.current) {
      // Backend rebuilds staticSchema from scratch on every header/footer
      // change (buildHeaderFields/buildFooterFields, blank placeholder
      // content) — without re-injecting, the real company image that was
      // showing gets wiped back to blank on every height/variant/footer edit.
      designerRef.current.updateTemplate(injectRealCompanyHeaderData(updated, companyData));
      setHeaderVariant(next.headerVariant);
      setHeaderHeightMM(next.headerHeightMM);
      setFooterImage(next.footerImage);
      setFooterHeightMM(next.footerHeightMM);
      setPageBorder(next.pageBorder);
      setPageBorderColor(next.pageBorderColor);
      setPageBorderWidth(next.pageBorderWidth);
      // updateTemplate() always clears pdfme's internal selection (confirmed
      // via source-reading — it swaps the template object reference, which
      // pdfme's own TemplateEditor treats as a signal to reset selection).
      // Header-variant changes rebuild multiple fields at once so they can't
      // go through changeSchemas() the way per-field edits now do — this
      // best-effort deferred re-select is what's left; worst case the user
      // re-clicks the field.
      if (target) {
        setTimeout(() => {
          designerRef.current?.selectSchemas(target);
        }, 0);
      }
    }
  };

  const applyHeaderVariant = (variant: string) => applyHeaderOptions({ headerVariant: variant });
  const applyHeaderHeight = (heightMM: number) => {
    if (!heightMM || heightMM <= 0) return;
    applyHeaderOptions({ headerHeightMM: heightMM });
  };
  const applyFooterImage = (enabled: boolean) => applyHeaderOptions({ footerImage: enabled });
  const applyFooterHeight = (heightMM: number) => {
    if (!heightMM || heightMM <= 0) return;
    applyHeaderOptions({ footerHeightMM: heightMM });
  };
  const applyPageBorder = (enabled: boolean) => applyHeaderOptions({ pageBorder: enabled });
  const applyPageBorderColor = (color: string) => applyHeaderOptions({ pageBorderColor: color });
  const applyPageBorderWidth = (widthMM: number) => {
    if (widthMM < 0) return;
    applyHeaderOptions({ pageBorderWidth: widthMM });
  };

  // A template whose basePdf has never been through applyTemplateOptions'
  // header branch at all has `footerImage === undefined`, not `false` — vs
  // one that's EXPLICITLY had it turned off, which is always a real boolean
  // (buildTemplate.js's own default footerImage=false writes a concrete
  // value on every build). Only that undefined/never-decided case gets
  // auto-enabled here, and only when the company already has a footer image
  // configured — an explicit past "off" choice (e.g. a narrow receipt
  // that's deliberately footer-less) is never overridden. Takes id/template
  // directly rather than reading currentTemplateId/designerRef state,
  // because this runs synchronously right after openTemplate's setState
  // calls, before their closures would see the update.
  const maybeAutoEnableFooterImage = async (id: number, template: any) => {
    if (template?.basePdf?.footerImage !== undefined) return;
    if (!companyData?.footer_img) return;
    if (!canEdit && !canAdd) return;
    const updated = await applyOptionsToDraft(id, docType, {
      header: {
        headerVariant: template?.basePdf?.headerVariant || "details",
        headerHeightMM: template?.basePdf?.headerHeightMM ?? 28.5,
        footerImage: true,
        footerHeightMM: template?.basePdf?.footerHeightMM ?? 28.5,
        pageBorder: !!template?.basePdf?.pageBorder,
        pageBorderColor: template?.basePdf?.pageBorderColor || "#000000",
        pageBorderWidth: template?.basePdf?.pageBorderWidth ?? 0.5,
        marginLeft: template?.basePdf?.padding?.[3] ?? 10,
        marginRight: template?.basePdf?.padding?.[1] ?? 10,
      },
    });
    if (updated && designerRef.current) {
      designerRef.current.updateTemplate(injectRealCompanyHeaderData(updated, companyData));
      syncHeaderOptionsFromTemplate(updated);
    }
  };

  // Patches only the itemsTable field in place via pdfme's own changeSchemas
  // API, instead of designerRef.current.updateTemplate(wholeNewTemplate)
  // (what applyHeaderVariant does) — updateTemplate() swaps the entire
  // template object, which clears pdfme's internal field selection and
  // closes this very sidebar panel the checkbox lives in (confirmed bug:
  // toggling a checkbox deselected the items table and hid the panel).
  // changeSchemas() patches just this field's structural props, so the
  // selection — and this panel — stays open. The backend call itself is
  // unchanged (applyOptionsToDraft already persists the new draft as a side
  // effect; tableColumns.js stays the single source of truth for columns).
  const applyColumnToggle = async (
    columnOptions: Record<string, boolean>,
    changeSchemas: (objs: { key: string; value: unknown; schemaId: string }[]) => void,
    schemaId: string,
  ) => {
    if (!requireEdit() || !currentTemplateId) return;
    // Send the FULL column state (not just the one key that changed) — the
    // backend rebuild treats whatever it receives as the complete desired
    // set, so a partial patch here would silently drop other already-on
    // columns.
    const updated = await applyOptionsToDraft(currentTemplateId, docType, { columnOptions });
    if (!updated) return;
    const freshTable = (updated.schemas?.[0] || []).find((f: any) => f.name === "itemsTable");
    if (!freshTable) return;
    changeSchemas([
      { key: "head", value: freshTable.head, schemaId },
      { key: "content", value: freshTable.content, schemaId },
      { key: "headWidthPercentages", value: freshTable.headWidthPercentages, schemaId },
      { key: "columnStyles", value: freshTable.columnStyles, schemaId },
      { key: "columnOptions", value: freshTable.columnOptions, schemaId },
    ]);
  };
  // Keep the merged-into-pdfme's-sidebar widget calling the latest closure.
  columnToggleBridge.current = applyColumnToggle;

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

  // Report mode's Generate Preview — live report rows (a report has no fixed
  // schema to fake sample rows against, unlike the cart doc types' own
  // getSampleDataForPreview), draft template, no file/disk write.
  const handleReportGeneratePreview = async () => {
    if (!currentTemplateId || !reportDefinitionId) return;
    setReportPreviewing(true);
    try {
      await saveDraftSilently();
      const pdfBase64 = await previewReportPdf(reportDefinitionId, currentTemplateId);
      if (!pdfBase64) return;
      const byteChars = atob(pdfBase64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } finally {
      setReportPreviewing(false);
    }
  };

  const runPreview = async (cart_id?: number) => {
    if (!currentTemplateId) return;
    setStatus("Generating preview...");
    // Preview reads draft_template_json straight from the DB - without
    // saving first, it shows whatever was last saved, not the live canvas
    // (e.g. a just-toggled Rich text field wouldn't show as bold yet).
    await saveDraftSilently();
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

  if (!reportMode && rights === null) {
    return <div className="p-4">Loading...</div>;
  }

  if (!canView) {
    return <div className="p-4">You don't have permission to view this page.</div>;
  }

  // reportMode renders this whole screen inside a modal overlay instead of
  // as a full-page route — everything else (topbar/body/every modal below)
  // is completely unchanged between the two modes.
  const screen = (
    <div className={reportMode ? "dd-page dd-page--modal" : "dd-page"}>
      <style>{`
        .dd-page { display: flex; flex-direction: column; height: 100vh; }
        /* reportMode mounts this inside a fixed-position modal overlay
           (below) instead of as its own routed page — 100vh there would
           blow past the overlay's own bounds, so this mode fills its
           flex parent's actual height instead. Higher specificity
           (two classes) wins over the plain .dd-page rule above regardless
           of source order. */
        .dd-page.dd-page--modal { height: 100%; }
        .dd-topbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #ddd; flex-wrap: wrap; flex-shrink: 0; }
        .dd-body { flex: 1; min-height: 0; display: flex; }
        .dd-canvas-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .dd-accordion-panel { width: 340px; flex-shrink: 0; border-left: 1px solid #ddd; overflow-y: auto; }
        @media (max-width: 900px) {
          .dd-body { flex-direction: column; }
          .dd-accordion-panel { width: 100%; border-left: none; border-top: 1px solid #ddd; max-height: 45vh; }
        }
        /* Accent color: orange (#f58634), not bootstrap's default blue —
           scoped to this page only, doesn't touch shared bootstrap classes
           used elsewhere in the app. */
        .dd-page .btn-primary { background-color: #f58634; border-color: #f58634; }
        .dd-page .btn-primary:hover, .dd-page .btn-primary:focus { background-color: #d9701f; border-color: #d9701f; }
        .dd-page .btn-outline-primary { color: #f58634; border-color: #f58634; }
        .dd-page .btn-outline-primary:hover { background-color: #f58634; border-color: #f58634; color: #fff; }
        .dd-page input[type="checkbox"]:checked,
        .dd-page input[type="radio"]:checked { background-color: #f58634; border-color: #f58634; }
        .dd-page .form-select:focus,
        .dd-page .form-control:focus,
        .dd-page input:focus { border-color: #f58634; box-shadow: 0 0 0 0.2rem rgba(245, 134, 52, 0.25); }
        .dd-accordion-panel .accordion-button:not(.collapsed) { background-color: #fff5ec; color: #d9701f; box-shadow: none; }
        .dd-accordion-panel .accordion-button:focus { box-shadow: 0 0 0 0.2rem rgba(245, 134, 52, 0.25); border-color: #f58634; }
        ${PDFME_HIDE_NATIVE_PAGE_MENU_CSS}
      `}</style>
      <div className="dd-topbar">
        {reportMode ? (
          <strong style={{ fontSize: 14 }}>PDF Templates — {reportMode.reportName}</strong>
        ) : (
          <>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
              &larr; Back
            </button>
            <strong style={{ fontSize: 14 }}>
              {SUPPORTED_DOC_TYPES.find((d) => d.id === docType)?.label} — Document Designer
            </strong>
          </>
        )}
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
        <button className="btn btn-sm btn-outline-secondary" onClick={openVersionHistory} disabled={!currentTemplateId}>Version History</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={handleDiscardDraft} disabled={!currentTemplateId}>Discard Draft</button>
        <button className="btn btn-sm btn-secondary" onClick={handleSaveDraft} disabled={!currentTemplateId}>Save Draft</button>
        {CART_SHAPED_DOC_TYPES.has(docType) && (
          <button className="btn btn-sm btn-outline-primary" onClick={openPreviewPicker} disabled={!currentTemplateId}>Generate Preview</button>
        )}
        {reportMode && (
          <button className="btn btn-sm btn-outline-primary" onClick={handleReportGeneratePreview} disabled={!currentTemplateId || reportPreviewing}>
            {reportPreviewing ? "Generating..." : "Generate Preview"}
          </button>
        )}
        <button className="btn btn-sm" style={{ background: "#f58634", color: "#fff" }} onClick={handlePublish} disabled={!currentTemplateId}>
          Publish
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowAccordionPanel((v) => !v)}
          title={showAccordionPanel ? "Hide side panel" : "Show side panel"}
        >
          {showAccordionPanel ? "Hide Panel ▶" : "Show Panel ◀"}
        </button>
        {reportMode && (
          <button className="btn btn-sm btn-outline-secondary" onClick={reportMode.onClose}>
            Close
          </button>
        )}
      </div>

      <div className="dd-body">
        <div className="dd-canvas-area">
          <div style={{ padding: "4px 12px", fontSize: 12, color: "#666" }}>{status}</div>
          <div ref={designerContainerRef} style={{ flex: 1, minHeight: 480 }} />
        </div>

        {showAccordionPanel && (
        <div className="dd-accordion-panel">
          <Accordion defaultActiveKey={["templates", "header", "page"]} alwaysOpen>
            <Accordion.Item eventKey="templates">
              <Accordion.Header>Templates</Accordion.Header>
              <Accordion.Body>
                {!reportMode && (
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
                )}
                <div className="d-flex flex-column gap-2 mb-3">
                  <button className="btn btn-sm btn-primary" onClick={handleNewTemplate} disabled={!canAdd && !canEdit}>
                    + New Template
                  </button>
                  {!reportMode && (
                    <>
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
                    </>
                  )}
                </div>

                <TemplateSidebar
                  templates={templates}
                  currentTemplateId={currentTemplateId}
                  onOpen={openTemplate}
                  onMove={moveTemplate}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              </Accordion.Body>
            </Accordion.Item>

            {CART_SHAPED_DOC_TYPES.has(docType) && (
              <Accordion.Item eventKey="header">
                <Accordion.Header>Header</Accordion.Header>
                <Accordion.Body>
                  <select
                    className="form-select form-select-sm mb-2"
                    onChange={(e) => applyHeaderVariant(e.target.value)}
                    value={headerVariant}
                  >
                    <option value="details">Header: Details</option>
                    <option value="image">Header: Image</option>
                    <option value="logoLeft">Header: Logo Left</option>
                    <option value="logoRight">Header: Logo Right</option>
                  </select>
                  {headerVariant === "image" && (
                    <label className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 12 }}>
                      Height (mm):
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: 70 }}
                        min={5}
                        max={100}
                        value={headerHeightMM}
                        onChange={(e) => setHeaderHeightMM(Number(e.target.value))}
                        onBlur={(e) => applyHeaderHeight(Number(e.target.value))}
                      />
                    </label>
                  )}
                  <hr style={{ margin: "8px 0" }} />
                  <label className="form-check-label d-flex align-items-center gap-1 mb-2" style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={footerImage}
                      onChange={(e) => applyFooterImage(e.target.checked)}
                    />
                    Show Footer Image
                  </label>
                  {footerImage && (
                    <label className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 12 }}>
                      Footer Height (mm):
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: 70 }}
                        min={5}
                        max={100}
                        value={footerHeightMM}
                        onChange={(e) => setFooterHeightMM(Number(e.target.value))}
                        onBlur={(e) => applyFooterHeight(Number(e.target.value))}
                      />
                    </label>
                  )}
                  <hr style={{ margin: "8px 0" }} />
                  <label className="form-check-label d-flex align-items-center gap-1 mb-2" style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={pageBorder}
                      onChange={(e) => applyPageBorder(e.target.checked)}
                    />
                    Full Page Border
                  </label>
                  {pageBorder && (
                    <label className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 12 }}>
                      Border Color:
                      <input
                        type="color"
                        className="form-control form-control-sm p-0"
                        style={{ width: 40, height: 28 }}
                        value={pageBorderColor}
                        onChange={(e) => {
                          setPageBorderColor(e.target.value);
                          applyPageBorderColor(e.target.value);
                        }}
                      />
                    </label>
                  )}
                  {pageBorder && (
                    <label className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 12 }}>
                      Border Size (mm):
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: 70 }}
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={pageBorderWidth}
                        onChange={(e) => setPageBorderWidth(Number(e.target.value))}
                        onBlur={(e) => applyPageBorderWidth(Number(e.target.value))}
                      />
                    </label>
                  )}
                  <p style={{ fontSize: 11, color: "#888", margin: "4px 0 8px" }}>
                    Column toggles (HSN/Discount/GST/Image) and each field's Data Binding /
                    Visibility live in that field's own properties now — click it on the canvas
                    to edit them.
                  </p>
                  <label className="form-check-label d-flex align-items-center gap-1" style={{ fontSize: 12 }} title="Splice each cart item's own Product Page Designer page after this document, in item order">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={!!currentTemplateFull?.include_product_pages}
                      onChange={(e) => toggleIncludeProductPages(e.target.checked)}
                    />
                    Show product-wise pages
                  </label>
                </Accordion.Body>
              </Accordion.Item>
            )}

            <Accordion.Item eventKey="page">
              <Accordion.Header>Page</Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select form-select-sm mb-2"
                  value={pageSizeMode}
                  onChange={(e) => handlePageSizeModeChange(e.target.value as "A4" | "A5" | "custom")}
                  disabled={!currentTemplateId}
                >
                  <option value="A4">Page: A4</option>
                  <option value="A5">Page: A5</option>
                  <option value="custom">Page: Custom</option>
                </select>
                <div className="btn-group btn-group-sm mb-2" role="group">
                  <button
                    type="button"
                    className={`btn ${orientation === "portrait" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleOrientationChange("portrait")}
                    disabled={!currentTemplateId}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    className={`btn ${orientation === "landscape" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleOrientationChange("landscape")}
                    disabled={!currentTemplateId}
                  >
                    Landscape
                  </button>
                </div>
                {pageSizeMode === "custom" && (
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: 70 }}
                      min={1}
                      value={customPageWidth}
                      onChange={(e) => setCustomPageWidth(Number(e.target.value))}
                      placeholder="W mm"
                      disabled={!currentTemplateId}
                    />
                    <span style={{ fontSize: 12 }}>×</span>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: 70 }}
                      min={1}
                      value={customPageHeight}
                      onChange={(e) => setCustomPageHeight(Number(e.target.value))}
                      placeholder="H mm"
                      disabled={!currentTemplateId}
                    />
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setOrientation(customPageWidth > customPageHeight ? "landscape" : "portrait");
                        applyPageSize(customPageWidth, customPageHeight);
                      }}
                      disabled={!currentTemplateId}
                    >
                      Apply
                    </button>
                  </div>
                )}

                <hr />
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Margins (mm)</div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                    Top
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: 60 }}
                      min={0}
                      value={marginTop}
                      onChange={(e) => setMarginTop(Number(e.target.value))}
                      disabled={!currentTemplateId}
                    />
                  </label>
                  <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                    Right
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: 60 }}
                      min={0}
                      value={marginRight}
                      onChange={(e) => setMarginRight(Number(e.target.value))}
                      disabled={!currentTemplateId}
                    />
                  </label>
                  <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                    Bottom
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: 60 }}
                      min={0}
                      value={marginBottom}
                      onChange={(e) => setMarginBottom(Number(e.target.value))}
                      disabled={!currentTemplateId}
                    />
                  </label>
                  <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                    Left
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: 60 }}
                      min={0}
                      value={marginLeft}
                      onChange={(e) => setMarginLeft(Number(e.target.value))}
                      disabled={!currentTemplateId}
                    />
                  </label>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => applyMargins(marginTop, marginRight, marginBottom, marginLeft)}
                    disabled={!currentTemplateId}
                  >
                    Apply
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
                  Fields don't reposition themselves when a margin shrinks or grows — same as
                  page size/orientation above, this only changes the page's own padding.
                </p>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </div>
        )}
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

      <PromptModal
        show={!pinVerified || showPinModal}
        onHide={pinVerified ? handlePinCancel : () => (reportMode ? reportMode.onClose() : navigate(-1))}
        onSubmit={handlePinSubmit}
        title="Owner PIN required"
        message={
          pinVerified
            ? "This action needs the shared build PIN (same PIN as Report Builder)."
            : "Document Designer is an owner-only area. Enter the shared build PIN to continue (same PIN as Report Builder)."
        }
        placeholder="PIN"
        submitLabel="Verify"
      />

      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          Loading...
        </div>
      )}
    </div>
  );

  if (reportMode) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050, display: "flex" }}>
        <div style={{ background: "#fff", margin: 20, flex: 1, display: "flex", flexDirection: "column", borderRadius: 6, overflow: "hidden" }}>
          {screen}
        </div>
      </div>
    );
  }
  return screen;
};

export default DocumentDesignerView;
