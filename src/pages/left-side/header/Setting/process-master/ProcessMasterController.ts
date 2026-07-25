import { toast } from "react-toastify";
import {
    DEFAULT_STATUS_CODE_SUCCESS,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IProcessView {
    process_name: string;
    id: number;
    color: string | undefined | null;
    created_date_time?: string;
}

export interface IProcessCreate {
    process_name: string;
    color: string | undefined | null;
    created_date_time?: string;
}

export const handleDeleteProcess = async (
    processId: number | undefined,
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setProcessList: TReactSetState<IProcessView[]>,
    setLoading: TReactSetState<boolean>,
) => {
    const getUUID = localStorage.getItem("UUID")
    const requestData = {
        table: "process_masters",
        where: `{"id":${processId}}`,
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID

    };
    try {
        const data = await axiosInstance.post("commonUpdate", requestData);
        if (data.data.code === 200) {
            if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {

                setIsDeleteConfirmation(false);
                fetchProcessApi(setProcessList, setLoading);
            } else {
                toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
};

export const createProcess = async (
    processMasterInput: IProcessCreate,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void
) => {

    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
        process_name: processMasterInput.process_name,
        color: processMasterInput.color,
        a_application_login_id: getUUID
    };

    try {
        const token = localStorage.getItem("token");
        const data = await axiosInstance.post("create-process-masters", requestData,
            {
                headers: {
                    Authorization: token,
                },
            },
        );

        if (data.data.ack === 1) {
            toast.success(data.data.ack_msg);
            clearFormCallback();
        } else {
            toast.error(data.data.ack_msg);
        }

    } catch (error: any) {
        toast.error(error);
    }
};

export const updateprocess = async (
    processMasterInput: IProcessCreate,
    editprocessId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void
) => {

    const token = localStorage.getItem("token");

    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
        id: editprocessId,
        process_name: processMasterInput.process_name,
        color: processMasterInput.color,
        a_application_login_id: Number(getUUID)
    };
    console.log("aaaaaaaaaaaaaaaaa", requestData)

    try {
        const { data } = await axiosInstance.post("update-process-masters", requestData,
            {
                headers: {
                    Authorization: token,
                },
            },

        );

        if (data.ack === 1) {
            toast.success(data.ack_msg);
            clearFormCallback();
        } else {
            toast.error(data.ack_msg);
        }

    } catch (error: any) {
        toast.error(error);
    }
};

// export const fetchProcessApi = async (
//     setProcessList: TReactSetState<IProcessView[]>,
//     setLoading: TReactSetState<boolean>,
// ) => {
//     const getUUID = await localStorage.getItem("UUID");
//     const requestData = {
//         table: "process_masters",
//         columns: "id,process_name,color",
//         where: ["isDelete=0"],
//         request_flag: 0,
//         order: `{"id":"DESC"}`,
//         a_application_login_id: getUUID
//     };
//     try {
//         const data = await axiosInstance.post("get-process-masters", requestData);
//         if (data.status === 200) {
//             if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
//                 setLoading(false)
//                 setProcessList([]);
//             }
//             setLoading(true)
//             setProcessList(data.data.data);
//         }
//     } catch (error: any) {
//         toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//     } finally {
//         setTimeout(() => {
//             setLoading(false); // Set loading to false after minimum time
//         }, 1000); // 1000 milliseconds (1 seconds)
//     }
// };

export const fetchProcessApi = async (
    setProcessList: TReactSetState<IProcessView[]>,
    setLoading: TReactSetState<boolean>,
) => {
    try {
        setLoading(true);

        const token = localStorage.getItem("token");
        const uuid = localStorage.getItem("UUID");

        const requestData = {
            a_application_login_id: uuid,
        };

        const res = await axiosInstance.post("get-process-masters", requestData,
            {
                headers: { Authorization: token },
            }
        );

        if (res.data?.ack === 1) {
            const list = res.data?.data?.item;

            setProcessList(Array.isArray(list) ? list : []);
        } else {
            setProcessList([]);
        }

    } catch (error: any) {
        setProcessList([]);
        toast.error(error);
    } finally {
        setLoading(false);
    }
};
