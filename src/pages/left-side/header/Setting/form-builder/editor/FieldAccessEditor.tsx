import React, { useEffect, useState } from "react";
import { getFormPermissionOptions, IFormBuilderField, IPermissionOptions } from "../FormBuilderController";

type Person = IPermissionOptions["users"][number];
type Access = NonNullable<IFormBuilderField["user_access"]>;

// The company's people don't change while the editor is open: ask once.
let peopleCache: Person[] | null = null;
let peopleRequest: Promise<Person[]> | null = null;
const loadPeople = (): Promise<Person[]> => {
  if (peopleCache) return Promise.resolve(peopleCache);
  if (!peopleRequest) {
    peopleRequest = getFormPermissionOptions()
      .then((res: any) => {
        peopleCache = res?.ack === 1 ? res.data?.users || [] : [];
        return peopleCache as Person[];
      })
      .finally(() => {
        peopleRequest = null;
      });
  }
  return peopleRequest;
};

interface Props {
  field: IFormBuilderField;
  fid: string;
  // User / customer-lookup fields are only ever for staff - no public toggle.
  staffOnlyType: boolean;
  // Headings and notes can't be limited per person.
  layoutOnly: boolean;
  onPatch: (patch: Partial<IFormBuilderField>) => void;
}

// "Who can see / edit this field": a See and an Edit tick per team member,
// plus the "Show on the public link" switch. Saved as field.user_access
// (people who are not ticked don't get the field); an empty list means no
// per-person limits. The form owner and holders of the form's "See restricted
// fields" permission always see everything.
const FieldAccessEditor: React.FC<Props> = ({ field, fid, staffOnlyType, layoutOnly, onPatch }) => {
  const [people, setPeople] = useState<Person[]>(peopleCache || []);
  const [loading, setLoading] = useState(!peopleCache);

  useEffect(() => {
    if (layoutOnly || peopleCache) return;
    let cancelled = false;
    loadPeople().then((list) => {
      if (cancelled) return;
      setPeople(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [layoutOnly]);

  const access: Access = Array.isArray(field.user_access) ? field.user_access : [];
  const entryOf = (userId: number) => access.find((e) => e.user_id === userId);

  // Writing a list also retires the older restriction dropdown value: the list wins on the server anyway.
  const save = (next: Access) => onPatch({ user_access: next, ...(field.restriction && field.restriction !== "none" ? { restriction: "none" as const } : {}) });

  const setPerson = (userId: number, patch: { see?: boolean; edit?: boolean }) => {
    const current = entryOf(userId) || { user_id: userId, see: false, edit: false };
    let see = patch.see ?? current.see;
    let edit = patch.edit ?? current.edit;
    if (patch.edit === true) see = true; // editing needs seeing
    if (see === false) edit = false;
    const rest = access.filter((e) => e.user_id !== userId);
    save(see ? [...rest, { user_id: userId, see, edit }] : rest);
  };

  const setAll = (kind: "see" | "edit", on: boolean) => {
    if (!on) {
      save(kind === "see" ? [] : access.map((e) => ({ ...e, edit: false })));
      return;
    }
    save(
      people.map((p) => {
        const current = entryOf(p.a_application_login_id);
        return kind === "see"
          ? { user_id: p.a_application_login_id, see: true, edit: current?.edit === true }
          : { user_id: p.a_application_login_id, see: true, edit: true };
      }),
    );
  };

  const allSee = people.length > 0 && people.every((p) => entryOf(p.a_application_login_id)?.see);
  const allEdit = people.length > 0 && people.every((p) => entryOf(p.a_application_login_id)?.edit);
  const oldRestriction = field.restriction && field.restriction !== "none" && access.length === 0;

  return (
    <>
      {!staffOnlyType ? (
        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            id={`${fid}-on-public`}
            checked={field.visible_to !== "internal"}
            onChange={(e) => onPatch({ visible_to: e.target.checked ? "both" : "internal" })}
          />
          <label className="form-check-label" htmlFor={`${fid}-on-public`}>
            Show on the public link
          </label>
          <small className="text-muted d-block">Untick to keep this field staff only — a visitor to the public link never gets it.</small>
        </div>
      ) : (
        <small className="text-muted d-block mb-2">This field is only ever shown to staff, never on a public link.</small>
      )}

      {!layoutOnly ? (
        <div className="form-group">
          <label className="pb-2 form_label d-block">Who can see / edit this field</label>
          {oldRestriction ? (
            <div className="alert alert-warning py-1 px-2 small mb-2">
              This field has an older restriction ({field.restriction === "readonly" ? "read-only" : field.restriction === "mask" ? "shown as ••••" : "hidden"}) for
              people without the “See restricted fields” permission. Ticking people below replaces it.
            </div>
          ) : null}
          {loading ? (
            <small className="text-muted d-block">Loading people…</small>
          ) : people.length === 0 ? (
            <small className="text-muted d-block">No team members found.</small>
          ) : (
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #dee2e6", borderRadius: 6 }}>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th className="text-center" style={{ width: 70 }}>
                      <label className="mb-0 d-block">
                        <input type="checkbox" checked={allSee} onChange={(e) => setAll("see", e.target.checked)} /> See
                      </label>
                    </th>
                    <th className="text-center" style={{ width: 70 }}>
                      <label className="mb-0 d-block">
                        <input type="checkbox" checked={allEdit} onChange={(e) => setAll("edit", e.target.checked)} /> Edit
                      </label>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => {
                    const entry = entryOf(p.a_application_login_id);
                    return (
                      <tr key={p.a_application_login_id}>
                        <td className="text-truncate" style={{ maxWidth: 140 }} title={p.name}>
                          {p.name}
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            aria-label={`${p.name} can see`}
                            checked={!!entry?.see}
                            onChange={(e) => setPerson(p.a_application_login_id, { see: e.target.checked })}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            aria-label={`${p.name} can edit`}
                            checked={!!entry?.edit}
                            onChange={(e) => setPerson(p.a_application_login_id, { edit: e.target.checked })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <small className="text-muted d-block mt-1">
            {access.length === 0
              ? "No one ticked: there are no per-person limits. Tick people to limit the field to them; anyone not ticked won't see it."
              : "Anyone not ticked won't see this field. The form owner and people with “See restricted fields” always see everything."}
          </small>
        </div>
      ) : null}
    </>
  );
};

export default FieldAccessEditor;
