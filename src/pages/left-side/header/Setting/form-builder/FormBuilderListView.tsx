import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { Button } from "primereact/button";
import { Modal } from "react-bootstrap";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import BetaFeatureNotice from "../../../../../components/BetaFeatureNotice";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { listForms, createForm, deleteForm, duplicateForm, publicFormUrl, IFormBuilderForm } from "./FormBuilderController";
import FormBuilderEditorView from "./FormBuilderEditorView";
import FormSubmissionsListView from "./FormSubmissionsListView";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";
import RowActionPopup, { IRowAction } from "./RowActionPopup";
import InternalFormFillView from "../../../../forms-internal-fill/InternalFormFillView";
import ImportEntriesView from "./import/ImportEntriesView";
import FormSchedulesView from "./schedules/FormSchedulesView";
import DueFormsPanel from "./schedules/DueFormsPanel";

// Reached via reportsMenuData.tsx's "Custom Forms" tile (Forms category,
// same tier as CRM/HRMS/Production) -> BottomView.tsx's forms_home branch.
// Create/edit stay a plain in-page component swap here, no modal, matching
// how this same component already behaved before this list was wired to
// go through the tile grid instead of a dedicated route.
interface Props {
  // Set by SideView.tsx when landing here via a per-form sidebar row
  // (reportsMenuData.tsx's "form_submissions_<id>" entries) - jumps
  // straight to that form's Submissions grid, no picker step.
  deepLinkFormId?: number | null;
  // Set when landing on /SideView/report/form_edit_<id> - opens that form
  // straight in the editor (each form's Edit has its own URL).
  editDeepLinkId?: number | null;
}

