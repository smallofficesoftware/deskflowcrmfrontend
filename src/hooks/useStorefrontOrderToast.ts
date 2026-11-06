import { toast } from "react-toastify";
import useSocketEvent from "./useSocketEvent";

/**
 * Shows a toast when a storefront order is posted into a contact's chat.
 * The backend (storefrontOrderEvents.js) emits the existing
 * "contact-chat-changed" event with an extra `order_message` field for these;
 * ordinary chat messages carry no such field, so they never toast here.
 */
const useStorefrontOrderToast = () => {
  useSocketEvent<{ contact_id?: number; order_message?: string }>(
    "contact-chat-changed",
    (payload) => {
      if (!payload?.order_message) return;
      toast.info(payload.order_message, { toastId: `storefront-order-${payload.contact_id}-${payload.order_message}` });
    },
  );
};

export default useStorefrontOrderToast;
