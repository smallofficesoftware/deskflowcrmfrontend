import { axiosInstance } from "../../services/axiosInstance";

export const submitReview = async (params: {
  action: "submit" | "cancel";
  rating?: number | null;
  comment?: string;
}): Promise<boolean> => {
  const a_application_login_id = localStorage.getItem("UUID");

  const response = await axiosInstance.post("review/submit", {
    a_application_login_id,
    platform: "web",
    action: params.action,
    rating: params.rating ?? undefined,
    comment: params.comment,
  });

  return response.data?.ack === 1;
};
