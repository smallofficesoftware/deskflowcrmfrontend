import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";

export interface ISavedFilterOption {
  id: string;
  name: string;
  is_default?: boolean;
}

interface Props {
  filters: ISavedFilterOption[];
  activeId: string; // "" = all entries
  onPick: (id: string) => void;
}

// The entries list's saved-filter picker, built like the report toolbar's other tools (REPORT_UI_GUIDELINES.md
// section 3): a round grey PrimeReact button with a tooltip - pi-filter, pi-filter-slash while a filter is applied -
// that opens a labelDropLeft list. Orange is not used: it is kept for the Add action and the active tab. Shown only
// when the form has saved filters (Form settings > Saved filters).
const SavedFilterMenu: React.FC<Props> = ({ filters, activeId, onPick }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const item = (id: string, label: string) => (
    <li
      key={id || "all"}
      className="listItem text-start"
      role="button"
      style={{ fontWeight: activeId === id ? "bold" : undefined }}
      onClick={() => {
        setOpen(false);
        if (activeId !== id) onPick(id);
      }}
    >
      <i className={activeId === id ? "pi pi-check" : "pi"} style={{ marginRight: "6px", width: "14px", display: "inline-block" }} />
      {label}
    </li>
  );

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <Button
        icon={activeId ? "pi pi-filter-slash" : "pi pi-filter"}
        className="report_button"
        style={{ backgroundColor: "#4C4C4C" }}
        rounded
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        tooltip="Saved filters"
        tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
      />
      <ul
        className={`labelDropLeft ${open ? "isVisible" : "isHidden"}`}
        style={{ width: 240, position: "absolute", right: 0, top: "100%", zIndex: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {item("", "All entries")}
        {filters.map((f) => item(f.id, f.name))}
      </ul>
    </div>
  );
};

export default SavedFilterMenu;
