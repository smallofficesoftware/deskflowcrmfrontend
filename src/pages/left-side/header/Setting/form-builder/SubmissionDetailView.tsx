import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";
import FormFieldsRenderer from "./FormFieldsRenderer";
import { evaluateVisibility } from "./conditions";
import { entryNumberOf } from "./listCells";
import { STATUS_LABELS } from "./approval";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../../../../helpers/AppConstants";
import { validateFormatPresets } from "./formatPresets";
import { getForm, getReferenceOptions, getSubmission, IFormBuilderField, IRestricted, stageAction, updateSubmission } from "./FormBuilderController";

interface Props {
  formId: number;
  submissionId: number;
  onClose: () => void;
  onSaved?: () => void;
}

// Upload fields can't be changed from this screen (the server ignores files
// on edit), so they are left out of the editable form.
const UPLOAD_TYPES = new Set(["file", "signature", "image"]);
// Types with no answer to fill in here (the server assigns the number).
const SKIP_TYPES = new Set(["auto-number"]);

const pad2 = (n: number) => String(n).padStart(2, "0");

function toDateInput(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDateTimeInput(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${toDateInput(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function scalarAnswer(field: IFormBuilderField, raw: any): any {
  if (raw === undefined || raw === null) return null;
  switch (field.type) {
    case "time":
      return String(raw).slice(0, 5);
    case "date":
      return toDateInput(raw);
    case "datetime":
      return toDateTimeInput(raw);
    case "multi-select":
      if (Array.isArray(raw)) return raw;
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    case "checkbox":
    case "switch":
      return raw ? 1 : 0;
    case "question-table":
      try {
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        return {};
      }
    case "user":
    case "customer-lookup":
    case "reference":
      return raw === "" ? null : Number(raw);
    case "number":
    case "rating":
    case "currency":
    case "percentage":
      return raw === "" ? null : Number(raw);
    default:
      return raw;
  }
}

// Saved row (columns as returned by /submissions/get) -> the answers object
// the fill components work with.
function answersFromItem(fields: IFormBuilderField[], item: Record<string, any>): Record<string, any> {
  const answers: Record<string, any> = {};
  fields.forEach((f) => {
    // Calculations are worked out from the other answers, never sent back.
    if (!f.key || f.type === "section-header" || f.type === "instruction" || f.type === "calculation" || UPLOAD_TYPES.has(f.type) || SKIP_TYPES.has(f.type)) return;
    if (f.type === "repeater") {
      const rows: Record<string, any>[] = item._repeaters?.[f.key] || [];
      answers[f.key] = rows.map((r) => {
        const row: Record<string, any> = { id: r.id };
        (f.columns || []).forEach((c) => {
          if (UPLOAD_TYPES.has(c.type)) return;
          row[c.key] = scalarAnswer(c, r[c.key]) ?? "";
        });
        return row;
      });
      return;
    }
    answers[f.key] = scalarAnswer(f, item[f.key]);
  });
  return answers;
}

interface IApprovalInfo {
  enabled: boolean;
  stages?: { id: string; name: string }[];
  my_stage_ids?: string[];
  current_stage?: string | null;
  stage_status?: string | null;
  can_act?: boolean;
  can_send_back?: boolean;
  write_mode?: "open" | "stage" | "locked";
  locked_keys?: string[];
  message?: string | null;
  log?: { id: number; stage_id: string; stage_name: string; action: string; comment?: string | null; by: string; created_date_time: string }[];
}

interface SavedFile {
  id: number;
  field_key: string;
  file_type: string;
  original_file_name: string;
  file_path: string;
  mime_type?: string;
}

// Saved files are served from the backend's media-folder.
const fileUrl = (file: SavedFile) => `${(BACKEND_OF_SMALL_OFFICE_CRM_END_POINT || "").replace(/\/$/, "")}/${file.file_path}`;

// One saved entry: everything that was filled in, who created / last changed
// it, and (for people allowed to fill the form) an Edit mode that saves
// through the normal update API. The server re-checks every rule.
const SubmissionDetailView: React.FC<Props> = ({ formId, submissionId, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<IFormBuilderField[]>([]);
  const [item, setItem] = useState<Record<string, any> | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [canChangeDates, setCanChangeDates] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Attachments (Phase 6b, G5): the form's upload fields, the files saved on this
  // entry, files marked for removal and files picked to add / replace.
  const [uploadFields, setUploadFields] = useState<IFormBuilderField[]>([]);
  const [allFields, setAllFields] = useState<IFormBuilderField[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [restricted, setRestricted] = useState<IRestricted | null>(null);
  // Approval stages (plan I): where the entry is, what this person may do, and its history.
  const [approval, setApproval] = useState<IApprovalInfo | null>(null);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [sendBackComment, setSendBackComment] = useState("");
  const [acting, setActing] = useState(false);
  const [newFiles, setNewFiles] = useState<{ key: string; file: File }[]>([]);
  // Saved customer names for Customer lookup fields (server resolves ids).
  const [labels, setLabels] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [formRes, subRes] = await Promise.all([getForm(formId), getSubmission(formId, submissionId)]);
    if (formRes?.data?.item && subRes?.data?.item) {
      setTitle(formRes.data.item.title);
      let list: IFormBuilderField[] = [];
      try {
        const parsed = JSON.parse(formRes.data.item.published_schema_json || "[]");
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = [];
      }
      setUploadFields(list.filter((f) => UPLOAD_TYPES.has(f.type)));
      setAllFields(list);
      setSavedFiles(subRes.data.item._files || []);
      setRestricted(subRes.data.restricted || null);
      setApproval(subRes.data.approval?.enabled ? subRes.data.approval : null);
      setRemoveIds([]);
      setNewFiles([]);
      const shown = list.filter((f) => !UPLOAD_TYPES.has(f.type) && !SKIP_TYPES.has(f.type));
      setFields(shown);
      setItem(subRes.data.item);
      setLabels(subRes.data.item._reference_labels || {});
      setAnswers(answersFromItem(shown, subRes.data.item));
      setCanChangeDates(!!subRes.data.can_change_dates);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, submissionId]);

  // Upload fields this person may not change right now (another stage's, or restricted).
  const lockedUpload = (key: string) => !!approval?.locked_keys?.includes(key) || !!restricted?.readonly?.includes(key) || !!restricted?.masked?.includes(key);

  const visibleKeys = useMemo(() => evaluateVisibility(fields, answers), [fields, answers]);

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (): Promise<boolean> => {
    if (!item) return false;
    const formatErrors = validateFormatPresets(
      fields.filter((f) => !f.key || visibleKeys.has(f.key)),
      answers,
      { newEntry: false },
    );
    if (Object.keys(formatErrors).length > 0) {
      setErrors(formatErrors);
      toast.error("Please fix the highlighted fields");
      return false;
    }
    setSaving(true);
    const res = await updateSubmission(formId, submissionId, answers, newFiles, {
      expected_last_edited_date_time: item.last_edited_date_time || undefined,
      remove_file_ids: removeIds.length ? removeIds : undefined,
    });
    setSaving(false);
    if (res?.ack === 1) {
      toast.success("Saved");
      setEditing(false);
      setErrors({});
      await load();
      onSaved?.();
      return true;
    }
    return false;
  };

  // Approve / send back at the entry's current stage (server checks who may and what is still missing).
  const runStageAction = async (action: "approve" | "send_back") => {
    setActing(true);
    const res = await stageAction(formId, submissionId, action, action === "send_back" ? sendBackComment : undefined);
    setActing(false);
    if (res?.ack === 1) {
      toast.success(res.ack_msg || "Done");
      setSendBackOpen(false);
      setSendBackComment("");
      await load();
      onSaved?.();
      return true;
    }
    return false;
  };
  const saveAndApprove = async () => {
    if (await handleSave()) await runStageAction("approve");
  };

  const created = item?.created_date_time ? new Date(item.created_date_time).toLocaleString() : "";
  const edited = item?.last_edited_date_time ? new Date(item.last_edited_date_time).toLocaleString() : "";

  return (
    <div className="card mt-3" style={{ borderColor: "#F58634" }}>
      <FormBuilderBrandStyles />
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center mb-2" style={{ gap: 8 }}>
          <h5 className="mb-0 me-auto">
            {title} — Entry {entryNumberOf(allFields, item || { id: submissionId })}
          </h5>
          {!loading && item ? (
            editing ? (
              <>
                <button className="btn fb-btn-primary" disabled={saving || acting} onClick={handleSave}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {approval && approval.can_act ? (
                  <button className="btn btn-outline-success" disabled={saving || acting} onClick={saveAndApprove}>
                    Save and approve
                  </button>
                ) : null}
                <button
                  className="btn btn-outline-secondary"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setErrors({});
                    setAnswers(answersFromItem(fields, item));
                    setRemoveIds([]);
                    setNewFiles([]);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {approval && approval.can_act ? (
                  <>
                    <button className="btn fb-btn-primary" disabled={acting} onClick={() => runStageAction("approve")}>
                      <i className="pi pi-check" /> Approve
                    </button>
                    {approval.can_send_back ? (
                      <button className="btn btn-outline-danger" disabled={acting} onClick={() => setSendBackOpen(!sendBackOpen)}>
                        <i className="pi pi-undo" /> Send back
                      </button>
                    ) : null}
                  </>
                ) : null}
                {!approval || approval.write_mode !== "locked" ? (
                  <button className="btn fb-btn-outline-primary" onClick={() => setEditing(true)}>
                    <i className="pi pi-pencil" /> Edit
                  </button>
                ) : null}
              </>
            )
          ) : null}
          <button className="btn btn-link" onClick={onClose}>
            Close
          </button>
        </div>

        {approval ? (
          <div
            className="p-2 mb-3 rounded"
            style={{
              background: approval.stage_status === "completed" ? "#E8F5E9" : approval.stage_status === "sent_back" ? "#FFF3E0" : "#EEF4FF",
              border: "1px solid #DDD",
            }}
            aria-live="polite"
          >
            <strong>
              {approval.stage_status === "completed"
                ? "Completed — every stage has approved."
                : `${STATUS_LABELS[approval.stage_status || "pending"] || "Waiting"}: ${approval.stages?.find((st) => st.id === approval.current_stage)?.name || ""}`}
            </strong>
            {approval.can_act ? <span className="ms-2">It's your turn.</span> : null}
            {approval.message ? <div className="text-muted small">{approval.message}</div> : null}
            <div className="d-flex flex-wrap mt-1" style={{ gap: 6 }}>
              {approval.stages?.map((st, i) => (
                <span
                  key={st.id}
                  className={`badge ${st.id === approval.current_stage && approval.stage_status !== "completed" ? "bg-primary" : approval.stage_status === "completed" || (approval.stages || []).findIndex((x) => x.id === approval.current_stage) > i ? "bg-success" : "bg-secondary"}`}
                >
                  {i + 1}. {st.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {sendBackOpen ? (
          <div className="p-2 mb-3 rounded" style={{ background: "#FFF8F8", border: "1px solid #F5C6CB" }}>
            <label className="pb-1 form_label d-block" htmlFor="fb-sendback-comment">
              Why are you sending it back? (the person will see this)
            </label>
            <textarea id="fb-sendback-comment" className="form-control" rows={3} maxLength={1000} value={sendBackComment} onChange={(e) => setSendBackComment(e.target.value)} />
            <div className="d-flex mt-2" style={{ gap: 6 }}>
              <button className="btn btn-danger" disabled={acting || !sendBackComment.trim()} onClick={() => runStageAction("send_back")}>
                Send back
              </button>
              <button className="btn btn-outline-secondary" disabled={acting} onClick={() => setSendBackOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {loading ? <p className="text-muted">Loading…</p> : null}
        {!loading && !item ? <p className="text-danger">This entry could not be opened.</p> : null}

        {item ? (
          <>
            <div className="text-muted mb-3" style={{ fontSize: 13 }}>
              Created {created}
              {item._created_by_name ? ` by ${item._created_by_name}` : ""}
              {edited ? ` · Last changed ${edited}${item._last_edited_by_name ? ` by ${item._last_edited_by_name}` : ""}` : ""}
              {item.related_module && item.related_record_id ? ` · Linked to ${item.related_module} #${item.related_record_id}` : ""}
            </div>
            <FormFieldsRenderer
              fields={fields}
              answers={answers}
              errors={errors}
              disabled={!editing}
              formId={formId}
              initialLabels={labels}
              canChangeDates={canChangeDates}
              restricted={restricted || approval ? { hidden: restricted?.hidden || [], masked: restricted?.masked || [], readonly: [...(restricted?.readonly || []), ...(approval?.locked_keys || [])] } : null}
              onChange={handleChange}
              onFile={() => undefined}
              onRepeaterFile={() => undefined}
              fetchReferenceOptions={async (master, parentId) => {
                const res = await getReferenceOptions(master, parentId);
                return res?.data?.item || [];
              }}
            />
            {approval && approval.log && approval.log.length > 0 ? (
              <div className="mt-4">
                <h6 className="mb-2">Approval history</h6>
                <ul className="list-unstyled mb-0">
                  {approval.log.map((entry) => (
                    <li key={entry.id} className="mb-2">
                      <strong>{entry.stage_name}</strong> —{" "}
                      {entry.action === "submit"
                        ? "filled in by"
                        : entry.action === "approve"
                          ? "approved by"
                          : entry.action === "send_back"
                            ? "sent back by"
                            : "changed after completion by"}{" "}
                      {entry.by} <span className="text-muted">· {new Date(entry.created_date_time).toLocaleString()}</span>
                      {entry.comment ? <div className="ms-3 text-muted" style={{ fontStyle: "italic" }}>“{entry.comment}”</div> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {uploadFields.length > 0 ? (
              <div className="mt-3">
                <h6 className="mb-2">Attachments</h6>
                {uploadFields.map((f) => {
                  const current = savedFiles.filter((x) => x.field_key === f.key && !removeIds.includes(x.id));
                  const picked = newFiles.filter((x) => x.key === f.key);
                  const multiple = f.type === "file" && !!f.multiple;
                  return (
                    <div key={f.key} className="mb-3">
                      <label className="pb-1 form_label d-block">{f.label}</label>
                      {current.length === 0 && picked.length === 0 ? <small className="text-muted d-block">Nothing attached.</small> : null}
                      {current.map((file) => (
                        <div key={file.id} className="d-flex align-items-center mb-1" style={{ gap: 8 }}>
                          {file.mime_type?.startsWith("image/") ? (
                            <img src={fileUrl(file)} alt={file.original_file_name} style={{ height: 48, maxWidth: 120, objectFit: "contain", border: "1px solid #DDD" }} />
                          ) : (
                            <i className="pi pi-file" />
                          )}
                          <a href={fileUrl(file)} target="_blank" rel="noreferrer" className="text-truncate me-auto">
                            {file.original_file_name}
                          </a>
                          {editing && !lockedUpload(f.key) ? (
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setRemoveIds((prev) => [...prev, file.id])}>
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ))}
                      {picked.map((x, i) => (
                        <div key={i} className="d-flex align-items-center mb-1 text-success" style={{ gap: 8 }}>
                          <i className="pi pi-plus" />
                          <span className="text-truncate me-auto">{x.file.name} (will be added when you save)</span>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setNewFiles((prev) => prev.filter((y) => y !== x))}>
                            Cancel
                          </button>
                        </div>
                      ))}
                      {editing && !lockedUpload(f.key) ? (
                        <input
                          type="file"
                          className="form-control mt-1"
                          accept={f.type === "image" || f.type === "signature" ? "image/*" : undefined}
                          multiple={multiple}
                          value=""
                          onChange={(e) => {
                            const chosen = Array.from(e.target.files || []).map((file) => ({ key: f.key, file }));
                            if (chosen.length === 0) return;
                            // A single-file field keeps only the newest pick; it replaces the saved file on save.
                            setNewFiles((prev) => [...(multiple ? prev : prev.filter((y) => y.key !== f.key)), ...chosen]);
                          }}
                          aria-label={multiple ? `Add files to ${f.label}` : `Replace ${f.label}`}
                        />
                      ) : null}
                      {editing && !lockedUpload(f.key) && !multiple && current.length > 0 ? <small className="text-muted">Picking a new file replaces the saved one.</small> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SubmissionDetailView;
