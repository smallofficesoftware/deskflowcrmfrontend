# Report UI guidelines

How a report screen in this app is built. Derived from the existing reports
(`Customer Sales Purchase Report` is the reference; `Account Outstanding` and
`All Contact Report` follow the same pattern). A new report should look and
behave like these, using the shared pieces below instead of its own markup.

## 1. Files and wiring

- One folder per report: `src/pages/dashboard/Reports/<Report Name>/`
  - `<Name>Report.tsx` (view) and `<Name>Controller.ts` (API calls and types).
- Wire it in three places, nothing else:
  1. `pages/side-view/reportsMenuData.tsx`: label, `value` key, `pageId`, `icon`, one-line `description`.
  2. `pages/side-view/SideView.tsx`: the `canView... && name === "<value>"` branch that sets the active view.
  3. `pages/side-view/BottomView.tsx`: render the component with
     `MobileFlag={isEmbed ? "1" : undefined}` and `onHide={handleonHide}`.
- Flutter lists the same report from `flutter/lib/Screen/Reports/reports_catalog.dart`
  (same `key`, same `pageId`). It opens the web report in a WebView with
  `isEmbed` set, so every report must work in the embedded/mobile layout.

## 2. Page structure (top to bottom)

1. **Header bar**: title on the left, tools on the right.
2. **Summary cards** (KPI row), if the report has totals.
3. **`AppliedFilterBar`**: shows the active period and filter chips.
4. **Table card**: `report_card` containing one PrimeReact `DataTable`.
5. **Filter modal** (`CheckBoxFilterModal`), opened from the header.

## 3. Header bar

- Wrapper: `d-flex align-items-center justify-content-between gap-2 mb-3`.
  When `MobileFlag` is set use `flex-column align-items-start` and a 10px left padding.
- Title: `<h3 className="dash-board-text-count" style={{ fontSize: "20px" }}>`.
- Tools, in this order, all round PrimeReact `Button`s with class
  `report_button`, background `#4C4C4C`, and a tooltip (`position: "top"`, 14px):
  1. Search box: `form-control` input (Enter to search) + clear "x" + search button.
     Placeholder `Search Anything in This Report` (`Search in This Report` on mobile).
  2. Filter button (`pi-filter`, `pi-filter-slash` while a filter is applied).
  3. Refresh (`pi-refresh`).
  4. More menu (`pi-ellipsis-v`, hidden when `MobileFlag`): `labelDropLeft` list with
     Export Excel, Export PDF, Print.
  5. `ColumnsButton` (show / hide / reorder / reset columns) where the table has many columns.
- Orange (`#f58634`) is for the primary "Add" action and the **active tab**. Do not
  use it for filters or any other header tool.

## 4. Date range and filters

