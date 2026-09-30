import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { fieldTypeOptions, IFormBuilderField } from "../FormBuilderController";
import { buildInitialAnswers, colClassFor, FIELD_TYPE_REGISTRY } from "../fieldTypes";
import { typeLabel } from "./fieldHelpers";

export const CANVAS_ID = "canvas";
export const CANVAS_END_ID = "canvas-end";
export const sortId = (f: IFormBuilderField) => `f:${f.id}`;

const noop = () => undefined;

// What the field looks like on the fill screen, drawn with the same
// registry components (disabled, not clickable) so the canvas matches.
const FieldLook: React.FC<{ field: IFormBuilderField }> = ({ field }) => {
  if (field.type === "section-header") return <h5>{field.label || "Untitled section"}</h5>;
  if (field.type === "instruction") {
    return field.content?.trim() ? (
      <div className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
        {field.content}
      </div>
    ) : (
      <div className="fb-canvas-placeholder">Instruction — add the text in the settings panel</div>
    );
  }
  const label = (
    <label className="pb-2 form_label text-truncate d-block">
      {field.label}
      {field.required ? <span className="text-danger"> *</span> : null}
    </label>
  );
  if (field.type === "reference") {
    return (
      <div className="form-group">
        {label}
        <select className="form-control" disabled tabIndex={-1}>
          <option>Select...</option>
        </select>
      </div>
    );
  }
  if (field.type === "repeater") {
    const cols = field.columns || [];
    return (
      <div className="form-group">
        {label}
        <table className="table table-bordered table-sm mb-1">
          <thead>
            <tr>
              {cols.length ? cols.map((c) => <th key={c.id ?? c.key}>{c.label}</th>) : <th className="text-muted fw-normal">No columns yet</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              {(cols.length ? cols : [null]).map((c, i) => (
                <td key={c?.id ?? i}>&nbsp;</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  const Comp = FIELD_TYPE_REGISTRY[field.type];
  const reserved = fieldTypeOptions.find((o) => o.id === field.type)?.comingSoon && field.type !== "auto-number";
  if (!Comp || reserved) return <div className="fb-canvas-placeholder">{typeLabel(field.type)} (coming soon)</div>;
  return <Comp field={field} value={buildInitialAnswers([field])[field.key]} onChange={noop} disabled onFile={noop} />;
};

interface ItemProps {
  field: IFormBuilderField;
  selected: boolean;
  collapsed: boolean;
  hiddenCount: number;
  drop: "before" | "after" | null;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const CanvasItem: React.FC<ItemProps> = ({ field, selected, collapsed, hiddenCount, drop, onSelect, onToggleCollapse, onDuplicate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortId(field) });
  const isSection = field.type === "section-header";
  const cls = [
    "fb-canvas-item",
    isSection ? "fb-canvas-section" : "",
    selected ? "fb-selected" : "",
    isDragging ? "fb-dragging" : "",
    drop ? `fb-drop-${drop}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    // Translate only: fields differ in width, and the grid strategy's scale
    // would squash them while dragging.
    <div className={colClassFor(field)} ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <div
        className={cls}
        {...attributes}
        {...listeners}
        aria-roledescription="form field"
        aria-label={`${typeLabel(field.type)}: ${field.label}. Press Space to pick up and move with the arrow keys.`}
        onClick={onSelect}
        onFocus={onSelect}
      >
        <span className="fb-handle" aria-hidden="true">
          <i className="pi pi-bars" style={{ fontSize: 12 }} />
        </span>
        {selected ? (
          <div className="fb-item-tools" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <button type="button" className="btn btn-sm btn-light" title="Duplicate" onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}>
              <i className="pi pi-copy" />
            </button>
            <button type="button" className="btn btn-sm btn-light text-danger" title="Delete" onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}>
              <i className="pi pi-trash" />
            </button>
          </div>
        ) : null}
        {isSection ? (
          <div className="d-flex align-items-center" style={{ gap: 6, paddingRight: selected ? 64 : 0 }}>
            <button
              type="button"
              className="btn btn-sm btn-link p-0 text-secondary"
              title={collapsed ? "Expand section" : "Collapse section"}
              aria-expanded={!collapsed}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
            >
              <i className={collapsed ? "pi pi-chevron-right" : "pi pi-chevron-down"} />
            </button>
            <h5 className="text-truncate">{field.label || "Untitled section"}</h5>
            {collapsed && hiddenCount ? (
              <small className="text-muted text-nowrap">
                {hiddenCount} field{hiddenCount === 1 ? "" : "s"} hidden
              </small>
            ) : null}
          </div>
        ) : (
          <div className="fb-item-preview" style={{ paddingRight: selected ? 64 : 0 }}>
            <FieldLook field={field} />
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  fields: IFormBuilderField[]; // visible fields only (collapsed sections' members left out)
  hiddenCountFor: (field: IFormBuilderField) => number;
  selectedId: number | null;
  collapsed: Set<number>;
  dropTarget: { id: string; after: boolean } | null;
  paletteDragging: boolean;
  onSelect: (id: number) => void;
  onToggleCollapse: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
}

// Middle panel: the form as it will look (same width → column classes as
// the fill screen), selected field highlighted, drag to reorder (plan A1/A2).
const FormCanvas: React.FC<Props> = ({
  fields,
  hiddenCountFor,
  selectedId,
  collapsed,
  dropTarget,
  paletteDragging,
  onSelect,
  onToggleCollapse,
  onDuplicate,
  onDelete,
}) => {
  // Only live while a palette item is dragged, so keyboard reordering (which
  // walks every enabled droppable) only ever lands on fields.
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_ID, disabled: !paletteDragging });
  const end = useDroppable({ id: CANVAS_END_ID, disabled: !paletteDragging });
  const endHighlighted = paletteDragging && (dropTarget?.id === CANVAS_END_ID || (!fields.length && isOver));
  return (
    <div ref={setNodeRef} className={`fb-canvas${paletteDragging && isOver ? " fb-canvas-over" : ""}`}>
      {!fields.length ? (
        <div className="fb-canvas-empty">
          <i className="pi pi-inbox" style={{ fontSize: 28 }} />
          <div className="mt-2">Drag a field here from the left, or click one to add it.</div>
        </div>
      ) : null}
      <SortableContext items={fields.map(sortId)} strategy={rectSortingStrategy}>
        <div className="row">
          {fields.map((f) => (
            <CanvasItem
              key={f.id}
              field={f}
              selected={f.id === selectedId}
              collapsed={collapsed.has(f.id)}
              hiddenCount={hiddenCountFor(f)}
              drop={paletteDragging && dropTarget?.id === sortId(f) ? (dropTarget.after ? "after" : "before") : null}
              onSelect={() => onSelect(f.id)}
              onToggleCollapse={() => onToggleCollapse(f.id)}
              onDuplicate={() => onDuplicate(f.id)}
              onDelete={() => onDelete(f.id)}
            />
          ))}
        </div>
      </SortableContext>
      <div ref={end.setNodeRef} className={`fb-canvas-end${endHighlighted ? " fb-drop-here" : ""}`} />
    </div>
  );
};

export default FormCanvas;
