import React from "react";
import { IProductionEntryDetail } from "../JobCardTypes";

interface IProps {
  jobCardId: number | string;
  itemName: string;
  entry: IProductionEntryDetail;
}

const ProductionEntryPrint = React.forwardRef<HTMLDivElement, IProps>(
  ({ jobCardId, itemName, entry }, ref) => {
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
          PRODUCTION ENTRY RECEIPT
        </h2>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={{ ...thStyle, width: "25%" }}>Job Card No</th>
              <td style={tdStyle}>#{jobCardId}</td>
              <th style={{ ...thStyle, width: "25%" }}>Entry ID</th>
              <td style={tdStyle}>#{entry.id}</td>
            </tr>
            <tr>
              <th style={thStyle}>Item Name</th>
              <td style={tdStyle}>{itemName}</td>
              <th style={thStyle}>Date</th>
              <td style={tdStyle}>{entry.entry_date}</td>
            </tr>
            <tr>
              <th style={thStyle}>Produced Qty</th>
              <td style={tdStyle}>
                <strong>{entry.produced_qty}</strong>
              </td>
              <th style={thStyle}>Remark</th>
              <td style={tdStyle}>{entry.remark || "—"}</td>
            </tr>
          </tbody>
        </table>

        <h4>Consumed Materials</h4>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Material Name</th>
              <th style={thStyle}>Process ID</th>
              <th style={thStyle}>Consumed Qty</th>
            </tr>
          </thead>
          <tbody>
            {entry.consumption_items.map((m, i) => (
              <tr key={i}>
                <td style={tdStyle}>
                  {m.material_name || `Material ID: ${m.material_id}`}
                </td>
                <td style={tdStyle}>{m.process_id}</td>
                <td style={tdStyle}>
                  {m.qty} {m.unit || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Rejected/Scrap Materials</h4>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Material Name</th>
              <th style={thStyle}>Process ID</th>
              <th style={thStyle}>Rejected Qty</th>
            </tr>
          </thead>
          <tbody>
            {entry.rejection_items.map((m, i) => (
              <tr key={i}>
                <td style={tdStyle}>
                  {m.material_name || `Material ID: ${m.material_id}`}
                </td>
                <td style={tdStyle}>{m.process_id}</td>
                <td style={tdStyle}>
                  {m.qty} {m.unit || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

export default ProductionEntryPrint;
