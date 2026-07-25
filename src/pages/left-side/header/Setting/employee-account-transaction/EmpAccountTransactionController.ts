import axios from "axios";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TFilterDate } from "../../../../../helpers/AppInterface";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IEmpAccountTransaction {
    id: number;
    type: string;
    mode: string;
    amount: number;
    payment_date_time: string
    remark: string;
    created_date_time: Date;
    approve_by_a_application_login_id: number,
    approve_date_time: string
    s_timestemp: string
    a_application_login_name: any,
    approve_by_a_application_login_name: any,
    payment_type_name: any,

}

export type TUpdateAccountTransactions = (update: IEmpAccountTransaction[] | ((prev: IEmpAccountTransaction[]) => IEmpAccountTransaction[])) => void;

export const fetchApiAccountTransitions = async (
    page: number,
    term: string,
    setAccountTransactions: TUpdateAccountTransactions,
    itemsPerPage: number,
    setLoading: (loading: boolean) => void,
    team_id: number | undefined,
    setClosingBalance: (balance: number) => void,
    startSearchDate: TFilterDate,
    endSearchDate: TFilterDate,
    initialCheckedShowCreditData: number | undefined,
    initialCheckedShowDebitData: number | undefined
) => {
    const start: number = page * itemsPerPage;
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    try {
        const { data } = await axiosInstance.post(
            "employeeAccountTransactionList",
            {
                ul: start, // Upper limit based on page number
                ll: itemsPerPage, // Lower limit based on page number
                searchTerm: term,
                a_application_login_id: Number(getUUID),
                team_id: team_id,
                startDate: startSearchDate,
                endDate: endSearchDate,
                creditFilter: initialCheckedShowCreditData || "",
                debitFilter: initialCheckedShowDebitData || ""
            }
        );
        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                if (page === 0) {
                    setLoading(true);
                    setAccountTransactions(data.data.item);
                    setClosingBalance(data.data.closingBalance);
                } else {
                    setLoading(false);
                    setAccountTransactions((prevUsers) => [
                        ...prevUsers,
                        ...data.data.item,
                    ]);
                }
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }
};

export const PDFaccountv1 = async (id: number, setIsPDFDownloadLoading: any) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    setIsPDFDownloadLoading(true);
    try {
        const { data } = await axiosInstance.post(
            "employeeAccountPDFv1",
            {
                a_application_login_id: Number(getUUID),
                accountTransactionId: id,
            }
        );

        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                // fetch the file as blob
                const response = await fetch(data.data.fileLinkPath, {
                    headers: { Authorization: `${token}` },
                });
                const blob = await response.blob();

                // create download link from blob
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `emp_account_transaction_${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); // cleanup
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setIsPDFDownloadLoading(false);
    }
};

export const empAllTransactionDownloadPDf = async (teamId: any, setIsAllPDFDownloadLoading: any, startSearchDate: TFilterDate,
    endSearchDate: TFilterDate, creaditFilter: number | undefined, debitFilter: number | undefined,) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    setIsAllPDFDownloadLoading(true);
    try {
        const { data } = await axiosInstance.post(
            "employeeAllAccountTransactionPDF",
            {
                a_application_login_id: Number(getUUID),
                team_id: teamId,
                startDate: startSearchDate,
                endDate: endSearchDate,
                creaditFilter: creaditFilter,
                debitFilter: debitFilter,
            }
        );
        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {


                const fileUrl = data.data.fileLinkPath;
                const response = await axios.get(fileUrl, { responseType: "blob" });
                const blob = new Blob([response.data], {
                    type: response.headers["content-type"],
                });




                // create download link from blob
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `all_account_transaction_${teamId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); // cleanup
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setIsAllPDFDownloadLoading(false);
    }
};