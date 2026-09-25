import { IBomMaterial } from "./JobCardTypes";

// Shared by the Required Material screen and the job card prints so their
// numbers always agree.

// Pending = what this job card still needs: required minus what its
// production entries already consumed (that part has already left current
// stock), floored at 0. Diff is measured against pending, not the full
// requirement, so a partly produced card doesn't show a false shortage.
export const pendingOf = (m: IBomMaterial) =>
  Math.max(0, Number(m.required_qty ?? 0) - Number(m.consumed_qty ?? 0));

// Free stock: with "consider other open job cards" on, their pending need
// (reserved_qty) is taken out of current stock and what other open job
// cards are still producing of this material (incoming_qty) is added.
export const freeStockOf = (m: IBomMaterial, considerOtherCards = false) =>
  Number(m.available_qty ?? 0) +
  (considerOtherCards ? Number(m.incoming_qty ?? 0) - Number(m.reserved_qty ?? 0) : 0);

export const diffOf = (m: IBomMaterial, deductReserved = false) =>
  freeStockOf(m, deductReserved) - pendingOf(m);
