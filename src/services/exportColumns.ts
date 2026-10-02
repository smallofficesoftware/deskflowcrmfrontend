import type { ExportColumn } from "./reportExportService";

// Reports pass their grid column definitions to the export as the column list.
// Those carry React elements (header: <span>...</span>) and render functions, which
// cannot go over the wire: in development React gives every element created during
// a render a reference to its internal fiber, so JSON.stringify throws "Converting
// circular structure to JSON" and the export fails with "Failed to export data"
// before any request is made. The server only reads these fields.
export const toExportColumns = (columns: ExportColumn[]): ExportColumn[] =>
  columns.map(({ key, label, format, colorKeys, subColumns }) => {
    const column: ExportColumn = { key, label };
    if (format) column.format = format;
    if (colorKeys) column.colorKeys = colorKeys;
    if (subColumns) column.subColumns = subColumns.map((s) => ({ key: s.key, label: s.label }));
    return column;
  });
