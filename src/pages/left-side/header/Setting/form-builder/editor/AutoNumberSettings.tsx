import React, { useEffect, useState } from "react";
import { IAutoNumberConfig, IFormBuilderField, previewAutoNumber } from "../FormBuilderController";

interface Props {
  field: IFormBuilderField;
  fields: IFormBuilderField[];
  locked: boolean; // published — the first number can't change under saved entries
  onChange: (config: IAutoNumberConfig) => void;
}

const TOKENS: { token: string; help: string }[] = [
  { token: "{PREFIX}", help: "your prefix" },
  { token: "{FY}", help: "financial year, e.g. 2026-2027" },
  { token: "{FYS}", help: "short financial year, e.g. 26-27" },
  { token: "{YYYY}", help: "year, e.g. 2026" },
  { token: "{YY}", help: "year, e.g. 26" },
  { token: "{MM}", help: "month, e.g. 06" },
  { token: "{SEQ}", help: "the running number" },
];

const RESET_OPTIONS: { id: NonNullable<IAutoNumberConfig["reset"]>; label: string }[] = [
  { id: "never", label: "Never — keep counting" },
  { id: "fy", label: "Every financial year (April)" },
  { id: "year", label: "Every year (January)" },
  { id: "month", label: "Every month" },
];

// Editor settings for an Auto Number field (plan item B1–B3): prefix,
// format with click-to-insert parts, first number, digits, reset rule,
// optional separate series per another field's value, and a live example
// from the server (so the financial-year text always matches the real one).
const AutoNumberSettings: React.FC<Props> = ({ field, fields, locked, onChange }) => {
  const config: IAutoNumberConfig = field.auto_number || {};
  const format = config.format ?? "{PREFIX}{SEQ}";
  const reset = config.reset ?? "never";
  const [example, setExample] = useState("");
  const [problem, setProblem] = useState("");
  const [seriesSample, setSeriesSample] = useState("");

  const patch = (p: Partial<IAutoNumberConfig>) => onChange({ ...config, ...p });

  const seriesCandidates = fields.filter((f) => f.key !== field.key && ["dropdown", "radio", "text"].includes(f.type));
  const dateCandidates = fields.filter((f) => ["date", "datetime"].includes(f.type));
  const seriesField = fields.find((f) => f.key === config.series_by);
  const seriesValues = seriesField?.options || [];

  // Debounced live example.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await previewAutoNumber({
        auto_number: { ...config, format },
        fields,
        key: field.key,
        series_value: config.series_by ? seriesSample || seriesValues[0] || "" : "",
      });
      if (cancelled) return;
      if (res?.ack === 1) {
        setExample(res.data?.example || "");
        setProblem("");
      } else {
        setExample("");
        setProblem(res?.ack_msg || "");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config), format, seriesSample, fields.length]);

  return (
    <div>
      <div className="form-group">
        <label className="pb-2 form_label d-block">Prefix</label>
        <input className="form-control" value={config.prefix ?? ""} maxLength={20} placeholder="e.g. ENV" onChange={(e) => patch({ prefix: e.target.value })} />
      </div>

      <div className="form-group">
        <label className="pb-2 form_label d-block">Number format</label>
        <input className="form-control" value={format} onChange={(e) => patch({ format: e.target.value })} />
        <div className="d-flex flex-wrap mt-2" style={{ gap: 4 }}>
          {TOKENS.map((t) => (
            <button key={t.token} type="button" className="btn btn-sm btn-outline-secondary" title={t.help} onClick={() => patch({ format: `${format}${t.token}` })}>
              {t.token}
            </button>
          ))}
        </div>
        <small className="text-muted d-block mt-1">Click a part to add it. Type any other text or symbols (like / or -) yourself.</small>
      </div>

      <div className="form-group">
        <label className="pb-2 form_label d-block">Start again</label>
        <select className="form-control" value={reset} onChange={(e) => patch({ reset: e.target.value as IAutoNumberConfig["reset"] })}>
          {RESET_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <div className="col-6">
          <div className="form-group">
            <label className="pb-2 form_label d-block">First number</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={config.start ?? 1}
              disabled={locked}
              onChange={(e) => patch({ start: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>
        <div className="col-6">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Digits</label>
            <input
              type="number"
              min={1}
              max={10}
              className="form-control"
              value={config.padding ?? 4}
              onChange={(e) => patch({ padding: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
            />
          </div>
        </div>
      </div>

      {dateCandidates.length > 0 ? (
        <div className="form-group">
          <label className="pb-2 form_label d-block">Take the year / month from</label>
          <select className="form-control" value={config.date_field || ""} onChange={(e) => patch({ date_field: e.target.value || null })}>
            <option value="">The day the form is saved</option>
            {dateCandidates.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="form-group">
        <label className="pb-2 form_label d-block">Separate numbering</label>
        <select
          className="form-control"
          value={config.series_by || ""}
          onChange={(e) => patch({ series_by: e.target.value || null, series_prefixes: e.target.value ? config.series_prefixes : {} })}
        >
          <option value="">One series for the whole form</option>
          {seriesCandidates.map((f) => (
            <option key={f.key} value={f.key}>
              Separate series for each “{f.label}”
            </option>
          ))}
        </select>
      </div>

      {config.series_by && seriesValues.length > 0 ? (
        <div className="form-group">
          <label className="pb-2 form_label d-block">Prefix for each “{seriesField?.label}”</label>
          {seriesValues.map((value) => (
            <div key={value} className="d-flex align-items-center mb-1" style={{ gap: 8 }}>
              <span style={{ minWidth: 90 }} className="text-truncate" title={value}>
                {value}
              </span>
              <input
                className="form-control"
                maxLength={20}
                placeholder={value.replace(/\s+/g, "").toUpperCase()}
                value={config.series_prefixes?.[value] ?? ""}
                onChange={(e) => patch({ series_prefixes: { ...(config.series_prefixes || {}), [value]: e.target.value } })}
                onFocus={() => setSeriesSample(value)}
              />
            </div>
          ))}
          <small className="text-muted">Leave blank to use the name itself. Put {"{PREFIX}"} in the format so each series can be told apart.</small>
        </div>
      ) : null}

      <div className="p-2 rounded" style={{ background: "#FFF4EA", border: "1px solid #F5C9A0" }} aria-live="polite">
        <small className="text-muted d-block">Next number will look like</small>
        {problem ? <span className="text-danger">{problem}</span> : <strong style={{ fontFamily: "monospace", fontSize: 16 }}>{example || "…"}</strong>}
      </div>
      <small className="text-muted d-block mt-2">
        The number is given when the form is saved, and is never repeated.{locked ? " The first number can't change after the form is published." : ""}
      </small>
    </div>
  );
};

export default AutoNumberSettings;
