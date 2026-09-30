// The entries list columns and cell text (Phase 6b, G1).
import { entryNumberOf, isShownInList, listCellText, listFieldsOf } from "./listCells";
import { IFormBuilderField } from "./FormBuilderController";

const f = (o: any): IFormBuilderField => o as IFormBuilderField;

describe("which fields get a list column", () => {
  test("auto number is on by default, other fields only when ticked", () => {
    expect(isShownInList(f({ key: "no", type: "auto-number" }))).toBe(true);
    expect(isShownInList(f({ key: "no", type: "auto-number", show_in_list: false }))).toBe(false);
    expect(isShownInList(f({ key: "name", type: "text" }))).toBe(false);
    expect(isShownInList(f({ key: "name", type: "text", show_in_list: true }))).toBe(true);
  });
  test("layout, repeater, files and question tables never get a column", () => {
    ["section-header", "instruction", "repeater", "file", "signature", "image", "question-table"].forEach((type) => {
      expect(isShownInList(f({ key: "x", type, show_in_list: true }))).toBe(false);
    });
  });
  test("a full-number Aadhaar field is left to its own Show / Hide column", () => {
    expect(isShownInList(f({ key: "a", type: "text", format_preset: "aadhaar", sensitive_storage: "encrypted", show_in_list: true }))).toBe(false);
    expect(isShownInList(f({ key: "a", type: "text", format_preset: "aadhaar", show_in_list: true }))).toBe(true);
  });
  test("listFieldsOf keeps the form's order", () => {
    const fields = [f({ key: "b", type: "text", show_in_list: true }), f({ key: "a", type: "auto-number" }), f({ key: "c", type: "text" })];
    expect(listFieldsOf(fields).map((x) => x.key)).toEqual(["b", "a"]);
  });
});

describe("entry number", () => {
  test("uses the auto number, else the id", () => {
    const fields = [f({ key: "no", type: "auto-number" })];
    expect(entryNumberOf(fields, { id: 7, no: "ENV/2026-2027/0207" })).toBe("ENV/2026-2027/0207");
    expect(entryNumberOf(fields, { id: 7, no: null })).toBe("#7");
    expect(entryNumberOf([], { id: 7 })).toBe("#7");
  });
});

describe("cell text", () => {
  test("labels for id fields come from the server's resolved labels", () => {
    const row = { division: 3, _reference_labels: { division: "Food" } };
    expect(listCellText(f({ key: "division", type: "reference" }), row)).toBe("Food");
    expect(listCellText(f({ key: "who", type: "user" }), { who: 4, _reference_labels: { who: "Asha" } })).toBe("Asha");
    expect(listCellText(f({ key: "who", type: "user" }), { who: 4 })).toBe("");
  });
  test("multi-select, tick boxes, empty values", () => {
    expect(listCellText(f({ key: "m", type: "multi-select" }), { m: '["A","B"]' })).toBe("A, B");
    expect(listCellText(f({ key: "c", type: "checkbox" }), { c: 1 })).toBe("Yes");
    expect(listCellText(f({ key: "c", type: "checkbox" }), { c: 0 })).toBe("No");
    expect(listCellText(f({ key: "t", type: "text" }), { t: null })).toBe("");
  });
  test("time, amount, percentage, location, barcode", () => {
    expect(listCellText(f({ key: "t", type: "time" }), { t: "14:30:00" })).toBe("14:30");
    expect(listCellText(f({ key: "c", type: "currency" }), { c: "1234.5" })).toBe("₹ 1,234.50");
    expect(listCellText(f({ key: "p", type: "percentage" }), { p: "12.50" })).toBe("12.5%");
    expect(listCellText(f({ key: "l", type: "location" }), { l: "23.022500,72.571400" })).toBe("23.022500,72.571400");
    expect(listCellText(f({ key: "b", type: "barcode" }), { b: "ABC-1" })).toBe("ABC-1");
    expect(isShownInList(f({ key: "c", type: "currency", show_in_list: true }))).toBe(true);
  });
  test("calculation shows its decimals", () => {
    expect(listCellText(f({ key: "t", type: "calculation", decimals: 1 }), { t: "7.7000" })).toBe("7.7");
  });
});
