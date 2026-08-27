import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IStatusReport {
  id: number;
  name: string;
  count: number;
}

export interface IStatusWiseReportData {
  internal: {
    support_ticket: IStatusReport[];
    normal_task: IStatusReport[];
  };
  external: {
    support_ticket: IStatusReport[];
    normal_task: IStatusReport[];
  };
}
export const fetchStatus = async (
  setStatusWiseReport: TReactSetState<IStatusWiseReportData | null>,
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedStageStatus?: string[] | null,
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
    selectedStageStatus: selectedStageStatus,
    selectedTeamMembers: selectedTeamMembers,
    ul: ul || 0,
    ll: ll || 50,
    globalSearch
  };

  try {
    const response = await axiosInstance.post(
      "/getStatusReport",
      requestedData
    );


    if (response.data.ack == 3) {
      toast.error(response.data.ack_msg);
      setStatusWiseReport(null);
      return;
    }
    setStatusWiseReport(response.data?.data?.item ?? null);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};



export const fetchStatusWiseForExport = async (
  selectedDates: Date[] | undefined,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedStageStatus?: string[] | null,
  selectedTeamMembers?: string[] | null,
  globalSearch?: string,
  offset = 0,
  limit = 50
): Promise<IStatusReport[]> => {
  const getUUID = getID || localStorage.getItem("UUID");

  const payload = {
     selected_dates: selectedDates,
    a_application_login_id: getUUID,
    selectedStageStatus: selectedStageStatus,
    selectedTeamMembers: selectedTeamMembers,
    globalSearch,
    ul: offset,
    ll: limit,
  };

  const response = await axiosInstance.post(
    "/getStatusReport",
    payload
  );

  if (response?.data?.ack === 3) {
    toast.error(response.data.ack_msg);
    return [];
  }

  const item = response?.data?.data?.item;
  if (!item) return [];

  // Flat array for export — sabko merge karo with type label
  return [
    ...(item.internal?.support_ticket || []),
    ...(item.internal?.normal_task || []),
    ...(item.external?.support_ticket || []),
    ...(item.external?.normal_task || []),
  ];
};


export const exportAllStatusWiseData = async (
  fetchFn: (offset: number, limit: number) => Promise<IStatusReport[]>,
  limit = 50
): Promise<IStatusReport[]> => {
  let offset = 0;
  let allData: IStatusReport[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk.length) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};