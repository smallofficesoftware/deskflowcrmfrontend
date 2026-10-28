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
        .mkt { color: #4c4c4c; }
        .mkt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .mkt-card { height: 100%; display: flex; flex-direction: column; gap: 10px; }
        .mkt-card h5 { margin: 0; font-size: 16px; font-weight: 700; color: #4c4c4c; }
        .mkt-desc { font-size: 14px; color: #6c757d; flex: 1; }
        .mkt-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .mkt-actions .btn { font-size: 14px; }
        .mkt-actions .report_button { background: #4c4c4c; border-color: #4c4c4c; color: #fff; }
      `}</style>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h3 className="dash-board-text-count" style={{ fontSize: "20px" }}>
            Marketplace
          </h3>
          <div className="text-muted small">Addons available for your company.</div>
        </div>
      </div>

      <div className="mkt-grid">
        {ADDONS.map((addon) => {
          const state = states[addon.code] ?? "loading";
          return (
            <section className="mkt-card card shadow-sm border-0 bg-light p-3" key={addon.code}>
              <h5>{addon.name}</h5>
              <div>
                {state === "loading" ? (
                  <span className="badge bg-secondary">Checking...</span>
                ) : state === "enabled" ? (
                  <span className="badge bg-success">Enabled</span>
                ) : state === "disabled" ? (
                  <span className="badge bg-secondary">Not enabled</span>
                ) : (
                  <span className="badge bg-danger">Couldn&apos;t check</span>
                )}
              </div>
              <div className="mkt-desc">{addon.description}</div>
              <div className="mkt-actions">
                {state === "enabled" && addon.settingsReport && (
                  <button className="btn report_button" onClick={() => onOpenSettings(addon.settingsReport!)}>
                    Open settings
                  </button>
                )}
                {state === "disabled" && (
                  <>
                    {/* Q1: purchase is disabled for now - the superadmin assigns addons in the adminpanel. */}
                    <button className="btn btn-outline-secondary" disabled>
                      Purchase
                    </button>
                    <span className="text-muted small">Contact your account manager to enable this addon.</span>
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