- Never put raw `<input type="date">` boxes on a report. The period comes from the
  shared filter store and the filter modal:
  - `useCommonFilterStore` with a stable report key, e.g. `getFilter("warehouse_transfer")`.
  - Default period is the **current month** (set once on mount if the store has none).
  - `selectedDates` may be passed in as a prop (the app's own period control); it wins
    over the store.
- Filter modal: `CheckBoxFilterModal` with `filtersToShow`. Codes used so far:
  `1` date range, `2` label, `3` source type, `4` stage and status, `5` team member,
  `15` series, `16` warehouse. Pass `pageId`, the `initial...` values from the store,
  and a `title` / `message` (`Filter <Report Name>` / `Filter report by ...`).
- `handleApplyFilters` writes the result back to the store, always keeping a
  start and end date, then closes the modal.
- Show the result with `<AppliedFilterBar summary dateRange startDate endDate />`.
- Reload data whenever the period, the filters or the debounced search text change
  (debounce search at 400 ms).

### Tabs (views inside one report)

- Use the app's pill tabs, as in BOM master: a full-width row
  `d-flex align-items-center justify-content-between mb-3` holding
  `<nav className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2" style={{ width: "100%" }}>`.
- Each tab is `<button type="button" className="flex-sm-fill text-sm-center nav-link">`
  with its label in `<span className="m-1">`.
- Style: active `backgroundColor #f58634`, `color #ffffff`, no border; inactive
  transparent, `color #000000`, `border 1px solid #ccc`; `boxShadow: "none"`.
- Place tabs below the filter bar and above the table card. Do not use PrimeReact
  `Button`s as tabs.

## 5. Summary cards

- Bootstrap row of `col-md-3` cards: `card shadow-sm border-0 bg-light p-3 text-center`,
  label `text-muted small`, value `<h5 className="fw-bold mb-0 ...">`.
- Colour only carries meaning: `text-success` for positive, `text-danger` for negative,
  `text-primary` for a plain count, `text-dark` otherwise.
- Money: `toLocaleString("en-IN", { minimumFractionDigits: 2 })` with the currency
  symbol; negative balances as `(₹1,234.00)`. Quantities: `en-IN`, no symbol.

## 6. Table

- Inside `<div className="report_card" style={{ height: "75vh", display: "flex", flexDirection: "column" }}>`.
- `DataTable` props: `className="custom-centered-table"`,
  `tableStyle={{ tableLayout: "fixed", width: "100%" }}`, `resizableColumns`,
  `columnResizeMode="fit"`, `scrollable`, `scrollHeight="65vh"`, `filterDisplay="row"`,
  `paginator` with
  `paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"`,
  `currentPageReportTemplate="Total Records: {totalRecords}"`, `rows={50}`,
  `rowsPerPageOptions={[25, 50, 100, 200]}`, `emptyMessage="No records found"`,
  spinner `loadingIcon`.
- Every column: `sortable`, row `filter` (`filterPlaceholder="Search"`, `contains`),
  header style `{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width }`,
  body style `{ fontSize: "14px" }`.
- First column is `S.No`. A multi-select checkbox column is shown only when
  `MobileFlag` is not set.
- Badges use Bootstrap `badge bg-*`; signed numbers use `text-success fw-bold` /
  `text-danger fw-bold`.
- Large data: lazy (server paging) with `first`, `rows`, `totalRecords`. Small
  data sets may load fully and page on the client.
- Columns come from a `ColumnDef[]` list through `useColumnPreferences("<report_key>", defs)`
  so the user's column choice is remembered.

### Action columns (a button per row)

A column that only holds a button (Action, Details, Open chat, Edit) is not data, so it is
built differently from the data columns. Reference: the `Action` column of
`Reports/All Contact Report` (`actionBodyTemplate`).

- **No sorting, no search box, no filter** on it: leave out `sortable`, `filter` and
  `filterField`. It is its own `<Column>`, not part of the data-column `.map`.
- Header: text such as `Action` or `Details`, `headerClassName="center-header"`, a fixed narrow
  width (`70px`), sticky like the other headers.
- Body: the icon is **centred** in the cell, in a
  `<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>` holding a
  text-style PrimeReact `Button` (`className="p-button-text"`, `style={{ color: "green", width: "2rem" }}`,
  an icon, `tooltip` with `position: "left"`, an `aria-label`). Call `e.stopPropagation()` in
  `onClick` so the row's own click or selection does not also fire.
- Where it sits: right after the selection checkbox column, before the data columns (Action
  first, as in All Contact Report) - or last when it is the only place for it, but be consistent
  within the report. If it is a `ColumnDef` for `useColumnPreferences`, mark it `locked: true` so
  it stays in place and cannot be hidden or dragged.
- Leave it out of Print and the Excel / PDF exports (it has no value): build an
  `exportColumns` list without it.

## 7. Export and print

- Excel / PDF: `exportReportExcel` / `exportReportPdf` from
  `services/reportExportService`, with `reportType`, `filters`, `columns`
  (`visibleColumns`), `fileName` and, when the rows are already loaded or selected,
  `rows` (the server then needs no registry entry). Selected rows win over all rows.
- Print: use `printReportTable(title, columns, rows)` from
  `components/report/printReportTable` (a print window with the title and a table of
  the visible columns; pass the selected rows, or all rows if none are selected).
  Older reports such as Customer Sales Purchase carry their own copy of this code.
- Gate with the page's `PERMISSION_TYPE.SHARE` (export) and `PERMISSION_TYPE.PRINT`
  (print); on failure show `DEFAULT_MESSAGE_ERROR_PERMISSION` through `toast.error`.

## 8. Permissions, keyboard, errors

- `useCheckUserPermission(PAGE_ID.<PAGE>, PERMISSION_TYPE.VIEW)`; without it render
  `<div className="alert alert-danger m-4" role="alert">{DEFAULT_MESSAGE_ERROR_PERMISSION}</div>`
  and do not call the API.
- `useEscapeKey` closes an open dropdown first, then calls `onHide`.
- API errors go to `toast.error(...)`; loading is a `loading` flag on the table,
  never a blocking dialog.
- **Confirmations** (delete, revoke, regenerate a key, anything that cannot be undone or
  breaks something that works today) use the shared `ConfirmationModal`
  (`components/model/ConfirmationModal`), never `window.confirm`. Keep the pending action
  in state (`const [confirmAction, setConfirmAction] = useState<"x" | null>(null)`), open the
  modal from the button, and run the action from `handleSubmit`. Props: `title` names the
  action (`Revoke connector key`), `message` says what happens
  (`The connector stops syncing until you issue a new one.`), `btn1="Cancel"`, `btn2` is the
  verb (`Revoke`, `Generate`, `Delete`). Reference: `Setting/tally/TallySettingsView.tsx`
  (connector key) and `Setting/main-settings/MainSettingsView.tsx`.

## 9. Mobile / embedded (`MobileFlag`)

- Stack the header vertically, narrow the search box (285 px wrapper / 220 px input),
  hide the more menu and the selection column. Test the report at phone width,
  because Flutter shows it in a WebView.

## 10. Lookup reports (search by one value)

Some reports answer one question ("where is serial number X?") instead of listing a
period. They follow the same page, but:

- The header search box is the lookup box: placeholder `Enter Serial Number`, Enter or
  the round search button runs the query, the "x" clears the result. Do not use an
  orange `btn btn-primary` Search button.
- Nothing is loaded until a value is searched. Empty table text before the search is
  `Enter Serial Number and click Search`; after a search with no rows it is
  `No records found`.
- Summary cards show the result's headline (status, balance, opening / in / out /
  closing). Do not print them as loose `small` / `<b>` text.
