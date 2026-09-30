import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { PALETTE_GROUPS, typeLabel, TYPE_ICONS } from "./fieldHelpers";

export const PALETTE_PREFIX = "palette:";

const PaletteItem: React.FC<{ type: string; onAdd: (type: string) => void }> = ({ type, onAdd }) => {
  const { setNodeRef, listeners } = useDraggable({ id: `${PALETTE_PREFIX}${type}`, data: { type } });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="fb-palette-item"
      title={`Drag onto the form, or click to add ${typeLabel(type)}`}
      // Pointer drag only; Enter/Space stay a normal click (adds the field
      // below the selected one), which is the keyboard path.
      onPointerDown={listeners?.onPointerDown as React.PointerEventHandler<HTMLButtonElement> | undefined}
      onClick={() => onAdd(type)}
    >
      <i className={TYPE_ICONS[type] || "pi pi-question-circle"} />
      <span>{typeLabel(type)}</span>
    </button>
  );
};

export const PaletteChip: React.FC<{ type: string }> = ({ type }) => (
  <div className="fb-palette-chip">
    <i className={TYPE_ICONS[type] || "pi pi-question-circle"} />
    {typeLabel(type)}
  </div>
);

// Left panel: grouped field types (plan A1). Drag one onto the canvas at a
// position, or click to add it after the selected field.
const FieldPalette: React.FC<{ onAdd: (type: string) => void }> = ({ onAdd }) => (
  <div>
    {PALETTE_GROUPS.filter((g) => g.types.length).map((g) => (
      <div className="fb-palette-group" key={g.title}>
        <div className="fb-palette-group-title">{g.title}</div>
        {g.types.map((t) => (
          <PaletteItem key={t} type={t} onAdd={onAdd} />
        ))}
      </div>
    ))}
  </div>
);

export default FieldPalette;
