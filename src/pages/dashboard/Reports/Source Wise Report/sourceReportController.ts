import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ISourceReport {
  source_name: string;
  contactCount: string;
  inquiryCount: string;
}
export const fetchSource = async (
  setSourceReport: TReactSetState<ISourceReport[]>,
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedSourceTypes?: string[] | null,
  selectedTeamMembers?: string[] | null,
  ul?: number,
  ll?: number,
  globalSearch?:string
) => {
  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  const requestedData = {
    selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedSourceTypes: selectedSourceTypes,
    selectedTeamMembers: selectedTeamMembers,
    ul: ul ?? 0,
    ll: ll ?? 50,
    globalSearch
  };


  try {
    const response = await axiosInstance.post(
      "/getSourceReport",
      requestedData
    );


    if (response.data.ack == 3) {
      toast.error(response.data.ack_msg)
    }
    setSourceReport(response.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};



export const fetchSourceWiseForExport = async (
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedSourceTypes?: string[] | null,
  selectedTeamMembers?: string[] | null,
  globalSearch?: string,
  offset = 0,
  limit = 50
): Promise<ISourceReport[]> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const payload = {
  selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedSourceTypes: selectedSourceTypes,
    selectedTeamMembers: selectedTeamMembers,
    globalSearch,
    ul: offset,
    ll: limit,
  };

  const response = await axiosInstance.post(
    "/getSourceReport",
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


export const exportAllSourceWiseData = async (
  fetchFn: (offset: number, limit: number) => Promise<ISourceReport[]>,
  limit = 50
): Promise<ISourceReport[]> => {
  let offset = 0;
  let allData: ISourceReport[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};
