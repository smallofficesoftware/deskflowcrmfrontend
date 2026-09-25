import React, { useEffect, useRef, useState } from "react";

interface IProps {
  onAddStock: () => void;
  onGeneratePO: () => void;
}

const MaterialActionMenu = ({ onAddStock, onGeneratePO }: IProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItem = (icon: string, label: string, onClick: () => void) => (
    <button
      onClick={() => {
        onClick();
        setOpen(false);
      }}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "7px 14px",
        background: "none",
        border: "none",
        fontSize: "0.78rem",
        color: "#374151",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <i className={`pi ${icon} me-2`} style={{ fontSize: "0.75rem", color: "#6b7280" }} />
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: "1.1rem",
          color: "#dc3545",
          lineHeight: 1,
        }}
        title="Actions"
      >
        ⋮
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 999,
            background: "#fff",
            border: "1px solid #e9ecef",
            borderRadius: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            minWidth: 148,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {menuItem("pi-plus-circle", "Add Stock", onAddStock)}
          {menuItem("pi-shopping-cart", "Generate PO", onGeneratePO)}
        </div>
      )}
    </div>
  );
};

export default MaterialActionMenu;
