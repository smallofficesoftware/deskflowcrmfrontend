import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import {
  axiosInstance
} from "../../../../../services/axiosInstance";

export interface IVisitView {
  // [x: string]: ReactNode;
  visit_image: string;
  end_date: string;
  id: number;
  created_date_time?: string;
  visit_type_id: string;
  amount: string;
  visit_type: string;
  remark: string;
  applicationLoginName: string;
  visitId: number;
  visit_status: number;
  status_remark: string;
  pass_amount: number;
  a_application_login_id: string | number;
  companyFlag: number;
  contact_id?: number | string;
  person_name?: string;
  contact_mobile?: string;
  company_name?: string;
  visit_column_number_1: number | string;
  visit_column_number_2: number | string;
  visit_column_number_3: number | string;
  visit_column_number_4: number | string;
  visit_column_number_5: number | string;
  visit_column_text_1: string;
  visit_column_text_2: string;
  visit_column_text_3: string;
  visit_column_text_4: string;
  visit_column_text_5: string;
  visit_column_text_area_1: string;
  visit_column_text_area_2: string;
  visit_column_text_area_3: string;
  visit_column_text_area_4: string;
  visit_column_text_area_5: string;
  visit_column_date_1: string;
  visit_column_date_2: string;
  visit_column_date_3: string;
  visit_column_date_4: string;
  visit_column_date_5: string;
  visit_column_date_and_time_1: string;
  visit_column_date_and_time_2: string;
  visit_column_date_and_time_3: string;
  visit_column_date_and_time_4: string;
  visit_column_date_and_time_5: string;
  visit_column_time_1: string;
  visit_column_time_2: string;
  visit_column_time_3: string;
  visit_column_time_4: string;
  visit_column_time_5: string;
  visit_column_switch_1: number | boolean;
  visit_column_switch_2: number | boolean;
  visit_column_switch_3: number | boolean;
  visit_column_switch_4: number | boolean;
  visit_column_switch_5: number | boolean;
  visit_column_decimal_1: number | string;
  visit_column_decimal_2: number | string;
  visit_column_decimal_3: number | string;
  visit_column_decimal_4: number | string;
  visit_column_decimal_5: number | string;
  visit_column_dropdown_1: string;
  visit_column_dropdown_2: string;
  visit_column_dropdown_3: string;
  visit_column_dropdown_4: string;
  visit_column_dropdown_5: string;
  visit_column_radio_1: string;
  visit_column_radio_2: string;
  visit_column_radio_3: string;
  visit_column_radio_4: string;
  visit_column_radio_5: string;
  visit_column_attechments_1: string;
  visit_column_attechments_2: string;
  visit_column_attechments_3: string;
  visit_column_attechments_4: string;
  visit_column_attechments_5: string;
}

export interface ICustomFromList {
  id: number;
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  reference_column_name: string;
  data_sorce: string;
  form_type: number;
  required_for: number;
  min_limit: number;
  max_limit: number;
  validation_type: number;
}

export const handleDeleteVisit = async (
  visitId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setVisitList: TReactSetState<IVisitView[]>,
  contactId?: any // Add contactId as an optional parameter
) => {
  const requestData = {
    table: "visits",
    where: `{"id":${visitId}}`,
    data: `{"isDelete":"1"}`,
  };
  const getUUID = localStorage.getItem("UUID");
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        fetchVisitApi(0, ITEMS_PER_PAGE, setVisitList, setLoading, "", contactId);
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchVisitApi = async (
  page: number,
  itemsPerPage: number,
  setVisitList: TReactSetState<IVisitView[]>,
  setLoading: TReactSetState<boolean>,
  term: string,
  contactId?: any, // Add contactId as an optional parameter
  team_id?: number,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const start: number = page * itemsPerPage;

  // Build request data
  const requestData = {
    ul: start, // Upper limit based on page number
    ll: itemsPerPage, // Lower limit (items per page)
    a_application_login_id: getUUID,
    searchTerm: term,
    ...(contactId && { contactId }), // Include contactId only if provided
    ...(team_id && { team_id }), // Include contactId only if provided
  };

  try {
    setLoading(true); // Set loading to true at the start
    const data = await axiosInstance.post("get-visit", requestData);

    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setVisitList([]);
        return; // Exit early if the response is not successful
      }
      // Replace list for page 0, append for subsequent pages
      setVisitList((prev) =>
        page === 0 ? data.data.data.item || [] : [...prev, ...(data.data.data.item || [])]
      );
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setVisitList([]); // Clear list on error
  } finally {
    setTimeout(() => {
      setLoading(false); // Ensure loading is set to false after 1 second
    }, 1000);
  }
};

export const fetchVisitTypeApiForVisits = async (
  setCategoryList: TReactSetState<[]>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "visit_type_masters",
    columns: "id,visit_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID,
  };
  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCategoryList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setCategoryList([]);
  }
};

export const fetchCustomInqFromApiForVisit = async (
  setCustomFromList: TReactSetState<ICustomFromList[]>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post(
      "getCustomFieldFrom",
      {
        a_application_login_id: Number(getUUID),
        form_type: 3,
      }
    );
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCustomFromList([]);

      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setCustomFromList(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
