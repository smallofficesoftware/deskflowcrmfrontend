import "@xyflow/react/dist/style.css";
import {
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { getCatalog, getFlow, ISaveFlowPayload, saveFlow, toggleFlow } from "../automationApi";
import { ICatalog, IFlowConnection, IFlowNode } from "../automationTypes";
import { IBuilderNodeData } from "./builderTypes";
import GenericNode from "./GenericNode";
import NodePalette from "./NodePalette";
import SettingsPanel from "./SettingsPanel";
import TestRunModal from "./TestRunModal";

interface IProps {
  flowId?: number;
}

const TRIGGER_ID = "trigger";
const newId = () => `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const defaultParams = (fields: ICatalog["nodes"][number]["fields"]) => {
  const out: Record<string, any> = {};
  fields.forEach((f) => {
    if (f.default !== undefined) out[f.key] = f.default;
  });
  return out;
};

const toRFNode = (n: IFlowNode, def?: ICatalog["nodes"][number]): Node<IBuilderNodeData> => ({
  id: n.id,
  type: n.type,
  position: n.position || { x: 250, y: 250 },
  data: {
    nodeType: n.type,
    label: n.type === "trigger" ? "Trigger" : def?.label || n.type,
    group: n.type === "trigger" ? "Start" : def?.group || "Data",
    parameters: n.parameters || {},
  },
});

const FlowBuilderInner = ({ flowId }: IProps) => {
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [catalog, setCatalog] = useState<ICatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<number | undefined>(flowId);
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showTest, setShowTest] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<IBuilderNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [flowMeta, setFlowMeta] = useState({
    name: "",
    description: "",
    trigger_type: "",
    trigger_config: {} as Record<string, any>,
    run_as_user_id: "" as number | "",
    allow_automation_trigger: false,
    include_imported_records: false,
  });

  // ------------------------------------------------------------ load
  useEffect(() => {
    (async () => {
      try {
        const catRes = await getCatalog();
        if (catRes.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
          toast.error(catRes.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          return;
        }
        const cat = catRes.data.item;
        setCatalog(cat);

        if (flowId) {
          const res = await getFlow(flowId);
          if (res.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            toast.error(res.ack_msg || "Automation not found");
            navigate("/Automations/flows");
            return;
          }
          const flow = res.data.item;
          setId(flow.id);
          setIsActive(flow.is_active === 1);
          setFlowMeta({
            name: flow.name,
            description: flow.description || "",
            trigger_type: flow.trigger_type,
            trigger_config: flow.trigger_config || {},
            run_as_user_id: flow.run_as_user_id ?? "",
            allow_automation_trigger: flow.allow_automation_trigger === 1,
            include_imported_records: flow.include_imported_records === 1,
          });
          setNodes(
            flow.nodes.map((n) => toRFNode(n, cat.nodes.find((d) => d.type === n.type)))
          );
          setEdges(
            flow.connections.map((c) => ({ id: c.id, source: c.source, target: c.target, sourceHandle: c.sourceHandle }))
          );
        } else {
          setNodes([
            {
              id: TRIGGER_ID,
              type: "trigger",
              position: { x: 250, y: 60 },
              data: { nodeType: "trigger", label: "Trigger", group: "Start", parameters: {} },
            },
          ]);
        }
      } catch (e: any) {
        toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  // ------------------------------------------------------------ canvas events
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, id: `e_${newId()}` }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/x-automation-node");
      if (!type || !catalog) return;
      const def = catalog.nodes.find((n) => n.type === type);
      if (!def) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const id = newId();
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          position,
          data: { nodeType: type, label: def.label, group: def.group, parameters: defaultParams(def.fields) },
        },
      ]);
    },
    [catalog, screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedId(node.id), []);
  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;
  const selectedFlowNode: IFlowNode | null = selectedNode
    ? { id: selectedNode.id, type: selectedNode.data.nodeType, position: selectedNode.position, parameters: selectedNode.data.parameters }
    : null;

  const updateNodeParam = (key: string, value: any) => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, parameters: { ...n.data.parameters, [key]: value } } } : n))
    );
  };

  const deleteSelected = () => {
    if (!selectedId || selectedId === TRIGGER_ID) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  };

  // ------------------------------------------------------------ save / activate
  const buildPayload = (): ISaveFlowPayload => ({
    id,
    name: flowMeta.name,
    description: flowMeta.description,
    trigger_type: flowMeta.trigger_type,
    trigger_config: flowMeta.trigger_config,
    run_as_user_id: flowMeta.run_as_user_id || undefined,
    allow_automation_trigger: flowMeta.allow_automation_trigger,
    include_imported_records: flowMeta.include_imported_records,
    nodes: nodes.map<IFlowNode>((n) => ({ id: n.id, type: n.data.nodeType, position: n.position, parameters: n.data.parameters })),
    connections: edges.map<IFlowConnection>((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || "src",
    })),
  });

  const handleSave = async (): Promise<boolean> => {
    if (!flowMeta.name.trim()) {
      toast.error("Give the automation a name");
      return false;
    }
    setSaving(true);
    setErrors([]);
    try {
      const res = await saveFlow(buildPayload());
      if (res.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setErrors(res.data?.errors || [res.ack_msg]);
        toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
      }
      toast.success("Saved");
      if (!id) {
        setId(res.data.item!.id);
        navigate(`/Automations/flows/${res.data.item!.id}`, { replace: true });
      }
      return true;
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const saved = await handleSave();
    if (!saved || !id) return;
    const res = await toggleFlow(id, !isActive);
    if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsActive(!isActive);
      toast.success(res.ack_msg);
    } else {
      setErrors(res.data?.errors || [res.ack_msg]);
      toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  if (loading || !catalog) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" /> Loading…
      </div>
    );
  }

  const currentTrigger = catalog.triggers.find((t) => t.type === flowMeta.trigger_type);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="d-flex align-items-center justify-content-between border-bottom bg-white px-3 py-2">
        <div className="d-flex align-items-center gap-2">
          <Button size="sm" variant="outline-secondary" onClick={() => navigate("/Automations/flows")}>
            ← Back
          </Button>
          <strong>{flowMeta.name || "New automation"}</strong>
          {isActive && <span className="badge bg-success">On</span>}
        </div>
        <div className="d-flex gap-2">
          {id && (
            <Button size="sm" variant="outline-secondary" onClick={() => setShowTest(true)}>
              Test
            </Button>
          )}
          {id && (
            <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/Automations/executions?flow_id=${id}`)}>
              Runs
            </Button>
          )}
          <Button size="sm" variant="outline-primary" disabled={saving} onClick={handleSave}>
            {saving ? <Spinner size="sm" animation="border" /> : "Save"}
          </Button>
          {id && (
            <Button size="sm" variant={isActive ? "outline-danger" : "success"} onClick={handleToggleActive}>
              {isActive ? "Turn off" : "Turn on"}
            </Button>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="danger" className="mb-0 rounded-0 py-2 small" onClose={() => setErrors([])} dismissible>
          <ul className="mb-0">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <NodePalette nodes={catalog.nodes} />
        <div ref={wrapperRef} style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={{ trigger: GenericNode, ...Object.fromEntries(catalog.nodes.map((n) => [n.type, GenericNode])) }}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable style={{ height: 100, width: 140 }} />
          </ReactFlow>
        </div>
        <div style={{ width: 340, minWidth: 340, borderLeft: "1px solid #e2e8f0", background: "#fff" }}>
          <SettingsPanel
            catalog={catalog}
            selectedNode={selectedFlowNode}
            flowMeta={flowMeta}
            onFlowMetaChange={(patch) => setFlowMeta((m) => ({ ...m, ...patch }))}
            onNodeParamChange={updateNodeParam}
            onDeleteNode={deleteSelected}
          />
        </div>
      </div>

      {id && (
        <TestRunModal show={showTest} onHide={() => setShowTest(false)} flowId={id} recordType={currentTrigger?.record || null} />
      )}
    </div>
  );
};

const FlowBuilder = (props: IProps) => (
  <ReactFlowProvider>
    <FlowBuilderInner {...props} />
  </ReactFlowProvider>
);

export default FlowBuilder;
