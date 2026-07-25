import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TFilterDate } from "../../../../../helpers/AppInterface";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IExpenseView {
  id: number;
  created_date_time?: string;
  expense_type_id: string;
  amount: string;
  expense_name: string;
  remark: string;
  expenseId: number;
  expense_status: number;
  image: string;
  status_remark: string;
  pass_amount: string;
  a_application_login_id: any;
  companyFlag: number;
  color: string;
  created_by_username: string;
  kilometers: string;
  expense_date: string;
}

export const ExpenseTypesList = [
  { id: "1", status_type: "Pending" },
  { id: "2", status_type: "Approved" },
  { id: "3", status_type: "Reject" },
];
export const handleDeleteExpense = async (
  expenseId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setExpenseList: TReactSetState<IExpenseView[]>,
  team_id?: number,
) => {
  const requestData = {
    table: "expenses",
    where: `{"id":${expenseId}}`,
    data: `{"isDelete":"1"}`,
  };
  const getUUID = localStorage.getItem("UUID")
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        fetchExpenseApi(setExpenseList, setLoading, "", team_id);
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};


export const fetchExpenseApi = async (
  setExpenseList: TReactSetState<IExpenseView[]>,
  setLoading: TReactSetState<boolean>,
  term: string,
  team_id?: number,
  startSearchDate?: TFilterDate,
  endSearchDate?: TFilterDate,
  checkedOptionsExpenseType?: any,
  checkedOptionsExpenseStatus?: any,
) => {
  const token = await localStorage.getItem("token");

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: team_id,
    searchTerm: term,
    checked_id: getUUID,
    startDate: startSearchDate,
    endDate: endSearchDate,
    expense_types: checkedOptionsExpenseType,
    expense_status: checkedOptionsExpenseStatus,
  };
  try {
    const data = await axiosInstance.post("get-expense", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false)
        setExpenseList([]);
      }
      setLoading(true)

      setExpenseList(data.data.data.item);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const fetchExpenseTypeApiForExpenses = async (
  setCategoryList: TReactSetState<[]>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "expense_type_masters",
    columns: "id,expense_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCategoryList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    setCategoryList([]);
  }
};