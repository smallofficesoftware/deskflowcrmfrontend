import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../../../services/axiosInstance";

export interface IBomForm {
  bom_name: string;
  qty: string;
  unit: string;
  bom_review_frequency: string;
  bom_document?: File | null;
  bom_drawing?: File | null;
}

export const fetchProductUnit = async (
  isSetProductUnitList: TReactSetState<
    { id: number; unit: string; is_point_value_allow: number }[]
  >,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const response = await axiosInstance.post("product-unit-get", requestData, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": getUUID,
      },
    });

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      isSetProductUnitList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      isSetProductUnitList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    isSetProductUnitList([]);
  }
};

export const createBom = async (formData: IBomForm, product_id: any) => {
  const a_application_login_id = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const payload = new FormData();
  payload.append("a_application_login_id", a_application_login_id || "");
  payload.append("bom_name", formData.bom_name);
  payload.append("qty", formData.qty);
  payload.append("unit", formData.unit);
  payload.append("bom_review_frequency", formData.bom_review_frequency);
  payload.append("product_id", product_id || "");

  if (formData.bom_document) {
    payload.append("bom_document", formData.bom_document);
  }

  if (formData.bom_drawing) {
    payload.append("bom_drawing", formData.bom_drawing);
  }

  try {
    const response = await axiosInstance.post(
      "bom-details",
      payload,
      {
        headers: {
          Authorization: `${token}`,
          "x-tenant-id": a_application_login_id,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success("BOM Created Successfully");
      return true;
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
    return false;
  }
};


export const getBomDetails = async (
  setProbableBOMData: any,
  product_id: any
) => {

  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const requestData = {
    product_id
  };

  try {
    const response = await axiosInstance.post(
      "get-bom-details",
      requestData,
      {
        headers: {
          Authorization: `${token}`,
          "x-tenant-id": getUUID,
        },
      }
    );

    if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setProbableBOMData(response.data.data?.item || {});
    } else {
      setProbableBOMData({});
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
    setProbableBOMData({});
  }

};