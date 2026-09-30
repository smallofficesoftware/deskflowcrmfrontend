import React, { useEffect, useState } from "react";
import { getFormPermissionOptions, IFormBuilderField, IPermissionOptions } from "../FormBuilderController";
import { IApprovalStage, IFormSettings, MAX_STAGES, newStageId } from "../approval";

interface Props {
  settings: IFormSettings;
  fields: IFormBuilderField[];
  onChange: (settings: IFormSettings) => void;
}

// "Approval stages" (plan item I): the form passes through ordered stages —
// Counsellor → Division Head → Quotation Issuer → Checked By — each filled and
// signed by its own people. Stage 1 is whoever fills the form; every later
// stage says who works on it, and which signature it needs.
const ApprovalStagesPanel: React.FC<Props> = ({ settings, fields, onChange }) => {
  const enabled = !!settings.approval?.enabled;
  const stages: IApprovalStage[] = settings.approval?.stages || [];
  const [options, setOptions] = useState<IPermissionOptions>({ users: [], teams: [] });

  useEffect(() => {
    if (!enabled) return;
    getFormPermissionOptions().then((res) => {
      if (res?.ack === 1) setOptions({ users: res.data?.users || [], teams: res.data?.teams || [] });
    });
  }, [enabled]);

  const setStages = (next: IApprovalStage[]) => onChange({ ...settings, approval: { enabled, stages: next } });
  const patchStage = (i: number, patch: Partial<IApprovalStage>) => setStages(stages.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= stages.length) return;
    const next = [...stages];
    [next[i], next[t]] = [next[t], next[i]];
    setStages(next);
  };

  const turnOn = () =>
    onChange({
      ...settings,
      approval: {
        enabled: true,
        stages: stages.length >= 2 ? stages : [{ id: "s1", name: "Filled by" }, { id: "s2", name: "Approver", users: [], teams: [] }],
      },
    });

  const signatureFields = fields.filter((f) => f.type === "signature");

  return (
    <div>
      <div className="form-check mb-2">
        <input
          id="fb-approval-on"
          type="checkbox"
          className="form-check-input"
          checked={enabled}
          onChange={(e) => (e.target.checked ? turnOn() : onChange({ ...settings, approval: { enabled: false, stages } }))}
        />
        <label className="form-check-label" htmlFor="fb-approval-on">
          This form needs approval
        </label>
      </div>
      <small className="text-muted d-block mb-2">
        Each entry passes through the stages in order. Every stage fills its own fields, signs, and approves — or sends the entry back with a comment.
      </small>

      {enabled
        ? stages.map((s, i) => {
            const stageSignatures = signatureFields.filter((f) => (f.stage && stages.some((x) => x.id === f.stage) ? f.stage : stages[0].id) === s.id);
            return (
              <div key={s.id} className="p-2 mb-2 rounded" style={{ background: "#F7F7F7", border: "1px solid #E5E5E5" }}>
                <div className="d-flex align-items-center mb-1" style={{ gap: 4 }}>
                  <strong style={{ minWidth: 60 }}>Stage {i + 1}</strong>
                  <input
                    className={`form-control form-control-sm${s.name.trim() ? "" : " is-invalid"}`}
                    value={s.name}
                    maxLength={100}
                    placeholder="e.g. Division Head"
                    aria-label={`Name of stage ${i + 1}`}
                    onChange={(e) => patchStage(i, { name: e.target.value })}
                  />
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    <i className="pi pi-arrow-up" />
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i === stages.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                    <i className="pi pi-arrow-down" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={stages.length <= 2}
                    title={stages.length <= 2 ? "An approval form needs at least two stages" : "Remove this stage"}
                    onClick={() => setStages(stages.filter((_, j) => j !== i))}
                    aria-label="Remove stage"
                  >
                    <i className="pi pi-trash" />
                  </button>
                </div>

                {i === 0 ? (
                  <small className="text-muted d-block">Whoever fills the form. If a later stage sends the entry back, it returns to the person who created it.</small>
                ) : (
                  <>
                    <label className="pb-1 form_label d-block small">Who works on this stage</label>
                    <div className="d-flex flex-wrap mb-1" style={{ gap: 4 }}>
                      {[...(s.teams || []).map((id) => ({ kind: "team" as const, id })), ...(s.users || []).map((id) => ({ kind: "user" as const, id }))].map((who) => {
                        const label =
                          who.kind === "team" ? options.teams.find((t) => t.team_id === who.id)?.name : options.users.find((u) => u.a_application_login_id === who.id)?.name;
                        return (
                          <span key={`${who.kind}${who.id}`} className="badge bg-light text-dark border d-inline-flex align-items-center" style={{ gap: 6, fontWeight: 500 }}>
                            <i className={who.kind === "team" ? "pi pi-users" : "pi pi-user"} style={{ fontSize: 11 }} />
                            {label || `#${who.id}`}
                            <button
                              type="button"
                              className="btn btn-sm p-0 border-0"
                              aria-label={`Remove ${label || who.id}`}
                              onClick={() =>
                                patchStage(i, who.kind === "team" ? { teams: (s.teams || []).filter((t) => t !== who.id) } : { users: (s.users || []).filter((u) => u !== who.id) })
                              }
                            >
                              <i className="pi pi-times" style={{ fontSize: 10 }} />
                            </button>
                          </span>
                        );
                      })}
                      {!(s.users || []).length && !(s.teams || []).length ? <small className="text-danger">Choose at least one person or team.</small> : null}
                    </div>
                    <select
                      className="form-control form-control-sm"
                      value=""
                      aria-label={`Add someone to ${s.name || `stage ${i + 1}`}`}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        if (v.startsWith("t")) patchStage(i, { teams: [...(s.teams || []), Number(v.slice(1))] });
                        else patchStage(i, { users: [...(s.users || []), Number(v.slice(1))] });
                      }}
                    >
                      <option value="">Add a person or team…</option>
                      {options.teams.length ? (
                        <optgroup label="Teams">
                          {options.teams
                            .filter((t) => !(s.teams || []).includes(t.team_id))
                            .map((t) => (
                              <option key={`t${t.team_id}`} value={`t${t.team_id}`}>
                                {t.name}
                              </option>
                            ))}
                        </optgroup>
                      ) : null}
                      <optgroup label="People">
                        {options.users
                          .filter((u) => !(s.users || []).includes(u.a_application_login_id))
                          .map((u) => (
                            <option key={`u${u.a_application_login_id}`} value={`u${u.a_application_login_id}`}>
                              {u.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </>
                )}

                <label className="pb-1 form_label d-block small mt-2">Signature needed to approve</label>
                <select
                  className="form-control form-control-sm"
                  value={s.signature_field || ""}
                  onChange={(e) => patchStage(i, { signature_field: e.target.value || null })}
                  aria-label={`Signature for stage ${i + 1}`}
                >
                  <option value="">No signature needed</option>
                  {stageSignatures.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {!stageSignatures.length ? (
                  <small className="text-muted d-block">Add a Signature field and set “Filled at stage” to this stage to require it.</small>
                ) : null}
              </div>
            );
          })
        : null}

      {enabled && stages.length < MAX_STAGES ? (
        <button
          type="button"
          className="btn btn-sm fb-btn-outline-primary"
          onClick={() => setStages([...stages, { id: newStageId(stages), name: `Stage ${stages.length + 1}`, users: [], teams: [] }])}
        >
          <i className="pi pi-plus" /> Add a stage
        </button>
      ) : null}
      {enabled ? <small className="text-muted d-block mt-2">Then pick which stage fills each field: open a field → Where it appears → “Filled at stage”.</small> : null}
    </div>
  );
};

export default ApprovalStagesPanel;
