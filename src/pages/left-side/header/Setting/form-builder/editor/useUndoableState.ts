import { useCallback, useRef, useState } from "react";

// In-memory undo/redo for the editor's field list (plan A6). Each change
// pushes the previous value; consecutive changes carrying the same `tag`
// within COALESCE_MS (typing into one box) are merged into one undo step.
const COALESCE_MS = 1000;

export function useUndoableState<T>(initial: T, limit = 50) {
  const [present, setPresent] = useState<T>(initial);
  const presentRef = useRef<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const last = useRef<{ tag: string | null; at: number }>({ tag: null, at: 0 });

  const commit = useCallback((next: T) => {
    presentRef.current = next;
    setPresent(next);
  }, []);

  const set = useCallback(
    (updater: T | ((prev: T) => T), tag?: string) => {
      const prev = presentRef.current;
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      if (next === prev) return;
      const now = Date.now();
      const coalesce = !!tag && last.current.tag === tag && now - last.current.at < COALESCE_MS;
      if (!coalesce) {
        past.current.push(prev);
        if (past.current.length > limit) past.current.shift();
      }
      future.current = [];
      last.current = { tag: tag || null, at: now };
      commit(next);
    },
    [limit, commit],
  );

  // Replace the value and forget the history (fresh load / discard).
  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    last.current = { tag: null, at: 0 };
    commit(value);
  }, [commit]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (prev === undefined) return;
    future.current.push(presentRef.current);
    last.current = { tag: null, at: 0 };
    commit(prev);
  }, [commit]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(presentRef.current);
    last.current = { tag: null, at: 0 };
    commit(next);
  }, [commit]);

  return {
    value: present,
    ref: presentRef,
    set,
    reset,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
