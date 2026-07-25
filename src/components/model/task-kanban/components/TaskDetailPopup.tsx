import React, { useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { Task } from "../types/kanban.types";
import { formatDisplayDate, getInitials } from "../utils/taskMapper";

interface TaskDetailPopupProps {
  task: Task | null;
  onClose: () => void;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  High:     { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  Medium:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Low:      { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

// ─── Reusable row ─────────────────────────────────────────────────────────────
const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}> = ({ icon, label, value, children }) => {
  if (!value && !children) return null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: "1px solid #f3f4f6", alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#6b7280" }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
          {label}
        </div>
        {children ?? (
          <div style={{ fontSize: "0.875rem", color: "#1a1d23", fontWeight: 500, wordBreak: "break-word", lineHeight: 1.5 }}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const I = {
  user:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  users:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  phone:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  status:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
  category: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" /></svg>,
  label:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2Z" /><path d="M7 7h.01" /></svg>,
  desc:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>,
  clock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>,
};

export const TaskDetailPopup: React.FC<TaskDetailPopupProps> = ({ task, onClose }) => {
  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    if (!task) return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [task, handleKey]);

  if (!task) return null;

  const priorityStyle = task.priority ? PRIORITY_STYLE[task.priority] : null;

  const popup = (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, animation: "kFadeIn 0.15s ease" }} />

      {/* Panel */}
      <div
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2001, width: "min(560px,94vw)", maxHeight: "88vh", background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--k-font,'DM Sans',system-ui,sans-serif)", animation: "kSlideUp 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {/* Task number */}
              <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#f3f4f6", color: "#6b7280", padding: "3px 8px", borderRadius: 20, letterSpacing: "0.04em" }}>
                #{task.task_number ?? task.task_id}
              </span>
              {/* Stage/status pill */}
              {task.stage_status_name && (
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700,
                  background: task.stage_status_color ? `${task.stage_status_color}18` : "#f3f4f6",
                  color: task.stage_status_color ?? "#374151",
                  border: `1px solid ${task.stage_status_color ? `${task.stage_status_color}40` : "#e5e7eb"}`,
                  padding: "3px 10px", borderRadius: 20,
                }}>
                  {task.stage_status_name}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1d23")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              title="Close (ESC)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Task title */}
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1d23", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
            {task.task_name}
          </div>

          {/* Badges row */}
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            {task.priority && priorityStyle && (
              <span style={{ fontSize: "0.7rem", fontWeight: 700, background: priorityStyle.bg, color: priorityStyle.color, border: `1px solid ${priorityStyle.border}`, padding: "3px 10px", borderRadius: 20 }}>
                {task.priority} Priority
              </span>
            )}
            {(task.unread_count ?? 0) > 0 && (
              <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: 20 }}>
                {task.unread_count} Unread
              </span>
            )}
            {/* Feature 2: category badge in header */}
            {task.category_name && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 700,
                background: task.category_color_code ? `${task.category_color_code}18` : "#f3f4f6",
                color: task.category_color_code ? String(task.category_color_code) : "#374151",
                border: `1px solid ${task.category_color_code ? `${task.category_color_code}40` : "#e5e7eb"}`,
                padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: task.category_color_code ? String(task.category_color_code) : "#9ca3af" }} />
                {task.category_name}
              </span>
            )}
            {/* Feature 2: label */}
            {task.label_name && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 700,
                background: task.label_color ? `${task.label_color}18` : "#f0fdf4",
                color: task.label_color ?? "#15803d",
                border: `1px solid ${task.label_color ? `${task.label_color}40` : "#bbf7d0"}`,
                padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: task.label_color ?? "#15803d" }} />
                {task.label_name}
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "4px 20px 20px" }}>

          {/* Feature 2: Description / task_remark */}
          {task.task_remark && (
            <DetailRow icon={I.desc} label="Description">
              <div style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {task.task_remark}
              </div>
            </DetailRow>
          )}

          {/* Assigned To */}
          {task.assigned_to && (
            <DetailRow icon={I.user} label="Assigned To">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: "0.62rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {getInitials(task.assigned_to)}
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1d23" }}>{task.assigned_to}</span>
              </div>
            </DetailRow>
          )}

          {/* Feature 2: Created by */}
          {task.created_by_name && (
            <DetailRow icon={I.edit} label="Created By">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: "0.62rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {getInitials(task.created_by_name)}
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1d23" }}>{task.created_by_name}</span>
              </div>
            </DetailRow>
          )}

          {/* Contact */}
          <DetailRow icon={I.users} label="Contact" value={task.contact_name} />

          {/* Mobile */}
          <DetailRow icon={I.phone} label="Mobile">
            {task.mobile_number ? (
              <a href={`tel:${task.mobile_number}`} style={{ fontSize: "0.875rem", fontWeight: 500, color: "#2563eb", textDecoration: "none", fontFamily: "monospace" }}>
                {task.mobile_number}
              </a>
            ) : null}
          </DetailRow>

          {/* Feature 2: Start date — task_fromdate */}
          {task.task_fromdate && (
            <DetailRow icon={I.calendar} label="Start Date" value={formatDisplayDate(task.task_fromdate)} />
          )}

          {/* Feature 2: End / Due date — task_enddate */}
          {task.task_enddate && (
            <DetailRow icon={I.calendar} label="Due Date" value={formatDisplayDate(task.task_enddate)} />
          )}

          {/* Feature 2: Category detail row */}
          {task.category_name && (
            <DetailRow icon={I.category} label="Category">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {task.category_color_code && (
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: String(task.category_color_code), flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1d23" }}>{task.category_name}</span>
              </div>
            </DetailRow>
          )}

          {/* Feature 2: Label detail row */}
          {task.label_name && (
            <DetailRow icon={I.label} label="Label">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {task.label_color && (
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: task.label_color, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1d23" }}>{task.label_name}</span>
              </div>
            </DetailRow>
          )}

          {/* Created At */}
          {task.created_at && (
            <DetailRow icon={I.clock} label="Created At" value={task.created_at} />
          )}

          {/* Updated At */}
          {task.updated_at && (
            <DetailRow icon={I.edit} label="Last Updated" value={task.updated_at} />
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", flexShrink: 0, background: "#fafafa" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontFamily: "var(--k-font,'DM Sans',system-ui,sans-serif)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes kFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes kSlideUp { from { opacity:0;transform:translate(-50%,calc(-50% + 12px)) } to { opacity:1;transform:translate(-50%,-50%) } }
      `}</style>
    </>
  );

  return ReactDOM.createPortal(popup, document.body);
};