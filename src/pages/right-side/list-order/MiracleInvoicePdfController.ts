import axios from "axios";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

// Downloads the invoice's printable PDF from Miracle (RPT003 Voucher / Bill
// Printing). The invoice must already be synced to Miracle; only offered when
// the company's Miracle integration is on.
export const downloadMiracleInvoicePdf = async (
  cartId: string | number,
  setLoading?: (data: boolean) => void,
  fileLabel?: string,
) => {
  const requestData = {
    cart_id: cartId,
    a_application_login_id: localStorage.getItem("UUID"),
  };

  try {
    if (setLoading) setLoading(true);

    const res = await axiosInstance.post("generate-invoice-pdf", requestData);

    if (res.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const response = await axios.get(res.data.data.url, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `miracle_invoice_${fileLabel || cartId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(res.data.ack_msg || "Invoice downloaded successfully.");
    } else {
      toast.error(res.data.ack_msg || "Failed to download invoice.");
    }
  } catch (error: any) {
    console.error("Download Miracle Invoice Error:", error);

    const errorMessage =
      error?.response?.data?.ack_msg ||
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred.";

    toast.error(errorMessage);
  } finally {
    if (setLoading) setLoading(false);
  }
};
