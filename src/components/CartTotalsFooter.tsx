import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";

// Grid column key -> the row field its footer total sums. The *_wo_c
// ("without currency") twins are plain numbers; the display fields carry a
// currency prefix. Same mapping the exports' `footer.sums` use, so the
// on-screen totals and the exported file's Total row can never disagree.
export const CART_FOOTER_SUM_SOURCE_FIELD: Record<string, string> = {
  taxable_amt: "taxable_amt_wo_c",
  gst_amt: "gst_amt_wo_c",
  tcs_amt: "tcs_amt_wo_c",
  round_off: "round_off_wo_c",
  grand_total: "grand_total_wo_c",
};

const FOOTER_STYLE = { background: "#f8f9fa" };
const TOTAL_STYLE = { textAlign: "right" as const, fontWeight: 600, background: "#f8f9fa" };

interface CartTotalsFooterOptions {
  // The grid's data columns, in render order (the view's visibleColumns).
  columns: { key: string }[];
  // Rows currently shown in the grid (one page).
  rows: any[];
  // Non-data columns rendered before `columns` (selection checkbox,
  // actions) - 0 in mobile mode, where those columns are hidden.
  leadingColumnCount: number;
  // Server-side sums over the whole filtered result (getTeamAllCarts'
  // grand_totals), keyed by display column (taxable_amt, grand_total, ...).
  grandTotals?: Record<string, number> | null;
  // Total record count across all pages; the Grand Total row is only
  // shown when it exceeds this page (otherwise both rows would be equal).
  totalRecords?: number;
}

const currencySymbolOf = (rows: any[], key: string) =>
  rows
    .find((r) => r[key])
    ?.[key]?.toString()
    .match(/[^\d.,-]+/)?.[0]
    ?.trim() || "₹";

const formatAmount = (symbol: string, value: number) =>
  `${symbol} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const sumPage = (rows: any[], sourceKey: string) =>
  rows.reduce((sum, row) => {
    const val = parseFloat(String(row[sourceKey]).replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

const renderTotalsRow = (
  label: string,
  columns: { key: string }[],
  leadingColumnCount: number,
  valueFor: (colKey: string, sourceKey: string) => number,
  rows: any[],
) => (
  <Row>
    {leadingColumnCount > 0 && <Column footer={label} colSpan={leadingColumnCount} footerStyle={TOTAL_STYLE} />}
    {columns.map((col, idx) => {
      const sourceKey = CART_FOOTER_SUM_SOURCE_FIELD[col.key];
      if (!sourceKey) {
        // No leading columns (mobile): label the first plain column instead.
        const cellLabel = leadingColumnCount === 0 && idx === 0 ? label : "";
        return <Column key={col.key} footer={cellLabel} footerStyle={cellLabel ? TOTAL_STYLE : FOOTER_STYLE} />;
      }
      return (
        <Column
          key={col.key}
          footer={formatAmount(currencySymbolOf(rows, col.key), valueFor(col.key, sourceKey))}
          footerStyle={TOTAL_STYLE}
        />
      );
    })}
  </Row>
);

// Column-wise totals footer for the cart report grids (Quotation, Sales
// Order/Invoice, Purchase Order/Invoice, returns, Proforma, Pending
// Order/Purchase): a "Page Total" row over the visible page plus a
// "Grand Total" row over every page when the result spans more than one
// page; a single "Total" row otherwise. Returned as a ColumnGroup element
// (not a component) because DataTable's footerColumnGroup reads Row/Column
// children directly.
export const renderCartTotalsFooter = ({
  columns,
  rows,
  leadingColumnCount,
  grandTotals,
  totalRecords,
}: CartTotalsFooterOptions) => {
  const showGrand = Boolean(grandTotals) && (totalRecords ?? 0) > rows.length;
  return (
    <ColumnGroup>
      {renderTotalsRow(showGrand ? "Page Total" : "Total", columns, leadingColumnCount, (_k, src) => sumPage(rows, src), rows)}
      {showGrand &&
        renderTotalsRow("Grand Total", columns, leadingColumnCount, (colKey) => Number(grandTotals?.[colKey]) || 0, rows)}
    </ColumnGroup>
  );
};
