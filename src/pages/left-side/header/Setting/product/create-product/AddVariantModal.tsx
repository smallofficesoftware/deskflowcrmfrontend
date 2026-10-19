import { FC, useState } from "react";
import { IVariantAttribute } from "./ProductVariantSection";
import { IProductCreate } from "./CreateProductController";
import { createVariantProduct } from "./variantApi";

// Multi-variant products (plans/2026-10-18-product-variants-and-qty-pricing-plan.txt,
// Q4): a variant copies its parent's non-varying fields (category/unit/tax/description)
// server-side on /create-product - this modal only asks for what actually varies
// (the attribute combination + rate), not the full ~50-field product form.

interface AddVariantModalProps {
  show: boolean;
  onHide: () => void;
  parentProduct: IProductCreate & { id: number };
  attributes: IVariantAttribute[];
  onCreated: () => void;
}

const AddVariantModal: FC<AddVariantModalProps> = ({
  show,
  onHide,
  parentProduct,
  attributes,
  onCreated,
}) => {
  const [selectedValues, setSelectedValues] = useState<{ [attributeId: number]: number }>({});
  const [rate, setRate] = useState(parentProduct.rate || "0");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const getUUID = localStorage.getItem("UUID");

  const onSubmit = async () => {
    const valueIds = attributes
      .filter((a) => a.values.length > 0)
      .map((a) => selectedValues[a.id]);

    if (valueIds.some((v) => !v)) {
      setErrorMessage("Please pick a value for every attribute.");
      return;
    }
    setErrorMessage("");
    setSaving(true);

    const label = attributes
      .filter((a) => selectedValues[a.id])
      .map((a) => a.values.find((v) => v.id === selectedValues[a.id])?.value)
      .filter(Boolean)
      .join(" / ");

    const success = await createVariantProduct(parentProduct, getUUID, label, rate, valueIds);
    setSaving(false);
    if (success) onCreated();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content_label">
        <h4 className="modal-title1 form_header_text">Add Variant</h4>
        <div className="overflow-auto" style={{ maxHeight: "400px" }}>
          <table className="table" border={0}>
            <tbody>
              {attributes
                .filter((a) => a.values.length > 0)
                .map((attribute) => (
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
              <tr>
                <td>
                  <label className="mb-1 d-block">Rate</label>
                  <input
                    type="number"
                    className="form-control"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </td>
              </tr>
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
          <button className="modal-button1" onClick={onHide} disabled={saving}>
            Cancel
          </button>
          <button
            className="modal-button2"
            style={{ color: "white" }}
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Variant"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVariantModal;
