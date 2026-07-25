import { DragDropContext } from "@hello-pangea/dnd";
import React, { useCallback, useEffect, useRef } from "react";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";
import { useTaskDrag } from "../hooks/useTaskDrag";
import { BoardColumn, BoardType, Task } from "../types/kanban.types";
import { KanbanColumn, KanbanColumnSkeleton } from "./KanbanColumn";

interface KanbanBoardProps {
  columns: BoardColumn[];
  isColumnsLoading: boolean;
  boardType: BoardType;
  searchTerm: string;
  filterParams?: FilterParams | null;
  supportTicketFlag?: number | null;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onChangeStatus?: (task: Task) => void;
  onAssignLabel?: (task: Task) => void;
  onAssignTeamMember?: (task: Task) => void;
  onTimeline?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  isColumnsLoading,
  boardType,
  searchTerm,
  filterParams,
  onTaskClick,
  onTaskEdit,
  onChangeStatus,
  onAssignLabel,
  onAssignTeamMember,
  onTimeline,
  onArchive,
  onDelete,
  onError,
  supportTicketFlag,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  // const { onDragEnd } = useTaskDrag({ boardType, searchTerm, onError });
  const { onDragEnd } = useTaskDrag({
    boardType,
    searchTerm,
    filterParams,
    onError,
  });

  const makeWheelHandler = useCallback(
    (ref: React.RefObject<HTMLDivElement>) => (e: WheelEvent) => {
      const el = ref.current;
      if (!el) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.8;
      }
    },
    [],
  );

  const handleBoardWheel = useCallback(makeWheelHandler(boardRef), [makeWheelHandler]);
  const handleNavWheel = useCallback(makeWheelHandler(navRef), [makeWheelHandler]);

  // const handleWheel = useCallback((e: WheelEvent) => {
  //   const el = boardRef.current;
  //   if (!el) return;
  //   if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
  //     e.preventDefault();
  //     el.scrollLeft += e.deltaY * 0.8;
  //   }
  // }, []);


  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleBoardWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleBoardWheel);
  }, [handleBoardWheel]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleNavWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleNavWheel);
  }, [handleNavWheel,isColumnsLoading, columns.length]);

  const scrollToColumn = useCallback((columnId: number) => {
    const el = document.getElementById(`col-${columnId}`);
    if (el && boardRef.current) {
      const containerLeft = boardRef.current.getBoundingClientRect().left;
      const colLeft = el.getBoundingClientRect().left;
      boardRef.current.scrollLeft += colLeft - containerLeft - 20;
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        minWidth: 0
      }}
    >
      {!isColumnsLoading && columns.length > 0 && (
        <div className="kanban-nav" ref={navRef}>
          {columns.map((col) => (
            <button
              key={col.id}
              className="nav-pill"
              onClick={() => scrollToColumn(col.id)}
            >
              <span className="dot" style={{ backgroundColor: col.color }} />
              {col.name}
              {/* Feature 1: show unread count on nav pill if column has unread */}
              {(col.unread_count ?? 0) > 0 && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: 20,
                    padding: "1px 5px",
                    lineHeight: 1.5,
                    marginLeft: 2,
                  }}
                >
                  {col.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board" ref={boardRef}>
          {isColumnsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
              <KanbanColumnSkeleton key={i} />
            ))
            : columns.map((column) => (
              <div
                key={column.id}
                id={`col-${column.id}`}
                style={{ flexShrink: 0 }}
              >
                <KanbanColumn
                  column={column}
                  boardType={boardType}
                  searchTerm={searchTerm}
                  filterParams={filterParams}
                  onTaskClick={onTaskClick}
                  onTaskEdit={onTaskEdit}
                  onChangeStatus={onChangeStatus}
                  onAssignLabel={onAssignLabel}
                  onAssignTeamMember={onAssignTeamMember}
                  onTimeline={onTimeline}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  supportTicketFlag={supportTicketFlag}
                />
              </div>
            ))}
        </div>
      </DragDropContext>
    </div>
  );
};
