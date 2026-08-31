import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ILableReport {
  lable_name: string;
  contactCount: number | string;
  inquiryCount: number | string;
}
export const fetchLable = async (
  setLableReport: TReactSetState<ILableReport[]>,
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedLabels?: string[] | null,
  selectedTeamMembers?: string[] | null,
  ul?: number,  // Add this
  ll?: number,
  globalSearch?: string


) => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedLabels: selectedLabels,
    selectedTeamMembers: selectedTeamMembers,
    ul: ul || 0,
    ll: ll || 50,
    globalSearch
  };

  try {
    const response = await axiosInstance.post(
      "/getLableReport",
      requestedData
    );


    if (response.data.ack == 3) {
      toast.error(response.data.ack_msg);
      setLableReport([]);
      return;
    }
    setLableReport(response.data?.data?.item ?? []);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};



export const fetchLabelWiseForExport = async (
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedLabels?: string[] | null,
  selectedTeamMembers?: string[] | null,
  globalSearch?: string,
  offset = 0,
  limit = 50
): Promise<ILableReport[]> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const payload = {
     selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedLabels: selectedLabels,
    selectedTeamMembers: selectedTeamMembers,
    globalSearch,
    ul: offset,
    ll: limit,
  };

  const response = await axiosInstance.post(
    "/getLableReport",
    payload
  );

  if (response?.data?.ack === 3) {
    toast.error(response.data.ack_msg);
    return [];
  }

  return Array.isArray(response?.data?.data?.item)
    ? response.data.data.item
    : [];
};


export const exportAllLabelWiseData = async (
  fetchFn: (offset: number, limit: number) => Promise<ILableReport[]>,
  limit = 50
): Promise<ILableReport[]> => {
  let offset = 0;
  let allData: ILableReport[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};