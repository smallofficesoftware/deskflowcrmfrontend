import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IAllcontact {
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
  created_by: string;
  assigned_to: string;
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

export const fetchAllcontact = async (
  selectedDates: Date[] | undefined,
  setActive?: string,
  setActiveDay?: number,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedLabels?: string[] | null,
  selectedSourceTypes?: string[] | null,
  selectedStageStatus?: string[] | null,
  selectedTeamMembers?: string[] | null,
  selectedDemography?: string[] | null,
  selectedProductSearchId?: string,
  setSelectOrderType?: string,
  offset: number = 0,
  limit: number = 50,
  globalSearch?: string,
  assignedByMultiTeamMember?: any,
  createdByMultiTeamMember?: any,
  isArchivState: boolean = false
): Promise<IAllcontact[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    setActive,
    setActiveDay,
    selectedLabels,
    selectedSourceTypes,
    selectedProductSearchId,
    setSelectOrderType,
    selectedStageStatus,
    selectedTeamMembers,
    selectedDemography,
    ul: offset,
    ll: limit,
    globalSearch: globalSearch?.trim() || "",
    assignedByMultiTeamMember,
    createdByMultiTeamMember,
    is_archive: isArchivState
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
    selectedProductSearchId?: string;
    setSelectOrderType?: string;
    globalSearch?: string;
    assignedByMultiTeamMember?: any,
    createdByMultiTeamMember?: any,
  }
): Promise<IAllcontact[]> => {
  const LIMIT = 500;
  let offset = 0;
  let allData: IAllcontact[] = [];

  while (true) {
    const chunk = await fetchAllcontact(
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
      params.selectedProductSearchId,
      params.setSelectOrderType,
      offset,
      LIMIT,
      params.globalSearch,
      params.assignedByMultiTeamMember,
      params.createdByMultiTeamMember,
    );

    if (!chunk.length) break;

    allData = [...allData, ...chunk];
    offset += chunk.length;

    if (chunk.length < LIMIT) break;
  }

  return allData;
};