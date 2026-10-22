import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  IVariantAttribute,
  IVariantRow,
} from "../../../pages/left-side/header/Setting/product/create-product/ProductVariantSection";

// Order Creation's product picker shows a variant Parent as one entry representing its
// whole family (plans/2026-10-20-product-variant-ui-and-field-scoping-plan.txt) - picking
// it opens this popup instead of adding straight to cart. Cascading dropdowns (one per
// attribute, in order) resolve to a single real Variant row once every attribute has a
// value picked; that row is what actually gets added to the cart.

interface SelectVariantModalProps {
  show: boolean;
  onHide: () => void;
  parentProduct: { id: number; product_name: string };
  onVariantSelected: (variant: IVariantRow) => void;
}

const SelectVariantModal: FC<SelectVariantModalProps> = ({
  show,
  onHide,
  parentProduct,
  onVariantSelected,
}) => {
  const [attributes, setAttributes] = useState<IVariantAttribute[]>([]);
  const [variants, setVariants] = useState<IVariantRow[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [attributeId: number]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !parentProduct?.id) return;
    setLoading(true);
    setSelectedValues({});

    Promise.all([
      axiosInstance.post("get-variant-attributes", {
        a_application_login_id: localStorage.getItem("UUID"),
        parent_product_id: parentProduct.id,
      }),
      axiosInstance.post("get-variants", {
        parent_product_id: parentProduct.id,
      }),
    ])
      .then(([attrRes, variantRes]) => {
        if (attrRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setAttributes(attrRes.data.data?.item || []);
        }
        if (variantRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setVariants(variantRes.data.data?.item || []);
        }
      })
      .catch(() => toast.error("Failed to load variants"))
      .finally(() => setLoading(false));
  }, [show, parentProduct?.id]);

  if (!show) return null;

  const allAttributesPicked =
    attributes.length > 0 && attributes.every((a) => !!selectedValues[a.id]);

  // Match by label (variant_options only carries {attribute_name, value} labels, not
  // value ids), same resolution approach already used elsewhere for variants.
  const resolvedVariant = allAttributesPicked
    ? variants.find((v) =>
        attributes.every((attribute) => {
          const pickedLabel = selectedValues[attribute.id];
          return v.variant_options.some(
            (o) => o.attribute_name === attribute.attribute_name && o.value === pickedLabel
          );
        })
      )
    : undefined;

  const handleAdd = () => {
    if (!resolvedVariant) return;
    onVariantSelected(resolvedVariant);
    onHide();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 999999999 }}>
      <div className="modal-content_label" style={{ maxWidth: 480, textAlign: "left" }}>
        <h4 className="modal-title1 form_header_text">
          Select Variant - {parentProduct.product_name}
        </h4>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : attributes.length === 0 ? (
          <p className="text-danger">This product has no variants set up yet.</p>
        ) : (
          <div className="py-2">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="mb-3">
                <label className="mb-1 d-block fw-bold">{attribute.attribute_name}</label>
                <select
                  className="form-select"
                  value={selectedValues[attribute.id] || ""}
                  onChange={(e) =>
                    setSelectedValues((prev) => ({ ...prev, [attribute.id]: e.target.value }))
                  }
                >
                  <option value="">Select {attribute.attribute_name}</option>
                  {attribute.values.map((v) => (
                    <option key={v.id} value={v.value}>
                      {v.value}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {allAttributesPicked && (
              <div
                className={`p-2 mb-2 rounded ${resolvedVariant ? "bg-light" : "bg-light text-danger"}`}
              >
                {resolvedVariant ? (
                  <span>
                    <b>{resolvedVariant.product_name}</b> - Rate: {resolvedVariant.rate}
                  </span>
                ) : (
                  <span>This combination is not available.</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="modal-buttons">
          <button type="button" className="modal-button1" onClick={onHide}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-button2"
            style={{ color: "white" }}
            onClick={handleAdd}
            disabled={!resolvedVariant}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectVariantModal;
