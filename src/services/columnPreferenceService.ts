import { DEFAULT_STATUS_CODE_SUCCESS } from "../helpers/AppConstants";
import { axiosInstance } from "./axiosInstance";

export interface IColumnPreference {
  column_order: string[] | null;
  hidden_columns: string[] | null;
}

export const fetchColumnPreference = async (
  reportKey: string,
): Promise<IColumnPreference | null> => {
  try {
    const localId = localStorage.getItem("UUID");
    if (!localId) return null;

    const { data } = await axiosInstance.post("/get-column-preference", {
      a_application_login_id: localId,
      report_key: reportKey,
    });

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return data.data as IColumnPreference;
    }

    return null;
  } catch (error) {
    console.error("fetchColumnPreference error", error);
    return null;
  }
};

export const saveColumnPreference = async (
  reportKey: string,
  columnOrder: string[],
  hiddenColumns: string[],
): Promise<boolean> => {
  try {
    const localId = localStorage.getItem("UUID");
    if (!localId) return false;

    const { data } = await axiosInstance.post("/save-column-preference", {
      a_application_login_id: localId,
      report_key: reportKey,
      column_order: columnOrder,
      hidden_columns: hiddenColumns,
    });

    return data.ack === DEFAULT_STATUS_CODE_SUCCESS;
  } catch (error) {
    console.error("saveColumnPreference error", error);
    return false;
  }
};
