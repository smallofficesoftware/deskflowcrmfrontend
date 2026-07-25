import { toast } from "react-toastify";
import { formatDateTimeSendDataBase } from "../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TFilterDate } from "../../../helpers/AppInterface";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { IStageStatusView } from "../../left-side/header/Setting/stage-status/StageStatusController";
import { IReminder } from "../RightViewController";

export interface IInquiry {
  id: number;
  contact_master_id: number;
  product_name: string;
  category_name: string;
  contact_company_name: string;
  product_id: number;
  category_id: number;
  description: string;
  qty: number;
  source_type_id: number;
  label_id: number;
  inquiry_date_time: string;
  create_date_time: string;
  a_application_login_id: number;
  company_masters_id: number;
  static: number;
  source_name: string;
  source_name_color: string;
  contact_person_name: string;
  contact_person_number: string;
  contact_status: number;
  stage_status_color: string;
  stage_status_name: string;
  label_color: string;
  label_name: string;
  is_reminder: number;
  reminder_remark: string;
  reminder_data_time: string;
  inquiry_assigned_team_member: string;
  assined_team_person_list: string;
  inq_created_by_name: string;
}

export const fetchInquiryApi = async (
  page: number,
  term: string,
  setUsers: TReactSetState<IInquiry[]>,
  itemsPerPage: number,
  setNoDataFound: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  token: string | null,
  contact_master_id: number,
  setInquiryId: TReactSetState<number | undefined>,
  setSelectedLabelIds: TReactSetState<any>,
  setCheckToken: TReactSetState<boolean>,
  labelFilter?: any,
  sourceTypeFilter?: any,
  startSearchDate?: TFilterDate,
  endSearchDate?: TFilterDate,
  checkedOptionsStageStatus?: any,
  selectedCategoryId?: any,
  selectedProductId?: any,
  userFilter?: any,
) => {
  const start: number = page * itemsPerPage;
  setLoading(true);

  try {
    const getUUID = await localStorage.getItem("UUID");
    const { data } = await axiosInstance.post("inquiry", {
      ul: start, // Upper limit based on page number
      ll: itemsPerPage, // Lower limit based on page number
      searchTerm: term,
      a_application_login_id: getUUID,
      contact_master_id: contact_master_id,
      labelFilter: labelFilter,
      sourceTypeFilter: sourceTypeFilter,
      startDate: startSearchDate,
      endDate: endSearchDate,
      statusFilter: checkedOptionsStageStatus,
      searchCategory: selectedCategoryId?.value,
      searchProduct: selectedProductId?.value,
      userFilter: userFilter,
    });
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const fetchedItems = data.data?.item || [];
        if (page === 0) {
          setUsers(fetchedItems);
          setInquiryId(fetchedItems[0]?.id);
          setSelectedLabelIds(fetchedItems[0]?.label_id);
        } else {
          setUsers((prevUsers) => [...prevUsers, ...fetchedItems]);
        }
        if (fetchedItems.length === 0 || fetchedItems.length < itemsPerPage) {
          setNoDataFound(true);
        } else {
          setNoDataFound(false);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      setCheckToken(true);
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const updateCheckBox = async (
  hasOneData: number | undefined,
  selectedOptions: any,
) => {
  const requestData = {
    table: "inquiries",
    where: `{"id":"${hasOneData}"}`,
    data: `{"label_id":"${selectedOptions}"}`,
  };
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateStageStatusForInquiriesRadioButton = async (
  hasOneData: number | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "inquiries",
    where: `{"id":"${hasOneData}"}`,
    data: `{"contact_status":"${selectedOptions}"}`,
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
export const fetchStageStatusForInquiryApi = async (
  setStageStatusList: TReactSetState<IStageStatusView[]>,
  current_status: number | undefined,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    status_type: "2",
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

export const createReminderForInquiry = async (
  insertObj: IReminder,
  contactId: number | undefined,
  inquiryId: number | undefined,
  setIsReminderConfirmation: TReactSetState<boolean>,
  setRefreshInquiry: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
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
      reference_id: inquiryId,
      reference_table: `inquiries`,
    }),
  };
  try {
    const data = await axiosInstance.post("commonCreate", requestData);
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsReminderConfirmation(false);
      const requestDataMsg = {
        table: "inquiries",
        where: `{"id":${inquiryId}}`,
        data: `{"is_reminder":"1"}`,
      };
      try {
        const data = await axiosInstance.post("commonUpdate", requestDataMsg);
        if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setRefreshInquiry(true);
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

export const handleChangeStatusOfReminderForInquiry = async (
  inquiryId: number | undefined,
  setIsReminderConfirmationStatus: TReactSetState<boolean>,
  setRefreshInquiry: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const formattedDateTime = formatDateTimeSendDataBase(new Date());
  const requestData = {
    table: "reminder_messages",
    where: `{"a_application_login_id":"${getUUID}","reference_id":"${inquiryId}","reference_table":"inquiries","status":"0"}`,
    data: `{"status":"1","completed_date_time":"${formattedDateTime}"}`,
  };
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsReminderConfirmationStatus(false);

        const requestData = {
          table: "inquiries",
          where: `{"id":"${inquiryId}"}`,
          data: JSON.stringify({
            is_reminder: 0,
          }),
        };
        try {
          const data = await axiosInstance.post("commonUpdate", requestData);
          if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setRefreshInquiry(true);
            return true;
          } else {
            return false;
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

// export const handleDeleteInquiry = async (
//   inquiryId: number | undefined,
//   setIsDeleteConfirmation: TReactSetState<boolean>,
//   setInquiryList: TReactSetState<IInquiry[]>,
//   setLoading: TReactSetState<boolean>,
// ) => {

//   const requestData = {
//     table: "inquiries",
//     where: `{"id":${inquiryId}}`,
//     data: `{"isDelete":"1"}`,
//   };
//   const getUUID = localStorage.getItem("UUID")

//   try {
//     const data = await axiosInstance.post("commonUpdate", requestData);
//     if (data.data.code === 200) {
//       if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
//         setIsDeleteConfirmation(false);
//       fetchInquiryApi(
//             0,
//             "",
//             setInquiryList,
//             itemsPerPage,
//             setNoDataFound,
//             setLoading,
//             token,
//             contactData?.id,
//             setInquiryId,
//             setSelectedLabelIds,
//             setNoDataFound1
//           );
//         toast.success("Inquiry Deleted Successfully");

//       } else {
//         toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//       }
//     }
//   } catch (error: any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//   }
// };

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

export const updateUserCheckBox = async (
  hasOneData: any | undefined,
  selectedOptions: any,
  setLoading: TReactSetState<boolean>,
) => {
  const requestData = {
    table: "inquiries",
    where: JSON.stringify({ id: hasOneData }),
    data: JSON.stringify({
      inquiry_assigned_team_member:
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
