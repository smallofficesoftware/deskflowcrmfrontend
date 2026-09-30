// Shared types for the Automations module (frontend). Mirrors
// backend-document-designer's src/services/automation/catalog.js output —
// keep field `type` values in sync with NODE_DEFS / TRIGGER_CONFIG there.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "template"
  | "user"
  | "users"
  | "ref"
  | "keyvalue"
  | "fields"
  | "rules"
  | "conditions"
  | "datetime";

export interface IFieldOption {
  value: string | number;
  label: string;
}

export interface IFieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  options?: (IFieldOption | string | number)[];
  ref?: string;
  multiple?: boolean;
  special?: string[];
  showIf?: Record<string, any>;
  placeholder?: string;
  help?: string;
  template?: boolean;
  secret?: boolean;
  keyLabel?: string;
  valueLabel?: string;
  mapping?: boolean;
}

export interface INodeDef {
  type: string;
  group: string;
  label: string;
  fields: IFieldDef[];
  outputs?: string[];
  wires?: string | string[];
}

export interface ITriggerDef {
  type: string;
  group: string;
  label: string;
  source: "event" | "cron" | "webhook" | "manual";
  record: string | null;
  phase: number;
  config: IFieldDef[];
}

export interface ICatalog {
  triggers: ITriggerDef[];
  nodes: INodeDef[];
  operators: string[];
  cart_types: IFieldOption[];
  wires: { default: string; error: string };
}

export interface IFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  name?: string;
  description?: string;
}

export interface IFlowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle?: string;
}

export interface IFlowSummary {
  id: number;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_label: string;
  is_active: 0 | 1;
  is_paused: 0 | 1;
  paused_reason: string | null;
  version: number;
  last_run_at: string | null;
  run_count: number;
  step_count: number;
  created_by: number | null;
  modified_date: string | null;
  webhook_url: string | null;
}

export interface IFlowDetail extends IFlowSummary {
  trigger_config: Record<string, any>;
  nodes: IFlowNode[];
  connections: IFlowConnection[];
  run_as_user_id: number | null;
  allow_automation_trigger: 0 | 1;
  include_imported_records: 0 | 1;
  webhook: {
    url: string;
    auth_type: string;
    secret: string | null;
    is_active: 0 | 1;
    last_called_at: string | null;
  } | null;
}

export interface IExecutionSummary {
  id: number;
  flow_id: number;
  flow_name?: string | null;
  flow_version: number;
  record_type: string | null;
  record_id: number | null;
  status: "running" | "waiting" | "success" | "failed" | "cancelled" | "skipped";
  is_test: 0 | 1;
  origin: string;
  started_at: string;
  completed_at: string | null;
  resume_at: string | null;
  error: string | null;
}

export interface IExecutionLog {
  id: number;
  execution_id: number;
  node_id: string;
  node_type: string;
  status: "success" | "failed" | "skipped" | "waiting";
  input: any;
  output: any;
  error: string | null;
  start_time: string;
  end_time: string | null;
}

export interface IExecutionDetail extends IExecutionSummary {
  context: Record<string, any>;
  logs: IExecutionLog[];
  flow: { id: number; name: string; nodes: IFlowNode[]; connections: IFlowConnection[] };
}

export interface IWebhookRow {
  id: number;
  flow_id: number;
  flow_name: string | null;
  flow_active: 0 | 1;
  url: string;
  auth_type: string;
  is_active: 0 | 1;
  last_called_at: string | null;
  listening: boolean;
  has_sample: boolean;
}

export interface IAutomationSettings {
  wa_limit_per_minute: number | null;
  wa_limit_per_day: number | null;
  quiet_hours_from: string | null;
  quiet_hours_to: string | null;
  business_hours: { days: number[]; from: string; to: string } | null;
  timezone: string;
  failure_alert_user_ids: number[];
}

export interface IUsage {
  /** false when the company's plan does not include Workflow Automation. */
  included?: boolean;
  active_flows: number;
  max_active_flows: number | null;
  runs_this_month: number;
  max_runs_per_month: number | null;
}
