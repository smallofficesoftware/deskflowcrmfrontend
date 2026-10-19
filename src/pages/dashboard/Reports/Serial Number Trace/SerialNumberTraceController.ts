import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ILinkedDocument {
  cart_type: number;
  cart_number: string;
}

export interface ITraceEvent {
  source: "document" | "task" | "support_ticket" | "visit";
  id: number;
  date: string | null;
  cart_type?: number;
  reference: string;
  title?: string;
  contact_name: string;
  qty?: number;
  amount?: number;
  stock_effect?: "in" | "out" | "none";
  linked_from?: ILinkedDocument[];
  linked_to?: ILinkedDocument[];
  completed_date?: string | null;
}

export interface ITrace {
  serial_number: string;
  product_name: string;
  stock_balance: number;
  last_stock_effect: "in" | "out" | "none";
  last_party: string;
  event_count: number;
  events: ITraceEvent[];
}

// Returns the trace, or null when the serial number is not found / the call fails.
export const fetchSerialNumberTraceApi = async (serialNumber: string): Promise<ITrace | null> => {
  try {
    const response = await axiosInstance.post("get-serial-number-trace", {
      a_application_login_id: localStorage.getItem("UUID"),
      serial_number: serialNumber,
    });
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return response.data.data as ITrace;
    }
    toast.error(response.data.ack_msg || "Serial number not found");
    return null;
  } catch (error: any) {
    toast.error(error.response?.data?.ack_msg || "Serial number not found");
    return null;
  }
};
