import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ILabelView {
  lable_name: string;
  id: number;
  color: string | undefined | null;
}
export interface ILabelCreate {
  lable_name: string;
  color: string | undefined | null;
}

interface IAddLabelObj {
  lable_name: string;
  color: string | undefined | null;
}
export const handleDeleteLabel = async (
  labelIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setLabelList: TReactSetState<ILabelView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "lable_masters",
    where: `{"id":"${labelIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchLabelApi(setLabelList, setLoading);
      toast.success(
        labelIds.length > 1
          ? "Labels Deleted Successfully"
          : "Label Deleted Successfully"
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

export const createLabel = async (
  labelInput: IAddLabelObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      labelInput.lable_name,
      "lable_masters",
      "lable_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "lable_masters",
      data: `{"lable_name":"${labelInput.lable_name}","color":"${labelInput.color
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
    toast.error("Label already available");
  }
};

export const fetchLabelApi = async (
  setLabelList: TReactSetState<ILabelView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "lable_masters",
    columns: "id,lable_name,color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setLabelList([]);
    }
    setLoading(true);
    setLabelList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const updateLabel = async (
  categoryInput: ILabelCreate,
  setLoading: TReactSetState<boolean>,
  editLabelId: number | undefined,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      categoryInput.lable_name,
      "lable_masters",
      "lable_name",
      editLabelId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      table: "lable_masters",
      where: `{"id":"${editLabelId}"}`,
      data: `{"lable_name":"${categoryInput.lable_name}","color":"${categoryInput.color
        }","a_application_login_id":${Number(getUUID)}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);

      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Label already available");
  }
};
