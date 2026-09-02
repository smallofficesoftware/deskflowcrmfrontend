import { useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../helpers/AppConstants";
import {
  exportReportExcel,
  ExportColumn,
  FooterSpec,
} from "../services/reportExportService";

interface ExportExcelMenuItemProps {
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

// Drop-in replacement for the bespoke "Export Excel" <li> every report's
// ellipsis dropdown used to have, backed by the generic server-side export
// API instead of a per-report client-side xlsx build.
const ExportExcelMenuItem = ({
  reportType,
  filters,
  columns,
  fileName,
  disabled = false,
  canShare = true,
  onSelect,
  selectedRows,
  footer,
}: ExportExcelMenuItemProps) => {
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
      await exportReportExcel({
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
      <i className="pi pi-file-excel" style={{ marginRight: "4px" }} />
      {loading ? "Exporting..." : "Export Excel"}
    </li>
  );
};

export default ExportExcelMenuItem;
