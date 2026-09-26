import { useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { INodeDef } from "../automationTypes";

interface IProps {
  nodes: INodeDef[];
}

// Drag source for the canvas (plain HTML5 DnD - @xyflow/react's own
// recommended pattern, kept separate from @dnd-kit which the rest of the
// app uses for unrelated list reordering).
const NodePalette = ({ nodes }: IProps) => {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? nodes.filter((n) => n.label.toLowerCase().includes(q)) : nodes;
    const map = new Map<string, INodeDef[]>();
    filtered.forEach((n) => {
      if (!map.has(n.group)) map.set(n.group, []);
      map.get(n.group)!.push(n);
    });
    return map;
  }, [nodes, search]);

  const onDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData("application/x-automation-node", type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div style={{ width: 230, minWidth: 230, borderRight: "1px solid #e2e8f0", background: "#fff", overflowY: "auto" }}>
      <div style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
        <Form.Control size="sm" placeholder="Search steps…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {[...grouped.entries()].map(([group, defs]) => (
        <div key={group} style={{ padding: "8px 10px" }}>
          <div className="text-muted text-uppercase" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>
            {group}
          </div>
          {defs.map((def) => (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => onDragStart(e, def.type)}
              style={{
                padding: "8px 10px",
                marginBottom: 6,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "grab",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#334155",
              }}
              title="Drag onto the canvas"
            >
              {def.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default NodePalette;
