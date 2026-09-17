import React, { useState } from "react";
import ReportBuilderListView from "./ReportBuilderListView";
import ReportBuilderWizardView from "./ReportBuilderWizardView";

interface IProps {
  onHide: () => void;
  // ReportsTileView.tsx's "Add Report" button — jumps straight to the New
  // Report wizard instead of landing on the list first. Only read once,
  // on mount (BottomView.tsx remounts this component fresh per open, so
  // that's the only time it needs to take effect).
  startNew?: boolean;
}

// Mounted under /SideView's Settings section (reportsMenuData.tsx's
// "report_builder" entry, BottomView.tsx's appliedReportType switch) —
// same onHide-panel shape every other Settings item there uses (e.g.
// RoutePlannerGridView). List <-> Wizard is local state, not a route:
// undefined = list, null = new report, a number = editing that report id.
const ReportBuilderSideView: React.FC<IProps> = ({ onHide, startNew }) => {
  const [wizardId, setWizardId] = useState<number | null | undefined>(startNew ? null : undefined);

  if (wizardId !== undefined) {
    return <ReportBuilderWizardView id={wizardId ?? undefined} onDone={() => setWizardId(undefined)} />;
  }

  return (
    <ReportBuilderListView
      onHide={onHide}
      onNewReport={() => setWizardId(null)}
      onEditReport={(id) => setWizardId(id)}
    />
  );
};

export default ReportBuilderSideView;
