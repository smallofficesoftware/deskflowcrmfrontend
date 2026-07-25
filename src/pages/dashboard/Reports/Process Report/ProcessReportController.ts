import { toast } from "react-toastify";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface IProcessReport {
    process_name: string;
    id: number;
    color: string | undefined | null;
    created_date_time?: string;
}

export const fetchProcessApi = async (
    setProcessList: TReactSetState<IProcessReport[]>,
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