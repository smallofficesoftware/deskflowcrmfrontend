import { useNavigate } from "react-router-dom";

// Sidebar for the Automations page (plan section 8.1). Modeled on
// SideBarView.tsx's look (collapsible, #E1E1E1) but not reused directly -
// that file is hard-wired to the Reports menu.

export type AutomationView = "flows" | "templates" | "executions" | "webhooks" | "settings";

interface IProps {
  active: AutomationView;
  onNavigate: (view: AutomationView) => void;
}

const ITEMS: { key: AutomationView; label: string }[] = [
  { key: "flows", label: "All Automations" },
  { key: "templates", label: "Templates" },
  { key: "executions", label: "Executions" },
  { key: "webhooks", label: "Webhooks" },
  { key: "settings", label: "Settings" },
];

const AutomationSidebarView = ({ active, onNavigate }: IProps) => {
  const navigate = useNavigate();

  return (
    <div
      data-testid="automation-sidebar"
      style={{
        width: 230,
        minWidth: 230,
        height: "100vh",
        background: "#E1E1E1",
        borderRight: "1px solid #c9c9c9",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "16px 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #c9c9c9",
        }}
      >
        <div
          role="button"
          title="Back"
          onClick={() => navigate(-1)}
          style={{ cursor: "pointer", color: "#4B4B4D", lineHeight: 1 }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
            />
          </svg>
        </div>
        <h6 style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Automations</h6>
      </div>

      <div style={{ padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <div
              key={item.key}
              role="button"
              onClick={() => onNavigate(item.key)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#1070b2" : "#4B4B4D",
                background: isActive ? "rgba(16,112,178,0.12)" : "transparent",
                fontSize: 14,
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AutomationSidebarView;
