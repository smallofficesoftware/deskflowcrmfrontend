import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { IProductView } from "../product/ProductController";

export interface IBillOfMaterialsView {
  id: number;
  product_id: number;
  bom_number?: string;
  bom_name?: string;
  createdByName?: string;
  product_name?: string;
  product_code?: string;
  created_date_time?: string;
  modified_date?: string;
}

export interface IBillOfMaterialsCreate {
  bill_of_materials_name: string;
  bill_of_materials_color: string | undefined | null;
  created_date_time?: string;
}


export const handleDeleteBillOfMaterials = async (
  productIdForDelete: number,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setBillOfMaterialsLists: TReactSetState<IBillOfMaterialsView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    id: productIdForDelete
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("delete-bom-details", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading);
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

export const createBillOfMaterials = async (
  materialsInput: IBillOfMaterialsCreate,
  setBillOfMaterialsLists: TReactSetState<IBillOfMaterialsView[]>,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {

  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    bill_of_materials_name: materialsInput.bill_of_materials_name,
    bill_of_materials_color: materialsInput.bill_of_materials_color,
    a_application_login_id: getUUID
  };
  try {
    const token = localStorage.getItem("token");

    const data = await axiosInstance.post(
      "bill_of_materials_create",
      requestData,
      {
        headers: {
          Authorization: token,
        },
      },
    );

    if (data.data.ack === 1) {
      toast.success(data.data.ack_msg);
      fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading);
      clearFormCallback();
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateBillOfMaterials = async (
  materialsInput: IBillOfMaterialsCreate,
  setBillOfMaterialsLists: TReactSetState<IBillOfMaterialsView[]>,
  editMaterialsId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //

) => {
  const token = localStorage.getItem("token");

  const getUUID = await localStorage.getItem("UUID");

  const requestData = {

    editMaterialsId: editMaterialsId,
    bill_of_materials_name: materialsInput.bill_of_materials_name,
    bill_of_materials_color: materialsInput.bill_of_materials_color,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post(
      "bill_of_materials_update",
      requestData,
      {
        headers: {
          Authorization: token,
        },
      },
    );

    if (data.data.ack === 1) {
      clearFormCallback()
      setBillOfMaterialsLists((prevList) =>
        prevList.map((materials) =>
          materials.id === editMaterialsId ? data.data : materials
        )
      );
      toast.success(data.data.ack_msg);
      fetchBillOfMaterialsApi(setBillOfMaterialsLists, setLoading);

    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }

  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }

};



export const fetchBillOfMaterialsApi = async (
  setBillOfMaterialsLists: TReactSetState<any>,
  setLoading?: TReactSetState<boolean>,
  searchTerm: string = ""
) => {
  try {
    setLoading?.(true);

    const token = localStorage.getItem("token");
    const uuid = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: uuid,
      searchTerm: searchTerm.trim(),
    };

    const response = await axiosInstance.post(
      "get_bill_of_materials",
      requestData,
      {
        headers: { Authorization: token },
      }
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setBillOfMaterialsLists(response.data.data.item);
    } else {
      setBillOfMaterialsLists([]);
      // toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching warehouse:", error);
    setBillOfMaterialsLists([]);
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading?.(false);
  }
};

export const fetchProductApi = async (
  setSelectedProduct: (item: IProductView) => void,
  setLoading: TReactSetState<boolean>,
  productId: string,
  term: string,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
    searchTerm: term,
    productId
  };
  try {
    const data = await axiosInstance.post("product", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
      }
      setLoading(true);
      setSelectedProduct(data.data.data.item[0]);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};