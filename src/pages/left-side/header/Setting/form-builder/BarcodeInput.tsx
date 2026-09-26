import React, { useEffect, useRef, useState } from "react";
import { IFormBuilderField } from "./FormBuilderController";

interface Props {
  field: IFormBuilderField;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

// The browser's built-in barcode reader (Chrome / Edge on Android and
// desktop). Where it is missing (iPhone Safari, Firefox) the box still works
// by typing — and a USB / Bluetooth scanner "types" into it too.
const detectorSupported = () => typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

// Camera overlay that reads one barcode / QR code and hands back its text.
const Scanner: React.FC<{ onResult: (text: string) => void; onClose: () => void }> = ({ onResult, onClose }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer: number | undefined;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) return;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        const Detector = (window as any).BarcodeDetector;
        const detector = new Detector();
        const tick = async () => {
          if (stopped || !video.current) return;
          try {
            const found = await detector.detect(video.current);
            if (found.length > 0 && found[0].rawValue) {
              onResult(String(found[0].rawValue));
              return;
            }
          } catch {
            /* a frame that can't be read is skipped */
          }
          timer = window.setTimeout(tick, 250);
        };
        tick();
      } catch (e: any) {
        setProblem(e?.name === "NotAllowedError" ? "Camera is blocked for this page. Allow the camera in your browser settings." : "The camera could not be started.");
      }
    })();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Scan a barcode"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      {problem ? (
        <p className="text-white text-center">{problem}</p>
      ) : (
        <>
          <video ref={video} playsInline muted style={{ width: "100%", maxWidth: 480, borderRadius: 8 }} />
          <p className="text-white mt-2">Point the camera at the barcode or QR code</p>
        </>
      )}
      <button type="button" className="btn btn-light mt-2" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
};

// Barcode / QR field (plan item O3): scan with the camera where the browser
// allows it, or type / use a scanner.
const BarcodeInput: React.FC<Props> = ({ field, value, error, disabled, onChange }) => {
  const [scanning, setScanning] = useState(false);
  const canScan = detectorSupported();

  return (
    <div className="form-group">
      <label className="pb-2 form_label text-truncate d-block" title={field.label}>
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>
      <div className="d-flex" style={{ gap: 6 }}>
        <input
          className={`form-control${error ? " is-invalid input-box-error" : ""}`}
          value={value ?? ""}
          disabled={disabled}
          maxLength={255}
          placeholder={field.placeholder || (canScan ? "Scan, or type the code" : "Type or scan the code")}
          onChange={(e) => onChange(e.target.value)}
        />
        {canScan && !disabled ? (
          <button type="button" className="btn fb-btn-outline-primary" onClick={() => setScanning(true)} aria-label="Scan with the camera">
            <i className="pi pi-camera" />
          </button>
        ) : null}
      </div>
      {scanning ? (
        <Scanner
          onResult={(text) => {
            onChange(text);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      ) : null}
      {field.help_text ? <small className="text-muted d-block">{field.help_text}</small> : null}
      {error ? <div className="field-error text-danger">{error}</div> : null}
    </div>
  );
};

export default BarcodeInput;
