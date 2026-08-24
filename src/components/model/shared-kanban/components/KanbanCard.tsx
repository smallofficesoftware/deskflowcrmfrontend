import { Draggable } from "@hello-pangea/dnd";
import React from "react";
import { KanbanItem } from "../types";

interface KanbanCardProps<T extends KanbanItem> {
  item: T;
  index: number;
  renderCard: (item: T) => React.ReactNode;
}

// A dedicated grip icon owns the drag handle instead of the whole card, so
// clicking an action button inside renderCard's content never accidentally
// starts a drag (the bug shared by all 3 original board implementations).
export function KanbanCard<T extends KanbanItem>({
  item,
  index,
  renderCard,
}: KanbanCardProps<T>) {
  return (
    <Draggable draggableId={String(item.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="shared-kanban-card"
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.85 : 1,
          }}
        >
          <span
            {...provided.dragHandleProps}
            className="shared-kanban-drag-handle"
            title="Drag to move"
            aria-label="Drag to move"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.6" />
              <circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" />
              <circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" />
              <circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>
          <div className="shared-kanban-card-content">{renderCard(item)}</div>
        </div>
      )}
    </Draggable>
  );
}
