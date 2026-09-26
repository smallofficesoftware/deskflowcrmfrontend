import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getFormPermissionOptions, IFormPermissionItem, IPermissionOptions, listFormPermissions, saveFormPermissions } from "../FormBuilderController";

interface Props {
  formId: number;
}

// Which permissions are switched on so far (the others exist in the backend
// but have no feature behind them yet — they are added here as each arrives).
const PERMISSIONS: { key: string; title: string; help: string }[] = [
  {
    key: "change_dates",
    title: "Change dates",
    help: "Can change a date field that is set to “Only people allowed to change dates”.",
  },
  {
    key: "override_auto_number",
    title: "Type an auto number by hand",
    help: "Can replace the automatic number with one they type (for example for an old paper form).",
  },
  {
    key: "see_masked_fields",
    title: "See restricted fields and hidden numbers",
    help: "Sees and changes fields marked as restricted (read-only, •••• or hidden for everyone else), and can reveal a stored full Aadhaar number (every reveal is written to the audit log).",
  },
];

const targetKey = (item: { a_application_login_id?: number | null; team_id?: number | null }) =>
  item.a_application_login_id ? `u${item.a_application_login_id}` : `t${item.team_id}`;

// Per-form "Permissions" tab (plan section 3 / 7): for each action, which
// users or teams may do it on THIS form. The company owner always can.
// Each change is saved straight away.
const FormPermissionsPanel: React.FC<Props> = ({ formId }) => {
  const [items, setItems] = useState<IFormPermissionItem[]>([]);
  const [options, setOptions] = useState<IPermissionOptions>({ users: [], teams: [] });
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const [list, opts] = await Promise.all([listFormPermissions(formId), getFormPermissionOptions()]);
    if (list?.ack === 1) setItems(list.data?.items || []);
    if (opts?.ack === 1) setOptions({ users: opts.data?.users || [], teams: opts.data?.teams || [] });
    setLoading(false);
  }, [formId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const change = async (key: string, grants: any[], removals: any[], done: string) => {
    setBusyKey(key);
    const res = await saveFormPermissions(formId, grants, removals);
    setBusyKey(null);
    if (res?.ack === 1) {
      setItems(res.data?.items || []);
      toast.success(done);
    }
  };

  const add = (permissionKey: string) => {
    const value = picked[permissionKey];
    if (!value) return;
    const grant = value.startsWith("u")
      ? { permission_key: permissionKey, a_application_login_id: Number(value.slice(1)) }
      : { permission_key: permissionKey, team_id: Number(value.slice(1)) };
    setPicked((prev) => ({ ...prev, [permissionKey]: "" }));
    change(permissionKey, [grant], [], "Permission added");
  };

  if (loading) return <small className="text-muted">Loading permissions…</small>;

  return (
    <div>
      <p className="text-muted mb-3" style={{ fontSize: 13 }}>
        Choose who can do these things on this form. The company owner can always do all of them.
      </p>
      {PERMISSIONS.map((perm) => {
        const granted = items.filter((i) => i.permission_key === perm.key);
        const takenKeys = new Set(granted.map(targetKey));
        return (
          <div key={perm.key} className="mb-3 pb-3" style={{ borderBottom: "1px solid #EEE" }}>
            <strong className="d-block">{perm.title}</strong>
            <small className="text-muted d-block mb-2">{perm.help}</small>

            <div className="d-flex flex-wrap mb-2" style={{ gap: 6 }}>
              {granted.length === 0 ? <small className="text-muted">Only the company owner</small> : null}
              {granted.map((g) => (
                <span key={targetKey(g)} className="badge bg-light text-dark border d-inline-flex align-items-center" style={{ gap: 6, fontWeight: 500 }}>
                  <i className={g.team_id ? "pi pi-users" : "pi pi-user"} style={{ fontSize: 11 }} />
                  {g.name}
                  <button
                    type="button"
                    className="btn btn-sm p-0 border-0"
                    aria-label={`Remove ${g.name}`}
                    disabled={busyKey === perm.key}
                    onClick={() =>
                      change(
                        perm.key,
                        [],
                        [g.team_id ? { permission_key: perm.key, team_id: g.team_id } : { permission_key: perm.key, a_application_login_id: g.a_application_login_id }],
                        "Permission removed",
                      )
                    }
                  >
                    <i className="pi pi-times" style={{ fontSize: 10 }} />
                  </button>
                </span>
              ))}
            </div>

            <div className="d-flex" style={{ gap: 6 }}>
              <select
                className="form-control"
                value={picked[perm.key] || ""}
                onChange={(e) => setPicked((prev) => ({ ...prev, [perm.key]: e.target.value }))}
                aria-label={`Add someone who can ${perm.title.toLowerCase()}`}
              >
                <option value="">Add a person or team…</option>
                {options.teams.length ? (
                  <optgroup label="Teams">
                    {options.teams
                      .filter((t) => !takenKeys.has(`t${t.team_id}`))
                      .map((t) => (
                        <option key={`t${t.team_id}`} value={`t${t.team_id}`}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                ) : null}
                <optgroup label="People">
                  {options.users
                    .filter((u) => !takenKeys.has(`u${u.a_application_login_id}`))
                    .map((u) => (
                      <option key={`u${u.a_application_login_id}`} value={`u${u.a_application_login_id}`}>
                        {u.name}
                      </option>
                    ))}
                </optgroup>
              </select>
              <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={!picked[perm.key] || busyKey === perm.key} onClick={() => add(perm.key)}>
                Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormPermissionsPanel;
