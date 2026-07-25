import DOMPurify from "dompurify";
import React, { useState } from "react";

interface ISafeHtmlProps {
  htmlContent: string;
}

const PinnedMessageShow: React.FC<ISafeHtmlProps> = ({ htmlContent }) => {
  const [expanded, setExpanded] = useState(false);

  const sanitizedHtml = DOMPurify.sanitize(htmlContent);

  return (
    <div
      style={{
        width: "100%",
        background: "#f0f2f5",
        border: "1px solid #f1e3a0",
        borderRadius: "6px",
        padding: "8px 10px",
        marginBottom: "8px",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Pin Icon */}
          <span style={{ fontSize: "16px" }}>📌</span>
          <span style={{ fontWeight: 500 }}>Pinned Message</span>
        </div>

        {/* Toggle Icon */}
        <span
          style={{
            cursor: "pointer",
            fontSize: "25px",
            userSelect: "none",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "⬆" : "⬇"}
        </span>
      </div>

      {/* Message */}
      <div
        style={{
          maxHeight: expanded ? "200px" : "40px",
          overflowY: "auto",
          transition: "max-height 0.3s ease",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

export default PinnedMessageShow;