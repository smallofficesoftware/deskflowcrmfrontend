import "primeicons/primeicons.css";
import React from "react";
import { IBomProcess } from "../JobCardTypes";
import { buildMaterialPipeline } from "../materialPipeline";

interface IProps {
  bomProcesses: IBomProcess[];
}

// Raw-material process status: available stock, sent into the process
// chain, currently under process (between its first and last required
// stage), ready for final assembly, and still pending - per material,
// rolled up across all the processes it goes through.
const MaterialPipelineSummary = ({ bomProcesses }: IProps) => {
  const rows = buildMaterialPipeline(bomProcesses);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-3 mb-3" style={{ border: "1.5px solid #e9ecef" }}>
      <div
        style={{
          background: "#f8f9fa",
          borderBottom: "1.5px solid #e9ecef",
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "0.85rem",
          color: "#374151",
        }}
      >
        <i className="pi pi-sitemap me-2" style={{ fontSize: "0.8rem" }} />
        Raw Material Process Status
      </div>
      <div style={{ padding: "14px 16px" }}>
        <table
          className="table table-sm table-hover mb-0"
          style={{ fontSize: "0.78rem", minWidth: 640 }}
        >
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th>Material</th>
              <th style={{ width: 70 }}>Unit</th>
              <th style={{ width: 100 }}>Available</th>
              <th style={{ width: 100 }}>Sent</th>
              <th style={{ width: 110 }}>Under Process</th>
              <th style={{ width: 130 }}>Ready for Assembly</th>
              <th style={{ width: 100 }}>Pending</th>
              <th>Process-wise</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.material_id}>
                <td className="fw-semibold">{r.material_name}</td>
                <td>{r.unit}</td>
                <td>{r.available_qty.toFixed(2)}</td>
                <td>{r.sent_qty.toFixed(2)}</td>
                <td>{r.under_process_qty.toFixed(2)}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: "#d1fae5",
                      color: "#15803d",
                      fontSize: "0.72rem",
                    }}
                  >
                    {r.ready_qty.toFixed(2)}
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: r.pending_qty > 0 ? "#fee2e2" : "#d1fae5",
                      color: r.pending_qty > 0 ? "#b91c1c" : "#15803d",
                      fontSize: "0.72rem",
                    }}
                  >
                    {r.pending_qty.toFixed(2)}
                  </span>
                </td>
                <td className="text-muted" style={{ fontSize: "0.72rem" }}>
                  {r.stages
                    .map(
                      (s) =>
                        `${s.process_name}: ${s.consumed_qty.toFixed(2)}/${s.required_qty.toFixed(2)}`,
                    )
                    .join("  •  ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialPipelineSummary;
