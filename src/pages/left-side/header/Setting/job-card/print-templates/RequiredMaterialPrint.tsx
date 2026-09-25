import React from "react";
import { IBomProcess } from "../JobCardTypes";
import { diffOf, pendingOf } from "../materialStock";

interface IProps {
  jobCardId: number | string;
  itemName: string;
  bomProcesses: IBomProcess[];
}

const RequiredMaterialPrint = React.forwardRef<HTMLDivElement, IProps>(
  ({ jobCardId, itemName, bomProcesses }, ref) => {
    const tableStyle = {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginBottom: "20px",
      fontSize: "12px",
    };
    const thStyle = {
      border: "1px solid #000",
      padding: "6px",
      backgroundColor: "#f8f9fa",
      textAlign: "left" as const,
    };
    const tdStyle = {
      border: "1px solid #000",
      padding: "6px",
      textAlign: "left" as const,
    };

    return (
      <div
        ref={ref}
        style={{ padding: "20px", fontFamily: "sans-serif", color: "#000" }}
      >
        <h2
          style={{
            textAlign: "center",
            borderBottom: "2px solid #000",
            paddingBottom: "10px",
          }}
        >
          REQUIRED MATERIAL - JOB CARD #{jobCardId}
        </h2>
        <p>
          <strong>Item:</strong> {itemName}
        </p>

        {bomProcesses.map((process, index) => (
          <div key={process.process_id}>
            <h4>
              {index + 1}. Process: {process.process_name}
            </h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Material Name</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Required Qty</th>
                  <th style={thStyle}>Available Qty</th>
                  <th style={thStyle}>Consumed/Rejected</th>
                  <th style={thStyle}>Pending Qty</th>
                  <th style={thStyle}>Shortage/Diff</th>
                </tr>
              </thead>
              <tbody>
                {/* Consumption */}
                {process.consumption.map((m) => (
                  <tr key={`c-${m.material_id}`}>
                    <td style={tdStyle}>Consumption</td>
                    <td style={tdStyle}>{m.material_name}</td>
                    <td style={tdStyle}>{m.unit}</td>
                    <td style={tdStyle}>{m.required_qty.toFixed(3)}</td>
                    <td style={tdStyle}>{m.available_qty.toFixed(3)}</td>
                    <td style={tdStyle}>{Number(m.consumed_qty ?? 0).toFixed(3)}</td>
                    <td style={tdStyle}>{pendingOf(m).toFixed(3)}</td>
                    <td
                      style={{
                        ...tdStyle,
                        color: diffOf(m) < 0 ? "red" : "inherit",
                      }}
                    >
                      {diffOf(m).toFixed(3)}
                    </td>
                  </tr>
                ))}
                {/* Rejection */}
                {process.rejection.map((m) => (
                  <tr key={`r-${m.material_id}`}>
                    <td style={tdStyle}>Rejection</td>
                    <td style={tdStyle}>{m.material_name}</td>
                    <td style={tdStyle}>{m.unit}</td>
                    <td style={tdStyle}>{m.required_qty.toFixed(3)}</td>
                    <td style={tdStyle}>{m.available_qty.toFixed(3)}</td>
                    <td style={tdStyle}>{Number(m.consumed_qty ?? 0).toFixed(3)}</td>
                    <td style={tdStyle}>{pendingOf(m).toFixed(3)}</td>
                    <td
                      style={{
                        ...tdStyle,
                        color: diffOf(m) < 0 ? "red" : "inherit",
                      }}
                    >
                      {diffOf(m).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  },
);

export default RequiredMaterialPrint;
