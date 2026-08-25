import { useCallback, useEffect, useMemo, useState } from "react";
import { KanbanColumnDef } from "../types";

interface StoredPrefs {
  order: string[]; // column ids, as strings
  hidden: string[]; // column ids, as strings
}

const storageKey = (boardKey: string) => `kanban-prefs-${boardKey}`;

const readPrefs = (boardKey: string): StoredPrefs => {
  try {
    const raw = localStorage.getItem(storageKey(boardKey));
    if (!raw) return { order: [], hidden: [] };
    const parsed = JSON.parse(raw);
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    };
  } catch {
    return { order: [], hidden: [] };
  }
};

const writePrefs = (boardKey: string, prefs: StoredPrefs) => {
  try {
    localStorage.setItem(storageKey(boardKey), JSON.stringify(prefs));
  } catch {
    // localStorage unavailable (private mode, quota) — preference just won't persist.
  }
};

/**
 * Per-user, per-browser column order and visibility, layered on top of
 * whatever columns the backend returns. New columns the user has never seen
 * are appended in the order the API returns them, and default to visible.
 */
export const useColumnPrefs = (
  boardKey: string,
  columns: KanbanColumnDef[],
) => {
  const [prefs, setPrefs] = useState<StoredPrefs>(() => readPrefs(boardKey));

  useEffect(() => {
    setPrefs(readPrefs(boardKey));
  }, [boardKey]);

  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((c) => [String(c.id), c]));
    const ordered: KanbanColumnDef[] = [];
    prefs.order.forEach((id) => {
      const col = byId.get(id);
      if (col) {
        ordered.push(col);
        byId.delete(id);
      }
    });
    // Anything left (new columns, or first run with no saved order) keeps API order.
    columns.forEach((c) => {
      if (byId.has(String(c.id))) ordered.push(c);
    });
    return ordered;
  }, [columns, prefs.order]);

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => !prefs.hidden.includes(String(c.id))),
    [orderedColumns, prefs.hidden],
  );

  const toggleColumnVisibility = useCallback(
    (columnId: KanbanColumnDef["id"]) => {
      setPrefs((prev) => {
        const id = String(columnId);
        const hidden = prev.hidden.includes(id)
          ? prev.hidden.filter((h) => h !== id)
          : [...prev.hidden, id];
        const next = { ...prev, hidden };
        writePrefs(boardKey, next);
        return next;
      });
    },
    [boardKey],
  );

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPrefs((prev) => {
        const currentOrder = orderedColumns.map((c) => String(c.id));
        const [moved] = currentOrder.splice(fromIndex, 1);
        currentOrder.splice(toIndex, 0, moved);
        const next = { ...prev, order: currentOrder };
        writePrefs(boardKey, next);
        return next;
      });
    },
    [boardKey, orderedColumns],
  );

  return {
    orderedColumns,
    visibleColumns,
    hiddenColumnIds: prefs.hidden,
    toggleColumnVisibility,
    reorderColumns,
  };
};
