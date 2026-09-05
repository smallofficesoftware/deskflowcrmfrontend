import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PromptModal from "../../../../components/model/PromptModal";
import {
  createReportDefinition,
  getMetricsRegistry,
  getModelRegistry,
  getPluginRegistry,
  IMetricEntry,
  IModelRegistryEntry,
  IPluginRegistryEntry,
  IReportDefinition,
  listReportDefinitions,
  updateReportDefinition,
  verifyReportPin,
} from "./ReportBuilderController";
import StepColumns from "./StepColumns";
import StepFilters from "./StepFilters";
import StepOrganize from "./StepOrganize";
import StepSource from "./StepSource";
import { useReportBuilderStore } from "./useReportBuilderStore";
import WizardRail, { IWizardStep } from "./WizardRail";

const STEPS: IWizardStep[] = [
  { n: 1, label: "What & where", sub: "Source and name" },
  { n: 2, label: "What to show", sub: "Pick the columns" },
  { n: 3, label: "Filter it", sub: "Optional conditions" },
  { n: 4, label: "Organize & save", sub: "Group, icon, save" },
];

// Step 12's wizard rebuild. Piece 1 (scaffolding): rail + routing + PIN
// gate + edit-mode prefill. Piece 2 (this pass): Step 1's real content
// (StepSource.tsx) — name/type/source/description, ported field-for-field
// from ReportBuilderView.tsx's existing form, not rewritten. Steps 2-4 are
// still placeholders (pieces 3-5).
// Mounted at /report-builder/new (create) and /report-builder/:id/edit
// (edit) — see RoutesIndex.tsx. /report-builder itself still points at the
// old single-page ReportBuilderView.tsx, untouched, until piece 6 splits
// its list-only half out into ReportBuilderListView.tsx and the entry
// points (New Report / Edit) switch over to these routes.
const ReportBuilderWizardView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const store = useReportBuilderStore();
  const isEdit = !!id;

  // See ReportBuilderView.tsx's own copy of this comment — trusts an
  // already-stored REPORT_PIN_TOKEN instead of re-prompting on every
  // mount/reload; a stale token just fails the first gated call normally.
  const [pinVerified, setPinVerified] = useState(() => !!localStorage.getItem("REPORT_PIN_TOKEN"));
  const [showPinModal, setShowPinModal] = useState(true);
  const [loadingDefinition, setLoadingDefinition] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [registry, setRegistry] = useState<IModelRegistryEntry[]>([]);
  const [plugins, setPlugins] = useState<IPluginRegistryEntry[]>([]);
  const [metrics, setMetrics] = useState<IMetricEntry[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const selectedModel = registry.find((m) => m.key === store.modelKey);
  const selectedPlugin = plugins.find((p) => p.key === store.pluginKey);
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState(1);
  // Create mode: steps unlock as completed, same "can't skip ahead of
  // what's filled in" shape the mock's rail already has. Edit mode: the
  // definition is already complete, so every step is reachable immediately
  // — no artificial re-click-through just to reach Step 4 and hit Save.
  const [furthest, setFurthest] = useState(isEdit ? 4 : 1);
  const [advanced, setAdvanced] = useState(false);

  const handlePinSubmit = async (pin: string) => {
    const ok = await verifyReportPin(pin);
    if (ok) {
      setPinVerified(true);
      setShowPinModal(false);
    }
  };

  useEffect(() => {
    if (!pinVerified) return;

    setLoadingRegistry(true);
    Promise.all([getModelRegistry(), getPluginRegistry(), getMetricsRegistry()]).then(([reg, plg, mtr]) => {
      setRegistry(reg);
      setPlugins(plg);
      setMetrics(mtr);
      setLoadingRegistry(false);
    });

    if (!isEdit) {
      store.reset();
      return;
    }
    // No single-fetch-by-id endpoint exists — the current build screen
    // doesn't have one either, it edits straight off its already-loaded
    // list (ReportBuilderView.tsx's handleEdit). Same approach here, since
    // this route can be landed on directly (deep link / reload), not only
    // clicked from a list already in memory.
    setLoadingDefinition(true);
    listReportDefinitions().then((defs: IReportDefinition[]) => {
      const found = defs.find((d) => d.id === Number(id));
      if (!found) {
        setLoadError("Report not found, or you don't have access to it.");
      } else {
        store.loadForEdit(found);
      }
      setLoadingDefinition(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinVerified, isEdit, id]);

  const goto = (target: number) => {
    setStep(target);
    setFurthest((f) => Math.max(f, target));
  };

  // Step 2 (columns/metrics) doesn't apply to plugin-type — its output
  // shape is server-defined, nothing to pick. Step 3 (filters, piece 4)
  // won't apply to composite-type — dimension is fixed server-side, no
  // filters today. Marked N/A rather than removed from the rail so the
  // 4-step shape stays constant regardless of type.
  const notApplicableSteps = new Set<number>();
  if (store.type === "plugin") notApplicableSteps.add(2);
  if (store.type === "composite") notApplicableSteps.add(3);

  // Continue/Back skip straight over an N/A step instead of landing on it
  // — direct rail clicks can't reach one anyway (WizardRail disables it),
  // this is just the sequential-nav path.
  const nextApplicableStep = (from: number, dir: 1 | -1) => {
    let s = from + dir;
    while (s >= 1 && s <= STEPS.length && notApplicableSteps.has(s)) s += dir;
    return Math.min(Math.max(s, 1), STEPS.length);
  };

  // Same per-step gating a linear wizard needs so "Continue" never
  // advances past an incomplete step — pieces 4-5 add Step 3/4's own
  // checks as their content lands.
  const canContinueStep1 =
    !!store.name.trim() &&
    (store.type === "composite" || (store.type === "query" && !!store.modelKey) || (store.type === "plugin" && !!store.pluginKey));
  const canContinueStep2 = store.type === "composite" ? store.metricKeys.length > 0 : store.type === "query" ? store.columns.length > 0 : true;
  const canContinue = step === 1 ? canContinueStep1 : step === 2 ? canContinueStep2 : true;
  const canSave = canContinueStep1 && canContinueStep2;

  // Ported field-for-field from ReportBuilderView.tsx's existing handleSave
  // — same per-type payload shape (query/plugin/composite), same
  // create-vs-update branch on store.editingId. Differs only in what
  // happens after a successful save: the old form resets and stays on the
  // same page (list + form share one screen); this route navigates back
  // to the list, since Add/Edit now live on their own screen.
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    let created;
    if (store.type === "composite") {
      const payload = {
        name: store.name.trim(),
        type: "composite" as const,
        columns_json: store.metricKeys,
        report_group_id: store.reportGroupId,
        description: store.description.trim() || null,
        icon: store.icon || null,
      };
      created = store.editingId ? await updateReportDefinition(store.editingId, payload) : await createReportDefinition(payload);
    } else if (store.type === "plugin") {
      const filtersObject = Object.fromEntries(
        store.filters
          .filter((f) => f.value !== "")
          .map((f) => {
            const fieldDef = selectedPlugin?.filterSchema.find((s) => s.key === f.column);
            const value = fieldDef?.type === "date" ? f.value.split(",").map((v) => v.trim()) : f.value;
            return [f.column, value];
          }),
      );
      const payload = {
        name: store.name.trim(),
        type: "plugin" as const,
        plugin_key: store.pluginKey,
        columns_json: [],
        filters_json: filtersObject,
        report_group_id: store.reportGroupId,
        description: store.description.trim() || null,
        icon: store.icon || null,
      };
      created = store.editingId ? await updateReportDefinition(store.editingId, payload) : await createReportDefinition(payload);
    } else {
      const payload = {
        name: store.name.trim(),
        type: "query" as const,
        model_key: store.modelKey,
        columns_json: store.columns,
        filters_json: store.filters.filter((f) => f.value !== ""),
        group_by_json: store.groupBy,
        filters_to_show: store.filtersToShow,
        report_group_id: store.reportGroupId,
        description: store.description.trim() || null,
        icon: store.icon || null,
      };
      created = store.editingId ? await updateReportDefinition(store.editingId, payload) : await createReportDefinition(payload);
    }

    setSaving(false);
    if (created) {
      store.reset();
      navigate("/report-builder");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <style>{`
        .rb-btn-primary { background-color: #F58634; border-color: #F58634; color: #fff; }
        .rb-btn-primary:hover, .rb-btn-primary:focus { background-color: #e0752a; border-color: #e0752a; color: #fff; }
        .rb-btn-primary:disabled { background-color: #f5ab7a; border-color: #f5ab7a; }
        .rb-btn-outline-primary { color: #F58634; border-color: #F58634; background-color: transparent; }
        .rb-btn-outline-primary:hover, .rb-btn-outline-primary:focus { background-color: #F58634; border-color: #F58634; color: #fff; }
      `}</style>

      <PromptModal
        show={showPinModal && !pinVerified}
        onHide={() => navigate(-1)}
        onSubmit={handlePinSubmit}
        title="Owner PIN required"
        message="Report Builder is an owner-only area. Enter the shared build PIN to continue (same PIN as Document Designer)."
        placeholder="PIN"
        submitLabel="Verify"
      />

      {pinVerified && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>{isEdit ? "Edit Report" : "New Report"}</h4>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/report-builder")}>
              Back to Report Builder
            </button>
          </div>

          {loadingDefinition && <p className="text-muted">Loading report...</p>}
          {loadError && <p className="text-danger">{loadError}</p>}

          {!loadingDefinition && !loadError && (
            <div style={{ display: "flex", gap: 28 }}>
              <WizardRail
                steps={STEPS}
                activeStep={step}
                furthest={furthest}
                notApplicableSteps={notApplicableSteps}
                advanced={advanced}
                onAdvancedChange={setAdvanced}
                onGoto={goto}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    padding: 20,
                    minHeight: 380,
                  }}
                >
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#F58634" }}>
                      Step {step} of {STEPS.length}
                    </div>
                    <h5 style={{ margin: "4px 0 4px", fontWeight: 700 }}>{STEPS[step - 1].label}</h5>
                    <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>{STEPS[step - 1].sub}</p>
                  </div>

                  {step === 1 && (
                    <StepSource registry={registry} plugins={plugins} loadingRegistry={loadingRegistry} advanced={advanced} />
                  )}
                  {step === 2 && <StepColumns selectedModel={selectedModel} metrics={metrics} advanced={advanced} />}
                  {step === 3 && <StepFilters selectedModel={selectedModel} selectedPlugin={selectedPlugin} />}
                  {step === 4 && <StepOrganize selectedModel={selectedModel} metrics={metrics} />}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                    <button className="btn btn-outline-secondary btn-sm" disabled={step === 1} onClick={() => goto(nextApplicableStep(step, -1))}>
                      Back
                    </button>
                    {step < STEPS.length ? (
                      <button className="btn btn-sm rb-btn-primary" disabled={!canContinue} onClick={() => goto(nextApplicableStep(step, 1))}>
                        Continue
                      </button>
                    ) : (
                      <button className="btn btn-sm rb-btn-primary" disabled={!canSave || saving} onClick={handleSave}>
                        {saving ? "Saving..." : isEdit ? "Update Report" : "Save Report"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportBuilderWizardView;
