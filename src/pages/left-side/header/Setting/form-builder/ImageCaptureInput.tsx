import React, { useEffect, useRef, useState } from "react";
import { IFormBuilderField } from "./FormBuilderController";
import { getCurrentLocation } from "./LocationInput";

interface Props {
  field: IFormBuilderField;
  error?: string;
  disabled?: boolean;
  onFile?: (file: File | null) => void;
}

const MAX_SIDE = 1600; // longest side after shrinking, in pixels
const JPEG_QUALITY = 0.8;

const pad2 = (n: number) => String(n).padStart(2, "0");
const stampTime = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not an image"));
    };
    img.src = url;
  });
}

// Shrink a phone photo (often 4000+ px, several MB) to a sensible size and,
// when asked, print the date / time and place along the bottom edge. Returns
// the original file untouched if the picture can't be processed.
export async function prepareImage(file: File, stampLines: string[]): Promise<File> {
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    if (stampLines.length > 0) {
      const fontSize = Math.max(14, Math.round(width / 45));
      const lineHeight = Math.round(fontSize * 1.35);
      const boxHeight = lineHeight * stampLines.length + fontSize * 0.6;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, height - boxHeight, width, boxHeight);
      ctx.fillStyle = "#fff";
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = "top";
      stampLines.forEach((line, i) => ctx.fillText(line, fontSize * 0.5, height - boxHeight + fontSize * 0.3 + i * lineHeight));
    }

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    // Keep the original if the "smaller" picture isn't smaller and nothing was stamped.
    if (stampLines.length === 0 && blob.size >= file.size) return file;
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

// Photo field (plan items O3, O4): opens the phone's camera directly when the
// builder chose "camera only", shrinks the picture, and can print the date,
// time and place on it as proof of the visit.
const ImageCaptureInput: React.FC<Props> = ({ field, error, disabled, onFile }) => {
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  const pick = async (file: File | null) => {
    if (!file) {
      setPreview("");
      setName("");
      onFile?.(null);
      return;
    }
    setBusy(true);
    setNote("");
    const lines: string[] = [];
    if (field.image_stamp?.datetime) lines.push(stampTime(new Date()));
    if (field.image_stamp?.location) {
      const where = await getCurrentLocation();
      if ("value" in where) lines.push(`Location: ${where.value}`);
      else setNote("The photo was saved without a location stamp — location isn't available.");
    }
    const prepared = await prepareImage(file, lines);
    setPreview(URL.createObjectURL(prepared));
    setName(prepared.name);
    setBusy(false);
    onFile?.(prepared);
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label text-truncate d-block" title={field.label}>
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>
      <input
        ref={input}
        type="file"
        accept="image/*"
        // "capture" opens the rear camera straight away on phones (the file
        // picker is used on a computer).
        {...(field.image_camera ? { capture: "environment" as const } : {})}
        className={`form-control${error ? " is-invalid input-box-error" : ""}`}
        disabled={disabled || busy}
        onChange={(e) => pick(e.target.files?.[0] || null)}
        aria-label={field.image_camera ? `Take a photo for ${field.label}` : field.label}
      />
      {busy ? <small className="text-muted d-block mt-1">Preparing the photo…</small> : null}
      {preview ? (
        <div className="mt-2 d-flex align-items-center" style={{ gap: 8 }}>
          <img src={preview} alt={name} style={{ height: 72, maxWidth: 160, objectFit: "cover", border: "1px solid #DDD", borderRadius: 4 }} />
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              if (input.current) input.current.value = "";
              pick(null);
            }}
          >
            Remove
          </button>
        </div>
      ) : null}
      {note ? <small className="text-muted d-block mt-1">{note}</small> : null}
      {error ? <div className="field-error text-danger">{error}</div> : null}
    </div>
  );
};

export default ImageCaptureInput;
