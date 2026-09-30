import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import FormBuilderBrandStyles from "../formBuilderBrandStyles";
import {
  deleteFormSchedule,
  getReferenceOptions,
  getScheduleReport,
  IFormSchedule,
  IScheduleReportItem,
  IScheduleReportSummary,
  listFormSchedules,
  saveFormSchedule,
} from "../FormBuilderController";

interface Props {
  formId: number;
  formTitle: string;
  onClose: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayText = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const blankSchedule = (): IFormSchedule => ({
  title: "",
  frequency: "daily",
  weekdays: [1, 2, 3, 4, 5],
  day_of_month: 1,
  assignee_login_ids: [],
  start_date: todayText(),
  end_date: null,
  isActive: 1,
});

export const describeSchedule = (s: IFormSchedule): string => {
  if (s.frequency === "daily") return "Every day";
  if (s.frequency === "weekly") return `Every ${s.weekdays.map((d) => WEEKDAYS[d]).join(", ")}`;
  return `Monthly, on day ${s.day_of_month}`;
};

// Recurring forms (plan Q1/Q2): who has to fill this form and how often, and a
// report of who filled it and who missed it.
const FormSchedulesView: React.FC<Props> = ({ formId, formTitle, onClose }) => {
  const [tab, setTab] = useState<"schedules" | "report">("schedules");
  const [schedules, setSchedules] = useState<IFormSchedule[]>([]);
  const [people, setPeople] = useState<{ id: number; label: string }[]>([]);
  const [editing, setEditing] = useState<IFormSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [denied, setDenied] = useState(false);

  const reload = useCallback(async () => {
    const res = await listFormSchedules(formId);
    if (res?.ack === 1) setSchedules(res.data.items || []);
    else setDenied(true);
  }, [formId]);

  useEffect(() => {
    reload();
    getReferenceOptions("user").then((res) => setPeople(res?.data?.item || []));
  }, [reload]);

  const nameOf = (id: number) => people.find((p) => p.id === id)?.label || `User ${id}`;

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await saveFormSchedule(formId, editing);
    setSaving(false);
    if (res?.ack === 1) {
      toast.success("Schedule saved");
      setEditing(null);
      reload();
    }
  };

  const togglePerson = (id: number) => {
    if (!editing) return;
    const has = editing.assignee_login_ids.includes(id);
    setEditing({ ...editing, assignee_login_ids: has ? editing.assignee_login_ids.filter((x) => x !== id) : [...editing.assignee_login_ids, id] });
  };

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{formTitle} — Recurring</h4>
        <button className="btn btn-link" onClick={onClose}>
          Back
        </button>
      </div>

      <div className="btn-group mb-3" role="tablist">
        <button type="button" className={`btn btn-sm ${tab === "schedules" ? "fb-btn-primary" : "btn-outline-secondary"}`} onClick={() => setTab("schedules")}>
          Schedules
        </button>
        <button type="button" className={`btn btn-sm ${tab === "report" ? "fb-btn-primary" : "btn-outline-secondary"}`} onClick={() => setTab("report")}>
          Filled and missed
        </button>
      </div>

      {denied ? <div className="alert alert-warning">You don't have the right to manage schedules for this form. Ask the form's owner to allow "Manage schedules" in its Permissions.</div> : null}

