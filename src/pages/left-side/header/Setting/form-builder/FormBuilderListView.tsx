import BetaFeatureNotice from "../../../../../components/BetaFeatureNotice";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listForms, createForm, deleteForm, duplicateForm, publicFormUrl, listTemplates, IFormBuilderForm, IStarterTemplate, ICompanyTemplate, TemplateChoice } from "./FormBuilderController";
import FormBuilderEditorView from "./FormBuilderEditorView";
import FormSubmissionsListView from "./FormSubmissionsListView";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";
import InternalFormFillView from "../../../../forms-internal-fill/InternalFormFillView";
import ImportEntriesView from "./import/ImportEntriesView";
import FormSchedulesView from "./schedules/FormSchedulesView";
import DueFormsPanel from "./schedules/DueFormsPanel";
import MyDraftsPanel from "./drafts/MyDraftsPanel";

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
  // Fill a form now (optionally the due day of a recurring schedule), import from Excel, recurring setup (plan Q).
  const [filling, setFilling] = useState<{ formId: number; scheduleEntryId?: number; draftId?: number } | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [dueRefresh, setDueRefresh] = useState(0);

  // Starter forms and saved templates for "New form" (plan L1).
  const [starters, setStarters] = useState<IStarterTemplate[]>([]);
  const [companyTemplates, setCompanyTemplates] = useState<ICompanyTemplate[]>([]);
  const [templateChoice, setTemplateChoice] = useState(""); // "" = blank, "b:<key>" or "c:<id>"

  const reload = async () => {
    const res = await listForms();
    setForms(res?.data?.item || []);
  };

  useEffect(() => {
    listTemplates().then((res) => {
      if (res?.ack === 1) {
        setStarters(res.data?.builtin || []);
        setCompanyTemplates(res.data?.company || []);
      }
    });
  }, []);

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const template: TemplateChoice | undefined = templateChoice.startsWith("b:")
      ? { source: "builtin", key: templateChoice.slice(2) }
      : templateChoice.startsWith("c:")
        ? { source: "company", id: Number(templateChoice.slice(2)) }
        : undefined;
    const res = await createForm({ title: newTitle.trim(), template });
    if (res?.ack === 1) {
      toast.success("Form created");
      setNewTitle("");
      setTemplateChoice("");
      await reload();
      setEditingId(res.data.item.id);
    }
  };

  if (editingId != null) {
    return <FormBuilderEditorView formId={editingId} onClose={() => { setEditingId(null); reload(); }} />;
  }
  if (filling) {
    const form = forms.find((f) => f.id === filling.formId);
    return (
      <div>
        <div className="px-3 pt-3">
          <button className="btn btn-link px-0" onClick={() => setFilling(null)}>
            ← Back to forms
          </button>
        </div>
        <InternalFormFillView
          formId={filling.formId}
          scheduleEntryId={filling.scheduleEntryId}
          draftId={filling.draftId}
          onDraftSaved={() => setDueRefresh((n) => n + 1)}
          onSubmitted={() => {
            // A due day is done once filled — go back to the list, which reloads what is still due.
            setDueRefresh((n) => n + 1);
            if (filling.scheduleEntryId || filling.draftId) setFilling(null);
          }}
          key={`${form?.id}-${filling.scheduleEntryId || 0}-${filling.draftId || 0}`}
        />
      </div>
    );
  }
  if (importingId != null) {
    return <ImportEntriesView formId={importingId} onClose={() => setImportingId(null)} />;
  }
  if (schedulingId != null) {
    return <FormSchedulesView formId={schedulingId} formTitle={forms.find((f) => f.id === schedulingId)?.title || "Form"} onClose={() => setSchedulingId(null)} />;
  }
  if (viewingSubmissionsId != null) {
    return <FormSubmissionsListView formId={viewingSubmissionsId} onClose={() => setViewingSubmissionsId(null)} />;
  }

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <BetaFeatureNotice />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Custom Forms</h4>
      </div>

      <div className="row mb-3">
        <div className="col-12 col-md-4 mb-2">
          <label className="pb-1 form_label d-block small" htmlFor="fb-new-template">
            Start from
          </label>
          <select id="fb-new-template" className="form-control" value={templateChoice} onChange={(e) => {
            setTemplateChoice(e.target.value);
            // A starter form suggests its own name when the box is still empty.
            const chosen = starters.find((t) => `b:${t.key}` === e.target.value) || companyTemplates.find((t) => `c:${t.id}` === e.target.value);
            if (chosen && !newTitle.trim()) setNewTitle(chosen.title);
          }}>
            <option value="">A blank form</option>
            {starters.length ? (
              <optgroup label="Starter forms">
                {starters.map((t) => (
                  <option key={t.key} value={`b:${t.key}`}>
                    {t.title} ({t.field_count} fields)
                  </option>
                ))}
              </optgroup>
            ) : null}
            {companyTemplates.length ? (
              <optgroup label="Your saved templates">
                {companyTemplates.map((t) => (
                  <option key={t.id} value={`c:${t.id}`}>
                    {t.title} ({t.field_count} fields)
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
          {templateChoice ? (
            <small className="text-muted d-block mt-1">
              {(starters.find((t) => `b:${t.key}` === templateChoice) || companyTemplates.find((t) => `c:${t.id}` === templateChoice))?.description}
            </small>
          ) : null}
        </div>
        <div className="col-12 col-md-4">
          <label className="pb-1 form_label d-block small">&nbsp;</label>
          <div className="input-group">
            <input className="form-control" placeholder="New form title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <button className="btn btn-sm fb-btn-primary" onClick={handleCreate}>
              + Create Form
            </button>
          </div>
        </div>
      </div>

      <MyDraftsPanel refreshKey={dueRefresh} onContinue={(d) => setFilling({ formId: d.form_id, draftId: d.id })} />
      <DueFormsPanel refreshKey={dueRefresh} onFill={(item) => setFilling({ formId: item.form_id, scheduleEntryId: item.id })} />

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
                {f.published_schema_json ? (
                  <button className="btn btn-sm fb-btn-primary me-1" onClick={() => setFilling({ formId: f.id })}>
                    Fill
                  </button>
                ) : null}
                <button className="btn btn-sm fb-btn-outline-primary me-1" onClick={() => setEditingId(f.id)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setViewingSubmissionsId(f.id)}>
                  Submissions
                </button>
                {f.published_schema_json ? (
                  <>
                    <button className="btn btn-sm btn-outline-secondary me-1" title="Bring in old records from an Excel sheet" onClick={() => setImportingId(f.id)}>
                      Import
                    </button>
                    <button className="btn btn-sm btn-outline-secondary me-1" title="Ask people to fill this form daily, weekly or monthly" onClick={() => setSchedulingId(f.id)}>
                      Recurring
                    </button>
                  </>
                ) : null}
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
