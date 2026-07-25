// ─────────────────────────────────────────────────────────────────────────────
// campaign.types.ts  (v3 — fixed)
// ─────────────────────────────────────────────────────────────────────────────

// ── Template ──────────────────────────────────────────────────────────────────

export interface TemplateButton {
  type: "QUICK_REPLY" | "PHONE_NUMBER" | "URL";
  text: string;
  phone_number?: string;
  url?: string;
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  text?: string;
  buttons?: TemplateButton[];
  example?: { body_text?: string[][] };
}

export interface Template {
  id: string;
  name: string;
  status:
    | "APPROVED"
    | "PENDING"
    | "REJECTED"
    | "Approved"
    | "Pending"
    | "Rejected";
  category: string;
  language: string;
  components: TemplateComponent[];
  /** waba_id may come from the template list API or be set at the top level */
  waba_id?: string;
}

// ── Variable Mapping ──────────────────────────────────────────────────────────

/**
 * Keys are variable index numbers as strings: "1", "2", "3" …
 * Values are either a CRM field key (e.g. "customer_name")
 * or a static string (e.g. "Sales Order").
 *
 * This is what Step 3 produces and what gets sent in the campaign payload.
 */
export type VariableMapping = Record<string, string>;

/**
 * Parent-level config that maps template variable indices → Excel column keys.
 * e.g. { 1: "customer_name", 2: "company_name", 3: "mobile" }
 * Used ONLY as a hint/fallback — the real mapping comes from Step 3 state.
 */
export type TemplateVariableConfig = Record<number, string>;

// ── Where / Filter Params ─────────────────────────────────────────────────────

export interface WhereParams {
  from_date?: string;
  to_date?: string;
  contact_type?: string;
  city?: string;
  status?: string;
  tags?: string[];
  [key: string]: unknown;
}

// ── Recipient ─────────────────────────────────────────────────────────────────

export type RecipientMode = "specific_contacts" | "export_excel";

export interface SpecificContactsData {
  mode: "specific_contacts";
  contact_numbers: string[];
}

export interface ExportExcelData {
  mode: "export_excel";
  /**
   * Opaque token the backend returned — used when sending campaign
   * so the backend can re-fetch the pre-generated Excel.
   */
  excel_token?: string;
  /** Total contacts count returned by generate-excel */
  total_count?: number;
  /** URL to download the Excel file */
  download_url?: string;
}

export type RecipientData = SpecificContactsData | ExportExcelData;

// ── Step config ───────────────────────────────────────────────────────────────

export interface StepConfig {
  id: number;
  key: string;
  label: string;
}

// ── API: Generate Excel ───────────────────────────────────────────────────────

export interface GenerateExcelRequest {
  where: WhereParams;
  /**
   * FIX #1: This is the Step-3 variableMapping (user-configured), NOT the
   * parent's templateVariables prop. Keys are "1","2"… values are field keys
   * or static strings.
   * e.g. { "1": "customer_name", "2": "Sales Order", "3": "mobile" }
   */
  variable_mapping: VariableMapping;
  template_id: string;
  a_application_login_id: string;
}

export interface GenerateExcelResponse {
  ack: number;
  data: {
    success: boolean;
    excel_token: string;
    total_count: number;
    /** URL to download the generated Excel binary */
    download_url: string;
    message?: string;
  };
}

// ── API: Send Campaign ────────────────────────────────────────────────────────

export interface SendCampaignRequest {
  // Campaign meta
  name: string;
  description?: string;

  // WhatsApp template
  template_id: string;
  template_name: string;
  language_code: string;

  // Variable mapping from Step 3
  variables_mapping: VariableMapping;

  // Optional media
  media_url?: string;
  media_file_name?: string;

  // Recipient
  recipient_type: RecipientMode;
  contact_numbers?: string[]; // for specific_contacts

  /**
   * FIX #2: For export_excel, we send the excel_token so the backend can
   * retrieve the pre-generated Excel binary. The backend uses the token to
   * locate the file and attach it to the WhatsApp campaign.
   * Never send the download_url as a contact source — the backend owns that.
   */
  excel_token?: string;
  excel_download_url?: string;

  // Schedule
  scheduled_at?: string;

  a_application_login_id?: string | number;
}

export interface SendCampaignResponse {
  ack: number;
  data: {
    success: boolean;
    campaign_id: string;
    message: string;
    queued_count?: number;
  };
}

// ── Modal Props ───────────────────────────────────────────────────────────────

export interface CampaignModalProps {
  show: boolean;
  onHide: () => void;

  /**
   * Dynamic filter params forwarded verbatim to POST /campaign/generate-excel
   * as the `where` object. Comes from your lead management state.
   */
  whereParams?: WhereParams;

  /**
   * Optional parent-level variable config used ONLY as initial defaults
   * in Step 3. The user can override each variable in the mapping UI.
   * e.g. { 1: "customer_name", 2: "mobile" }
   */
  templateVariables?: TemplateVariableConfig;

  /** CRM field dropdown options shown in Step 3 variable mapping */
  predefinedFields?: FieldOption[];

  /** Called with the API response after a successful send */
  onSuccess?: (response: SendCampaignResponse) => void;
}

export interface FieldOption {
  /** Human-readable label shown in dropdown and used in preview */
  label: string;
  /** The column key / CRM field identifier sent to the backend */
  value: string;
}
