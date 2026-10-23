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
}

const DEFAULT_AUTH_CONFIG: IStorefrontAuthConfig = {
  auth_email_pin_enabled: false,
  auth_mobile_pin_enabled: false,
  auth_mobile_otp_enabled: false,
  auth_email_otp_enabled: false,
  auth_light_mode_enabled: false,
  auth_invite_only: false,
  guest_checkout_enabled: true,
};

const AUTH_TOGGLE_LABELS: { key: keyof IStorefrontAuthConfig; label: string; help: string }[] = [
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
  const [themes, setThemes] = useState<IStorefrontTheme[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [authConfig, setAuthConfig] = useState<IStorefrontAuthConfig>(DEFAULT_AUTH_CONFIG);
  const [savingAuth, setSavingAuth] = useState(false);
  const [affectedMethods, setAffectedMethods] = useState<IAffectedMethod[]>([]);
  const [lockChoices, setLockChoices] = useState<Record<string, "lock" | "keep">>({});
  const [lockedAccounts, setLockedAccounts] = useState<ILockedAccount[]>([]);
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);

  useEscapeKey(closeEcommerceStorefrontView);

  const fetchStatusAndThemes = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("storefront/settings/get", {});
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        // requireAddon() blocked this - the addon is off for this company.
        setEnabled(false);
        setLoading(false);
        return;
      }
      setEnabled(true);
      setAuthConfig({ ...DEFAULT_AUTH_CONFIG, ...(data.data?.item?.config_json || {}) });

      const themesRes = await axiosInstance.post("storefront/themes/get", {});
      if (themesRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setThemes(themesRes.data.data?.item?.themes || []);
        setCurrentThemeId(themesRes.data.data?.item?.current_theme_id || null);
      }

      fetchLockedAccounts();
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
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
    <div className="notifications animate__animated animate__fadeInLeft" id="notifications">
      <div className="header-Chat">
        <div className="ICON">
          <div
            aria-disabled="false"
            role="button"
            className="icons"
            title="Back"
            aria-label="Back"
            onClick={closeEcommerceStorefrontView}
          >
            <span data-testid="chat" data-icon="chat" className="">
              <svg viewBox="0 0 24 24" width="24" height="24" className="">
                <path fill="currentColor" d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
              </svg>
            </span>
          </div>
        </div>
        <div className="newText">
          <h2>Ecommerce Storefront</h2>
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : enabled === false ? (
          <p className="text-muted">
            This addon is not enabled for your company. Contact your DeskflowCRM
            account manager to enable the Ecommerce Storefront addon.
          </p>
        ) : (
          <>
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

            <hr className="my-4" />

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

            <button
              type="button"
              className="btn btn-primary"
              disabled={savingAuth}
              onClick={() => saveAuthConfig()}
            >
              {savingAuth ? "Saving..." : "Save Login Settings"}
            </button>

            <hr className="my-4" />

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
                <div key={account.id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                  <div>
                    <b>{account.person_name || "Guest"}</b>{" "}
                    <span className="text-muted small">{account.mobile_number || account.email_id}</span>
                  </div>
                  <div>
                    {account.locked_methods.map(({ method, label }) => (
                      <button
                        key={method}
                        type="button"
                        className="btn btn-sm btn-outline-secondary ms-2"
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
