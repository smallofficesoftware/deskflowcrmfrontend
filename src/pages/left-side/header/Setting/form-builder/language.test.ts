import { localizeFields, secondLanguageName, translatableParts, translatedCount } from "./language";
import { IFormBuilderField } from "./FormBuilderController";

const f = (extra: any): IFormBuilderField => ({ id: "1", key: "k", type: "text", label: "Name", ...extra });

describe("secondLanguageName", () => {
  it("reads the name, ignoring blanks", () => {
    expect(secondLanguageName({ language: { name: " Gujarati " } })).toBe("Gujarati");
    expect(secondLanguageName({ language: { name: "  " } })).toBeNull();
    expect(secondLanguageName(null)).toBeNull();
  });
});

describe("localizeFields", () => {
  it("returns the same fields when the language is off", () => {
    const fields = [f({ translations: { label: "નામ" } })];
    expect(localizeFields(fields, false)).toBe(fields);
  });

  it("swaps translated text and leaves the rest", () => {
    const [out] = localizeFields([f({ help_text: "Full name", placeholder: "Type", translations: { label: "નામ", help_text: "પૂરું નામ" } })], true);
    expect(out.label).toBe("નામ");
    expect(out.help_text).toBe("પૂરું નામ");
    expect(out.placeholder).toBe("Type");
  });

  it("keeps option values and adds display labels, falling back to the original", () => {
    const [out] = localizeFields([f({ type: "dropdown", options: ["Yes", "No", "Maybe"], translations: { options: ["હા", "ના", ""] } })], true);
    expect(out.options).toEqual(["Yes", "No", "Maybe"]);
    expect((out as any).option_labels).toEqual(["હા", "ના", "Maybe"]);
  });

  it("translates the columns of a table too", () => {
    const [out] = localizeFields([f({ type: "repeater", columns: [f({ id: "2", key: "c", label: "Qty", translations: { label: "જથ્થો" } })] })], true);
    expect(out.columns?.[0].label).toBe("જથ્થો");
  });

  it("does not touch a field without translations", () => {
    const original = f({});
    expect(localizeFields([original], true)[0]).toBe(original);
  });
});

describe("editor helpers", () => {
  it("lists what a field can translate", () => {
    expect(translatableParts(f({ type: "instruction", content: "x" })).content).toBe(true);
    expect(translatableParts(f({ type: "dropdown", options: ["a"] })).options).toBe(true);
    expect(translatableParts(f({})).help_text).toBe(false);
  });

  it("counts translated fields", () => {
    expect(translatedCount([f({ translations: { label: "x" } }), f({ translations: { label: " " } }), f({})])).toBe(1);
  });
});
