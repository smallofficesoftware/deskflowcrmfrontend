import { Droppable } from "@hello-pangea/dnd";
import React, { useCallback, useEffect, useRef } from "react";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";
import { useKanbanTasks } from "../hooks/useKanbanTasks";
import { BoardColumn, BoardType, Task } from "../types/kanban.types";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";

interface KanbanColumnProps {
  column: BoardColumn;
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
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
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
  supportTicketFlag,
}) => {
  const {
    tasks,
    total,
    columnUnreadCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
  } = useKanbanTasks(
    boardType,
    column.id,
    searchTerm,
    filterParams,
    supportTicketFlag,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const setupObserver = useCallback(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
          loadMore();
      },
      { threshold: 0.1, root: scrollContainerRef.current },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  useEffect(() => {
    const cleanup = setupObserver();
    return cleanup;
  }, [setupObserver]);

  return (
    <div className="kanban-column">
      {/* Column Header */}
      <div className="column-header">
        <div className="header-left">
          <div
            className="color-dot"
            style={{ backgroundColor: column.color || "#6b7280" }}
          />
          <span className="column-name">{column.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Feature 1: unread count badge on column header */}
          {columnUnreadCount > 0 && (
            <span
              title={`${columnUnreadCount} unread task${columnUnreadCount > 1 ? "s" : ""}`}
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                background: "#ef4444",
                color: "#fff",
                borderRadius: 20,
                padding: "1px 6px",
                lineHeight: 1.6,
                letterSpacing: "0.01em",
              }}
            >
              {columnUnreadCount > 99 ? "99+" : columnUnreadCount} unread
            </span>
          )}
          <span className="column-badge">{isLoading ? "..." : total}</span>
        </div>
      </div>

      {/* Scroll wrapper — plain div, NOT the Droppable */}
      <div className="column-scroll" ref={scrollContainerRef}>
        <Droppable
          droppableId={String(column.id)}
          type="TASK"
          ignoreContainerClipping
        >
          {(provided, snapshot) => (
            <div
              className={`droppable-area ${snapshot.isDraggingOver ? "is-dragging-over" : ""}`}
              ref={provided.innerRef}
              {...provided.droppableProps}

            >
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TaskCardSkeleton key={`skel-${i}`} />
                ))}

              {!isLoading &&
                tasks.map((task, index) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    index={index}
                    onClick={onTaskClick}
                    onEdit={onTaskEdit}
                    onChangeStatus={onChangeStatus}
                    onAssignLabel={onAssignLabel}
                    onAssignTeamMember={onAssignTeamMember}
                    onTimeline={onTimeline}
                    onArchive={onArchive}
                    onDelete={onDelete}
                  />
                ))}

              {provided.placeholder}

              {!isLoading && tasks.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No tasks here</p>
                </div>
              )}

              <div ref={sentinelRef} className="load-more-trigger">
                {isFetchingNextPage && (
                  <div className="load-more-spinner">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Loading more...
                  </div>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};

export const KanbanColumnSkeleton: React.FC = () => (
  <div className="kanban-column">
    <div className="skeleton-column-header">
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#e5e7eb",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          height: 13,
          width: 100,
          borderRadius: 4,
          background: "#e5e7eb",
        }}
      />
      <div
        style={{
          height: 20,
          width: 32,
          borderRadius: 20,
          background: "#e5e7eb",
          marginLeft: "auto",
        }}
      />
    </div>
    <div className="column-scroll">
      <div className="droppable-area">
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
