import { io, Socket } from "socket.io-client";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../helpers/AppConstants";

// Lazy singleton — one socket connection per browser tab, reused by every
// listener across the app (task list, task kanban, and future boards) rather
// than each feature opening its own connection.
let socket: Socket | null = null;

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
  if (!BACKEND_OF_SMALL_OFFICE_CRM_END_POINT) return null;

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
