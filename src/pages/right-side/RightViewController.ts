import { toast } from "react-toastify";
import {
  formatDateTimeSendDataBase,
  formatDateYMD,
  handleRefresh,
} from "../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_ERROR,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";
import { IUserList } from "../left-side/LeftSideController";
import { ICompany } from "../left-side/list-company/ListCompanyController";

export interface IMessageList {
  id: number;
  description: string;
  current_status: number;
  created_date_time: string;
  s_timestemp?: Date;
  company_masters_id?: number;
  contact_masters_id: number;
  message_side?: number;
  lable?: string;
  message_type_id: number;
  isReminder: number;
  reminder_data_time: string;
  reminder_remark: string;
  media_name: string;
  media_url: string;
  application_login_name: string;
  contact_name: string;
  entry_flag: number;
  is_reminder: number;
  pinned_message: string | number;
  isDelete?: number;
  deleted_By: number | string;
}
export interface IInsertObj {
  message_side?: number;
  description: string;
  contact_masters_id?: number;
}

export interface IReminder {
  dateTime: string;
  remark: string;
  status: string;
  selectedCategory: any;
}

export type TMessage = {
  id: number;
  description: string;
  lable: number;
  current_status: number;
  message_type_id: number;
  created_date_time: any;
  company_masters_id: number;
  a_application_login_id: number;
  contact_masters_id: number;
  message_side: number;
  media_url: string;
  media_name: string;
  is_reminder: number;
  entry_flag: number;
  isDelete: number;
  isActive: number;
  application_login_name: string;
  contact_name: string;
  reminder_data_time: string;
  reminder_remark: string;
  isReminder: number;
  deleted_by: string | number;
  pinned_message: any;
};
export type TMessagesByDate = {
  date: string;
  messages: TMessage[];
};




