import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useReviewStore } from "../../store/review/useReviewStore";
import { submitReview } from "./ReviewDialogController";

const MIN_COMMENT_LENGTH = 30;
const MIN_STAR_FOR_NO_COMMENT = 4;

// Status now arrives via useReviewStore, set from the onLoad response
// (SideView.tsx) after its own delay — this component just renders it.
const ReviewDialog = () => {
  const status = useReviewStore((s) => s.status);
  const clearStatus = useReviewStore((s) => s.clear);

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visible = status.show === "system_review";

  useEffect(() => {
    if (visible) {
      setRating(status.prefill?.rating ?? null);
      setComment(status.prefill?.comment ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const commentRequired = !!rating && rating < MIN_STAR_FOR_NO_COMMENT;
  const commentValid = !commentRequired || comment.trim().length >= MIN_COMMENT_LENGTH;
  const canSubmit = !!rating && commentValid && !submitting;

  const closeDialog = () => clearStatus();

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await submitReview({ action: "cancel", rating: rating ?? undefined, comment });
    } catch {
      // best-effort — closing the dialog should never be blocked by a network error
    } finally {
      setSubmitting(false);
      closeDialog();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const ok = await submitReview({ action: "submit", rating, comment });
      if (ok) {
        toast.success("Thanks for your feedback!");
        closeDialog();
      } else {
        toast.error("Could not submit your review. Please try again.");
      }
    } catch {
      toast.error("Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal1">
      <div
        className="modal-content1"
        style={{
          width: "420px",
          maxWidth: "92%",
          backgroundColor: "var(--side)",
          padding: "24px",
        }}
      >
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="mb-0">How are we doing?</h5>
          <span className="close" onClick={handleCancel} style={{ cursor: "pointer" }}>
            ×
          </span>
        </div>
        <p className="text-muted mb-3">
          Let us know what you think of DeskflowCRM so far.
        </p>

        <div className="mb-3" style={{ fontSize: "32px", letterSpacing: "4px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              style={{
                cursor: "pointer",
                color: (hoverRating ?? rating ?? 0) >= star ? "#f7b500" : "#d9d9d9",
              }}
            >
              ★
            </span>
          ))}
        </div>

        {!!rating && (
          <div className="mb-3">
            <textarea
              className="form-control"
              rows={4}
              placeholder={
                commentRequired
                  ? `Tell us what went wrong (min ${MIN_COMMENT_LENGTH} characters)...`
                  : "Anything you'd like to add? (optional)"
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {commentRequired && !commentValid && (
              <small className="text-danger">
                Please enter at least {MIN_COMMENT_LENGTH} characters ({comment.trim().length}/{MIN_COMMENT_LENGTH}).
              </small>
            )}
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary" onClick={handleCancel} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDialog;
