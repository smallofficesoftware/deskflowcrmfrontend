import { Task, Priority } from "../types/kanban.types";

// Map raw API response to Task interface
export const mapApiResponseToTask = (raw: Record<string, unknown>): Task => {
  return {
    id: Number(raw.id ?? raw.task_id ?? 0),
    task_id: Number(raw.id ?? raw.task_id ?? 0),
    task_name: String(
      raw.task_title ?? raw.task_name ?? raw.name ?? "Untitled Task",
    ),

    contact_name: raw.contact_person_name
      ? String(raw.contact_person_name)
      : raw.contact_company_name
        ? String(raw.contact_company_name)
        : undefined,

    mobile_number: raw.contact_person_number
      ? String(raw.contact_person_number)
      : undefined,

    // task_enddate is the due date
    due_date: raw.task_enddate
      ? parseTaskDate(String(raw.task_enddate))
      : undefined,

    priority: mapPriority(raw.task_priority),

    assigned_to: raw.assigned_team_member_names
      ? String(raw.assigned_team_member_names)
      : undefined,

    assigned_avatar: undefined,

    status_id: Number(raw.status ?? 0),
    status: Number(raw.status ?? 0),

    category_id: raw.task_category_id
      ? Number(raw.task_category_id)
      : undefined,
    task_type_id: raw.task_type ? Number(raw.task_type) : undefined,
    priority_id: raw.task_priority ? Number(raw.task_priority) : undefined,

    // Feature 1: is_unread per task (unread indicator on card)
    unread_count: raw.is_unread === 1 || raw.is_unread === "1" ? 1 : 0,

    is_overdue: false,
    created_at: raw.created_date_time
      ? String(raw.created_date_time)
      : undefined,
    updated_at: raw.modified_date ? String(raw.modified_date) : undefined,

    // ── Feature 1 & 2: new display fields ──────────────────────────────────
    task_number: Number(raw.id ?? raw.task_id ?? 0), // shown as #1010
    category_name: raw.category_name ? String(raw.category_name) : undefined,
    category_color_code: raw.category_color_code
      ? String(raw.category_color_code)
      : undefined,
    created_by_name: raw.created_by_name
      ? String(raw.created_by_name)
      : undefined,

    // ── Feature 2: eye modal detail fields ─────────────────────────────────
    stage_status_name: raw.stage_status_name
      ? String(raw.stage_status_name)
      : undefined,
    stage_status_color: raw.stage_status_color
      ? String(raw.stage_status_color)
      : undefined,
    task_remark: raw.task_remark ? String(raw.task_remark) : undefined,
    task_fromdate: raw.task_fromdate ? String(raw.task_fromdate) : undefined,
    task_enddate: raw.task_enddate ? String(raw.task_enddate) : undefined,
    label_name: raw.label_name ? String(raw.label_name) : undefined,
    label_color: raw.label_color ? String(raw.label_color) : undefined,

    // ── Checklist (subtasks) progress badge ────────────────────────────────
    checklist_total:
      raw.checklist_total !== undefined && raw.checklist_total !== null
        ? Number(raw.checklist_total)
        : undefined,
    checklist_done:
      raw.checklist_done !== undefined && raw.checklist_done !== null
        ? Number(raw.checklist_done)
        : undefined,

    // Keep full raw for edit modal (Feature 4)
    raw,
  };
};

// Parse date string from API format "01-06-2026 01:05 PM" to ISO string
const parseTaskDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "0000-00-00") return "";
  try {
    const parts = dateStr.split(" ");
    if (parts.length < 2) return dateStr;
    const [day, month, year] = parts[0].split("-");
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
};

// Map numeric priority to label
const mapPriority = (raw: unknown): Priority | undefined => {
  const p = Number(raw);
  if (p === 1) return "Low";
  if (p === 2) return "Medium";
  if (p === 3) return "High";
  if (p === 4) return "Critical";
  return undefined;
};

// Format due date relative to today
export const formatDueDate = (
  dueDateStr: string,
): { label: string; isOverdue: boolean; isToday: boolean } => {
  if (!dueDateStr) return { label: "", isOverdue: false, isToday: false };
  // dueDateStr here is task.due_date, which mapApiResponseToTask already
  // ran through parseTaskDate() to convert from the API's raw
  // "DD-MM-YYYY hh:mm A" into "YYYY-MM-DD" - safe for native Date parsing
  // as-is. (Do NOT re-split this as DD-MM-YYYY - it already isn't.)
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime()))
    return { label: "", isOverdue: false, isToday: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      isOverdue: true,
      isToday: false,
    };
  if (diffDays === 0)
    return { label: "Today", isOverdue: false, isToday: true };
  if (diffDays === 1)
    return { label: "Tomorrow", isOverdue: false, isToday: false };
  if (diffDays <= 7)
    return { label: `In ${diffDays}d`, isOverdue: false, isToday: false };
  return {
    label: dueDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    isOverdue: false,
    isToday: false,
  };
};

// Format display date from raw API string "DD-MM-YYYY HH:MM AM/PM"
export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr || dateStr === "0000-00-00") return "";
  try {
    const parts = dateStr.split(" ");
    const [day, month, year] = parts[0].split("-");
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { color: string; bg: string; icon: string }
> = {
  Critical: { color: "#fff", bg: "#dc3545", icon: "🔴" },
  High: { color: "#fff", bg: "#fd7e14", icon: "🟠" },
  Medium: { color: "#fff", bg: "#0d6efd", icon: "🔵" },
  Low: { color: "#fff", bg: "#6c757d", icon: "⚪" },
};

export const getInitials = (name?: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const parseRefreshTimeout = (timeout: string): number => {
  const match = timeout.match(/^(\d+)(s|m)$/);
  if (!match) return 30000;
  const value = parseInt(match[1]);
  return match[2] === "m" ? value * 60 * 1000 : value * 1000;
};
