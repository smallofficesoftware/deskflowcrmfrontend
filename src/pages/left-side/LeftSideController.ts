import { toast } from "react-toastify";
import { handleRefresh } from "../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TFilterDate } from "../../helpers/AppInterface";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";
import { IStageStatusView } from "./header/Setting/stage-status/StageStatusController";

export interface ICompanyTeam {
  id: number;
  username: string;
  recovery_email: string;
  recovery_mobile: string;
  created_date_time: string;
  company_flag: number;
  profile_pic: string;
  daily_in_time?: string; // Added for EditTeamMemberView
  daily_out_time?: string; // Added for EditTeamMemberView
  per_hour_salary?: string; // Added for EditTeamMemberView
  reporting_employee?: number; // Added for EditTeamMemberView
  department?: number; // Added for EditTeamMemberView
}

export interface ICompany {
  [x: string]: any;
  invitation_key: string;
}
export interface ITaskCategoryView {
  task_category_name: string;
  id: number;
  task_color: string | undefined | null;
  created_date_time?: string;
  visibility?: number;
  is_assigned_widget: number | string;
}

export interface IUserList {
  id: number;
  to_customer_id: number;
  reminderDueCount: number;
  person_name: string;
  to_customer_name: string;
  mobile_number: string;
  company_name?: string;
  email_id?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  pincode?: string;
  address?: string;
  status?: number;
  client_code?: string;
  country_name: string;
  state_name: string;
  city_name: string;
  created_date_time: string;
  source_name: string;
  source_name_color: string;
  lable: any;
  label_color: string;
  label_name: string;
  assinged_to_work_a_application_id: string | number;
  contact_status: number;
  stage_status_name: string;
  stage_status_color: string;
  area_name: string;
  assinged_to_price_list: number;
  shipping_address: string;
  gst_number: string;
  is_unread: number;
  is_pin: number;
  is_pin_by_a_application_login_id: string;
  a_application_login_id: number;
  reference_contact?: number;
  is_archive?: number;
  sync_whatsapp?: number;
  teamMemberName?: any;
  longitude?: string;
  latitude?: any;
  assined_team_person_list?: any;
  created_by_name?: any;
  pinned_message_decr?: string;
  pinned_message?: number;
}

export interface ILoginData {
  username: string;
  recovery_mobile?: string;
  profile_pic: string;
  login_pin: string;
  registration_flag: string;
  recovery_email: string;
}

// Interface for attendance history, used in AttendanceHistory.tsx
export interface IAttendanceHistory {
  date: string;
  messages: {
    attendance_status: number; // 1 for IN, 2 for OUT
    attendanceTime: string;
    total_working_hour: string;
  }[];
}

