import React, { useState } from "react";
import { IFormBuilderField } from "./FormBuilderController";

interface Props {
  field: IFormBuilderField;
  value: any; // "lat,lng" (6 decimals) or empty
  error?: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}

export const formatLocation = (lat: number, lng: number) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

export const mapsLink = (value: string) => `https://www.google.com/maps?q=${encodeURIComponent(value)}`;

// Plain-words reason for a failed location request.
function locationProblem(error: GeolocationPositionError | { code?: number }): string {
  switch (error.code) {
    case 1:
      return "Location is blocked for this page. Allow location in your browser settings and try again.";
    case 2:
      return "The phone couldn't work out where it is. Move to an open area and try again.";
    case 3:
      return "Finding the location took too long. Try again.";
    default:
      return "The location could not be found.";
  }
}

// One-shot location fetch shared with the photo stamp (ImageCaptureInput).
export function getCurrentLocation(): Promise<{ value: string } | { error: string }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ error: "This device or browser can't share its location." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ value: formatLocation(pos.coords.latitude, pos.coords.longitude) }),
      (err) => resolve({ error: locationProblem(err) }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

// GPS location field (plan item O3): the person taps "Capture my location"
// and the coordinates are saved with a link that opens the place on a map.
// No address lookup — nothing is sent to any outside service.
const LocationInput: React.FC<Props> = ({ field, value, error, disabled, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const capture = async () => {
    setBusy(true);
    setProblem("");
    const result = await getCurrentLocation();
    setBusy(false);
    if ("value" in result) onChange(result.value);
    else setProblem(result.error);
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label text-truncate d-block" title={field.label}>
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </label>
      <div className={`form-control d-flex align-items-center${error ? " is-invalid input-box-error" : ""}`} style={{ gap: 8, minHeight: 38 }}>
        <i className="pi pi-map-marker" style={{ fontSize: 13 }} />
        {value ? (
          <>
            <span className="text-truncate me-auto" style={{ fontFamily: "monospace" }}>
              {String(value)}
            </span>
            <a href={mapsLink(String(value))} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          </>
        ) : (
          <span className="text-muted me-auto">No location captured yet</span>
        )}
      </div>
      {!disabled ? (
        <div className="d-flex mt-1" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={busy} onClick={capture}>
            {busy ? "Finding location…" : value ? "Capture again" : "Capture my location"}
          </button>
          {value ? (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChange(null)}>
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      {problem ? <div className="text-danger small mt-1">{problem}</div> : null}
      {error ? <div className="field-error text-danger">{error}</div> : null}
    </div>
  );
};

export default LocationInput;
