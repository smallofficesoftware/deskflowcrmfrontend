import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

const companyMastersId = () => localStorage.getItem("COMPANY_ID");
const loginId = () => localStorage.getItem("UUID");

export interface IReportColumn {
  key: string;
  label: string;
  type: "string" | "number" | "currency" | "date" | "lookup" | "csv";
  filterable?: boolean;
  sortable?: boolean;
  groupable?: boolean;
  aggregatable?: string[];
  // Company-defined custom field (custom_field_form_masters), resolved
  // fresh per company by the backend — not part of the fixed static schema.
  dynamic?: boolean;
}

export interface IModelRelation {
  key: string; // plain relation key, e.g. "customer" — each column below carries the dotted "customer.person_name" key
  label: string;
  columns: IReportColumn[];
}

export interface IModelRegistryEntry {
  key: string;
  label: string;
  columns: IReportColumn[];
  // Whitelisted joins — select/display only (no filter/aggregate), see
  // backend/src/services/report_builder/modelRegistry.js and queryEngine.js.
  relations?: IModelRelation[];
}

export interface IPluginFilterField {
  key: string;
  label: string;
  type: "string" | "number" | "currency" | "date" | "lookup";
}

export interface IPluginRegistryEntry {
  key: string;
  label: string;
  filterSchema: IPluginFilterField[];
}

export interface IMetricEntry {
  key: string;
  label: string;
}

export interface IReportDefinition {
  id: number;
  name: string;
  type: string;
  model_key: string;
  plugin_key?: string | null;
  columns_json: string;
  filters_json: string | null;
  group_by_json: string | null;
  source_system_report_definition_id?: number | null;
  created_date_time: string;
}

const handleError = (error: any, fallback: string) => {
  console.error(error);
  toast.error(error?.response?.data?.developer_msg || fallback);
};

// Same envelope every build-route call gets when the report_builder feature
// flag is off or the PIN hasn't been verified yet — surfaced as a plain
// toast rather than a special-cased UI state, since both are just "not
// available right now" from the caller's point of view.
const reportError = (data: any, fallback: string) => {
  toast.error(data?.ack_msg || fallback);
};

export const verifyReportPin = async (pin: string): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("report-pin/verify", {
      a_application_login_id: loginId(),
      pin,
    });
    if (data?.ack === 1) {
      // Stateless verification (backend's reportPinAuth.js) — this token is
      // what requireReportPin actually checks on every gated request, sent
      // automatically by axiosInstance's own interceptor. Stored here so
      // it survives across Report Builder AND Document Designer, same PIN.
      if (data.data?.reportPinToken) {
        localStorage.setItem("REPORT_PIN_TOKEN", data.data.reportPinToken);
      }
      return true;
    }
    reportError(data, "Incorrect PIN");
    return false;
  } catch (error) {
    handleError(error, "Failed to verify PIN");
    return false;
  }
};

export const getModelRegistry = async (): Promise<IModelRegistryEntry[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/model-registry", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report sources");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report sources");
    return [];
  }
};

export const getPluginRegistry = async (): Promise<IPluginRegistryEntry[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/plugin-registry", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report sources");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report sources");
    return [];
  }
};

export const getMetricsRegistry = async (): Promise<IMetricEntry[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/metrics-registry", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load metrics");
    return [];
  } catch (error) {
    handleError(error, "Failed to load metrics");
    return [];
  }
};

export const listReportDefinitions = async (): Promise<IReportDefinition[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/list", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load saved reports");
    return [];
  } catch (error) {
    handleError(error, "Failed to load saved reports");
    return [];
  }
};

export interface ISystemReportDefinition {
  id: number;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  priority: "critical" | "high" | "normal" | null;
}

// "Browse Report Library" gallery — flag-only, no PIN (same tier Document
// Designer's own system-gallery/list uses, see documentPrintTemplateRouter.js).
export const listSystemReportDefinitions = async (): Promise<ISystemReportDefinition[]> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/system-gallery/list", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load report library");
    return [];
  } catch (error) {
    handleError(error, "Failed to load report library");
    return [];
  }
};

// Copying is a build action (writes a new report_definitions row) so it's
// PIN-gated, same tier as create — the caller must already have a valid
// x-report-pin-token, same as every other build route.
export const copyFromSystemReportDefinition = async (
  systemReportDefinitionId: number,
): Promise<IReportDefinition | null> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/system-gallery/copy", {
      a_application_login_id: loginId(),
      company_masters_id: companyMastersId(),
      system_report_definition_id: systemReportDefinitionId,
    });
    if (data?.ack === 1) {
      toast.success("Report added to your company");
      return data.data.item;
    }
    reportError(data, "Failed to add report");
    return null;
  } catch (error) {
    handleError(error, "Failed to add report");
    return null;
  }
};

export interface IReportDefinitionPayload {
  name: string;
  type?: "query" | "plugin" | "composite";
  model_key?: string;
  plugin_key?: string;
  // query-type: [{column,aggregate?,alias?}]. plugin-type: {paramKey:value}.
  // composite-type: string[] of metric keys (see metricsRegistry.js).
  columns_json: any;
  filters_json?: any;
  group_by_json?: any;
}

export const createReportDefinition = async (payload: IReportDefinitionPayload): Promise<IReportDefinition | null> => {
  try {
    const { data } = await axiosInstance.post("report-definitions/create", {
      a_application_login_id: loginId(),
      company_masters_id: companyMastersId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Report created successfully");
      return data.data.item;
    }
    reportError(data, "Failed to create report");
    return null;
  } catch (error) {
    handleError(error, "Failed to create report");
    return null;
  }
};

export const updateReportDefinition = async (
  id: number,
  payload: Partial<IReportDefinitionPayload>,
): Promise<IReportDefinition | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/update`, {
      a_application_login_id: loginId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Report updated successfully");
      return data.data.item;
    }
    reportError(data, "Failed to update report");
    return null;
  } catch (error) {
    handleError(error, "Failed to update report");
    return null;
  }
};

export const deleteReportDefinition = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/delete`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) {
      toast.success("Report deleted successfully");
      return true;
    }
    reportError(data, "Failed to delete report");
    return false;
  } catch (error) {
    handleError(error, "Failed to delete report");
    return false;
  }
};

export const exportReportExcel = async (id: number): Promise<string | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/export/excel`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.fileUrl;
    reportError(data, "Failed to export Excel");
    return null;
  } catch (error) {
    handleError(error, "Failed to export Excel");
    return null;
  }
};

export const exportReportPdf = async (
  id: number,
  options?: { template_id?: number; disposition?: "inline" | "attachment" },
): Promise<string | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/export/pdf`, {
      a_application_login_id: loginId(),
      ...options,
    });
    if (data?.ack === 1) return data.data.fileUrl;
    reportError(data, "Failed to export PDF");
    return null;
  } catch (error) {
    handleError(error, "Failed to export PDF");
    return null;
  }
};

export const runReportDefinition = async (
  id: number,
  options?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: { column: string; direction: "ASC" | "DESC" };
  },
): Promise<{ rows: any[]; row_count: number; duration_ms: number } | null> => {
  try {
    const { data } = await axiosInstance.post(`report-definitions/${id}/run`, {
      a_application_login_id: loginId(),
      ...options,
    });
    if (data?.ack === 1) return data.data;
    reportError(data, "Failed to run report");
    return null;
  } catch (error) {
    handleError(error, "Failed to run report");
    return null;
  }
};