export const fetchDataUser = async (
  page: number,
  term: string,
  setUsers: TReactSetState<IUserList[]>,
  itemsPerPage: number,
  setNoDataFound: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  token: string | null,
  localId: string | null,
  setContactId: TReactSetState<number | undefined>,
  setSelectedLabelIds: TReactSetState<any>,
  setCheckToken: TReactSetState<boolean>,
  filterData?: any,
  checkedOptionsLabel?: any,
  checkedSourceTypes?: any,
  startSearchDate?: TFilterDate,
  endSearchDate?: TFilterDate,
  checkedOptionsStageStatus?: any,
  checkedOptionsUser?: any,
  isPin?: number,
  isUnread?: number,
  labelId?: number | null | undefined,
  sourceId?: number | null | undefined,
  stageStatusId?: number | null | undefined,
  isPinByApplicationId?: string | undefined,
  setTotalNumberOfUnreadContact?: any,
  setTotalContactCount?: any,
  isArchive?: number,
  selectedActiveId?: number | string | undefined | null,
  selectedDays?: number | string | undefined | null,
  assignedByMultiTeamMember?: any,
  createdByMultiTeamMember?: any,
  setContactAutoRefreshON?: any,
  setContactAutoRefreshTimeout?: any,
  setContactAutoRefreshInactivityDelay?: any,
  labelwiseContactShowAndOrNot?: number,
  checkedOptionsContactassignOrNot?: any,
  ids?: number[],
) => {
  const start: number = page * itemsPerPage;
  try {
    const { data } = await axiosInstance.post("Contact", {
      ul: start,
      ll: itemsPerPage,
      searchTerm: term || "",
      a_application_login_id: Number(localId),
      labelFilter: checkedOptionsLabel,
      sourceTypeFilter: checkedSourceTypes,
      country: filterData?.country,
      state: filterData?.state,
      city: filterData?.city,
      area: filterData?.area,
      startDate: startSearchDate,
      endDate: endSearchDate,
      statusFilter: checkedOptionsStageStatus,
      userFilter: checkedOptionsUser,
      isPin: isPin,
      isUnread: isUnread,
      labelId: labelId,
      sourceId: sourceId,
      stageStatusId: stageStatusId,
      isPinByApplicationId: isPinByApplicationId,
      isArchive: isArchive,
      selectedActiveId: selectedActiveId,
      selectedDays: selectedDays,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      labelwiseContactShowAndOrNot: labelwiseContactShowAndOrNot || 0,
      checkedOptionsContactassignOrNot: checkedOptionsContactassignOrNot || 0,
      ids
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        if (page === 0) {
          setLoading(true);
          setUsers(data.data.item);
          setContactId(data.data.item[0]?.id);
          setSelectedLabelIds(data.data.item[0]?.lable);
          if (setTotalNumberOfUnreadContact) {
            setTotalNumberOfUnreadContact(data.data?.totalUnreadOnPage);
          }
          if (setContactAutoRefreshON) {
            setContactAutoRefreshON(data.data?.CONTACT_AUTO_REFRESH_ON);
          }
          if (setContactAutoRefreshTimeout) {
            setContactAutoRefreshTimeout(
              data.data.CONTACT_AUTO_REFRESH_TIMEOUT,
            );
          }
          if (setContactAutoRefreshInactivityDelay) {
            setContactAutoRefreshInactivityDelay(
              data.data.CONTACT_AUTO_REFRESH_INACTIVITY_DELAY,
            );
          }
          setTotalContactCount?.(data.data?.totalCountFilter || 0);
        } else {
          setLoading(false);
          setUsers((prevUsers) => [...prevUsers, ...data.data.item]);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setNoDataFound(data.data.item.length === 0);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const fetchDataIndiaMart = async () =>
  /* setLoading: TReactSetState<boolean> */ {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post("India-mart", {
      a_application_login_id: getUUID,
      source_type_id: -1,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      } else {
        // toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
    // setLoading(true);
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      // setLoading(false);
    }, 1000);
  }
};

export const fetchDataFromTradeIndiaInquiry = async () =>
  /* setLoading: TReactSetState<boolean> */ {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post("/trade-india", {
      a_application_login_id: getUUID,
      source_type_id: -13,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      } else {
        // toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
    // setLoading(true);
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      // setLoading(false);
    }, 1000);
  }
};

export const fetchDataFromTradeIndiaBUYLeads = async () =>
  /* setLoading: TReactSetState<boolean> */ {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  try {
    const { data } = await axiosInstance.post("/trade-india-buy-leads", {
      a_application_login_id: getUUID,
      source_type_id: -13,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      } else {
        // toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
    // setLoading(true);
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      // setLoading(false);
    }, 1000);
  }
};

export const fetchGoogleSheetForFacebook = async () =>
  /* setLoading: TReactSetState<boolean> */ {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  // setLoading(true);

  try {
    const { data } = await axiosInstance.post("google-sheet-for-facebook", {
      a_application_login_id: getUUID,
      source_type_id: -2,
    });

    if (data.code !== 200 || data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      const errorMsg =
        data.ack_msg || data.developer_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED;
      toast.error(errorMsg);
      return null;
    }
    toast.success(data.data.contact);
    return data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.ack_msg ||
      error.response?.data?.developer_msg ||
      error.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED;

    toast.error(errorMessage);
    return null;
  } finally {
    setTimeout(() => {
      // setLoading(false);
    }, 1000);
  }
};

export const fetchGetByIdUser = async (
  localId: string | null,
  setLoginById: TReactSetState<ILoginData | undefined>,
) => {
  const token = localStorage.getItem("token");

  try {
    const { data } = await axiosInstance.post(
      "loginId",
      {
        loginId: localId,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      },
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoginById(data.data);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    handleRefresh();

    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const upateCheckBox = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: string[],
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "contact_masters",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      lable:
        selectedOptions && selectedOptions.length > 0
          ? selectedOptions.join(",")
          : "",
    }),
  };

  setLoading(false);
  const getUUID = localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        toast.success("Label Apply successfully");
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        toast.success("Label Apply Failed");
      }
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const updateStageStatusRadioButton = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "contact_masters",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      contact_status: selectedOptions || "",
    }),
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        toast.success("Status Apply successfully");
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        toast.success("Status Apply Failed");
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};
export const updateSourceTypeRadioButton = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "contact_masters",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      source_type_id: selectedOptions || "",
    }),
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        toast.success("Source Apply successfully");
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        toast.error("Source Apply Failed");
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const updateUserCheckBox = async (
  hasOneData: any | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "contact_masters",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      assinged_to_work_a_application_id:
        selectedOptions.length > 0 ? selectedOptions.join(",") : "",
      is_unread: "1",
    }),
  };

  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        toast.success("Team member assigned successfully");
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        toast.success("Team member assigned failed");
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const fetchAllCompanyApi = async (
  setCompanyTeamLists: TReactSetState<any[]>,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const data = await axiosInstance.post("my-team", requestData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyTeamLists([]);
      return;
    }

    // const filteredTeamList = data.data.data.item.filter(
    //   (user: any) => String(user.id) !== String(getUUID)
    // );

    setCompanyTeamLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchStageStatusApi = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  current_status: number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: "1",
    a_application_login_id: getUUID,
    action_flag: "update",
    current_status: current_status || "",
  };
  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setStageStatusList([]);
    }
    setStageStatusList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateIsUnRead = async (
  contactId: number | undefined,
  setLoading: TReactSetState<boolean>,
  request_flag: number,
) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const requestedData = {
    a_application_login_id: getUUID,
    contact_master_id: contactId,
    request_flag: request_flag,
  };

  setLoading(false);
  try {
    const { data } = await axiosInstance.post("readContact", requestedData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
      } else {
        setLoading(false);
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const logOutApi = async (
  setIsCloseConfirmation?: TReactSetState<boolean>,
) => {
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  const requestData = { a_application_login_id: getUUID, request_flag: 1 };
  try {
    const res = await axiosInstance.post("logout", requestData, {
      headers: {
        Authorization: `${token}`,
      },
    });
    if (res?.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return { success: true };
    }
    if (setIsCloseConfirmation) setIsCloseConfirmation(true);
    return { success: false, message: res?.data?.ack_msg || "Logout failed" };
  } catch (error: any) {
    return { success: false, message: error?.message || "Unknown error" };
  }
};

export const deleteContactApi = async (
  contactId: number | number[] | undefined,
) => {
  const requestData = {
    contactId,
  };
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  try {
    const data = await axiosInstance.post("deleteContact", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.data.ack_msg);
      return true;
    } else {
      toast.error(data.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deleteMultipleContactAPI = async () => {
  try {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    const response = await await axiosInstance.post("", {});
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(response.data.ack_msg);
      return true;
    } else {
      toast.error(response.data.ack_msg);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const pinContactApi = async (
  contactId: number | undefined,
  request_flag: number,
) => {
  const a_application_login_id = localStorage.getItem("UUID");

  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  try {
    const requestedData = {
      a_application_login_id: a_application_login_id?.toString(),
      contact_master_id: contactId,
      request_flag: request_flag,
    };
    const data = await axiosInstance.post("pinUnpinContact", requestedData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const readUnreadContactApi = async (
  contactId: number | undefined,
  request_flag: number, // 0 => Read, 1 => Unread
): Promise<boolean> => {
  if (!contactId) {
    toast.error("Invalid Contact ID.");
    return false;
  }

  const a_application_login_id = localStorage.getItem("UUID");
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const requestedData = {
    a_application_login_id: a_application_login_id?.toString(),
    contact_master_id: contactId,
    request_flag: request_flag,
  };

  try {
    const { data } = await axiosInstance.post("readContact", requestedData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(
        request_flag === 0
          ? "Contact marked as read."
          : "Contact marked as unread.",
      );
      return true;
    } else {
      toast.error(data?.ack_msg || "Failed to update contact status.");
      return false;
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const archiveUnArchiveContactApi = async (
  contactId: number | number[] | undefined,
  request_flag: number, // 0 => Unarchive (not archived), 1 => Archive
): Promise<boolean> => {
  if (!contactId) {
    toast.error("Invalid Contact ID.");
    return false;
  }

  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const requestedData = {
    contact_master_id: contactId,
    request_flag: request_flag,
  };

  try {
    const { data } = await axiosInstance.post("ArchiveContact", requestedData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(
        request_flag === 1
          ? "Contact marked as archived."
          : "Contact marked as unarchived.",
      );
      return true;
    } else {
      toast.error(data?.ack_msg || "Failed to update contact status.");
      return false;
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const fetchCompanyTeamApi = async (
  setCompanyTeamLists: TReactSetState<ICompanyTeam[]>,
  companyMastersId: number,
  searchTerm: string,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    company_masters_id: companyMastersId,
    searchTerm: searchTerm,
  };
  try {
    const data = await axiosInstance.post("my-team", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyTeamLists([]);
    }
    setCompanyTeamLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCompanyKeyApi = async (
  setCompanyLists: TReactSetState<ICompany | undefined>,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("company", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyLists(undefined);
    }

    setCompanyLists(data.data.data.item[0]);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// Function to fetch attendance history for a team member
export const fetchAttendanceHistory = async (
  setAttendanceHistory: TReactSetState<IAttendanceHistory[]>,
  selectDate: Date[] | undefined,
  companyTeamInfoId: number | undefined,
) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  if (!selectDate || selectDate.length !== 2 || !companyTeamInfoId) {
    setAttendanceHistory([]);
    return;
  }

  const startDate = selectDate[0]
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
  const endDate = selectDate[1]
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");

  const requestData = {
    a_application_login_id: getUUID,
    startDate: startDate,
    endDate: endDate,
    team_member_id: companyTeamInfoId,
  };

  try {
    const response = await axiosInstance.post(
      "attendance-history",
      requestData,
    );

    const result = response.data;
    if (result.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setAttendanceHistory([]);
      return;
    }

    // Normalize the data to match IAttendanceHistory interface
    const normalizedData: IAttendanceHistory[] = result.data.map(
      (item: any) => ({
        date: item.date,
        messages: item.messages.map((msg: any) => ({
          attendance_status: msg.attendance_status, // 1 for IN, 2 for OUT
          attendanceTime: msg.time,
          total_working_hour: msg.total_working_hour || "00:00:00",
        })),
      }),
    );

    setAttendanceHistory(normalizedData);
  } catch (error: any) {
    console.error("Error fetching attendance history:", error);
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setAttendanceHistory([]);
  }
};

export const exportContact = async (
  term: string,
  filterData?: any,
  checkedOptionsLabel?: any,
  checkedSourceTypes?: any,
  startSearchDate?: TFilterDate,
  endSearchDate?: TFilterDate,
  checkedOptionsStageStatus?: any,
  checkedOptionsUser?: any,
  isPin?: number,
  isUnread?: number,
  labelId?: number | null | undefined,
  sourceId?: number | null | undefined,
  stageStatusId?: number | null | undefined,
  isPinByApplicationId?: string | undefined,
  isArchive?: number,
  selectedActiveId?: number | string | undefined | null,
  selectedDays?: number | string | undefined | null,
  assignedByMultiTeamMember?: any,
  createdByMultiTeamMember?: any,
  labelwiseContactShowAndOrNot?: number,
  checkedOptionsContactassignOrNot?: any[],
  setShareId?: TReactSetState<boolean>,
) => {
  try {
    const getUUID = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("export-contact", {
      a_application_login_id: getUUID,
      searchTerm: term || "",
      labelFilter: checkedOptionsLabel,
      sourceTypeFilter: checkedSourceTypes,
      country: filterData?.country,
      state: filterData?.state,
      city: filterData?.city,
      area: filterData?.area,
      startDate: startSearchDate,
      endDate: endSearchDate,
      statusFilter: checkedOptionsStageStatus,
      userFilter: checkedOptionsUser,
      isPin: isPin,
      isUnread: isUnread,
      labelId: labelId,
      sourceId: sourceId,
      stageStatusId: stageStatusId,
      isPinByApplicationId: isPinByApplicationId,
      isArchive: isArchive,
      selectedActiveId: selectedActiveId,
      selectedDays: selectedDays,
      assignedByMultiTeamMember,
      createdByMultiTeamMember,
      labelwiseContactShowAndOrNot,
      checkedOptionsContactassignOrNot
    });
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = data.data.fileUrl;
    link.download = data.data.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setShareId && setShareId(false);
  }
};

export interface IBulkSelectActionPerformAppliedFilers {
  searchTerm: string;
  filterData: {
    country?: string | number | null | undefined;
    state?: string | number | null | undefined;
    city?: string | number | null | undefined;
    area?: string | number | null | undefined;
    active?: string | number | null | undefined;
  } | null;
  labelFilter: any[];
  sourceTypeFilter: any[];
  startDate: TFilterDate;
  endDate: TFilterDate;
  statusFilter: any[];
  checkedOptionsUser: any[];
  selectedCategoryId: null;
  selectedProductId: null;
  isPin?: number;
  isUnread?: number;
  labelId?: number | null | undefined;
  sourceId?: number | null | undefined;
  stageStatusId?: number | null | undefined;
  isPinByApplicationId?: string | undefined;
  isArchive?: number;
  selectedActiveId?: number | string | undefined | null;
  selectedDays?: string | number | null | undefined;
  assignedByMultiTeamMember?: any[] | undefined;
  createdByMultiTeamMember?: any[] | undefined;
  labelwiseContactShowAndOrNot?: number;
  isOverrideExistingContactCheckbox?: boolean;
}
export const updateBulkSelectionActionPerformInContact = async (
  setLoading: TReactSetState<boolean>,
  appliedFilers: IBulkSelectActionPerformAppliedFilers,
  updateCollection: string | number[],
  appliedTo: number | string | undefined | number[],
  on_effect:
    | "team_assignment"
    | "label_assignmet"
    | "source_assignement"
    | "status_assignment"
    | "readunread_contact",
) => {
  try {
    setLoading(true);
    const apiRoutesDefined = {
      team_assignment: "assign-contact",
      label_assignmet: "assign-lable",
      source_assignement: "assign-source",
      status_assignment: "assign-status",
      readunread_contact: "readunread-contact",
    };
    const getUUID = localStorage.getItem("UUID");
    const { data } = await axiosInstance.post(apiRoutesDefined[on_effect], {
      appliedFilers,
      updateCollection,
      appliedTo,
      a_application_login_id: getUUID,
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  } finally {
    setLoading(false);
  }
};


export const fetchTaskCategoryApi = async (
  setTaskCategoryList: TReactSetState<ITaskCategoryView[]>,
  setLoading: TReactSetState<boolean>,
) => {

  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID
  };

  try {

    const data = await axiosInstance.post(
      "getTaskCategory",
      requestData
    );

    if (data.status === 200) {

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setTaskCategoryList([]);
      }

      setLoading(true);
      setTaskCategoryList(data.data.data?.item);

    }

  } catch (error: any) {

    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);

  }
};