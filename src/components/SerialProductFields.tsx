import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../helpers/AppConstants";
import { axiosInstance } from "../services/axiosInstance";

interface ISerialFormValues {
  serial_number?: string;
  is_serial_required?: boolean;
}

const getLoginId = () => localStorage.getItem("UUID");

const fetchSerialSystemOn = async () => {
  try {
    const { data } = await axiosInstance.post("serial-requirement", {
      a_application_login_id: getLoginId(),
    });
    return data.ack === DEFAULT_STATUS_CODE_SUCCESS && !!data.data?.is_serial_required;
  } catch {
    return false;
  }
};

const lookupSerial = async (serialNumber: string) => {
  try {
    const { data } = await axiosInstance.post("serial-requirement/lookup", {
      a_application_login_id: getLoginId(),
      serial_number: serialNumber,
    });
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) return null;
    return data.data as { found: boolean; product_name: string };
  } catch {
    return null;
  }
};

/**
 * Serial Number entry for Task / Support Ticket / Visit forms. Rendered only
 * when the company has a serial-tracked product; the product the serial
 * belongs to is shown as a label under the input. Must sit inside a Formik
 * form whose values include serial_number and is_serial_required.
 */
const SerialProductFields = ({ requiredOnSave = true }: { requiredOnSave?: boolean }) => {
  const { values, setFieldValue, errors, touched } =
    useFormikContext<ISerialFormValues>();
  const [systemOn, setSystemOn] = useState(false);
  const [productName, setProductName] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchSerialSystemOn().then(setSystemOn);
  }, []);

  useEffect(() => {
    setFieldValue("is_serial_required", systemOn && requiredOnSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemOn, requiredOnSave]);

  const serial = String(values.serial_number || "").trim();

  // Debounced lookup so the product label follows what the user types / loads on edit.
  useEffect(() => {
    if (!systemOn || !serial) {
      setProductName("");
      setNotFound(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await lookupSerial(serial);
      if (cancelled || !result) return;
      setProductName(result.found ? result.product_name : "");
      setNotFound(!result.found);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [serial, systemOn]);

  if (!systemOn) return null;

  const fieldError =
    touched.serial_number && (errors as any).serial_number
      ? (errors as any).serial_number
      : "";

  return (
    <div className="w-100 mb-3">
      <div className="form-group text-start">
        <label className="mb-1 form_label">
          Serial Number
          {requiredOnSave && <span className="text-danger">*</span>}
        </label>
        <input
          type="text"
          name="serial_number"
          value={values.serial_number || ""}
          onChange={(e) => setFieldValue("serial_number", e.target.value)}
          maxLength={100}
          className={`form-control font-size-15 rounded-1 ${
            fieldError || notFound ? "is-invalid input-box-error" : ""
          }`}
          placeholder="Enter serial number"
        />
        {productName && (
          <label className="mt-1 form_label text-success">
            Product: {productName}
          </label>
        )}
        {notFound && (
          <div className="field-error text-danger">Serial number not found</div>
        )}
        {fieldError && <div className="field-error text-danger">{fieldError}</div>}
      </div>
    </div>
  );
};

export default SerialProductFields;
