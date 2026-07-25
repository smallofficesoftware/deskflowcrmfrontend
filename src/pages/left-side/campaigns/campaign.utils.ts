// ─────────────────────────────────────────────────────────────────────────────
// campaign.utils.ts  (v3 — fixed)
// Pure helper functions — no side effects, no React imports
// ─────────────────────────────────────────────────────────────────────────────

import type {
  TemplateComponent,
  VariableMapping,
  FieldOption,
} from "./campaign.types";

/**
 * Extract all numeric variable indices from template components.
 * Scans every component's `text` field for {{N}} patterns.
 *
 * @returns sorted unique array of variable numbers e.g. [1, 2, 3]
 */
export function extractVariableIndices(
  components: TemplateComponent[],
): number[] {
  const set = new Set<number>();
  for (const comp of components) {
    if (!comp.text) continue;
    const matches = comp.text.match(/\{\{(\d+)\}\}/g) ?? [];
    matches.forEach((m) => {
      const n = parseInt(m.replace(/\D/g, ""), 10);
      if (!isNaN(n)) set.add(n);
    });
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * FIX #3 — Template preview formatting
 *
 * Build a WhatsApp message preview string by substituting mapping values
 * into {{N}} placeholders in EVERY component that has text (HEADER + BODY).
 *
 * Previously: showed raw field keys like [customer_name] → ugly
 * Now:        resolves field keys → human labels via predefinedFields,
 *             wraps each value in a styled span marker so the caller can
 *             colour substituted values differently.
 *             Falls back to the raw value if no matching field found.
 *             Falls back to {{N}} if nothing is mapped yet.
 *
 * @param components  Template components array
 * @param mapping     Step-3 variableMapping state { "1": "customer_name", … }
 * @param fields      predefinedFields for label resolution
 * @returns           Preview string with {{N}} replaced by resolved values
 *                    wrapped as «value» markers.
 */
export function buildPreviewText(
  components: TemplateComponent[],
  mapping: VariableMapping,
  fields: FieldOption[] = [],
): string {
  const body = components.find((c) => c.type === "BODY");
  if (!body?.text) return "";

  return body.text.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => {
    const raw = mapping[n];
    if (!raw) return `{{${n}}}`; // not mapped yet → show placeholder
    const field = fields.find((f) => f.value === raw);
    return `«${field?.label ?? raw}»`; // resolved label or raw key
  });
}

/**
 * Same as buildPreviewText but for HEADER component only.
 */
export function buildPreviewHeader(
  components: TemplateComponent[],
  mapping: VariableMapping,
  fields: FieldOption[] = [],
): string {
  const header = components.find((c) => c.type === "HEADER");
  if (!header?.text) return "";
  return header.text.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => {
    const raw = mapping[n];
    if (!raw) return `{{${n}}}`;
    const field = fields.find((f) => f.value === raw);
    return `«${field?.label ?? raw}»`;
  });
}

/**
 * Initialise an empty VariableMapping from a list of variable indices,
 * optionally pre-filling from a TemplateVariableConfig passed by the parent.
 */
export function initVariableMapping(
  indices: number[],
  defaults: Record<number, string> = {},
): VariableMapping {
  return Object.fromEntries(indices.map((i) => [String(i), defaults[i] ?? ""]));
}

/**
 * Parse a comma/semicolon/newline-separated string of phone numbers
 * into a clean de-duplicated array of non-empty strings.
 */
export function parseContactNumbers(raw: string): string[] {
  return raw
    .split(/[\s,;|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Trigger a browser file download from a URL or blob URL.
 */
export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
