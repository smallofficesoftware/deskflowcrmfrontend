import { Button } from "primereact/button";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface IRowAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  // Left out of the popup entirely (e.g. "Submissions" on an unpublished form).
  hidden?: boolean;
  title?: string;
}

// The row "⋮ / cog" popup of the Contact Book style grids, for a list of
// actions chosen per row. Same look as FormSubmissionsListView's RowActionMenu
// (cog Button + a small white list), portaled to document.body because a
// PrimeReact DataTable body clips any menu positioned inside a cell.
const RowActionPopup: React.FC<{ actions: IRowAction[] }> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const visible = actions.filter((a) => !a.hidden);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - 160) });
    };
    reposition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  if (!visible.length) return null;

  return (
    <div ref={buttonRef} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Button
        icon="pi pi-cog"
        className="p-button-text source-of-type-list-grid-options"
        // The shared class sets display:inline-table + a left margin, which sits
        // the cog above the row's middle; center it explicitly.
        style={{ color: "green", width: "2rem", height: "2rem", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: 0, padding: 0 }}
        aria-label="Actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      />
      {open
        ? createPortal(
            <ul
              ref={menuRef}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: 160,
                height: "auto",
                zIndex: 9999,
                background: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                borderRadius: "6px",
                padding: "5px 0",
                listStyle: "none",
                margin: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {visible.map((action) => (
                <li
                  key={action.label}
                  className="listItem"
                  role="button"
                  title={action.title}
                  style={{
                    margin: "0 10px",
                    height: "25px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    color: action.danger ? "#dc3545" : undefined,
                    fontWeight: action.danger ? "bold" : undefined,
                  }}
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                >
                  {action.label}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
};

export default RowActionPopup;
