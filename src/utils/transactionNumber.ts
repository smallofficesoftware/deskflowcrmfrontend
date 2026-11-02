// How an account transaction is numbered on screen:
//   voucher number + payment date before 01-04-2027 -> "CR/01/2026-2027 (#256)"
//   voucher number + payment date from 01-04-2027    -> "CR/01/2027-2028"
//   no voucher number (entry made before the series) -> "#256"
// Keep in step with backend src/utils/transactionNumber.js.

const ID_HIDDEN_FROM = { year: 2027, month: 4, day: 1 };

const toYmd = (value: unknown): { y: number; m: number; d: number } | null => {
  if (!value) return null;
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return { y: +match[1], m: +match[2], d: +match[3] };
  match = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (match) return { y: +match[3], m: +match[2], d: +match[1] };
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return { y: parsed.getFullYear(), m: parsed.getMonth() + 1, d: parsed.getDate() };
};

const isIdHidden = (paymentDate: unknown): boolean => {
  const date = toYmd(paymentDate);
  if (!date) return false;
  const a = date.y * 10000 + date.m * 100 + date.d;
  const b = ID_HIDDEN_FROM.year * 10000 + ID_HIDDEN_FROM.month * 100 + ID_HIDDEN_FROM.day;
  return a >= b;
};

export const formatTransactionNumber = (
  voucherNumber: string | null | undefined,
  id: number | string | null | undefined,
  paymentDate?: unknown,
): string => {
  const voucher = String(voucherNumber ?? "").trim();
  if (!voucher) return `#${id ?? ""}`;
  return isIdHidden(paymentDate) ? voucher : `${voucher} (#${id ?? ""})`;
};
