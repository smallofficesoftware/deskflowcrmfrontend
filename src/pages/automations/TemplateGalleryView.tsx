import { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { createFromTemplate, ITemplateRow, listTemplates } from "./automationApi";

// Ready-made automations. "Use this" creates a normal DRAFT (switched off) and
// opens it in the builder so the user can fill in people / fields and turn it on.
const TemplateGalleryView = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ITemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await listTemplates();
        if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) setTemplates(res.data.item);
      } catch (e: any) {
        toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ITemplateRow[]>();
    templates.forEach((t) => {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    });
    return [...map.entries()];
  }, [templates]);

  const use = async (t: ITemplateRow) => {
    setBusyKey(t.key);
    try {
      const res = await createFromTemplate(t.key);
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS && res.data.item) {
        toast.success("Created - finish the settings and turn it on");
        navigate(`/Automations/flows/${res.data.item.id}`);
      } else {
        toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" /> Loading…
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h4 className="mb-1">Templates</h4>
      <p className="text-muted small mb-4">Start from a ready-made automation and change it to fit. Nothing runs until you turn it on.</p>
      {grouped.map(([group, list]) => (
        <div key={group} className="mb-4">
          <div className="text-muted text-uppercase mb-2" style={{ fontSize: 11, fontWeight: 700 }}>
            {group}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {list.map((t) => (
              <div key={t.key} className="bg-white border rounded p-3 d-flex flex-column" style={{ minHeight: 150 }}>
                <div style={{ fontWeight: 700 }}>{t.name}</div>
                <div className="text-muted small flex-grow-1 mt-1">{t.description}</div>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted small">{t.step_count} step{t.step_count === 1 ? "" : "s"}</span>
                  <Button size="sm" disabled={busyKey === t.key} onClick={() => use(t)}>
                    {busyKey === t.key ? <Spinner size="sm" animation="border" /> : "Use this"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateGalleryView;
