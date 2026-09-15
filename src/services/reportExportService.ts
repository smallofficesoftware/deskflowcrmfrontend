import { saveAs } from "file-saver";
import { axiosInstance } from "./axiosInstance";

export interface ExportColumn {
  key: string;
  label: string;
  // Drives a real typed Excel cell + numFmt in exporter.js (date/number/
  // currency) instead of a stringified value. Omit for string/lookup
  // columns - unchanged, today's exact behavior.
  format?: "date" | "number" | "currency";
}

// One named aggregate over the exported row set - optionally restricted to
// rows matching a groupBy field/value (e.g. Account Outstanding's payable
// vs receivable split). `sourceKey` supports dot-paths for nested fields.
export interface FooterSum {
  outputKey: string;
  sourceKey: string;
  groupBy?: { field: string; equals: string };
}

// One or more literal totals rows appended after the data, each cell either
// a static value or `{ fromSum }` referencing one of `sums` by outputKey.
export interface FooterSpec {
  sums: FooterSum[];
  rows: Record<string, string | number | { fromSum: string }>[];
}

export interface ExportReportExcelParams {
  reportType: string;
  filters: Record<string, unknown>;
  columns: ExportColumn[];
  fileName: string;
  // Pre-fetched rows (e.g. the current grid selection) - when given, the
  // server exports exactly these instead of re-querying the DB. Typed
  // loosely since each report's row shape is its own API response type,
  // which TS won't structurally match against an index-signature type.
  rows?: any[];
  footer?: FooterSpec;
}

// Generic server-side export: backend reuses the report's own existing
// query logic (see reportExportRegistry.js), builds the .xlsx, and returns
// a fileUrl - same generate-then-blob-GET shape already used for PDF
// exports elsewhere (e.g. allVisitReportController.ts).
export const exportReportExcel = async ({
  reportType,
  filters,
  columns,
  fileName,
  rows,
  footer,
}: ExportReportExcelParams): Promise<void> => {
  const getUUID = localStorage.getItem("UUID");

  const response = await axiosInstance.post("/reports/export-excel", {
    reportType,
    filters: { ...filters, a_application_login_id: getUUID },
    columns,
    rows,
    footer,
  });

  if (response.data.ack !== 1) {
    throw new Error(response.data.ack_msg || "Export failed");
  }

  const { fileUrl, fileName: savedName } = response.data.data;

  const fileResponse = await axiosInstance.get(fileUrl, {
    responseType: "blob",
  });

  saveAs(new Blob([fileResponse.data]), savedName || fileName);
};
