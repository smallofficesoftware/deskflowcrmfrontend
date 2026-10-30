import React from "react";
import { Button, Modal } from "react-bootstrap";
// Modal title / body / button styles shared with every confirmation dialog in the app.
import "../../../../components/model/ConfirmationModal.css";
import { IWarehouseMovementLine } from "./WarehouseTransferReportController";

interface IProps {
  show: boolean;
  onHide: () => void;
  /** What was clicked, e.g. "Default Warhouse - Stock In (+)". */
  title: string;
  /** The period shown under the title. */
  period?: string;
  lines: IWarehouseMovementLine[];
  /** True when the report returned only the newest lines of a very large period. */
  truncated?: boolean;
}

const MODAL_THEME = "modal-light-1";

const fmtQty = (n: number) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 4 });

// Same look as the report tables (docs/REPORT_UI_GUIDELINES.md section 6): grey header row, 14px text.
const headStyle: React.CSSProperties = { background: "#f8f9fa", fontSize: "14px", fontWeight: 600, position: "sticky", top: 0, zIndex: 1 };
const cellStyle: React.CSSProperties = { fontSize: "14px" };

/** The document lines behind one total of the Warehouse Transfer Report, with their own totals underneath, so the
 * clicked number can be checked line by line. */
const WarehouseMovementDetailModal: React.FC<IProps> = ({ show, onHide, title, period, lines, truncated }) => {
  const totalIn = lines.reduce((s, l) => s + Number(l.in_qty || 0), 0);
  const totalOut = lines.reduce((s, l) => s + Number(l.out_qty || 0), 0);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable className={MODAL_THEME}>
      <div className={`p-10 m-title ${MODAL_THEME}`} style={{ paddingLeft: "1rem" }}>
        {title}
        {period && (
          <div className="text-muted" style={{ fontSize: "13px", fontWeight: 400 }}>
            Period: {period}
          </div>
        )}
      </div>
      <Modal.Body className={MODAL_THEME}>
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 bg-light p-2 text-center h-100">
              <span className="text-muted small">Document lines</span>
              <h5 className="fw-bold mb-0 text-dark">{lines.length}</h5>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="card shadow-sm border-0 bg-light p-2 text-center h-100">
              <span className="text-muted small">Stock In (+)</span>
              <h5 className="fw-bold mb-0 text-success">{fmtQty(totalIn)}</h5>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="card shadow-sm border-0 bg-light p-2 text-center h-100">
              <span className="text-muted small">Stock Out (-)</span>
              <h5 className="fw-bold mb-0 text-danger">{fmtQty(totalOut)}</h5>
            </div>
          </div>
        </div>

        {truncated && (
          <p className="text-muted small mb-2">
            This period is very large, so only the newest document lines are listed here. Narrow the dates or pick a warehouse to see all of them.
          </p>
        )}

        <div className="table-responsive border rounded" style={{ maxHeight: "55vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ ...headStyle, width: "60px" }}>S.No</th>
                <th style={{ ...headStyle, width: "110px" }}>Date</th>
                <th style={headStyle}>Source</th>
                <th style={headStyle}>Document No.</th>
                <th style={headStyle}>Product</th>
                <th style={{ ...headStyle, width: "110px" }}>Code</th>
                <th style={{ ...headStyle, width: "110px" }} className="text-end">
                  Stock In (+)
                </th>
                <th style={{ ...headStyle, width: "110px" }} className="text-end">
                  Stock Out (-)
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-muted" style={cellStyle}>
                    No document lines.
                  </td>
                </tr>
              )}
              {lines.map((l, i) => (
                <tr key={`${l.cart_number}_${l.product_id}_${i}`}>
                  <td style={cellStyle}>{i + 1}</td>
                  <td className="text-nowrap" style={cellStyle}>
                    {l.cart_date}
                  </td>
                  <td style={cellStyle}>{l.source}</td>
                  <td style={cellStyle}>{l.cart_number || "-"}</td>
                  <td style={cellStyle}>{l.product_name || "-"}</td>
                  <td style={cellStyle}>{l.product_code || "-"}</td>
                  <td className="text-end" style={cellStyle}>
                    {l.in_qty ? <span className="text-success fw-bold">+{fmtQty(l.in_qty)}</span> : "-"}
                  </td>
                  <td className="text-end" style={cellStyle}>
                    {l.out_qty ? <span className="text-danger fw-bold">-{fmtQty(l.out_qty)}</span> : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end modal-buttons">
          <Button className="modal-button2" onClick={onHide}>
            Close
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default WarehouseMovementDetailModal;
