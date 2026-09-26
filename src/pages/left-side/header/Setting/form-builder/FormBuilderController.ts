import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { axiosInstanceFormData } from "../../../../../services/axiosInstanceFormData";

// Mirrors pageTypesCustomFieldList's shape/convention (CustomInquiryFromController.ts).
export const relatedModuleOptions = [
  { id: "contact", label: "Contact" },
  { id: "product", label: "Product" },
  { id: "inquiry", label: "Inquiry" },
  { id: "order", label: "Order" },
  { id: "task", label: "Task" },
  { id: "support_ticket", label: "Support Ticket" },
  { id: "work_order", label: "Work Order (Production)" },
];

// Field-type option list backing fieldTypes.ts's registry keys. Entries
// flagged comingSoon are reserved for later Form Builder v2 phases: known to
// the type system and the fill registry (so a schema carrying them round-trips
// and renders without crashing) but not offered in the editor's type picker.
export const fieldTypeOptions: { id: string; label: string; comingSoon?: boolean }[] = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "textarea", label: "Text Area" },
  { id: "date", label: "Date" },
  { id: "datetime", label: "Date & Time" },
  { id: "dropdown", label: "Dropdown" },
  { id: "checkbox", label: "Checkbox" },
  { id: "switch", label: "Switch" },
  { id: "file", label: "File Upload" },
  { id: "signature", label: "Signature" },
  { id: "image", label: "Image Capture" },
  { id: "radio", label: "Radio" },
  { id: "multi-select", label: "Multi Select" },
  { id: "rating", label: "Rating" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "url", label: "URL" },
  { id: "address", label: "Address" },
  { id: "section-header", label: "Section Header" },
  { id: "repeater", label: "Repeating Table" },
  { id: "reference", label: "Reference (Master Data)" },
  { id: "instruction", label: "Instruction / Note" },
  { id: "auto-number", label: "Auto Number" },
  { id: "customer-lookup", label: "Customer Lookup" },
  { id: "question-table", label: "Question Table" },
  { id: "calculation", label: "Calculation" },
  { id: "user", label: "Team Member" },
  { id: "time", label: "Time" },
  { id: "currency", label: "Amount (₹)" },
  { id: "percentage", label: "Percentage" },
  { id: "location", label: "GPS Location" },
  { id: "barcode", label: "Barcode / QR Scan" },
  { id: "consent", label: "Consent (I agree to the terms)" },
];

// Types that never produce an answer value (layout/content only).
export const NON_VALUE_FIELD_TYPES = ["section-header", "instruction"];

export type FieldFormatPreset = "mobile" | "email" | "gst" | "pan" | "ifsc" | "pincode" | "aadhaar" | "vehicle_no";

export type SensitiveStorage = "masked" | "encrypted";

// True when a field's saved value is the full, encrypted Aadhaar number (list/get
// still return it masked; the full number needs revealSubmissionField).
export const isEncryptedField = (f: IFormBuilderField): boolean =>
  f.format_preset === "aadhaar" && f.sensitive_storage === "encrypted";

export const referenceMasterOptions = [
  { id: "country", label: "Country" },
  { id: "state", label: "State" },
  { id: "city", label: "City" },
  { id: "category", label: "Category" },
  { id: "product", label: "Product" },
];

// Auto Number field settings (plan item B) — same shape the backend's
// formBuilderAutoNumber.js reads.
export interface IAutoNumberConfig {
  prefix?: string;
  format?: string; // must contain {SEQ}
  start?: number;
  padding?: number;
  reset?: "never" | "fy" | "year" | "month";
  series_by?: string | null; // key of another field
  series_prefixes?: Record<string, string>; // series value -> prefix
  date_field?: string | null; // date field the year/month is taken from
}

// Per-form permissions (plan section 3/7) — shapes from the backend's
// /form-builder/:id/permissions/list and /form-builder/permission-options.
export interface IFormPermissionItem {
  permission_key: string;
  a_application_login_id: number | null;
  team_id: number | null;
  name: string;
}
export interface IPermissionOptions {
  users: { a_application_login_id: number; name: string; team_id: number | null }[];
  teams: { team_id: number; name: string }[];
}

