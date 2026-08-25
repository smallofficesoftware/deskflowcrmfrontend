import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import React, { useCallback, useRef, useState } from "react";
import { useColumnPrefs } from "../hooks/useColumnPrefs";
import { useKanbanDrag } from "../hooks/useKanbanDrag";
import "../styles/shared-kanban.css";
import { KanbanBoardConfig, KanbanColumnDef, KanbanItem } from "../types";
import { KanbanColumn, KanbanColumnSkeleton } from "./KanbanColumn";

interface KanbanBoardProps<T extends KanbanItem> {
  config: KanbanBoardConfig<T>;
  columns: KanbanColumnDef[];
  isColumnsLoading: boolean;
  searchTerm: string;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function KanbanBoard<T extends KanbanItem>({
  config,
  columns,
  isColumnsLoading,
  searchTerm,
  onError,
  onSuccess,
}: KanbanBoardProps<T>) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const {
    orderedColumns,
    visibleColumns,
    hiddenColumnIds,
    toggleColumnVisibility,
    reorderColumns,
  } = useColumnPrefs(config.boardKey, columns);

  const { onDragEnd: onItemDragEnd } = useKanbanDrag({
    config,
    searchTerm,
    onError,
    onSuccess,
  });

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (result.type === "SHARED_KANBAN_COLUMN") {
        if (!result.destination) return;
        reorderColumns(result.source.index, result.destination.index);
        return;
      }
      onItemDragEnd(result);
    },
    [reorderColumns, onItemDragEnd],
  );

  return (
    <div className="shared-kanban-board-wrapper">
      <div className="shared-kanban-board-toolbar">
        <button
          type="button"
          className="shared-kanban-column-picker-toggle"
          onClick={() => setShowColumnPicker((prev) => !prev)}
        >
          Columns ▾
        </button>
        {showColumnPicker && (
          <div className="shared-kanban-column-picker">
            {orderedColumns.map((col) => (
              <label key={col.id} className="shared-kanban-column-picker-row">
                <input
                  type="checkbox"
                  checked={!hiddenColumnIds.includes(String(col.id))}
                  onChange={() => toggleColumnVisibility(col.id)}
                />
                <span
                  className="shared-kanban-color-dot"
                  style={{ backgroundColor: col.color || "#6b7280" }}
                />
                {col.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="shared-kanban-columns"
          type="SHARED_KANBAN_COLUMN"
          direction="horizontal"
        >
          {(provided) => (
            <div
              className="shared-kanban-board"
              ref={(el) => {
                boardRef.current = el;
                provided.innerRef(el);
              }}
              {...provided.droppableProps}
            >
              {isColumnsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <KanbanColumnSkeleton key={i} />
                  ))
                : visibleColumns.map((column, index) => (
                    <Draggable
                      key={column.id}
                      draggableId={`column-${column.id}`}
                      index={index}
                    >
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={{ ...dragProvided.draggableProps.style, flexShrink: 0 }}
                        >
                          <KanbanColumn
                            column={column}
                            config={config}
                            searchTerm={searchTerm}
                            headerDragHandleProps={dragProvided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
