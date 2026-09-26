// Frontend copy of the backend's calculation cases (formBuilderCalculations.
// test.js): the live numbers on the fill screen must match what the server
// stores. Uses only the parts computeCalculations exposes.
import { computeCalculations, resultLabelFor, decimalsOf } from "./calculations";
import { IFormBuilderField } from "./FormBuilderController";

const f = (o: any): IFormBuilderField => o as IFormBuilderField;

describe("computeCalculations", () => {
  test("quantity times rate, rounded to the field's decimals", () => {
    const fields = [f({ key: "qty", type: "number" }), f({ key: "rate", type: "number" }), f({ key: "total", type: "calculation", formula: "[qty] * [rate]", decimals: 1 })];
    expect(computeCalculations(fields, { qty: 3, rate: "2.55" }).top.total).toBe(7.7);
  });

  test("empty fields count as zero; division by zero is empty", () => {
    const fields = [f({ key: "a", type: "number" }), f({ key: "t", type: "calculation", formula: "[a] / 3 + 1" }), f({ key: "z", type: "calculation", formula: "10 / [a]" })];
    const out = computeCalculations(fields, {});
    expect(out.top.t).toBe(1);
    expect(out.top.z).toBeNull();
  });

  test("calculations can use other calculations in any form order", () => {
    const fields = [
      f({ key: "grand", type: "calculation", formula: "[net] + [tax]" }),
      f({ key: "tax", type: "calculation", formula: "[net] * 0.18" }),
      f({ key: "net", type: "calculation", formula: "[a] * 2" }),
      f({ key: "a", type: "number" }),
    ];
    const { top } = computeCalculations(fields, { a: 100 });
    expect([top.net, top.tax, top.grand]).toEqual([200, 36, 236]);
  });

  test("date result: received + 7 days", () => {
    const fields = [f({ key: "received", type: "date" }), f({ key: "due", type: "calculation", result_type: "date", formula: "ADD_DAYS([received], 7)" })];
    expect(computeCalculations(fields, { received: "2026-03-28" }).top.due).toBe("2026-04-04");
  });

  test("repeater: per-row amount and a total over the rows", () => {
    const fields = [
      f({
        key: "items",
        type: "repeater",
        columns: [
          { key: "qty", type: "number" },
          { key: "rate", type: "number" },
          { key: "amount", type: "calculation", formula: "[qty] * [rate]" },
        ],
      }),
      f({ key: "total", type: "calculation", formula: "SUM([items.amount])" }),
    ];
    const out = computeCalculations(fields, { items: [{ qty: 2, rate: 10 }, { qty: 1, rate: 5.5 }, { qty: "", rate: 3 }] });
    expect(out.rows.items.map((r) => r.amount)).toEqual([20, 5.5, 0]);
    expect(out.top.total).toBe(25.5);
  });

  test("a row calculation can use a top-level value", () => {
    const fields = [f({ key: "tax", type: "number" }), f({ key: "items", type: "repeater", columns: [{ key: "net", type: "number" }, { key: "gross", type: "calculation", formula: "[net] * (1 + [tax] / 100)" }] })];
    expect(computeCalculations(fields, { tax: 18, items: [{ net: 100 }] }).rows.items[0].gross).toBe(118);
  });

  test("question table score in a calculation", () => {
    const fields = [
      f({
        key: "checks",
        type: "question-table",
        scored: true,
        questions: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }, { id: "d", text: "D" }],
        answer_columns: [{ key: "answer", label: "Yes/No", type: "yes_no" }],
      }),
      f({ key: "pct", type: "calculation", decimals: 0, formula: "IF([checks.max_score] = 0, 0, [checks.score] / [checks.max_score] * 100)" }),
    ];
    const grid = { a: { answer: "Yes" }, b: { answer: "Yes" }, c: { answer: "Yes" }, d: { answer: "No" } };
    expect(computeCalculations(fields, { checks: grid }).top.pct).toBe(75);
    expect(computeCalculations(fields, {}).top.pct).toBe(0);
  });

  test("a hidden calculation is empty", () => {
    const fields = [f({ key: "show", type: "checkbox" }), f({ key: "t", type: "calculation", formula: "5", conditions: { rules: [{ field: "show", op: "is", value: 1 }] } })];
    expect(computeCalculations(fields, { show: 0 }).top.t).toBeNull();
    expect(computeCalculations(fields, { show: 1 }).top.t).toBe(5);
  });
});

describe("result labels and defaults", () => {
  test("highest range reached wins", () => {
    const field = f({ result_ranges: [{ from: 80, label: "Grade A" }, { from: 0, label: "Fail" }, { from: 50, label: "Pass" }] });
    expect(resultLabelFor(field, 95)).toBe("Grade A");
    expect(resultLabelFor(field, 50)).toBe("Pass");
    expect(resultLabelFor(field, 10)).toBe("Fail");
    expect(resultLabelFor(field, -1)).toBeNull();
    expect(resultLabelFor(field, null)).toBeNull();
  });
  test("decimals default to 2 and stop at 4", () => {
    expect(decimalsOf(f({}))).toBe(2);
    expect(decimalsOf(f({ decimals: 0 }))).toBe(0);
    expect(decimalsOf(f({ decimals: 9 }))).toBe(2);
  });
});
