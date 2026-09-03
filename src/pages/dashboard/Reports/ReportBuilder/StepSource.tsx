import React from "react";
import { IModelRegistryEntry, IPluginRegistryEntry } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";

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
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 420 }}
            value={store.modelKey}
            onChange={(e) => store.setModelKey(e.target.value)}
            disabled={loadingRegistry}
          >
            <option value="">Select data source...</option>
            {registry.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
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
