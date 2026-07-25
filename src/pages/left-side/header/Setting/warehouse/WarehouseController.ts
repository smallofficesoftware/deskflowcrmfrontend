import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IWarehouseView {
  warehouse_name: string;
  id: number;
  warehouse_color: string | undefined | null;
  created_date_time?: string;
  assigned_team_member: number | string;
}

export interface IWarehouseCreate {
  warehouse_name: string;
  warehouse_color: string | undefined | null;
  created_date_time?: string;
}

export const handleDeleteWarehouse = async (
  warehouseIds: number[],
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setWarehouseList: TReactSetState<IWarehouseView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token"); // unused but kept for consistency

  const requestData = {
    warehouse_id: warehouseIds.join(","), // API still expects "category_id" field name
    a_application_login_id: getUUID,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("wareHouseDelete", requestData);

    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchWarehouseApi(setWarehouseList, setLoading);
      toast.success(
        warehouseIds.length > 1
          ? "Warehouses Deleted Successfully"
          : "Warehouse Deleted Successfully"
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

export const createWarehouse = async (
  warehouseInput: IWarehouseCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  if (
    !(await checkDuplication(
      warehouseInput.warehouse_name,
      "warehouses",           // ← change table name if it's actually "warehouses"
      "warehouse_name"                 // ← change field name if it's actually "warehouse_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");

    // const requestData = {
    //   table: "warehouses",
    //   data: `{"warehouse_name":"${warehouseInput.warehouse_name}","warehouse_color":"${warehouseInput.warehouse_color}","a_application_login_id":${Number(getUUID)}}`,
    //   a_application_login_id: getUUID,
    //   isCheckDuplicate: true,
    //   duplicateField: "warehouse_name"
    // };

    const requestData = {
      warehouseInput: warehouseInput,
      a_application_login_id: getUUID

    };


    try {
      const { data } = await axiosInstance.post("warehouse-create", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg || "Warehouse created successfully");
          clearFormCallback();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Warehouse name already exists");
  }
};

export const updateWarehouse = async (
  warehouseInput: IWarehouseCreate,
  editWarehouseId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  if (
    !(await checkDuplicationUpdate(
      warehouseInput.warehouse_name,
      "warehouses",
      "warehouse_name",
      editWarehouseId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      table: "warehouses",
      where: `{"id":"${editWarehouseId}"}`,
      data: `{"warehouse_name":"${warehouseInput.warehouse_name}","warehouse_color":"${warehouseInput.warehouse_color}","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID
    };

    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearFormCallback();
          toast.success(data.ack_msg || "Warehouse updated successfully");
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Warehouse name already exists");
  }
};

export const fetchWarehouseApi = async (
  setWarehouseList: TReactSetState<IWarehouseView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: "warehouses",
    columns: "id,warehouse_name,warehouse_color,assigned_team_member",
    where: ["isDelete=0"], // you may want: [`a_application_login_id=${getUUID}||0`]
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };

  try {
    setLoading(true);
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.status === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setWarehouseList(response.data.data || []);
      } else {
        setWarehouseList([]);
        toast.error(response.data.ack_msg || "Failed to load warehouses");
      }
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setWarehouseList([]);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 800); // slightly shorter delay
  }
};


export const fetchAllCompanyApi = async (
  setCompanyTeamLists: TReactSetState<any[]>
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const data = await axiosInstance.post("my-team", requestData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyTeamLists([]);
      return;
    }

    // const filteredTeamList = data.data.data.item.filter(
    //   (user: any) => String(user.id) !== String(getUUID)
    // );
    setCompanyTeamLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateUserCheckBox = async (
  hasOneData: any | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
  setWarehouseList: TReactSetState<IWarehouseView[]>,
) => {
  const requestData = {
    table: "warehouses",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      assigned_team_member:
        selectedOptions.length > 0 ? selectedOptions.join(",") : "",
    }),
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        // setLoading(true);
        await fetchWarehouseApi(setWarehouseList, setLoading);
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};