// Thin wrappers over the Automations backend API (src/routes/automation).
// Every call returns the CRM's usual { code, ack, ack_msg, data } envelope
// (utils/sharedFunctions.js resSuccess/resError); callers check `.ack === 1`.
import { axiosInstance } from "../../services/axiosInstance";
import {
  ICatalog,
  IExecutionDetail,
  IFlowDetail,
  IFlowSummary,
  IUsage,
  IWebhookRow,
  IAutomationSettings,
} from "./automationTypes";

interface IApiResult<T = any> {
  code: number;
  ack: number;
  ack_msg: string;
  developer_msg?: string;
  data: T;
}

const post = async <T = any>(path: string, body: Record<string, any> = {}): Promise<IApiResult<T>> => {
  const { data } = await axiosInstance.post(`automation/${path}`, body);
  return data;
};

export interface ITemplateRow {
  key: string;
  name: string;
  description: string;
  group: string;
  trigger_type: string;
  step_count: number;
}
export const listTemplates = () => post<{ item: ITemplateRow[] }>("templates/list");
export const createFromTemplate = (key: string) => post<{ item?: { id: number; version: number }; errors?: string[] }>("templates/use", { key });

export const getCatalog = () => post<{ item: ICatalog }>("catalog");
export const getUsage = () => post<{ item: IUsage }>("usage");

export const listFlows = () => post<{ item: IFlowSummary[] }>("flows/list");
export const getFlow = (id: number) => post<{ item: IFlowDetail }>("flows/get", { id });
export interface ISaveFlowPayload {
  id?: number;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  run_as_user_id?: number;
  allow_automation_trigger?: boolean;
  include_imported_records?: boolean;
  nodes: IFlowDetail["nodes"];
  connections: IFlowDetail["connections"];
}
// save/toggle return { item } on success or { errors: [...] } when the flow
// fails validation (validateFlow) - both live under `data`, so `item` here
// is optional rather than a separate response type per outcome.
export const saveFlow = (flow: ISaveFlowPayload) =>
  post<{ item?: { id: number; version: number }; errors?: string[] }>("flows/save", flow);
export const toggleFlow = (id: number, is_active: boolean) =>
  post<{ item?: { id: number; is_active: boolean }; errors?: string[] }>("flows/toggle", { id, is_active });
export const deleteFlow = (id: number) => post("flows/delete", { id });
export const duplicateFlow = (id: number) => post<{ item: { id: number } }>("flows/duplicate", { id });
export const testFlow = (id: number, record_id?: number, record_type?: string) =>
  post<{ item: any }>("flows/test", { id, record_id, record_type });
export const runFlow = (id: number, record_id?: number, record_type?: string) =>
  post<{ item: any }>("flows/run", { id, record_id, record_type });

export const listExecutions = (params: { flow_id?: number; status?: string; page?: number; limit?: number; include_tests?: boolean } = {}) =>
  post<{ item: any[]; total: number; page: number; limit: number }>("executions/list", params);
export const getExecution = (id: number) => post<{ item: IExecutionDetail }>("executions/get", { id });
export const cancelExecution = (id: number) => post("executions/cancel", { id });

export const listWebhooks = () => post<{ item: IWebhookRow[] }>("webhooks/list");
export const listenForSample = (flow_id: number) => post("webhooks/listen", { flow_id });
export const getSample = (flow_id: number) => post<{ item: { listening: boolean; sample: any } }>("webhooks/sample", { flow_id });
export const updateWebhook = (flow_id: number, patch: { auth_type?: string; rotate?: boolean; is_active?: boolean }) =>
  post<{ item: { url: string; auth_type: string; secret: string | null } }>("webhooks/update", { flow_id, ...patch });

export const getSettings = () => post<{ item: IAutomationSettings }>("settings/get");
export const saveSettings = (settings: Partial<IAutomationSettings>) => post("settings/save", settings);
