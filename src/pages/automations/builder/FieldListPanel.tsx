import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { getRecordFields, IRecordFieldGroup } from "../automationApi";

interface IProps {
  triggerType: string;
  triggerConfig: Record<string, any>;
}

const RECORD_TYPES = ["contact", "inquiry", "task", "cart"];

// Record the flow runs on: the trigger's own prefix ("contact.created" ->
// contact), else the trigger's "record_type" setting (manual / schedule / webhook).
const recordTypeOf = (triggerType: string, triggerConfig: Record<string, any>) => {
  const prefix = (triggerType || "").split(".")[0];
  if (RECORD_TYPES.includes(prefix)) return prefix;
  const configured = String(triggerConfig?.record_type || "");
  return RECORD_TYPES.includes(configured) ? configured : "";
};

const cache = new Map<string, IRecordFieldGroup[]>();

// "Fields available from the trigger" - the {{ variables }} a step can use, so
// the user knows what the record (e.g. a new contact) will send. Click a field
// to copy its {{ variable }}.
const FieldListPanel = ({ triggerType, triggerConfig }: IProps) => {
  const recordType = recordTypeOf(triggerType, triggerConfig);
  const [groups, setGroups] = useState<IRecordFieldGroup[]>(cache.get(recordType) || []);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!recordType) {
      setGroups([]);
      return;
    }
    if (cache.has(recordType)) {
      setGroups(cache.get(recordType)!);
      return;
    }
    let cancelled = false;
    getRecordFields(recordType)
      .then((res) => {
        if (cancelled || res.ack !== DEFAULT_STATUS_CODE_SUCCESS) return;
        cache.set(recordType, res.data.item.groups);
        setGroups(res.data.item.groups);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [recordType]);

  if (!recordType || groups.length === 0) return null;

  const copy = async (path: string) => {
    const text = `{{${path}}}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${text}`);
    } catch {
      toast.info(text);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = groups
    .map((g) => ({ ...g, fields: g.fields.filter((f) => !term || f.label.toLowerCase().includes(term) || f.path.toLowerCase().includes(term)) }))
    .filter((g) => g.fields.length > 0);

  return (
    <div className="mt-3" style={{ borderTop: "1px solid #dee2e6", paddingTop: 12 }}>
      <div role="button" onClick={() => setOpen(!open)} className="d-flex justify-content-between align-items-center" style={{ cursor: "pointer" }}>
        <span className="small fw-semibold">Fields available from the trigger</span>
        <span className="text-muted small">{open ? "Hide" : "Show"}</span>
      </div>
      {open && (
        <>
          <div className="text-muted" style={{ fontSize: 11 }}>
            Click a field to copy it, then paste it into any text box (for example the webhook body).
          </div>
          <Form.Control size="sm" className="my-2" placeholder="Search fields…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {visible.map((g) => (
              <div key={g.key} className="mb-2">
                <div className="small fw-semibold text-muted">{g.label}</div>
                {g.fields.map((f) => (
                  <div
                    key={f.path}
                    role={f.info ? undefined : "button"}
                    title={f.info ? "A key inside each item of the array" : `Copy {{${f.path}}}`}
                    onClick={f.info ? undefined : () => copy(f.path)}
                    className="d-flex justify-content-between align-items-center px-2 py-1"
                    style={{ cursor: f.info ? "default" : "pointer", borderRadius: 6, fontSize: 12 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>
                      {f.label}
                      {f.custom ? <span className="text-muted"> (custom)</span> : null}
                    </span>
                    <code style={{ fontSize: 11 }}>{f.info ? f.path : `{{${f.path}}}`}</code>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FieldListPanel;
