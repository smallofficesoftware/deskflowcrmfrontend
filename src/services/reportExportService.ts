import { saveAs } from "file-saver";
import { axiosInstance } from "./axiosInstance";

export interface ExportColumn {
  key: string;
  label: string;
  // Drives a real typed Excel cell + numFmt in exporter.js (date/number/
  // currency) instead of a stringified value. "badge"/"multiline"/
  // "nested-table" are PDF-only - the xlsx branch ignores them and falls
  // back to a plain string, same as omitting format entirely. Omit for
  // string/lookup columns - unchanged, today's exact behavior.
  format?: "date" | "number" | "currency" | "badge" | "multiline" | "nested-table";
  // format: "badge" only - row field(s) holding the badge's background
  // color (hex/CSS color). Checked in order; first truthy value wins,
  // "#eeeeee" if none are set. Mirrors the grid's own
  // `rowData.stage_status_color || rowData.status_colour || "#eeeeee"`
  // fallback chains.
  colorKeys?: string[];
  // format: "nested-table" only - the inner table's own columns; the
  // row's value at this column's key must be an array of objects, each
  // rendered as one inner-table row via these {key,label} pairs.
  subColumns?: { key: string; label: string }[];
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

// Same request shape as exportReportExcel - only the endpoint and the
// server-side renderer (genericReportExport.ejs -> pdf-creator-node)
// differ. Replaces each report's own client-side jsPDF/jspdf-autotable
// build with one generic backend export, same as the Excel migration did
// for client-side xlsx builds.
export const exportReportPdf = async ({
  reportType,
  filters,
  columns,
  fileName,
  rows,
  footer,
}: ExportReportExcelParams): Promise<void> => {
  const getUUID = localStorage.getItem("UUID");

  const response = await axiosInstance.post("/reports/export-pdf", {
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
