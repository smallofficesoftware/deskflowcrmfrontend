import { FC, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import no_image from "../../../../../../assets/images/no_image.jpeg";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../services/axiosInstance";

// Multiple photos per product/variant (plans/2026-10-20-product-variant-ui-and-field-scoping-plan.txt,
// Phase 2). Rendered for Simple products and Variant rows only - the "Has Variants"
// Parent template has no Photos tab (its variants each have their own photos).
// Reordering is simple up/down arrows for v1, not drag-and-drop (confirmed).

export interface IProductImage {
  id: number;
  thumbnail_url: string | null;
  webp_url: string | null;
  image_url: string | null;
  is_primary: number;
  display_order: number;
}

interface ProductPhotosSectionProps {
  productId: number;
}

const ProductPhotosSection: FC<ProductPhotosSectionProps> = ({ productId }) => {
  const [images, setImages] = useState<IProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUUID = localStorage.getItem("UUID");

  const fetchImages = async () => {
    try {
      const { data } = await axiosInstance.post("get-product-images", {
        product_id: productId,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setImages(data.data?.item || []);
      }
    } catch {
      toast.error("Failed to load photos");
    }
  };

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchImages().finally(() => setLoading(false));
  }, [productId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const formData = new FormData();
    formData.append("a_application_login_id", getUUID || "");
    formData.append("product_id", String(productId));
    formData.append("image", file);

    setUploading(true);
    try {
      const { data } = await axiosInstance.post("upload-product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        await fetchImages();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id: number) => {
    try {
      const { data } = await axiosInstance.post("delete-product-image", { id });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        await fetchImages();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const setPrimary = async (id: number) => {
    try {
      const { data } = await axiosInstance.post("set-primary-product-image", {
        id,
        product_id: productId,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        await fetchImages();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setImages(reordered); // optimistic

    try {
      const { data } = await axiosInstance.post("reorder-product-images", {
        ordered_ids: reordered.map((img) => img.id),
      });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        await fetchImages(); // revert to server truth
      }
    } catch {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
      await fetchImages();
    }
  };

  return (
    <div className="col-12">
      <hr />
      <h5 className="mb-3">Photos</h5>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          {images.length === 0 && (
            <div style={{ width: 120, height: 120 }} className="position-relative">
              <img
                src={no_image}
                alt=""
                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
              />
            </div>
          )}

          {images.map((img, index) => (
            <div key={img.id} style={{ width: 120 }} className="text-center">
              <div className="position-relative" style={{ width: 120, height: 120 }}>
                <img
                  src={img.thumbnail_url || img.webp_url || img.image_url || no_image}
                  alt=""
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: img.is_primary ? "2px solid #f58634" : "1px solid #e3e3e5",
                  }}
                />
                {!!img.is_primary && (
                  <span
                    className="badge"
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "#f58634",
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removeImage(img.id)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="d-flex justify-content-center gap-1 mt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ padding: "0px 6px" }}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  title="Move left"
                >
                  &#8592;
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ padding: "0px 6px" }}
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                  title="Move right"
                >
                  &#8594;
                </button>
              </div>
              {!img.is_primary && (
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0"
                  style={{ fontSize: 11 }}
                  onClick={() => setPrimary(img.id)}
                >
                  Set as Primary
                </button>
              )}
            </div>
          ))}

          <div style={{ width: 120 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: 120,
                height: 120,
                borderRadius: 8,
                border: "2px dashed #d8d8da",
                background: "#fbfbfb",
                color: "#8a8a90",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: uploading ? "default" : "pointer",
              }}
            >
              <span style={{ fontSize: 22 }}>+</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {uploading ? "Uploading..." : "Add Photo"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPhotosSection;
