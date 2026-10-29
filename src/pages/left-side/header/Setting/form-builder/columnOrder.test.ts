import { mergeColumnOrder } from "./columnOrder";

describe("mergeColumnOrder", () => {
  test("nothing changed: the very same array comes back (so React does not re-render)", () => {
    const prev = ["a", "b", "c"];
    expect(mergeColumnOrder(prev, ["a", "b", "c"])).toBe(prev);
  });

  test("keeps the user's order, even when it differs from the default order", () => {
    const prev = ["c", "a", "b"];
    expect(mergeColumnOrder(prev, ["a", "b", "c"])).toBe(prev);
  });

  test("a new column goes at the end", () => {
    expect(mergeColumnOrder(["b", "a"], ["a", "b", "c"])).toEqual(["b", "a", "c"]);
  });

  test("a column that is gone is dropped", () => {
    expect(mergeColumnOrder(["a", "x", "b"], ["a", "b"])).toEqual(["a", "b"]);
  });

  test("from nothing: the default order", () => {
    expect(mergeColumnOrder([], ["a", "b"])).toEqual(["a", "b"]);
  });

  test("calling it again with its own result is stable", () => {
    const first = mergeColumnOrder(["b"], ["a", "b"]);
    expect(mergeColumnOrder(first, ["a", "b"])).toBe(first);
  });
});
