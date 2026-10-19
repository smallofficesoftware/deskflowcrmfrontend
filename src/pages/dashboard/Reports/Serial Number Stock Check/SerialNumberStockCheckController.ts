import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ITitle } from "../../DashoardController";

// Movement / history data and warehouse list come from ProductController
// (fetchApiStockMovementSerialNumberwise, fetchwrehouse) unchanged.

// Company titles + document view formats, needed to open a document in the order modal.
export const fetchCompanyTitlesApi = async (): Promise<ITitle[]> => {
  const requestData = {
    table: "company_masters",
    columns:
      "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,id,invoice_view_formate,order_view_formate,quotation_view_formate,purchase_view_formate,workorder_view_formate,purchase_order_view_formate,inward_title,dispatch_title,inward_view_formate,dispatch_view_formate",
    where: JSON.stringify({ a_application_login_id: localStorage.getItem("UUID") }),
    request_flag: 2,
  };
  try {
    const response = await axiosInstance.post("mainCommonGet", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return response.data.data || [];
    }
    toast.error(response.data.ack_msg || "Something went wrong");
    return [];
  } catch (error: any) {
    toast.error(error?.message || "Something went wrong");
    return [];
  }
};

// The view format of the company for one document type (1 = default).
export const viewFormatForCartType = (company: any, cartType: number): number => {
  switch (Number(cartType)) {
    case 1:
      return Number(company?.quotation_view_formate || 1);
    case 2:
      return Number(company?.order_view_formate || 1);
    case 3:
      return Number(company?.invoice_view_formate || 1);
    case 4:
      return Number(company?.purchase_view_formate || 1);
    case 5:
      return Number(company?.purchase_order_view_formate || 1);
    case 6:
      return Number(company?.return_sales_invoice_view_formate || 1);
    case 7:
      return Number(company?.return_purchase_invoice_view_formate || 1);
    case 8:
      return Number(company?.inward_view_formate || 1);
    case 9:
      return Number(company?.dispatch_view_formate || 1);
    default:
      return 0;
  }
};

// Document types that bring stock in (purchase invoice, sales return, inward, stock in).
export const isStockInCartType = (cartType: number) =>
  cartType === 4 || cartType === 6 || cartType === 8 || cartType === 10;
