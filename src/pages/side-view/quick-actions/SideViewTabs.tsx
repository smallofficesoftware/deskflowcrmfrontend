import React from "react";

export type TSideViewTab = "quick_actions" | "dashboard" | "reports_home";

const TABS: { key: TSideViewTab; label: string; icon: string }[] = [
  { key: "quick_actions", label: "Quick actions", icon: "pi pi-bolt" },
  { key: "dashboard", label: "Insights", icon: "pi pi-chart-line" },
  { key: "reports_home", label: "Reports", icon: "pi pi-file" },
];

interface IProps {
  /** The page being shown: its tab is highlighted. */
  active: TSideViewTab;
  onSelect: (tab: TSideViewTab) => void;
}

/** The three tabs at the top of the Side view, in the same order as the app's Home: Quick actions, Insights, Reports.
 * Same look as every pill tab in the app (docs/REPORT_UI_GUIDELINES.md): active = orange, the rest outlined. */
const SideViewTabs: React.FC<IProps> = ({ active, onSelect }) => (
  <nav className="nav nav-pills flex-row flex-nowrap gap-2" style={{ width: "100%", padding: "8px 2px" }}>
    {TABS.map((t) => {
      const isActive = active === t.key;
      return (
        <button
          key={t.key}
          type="button"
          className="flex-fill text-center nav-link"
          onClick={() => onSelect(t.key)}
          style={{
            backgroundColor: isActive ? "#f58634" : "#ffffff",
            color: isActive ? "#ffffff" : "#000000",
            border: isActive ? "none" : "1px solid #ccc",
            boxShadow: "none",
            fontWeight: 600,
          }}
        >
          <i className={t.icon} style={{ marginRight: "8px" }} />
          <span>{t.label}</span>
        </button>
      );
    })}
  </nav>
);

export default SideViewTabs;