const FormBuilderListView: React.FC<Props> = ({ deepLinkFormId, editDeepLinkId }) => {
  // Also supports /SideView?view=forms&submissions_form_id=<id> (Submit
  // Form menu items and similar navigate here directly with a query param).
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryDeepLinkFormId = searchParams.get("submissions_form_id");
  const initialSubmissionsId = deepLinkFormId ?? (queryDeepLinkFormId ? Number(queryDeepLinkFormId) : null);

  const [forms, setForms] = useState<IFormBuilderForm[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(editDeepLinkId ?? null);
  // The URL drives the editor: landing on / leaving form_edit_<id> opens / closes it.
  useEffect(() => {
    setEditingId(editDeepLinkId ?? null);
  }, [editDeepLinkId]);
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<number | null>(initialSubmissionsId);
  // Fill a form now (optionally the due day of a recurring schedule), import from Excel, recurring setup (plan Q).
  const [filling, setFilling] = useState<{ formId: number; scheduleEntryId?: number } | null>(null);
  // Grid (Contact Book style): searchText is what is typed, search what is applied (Enter / search button).
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const applySearch = () => {
    setSearch(searchText.trim());
    setFirst(0);
  };
  const [first, setFirst] = useState(0);
  const [pageRows, setPageRows] = useState(25);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [dueRefresh, setDueRefresh] = useState(0);

  // Switching between "Custom Forms" and a per-form sidebar row while
  // already on this screen (activeView stays "forms_home" either way, so
  // BottomView keeps this same component instance mounted) only changes
  // this prop - sync both directions: a form id opens its grid, null goes
  // back to the list. Without the null case, clicking "Custom Forms" after
  // a per-form row left the previous form's grid stuck on screen.
  useEffect(() => {
    setViewingSubmissionsId(deepLinkFormId ?? null);
  }, [deepLinkFormId]);

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
      setShowCreate(false);
      setNewTitle("");
      await reload();
      setEditingId(res.data.item.id);
      navigate(`/SideView/report/form_edit_${res.data.item.id}`);
    }
  };

  // Body cells centered under the (centered) headers, and vertically in the row.
  const cellCenter: React.CSSProperties = { textAlign: "center", verticalAlign: "middle" };

  const copyLink = (f: IFormBuilderForm) => {
    const url = publicFormUrl(f);
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy — copy it from the address shown"),
    );
  };

  // What the row's cog popup offers; published-only ones are hidden on a draft.
  const formActions = (f: IFormBuilderForm): IRowAction[] => {
    const published = !!f.published_schema_json;
    return [
      { label: "Fill", hidden: !published, onClick: () => setFilling({ formId: f.id }) },
      {
        label: "Edit",
        onClick: () => {
          setEditingId(f.id);
          navigate(`/SideView/report/form_edit_${f.id}`);
        },
      },
      { label: "Submissions", hidden: !published, onClick: () => navigate(`/SideView/report/form_submissions_${f.id}`) },
      { label: "Import", hidden: !published, title: "Bring in old records from an Excel sheet", onClick: () => setImportingId(f.id) },
      { label: "Recurring", hidden: !published, title: "Ask people to fill this form daily, weekly or monthly", onClick: () => setSchedulingId(f.id) },
      {
        label: "Duplicate",
        onClick: async () => {
          const res = await duplicateForm(f.id);
          if (res?.ack === 1) {
            toast.success("Duplicated");
            reload();
          }
        },
      },
      {
        label: "Delete",
        danger: true,
        onClick: async () => {
          if (!window.confirm(`Delete "${f.title}"?`)) return;
          const res = await deleteForm(f.id);
          if (res?.ack === 1) {
            toast.success("Deleted");
            reload();
          }
        },
      },
    ];
  };

  const filteredForms = forms.filter((f) => !search.trim() || (f.title || "").toLowerCase().includes(search.trim().toLowerCase()));

  if (editingId != null) {
    return (
      <FormBuilderEditorView
        formId={editingId}
        onClose={() => {
          setEditingId(null);
          reload();
          navigate("/SideView/report/custom_forms");
        }}
      />
    );
  }
  if (filling) {
    const form = forms.find((f) => f.id === filling.formId);
    return (
      <div
        onClick={() => setFilling(null)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2000,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(98vw, 820px)",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          }}
        >
          <FormBuilderBrandStyles />
          <div
            style={{
              background: "linear-gradient(135deg,#f58634 0%,#e0732a 100%)",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>{form?.title || "Fill Form"}</h5>
            <button
              type="button"
              onClick={() => setFilling(null)}
              style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 6, color: "#fff", width: 30, height: 30, fontSize: "1.1rem" }}
            >
              ×
            </button>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <InternalFormFillView
              formId={filling.formId}
              scheduleEntryId={filling.scheduleEntryId}
              onSubmitted={() => {
                // A due day is done once filled — go back to the list, which reloads what is still due.
                setDueRefresh((n) => n + 1);
                if (filling.scheduleEntryId) setFilling(null);
              }}
              key={`${form?.id}-${filling.scheduleEntryId || 0}`}
            />
          </div>
        </div>
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
    return <FormSubmissionsListView formId={viewingSubmissionsId} onClose={() => { setViewingSubmissionsId(null); navigate("/SideView/report/custom_forms"); }} />;
  }

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <BetaFeatureNotice />
      {/* Header like Contact Book: title on the left; search, search button and
          the orange round "+" (create) on the right. */}
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3" style={{ gap: 8 }}>
        <h3 className="mb-0">Custom Forms</h3>
        <div className="d-flex gap-2 align-items-center fb-grid-toolbar" style={{ position: "relative" }}>
          {/* Search and + are the same size, with the same icon size. */}
          <style>{`
            .fb-grid-toolbar .report_button { width: 2.5rem; height: 2.5rem; padding: 0; }
            .fb-grid-toolbar .report_button .p-button-icon { font-size: 1rem; }
          `}</style>
          <input
            type="text"
            className="form-control"
            placeholder="Search Anything in This Report"
            style={{ width: 300, height: "2.5rem", margin: 0 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />
          {search ? (
            <span
              className="clear-icon"
              onClick={() => {
                setSearchText("");
                setSearch("");
                setFirst(0);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
            </span>
          ) : null}
          <Button
            icon="pi pi-search"
            className="report_button"
            style={{ backgroundColor: "#4C4C4C" }}
            rounded
            onClick={applySearch}
            tooltip="Search"
            tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
          />
          <Button
            icon="pi pi-plus"
            className="report_button"
            style={{ backgroundColor: "rgb(245, 134, 52)" }}
            rounded
            onClick={() => setShowCreate(true)}
            tooltip="Create Form"
            tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
          />
        </div>
      </div>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Form</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label className="pb-1 form_label d-block small" htmlFor="fb-new-title">
            Form title
          </label>
          <input
            id="fb-new-title"
            className="form-control"
            placeholder="New form title"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
          <button className="btn btn-sm fb-btn-primary" disabled={!newTitle.trim()} onClick={handleCreate}>
            Create Form
          </button>
        </Modal.Footer>
      </Modal>

      <DueFormsPanel refreshKey={dueRefresh} onFill={(item) => setFilling({ formId: item.form_id, scheduleEntryId: item.id })} />

      {/* Same grid as Contact Book: search toolbar, sortable PrimeReact DataTable,
          paginator, and a row cog popup holding the actions. */}
      <DataTable
        value={filteredForms}
        dataKey="id"
        className="custom-centered-table"
        paginator
        first={first}
        rows={pageRows}
        onPage={(e) => {
          setFirst(e.first);
          setPageRows(e.rows);
        }}
        rowsPerPageOptions={[25, 50, 100, 200]}
        sortMode="single"
        removableSort
        emptyMessage={search.trim() ? "No forms match your search" : "No forms yet"}
      >
        <Column header="Action" style={{ width: "5rem" }} bodyStyle={cellCenter} body={(f: IFormBuilderForm) => <RowActionPopup actions={formActions(f)} />} />
        <Column field="title" header="Title" sortable bodyStyle={cellCenter} />
        <Column
          header="Status"
          sortable
          sortField="published_schema_json"
          bodyStyle={cellCenter}
          body={(f: IFormBuilderForm) => (
            <>
              {f.published_schema_json ? <span className="badge bg-success">Published</span> : <span className="badge bg-secondary">Draft</span>}
              {f.has_unpublished_changes ? <span className="badge bg-warning ms-1">Unpublished changes</span> : null}
            </>
          )}
        />
        <Column
          header="Public Link"
          bodyStyle={cellCenter}
          body={(f: IFormBuilderForm) =>
            f.allow_public_submission && publicFormUrl(f) ? (
              <button type="button" className="btn btn-sm fb-btn-outline-primary" title={publicFormUrl(f) || ""} onClick={() => copyLink(f)}>
                Copy Link
              </button>
            ) : (
              <span className="text-muted">Off</span>
            )
          }
        />
      </DataTable>
    </div>
  );
};

export default FormBuilderListView;
