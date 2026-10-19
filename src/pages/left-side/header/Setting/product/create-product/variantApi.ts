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
    const formData = new FormData();
    formData.append("a_application_login_id", getUUID || "");
    formData.append("product_name", `${parentProduct.product_name} - ${label}`);
    formData.append("product_code", parentProduct.product_code || "");
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

    const { data: createData } = await axiosInstance.post("create-product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (createData.code !== 200 || createData.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(createData.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
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
