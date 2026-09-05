import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createDashboard,
  deleteDashboard,
  duplicateDashboard,
  IDashboard,
  listDashboards,
  setDefaultDashboard,
} from "./DashboardBuilderController";

const DashboardListView: React.FC = () => {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<IDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setDashboards(await listDashboards());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleNew = async () => {
    const name = window.prompt("Dashboard name");
    if (!name) return;
    const created = await createDashboard({ name });
    if (created) navigate(`/dashboard-builder/${created.id}`);
  };

  const handleDuplicate = async (id: number) => {
    const created = await duplicateDashboard(id);
    if (created) refresh();
  };

  const handleSetDefault = async (id: number) => {
    const ok = await setDefaultDashboard(id);
    if (ok) refresh();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this dashboard? This cannot be undone.")) return;
    const ok = await deleteDashboard(id);
    if (ok) refresh();
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h4 className="mb-0">Dashboards</h4>
        <button className="btn btn-sm" style={{ background: "#f58634", color: "#fff" }} onClick={handleNew}>
          + New Dashboard
        </button>
      </div>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : dashboards.length === 0 ? (
        <div className="text-muted">No dashboards yet — click "+ New Dashboard" to create your first one.</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {dashboards.map((d) => (
            <div
              key={d.id}
              style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, cursor: "pointer" }}
              onClick={() => navigate(`/dashboard-builder/${d.id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>
                  {!!d.is_default && "★ "}
                  {d.name}
                  {d.description && <div style={{ fontWeight: 400, fontSize: 12, color: "#888" }}>{d.description}</div>}
                </div>
                <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!d.is_default && (
                    <button className="btn btn-sm btn-link p-0" onClick={() => handleSetDefault(d.id)}>
                      Set Default
                    </button>
                  )}
                  <button className="btn btn-sm btn-link p-0" onClick={() => handleDuplicate(d.id)}>
                    Duplicate
                  </button>
                  <button className="btn btn-sm btn-link p-0 text-danger" onClick={() => handleDelete(d.id)} disabled={dashboards.length <= 1}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardListView;
