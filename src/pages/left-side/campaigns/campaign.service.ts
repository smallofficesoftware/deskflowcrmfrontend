// ─────────────────────────────────────────────────────────────────────────────
// campaign.service.ts  (v3 — fixed)
// Frontend → Your Backend → WhatsApp API
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  Template,
  GenerateExcelRequest,
  GenerateExcelResponse,
  SendCampaignRequest,
  SendCampaignResponse,
} from "./campaign.types";
import { axiosInstance } from "../../../services/axiosInstance";

// ─── Error normaliser ────────────────────────────────────────────────────────

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      fallback
    );
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Service class ───────────────────────────────────────────────────────────

export class CampaignService {
  private client: AxiosInstance;

  constructor() {
    this.client = axiosInstance;
  }

  // ── Fetch Templates ────────────────────────────────────────────────────────

  /**
   * GET  POST  get-whatsapp-template
   * Returns approved templates from the WhatsApp Business API (via backend).
   */
  async fetchTemplates(): Promise<Template[]> {
    try {
      const getUUID = localStorage.getItem("UUID");
      const { data } = await this.client.post("get-whatsapp-template", {
        a_application_login_id: getUUID,
      });
      const templates: Template[] = data?.data?.data ?? [];
      return Array.isArray(templates) ? templates : (data.templates ?? []);
    } catch (err) {
      throw new Error(extractMessage(err, "Failed to fetch templates"));
    }
  }

  // ── Generate Excel ─────────────────────────────────────────────────────────

  /**
   * POST /campaign/generate-excel
   *
   * FIX #1: payload.variable_mapping is now typed as VariableMapping
   * (Record<string, string>) — i.e. the Step-3 user-configured mapping —
   * NOT the parent's TemplateVariableConfig.
   *
   * Example payload:
   * {
   *   where: { from_date: "2026-04-01", city: "Rajkot" },
   *   variable_mapping: { "1": "customer_name", "2": "Sales Order", "3": "mobile" },
   *   template_id: "abc123"
   * }
   */
  async generateExcel(
    payload: GenerateExcelRequest,
  ): Promise<GenerateExcelResponse> {
    try {
      const { data } = await this.client.post<GenerateExcelResponse>(
        "/campaign/generate-excel",
        payload,
      );
      return data;
    } catch (err) {
      throw new Error(extractMessage(err, "Failed to generate Excel"));
    }
  }

  // ── Send Campaign ──────────────────────────────────────────────────────────

  /**
   * POST /campaign/send
   *
   * FIX #2: For export_excel mode the payload now includes `excel_token`.
   * The backend uses this token to retrieve the pre-generated Excel binary
   * and extract contact phone numbers to send the WhatsApp campaign.
   *
   * We do NOT send a raw file/binary from the frontend — the backend already
   * has the file stored (via the generate-excel step) and retrieves it by token.
   *
   * Example payload:
   * {
   *   name: "Summer Sale",
   *   template_id: "abc123",
   *   template_name: "summer_sale",
   *   language_code: "en_US",
   *   waba_id: "xxxx",
   *   variables_mapping: { "1": "customer_name", "2": "Sales Order" },
   *   recipient_type: "export_excel",
   *   excel_token: "tok_abc123xyz",   ← token from generate-excel response
   *   scheduled_at: undefined          ← omit for immediate send
   * }
   */
  async sendCampaign(
    payload: SendCampaignRequest,
  ): Promise<SendCampaignResponse> {
    try {
      // ── Excel mode: download blob → send as FormData ──────────────────────

      // if (
      //   payload.recipient_type === "export_excel" &&
      //   payload.excel_download_url
      // ) {
      //   // 1. Fetch the generated Excel as a binary blob
      //   const blobResponse = await axios.get(payload.excel_download_url, {
      //     responseType: "blob",
      //   });
      //   const excelBlob: Blob = blobResponse.data;

      //   // 2. Build FormData — backend receives the file + all JSON fields
      //   const form = new FormData();
      //   form.append("excel_file", excelBlob, `campaign_${Date.now()}.xlsx`);

      //   // Append all scalar fields
      //   form.append("name", payload.name);
      //   form.append("template_id", payload.template_id);
      //   form.append("template_name", payload.template_name);
      //   form.append("language_code", payload.language_code);
      //   form.append("waba_id", payload.waba_id ?? "");
      //   form.append("recipient_type", payload.recipient_type);
      //   form.append(
      //     "variables_mapping",
      //     JSON.stringify(payload.variables_mapping),
      //   );

      //   if (payload.description)
      //     form.append("description", payload.description);
      //   if (payload.media_url) form.append("media_url", payload.media_url);
      //   if (payload.media_file_name)
      //     form.append("media_file_name", payload.media_file_name);
      //   if (payload.scheduled_at)
      //     form.append("scheduled_at", payload.scheduled_at);
      //   if (payload.excel_token)
      //     form.append("excel_token", payload.excel_token);

      //   const { data } = await this.client.post<SendCampaignResponse>(
      //     "/campaign/send",
      //     form,
      //     { headers: { "Content-Type": "multipart/form-data" } },
      //   );
      //   return data;
      // }

      // ── Specific contacts mode: plain JSON ────────────────────────────────
      const { data } = await this.client.post<SendCampaignResponse>(
        "/campaign/send",
        payload,
      );
      return data;
    } catch (err) {
      throw new Error(extractMessage(err, "Failed to send campaign"));
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _instance: CampaignService | null = null;

export function getCampaignService(): CampaignService {
  if (!_instance) {
    _instance = new CampaignService();
  }
  return _instance;
}
