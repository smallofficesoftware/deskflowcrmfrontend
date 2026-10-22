import { FC, useState } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import { IVariantAttribute, IVariantRow } from "./ProductVariantSection";

// Multi-variant products (plans/2026-10-18-product-variants-and-qty-pricing-plan.txt).
// Changes an EXISTING variant's attribute combination (e.g. Red/Small -> Blue/Medium) -
// AddVariantModal only ever sets this once, at creation. This never touches the
// product row itself (rate/image/etc already editable via the normal CreateProductView
// click-through) - it only calls set-variant-option-values, which is already idempotent
// (replaces prior links), so this is a pure "change the selection, re-save" flow.

interface EditVariantAttributesModalProps {
  show: boolean;
  onHide: () => void;
  variant: IVariantRow;
  attributes: IVariantAttribute[];
  onSaved: () => void;
}

/** The variant's CURRENT selection only has {attribute_name, value} labels (from
 * getVariants' join) - resolve each back to its value id by matching against the
 * full attribute/value catalog, so the dropdowns can come pre-selected. */
const resolveCurrentValueIds = (
  variant: IVariantRow,
  attributes: IVariantAttribute[]
): { [attributeId: number]: number } => {
  const result: { [attributeId: number]: number } = {};
  for (const option of variant.variant_options) {
    const attribute = attributes.find((a) => a.attribute_name === option.attribute_name);
    const value = attribute?.values.find((v) => v.value === option.value);
    if (attribute && value) result[attribute.id] = value.id;
  }
  return result;
};

const EditVariantAttributesModal: FC<EditVariantAttributesModalProps> = ({
  show,
  onHide,
  variant,
  attributes,
  onSaved,
}) => {
  const [selectedValues, setSelectedValues] = useState<{ [attributeId: number]: number }>(
    () => resolveCurrentValueIds(variant, attributes)
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const getUUID = localStorage.getItem("UUID");
  const usableAttributes = attributes.filter((a) => a.values.length > 0);

  const onSubmit = async () => {
    const valueIds = usableAttributes.map((a) => selectedValues[a.id]);
    if (valueIds.some((v) => !v)) {
      setErrorMessage("Please pick a value for every attribute.");
      return;
    }
    setErrorMessage("");
    setSaving(true);

    try {
      const { data } = await axiosInstance.post("set-variant-option-values", {
        a_application_login_id: getUUID,
        product_id: variant.id,
        product_variant_attribute_value_ids: valueIds,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("Variant attributes updated");
        onSaved();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content_label" style={{ textAlign: "left" }}>
        <h4 className="modal-title1 form_header_text">
          Edit Attributes - {variant.product_name}
        </h4>
        <div className="overflow-auto" style={{ maxHeight: "400px" }}>
          <table className="table" border={0}>
            <tbody>
              {usableAttributes.map((attribute) => (
                <tr key={attribute.id}>
                  <td>
                    <label className="mb-1 d-block">{attribute.attribute_name}</label>
                    <select
                      className="form-select"
                      value={selectedValues[attribute.id] || ""}
                      onChange={(e) =>
                        setSelectedValues((prev) => ({
                          ...prev,
                          [attribute.id]: Number(e.target.value),
                        }))
                      }
                    >
                      <option value="">Select {attribute.attribute_name}</option>
                      {attribute.values.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.value}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {errorMessage && (
                <tr>
                  <td>
                    <span className="text-danger">{errorMessage}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-buttons">
          <button type="button" className="modal-button1" onClick={onHide} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-button2"
            style={{ color: "white" }}
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVariantAttributesModal;
