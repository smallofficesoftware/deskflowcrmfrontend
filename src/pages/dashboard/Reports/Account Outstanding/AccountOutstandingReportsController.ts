import { axiosInstance } from "../../../../services/axiosInstance";

export interface IAccountOutstanding {
  contact_name: string;
  total_outstanding_amount: string;
  outstanding_type: string;
  total_credit: string;
  total_debit: string;
}



export const fetchAccountOutstanding = async (
  selectedDates: Date[] | undefined,
  ul: number,
  ll: number,
  globalSearch?: string,
  selectedContactId?: string,
  referenceWiseContact?: number,
  Flag?:string
): Promise<IAccountOutstanding[]> => {
  try {
    const getUUID = localStorage.getItem("UUID");

    const response = await axiosInstance.post(
      "/accountOutstandingReport",
      {
        selected_dates: selectedDates,
        a_application_login_id: getUUID,
        ul,
        ll,
        globalSearch,
        selectedContactId,
        referenceWiseContact: referenceWiseContact,
        Flag
      }
    );

    return Array.isArray(response.data?.data)
      ? response.data.data
      : [];
  } catch {
    return [];
  }
};



export const exportAllAccountOutstadingData = async <T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  limit = 500
): Promise<T[]> => {
  let offset = 0;
  let allData: T[] = [];

  while (true) {
    const chunk = await fetchFn(offset, limit);

    if (!chunk || chunk.length === 0) break;

    allData = allData.concat(chunk);
    offset += chunk.length;

    if (chunk.length < limit) break;
  }

  return allData;
};