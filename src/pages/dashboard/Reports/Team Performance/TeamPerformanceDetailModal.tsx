import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
// Modal title / body / button styles shared with every confirmation dialog in the app.
import "../../../../components/model/ConfirmationModal.css";
import { fetchTeamPerformanceDetail, ITeamPerformanceDetail } from "./TeamPerformanceReportsController";

interface IProps {
  show: boolean;
  onHide: () => void;
  userId: number;
  username: string;
  selectedDates: Date[] | undefined;
}

const MODAL_THEME = "modal-light-1";

const Breakdown: React.FC<{ title: string; rows: { name: string; count: number }[] }> = ({ title, rows }) => (
  <div className="col-12 col-md-6 mb-3">
    <h6 className="fw-bold text-dark">{title}</h6>
    {rows.length === 0 ? (
      <div className="small text-dark">No contacts.</div>
    ) : (
      <table className="table table-sm mb-0">
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="text-dark">{r.name}</td>
              <td className="text-end fw-bold text-dark">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const TeamPerformanceDetailModal: React.FC<IProps> = ({ show, onHide, userId, username, selectedDates }) => {
  const [detail, setDetail] = useState<ITeamPerformanceDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    fetchTeamPerformanceDetail(userId, selectedDates).then((data) => {
      if (cancelled) return;
      setDetail(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [show, userId, selectedDates]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable className={MODAL_THEME}>
      <div className={`p-10 m-title ${MODAL_THEME}`}>{username} - performance details</div>
      <Modal.Body className={MODAL_THEME}>
        {loading && <div className="text-dark">Loading...</div>}
        {!loading && !detail && <div className="text-dark">No details available.</div>}
        {detail && (
          <>
            <p className="text-dark">
              Contacts worked on (called, completed a reminder for, or given a task about): <strong>{detail.contacts_touched}</strong>
            </p>
            <div className="row">
              <Breakdown title="By status" rows={detail.status_breakdown} />
              <Breakdown title="By label" rows={detail.label_breakdown} />
            </div>
            <h6 className="fw-bold text-dark mt-2">Tasks given in this period ({detail.tasks.length})</h6>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Given on</th>
                    <th>Contact</th>
                    <th>Task status</th>
                    <th>Called?</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-dark">
                        No tasks were given in this period.
                      </td>
                    </tr>
                  )}
                  {detail.tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="text-dark">{t.title || "-"}</td>
                      <td className="text-dark text-nowrap">{t.given_on}</td>
                      <td className="text-dark">{t.has_contact ? [t.contact_name, t.mobile_number].filter(Boolean).join(" | ") : "No contact"}</td>
                      <td className="text-dark">{t.completed ? "Completed" : "Pending"}</td>
                      <td className="text-dark">
                        {!t.has_contact ? "-" : t.called ? <span className="fw-bold">Yes - {t.last_call}</span> : <span className="fw-bold text-danger">No call yet</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="d-flex justify-content-end modal-buttons">
          <Button className="modal-button2" onClick={onHide}>
            Close
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TeamPerformanceDetailModal;
