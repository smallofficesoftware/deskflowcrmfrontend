import * as XLSX from "xlsx";
import { IImportColumn } from "../FormBuilderController";

// Excel import (plan Q3): everything about the sheet itself. The server
// judges each cell (formBuilderImport.js); this file only reads the file,
// matches its columns to the form's fields and builds the request rows.

export type ColumnMapping = Record<string, number>; // field key -> sheet column index (-1 = not in the sheet)

const norm = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// Match every field to the sheet column with the same heading (the sample
// sheet's own headings match exactly; an older sheet often differs in case or
// spacing, or leaves out the "(key)" added to duplicate labels).
export function autoMapColumns(columns: IImportColumn[], sheetHeaders: string[]): ColumnMapping {
  const used = new Set<number>();
  const mapping: ColumnMapping = {};
  const headers = sheetHeaders.map(norm);
  for (const col of columns) {
    let idx = headers.findIndex((h, i) => !used.has(i) && h !== "" && h === norm(col.header));
    if (idx < 0) idx = headers.findIndex((h, i) => !used.has(i) && h !== "" && h === norm(col.label));
    mapping[col.key] = idx;
    if (idx >= 0) used.add(idx);
  }
  return mapping;
}

// Sheet rows (arrays, header row already removed) -> request rows. A row with
// nothing in any mapped column is skipped. row_number is the row's number in
// the Excel file (the header is row 1) so a report can say "row 14".
export function buildImportRows(
  rows: unknown[][],
  columns: IImportColumn[],
  mapping: ColumnMapping,
): { row_number: number; cells: Record<string, any> }[] {
  const out: { row_number: number; cells: Record<string, any> }[] = [];
  rows.forEach((row, i) => {
    const cells: Record<string, any> = {};
    let any = false;
    for (const col of columns) {
      const idx = mapping[col.key];
      if (idx == null || idx < 0) continue;
      const value = row[idx];
      if (value == null || (typeof value === "string" && value.trim() === "")) continue;
      cells[col.key] = value;
      any = true;
    }
    if (any) out.push({ row_number: i + 2, cells });
  });
  return out;
}

export const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const safeSheetName = (s: string) => s.replace(/[/\\?*[\]:]/g, " ").slice(0, 31) || "Entries";

// The downloadable sample: a heading row to fill under, and a second sheet
// that explains each column.
export function downloadSampleSheet(formTitle: string, columns: IImportColumn[]) {
  const wb = XLSX.utils.book_new();
  const entries = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header)]);
  entries["!cols"] = columns.map((c) => ({ wch: Math.max(14, c.header.length + 2) }));
  XLSX.utils.book_append_sheet(wb, entries, "Entries");
  const help = XLSX.utils.aoa_to_sheet([
    ["Column", "Must be filled", "What to write"],
    ...columns.map((c) => [c.header, c.required ? "Yes" : "No", c.hint]),
  ]);
  help["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, help, "How to fill");
  XLSX.writeFile(wb, `${safeSheetName(formTitle)} - import sample.xlsx`);
}

// First sheet of the uploaded file: heading row + data rows. Dates and times
// come through as Excel numbers (the server understands them) unless the
// person typed them as text.
export async function readSheetFile(file: File): Promise<{ headers: string[]; rows: unknown[][] }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const all = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, blankrows: false });
  const [head = [], ...rows] = all;
  return { headers: head.map((h) => String(h ?? "").trim()), rows };
}
