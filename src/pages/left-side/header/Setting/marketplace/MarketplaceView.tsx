import { useEffect, useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// CRM-side Marketplace (plans/2026-10-08-marketplace-tally-plan.txt, Q1 + 4.3).
// Display only: a card per addon with its enabled / not-enabled state. Purchase
// is handled by the superadmin in the adminpanel (Q1/Q2), so the button is shown
// disabled with a "contact your account manager" note. Enabled state is read the
// same way the ecommerce settings page does it - the addon's own settings/get
// call goes through requireAddon, so an "addon is not enabled" refusal IS the
// answer. No new backend endpoint, no new backend state.

interface IMarketplaceAddon {
  code: string;
  name: string;
  description: string;
  // Any cheap authenticated call behind requireAddon(code).
  statusEndpoint: string;
  // appliedReportType the sidebar opens for this addon's own settings screen.
  settingsReport?: string;
}

const ADDONS: IMarketplaceAddon[] = [
  {
    code: "tally",
    name: "Tally",
    description: "Sync contacts, products and vouchers with Tally Prime and Tally ERP 9 through the Deskflow Tally Connector.",
    statusEndpoint: "tally/settings/get",
    settingsReport: "tally_settings",
  },
  {
    code: "ecommerce-storefront",
    name: "Ecommerce Storefront",
    description: "A B2B and B2C online store with its own address, customer login, payments and price lists.",
    statusEndpoint: "storefront/settings/get",
    settingsReport: "ecommerce_storefront",
  },
];

type AddonState = "loading" | "enabled" | "disabled" | "error";

interface IPropsMarketplace {
  onHide: () => void;
  onOpenSettings: (report: string) => void;
}

const MarketplaceView = ({ onHide, onOpenSettings }: IPropsMarketplace) => {
  const [states, setStates] = useState<Record<string, AddonState>>({});

  useEscapeKey(onHide);

  useEffect(() => {
    ADDONS.forEach(async (addon) => {
      setStates((prev) => ({ ...prev, [addon.code]: "loading" }));
      let next: AddonState;
      try {
        const { data } = await axiosInstance.post(addon.statusEndpoint, {});
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) next = "enabled";
        // Only the gate's own refusal means "not enabled"; anything else
        // (not logged in, tenant DB unavailable) is a different problem.
        else next = /addon is not enabled/i.test(data.ack_msg || "") ? "disabled" : "error";
      } catch {
        next = "error";
      }
      setStates((prev) => ({ ...prev, [addon.code]: next }));
    });
  }, []);

  return (
    <div className="mkt">
      <style>{`
        .mkt { max-width: 860px; color: #4B4B4D; }
        .mkt-title { margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; }
        .mkt-sub { margin: 2px 0 20px; font-size: 12px; color: #8a8a8a; }
        .mkt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .mkt-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .mkt-card h5 { margin: 0; font-size: 16px; font-weight: 700; color: #1a1a1a; }
        .mkt-desc { font-size: 13px; color: #6b7280; flex: 1; }
        .mkt-badge { align-self: flex-start; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .mkt-badge.on { background: rgba(34,150,80,0.12); color: #1d7a43; }
        .mkt-badge.off { background: #f1f2f4; color: #6b7280; }
        .mkt-badge.err { background: rgba(220,53,69,0.1); color: #b02a37; }
        .mkt-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .mkt-actions .btn { border-radius: 10px; font-weight: 600; }
        .mkt-actions .btn-primary { background: #F58634; border-color: #F58634; }
        .mkt-actions .btn-primary:hover { background: #e0762a; border-color: #e0762a; }
        .mkt-note { font-size: 12px; color: #8a8a8a; }
      `}</style>
      <h2 className="mkt-title">Marketplace</h2>
      <p className="mkt-sub">Addons available for your company.</p>

      <div className="mkt-grid">
        {ADDONS.map((addon) => {
          const state = states[addon.code] ?? "loading";
          return (
            <section className="mkt-card" key={addon.code}>
              <h5>{addon.name}</h5>
              {state === "loading" ? (
                <span className="mkt-badge off">Checking...</span>
              ) : state === "enabled" ? (
                <span className="mkt-badge on">Enabled</span>
              ) : state === "disabled" ? (
                <span className="mkt-badge off">Not enabled</span>
              ) : (
                <span className="mkt-badge err">Couldn&apos;t check</span>
              )}
              <div className="mkt-desc">{addon.description}</div>
              <div className="mkt-actions">
                {state === "enabled" && addon.settingsReport && (
                  <button className="btn btn-primary" onClick={() => onOpenSettings(addon.settingsReport!)}>
                    Open settings
                  </button>
                )}
                {state === "disabled" && (
                  <>
                    {/* Q1: purchase is disabled for now - the superadmin assigns addons in the adminpanel. */}
                    <button className="btn btn-outline-secondary" disabled>
                      Purchase
                    </button>
                    <span className="mkt-note">Contact your account manager to enable this addon.</span>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default MarketplaceView;
