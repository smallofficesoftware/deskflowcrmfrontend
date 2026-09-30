import moment from "moment";
import { getCustomFieldDatavalues } from "../../../common/SharedFunction";
import { axiosInstance } from "../../../services/axiosInstance";

export type TStageModule = "contact" | "inquiry";

export const STAGE_FORM_TYPE: Record<TStageModule, number> = {
  contact: 1,
  inquiry: 2,
};

const STAGE_TABLE: Record<TStageModule, string> = {
  contact: "contact_masters",
  inquiry: "inquiries",
};

export interface IStageFormField {
  id: number;
  title: string;
  data_type: number;
  required_or_not: number;
  reference_column_name: string;
  options: string[];
}

export interface IStageChangeRequest {
  module: TStageModule;
  stageId: number | string;
  stageName?: string;
  /** record id, list of record ids, or "all" (contact bulk with appliedFilers) */
  appliedTo: number | string | Array<number | string>;
  appliedFilers?: any;
  /** contact Kanban drop position */
  position?: number;
  /** skip the server's success toast (caller shows its own) */
  silentSuccess?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export interface IStageFormValue {
  field_id: number;
  value: string | number | boolean | null;
}

// data_type values (custom_field_form_masters)
export const DT_DATE = 4;
export const DT_DATE_TIME = 5;
export const DT_TIME = 6;
export const DT_SWITCH = 7;
export const DT_DROPDOWN = 9;
export const DT_RADIO = 10;

/** Stage form fields (display_on = 2) asked when a record is moved to `stageId`. */
export const fetchStageFormFields = async (
  module: TStageModule,
  stageId: number | string,
): Promise<IStageFormField[]> => {
  try {
    const { data } = await axiosInstance.post("getCustomFieldFrom", {
      a_application_login_id: Number(localStorage.getItem("UUID")),
      form_type: STAGE_FORM_TYPE[module],
    });
    const items: any[] = data?.data?.item || [];
    const fields = items.filter(
      (f) =>
        Number(f.display_on) === 2 &&
        String(f.stage_ids || "")
          .split(",")
          .map((s) => s.trim())
          .includes(String(stageId)),
    );
    if (!fields.length) return [];

    const optionFieldIds = fields
      .filter((f) => f.data_type === DT_DROPDOWN || f.data_type === DT_RADIO)
      .map((f) => f.id);
    const optionRows: any[] = optionFieldIds.length
      ? (await getCustomFieldDatavalues(optionFieldIds)) || []
      : [];

    return fields.map((f) => ({
      id: f.id,
      title: f.title,
      data_type: f.data_type,
      required_or_not: f.required_or_not,
      reference_column_name: f.reference_column_name,
      options: optionRows
        .filter((r) => Number(r.custom_field_master_id) === Number(f.id))
        .map((r) => r.data_sorce),
    }));
  } catch (error) {
    return [];
  }
};

/** Current values of the stage fields on one record, as form-ready values. */
export const fetchCurrentStageValues = async (
  module: TStageModule,
  recordId: number | string,
  fields: IStageFormField[],
): Promise<Record<number, string | boolean>> => {
  const values: Record<number, string | boolean> = {};
  try {
    const { data } = await axiosInstance.post("commonGet", {
      table: STAGE_TABLE[module],
      columns: ["id", ...fields.map((f) => f.reference_column_name)].join(","),
      where: [`id=${recordId}`],
      request_flag: 0,
    });
    const row = (data?.data || [])[0];
    if (!row) return values;
    for (const f of fields) {
      const raw = row[f.reference_column_name];
      if (raw === null || raw === undefined || raw === "") {
        values[f.id] = f.data_type === DT_SWITCH ? false : "";
      } else if (f.data_type === DT_SWITCH) {
        values[f.id] = Number(raw) === 1 || raw === true;
      } else if (f.data_type === DT_DATE) {
        values[f.id] = moment(raw).format("YYYY-MM-DD");
      } else if (f.data_type === DT_DATE_TIME) {
        values[f.id] = moment(raw).format("YYYY-MM-DDTHH:mm");
      } else {
        values[f.id] = String(raw);
      }
    }
  } catch (error) {
    // prefill is a convenience only
  }
  return values;
};

/** Form values -> payload values (date-time back to "YYYY-MM-DD HH:mm:ss"). */
export const toStageFormPayload = (
  fields: IStageFormField[],
  values: Record<number, string | boolean>,
): IStageFormValue[] =>
  fields.map((f) => {
    const v = values[f.id];
    if (f.data_type === DT_SWITCH) return { field_id: f.id, value: v === true };
    if (v === undefined || v === "") return { field_id: f.id, value: null };
    if (f.data_type === DT_DATE_TIME) {
      return { field_id: f.id, value: moment(String(v)).format("YYYY-MM-DD HH:mm:ss") };
    }
    return { field_id: f.id, value: v };
  });

export interface IChangeStageResult {
  ok: boolean;
  message: string;
}

export const changeStageWithForm = async (
  request: IStageChangeRequest,
  stageFormValues: IStageFormValue[],
): Promise<IChangeStageResult> => {
  try {
    const { data } = await axiosInstance.post("change-stage-with-form", {
      a_application_login_id: Number(localStorage.getItem("UUID")),
      module: request.module,
      stage_id: request.stageId,
      appliedTo: request.appliedTo,
      appliedFilers: request.appliedFilers,
      position: request.position,
      stage_form_values: stageFormValues,
    });
    return { ok: data?.ack === 1, message: data?.ack_msg || "" };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.response?.data?.ack_msg || "Something went wrong",
    };
  }
};

export const fetchStageName = async (
  stageId: number | string,
): Promise<string | undefined> => {
  try {
    const { data } = await axiosInstance.post("commonGet", {
      table: "stage_status_masters",
      columns: "id,name",
      where: [`id=${stageId}`],
      request_flag: 0,
    });
    return (data?.data || [])[0]?.name;
  } catch (error) {
    return undefined;
  }
};

/** Stages a record is in or has been in (status log), as string ids. */
export const fetchReachedStageIds = async (
  module: TStageModule,
  recordId: number | string,
): Promise<Set<string>> => {
  const reached = new Set<string>();
  try {
    const { data } = await axiosInstance.post("fetch-status-log", {
      a_application_login_id: localStorage.getItem("UUID"),
      reference_table: STAGE_TABLE[module],
      reference_id: recordId,
      table_type: "",
    });
    ((data?.data || []) as { status_id: number | string }[]).forEach((row) =>
      reached.add(String(row.status_id)),
    );
  } catch (error) {
    // no history -> stage form fields stay hidden
  }
  return reached;
};

/**
 * Normal fields (display_on 1) always show. Stage form fields (display_on 2)
 * show on the main form only once the record has reached one of their stages.
 */
export const isCustomFieldVisible = (
  field: { display_on?: number | string | null; stage_ids?: string | null },
  reachedStageIds: Set<string>,
): boolean => {
  if (Number(field.display_on) !== 2) return true;
  return String(field.stage_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((id) => reachedStageIds.has(id));
};