- Date range and warehouse stay in the filter modal; changing them re-runs the last
  successful lookup. Refresh re-runs it too.
- Extra result sets (e.g. task or visit history) are tabs (section 3), not extra tables
  stacked under the first one. Put the row count in the tab label.
- A phone card list is allowed for the main movement list under `MobileFlag`, but
  header, cards and tabs stay the same.

Reference implementations: `Reports/Serial Number Trace` and
`Reports/Serial Number Stock Check`.

## 11. Do not

- Invent a new layout, spacing, colours or buttons for a single report.
- Add your own date pickers or export code when the shared filter modal / export
  service covers it.
- Use the app orange for anything except the primary add action.
- Use `window.confirm`, `window.alert` or `window.prompt`; use `ConfirmationModal` and
  `toast` (section 8).
- Hide meaning in colour alone: put a sign or a label next to green / red values.

## Checklist for a new report

- [ ] Folder, view and controller named like the others; wired in the three places.
- [ ] Header bar, summary cards, `AppliedFilterBar`, `report_card` table, in that order.
- [ ] Period and filters through `useCommonFilterStore` and `CheckBoxFilterModal`.
- [ ] Current month by default; search debounced; reloads on filter change.
- [ ] Sortable, row-filterable, sticky-header columns; `S.No` first.
- [ ] Button columns (Action / Details) follow "Action columns": no sort / search / filter,
      icon centred, left out of Print and exports.
- [ ] Export (Excel, PDF) and Print behind the right permissions.
- [ ] No view right: alert and no API call.
- [ ] Destructive actions confirm through `ConfirmationModal`, not `window.confirm`.
- [ ] Works with `MobileFlag` (phone width).
- [ ] Flutter catalog entry added with the same key and page id.
