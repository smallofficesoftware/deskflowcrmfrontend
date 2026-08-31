import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getSocket,
  getSocketConnectionEnabledSnapshot,
  subscribeSocketConnectionEnabled,
} from "../services/socketClient";

/**
 * Subscribes to a company-broadcast socket event for the lifetime of the
 * calling component. Multiple components can listen to the same event
 * (e.g. "task-changed") independently — they share the one underlying
 * socket connection via getSocket().
 *
 * The subscription itself only (re)attaches when `event`/`enabled` change,
 * but `handler` always runs its latest version via a ref — so a handler
 * that closes over props/state (e.g. "only refresh if this payload's id
 * matches the record I'm currently showing") stays correct even when that
 * state changes without the component unmounting.
 *
 * connectionEnabled is pulled in via useSyncExternalStore, not read once —
 * LeftSideView.tsx's own socket_connection_switch check only resolves
 * after an async fetch, well after this hook's first mount, so without
 * this the effect below would call getSocket() once while it's still
 * false, get null back, and never retry once the real value arrives.
 */
const useSocketEvent = <T = unknown>(
  event: string,
  handler: (payload: T) => void,
  enabled: boolean = true,
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const connectionEnabled = useSyncExternalStore(
    subscribeSocketConnectionEnabled,
    getSocketConnectionEnabledSnapshot,
  );

  useEffect(() => {
    if (!enabled || !connectionEnabled) return;
    const socket = getSocket();
    if (!socket) return;

    const stableHandler = (payload: T) => handlerRef.current(payload);
    socket.on(event, stableHandler);
    return () => {
      socket.off(event, stableHandler);
    };
  }, [event, enabled, connectionEnabled]);
};

export default useSocketEvent;
