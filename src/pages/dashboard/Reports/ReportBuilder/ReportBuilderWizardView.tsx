import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PromptModal from "../../../../components/model/PromptModal";
import { IReportDefinition, listReportDefinitions, verifyReportPin } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";
import WizardRail, { IWizardStep } from "./WizardRail";

const STEPS: IWizardStep[] = [
  { n: 1, label: "What & where", sub: "Source and name" },
  { n: 2, label: "What to show", sub: "Pick the columns" },
  { n: 3, label: "Filter it", sub: "Optional conditions" },
  { n: 4, label: "Organize & save", sub: "Group, icon, save" },
];

// Piece 1 (scaffolding) of Step 12's wizard rebuild — the rail + routing +
// PIN gate + edit-mode prefill all work end to end here; each step panel is
// still a placeholder (real content is pieces 2-5, ported from
// ReportBuilderView.tsx's existing form piece by piece, not rewritten).
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

  return (
    <div style={{ padding: 20 }}>
      <style>{`
        .rb-btn-primary { background-color: #F58634; border-color: #F58634; color: #fff; }
        .rb-btn-primary:hover, .rb-btn-primary:focus { background-color: #DC6A1C; border-color: #DC6A1C; color: #fff; }
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
                advanced={advanced}
                onAdvancedChange={setAdvanced}
                onGoto={goto}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="card p-3">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#F58634" }}>
                      Step {step} of {STEPS.length}
                    </div>
                    <h5 style={{ margin: "4px 0 4px" }}>{STEPS[step - 1].label}</h5>
                    <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>{STEPS[step - 1].sub}</p>
                  </div>

                  {/* Placeholder — pieces 2-5 replace this per step with the
                      real form content ported from ReportBuilderView.tsx. */}
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Step {step} content isn't built yet in this pass — this is the
                    navigation scaffolding only.
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                    <button className="btn btn-outline-secondary btn-sm" disabled={step === 1} onClick={() => goto(step - 1)}>
                      Back
                    </button>
                    {step < STEPS.length ? (
                      <button className="btn btn-sm rb-btn-primary" onClick={() => goto(step + 1)}>
                        Continue
                      </button>
                    ) : (
                      <button className="btn btn-sm rb-btn-primary" disabled title="Save isn't wired up yet — piece 5">
                        Save report
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
