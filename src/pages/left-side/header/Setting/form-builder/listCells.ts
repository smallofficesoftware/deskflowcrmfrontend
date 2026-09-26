// What the submissions list shows for each saved answer (Phase 6b, G1):
// which fields get a column, and how one saved value reads on screen.
import { decimalsOf, resultTypeOf } from "./calculations";
import { IFormBuilderField } from "./FormBuilderController";

// Same test as isEncryptedField in FormBuilderController (kept here so this file stays free of
// the API layer and can be unit-tested on its own).
const isEncrypted = (f: IFormBuilderField) => f.format_preset === "aadhaar" && f.sensitive_storage === "encrypted";

// Types that have a single readable value to show in a list column.
const LISTABLE_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "phone",
  "email",
  "url",
  "address",
  "date",
  "datetime",
  "dropdown",
  "radio",
  "multi-select",
  "checkbox",
  "switch",
  "rating",
  "reference",
  "user",
  "customer-lookup",
  "auto-number",
  "calculation",
  "time",
  "currency",
  "percentage",
  "location",
  "barcode",
]);

export const isListableType = (type: string) => LISTABLE_TYPES.has(type);

// The Auto Number is on the list unless the builder switched it off; every
// other field is only there when the builder ticked "Show in the entries list".
export function isShownInList(field: IFormBuilderField): boolean {
  if (!field.key || !LISTABLE_TYPES.has(field.type)) return false;
  if (isEncrypted(field)) return false; // full-number Aadhaar has its own Show / Hide column
  return field.type === "auto-number" ? field.show_in_list !== false : !!field.show_in_list;
}

export function listFieldsOf(fields: IFormBuilderField[]): IFormBuilderField[] {
  return fields.filter(isShownInList);
}

// The entry's own number: the first Auto Number field's value, else its id.
export function entryNumberOf(fields: IFormBuilderField[], row: Record<string, any>): string {
  const auto = fields.find((f) => f.type === "auto-number");
  const value = auto ? row[auto.key] : null;
  return value ? String(value) : `#${row.id}`;
}

const formatDate = (v: any) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
};

// One cell's text.
export function listCellText(field: IFormBuilderField, row: Record<string, any>): string {
  const value = row[field.key];
  if (field.type === "reference" || field.type === "user" || field.type === "customer-lookup") {
    return row._reference_labels?.[field.key] ?? "";
  }
  if (value === null || value === undefined || value === "") return "";
  switch (field.type) {
    case "multi-select": {
      try {
        const list = JSON.parse(value);
        return Array.isArray(list) ? list.join(", ") : String(value);
      } catch {
        return String(value);
      }
    }
    case "checkbox":
    case "switch":
      return Number(value) ? "Yes" : "No";
    case "time":
      return String(value).slice(0, 5);
    case "currency":
      return `₹ ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percentage":
      return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
    case "date":
      return formatDate(value);
    case "datetime": {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
    }
    case "calculation": {
      if (resultTypeOf(field) === "date") return formatDate(value);
      const decimals = decimalsOf(field);
      return Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    default:
      return String(value);
  }
}
