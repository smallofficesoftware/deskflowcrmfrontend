import React, { useRef, useState } from "react";

interface Props {
  onCapture: (file: File | null) => void;
  disabled?: boolean;
}

// Real draw-your-signature canvas (plan §3: "signature pad → client
// converts to PNG blob, uploaded like any image") — replaces the earlier
// plain file-input fallback for type:"signature" fields specifically.
const SignaturePad: React.FC<Props> = ({ onCapture, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") || null;

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    drawing.current = true;
    const ctx = getCtx();
    const { x, y } = pointerPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.toBlob((blob) => {
      if (blob) onCapture(new File([blob], `signature-${Date.now()}.png`, { type: "image/png" }));
    }, "image/png");
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onCapture(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        style={{ border: "1px solid #ced4da", borderRadius: 4, touchAction: "none", background: "#fff" }}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      <div className="mt-1">
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={disabled || !hasDrawn} onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
