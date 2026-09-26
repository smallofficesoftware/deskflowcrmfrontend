import { IFormBuilderField } from "./FormBuilderController";

// Second-language labels (plan M8). One extra language per form, named by the
// form's owner ("Gujarati", "Hindi", ...). Each field can carry translated
// text; the fill screens show a switch and use them for display only — stored
// answers always use the original option text, so a form can be filled in
// either language and read back the same way.

export interface IFieldTranslation {
  label?: string;
  help_text?: string;
  placeholder?: string;
  content?: string; // instruction / consent text
  options?: string[]; // same order as the field's options
}

export const secondLanguageName = (settings: { language?: { name?: string } } | null | undefined): string | null => {
  const name = settings?.language?.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
};

const clean = (t?: string) => (typeof t === "string" && t.trim() ? t : undefined);

// The fields as they should be shown in the second language. Anything not
// translated stays as it was. Options keep their values and get display
// labels (`option_labels`, same order).
export function localizeFields(fields: IFormBuilderField[], active: boolean): IFormBuilderField[] {
  if (!active) return fields;
  return fields.map((f) => {
    const t = (f as any).translations as IFieldTranslation | undefined;
    const columns = f.columns ? localizeFields(f.columns, true) : f.columns;
    if (!t) return columns === f.columns ? f : { ...f, columns };
    const next: any = { ...f, columns };
    if (clean(t.label)) next.label = t.label;
    if (clean(t.help_text)) next.help_text = t.help_text;
    if (clean(t.placeholder)) next.placeholder = t.placeholder;
    if (clean(t.content)) next.content = t.content;
    if (Array.isArray(f.options) && Array.isArray(t.options)) {
      next.option_labels = f.options.map((o, i) => clean(t.options?.[i]) || o);
    }
    return next as IFormBuilderField;
  });
}

// What a field has that can be translated, for the editor's list.
export function translatableParts(f: IFormBuilderField): { label: boolean; help_text: boolean; placeholder: boolean; content: boolean; options: boolean } {
  const isText = !["section-header", "instruction"].includes(f.type);
  return {
    label: true,
    help_text: isText && !!f.help_text,
    placeholder: isText && !!f.placeholder,
    content: f.type === "instruction" || f.type === "consent",
    options: Array.isArray(f.options) && f.options.length > 0,
  };
}

// How many fields already have any translated text.
export const translatedCount = (fields: IFormBuilderField[]): number =>
  fields.filter((f) => {
    const t = (f as any).translations as IFieldTranslation | undefined;
    return !!t && (clean(t.label) || clean(t.help_text) || clean(t.placeholder) || clean(t.content) || (t.options || []).some(clean));
  }).length;
