import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IBillOfMaterialsReport {
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