import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IExpenseTypeView {
  id: number;
  expense_name: string;
  color: string | undefined;
  expense_subtype: number; // 1=general, 2=kilometer
  compulsory_image: number;
  min_time?: string;
  max_time?: string;
  min_amount?: number;
  max_amount?: number;
  fix_amount?: number;
  amount_per_km?: number;
  created_date_time?: string;
}

export interface IExpenseTypeCreate {
  expense_name: string;
  color: string | undefined | null;
  expense_subtype: number;
  compulsory_image: number;
  min_time?: string;
  max_time?: string;
  min_amount?: number;
  max_amount?: number;
  fix_amount?: number;
  amount_per_km?: number;
  created_date_time?: string;
}


export const handleDeleteExpenseType = async (
  expenseTypeIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setExpenseTypeList: TReactSetState<IExpenseTypeView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "expense_type_masters",
    where: `{"id":"${expenseTypeIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
    a_application_login_id: getUUID,
  };
  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchExpenseTypeApi(setExpenseTypeList, setLoading);
      toast.success(
        expenseTypeIds.length > 1
          ? "Expense Types Deleted Successfully"
          : "Expense Type Deleted Successfully"
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

export const createExpenseType = async (
  expenseTypeInput: IExpenseTypeCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      expenseTypeInput.expense_name,
      "expense_type_masters",
      "expense_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      expense_name: expenseTypeInput.expense_name,
      color: expenseTypeInput.color,
      expense_subtype: expenseTypeInput.expense_subtype,
      min_time: expenseTypeInput.min_time,
      max_time: expenseTypeInput.max_time,
      min_amount: expenseTypeInput.min_amount,
      max_amount: expenseTypeInput.max_amount,
      fix_amount: expenseTypeInput.fix_amount,
      amount_per_km: expenseTypeInput.amount_per_km,
      compulsory_image: expenseTypeInput.compulsory_image,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("create-expense-type", requestData);
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
    toast.error("Expense Type already available");
  }
};

export const updateExpenseType = async (
  expenseTypeInput: IExpenseTypeCreate,
  editExpenseTypeId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      expenseTypeInput.expense_name,
      "expense_type_masters",
      "expense_name",
      editExpenseTypeId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
      id: editExpenseTypeId,
      expense_name: expenseTypeInput.expense_name,
      color: expenseTypeInput.color,
      expense_subtype: expenseTypeInput.expense_subtype,
      min_time: expenseTypeInput.min_time,
      max_time: expenseTypeInput.max_time,
      min_amount: expenseTypeInput.min_amount,
      max_amount: expenseTypeInput.max_amount,
      fix_amount: expenseTypeInput.fix_amount,
      amount_per_km: expenseTypeInput.amount_per_km,
      compulsory_image: expenseTypeInput.compulsory_image,
    };
    try {
      const { data } = await axiosInstance.post("update-expense-type", requestData);
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
    toast.error("Expense Type already available");
  }
};

export const fetchExpenseTypeApi = async (
  setExpenseTypeList: TReactSetState<IExpenseTypeView[]>,
  setLoading: TReactSetState<boolean>,
  request_flag: number = 0
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    request_flag: request_flag,
  };
  try {
    const data = await axiosInstance.post("get-expense-type", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false)
        setExpenseTypeList([]);

      }
      setLoading(true)
      setExpenseTypeList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};