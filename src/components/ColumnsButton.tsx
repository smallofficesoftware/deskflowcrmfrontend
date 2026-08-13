import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "primereact/button";
import { useEffect, useRef, useState } from "react";
import { ColumnDef } from "../hooks/useColumnPreferences";

interface ColumnsButtonProps {
  columns: ColumnDef[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
  onReorder: (newOrder: string[]) => void;
  onReset: () => void;
}

const applyReorder = (
  fullOrder: string[],
  lockedKeys: Set<string>,
  newDraggableOrder: string[],
): string[] => {
  let i = 0;
  return fullOrder.map((key) =>
    lockedKeys.has(key) ? key : newDraggableOrder[i++],
  );
};

const SortableRow = ({
  column,
  hidden,
  onToggle,
}: {
  column: ColumnDef;
  hidden: boolean;
  onToggle: (key: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: column.key });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 10px",
        listStyle: "none",
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", color: "#999" }}
      >
        <i className="pi pi-bars" style={{ fontSize: "12px" }} />
      </span>
      <input
        type="checkbox"
        checked={!hidden}
        onChange={() => onToggle(column.key)}
      />
      <span style={{ fontSize: "13px" }}>{column.label}</span>
    </li>
  );
};

const ColumnsButton = ({
  columns,
  hiddenKeys,
  onToggle,
  onReorder,
  onReset,
}: ColumnsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const draggable = columns.filter((c) => !c.locked);
  const locked = columns.filter((c) => c.locked);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggableKeys = draggable.map((c) => c.key);
    const oldIndex = draggableKeys.indexOf(String(active.id));
    const newIndex = draggableKeys.indexOf(String(over.id));

    const newDraggableOrder = arrayMove(draggableKeys, oldIndex, newIndex);
    const fullOrder = columns.map((c) => c.key);

    onReorder(
      applyReorder(fullOrder, new Set(locked.map((c) => c.key)), newDraggableOrder),
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Button
        icon="pi pi-sliders-h"
        className="report_button"
        style={{ backgroundColor: "#4C4C4C" }}
        rounded
        onClick={() => setIsOpen((prev) => !prev)}
        tooltip="Columns"
        tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
      />

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "40px",
            zIndex: 1000,
            width: "220px",
            maxHeight: "320px",
            overflowY: "auto",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            padding: "6px 0",
          }}
        >
          {locked.length > 0 && (
            <ul style={{ margin: 0, padding: 0 }}>
              {locked.map((column) => (
                <li
                  key={column.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 10px",
                    listStyle: "none",
                    color: "#999",
                    fontSize: "13px",
                  }}
                >
                  <i className="pi pi-lock" style={{ fontSize: "11px" }} />
                  {column.label}
                </li>
              ))}
            </ul>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={draggable.map((c) => c.key)}
              strategy={verticalListSortingStrategy}
            >
              <ul style={{ margin: 0, padding: 0 }}>
                {draggable.map((column) => (
                  <SortableRow
                    key={column.key}
                    column={column}
                    hidden={hiddenKeys.has(column.key)}
                    onToggle={onToggle}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div
            role="button"
            onClick={onReset}
            style={{
              padding: "8px 10px",
              borderTop: "1px solid #eee",
              fontSize: "12px",
              color: "#4C4C4C",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Reset Columns
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnsButton;
