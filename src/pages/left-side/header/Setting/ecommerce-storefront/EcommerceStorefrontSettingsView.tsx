import { useEffect, useState } from "react";
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

interface IStorefrontTheme {
  id: number;
  code: string;
  name: string;
  description: string | null;
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

      const themesRes = await axiosInstance.post("storefront/themes/get", {});
      if (themesRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setThemes(themesRes.data.data?.item?.themes || []);
        setCurrentThemeId(themesRes.data.data?.item?.current_theme_id || null);
      }
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
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
          </>
        )}
      </div>
    </div>
  );
};

export default EcommerceStorefrontSettingsView;
