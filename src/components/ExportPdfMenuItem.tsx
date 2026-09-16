import { useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../helpers/AppConstants";
import {
  exportReportPdf,
  ExportColumn,
  FooterSpec,
} from "../services/reportExportService";

interface ExportPdfMenuItemProps {
  reportType: string;
  filters: Record<string, unknown>;
  columns: ExportColumn[];
  fileName: string;
  disabled?: boolean;
  canShare?: boolean;
  onSelect?: () => void;
  // Current grid selection (raw row objects) - when non-empty, export
  // exactly these rows instead of the full filtered dataset.
  selectedRows?: any[];
  footer?: FooterSpec;
}

// Drop-in replacement for each report's own client-side jsPDF/
// jspdf-autotable build, backed by the generic server-side export API
// (genericReportExport.ejs -> pdf-creator-node) instead - same pattern
// ExportExcelMenuItem already established for xlsx.
const ExportPdfMenuItem = ({
  reportType,
  filters,
  columns,
  fileName,
  disabled = false,
  canShare = true,
  onSelect,
  selectedRows,
  footer,
}: ExportPdfMenuItemProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    onSelect?.();
    if (disabled || loading) return;

    if (!canShare) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    setLoading(true);
    try {
      await exportReportPdf({
        reportType,
        filters,
        columns,
        fileName,
        rows: selectedRows,
        footer,
      });
    } catch {
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="listItem text-start" role="button" onClick={handleClick}>
      <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
      {loading ? "Exporting..." : "Export PDF"}
    </li>
  );
};

export default ExportPdfMenuItem;
