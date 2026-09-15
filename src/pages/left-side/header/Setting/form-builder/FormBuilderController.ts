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
];

// Field-type option list backing fieldTypes.ts's registry keys.
export const fieldTypeOptions = [
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
];

export const referenceMasterOptions = [
  { id: "country", label: "Country" },
  { id: "state", label: "State" },
  { id: "city", label: "City" },
  { id: "category", label: "Category" },
  { id: "product", label: "Product" },
];

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
}

export interface IFormBuilderForm {
  id: number;
  title: string;
  description?: string;
  schema_json: string;
  published_schema_json?: string | null;
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

async function post(path: string, body: Record<string, any>) {
  try {
    const { data } = await axiosInstance.post(path, {
      ...body,
      a_application_login_id: uuid(),
    });
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      handleFail(data);
    }
    return data;
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return null;
  }
}

// ---------- Forms ----------

export const listForms = (body: Record<string, any> = {}) => post("form-builder/list", body);
export const getForm = (id: number) => post("form-builder/get", { id });
export const createForm = (body: { title: string; description?: string; related_module?: string }) =>
  post("form-builder/create", body);
export const updateDraftForm = (body: { id: number; [key: string]: any }) => post("form-builder/update", body);
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