      {tab === "schedules" && !denied ? (
        editing ? (
          <div style={{ maxWidth: 640 }}>
            <div className="mb-3">
              <label className="pb-1 form_label d-block" htmlFor="fb-sch-title">
                Name
              </label>
              <input id="fb-sch-title" className="form-control" placeholder="e.g. Daily machine check" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="pb-1 form_label d-block" htmlFor="fb-sch-freq">
                How often
              </label>
              <select
                id="fb-sch-freq"
                className="form-control"
                value={editing.frequency}
                onChange={(e) => setEditing({ ...editing, frequency: e.target.value as IFormSchedule["frequency"] })}
              >
                <option value="daily">Every day</option>
                <option value="weekly">On chosen weekdays</option>
                <option value="monthly">Once a month</option>
              </select>
            </div>
            {editing.frequency === "weekly" ? (
              <div className="mb-3">
                <span className="pb-1 form_label d-block">Weekdays</span>
                {WEEKDAYS.map((d, i) => (
                  <label key={d} className="me-3">
                    <input
                      type="checkbox"
                      className="me-1"
                      checked={editing.weekdays.includes(i)}
                      onChange={() =>
                        setEditing({ ...editing, weekdays: editing.weekdays.includes(i) ? editing.weekdays.filter((x) => x !== i) : [...editing.weekdays, i] })
                      }
                    />
                    {d}
                  </label>
                ))}
              </div>
            ) : null}
            {editing.frequency === "monthly" ? (
              <div className="mb-3">
                <label className="pb-1 form_label d-block" htmlFor="fb-sch-dom">
                  Day of the month
                </label>
                <input
                  id="fb-sch-dom"
                  type="number"
                  min={1}
                  max={31}
                  className="form-control"
                  style={{ maxWidth: 120 }}
                  value={editing.day_of_month ?? ""}
                  onChange={(e) => setEditing({ ...editing, day_of_month: e.target.value ? Number(e.target.value) : null })}
                />
                <small className="text-muted">A short month uses its last day (day 31 falls on 30 or 28).</small>
              </div>
            ) : null}
            <div className="row mb-3">
              <div className="col-6">
                <label className="pb-1 form_label d-block" htmlFor="fb-sch-start">
                  Starts on
                </label>
                <input id="fb-sch-start" type="date" className="form-control" value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
              </div>
              <div className="col-6">
                <label className="pb-1 form_label d-block" htmlFor="fb-sch-end">
                  Ends on (optional)
                </label>
                <input id="fb-sch-end" type="date" className="form-control" value={editing.end_date || ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value || null })} />
              </div>
            </div>
            <div className="mb-3">
              <span className="pb-1 form_label d-block">Who has to fill it ({editing.assignee_login_ids.length} chosen)</span>
              <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                {people.map((p) => (
                  <label key={p.id} className="d-block">
                    <input type="checkbox" className="me-2" checked={editing.assignee_login_ids.includes(p.id)} onChange={() => togglePerson(p.id)} />
                    {p.label}
                  </label>
                ))}
                {!people.length ? <span className="text-muted">Loading people...</span> : null}
              </div>
            </div>
            <label className="d-block mb-3">
              <input type="checkbox" className="me-2" checked={editing.isActive !== 0} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked ? 1 : 0 })} />
              Active (untick to pause without deleting)
            </label>
            <button className="btn btn-link" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn fb-btn-primary" disabled={saving} onClick={save}>
              {saving ? "Saving..." : "Save schedule"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-muted">Each person chosen gets this form in their "Forms due" list on the days it repeats. A day they don't fill it counts as missed.</p>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Repeats</th>
                  <th>People</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{s.title}</td>
                    <td>{describeSchedule(s)}</td>
                    <td>{s.assignee_login_ids.map(nameOf).join(", ")}</td>
                    <td>{s.isActive === 0 ? <span className="badge bg-secondary">Paused</span> : <span className="badge bg-success">Active</span>}</td>
                    <td>
                      <button className="btn btn-sm fb-btn-outline-primary me-1" onClick={() => setEditing(s)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={async () => {
                          if (!window.confirm(`Remove "${s.title}"? Entries already filled stay.`)) return;
                          const res = await deleteFormSchedule(formId, s.id as number);
                          if (res?.ack === 1) reload();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!schedules.length ? (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      No schedule yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <button className="btn fb-btn-primary" onClick={() => setEditing(blankSchedule())}>
              + Add schedule
            </button>
          </div>
        )
      ) : null}

      {tab === "report" ? <MissedReport formId={formId} /> : null}
    </div>
  );
};

const STATE_LABEL: Record<string, { text: string; cls: string }> = {
  done: { text: "Filled", cls: "bg-success" },
  missed: { text: "Missed", cls: "bg-danger" },
  due: { text: "Due today", cls: "bg-warning" },
};

const MissedReport: React.FC<{ formId: number }> = ({ formId }) => {
  const monthAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(todayText());
  const [onlyMissed, setOnlyMissed] = useState(true);
  const [items, setItems] = useState<IScheduleReportItem[]>([]);
  const [summary, setSummary] = useState<IScheduleReportSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await getScheduleReport(formId, { from_date: from, to_date: to });
    if (res?.ack === 1) {
      setItems(res.data.items || []);
      setSummary(res.data.summary || []);
      setLoaded(true);
    }
  }, [formId, from, to]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = onlyMissed ? items.filter((i) => i.state === "missed") : items;

  return (
    <div>
      <div className="row mb-3">
        <div className="col-6 col-md-3">
          <label className="pb-1 form_label d-block small" htmlFor="fb-rep-from">
            From
          </label>
          <input id="fb-rep-from" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="pb-1 form_label d-block small" htmlFor="fb-rep-to">
            To
          </label>
          <input id="fb-rep-to" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="col-12 col-md-6 d-flex align-items-end">
          <button className="btn fb-btn-outline-primary me-3" onClick={load}>
            Show
          </button>
          <label className="mb-2">
            <input type="checkbox" className="me-2" checked={onlyMissed} onChange={(e) => setOnlyMissed(e.target.checked)} />
            Only missed
          </label>
        </div>
      </div>

      {summary.length ? (
        <table className="table table-sm mb-4" style={{ maxWidth: 560 }}>
          <thead>
            <tr>
              <th>Person</th>
              <th>Filled</th>
              <th>Missed</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.a_application_login_id}>
                <td>{s.user_name}</td>
                <td>{s.done}</td>
                <td className={s.missed ? "text-danger fw-bold" : ""}>{s.missed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <table className="table table-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Person</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((i) => (
            <tr key={i.id}>
              <td>{i.due_date}</td>
              <td>{i.user_name}</td>
              <td>
                <span className={`badge ${STATE_LABEL[i.state].cls}`}>{STATE_LABEL[i.state].text}</span>
              </td>
            </tr>
          ))}
          {loaded && !shown.length ? (
            <tr>
              <td colSpan={3} className="text-muted">
                {onlyMissed ? "Nothing missed in this period." : "No entries in this period."}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};

export default FormSchedulesView;
