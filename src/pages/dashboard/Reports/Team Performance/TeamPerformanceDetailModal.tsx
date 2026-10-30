import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
// Modal title / body / button styles shared with every confirmation dialog in the app.
import "../../../../components/model/ConfirmationModal.css";
import { fetchTeamPerformanceDetail, IContactGroup, ITeamPerformanceDetail } from "./TeamPerformanceReportsController";

interface IProps {
  show: boolean;
  onHide: () => void;
  userId: number;
  username: string;
  selectedDates: Date[] | undefined;
}

type TTab = "new" | "followup" | "tasks";

const MODAL_THEME = "modal-light-1";

const formatDay = (date: Date | undefined) => (date ? date.toLocaleDateString("en-GB").replace(/\//g, "-") : "");

// Same look as the report tables (docs/REPORT_UI_GUIDELINES.md section 6): grey header row, 14px text.
const headStyle: React.CSSProperties = { background: "#f8f9fa", fontSize: "14px", fontWeight: 600 };
const cellStyle: React.CSSProperties = { fontSize: "14px" };

// Active tab = orange, the rest outlined - the same pill tabs as BOM master and Price List Rates.
const tabStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? "#f58634" : "transparent",
  color: active ? "#ffffff" : "#000000",
  border: active ? "none" : "1px solid #ccc",
  boxShadow: "none",
});

const SummaryCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="col-12 col-md-4">
    <div className="card shadow-sm border-0 bg-light p-3 text-center h-100">
      <span className="text-muted small">{label}</span>
      <h5 className="fw-bold mb-0 text-primary">{value}</h5>
      {hint && <span className="text-muted small">{hint}</span>}
    </div>
  </div>
);

// One breakdown (by status / by label): every table in the popup is full width with a header row, so the
// two sit side by side on a wide screen and stack on a phone. An empty one still shows as a table.
const BreakdownTable: React.FC<{ title: string; label: string; rows: { name: string; count: number }[] }> = ({ title, label, rows }) => {
  const total = rows.reduce((sum, r) => sum + Number(r.count || 0), 0);
  return (
    <div className="col-12 col-md-6 mb-3">
      <h6 className="fw-bold text-dark mb-2">{title}</h6>
      <div className="table-responsive border rounded">
        <table className="table table-sm table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th style={headStyle}>{label}</th>
              <th style={{ ...headStyle, width: "90px" }} className="text-end">
                Contacts
              </th>
              <th style={{ ...headStyle, width: "70px" }} className="text-end">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted" style={cellStyle}>
                  No contacts.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="text-dark" style={cellStyle}>
                  {r.name}
                </td>
                <td className="text-end fw-bold text-dark" style={cellStyle}>
                  {r.count}
                </td>
                <td className="text-end text-muted" style={cellStyle}>
                  {total > 0 ? `${Math.round((Number(r.count) / total) * 100)}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ContactGroupView: React.FC<{ group: IContactGroup | undefined; emptyText: string }> = ({ group, emptyText }) => {
  if (!group) return <div className="text-muted">{emptyText}</div>;
  return (
    <div className="row">
      <BreakdownTable title="By status" label="Status" rows={group.status_breakdown} />
      <BreakdownTable title="By label" label="Label" rows={group.label_breakdown} />
    </div>
  );
};

const TeamPerformanceDetailModal: React.FC<IProps> = ({ show, onHide, userId, username, selectedDates }) => {
  const [detail, setDetail] = useState<ITeamPerformanceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TTab>("new");

  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setTab("new");
    fetchTeamPerformanceDetail(userId, selectedDates).then((data) => {
      if (cancelled) return;
      setDetail(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [show, userId, selectedDates]);

  const taskCount = detail?.tasks.length ?? 0;
  const tabs: { key: TTab; label: string }[] = [
    { key: "new", label: `New Contacts (${detail?.new_contacts?.count ?? 0})` },
    { key: "followup", label: `Follow-ups (${detail?.followup_contacts?.count ?? 0})` },
    { key: "tasks", label: `Tasks Given (${taskCount})` },
  ];

  const period =
    selectedDates && selectedDates.length === 2
      ? `${formatDay(selectedDates[0])} to ${formatDay(selectedDates[1])}`
      : "";

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable className={MODAL_THEME}>
      <div className={`p-10 m-title ${MODAL_THEME}`} style={{ paddingLeft: "1rem" }}>
        {username} - performance details
        {period && <div className="text-muted" style={{ fontSize: "13px", fontWeight: 400 }}>Period: {period}</div>}
      </div>
      <Modal.Body className={MODAL_THEME}>
        {loading && <div className="text-dark">Loading...</div>}
        {!loading && !detail && <div className="text-dark">No details available.</div>}
        {detail && (
          <>
            {/* Summary cards: the headline numbers of the period. */}
            <div className="row g-2 mb-3">
              <SummaryCard label="New contacts created" value={detail.new_contacts?.count ?? 0} />
              <SummaryCard label="Follow-ups on older contacts" value={detail.followup_contacts?.count ?? 0} hint="completed reminder or task" />
              <SummaryCard label="Contacts worked on" value={detail.contacts_touched} hint="called, reminder completed or task given" />
            </div>

            {/* One section at a time, as pill tabs (same as the other reports). */}
            <nav className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2 mb-3" style={{ width: "100%" }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="flex-sm-fill text-sm-center nav-link"
                  onClick={() => setTab(t.key)}
                  style={tabStyle(tab === t.key)}
                >
                  <span className="m-1">{t.label}</span>
                </button>
              ))}
            </nav>

            {tab === "new" && <ContactGroupView group={detail.new_contacts} emptyText="No contacts were created in this period." />}
            {tab === "followup" && <ContactGroupView group={detail.followup_contacts} emptyText="No follow-ups in this period." />}

            {tab === "tasks" && (
              <div className="table-responsive border rounded">
                <table className="table table-sm table-hover mb-0 align-middle">
                  <thead>
                    <tr>
                      <th style={{ ...headStyle, width: "60px" }}>S.No</th>
                      <th style={headStyle}>Task</th>
                      <th style={{ ...headStyle, width: "140px" }}>Given on</th>
                      <th style={headStyle}>Contact</th>
                      <th style={{ ...headStyle, width: "120px" }}>Task status</th>
                      <th style={{ ...headStyle, width: "190px" }}>Called?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.tasks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-muted" style={cellStyle}>
                          No tasks were given in this period.
                        </td>
                      </tr>
                    )}
                    {detail.tasks.map((t, i) => (
                      <tr key={t.id}>
                        <td className="text-dark" style={cellStyle}>
                          {i + 1}
                        </td>
                        <td className="text-dark" style={cellStyle}>
                          {t.title || "-"}
                        </td>
                        <td className="text-dark text-nowrap" style={cellStyle}>
                          {t.given_on}
                        </td>
                        <td className="text-dark" style={cellStyle}>
                          {t.has_contact ? [t.contact_name, t.mobile_number].filter(Boolean).join(" | ") : "No contact"}
                        </td>
                        <td style={cellStyle}>
                          {t.completed ? <span className="badge bg-success">Completed</span> : <span className="badge bg-warning text-dark">Pending</span>}
                        </td>
                        <td style={cellStyle}>
                          {!t.has_contact ? (
                            "-"
                          ) : t.called ? (
                            <>
                              <span className="badge bg-success me-1">Called</span>
                              <span className="text-muted">{t.last_call}</span>
                            </>
                          ) : (
                            <span className="badge bg-danger">No call yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
