import React from "react";
import { IFormBuilderField } from "../FormBuilderController";
import OptionsEditor from "./OptionsEditor";

// The list of choices of a Dropdown column of a repeating table, edited under the
// column's row with the same editor a Dropdown field uses (add, paste a list,
// reorder, remove).
const ColumnOptionsEditor: React.FC<{ col: IFormBuilderField; onPatch: (patch: Partial<IFormBuilderField>) => void }> = ({ col, onPatch }) => (
  <div className="ps-2 mb-2">
    <div className="small text-muted mb-1">Choices for this column (each row picks one):</div>
    <OptionsEditor options={col.options || []} onChange={(options) => onPatch({ options })} />
  </div>
);

export default ColumnOptionsEditor;
