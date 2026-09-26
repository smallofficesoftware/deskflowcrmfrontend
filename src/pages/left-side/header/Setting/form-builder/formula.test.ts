// Runs the backend's shared formula cases (formula.fixtures.json — copied
// verbatim from backend src/services/form_builder/formBuilderFormula.
// fixtures.json) against the frontend engine. Same runner shape as the
// backend's formBuilderFormula.test.js.
import fixtures from "./formula.fixtures.json";
import { evaluateFormula } from "./formula";

describe("formula.ts shared fixtures", () => {
  (fixtures as any[]).forEach((fx) => {
    test(fx.name, () => {
      const result = evaluateFormula(fx.formula, { resolve: (name) => fx.values[name] ?? null, today: fx.today });
      expect(result.kind).toBe(fx.expected.kind);
      expect(result.value).toBe(fx.expected.value);
      if (fx.expected.error) expect(result.error || "").toContain(fx.expected.error);
      else expect(result.error).toBeUndefined();
    });
  });
});
