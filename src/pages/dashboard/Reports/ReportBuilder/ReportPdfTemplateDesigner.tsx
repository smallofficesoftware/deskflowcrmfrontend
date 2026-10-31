import React from "react";
import LazyBoundary from "../../../../components/LazyBoundary";
import { lazyWithRetry as lazy } from "../../../../common/lazyWithRetry";

// The Designer pulls in pdfme (several MB), so it loads only when "Manage Templates" is opened.
const DocumentDesignerView = lazy(() => import("../../../left-side/header/Setting/document-designer/DocumentDesignerView"));

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
  return (
    <LazyBoundary>
      <DocumentDesignerView reportMode={{ docType, reportName, onClose }} />
    </LazyBoundary>
  );
};

export default ReportPdfTemplateDesigner;
