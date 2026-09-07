import React, { useState } from "react";
import { ReportIcon } from "../../../side-view/reportIcons";
import { IModelRegistryEntry, IPluginRegistryEntry } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";

// Plain-language grouping for the source picker, same shape as the
// approved wizard mock's own SOURCE_GROUPS — a model_key not listed here
// (a future table the registry grows) falls into "Other" automatically
// rather than silently disappearing.
const SOURCE_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Tasks & Team", keys: ["task_managements", "attendance", "target_vs_incentives", "salary_registers"] },
  { title: "Contacts & CRM", keys: ["contacts", "inquiries", "visits", "call_histories", "reminder_messages"] },
  { title: "Sales & Orders", keys: ["carts", "cart_items"] },
  { title: "Money & Accounts", keys: ["account_transactions", "account_outstanding", "employee_transactions", "employee_outstanding", "expenses"] },
  { title: "Products & Stock", keys: ["products", "stock_ledger"] },
  { title: "Production & BOM", keys: ["job_cards", "production_transactions", "production_transaction_items", "bom_process_costs", "bom_material_norms"] },
];

// One real reportIcons.tsx icon per table — this app's own icon set, not
// the mock's separate one (the mock was a standalone prototype with its
// own placeholder icons; this wizard uses the same REPORT_ICON_PATHS
// already used for report tiles elsewhere in the app).
const SOURCE_ICON: Record<string, string> = {
  task_managements: "assignment",
  attendance: "clock",
  target_vs_incentives: "priceChange",
  salary_registers: "payments",
  contacts: "person",
  inquiries: "flag",
  visits: "route",
  call_histories: "call",
  reminder_messages: "notifications",
  carts: "cart",
  cart_items: "shoppingBag",
  account_transactions: "accountBalance",
  account_outstanding: "receipt",
  employee_transactions: "wallet",
  employee_outstanding: "creditCard",
  expenses: "bolt",
  products: "inventory",
  stock_ledger: "warehouse",
  job_cards: "checklist",
  production_transactions: "factory",
  production_transaction_items: "straighten",
  bom_process_costs: "settingsCog",
  bom_material_norms: "book",
};

interface StepSourceProps {
  registry: IModelRegistryEntry[];
  plugins: IPluginRegistryEntry[];
  loadingRegistry: boolean;
  // The type switch (Query/Plugin/Team Metrics) only shows under Advanced
  // mode — a first-time, non-technical author never needs to see it, since
  // "query" (a plain table report) covers the common case and is already
  // the store's own default. Existing plugin/composite reports stay
  // switchable via Advanced when editing one.
  advanced: boolean;
}

// Step 1 of the wizard — ported field-for-field from ReportBuilderView.tsx's
// existing name/type/source/description row (the old form's group + icon
// pickers move to Step 4 instead, matching the approved wizard mock's own
// step split, not this file's invention).
const StepSource: React.FC<StepSourceProps> = ({ registry, plugins, loadingRegistry, advanced }) => {
  const store = useReportBuilderStore();
  const [sourceSearch, setSourceSearch] = useState("");

  const byKey = (key: string) => registry.find((m) => m.key === key);
  const q = sourceSearch.trim().toLowerCase();
  const groupedKeys = new Set(SOURCE_GROUPS.flatMap((g) => g.keys));
  const groups = [
    ...SOURCE_GROUPS,
    // Anything the registry has that isn't in a named group above — keeps
    // a newly-added table reachable instead of silently missing from the
    // picker until this mapping is updated.
    { title: "Other", keys: registry.map((m) => m.key).filter((k) => !groupedKeys.has(k)) },
  ]
    .map((g) => ({ title: g.title, items: g.keys.map(byKey).filter((m): m is IModelRegistryEntry => !!m && (!q || m.label.toLowerCase().includes(q))) }))
    .filter((g) => g.items.length > 0);

  const sourceCard = (m: IModelRegistryEntry) => {
    const selected = store.modelKey === m.key;
    return (
      <button
        key={m.key}
        type="button"
        onClick={() => store.setModelKey(m.key)}
        style={{
          textAlign: "left",
          padding: "12px 14px",
          borderRadius: 10,
          border: `1.5px solid ${selected ? "#F58634" : "#e5e7eb"}`,
          background: selected ? "#fff3eb" : "#fff",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: selected ? "#fff" : "#fff3eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <ReportIcon name={SOURCE_ICON[m.key] || "report"} size={15} color="#F58634" />
        </div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{m.label}</div>
      </button>
    );
  };

  return (
    <div>
      <div className="mb-3">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          Report name
        </label>
        <input
          className="form-control form-control-sm"
          placeholder="e.g. Team All Task Report"
          value={store.name}
          onChange={(e) => store.setName(e.target.value)}
        />
      </div>

      {advanced && (
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
            Report type
          </label>
          <div>
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${store.type === "query" ? "rb-btn-primary" : "rb-btn-outline-primary"}`}
                onClick={() => store.setType("query")}
              >
                Query
              </button>
              <button
                type="button"
                className={`btn ${store.type === "plugin" ? "rb-btn-primary" : "rb-btn-outline-primary"}`}
                onClick={() => store.setType("plugin")}
              >
                Plugin
              </button>
              <button
                type="button"
                className={`btn ${store.type === "composite" ? "rb-btn-primary" : "rb-btn-outline-primary"}`}
                onClick={() => store.setType("composite")}
              >
                Team Metrics
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          {store.type === "composite" ? "Source" : "What do you want to report on?"}
        </label>
        {store.type === "query" && (
          <div>
            {loadingRegistry && <p className="text-muted" style={{ fontSize: 13 }}>Loading...</p>}
            {!loadingRegistry && (
              <>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search: contacts, salary, stock, targets..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  style={{ maxWidth: 320, marginBottom: 12 }}
                />
                {groups.length === 0 && (
                  <p className="text-muted" style={{ fontSize: 13 }}>No data source matches "{sourceSearch}".</p>
                )}
                {groups.map((g) => (
                  <div key={g.title} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8a8a", marginBottom: 8 }}>
                      {g.title}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                      {g.items.map(sourceCard)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {store.type === "plugin" && (
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 420 }}
            value={store.pluginKey}
            onChange={(e) => store.setPluginKey(e.target.value)}
            disabled={loadingRegistry}
          >
            <option value="">Select report...</option>
            {plugins.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        {store.type === "composite" && (
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
            One row per team member — pick which metrics to include on the next step.
          </p>
        )}
      </div>

      <div className="mb-2">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          Description <span style={{ fontWeight: 400, color: "#8a8a8a" }}>(optional)</span>
        </label>
        <input
          className="form-control form-control-sm"
          placeholder="Shown on the report tile and searchable"
          value={store.description}
          onChange={(e) => store.setDescription(e.target.value)}
        />
      </div>
    </div>
  );
};

export default StepSource;