// Custom lists (plan E1) — Division, Department, Site ... a Reference field
// uses one as master "custom:<id>".
export interface ICustomList {
  id: number;
  name: string;
  items: { id: number; label: string }[];
}

// Customer details a Customer lookup field can copy into other fields;
// same keys as the backend's CONTACT_LOOKUP_COLUMNS.
export const CONTACT_LOOKUP_COLUMNS: Record<string, string> = {
  person_name: "Person name",
  company_name: "Company name",
  mobile_number: "Mobile number",
  email_id: "Email",
  city: "City",
  address: "Address",
  pincode: "Pincode",
  gst_number: "GST number",
};

// Fields the current user may not fully see or change (from /form-builder/get and /submissions/get|list).
export interface IRestricted {
  hidden: string[];
  masked: string[];
  readonly: string[];
}

export interface IFormBuilderField {
  id: number;
  key: string;
  type: string;
  label: string;
  required?: boolean;
  filterable?: boolean;
  unique?: boolean;
  visible_to?: "internal" | "public" | "both";
  width?: "full" | "half" | "third";
  options?: string[];
  default?: any;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  help_text?: string | null;
  match_key?: "email" | "phone" | null;
  multiple?: boolean;
  max_files?: number;
  master?: string;
  cascades_from?: string;
  columns?: IFormBuilderField[]; // repeater sub-fields
  placeholder?: string | null;
  default_today?: boolean; // date/datetime: prefill today / now on a new submission
  format_preset?: FieldFormatPreset | null;
  // Aadhaar preset only (plan O1): "masked" keeps just the last 4 digits
  // (default); "encrypted" keeps the full number encrypted, readable only via
  // revealSubmissionField. Cleared when the preset is changed away from Aadhaar.
  sensitive_storage?: SensitiveStorage;
  content?: string; // type "instruction" only
  // Reserved for later v2 phases — kept here only so they round-trip through
  // the editor untouched; no UI yet.
  conditions?: any;
  required_conditions?: any;
  edit_rule?: any;
  auto_number?: IAutoNumberConfig;
  // Calculation (plan H, O5, O6): formula text, number or date result, decimals
  // (0-4) and optional result labels ("from 50 = Pass").
  formula?: string;
  result_type?: "number" | "date";
  decimals?: number;
  result_ranges?: { from: number; label: string }[];
  // Question table (plan G): questions, answer columns and scoring.
  questions?: { id: string; text: string; required?: boolean; conditions?: any; points?: Record<string, number> }[];
  answer_columns?: { key: string; label: string; type: string }[];
  scored?: boolean;
  // Customer lookup (plan F2): contact column -> the form field that receives it.
  lookup_map?: Record<string, string>;
  // Product line in a repeater (plan N5), on a "reference" column with master "product":
  // product detail (rate/unit/product_code) -> the sibling column that receives it.
  product_fill_map?: Record<string, string>;
  // Team member field (plan E2): start with the person filling the form.
  default_current_user?: boolean;
  // Show this field's answer as a column in the entries list (Auto Number: on unless false).
  show_in_list?: boolean;
  // Approval stages (plan I): the stage that fills this field (default: the first stage).
  stage?: string;
  // Photo (type "image"): open the camera directly, and print date / time / place on the picture.
  image_camera?: boolean;
  image_stamp?: { datetime?: boolean; location?: boolean };
  // Who gets the full field (plan O8): "none", "readonly" (visible, not changeable),
  // "mask" (shown as ••••), "hide" (left out) — for everyone without the form's
  // "See restricted fields" permission. Never asked on a public form.
  restriction?: "none" | "readonly" | "mask" | "hide";
  // Second language (plan M8): translated texts, see language.ts. `option_labels` exists only on the
  // display copies made by localizeFields.
  translations?: { label?: string; help_text?: string; placeholder?: string; content?: string; options?: string[] };
  option_labels?: string[];
}

