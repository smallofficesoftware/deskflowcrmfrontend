import { toast } from "react-toastify";
import { handleRefresh } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export interface ICompany {
  id: number;
  company_name: string;
  company_email: string;
  address?: string;
  parent_company_id?: number | null;
  company_contact: string;
  created_date_time: string;
  invitation_key: string;
  quotation_title: string;
  order_title: string;
  invoice_title: string;
  purchase_title: string;
  purchase_order_title: string;
  return_sales_invoice_title: string;
  return_purchase_invoice_title: string;
  proforma_invoice_title: string;
  company_flag: number;
  plan_id: number;
  qr_code?: string;
  plan_date: string;
  plan_expiry_date: string;
  plan_expiry_flag: number;
  trade_india_user_id: string;
  trade_india_profile_id: string;
  trade_india_key: string;
  india_mart_api_key: string;
  whatsapp_authkey: string;
  whatsapp_appkey: string;
  google_lead_sheet_for_faceBook_1: string;
  google_lead_sheet_for_faceBook_2: string;
  google_sheet_key_3: string;
  google_sheet_key_4: string;
  serp_api_key: string;
  inward_title: string;
  dispatch_title: string;
  plan_name: string;
  country_id: number;
  state_id: number;
  city_id: number;
}
export type TCountData = {
  teamMembers: number;
  contacts: number;
  inquiries: number;
  totalEmails: number;
  totalSalesOrders: number;
  totalProducts: number;
  totalQuotations: number;
  totalPurchaseInvoices: number;
  totalSalesInvoices: number;
  totalSalesB2bPortalInquiries: number;
  planContactDataLimit: number | string;
  planTeamMembersDataLimit: number | string;
  PlanInquiriesDataLimit: number | string;
  PlanEmailDataLimit: number | string;
  PlanSalesOrdersDataLimit: number | string;
  PlanProductsDataLimit: number | string;
  PlanQuotationsDataLimit: number | string;
  PlanPurchaseInvoicesDataLimit: number | string;
  PlanSalesInvoicesDataLimit: number | string;
  PlanSalesB2bPortalInquiriesDataLimit: number | string;
};

export const planTypesList = [
  { id: "1", order_type_display: "Basic" },
  { id: "2", order_type_display: "Premium" },
  { id: "3", order_type_display: "Advance" },
];

export interface ICompanyTeam {
  reporting_member?: number | "" | null;
  department?: number | "" | null;
  daily_in_time?: string;
  daily_out_time?: string;
  id: number;
  username: string;
  recovery_email: string;
  recovery_mobile: string;
  created_date_time: string;
  company_flag: number;
  profile_pic: string;
  quotation_title?: string;
  isActive: number;
  attendance_status?: number;
  employee_id?: number | string;
}

export interface IAttendanceHistory {
  // attendanceDate: string,
  date: string;
  messages: [
    {
      id: number;
      attendance_status: number;
      a_application_login_id: number;
      check_in_out_date_time: string;
      total_working_hour: string;
      created_date_time: string;
      s_timestemp: string;
      isDelete: number;
      isActive: number;
      company_masters_id: number;
      attendanceDate: string;
      attendanceTime: string;
      attendance_entry_flag: number;
      device_type: number;
      image_url: string;
      remark: string;
      updated_by_name: string;
    },
  ];
  totalWorkingHours: string;
  in_status: string;
  out_status: string;
}

export interface ITotalHourAndSalary {
  totalWorkingHours: string;
  totalSalary: string;
}

