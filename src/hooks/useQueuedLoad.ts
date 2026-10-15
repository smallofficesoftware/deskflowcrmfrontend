import { useRef } from "react";

// Report grids load with an "is a load already running?" guard. The old guard
// simply returned when one was running, which dropped the newer request: on first
// open the first load goes out before the default filters (e.g. this month's dates)
// are in the store, the filtered second load arrived while it was still running,
// was thrown away, and the unfiltered result stayed on screen under a filter label
// that said otherwise.
//
// With this, a request that arrives during a load is remembered (only the newest
// one) and run as soon as the running load ends, with the newest loader.
//
// Use:  guard line      ->  if (isFetchingRef.current) { queuedLoad.defer(...sameArgs); return; }
//       end of finally  ->  queuedLoad.runQueued();
//       after the fn    ->  queuedLoad.setRunner(loadFn);   (runs every render, so it is the newest)
export interface QueuedLoad<A extends unknown[]> {
  /** Remember the newest request made while a load is running (replaces an older one). */
  defer: (...args: A) => void;
  /** Run the remembered request, if any. Call when the running load has finished. */
  runQueued: () => void;
  /** Register the loader to call; pass the newest one on every render. */
  setRunner: (runner: (...args: A) => unknown) => void;
}

export function createQueuedLoad<A extends unknown[]>(): QueuedLoad<A> {
  let queued: A | null = null;
  let runner: ((...args: A) => unknown) | null = null;

  return {
    defer: (...args: A) => {
      queued = args;
    },
    runQueued: () => {
      const next = queued;
      if (!next) return;
      queued = null;
      runner?.(...next);
    },
    setRunner: (fn) => {
      runner = fn;
    },
  };
}

// One stable instance per component.
export function useQueuedLoad<A extends unknown[]>(): QueuedLoad<A> {
  const ref = useRef<QueuedLoad<A> | null>(null);
  if (ref.current === null) ref.current = createQueuedLoad<A>();
  return ref.current;
}
