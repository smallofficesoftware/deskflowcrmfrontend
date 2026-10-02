import { toExportColumns } from "./exportColumns";

describe("toExportColumns", () => {
  it("keeps only the fields the server reads", () => {
    const columns: any[] = [
      { key: "name", label: "Name", header: { notSerializable: true }, body: () => "x", width: "160px", className: "c" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "status", label: "Status", format: "badge", colorKeys: ["status_colour"] },
      { key: "items", label: "Items", format: "nested-table", subColumns: [{ key: "q", label: "Qty", extra: 1 }] },
    ];
    expect(toExportColumns(columns)).toEqual([
      { key: "name", label: "Name" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "status", label: "Status", format: "badge", colorKeys: ["status_colour"] },
      { key: "items", label: "Items", format: "nested-table", subColumns: [{ key: "q", label: "Qty" }] },
    ]);
  });

  it("drops circular React-style values so the result can be sent as JSON", () => {
    const fiber: any = { type: "fiber" };
    fiber.return = fiber; // the circular reference React puts on elements in development
    const columns: any[] = [{ key: "net", label: "Net Bank Pay", header: { _owner: fiber }, body: () => 1 }];

    expect(() => JSON.stringify(columns)).toThrow(/circular/i);
    expect(JSON.parse(JSON.stringify(toExportColumns(columns)))).toEqual([{ key: "net", label: "Net Bank Pay" }]);
  });

  it("does not change the original columns", () => {
    const original: any[] = [{ key: "a", label: "A", header: "h" }];
    toExportColumns(original);
    expect(original).toEqual([{ key: "a", label: "A", header: "h" }]);
  });
});
