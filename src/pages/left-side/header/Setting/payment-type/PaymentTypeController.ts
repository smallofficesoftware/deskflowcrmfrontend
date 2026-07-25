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
}

export interface IPaymentTypeCreate {
  payment_type_name: string;
  payment_color: string | undefined | null;
  transaction_type: number;
  created_date_time?: string;
}

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
        }","transaction_type":${typeInput.transaction_type},"a_application_login_id":${Number(getUUID)}}`,
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
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
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
        }","transaction_type":${typeInput.transaction_type},"a_application_login_id":${Number(getUUID)}}`,
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
    columns: "id,payment_type_name,payment_color,transaction_type",
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