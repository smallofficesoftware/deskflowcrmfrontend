import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// Tally addon settings + mapping (plans/2026-10-08-marketplace-tally-plan.txt
// 4.3/4.4, Q3/Q6). Talks to the existing /tally/* routes (all behind
// requireAddon('tally')): connection settings, connector key issue/revoke, and
// the four record-mapping lists. The connector's own local /mappings page reads
// and writes the same data through the connector-key mirror of these routes.

interface ITallySettings {
  connection_mode: "local_connector" | "direct_url";
  direct_url_host: string;
  direct_url_port: string;
  tally_version: "prime" | "erp9";
}

const DEFAULT_SETTINGS: ITallySettings = {
  connection_mode: "local_connector",
  direct_url_host: "",
  direct_url_port: "9000",
  tally_version: "prime",
};

type EntityKey = "products" | "contacts" | "voucher-types" | "gst-ledgers";

interface IMappingRow {
  crm_id?: number;
  crm_ref?: string;
  // Display fields differ per entity; the list endpoints return a flat row.
  [key: string]: any;
}

const ENTITIES: { key: EntityKey; label: string; ledgerNoun: string }[] = [
  { key: "products", label: "Products", ledgerNoun: "Tally stock item" },
  { key: "contacts", label: "Contacts", ledgerNoun: "Tally ledger" },
  { key: "voucher-types", label: "Voucher types", ledgerNoun: "Tally voucher type" },
  { key: "gst-ledgers", label: "GST ledgers", ledgerNoun: "Tally ledger" },
];

const STATUS_LABEL: Record<string, string> = {
  already_synced: "Synced",
  suggested: "Suggested",
  unmapped: "Not mapped",
  default: "Default",
  manual: "Edited",
};

const rowKey = (entity: EntityKey, row: IMappingRow) => `${entity}:${row.crm_id ?? ""}:${row.crm_ref ?? ""}`;

const rowTitle = (entity: EntityKey, row: IMappingRow) => {
  if (entity === "products") return [row.product_name, row.product_code].filter(Boolean).join(" · ");
  if (entity === "contacts") return [row.contact_name, row.gst_number || row.client_code].filter(Boolean).join(" · ");
  if (entity === "voucher-types") return row.label;
  return `${row.tax_rate_label} (${row.tax_rate_value}%) - ${row.duty_label}`;
};

// products/contacts map to a Tally id (external_id); the two fixed-slot
// entities only carry a Tally name (external_ref).
const usesExternalId = (entity: EntityKey) => entity === "products" || entity === "contacts";

const MAX_ROWS_SHOWN = 200;

interface IPropsTally {
  onHide: () => void;
}

