import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IWarehouseReport {
  warehouse_name: string;
  id: number;
  warehouse_color: string | undefined | null;
  created_date_time?: string;
  assigned_team_member: number | string;
}

export const fetchWarehouseApi = async (
  setWarehouseList: TReactSetState<IWarehouseReport[]>,
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