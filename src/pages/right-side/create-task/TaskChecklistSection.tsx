import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import React, { useEffect, useState } from "react";
import {
  createChecklistItem,
  deleteChecklistItem,
  fetchTaskChecklist,
  IChecklistItem,
  reorderChecklistItems,
  updateChecklistItem,
} from "./CreateTaskController";

interface TaskChecklistSectionProps {
  taskId?: number;
  // Add-mode support: while the task doesn't exist yet (no taskId), items are
  // held here as plain titles and only get created via the API once the
  // parent form submits successfully and hands back the new task_id.
  pendingItems?: string[];
  onPendingItemsChange?: (items: string[]) => void;
}

const ChecklistRow: React.FC<{
  index: number;
  title: string;
  done: boolean;
  dragHandleProps?: any;
  onToggle?: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}> = ({ index, title, done, dragHandleProps, onToggle, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const startEdit = () => {
    setEditValue(title);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    }
  };

  return (
    <div
      className="d-flex align-items-center mb-2 px-2 py-1"
      style={{ background: "#f8f9fa", borderRadius: "6px", border: "1px solid #e9ecef" }}
    >
      {dragHandleProps && (
        <span {...dragHandleProps} style={{ cursor: "grab", color: "#999", marginRight: "8px" }}>
          <i className="pi pi-bars" style={{ fontSize: "12px" }} />
        </span>
      )}
      {onToggle && (
        <input type="checkbox" checked={done} onChange={onToggle} style={{ marginRight: "8px" }} />
      )}
      <span style={{ color: "#999", marginRight: "6px", fontSize: "0.9rem", flexShrink: 0 }}>
        {index}.
      </span>
      {isEditing ? (
        <input
          type="text"
          autoFocus
          className="form-control form-control-sm"
          style={{ flex: 1, marginRight: "8px" }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            } else if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <span
          onClick={startEdit}
          title="Click to edit"
          style={{
            flex: 1,
            cursor: "text",
            textDecoration: done ? "line-through" : "none",
            color: done ? "#999" : "inherit",
          }}
        >
          {title}
        </span>
      )}
      <span
        className="text-danger"
        style={{ cursor: "pointer", fontSize: "0.9rem", marginLeft: "6px" }}
        title="Remove"
        onClick={onDelete}
      >
        🗑
      </span>
    </div>
  );
};

const TaskChecklistSection: React.FC<TaskChecklistSectionProps> = ({
  taskId,
  pendingItems,
  onPendingItemsChange,
}) => {
  const [items, setItems] = useState<IChecklistItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    fetchTaskChecklist(taskId)
      .then((result) => setItems(result))
      .finally(() => setIsLoading(false));
  }, [taskId]);

  // ── Add mode: task not saved yet, work off the pendingItems prop ──────────
  if (!taskId) {
    const pending = pendingItems ?? [];

    const handlePendingAdd = () => {
      const title = newTitle.trim();
      if (!title) return;
      onPendingItemsChange?.([...pending, title]);
      setNewTitle("");
    };

    const handlePendingDelete = (index: number) => {
      onPendingItemsChange?.(pending.filter((_, i) => i !== index));
    };

    const handlePendingRename = (index: number, newTitle: string) => {
      onPendingItemsChange?.(pending.map((t, i) => (i === index ? newTitle : t)));
    };

    return (
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center pb-2 mb-1">
          <label className="form_label mb-0">Checklist</label>
          {pending.length > 0 && (
            <span className="text-muted" style={{ fontSize: "12px" }}>
              {pending.length} item{pending.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {pending.map((title, index) => (
          <ChecklistRow
            key={index}
            index={index + 1}
            title={title}
            done={false}
            onDelete={() => handlePendingDelete(index)}
            onRename={(newTitle) => handlePendingRename(index, newTitle)}
          />
        ))}

        <div className="d-flex gap-2 mt-1">
          <input
            type="text"
            className="form-control"
            placeholder="Add checklist item"
            style={{ marginBottom: "0px" }}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handlePendingAdd();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary px-3 py-2 text-light form_label rounded-1"
            style={{ whiteSpace: "nowrap", backgroundColor: "rgb(245, 134, 52)" }}
            disabled={!newTitle.trim()}
            onClick={handlePendingAdd}
          >
            + Add
          </button>
        </div>
        <p className="text-muted mt-1" style={{ fontSize: "12px" }}>
          Saved once you save the task.
        </p>
      </div>
    );
  }

  const doneCount = items.filter((i) => i.is_done).length;

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setIsAdding(true);
    const created = await createChecklistItem(taskId, title);
    setIsAdding(false);
    if (created) {
      setItems((prev) => [...prev, created]);
      setNewTitle("");
    }
  };

  const handleToggle = async (item: IChecklistItem) => {
    const nextDone = !item.is_done;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_done: nextDone ? 1 : 0 } : i)),
    );
    const ok = await updateChecklistItem(item.id, { is_done: nextDone });
    if (!ok) {
      // revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_done: item.is_done } : i)),
      );
    }
  };

  const handleRename = async (item: IChecklistItem, newTitle: string) => {
    const prevTitle = item.title;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, title: newTitle } : i)),
    );
    const ok = await updateChecklistItem(item.id, { title: newTitle });
    if (!ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, title: prevTitle } : i)),
      );
    }
  };

  const handleDelete = async (item: IChecklistItem) => {
    const prevItems = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const ok = await deleteChecklistItem(item.id);
    if (!ok) {
      setItems(prevItems);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);
    reorderChecklistItems(
      taskId,
      reordered.map((i) => i.id),
    );
  };

  return (
    <div className="col-12">
      <div className="d-flex justify-content-between align-items-center pb-2 mb-1">
        <label className="form_label mb-0">Checklist</label>
        {items.length > 0 && (
          <span className="text-muted" style={{ fontSize: "12px" }}>
            {doneCount}/{items.length} done
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted" style={{ fontSize: "13px" }}>
          Loading…
        </p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="task-checklist-items">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {items.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={`checklist-${item.id}`}
                    index={index}
                  >
                    {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                        <ChecklistRow
                          index={index + 1}
                          title={item.title}
                          done={!!item.is_done}
                          dragHandleProps={dragProvided.dragHandleProps}
                          onToggle={() => handleToggle(item)}
                          onDelete={() => handleDelete(item)}
                          onRename={(newTitle) => handleRename(item, newTitle)}
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
      )}

      <div className="d-flex gap-2 mt-1">
        <input
          type="text"
          className="form-control"
          placeholder="Add checklist item"
          style={{ marginBottom: "0px" }}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          style={{ whiteSpace: "nowrap", backgroundColor: "#f58634", borderColor: "#f58634" }}
          disabled={isAdding || !newTitle.trim()}
          onClick={handleAdd}
        >
          + Add
        </button>
      </div>
    </div>
  );
};

export default TaskChecklistSection;
