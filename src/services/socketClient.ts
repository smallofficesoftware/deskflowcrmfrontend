import { io, Socket } from "socket.io-client";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../helpers/AppConstants";

// Lazy singleton — one socket connection per browser tab, reused by every
// listener across the app (task list, task kanban, and future boards) rather
// than each feature opening its own connection.
let socket: Socket | null = null;

// Per-login (team member) opt-in, not company-wide — LeftSideView.tsx sets
// this from loginById.socket_connection_switch (a_application_logins column,
// default 0/off). Defaults false here too, until that check resolves one
// way or the other, so no connection is ever attempted before it's known.
let socketConnectionEnabled = false;
export const setSocketConnectionEnabled = (enabled: boolean) => {
  socketConnectionEnabled = enabled;
  if (!enabled && socket) {
    socket.disconnect();
  }
};

const registerSession = (activeSocket: Socket) => {
  const uuid = localStorage.getItem("UUID");
  if (!uuid) return;

  // Company room join resolved server-side from login id — COMPANY_ID in
  // localStorage is only set by some login flows, so it can't be relied on.
  activeSocket.emit("joinCompanyRoom", { a_application_login_id: uuid });

  const companyId = localStorage.getItem("COMPANY_ID");
  if (!companyId) return;

  // Matches the backend's parseSession format: `a<login_id>_c<company_id>`.
  activeSocket.emit("storeSocketID", {
    sessions: [`a${uuid}_c${companyId}`],
    socketID: activeSocket.id,
  });
};

export const getSocket = (): Socket | null => {
  if (!BACKEND_OF_SMALL_OFFICE_CRM_END_POINT || !socketConnectionEnabled) return null;

  if (!socket) {
    socket = io(BACKEND_OF_SMALL_OFFICE_CRM_END_POINT, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => {
      if (socket) registerSession(socket);
    });
  } else if (socket.disconnected) {
    socket.connect();
  }

  return socket;
};
