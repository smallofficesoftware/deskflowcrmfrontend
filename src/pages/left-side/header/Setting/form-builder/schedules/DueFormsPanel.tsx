import React, { useEffect, useState } from "react";
import { IDueForm, listMyDueForms } from "../FormBuilderController";

interface Props {
  onFill: (item: IDueForm) => void;
  // Change this to load the list again (after a form was filled).
  refreshKey?: number;
}

// "Forms due today" (plan Q1): what this person still has to fill from their
// recurring schedules — today's, plus earlier days shown as late. Renders
// nothing when there is nothing to do.
const DueFormsPanel: React.FC<Props> = ({ onFill, refreshKey = 0 }) => {
  const [items, setItems] = useState<IDueForm[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMyDueForms().then((res) => {
      if (!cancelled && res?.ack === 1) setItems(res.data.items || []);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!items.length) return null;
  const late = items.filter((i) => i.state === "missed").length;

  return (
    <div className="border rounded p-3 mb-3" role="region" aria-label="Forms due">
      <div className="fw-bold mb-2">
        Forms due for you ({items.length}
        {late ? `, ${late} late` : ""})
      </div>
      {items.map((i) => (
        <div key={i.id} className="d-flex justify-content-between align-items-center py-1 border-top">
          <div>
            <span>{i.form_title}</span>
            <small className="text-muted ms-2">{i.schedule_title}</small>
            {i.state === "missed" ? <span className="badge bg-danger ms-2">Late — {i.due_date}</span> : <span className="badge bg-warning ms-2">Today</span>}
          </div>
          <button className="btn btn-sm fb-btn-primary" onClick={() => onFill(i)}>
            Fill now
          </button>
        </div>
      ))}
    </div>
  );
};

export default DueFormsPanel;
