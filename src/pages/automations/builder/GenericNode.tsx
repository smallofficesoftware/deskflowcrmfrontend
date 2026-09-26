import { Handle, NodeProps, Position } from "@xyflow/react";
import { INodeDef } from "../automationTypes";
import { IBuilderNodeData } from "./builderTypes";

// One shared node renderer for every trigger and action type (30+ of them) -
// driven by the catalog definition, not a bespoke component per type.
// Output handles:
//   trigger              single "src", no input
//   condition             one per parameters.conditions[].sourceHandle, + "no_match"
//   if_else                "if-true" / "if-false"
//   everything else        def.wires (string | string[]), default "src"
// Every non-trigger node also gets a small "on_error" handle (the engine
// checks for an on_error connection on ANY failed step, not just http_request).

const GROUP_COLORS: Record<string, string> = {
  Start: "#0f766e",
  Messages: "#1070b2",
  Contact: "#2563eb",
  Inquiry: "#7c3aed",
  Documents: "#c2410c",
  Tasks: "#0891b2",
  "Follow-up": "#65a30d",
  Logic: "#b45309",
  Data: "#475569",
  Integrations: "#5b21b6",
};

const outputHandles = (data: IBuilderNodeData, def?: INodeDef): string[] => {
  if (data.nodeType === "trigger") return ["src"];
  if (data.nodeType === "condition") {
    const conditions = Array.isArray(data.parameters?.conditions) ? data.parameters.conditions : [];
    const handles = conditions.map((c: any, i: number) => c?.sourceHandle || c?.id || `cond-${i}`);
    handles.push(data.parameters?.no_match_handle || "no_match");
    return handles;
  }
  if (data.nodeType === "if_else") return ["if-true", "if-false"];
  if (def?.wires) return Array.isArray(def.wires) ? def.wires : [def.wires];
  return ["src"];
};

const summarize = (data: IBuilderNodeData, def?: INodeDef): string => {
  const p = data.parameters || {};
  const firstTextField = def?.fields.find((f) => ["text", "template", "textarea"].includes(f.type) && p[f.key]);
  if (firstTextField) return String(p[firstTextField.key]).slice(0, 60);
  const keys = Object.keys(p).filter((k) => p[k] !== undefined && p[k] !== "" && !Array.isArray(p[k]));
  if (!keys.length) return "Not configured yet";
  return keys
    .slice(0, 2)
    .map((k) => `${k}: ${String(p[k]).slice(0, 20)}`)
    .join(", ");
};

const GenericNode = ({ data, selected }: NodeProps & { data: IBuilderNodeData }) => {
  const color = GROUP_COLORS[data.group] || "#334155";
  const outputs = outputHandles(data);
  const isTrigger = data.nodeType === "trigger";

  return (
    <div
      style={{
        minWidth: 220,
        maxWidth: 260,
        borderRadius: 10,
        border: `1.5px solid ${selected ? color : "#d0d5dd"}`,
        boxShadow: selected ? `0 0 0 3px ${color}22` : "0 1px 3px rgba(0,0,0,0.08)",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {!isTrigger && <Handle type="target" position={Position.Top} style={{ background: color }} />}

      <div style={{ background: color, color: "#fff", padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
        {data.label}
        {data.hasError && <span style={{ float: "right" }} title="Missing required fields">⚠</span>}
      </div>
      <div style={{ padding: "8px 10px", fontSize: 11.5, color: "#475569", minHeight: 30, wordBreak: "break-word" }}>
        {summarize(data)}
      </div>

      {outputs.map((handleId, i) => (
        <Handle
          key={handleId}
          id={handleId}
          type="source"
          position={Position.Bottom}
          style={{
            left: outputs.length === 1 ? "50%" : `${((i + 1) / (outputs.length + 1)) * 100}%`,
            background: handleId === "no_match" ? "#94a3b8" : color,
          }}
        >
          {outputs.length > 1 && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 9,
                color: "#64748b",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {handleId}
            </span>
          )}
        </Handle>
      ))}

      {!isTrigger && (
        <Handle
          id="on_error"
          type="source"
          position={Position.Right}
          style={{ background: "#dc2626", width: 8, height: 8, top: "50%" }}
          title="On error"
        />
      )}
    </div>
  );
};

export default GenericNode;
