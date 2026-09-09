import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import {
  getForm,
  listSubmissions,
  deleteSubmission,
  updateSubmissionStatus,
  linkDuplicateContact,
  dismissDuplicateContact,
  exportSubmissionPdf,
  exportSubmissionsBulkPdf,
  exportSubmissionsExcel,
  getSubmissionAuditLog,
  IFormBuilderField,
} from "./FormBuilderController";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";

const FORM_SUBMISSIONS_ORDER_TYPE = 13; // stageAndStatusMasterTableReference["form_builder_submissions"] (backend statusLogServices.js)

interface StatusOption {
  id: number;
  name: string;
  color: string;
}

interface Props {
  formId: number;
  onClose?: () => void;
}

// Staff-facing submissions list for one form — reachable both from the
// builder (FormBuilderListView's "Submissions" button) and from
// SideView.tsx's ?view=forms Published Forms browsing list (plan §7).
const FormSubmissionsListView: React.FC<Props> = ({ formId, onClose }) => {
  const [title, setTitle] = useState("");
  const [filterableFields, setFilterableFields] = useState<IFormBuilderField[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [auditFor, setAuditFor] = useState<number | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);

  const loadStatusOptions = async () => {
    try {
      const { data } = await axiosInstance.post("get-status", {
        status_type: FORM_SUBMISSIONS_ORDER_TYPE,
        a_application_login_id: Number(localStorage.getItem("UUID")),
      });
      setStatusOptions(data?.data?.item || data?.data || []);
    } catch {
      setStatusOptions([]);
    }
  };

  const changeStatus = async (submissionId: number, statusId: number) => {
    const res = await updateSubmissionStatus(formId, submissionId, statusId);
    if (res?.ack === 1) reload();
  };

  const reload = async () => {
    const filters = Object.fromEntries(Object.entries(fieldFilters).filter(([, v]) => v !== ""));
    const res = await listSubmissions(formId, {
      search: search || undefined,
      filters: Object.keys(filters).length ? filters : undefined,
    });
    setRows(res?.data?.item || []);
  };

  useEffect(() => {
    (async () => {
      const formRes = await getForm(formId);
      if (formRes?.data?.item) {
        setTitle(formRes.data.item.title);
        try {
          const fields = JSON.parse(formRes.data.item.published_schema_json || "[]") as IFormBuilderField[];
          setFilterableFields(fields.filter((f) => f.filterable));
        } catch {
          setFilterableFields([]);
        }
      }
      reload();
      loadStatusOptions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const openLink = (url?: string) => {
    if (url) window.open(url, "_blank");
  };

  const openAudit = async (id: number) => {
    setAuditFor(id);
    const res = await getSubmissionAuditLog(formId, id);
    setAuditRows(res?.data?.item || []);
  };

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{title} — Submissions</h4>
        <div>
          {onClose ? (
            <button className="btn btn-link" onClick={onClose}>
              Back
            </button>
          ) : null}
          <button
            className="btn btn-outline-secondary me-2"
            onClick={async () => {
              const res = await exportSubmissionsExcel(formId);
              openLink(res?.data?.fileUrl);
            }}
          >
            Export Excel
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={async () => {
              const res = await exportSubmissionsBulkPdf(formId);
              openLink(res?.data?.fileUrl);
            }}
          >
            Export Bulk PDF
          </button>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12 col-md-4">
          <input
            className="form-control"
            placeholder="Search submissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reload()}
          />
        </div>
        <div className="col-12 col-md-2">
          <button className="btn fb-btn-outline-primary w-100" onClick={reload}>
            Search
          </button>
        </div>
      </div>
      {filterableFields.length > 0 ? (
        <div className="row mb-3">
          {filterableFields.map((f) => (
            <div className="col-12 col-md-3" key={f.key}>
              <label className="pb-1 form_label d-block small">{f.label}</label>
              <input
                className="form-control form-control-sm"
                value={fieldFilters[f.key] || ""}
                onChange={(e) => setFieldFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && reload()}
              />
            </div>
          ))}
          <div className="col-12 col-md-2 d-flex align-items-end">
            <button className="btn btn-sm fb-btn-outline-primary w-100 mb-1" onClick={reload}>
              Apply Filters
            </button>
          </div>
        </div>
      ) : null}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Submitted</th>
            <th>By</th>
            <th>Status</th>
            <th>Possible Match</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{new Date(row.created_date_time).toLocaleString()}</td>
              <td>{row.submitted_by_type === "public" ? row.submitter_name || "Public" : "Internal"}</td>
              <td>
                <select
                  className="form-control form-control-sm"
                  style={row._status?.color ? { borderLeft: `4px solid ${row._status.color}` } : undefined}
                  value={row.submission_status_id || ""}
                  onChange={(e) => e.target.value && changeStatus(row.id, Number(e.target.value))}
                >
                  <option value="">— No status —</option>
                  {statusOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {row.possible_duplicate_contact_id ? (
                  <>
                    <span className="badge bg-warning me-1">Possible match</span>
                    <button
                      className="btn btn-sm btn-outline-success me-1"
                      onClick={async () => {
                        await linkDuplicateContact(formId, row.id);
                        reload();
                      }}
                    >
                      Link
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={async () => {
                        await dismissDuplicateContact(formId, row.id);
                        reload();
                      }}
                    >
                      Dismiss
                    </button>
                  </>
                ) : null}
              </td>
              <td>
                <button
                  className="btn btn-sm fb-btn-outline-primary me-1"
                  onClick={async () => {
                    const res = await exportSubmissionPdf(formId, row.id);
                    openLink(res?.data?.fileUrl);
                  }}
                >
                  PDF
                </button>
                <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openAudit(row.id)}>
                  History
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={async () => {
                    if (!window.confirm("Delete this submission?")) return;
                    const res = await deleteSubmission(formId, row.id);
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

      {auditFor != null ? (
        <div className="card p-3 mt-3">
          <div className="d-flex justify-content-between">
            <h6>Submission #{auditFor} history</h6>
            <button className="btn btn-sm btn-link" onClick={() => setAuditFor(null)}>
              Close
            </button>
          </div>
          {auditRows.length === 0 ? (
            <div className="text-muted">No history yet</div>
          ) : (
            <ul className="list-unstyled">
              {auditRows.map((r) => (
                <li key={r.id} className="mb-2">
                  <strong>{r.action}</strong> — {new Date(r.created_date_time).toLocaleString()}
                  {r.details ? <div className="small text-muted">{JSON.stringify(r.details)}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FormSubmissionsListView;
