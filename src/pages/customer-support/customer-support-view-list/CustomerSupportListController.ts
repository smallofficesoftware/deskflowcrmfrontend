import { axiosInstance } from "../../../services/axiosInstance";

export interface Ticket {
  id: number;
  task_title: string;
  task_remark: string;
  task_attechment?: string;
  category_name: string;
  category_color: string;
  status_name: string;
  status_color: string;
  ids: number;
  created_date_time: string;
  media_url: string;
  is_complete_flag?: number;
}

export const getSupportTickets = async (
  page: number,
  itemsPerPage: number
): Promise<Ticket[]> => {

  const a_application_login_id = localStorage.getItem("UUID");

  const ul = page * itemsPerPage;
  const ll = itemsPerPage;

  const requestData = {
    a_application_login_id,
    ul,
    ll,
  };

  const response = await axiosInstance.post(
    "get-support-ticket",
    requestData
  );

  return response.data.data.item;
};