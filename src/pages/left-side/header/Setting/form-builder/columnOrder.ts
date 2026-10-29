// Keeps the entries list's column order in step with the columns it has: columns that no longer exist are dropped,
// new ones go at the end, and the order the user set is kept.
//
// When nothing changed it returns the SAME array it was given. That matters: the list calls this from an effect that
// runs whenever its column definitions are rebuilt (which is every render), and handing React a new array each time
// re-rendered the list in an endless loop - the toolbar icons were replaced between mouse-down and mouse-up, so a click
// on an icon was lost.
export function mergeColumnOrder(prev: string[], defaultKeys: string[]): string[] {
  const kept = prev.filter((k) => defaultKeys.includes(k));
  const missing = defaultKeys.filter((k) => !kept.includes(k));
  const next = [...kept, ...missing];
  return next.length === prev.length && next.every((k, i) => k === prev[i]) ? prev : next;
}
