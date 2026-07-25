import { useTheme } from "../../../../../components/ThemeContext";

interface IPropsConfirmModal {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

const ConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
}: IPropsConfirmModal) => {
  const { darkMode } = useTheme();

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
      //   onClick={() => !isLoading && onHide()}
    >
      <div
        style={{
          backgroundColor: darkMode ? "#1e1e2e" : "#ffffff",
          borderRadius: "14px",
          padding: "32px 28px 24px",
          width: "340px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#FFF3E0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="32px"
            viewBox="0 -960 960 960"
            width="32px"
            fill="rgb(255,125,18)"
          >
            <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
        </div>

        <h5
          style={{
            color: darkMode ? "#ffffff" : "#1a1a2e",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          {title}
        </h5>

        <div
          style={{
            color: darkMode ? "#aaaaaa" : "#666666",
            fontSize: "0.86rem",
            lineHeight: "1.5",
            marginBottom: "24px",
          }}
        >
          {message}
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            className="btn btn-sm"
            style={{
              minWidth: "110px",
              border: `1px solid ${darkMode ? "#555" : "#ccc"}`,
              color: darkMode ? "#ccc" : "#333",
              backgroundColor: darkMode ? "#2a2a3e" : "#f8f9fa",
              borderRadius: "8px",
              padding: "8px 0",
            }}
            onClick={onHide}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className="btn btn-sm text-white"
            style={{
              minWidth: "110px",
              backgroundColor: isLoading ? "#f7a96a" : "rgb(255,125,18)",
              borderRadius: "8px",
              padding: "8px 0",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                style={{ width: "14px", height: "14px", borderWidth: "2px" }}
              />
            )}
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
