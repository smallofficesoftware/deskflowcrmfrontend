import { Field, useFormikContext } from "formik";
import { useCallback, useEffect, useState } from "react";
import { formatDateTimeSendDataBase } from "../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MINI_TEXT_LENGTH } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import { ICreateAccountTransaction } from "./CreateAccountTransactionController";

interface ISeriesPreview {
  manual: boolean;
  prefixes: string[];
  voucher_number: string;
}

const NO_SERIES: ISeriesPreview = { manual: false, prefixes: [], voucher_number: "" };

// Auto Reverse Entry makes a second entry of the opposite type with the same
// payment mode. It has its own series (the opposite side of the mode): a picker
// when the mode has several, the number it will get, or a typed number for a
// manual-entry mode.
const ReverseVoucherSeriesField = () => {
  const { values, setFieldValue } = useFormikContext<ICreateAccountTransaction>();
  const [preview, setPreview] = useState<ISeriesPreview>(NO_SERIES);
  const isOn = Number(values.auto_reverse_entry) === 1;
  const reverseType = Number(values.type) === 1 ? 2 : 1;

  const load = useCallback(
    async (prefix: string) => {
      if (!isOn || !values.mode || !values.type) {
        setPreview(NO_SERIES);
        return;
      }
      const paymentDate = new Date(values.payment_date_time);
      try {
        const { data } = await axiosInstance.post("accountTransactionSeriesPreview", {
          a_application_login_id: localStorage.getItem("UUID"),
          mode: values.mode,
          type: reverseType,
          sr_by_prifix: prefix || undefined,
          payment_date_time: Number.isNaN(paymentDate.getTime())
            ? undefined
            : formatDateTimeSendDataBase(paymentDate),
        });
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setPreview(data.data);
          if (!prefix && data.data.sr_by_prifix) setFieldValue("reverse_sr_by_prifix", data.data.sr_by_prifix);
        } else {
          setPreview(NO_SERIES);
        }
      } catch (error) {
        setPreview(NO_SERIES);
      }
    },
    [isOn, values.mode, values.type, values.payment_date_time, reverseType, setFieldValue],
  );

  // Switching it on, or a new mode / type, starts on the default series with no typed number
  useEffect(() => {
    setFieldValue("reverse_sr_by_prifix", "");
    setFieldValue("reverse_entered_series_number", "");
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOn, values.mode, values.type]);

  // Another series or date: the next number follows
  useEffect(() => {
    if (!isOn || !values.reverse_sr_by_prifix || !preview.prefixes.includes(values.reverse_sr_by_prifix)) return;
    load(values.reverse_sr_by_prifix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.reverse_sr_by_prifix, values.payment_date_time]);

  if (!isOn) return null;

  if (preview.manual) {
    return (
      <div className="col-6 col-md-6">
        <div className="form-group">
          <label htmlFor="reverse_entered_series_number" className="pb-2 form_label">
            Reverse Entry Voucher No. <span className="text-danger">*</span>
          </label>
          <Field
            type="text"
            name="reverse_entered_series_number"
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
            <label htmlFor="reverse_sr_by_prifix" className="pb-2 form_label">
              Reverse Entry Series
            </label>
            <Field as="select" name="reverse_sr_by_prifix" className="form-select font-size-15 rounded-1">
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
          <label htmlFor="reverse_voucher_number_preview" className="pb-2 form_label">
            Reverse Entry Voucher No.
          </label>
          <input
            id="reverse_voucher_number_preview"
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

export default ReverseVoucherSeriesField;
