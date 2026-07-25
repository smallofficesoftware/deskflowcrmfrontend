import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ISourceOfTypes {
  source_name: string;
  id: number;
  color: string | undefined | null;
}

export interface ISourceOfTypesCreate {
  source_name: string;
  color: string | undefined | null;
}
interface IAddSourceOfTypesObj {
  source_name: string;
  color: string | undefined | null;
}
export const handleDeleteSourceType = async (
  sourceOfIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setSourceOfTypesLists: TReactSetState<ISourceOfTypes[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "source_types",
    where: `{"id":"${sourceOfIds.join(",")}"}`,
    data: `{"isDelete":"1"}`,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchSourceOfTypesApi(setSourceOfTypesLists, setLoading);
      toast.success(
        sourceOfIds.length > 1
          ? "Sources Deleted Successfully"
          : "Source Deleted Successfully"
      );
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createSourceOfType = async (
  sourceOfTypeInput: IAddSourceOfTypesObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      sourceOfTypeInput.source_name,
      "source_types",
      "source_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "source_types",
      data: `{"source_name":"${sourceOfTypeInput.source_name}","color":"${sourceOfTypeInput.color
        }","a_application_login_id":${Number(getUUID)}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
          clearFormCallback()
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Source Type already available");
  }
};

export const fetchSourceOfTypesApi = async (
  setSourceOfTypesLists: TReactSetState<ISourceOfTypes[]>,
  setLoading: TReactSetState<boolean>,
) => {

  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token")
  const requestData = {
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("sourceOfTypes", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false)
      setSourceOfTypesLists([]);
    }
    setLoading(true)
    setSourceOfTypesLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const updateSourceOfTypes = async (
  sourceOfTypeInput: ISourceOfTypesCreate,
  setLoading: TReactSetState<boolean>,
  editSourceTypeId: number | undefined,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      sourceOfTypeInput.source_name,
      "source_types",
      "source_name",
      editSourceTypeId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "source_types",
      where: `{"id":"${editSourceTypeId}"}`,
      data: `{"source_name":"${sourceOfTypeInput.source_name}","color":"${sourceOfTypeInput.color
        }","a_application_login_id":${Number(getUUID)}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearFormCallback()
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Source Type already available");
  }
};
