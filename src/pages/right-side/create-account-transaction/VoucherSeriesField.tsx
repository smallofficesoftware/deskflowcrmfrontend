import { Field, useFormikContext } from "formik";
import { useCallback, useEffect, useState } from "react";
import { formatDateTimeSendDataBase } from "../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MINI_TEXT_LENGTH } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import { ICreateAccountTransaction } from "./CreateAccountTransactionController";

interface IPropsVoucherSeriesField {
  transactionId?: number;
  savedVoucherNumber?: string | null;
}

interface ISeriesPreview {
  manual: boolean;
  prefixes: string[];
  voucher_number: string;
}

const NO_SERIES: ISeriesPreview = { manual: false, prefixes: [], voucher_number: "" };

// Voucher number of a new account transaction, from the series set on the
// chosen payment mode for the chosen credit / debit side: a series picker when
// the mode has several prefixes, the number the transaction will get (it moves
// when the series, mode, type or date change), or a typed number when the mode
// is set to manual entry. Nothing when the mode has no series.
const VoucherSeriesField = ({ transactionId, savedVoucherNumber }: IPropsVoucherSeriesField) => {
  const { values, setFieldValue } = useFormikContext<ICreateAccountTransaction>();
  const [preview, setPreview] = useState<ISeriesPreview>(NO_SERIES);

  const load = useCallback(
    async (prefix: string) => {
      if (!values.mode || !values.type) {
        setPreview(NO_SERIES);
        return;
      }
      const paymentDate = new Date(values.payment_date_time);
      try {
        const { data } = await axiosInstance.post("accountTransactionSeriesPreview", {
          a_application_login_id: localStorage.getItem("UUID"),
          mode: values.mode,
          type: values.type,
          sr_by_prifix: prefix || undefined,
          payment_date_time: Number.isNaN(paymentDate.getTime())
            ? undefined
            : formatDateTimeSendDataBase(paymentDate),
        });
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setPreview(data.data);
          if (!prefix && data.data.sr_by_prifix) setFieldValue("sr_by_prifix", data.data.sr_by_prifix);
        } else {
          setPreview(NO_SERIES);
        }
      } catch (error) {
        setPreview(NO_SERIES);
      }
    },
    [values.mode, values.type, values.payment_date_time, setFieldValue],
  );

  // A new mode / type starts on its default series with no typed number
  useEffect(() => {
    if (transactionId) return;
    setFieldValue("sr_by_prifix", "");
    setFieldValue("entered_series_number", "");
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.mode, values.type, transactionId]);

  // Another series or date: the next number follows
  useEffect(() => {
    if (transactionId || !values.sr_by_prifix || !preview.prefixes.includes(values.sr_by_prifix)) return;
    load(values.sr_by_prifix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.sr_by_prifix, values.payment_date_time]);

  // The number is given when the transaction is created and not changed after:
  // an edit shows it as it was saved (an old entry without one shows its id)
  if (transactionId) {
    return (
      <div className="col-6 col-md-6">
        <div className="form-group">
          <label htmlFor="saved_voucher_number" className="pb-2 form_label">
            {savedVoucherNumber ? "Voucher No." : "Transaction ID"}
          </label>
          <input
            id="saved_voucher_number"
            type="text"
            readOnly
            disabled
            value={savedVoucherNumber || `#${transactionId}`}
            className="form-control font-size-15 rounded-1"
          />
        </div>
      </div>
    );
  }

  if (preview.manual) {
    return (
      <div className="col-6 col-md-6">
        <div className="form-group">
          <label htmlFor="entered_series_number" className="pb-2 form_label">
            Voucher No. <span className="text-danger">*</span>
          </label>
          <Field
            type="text"
            name="entered_series_number"
            maxLength={MINI_TEXT_LENGTH}
            className="form-control font-size-15 rounded-1"
          />
        </div>
      </div>
    );
  }

  if (!preview.prefixes.length) return null;

  return (
    <>
      {preview.prefixes.length > 1 && (
        <div className="col-6 col-md-6">
          <div className="form-group">
            <label htmlFor="sr_by_prifix" className="pb-2 form_label">
              Series
            </label>
            <Field as="select" name="sr_by_prifix" className="form-select font-size-15 rounded-1">
              {preview.prefixes.map((prefix) => (
                <option key={prefix} value={prefix}>
                  {prefix}
                </option>
              ))}
            </Field>
          </div>
        </div>
      )}
      <div className="col-6 col-md-6">
        <div className="form-group">
          <label htmlFor="voucher_number_preview" className="pb-2 form_label">
            Voucher No.
          </label>
          <input
            id="voucher_number_preview"
            type="text"
            readOnly
            disabled
            value={preview.voucher_number}
            className="form-control font-size-15 rounded-1"
          />
        </div>
      </div>
    </>
  );
};

export default VoucherSeriesField;
