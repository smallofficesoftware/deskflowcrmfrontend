import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ITaskCategoryView {
  task_category_name: string;
  id: number;
  task_color: string | undefined | null;
  created_date_time?: string;
  visibility?: number;
  is_assigned_widget: any;
}

export interface ITaskCategoryCreate {
  task_category_name: string;
  task_color: string | undefined | null;
  created_date_time?: string;
  visibility?: number;
}


export const handleDeleteTaskCategory = async (
  deleteCategoryIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setTaskCategoryList: TReactSetState<ITaskCategoryView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    a_application_login_id: getUUID,
    category_id: deleteCategoryIds
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("taskcategoryDelete", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchTaskCategoryApi(setTaskCategoryList, setLoading);
      toast.success(data.data.ack_msg);
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createTaskCategory = async (
  categoryInput: ITaskCategoryCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      categoryInput.task_category_name,
      "task_categories",
      "task_category_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "task_categories",
      data: `{"task_category_name":"${categoryInput.task_category_name}","task_color":"${categoryInput.task_color
        }","visibility":"${categoryInput.visibility
        }","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
          clearFormCallback();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Category already available");
  }
};

export const updateTaskCategory = async (
  categoryInput: ITaskCategoryCreate,
  editCategoryId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      categoryInput.task_category_name,
      "task_categories",
      "task_category_name",
      editCategoryId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "task_categories",
      where: `{"id":"${editCategoryId}"}`,
      data: `{"task_category_name":"${categoryInput.task_category_name}","task_color":"${categoryInput.task_color
        }","visibility":"${categoryInput.visibility
        }","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearFormCallback()
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Task Category already available");
  }
};

export const fetchTaskCategoryApi = async (
  setTaskCategoryList: TReactSetState<ITaskCategoryView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "task_categories",
    columns: "id,task_category_name,task_color,visibility,is_assigned_widget",
    // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData
    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false)
        setTaskCategoryList([]);
      }
      setLoading(true)
      setTaskCategoryList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
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


// export const updateUserCheckBox = async (
//   hasOneData: any | undefined,
//   selectedOptions: any,
//   setLoading: TReactSetState<boolean>,
//   setTaskCategoryList: TReactSetState<ITaskCategoryView[]>,
// ) => {
//   const requestData = {
//     table: "task_categories",
//     where: JSON.stringify({ id: hasOneData }),
//     data: JSON.stringify({
//       is_assigned_widget:
//         selectedOptions.length > 0 ? selectedOptions.join(",") : "",
//     }),
//   };
//   setLoading(false);
//   const getUUID = localStorage.getItem("UUID");
//   try {
//     const { data } = await axiosInstance.post("commonCreate", requestData);
//     if (data.code === 200) {
//       if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
//         // setLoading(true);
//         await fetchTaskCategoryApi(setTaskCategoryList, setLoading);
//       } else {
//         setLoading(false);
//         toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//       }
//     }
//   } catch (error: any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//   } finally {
//     setTimeout(() => {
//       setLoading(false);
//     }, 1000);
//   }
// };


export const updateUserCheckBox = async (
  hasOneData: any | undefined,
  request_flag: number,
  setLoading: TReactSetState<boolean>,
  setTaskCategoryList: TReactSetState<ITaskCategoryView[]>,
) => {

  const a_application_login_id = localStorage.getItem("UUID");

  try {

    const requestedData = {
      a_application_login_id:
        a_application_login_id?.toString(),

      task_category_id: hasOneData,

      request_flag: request_flag,
    };

    const data = await axiosInstance.post(
      "widget-add",
      requestedData
    );

    if (
      data.data.ack === DEFAULT_STATUS_CODE_SUCCESS
    ) {

      await fetchTaskCategoryApi(
        setTaskCategoryList,
        setLoading
      );

      return true;

    } else {

      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return false;

    }

  } catch (error: any) {

    toast.error(
      error?.response?.data?.ack_msg ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED
    );

    return false;
  }
};

