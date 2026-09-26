// Runs the backend's shared fixtures (conditions.fixtures.json — copied
// verbatim from backend src/services/form_builder/formBuilderConditions.
// fixtures.json) against the frontend evaluator. Same runner shape as the
// backend's formBuilderConditions.test.js.
import fixtures from "./conditions.fixtures.json";
import { evaluateVisibility, isRequired, OuterContext } from "./conditions";

function runFixture(fx: any) {
  let outer: OuterContext | null = null;
  if (fx.outer) {
    const outerVisible = evaluateVisibility(fx.outer.fields, fx.outer.answers);
    outer = { fields: fx.outer.fields, answers: fx.outer.answers, visible: outerVisible };
  }
  const visible = evaluateVisibility(fx.fields, fx.answers, outer);
  const required = fx.fields.filter((f: any) => f.key && isRequired(f, fx.answers, visible, { fields: fx.fields, outer })).map((f: any) => f.key);
  return { visible: Array.from(visible).sort(), required: required.sort() };
}

describe("conditions.ts shared fixtures", () => {
  (fixtures as any[]).forEach((fx) => {
    test(fx.name, () => {
      const { visible, required } = runFixture(fx);
      expect(visible).toEqual([...fx.expectedVisible].sort());
      expect(required).toEqual([...fx.expectedRequired].sort());
    });
  });
});