export interface IFormBuilderForm {
  id: number;
  title: string;
  description?: string;
  schema_json: string;
  published_schema_json?: string | null;
  // Form-level settings (approval stages ...), draft and published as JSON text.
  settings_json?: string | null;
  published_settings_json?: string | null;
  has_unpublished_changes?: number;
  version?: number;
  related_module?: string | null;
  allow_public_submission?: number;
  share_token?: string | null;
  restrict_to_assigned_team?: number;
  a_application_login_id?: number;
  company_qr_code?: string | null;
}

// Public share link shape, matches the backend's /f/:qrCode/:shareToken
// route (RoutesIndex.tsx) exactly.
export const publicFormUrl = (form: IFormBuilderForm): string | null => {
  if (!form.allow_public_submission || !form.share_token || !form.company_qr_code) return null;
  return `${window.location.origin}/f/${form.company_qr_code}/${form.share_token}`;
};

const uuid = () => Number(localStorage.getItem("UUID"));

function handleFail(data: any) {
  toast.error(data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
}

// `quiet` skips the error toasts — the caller shows the problem itself (the
// editor's autosave puts it in its "Couldn't save" indicator instead of
// raising a toast every few seconds).
async function post(path: string, body: Record<string, any>, opts: { quiet?: boolean } = {}) {
  try {
    const { data } = await axiosInstance.post(path, {
      ...body,
      a_application_login_id: uuid(),
    });
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS && !opts.quiet) {
      handleFail(data);
    }
    return data;
  } catch (error: any) {
    if (!opts.quiet) toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
}

// ---------- Forms ----------

export const listForms = (body: Record<string, any> = {}) => post("form-builder/list", body);
export const getForm = (id: number) => post("form-builder/get", { id });
export interface IStarterTemplate {
  key: string;
  title: string;
  description: string;
  category: string | null;
  field_count: number;
}
export interface ICompanyTemplate {
  id: number;
  title: string;
  description: string;
  field_count: number;
}
export type TemplateChoice = { source: "builtin"; key: string } | { source: "company"; id: number };

export const createForm = (body: { title: string; description?: string; related_module?: string; template?: TemplateChoice }) =>
  post("form-builder/create", body);
export const updateDraftForm = (body: { id: number; [key: string]: any }) => post("form-builder/update", body);
// Same call for the editor's autosave — no toasts; failures come back as
// null / ack !== 1 for the caller to show.
export const updateDraftFormQuiet = (body: { id: number; [key: string]: any }) =>
  post("form-builder/update", body, { quiet: true });
export const publishForm = (id: number, expected_version?: number) =>
  post("form-builder/publish", { id, expected_version });
export const discardDraftForm = (id: number) => post("form-builder/discard-draft", { id });
export const deleteForm = (id: number) => post("form-builder/delete", { id });
export const duplicateForm = (id: number) => post("form-builder/duplicate", { id });
export const togglePublicLink = (id: number, allow_public_submission: boolean) =>
  post("form-builder/toggle-public-link", { id, allow_public_submission });
export const regenerateShareToken = (id: number) => post("form-builder/regenerate-share-token", { id });
export const getReferenceOptions = (master: string, parentId?: number) =>
  post("form-builder/reference-options", { master, parentId });
export const getFormAuditLog = (id: number) => post(`form-builder/${id}/audit-log`, {});
export const listFormTeamRights = (id: number) => post(`form-builder/${id}/team-rights/list`, {});
export const saveFormTeamRights = (id: number, grants: any[], removals: number[]) =>
  post(`form-builder/${id}/team-rights`, { grants, removals });
export const listPublishedFormsForFilling = () => post("form-builder/published/list", {});

// ---------- Submissions ----------

export const listSubmissions = (form_id: number, opts: { filters?: any; search?: string; limit?: number; offset?: number } = {}) =>
  post("form-builder/submissions/list", { form_id, ...opts });
export const getSubmission = (form_id: number, id: number) => post("form-builder/submissions/get", { form_id, id });
export const deleteSubmission = (form_id: number, id: number) => post("form-builder/submissions/delete", { form_id, id });
export const updateSubmissionStatus = (form_id: number, id: number, status_id: number) =>
  post("form-builder/submissions/update-status", { form_id, id, status_id });
export const linkDuplicateContact = (form_id: number, id: number) =>
  post("form-builder/submissions/link-duplicate", { form_id, id });
export const dismissDuplicateContact = (form_id: number, id: number) =>
  post("form-builder/submissions/dismiss-duplicate", { form_id, id });
export const getSubmissionAuditLog = (form_id: number, id: number) =>
  post(`form-builder/submissions/${id}/audit-log`, { form_id, id });
// Full value of one encrypted field (response data.value). Only offered when
// the list/get response carried can_reveal_sensitive: true; the server
// re-checks the permission and audit-logs every reveal.
export const revealSubmissionField = (form_id: number, id: number, field_key: string) =>
  post("form-builder/submissions/reveal-field", { form_id, id, field_key });
export const exportSubmissionPdf = (form_id: number, id: number) =>
  post("form-builder/submissions/export-pdf", { form_id, id });
export const exportSubmissionsBulkPdf = (form_id: number, filters?: any) =>
  post("form-builder/submissions/export-bulk-pdf", { form_id, filters });
export const exportSubmissionsExcel = (form_id: number, filters?: any) =>
  post("form-builder/submissions/export-excel", { form_id, filters });

// Create/update take FormData because file/signature/image field answers
// need real bytes alongside the JSON answers (plan §7 "multipart/form-data,
// not a plain JSON POST"). answers is JSON.stringify'd into one text field;
// files are appended individually keyed by their field's `key` so multer's
// .any() + formBuilderSubmissionService.js's attachUploadedFiles line them
// back up by fieldname.
function buildSubmissionFormData(
  body: Record<string, any>,
  files: { key: string; file: File }[],
) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  });
  fd.append("a_application_login_id", String(uuid()));
  files.forEach(({ key, file }) => fd.append(key, file, file.name));
  return fd;
}

