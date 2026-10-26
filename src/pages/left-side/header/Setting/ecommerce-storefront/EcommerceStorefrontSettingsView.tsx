import { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// B2B/B2C ecommerce storefront addon (plans/2026-10-15-ecommerce-b2b-b2c-plan.txt,
// P1/4.4). First slice of this settings page: on/off display (the settings/get
// call's 403-vs-200 response IS the check, same pattern Tally's own settings page
// would use via requireAddon) + theme picker (just Pharmacy today). Price list
// picker / approval-mode / subdomain fields deliberately NOT built yet - they have
// no backend consumer until P4/P5, so they'd just be inert UI right now.
//
// Auth method toggles (P3/Q3, added 23-10-2026): unlike the theme picker above
// (which saves on every click), these batch into one Save button - a single
// toggle flip can trigger the mode-switch "keep or lock" prompt (Q3(d)), and
// that prompt needs every other toggle's pending value intact, not already
// half-saved one field at a time.

interface IStorefrontTheme {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

interface IStorefrontAuthConfig {
  auth_email_pin_enabled: boolean;
  auth_mobile_pin_enabled: boolean;
  auth_mobile_otp_enabled: boolean;
  auth_email_otp_enabled: boolean;
  auth_light_mode_enabled: boolean;
  auth_invite_only: boolean;
  guest_checkout_enabled: boolean;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  paid_stage_status_id: number | null;
  credit_limit_action: "block" | "warn";
  approval_mode_enabled: boolean;
  stock_check_mode: "derived" | "reserved";
  theme_accent_color: string;
}

const DEFAULT_AUTH_CONFIG: IStorefrontAuthConfig = {
  auth_email_pin_enabled: false,
  auth_mobile_pin_enabled: false,
  auth_mobile_otp_enabled: false,
  auth_email_otp_enabled: false,
  auth_light_mode_enabled: false,
  auth_invite_only: false,
  guest_checkout_enabled: true,
  razorpay_key_id: "",
  razorpay_key_secret: "",
  paid_stage_status_id: null,
  credit_limit_action: "warn",
  approval_mode_enabled: false,
  stock_check_mode: "derived",
  theme_accent_color: "#ff0000",
};

const ACCENT_PRESETS = ["#ff0000", "#F58634", "#2e7d32", "#1565c0", "#6a1b9a", "#e91e63", "#00897b", "#37474f"];

// Sales Order's own module id in stage_status_masters.order_type (see
// orderTypesStageList in StageStatusController.ts: "4" = Sales Order) -
// storefront checkout creates a `carts` row with type:2 (ListOrderController.ts's
// own orderTypesList: "2" = Sales Order under ITS numbering - the two numbering
// schemes already disagree elsewhere in this codebase, same mismatch, not a
// new one), so the "which stage means paid" picker offers exactly the stages
// the admin already set up for their Sales Order pipeline, nothing new.
const SALES_ORDER_STAGE_MODULE = 4;

interface IStageOption {
  id: number;
  name: string;
}

type AuthToggleKey = "auth_email_pin_enabled" | "auth_mobile_pin_enabled" | "auth_mobile_otp_enabled" | "auth_email_otp_enabled" | "auth_light_mode_enabled" | "auth_invite_only";

const AUTH_TOGGLE_LABELS: { key: AuthToggleKey; label: string; help: string }[] = [
  { key: "auth_email_pin_enabled", label: "Email + PIN", help: "Verify email once, then PIN for later logins." },
  { key: "auth_mobile_pin_enabled", label: "Mobile + PIN", help: "Verify mobile via OTP once, then PIN for later logins." },
  { key: "auth_mobile_otp_enabled", label: "Mobile OTP every time", help: "No PIN - a fresh code every login." },
  { key: "auth_email_otp_enabled", label: "Email OTP every time", help: "No PIN - a fresh code every login." },
  { key: "auth_light_mode_enabled", label: "No-verification (mobile only)", help: "Trusted entry, order-placing only - no OTP/PIN." },
  { key: "auth_invite_only", label: "Invite-only signup", help: "Only contacts you've marked \"Invited\" can create an account. Doesn't affect guest checkout." },
];

interface IAffectedMethod {
  setting: string;
  method: string;
  count: number;
}

interface ILockedMethod {
  method: string;
  label: string;
}

interface ILockedAccount {
  id: number;
  person_name: string | null;
  mobile_number: string | null;
  email_id: string | null;
  locked_methods: ILockedMethod[];
}

interface IDomainInfo {
  domain: string;
  verified: boolean;
  verification_host: string;
  verification_token: string;
}

interface IPropsEcommerceStorefront {
  isEcommerceStorefrontView: boolean;
  closeEcommerceStorefrontView: () => void;
}

const EcommerceStorefrontSettingsView = ({
  isEcommerceStorefrontView,
  closeEcommerceStorefrontView,
}: IPropsEcommerceStorefront) => {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [themes, setThemes] = useState<IStorefrontTheme[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [authConfig, setAuthConfig] = useState<IStorefrontAuthConfig>(DEFAULT_AUTH_CONFIG);
  const [savingAuth, setSavingAuth] = useState(false);
  const [affectedMethods, setAffectedMethods] = useState<IAffectedMethod[]>([]);
  const [lockChoices, setLockChoices] = useState<Record<string, "lock" | "keep">>({});
  const [lockedAccounts, setLockedAccounts] = useState<ILockedAccount[]>([]);
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);
  const [stageOptions, setStageOptions] = useState<IStageOption[]>([]);

  const [domainInfo, setDomainInfo] = useState<IDomainInfo | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [subdomainUrl, setSubdomainUrl] = useState<string | null>(null);
  const [customDomainUrl, setCustomDomainUrl] = useState<string | null>(null);
  const [domainBusy, setDomainBusy] = useState(false);

  useEscapeKey(closeEcommerceStorefrontView);

  const fetchDomain = async () => {
    try {
      const { data } = await axiosInstance.post("storefront/domain/get", {});
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const item = data.data?.item || null;
        setDomainInfo(item);
        setDomainInput(item?.domain || "");
        setSubdomainUrl(data.data?.subdomain_url || null);
        setCustomDomainUrl(data.data?.custom_domain_url || null);
      }
    } catch {
      // The address card just stays empty; the rest of the page is unaffected.
    }
  };

  const saveDomain = async () => {
    setDomainBusy(true);
    try {
      const { data } = await axiosInstance.post("storefront/domain/save", { domain: domainInput });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      toast.success(domainInput.trim() ? "Domain saved - add the DNS record, then click Verify" : "Domain removed");
      fetchDomain();
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setDomainBusy(false);
    }
  };

  const verifyDomain = async () => {
    setDomainBusy(true);
    try {
      const { data } = await axiosInstance.post("storefront/domain/verify", {});
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("Domain verified");
        fetchDomain();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setDomainBusy(false);
    }
  };

  const fetchStatusAndThemes = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("storefront/settings/get", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        // Only the addon gate's own refusal means "not enabled" - anything else
        // (not logged in, tenant DB unavailable) is a different problem.
        const addonOff = /addon is not enabled/i.test(data.ack_msg || "");
        setLoadError(addonOff ? null : data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setEnabled(false);
        setLoading(false);
        return;
      }
      setLoadError(null);
      setEnabled(true);
      setAuthConfig({ ...DEFAULT_AUTH_CONFIG, ...(data.data?.item?.config_json || {}) });

      const themesRes = await axiosInstance.post("storefront/themes/get", {});
      if (themesRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setThemes(themesRes.data.data?.item?.themes || []);
        setCurrentThemeId(themesRes.data.data?.item?.current_theme_id || null);
      }

      fetchLockedAccounts();
      fetchStageOptions();
      fetchDomain();
    } catch (error: any) {
      setLoadError(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStageOptions = async () => {
    try {
      const { data } = await axiosInstance.post("commonGet", {
        table: "stage_status_masters",
        columns: "id,name",
        where: [`order_type=${SALES_ORDER_STAGE_MODULE}`, "isDelete=0"],
        request_flag: 0,
      });
      setStageOptions((data?.data || []) as IStageOption[]);
    } catch {
      // Non-critical - the dropdown just stays empty/unset.
    }
  };

  const fetchLockedAccounts = async () => {
    try {
      const { data } = await axiosInstance.post("storefront/locked-accounts/get", {});
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLockedAccounts(data.data?.items || []);
      }
    } catch {
      // Non-critical - the rest of the page still works without this list.
    }
  };

  useEffect(() => {
    if (isEcommerceStorefrontView) fetchStatusAndThemes();
  }, [isEcommerceStorefrontView]);

  const handleSelectTheme = async (themeId: number) => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.post("storefront/theme/select", {
        storefront_theme_id: themeId,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setCurrentThemeId(themeId);
        toast.success("Theme updated");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSaving(false);
    }
  };

  const saveAuthConfig = async (lock_decisions?: Record<string, "lock" | "keep">) => {
    setSavingAuth(true);
    try {
      const { data } = await axiosInstance.post("storefront/settings/save", {
        config_json: authConfig,
        ...(lock_decisions ? { lock_decisions } : {}),
      });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      if (data.data?.needs_decision) {
        // Mode-switch (Q3(d)): existing accounts signed up through a method
        // this save would disable - ask per method before actually saving.
        setAffectedMethods(data.data.affected || []);
        setLockChoices(Object.fromEntries((data.data.affected || []).map((a: IAffectedMethod) => [a.setting, "keep"])));
        return;
      }
      toast.success("Settings saved");
      setAffectedMethods([]);
      fetchLockedAccounts(); // a fresh "lock" choice may have just added rows here.
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSavingAuth(false);
    }
  };

  const confirmLockDecisions = async () => {
    await saveAuthConfig(lockChoices);
  };

  const handleUnlock = async (contactId: number, method: string) => {
    const key = `${contactId}-${method}`;
    setUnlockingKey(key);
    try {
      const { data } = await axiosInstance.post("storefront/locked-accounts/unlock", { contact_id: contactId, method });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("Unlocked");
        fetchLockedAccounts();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setUnlockingKey(null);
    }
  };

  if (!isEcommerceStorefrontView) return null;

  return (
    <div className="esf">
      <style>{`
        .esf { max-width: 860px; color: #4B4B4D; }
        .esf-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .esf-back { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #d1d5db; background: #fff; color: #4B4B4D; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .esf-back:hover { border-color: #F58634; color: #F58634; }
        .esf-title { margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; }
        .esf-sub { margin: 2px 0 0; font-size: 12px; color: #8a8a8a; }
        .esf-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 20px; margin-bottom: 16px; }
        .esf-card h5 { font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #8a8a8a; margin-bottom: 6px !important; }
        .esf-card .form-check-input:checked { background-color: #F58634; border-color: #F58634; }
        .esf-card .form-check-input:focus, .esf-card .form-control:focus, .esf-card .form-select:focus { border-color: #F58634; box-shadow: 0 0 0 0.2rem rgba(245,134,52,0.2); }
        .esf-card .form-control, .esf-card .form-select { border-radius: 10px; border-color: #d1d5db; }
        .esf-card .btn-primary { background: #F58634; border-color: #F58634; border-radius: 10px; font-weight: 600; padding: 10px 18px; }
        .esf-card .btn-primary:hover, .esf-card .btn-primary:disabled { background: #e0762a; border-color: #e0762a; }
        .esf-card .btn-outline-secondary { border-radius: 10px; color: #4B4B4D; border-color: #d1d5db; }
        .esf-card .btn-outline-secondary:hover { background: rgba(245,134,52,0.12); border-color: #F58634; color: #4B4B4D; }
      `}</style>
      <div className="esf-head">
        <div role="button" className="esf-back" title="Back" aria-label="Back" onClick={closeEcommerceStorefrontView}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
          </svg>
        </div>
        <div>
          <h2 className="esf-title">Ecommerce Storefront</h2>
          <p className="esf-sub">Theme, customer login, payments and B2B rules for your online store.</p>
        </div>
      </div>

      <div>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : enabled === false && loadError ? (
          <p className="text-danger">
            Couldn&apos;t load Ecommerce Storefront settings: {loadError}. Check that the backend is reachable and
            try again.
          </p>
        ) : enabled === false ? (
          <p className="text-muted">
            This addon is not enabled for your company. Contact your DeskflowCRM
            account manager to enable the Ecommerce Storefront addon.
          </p>
        ) : (
          <>
            <section className="esf-card">
            <h5 className="mb-2">Your Storefront Address</h5>
            {subdomainUrl ? (
              <p className="mb-1">
                <a href={subdomainUrl} target="_blank" rel="noreferrer"><b>{subdomainUrl}</b></a>
              </p>
            ) : (
              <p className="text-muted small mb-1">No store address available yet.</p>
            )}
            {customDomainUrl && (
              <p className="mb-1">
                <a href={customDomainUrl} target="_blank" rel="noreferrer"><b>{customDomainUrl}</b></a>{" "}
                <span className="text-success small">verified</span>
              </p>
            )}
            <div className="mt-3">
              <label className="form-label small mb-1">Custom domain (optional)</label>
              <div className="d-flex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: 320 }}
                  placeholder="shop.yourcompany.com"
                  value={domainInput}
                  disabled={domainBusy}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
                <button type="button" className="btn btn-primary" disabled={domainBusy} onClick={saveDomain}>
                  Save domain
                </button>
                {domainInfo && !domainInfo.verified && (
                  <button type="button" className="btn btn-outline-secondary" disabled={domainBusy} onClick={verifyDomain}>
                    Verify
                  </button>
                )}
              </div>
              {domainInfo && !domainInfo.verified && (
                <div className="text-muted small mt-2" style={{ overflowWrap: "anywhere" }}>
                  To verify, add a DNS <b>TXT</b> record: name <code>{domainInfo.verification_host}</code>, value{" "}
                  <code>{domainInfo.verification_token}</code>. Also point <code>{domainInfo.domain}</code> (CNAME) at
                  your storefront host. DNS changes can take a few minutes.
                </div>
              )}
            </div>

            </section>
            <section className="esf-card">
            <h5 className="mb-3">Storefront Theme</h5>
            {themes.length === 0 ? (
              <p className="text-muted">No themes available yet.</p>
            ) : (
              themes.map((theme) => (
                <div key={theme.id} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="storefront-theme"
                    id={`theme-${theme.id}`}
                    checked={currentThemeId === theme.id}
                    disabled={saving}
                    onChange={() => handleSelectTheme(theme.id)}
                  />
                  <label className="form-check-label" htmlFor={`theme-${theme.id}`}>
                    <b>{theme.name}</b>
                    {theme.description ? ` - ${theme.description}` : ""}
                  </label>
                </div>
              ))
            )}

            <h5 className="mt-4 mb-2">Accent Colour</h5>
            <p className="text-muted small mb-2">
              Colour for prices, buttons and the active menu underline. Saved with the Save Settings button below.
            </p>
            <div className="d-flex align-items-center flex-wrap" style={{ gap: "0.5rem" }}>
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Use ${color}`}
                  onClick={() => setAuthConfig({ ...authConfig, theme_accent_color: color })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: color,
                    border: authConfig.theme_accent_color.toLowerCase() === color.toLowerCase() ? "3px solid #1a1a1a" : "2px solid #fff",
                    boxShadow: "0 0 0 1px #d1d5db",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
              ))}
              <input
                type="color"
                aria-label="Custom accent colour"
                value={/^#[0-9a-fA-F]{6}$/.test(authConfig.theme_accent_color) ? authConfig.theme_accent_color : "#ff0000"}
                onChange={(e) => setAuthConfig({ ...authConfig, theme_accent_color: e.target.value })}
                style={{ width: 36, height: 28, padding: 0, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff" }}
              />
            </div>

            </section>
            <section className="esf-card">

            <h5 className="mb-1">Customer Login Methods</h5>
            <p className="text-muted small mb-3">
              Turn on any combination - customers won't see a method picker; the
              storefront tries a PIN first (if they have one) and falls back to a
              one-time code automatically.
            </p>
            {AUTH_TOGGLE_LABELS.map(({ key, label, help }) => (
              <div key={key} className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={`auth-toggle-${key}`}
                  checked={authConfig[key]}
                  disabled={savingAuth}
                  onChange={(e) => setAuthConfig({ ...authConfig, [key]: e.target.checked })}
                />
                <label className="form-check-label" htmlFor={`auth-toggle-${key}`}>
                  <b>{label}</b>
                  <div className="text-muted small">{help}</div>
                </label>
              </div>
            ))}

            <div className="form-check form-switch mb-3 mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="guest-checkout-toggle"
                checked={authConfig.guest_checkout_enabled}
                disabled={savingAuth}
                onChange={(e) => setAuthConfig({ ...authConfig, guest_checkout_enabled: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="guest-checkout-toggle">
                <b>Allow guest checkout</b>
                <div className="text-muted small">
                  B2C visitors can check out without logging in - independent of invite-only.
                </div>
              </label>
            </div>

            </section>
            <section className="esf-card">

            <h5 className="mb-1">Payment Gateway (Razorpay)</h5>
            <p className="text-muted small mb-3">
              Enter your own Razorpay merchant keys so storefront orders can be paid
              online. Actually charging a card and confirming payment is coming in a
              later update - for now this just stores your keys and which Sales Order
              stage means "payment received" once that's wired up.
            </p>
            <div className="mb-2">
              <label className="form-label small mb-1">Razorpay Key ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="rzp_live_..."
                value={authConfig.razorpay_key_id}
                disabled={savingAuth}
                onChange={(e) => setAuthConfig({ ...authConfig, razorpay_key_id: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Razorpay Key Secret</label>
              <input
                type="password"
                className="form-control"
                placeholder={authConfig.razorpay_key_secret ? "••••••••••••" : "Key secret"}
                value={authConfig.razorpay_key_secret}
                disabled={savingAuth}
                onChange={(e) => setAuthConfig({ ...authConfig, razorpay_key_secret: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small mb-1">Stage that means "Payment Received"</label>
              <select
                className="form-select"
                value={authConfig.paid_stage_status_id ?? ""}
                disabled={savingAuth}
                onChange={(e) =>
                  setAuthConfig({
                    ...authConfig,
                    paid_stage_status_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Not selected</option>
                {stageOptions.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              <div className="text-muted small mt-1">
                From your own Sales Order pipeline (Settings → Stage & Status). A
                successful payment will move the order to this stage.
              </div>
            </div>

            </section>
            <section className="esf-card">

            <h5 className="mb-1">B2B Settings</h5>
            <p className="text-muted small mb-3">
              Apply only to logged-in accounts - never to anonymous B2C guest checkout.
            </p>
            <div className="mb-2">
              <label className="form-label small mb-1">If an order would exceed a customer's credit limit</label>
              <select
                className="form-select"
                value={authConfig.credit_limit_action}
                disabled={savingAuth}
                onChange={(e) => setAuthConfig({ ...authConfig, credit_limit_action: e.target.value as "block" | "warn" })}
              >
                <option value="warn">Allow it, just flag it for review</option>
                <option value="block">Block checkout</option>
              </select>
              <div className="text-muted small mt-1">
                Only applies to contacts with a Credit Limit set (Contact edit screen). A
                contact with no limit set is never affected.
              </div>
            </div>
            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="approval-mode-toggle"
                checked={authConfig.approval_mode_enabled}
                disabled={savingAuth}
                onChange={(e) => setAuthConfig({ ...authConfig, approval_mode_enabled: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="approval-mode-toggle">
                <b>Require approval instead of online payment</b>
                <div className="text-muted small">
                  A logged-in customer's order is placed as an unpaid draft for your team to
                  review - no payment is taken at checkout.
                </div>
              </label>
            </div>
            <div className="mb-3">
              <label className="form-label small mb-1">Stock check mode</label>
              <select
                className="form-select"
                value={authConfig.stock_check_mode}
                disabled={savingAuth}
                onChange={(e) => setAuthConfig({ ...authConfig, stock_check_mode: e.target.value as "derived" | "reserved" })}
              >
                <option value="derived">Derived (calculate from existing stock records)</option>
                <option value="reserved">Reserved (also hold stock against other in-progress checkouts)</option>
              </select>
              <div className="text-muted small mt-1">
                Only takes effect when strict stock checking is already on (Settings → Stock Settings).
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={savingAuth}
              onClick={() => saveAuthConfig()}
            >
              {savingAuth ? "Saving..." : "Save Settings"}
            </button>

            </section>
            <section className="esf-card">

            <h5 className="mb-1">Locked Accounts</h5>
            <p className="text-muted small mb-3">
              Accounts locked out of a specific method after it was turned off (the "Lock
              them out" choice above). A locked method stays blocked for that one customer
              even if you turn the method back on - unlock here to let them back in.
            </p>
            {lockedAccounts.length === 0 ? (
              <p className="text-muted">No locked accounts.</p>
            ) : (
              lockedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                  style={{ flexWrap: "wrap", gap: "0.5rem" }}
                >
                  <div style={{ minWidth: 0, overflowWrap: "break-word" }}>
                    <b>{account.person_name || "Guest"}</b>{" "}
                    <span className="text-muted small">{account.mobile_number || account.email_id}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {account.locked_methods.map(({ method, label }) => (
                      <button
                        key={method}
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={unlockingKey === `${account.id}-${method}`}
                        onClick={() => handleUnlock(account.id, method)}
                      >
                        Unlock {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
            </section>
          </>
        )}
      </div>

      <Modal show={affectedMethods.length > 0} onHide={() => setAffectedMethods([])} centered>
        <Modal.Header closeButton>
          <Modal.Title>Existing customer accounts</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Turning off a method doesn't remove the accounts created through it - choose
            whether to keep them working (they can still use any other method you leave on)
            or lock them out of this specific method, even if you turn it back on later.
          </p>
          {affectedMethods.map((affected) => {
            const label = AUTH_TOGGLE_LABELS.find((a) => a.key === affected.setting)?.label || affected.setting;
            return (
              <div key={affected.setting} className="mb-3">
                <b>{label}</b> - {affected.count} existing account{affected.count === 1 ? "" : "s"}
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`lock-${affected.setting}`}
                    id={`keep-${affected.setting}`}
                    checked={lockChoices[affected.setting] !== "lock"}
                    onChange={() => setLockChoices({ ...lockChoices, [affected.setting]: "keep" })}
                  />
                  <label className="form-check-label" htmlFor={`keep-${affected.setting}`}>Keep them working</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`lock-${affected.setting}`}
                    id={`lock-${affected.setting}`}
                    checked={lockChoices[affected.setting] === "lock"}
                    onChange={() => setLockChoices({ ...lockChoices, [affected.setting]: "lock" })}
                  />
                  <label className="form-check-label" htmlFor={`lock-${affected.setting}`}>Lock them out</label>
                </div>
              </div>
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAffectedMethods([])}>Cancel</Button>
          <Button variant="primary" onClick={confirmLockDecisions} disabled={savingAuth}>Confirm & Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EcommerceStorefrontSettingsView;
