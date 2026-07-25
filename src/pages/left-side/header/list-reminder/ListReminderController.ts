import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../helpers/AppConstants";
import { TFilterDate } from "../../../../helpers/AppInterface";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ILabel {
  label_name: string;
  color: string;
}

export interface ISource {
  source_name: string;
  color: string;
}

export interface IStatus {
  name: string;
  color: string;
}

export interface IReminderList {
  id: number;
  reminder_data_time: string;
  remark: string;
  status: number;
  person_name: string;
  company_name: string;
  contact_message: string;
  completed_date_time: string | null;
  username: string;
  contact_masters_id: number;
  isDue: number;
  reference_id: number;
  reference_table: string;
  assigned_to_name: string;
  assigned_to: number;
  mobile_number: string;
  company_masters_id: number;
  create_date_time: string;
  lable: string;
  isDelete: number;
  isActive: number;
  a_application_login_id: number;
  company_flag: number;
  contact_status: number;
  created_date_time?: string;
  task_id?: number;
  task_management_id?: number;
  task_from_date?: string;
  task_end_date?: string;
  task_assigned_team_member?: string;
  assinged_to_work_a_application_id: string;
  task_management_title?: string;
  task_management_remark?: string;
  labels?: ILabel[];
  sources?: ISource;
  status_name?: IStatus;
}