export const createSubmission = async (
  form_id: number,
  answers: Record<string, any>,
  files: { key: string; file: File }[],
  extra: Record<string, any> = {},
) => {
  try {
    const fd = buildSubmissionFormData({ form_id, answers: JSON.stringify(answers), ...extra }, files);
    const { data } = await axiosInstanceFormData.post("form-builder/submissions/create", fd);
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) handleFail(data);
    return data;
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
};

export const updateSubmission = async (
  form_id: number,
  id: number,
  answers: Record<string, any>,
  files: { key: string; file: File }[],
  extra: Record<string, any> = {},
) => {
  try {
    const fd = buildSubmissionFormData({ form_id, id, answers: JSON.stringify(answers), ...extra }, files);
    const { data } = await axiosInstanceFormData.post("form-builder/submissions/update", fd);
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) handleFail(data);
    return data;
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
};

// Live "next number will look like ..." for the Auto Number settings.
// Quiet: a half-typed format shouldn't raise error toasts — the caller shows
// the returned message inline instead.
export async function previewAutoNumber(body: {
  auto_number: IAutoNumberConfig;
  fields: IFormBuilderField[];
  key?: string;
  series_value?: string;
}) {
  return post("form-builder/auto-number-preview", body, { quiet: true });
}

export const listFormPermissions = (id: number) => post(`form-builder/${id}/permissions/list`, {});
export const saveFormPermissions = (id: number, grants: any[], removals: any[]) =>
  post(`form-builder/${id}/permissions/save`, { grants, removals });
export const getFormPermissionOptions = () => post("form-builder/permission-options", {});

export const listCustomLists = () => post("form-builder/custom-lists/list", {});
export const saveCustomList = (body: { id?: number; name: string; items: { id?: number | null; label: string }[] }) =>
  post("form-builder/custom-lists/save", body);
