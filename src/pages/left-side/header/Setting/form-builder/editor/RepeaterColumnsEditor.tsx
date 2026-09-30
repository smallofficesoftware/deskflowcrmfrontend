import React from "react";
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IFormBuilderField } from "../FormBuilderController";
import { keyFromLabel, newFieldId, REPEATER_COLUMN_TYPES, typeLabel, uniqueKey } from "./fieldHelpers";
import { FormulaBox } from "./CalculationSettings";
import ConditionEditor from "./ConditionEditor";

interface Props {
  columns: IFormBuilderField[];
  onChange: (columns: IFormBuilderField[], tag?: string) => void;
  // Keys used anywhere else in the form (other fields + other repeaters' columns).
  otherKeys: Set<string>;
  publishedKeys: Set<string>;
  // Top-level fields a column formula may use ([tax] etc.).
  topChoices?: { ref: string; label: string }[];
  // The form's own (non-repeater) fields, for "show only when" rules on columns.
  topFields?: IFormBuilderField[];
}

const PRODUCT_FILL_OPTIONS = [
  { column: "rate", label: "Rate / price" },
  { column: "unit", label: "Unit" },
  { column: "product_code", label: "Product code" },
];

// "When a product is picked, copy its rate / unit / code into these columns" —
// still editable in the row afterwards (plan N5).
const ProductFillMap: React.FC<{ col: IFormBuilderField; siblings: IFormBuilderField[]; onPatch: (patch: Partial<IFormBuilderField>) => void }> = ({ col, siblings, onPatch }) => {
  const map = col.product_fill_map || {};
  const targets = siblings.filter((c) => c.key && ["text", "number", "currency"].includes(c.type));
  const set = (productColumn: string, key: string) => {
    const next = { ...map };
    if (key) next[productColumn] = key;
    else delete next[productColumn];
    onPatch({ product_fill_map: Object.keys(next).length ? next : undefined });
  };
  return (
    <div className="ps-2 mb-2">
      <div className="small text-muted mb-1">When a product is picked, fill these columns from it (they stay editable):</div>
      {PRODUCT_FILL_OPTIONS.map((o) => (
        <div key={o.column} className="d-flex align-items-center gap-2 mb-1">
          <span style={{ width: 110 }} className="small">
            {o.label} →
          </span>
          <select className="form-control form-control-sm" value={map[o.column] || ""} aria-label={`Column for ${o.label}`} onChange={(e) => set(o.column, e.target.value)}>
            <option value="">Don't fill</option>
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

const ColumnRow: React.FC<{
  col: IFormBuilderField;
  index: number;
  count: number;
  locked: boolean;
  onLabel: (label: string) => void;
  onType: (type: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onFormula: (formula: string) => void;
  onPatch: (patch: Partial<IFormBuilderField>) => void;
  // Fields a "show only when" rule on this column may look at: this row's other columns + the form's fields.
  ruleSources: IFormBuilderField[];
  // What a formula in this column may use: sibling columns and top-level fields.
  choices: { ref: string; label: string }[];
  // The other columns of this table, for the "fill from product" mapping.
  siblings: IFormBuilderField[];
}> = ({ col, index, count, locked, onLabel, onType, onMove, onRemove, onFormula, onPatch, ruleSources, choices, siblings }) => {
  const [showRules, setShowRules] = React.useState(!!col.conditions || !!col.required_conditions);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `col:${col.id}` });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}>
    <div className="fb-col-row">
      <span className="fb-handle" {...attributes} {...listeners} aria-label={`Drag to reorder column ${col.label}`}>
        <i className="pi pi-bars" style={{ fontSize: 12 }} />
      </span>
      <input
        className={`form-control form-control-sm fb-flex-input${!col.label.trim() ? " is-invalid" : ""}`}
        value={col.label}
        placeholder="Column name"
        aria-label="Column name"
        onChange={(e) => onLabel(e.target.value)}
      />
      <select className="form-control form-control-sm" value={col.type} disabled={locked} aria-label="Column type" onChange={(e) => onType(e.target.value)}>
        {REPEATER_COLUMN_TYPES.concat(REPEATER_COLUMN_TYPES.includes(col.type) ? [] : [col.type]).map((t) => (
          <option key={t} value={t}>
            {t === "reference" ? "Product (from list)" : typeLabel(t)}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-sm btn-outline-secondary" title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" className="btn btn-sm btn-outline-secondary" title="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
        ↓
      </button>
      <button type="button" className="btn btn-sm btn-outline-danger" title="Remove column" onClick={onRemove}>
        ✕
      </button>
    </div>
      <button type="button" className="btn btn-sm btn-link px-0" onClick={() => setShowRules(!showRules)} aria-expanded={showRules}>
        {showRules ? "Hide rules" : "Show / hide rules"}
        {col.conditions || col.required_conditions ? " •" : ""}
      </button>
      {showRules ? (
        <div className="ps-2 mb-2">
          <ConditionEditor
            title="Show this column only when"
            hint="always shown"
            group={col.conditions}
            field={col}
            fields={ruleSources}
            onChange={(conditions) => onPatch({ conditions })}
          />
          {col.type !== "calculation" ? (
            <ConditionEditor
              title="Make this required only when"
              hint="not required unless the field is set to required"
              group={col.required_conditions}
              field={col}
              fields={ruleSources}
              onChange={(required_conditions) => onPatch({ required_conditions })}
            />
          ) : null}
        </div>
      ) : null}
      {col.type === "reference" ? <ProductFillMap col={col} siblings={siblings} onPatch={onPatch} /> : null}
      {col.type === "calculation" ? <FormulaBox id={`fb-colformula-${col.id}`} value={col.formula || ""} choices={choices} onChange={onFormula} /> : null}
    </div>
  );
};

// Columns of a repeating table: add / rename / change type / remove and
// reorder by drag (mouse, touch or keyboard: focus the handle, Space, arrows,
// Space) or the ↑ ↓ buttons.
const RepeaterColumnsEditor: React.FC<Props> = ({ columns, onChange, otherKeys, publishedKeys, topChoices = [], topFields = [] }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const keysExcept = (skip: number) => {
    const taken = new Set(otherKeys);
    columns.forEach((c, i) => i !== skip && c.key && taken.add(c.key));
    return taken;
  };

  const setLabel = (i: number, label: string) => {
    const col = columns[i];
    const key = publishedKeys.has(col.key) ? col.key : uniqueKey(keyFromLabel(label), keysExcept(i));
    onChange(
      columns.map((c, j) => (j === i ? { ...c, label, key } : c)),
      `col-label:${col.id}`,
    );
  };
  // A "reference" column is always the product list (plan N5) — nothing else.
  const setType = (i: number, type: string) =>
    onChange(
      columns.map((c, j) =>
        j === i
          ? { ...c, type, ...(type === "calculation" && c.formula === undefined ? { formula: "", decimals: 2 } : {}), ...(type === "reference" ? { master: "product" } : {}) }
          : c,
      ),
    );
  const setFormula = (i: number, formula: string) => onChange(columns.map((c, j) => (j === i ? { ...c, formula } : c)), `col-formula:${columns[i].id}`);
  // Formula pieces for a calculation column: the other columns of this table
  // (this row) and the form's own top-level fields.
  const choicesFor = (i: number) => [
    ...columns.filter((c, j) => j !== i && c.key && c.type !== "file" && c.type !== "image").map((c) => ({ ref: c.key, label: `This row → ${c.label}` })),
    ...topChoices,
  ];
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= columns.length) return;
    onChange(arrayMove(columns, i, t));
  };
  const remove = (i: number) => onChange(columns.filter((_, j) => j !== i));
  const add = () => {
    const label = `Column ${columns.length + 1}`;
    onChange([...columns, { id: newFieldId(), key: uniqueKey(keyFromLabel(label), keysExcept(-1)), type: "text", label }]);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = columns.findIndex((c) => `col:${c.id}` === active.id);
    const to = columns.findIndex((c) => `col:${c.id}` === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(columns, from, to));
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label d-block">Columns</label>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={columns.map((c) => `col:${c.id}`)} strategy={verticalListSortingStrategy}>
          {columns.map((col, i) => (
            <ColumnRow
              key={col.id}
              col={col}
              index={i}
              count={columns.length}
              locked={publishedKeys.has(col.key)}
              onLabel={(l) => setLabel(i, l)}
              onType={(t) => setType(i, t)}
              onMove={(d) => move(i, d)}
              onRemove={() => remove(i)}
              onFormula={(f) => setFormula(i, f)}
              onPatch={(patch) => onChange(columns.map((c, j) => (j === i ? { ...c, ...patch } : c)), `col-rule:${col.id}`)}
              ruleSources={[...columns.filter((c, j) => j !== i), ...topFields]}
              choices={choicesFor(i)}
              siblings={columns.filter((c, j) => j !== i)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {!columns.length ? <div className="text-danger small">Add at least one column.</div> : null}
      <button type="button" className="btn btn-sm fb-btn-outline-primary mt-1" onClick={add}>
        + Add column
      </button>
    </div>
  );
};

export default RepeaterColumnsEditor;
