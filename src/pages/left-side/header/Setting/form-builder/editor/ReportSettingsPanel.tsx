import React from "react";
import { IFormBuilderField } from "../FormBuilderController";
import { IFormSettings, parseSettings } from "../approval";

interface Props {
  settingsJson: string | null | undefined;
  fields: IFormBuilderField[];
  onSettingsChange: (settings: IFormSettings) => void;
}

// Which date the form's reports filter by (the start / end date on the report
// screen). Left on "Date the entry was submitted" unless a date field is picked.
const ReportSettingsPanel: React.FC<Props> = ({ settingsJson, fields, onSettingsChange }) => {
  const settings = parseSettings(settingsJson);
  const picked: string = settings.reports?.date_field || "";
  const dateFields = fields.filter((f) => f.type === "date" && f.key);

  const pick = (key: string) => {
    const reports = { ...(settings.reports || {}) };
    if (key) reports.date_field = key;
    else delete reports.date_field;
    const next = { ...settings };
    if (Object.keys(reports).length) next.reports = reports;
    else delete next.reports;
    onSettingsChange(next);
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label d-block" htmlFor="fb-report-date-field">
        Date used for report date filter
      </label>
      <select id="fb-report-date-field" className="form-control" value={picked} onChange={(e) => pick(e.target.value)}>
        <option value="">Date the entry was submitted</option>
        {picked && !dateFields.some((f) => f.key === picked) ? <option value={picked}>{picked}</option> : null}
        {dateFields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
      <small className="text-muted d-block mt-1">Reports on this form filter by this date. Takes effect after you publish.</small>
    </div>
  );
};

export default ReportSettingsPanel;
