import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";
import { TUpdateAccountTransactions } from "../right-side/list-account-transaction/ListAccounTransactionController";

export const fetchApiAccountTransitions = async (
    page: number,
    setAccountTransactions: TUpdateAccountTransactions,
    setLoading: (loading: boolean) => void,
    contact_master_id: number | undefined,
    setClosingBalance: (balance: number) => void,
    setCompanyData: any,
    MobileToken: any,
    getID: any,
    qrCode: string | any,
    setContactData: any,
    startDate?: string,
    endDate?: string,
    creditFilter?: string,
    debitFilter?: string
) => {
    const getUUID = await getID || localStorage.getItem("UUID");
    const token = await MobileToken || localStorage.getItem("token");
    let companyWhere: any = {
        isDelete: 0,
        a_application_login_id: getUUID
    };
    if (qrCode) {
        companyWhere = {
            isDelete: 0,
            qr_code: qrCode
        };
    }
    companyWhere = JSON.stringify(companyWhere);
    try {
        setLoading(true);
        const requestData = {
            table: "company_masters",
            columns: "id,currency_id,company_name,company_logo,company_sign,company_email,company_contact,header_img,footer_img,address,gst_number,terms_and_condition,a_application_login_id,qr_code",
            where: companyWhere,
            // request_flag: 2,
        };
        const response = await axiosInstance.post("mainCommonGet", requestData);
        if (response.data.code === 200 && response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setCompanyData(response.data.data[0]);
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
        const contactRequestData = token ? {
            a_application_login_id: Number(getUUID),
            contact_master_id: contact_master_id,
            orderBy: "ASC",
            startDate: startDate,
            endDate: endDate,
            creditFilter: creditFilter,
            debitFilter: debitFilter,
        } : {}
        const contactResponse = await axiosInstance.post(token ? `/accountTransactionList/${contact_master_id}` : `/account-transaction-list-online-store/${contact_master_id}/${qrCode}`, contactRequestData);
        if (contactResponse.data.code === 200 && contactResponse.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setContactData(contactResponse.data.data.contactDetails);
            setAccountTransactions(contactResponse.data.data.item);
            setClosingBalance(contactResponse.data.data.closingBalance);
        } else {
            toast.error(contactResponse.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};