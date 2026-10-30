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

// Every table in this popup (the two breakdowns and the tasks list) is full width with the same header row, so the
// titles and tables line up on one left and right edge. An empty breakdown is still a table, with one "No contacts." row.
const Breakdown: React.FC<{ title: string; label: string; rows: { name: string; count: number }[] }> = ({ title, label, rows }) => (
  <div className="mb-3">
    <h6 className="fw-bold text-dark">{title}</h6>
    <div className="table-responsive">
      <table className="table table-sm mb-0">
        <thead>
          <tr>
            <th>{label}</th>
            <th className="text-end">Contacts</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="text-dark">
                No contacts.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="text-dark">{r.name}</td>
              <td className="text-end fw-bold text-dark">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <div className={`p-10 m-title ${MODAL_THEME}`} style={{ paddingLeft: "1rem" }}>{username} - performance details</div>
      <Modal.Body className={MODAL_THEME}>
        {loading && <div className="text-dark">Loading...</div>}
        {!loading && !detail && <div className="text-dark">No details available.</div>}
        {detail && (
          <>
            {detail.new_contacts && (
              <>
                <h6 className="fw-bold text-dark">New contacts created in this period: {detail.new_contacts.count}</h6>
                <Breakdown title="By status" label="Status" rows={detail.new_contacts.status_breakdown} />
                <Breakdown title="By label" label="Label" rows={detail.new_contacts.label_breakdown} />
              </>
            )}
            {detail.followup_contacts && (
              <>
                <h6 className="fw-bold text-dark">
                  Follow-ups on older contacts (completed reminder or task): {detail.followup_contacts.count}
                </h6>
                <Breakdown title="By status" label="Status" rows={detail.followup_contacts.status_breakdown} />
                <Breakdown title="By label" label="Label" rows={detail.followup_contacts.label_breakdown} />
              </>
            )}
            <p className="small text-dark">
              All contacts worked on in this period (called, completed a reminder for, or given a task about): <strong>{detail.contacts_touched}</strong>
            </p>
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
