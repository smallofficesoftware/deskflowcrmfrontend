import { toast } from 'react-toastify';
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../../../helpers/AppConstants';
import { TReactSetState } from '../../../../helpers/AppType';
import { axiosInstance } from '../../../../services/axiosInstance';

export interface ITaskitem {
  id: number;
  created_date_time: string;
  task_title: string;
  task_selected_date: string;
  task_fromdate: string;
  task_enddate: string;
  task_remark: string;
  reference_table: string;
  a_application_login_id: number;
  completed_date: string;
  created_by_name: string;
  complated_by: number;
  modify_date: string;
  modify_by: number;
  status_name: string;
  status_colour: string;
  category_name: string;
  category_colour: string;
  priority_name: string;
  type_name: string;
  assigned_team_member_names: string[]; // was [] — make it string[]
  selected_days_names: string[];         // same here
  [key: string]: any;
}
export type TaskReportResponse = ITaskitem[];

export interface ITaskData {
  tasks: ITaskitem[];
}

export const fetchTaskReport = async (
  setTaskData?: TReactSetState<ITaskitem[]>, // Made optional
  selectedDates?: Date[],
  selectedTeamMembers?: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedStageStatus?: string[] | null,
  ul: number = 0,
  ll: number = 50,
  globalSearch?: string,
  is_support_ticket_flag?: number,
  selectedContactId?: string | null,
  referenceWiseContact?: number
): Promise<ITaskitem[]> => {
  const token = MobileToken || localStorage.getItem('token');
  const getUUID = getID || localStorage.getItem('UUID');

  if (!token || !getUUID) {
    toast.error('Authentication details are missing');
    const empty: ITaskitem[] = [];
    setTaskData?.(empty); // Only call if provided
    return empty;
  }

  const requestedData = {
    selectedDates: selectedDates
      ? selectedDates.map((date: any) =>
        date instanceof Date
          ? date.toISOString().split('T')[0]
          : date.format
            ? date.format("YYYY-MM-DD")
            : date
      )
      : undefined,
    a_application_login_id: getUUID,
    selectedTeamMembers: selectedTeamMembers || undefined,
    selectedStageStatus: selectedStageStatus,
    selectedContactId: selectedContactId,
    ul,
    ll,
    globalSearch,
    is_support_ticket_flag,
    referenceWiseContact: referenceWiseContact
  };

  try {
    const response = await axiosInstance.post('getTeamAllTask', requestedData);

    if (response.data.ack === 3) {
      toast.error(response.data.ack_msg);
      const empty: ITaskitem[] = [];
      setTaskData?.(empty);
      return empty;
    }

    // Extract the task array
    const tasks: ITaskitem[] = response?.data?.data?.data || [];

    tasks.forEach((item) => {
      let htmlRemark = item.task_remark || "";
      // Step 1: Replace <br> with newlines (before stripping tags)
      htmlRemark = htmlRemark.replace(/<br\s*\/?>/gi, "\n");

      // Step 2: Strip all HTML tags
      let plainText = htmlRemark.replace(/<[^>]+>/g, "");

      // Step 3: Decode common HTML entities
      plainText = plainText
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&rsquo;/gi, "’") // common curly quote
        .replace(/&lsquo;/gi, "‘")
        .replace(/&hellip;/gi, "…"); // etc.

      item.task_remark = plainText.trim();
    });

    console.log("ssssssssss", tasks)
    // Only update state if setter was provided (for backward compatibility)
    if (setTaskData) {
      setTaskData(tasks);
    }

    // Always return the data
    return tasks;
  } catch (error: any) {
    console.error('Fetch Task Report Error:', error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED
    );

    const empty: ITaskitem[] = [];
    setTaskData?.(empty);
    return empty;
  }
};


export const exportTaskAndSupportTicketData = async <T>(
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

