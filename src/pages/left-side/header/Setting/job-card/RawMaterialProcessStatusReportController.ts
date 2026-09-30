import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { IBomProcess } from "./JobCardTypes";

const uuid = () => localStorage.getItem("UUID");

export interface IRawMaterialProcessStatusReport {
  product_id: number;
  open_job_cards: number;
  processes: IBomProcess[];
}

// Ticket #2575 standalone report: pick a finished product, see its raw
// materials' status across the BOM's process chain, aggregated across
// every open (not fully produced) job card making that product - the
// cross-job-card counterpart to the per-job-card view in job-card/detail.
export const fetchRawMaterialProcessStatusReport = async (
  productId: number,
): Promise<IRawMaterialProcessStatusReport | null> => {
  try {
    const { data } = await axiosInstance.post(
      "job-card/raw-material-process-status",
      {
        a_application_login_id: uuid(),
        product_id: productId,
      },
    );
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const raw = data.data || {};
      // API returns { material_id, ..., consumed_qty, pending_qty } per
      // process - shape it into IBomProcess so MaterialPipelineSummary
      // (built for the job-card view) can be reused as-is here.
      const processes: IBomProcess[] = (raw.processes || []).map(
        (p: any) => ({
          bom_id: 0,
          process_id: p.process_id,
          process_name: p.process_name,
          consumption: (p.materials || []).map((m: any) => ({
            material_id: m.material_id,
            material_name: m.material_name,
            unit: m.unit,
            available_qty: m.available_qty,
            required_qty: m.required_qty,
            qty_diff: m.available_qty - m.required_qty,
            consumed_qty: m.consumed_qty,
          })),
          rejection: [],
        }),
      );
      return {
        product_id: raw.product_id,
        open_job_cards: raw.open_job_cards || 0,
        processes,
      };
    }
    return null;
  } catch (error) {
    console.error("Error loading raw material process status report:", error);
    return null;
  }
};
