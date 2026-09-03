import { IFilterPayload } from "../../../../helpers/AppInterface";

// Step 2 of the plan — translates CheckBoxFilterModal's submitted
// IFilterPayload into the {column,op,value}[] shape queryEngine.js's
// runQueryReport already accepts via req.body.filters (the existing
// per-run filter override, unchanged — no new backend mechanism for this).
//
// Every shape below was verified against queryEngine.js's actual filter
// builder (buildFilterCondition + the csv/blank-aware branches,
// queryEngine.js:505-563), not assumed:
// - a csv-type column REQUIRES op:"findInSet" literally, value can be a
//   single id or an array (+ optional combinator:"and"|"or", default "or",
//   + includeBlank for an empty/NULL bucket) — any other op throws.
// - a plain scalar column uses the normal eq/in/gte/lte/... operators;
//   Array.isArray(value) && includeBlank is a special "IN these ids, OR
//   unset" path distinct from a plain {op:"in"}.
// - "unassigned" (slots 10/20) is expressed as value:[] + includeBlank:true
//   on whichever shape (csv or scalar) the target column actually is —
//   same mechanism, not a separate concept.
// The full 29-slot CheckBoxFilterModal catalog, traced from its own JSX
// (see the plan doc's Step 2 table) — used to label checkboxes in both the
// build UI's "default filters to show" picker and (if ever needed) the run
// screen's own widen/narrow picker. Only slots a table actually maps in
// its generalFilters get shown anywhere; this is the full reference set.
export const SLOT_LABELS: Record<number, string> = {
  1: "Date Range",
  2: "Label",
  3: "Source Type",
  4: "Stage and Status",
  5: "Team Member",
  6: "Demography",
  7: "Category / Product",
  8: "Active / Deactivate",
  9: "Multi Team Member",
  10: "Unassign Task",
  11: "Task Type",
  12: "Show Only Template Task",
  13: "Credit",
  14: "Debit",
  15: "Series",
  16: "Warehouse",
  17: "Stock Type",
  18: "Search Contact",
  19: "Product Search",
  20: "Unassign Contacts",
  21: "External Stage/Status",
  22: "GST",
  23: "Date Selection",
  24: "Transaction Mode",
  25: "Payment Type",
  26: "Payment By",
  27: "Expense Type",
  28: "Expense Status",
  29: "Lead Ageing",
};

// Shared by both views' export-column builders — a modelRegistry column
// `type` maps straight onto ExportColumn's `format` for exporter.js's
// type-aware Excel cells (date/number/currency get a real typed cell +
// numFmt); string/lookup/csv/unknown columns get no format, same as
// today's plain stringified export.
export const mapColumnTypeToExportFormat = (type: string | undefined): "date" | "number" | "currency" | undefined =>
  type === "date" || type === "number" || type === "currency" ? type : undefined;

export interface IGeneralFilter {
  column: string;
  op: string;
  value: unknown;
  combinator?: "and" | "or";
  includeBlank?: boolean;
}

export type ColumnTypeLookup = (column: string) => string | undefined;

