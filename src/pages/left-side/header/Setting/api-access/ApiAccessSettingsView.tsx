import { useEffect, useRef, useState } from "react";
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

interface IApiDoc {
  key: string;
  label: string;
  description: string;
  curl: string;
  fields: string;
}

// Path and starting request body of each API in the "Try it" box (the token call builds its own body).
const TRY_IT: Record<string, { path: string; body: string }> = {
  token: { path: "/api-access/token", body: "" },
  products: { path: "/api-access/products", body: '{\n  "page": 1,\n  "limit": 10\n}' },
  categories: { path: "/api-access/categories", body: '{\n  "page": 1,\n  "limit": 20\n}' },
  product: { path: "/product", body: '{\n  "ll": 10,\n  "ul": 0\n}' },
  "get-product-images": { path: "/get-product-images", body: '{\n  "product_id": 123\n}' },
  "get-variants": { path: "/get-variants", body: '{\n  "parent_product_id": 123\n}' },
  "get-variant-attributes": { path: "/get-variant-attributes", body: '{\n  "parent_product_id": 123\n}' },
  "get-attribute-masters": { path: "/get-attribute-masters", body: "{}" },
};

interface ITryResult {
  status: number;
  json: any;
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
  const [selectedApi, setSelectedApi] = useState("token");
  // "Try it" box: the key is typed here and only held in this component (never stored or sent to the CRM's own session).
  const [tryKey, setTryKey] = useState("");
  const [tryBody, setTryBody] = useState("");
  const [tryRunning, setTryRunning] = useState(false);
  const [tryResult, setTryResult] = useState<ITryResult | null>(null);
  const tryToken = useRef<{ key: string; token: string } | null>(null);

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

  const chooseApi = (key: string) => {
    setSelectedApi(key);
    setTryBody(TRY_IT[key]?.body || "");
    setTryResult(null);
  };

