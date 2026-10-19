import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import AddVariantModal from "./AddVariantModal";
import GenerateVariantsModal from "./GenerateVariantsModal";
import EditVariantAttributesModal from "./EditVariantAttributesModal";
import CreateProductView from "./CreateProductView";
import { IProductCreate } from "./CreateProductController";
import { IProductView } from "../ProductController";

// Multi-variant products (plans/2026-10-18-product-variants-and-qty-pricing-plan.txt).
// Rendered inside CreateProductView.tsx only once a product is saved with
// "Has Variants" on - attributes/variants need a real parent_product_id to attach to,
// so there is nothing to manage yet for an unsaved new product.

export interface IVariantAttributeValue {
  id: number;
  value: string;
}
export interface IVariantAttribute {
  id: number;
  attribute_name: string;
  values: IVariantAttributeValue[];
}
export interface IVariantRow {
  id: number;
  product_name: string;
  rate: string;
  product_img?: string;
  variant_options: { attribute_name: string; value: string }[];
}

interface ProductVariantSectionProps {
  parentProduct: IProductCreate & { id: number };
}

const ProductVariantSection: FC<ProductVariantSectionProps> = ({ parentProduct }) => {
  const [attributes, setAttributes] = useState<IVariantAttribute[]>([]);
  const [variants, setVariants] = useState<IVariantRow[]>([]);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<{ [attributeId: number]: string }>({});
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [showGenerateVariants, setShowGenerateVariants] = useState(false);
  const [editingVariant, setEditingVariant] = useState<IVariantRow | null>(null);
  const [editingAttributesVariant, setEditingAttributesVariant] = useState<IVariantRow | null>(null);
  const [variantRefresh, setVariantRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  const getUUID = localStorage.getItem("UUID");

  const fetchAttributes = async () => {
    try {
      const { data } = await axiosInstance.post("get-variant-attributes", {
        a_application_login_id: getUUID,
        parent_product_id: parentProduct.id,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setAttributes(data.data?.item || []);
      }
    } catch {
      toast.error("Failed to load variant attributes");
    }
  };

  const fetchVariants = async () => {
    try {
      const { data } = await axiosInstance.post("get-variants", {
        parent_product_id: parentProduct.id,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setVariants(data.data?.item || []);
      }
    } catch {
      toast.error("Failed to load variants");
    }
  };

  useEffect(() => {
    if (!parentProduct?.id) return;
    setLoading(true);
    Promise.all([fetchAttributes(), fetchVariants()]).finally(() => setLoading(false));
  }, [parentProduct?.id]);

  // CreateProductView (reused below to edit a variant's own fields - image, rate, etc.)
  // calls its setRefreshProduct(true) on a successful save, same as it does for any
  // normal product edit - this just forwards that signal into a variant-list refetch.
  useEffect(() => {
    if (!variantRefresh) return;
    setVariantRefresh(false);
    fetchVariants();
  }, [variantRefresh]);

  const addAttribute = async () => {
    if (!newAttributeName.trim()) return;
    try {
      const { data } = await axiosInstance.post("create-variant-attribute", {
        a_application_login_id: getUUID,
        parent_product_id: parentProduct.id,
        attribute_name: newAttributeName.trim(),
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setNewAttributeName("");
        fetchAttributes();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const removeAttribute = async (id: number) => {
    try {
      await axiosInstance.post("delete-variant-attribute", { id });
      fetchAttributes();
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const addValue = async (attributeId: number) => {
    const value = (newValueInputs[attributeId] || "").trim();
    if (!value) return;
    try {
      const { data } = await axiosInstance.post("create-variant-attribute-value", {
        a_application_login_id: getUUID,
        product_variant_attribute_id: attributeId,
        value,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setNewValueInputs((prev) => ({ ...prev, [attributeId]: "" }));
        fetchAttributes();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const removeValue = async (id: number) => {
    try {
      await axiosInstance.post("delete-variant-attribute-value", { id });
      fetchAttributes();
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const hasAnyValue = attributes.some((a) => a.values.length > 0);

  return (
    <div className="col-12">
      <hr />
      <h5 className="mb-3">Variant Attributes</h5>

      {attributes.map((attribute) => (
        <div key={attribute.id} className="mb-3 d-flex flex-wrap align-items-center gap-2">
          <strong style={{ minWidth: 100 }}>{attribute.attribute_name}</strong>
          {attribute.values.map((v) => (
            <span key={v.id} className="badge bg-light text-dark border">
              {v.value}{" "}
              <button
                type="button"
                className="btn btn-sm p-0 ms-1 text-danger"
                style={{ border: "none", background: "none" }}
                onClick={() => removeValue(v.id)}
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: 140 }}
            placeholder="Add value"
            value={newValueInputs[attribute.id] || ""}
            onChange={(e) =>
              setNewValueInputs((prev) => ({ ...prev, [attribute.id]: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addValue(attribute.id)}
          />
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => addValue(attribute.id)}
          >
            Add
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => removeAttribute(attribute.id)}
          >
            Remove attribute
          </button>
        </div>
      ))}

      <div className="d-flex align-items-center gap-2 mb-4">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 180 }}
          placeholder="New attribute (e.g. Color)"
          value={newAttributeName}
          onChange={(e) => setNewAttributeName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAttribute()}
        />
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addAttribute}>
          Add attribute
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Variants</h5>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={!hasAnyValue}
            title={!hasAnyValue ? "Add at least one attribute value first" : undefined}
            onClick={() => setShowGenerateVariants(true)}
          >
            Generate All Combinations
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={!hasAnyValue}
            title={!hasAnyValue ? "Add at least one attribute value first" : undefined}
            onClick={() => setShowAddVariant(true)}
          >
            + Add Variant
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : variants.length === 0 ? (
        <p className="text-muted">No variants yet.</p>
      ) : (
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Options</th>
              <th>Rate</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr
                key={v.id}
                role="button"
                onClick={() => setEditingVariant(v)}
                style={{ cursor: "pointer" }}
                title="Click to edit this variant"
              >
                <td>{v.product_name}</td>
                <td>
                  {v.variant_options
                    .map((o) => `${o.attribute_name}: ${o.value}`)
                    .join(", ")}
                </td>
                <td>{v.rate}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    // Edits attribute selection only - separate from the row click above
                    // (which opens the full product edit for rate/image/etc) - stop the
                    // row's own onClick from also firing.
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAttributesVariant(v);
                    }}
                  >
                    Edit Attributes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddVariant && (
        <AddVariantModal
          show={showAddVariant}
          onHide={() => setShowAddVariant(false)}
          parentProduct={parentProduct}
          attributes={attributes}
          onCreated={() => {
            setShowAddVariant(false);
            fetchVariants();
          }}
        />
      )}

      {showGenerateVariants && (
        <GenerateVariantsModal
          show={showGenerateVariants}
          onHide={() => setShowGenerateVariants(false)}
          parentProduct={parentProduct}
          attributes={attributes}
          existingVariants={variants}
          onCreated={() => {
            setShowGenerateVariants(false);
            fetchVariants();
          }}
        />
      )}

      {editingVariant && (
        <CreateProductView
          show={!!editingVariant}
          onHide={() => setEditingVariant(null)}
          productToEdit={editingVariant as unknown as IProductView}
          headerName="Edit Variant"
          setRefreshProduct={setVariantRefresh}
        />
      )}

      {editingAttributesVariant && (
        <EditVariantAttributesModal
          show={!!editingAttributesVariant}
          onHide={() => setEditingAttributesVariant(null)}
          variant={editingAttributesVariant}
          attributes={attributes}
          onSaved={() => {
            setEditingAttributesVariant(null);
            fetchVariants();
          }}
        />
      )}
    </div>
  );
};

export default ProductVariantSection;
