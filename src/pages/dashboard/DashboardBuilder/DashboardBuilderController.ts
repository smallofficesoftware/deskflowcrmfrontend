import { toast } from "react-toastify";
import { axiosInstance } from "../../../services/axiosInstance";

const companyMastersId = () => localStorage.getItem("COMPANY_ID");
const loginId = () => localStorage.getItem("UUID");

export interface IDashboard {
  id: number;
  company_masters_id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  is_default: number;
  display_order: number;
  created_date_time: string;
}

export interface IDashboardWidget {
  id: number;
  dashboard_id: number;
  report_definition_id: number;
  widget_type: "bar" | "line" | "pie" | "doughnut" | "stat_tile" | "table";
  title?: string | null;
  chart_config_json?: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  display_order: number;
  // Only present on getDashboard()'s result — join info for the Add-Widget
  // picker/canvas labels, not stored on the widget row itself.
  report_definition_name?: string | null;
  report_definition_type?: string | null;
  source_missing?: boolean;
}

export interface IDashboardWithWidgets extends IDashboard {
  widgets: IDashboardWidget[];
}

// One widget's live run result — same shape runDashboard() returns per
// widget (base widget fields spread with the run's ack/data or ack:0/error).
export interface IDashboardWidgetResult extends IDashboardWidget {
  ack?: number;
  ack_msg?: string;
  data?: { rows?: any[]; row_count?: number; duration_ms?: number };
}

const handleError = (error: any, fallback: string) => {
  console.error(error);
  toast.error(error?.response?.data?.developer_msg || fallback);
};

const reportError = (data: any, fallback: string) => {
  toast.error(data?.ack_msg || fallback);
};

export const createDashboard = async (payload: { name: string; description?: string; icon?: string }): Promise<IDashboard | null> => {
  try {
    const { data } = await axiosInstance.post("dashboards/create", {
      a_application_login_id: loginId(),
      company_masters_id: companyMastersId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Dashboard created successfully");
      return data.data.item;
    }
    reportError(data, "Failed to create dashboard");
    return null;
  } catch (error) {
    handleError(error, "Failed to create dashboard");
    return null;
  }
};

export const updateDashboard = async (id: number, payload: { name?: string; description?: string; icon?: string }): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${id}/update`, {
      a_application_login_id: loginId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Dashboard updated successfully");
      return true;
    }
    reportError(data, "Failed to update dashboard");
    return false;
  } catch (error) {
    handleError(error, "Failed to update dashboard");
    return false;
  }
};

export const deleteDashboard = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${id}/delete`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) {
      toast.success("Dashboard deleted successfully");
      return true;
    }
    reportError(data, "Failed to delete dashboard");
    return false;
  } catch (error) {
    handleError(error, "Failed to delete dashboard");
    return false;
  }
};

export const listDashboards = async (): Promise<IDashboard[]> => {
  try {
    const { data } = await axiosInstance.post("dashboards/list", {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load dashboards");
    return [];
  } catch (error) {
    handleError(error, "Failed to load dashboards");
    return [];
  }
};

export const getDashboard = async (id: number): Promise<IDashboardWithWidgets | null> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${id}`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return data.data.item;
    reportError(data, "Failed to load dashboard");
    return null;
  } catch (error) {
    handleError(error, "Failed to load dashboard");
    return null;
  }
};

export const reorderDashboards = async (orderedIds: number[]): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("dashboards/reorder", {
      a_application_login_id: loginId(),
      orderedIds,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to reorder dashboards");
    return false;
  }
};

export const setDefaultDashboard = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${id}/set-default`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to set default dashboard");
    return false;
  } catch (error) {
    handleError(error, "Failed to set default dashboard");
    return false;
  }
};

export const duplicateDashboard = async (id: number): Promise<IDashboard | null> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${id}/duplicate`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) {
      toast.success("Dashboard duplicated successfully");
      return data.data.item;
    }
    reportError(data, "Failed to duplicate dashboard");
    return null;
  } catch (error) {
    handleError(error, "Failed to duplicate dashboard");
    return null;
  }
};

// Live run — every active widget's underlying report_definition, cached/
// capped server-side (see dashboardServices.js's runDashboard). No toast on
// failure — a single widget failing (source report deleted, etc.) is
// rendered inline on that widget's own tile, not as a page-level error.
// dateRange/teamMemberIds — same "Date Range"/"Team Member" general-filter
// slots (1 and 5/9) modelRegistry.js already defines per model; resolved
// per-widget server-side (dashboardServices.js's buildDashboardScopeFilters)
// since each widget's report can be a different model_key.
export const runDashboard = async (
  id: number,
  scope?: { dateRange?: { start?: string; end?: string }; teamMemberIds?: number[] },
): Promise<{ dashboard: IDashboard; widgets: IDashboardWidgetResult[] } | null> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${id}/run`, {
      a_application_login_id: loginId(),
      ...scope,
    });
    if (data?.ack === 1) return data.data.item;
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export interface IAddWidgetPayload {
  report_definition_id: number;
  widget_type: IDashboardWidget["widget_type"];
  title?: string;
  chart_config_json?: Record<string, unknown>;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

export const addWidget = async (dashboardId: number, payload: IAddWidgetPayload): Promise<IDashboardWidget | null> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${dashboardId}/widgets/create`, {
      a_application_login_id: loginId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Widget added successfully");
      return data.data.item;
    }
    reportError(data, "Failed to add widget");
    return null;
  } catch (error) {
    handleError(error, "Failed to add widget");
    return null;
  }
};

export interface IQuickCounterPayload {
  model_key: string;
  column: string;
  aggregate: "sum" | "avg" | "min" | "max" | "count";
  label?: string;
  title?: string;
}

export const addQuickCounterWidget = async (dashboardId: number, payload: IQuickCounterPayload): Promise<IDashboardWidget | null> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${dashboardId}/widgets/quick-counter`, {
      a_application_login_id: loginId(),
      ...payload,
    });
    if (data?.ack === 1) {
      toast.success("Counter widget added successfully");
      return data.data.item;
    }
    reportError(data, "Failed to add counter widget");
    return null;
  } catch (error) {
    handleError(error, "Failed to add counter widget");
    return null;
  }
};

export const updateWidget = async (
  widgetId: number,
  payload: Partial<Pick<IDashboardWidget, "widget_type" | "title" | "chart_config_json" | "position_x" | "position_y" | "width" | "height">>,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/widgets/${widgetId}/update`, {
      a_application_login_id: loginId(),
      ...payload,
    });
    if (data?.ack === 1) return true;
    reportError(data, "Failed to update widget");
    return false;
  } catch (error) {
    handleError(error, "Failed to update widget");
    return false;
  }
};

export const deleteWidget = async (widgetId: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/widgets/${widgetId}/delete`, {
      a_application_login_id: loginId(),
    });
    if (data?.ack === 1) {
      toast.success("Widget removed");
      return true;
    }
    reportError(data, "Failed to remove widget");
    return false;
  } catch (error) {
    handleError(error, "Failed to remove widget");
    return false;
  }
};

// Batch position/size — one call per grid-layout drag/resize session
// (react-grid-layout's own onLayoutChange gives the whole layout array at
// once), not one call per widget.
export const updateWidgetPositions = async (
  dashboardId: number,
  positions: { id: number; position_x: number; position_y: number; width: number; height: number }[],
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post(`dashboards/${dashboardId}/widgets/positions`, {
      a_application_login_id: loginId(),
      positions,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to save layout");
    return false;
  }
};
