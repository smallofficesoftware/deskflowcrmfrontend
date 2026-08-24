import { useEffect } from "react";
import { getSocket } from "../services/socketClient";

/**
 * Subscribes to a company-broadcast socket event for the lifetime of the
 * calling component. Multiple components can listen to the same event
 * (e.g. "task-changed") independently — they share the one underlying
 * socket connection via getSocket().
 */
const useSocketEvent = <T = unknown>(
  event: string,
  handler: (payload: T) => void,
  enabled: boolean = true,
) => {
  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, enabled]);
};

export default useSocketEvent;