const TallySettingsView = ({ onHide }: IPropsTally) => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ITallySettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);

  const [entity, setEntity] = useState<EntityKey>("products");
  const [rows, setRows] = useState<IMappingRow[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [rowsLoading, setRowsLoading] = useState(false);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEscapeKey(onHide);

  const errorOf = (error: any) => error?.response?.data?.ack_msg || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED;

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("tally/settings/get", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        // Only the gate's own refusal means "not enabled"; anything else is a different problem.
        const addonOff = /addon is not enabled/i.test(data.ack_msg || "");
        setLoadError(addonOff ? null : data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setEnabled(false);
        return;
      }
      setLoadError(null);
      setEnabled(true);
      const item = data.data?.item;
      if (item) {
        setSettings({
          connection_mode: item.connection_mode === "direct_url" ? "direct_url" : "local_connector",
          direct_url_host: item.direct_url_host || "",
          direct_url_port: item.direct_url_port ? String(item.direct_url_port) : "9000",
          tally_version: item.config_json?.tally_version === "erp9" ? "erp9" : "prime",
        });
      }
    } catch (error: any) {
      setLoadError(errorOf(error));
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (settings.connection_mode === "direct_url" && !settings.direct_url_host.trim()) {
      toast.error("Enter the Tally host for a direct URL connection");
      return;
    }
    setSaving(true);
    try {
      const { data } = await axiosInstance.post("tally/settings/save", {
        connection_mode: settings.connection_mode,
        direct_url_host: settings.connection_mode === "direct_url" ? settings.direct_url_host.trim() : null,
        direct_url_port: settings.connection_mode === "direct_url" ? Number(settings.direct_url_port) || 9000 : null,
        config_json: { tally_version: settings.tally_version },
      });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      toast.success("Tally settings saved");
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setSaving(false);
    }
  };

  const issueKey = async () => {
    if (!window.confirm("Generate a new connector key? Any key issued before stops working immediately.")) return;
    setKeyBusy(true);
    try {
      const { data } = await axiosInstance.post("tally/connector-key/issue", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      setNewKey(data.data?.item?.connector_key || null);
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setKeyBusy(false);
    }
  };

  const revokeKey = async () => {
    if (!window.confirm("Revoke the active connector key? The connector stops syncing until you issue a new one.")) return;
    setKeyBusy(true);
    try {
      const { data } = await axiosInstance.post("tally/connector-key/revoke", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      setNewKey(null);
      toast.success(data.data?.revoked ? "Connector key revoked" : "There was no active key to revoke");
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setKeyBusy(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      toast.success("Key copied");
    } catch {
      toast.error("Couldn't copy - select the key and copy it manually");
    }
  };

  const fetchRows = async (which: EntityKey) => {
    setRowsLoading(true);
    setRows([]);
    setEdits({});
    try {
      const { data } = await axiosInstance.post(`tally/mappings/${which}/get`, {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      setRows(data.data?.items || []);
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setRowsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (enabled) {
      setSearch("");
      fetchRows(entity);
    }
  }, [enabled, entity]);

  // What the input shows: the user's pending edit, else the saved/suggested value.
  const currentValue = (row: IMappingRow) => {
    const key = rowKey(entity, row);
    if (key in edits) return edits[key];
    return (usesExternalId(entity) ? row.external_id : row.external_ref) || "";
  };

  const saveRow = async (row: IMappingRow) => {
    const key = rowKey(entity, row);
    const value = currentValue(row).trim();
    if (!value) {
      toast.error(`Enter the ${ENTITIES.find((e) => e.key === entity)?.ledgerNoun} name first`);
      return;
    }
    setSavingRow(key);
    try {
      const payload: Record<string, any> = { is_confirmed: true };
      if (row.crm_id !== undefined) payload.crm_id = row.crm_id;
      if (row.crm_ref !== undefined) payload.crm_ref = row.crm_ref;
      if (usesExternalId(entity)) {
        payload.external_id = value;
        payload.external_ref = value;
      } else {
        payload.external_ref = value;
      }
      const { data } = await axiosInstance.post(`tally/mappings/${entity}/save`, payload);
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      toast.success("Mapping saved");
      setEdits((prev) => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
      // Reflect the save in the row without refetching a possibly long list.
      setRows((prev) =>
        prev.map((r) =>
          rowKey(entity, r) === key
            ? {
                ...r,
                ...(usesExternalId(entity) ? { external_id: value, external_ref: value, mapping_status: "already_synced" } : { external_ref: value, match_confidence: "manual" }),
                is_confirmed: true,
              }
            : r
        )
      );
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setSavingRow(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (rowTitle(entity, r) || "").toLowerCase().includes(q));
  }, [rows, search, entity]);

  const shown = filtered.slice(0, MAX_ROWS_SHOWN);
  const noun = ENTITIES.find((e) => e.key === entity)?.ledgerNoun;

  return (
    <div className="tly">
      <style>{`
        .tly { max-width: 960px; color: #4B4B4D; }
        .tly-title { margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; }
        .tly-sub { margin: 2px 0 20px; font-size: 12px; color: #8a8a8a; }
        .tly-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 20px; margin-bottom: 16px; }
        .tly-card h5 { font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #8a8a8a; margin-bottom: 10px; }
        .tly-card .form-control, .tly-card .form-select { border-radius: 10px; border-color: #d1d5db; }
        .tly-card .form-control:focus, .tly-card .form-select:focus { border-color: #F58634; box-shadow: 0 0 0 0.2rem rgba(245,134,52,0.2); }
        .tly-card .btn { border-radius: 10px; font-weight: 600; }
        .tly-card .btn-primary { background: #F58634; border-color: #F58634; }
        .tly-card .btn-primary:hover, .tly-card .btn-primary:disabled { background: #e0762a; border-color: #e0762a; }
        .tly-card .btn-outline-secondary { color: #4B4B4D; border-color: #d1d5db; }
        .tly-card .btn-outline-secondary:hover { background: rgba(245,134,52,0.12); border-color: #F58634; color: #4B4B4D; }
        .tly-key { font-family: monospace; background: #f6f7f9; border: 1px dashed #F58634; border-radius: 10px; padding: 10px 12px; word-break: break-all; }
        .tly-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .tly-tab { border: 1px solid #d1d5db; background: #fff; border-radius: 999px; padding: 5px 14px; font-size: 13px; font-weight: 600; color: #4B4B4D; }
        .tly-tab.active { background: #F58634; border-color: #F58634; color: #fff; }
        .tly-table { width: 100%; font-size: 13px; }
        .tly-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #8a8a8a; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
        .tly-table td { padding: 6px 8px; border-bottom: 1px solid #f0f1f3; vertical-align: middle; }
        .tly-pill { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #f1f2f4; color: #6b7280; white-space: nowrap; }
        .tly-pill.ok { background: rgba(34,150,80,0.12); color: #1d7a43; }
      `}</style>

      <h2 className="tly-title">Tally</h2>
      <p className="tly-sub">Connection, connector key and the mappings used when syncing with Tally.</p>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : enabled === false && loadError ? (
        <p className="text-danger">Couldn&apos;t load Tally settings: {loadError}. Check that the backend is reachable and try again.</p>
      ) : enabled === false ? (
        <p className="text-muted">This addon is not enabled for your company. Contact your DeskflowCRM account manager to enable Tally.</p>
      ) : (
        <>
          <section className="tly-card">
            <h5>Connection</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small mb-1">How the CRM reaches Tally</label>
                <select
                  className="form-select"
                  value={settings.connection_mode}
                  disabled={saving}
                  onChange={(e) => setSettings({ ...settings, connection_mode: e.target.value as ITallySettings["connection_mode"] })}
                >
                  <option value="local_connector">Deskflow Tally Connector (installed next to Tally)</option>
                  <option value="direct_url">Direct URL (Tally reachable from the server)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small mb-1">Tally version</label>
                <select
                  className="form-select"
                  value={settings.tally_version}
                  disabled={saving}
                  onChange={(e) => setSettings({ ...settings, tally_version: e.target.value as ITallySettings["tally_version"] })}
                >
                  <option value="prime">Tally Prime</option>
                  <option value="erp9">Tally ERP 9</option>
                </select>
              </div>
              {settings.connection_mode === "direct_url" && (
                <>
                  <div className="col-md-8">
                    <label className="form-label small mb-1">Tally host</label>
                    <input
                      className="form-control"
                      value={settings.direct_url_host}
                      disabled={saving}
                      placeholder="tally.example.com"
                      onChange={(e) => setSettings({ ...settings, direct_url_host: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-1">Port</label>
                    <input
                      className="form-control"
                      value={settings.direct_url_port}
                      disabled={saving}
                      inputMode="numeric"
                      onChange={(e) => setSettings({ ...settings, direct_url_port: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </section>

          {settings.connection_mode === "local_connector" && (
            <section className="tly-card">
              <h5>Connector key</h5>
              <p className="small text-muted mb-2">
                Enter this key, your company code and the CRM address in the Deskflow Tally Connector installer. A company has one active key;
                issuing a new one replaces the old one. The key is shown only once.
              </p>
              {newKey && (
                <div className="mb-3">
                  <div className="tly-key">{newKey}</div>
                  <button className="btn btn-outline-secondary btn-sm mt-2" onClick={copyKey}>
                    Copy key
                  </button>
                </div>
              )}
              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={issueKey} disabled={keyBusy}>
                  {newKey ? "Generate another key" : "Generate key"}
                </button>
                <button className="btn btn-outline-secondary" onClick={revokeKey} disabled={keyBusy}>
                  Revoke active key
                </button>
              </div>
            </section>
          )}

          <section className="tly-card">
            <h5>Mappings</h5>
            <div className="tly-tabs">
              {ENTITIES.map((e) => (
                <button key={e.key} className={`tly-tab${entity === e.key ? " active" : ""}`} onClick={() => setEntity(e.key)}>
                  {e.label}
                </button>
              ))}
            </div>
            <input
              className="form-control mb-3"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {rowsLoading ? (
              <p className="text-muted">Loading...</p>
            ) : shown.length === 0 ? (
              <p className="text-muted">{rows.length === 0 ? "Nothing to map yet." : "No matches."}</p>
            ) : (
              <>
                <table className="tly-table">
                  <thead>
                    <tr>
                      <th>CRM</th>
                      <th>{noun}</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((row) => {
                      const key = rowKey(entity, row);
                      const status = row.mapping_status || row.match_confidence || "";
                      const confirmed = Boolean(row.is_confirmed) || status === "already_synced";
                      return (
                        <tr key={key}>
                          <td>{rowTitle(entity, row)}</td>
                          <td style={{ minWidth: 220 }}>
                            <input
                              className="form-control form-control-sm"
                              value={currentValue(row)}
                              placeholder={usesExternalId(entity) ? `Name of the ${noun}` : ""}
                              onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                            />
                          </td>
                          <td>
                            <span className={`tly-pill${confirmed ? " ok" : ""}`}>{confirmed ? "Confirmed" : STATUS_LABEL[status] || "Not mapped"}</span>
                          </td>
                          <td>
                            <button className="btn btn-outline-secondary btn-sm" disabled={savingRow === key} onClick={() => saveRow(row)}>
                              {savingRow === key ? "Saving..." : "Confirm"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length > shown.length && (
                  <p className="small text-muted mt-2 mb-0">
                    Showing the first {MAX_ROWS_SHOWN} of {filtered.length}. Use search to find the rest.
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default TallySettingsView;
