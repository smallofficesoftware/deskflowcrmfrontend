import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import { fetchColumnPreference, saveColumnPreference } from "../../../services/columnPreferenceService";
import { QUICK_ACTIONS_KEY } from "./quickActionsRegistry";

// Data of the Quick actions page: the four "Today" numbers and the saved choice of actions. Same endpoints the app's
// Home uses (flutter/lib/Screen/Home/HomeController.dart), so both show the same numbers.

export interface ITodayNumbers {
  overdueTasks: number | null;
  remindersDue: number | null;
  todayVisits: number | null;
  todayCalls: number | null;
}

const loginId = () => localStorage.getItem("UUID");
const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const post = async (url: string, body: object) => {
  try {
    const { data } = await axiosInstance.post(url, body);
    return data?.ack === DEFAULT_STATUS_CODE_SUCCESS ? data.data : null;
  } catch {
    return null;
  }
};

/** Overdue tasks, reminders due, today's visits and today's calls. A number the user may not see (or that failed to
 * load) stays null, and the card shows "-". */
export const fetchTodayNumbers = async (opts: { canTasks: boolean; canReminders: boolean; canInsight: boolean }): Promise<ITodayNumbers> => {
  const [tasks, reminders, insight] = await Promise.all([
    opts.canTasks ? post("get-Task-count", { a_application_login_id: loginId() }) : null,
    opts.canReminders
      ? post("reminder", {
          a_application_login_id: loginId(),
          searchDate: "",
          ul: 0,
          ll: 1,
          reminderCheckFlag: 0,
          allreminderCheckFlag: 0,
          typeFilter: "due",
          viewScope: "my",
          searchTerm: "",
          startDate: "",
          endDate: "",
        })
      : null,
    opts.canInsight ? post("crm-insight", { a_application_login_id: loginId(), selectedDates: [todayYmd(), todayYmd()], data: [] }) : null,
  ]);
  const num = (v: unknown) => (v === undefined || v === null || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    overdueTasks: num(tasks?.task_count),
    remindersDue: num(reminders?.counts?.due),
    todayVisits: num(insight?.todayVisitCount),
    todayCalls: num(insight?.todayCallCount),
  };
};

/** The saved choice: ids in order, and the ids switched off. `order` is null when the user never saved one. */
export const loadQuickActionPrefs = async (): Promise<{ order: string[] | null; hidden: string[] }> => {
  const saved = await fetchColumnPreference(QUICK_ACTIONS_KEY);
  return { order: Array.isArray(saved?.column_order) ? saved!.column_order : null, hidden: saved?.hidden_columns ?? [] };
};

export const saveQuickActionPrefs = (order: string[], hidden: string[] = []) => saveColumnPreference(QUICK_ACTIONS_KEY, order, hidden);

/** Customer search for the picker (the same "Contact" endpoint the filter popups use). */
export interface IPickCustomer {
  id: number;
  person_name: string;
  mobile_number: string;
  company_name?: string;
}

export const searchCustomers = async (term: string): Promise<IPickCustomer[]> => {
  if (term.trim().length < 2) return [];
  const data = await post("Contact", { searchTerm: term.trim(), a_application_login_id: loginId() });
  return (data?.item as IPickCustomer[]) ?? [];
};
