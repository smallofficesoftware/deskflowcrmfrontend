import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { deleteDraft, IDraftSummary, listMyDrafts } from "../FormBuilderController";

interface Props {
  onContinue: (draft: IDraftSummary) => void;
  // Change this to load the list again (after a draft was saved or finished).
  refreshKey?: number;
}

// "My drafts" (plan M7): forms this person started and saved to finish later.
// Renders nothing when there are none.
const MyDraftsPanel: React.FC<Props> = ({ onContinue, refreshKey = 0 }) => {
  const [items, setItems] = useState<IDraftSummary[]>([]);

  const load = useCallback(async () => {
    const res = await listMyDrafts();
    if (res?.ack === 1) setItems(res.data.items || []);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!items.length) return null;

  return (
    <div className="border rounded p-3 mb-3" role="region" aria-label="My drafts">
      <div className="fw-bold mb-2">My drafts ({items.length})</div>
      {items.map((d) => (
        <div key={d.id} className="d-flex justify-content-between align-items-center py-1 border-top">
          <div>
            {d.form_title}
            <small className="text-muted ms-2">saved {new Date(d.updated_date_time).toLocaleString()}</small>
          </div>
          <div>
            <button className="btn btn-sm fb-btn-primary me-1" onClick={() => onContinue(d)}>
              Continue
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={async () => {
                if (!window.confirm("Delete this draft?")) return;
                const res = await deleteDraft(d.id);
                if (res?.ack === 1) {
                  toast.success("Draft deleted");
                  load();
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyDraftsPanel;
