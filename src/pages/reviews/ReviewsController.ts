import { axiosInstance } from "../../services/axiosInstance";

export interface CompanyReview {
  id: number;
  a_application_login_id: number;
  rating: number | null;
  review_type: "system" | "playstore" | "appstore" | null;
  comment: string | null;
  platform: "web" | "android" | "ios" | null;
  device_id: string | null;
  ip_address: string | null;
  rating_given_date: string | null;
  modified_date: string | null;
}

export const getReviews = async (page: number, itemsPerPage: number): Promise<CompanyReview[]> => {
  const a_application_login_id = localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id,
    ul: page * itemsPerPage,
    ll: itemsPerPage,
  };

  const response = await axiosInstance.post("review/list", requestData);

  return response.data?.data?.item || [];
};