// Utility function to format names to proper case
const toProperCase = (name: string): string => {
  if (!name) return name;
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Interface for contact details response
interface IContactDetails {
  contact_masters_id?: number;
  to_customer_name?: string;
  to_customer_phone?: string;
  person_name?: string;
  mobile_number?: string;
}

// Utility function to fetch contact details based on reference_table and reference_id
export const fetchContactDetailsByReference = async (
  referenceTable: string | null | undefined,
  referenceId: number | null | undefined,
): Promise<{ contactName: string | null; contactNumber: string | null }> => {
  if (!referenceTable || !referenceId) {
    return { contactName: null, contactNumber: null };
  }
  const getUUID = await localStorage.getItem("UUID");
  let table: string;
  let columns: string;

  switch (referenceTable) {
    case "contact_message_histories":
      table = "contact_message_histories";
      columns = "contact_masters_id";
      break;
    case "cart_quotation":
    case "cart_order":
    case "cart_invoice":
    case "cart_purchase_order":
      table = "carts";
      columns = "to_customer_name, to_customer_phone";
      break;
    case "inquiries":
      table = "inquiries";
      columns = "contact_masters_id";
      break;
    default:
      return { contactName: null, contactNumber: null };
  }

  try {
    const { data } = await axiosInstance.post("commonGet", {
      table,
      columns,
      where: `{"id":${referenceId}}`,
    });

    if (
      data.code === 200 &&
      data.ack === DEFAULT_STATUS_CODE_SUCCESS &&
      data.data.length > 0
    ) {
      const result = data.data[0] as IContactDetails;

      const contactName = result.to_customer_name || null;
      const contactNumber = result.to_customer_phone || null;

      return {
        contactName:
          contactName && contactName.trim() ? toProperCase(contactName) : null,
        contactNumber:
          contactNumber && contactNumber.trim() ? contactNumber : null,
      };
    } else {
      return { contactName: null, contactNumber: null };
    }
  } catch (error: any) {
    console.error("Error fetching contact details:", error);
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return { contactName: null, contactNumber: null };
  }
};

const processRemindersWithContactNumbers = async (
  reminders: any[],
  setLoading: TReactSetState<boolean>,
): Promise<IReminderList[]> => {
  // alert("dddddd")
  return await Promise.all(
    reminders.map(async (reminder) => {
      let contactNumber: string | null = null;
      let personName: string | null = null;
      let lable: string | null = null;
      let contact_status: string | null = null;
      let assinged_to_work_a_application_id: string | null = null;

      let contactMessage = reminder.contact_message || "";

      // Step 3: Fallback to parsing from remark or contact_message if still no valid data
      if (!personName || !contactNumber) {
        const remark = reminder.remark || "";
        const nameMatch =
          remark.match(/Name\s*:\s*([^\n]+)/) ||
          contactMessage.match(/Name\s*:\s*([^\n]+)/);
        const numberMatch =
          remark.match(/Mobile No\.\s*:\s*([[^\n]+)/) ||
          contactMessage.match(/Mobile No\.\s*:\s*([^\n]+)/);

        personName = nameMatch
          ? nameMatch[1].trim()
          : reminder.person_name || null;
        contactNumber = numberMatch
          ? numberMatch[1].trim()
          : reminder.mobile_number || null;
      }

      // Format person_name to proper case if it exists
      personName = personName ? toProperCase(personName) : null;

      return {
        ...reminder,
        mobile_number: contactNumber,
        person_name: personName,
        contact_message: contactMessage || null,
        company_name: reminder.company_name || "",
        username: reminder.username || "",
        completed_date_time: reminder.completed_date_time || null,
        label: lable,
        contact_status: contact_status,
        assinged_to_work_a_application_id: assinged_to_work_a_application_id,
      };
    }),
  );
};

export const fetchReminderApi = async (
  page: number,
  itemsPerPage: number,
  setReminderList: (items: IReminderList[]) => void,
  searchDate: string | DateObject | null,
  setNoDataFound: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  reminderCheckFlag: number | boolean,
  allreminderCheckFlag: number | bigint,
  setCompanyFlag: TReactSetState<string | number | null>,
  term: string,
  typeFilter: string,
  setCounts: (counts: {
    due: number;
    future: number;
    complete: number;
  }) => void,
  assignedByMultiTeamMember?: any,
  createdByMultiTeamMember?: any,
  startSearchDate?: TFilterDate,
  endSearchDate?: TFilterDate,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const start: number = page * itemsPerPage;

  // console.log("typeFiltertypeFilter", typeFilter);

  try {
    setLoading(true);
    const formattedDate =
      searchDate instanceof DateObject ? searchDate.format("YYYY-MM-DD") : "";
    const { data } = await axiosInstance.post("reminder", {
      a_application_login_id: Number(getUUID),
      searchDate: formattedDate,
      ul: start,
      ll: itemsPerPage,
      typeFilter,
      startDate: startSearchDate,
      endDate: endSearchDate,
      reminderCheckFlag: reminderCheckFlag,
      allreminderCheckFlag: allreminderCheckFlag,
      searchTerm: term,
      assignedByMultiTeamMember: assignedByMultiTeamMember,
      createdByMultiTeamMember: createdByMultiTeamMember,
    });

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        // const processedReminders = await processRemindersWithContactNumbers(
        //   data.data.item || [],
        //   setLoading
        // );

        setCompanyFlag(data.data.company_flag || null);
        setCounts(data.data.counts);

        if (page === 0) {
          setReminderList(data.data.item || []);
        } else {
          setReminderList(data.data.item || []);
        }

        setNoDataFound(data.data.item || [].length === 0);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setNoDataFound(true);
      }
    }
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setNoDataFound(true);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

const formatToDbDateTime = (dateTimeStr: string): string => {
  if (!dateTimeStr) return "";
  if (dateTimeStr.includes("T")) {
    return dateTimeStr.replace("T", " ") + ":00";
  }
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const createRescheduleReminder = async (
  reminderId: number | undefined,
  insertObj: any,
  setIsReminderConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setReminderList: TReactSetState<IReminderList[]>,
  setNoDataFound: TReactSetState<boolean>,
  setCompanyFlag: TReactSetState<string | number | null>,
  typeFilter: string,
  searchDate: string | DateObject | null,
  setCounts: (counts: {
    due: number;
    future: number;
    complete: number;
  }) => void,
) => {
  console.log("insertObj", insertObj);

  const formattedDateTime = formatToDbDateTime(insertObj.dateTime);

  const requestData = {
    table: "reminder_messages",
    where: `{"id":"${reminderId}"}`,
    data: JSON.stringify({
      reminder_data_time: formattedDateTime,
      remark: insertObj.remark,
      status: "0",
      assigned_to: insertObj.selectedCategory.value,
      assigned_to_name: insertObj.selectedCategory.label,
    }),
  };
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    console.log("createRescheduleReminder", data);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsReminderConfirmation(false);
      await fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        searchDate,
        setNoDataFound,
        setLoading,
        0,
        0,
        setCompanyFlag,
        "",
        typeFilter,
        setCounts,
      );
      toast.success("Reminder rescheduled successfully");
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createReminderForMy = async (
  insertObj: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: { value: number; label: string } | null;
    referenceTable?: string | null;
    referenceId?: number | null;
    contactMastersId?: number | null;
    personName?: string;
    mobileNumber?: string;
    contactMessage?: string;
    companyMastersId?: number;
    aApplicationLoginId?: number;
    assignedTo?: number;
    assignedToName?: string;
  },
  setIsReminderConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setReminderList: TReactSetState<IReminderList[]>,
  setNoDataFound: TReactSetState<boolean>,
  setCompanyFlag: TReactSetState<string | number | null>,
  typeFilter: string,
  searchDate: string | DateObject | null,
  setCounts: (counts: {
    due: number;
    future: number;
    complete: number;
  }) => void,
) => {
  if (!insertObj.selectedCategory?.value) {
    toast.error("Please select a team member");
    return;
  }

  const formattedDateTime = formatToDbDateTime(insertObj.dateTime);
  const getUUID = await localStorage.getItem("UUID");

  const requestData = {
    table: "reminder_messages",
    data: JSON.stringify({
      reminder_data_time: formattedDateTime,
      remark: insertObj.remark,
      a_application_login_id: insertObj.aApplicationLoginId || Number(getUUID),
      assigned_to: insertObj.assignedTo || insertObj.selectedCategory.value,
      assigned_to_name:
        insertObj.assignedToName || insertObj.selectedCategory.label,
      reference_table: insertObj.referenceTable || undefined,
      reference_id: insertObj.referenceId || undefined,
      contact_masters_id: insertObj.contactMastersId ?? 0,
      person_name: insertObj.personName
        ? toProperCase(insertObj.personName)
        : null,
      mobile_number: insertObj.mobileNumber || null,
      contact_message: insertObj.contactMessage || null,
      company_masters_id: insertObj.companyMastersId || null,
      status: "0",
    }),
  };

  try {
    setLoading(true);
    const { data } = await axiosInstance.post("commonCreate", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsReminderConfirmation(false);
      await fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        searchDate,
        setNoDataFound,
        setLoading,
        0,
        0,
        setCompanyFlag,
        "",
        typeFilter,
        setCounts,
      );
      toast.success("Reminder created successfully");
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const updateContactFormReminder = async (
  contactId: number | undefined,
): Promise<boolean> => {
  console.log("reminderupdatekarva ave atyre is_reminder:0 karva", contactId);

  const requestData = {
    table: "contact_message_histories",
    where: `{"id":${contactId}}`,
    data: `{"is_reminder":"0"}`,
  };
  const getUUID = await localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    console.log("updateContactFormReminder", data);

    return data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS;
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const updateOrderFormReminder = async (
  contactId: number | undefined,
): Promise<boolean> => {
  const requestData = {
    table: "carts",
    where: `{"id":${contactId}}`,
    data: `{"is_reminder":"0"}`,
  };
  const getUUID = await localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    return data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS;
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const updateInquiryFormReminder = async (
  contactId: number | undefined,
): Promise<boolean> => {
  const requestData = {
    table: "inquiries",
    where: `{"id":${contactId}}`,
    data: `{"is_reminder":"0"}`,
  };
  const getUUID = await localStorage.getItem("UUID");

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    return data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS;
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return false;
  }
};

export const handleDeleteReminder = async (
  reminderId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setReminderList: TReactSetState<IReminderList[]>,
  setNoDataFound: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  isReminderConfirmationStatusData: IReminderList | undefined,
  setCompanyFlag: TReactSetState<string | number | null>,
  typeFilter: string,
  searchDate: string | DateObject | null,
  setCounts: (counts: {
    due: number;
    future: number;
    complete: number;
  }) => void,
) => {
  const requestData = {
    table: "reminder_messages",
    where: `{"id":${reminderId}}`,
    data: `{"isDelete":"1"}`,
  };
  const getUUID = await localStorage.getItem("UUID");

  try {
    setLoading(true);
    const { data } = await axiosInstance.post("commonUpdate", requestData);

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);

      if (isReminderConfirmationStatusData?.reference_table) {
        switch (isReminderConfirmationStatusData.reference_table) {
          case "contact_message_histories":
            await updateContactFormReminder(
              isReminderConfirmationStatusData.reference_id,
            );
            break;
          case "cart_quotation":
          case "cart_order":
          case "cart_invoice":
          case "cart_purchase_order":
            await updateOrderFormReminder(
              isReminderConfirmationStatusData.reference_id,
            );
            break;
          case "inquiries":
            await updateInquiryFormReminder(
              isReminderConfirmationStatusData.reference_id,
            );
            break;
          default:
            break;
        }
      }
      await fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        searchDate,
        setNoDataFound,
        setLoading,
        0,
        0,
        setCompanyFlag,
        "",
        typeFilter,
        setCounts,
      );
      toast.success("Reminder deleted successfully");
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};
