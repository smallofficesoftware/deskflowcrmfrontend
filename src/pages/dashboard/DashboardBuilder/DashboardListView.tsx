import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  copyFromSystemDashboardDefinition,
  createDashboard,
  deleteDashboard,
  duplicateDashboard,
  IDashboard,
  ISystemDashboardDefinition,
  listDashboards,
  listSystemDashboardDefinitions,
  setDefaultDashboard,
} from "./DashboardBuilderController";

const DashboardListView: React.FC = () => {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<IDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  // System gallery (Phase 5) — admin-managed pre-built dashboards a tenant
  // can copy in one click, same "Browse Gallery" pattern Report Builder's
  // own ReportBuilderListView.tsx already uses.
  const [showGallery, setShowGallery] = useState(false);
  const [galleryDashboards, setGalleryDashboards] = useState<ISystemDashboardDefinition[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [copyingId, setCopyingId] = useState<number | null>(null);

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

  const openGallery = async () => {
    setShowGallery(true);
    setLoadingGallery(true);
    setGalleryDashboards(await listSystemDashboardDefinitions());
    setLoadingGallery(false);
  };

  const handleCopyFromGallery = async (id: number) => {
    setCopyingId(id);
    try {
      const created = await copyFromSystemDashboardDefinition(id);
      if (created) {
        setShowGallery(false);
        await refresh();
        navigate(`/dashboard-builder/${created.id}`);
      }
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h4 className="mb-0">Dashboards</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={openGallery}>
            Browse Gallery
          </button>
          <button className="btn btn-sm" style={{ background: "#f58634", color: "#fff" }} onClick={handleNew}>
            + New Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : dashboards.length === 0 ? (
        <div className="text-muted">No dashboards yet — click "+ New Dashboard" or "Browse Gallery" to get started.</div>
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

      {showGallery && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 420, maxHeight: "80vh", overflowY: "auto", borderRadius: 6, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong>Dashboard Gallery</strong>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowGallery(false)}>
                Close
              </button>
            </div>
            {loadingGallery ? (
              <div className="text-muted">Loading...</div>
            ) : galleryDashboards.length === 0 ? (
              <div className="text-muted" style={{ fontSize: 13 }}>No gallery dashboards yet.</div>
            ) : (
              galleryDashboards.map((g) => (
                <div key={g.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <div>
                    <div style={{ fontWeight: 600 }}>{g.name}</div>
                    {g.description && <div style={{ fontSize: 11, color: "#888" }}>{g.description}</div>}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleCopyFromGallery(g.id)}
                    disabled={copyingId === g.id}
                  >
                    {copyingId === g.id ? "Copying..." : "Use This"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardListView;
