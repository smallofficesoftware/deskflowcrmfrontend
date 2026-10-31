// Per-device preference for the "today's work" popup (Personal Settings). Kept per logged-in user
// on this browser, so it never needs a server setting.
//
//   daily - once a calendar day (default)
//   login - every time the user logs in (a new login token)
//   checkin - every time the user checks in (see markMyDayCheckedIn)
//   off   - never

export type TMyDayMode = "daily" | "login" | "checkin" | "off";

export const MY_DAY_MODE_LABEL: Record<TMyDayMode, string> = {
  daily: "Once a day",
  login: "Every time I log in",
  checkin: "Every time I check in",
  off: "Off",
};

const userId = () => localStorage.getItem("UUID") || "";
const modeKey = () => `my_day_popup_mode_${userId()}`;
const legacyEnabledKey = () => `my_day_popup_enabled_${userId()}`;
const shownKey = () => `my_day_popup_shown_${userId()}`;
const checkedInKey = () => `my_day_popup_checkin_${userId()}`;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// What "already shown" means for each mode: today's date, or this login's token.
const shownMarker = (mode: TMyDayMode) => (mode === "login" ? `login:${localStorage.getItem("token") || ""}` : today());

export const getMyDayMode = (): TMyDayMode => {
  try {
    const saved = localStorage.getItem(modeKey());
    if (saved === "daily" || saved === "login" || saved === "checkin" || saved === "off") return saved;
    // Earlier on/off switch: off stays off.
    if (localStorage.getItem(legacyEnabledKey()) === "0") return "off";
  } catch {
    /* storage unavailable: use the default */
  }
  return "daily";
};

export const setMyDayMode = (mode: TMyDayMode) => {
  try {
    localStorage.setItem(modeKey(), mode);
    // A new choice should show the popup again right away.
    localStorage.removeItem(shownKey());
  } catch {
    /* ignore */
  }
};

export const shouldShowMyDay = (): boolean => {
  const mode = getMyDayMode();
  if (mode === "off") return false;
  try {
    // Check-in mode waits for a check-in that has not been shown yet.
    if (mode === "checkin") return localStorage.getItem(checkedInKey()) === "1";
    return localStorage.getItem(shownKey()) !== shownMarker(mode);
  } catch {
    return true;
  }
};

/** Call after the logged-in user's own check-in succeeds; the popup then shows once (in "checkin" mode). */
export const markMyDayCheckedIn = () => {
  try {
    localStorage.setItem(checkedInKey(), "1");
  } catch {
    /* ignore */
  }
};

export const markMyDayShown = () => {
  try {
    if (getMyDayMode() === "checkin") {
      localStorage.removeItem(checkedInKey());
      return;
    }
    localStorage.setItem(shownKey(), shownMarker(getMyDayMode()));
  } catch {
    /* ignore */
  }
};
