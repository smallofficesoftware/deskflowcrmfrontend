import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IChainContact {
  id: number;
  person_name: string;
  mobile_number: string;
  company_name?: string;
  reference_contact?: number | null;
  status_name?: string;
  status_colour?: string;
  referral_count?: number;
  chainContact?: IChainContact[];
  [key: string]: any;
}

export const fetchAllcontact = async (
  selectedDates?: Date[],
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
  offset: number = 0,
  limit: number = 50,
  globalSearch?: string,
  selectedContactId?: string | null,
  referenceWiseContact?: number
): Promise<IChainContact[]> => {
  try {
    const response = await axiosInstance.post("/getChainContact", {
      selected_dates: selectedDates,
      a_application_login_id: getID || localStorage.getItem("UUID"),
      setActive,
      setActiveDay,
      selectedLabels,
      selectedSourceTypes,
      selectedStageStatus,
      selectedTeamMembers,
      selectedDemography,
      ul: offset,
      ll: limit,
      globalSearch: globalSearch || "",
      selectedContactId,
      referenceWiseContact: referenceWiseContact
    });

    if (response.data?.ack !== 1) {
      toast.error(response.data?.ack_msg || "Failed");
      return [];
    }

    return response.data.data?.item || [];
  } catch (error: any) {
    toast.error(error.message || "API Error");
    return [];
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
    selectedContactId?: string | null,
  }
): Promise<IChainContact[]> => {
  const LIMIT = 500;
  let offset = 0;
  let allData: IChainContact[] = [];

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
      offset,
      LIMIT,
      params.globalSearch,
      params.selectedContactId
    );

    if (!chunk.length) break;

    allData = [...allData, ...chunk];
    offset += chunk.length;

    if (chunk.length < LIMIT) break;
  }

  return allData;
};