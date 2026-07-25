import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ICustomInquiryFromList } from "../../../left-side/header/Setting/custom-inquiry-from/CustomInquiryFromController";

export const fetchCustomFromFieldApi = async (
  setCustomInquiryFromList: TReactSetState<ICustomInquiryFromList[]>,
  setLoading: TReactSetState<boolean>,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "custom_field_form_masters",
    columns: "id,title,data_type,display_order,required_or_not,print_or_not,data_sorce,report_print_or_not,reference_column_name,form_type,product_feild_row_column,required_for,min_limit,max_limit,validation_type",
    where: [
      "isDelete=0",
      // `a_application_login_id=${getUUID}||0`,
    ],
    request_flag: 0,
    order: `{"display_order":"ASC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setCustomInquiryFromList([]);
    }
    setLoading(true);
    setCustomInquiryFromList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};