  // Calls the chosen API straight from the browser with plain fetch (not axiosInstance, which would add the staff login token).
  const runTry = async () => {
    const apiKey = tryKey.trim();
    if (!apiKey) {
      toast.error("Enter your API key first");
      return;
    }
    const post = async (path: string, body: any, auth?: string): Promise<ITryResult> => {
      const res = await fetch(baseUrl + path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let json: any = text;
      try {
        json = JSON.parse(text);
      } catch {
        // not JSON - show the raw text
      }
      return { status: res.status, json };
    };
    const fetchToken = async () => {
      const res = await post("/api-access/token", { companyCode: status?.company_code, api_key: apiKey });
      const token = res.json?.data?.item?.token as string | undefined;
      if (token) tryToken.current = { key: apiKey, token };
      return { res, token };
    };

    setTryRunning(true);
    setTryResult(null);
    try {
      if (selectedApi === "token") {
        setTryResult((await fetchToken()).res);
        return;
      }
      let body: any;
      try {
        body = JSON.parse(tryBody || "{}");
      } catch {
        toast.error("The request body is not valid JSON");
        return;
      }
      let token = tryToken.current?.key === apiKey ? tryToken.current.token : undefined;
      if (!token) {
        const fetched = await fetchToken();
        if (!fetched.token) {
          setTryResult(fetched.res);
          return;
        }
        token = fetched.token;
      }
      const path = TRY_IT[selectedApi].path;
      let result = await post(path, body, token);
      // ack 3 = "Please login": the 1-hour token expired, so ask for a fresh one and retry once.
      if (result.json?.ack === 3) {
        const fetched = await fetchToken();
        if (!fetched.token) {
          setTryResult(fetched.res);
          return;
        }
        result = await post(path, body, fetched.token);
      }
      setTryResult(result);
    } catch (error: any) {
      setTryResult({ status: 0, json: `Request failed: ${error?.message || error}` });
    } finally {
      setTryRunning(false);
    }
  };

  // One entry per API shown in the "How to use" combo box.
  const authCurl = (path: string, body: string) =>
    `curl -X POST ${baseUrl}${path} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: <token from Get token>" \\
  -d '${body}'`;
  const apiDocs: IApiDoc[] = [
    {
      key: "token",
      label: "Get token",
      description: `Exchange your API key for a token (valid for 1 hour, ask again when it expires). Company code: ${status?.company_code || "-"}. Every other API needs this token in the Authorization header.`,
      curl: `curl -X POST ${baseUrl}/api-access/token \\
  -H "Content-Type: application/json" \\
  -d '{"companyCode":"${status?.company_code || "<your company code>"}","api_key":"<your api key>"}'`,
      fields: "companyCode, api_key (both required)",
    },
    {
      key: "products",
      label: "Products",
      description:
        "Lists products with their images, variants, category, product group and - if your Ecommerce Storefront is on - the store link of each product.",
      curl: authCurl("/api-access/products", '{"page":1,"limit":50}'),
      fields: "searchTerm, categoryId, groupId, includeImages, includeVariants, page, limit (max 100)",
    },
    {
      key: "categories",
      label: "Categories",
      description: "Lists categories with their parent, product group, product count, image and storefront link.",
      curl: authCurl("/api-access/categories", '{"page":1,"limit":100}'),
      fields: "searchTerm, parentId (0 = top level only), groupId, includeEmpty, page, limit (max 500)",
    },
    {
      key: "product",
      label: "/product",
      description: "Existing product list route: products with stock, rates, category name and group name. Use ll (limit) and ul (offset) to page.",
      curl: authCurl("/product", '{"ll":50,"ul":0}'),
      fields:
        "ll (limit), ul (offset), searchTerm, searchCategoryId, productId (comma separated ids), searchBarcodeNum, excludeVariantParents, excludeVariants, productKind (simple | parent | variant)",
    },
    {
      key: "get-product-images",
      label: "/get-product-images",
      description: "All photos of one product or variant, primary first, with image, webp and thumbnail URLs.",
      curl: authCurl("/get-product-images", '{"product_id":123}'),
      fields: "product_id (required)",
    },
    {
      key: "get-variants",
      label: "/get-variants",
      description: "Every variant of a parent product, each with its option labels (for example Colour: Red, Size: XL).",
      curl: authCurl("/get-variants", '{"parent_product_id":123}'),
      fields: "parent_product_id (required)",
    },
    {
      key: "get-variant-attributes",
      label: "/get-variant-attributes",
      description: "The attributes (for example Colour, Size) and their values used by one parent product.",
      curl: authCurl("/get-variant-attributes", '{"parent_product_id":123}'),
      fields: "parent_product_id (required)",
    },
    {
      key: "get-attribute-masters",
      label: "/get-attribute-masters",
      description: "The company's attribute catalog (all attribute names such as Colour and Size, with their values).",
      curl: authCurl("/get-attribute-masters", "{}"),
      fields: "none",
    },
  ];
  const selectedDoc = apiDocs.find((d) => d.key === selectedApi) || apiDocs[0];

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
            <div className="mb-3" style={{ maxWidth: 320 }}>
              <label className="form-label small mb-1">Select API</label>
              <select className="form-select" value={selectedDoc.key} onChange={(e) => chooseApi(e.target.value)}>
                {apiDocs.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="small text-muted mb-2">{selectedDoc.description}</p>
            <pre>{selectedDoc.curl}</pre>
            <div className="mb-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => copy(selectedDoc.curl, "Command")}>
                Copy command
              </button>
            </div>
            <p className="small text-muted mb-3">
              Body fields: <code>{selectedDoc.fields}</code>
            </p>

            <h5>Try it</h5>
            <p className="small text-muted mb-2">
              Paste your API key and run the selected API from here. The token is requested for you (and renewed when it expires). The key is not
              saved.
            </p>
            <div className="row g-2 mb-2">
              <div className="col-md-8">
                <input
                  className="form-control"
                  type="password"
                  autoComplete="off"
                  placeholder="Your API key (dfk_...)"
                  value={tryKey}
                  onChange={(e) => setTryKey(e.target.value)}
                />
              </div>
            </div>
            {selectedDoc.key !== "token" && (
              <div className="mb-2">
                <label className="form-label small mb-1">Request body (JSON)</label>
                <textarea
                  className="form-control"
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                  rows={5}
                  value={tryBody}
                  onChange={(e) => setTryBody(e.target.value)}
                />
              </div>
            )}
            <div className="mb-2">
              <button className="btn report_button" onClick={runTry} disabled={tryRunning}>
                {tryRunning ? "Running..." : `Run ${selectedDoc.label}`}
              </button>
            </div>
            {tryResult && (
              <>
                <div className="small mb-1">
                  Response · HTTP {tryResult.status || "-"}
                  {tryResult.json?.ack !== undefined ? ` · ack ${tryResult.json.ack}` : ""}
                </div>
                <pre style={{ maxHeight: 360, overflow: "auto" }}>
                  {typeof tryResult.json === "string" ? tryResult.json : JSON.stringify(tryResult.json, null, 2)}
                </pre>
              </>
            )}
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