export const fetchCompanyApi = async (
  setCompanyLists: TReactSetState<ICompany[]>,
  term: string,
  setNoDataFound: TReactSetState<any>,
  setCompanyJoinOrCreate: TReactSetState<any>,
  setLoading: (data: boolean) => void,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
    searchTerm: term,
  };
  try {
    setLoading(true);

    const data = await axiosInstance.post("company", requestData, {
      headers: {
        Authorization: `${token}`,
      },
    });
    const items = data.data.data.item || [];
    const activeCompanyId = localStorage.getItem("COMPANY_ID");
    if (activeCompanyId) {
      const activeNum = Number(activeCompanyId);
      items.sort((a: ICompany, b: ICompany) => {
        if (a.id === activeNum) return -1;
        if (b.id === activeNum) return 1;
        const aIsMain = a.parent_company_id === null || a.parent_company_id === undefined;
        const bIsMain = b.parent_company_id === null || b.parent_company_id === undefined;
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        return 0;
      });
    } else {
      items.sort((a: ICompany, b: ICompany) => {
        const aIsMain = a.parent_company_id === null || a.parent_company_id === undefined;
        const bIsMain = b.parent_company_id === null || b.parent_company_id === undefined;
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        return 0;
      });
    }
    setCompanyLists(items);
    setNoDataFound(items.length === 0);
    setCompanyJoinOrCreate(items.length === 0);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const fetchCompanyTeamApi = async (
  setCompanyTeamLists: TReactSetState<ICompanyTeam[]>,
  companyMastersId: number,
  searchTerm: string,
) => {
  const token = await localStorage.getItem("token");
  const GetID = await localStorage.getItem("UUID");
  const companyId = localStorage.getItem("COMPANY_ID");
  const targetCompanyId = companyId ? Number(companyId) : companyMastersId;

  const requestData = {
    company_masters_id: targetCompanyId,
    searchTerm: searchTerm,
  };
  try {
    const data = await axiosInstance.post("my-team", requestData, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": `${GetID}`,
        ...(companyId ? { "x-company-id": companyId } : {}),
      },
    });
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyTeamLists([]);
    }
    setCompanyTeamLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const createVaiLink = async (
  data: string,
  setIsJoinConfirmation: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const requestData = {
    a_application_login_id: getUUID,
    invitation_key: data,
    company_flag: 2,
  };
  try {
    const { data } = await axiosInstance.post("invitation_key", requestData, {
      headers: {
        Authorization: `${token}`,
      },
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsJoinConfirmation(false);
        toast.success(data.ack_msg);
      }
    } else {
      setIsJoinConfirmation(true);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const companyTeamListRemove = async (
  companyTeamId: number | undefined,
  setIsRemoveCompanyTeamListConfirmation: TReactSetState<boolean>,
  setCompanyTeamLists: TReactSetState<ICompanyTeam[]>,
  companyMastersId: number,
) => {
  const token = await localStorage.getItem("token");
  try {
    const data = await axiosInstance.post(
      "my-team-remove",
      {
        id: companyTeamId,
        company_masters_id: companyMastersId,
        isDelete: 1,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      },
    );
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsRemoveCompanyTeamListConfirmation(false);
        fetchCompanyTeamApi(setCompanyTeamLists, companyMastersId, "");
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deactivateTeamPerson = async (
  companyTeamId: number | undefined,
  deactiveEmployeeFlag: number | undefined,
  setIsRemoveCompanyTeamListConfirmation: TReactSetState<boolean>,
  setCompanyTeamLists: TReactSetState<ICompanyTeam[]>,
  companyMastersId: number,
) => {
  const token = localStorage.getItem("token");
  try {
    const data = await axiosInstance.post(
      "my-team-deactive",
      {
        id: companyTeamId,
        company_masters_id: companyMastersId,
        f: deactiveEmployeeFlag,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      },
    );
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setIsRemoveCompanyTeamListConfirmation(false);
        fetchCompanyTeamApi(setCompanyTeamLists, companyMastersId, "");
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const companyLeave = async (companyIdLeave: number) => {
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: "company_vs_application_logins",
    where: `{"company_masters_id":"${companyIdLeave}","a_application_login_id":"${getUUID}"}`,
    data: `{"isDelete":"1"}`,
  };
  try {
    const data = await axiosInstance.post("mainCommonUpdate", requestData);

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      localStorage.removeItem("token");
      localStorage.removeItem("UUID");
      handleRefresh();
      return true;
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const companyDelete = async () => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post(
      "mainCompanyDelete",
      {
        company_masters_id: getUUID,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      },
    );

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      localStorage.removeItem("token");
      localStorage.removeItem("UUID");
      handleRefresh();
      return true;
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const companyMainDelete = async (company_id: Number | null) => {
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post(
      "mainCompanyDelete",
      {
        company_masters_id: company_id,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      },
    );

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      localStorage.removeItem("token");
      localStorage.removeItem("UUID");
      handleRefresh();
      return true;
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error) {
    //  toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};
// export const fetchPlanStatisticsCounts = async (setCountData:TReactSetState<TCountData>) => {
//   const getUUID = await localStorage.getItem("UUID");
//   const token = await localStorage.getItem("token");
//   try {
//     const response = await axiosInstance.post("get-plan-statistics",   {
//       a_application_login_id: getUUID,
//       plan_id : token
//     }); // Replace with actual API URL
//     if(response.data.ack === 1){
//     setCountData(response.data.data.item);

//     }else{
//       toast.error(response.data.ack_msg)
//     }
//   } catch (error : any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//   }
// };

export const fetchPlanStatisticsCounts = async (
  setCountData: TReactSetState<TCountData>,
  planId: string | number, // Add planId parameter
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const response = await axiosInstance.post("get-plan-statistics", {
      a_application_login_id: getUUID,
      plan_id: planId, // Use the passed planId instead of token
    });

    if (response.data.ack === 1) {
      setCountData(response.data.data.item);
    } else {
      toast.error(response.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchAttendanceHistory = async (
  setAttendanceHistory: TReactSetState<IAttendanceHistory[]>,
  // setTotalHourAndSalary: TReactSetState<IAttendanceHistory[]>,
  selectedDates: Date[] | undefined,
  companyMasterId: number | undefined,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  const requestedData = {
    request_flag: 2,
    a_application_login_id: companyMasterId,
    selectedDates: selectedDates,
  };
  try {
    const data = await axiosInstance.post("view-attendance", requestedData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      return;
    }
    setAttendanceHistory(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchAttendanceByDate = async (
  applicationLoginId: number | undefined,
  date: string,
  setRows: React.Dispatch<React.SetStateAction<any[]>>,
  setTotalHours: React.Dispatch<React.SetStateAction<string>>,
) => {
  if (!applicationLoginId || !date) return;

  const requestedData = {
    a_application_login_id: applicationLoginId,
    date, // yyyy-mm-dd
  };

  try {
    const res = await axiosInstance.post("view-attendance-date", requestedData);

    if (res.data.ack !== 1) return;

    setRows(res.data.data.item || []);
    setTotalHours(res.data.data.totalWorkingHours || "00:00:00");
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deleteAttendance = async (
  attendanceId: number,
  applicationLoginId: number | undefined,
  onSuccess?: () => void,
) => {
  if (!attendanceId || !applicationLoginId) return;

  const requestedData = {
    attendance_id: attendanceId,
    a_application_login_id: applicationLoginId,
  };

  try {
    const data = await axiosInstance.post("delete-attendance", requestedData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.data?.message || "Failed to delete attendance");
      return;
    }

    toast.success("Attendance deleted successfully");
    onSuccess?.();
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const updateAttendance = async (
  attendanceId: number,
  applicationLoginId: number | undefined,
  checkedDateTime?: string,
  attendanceStatus?: number,
  remark?: string,
  onSuccess?: () => void,
) => {
  if (!attendanceId || !applicationLoginId) return;
  const getUUID = await localStorage.getItem("UUID");

  const requestedData = {
    attendance_id: attendanceId,
    a_application_login_id: applicationLoginId,
    check_in_out_date_time: checkedDateTime,
    attendance_status: attendanceStatus,
    remark: remark,
    updated_by: getUUID,
  };

  try {
    const data = await axiosInstance.post("update-attendance", requestedData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.data?.message || "Failed to Update attendance");
      return;
    }

    toast.success("Attendance Updated successfully");
    onSuccess?.();
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const createAttendance = async (
  applicationLoginId: number | undefined,
  checkedDateTime?: string,
  attendanceStatus?: number,
  remark?: string,
  onSuccess?: () => void,
) => {
  if (!applicationLoginId) return;
  const getUUID = localStorage.getItem("UUID");

  const requestedData = {
    a_application_login_id: applicationLoginId,
    check_in_out_date_time: checkedDateTime,
    attendance_status: attendanceStatus,
    remark: remark,
    updated_by: getUUID,
  };

  try {
    const data = await axiosInstance.post("create-attendance", requestedData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.data?.message || "Failed to Create attendance");
      return;
    }

    toast.success("Attendance Created successfully");
    onSuccess?.();
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCompanyQR = async () => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const response = await axiosInstance.post("companyQR", {
      a_application_login_id: getUUID,
    });
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return response.data.data.qrCode;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const insertAttendance = async (
  checkAttendance: number,
  targetUserId?: number,
) => {
  const token = localStorage.getItem("token");
  const currentLoginId = Number(localStorage.getItem("UUID"));
  const loginId = targetUserId;

  const requestData = {
    attendance_status: checkAttendance,
    a_application_login_id: loginId,
    device_type: 1,
  };

  try {
    const data = await axiosInstance.post("check-attendance", requestData);

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      if (loginId === currentLoginId) {
        handleRefresh(); // Only call for self
      }
    }
    toast.success(data.data.ack_msg);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