// slot -> column comes from modelRegistry.js's generalFilters (already
// exposed via getModelRegistry) — `true` (slot 6, Demography) has no
// single target column, handled as its own special case below.
export function translateGeneralFilters(
  payload: IFilterPayload,
  generalFilters: Record<string, string | true>,
  getColumnType: ColumnTypeLookup,
): IGeneralFilter[] {
  const filters: IGeneralFilter[] = [];
  const columnFor = (slot: number): string | null => {
    const target = generalFilters[String(slot)];
    return typeof target === "string" ? target : null;
  };

  // A checkbox multi-select's array against a column whose real type
  // decides the operator — csv needs findInSet, everything else needs in.
  // This is the one piece that actually needed the operator correction
  // found while designing this (slot 2 on inquiries.label_id — scalar —
  // vs the identical slot 2 on contacts.lable/task_managements.label_id —
  // csv — need different operators for the exact same slot number).
  const pushMultiSelect = (slot: number, values: unknown[] | undefined, combinator?: "and" | "or") => {
    const column = columnFor(slot);
    if (!column || !values || values.length === 0) return;
    const type = getColumnType(column);
    if (type === "csv") {
      filters.push({ column, op: "findInSet", value: values, combinator });
    } else {
      filters.push({ column, op: "in", value: values });
    }
  };

  const pushEquals = (slot: number, value: unknown) => {
    const column = columnFor(slot);
    if (!column || value === undefined || value === null || value === "") return;
    filters.push({ column, op: "eq", value });
  };

  // "Unassigned" — value:[] + includeBlank:true works identically for a
  // csv or scalar target column (queryEngine.js:538-540 / 549-561), same
  // mechanism either way, no branching needed here unlike pushMultiSelect.
  const pushUnassigned = (slot: number, checked: unknown[] | undefined) => {
    const column = columnFor(slot);
    if (!column || !checked || !checked.includes(1)) return;
    const type = getColumnType(column);
    filters.push({ column, op: type === "csv" ? "findInSet" : "in", value: [], includeBlank: true });
  };

  // 1 — Date Range
  const dateColumn = columnFor(1);
  if (dateColumn && payload.startSearchDate) {
    filters.push({ column: dateColumn, op: "gte", value: payload.startSearchDate });
  }
  if (dateColumn && payload.endSearchDate) {
    filters.push({ column: dateColumn, op: "lte", value: payload.endSearchDate });
  }

  // 2 — Label (AND/OR toggle: labelAndOr === 2 -> "and", else "or" —
  // meaningless on a scalar column, since one row can only hold one label
  // id there; pushMultiSelect already picks "in" for that case, ignoring
  // the combinator entirely, which is the only sensible behavior).
  pushMultiSelect(2, payload.checkedOptionsLabel, payload.labelAndOr === 2 ? "and" : "or");

  // 3 — Source Type (always a scalar lookup in every table that has it)
  pushMultiSelect(3, payload.checkedOptionsSourceType);

  // 4 — Stage and Status
  pushMultiSelect(4, payload.checkedOptionsStageStatus);

  // 5/9 — Team Member (single vs multi in the UI, identical underlying
  // field/shape — same array either way)
  pushMultiSelect(5, payload.checkedOptionsUser);
  pushMultiSelect(9, payload.checkedOptionsUser);

  // 6 — Demography: up to 4 independent equality filters, no single slot
  // column (generalFilters[6] is `true`, not a column name) — reads
  // straight off filterData instead of the columnFor() helper.
  if (generalFilters["6"] === true && payload.filterData) {
    const { country, state, city, area } = payload.filterData;
    if (country) filters.push({ column: "country", op: "eq", value: country });
    if (state) filters.push({ column: "state", op: "eq", value: state });
    if (city) filters.push({ column: "city", op: "eq", value: city });
    if (area) filters.push({ column: "area", op: "eq", value: area });
  }

  // 7 — Category / Product (only meaningful on tables where category_id/
  // item_category_id/item_product_id are real whitelisted base columns —
  // cart_items, products, stock_ledger; not inquiries, where these are
  // relation-only, so generalFilters[7] is simply never set there)
  pushEquals(7, payload.selectedCategoryId);
  pushEquals(7, payload.selectedProductId);

  // 10 — Unassign Task
  pushUnassigned(10, payload.checkedOptionsTaskassignOrNot);

  // 11 — Task Type
  pushMultiSelect(11, payload.checkedOptionsTaskType);

  // 13/14 — Credit / Debit (type: 1=credit, 2=debit, confirmed in
  // accountReportServices.js:149-153). Both checked at once is
  // functionally "no filter" (every row is either 1 or 2), so it's
  // deliberately left out rather than sent as a no-op {op:"in",value:[1,2]}.
  {
    const typeColumn = columnFor(13) || columnFor(14);
    if (typeColumn) {
      const wantCredit = !!payload.initialCheckedShowCreditData;
      const wantDebit = !!payload.initialCheckedShowDebitData;
      if (wantCredit && !wantDebit) filters.push({ column: typeColumn, op: "eq", value: 1 });
      else if (wantDebit && !wantCredit) filters.push({ column: typeColumn, op: "eq", value: 2 });
    }
  }

  // 17 — Stock Type
  pushEquals(17, payload.selectedStockTypeId);

  // 18 — Search Contact. Only the "Normal" mode is translated —
  // "Reference Wise" (referenceWiseContact === 2, filter by everyone this
  // contact referred) would need the inboundFilters/relation machinery,
  // not a plain column filter, and isn't whitelisted for that purpose on
  // any table yet. A reference-wise search silently falls back to
  // filtering by the contact itself rather than erroring — a known,
  // flagged gap, not a silent wrong answer (same contact id either way,
  // just narrower results than the user may expect).
  pushEquals(18, payload.selectedContactId);

  // 19 — Product Search
  pushEquals(19, payload.selectedProductSearchId);

  // 20 — Unassign Contacts
  pushUnassigned(20, payload.checkedOptionsContactassignOrNot);

  // 21 — External Stage/Status: NOT translated. IFilterPayload has no
  // distinct field for it (only checkedOptionsStageStatus, already used by
  // slot 4) — the modal's own state for this slot isn't part of the
  // payload shape submitted to handleSubmit, so there's nothing to read
  // here yet. task_managements.generalFilters[21] stays unreachable
  // through this adapter until that's traced further.

  // 25 — Payment Type (single value, not an array)
  pushEquals(25, payload.checkedPaymentType);

  // 27 — Expense Type
  pushMultiSelect(27, payload.checkedOptionsExpenseType);

  // 28 — Expense Status
  pushMultiSelect(28, payload.checkedOptionsExpenseStatus);

  return filters;
}
