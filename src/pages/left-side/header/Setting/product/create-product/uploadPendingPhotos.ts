import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../services/axiosInstance";

// A new product has no id until it is saved, so photos picked on the Add Product form
// wait in the browser and are uploaded here right after the save. They go one after
// another, in the order picked: the server makes the first photo of a product its
// primary one, so the first file in the list becomes the primary photo.
export const uploadPendingPhotos = async (
  productId: number | string,
  files: File[],
): Promise<{ uploaded: number; failed: number }> => {
  const getUUID = localStorage.getItem("UUID");
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const formData = new FormData();
    formData.append("a_application_login_id", getUUID || "");
    formData.append("product_id", String(productId));
    formData.append("image", file);
    try {
      const { data } = await axiosInstance.post("upload-product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) uploaded += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { uploaded, failed };
};
