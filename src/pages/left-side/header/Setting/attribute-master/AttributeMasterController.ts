import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

// Reusable attribute/value catalog (Settings > Attribute Master) -
// plans/2026-10-18-product-variants-and-qty-pricing-plan.txt. Defined once per company;
// picked from on any product's Variant Attributes section instead of being typed fresh
// per product (see ProductVariantSection.tsx).

export interface IAttributeValueMasterView {
  id: number;
  value: string;
}
export interface IAttributeMasterView {
  id: number;
  attribute_name: string;
  values: IAttributeValueMasterView[];
  created_date_time?: string;
}

const getUUID = () => localStorage.getItem("UUID");

export const fetchAttributeMastersApi = async (
  setList: TReactSetState<IAttributeMasterView[]>,
  setLoading: TReactSetState<boolean>
) => {
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("get-attribute-masters", {
      a_application_login_id: getUUID(),
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setList(data.data?.item || []);
    } else {
      setList([]);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setList([]);
  } finally {
    setLoading(false);
  }
};

export const createAttributeMasterApi = async (
  attribute_name: string,
  setLoading: TReactSetState<boolean>,
  onDone: (newId: number) => void
) => {
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("create-attribute-master", {
      a_application_login_id: getUUID(),
      attribute_name,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Attribute created");
      onDone(data.data?.item?.id);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const updateAttributeMasterApi = async (
  id: number,
  attribute_name: string,
  setLoading: TReactSetState<boolean>,
  onDone: () => void
) => {
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("update-attribute-master", {
      id,
      attribute_name,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Attribute updated");
      onDone();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const handleDeleteAttributeMasterApi = async (
  deleteIds: number[],
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setList: TReactSetState<IAttributeMasterView[]>,
  setLoading: TReactSetState<boolean>
) => {
  try {
    setLoading(true);
    for (const id of deleteIds) {
      const { data } = await axiosInstance.post("delete-attribute-master", { id });
      if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
    setIsDeleteConfirmation(false);
    await fetchAttributeMastersApi(setList, setLoading);
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createAttributeValueMasterApi = async (
  product_attribute_master_id: number,
  value: string,
  onDone: () => void
) => {
  try {
    const { data } = await axiosInstance.post("create-attribute-value-master", {
      a_application_login_id: getUUID(),
      product_attribute_master_id,
      value,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      onDone();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deleteAttributeValueMasterApi = async (id: number, onDone: () => void) => {
  try {
    const { data } = await axiosInstance.post("delete-attribute-value-master", { id });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      onDone();
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
