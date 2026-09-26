// Approval stages (plan item I) — frontend helpers. The rules are enforced by
// the server (backend formBuilderApproval.js); this only shapes what the
// editor and the screens show.
//
// Form settings (settings_json):
//   { approval: { enabled: true, stages: [{ id: "s1", name: "Counsellor" }, { id: "s2", name: "Division Head", users: [12], teams: [3], signature_field: "head_sign" }] } }
// Field prop `stage`: the stage that fills the field (default: the first stage).

import { IFormBuilderField } from "./FormBuilderController";

export interface IApprovalStage {
  id: string;
  name: string;
  users?: number[];
  teams?: number[];
  signature_field?: string | null;
}

export interface IFormSettings {
  approval?: { enabled: boolean; stages: IApprovalStage[] };
  // Second language (plan M8) — the name the form's owner gave it, e.g. "Gujarati".
  language?: { name?: string };
  [key: string]: any;
}

export const MAX_STAGES = 8;

export function parseSettings(json: string | null | undefined): IFormSettings {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function approvalStagesOf(settings: IFormSettings): IApprovalStage[] {
  return settings.approval?.enabled && Array.isArray(settings.approval.stages) ? settings.approval.stages : [];
}

// Stage of a field: its own when that stage exists, else the first stage.
export function fieldStageId(field: IFormBuilderField, stages: IApprovalStage[]): string | null {
  if (!stages.length) return null;
  return field.stage && stages.some((s) => s.id === field.stage) ? field.stage : stages[0].id;
}

// Keys of the fields filled at a later stage than the first — hidden while
// the entry is first being created.
export function laterStageKeys(fields: IFormBuilderField[], stages: IApprovalStage[]): string[] {
  if (stages.length < 2) return [];
  return fields.filter((f) => f.key && fieldStageId(f, stages) !== stages[0].id).map((f) => f.key);
}

// A stage id nobody has used yet ("s1", "s2", ...).
export function newStageId(stages: IApprovalStage[]): string {
  const used = new Set(stages.map((s) => s.id));
  let n = stages.length + 1;
  while (used.has(`s${n}`)) n += 1;
  return `s${n}`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting",
  sent_back: "Sent back",
  completed: "Completed",
};
