import { toast } from 'react-toastify';
import { TReactSetState } from '../../../../helpers/AppType';
import { axiosInstance } from '../../../../services/axiosInstance';

export interface IReminderItem {
  id: number;
  contact_masters_id: number | null;
  contact_name: string | null;
  a_application_login_id: number;
  created_by_username: string | null;
  reminder_data_time: string;
  completed_date_time: string | null;
  status: 0 | 1;
  status_display: "Due" | "Completed" | "Upcoming";
  assigned_to?: number;
  assigned_to_name: string | null;
  remark: string | null;
  company_masters_id?: number;
  isDelete: 0 | 1;
  created_at?: string;
  updated_at?: string;
}
export type TaskReportResponse = IReminderItem[];

export interface ITaskData {
  tasks: IReminderItem[];
}

// AllReminderController.ts

// ... keep exportTaskAndSupportTicketData as is ...

export const fetchTaskReport = async (
  setData?: TReactSetState<IReminderItem[]>,
  selectedDates?: Date[],
  selectedTeamMembers?: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedStageStatus?: string[] | null,   // ← can remove if not used
  ul: number = 0,
  ll: number = 50,
  globalSearch?: string,
  is_support_ticket_flag?: number,
  selectedContactId?: string | null,
  referenceWiseContact?: number,
  typeFilter: string = "due",
  setCounts?: (counts: { due: number; future: number; complete: number; all: number }) => void,
): Promise<IReminderItem[]> => {
  const token = MobileToken || localStorage.getItem("token");
  const uuid = getID || localStorage.getItem("UUID");

  if (!token || !uuid) {
    toast.error("Authentication details missing");
    return [];
  }

  const payload = {
    selectedDates: selectedDates
      ? selectedDates.map((date: any) =>
        date instanceof Date
          ? date.toISOString().split('T')[0]
          : date.format
            ? date.format("YYYY-MM-DD")
            : date
      )
      : undefined,
    a_application_login_id: uuid,
    selectedTeamMembers: selectedTeamMembers?.length ? selectedTeamMembers : undefined,
    selectedStageStatus, // remove if not used
    selectedContactId,
    ul,
    ll,
    globalSearch,
    referenceWiseContact: referenceWiseContact,
    typeFilter,
  };

  try {
    const res = await axiosInstance.post("getAllReminderReports", payload, {
      headers: { Authorization: token },
    });

    if (res.data.ack !== 1) {  // adjust based on your success code
      toast.error(res.data.ack_msg || "Failed to load reminders");
      return [];
    }

    const items: IReminderItem[] = res.data?.data?.data || [];
    if (res.data?.data?.counts && setCounts) {
      setCounts(res.data.data.counts);
    }
    setData?.(items);
    return items;
  } catch (err: any) {
    toast.error(err?.response?.data?.ack_msg || "Something went wrong");
    return [];
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

