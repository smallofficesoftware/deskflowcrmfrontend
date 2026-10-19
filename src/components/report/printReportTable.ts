// Opens a print window with a simple table: report title + the given columns/rows.
// Used by reports whose rows are already loaded in the browser (Print in the More menu).

export interface IPrintColumn {
  key: string;
  label: string;
}

const esc = (v: unknown) =>
  String(v ?? "-").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const printReportTable = (
  title: string,
  columns: IPrintColumn[],
  rows: Record<string, unknown>[],
) => {
  if (rows.length === 0) return;
  const html = `
    <html>
      <head>
        <title>Print ${esc(title)}</title>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #0d47a1; color: white; }
          h1 { text-align: center; }
        </style>
      </head>
      <body>
        <h1>${esc(title)}</h1>
        <table>
          <thead><tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows
              .map((r) => `<tr>${columns.map((c) => `<td>${esc(r[c.key])}</td>`).join("")}</tr>`)
              .join("")}
          </tbody>
        </table>
      </body>
    </html>`;
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
};
