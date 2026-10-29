import { withoutRowIds } from "./copyEntry";

describe("withoutRowIds", () => {
  test("keeps plain answers and dates as they are", () => {
    const answers = { work_date: "2026-10-17", karigar: "Mahesh", hours: 2, tags: ["a", "b"] };
    expect(withoutRowIds(answers)).toEqual(answers);
  });

  test("drops the ids of repeater rows, keeps the rest of each row", () => {
    const out = withoutRowIds({ items: [{ id: 5, name: "a", qty: 1 }, { id: 6, name: "b", qty: 2 }] });
    expect(out.items).toEqual([{ name: "a", qty: 1 }, { name: "b", qty: 2 }]);
  });

  test("a list of plain values is left alone", () => {
    expect(withoutRowIds({ tags: ["x", "y"] }).tags).toEqual(["x", "y"]);
  });

  test("an empty repeater stays empty and the input is not changed", () => {
    const input = { items: [{ id: 1, n: "a" }], empty: [] as any[] };
    const out = withoutRowIds(input);
    expect(out.empty).toEqual([]);
    expect(input.items[0]).toEqual({ id: 1, n: "a" });
  });
});
