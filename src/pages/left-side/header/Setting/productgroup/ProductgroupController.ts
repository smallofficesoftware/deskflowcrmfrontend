import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IGroupView {
  group_name: string;
  id: number;
  group_color: string | undefined;
  created_date_time?: string;
}

export interface IGroupCreate {
  group_name: string;
  group_color: string | undefined | null;
  created_date_time?: string;
}

export const handleDeleteCategory = async (
  categoryIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setCategoryList: TReactSetState<IGroupView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    group_id: categoryIds.join(","), // Comma-separated IDs
    a_application_login_id: getUUID,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("groupDelete", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchCategoryApi(setCategoryList, setLoading);
      toast.success(
        categoryIds.length > 1
          ? "Group Deleted Successfully"
          : "Group Deleted Successfully"
      );
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createCategory = async (
  categoryInput: IGroupCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      categoryInput.group_name,
      "product_groups",
      "group_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "product_groups",
      data: `{"group_name":"${categoryInput.group_name}","group_color":"${categoryInput.group_color
        }","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID,
      isCheckDuplicate: true,
      duplicateField: "group_name"
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
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

export const updateCategory = async (
  categoryInput: IGroupCreate,
  editCategoryId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      categoryInput.group_name,
      "product_groups",
      "group_name",
      editCategoryId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "product_groups",
      where: `{"id":"${editCategoryId}"}`,
      data: `{"group_name":"${categoryInput.group_name}","group_color":"${categoryInput.group_color
        }","a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID

    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
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
    toast.error("Category already available");
  }
};

export const fetchCategoryApi = async (
  setCategoryList: TReactSetState<IGroupView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "product_groups",
    columns: "id,group_name,group_color",
    // where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false)
        setCategoryList([]);
      }
      setLoading(true)
      setCategoryList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};
