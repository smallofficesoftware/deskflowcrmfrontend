import { autoMapColumns, buildImportRows, chunk } from "./importSheet";
import { IImportColumn } from "../FormBuilderController";

const col = (key: string, header: string, label = header): IImportColumn => ({ key, header, label, type: "text", required: false, options: [], hint: "" });

describe("autoMapColumns", () => {
  it("matches headings ignoring case and spacing", () => {
    const columns = [col("name", "Name"), col("mobile", "Mobile  No")];
    expect(autoMapColumns(columns, ["MOBILE no", "name", "Remarks"])).toEqual({ name: 1, mobile: 0 });
  });

  it("uses the plain label when the heading carries a key suffix", () => {
    const columns = [col("a", "Name (a)", "Name")];
    expect(autoMapColumns(columns, ["Name"])).toEqual({ a: 0 });
  });

  it("leaves unmatched fields at -1 and never uses one sheet column twice", () => {
    const columns = [col("x", "City"), col("y", "City")];
    expect(autoMapColumns(columns, ["City"])).toEqual({ x: 0, y: -1 });
  });
});

describe("buildImportRows", () => {
  const columns = [col("name", "Name"), col("age", "Age")];
  it("numbers rows like Excel (header is row 1) and skips empty rows", () => {
    const rows = buildImportRows([["Ravi", 31], [null, ""], ["Mira", null]], columns, { name: 0, age: 1 });
    expect(rows).toEqual([
      { row_number: 2, cells: { name: "Ravi", age: 31 } },
      { row_number: 4, cells: { name: "Mira" } },
    ]);
  });

  it("ignores columns that are not mapped", () => {
    expect(buildImportRows([["Ravi", 31]], columns, { name: 0, age: -1 })).toEqual([{ row_number: 2, cells: { name: "Ravi" } }]);
  });
});

describe("chunk", () => {
  it("splits into groups", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
