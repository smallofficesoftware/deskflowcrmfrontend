import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IInquiryReport {
  inquiry_id: string,
  category_name: string,
  product_id: string,
  source_type_id: string,
  source_colour: string,
  status_name: string,
  status_colour: string,
  label_name: Array<{
    name: string;
    color: string;
  }>;
  qty: string,
  description: string,
  created_by_name: string,
  person_name: string,
  mobile_number: string,
  column_number_1: number | string;
  column_number_2: number | string;
  column_number_3: number | string;
  column_number_4: number | string;
  column_number_5: number | string;
  column_text_1: string;
  column_text_2: string;
  column_text_3: string;
  column_text_4: string;
  column_text_5: string;
  column_text_area_1: string;
  column_text_area_2: string;
  column_text_area_3: string;
  column_text_area_4: string;
  column_text_area_5: string;
  column_date_1: string;
  column_date_2: string;
  column_date_3: string;
  column_date_4: string;
  column_date_5: string;
  column_date_and_time_1: string;
  column_date_and_time_2: string;
  column_date_and_time_3: string;
  column_date_and_time_4: string;
  column_date_and_time_5: string;
  column_time_1: string;
  column_time_2: string;
  column_time_3: string;
  column_time_4: string;
  column_time_5: string;
  column_switch_1: number | boolean;
  column_switch_2: number | boolean;
  column_switch_3: number | boolean;
  column_switch_4: number | boolean;
  column_switch_5: number | boolean;
  column_decimal_1: number | string;
  column_decimal_2: number | string;
  column_decimal_3: number | string;
  column_decimal_4: number | string;
  column_decimal_5: number | string;
  column_dropdown_1: string;
  column_dropdown_2: string;
  column_dropdown_3: string;
  column_dropdown_4: string;
  column_dropdown_5: string;
  column_radio_1: string;
  column_radio_2: string;
  column_radio_3: string;
  column_radio_4: string;
  column_radio_5: string;
  customForm?: any[];
  [key: string]: any;

}
export const fetchInquiry = async (
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedLabels?: string[] | null,
  selectedSourceTypes?: string[] | null,
  selectedStageStatus?: string[] | null,
  selectedTeamMembers?: string[] | null,
  selectedDemography?: string[] | null,
  selectedProduct?: string | null,
  selectedCategory?: string | null,
  selectedContactId?: string | null,
  ul?: number,
  ll?: number,
  globalSearch?: string,
  referenceWiseContact?: number
): Promise<IInquiryReport[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedLabels: selectedLabels,
    selectedSourceTypes: selectedSourceTypes,
    selectedStageStatus: selectedStageStatus,
    selectedTeamMembers: selectedTeamMembers,
    selectedDemography: selectedDemography,
    selectedProduct: selectedProduct,
    selectedCategory: selectedCategory,
    selectedContactId: selectedContactId,
    ul: ul ?? 0,
    ll: ll ?? 50,
    globalSearch,
    referenceWiseContact: referenceWiseContact
  };

  try {
    const response = await axiosInstance.post(
      "/getInquiryReport",
      requestedData
    );

    if (response.data.ack === 3) {
      toast.error(response.data.ack_msg || "Permission denied");
      return [];
    }

    const items = response.data.data?.items || [];

    if (!Array.isArray(items)) {
      console.error("Expected array but got:", items);
      return [];
    }

    return items;
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return [];   // ✅ IMPORTANT
  }
};


export const exportInquiryAllData = async <T>(
  paramiters: (offset: number, limit: number) => Promise<T[]>,
  limit = 500
): Promise<T[]> => {
  let offset = 0;
  let allData: T[] = [];

  while (true) {
    const FatchAllData = await paramiters(offset, limit);

    if (!FatchAllData || FatchAllData.length === 0) break;

    allData = allData.concat(FatchAllData);
    offset += FatchAllData.length;

    if (FatchAllData.length < limit) break;
  }

  return allData;
};
