// Process Attendance can run up to yesterday, never for today or later: a day's
// attendance is only complete once the day is over. The backend refuses the same.
// Dates are local (the user's own calendar day), not UTC.

const pad = (n: number) => String(n).padStart(2, "0");

export const toLocalIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Computed on every call so a popup left open past midnight does not go stale.
export const getYesterdayIso = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalIsoDate(d);
};

export const clampToLastProcessable = (iso: string): string => {
  const yesterday = getYesterdayIso();
  return iso > yesterday ? yesterday : iso;
};

// First day of the month that yesterday falls in (on the 1st this is the previous month).
export const getDefaultFromDate = (): string => `${getYesterdayIso().slice(0, 8)}01`;

export const TODAY_NOT_ALLOWED_MESSAGE =
  "Today's attendance cannot be processed. Select dates up to yesterday.";
