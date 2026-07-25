import * as Yup from "yup";

import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import {
  axiosInstance
} from "../../../../../../services/axiosInstance";

export interface IExpenseCreate {
  created_date_time?: string;
  amount: string;
  expense_type_id: string;
  remark: string;
  expenseId: number | string;
  expense_status: number;
  image?: File | string | null;
  status_remark: string;
  pass_amount: string;
  kilometers: string;
  expense_date: string;
}

export interface IExpenseCreateStatus {
  amount: string;
  expenseId: number | string;
  expense_status: number;
  status_remark: string;
  pass_amount?: string;
  kilometers: string;
}
export interface IExpenseType {
  id: string;
  expense_name: string;

}
export const createProductInitialValues = (
  ExpenseToEdit: IExpenseCreate | undefined, pass_amount: string | undefined): IExpenseCreate => ({
    amount: ExpenseToEdit?.amount || "",
    expense_type_id: ExpenseToEdit?.expense_type_id || "",
    remark: ExpenseToEdit?.remark || "",
    expenseId: ExpenseToEdit?.expenseId || "",
    expense_status: ExpenseToEdit?.expense_status || 1,
    image: ExpenseToEdit?.image || "",
    status_remark: ExpenseToEdit?.status_remark || "",
    expense_date: ExpenseToEdit?.expense_date || "",
    kilometers: ExpenseToEdit?.kilometers || "",
    pass_amount: pass_amount && pass_amount !== "0" ? pass_amount : ExpenseToEdit?.pass_amount && ExpenseToEdit.pass_amount !== "0" ? ExpenseToEdit.pass_amount : "",
  });

export const createProductValidationSchema = (
  expenseTypesList: any[],
  status?: string) =>
  Yup.object().shape({
    amount: Yup.number()
      .when("expense_type_id", (expenseTypeId, schema) => {
        const expenseType = expenseTypesList.find(
          (e) => e.id === Number(expenseTypeId)
        );

        if (!expenseType) return schema;

        const minAmount = Number(expenseType.min_amount ?? 0);
        const maxAmount = Number(expenseType.max_amount ?? 0);

        if (
          expenseType.expense_subtype === 1 &&
          expenseType.fix_amount === 0 &&
          minAmount > 0 && maxAmount > 0
        ) {
          return schema
            .min(
              expenseType.min_amount,
              `Amount should be more than ${expenseType.min_amount}`
            )
            .max(
              expenseType.max_amount,
              `Amount should be less than ${expenseType.max_amount}`
            );
        }

        return schema;
      })
      .required("Amount is required"),

    kilometers: Yup.number()
      .when(["expense_type_id"], ([expenseTypeId], schema) => {
        const expenseType = expenseTypesList.find(
          (e) => e.id === Number(expenseTypeId)
        );

        if (expenseType?.expense_subtype === 2) {
          return schema
            .typeError("Kilometers must be a number")
            .positive("Kilometers must be greater than 0")
            .required("Kilometers is required");
        }

        return schema.notRequired();
      }),
    image: Yup.mixed().when("expense_type_id", (expenseTypeId, schema) => {
      const expenseType = expenseTypesList.find(
        (e) => e.id === Number(expenseTypeId)
      );

      if (expenseType?.compulsory_image === 1) {
        return schema.required("Expense image is required");
      }

      return schema.notRequired();
    }),


    status_remark: Yup.string().when([], {
      is: () => status === "reject",
      then: (schema) => schema.required("Status Remark is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    expense_type_id: Yup.string().required("Expense Type is Required"),
  });

export const createExpense = async (
  values: IExpenseCreate,
  handelRefreshExpense: () => void,
  onHide: () => void,
  team_id?: number
) => {
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) return;

  try {
    const requestFormData = new FormData();

    requestFormData.append("expense_type_id", values.expense_type_id);
    requestFormData.append("amount", values.amount);
    requestFormData.append("remark", values.remark);
    requestFormData.append("kilometers", values.kilometers);
    requestFormData.append("expense_date", values.expense_date);
    requestFormData.append("expense_status", values.expense_status.toString());
    requestFormData.append("a_application_login_id", team_id?.toString() || "");
    requestFormData.append("created_by", getUUID);

    // 🔹 IMAGE IS OPTIONAL
    if (values.image instanceof File) {
      requestFormData.append("image", values.image);
    }

    const { data } = await axiosInstance.post(
      "create-expense",
      requestFormData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
      handelRefreshExpense();
      onHide();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};


export const updateExpense = async (
  formData: FormData,
  values: IExpenseCreate,
  handelRefreshExpense: () => void,
  expenseId: number,
  onHide: () => void,
  team_id?: number
) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  if (!getUUID) return;

  try {
    const requestFormData = new FormData();

    requestFormData.append("expense_id", expenseId.toString());
    requestFormData.append("expense_type_id", values.expense_type_id);
    requestFormData.append("amount", values.amount);
    requestFormData.append("kilometers", values.kilometers);
    requestFormData.append("expense_date", values.expense_date);
    requestFormData.append("remark", values.remark);
    requestFormData.append("a_application_login_id", team_id?.toString() || "");
    requestFormData.append("created_by", getUUID);

    if (values.image instanceof File) {
      requestFormData.append("image", values.image);
    }

    const { data } = await axiosInstance.post(
      "update-expense",
      requestFormData,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
      handelRefreshExpense();
      onHide();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};



export const updateExpenseStatus = async (
  values: IExpenseCreateStatus,
  handelRefreshExpense: () => void,
  expenseId: number | undefined,
  onHide: () => void,
  expenseStatus: number,
  team_id?: number
) => {

  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");


  if (!getUUID) {
    return;
  }
  let passAmount;
  if (expenseStatus != 3) {
    passAmount = values.pass_amount;
  }
  const requestDataUpdateExpense = {
    amount: values.amount,
    expense_id: expenseId,
    kilometers: values.kilometers,
    expense_status: expenseStatus,
    status_remark: values.status_remark,
    pass_amount: passAmount || 0,
    a_application_login_id: getUUID,
    team_id: team_id?.toString()
  };
  try {
    const { data } = await axiosInstance.post(
      "update-expense",
      requestDataUpdateExpense);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        onHide();
        handelRefreshExpense();
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchExpenseTypeApiForExpense = async (
  setExpenseTypeList: TReactSetState<IExpenseType[]>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "expense_type_masters",
    columns: "id,expense_name,color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const response = await axiosInstance.post("commonGet", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setExpenseTypeList(response.data.data); // Assuming API response is an array of countries
    } else {
      setExpenseTypeList([]); // Assuming API response is an array of countries
      toast.error(response.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);

    // Handle error (e.g., show error message, clear filtered list)
    setExpenseTypeList([]);
  }
};
