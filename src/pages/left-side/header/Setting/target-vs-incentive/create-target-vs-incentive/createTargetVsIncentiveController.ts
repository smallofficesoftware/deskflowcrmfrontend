import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import {
  fetchApiTargetVsIncentive,
  ITargetVsIncentiveView,
} from "../TargetVsIncentiveController";

export interface ITargetVsIncentiveCreate {
  id: number;
  assigned_team_member: number;
  target_flag: string;
  product_id: number;
  target_todate: string;
  target_fromdate: string;
  target_type: number;
  target_count: number;
  target_value: number;
  incentive_type: number;
  incentive_value: number;
  created_date_time?: string;
}

export const createTargetInitialValues = (
  productToEdit: ITargetVsIncentiveView | undefined,
): ITargetVsIncentiveCreate => {
  if (!productToEdit) {
    return {
      id: 0,
      assigned_team_member: 0,
      target_flag: "2", // Default set to "Particular"
      product_id: 0,
      target_todate: "",
      target_fromdate: "",
      target_type: 1,
      target_count: 0,
      target_value: 0,
      incentive_type: 1,
      incentive_value: 0,
      created_date_time: "",
    };
  }

  return {
    id: parseInt(String(productToEdit.id)) || 0,
    assigned_team_member:
      parseInt(String(productToEdit.assigned_team_member)) || 0,
    target_flag: String(productToEdit.target_flag || "2"),
    product_id: parseInt(String(productToEdit.product_id)) || 0,
    target_todate: productToEdit.target_todate || "",
    target_fromdate: productToEdit.target_fromdate || "",
    target_type: parseInt(String(productToEdit.target_type)) || 1,
    target_count: parseInt(String(productToEdit.target_count)) || 0,
    target_value: parseInt(String(productToEdit.target_value)) || 0,
    incentive_type: parseInt(String(productToEdit.incentive_type)) || 1,
    incentive_value: parseInt(String(productToEdit.incentive_value)) || 0,
    created_date_time: productToEdit.created_date_time || "",
  };
};

export const updateTarget = async (
  expenseTypeInput: ITargetVsIncentiveCreate,
  setExpenseTypeList: TReactSetState<ITargetVsIncentiveCreate[]>,
  targetEditId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "target_vs_incentives",
    where: `{"id":"${targetEditId}"}`,
    data: JSON.stringify({
      id: expenseTypeInput.id || 0,
      target_flag: expenseTypeInput.target_flag || "2",
      assigned_team_member: expenseTypeInput.assigned_team_member,
      target_todate: expenseTypeInput.target_todate,
      target_fromdate: expenseTypeInput.target_fromdate,
      target_type: expenseTypeInput.target_type,
      target_count: expenseTypeInput.target_count || 0,
      target_value: expenseTypeInput.target_value || 0,
      incentive_type: expenseTypeInput.incentive_type || 1,
      incentive_value: expenseTypeInput.incentive_value || 0,
      a_application_login_id: Number(getUUID),
    }),
    a_application_login_id: getUUID,
  };
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        clearFormCallback();
        setExpenseTypeList((prevList) =>
          prevList.map((ExpenseType) =>
            ExpenseType.id === targetEditId ? data.data : ExpenseType,
          ),
        );
        fetchApiTargetVsIncentive(setExpenseTypeList, setLoading, "");
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const reqTypesCustomInquiryList = [
  { id: "1", order_type_display: "All" },
  { id: "2", order_type_display: "Particular" },
];

export const targetTypeList = [
  { label: "Lead", value: 1 },
  { label: "Quotation", value: 2 },
  { label: "Order", value: 3 },
  { label: "Invoice", value: 4 },
];

export const incentiveTypeList = [
  { label: "Percentage", value: 1 },
  { label: "Flat", value: 2 },
  { label: "None", value: 3 },
];

export const createTargetValidationSchema = () =>
  Yup.object().shape({
    assigned_team_member: Yup.number()
      .required("Assign User is Required")
      .test("is-not-zero", "Assign User is Required", (value) => value !== 0),
    target_todate: Yup.string().required("To Date is Required"),
    target_fromdate: Yup.string().required("From Date is Required"),
    target_type: Yup.number()
      .required("Target Type is Required")
      .test("is-not-zero", "Target Type is Required", (value) => value !== 0),
    target_count: Yup.number().nullable().notRequired(),
    target_value: Yup.number().nullable().notRequired(),
    incentive_type: Yup.number().nullable().notRequired(),
    incentive_value: Yup.number().nullable().notRequired(),
  });

export const createTargetVsIncentive = async (
  expenseTypeInput: ITargetVsIncentiveCreate,
  setTargetVsIncentiveList: TReactSetState<ITargetVsIncentiveCreate[]>,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "target_vs_incentives",
    data: JSON.stringify({
      id: expenseTypeInput.id || 0,
      target_flag: expenseTypeInput.target_flag || "2",
      assigned_team_member: expenseTypeInput.assigned_team_member,
      target_todate: expenseTypeInput.target_todate,
      target_fromdate: expenseTypeInput.target_fromdate,
      target_type: expenseTypeInput.target_type,
      target_count: expenseTypeInput.target_count || 0,
      target_value: expenseTypeInput.target_value || 0,
      incentive_type: expenseTypeInput.incentive_type || 1,
      incentive_value: expenseTypeInput.incentive_value || 0,
      a_application_login_id: Number(getUUID),
    }),
    a_application_login_id: getUUID,
  };

  try {
    const endpoint = expenseTypeInput.id > 0 ? "commonUpdate" : "commonCreate";
    const { data } = await axiosInstance.post(endpoint, requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        fetchApiTargetVsIncentive(setTargetVsIncentiveList, setLoading, "");
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
