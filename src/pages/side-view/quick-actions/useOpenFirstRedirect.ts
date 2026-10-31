import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenFirst, openFirstPath } from "./openFirstPreference";

/**
 * Sends a logged-in user to their "Open first" screen, once per login on this tab.
 *
 * The flag is keyed by the login token, so a new login redirects again, but "Back to Main Panel" (which comes back
 * to "/") or a refresh does not bounce the user away from the page they chose to be on.
 *
 * `ready` is true once the page knows the user is logged in and can show the main panel.
 */
export const useOpenFirstRedirect = (ready: boolean) => {
  const navigate = useNavigate();
  // False once the page is gone, so a late answer never moves a user who already went somewhere else. (A ref, not an
  // effect-cleanup flag: React's development double-run would otherwise cancel the only attempt.)
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const token = localStorage.getItem("token");
    const uid = localStorage.getItem("UUID");
    if (!token || !uid) return;

    const flag = `open_first_done_${uid}_${token}`;
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
    } catch {
      return; // no session storage: never redirect (avoids a loop)
    }

    getOpenFirst().then((mode) => {
      const path = openFirstPath(mode);
      if (alive.current && path) navigate(path, { replace: true });
    });
  }, [ready, navigate]);
};
