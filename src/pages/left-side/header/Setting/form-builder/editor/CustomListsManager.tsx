import React, { useState } from "react";
import { toast } from "react-toastify";
import { deleteCustomList, ICustomList, saveCustomList } from "../FormBuilderController";

interface Props {
  lists: ICustomList[];
  onListsChange: (lists: ICustomList[]) => void;
  onClose: () => void;
}

interface Draft {
  id: number | null;
  name: string;
  items: { id: number | null; label: string }[];
}

const emptyDraft = (): Draft => ({ id: null, name: "", items: [{ id: null, label: "" }] });

// Manage the company's custom lists (plan item E1): reusable pick-lists such
// as Division, Department, Site or Project that any form's "Reference"
// field can use. Items keep their id when renamed or reordered, so saved
// entries keep pointing at the right item.
const CustomListsManager: React.FC<Props> = ({ lists, onListsChange, onClose }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [paste, setPaste] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const patchItem = (i: number, label: string) =>
    setDraft((d) => (d ? { ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, label } : it)) } : d));
  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const j = i + dir;
      if (j < 0 || j >= d.items.length) return d;
      const items = [...d.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...d, items };
    });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await saveCustomList({ id: draft.id || undefined, name: draft.name, items: draft.items });
    setSaving(false);
    if (res?.ack === 1) {
      toast.success("List saved");
      onListsChange(res.data?.items || []);
      setDraft(null);
    }
  };

  const remove = async (id: number) => {
    const res = await deleteCustomList(id);
    setConfirmDeleteId(null);
    if (res?.ack === 1) {
      toast.success("List deleted");
      onListsChange(res.data?.items || []);
    }
  };

  return (
    <div className="card mb-3" style={{ borderColor: "#F58634" }}>
      <div className="card-body">
        <div className="d-flex align-items-center mb-2">
          <h6 className="mb-0 me-auto">Your lists</h6>
          <button type="button" className="btn btn-sm btn-link" onClick={onClose}>
            Close
          </button>
        </div>

        {!draft ? (
          <>
            <p className="text-muted mb-2" style={{ fontSize: 13 }}>
              Lists such as Division, Department or Site can be picked from a dropdown on any of your forms.
            </p>
            {lists.length === 0 ? <p className="text-muted">No lists yet.</p> : null}
            {lists.map((l) => (
              <div key={l.id} className="d-flex align-items-center mb-2" style={{ gap: 6 }}>
                <span className="me-auto text-truncate" title={l.name}>
                  <strong>{l.name}</strong> <small className="text-muted">({l.items.length} items)</small>
                </span>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDraft({ id: l.id, name: l.name, items: l.items.map((i) => ({ ...i })) })}>
                  Edit
                </button>
                {confirmDeleteId === l.id ? (
                  <>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(l.id)}>
                      Yes, delete
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmDeleteId(null)}>
                      No
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setConfirmDeleteId(l.id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-sm fb-btn-outline-primary" onClick={() => setDraft(emptyDraft())}>
              <i className="pi pi-plus" /> New list
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="pb-2 form_label d-block">List name</label>
              <input className="form-control" value={draft.name} maxLength={100} placeholder="e.g. Division" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <label className="pb-2 form_label d-block">Items</label>
            {draft.items.map((it, i) => (
              <div key={i} className="d-flex mb-1" style={{ gap: 4 }}>
                <input className="form-control" value={it.label} maxLength={150} onChange={(e) => patchItem(i, e.target.value)} aria-label={`Item ${i + 1}`} />
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  <i className="pi pi-arrow-up" />
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i === draft.items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  <i className="pi pi-arrow-down" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) })}
                  aria-label="Remove item"
                >
                  <i className="pi pi-trash" />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setDraft({ ...draft, items: [...draft.items, { id: null, label: "" }] })}>
              <i className="pi pi-plus" /> Add item
            </button>
            <div className="form-group">
              <label className="pb-1 form_label d-block">Paste many (one per line)</label>
              <textarea className="form-control" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} />
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mt-1"
                disabled={!paste.trim()}
                onClick={() => {
                  const added = paste
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((label) => ({ id: null, label }));
                  setDraft({ ...draft, items: [...draft.items.filter((i) => i.label.trim()), ...added] });
                  setPaste("");
                }}
              >
                Add these
              </button>
            </div>
            <div className="d-flex" style={{ gap: 6 }}>
              <button type="button" className="btn fb-btn-primary" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save list"}
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={saving} onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomListsManager;
