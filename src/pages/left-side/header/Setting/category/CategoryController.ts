import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ICategoryView {
  category_name: string;
  id: number;
  color: string | undefined | null;
  created_date_time?: string;
  group_id?: number | null;
  group_name?: string;
}

export interface ICategoryCreate {
  category_name: string;
  color: string | undefined | null;
  created_date_time?: string;
  group_id: number;                  // ← required now
}
export interface IGroupView {
  id: number;
  group_name: string;
}
export const handleDeleteCategory = async (
  categoryIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setCategoryList: TReactSetState<ICategoryView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    category_id: categoryIds.join(","), // Comma-separated IDs
    a_application_login_id: getUUID,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("categoryDelete", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchCategoriesWithGroup(setCategoryList, setLoading);
      toast.success(
        categoryIds.length > 1
          ? "Categories Deleted Successfully"
          : "Category Deleted Successfully"
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
  categoryInput: ICategoryCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //
) => {
  if (
    !(await checkDuplication(
      categoryInput.category_name,
      "categories",
      "category_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "categories",
      data: `{"category_name":"${categoryInput.category_name}","color":"${categoryInput.color}","group_id":${categoryInput.group_id},"a_application_login_id":${Number(getUUID)}}`,
      a_application_login_id: getUUID,
      isCheckDuplicate: true,
      duplicateField: "category_name"
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
  categoryInput: ICategoryCreate,
  editCategoryId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void //

) => {
  if (
    !(await checkDuplicationUpdate(
      categoryInput.category_name,
      "categories",
      "category_name",
      editCategoryId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "categories",
      where: `{"id":"${editCategoryId}"}`,
      data: `{"category_name":"${categoryInput.category_name}","color":"${categoryInput.color}","group_id":${categoryInput.group_id},"a_application_login_id":${Number(getUUID)}}`,
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

export const fetchCategoriesWithGroup = async (
  setCategoryList: TReactSetState<ICategoryView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");

  try {
    setLoading(true);

    // Pehle categories fetch karo
    const catRequest = {
      table: "categories",
      columns: "id, category_name, color, group_id",
      where: ["isDelete=0"],
      request_flag: 0,
      order: `{"id":"DESC"}`,
      a_application_login_id: getUUID
    };

    const catRes = await axiosInstance.post("commonGet", catRequest);

    if (catRes.status !== 200 || catRes.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCategoryList([]);
      return;
    }

    // Yahan type define kar do
    const categories: Array<{
      id: number;
      category_name: string;
      color: string | null | undefined;
      group_id: number | null;
    }> = catRes.data.data || [];

    if (categories.length === 0) {
      setCategoryList([]);
      return;
    }

    // Ab unique group_ids collect karo
    const groupIds = [...new Set(
      categories
        .filter(
          (c): c is {
            id: number;
            category_name: string;
            color: string | null | undefined;
            group_id: number;
          } => c.group_id != null && c.group_id !== 0
        )
        .map((c) => c.group_id)
    )];

    let groupMap: Record<number, string> = {};

    if (groupIds.length > 0) {
      const groupRequest = {
        table: "product_groups",
        columns: "id, group_name",
        where: [`id IN (${groupIds.join(",")})`, "isDelete=0"],
        request_flag: 0,
      };

      const groupRes = await axiosInstance.post("commonGet", groupRequest);

      if (groupRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        // Yahan bhi type safe banao
        const groups: Array<{ id: number; group_name: string }> = groupRes.data.data || [];

        groupMap = groups.reduce<Record<number, string>>((acc, g) => {
          acc[g.id] = g.group_name;
          return acc;
        }, {});
      }
    }

    // Final list banao with group_name
    const enriched: ICategoryView[] = categories.map((cat) => ({
      ...cat,
      group_name: cat.group_id ? groupMap[cat.group_id] || "Unknown" : undefined,
      // baaki fields jo ICategoryView mein hain, agar zaroori ho to default daal sakte ho
      id: cat.id,
      category_name: cat.category_name,
      color: cat.color,
      // group_id already hai to rehne do
    }));

    setCategoryList(enriched);

  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setCategoryList([]);
  } finally {
    setTimeout(() => setLoading(false), 800);
  }
};
export const fetchProductGroupApi = async (
  setCountriesList: TReactSetState<IGroupView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    table: "product_groups",
    columns: "id, group_name",
    where: ["isDelete=0"],
    request_flag: 0,
  };


  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setCountriesList([]);
    }
    setLoading(true);
    setCountriesList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => setLoading(false), 1000);
  }
};