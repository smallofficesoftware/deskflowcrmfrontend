import axios from "axios";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TFilterDate } from "../../../helpers/AppInterface";
import { axiosInstance } from "../../../services/axiosInstance";
export interface IAccountTransaction {
  id: number;
  miracle_account_ledger: string;
  type: string;
  mode: string;
  amount: number;
  payment_date_time: string;
  contact_masters_id: string;
  remark: string;
  created_date_time: Date;
  approve_by_a_application_login_id: number;
  approve_date_time: string;
  s_timestemp: string;
  reference_table: any;
  reference_id: any;
  a_application_login_name: any;
  approve_by_a_application_login_name: any;
  payment_type_name: any;
}

export type TUpdateAccountTransactions = (
  update:
    | IAccountTransaction[]
    | ((prev: IAccountTransaction[]) => IAccountTransaction[]),
) => void;

export const fetchApiAccountTransitions = async (
  page: number,
  term: string,
  setAccountTransactions: TUpdateAccountTransactions,
  itemsPerPage: number,
  setLoading: (loading: boolean) => void,
  contact_master_id: number | undefined,
  setClosingBalance: (balance: number) => void,
  startSearchDate: TFilterDate,
  endSearchDate: TFilterDate,
  initialCheckedShowCreditData: number | undefined,
  initialCheckedShowDebitData: number | undefined,
) => {
  const start: number = page * itemsPerPage;
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const { data } = await axiosInstance.post("accountTransactionList", {
      ul: start, // Upper limit based on page number
      ll: itemsPerPage, // Lower limit based on page number
      searchTerm: term,
      a_application_login_id: Number(getUUID),
      contact_master_id: contact_master_id,
      startDate: startSearchDate,
      endDate: endSearchDate,
      creditFilter: initialCheckedShowCreditData || "",
      debitFilter: initialCheckedShowDebitData || "",
    });
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

export const fetchApiAccountTransitionsBankStatement = async (
  page: number,
  term: string,
  setAccountTransactions: TUpdateAccountTransactions,
  itemsPerPage: number,
  setLoading: (loading: boolean) => void,
  contact_master_id: number | undefined,
  setClosingBalance: (balance: number) => void,
  startSearchDate: string,
  endSearchDate: string,
) => {
  const start: number = page * itemsPerPage;
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const { data } = await axiosInstance.post("accountTransactionList", {
      ul: start, // Upper limit based on page number
      ll: itemsPerPage, // Lower limit based on page number
      searchTerm: term,
      a_application_login_id: Number(getUUID),
      contact_master_id: contact_master_id,
      startDate: startSearchDate,
      endDate: endSearchDate,
    });
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

export const PDFaccountv1 = async (
  id: number,
  setIsPDFDownloadLoading: any,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  setIsPDFDownloadLoading(true);
  try {
    const { data } = await axiosInstance.post("accountPDFv1", {
      a_application_login_id: Number(getUUID),
      accountTransactionId: id,
    });

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
        link.download = `account_transaction_${id}.pdf`;
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

export const contactAllTransactionDownloadPDf = async (
  contactId: any,
  setIsAllPDFDownloadLoading: any,
  startSearchDate: TFilterDate,
  endSearchDate: TFilterDate,
  creaditFilter: number | undefined,
  debitFilter: number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  setIsAllPDFDownloadLoading(true);
  try {
    const { data } = await axiosInstance.post(
      "ContactAllAccountTransactionPDF",
      {
        a_application_login_id: Number(getUUID),
        contact_master_id: contactId,
        startDate: startSearchDate,
        endDate: endSearchDate,
        creaditFilter: creaditFilter,
        debitFilter: debitFilter,
      },
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        // fetch the file as blob
        // const response = await fetch(data.data, {
        //   headers: { Authorization: `${token}` },
        // });

        const fileUrl = data.data.fileLinkPath;
        const response = await axios.get(fileUrl, { responseType: "blob" });
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });

        // create download link from blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `all_account_transaction_${contactId}.pdf`;
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

export const generateMiracleLedger = async (
  contactId: string | number,
  setMiracleLedgerLoading: (data: boolean) => void,
) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    contact_id: contactId,
    a_application_login_id: uuid,
  };

  try {
    setMiracleLedgerLoading(true);

    const res = await axiosInstance.post("generate-ledger", requestData);

    if (res.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const response = await axios.get(res.data.data.url, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      // create download link from blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `miracle_ledger_${contactId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // cleanup

      toast.success(res.data.ack_msg || "Ledger generated successfully.");
    } else {
      toast.error(res.data.ack_msg || "Failed to generate ledger.");
    }
  } catch (error: any) {
    console.error("Generate Ledger Error:", error);

    // Safely extract error message to prevent [object Object] rendering
    const errorMessage =
      error?.response?.data?.ack_msg ||
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred.";

    toast.error(errorMessage);
  } finally {
    setMiracleLedgerLoading(false);
  }
};

export const generateMiracleOutstanding = async (
  contactId: string | number,
  setMiracleOutstandingLoading: (data: boolean) => void,
) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    contact_id: contactId,
    a_application_login_id: uuid,
  };

  try {
    setMiracleOutstandingLoading(true);
    const res = await axiosInstance.post("generate-outstanding", requestData);

    if (res.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const response = await axios.get(res.data.data.url, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      // create download link from blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Fixed the download filename to reflect the outstanding report
      link.download = `miracle_outstanding_${contactId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // cleanup

      // Removed DEFAULT_STATUS_CODE_SUCCESS fallbacks for human-readable ones
      toast.success(
        res.data.ack_msg || "Outstanding report generated successfully.",
      );
    } else {
      // Handles 200 OK responses that represent a logical error from your backend
      toast.error(res.data.ack_msg || "Failed to generate outstanding report.");
    }
  } catch (error: any) {
    console.error("Generate Outstanding Error:", error);

    // Safely extract the error message to avoid [object Object] rendering
    const errorMessage =
      error?.response?.data?.ack_msg ||
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred.";

    toast.error(errorMessage);
  } finally {
    setMiracleOutstandingLoading(false);
  }
};

export const syncMiracleAccountEntry = async (
  item: any,
  setSyncLoading?: (data: boolean) => void,
) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    acc_id: item,
    a_application_login_id: uuid,
  };

  try {
    if (setSyncLoading) {
      setSyncLoading(true);
    }

    const response = await axiosInstance.post("sync-case-bank-pr", requestData);

    // Handle Success or Backend-Caught Logical Errors
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(
        response.data.ack_msg || "Account entry synced successfully.",
      );
    } else {
      toast.error(response.data.ack_msg || "Failed to sync account entry.");
    }
  } catch (error: any) {
    console.error("Sync Account Entry Error:", error);

    // Safely extract the error message so [object Object] does not show in the toast
    const errorMessage =
      error?.response?.data?.ack_msg ||
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred.";

    toast.error(errorMessage);
  } finally {
    if (setSyncLoading) {
      setSyncLoading(false);
    }
  }
};
