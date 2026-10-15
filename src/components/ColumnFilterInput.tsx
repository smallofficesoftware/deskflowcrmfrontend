import React from "react";

interface ColumnFilterInputProps {
  /** Text currently typed in this box (held by the grid, not by the box). */
  value: string;
  onChange: (value: string) => void;
  /** Enter pressed: the grid applies every column's typed text at once. */
  onEnter: () => void;
}

/**
 * Column filter box for a PrimeReact DataTable `filterElement`. Filters are
 * applied when the user presses Enter, not on every keypress, so typing never
 * reloads the grid or loses what is being typed. The typed text of all boxes
 * lives in the grid, so Enter in any box also applies a box the user emptied
 * earlier without pressing Enter there.
 */
const ColumnFilterInput: React.FC<ColumnFilterInputProps> = ({ value, onChange, onEnter }) => (
  <input
    className="p-inputtext p-component p-column-filter"
    placeholder="Search - press Enter"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") onEnter();
    }}
    style={{ width: "100%" }}
  />
);

export default ColumnFilterInput;
