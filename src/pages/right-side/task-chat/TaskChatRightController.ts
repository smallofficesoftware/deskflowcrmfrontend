import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_ERROR,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { IUserList } from "../../left-side/LeftSideController";
export interface IStageStatusView {
  order_type: number;
  name: string;
  id: number;
  color: string | undefined | null;
  display_order_type: number;
  change_status_team_ids: string;
  show_status_data_team_ids: string;
  status_type: string | number;
}
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

export type TMessageTask = {
  id: number;
  description: string;
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
  task_id: number;
};

interface CompleteReminderParams {
  reminderId: number | undefined;
  userUUID: string;
  taskId: number | undefined;
  setNoDataFound: TReactSetState<boolean>;
  setLoading: TReactSetState<boolean>;
  setMessageList: TReactSetState<TMessagesByDate[]>;
  setHasMore: TReactSetState<boolean>;
  currentPage: number;
  checkedReminder: boolean;
  checkedAttachment: boolean;
  selectDate: Date[];
  startDateForUl: string;
}

export type TMessagesByDate = {
  date: string;
  messages: TMessageTask[];
};

export const fetchTaskMessageData = async (
  setNoDataFound: TReactSetState<boolean>,
  term: string,
  setLoading: TReactSetState<boolean>,
  setMessageList: TReactSetState<TMessagesByDate[]>,
  setHasMore: TReactSetState<boolean>,
  currentPage: number,
  contactMastersId: number | undefined,
  isCheckedReminder: boolean,
  isCheckedAttachment: boolean,
  selectedDates: Date[] | undefined,
  newStartDate: any
) => {
  const token = localStorage.getItem("token");
  try {
    const getUUID = await localStorage.getItem("UUID");
    const itemsPerPage = ITEMS_PER_PAGE;
    const start: number = currentPage * itemsPerPage;
    const payload: any = {
      task_id: contactMastersId,
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
    const response = await axiosInstance.post("taskMessageHistory", payload);
    if (response.data.code === 200) {
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(true);
        const newItems = response.data.data.item1;
        setMessageList(newItems);
        // if (newStartDate === "-1") {
        //   setMessageList(newItems);
        // } else {
        //   setMessageList((prevMessages) => [...prevMessages, ...newItems]);
        // }

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

export const updateStageStatusRadioButton = async (
  hasOneData: number | number[] | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>
) => {
  const requestData = {
    table: "task_managements",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      status: selectedOptions,
    }),
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
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

export const createReminder = async (
  insertObj: IReminder,
  taskId: number | undefined,
  messageId: number | undefined,
  setIsReminderConfirmation: TReactSetState<boolean>
  // selectedCategory:any
) => {

  const getUUID = await localStorage.getItem("UUID");
  const date = new Date(insertObj.dateTime);

  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds()
  ).padStart(2, "0")}`;

  const requestData = {
    table: "reminder_messages",
    data: JSON.stringify({
      a_application_login_id: Number(getUUID),
      task_id: taskId,
      reminder_data_time: formattedDateTime,
      assigned_to: insertObj.selectedCategory?.value,
      assigned_to_name: insertObj.selectedCategory?.label,
      remark: insertObj.remark,
      reference_id: messageId,
      reference_table: "task_message_histories",
    }),
  };
  try {
    const data = await axiosInstance.post("commonCreate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsReminderConfirmation(false);
      const requestDataMsg = {
        table: "task_message_histories",
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

export const completeReminder = async ({
  reminderId,
  userUUID,
  taskId,
  setNoDataFound,
  setLoading,
  setMessageList,
  setHasMore,
  currentPage,
  checkedReminder,
  checkedAttachment,
  selectDate,
  startDateForUl,
}: CompleteReminderParams): Promise<{ success: boolean; message?: string }> => {
  if (!reminderId) {
    return {
      success: false,
      message: "Invalid message ID for reminder completion.",
    };
  }
  const token = await localStorage.getItem("token");
  if (!userUUID) {
    return { success: false, message: "Missing user UUID." };
  }

  const date = new Date();
  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds()
  ).padStart(2, "0")}`;



  try {
    const reminderRequestData = {
      a_application_login_id: userUUID,
      reference_id: reminderId,
      reference_table: "task_message_histories",
      completed_date_time: formattedDateTime,
    };


    const response = await axiosInstance.post(
      "completeRemainderTaskMsg",
      reminderRequestData,
    );

    if (
      response.data.code === 200 &&
      response.data.ack === DEFAULT_STATUS_CODE_SUCCESS
    ) {


      // Refresh the message list
      if (taskId) {
        await fetchTaskMessageData(
          setNoDataFound,
          "",
          setLoading,
          setMessageList,
          setHasMore,
          currentPage,
          taskId,
          checkedReminder,
          checkedAttachment,
          selectDate,
          startDateForUl
        );
      }

      return { success: true, message: "Reminder completed successfully." };
    } else {
      return {
        success: false,
        message: response.data.ack_msg || "Failed to complete reminder.",
      };
    }
  } catch (error: any) {
    console.error("Error completing reminder:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to complete reminder.",
    };
  }
};

export const fetchAllCompanyApi = async (
  setCompanyTeamLists: TReactSetState<any[]>
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

export const updateUserCheckBox = async (
  hasOneData: any | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>
) => {
  const requestData = {
    table: "task_managements",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      assigned_team_member:
        selectedOptions.length > 0 ? selectedOptions.join(",") : "",
    }),
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
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

export const updateLabel = async (
  hasOneData: any | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>
) => {
  const requestData = {
    table: "task_managements",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      label_id:
        selectedOptions.length > 0 ? selectedOptions.join(",") : "",
    }),
  };
  setLoading(false);
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
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

export const fetchContact = async (
  setContactData: TReactSetState<IUserList | undefined>,
  contactId?: number
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
      requestData
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
          requestDataCreateContact
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

export const fetchStageStatusApi = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  current_status: number | undefined
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: "8",
    visiblity: "0",
    a_application_login_id: getUUID,
    action_flag: "update",
    current_status: current_status || ""
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

export const fetchStageStatusApiCustomer = async (
  setOptionRadioButtonStatusCustomer: TReactSetState<IStageStatusView[]>,
  current_status: number | undefined
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: "8",
    visiblity: "1",
    a_application_login_id: getUUID,
    action_flag: "update",
    current_status: current_status || ""
  };
  try {
    const data = await axiosInstance.post("get-status", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setOptionRadioButtonStatusCustomer([]);
    }
    setOptionRadioButtonStatusCustomer(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const openPrint = (
  id: number | undefined,
  viewFormate: number | undefined,
  onlyView?: number,
) => {
  let baseURL = window.location.origin;
  let printUrl;
  if (onlyView == 1) {
    printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${id}/1`;
  } else {
    printUrl = `${baseURL}/OrderPrintViewV${viewFormate}/${id}`;
  }

  const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

  if (myWindow) {
    if (onlyView !== 1) {
      let isPrinted = false;
      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 4000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
            console.log("waiting...");
          }
        }, 100);
      };

      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });

      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    }
  } else {
    console.error("Failed to open print");
  }
};
