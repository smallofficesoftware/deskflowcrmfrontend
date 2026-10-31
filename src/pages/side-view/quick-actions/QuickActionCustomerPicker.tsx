import React, { useEffect, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
// Modal title / body / button styles shared with every confirmation dialog in the app.
import "../../../components/model/ConfirmationModal.css";
import { IPickCustomer, searchCustomers } from "./quickActionsController";

interface IProps {
  show: boolean;
  onHide: () => void;
  /** What the customer is for, e.g. "Add Inquiry". */
  title: string;
  onPick: (customer: IPickCustomer) => void;
}

const MODAL_THEME = "modal-light-1";

/** "Choose customer" step of the Quick actions that need one (Add Inquiry, Add Reminder), like the app's customer
 * picker: type 2 letters or more of the name, mobile number or company, then pick a row. */
const QuickActionCustomerPicker: React.FC<IProps> = ({ show, onHide, title, onPick }) => {
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState<IPickCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    if (!show) return;
    setTerm("");
    setRows([]);
  }, [show]);

  // 400 ms after the last key; an older answer never replaces a newer one.
  useEffect(() => {
    if (term.trim().length < 2) {
      setRows([]);
      return;
    }
    const seq = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const found = await searchCustomers(term);
      if (seq === latest.current) {
        setRows(found);
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [term]);

  return (
    <Modal show={show} onHide={onHide} centered scrollable className={MODAL_THEME}>
      <div className={`p-10 m-title ${MODAL_THEME}`} style={{ paddingLeft: "1rem" }}>
        {title} - choose customer
      </div>
      <Modal.Body className={MODAL_THEME}>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search by name, mobile number or company"
          value={term}
          autoFocus
          onChange={(e) => setTerm(e.target.value)}
        />
        <div className="border rounded" style={{ maxHeight: "45vh", overflowY: "auto" }}>
          {term.trim().length < 2 && <div className="p-3 text-muted small">Type at least 2 letters.</div>}
          {term.trim().length >= 2 && loading && <div className="p-3 text-muted small">Searching...</div>}
          {term.trim().length >= 2 && !loading && rows.length === 0 && <div className="p-3 text-muted small">No customer found.</div>}
          {rows.map((c) => (
            <button
              key={c.id}
              type="button"
              className="d-block w-100 text-start border-0 bg-white px-3 py-2"
              style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}
              onClick={() => onPick(c)}
            >
              <span className="fw-semibold text-dark">{c.person_name || "-"}</span>
              <span className="text-muted"> | {c.mobile_number || "-"}</span>
              {c.company_name && <span className="text-muted"> | {c.company_name}</span>}
            </button>
          ))}
        </div>
        <div className="d-flex justify-content-end modal-buttons">
          <Button className="modal-button2" onClick={onHide}>
            Cancel
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default QuickActionCustomerPicker;
