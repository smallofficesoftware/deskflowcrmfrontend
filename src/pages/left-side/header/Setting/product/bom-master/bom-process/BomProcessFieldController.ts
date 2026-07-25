import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../../../services/axiosInstance";
import { IMachineView } from "../../../machineManagement/Machine-managementController";
import { IProcessView } from "../../../process-master/ProcessMasterController";


export const fetchMachineApi = async (inputValue: string) => {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        table: "machine_managements",
        columns: "id,machine_name,color",
        where: [
            "isDelete=0",
            ...(inputValue ? [`machine_name like '%${inputValue}%'`] : [])
        ],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id: getUUID
    };

    try {
        const response = await axiosInstance.post("commonGet", requestData);

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            return response.data.data.map((machine: IMachineView) => ({
                label: machine.machine_name,
                value: machine.id,
                color: machine.color
            }));
        }

        return [];
    } catch (error: any) {
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return [];
    }
};

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

export const searchProcessApi = async (inputValue: string) => {
    try {
        const token = localStorage.getItem("token");
        const uuid = localStorage.getItem("UUID");

        const requestData = {
            a_application_login_id: uuid,
        };

        const res = await axiosInstance.post(
            "get-process-masters",
            requestData,
            {
                headers: { Authorization: token },
            }
        );

        if (res.data?.ack === 1) {
            const list = res.data?.data?.item || [];

            return list
                .filter((item: any) =>
                    item.process_name
                        ?.toLowerCase()
                        .includes(inputValue.toLowerCase())
                )
                .map((item: any) => ({
                    label: item.process_name,
                    value: item.id,
                    color: item.color,
                }));
        }

        return [];
    } catch (error: any) {
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return [];
    }
};

export const createProcess = async (
    processId: any,
    workstation: any,
    requiredTime: any,
    cost: any,
    manPowerCost: any,
    productId: any,
    bomId: any,
) => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
        bom_id: bomId,
        product_id: productId,
        process_id: processId,
        workstation_id: workstation,
        required_time: requiredTime,
        process_cost: cost,
        manpower_cost: manPowerCost,
        a_application_login_id
    };

    try {
        const response = await axiosInstance.post(
            "create-process-list",
            payload,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": a_application_login_id,
                },
            }
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success("Process Created Successfully");
            return true;
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            return false;
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
        return false;
    }

};

export const updateProcess = async (
    id: any,
    process_id: any,
    workstation_id: any,
    required_time: any,
    process_cost: any,
    manpower_cost: any,
    productId: any,
    bomId: any,
) => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
        id,
        bom_id: bomId,
        product_id: productId,
        process_id,
        workstation_id,
        required_time,
        process_cost,
        manpower_cost,
    };

    try {
        const response = await axiosInstance.post(
            "update-process-list",
            payload,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": a_application_login_id,
                },
            }
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success("Process Updated Successfully");
            return true;
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            return false;
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
        return false;
    }

};

export const getProcess = async (
    productId: any,
    setAllProcessLists: (data: []) => void
) => {

    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        product_id: productId
    };

    try {
        const response = await axiosInstance.post(
            "get-process-lists",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setAllProcessLists(response.data.data.item);
        } else {
            setAllProcessLists([]);
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    }

};

export const handleDelete = async (
    netRateInput1: any, 
    setRecallGetProcessOnDelete: any,
    setIsDeleteConfirmation: any
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        id: netRateInput1
    };

    try {
        const response = await axiosInstance.post(
            "delete-process-list",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success("Process Deleted Successfully");
            setRecallGetProcessOnDelete(true);
            return false;
        } else {
            setIsDeleteConfirmation(false);
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            setRecallGetProcessOnDelete(false);
            return false;
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    }
}