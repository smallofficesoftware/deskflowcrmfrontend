import { FieldFormatPreset, IFormBuilderField, isEncryptedField } from "./FormBuilderController";

// Format presets for text-like fields (plan O1) — the builder picks one from a
// dropdown instead of writing a regex. Mirrors the backend's
// src/services/form_builder/formBuilderFormatPresets.js (same patterns, same
// normalisation, same wording) so the instant client check never disagrees
// with the server; the server result is still the one that counts (it also
// stores the normalised / masked value).
export type FormatPreset = FieldFormatPreset;

interface PresetDef {
  label: string;
  message: string;
  uppercase?: boolean; // transform as the user types
  inputMode?: "numeric" | "email" | "text";
}

export const FORMAT_PRESETS: Record<FormatPreset, PresetDef> = {
  mobile: { label: "Mobile", message: "Enter a valid 10-digit mobile number", inputMode: "numeric" },
  email: { label: "Email", message: "Enter a valid email address (e.g. name@example.com)", inputMode: "email" },
  gst: { label: "GST", message: "Enter a valid GST number (e.g. 24ABCDE1234F1Z5)", uppercase: true },
  pan: { label: "PAN", message: "Enter a valid PAN (e.g. ABCDE1234F)", uppercase: true },
  ifsc: { label: "IFSC", message: "Enter a valid IFSC code (e.g. SBIN0001234)", uppercase: true },
  pincode: { label: "Pincode", message: "Enter a valid 6-digit pincode", inputMode: "numeric" },
  // Uppercase so an already-masked value (XXXXXXXX1234) typed/edited in
  // lower case still matches.
  aadhaar: { label: "Aadhaar", message: "Enter a valid 12-digit Aadhaar number", uppercase: true },
  vehicle_no: { label: "Vehicle number", message: "Enter a valid vehicle number (e.g. GJ01AB1234)", uppercase: true },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
const AADHAAR_PATTERN = /^[2-9][0-9]{11}$/;
// Stored form (8 X + last 4) — accepted unchanged when an existing entry is edited.
const AADHAAR_MASKED_PATTERN = /^X{8}[0-9]{4}$/;
const VEHICLE_PATTERN = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
const VEHICLE_BH_PATTERN = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

// Spaces, dashes, dots and slashes people commonly type inside ids.
const compact = (v: string) => v.replace(/[\s\-./]/g, "").toUpperCase();

// Same prefix handling as the backend's normalizeToTenDigit: strips +91 / 91 /
// 0 / 00 and separators, leaving 10 bare digits (or null).
function tenDigitMobile(input: string): string | null {
  if (!/^[0-9+\-\s()]+$/.test(input)) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^[6-9][0-9]{9}$/.test(digits) ? digits : null;
}

// newEntry: the value is for a brand-new entry, not an edit of a saved one.
export interface FormatCheckOptions {
  newEntry?: boolean;
}

function isValidForPreset(preset: FormatPreset, input: string, acceptMasked: boolean): boolean {
  switch (preset) {
    case "mobile":
      return !!tenDigitMobile(input);
    case "email":
      return EMAIL_PATTERN.test(input.toLowerCase());
    case "gst":
      return GST_PATTERN.test(compact(input));
    case "pan":
      return PAN_PATTERN.test(compact(input));
    case "ifsc":
      return IFSC_PATTERN.test(compact(input));
    case "pincode":
      return PINCODE_PATTERN.test(input.replace(/\s/g, ""));
    case "aadhaar": {
      const a = compact(input);
      return (acceptMasked && AADHAAR_MASKED_PATTERN.test(a)) || AADHAAR_PATTERN.test(a);
    }
    case "vehicle_no": {
      const v = compact(input);
      return VEHICLE_PATTERN.test(v) || VEHICLE_BH_PATTERN.test(v);
    }
    default:
      return true;
  }
}

export const formatPresetOptions: { id: FormatPreset; label: string }[] = (Object.keys(FORMAT_PRESETS) as FormatPreset[]).map((id) => ({
  id,
  label: FORMAT_PRESETS[id].label,
}));

export function presetFor(field: IFormBuilderField): PresetDef | null {
  const p = field.format_preset;
  return p && FORMAT_PRESETS[p as FormatPreset] ? FORMAT_PRESETS[p as FormatPreset] : null;
}

// Applied as the user types: uppercase for GST / PAN / IFSC / vehicle number /
// Aadhaar. Separators are left as typed — the server strips them on save.
export function transformPresetInput(field: IFormBuilderField, raw: string): string {
  const preset = presetFor(field);
  return preset?.uppercase ? raw.toUpperCase() : raw;
}

// Returns the plain-language message, or null when the value is fine. Empty
// values pass — "required" is a separate check. The masked Aadhaar form
// (XXXXXXXX1234) is accepted as "left unchanged" when editing, but a new
// entry on a full-number (encrypted) field must supply all 12 digits — the
// server rejects the masked form there too.
export function checkFormat(field: IFormBuilderField, value: any, opts: FormatCheckOptions = {}): string | null {
  const preset = presetFor(field);
  if (!preset) return null;
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (v === "") return null;
  const acceptMasked = !(opts.newEntry && isEncryptedField(field));
  return isValidForPreset(field.format_preset as FormatPreset, v, acceptMasked) ? null : preset.message;
}

// Submit-time check across all top-level fields; keyed by field key, same
// shape the fill views already use for their errors map.
export function validateFormatPresets(
  fields: IFormBuilderField[],
  answers: Record<string, any>,
  opts: FormatCheckOptions = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  fields.forEach((f) => {
    const msg = checkFormat(f, answers[f.key], opts);
    if (msg) errors[f.key] = msg;
  });
  return errors;
}
