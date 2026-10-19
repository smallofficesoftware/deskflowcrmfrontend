export interface IPaymentTypeSeries {
  credit_series_prefix: string;
  credit_series_pattern: string;
  credit_sr_manual: number;
  debit_series_prefix: string;
  debit_series_pattern: string;
  debit_sr_manual: number;
}

export const EMPTY_PAYMENT_TYPE_SERIES: IPaymentTypeSeries = {
  credit_series_prefix: "",
  credit_series_pattern: "",
  credit_sr_manual: 0,
  debit_series_prefix: "",
  debit_series_pattern: "",
  debit_sr_manual: 0,
};

// Suggested series of a new payment type: Bank (0) = BR / BP, Cash = CR / CP
export const defaultSeriesForMode = (transactionMode: number): IPaymentTypeSeries => ({
  credit_series_prefix: transactionMode === 0 ? "BR" : "CR",
  credit_series_pattern: "1/2/3A",
  credit_sr_manual: 0,
  debit_series_prefix: transactionMode === 0 ? "BP" : "CP",
  debit_series_pattern: "1/2/3A",
  debit_sr_manual: 0,
});

interface IPropsPaymentTypeSeriesFields {
  value: IPaymentTypeSeries;
  onChange: (value: IPaymentTypeSeries) => void;
}

const SIDES = [
  { key: "credit", title: "Credit (Receipt) Series" },
  { key: "debit", title: "Debit (Payment) Series" },
] as const;

// Voucher series of a payment mode, one block for credit and one for debit:
// comma-separated prefixes (e.g. CR,CR-B), a pattern like the invoice series
// (1 = prefix, 2 = number, 3A = 2026-2027, 3a = 26-27) and a manual-entry switch.
const PaymentTypeSeriesFields = ({ value, onChange }: IPropsPaymentTypeSeriesFields) => (
  <>
    {SIDES.map(({ key, title }) => (
      <div className="col-12 mt-3" key={key}>
        <label className="form-check-label">
          <h6>{title}</h6>
        </label>
        <label className="form-label mb-1" htmlFor={`${key}_series_prefix`}>
          Series (Prefix)
        </label>
        <input
          type="text"
          id={`${key}_series_prefix`}
          className="form-control"
          placeholder="e.g. CR or CR,CR-B"
          value={value[`${key}_series_prefix`]}
          onChange={(e) => onChange({ ...value, [`${key}_series_prefix`]: e.target.value })}
        />
        <small className="text-muted d-block mb-2">
          You can add more than one series, separated by a comma (CR,CR-B). While adding a transaction the user picks one; the first is used by default.
        </small>
        <label className="form-label mb-1" htmlFor={`${key}_series_pattern`}>
          Number Pattern
        </label>
        <input
          type="text"
          id={`${key}_series_pattern`}
          className="form-control"
          placeholder="e.g. 1/2/3A"
          value={value[`${key}_series_pattern`]}
          onChange={(e) => onChange({ ...value, [`${key}_series_pattern`]: e.target.value })}
        />
        <small className="text-muted d-block mb-2">
          1 = series, 2 = number, 3A = year 2026-2027, 3a = year 26-27. Example 1/2/3a gives {value[`${key}_series_prefix`].split(",")[0].trim() || "BR"}/01/26-27
        </small>
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id={`${key}_sr_manual`}
            checked={value[`${key}_sr_manual`] === 1}
            onChange={(e) => onChange({ ...value, [`${key}_sr_manual`]: e.target.checked ? 1 : 0 })}
          />
          <label className="form-check-label" htmlFor={`${key}_sr_manual`}>
            Enter voucher number manually
          </label>
        </div>
      </div>
    ))}
  </>
);

export default PaymentTypeSeriesFields;