export const deleteCustomList = (id: number) => post("form-builder/custom-lists/delete", { id });
// Quiet: an empty / failed search just shows "no customer found".
export const searchCustomers = (form_id: number, q: string) => post("form-builder/customer-search", { form_id, q }, { quiet: true });
// Product line auto-fill in a repeater (plan N5): rate/unit/code for a picked product.
export const getProductFillValues = (form_id: number, product_id: number) =>
  post("form-builder/product-fill-values", { form_id, product_id }, { quiet: true });

// The empty form as a PDF, to print and fill in by hand (plan O9).
export const exportBlankFormPdf = (form_id: number) => post("form-builder/export-blank-pdf", { form_id });

// Approve or send back an entry at its current approval stage.
export const stageAction = (form_id: number, id: number, action: "approve" | "send_back", comment?: string) =>
  post("form-builder/submissions/stage-action", { form_id, id, action, comment });

// Starter forms and saved templates (plan L1-L3).
export const listTemplates = () => post("form-builder/templates/list", {});
export const saveTemplateFromForm = (form_id: number, title: string, description?: string) =>
  post("form-builder/templates/save-from-form", { form_id, title, description });
export const deleteTemplate = (id: number) => post("form-builder/templates/delete", { id });

// Every entry on its own page(s) in one PDF (plan K4).
export const exportSubmissionsPagesPdf = (form_id: number, filters?: any) =>
  post("form-builder/submissions/export-bulk-pdf", { form_id, filters, layout: "pages" });

// ---------- Recurring forms (plan Q1/Q2) ----------

export type ScheduleFrequency = "daily" | "weekly" | "monthly";
export interface IFormSchedule {
  id?: number;
  form_id?: number;
  title: string;
  frequency: ScheduleFrequency;
  weekdays: number[]; // 0 = Sunday
  day_of_month: number | null;
  assignee_login_ids: number[];
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  isActive?: number;
}
export type ScheduleEntryState = "due" | "missed" | "done";
export interface IDueForm {
  id: number; // schedule entry id
  form_id: number;
  form_title: string;
  schedule_title: string;
  due_date: string;
  state: ScheduleEntryState;
}
export interface IScheduleReportItem {
  id: number;
  due_date: string;
  a_application_login_id: number;
  user_name: string;
  submission_id: number | null;
  state: ScheduleEntryState;
}
export interface IScheduleReportSummary {
  a_application_login_id: number;
  user_name: string;
  done: number;
  missed: number;
  due: number;
}

export const listFormSchedules = (form_id: number) => post("form-builder/schedules/list", { form_id });
export const saveFormSchedule = (form_id: number, schedule: IFormSchedule) => post("form-builder/schedules/save", { form_id, ...schedule });
export const deleteFormSchedule = (form_id: number, id: number) => post("form-builder/schedules/delete", { form_id, id });
export const listMyDueForms = () => post("form-builder/schedules/due", {}, { quiet: true });
export const getScheduleReport = (form_id: number, opts: { from_date?: string; to_date?: string; login_id?: number } = {}) =>
  post("form-builder/schedules/report", { form_id, ...opts });

// ---------- Excel import (plan Q3/Q4) ----------

export interface IImportColumn {
  key: string;
  header: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  hint: string;
}
export interface IImportRowResult {
  row_number: number;
  ok: boolean;
  errors?: string[];
  submission_id?: number | null;
}
export const getImportColumns = (form_id: number) => post("form-builder/import/columns", { form_id });
export const runImport = (form_id: number, rows: { row_number: number; cells: Record<string, any> }[], dry_run: boolean, batch_label?: string) =>
  post("form-builder/import/run", { form_id, rows, dry_run, batch_label });

// ---------- Save and continue later (plan M7) ----------

export interface IDraftSummary {
  id: number;
  form_id: number;
  form_title: string;
  updated_date_time: string;
}
export const saveDraft = (form_id: number, answers: Record<string, any>, id?: number) => post("form-builder/drafts/save", { form_id, answers, id });
export const listMyDrafts = () => post("form-builder/drafts/list", {}, { quiet: true });
export const getDraft = (id: number) => post("form-builder/drafts/get", { id });
export const deleteDraft = (id: number) => post("form-builder/drafts/delete", { id });
