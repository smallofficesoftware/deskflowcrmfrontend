import React, { useEffect, useState } from "react";
import { Accordion, Button, Modal } from "react-bootstrap";
// Modal title / body / button styles shared with every confirmation dialog in the app.
import "../model/ConfirmationModal.css";
import {
  fetchMyDaySummaryApi,
  IMyDayContact,
  IMyDayReminder,
  IMyDaySummary,
  IMyDayTask,
} from "./myDayController";
import { markMyDayShown, shouldShowMyDay } from "./myDayPreference";

interface IMyDayPopupProps {
  // True only while the main app screen is on screen.
  active: boolean;
}

const MODAL_THEME = "modal-light-1";

const contactLine = (c: IMyDayContact) =>
  [c.contact_name, c.company_name, c.mobile_number].filter(Boolean).join(" | ");

// Overdue is told by its word, with red only as a hint (never colour alone).
const Section: React.FC<{ eventKey: string; title: string; count: number; overdue?: boolean; children: React.ReactNode }> = ({
  eventKey,
  title,
  count,
  overdue,
  children,
}) => (
  <Accordion.Item eventKey={eventKey}>
    <Accordion.Header>
      <span className={`fw-bold ${overdue ? "text-danger" : "text-dark"}`}>{title}</span>
      <span className="fw-bold text-dark ms-2">({count})</span>
    </Accordion.Header>
    <Accordion.Body className="py-2">{children}</Accordion.Body>
  </Accordion.Item>
);

const Row: React.FC<{ title: string; detail?: string; contact: IMyDayContact; due: string }> = ({ title, detail, contact, due }) => (
  <div className="border-bottom py-2">
    <div className="d-flex justify-content-between gap-2">
      <span className="fw-semibold text-dark">{title || "-"}</span>
      <span className="text-dark small text-nowrap">{due}</span>
    </div>
    {detail ? <div className="small text-dark">{detail}</div> : null}
    {contactLine(contact) ? <div className="small text-dark">{contactLine(contact)}</div> : null}
  </div>
);

const TaskRows: React.FC<{ rows: IMyDayTask[] }> = ({ rows }) => (
  <>
    {rows.map((t) => (
      <Row key={t.id} title={t.title} detail={t.priority ? `Priority: ${t.priority}` : undefined} contact={t} due={t.due} />
    ))}
  </>
);

const ReminderRows: React.FC<{ rows: IMyDayReminder[] }> = ({ rows }) => (
  <>
    {rows.map((r) => (
      <Row key={r.id} title={r.remark} contact={r} due={r.due} />
    ))}
  </>
);

const MyDayPopup: React.FC<IMyDayPopupProps> = ({ active }) => {
  const [summary, setSummary] = useState<IMyDaySummary | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active || !localStorage.getItem("UUID") || !shouldShowMyDay()) return;
    let cancelled = false;
    fetchMyDaySummaryApi().then((data) => {
      if (cancelled || !data) return;
      const c = data.counts;
      if (c.tasks_today + c.tasks_overdue + c.reminders_today + c.reminders_overdue === 0) return;
      setSummary(data);
      setShow(true);
      markMyDayShown();
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!summary) return null;
  const c = summary.counts;
  const overdueMoreTasks = c.tasks_overdue - summary.tasks.overdue.length;
  const overdueMoreReminders = c.reminders_overdue - summary.reminders.overdue.length;
  const close = () => setShow(false);

  return (
    <Modal show={show} onHide={close} size="lg" centered scrollable className={MODAL_THEME}>
      <div className={`p-10 m-title ${MODAL_THEME}`}>Today's work - {summary.date.split("-").reverse().join("-")}</div>
      <Modal.Body className={MODAL_THEME}>
        {/* Today's sections start open, the overdue ones collapsed. */}
        <Accordion alwaysOpen defaultActiveKey={["tasks_today", "reminders_today"]}>
          <Section eventKey="tasks_today" title="Tasks due today" count={c.tasks_today}>
            {summary.tasks.today.length > 0 ? <TaskRows rows={summary.tasks.today} /> : <div className="small text-dark">Nothing due today.</div>}
          </Section>
          <Section eventKey="reminders_today" title="Reminders today" count={c.reminders_today}>
            {summary.reminders.today.length > 0 ? (
              <ReminderRows rows={summary.reminders.today} />
            ) : (
              <div className="small text-dark">No reminders today.</div>
            )}
          </Section>
          {c.tasks_overdue > 0 && (
            <Section eventKey="tasks_overdue" title="Overdue tasks" count={c.tasks_overdue} overdue>
              <TaskRows rows={summary.tasks.overdue} />
              {overdueMoreTasks > 0 && <div className="small text-dark pt-2">+ {overdueMoreTasks} older overdue tasks in the task list.</div>}
            </Section>
          )}
          {c.reminders_overdue > 0 && (
            <Section eventKey="reminders_overdue" title="Overdue reminders" count={c.reminders_overdue} overdue>
              <ReminderRows rows={summary.reminders.overdue} />
              {overdueMoreReminders > 0 && <div className="small text-dark pt-2">+ {overdueMoreReminders} older overdue reminders in the reminder list.</div>}
            </Section>
          )}
        </Accordion>
        <div className="d-flex justify-content-between align-items-center modal-buttons">
          <span className="small text-dark">Change how often this shows in Personal Settings.</span>
          <Button className="modal-button2" onClick={close}>
            Close
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default MyDayPopup;
