import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IPaymentTypeView {
  payment_type_name: string;
  id: number;
  payment_color: string | undefined;
  transaction_type: number;
  created_date_time?: string;
  credit_series_prefix?: string | null;
  credit_series_pattern?: string | null;
  credit_sr_manual?: number;
  debit_series_prefix?: string | null;
  debit_series_pattern?: string | null;
  debit_sr_manual?: number;
}

export interface IPaymentTypeCreate {
  payment_type_name: string;
  payment_color: string | undefined | null;
  transaction_type: number;
  created_date_time?: string;
  credit_series_prefix?: string;
  credit_series_pattern?: string;
  credit_sr_manual?: number;
  debit_series_prefix?: string;
  debit_series_pattern?: string;
  debit_sr_manual?: number;
}

// Voucher series of the credit and debit side, as the tail of the JSON `data` string
const seriesDataTail = (typeInput: IPaymentTypeCreate) =>
  `,"credit_series_prefix":${JSON.stringify(typeInput.credit_series_prefix ?? "")}` +
  `,"credit_series_pattern":${JSON.stringify(typeInput.credit_series_pattern ?? "")}` +
  `,"credit_sr_manual":${typeInput.credit_sr_manual ? 1 : 0}` +
  `,"debit_series_prefix":${JSON.stringify(typeInput.debit_series_prefix ?? "")}` +
  `,"debit_series_pattern":${JSON.stringify(typeInput.debit_series_pattern ?? "")}` +
  `,"debit_sr_manual":${typeInput.debit_sr_manual ? 1 : 0}`;

export const TRANSACTION_MODES = [
  { id: 0, name: "Bank" },
  { id: 1, name: "Cash" },
];

export const handleDeletePaymentType = async (
  deleteCategoryIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setPaymentTypeList: TReactSetState<IPaymentTypeView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    type_id: deleteCategoryIds
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("paymentTypeDelete", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchPaymentTypeApi(setPaymentTypeList, setLoading);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createPaymentType = async (
  typeInput: IPaymentTypeCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      typeInput.payment_type_name,
      "payment_types",
      "payment_type_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "payment_types",
      data: `{"payment_type_name":"${typeInput.payment_type_name}","payment_color":"${typeInput.payment_color
        }","transaction_type":${typeInput.transaction_type},"a_application_login_id":${Number(getUUID)}${seriesDataTail(typeInput)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData
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
  } else {
    toast.error("Type already available");
  }
};

export const updatePaymentType = async (
  typeInput: IPaymentTypeCreate,
  editTypeId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void, //
  originalName?: string
) => {
  // The check below finds this row itself when its name is unchanged, so it only
  // runs for a renamed type (a series / colour change alone must be allowed).
  const isRenamed = typeInput.payment_type_name !== originalName;
  if (
    !(isRenamed && await checkDuplicationUpdate(
      typeInput.payment_type_name,
      "payment_types",
      "payment_type_name",
      editTypeId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "payment_types",
      where: `{"id":"${editTypeId}"}`,
      data: `{"payment_type_name":"${typeInput.payment_type_name}","payment_color":"${typeInput.payment_color
        }","transaction_type":${typeInput.transaction_type},"a_application_login_id":${Number(getUUID)}${seriesDataTail(typeInput)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData
      );
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
    toast.error("Payment Type already available");
  }
};

export const fetchPaymentTypeApi = async (
  setPaymentTypeList: TReactSetState<IPaymentTypeView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "payment_types",
    columns:
      "id,payment_type_name,payment_color,transaction_type,credit_series_prefix,credit_series_pattern,credit_sr_manual,debit_series_prefix,debit_series_pattern,debit_sr_manual",
    // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false)
        setPaymentTypeList([]);
      }
      setLoading(true)
      setPaymentTypeList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};