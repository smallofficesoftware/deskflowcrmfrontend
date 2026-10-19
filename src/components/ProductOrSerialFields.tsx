import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../helpers/AppConstants";
import { axiosInstance } from "../services/axiosInstance";

interface IProductFormValues {
  product_id?: number | string;
  serial_number?: string;
  is_serial_required?: boolean;
}

interface IProductOption {
  id: number;
  product_name: string;
  is_serial_number: number | string;
}

const getLoginId = () => localStorage.getItem("UUID");

const fetchProductOptions = async (): Promise<IProductOption[]> => {
  try {
    const { data } = await axiosInstance.post("serial-requirement/products", {
      a_application_login_id: getLoginId(),
    });
    return data.ack === DEFAULT_STATUS_CODE_SUCCESS ? data.data?.item || [] : [];
  } catch {
    return [];
  }
};

/**
 * Product link for Task / Support Ticket / Visit forms. A Product dropdown is
 * always shown; picking a serial-tracked product also asks for its serial
 * number. Must sit inside a Formik form whose values include product_id,
 * serial_number and is_serial_required.
 */
const ProductOrSerialFields = () => {
  const { values, setFieldValue, errors, touched } =
    useFormikContext<IProductFormValues>();
  const [products, setProducts] = useState<IProductOption[]>([]);

  useEffect(() => {
    fetchProductOptions().then(setProducts);
  }, []);

  const selected = products.find((p) => String(p.id) === String(values.product_id));
  const needsSerial = !!selected && Number(selected.is_serial_number) === 2;

  // The forms' submit check blocks a save while a serial product has no serial.
  useEffect(() => {
    setFieldValue("is_serial_required", needsSerial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSerial]);

  const onProductChange = (productId: string) => {
    setFieldValue("product_id", productId);
    setFieldValue("serial_number", "");
  };

  const serialError =
    touched.serial_number && (errors as any).serial_number
      ? (errors as any).serial_number
      : "";

  return (
    <>
      <div className="w-100 mb-3">
        <div className="form-group text-start">
          <label className="mb-1 form_label">Product</label>
          <select
            name="product_id"
            value={values.product_id || ""}
            onChange={(e) => onProductChange(e.target.value)}
            className="form-select font-size-15 rounded-1"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {needsSerial && (
        <div className="w-100 mb-3">
          <div className="form-group text-start">
            <label className="mb-1 form_label">
              Serial Number<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="serial_number"
              value={values.serial_number || ""}
              onChange={(e) => setFieldValue("serial_number", e.target.value)}
              maxLength={100}
              className={`form-control font-size-15 rounded-1 ${
                serialError ? "is-invalid input-box-error" : ""
              }`}
              placeholder="Enter serial number"
            />
            {serialError && <div className="field-error text-danger">{serialError}</div>}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductOrSerialFields;
