import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IDuplicateContact {
  id: number;
  person_name: string;
  mobile_number: string;
  raw_mobile_number: string;
  source_type_id: number;
  created_date_time: string;
}

export interface IDuplicateContactGroup {
  mobile_number: string;
  contacts: IDuplicateContact[];
}

export interface IContactActivityRow {
  contact_id: number;
  cnt: number;
  newest: string | null;
}

export interface IContactMergePreview {
  contacts: IDuplicateContact[];
  activity: Record<string, IContactActivityRow[]>;
}

export const fetchDuplicateContactGroups = async (
  setGroups: TReactSetState<IDuplicateContactGroup[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = { a_application_login_id: getUUID };
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("duplicate-contact-groups", requestData);
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setGroups(data.data || []);
    } else {
      setGroups([]);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const fetchContactMergePreview = async (
  contactIds: number[],
  setPreview: TReactSetState<IContactMergePreview | undefined>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = { a_application_login_id: getUUID, contact_ids: contactIds };
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("contact-merge-preview", requestData);
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setPreview(data.data);
    } else {
      setPreview(undefined);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const mergeDuplicateContact = async (
  keepId: number,
  mergeId: number,
  setLoading: TReactSetState<boolean>,
  onSuccess: () => void
): Promise<boolean> => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = { a_application_login_id: getUUID, keep_id: keepId, merge_id: mergeId };
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("merge-contact", requestData);
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Contacts merged successfully");
      onSuccess();
      return true;
    }
    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setLoading(false);
  }
};
