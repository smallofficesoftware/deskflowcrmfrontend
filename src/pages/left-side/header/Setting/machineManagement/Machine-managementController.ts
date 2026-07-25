import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IMachineView {
  machine_name: string;
  id: number;
  color: string | undefined | null;
  created_date_time?: string;
}

export interface IMachineCreate {
  machine_name: string;
  color: string | undefined | null;
  created_date_time?: string;
}

export const handleDeleteMachine = async (
  machineId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setMachineList: TReactSetState<IMachineView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = localStorage.getItem("UUID")
  const requestData = {
    table: "machine_managements",
    where: `{"id":${machineId}}`,
    data: `{"isDelete":"1"}`,
    a_application_login_id: getUUID

  };
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {

        setIsDeleteConfirmation(false);
        fetchMachineApi(setMachineList, setLoading);
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const createMachineManagement = async (
  machineManagementInput: IMachineCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //  
) => {
  if (
    !(await checkDuplication(
      machineManagementInput.machine_name,
      "machine_managements",
      "machine_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "machine_managements",
      data: `{"machine_name":"${machineManagementInput.machine_name}","color":"${machineManagementInput.color
        }","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
          clearFormCallback();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Machine already available");
  }
};

export const updatemachine = async (
  machineManagementInput: IMachineCreate,
  editmachineId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      machineManagementInput.machine_name,
      "machine_managements",
      "machine_name",
      editmachineId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "machine_managements",
      where: `{"id":"${editmachineId}"}`,
      data: `{"machine_name":"${machineManagementInput.machine_name}","color":"${machineManagementInput.color
        }","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearFormCallback();
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("machine already available");
  }
};

export const fetchMachineApi = async (
  setMachineList: TReactSetState<IMachineView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "machine_managements",
    columns: "id,machine_name,color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false)
        setMachineList([]);
      }
      setLoading(true)
      setMachineList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};
