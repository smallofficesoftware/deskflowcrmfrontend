import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { axiosInstance } from "../../../../../services/axiosInstance";

// "API" marketplace addon settings: generate / revoke the company's API key and show how to use it.
// Talks to /api-access/* (all behind requireAddon('api')). The key is shown once; only its hash is stored.

interface IApiStatus {
  has_key: boolean;
  issued_date_time: string | null;
  last_used_at: string | null;
  company_code: string | null;
}

const formatWhen = (value: string | null) => (value ? new Date(value).toLocaleString("en-IN") : "-");

interface IPropsApiAccess {
  onHide: () => void;
}

const ApiAccessSettingsView = ({ onHide }: IPropsApiAccess) => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<IApiStatus | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"issue" | "revoke" | null>(null);

  useEscapeKey(onHide);

  const errorOf = (error: any) => error?.response?.data?.ack_msg || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED;
  const baseUrl = String(axiosInstance.defaults.baseURL || "").replace(/\/+$/, "");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("api-access/status", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        // Only the gate's own refusal means "not enabled"; anything else is a different problem.
        const addonOff = /addon is not enabled/i.test(data.ack_msg || "");
        setLoadError(addonOff ? null : data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setEnabled(false);
        return;
      }
      setLoadError(null);
      setEnabled(true);
      setStatus(data.data?.item || null);
    } catch (error: any) {
      setLoadError(errorOf(error));
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issueKey = async () => {
    setBusy(true);
    try {
      const { data } = await axiosInstance.post("api-access/key/issue", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      setNewKey(data.data?.item?.api_key || null);
      await fetchStatus();
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async () => {
    setBusy(true);
    try {
      const { data } = await axiosInstance.post("api-access/key/revoke", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      setNewKey(null);
      toast.success(data.data?.revoked ? "API key revoked" : "There was no active key to revoke");
      await fetchStatus();
    } catch (error: any) {
      toast.error(errorOf(error));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Couldn't copy - select the text and copy it manually");
    }
  };

  const tokenExample = `curl -X POST ${baseUrl}/api-access/token \\
  -H "Content-Type: application/json" \\
  -d '{"companyCode":"${status?.company_code || "<your company code>"}","api_key":"<your api key>"}'`;
  const productsExample = `curl -X POST ${baseUrl}/api-access/products \\
  -H "Content-Type: application/json" \\
  -H "Authorization: <token from the step above>" \\
  -d '{"page":1,"limit":50}'`;

  return (
    <div className="apx">
      <style>{`
        .apx { color: #4c4c4c; }
        .apx h5 { font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #6c757d; margin-bottom: 10px; }
        .apx .report_button { background: #4c4c4c; border-color: #4c4c4c; color: #fff; }
        .apx .report_button:hover, .apx .report_button:disabled { background: #333; border-color: #333; color: #fff; }
        .apx .btn-outline-secondary { color: #4c4c4c; border-color: #ccc; font-size: 14px; }
        .apx .btn-outline-secondary:hover { background: #f8f9fa; border-color: #4c4c4c; color: #4c4c4c; }
        .apx-key { font-family: monospace; background: #f8f9fa; border: 1px dashed #4c4c4c; border-radius: 5px; padding: 10px 12px; word-break: break-all; }
        .apx pre { background: #f8f9fa; border: 1px solid #e3e3e3; border-radius: 5px; padding: 10px 12px; font-size: 12px; margin-bottom: 8px; white-space: pre-wrap; word-break: break-all; }
      `}</style>

      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h3 className="dash-board-text-count" style={{ fontSize: "20px" }}>
            API
          </h3>
          <div className="text-muted small">Generate an API key so your own website or software can read your products.</div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : enabled === false && loadError ? (
        <p className="text-danger">Couldn&apos;t load API settings: {loadError}. Check that the backend is reachable and try again.</p>
      ) : enabled === false ? (
        <p className="text-muted">This addon is not enabled for your company. Contact your DeskflowCRM account manager to enable API.</p>
      ) : (
        <>
          <section className="card shadow-sm border-0 bg-light p-3 mb-3">
            <h5>API key</h5>
            <p className="small text-muted mb-2">
              A company has one active key; generating a new one replaces the old one. The key is shown only once, so copy it now and keep it
              secret.
            </p>
            <div className="small mb-2">
              {status?.has_key ? (
                <>
                  Active key issued {formatWhen(status.issued_date_time)} · last used {formatWhen(status.last_used_at)}
                </>
              ) : (
                "No active key."
              )}
            </div>
            {newKey && (
              <div className="mb-3">
                <div className="apx-key">{newKey}</div>
                <div className="mt-2">
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => copy(newKey, "API key")}>
                    Copy key
                  </button>
                </div>
              </div>
            )}
            <div className="d-flex gap-2">
              <button className="btn report_button" onClick={() => setConfirmAction("issue")} disabled={busy}>
                {status?.has_key ? "Generate new key" : "Generate key"}
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setConfirmAction("revoke")} disabled={busy || !status?.has_key}>
                Revoke key
              </button>
            </div>
          </section>

          <section className="card shadow-sm border-0 bg-light p-3 mb-3">
            <h5>How to use</h5>
            <p className="small text-muted mb-2">
              1. Exchange the key for a token (valid for 1 hour, ask again when it expires). Company code:{" "}
              <code>{status?.company_code || "-"}</code>
            </p>
            <pre>{tokenExample}</pre>
            <p className="small text-muted mb-2">
              2. Send the token in the <code>Authorization</code> header to list products with their images, variants, category, product group
              and - if your Ecommerce Storefront is on - the store link of each product.
            </p>
            <pre>{productsExample}</pre>
            <p className="small text-muted mb-2">
              Optional body fields: <code>searchTerm</code>, <code>categoryId</code>, <code>groupId</code>, <code>includeImages</code>,{" "}
              <code>includeVariants</code>, <code>page</code>, <code>limit</code> (max 100).
            </p>
            <p className="small text-muted mb-0">
              The same token also works on these existing read routes: <code>/product</code>, <code>/get-product-images</code>,{" "}
              <code>/get-variants</code>, <code>/get-variant-attributes</code>, <code>/get-attribute-masters</code>,{" "}
              <code>/priceListMaster</code>, <code>/priceListItem</code>, <code>/product-unit-get</code>. It cannot call anything else.
            </p>
          </section>
        </>
      )}

      <ConfirmationModal
        show={confirmAction !== null}
        onHide={() => setConfirmAction(null)}
        handleSubmit={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === "issue") issueKey();
          else if (action === "revoke") revokeKey();
        }}
        title={confirmAction === "revoke" ? "Revoke API key" : "Generate API key"}
        message={
          confirmAction === "revoke"
            ? "Revoke the active API key? Anything using it stops working within about 30 seconds."
            : "Generate a new API key? Any key issued before stops working."
        }
        btn1="Cancel"
        btn2={confirmAction === "revoke" ? "Revoke" : "Generate"}
      />
    </div>
  );
};

export default ApiAccessSettingsView;
