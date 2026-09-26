// Approval stage helpers (plan item I) used by the editor and the fill screens.
import { approvalStagesOf, fieldStageId, laterStageKeys, newStageId, parseSettings } from "./approval";
import { IFormBuilderField } from "./FormBuilderController";

const f = (o: any): IFormBuilderField => o as IFormBuilderField;
const STAGES = [
  { id: "s1", name: "Counsellor" },
  { id: "s2", name: "Division Head", users: [12] },
  { id: "s3", name: "Issuer", users: [15] },
];

describe("settings", () => {
  test("parse is forgiving", () => {
    expect(parseSettings(null)).toEqual({});
    expect(parseSettings("nope")).toEqual({});
    expect(parseSettings('{"approval":{"enabled":true,"stages":[]}}').approval?.enabled).toBe(true);
  });
  test("stages only count when approval is on", () => {
    expect(approvalStagesOf({ approval: { enabled: false, stages: STAGES } })).toEqual([]);
    expect(approvalStagesOf({ approval: { enabled: true, stages: STAGES } })).toHaveLength(3);
    expect(approvalStagesOf({})).toEqual([]);
  });
});

describe("which stage fills a field", () => {
  test("its own stage, else the first", () => {
    expect(fieldStageId(f({ key: "a" }), STAGES)).toBe("s1");
    expect(fieldStageId(f({ key: "a", stage: "s3" }), STAGES)).toBe("s3");
    expect(fieldStageId(f({ key: "a", stage: "gone" }), STAGES)).toBe("s1");
    expect(fieldStageId(f({ key: "a" }), [])).toBeNull();
  });
  test("fields of later stages are hidden while the entry is first created", () => {
    const fields = [f({ key: "a" }), f({ key: "b", stage: "s2" }), f({ key: "c", stage: "s3" }), f({ key: "d", stage: "s1" })];
    expect(laterStageKeys(fields, STAGES)).toEqual(["b", "c"]);
    expect(laterStageKeys(fields, [])).toEqual([]);
    expect(laterStageKeys(fields, STAGES.slice(0, 1))).toEqual([]);
  });
});

describe("new stage ids", () => {
  test("never reuse an id", () => {
    expect(newStageId(STAGES)).toBe("s4");
    // two stages exist (s1, s3): the next candidate s3 is taken, so s4 is used
    expect(newStageId([{ id: "s1", name: "A" }, { id: "s3", name: "B" }])).toBe("s4");
  });
});
