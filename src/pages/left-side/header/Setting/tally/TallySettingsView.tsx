import { useEffect, useMemo, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import TallyFieldMappingSection from "./TallyFieldMappingSection";
import TallySendSection from "./TallySendSection";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { axiosInstance } from "../../../../../services/axiosInstance";

// Tally addon settings + mapping (plans/2026-10-08-marketplace-tally-plan.txt
// 4.3/4.4, Q3/Q6). Talks to the existing /tally/* routes (all behind
// requireAddon('tally')): connection settings, connector key issue/revoke, and
// the four record-mapping lists. The connector's own local /mappings page reads
// and writes the same data through the connector-key mirror of these routes.

interface ITallySettings {
  connection_mode: "local_connector";
  tally_version: "prime" | "erp9";
}

const DEFAULT_SETTINGS: ITallySettings = {
  connection_mode: "local_connector",
  tally_version: "prime",
};

type EntityKey = "products" | "contacts" | "voucher-types" | "gst-ledgers" | "payment-modes";

interface IMappingRow {
  crm_id?: number;
  crm_ref?: string;
  // Display fields differ per entity; the list endpoints return a flat row.
  [key: string]: any;
}

type PullJobType = "pull_ledgers" | "pull_stock_items" | "pull_voucher_types";

// pullJob = which read of Tally feeds the name suggestions for that tab.
const ENTITIES: { key: EntityKey; label: string; ledgerNoun: string; pullJob: PullJobType }[] = [
  { key: "products", label: "Products", ledgerNoun: "Tally stock item", pullJob: "pull_stock_items" },
  { key: "contacts", label: "Contacts", ledgerNoun: "Tally ledger", pullJob: "pull_ledgers" },
  { key: "voucher-types", label: "Voucher types", ledgerNoun: "Tally voucher type", pullJob: "pull_voucher_types" },
  { key: "gst-ledgers", label: "GST ledgers", ledgerNoun: "Tally ledger", pullJob: "pull_ledgers" },
  { key: "payment-modes", label: "Payment modes", ledgerNoun: "Tally cash/bank ledger", pullJob: "pull_ledgers" },
];

interface IConnectorInfo {
  /** The company code and CRM address the connector must be configured with. */
  company_code: string | null;
  crm_base_url: string | null;
}

const CONNECTOR_DOWNLOAD_URL = "https://deskflowcrm.com/download.php";

type LedgerRole = "sales" | "round_off" | "other_charges" | "discount" | "tcs";

// Placeholders are what the voucher uses when a name is left blank; the connector creates any
// ledger Tally does not already have, so a blank is fine for a first try.
const LEDGER_FIELDS: { role: LedgerRole; label: string; placeholder: string }[] = [
  { role: "sales", label: "Sales ledger", placeholder: "Sales" },
  { role: "round_off", label: "Round-off ledger", placeholder: "Round Off" },
  { role: "other_charges", label: "Packing / transport charges ledger", placeholder: "Freight and Packing" },
  { role: "discount", label: "Discount ledger", placeholder: "Discount Allowed" },
  { role: "tcs", label: "TCS ledger", placeholder: "TCS Payable" },
];

interface ISyncLogRow {
  id: number;
  job_type: string;
  status: string;
  attempt_count: number;
  error_message: string | null;
  created_date_time: string | null;
  completed_at: string | null;
}

const JOB_LABEL: Record<string, string> = {
  pull_ledgers: "Fetch ledgers",
  pull_stock_items: "Fetch stock items",
  pull_voucher_types: "Fetch voucher types",
  pull_groups: "Fetch groups",
  push_ledger: "Send ledger",
  push_voucher: "Send voucher",
};

const POLL_EVERY_MS = 2000;
const POLL_GIVE_UP_MS = 2 * 60 * 1000;
const formatWhen = (value: string | null) => (value ? new Date(value).toLocaleString("en-IN") : "");

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
  if (entity === "voucher-types" || entity === "payment-modes") return row.label;
  return `${row.tax_rate_label} (${row.tax_rate_value}%) - ${row.duty_label}`;
};

// products/contacts map to a Tally id (external_id); the two fixed-slot
// entities only carry a Tally name (external_ref).
const usesExternalId = (entity: EntityKey) => entity === "products" || entity === "contacts";

