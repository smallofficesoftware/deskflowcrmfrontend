import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import FormBuilderBrandStyles from "../formBuilderBrandStyles";
import { getImportColumns, IImportColumn, IImportRowResult, runImport } from "../FormBuilderController";
import { autoMapColumns, buildImportRows, chunk, ColumnMapping, downloadSampleSheet, readSheetFile } from "./importSheet";

interface Props {
  formId: number;
  onClose: () => void;
}

type Step = "start" | "map" | "check" | "done";
type Row = { row_number: number; cells: Record<string, any> };

// Bring in old paper records from Excel (plan Q3/Q4): download a sample sheet,
// fill it (or use your own sheet), match the columns, check every row, then
// import the rows that are fine. Every row goes through the same rules as a
// normal entry, so nothing invalid gets in.
const ImportEntriesView: React.FC<Props> = ({ formId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [formTitle, setFormTitle] = useState("");
  const [columns, setColumns] = useState<IImportColumn[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [canKeepNumbers, setCanKeepNumbers] = useState(false);
  const [chunkSize, setChunkSize] = useState(500);
  const [step, setStep] = useState<Step>("start");

  const [fileName, setFileName] = useState("");
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sheetRows, setSheetRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<IImportRowResult[]>([]);
  const [working, setWorking] = useState(false);
  const [imported, setImported] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getImportColumns(formId);
      if (res?.ack === 1) {
        setFormTitle(res.data.form_title);
        setColumns(res.data.columns || []);
        setSkipped(res.data.skipped_fields || []);
        setCanKeepNumbers(!!res.data.can_keep_numbers);
        setChunkSize(res.data.max_rows_per_request || 500);
      }
      setLoading(false);
    })();
  }, [formId]);

  const unmappedRequired = useMemo(() => columns.filter((c) => c.required && (mapping[c.key] ?? -1) < 0), [columns, mapping]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const sheet = await readSheetFile(file);
      if (!sheet.headers.length || !sheet.rows.length) {
        toast.error("The sheet is empty — put the column headings in the first row and the entries below them");
        return;
      }
      setFileName(file.name);
      setSheetHeaders(sheet.headers);
      setSheetRows(sheet.rows);
      setMapping(autoMapColumns(columns, sheet.headers));
      setStep("map");
    } catch {
      toast.error("This file could not be read. Please use an Excel file (.xlsx or .xls)");
    }
  };

  const runChecks = async (dryRun: boolean, toSend: Row[]): Promise<IImportRowResult[] | null> => {
    const all: IImportRowResult[] = [];
    const label = `import ${fileName}`.slice(0, 100);
    for (const part of chunk(toSend, chunkSize)) {
      const res = await runImport(formId, part, dryRun, label);
      if (res?.ack !== 1) return null;
      all.push(...(res.data.results || []));
    }
    return all;
  };

  const checkRows = async () => {
    const built = buildImportRows(sheetRows, columns, mapping);
    if (!built.length) {
      toast.error("No entries found under the columns you matched");
      return;
    }
    setWorking(true);
    const found = await runChecks(true, built);
    setWorking(false);
    if (!found) return;
    setRows(built);
    setResults(found);
    setStep("check");
  };

  const importValid = async () => {
    const okNumbers = new Set(results.filter((r) => r.ok).map((r) => r.row_number));
    const toSend = rows.filter((r) => okNumbers.has(r.row_number));
    setWorking(true);
    const done = await runChecks(false, toSend);
    setWorking(false);
    if (!done) return;
    const failedNow = done.filter((r) => !r.ok);
    // Rows that failed the first check stay in the list so the report is complete.
    const failedBefore = results.filter((r) => !r.ok);
    setResults([...failedBefore, ...failedNow, ...done.filter((r) => r.ok)].sort((a, b) => a.row_number - b.row_number));
    setImported(done.filter((r) => r.ok).length);
    setStep("done");
  };

  const okCount = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  if (loading) return <div className="p-3">Loading...</div>;

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{formTitle} — Import from Excel</h4>
        <button className="btn btn-link" onClick={onClose}>
          Back
        </button>
      </div>

      {step === "start" ? (
        <div>
          <ol className="mb-3">
            <li>Download the sample sheet. It has one column for each question in this form.</li>
            <li>Type or paste your old records under the headings (one entry per row). You can also use your own sheet — you will match the columns next.</li>
            <li>Upload it here. Every row is checked before anything is saved.</li>
          </ol>
          <button className="btn btn-outline-secondary me-2 mb-2" onClick={() => downloadSampleSheet(formTitle, columns)} disabled={!columns.length}>
            Download sample sheet
          </button>
          <div className="mb-3">
            <label className="pb-1 form_label d-block" htmlFor="fb-import-file">
              Your Excel file
            </label>
            <input id="fb-import-file" type="file" className="form-control" accept=".xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
          </div>
          <ul className="small text-muted">
            <li>Dates: write them like 25-12-2026. Yes/No questions: write Yes or No. Choice questions: write one of the listed options.</li>
            {canKeepNumbers ? <li>The auto-number column keeps the old number from your sheet; leave it empty to give a new number.</li> : <li>Numbers (like receipt or enquiry numbers) are given automatically, in order.</li>}
            {skipped.length ? <li>These can't be imported and will stay empty: {skipped.join(", ")}.</li> : null}
            <li>Importing the same file twice creates the entries twice.</li>
          </ul>
        </div>
      ) : null}

      {step === "map" ? (
        <div>
          <p>
            <strong>{fileName}</strong> — {sheetRows.length} rows found. Match each question with the column of your sheet that holds its answer.
          </p>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Question in the form</th>
                <th>Column in your sheet</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c) => (
                <tr key={c.key}>
                  <td>
                    {c.label}
                    {c.required ? <span className="text-danger"> *</span> : null}
                  </td>
                  <td>
                    <select
                      className="form-control form-control-sm"
                      aria-label={`Sheet column for ${c.label}`}
                      value={mapping[c.key] ?? -1}
                      onChange={(e) => setMapping({ ...mapping, [c.key]: Number(e.target.value) })}
                    >
                      <option value={-1}>— not in my sheet —</option>
                      {sheetHeaders.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `(column ${i + 1})`}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {unmappedRequired.length ? (
            <div className="alert alert-warning">
              Not matched yet, but required: {unmappedRequired.map((c) => c.label).join(", ")}. Rows without these will be reported as problems.
            </div>
          ) : null}
          <button className="btn btn-link" onClick={() => setStep("start")}>
            Choose another file
          </button>
          <button className="btn fb-btn-primary" disabled={working} onClick={checkRows}>
            {working ? "Checking..." : "Check the rows"}
          </button>
        </div>
      ) : null}

      {step === "check" ? (
        <div>
          <div className={`alert ${failed.length ? "alert-warning" : "alert-success"}`}>
            {okCount} of {results.length} rows are ready to import.
            {failed.length ? ` ${failed.length} have problems and will be left out — fix them in your sheet and import them again.` : ""}
          </div>
          {failed.length ? <FailedRows failed={failed} /> : null}
          <button className="btn btn-link" onClick={() => setStep("map")}>
            Back to matching
          </button>
          <button className="btn fb-btn-primary" disabled={working || okCount === 0} onClick={importValid}>
            {working ? "Importing..." : `Import ${okCount} ${okCount === 1 ? "entry" : "entries"}`}
          </button>
        </div>
      ) : null}

      {step === "done" ? (
        <div>
          <div className="alert alert-success">{imported} entries imported.</div>
          {failed.length ? (
            <>
              <p>These rows were not imported:</p>
              <FailedRows failed={failed} />
            </>
          ) : null}
          <button className="btn fb-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
};

const FailedRows: React.FC<{ failed: IImportRowResult[] }> = ({ failed }) => (
  <div className="table-responsive mb-3" style={{ maxHeight: 360, overflowY: "auto" }}>
    <table className="table table-sm">
      <thead>
        <tr>
          <th style={{ width: 90 }}>Row</th>
          <th>Problem</th>
        </tr>
      </thead>
      <tbody>
        {failed.slice(0, 200).map((r) => (
          <tr key={r.row_number}>
            <td>{r.row_number}</td>
            <td>{(r.errors || []).join("; ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {failed.length > 200 ? <small className="text-muted">Showing the first 200 of {failed.length} problems.</small> : null}
  </div>
);

export default ImportEntriesView;
