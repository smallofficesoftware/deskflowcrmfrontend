import { Draggable } from "@hello-pangea/dnd";
import React, { memo, useEffect, useRef, useState } from "react";
import { Priority, Task } from "../types/kanban.types";
import { formatDueDate, getInitials } from "../utils/taskMapper";
import { TaskDetailPopup } from "./TaskDetailPopup";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onChangeStatus?: (task: Task) => void;
  onAssignLabel?: (task: Task) => void;
  onAssignTeamMember?: (task: Task) => void;
  onTimeline?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const PRIORITY_CLASSES: Record<Priority, string> = {
  Critical: "Critical",
  High: "High",
  Medium: "Medium",
  Low: "Low",
};

// Icon helpers
const IconUser = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconPhone = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect width="14" height="20" x="5" y="2" rx="2" />
    <path d="M12 18h.01" />
  </svg>
);
const IconCalendar = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconEdit = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);
const IconEye = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconMore = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const ActionBtn: React.FC<{
  title: string;
  onClick: (e: React.MouseEvent) => void;
  color: string;
  hoverBg: string;
  children: React.ReactNode;
}> = ({ title, onClick, color, hoverBg, children }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "3px 4px",
      borderRadius: 5,
      color,
      display: "flex",
      alignItems: "center",
      transition: "color 0.15s, background 0.15s",
      lineHeight: 1,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = hoverBg;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "none";
    }}
  >
    {children}
  </button>
);

