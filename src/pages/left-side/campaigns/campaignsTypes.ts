// ─── Types ────────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: TemplateComponent[];
  waba_id: string;
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  text?: string;
  example?: { body_text?: string[][]; header_text?: string[] };
}

export interface VariableMapping {
  [key: string]: string;
}

export interface CampaignPayload {
  waba_id: string;
  template_name: string;
  language_code: string;
  name: string;
  recipient_type: string;
  media_url?: string;
  fileName?: string;
  contact_numbers?: string[];
  segment_tags?: string[];
  variables_mapping: VariableMapping;
  scheduled_at?: string;
}

export interface CampaignModalProps {
  show: boolean;
  onHide: () => void;
  apiKey: string;
  baseUrl?: string;
  predefinedFields?: { label: string; value: string }[];
}
