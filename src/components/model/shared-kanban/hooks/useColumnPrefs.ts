import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchColumnPreference,
  saveColumnPreference,
} from "../../../../services/columnPreferenceService";
import { KanbanColumnDef } from "../types";

interface StoredPrefs {
  order: string[]; // column ids, as strings
  hidden: string[]; // column ids, as strings
}

const EMPTY_PREFS: StoredPrefs = { order: [], hidden: [] };
const SAVE_DEBOUNCE_MS = 600;

/**
 * Per-user, server-persisted column order and visibility (same
 * user_column_preferences table/endpoints the report grids use, keyed by
 * boardKey instead of reportKey), layered on top of whatever columns the
 * backend returns. New columns the user has never seen are appended in the
 * order the API returns them, and default to visible.
 */
export const useColumnPrefs = (
  boardKey: string,
  columns: KanbanColumnDef[],
) => {
  const [prefs, setPrefs] = useState<StoredPrefs>(EMPTY_PREFS);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    setPrefs(EMPTY_PREFS);

    fetchColumnPreference(boardKey).then((pref) => {
      if (cancelled) return;
      setPrefs({
        order: pref?.column_order ?? [],
        hidden: pref?.hidden_columns ?? [],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [boardKey]);

  const persist = useCallback(
    (next: StoredPrefs) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveColumnPreference(boardKey, next.order, next.hidden);
      }, SAVE_DEBOUNCE_MS);
    },
    [boardKey],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

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
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPrefs((prev) => {
        const currentOrder = orderedColumns.map((c) => String(c.id));
        const [moved] = currentOrder.splice(fromIndex, 1);
        currentOrder.splice(toIndex, 0, moved);
        const next = { ...prev, order: currentOrder };
        persist(next);
        return next;
      });
    },
    [persist, orderedColumns],
  );

  return {
    orderedColumns,
    visibleColumns,
    hiddenColumnIds: prefs.hidden,
    toggleColumnVisibility,
    reorderColumns,
  };
};
