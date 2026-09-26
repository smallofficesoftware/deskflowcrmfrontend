import { Button, Form } from "react-bootstrap";
import { ICatalog, IFlowNode } from "../automationTypes";
import FieldEditor from "./FieldEditor";

interface IFlowMeta {
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  run_as_user_id: number | "";
  allow_automation_trigger: boolean;
  include_imported_records: boolean;
}

interface IProps {
  catalog: ICatalog;
  selectedNode: IFlowNode | null;
  flowMeta: IFlowMeta;
  onFlowMetaChange: (patch: Partial<IFlowMeta>) => void;
  onNodeParamChange: (key: string, value: any) => void;
  onDeleteNode: () => void;
}

// Right-hand settings panel. Three modes:
//   - the trigger node selected -> flow.trigger_type + flow.trigger_config
//   - an action node selected   -> that node's own parameters
//   - nothing selected          -> flow name / description / run-as / flags

const SettingsPanel = ({ catalog, selectedNode, flowMeta, onFlowMetaChange, onNodeParamChange, onDeleteNode }: IProps) => {
  if (selectedNode?.type === "trigger") {
    const trigger = catalog.triggers.find((t) => t.type === flowMeta.trigger_type);
    const grouped = new Map<string, typeof catalog.triggers>();
    catalog.triggers.forEach((t) => {
      if (!grouped.has(t.group)) grouped.set(t.group, []);
      grouped.get(t.group)!.push(t);
    });
    return (
      <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
        <h6 className="mb-3">Trigger</h6>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold">When this happens</Form.Label>
          <Form.Select
            size="sm"
            value={flowMeta.trigger_type}
            onChange={(e) => onFlowMetaChange({ trigger_type: e.target.value, trigger_config: {} })}
          >
            <option value="" disabled hidden>
              Pick a trigger…
            </option>
            {[...grouped.entries()].map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Form.Select>
        </Form.Group>
        {trigger && trigger.config.length > 0 && (
          <FieldEditor
            fields={trigger.config}
            values={flowMeta.trigger_config}
            operators={catalog.operators}
            onChange={(key, value) => onFlowMetaChange({ trigger_config: { ...flowMeta.trigger_config, [key]: value } })}
          />
        )}
      </div>
    );
  }

  if (selectedNode) {
    const def = catalog.nodes.find((n) => n.type === selectedNode.type);
    return (
      <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">{def?.label || selectedNode.type}</h6>
          <Button size="sm" variant="outline-danger" onClick={onDeleteNode}>
            Delete step
          </Button>
        </div>
        {def && def.fields.length > 0 ? (
          <FieldEditor
            fields={def.fields}
            values={selectedNode.parameters || {}}
            operators={catalog.operators}
            onChange={onNodeParamChange}
          />
        ) : (
          <p className="text-muted small">This step needs no settings.</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
      <h6 className="mb-3">Automation settings</h6>
      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold">Name</Form.Label>
        <Form.Control size="sm" value={flowMeta.name} onChange={(e) => onFlowMetaChange({ name: e.target.value })} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold">Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          size="sm"
          value={flowMeta.description}
          onChange={(e) => onFlowMetaChange({ description: e.target.value })}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold">Run as (team member ID)</Form.Label>
        <Form.Control
          size="sm"
          type="number"
          value={flowMeta.run_as_user_id}
          onChange={(e) => onFlowMetaChange({ run_as_user_id: e.target.value === "" ? "" : Number(e.target.value) })}
        />
        <div className="text-muted" style={{ fontSize: 11 }}>Used for records this automation creates, and as the default sender.</div>
      </Form.Group>
      <Form.Check
        className="mb-2"
        type="switch"
        label="Also run for records imported in bulk (Excel, Google Sheet, IndiaMart...)"
        checked={flowMeta.include_imported_records}
        onChange={(e) => onFlowMetaChange({ include_imported_records: e.target.checked })}
      />
      <Form.Check
        type="switch"
        label="Can be triggered by another automation's changes"
        checked={flowMeta.allow_automation_trigger}
        onChange={(e) => onFlowMetaChange({ allow_automation_trigger: e.target.checked })}
      />
      <p className="text-muted small mt-3">Click the Trigger box or a step on the canvas to edit its settings.</p>
    </div>
  );
};

export default SettingsPanel;
