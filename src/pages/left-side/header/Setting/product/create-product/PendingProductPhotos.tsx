import { FC, useEffect, useMemo, useRef } from "react";

// Photos picked on the Add Product form. The product does not exist yet, so nothing
// is uploaded here: the files are kept by the form and uploaded right after the
// product is saved (see uploadPendingPhotos.ts). The first photo becomes the
// primary one; "Make primary" moves a photo to the front.

interface PendingProductPhotosProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

const PendingProductPhotos: FC<PendingProductPhotosProps> = ({ files, onChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // One preview URL per file, released when the list changes or the form closes.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (picked.length) onChange([...files, ...picked]);
  };

  const remove = (index: number) => onChange(files.filter((_, i) => i !== index));

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...files];
    const [moved] = next.splice(index, 1);
    onChange([moved, ...next]);
  };

  return (
    <div className="border rounded p-3 mb-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <b>Photos</b>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          + Add photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handlePick}
        />
      </div>
      <div className="text-muted small mb-2">
        The first photo is the primary one, shown in lists, orders and documents. Photos are uploaded
        when you save the product.
      </div>
      {files.length === 0 ? (
        <div className="text-muted small">No photos yet.</div>
      ) : (
        <div className="d-flex flex-wrap" style={{ gap: "0.75rem" }}>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} style={{ width: 110 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={previews[index]}
                  alt={file.name}
                  style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 6 }}
                />
                {index === 0 && (
                  <span
                    className="badge"
                    style={{ position: "absolute", left: 4, top: 4, backgroundColor: "#f58634", color: "#fff" }}
                  >
                    Primary
                  </span>
                )}
              </div>
              <div className="d-flex justify-content-between mt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0"
                  disabled={disabled || index === 0}
                  onClick={() => makePrimary(index)}
                >
                  Make primary
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger p-0"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingProductPhotos;
