import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listForms, createForm, deleteForm, duplicateForm, publicFormUrl, IFormBuilderForm } from "./FormBuilderController";
import FormBuilderEditorView from "./FormBuilderEditorView";
import FormSubmissionsListView from "./FormSubmissionsListView";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";

// Reached via reportsMenuData.tsx's "Custom Forms" tile (Forms category,
// same tier as CRM/HRMS/Production) -> BottomView.tsx's forms_home branch.
// Create/edit stay a plain in-page component swap here, no modal, matching
// how this same component already behaved before this list was wired to
// go through the tile grid instead of a dedicated route.
const FormBuilderListView: React.FC = () => {
  const [forms, setForms] = useState<IFormBuilderForm[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<number | null>(null);

  const reload = async () => {
    const res = await listForms();
    setForms(res?.data?.item || []);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const res = await createForm({ title: newTitle.trim() });
    if (res?.ack === 1) {
      toast.success("Form created");
      setNewTitle("");
      await reload();
      setEditingId(res.data.item.id);
    }
  };

  if (editingId != null) {
    return <FormBuilderEditorView formId={editingId} onClose={() => { setEditingId(null); reload(); }} />;
  }
  if (viewingSubmissionsId != null) {
    return <FormSubmissionsListView formId={viewingSubmissionsId} onClose={() => setViewingSubmissionsId(null)} />;
  }

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Custom Forms</h4>
      </div>

      <div className="row mb-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <input className="form-control" placeholder="New form title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <button className="btn btn-sm fb-btn-primary" onClick={handleCreate}>
              + Create Form
            </button>
          </div>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Public Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {forms.map((f) => (
            <tr key={f.id}>
              <td>{f.title}</td>
              <td>
                {f.published_schema_json ? <span className="badge bg-success">Published</span> : <span className="badge bg-secondary">Draft</span>}
                {f.has_unpublished_changes ? <span className="badge bg-warning ms-1">Unpublished changes</span> : null}
              </td>
              <td>
                {f.allow_public_submission && publicFormUrl(f) ? (
                  <button
                    type="button"
                    className="btn btn-sm fb-btn-outline-primary"
                    title={publicFormUrl(f) || ""}
                    onClick={() => {
                      const url = publicFormUrl(f);
                      if (!url) return;
                      navigator.clipboard.writeText(url).then(
                        () => toast.success("Link copied"),
                        () => toast.error("Could not copy — copy it from the address shown"),
                      );
                    }}
                  >
                    Copy Link
                  </button>
                ) : (
                  <span className="text-muted">Off</span>
                )}
              </td>
              <td>
                <button className="btn btn-sm fb-btn-outline-primary me-1" onClick={() => setEditingId(f.id)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setViewingSubmissionsId(f.id)}>
                  Submissions
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary me-1"
                  onClick={async () => {
                    const res = await duplicateForm(f.id);
                    if (res?.ack === 1) {
                      toast.success("Duplicated");
                      reload();
                    }
                  }}
                >
                  Duplicate
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${f.title}"?`)) return;
                    const res = await deleteForm(f.id);
                    if (res?.ack === 1) {
                      toast.success("Deleted");
                      reload();
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FormBuilderListView;
