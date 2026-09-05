import React from "react";
import DocumentDesignerView from "../../../left-side/header/Setting/document-designer/DocumentDesignerView";

interface IReportPdfTemplateDesignerProps {
  docType: string; // "report_" + report_definition_id — see backend/src/services/report_builder/reportPdfExport.js
  reportName: string;
  onClose: () => void;
}

// Report Builder's "Manage Templates" — a thin wrapper around
// DocumentDesignerView.tsx's reportMode, not a separate hand-copied Designer
// component anymore. Same toolbar/sidebar/canvas/page-manipulation/
// field-settings/version-history/Generate Preview as Document Designer's own
// cart doc types; reportMode there swaps out only what's actually
// cart-specific (doc-type switcher, Browse Gallery/Import, cart-order preview
// picker) and renders as a modal overlay instead of a full-page route.
const ReportPdfTemplateDesigner: React.FC<IReportPdfTemplateDesignerProps> = ({ docType, reportName, onClose }) => {
  return <DocumentDesignerView reportMode={{ docType, reportName, onClose }} />;
};

export default ReportPdfTemplateDesigner;
