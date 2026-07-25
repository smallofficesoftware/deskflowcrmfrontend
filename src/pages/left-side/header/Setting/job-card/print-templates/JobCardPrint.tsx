import React from "react";
import { IContactDetail, IItemDetail } from "../JobCardTypes";

interface IProps {
  jobCardId: number | string;
  contactDetail: IContactDetail | null;
  itemDetail: IItemDetail | null;
}

const JobCardPrint = React.forwardRef<HTMLDivElement, IProps>(
  ({ jobCardId, contactDetail, itemDetail }, ref) => {
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
      width: "25%",
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
          JOB CARD #{jobCardId}
        </h2>

        <h4>Customer Details</h4>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={thStyle}>Customer Name</th>
              <td style={tdStyle}>{contactDetail?.name || "—"}</td>
              <th style={thStyle}>Contact No</th>
              <td style={tdStyle}>{contactDetail?.phone || "—"}</td>
            </tr>
            <tr>
              <th style={thStyle}>Email</th>
              <td style={tdStyle}>{contactDetail?.email || "—"}</td>
              <th style={thStyle}>GST No</th>
              <td style={tdStyle}>{contactDetail?.gst_no || "—"}</td>
            </tr>
            <tr>
              <th style={thStyle}>City</th>
              <td style={tdStyle}>{contactDetail?.city || "—"}</td>
              <th style={thStyle}>Address</th>
              <td style={tdStyle}>{contactDetail?.address || "—"}</td>
            </tr>
          </tbody>
        </table>

        <h4>Item Details</h4>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={thStyle}>Item Name</th>
              <td style={tdStyle}>{itemDetail?.item_name || "—"}</td>
              <th style={thStyle}>Item Code</th>
              <td style={tdStyle}>{itemDetail?.item_code || "—"}</td>
            </tr>
            <tr>
              <th style={thStyle}>Order No</th>
              <td style={tdStyle}>{itemDetail?.order_no || "—"}</td>
              <th style={thStyle}>Delivery Date</th>
              <td style={tdStyle}>{itemDetail?.delivery_date || "—"}</td>
            </tr>
            <tr>
              <th style={thStyle}>Order Qty</th>
              <td colSpan={3} style={tdStyle}>
                <strong>
                  {itemDetail?.order_qty} {itemDetail?.unit}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
);

export default JobCardPrint;
