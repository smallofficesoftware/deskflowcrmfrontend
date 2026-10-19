import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import { IProductCreate } from "./CreateProductController";

// Multi-variant products (plans/2026-10-18-product-variants-and-qty-pricing-plan.txt).
// Shared by AddVariantModal (one at a time) and GenerateVariantsModal (bulk combinations)
// so both go through the exact same create-then-link sequence, not two copies of it.

/** A variant is its own products row, so it needs its own unique product_code -
 * copying the parent's (as this used to do) always collided with the backend's
 * duplicate-code check. Derives one from the parent's code + the variant's label
 * (e.g. "SHIRT1" + "Red / M" -> "SHIRT1-RED-M"), sanitized to match typical code
 * formatting. createVariantProduct retries with a numeric suffix if even that collides. */
const buildVariantProductCode = (parentCode: string, label: string, attempt: number): string => {
  const suffix = label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = `${parentCode}-${suffix}`;
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
};

const isDuplicateCodeError = (ackMsg: string | undefined) =>
  typeof ackMsg === "string" && ackMsg.toLowerCase().includes("product code already exists");

/** Creates one variant (a normal products row via /create-product, parent_product_id
 * set) and links it to its chosen attribute values. Per Q4: only rate/label are asked
 * for - every other field is copied from the parent here, not re-entered by the caller. */
export const createVariantProduct = async (
  parentProduct: IProductCreate & { id: number },
  getUUID: string | null,
  label: string,
  rate: string,
  valueIds: number[],
): Promise<boolean> => {
  try {
    const MAX_ATTEMPTS = 5;
    let createData: any;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const formData = new FormData();
      formData.append("a_application_login_id", getUUID || "");
      formData.append("product_name", `${parentProduct.product_name} - ${label}`);
      formData.append(
        "product_code",
        buildVariantProductCode(parentProduct.product_code || "VAR", label, attempt),
      );
      formData.append("product_description", parentProduct.product_description || "");
      formData.append("category_id", parentProduct.category_id || "");
      formData.append("unit", parentProduct.unit || "");
      formData.append("unit_id", String(parentProduct.unit_id || ""));
      formData.append("product_group_id", parentProduct.product_group_id || "");
      formData.append("GST", parentProduct.GST || "0");
      formData.append("gst_id", String(parentProduct.gst_id || 0));
      formData.append("hsn_code", parentProduct.hsn_code || "");
      formData.append("rate", rate);
      formData.append("net_rate", rate);
      formData.append("is_serial_number", String(parentProduct.is_serial_number || 1));
      formData.append("is_variant_parent", "0");
      formData.append("parent_product_id", String(parentProduct.id));

      const { data } = await axiosInstance.post("create-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      createData = data;

      if (createData.code === 200 && createData.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        break;
      }
      if (!isDuplicateCodeError(createData.ack_msg) || attempt === MAX_ATTEMPTS - 1) {
        toast.error(createData.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
      }
      // duplicate code - loop again with the next numeric suffix
    }

    const newProductId =
      createData.data?.item?.id || createData.data || createData.inserted_id;

    await axiosInstance.post("set-variant-option-values", {
      a_application_login_id: getUUID,
      product_id: newProductId,
      product_variant_attribute_value_ids: valueIds,
    });

    return true;
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};
