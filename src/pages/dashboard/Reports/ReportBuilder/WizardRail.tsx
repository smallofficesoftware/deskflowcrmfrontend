import React from "react";

export interface IWizardStep {
  n: number;
  label: string;
  sub: string;
}

interface WizardRailProps {
  steps: IWizardStep[];
  activeStep: number;
  // How far the user has gotten this session — a step beyond this is
  // disabled in create mode. Edit mode starts this at the last step (the
  // definition is already complete, no artificial re-click-through).
  furthest: number;
  // Type-dependent steps that don't apply to the CURRENT type (e.g. Step 2
  // for a plugin-type report, Step 3 for composite) — rendered dimmed and
  // marked "N/A" rather than hidden, so the 4-step shape stays constant
  // and Continue/Back (in the wizard view, not here) can skip over them.
  notApplicableSteps?: Set<number>;
  advanced: boolean;
  onAdvancedChange: (value: boolean) => void;
  onGoto: (step: number) => void;
}

// Left-rail step nav — mirrors the approved wizard mock's rail (step
// buttons + an "Advanced mode" toggle at the bottom), rebuilt as a real
// component instead of the mock's vanilla-JS render function since this
// now drives actual React state (ReportBuilderWizardView.tsx). Visual pass
// #4: wrapped in the same card treatment (radius/shadow) the rest of this
// feature already uses (ReportBuilderListView.tsx's report tiles), and a
// connecting line between step dots — a small, real "progress" affordance
// the earlier flat list didn't have, not present in the base mock either
// but consistent with how a stepper reads.
const WizardRail: React.FC<WizardRailProps> = ({ steps, activeStep, furthest, notApplicableSteps, advanced, onAdvancedChange, onGoto }) => (
  <nav
    style={{
      width: 240,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      padding: 12,
      alignSelf: "flex-start",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((s, idx) => {
        const na = notApplicableSteps?.has(s.n);
        const disabled = na || s.n > furthest;
        const active = activeStep === s.n;
        const done = furthest > s.n && !na;
        return (
          <React.Fragment key={s.n}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onGoto(s.n)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: active ? "#F58634" : "transparent",
                background: active ? "#fff3eb" : "transparent",
                cursor: disabled ? "default" : "pointer",
                opacity: na ? 0.45 : 1,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  background: done ? "#F58634" : active ? "#F58634" : "#e5e7eb",
                  color: done || active ? "#fff" : "#6b7280",
                }}
              >
                {done ? "✓" : s.n}
              </span>
              <span>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#8a8a8a" }}>{na ? "Not applicable" : s.sub}</div>
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div style={{ width: 2, height: 8, background: done ? "#F58634" : "#e5e7eb", marginLeft: 22 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>

    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 16 }}>
      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer" }}>
        <span>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>Advanced mode</div>
          <div style={{ fontSize: 10.5, color: "#8a8a8a", maxWidth: 160 }}>
            Report type, plugin/team-metrics sources, group-by, general filter defaults
          </div>
        </span>
        <input type="checkbox" checked={advanced} onChange={(e) => onAdvancedChange(e.target.checked)} style={{ flexShrink: 0 }} />
      </label>
    </div>
  </nav>
);

export default WizardRail;
