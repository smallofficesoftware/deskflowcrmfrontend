import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IAllDeletedcontact {
  id: number;
  person_name: string;
  mobile_number: string;
  company_name: string;
  source_name: string;
  source_colour: string;
  country_name: string;
  state_name: string;
  city_name: string;
  area_name: string;
  lable_name: string;
  lable_colour: string;
  status_name: string;
  status_colour: string;
  cart_number: string;
  address: string;
  longitude: string;
  latitude: string;
  grand_total: number | string;
  created_date_time: string;
  cntc_column_number_1: number | string;
  cntc_column_number_2: number | string;
  cntc_column_number_3: number | string;
  cntc_column_number_4: number | string;
  cntc_column_number_5: number | string;
  cntc_column_text_1: string;
  cntc_column_text_2: string;
  cntc_column_text_3: string;
  cntc_column_text_4: string;
  cntc_column_text_5: string;
  cntc_column_text_area_1: string;
  cntc_column_text_area_2: string;
  cntc_column_text_area_3: string;
  cntc_column_text_area_4: string;
  cntc_column_text_area_5: string;
  cntc_column_date_1: string;
  cntc_column_date_2: string;
  cntc_column_date_3: string;
  cntc_column_date_4: string;
  cntc_column_date_5: string;
  cntc_column_date_and_time_1: string;
  cntc_column_date_and_time_2: string;
  cntc_column_date_and_time_3: string;
  cntc_column_date_and_time_4: string;
  cntc_column_date_and_time_5: string;
  cntc_column_time_1: string;
  cntc_column_time_2: string;
  cntc_column_time_3: string;
  cntc_column_time_4: string;
  cntc_column_time_5: string;
  cntc_column_switch_1: number | boolean;
  cntc_column_switch_2: number | boolean;
  cntc_column_switch_3: number | boolean;
  cntc_column_switch_4: number | boolean;
  cntc_column_switch_5: number | boolean;
  cntc_column_decimal_1: number | string;
  cntc_column_decimal_2: number | string;
  cntc_column_decimal_3: number | string;
  cntc_column_decimal_4: number | string;
  cntc_column_decimal_5: number | string;
  cntc_column_dropdown_1: string;
  cntc_column_dropdown_2: string;
  cntc_column_dropdown_3: string;
  cntc_column_dropdown_4: string;
  cntc_column_dropdown_5: string;
  cntc_column_radio_1: string;
  cntc_column_radio_2: string;
  cntc_column_radio_3: string;
  cntc_column_radio_4: string;
  cntc_column_radio_5: string;
  customForm?: any[];
  [key: string]: any;
}
export const fetchAllDeletedcontact = async (
  // setAllcontact: TReactSetState<IAllDeletedcontact[]>,
  selectedDates: Date[] | undefined,
  setActive: string | undefined,
  setActiveDay: number | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedLabels?: string[] | null,
  selectedSourceTypes?: string[] | null,
  selectedStageStatus?: string[] | null,
  selectedTeamMembers?: string[] | null,
  selectedDemography?: string[] | null,
  ul?: number,
  li?: number,
  globalSearch?: string,


) => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    deleted_flag: 1,
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    setActive,
    setActiveDay,
    selectedLabels: selectedLabels,
    selectedSourceTypes: selectedSourceTypes,
    selectedStageStatus: selectedStageStatus,
    selectedTeamMembers: selectedTeamMembers,
    selectedDemography: selectedDemography,
    ul: ul || 0,
    ll: li || 50,
    globalSearch
  };
  try {
    const response = await axiosInstance.post("/getAllcontactReport", requestedData);

    if (response.data.ack === 3) {
      toast.error(response.data.ack_msg || "Permission denied");
      return []; // Important: return empty array
    }

    // Make sure this path is correct based on your API response
    const items = response.data.data?.item || [];

    if (!Array.isArray(items)) {
      console.error("Expected array but got:", items);
      return [];
    }

    return items; // This is the key — return the data!
  } catch (error: any) {
    toast.error(error.message || "Failed to fetch contacts");
    return []; // Always return array even on error
  }
};

export const recoverContactApi = async (
  contactIds: number | number[] | undefined,
) => {
  const requestData = {
    contactIds,
  };
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  try {
    const data = await axiosInstance.post("recoverContact", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.data.ack_msg);
      return true;
    } else {
      toast.error(data.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchAllContactsForExport = async (
  params: {
    selectedDates?: Date[];
    setActive?: string;
    setActiveDay?: number;
    MobileToken?: string;
    getID?: string;
    MobileFlag?: string;
    selectedLabels?: string[] | null;
    selectedSourceTypes?: string[] | null;
    selectedStageStatus?: string[] | null;
    selectedTeamMembers?: string[] | null;
    selectedDemography?: string[] | null;
    globalSearch?: string;
  }
): Promise<IAllDeletedcontact[]> => {
  const LIMIT = 500;
  let offset = 0;
  let allData: IAllDeletedcontact[] = [];

  while (true) {
    const chunk = await fetchAllDeletedcontact(
      params.selectedDates,
      params.setActive,
      params.setActiveDay,
      params.MobileToken,
      params.getID,
      params.MobileFlag,
      params.selectedLabels,
      params.selectedSourceTypes,
      params.selectedStageStatus,
      params.selectedTeamMembers,
      params.selectedDemography,
      offset,
      LIMIT,
      params.globalSearch
    );

    if (!chunk.length) break;

    allData = [...allData, ...chunk];
    offset += chunk.length;

    if (chunk.length < LIMIT) break;
  }

  return allData;
};