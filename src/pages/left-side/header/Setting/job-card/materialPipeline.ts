import { IBomProcess } from "./JobCardTypes";

export interface IMaterialPipelineStage {
  process_name: string;
  required_qty: number;
  consumed_qty: number;
}

export interface IMaterialPipelineRow {
  material_id: number;
  material_name: string;
  unit: string;
  available_qty: number;
  total_required: number; // required qty at the material's final process stage
  sent_qty: number; // consumed qty at the material's first process stage
  under_process_qty: number; // sent_qty - ready_qty: between first and last stage
  ready_qty: number; // consumed qty at the material's final process stage
  pending_qty: number; // total_required - ready_qty
  stages: IMaterialPipelineStage[];
}

// Rolls the per-process "consumption" material rows (already returned by
// job-card/detail, in process order) up into one row per raw material,
// tracking it across the process chain it goes through before assembly.
export const buildMaterialPipeline = (
  bomProcesses: IBomProcess[],
): IMaterialPipelineRow[] => {
  const byMaterial = new Map<number, IMaterialPipelineRow>();

  bomProcesses.forEach((process) => {
    process.consumption.forEach((m) => {
      const stage: IMaterialPipelineStage = {
        process_name: process.process_name,
        required_qty: m.required_qty,
        consumed_qty: m.consumed_qty || 0,
      };

      const existing = byMaterial.get(m.material_id);
      if (!existing) {
        byMaterial.set(m.material_id, {
          material_id: m.material_id,
          material_name: m.material_name,
          unit: m.unit,
          available_qty: m.available_qty,
          total_required: stage.required_qty,
          sent_qty: stage.consumed_qty,
          under_process_qty: 0,
          ready_qty: stage.consumed_qty,
          pending_qty: stage.required_qty - stage.consumed_qty,
          stages: [stage],
        });
        return;
      }

      existing.stages.push(stage);
      existing.total_required = stage.required_qty;
      existing.ready_qty = stage.consumed_qty;
      existing.under_process_qty = existing.sent_qty - existing.ready_qty;
      existing.pending_qty = existing.total_required - existing.ready_qty;
    });
  });

  return Array.from(byMaterial.values());
};
