import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchColumnPreference,
  saveColumnPreference,
} from "../services/columnPreferenceService";
import { useColumnPreferenceStore } from "../store/report/useColumnPreferenceStore";

export interface ColumnDef {
  key: string;
  label: string;
  /** Cannot be hidden or dragged (e.g. selection/action columns) */
  locked?: boolean;
}

const SAVE_DEBOUNCE_MS = 600;

const reconcileOrder = (
  savedOrder: string[] | null | undefined,
  defaultColumns: ColumnDef[],
): string[] => {
  const defaultKeys = defaultColumns.map((c) => c.key);

  if (!savedOrder || savedOrder.length === 0) return defaultKeys;

  const validSaved = savedOrder.filter((key) => defaultKeys.includes(key));
  const missing = defaultKeys.filter((key) => !validSaved.includes(key));

  if (
    missing.length > 0 &&
    validSaved.includes("last_modified_date") &&
    defaultKeys[defaultKeys.length - 1] === "last_modified_date"
  ) {
    const withoutLastMod = validSaved.filter((k) => k !== "last_modified_date");
    return [...withoutLastMod, ...missing, "last_modified_date"];
  }

  return [...validSaved, ...missing];
};

export const useColumnPreferences = <T extends ColumnDef>(
  reportKey: string,
  defaultColumns: T[],
) => {
  const {
    getPreference,
    isLoaded,
    setPreference,
    markLoaded,
  } = useColumnPreferenceStore();

  const defaultKeys = useMemo(
    () => defaultColumns.map((c) => c.key),
    [defaultColumns],
  );

  const cached = getPreference(reportKey);

  const [order, setOrder] = useState<string[]>(() =>
    reconcileOrder(cached?.column_order, defaultColumns),
  );
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(cached?.hidden_columns ?? []),
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load from backend once per report, reconcile with current default columns
  useEffect(() => {
    if (isLoaded(reportKey)) return;

    let cancelled = false;

    fetchColumnPreference(reportKey).then((pref) => {
      if (cancelled) return;

      const nextOrder = reconcileOrder(pref?.column_order, defaultColumns);
      const nextHidden = new Set(
        (pref?.hidden_columns ?? []).filter((key) =>
          defaultKeys.includes(key),
        ),
      );

      setOrder(nextOrder);
      setHidden(nextHidden);
      setPreference(reportKey, {
        column_order: nextOrder,
        hidden_columns: Array.from(nextHidden),
      });
      markLoaded(reportKey);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey]);

  // Keep order in sync if defaultColumns gain/lose keys (e.g. conditional columns)
  useEffect(() => {
    setOrder((prev) => reconcileOrder(prev, defaultColumns));
    setHidden((prev) => {
      const next = new Set(
        Array.from(prev).filter((key) => defaultKeys.includes(key)),
      );
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKeys.join(",")]);

  const persist = (nextOrder: string[], nextHidden: Set<string>) => {
    setPreference(reportKey, {
      column_order: nextOrder,
      hidden_columns: Array.from(nextHidden),
    });

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveColumnPreference(reportKey, nextOrder, Array.from(nextHidden));
    }, SAVE_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const toggleColumn = (key: string) => {
    const def = defaultColumns.find((c) => c.key === key);
    if (def?.locked) return;

    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);

      persist(order, next);
      return next;
    });
  };

  const reorderColumns = (newOrder: string[]) => {
    setOrder(newOrder);
    persist(newOrder, hidden);
  };

  const resetColumns = () => {
    setOrder(defaultKeys);
    setHidden(new Set());
    persist(defaultKeys, new Set());
  };

  const orderedColumns = useMemo(
    () =>
      order
        .map((key) => defaultColumns.find((c) => c.key === key))
        .filter((c): c is T => Boolean(c)),
    [order, defaultColumns],
  );

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => !hidden.has(c.key)),
    [orderedColumns, hidden],
  );

  return {
    orderedColumns,
    visibleColumns,
    hiddenKeys: hidden,
    isColumnVisible: (key: string) => !hidden.has(key),
    toggleColumn,
    reorderColumns,
    resetColumns,
  };
};