export const fetchMessageData = async (
  setNoDataFound: TReactSetState<boolean>,
  term: string,
  setLoading: TReactSetState<boolean>,
  setMessageList: TReactSetState<TMessagesByDate[]>,
  setHasMore: TReactSetState<boolean>,
  currentPage: number,
  setCheckToken: TReactSetState<boolean>,
  contactMastersId: number | undefined,
  isCheckedReminder: boolean,
  isCheckedAttachment: boolean,
  selectedDates: Date[] | undefined,
  newStartDate: any,
  setGetCompanyId: TReactSetState<number>,
) => {
  const token = localStorage.getItem("token");
  try {
    const getUUID = await localStorage.getItem("UUID");
    const itemsPerPage = ITEMS_PER_PAGE;
    const start: number = currentPage * itemsPerPage;
    const payload: any = {
      contact_masters_id: contactMastersId,
      a_application_login_id: getUUID,
      filterAndSearch: {
        searchTerm: term,
      },
    };
    if (newStartDate) {
      payload.startDateForUl = newStartDate === "-1" ? "-1" : newStartDate;
    }
    if (isCheckedReminder) {
      payload.filterAndSearch.isChecked = isCheckedReminder ? 1 : 0;
    }
    if (isCheckedAttachment) {
      payload.filterAndSearch.isCheckedAttachment = isCheckedAttachment ? 1 : 0;
    }
    if (selectedDates && selectedDates.length > 0) {
      payload.filterAndSearch.selectedDates = selectedDates;
    }
    const response = await axiosInstance.post("messageHistory", payload);
    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        const newItems = response.data.data.item1;
        setGetCompanyId(response.data.data.companyId);
        if (newStartDate === "-1") {
          setMessageList(newItems);
        } else {
          setMessageList((prevMessages) => [...newItems, ...prevMessages]);
        }

        if (newItems.length === 0) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
        setNoDataFound(newItems.length === 0);
      } else {
        toast.error(response.data.ack_msg || "Unknown error occurred");
      }
    } else {
      setCheckToken(true);
      toast.error(response.data.ack_msg || "Unknown error occurred");
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || "Unknown error occurred");
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }
};
export const insertMessage = async (insertObj: IInsertObj) => {
  const getUUID = await localStorage.getItem("UUID");
  const date = new Date();
  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds(),
  ).padStart(2, "0")}`;
  const requestData = {
    table: "contact_message_histories",
    data: JSON.stringify({}),
  };

  try {
    const data = await axiosInstance.post("commonCreate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deleteContact = async (contact_id: number | undefined) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "contact_masters",
    where: `{"id":${contact_id}}`,
    data: `{"isDelete":"1"}`,
  };
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deleteMessages = async (contact_id: number | undefined) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    table: "contact_message_histories",
    where: `{"contact_masters_id":${contact_id}}`,
    data: `{"isDelete":"1"};`,
  };

  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const createReminder = async (
  insertObj: IReminder,
  contactId: number | undefined,
  messageId: number | undefined,
  setIsReminderConfirmation: TReactSetState<boolean>,
  // selectedCategory:any
) => {
  const getUUID = localStorage.getItem("UUID");
  const date = new Date(insertObj.dateTime);

  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds(),
  ).padStart(2, "0")}`;

  const requestData = {
    table: "reminder_messages",
    data: JSON.stringify({
      a_application_login_id: Number(getUUID),
      contact_masters_id: contactId,
      reminder_data_time: formattedDateTime,
      assigned_to: insertObj.selectedCategory?.value,
      assigned_to_name: insertObj.selectedCategory?.label,
      remark: insertObj.remark,
      reference_id: messageId,
      reference_table: "contact_message_histories",
    }),
  };
  try {
    const data = await axiosInstance.post("commonCreate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsReminderConfirmation(false);
      const requestDataMsg = {
        table: "contact_message_histories",
        where: `{"id":${messageId}}`,
        data: `{"is_reminder":"1"}`,
      };
      try {
        const data = await axiosInstance.post("commonUpdate", requestDataMsg);
        if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          return true;
        } else {
          return false;
        }
      } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchGetByIdUser = async (setLoginById: TReactSetState<any>) => {
  const token = await localStorage.getItem("token");
  const localId = await localStorage.getItem("UUID");
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
    } else {
      handleRefresh();
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCompanyForRightSideViewApi = async (
  setCompanyLists: TReactSetState<ICompany[]>,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("company", requestData, {
      headers: {
        Authorization: `${token}`,
      },
    });
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCompanyLists([]);
    }

    setCompanyLists(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const insertAttendance = async (
  checkAttendance: number,
  setShowAttendancePopup: any,
  compulsaryAttendance: any,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    attendance_status: checkAttendance,
    a_application_login_id: getUUID,
    device_type: 1,
  };

  try {
    const data = await axiosInstance.post("check-attendance", requestData);

    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // if (compulsaryAttendance) {
      //   setShowAttendancePopup(true);
      // }
      handleRefresh();
    }
    toast.success(data.data.ack_msg);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// db mathi last entry lai aave che
export const viewAttendanceStatus = async (
  setSavedAttendance: TReactSetState<number>,
  setLoading: TReactSetState<boolean>,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  const requestedData = {
    request_flag: 1,
    a_application_login_id: getUUID,
  };
  try {
    setLoading(true);
    const data = await axiosInstance.post("view-attendance", requestedData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      return;
    }

    setSavedAttendance(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }
};
export const fetchReminderCount = async (
  setReminderCount: TReactSetState<number>,
  contactId?: number,
) => {
  const uuid = localStorage.getItem("UUID");
  const currentDate = new Date();
  const requestData = {
    table: "reminder_messages",
    columns: "reminder_data_time",
    where: [
      "isDelete=0",
      `a_application_login_id=${uuid}`,
      "status = 0",
      "is_reminder_app_flag = 0",
      `reminder_data_time < ${formatDateTimeSendDataBase(currentDate)}`,
    ],
    order: JSON.stringify({ id: "DESC" }),
    request_flag: 0,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    // return response;

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const data = response.data.data || [];

      // Count reminders where date is *before* current date (past reminders)

      setReminderCount(data.length);
    }
  } catch (error) {
    console.error("Error fetching reminder count:", error);
  }
};

export const fetchTaskCount = async (
  setTaskCount: TReactSetState<number>,
  contactId?: number,
) => {
  const uuid = localStorage.getItem("UUID");
  const currentDate = formatDateYMD(new Date());

  // const whereObj = {
  //   and: [
  //     { isDelete: 0 },
  //     { task_enddate: { lt: currentDate } },
  //     {
  //       or: [{ assigned_team_member: uuid }, { a_application_login_id: uuid }],
  //     },
  //     { status: { ne: -6 } },
  //   ],
  // };

  const requestData = {
    a_application_login_id: uuid,
  };

  try {
    const response = await axiosInstance.post("get-Task-count", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const count = response.data.data?.task_count || 0;
      setTaskCount(count);
    }
  } catch (error) {
    console.error("Error fetching task count:", error);
  }
};
export const fetchSupportTicketCount = async (
  setSupportTicketCount: TReactSetState<number>,
  contactId?: number,
) => {
  const uuid = localStorage.getItem("UUID");
  const currentDate = formatDateYMD(new Date());

  const requestData = {
    a_application_login_id: uuid,
    is_support_ticket: 1,
  };

  try {
    const response = await axiosInstance.post("get-Task-count", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const count = response.data.data?.support_count || 0;
      setSupportTicketCount(count);
    }
  } catch (error) {
    console.error("Error fetching task count:", error);
  }
};
export const fetchContact = async (
  setContactData: TReactSetState<IUserList | undefined>,
  contactId?: number,
) => {
  try {
    const UUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    const requestData = {
      table: "a_application_logins",
      where: JSON.stringify({ id: UUID }),
      columns: "recovery_mobile,username,recovery_email",
    };

    const a_application_mobile = await axiosInstance.post(
      "mainCommonGet",
      requestData,
    );

    if (a_application_mobile.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const requestData = {
        table: "contact_masters",
        where: JSON.stringify({
          isDelete: 0,
          mobile_number: a_application_mobile.data.data[0].recovery_mobile,
        }),

        // columns: "id",
      };
      const contact_check = await axiosInstance.post("commonGet", requestData);

      if (contact_check.data.ack == DEFAULT_STATUS_CODE_SUCCESS) {
        setContactData(contact_check.data.data[0]);
      } else if (contact_check.data.ack == DEFAULT_STATUS_CODE_ERROR) {
        const requestDataCreateContact = {
          person_name: `Self-${a_application_mobile.data.data[0].username}`,
          mobile_number: a_application_mobile.data.data[0].recovery_mobile,
          email_id: a_application_mobile.data.data[0].recovery_email,
          a_application_login_id: UUID,
          is_unread: 1,
        };
        const { data } = await axiosInstance.post(
          "createContact",
          requestDataCreateContact,
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
          setContactData(data.data);
        } else {
          console.error("createContact API error:", data.ack_msg);
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } else {
      return "";
    }
  } catch (e) {
    console.log(e);
  }
};

export const pinUnpinContactApi = async (
  contact_master_id: number,
  messageId: number,
  request_flag: number,
) => {
  const a_application_login_id = localStorage.getItem("UUID");

  try {
    const requestData = {
      a_application_login_id: a_application_login_id?.toString(),
      contact_master_id: contact_master_id,
      messageId: messageId,
      request_flag: request_flag,
    };

    const response = await axiosInstance.post(
      "pinUnpinContactMessage",
      requestData,
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return true;
    } else {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;
    }
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const getContactPinnedMessage = async (
  setPinnedMessageContent: TReactSetState<string>,
  contact_id: string | number | undefined,
) => {
  const requestData = {
    table: "contact_masters",
    columns: "pinned_message",
    where: ["isDelete=0", `id=${contact_id}`],
    request_flag: 0,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const pinnedMessageId = response.data?.data?.[0]?.pinned_message;
      // console.log("pinnedMessageId", pinnedMessageId);

      // agar pinned_message_id mil gaya to second API call
      if (pinnedMessageId) {
        const messageRequestData = {
          table: "contact_message_histories",
          columns: "description",
          where: ["isDelete=0", `id=${pinnedMessageId}`],
          request_flag: 0,
        };

        const messageResponse = await axiosInstance.post(
          "commonGet",
          messageRequestData,
        );

        if (messageResponse.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const description =
            messageResponse.data?.data?.[0]?.description || "";

          setPinnedMessageContent(description);
        }
      } else {
        setPinnedMessageContent("");
      }
    }
  } catch (error) {
    console.error("Error fetching pinned message:", error);
  }
};

export const fetchDynamicOptions = async (
  setDynamicOptions: (data: []) => void,
  searchValue: string,
) => {
  const a_application_login_id = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const requestData = {
    search_term: searchValue,
    a_application_login_id
  };

  try {
    const response = await axiosInstance.post("get-dynamic-options", requestData, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": a_application_login_id,
      }
    },);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // console.log("wowwww", response.data.data.item);
      setDynamicOptions(response.data.data.item);
    } else {
      setDynamicOptions([]);
    }
  } catch (error) {
    console.error("Error fetching Dynamic Options:", error);
  }
};