interface IPropsTally {
  onHide: () => void;
}

const TallySettingsView = ({ onHide }: IPropsTally) => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ITallySettings>(DEFAULT_SETTINGS);
  // The rest of config_json: ledger names for the invoice/receipt voucher and the auto-send switches.
  const [ledgers, setLedgers] = useState<Record<LedgerRole, string>>({ sales: "", round_off: "", other_charges: "", discount: "", tcs: "" });
  const [autoSync, setAutoSync] = useState<{ invoices: boolean; receipts: boolean }>({ invoices: false, receipts: false });
  const [saving, setSaving] = useState(false);

  const [newKey, setNewKey] = useState<string | null>(null);
  const [connectorInfo, setConnectorInfo] = useState<IConnectorInfo | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [confirmKeyAction, setConfirmKeyAction] = useState<"issue" | "revoke" | null>(null);

  const [entity, setEntity] = useState<EntityKey>("products");
  const [rows, setRows] = useState<IMappingRow[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [rowsLoading, setRowsLoading] = useState(false);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tallyNames, setTallyNames] = useState<Partial<Record<PullJobType, string[]>>>({});
  const [pulling, setPulling] = useState(false);
  const [syncLog, setSyncLog] = useState<ISyncLogRow[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  // Stops the polling loop if the screen closes mid-fetch.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
          connection_mode: "local_connector",
          tally_version: item.config_json?.tally_version === "erp9" ? "erp9" : "prime",
        });
        const cfg = item.config_json || {};
        setLedgers({ sales: "", round_off: "", other_charges: "", discount: "", tcs: "", ...(cfg.ledgers || {}) });
        setAutoSync({ invoices: Boolean(cfg.auto_sync?.invoices), receipts: Boolean(cfg.auto_sync?.receipts) });
      }
    } catch (error: any) {
      setLoadError(errorOf(error));
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.post("tally/settings/save", {
        connection_mode: "local_connector",
        direct_url_host: null,
        direct_url_port: null,
        // The server merges this into the stored config and stamps when auto-send was switched on.
        config_json: { tally_version: settings.tally_version, ledgers, auto_sync: autoSync },
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

  const fetchConnectorInfo = async () => {
    try {
      const { data } = await axiosInstance.post("tally/connector/download-info", {});
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) setConnectorInfo(data.data?.item || null);
    } catch {
      // Only the config-file values are missing; the rest of the screen is unaffected.
    }
  };

  // The file the connector reads from its own folder. Built here, from the key just generated, so
  // the key never has to be typed or retyped; the CRM address and company code come from the server.
  const downloadConnectorConfig = () => {
    if (!newKey || !connectorInfo?.company_code || !connectorInfo?.crm_base_url) {
      toast.error("Generate a key first");
      return;
    }
    const config = {
      connectorKey: newKey,
      companyCode: connectorInfo.company_code,
      crmBaseUrl: connectorInfo.crm_base_url,
      tallyVersion: settings.tally_version,
      tallyHost: "localhost",
      tallyPort: 9000,
    };
    saveAs(new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }), "connector-config.json");
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
      // __title is the CRM-column text, precomputed so the column can sort on it.
      setRows((data.data?.items || []).map((r: IMappingRow) => ({ ...r, __title: rowTitle(which, r) })));
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
      fetchSyncLog();
      fetchConnectorInfo();
    }
  }, [enabled]);

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

  const fetchSyncLog = async () => {
    setLogLoading(true);
    try {
      const { data } = await axiosInstance.post("tally/sync/log", { limit: 100 });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) setSyncLog(data.data?.items || []);
    } catch {
      // The log table just stays as it was.
    } finally {
      setLogLoading(false);
    }
  };

  // Asks the connector to read Tally, then polls the job until it reports back.
  const fetchFromTally = async () => {
    const jobType = ENTITIES.find((e) => e.key === entity)!.pullJob;
    setPulling(true);
    try {
      const { data } = await axiosInstance.post("tally/sync/request-pull", { job_type: jobType });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      const jobId = data.data?.item?.id;
      const startedAt = Date.now();
      while (mounted.current && Date.now() - startedAt < POLL_GIVE_UP_MS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS));
        if (!mounted.current) return;
        const { data: status } = await axiosInstance.post("tally/sync/pull-status", { job_id: jobId });
        if (status.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
          toast.error(status.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          return;
        }
        const item = status.data?.item;
        if (item?.status === "done") {
          setTallyNames((prev) => ({ ...prev, [jobType]: item.names || [] }));
          toast.success(
            item.names?.length
              ? `Fetched ${item.names.length} names from Tally`
              : "Tally returned nothing for this list"
          );
          return;
        }
        if (item?.status === "failed") {
          toast.error(item.error_message || "The connector could not read Tally");
          return;
        }
      }
      if (mounted.current) toast.error("The connector did not answer. Check that it is running and connected to Tally.");
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      if (mounted.current) {
        setPulling(false);
        fetchSyncLog();
      }
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (rowTitle(entity, r) || "").toLowerCase().includes(q));
  }, [rows, search, entity]);

  const noun = ENTITIES.find((e) => e.key === entity)?.ledgerNoun;

  return (
    <div className="tly">
      <style>{`
        .tly { color: #4c4c4c; }
        .tly h5 { font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #6c757d; margin-bottom: 10px; }
        .tly .report_button { background: #4c4c4c; border-color: #4c4c4c; color: #fff; }
        .tly .report_button:hover, .tly .report_button:disabled { background: #333; border-color: #333; color: #fff; }
        .tly .btn-outline-secondary { color: #4c4c4c; border-color: #ccc; font-size: 14px; }
        .tly .btn-outline-secondary:hover { background: #f8f9fa; border-color: #4c4c4c; color: #4c4c4c; }
        .tly-key { font-family: monospace; background: #f8f9fa; border: 1px dashed #4c4c4c; border-radius: 5px; padding: 10px 12px; word-break: break-all; }
        .tly .custom-centered-table .p-inputtext { font-size: 14px; }
      `}</style>

      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h3 className="dash-board-text-count" style={{ fontSize: "20px" }}>
            Tally
          </h3>
          <div className="text-muted small">Connection, connector key and the mappings used when syncing with Tally.</div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : enabled === false && loadError ? (
        <p className="text-danger">Couldn&apos;t load Tally settings: {loadError}. Check that the backend is reachable and try again.</p>
      ) : enabled === false ? (
        <p className="text-muted">This addon is not enabled for your company. Contact your DeskflowCRM account manager to enable Tally.</p>
      ) : (
        <>
          <section className="tly-card card shadow-sm border-0 bg-light p-3 mb-3">
            <h5>Connection</h5>
            <div className="row g-3">
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
            </div>
            <div className="mt-3">
              <button className="btn report_button" onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </section>

          {settings.connection_mode === "local_connector" && (
            <section className="tly-card card shadow-sm border-0 bg-light p-3 mb-3">
              <h5>Deskflow Tally Connector</h5>
              <p className="small text-muted mb-2">
                A small program that runs on the computer where Tally is open. It reads Tally and writes your invoices and receipts into it.
              </p>
              <ol className="small text-muted mb-0 ps-3">
                <li>
                  <a href={CONNECTOR_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                    Open the download page
                  </a>{" "}
                  (all Deskflow installers are listed there), get the Tally Connector and copy it to the computer where Tally is running (Tally must be open with the company loaded).</li>
                <li>Generate a key below, then download <code>connector-config.json</code> and put it in the same folder as the connector.</li>
                <li>Run the connector. It shows its status at <code>http://127.0.0.1:9100</code> on that computer.</li>
              </ol>
            </section>
          )}

          {settings.connection_mode === "local_connector" && (
            <section className="tly-card card shadow-sm border-0 bg-light p-3 mb-3">
              <h5>Connector key</h5>
              <p className="small text-muted mb-2">
                The connector signs in with this key. A company has one active key; issuing a new one replaces the old one. The key is shown
                only once - download the config file now.
              </p>
              {newKey && (
                <div className="mb-3">
                  <div className="tly-key">{newKey}</div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={copyKey}>
                      Copy key
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={downloadConnectorConfig}>
                      Download connector-config.json
                    </button>
                  </div>
                </div>
              )}
              <div className="d-flex gap-2">
                <button className="btn report_button" onClick={() => setConfirmKeyAction("issue")} disabled={keyBusy}>
                  {newKey ? "Generate another key" : "Generate key"}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setConfirmKeyAction("revoke")} disabled={keyBusy}>
                  Revoke active key
                </button>
              </div>
            </section>
          )}

          <section className="tly-card card shadow-sm border-0 bg-light p-3 mb-3">
            <h5>Invoices and receipts</h5>
            <p className="small text-muted mb-3">
              Names of the Tally ledgers an invoice posts to. Leave a name blank to use the suggestion; the connector creates any ledger Tally
              does not already have and never changes one that exists. GST ledgers and payment-mode ledgers are set in the mapping tabs below.
            </p>
            <div className="row g-3">
              {LEDGER_FIELDS.map((f) => (
                <div className="col-md-6" key={f.role}>
                  <label className="form-label small mb-1">{f.label}</label>
                  <input
                    className="form-control"
                    value={ledgers[f.role]}
                    placeholder={f.placeholder}
                    disabled={saving}
                    onChange={(e) => setLedgers({ ...ledgers, [f.role]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="form-check form-switch mb-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="tally-auto-invoices"
                  checked={autoSync.invoices}
                  disabled={saving}
                  onChange={(e) => setAutoSync({ ...autoSync, invoices: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="tally-auto-invoices">
                  Send new sales invoices to Tally automatically
                </label>
              </div>
              <div className="form-check form-switch mb-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="tally-auto-receipts"
                  checked={autoSync.receipts}
                  disabled={saving}
                  onChange={(e) => setAutoSync({ ...autoSync, receipts: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="tally-auto-receipts">
                  Send new receipts to Tally automatically
                </label>
              </div>
              <div className="text-muted small">
                Only documents created after you turn this on are sent, checked every 10 minutes. Anything older, or anything that failed, is sent
                from the list below.
              </div>
            </div>
            <div className="mt-3">
              <button className="btn report_button" onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </section>

          <h5 className="tly-heading">Mappings</h5>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <nav className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2" style={{ width: "100%" }}>
              {ENTITIES.map((e) => {
                const active = entity === e.key;
                return (
                  <button
                    key={e.key}
                    type="button"
                    className="flex-sm-fill text-sm-center nav-link"
                    style={{
                      backgroundColor: active ? "#f58634" : "transparent",
                      color: active ? "#ffffff" : "#000000",
                      border: active ? "none" : "1px solid #ccc",
                      boxShadow: "none",
                    }}
                    onClick={() => setEntity(e.key)}
                  >
                    <span className="m-1">{e.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Search in This Report"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline-secondary" onClick={fetchFromTally} disabled={pulling}>
              {pulling ? "Waiting for Tally..." : "Fetch from Tally"}
            </button>
            {tallyNames[ENTITIES.find((e) => e.key === entity)!.pullJob] && (
              <span className="text-muted small">
                {tallyNames[ENTITIES.find((e) => e.key === entity)!.pullJob]!.length} names loaded - pick one in the list below
              </span>
            )}
          </div>
          <datalist id="tally-names">
            {(tallyNames[ENTITIES.find((e) => e.key === entity)!.pullJob] || []).map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <div className="report_card" style={{ display: "flex", flexDirection: "column" }}>
            <DataTable
              value={filtered}
              className="custom-centered-table"
              tableStyle={{ tableLayout: "fixed", width: "100%" }}
              loading={rowsLoading}
              scrollable
              scrollHeight="60vh"
              paginator
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
              currentPageReportTemplate="Total Records: {totalRecords}"
              rows={50}
              rowsPerPageOptions={[25, 50, 100, 200]}
              emptyMessage={rows.length === 0 ? "Nothing to map yet" : "No records found"}
            >
              <Column
                header="S.No"
                body={(_row: IMappingRow, options: { rowIndex: number }) => options.rowIndex + 1}
                style={{ fontSize: "14px", width: "70px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "70px" }}
              />
              <Column
                header="CRM"
                sortable
                sortField="__title"
                body={(row: IMappingRow) => rowTitle(entity, row)}
                style={{ fontSize: "14px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
              />
              <Column
                header={noun}
                style={{ fontSize: "14px", minWidth: 220 }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
                body={(row: IMappingRow) => {
                  const key = rowKey(entity, row);
                  return (
                    <input
                      className="form-control form-control-sm"
                      list="tally-names"
                      value={currentValue(row)}
                      placeholder={usesExternalId(entity) ? `Name of the ${noun}` : ""}
                      onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                    />
                  );
                }}
              />
              <Column
                header="Status"
                style={{ fontSize: "14px", width: "130px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "130px" }}
                body={(row: IMappingRow) => {
                  const status = row.mapping_status || row.match_confidence || "";
                  const confirmed = Boolean(row.is_confirmed) || status === "already_synced";
                  return (
                    <span className={`badge ${confirmed ? "bg-success" : "bg-secondary"}`}>
                      {confirmed ? "Confirmed" : STATUS_LABEL[status] || "Not mapped"}
                    </span>
                  );
                }}
              />
              <Column
                header=""
                style={{ fontSize: "14px", width: "110px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", width: "110px" }}
                body={(row: IMappingRow) => {
                  const key = rowKey(entity, row);
                  return (
                    <button className="btn btn-outline-secondary btn-sm" disabled={savingRow === key} onClick={() => saveRow(row)}>
                      {savingRow === key ? "Saving..." : "Confirm"}
                    </button>
                  );
                }}
              />
            </DataTable>
          </div>

          <TallyFieldMappingSection />

          <TallySendSection />

          <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
            <h5 className="tly-heading mb-0">Sync log</h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchSyncLog} disabled={logLoading}>
              {logLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="report_card" style={{ display: "flex", flexDirection: "column" }}>
            <DataTable
              value={syncLog}
              className="custom-centered-table"
              tableStyle={{ tableLayout: "fixed", width: "100%" }}
              loading={logLoading}
              scrollable
              scrollHeight="40vh"
              paginator
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
              currentPageReportTemplate="Total Records: {totalRecords}"
              rows={25}
              rowsPerPageOptions={[25, 50, 100]}
              emptyMessage="No sync activity yet"
            >
              <Column
                header="S.No"
                body={(_row: ISyncLogRow, options: { rowIndex: number }) => options.rowIndex + 1}
                style={{ fontSize: "14px", width: "70px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "70px" }}
              />
              <Column
                header="Job"
                sortable
                sortField="job_type"
                body={(row: ISyncLogRow) => JOB_LABEL[row.job_type] || row.job_type}
                style={{ fontSize: "14px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
              />
              <Column
                header="Status"
                sortable
                sortField="status"
                style={{ fontSize: "14px", width: "110px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "110px" }}
                body={(row: ISyncLogRow) => (
                  <span
                    className={`badge ${row.status === "done" ? "bg-success" : row.status === "failed" ? "bg-danger" : "bg-secondary"}`}
                  >
                    {row.status === "done" ? "Done" : row.status === "failed" ? "Failed" : row.status === "running" ? "Running" : "Queued"}
                  </span>
                )}
              />
              <Column
                header="Requested"
                sortable
                sortField="created_date_time"
                body={(row: ISyncLogRow) => formatWhen(row.created_date_time)}
                style={{ fontSize: "14px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
              />
              <Column
                header="Finished"
                body={(row: ISyncLogRow) => formatWhen(row.completed_at)}
                style={{ fontSize: "14px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
              />
              <Column
                header="Tries"
                field="attempt_count"
                style={{ fontSize: "14px", width: "70px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "70px" }}
              />
              <Column
                header="Error"
                field="error_message"
                style={{ fontSize: "14px" }}
                headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
              />
            </DataTable>
          </div>
        </>
      )}

      <ConfirmationModal
        show={confirmKeyAction !== null}
        onHide={() => setConfirmKeyAction(null)}
        handleSubmit={() => {
          const action = confirmKeyAction;
          setConfirmKeyAction(null);
          if (action === "issue") issueKey();
          else if (action === "revoke") revokeKey();
        }}
        title={confirmKeyAction === "revoke" ? "Revoke connector key" : "Generate connector key"}
        message={
          confirmKeyAction === "revoke"
            ? "Revoke the active connector key? The connector stops syncing until you issue a new one."
            : "Generate a new connector key? Any key issued before stops working immediately."
        }
        btn1="Cancel"
        btn2={confirmKeyAction === "revoke" ? "Revoke" : "Generate"}
      />
    </div>
  );
};

export default TallySettingsView;
