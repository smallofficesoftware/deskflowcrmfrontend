import React from "react";
import {
  IBomProcess,
  IContactDetail,
  IItemDetail,
  IProductionEntryListItem,
} from "../JobCardTypes";

interface IProps {
  jobCardId: number | string;
  contactDetail: IContactDetail | null;
  itemDetail: IItemDetail | null;
  bomProcesses: IBomProcess[];
  productionEntries: IProductionEntryListItem[];
}

const JobCardFullPrint = React.forwardRef<HTMLDivElement, IProps>(
  (
    { jobCardId, contactDetail, itemDetail, bomProcesses, productionEntries },
    ref,
  ) => {
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

    const totalProduced = productionEntries.reduce(
      (sum, entry) => sum + Number(entry.produced_qty),
      0,
    );

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
          MASTER JOB CARD REPORT #{jobCardId}
        </h2>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={{ ...thStyle, width: "20%" }}>Customer</th>
              <td style={tdStyle}>{contactDetail?.name || "—"}</td>
              <th style={{ ...thStyle, width: "20%" }}>Contact No</th>
              <td style={tdStyle}>{contactDetail?.phone || "—"}</td>
            </tr>
            <tr>
              <th style={thStyle}>Item Name</th>
              <td style={tdStyle}>
                {itemDetail?.item_name || "—"} ({itemDetail?.item_code || ""})
              </td>
              <th style={thStyle}>Order No</th>
              <td style={tdStyle}>{itemDetail?.order_no || "—"}</td>
            </tr>
            <tr>
              <th style={thStyle}>Target Qty</th>
              <td style={tdStyle}>
                <strong>
                  {itemDetail?.order_qty} {itemDetail?.unit}
                </strong>
              </td>
              <th style={thStyle}>Total Produced</th>
              <td style={tdStyle}>
                <strong>
                  {totalProduced} {itemDetail?.unit}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        <h4>Required Materials</h4>
        {bomProcesses.length === 0 ? (
          <p
            style={{
              fontSize: "12px",
              fontStyle: "italic",
              marginBottom: "20px",
            }}
          >
            No required materials recorded.
          </p>
        ) : (
          bomProcesses.map((process, index) => (
            <div
              key={process.process_id || index}
              style={{ marginBottom: "15px" }}
            >
              <h5
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  margin: "5px 0",
                }}
              >
                {index + 1}. Process: {process.process_name}
              </h5>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Material Name</th>
                    <th style={thStyle}>Required Qty</th>
                    <th style={thStyle}>Available Qty</th>
                    <th style={thStyle}>Shortage/Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {process.consumption.map((m) => (
                    <tr key={`c-${m.material_id}`}>
                      <td style={tdStyle}>Consumption</td>
                      <td style={tdStyle}>
                        {m.material_name} ({m.unit})
                      </td>
                      <td style={tdStyle}>
                        {Number(m.required_qty ?? 0).toFixed(3)}
                      </td>
                      <td style={tdStyle}>
                        {Number(m.available_qty ?? 0).toFixed(3)}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: m.qty_diff < 0 ? "red" : "inherit",
                        }}
                      >
                        {Number(m.qty_diff ?? 0).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  {process.rejection.map((m) => (
                    <tr key={`r-${m.material_id}`}>
                      <td style={tdStyle}>Rejection</td>
                      <td style={tdStyle}>
                        {m.material_name} ({m.unit})
                      </td>
                      <td style={tdStyle}>
                        {Number(m.required_qty ?? 0).toFixed(3)}
                      </td>
                      <td style={tdStyle}>
                        {Number(m.available_qty ?? 0).toFixed(3)}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: m.qty_diff < 0 ? "red" : "inherit",
                        }}
                      >
                        {Number(m.qty_diff ?? 0).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  {process.consumption.length === 0 &&
                    process.rejection.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ ...tdStyle, textAlign: "center" }}
                        >
                          No materials required for this process.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          ))
        )}

        <h4>Production History</h4>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Entry ID</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Produced Qty</th>
              <th style={thStyle}>Consumption Items</th>
              <th style={thStyle}>Rejection Items</th>
              <th style={thStyle}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {productionEntries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center" }}>
                  No production entries recorded yet.
                </td>
              </tr>
            ) : (
              productionEntries.map((entry) => (
                <tr key={entry.id}>
                  <td style={tdStyle}>#{entry.id}</td>
                  <td style={tdStyle}>{entry.entry_date}</td>
                  <td style={tdStyle}>
                    <strong>{entry.produced_qty}</strong>
                  </td>
                  <td style={tdStyle}>{entry.consumption_count}</td>
                  <td style={tdStyle}>{entry.rejection_count}</td>
                  <td style={tdStyle}>{entry.remark || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          {productionEntries.length > 0 && (
            <tfoot>
              <tr>
                <th colSpan={2} style={{ ...thStyle, textAlign: "right" }}>
                  Total:
                </th>
                <th style={thStyle}>{totalProduced}</th>
                <th colSpan={3} style={thStyle}></th>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  },
);

export default JobCardFullPrint;
