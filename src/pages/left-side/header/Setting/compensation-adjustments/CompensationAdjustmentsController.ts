import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IEmployeeView {
  value: number;
  label: string;
}

export interface ICompensationAdjustmentView {
  id: number;
  employee_id: number;
  employee_name?: string;
  adjustment_type: number; // 0=Credit Hours, 1=Debit Hours, 2=Credit Amount, 3=Debit Amount
  hours_value?: number | null;
  amount_value?: number | null;
  hours?: number | null;
  amount?: number | null;
  apply_date: string;
  remark?: string;
  type_id: number;
  created_date_time?: string;
}

export interface ICompensationAdjustmentCreate {
  employee_id: number;
  adjustment_type: number;
  type_id: number;
  hours_value?: number | null;
  amount_value?: number | null;
  apply_date: string;
  remark?: string;
}

export const ADJUSTMENT_TYPES = [
  { id: 1, name: "Credit Hours", isHours: true, isCredit: true },
  { id: 2, name: "Debit Hours", isHours: true, isCredit: false },
  { id: 3, name: "Credit Amount", isHours: false, isCredit: true },
  { id: 4, name: "Debit Amount", isHours: false, isCredit: false },
];

export const isHoursType = (adjustmentType: number): boolean => {
  return adjustmentType === 1 || adjustmentType === 2;
};

export const fetchEmployeeList = async (
  setEmployeeList: TReactSetState<IEmployeeView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("my-team", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setEmployeeList([]);
      }
      const teamR = data.data.data.item || [];
      const teamArr = teamR.map((v: any) => {
        return {
          value: v.id,
          label: `${v.username}${v.employee_id ? "-" + v.employee_id : ""}`,
        };
      });
      setEmployeeList(teamArr);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchAdjustmentTypes = async (
  setTypeList: TReactSetState<IEmployeeView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post(
      "compensation-adjustments/types",
      requestData,
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setTypeList([]);
      }
      const dataList = data.data.data || [];
      const list = dataList.map((v: any) => {
        return {
          value: v.id,
          label: v.name,
        };
      });
      setTypeList(list);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCompensationAdjustmentApi = async (
  setAdjustmentList: TReactSetState<ICompensationAdjustmentView[]>,
  setLoading: TReactSetState<boolean>,
  limit: number = 30,
  offset: number = 0,
  append: boolean = false,
): Promise<boolean> => {
  // const start: number = offset * limit;
  // returns true if more data may exist (fetched count === limit)
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    // limit,
    // offset,
    ul: offset,
    ll: limit,
  };
  try {
    const data = await axiosInstance.post(
      "compensation-adjustments/fetch",
      requestData,
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        if (!append) setAdjustmentList([]);
        return false;
      }
      const newItems: ICompensationAdjustmentView[] = data.data.data || [];
      if (append) {
        setAdjustmentList((prev) => [...prev, ...newItems]);
      } else {
        setAdjustmentList(newItems);
      }
      return newItems.length === limit; // false = reached end
    }
    return false;
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const createCompensationAdjustment = async (
  input: ICompensationAdjustmentCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    employee_id: input.employee_id,
    type_id: input.type_id,
    adjustment_type: input.adjustment_type,
    hours_value: input.hours_value ?? null,
    amount_value: input.amount_value ?? null,
    apply_date: input.apply_date,
    remark: input.remark || "",
    a_application_login_id: Number(getUUID),
  };
  try {
    const { data } = await axiosInstance.post(
      "compensation-adjustments/insert",
      requestData,
    );
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
};

export const updateCompensationAdjustment = async (
  input: ICompensationAdjustmentCreate,
  editId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    employee_id: input.employee_id,
    type_id: input.type_id,
    adjustment_type: input.adjustment_type,
    hours_value: input.hours_value ?? null,
    amount_value: input.amount_value ?? null,
    apply_date: input.apply_date,
    remark: input.remark || "",
    a_application_login_id: Number(getUUID),
    editId,
  };
  try {
    const { data } = await axiosInstance.post(
      "compensation-adjustments/update",
      requestData,
    );
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
};

export const handleDeleteCompensationAdjustment = async (
  deleteIds: number[],
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setAdjustmentList: TReactSetState<ICompensationAdjustmentView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    type_id: deleteIds,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post(
      "/compensation-adjustments/delete",
      requestData,
    );
    if (
      data.data.code === 200 &&
      data.data.ack === DEFAULT_STATUS_CODE_SUCCESS
    ) {
      setIsDeleteConfirmation(false);
      await fetchCompensationAdjustmentApi(
        setAdjustmentList,
        setLoading,
        30,
        0,
        false,
      );
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
  } finally {
    setLoading(false);
  }
};
