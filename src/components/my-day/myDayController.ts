import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";

export interface IMyDayContact {
  contact_id: number | null;
  contact_name: string;
  company_name: string;
  mobile_number: string;
}

export interface IMyDayTask extends IMyDayContact {
  id: number;
  title: string;
  remark: string;
  priority: string;
  due: string;
}

export interface IMyDayReminder extends IMyDayContact {
  id: number;
  remark: string;
  task_id: number | null;
  due: string;
}

export interface IMyDaySummary {
  date: string;
  tasks: { today: IMyDayTask[]; overdue: IMyDayTask[] };
  reminders: { today: IMyDayReminder[]; overdue: IMyDayReminder[] };
  counts: {
    tasks_today: number;
    tasks_overdue: number;
    reminders_today: number;
    reminders_overdue: number;
  };
}

export const fetchMyDaySummaryApi = async (): Promise<IMyDaySummary | null> => {
  try {
    const response = await axiosInstance.post("my-day-summary", {
      a_application_login_id: localStorage.getItem("UUID"),
    });
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) return response.data.data as IMyDaySummary;
  } catch {
    /* the popup is a convenience: a failed load just means no popup */
  }
  return null;
};
