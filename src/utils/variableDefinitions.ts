// ============================================================
// utils/variableDefinitions.ts — Variable config + VariableService
// CHANGE: Added isAttachment variables for IMAGE/DOCUMENT/VIDEO headers
// ============================================================

import type { VariableConfig } from "../components/model/whatsapp_template_sender/types/windex";
import { fetchVariableData } from "../components/model/whatsapp_template_sender/api/whatsappTemplateApi";

// ── Variable Definitions ─────────────────────────────────────
// Body variables (existing — unchanged)
// Attachment variables (NEW — isAttachment: true, dataType: "url")

export const VARIABLE_DEFINITIONS: VariableConfig[] = [
  // ── Body text variables ──────────────────────────────────
  {
    key: "voucher_customer_name",
    label: "Customer Name",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId/customer",
        params: ["orderId"],
        valueField: "voucher_customer_name",
      },
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id/customer",
        params: ["acc_id"],
        valueField: "customer_name",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_name",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_name",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tsk_Id/customer",
        params: ["tsk_Id"],
        valueField: "customer_name",
      },
    ],
  },

  {
    key: "customer_mobile_number",
    label: "Customer Mobile Number",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId/customer",
        params: ["orderId"],
        valueField: "customer_mobile_number",
      },
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id/customer",
        params: ["acc_id"],
        valueField: "customer_mobile_number",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_mobile_number",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_mobile_number",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tsk_Id/customer",
        params: ["tsk_Id"],
        valueField: "customer_mobile_number",
      },
    ],
  },

  {
    key: "customer_company_name",
    label: "Customer Company Name",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId/customer",
        params: ["orderId"],
        valueField: "customer_company_name",
      },
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id/customer",
        params: ["acc_id"],
        valueField: "customer_company_name",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_company_name",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_company_name",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tsk_Id/customer",
        params: ["tsk_Id"],
        valueField: "customer_company_name",
      },
    ],
  },

  {
    key: "customer_email_address",
    label: "Customer Email Address",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId/customer",
        params: ["orderId"],
        valueField: "customer_email_address",
      },
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id/customer",
        params: ["acc_id"],
        valueField: "customer_email_address",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_email_address",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "con-wvfetch/:customerId",
        params: ["customerId"],
        valueField: "customer_email_address",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tsk_Id/customer",
        params: ["tsk_Id"],
        valueField: "customer_email_address",
      },
    ],
  },

  {
    key: "company_name",
    label: "Company Name",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_name",
      },
      {
        module: "account_transaction",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_name",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_name",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_name",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_name",
      },
    ],
  },

  {
    key: "company_mobile_number",
    label: "Company Mobile Number",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_mobile_number",
      },
      {
        module: "account_transaction",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_mobile_number",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_mobile_number",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_mobile_number",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_mobile_number",
      },
    ],
  },
  {
    key: "company_email_address",
    label: "Company Email Address",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_email_address",
      },
      {
        module: "account_transaction",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_email_address",
      },
      {
        module: "customer_acc_transaction",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_email_address",
      },
      {
        module: "auto_contact_assignment",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_email_address",
      },
      {
        module: "task_whatsapp_send",
        endpoint: "cmp-wvfetch/:cmpId",
        params: ["cmpId"],
        valueField: "company_email_address",
      },
    ],
  },

  {
    key: "task_no",
    label: "Task No",
    dataType: "string",
    contexts: [
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tskId",
        params: ["tskId"],
        valueField: "task_no",
      },
    ],
  },

  {
    key: "task_title",
    label: "Task Title",
    dataType: "string",
    contexts: [
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tskId",
        params: ["tskId"],
        valueField: "task_title",
      },
    ],
  },

  // {
  //   key: "task_description",
  //   label: "Task Description",
  //   dataType: "string",
  //   contexts: [
  //     {
  //       module: "task_whatsapp_send",
  //       endpoint: "tsk-wvfetch/:tskId",
  //       params: ["tskId"],
  //       valueField: "task_description",
  //     },
  //   ],
  // },

  {
    key: "task_status",
    label: "Task Status",
    dataType: "string",
    contexts: [
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tskId",
        params: ["tskId"],
        valueField: "task_status",
      },
    ],
  },

  {
    key: "task_priority",
    label: "Task Priority",
    dataType: "string",
    contexts: [
      {
        module: "task_whatsapp_send",
        endpoint: "tsk-wvfetch/:tskId",
        params: ["tskId"],
        valueField: "task_priority",
      },
    ],
  },

  {
    key: "payment_type",
    label: "Payment Type",
    dataType: "string",
    contexts: [
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id",
        params: ["acc_id"],
        valueField: "payment_type",
      },
    ],
  },
  {
    key: "payment_by",
    label: "Payment By",
    dataType: "string",
    contexts: [
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id",
        params: ["acc_id"],
        valueField: "payment_by",
      },
    ],
  },
  {
    key: "payment_date",
    label: "Payment Date",
    dataType: "string",
    contexts: [
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id",
        params: ["acc_id"],
        valueField: "payment_date",
      },
    ],
  },
  {
    key: "account_amount",
    label: "Amount",
    dataType: "string",
    contexts: [
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id",
        params: ["acc_id"],
        valueField: "account_amount",
      },
    ],
  },
  {
    key: "voucher_type",
    label: "Voucher Type",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId",
        params: ["orderId"],
        valueField: "voucher_type",
      },
    ],
  },
  {
    key: "voucher_number",
    label: "Voucher Number",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId",
        params: ["orderId"],
        valueField: "voucher_number",
      },
    ],
  },
  {
    key: "voucher_date",
    label: "Voucher Date",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId",
        params: ["orderId"],
        valueField: "voucher_date",
      },
    ],
  },
  {
    key: "voucher_amount",
    label: "Voucher Amount",
    dataType: "string",
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId",
        params: ["orderId"],
        valueField: "voucher_amount",
      },
    ],
  },

  // ── Attachment / media URL variables (NEW) ────────────────
  // isAttachment: true  → shown ONLY in the Attachment Variable section
  // dataType: "url"     → resolved value is a file/media URL
  {
    key: "voucher_pdf",
    label: "Voucher PDF",
    dataType: "url",
    isAttachment: true,
    contexts: [
      {
        module: "carts",
        endpoint: "ord-wvfetch/:orderId/pdf",
        params: ["orderId"],
        valueField: "voucher_pdf_url",
      },
    ],
  },
  {
    key: "account_receipt_pdf",
    label: "Account Receipt Pdf",
    dataType: "url",
    isAttachment: true,
    contexts: [
      {
        module: "account_transaction",
        endpoint: "acc-wvfetch/:acc_id/pdf",
        params: ["acc_id"],
        valueField: "account_receipt_pdf_url",
      },
    ],
  },
  {
    key: "account_ledger_pdf",
    label: "Account Ledger Pdf",
    dataType: "url",
    isAttachment: true,
    contexts: [
      {
        module: "customer_acc_transaction",
        endpoint: "acc-wvfetch/:customerId/ledger_pdf",
        params: ["customerId"],
        valueField: "account_ledger_pdf_url",
      },
    ],
  },
  // Add more attachment variables here following the same pattern
];

