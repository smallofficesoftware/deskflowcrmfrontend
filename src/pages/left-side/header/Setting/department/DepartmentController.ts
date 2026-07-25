import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
    DEFAULT_STATUS_CODE_SUCCESS,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IDepartmentView {
    department_name: string;
    id: number;
    color: string | undefined;
    created_date_time?: string;
}

export interface IDepartmentCreate {
    department_name: string;
    color: string | undefined | null;
    created_date_time?: string;
}

export const handleDeleteDepartment = async (
    departmentIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setDepartmentList: TReactSetState<IDepartmentView[]>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        table: "departments",
        where: `{"id":"${departmentIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };
    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            await fetchDepartmentApi(setDepartmentList, setLoading);
            toast.success(
                departmentIds.length > 1
                    ? "Departments Deleted Successfully"
                    : "Department Deleted Successfully"
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

export const createDepartment = async (
    departmentInput: IDepartmentCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {
    if (
        !(await checkDuplication(
            departmentInput.department_name,
            "departments",
            "department_name"
        ))
    ) {
        const getUUID = await localStorage.getItem("UUID");
        const requestData = {
            table: "departments",
            data: `{"department_name":"${departmentInput.department_name}","color":"${departmentInput.color
                }","a_application_login_id":${Number(getUUID)}}`,
            a_application_login_id: getUUID

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
        toast.error("Department already available");
    }
};

export const updateDepartment = async (
    departmentInput: IDepartmentCreate,
    editCategoryId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //

) => {
    if (
        !(await checkDuplicationUpdate(
            departmentInput.department_name,
            "departments",
            "department_name",
            editCategoryId
        ))
    ) {
        const getUUID = await localStorage.getItem("UUID");
        const requestData = {
            table: "departments",
            where: `{"id":"${editCategoryId}"}`,
            data: `{"department_name":"${departmentInput.department_name}","color":"${departmentInput.color
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
        toast.error("Department already available");
    }
};

export const fetchDepartmentApi = async (
    setDepartmentList: TReactSetState<IDepartmentView[]>,
    setLoading: TReactSetState<boolean>,
) => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        table: "departments",
        columns: "id,department_name,color",
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
                setDepartmentList([]);
            }
            setLoading(true)
            setDepartmentList(data.data.data);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};
