// ============================================================
// types/windex.ts
// ADDITION ONLY: static attachment support
//   - attachmentSourceType: "variable" | "static"
//   - staticAttachmentUrl on SavedTemplateConfig
// Everything else UNCHANGED from previous version.
// ============================================================

// ── Template Types ──────────────────────────────────────────

export interface TemplateButton {
  type: "QUICK_REPLY" | "PHONE_NUMBER" | "URL";
  text: string;
  phone_number?: string;
  url?: string;
}

export type TemplateHeaderFormat = "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: TemplateHeaderFormat;
  text?: string;
  buttons?: TemplateButton[];
  example?: { body_text?: string[][]; header_handle?: string[] };
}

export interface Template {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: string;
  language: string;
  components: TemplateComponent[];
}

export interface ITemplateOptionList {
  value: string;
  label: string;
}

export interface ApiResponse {
  success: boolean;
  data: Template[];
  count: number;
}

// ── Saved Config Types ───────────────────────────────────────

/** How the attachment URL is sourced */
export type AttachmentSourceType = "variable" | "static";

export interface SavedTemplateConfig {
  id?: number;
  module: string;
  displayModule: string;
  templateId: string;
  language: string;
  templateName: string;
  /** key = placeholder index (1-based), value = variable key string */
  variableMappings: Record<number, string>;

  /**
   * NEW: which source feeds the attachment URL.
   * "variable" → resolved dynamically via attachmentVariableKey (existing flow)
   * "static"   → a fixed URL uploaded once by the user (NEW)
   */
  attachmentSourceType?: AttachmentSourceType;

  /** Used when attachmentSourceType === "variable" (existing, unchanged) */
  attachmentVariableKey?: string;

  /** NEW: Used when attachmentSourceType === "static" — permanent uploaded file URL */
  staticAttachmentUrl?: string;
  /** NEW: Original uploaded filename, for display purposes */
  staticAttachmentFileName?: string;

  createdAt?: string;
  updatedAt?: string;
  a_application_login_id: string;
}

// ── Variable Types ───────────────────────────────────────────

export interface VariableContext {
  module: string;
  endpoint: string;
  params: string[];
  valueField: string;
  displayFormat?: string;
}

export interface VariableConfig {
  key: string;
  label: string;
  dataType: "string" | "number" | "date" | "email" | "phone" | "url";
  isAttachment?: boolean;
  contexts: VariableContext[];
}

export type VariableValueMap = Record<number, string>;
export type QuickFillMap = Record<number, string>;

// ── Modal Props ──────────────────────────────────────────────

export interface WhatsAppTemplateModalProps {
  show: boolean;
  onHide: () => void;
  module: string;
  displayModule: string;
  contextParams: Record<string, any> | null;
  onSend?: (
    template: Template,
    variables: VariableValueMap,
    receiverClue: Record<string, any>,
    quickFillVars: QuickFillMap,
    attachmentVariableKey?: string,
    attachmentUrl?: string,
  ) => Promise<void>;
  onSuccesDefautlSaveConfig?: () => void;
}

// ── Send Payload ─────────────────────────────────────────────

export interface SendTemplatePayload {
  a_application_login_id: string | null;
  template: Template;
  variables: VariableValueMap;
  is_template_message: 1;
  receiverClue: Record<string, any>;
  quickFillVars: QuickFillMap;
  attachmentUrl?: string;
  attachmentVariableKey?: string;
}

// ── UI State ─────────────────────────────────────────────────

export type ModalMode = "config-only" | "full";

export interface ModalLoadingState {
  templates: boolean;
  savedConfig: boolean;
  sending: boolean;
  savingConfig: boolean;
  /** NEW: file upload in progress */
  uploadingAttachment: boolean;
}

// ── Attachment helpers ────────────────────────────────────────

export type AttachmentFormat = "IMAGE" | "DOCUMENT" | "VIDEO";

export const ATTACHMENT_HEADER_FORMATS: AttachmentFormat[] = [
  "IMAGE",
  "DOCUMENT",
  "VIDEO",
];

export const templateHasAttachment = (template: Template): boolean => {
  const header = template.components.find((c) => c.type === "HEADER");
  return (
    !!header &&
    ATTACHMENT_HEADER_FORMATS.includes(header.format as AttachmentFormat)
  );
};

export const getTemplateHeaderFormat = (template: Template): string | null => {
  const header = template.components.find((c) => c.type === "HEADER");
  return header?.format ?? null;
};

/** Sentinel value used in the attachment dropdown for "upload your own" */
export const STATIC_ATTACHMENT_OPTION_VALUE = "__static_upload__";

/** Maps template header format → accepted file input "accept" attribute */
export const ATTACHMENT_ACCEPT_MAP: Record<AttachmentFormat, string> = {
  IMAGE: "image/png,image/jpeg,image/webp",
  DOCUMENT: "application/pdf,.doc,.docx",
  VIDEO: "video/mp4,video/3gpp",
};
