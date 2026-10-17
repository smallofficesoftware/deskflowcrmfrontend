import React from "react";
import { IFormBuilderField } from "./FormBuilderController";

interface Props {
  column: IFormBuilderField;
  value: any;
  disabled?: boolean;
  onChange: (value: string) => void;
}

// A Dropdown column of a repeating table (one list of choices, one pick per row).
// A saved value that is no longer one of the choices (the column's list was edited
// later) is still shown, so opening an old entry never blanks it out.
const RepeaterDropdownCell: React.FC<Props> = ({ column, value, disabled, onChange }) => {
  const options = column.options || [];
  const current = value == null ? "" : String(value);
  const isUnknown = current !== "" && !options.includes(current);
  return (
    <select className="form-control" aria-label={column.label} value={current} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select</option>
      {isUnknown ? <option value={current}>{current}</option> : null}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
};

export default RepeaterDropdownCell;