// ── VariableService ──────────────────────────────────────────

class VariableService {
  private cache = new Map<string, string>();
  private pending = new Map<string, Promise<string>>();

  /** Body variables for a module (excludes attachment variables) */
  getAvailableVariables(module: string): VariableConfig[] {
    return VARIABLE_DEFINITIONS.filter(
      (v) => !v.isAttachment && v.contexts.some((ctx) => ctx.module === module),
    );
  }

  /** Attachment variables for a module (isAttachment === true only) */
  getAttachmentVariables(module: string): VariableConfig[] {
    return VARIABLE_DEFINITIONS.filter(
      (v) =>
        v.isAttachment === true &&
        v.contexts.some((ctx) => ctx.module === module),
    );
  }

  async fetchVariableValue(
    variableKey: string,
    module: string,
    params: Record<string, any>,
  ): Promise<string> {
    const variable = VARIABLE_DEFINITIONS.find((v) => v.key === variableKey);
    if (!variable) throw new Error(`Variable "${variableKey}" not found`);

    const context = variable.contexts.find((ctx) => ctx.module === module);
    if (!context)
      throw new Error(`Variable "${variableKey}" unavailable for "${module}"`);

    const missing = context.params.filter((p) => !params[p]);
    if (missing.length)
      throw new Error(`Missing params: ${missing.join(", ")}`);

    const cacheKey = this.buildCacheKey(variableKey, module, params);
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;
    if (this.pending.has(cacheKey)) return this.pending.get(cacheKey)!;

    let endpoint = context.endpoint;
    context.params.forEach((p) => {
      endpoint = endpoint.replace(`:${p}`, String(params[p]));
    });

    const request = this._fetchAndExtract(
      endpoint,
      context.valueField,
      context.displayFormat,
    );
    this.pending.set(cacheKey, request);

    try {
      const value = await request;
      this.cache.set(cacheKey, value);
      return value;
    } finally {
      this.pending.delete(cacheKey);
    }
  }

  private async _fetchAndExtract(
    endpoint: string,
    valueField: string,
    displayFormat?: string,
  ): Promise<string> {
    const rows = await fetchVariableData(endpoint);
    const row = rows[0] ?? {};
    let value = this._getNestedValue(row, valueField) ?? "";
    if (displayFormat && value)
      value = displayFormat.replace("{value}", String(value));
    return String(value);
  }

  private _getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((cur, key) => cur?.[key], obj);
  }

  private buildCacheKey(
    variableKey: string,
    module: string,
    params: Record<string, any>,
  ): string {
    const ps = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return `${variableKey}:${module}:${ps}`;
  }

  clearCache(variableKey?: string, module?: string): void {
    if (!variableKey && !module) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      const match =
        (!variableKey || key.startsWith(`${variableKey}:`)) &&
        (!module || key.includes(`:${module}:`));
      if (match) this.cache.delete(key);
    }
  }
}

export const variableService = new VariableService();
