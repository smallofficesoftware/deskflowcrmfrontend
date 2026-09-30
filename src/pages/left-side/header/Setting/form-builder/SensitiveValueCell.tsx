import React, { useEffect, useRef, useState } from "react";
import { revealSubmissionField } from "./FormBuilderController";

const REVEAL_MS = 30000;

interface Props {
  formId: number;
  submissionId: number;
  fieldKey: string;
  maskedValue: any;
  canReveal: boolean;
}

// One encrypted (full-number) Aadhaar value (plan O1). Shows the masked value
// the server returns; permitted users get a "Show" eye that fetches the full
// number, which is kept only in this cell's state and dropped again after
// 30 seconds, on a second click, or when the cell goes away. Never cached
// anywhere else (no parent state, no localStorage).
const SensitiveValueCell: React.FC<Props> = ({ formId, submissionId, fieldKey, maskedValue, canReveal }) => {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setRevealed(null);
  };

  // A different row / refreshed masked value must not keep showing an old
  // reveal; the cleanup also drops the pending timer on unmount.
  useEffect(() => {
    setRevealed(null);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [formId, submissionId, fieldKey, maskedValue]);

  const toggle = async () => {
    if (revealed != null) {
      hide();
      return;
    }
    setLoading(true);
    const res = await revealSubmissionField(formId, submissionId, fieldKey);
    setLoading(false);
    const value = res?.ack === 1 ? res?.data?.value : null;
    if (value == null) return;
    setRevealed(String(value));
    timer.current = setTimeout(hide, REVEAL_MS);
  };

  const hasValue = maskedValue !== null && maskedValue !== undefined && maskedValue !== "";
  if (!hasValue) return null;

  return (
    <span className="text-nowrap">
      <span className="font-monospace">{revealed ?? String(maskedValue)}</span>
      {canReveal ? (
        <button
          type="button"
          className="btn btn-sm btn-link p-0 ms-2 align-baseline"
          title={revealed != null ? "Hide" : "Show full number (hides again after 30 seconds)"}
          disabled={loading}
          onClick={toggle}
        >
          <i className={revealed != null ? "pi pi-eye-slash" : "pi pi-eye"} /> {revealed != null ? "Hide" : "Show"}
        </button>
      ) : null}
    </span>
  );
};

export default SensitiveValueCell;