export const TaskCard: React.FC<TaskCardProps> = memo(
  ({ task, index, onClick, onEdit, onChangeStatus, onAssignLabel, onAssignTeamMember, onTimeline, onArchive, onDelete }) => {
    const dueDateInfo = task.due_date ? formatDueDate(task.due_date) : null;
    const didDragRef = useRef(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!showMenu) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setShowMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMenu]);

    // Feature 1: unread tasks get a left accent border
    const isUnread = (task.unread_count ?? 0) > 0;

    return (
      <>
        <Draggable draggableId={String(task.task_id)} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`task-card${snapshot.isDragging ? " is-dragging" : ""}${isUnread ? " is-unread" : ""}`}
              style={{
                ...provided.draggableProps.style,
                willChange: snapshot.isDragging ? "transform" : "auto",
              }}
              onMouseDown={() => {
                didDragRef.current = false;
              }}
              onMouseMove={() => {
                didDragRef.current = true;
              }}
              onClick={() => {
                if (!didDragRef.current) onClick?.(task);
                didDragRef.current = false;
              }}
            >
              {/* ── Header row: task# + title + actions ── */}
              <div
                className="card-header-row"
                style={{ alignItems: "flex-start", gap: 6 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Feature 2: task number */}
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#9ca3af",
                      marginBottom: 2,
                      letterSpacing: "0.02em",
                    }}
                  >
                    #{task.task_number ?? task.task_id}
                  </div>
                  <div className="task-name">{task.task_name}</div>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {/* Feature 1: unread dot */}
                  {isUnread && (
                    <span
                      title="Unread"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#ef4444",
                        flexShrink: 0,
                        marginRight: 2,
                        boxShadow: "0 0 0 2px #fee2e2",
                      }}
                    />
                  )}

                  {/* Feature 4: Edit button */}
                  {onEdit && (
                    <ActionBtn
                      title="Edit task"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                      color="#9ca3af"
                      hoverBg="#fef9c3"
                    >
                      <IconEdit />
                    </ActionBtn>
                  )}

                  {/* Eye / detail button */}
                  <ActionBtn
                    title="View details"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetail(true);
                    }}
                    color="#9ca3af"
                    hoverBg="#ede9fe"
                  >
                    <IconEye />
                  </ActionBtn>
                  <div
                    ref={menuRef}
                    style={{ position: "relative" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionBtn
                      title="More options"
                      onClick={() => setShowMenu((prev) => !prev)}
                      color="#9ca3af"
                      hoverBg="#f3f4f6"
                    >
                      <IconMore />
                    </ActionBtn>

                    {showMenu && (
                      <ul
                        className="labelDropLeft isVisible kanban-task-menu"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          left: "auto",
                          width: "170px",
                          margin: 0,
                          zIndex: 1000,
                          backgroundColor: "#fff",
                        }}
                      >
                        <li
                          className="listItem text-start"
                          role="button"
                          onClick={() => {
                            setShowMenu(false);
                            onEdit?.(task);
                          }}
                        >
                          Edit
                        </li>
                        <li
                          className="listItem text-start"
                          role="button"
                          onClick={() => {
                            setShowMenu(false);
                            onChangeStatus?.(task);
                          }}
                        >
                          Change Status
                        </li>
                        <li
                          className="listItem text-start"
                          role="button"
                          onClick={() => {
                            setShowMenu(false);
                            onAssignLabel?.(task);
                          }}
                        >
                          Assign label
                        </li>
                        {task.raw?.team_task_assignement_type != "2" && (
                          <li
                            className="listItem text-start"
                            role="button"
                            onClick={() => {
                              setShowMenu(false);
                              onAssignTeamMember?.(task);
                            }}
                          >
                            Assign Team Member
                          </li>
                        )}

                        <li
                          className="listItem text-start"
                          role="button"
                          onClick={() => {
                            setShowMenu(false);
                            onTimeline?.(task);
                          }}
                        >
                          Timeline
                        </li>
                        <li
                          className="listItem text-start"
                          role="button"
                          onClick={() => {
                            setShowMenu(false);
                            onArchive?.(task);
                          }}
                        >
                          Archive
                        </li>
                        <li
                          style={{ color: "red", fontWeight: 600 }}
                          className="listItem text-start"
                          role="button"
                          onClick={() => {
                            setShowMenu(false);
                            onDelete?.(task);
                          }}
                        >
                          Delete
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Feature 2: Category badge ── */}
              {task.category_name && (
                <div style={{ marginBottom: 5 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      background: task.category_color_code
                        ? `${task.category_color_code}18`
                        : "#f3f4f6",
                      color: task.category_color_code
                        ? String(task.category_color_code)
                        : "#6b7280",
                      border: `1px solid ${task.category_color_code ? `${task.category_color_code}40` : "#e5e7eb"}`,
                      borderRadius: 20,
                      padding: "2px 7px",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: task.category_color_code
                          ? String(task.category_color_code)
                          : "#9ca3af",
                        flexShrink: 0,
                      }}
                    />
                    {task.category_name}
                  </span>
                </div>
              )}

              {/* ── Contact ── */}
              {task.contact_name && (
                <div className="card-info-row">
                  <span className="icon">
                    <IconUser />
                  </span>
                  <span>{task.contact_name}</span>
                </div>
              )}

              {/* ── Mobile ── */}
              {task.mobile_number && (
                <div className="card-info-row">
                  <span className="icon">
                    <IconPhone />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--k-font-mono)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {task.mobile_number}
                  </span>
                </div>
              )}

              {/* ── Feature 2: Created by ── */}
              {task.created_by_name && (
                <div
                  className="card-info-row"
                  style={{ color: "var(--k-text-muted)" }}
                >
                  <span className="icon" style={{ opacity: 0.7 }}>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </span>
                  <span style={{ fontSize: "0.72rem" }}>
                    by {task.created_by_name}
                  </span>
                </div>
              )}

              {/* ── Footer: priority + due + assignee ── */}
              <div className="card-footer-row">
                {task.priority && (
                  <span
                    className={`badge-pill priority-badge ${PRIORITY_CLASSES[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                )}

                {dueDateInfo && dueDateInfo.label && (
                  <span
                    className={`badge-pill due-badge ${dueDateInfo.isOverdue ? "overdue" : dueDateInfo.isToday ? "today" : "upcoming"}`}
                  >
                    <IconCalendar />{" "}
                    <span style={{ marginLeft: 3 }}>{dueDateInfo.label}</span>
                  </span>
                )}

                {task.assigned_to && (
                  <div className="assignee" style={{ marginLeft: "auto" }}>
                    <div
                      className="avatar"
                      title={task.assigned_to}
                      style={
                        task.assigned_avatar
                          ? {
                            background: `url(${task.assigned_avatar}) center/cover`,
                          }
                          : {}
                      }
                    >
                      {!task.assigned_avatar && getInitials(task.assigned_to)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Draggable>

        {/* Detail popup — portal, outside Draggable */}
        {showDetail && (
          <TaskDetailPopup task={task} onClose={() => setShowDetail(false)} />
        )}

      </>
    );
  },
);

TaskCard.displayName = "TaskCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const TaskCardSkeleton: React.FC = () => (
  <div className="skeleton-card">
    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <div
        style={{ height: 9, width: 40, borderRadius: 4, background: "#f0f0f0" }}
      />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <div
        style={{
          height: 14,
          flex: 1,
          borderRadius: 4,
          background:
            "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "skeleton-shimmer 1.2s infinite",
        }}
      />
      <div
        style={{
          height: 14,
          width: 40,
          borderRadius: 4,
          background: "#f0f0f0",
        }}
      />
    </div>
    <div
      style={{
        height: 11,
        width: "65%",
        borderRadius: 4,
        background: "#f0f0f0",
        marginBottom: 7,
      }}
    />
    <div
      style={{
        height: 11,
        width: "45%",
        borderRadius: 4,
        background: "#f0f0f0",
        marginBottom: 12,
      }}
    />
    <div style={{ display: "flex", gap: 6 }}>
      <div
        style={{
          height: 20,
          width: 60,
          borderRadius: 20,
          background: "#f0f0f0",
        }}
      />
      <div
        style={{
          height: 20,
          width: 70,
          borderRadius: 20,
          background: "#f0f0f0",
        }}
      />
      <div
        style={{
          height: 22,
          width: 22,
          borderRadius: "50%",
          background: "#f0f0f0",
          marginLeft: "auto",
        }}
      />
    </div>
  </div>
);
