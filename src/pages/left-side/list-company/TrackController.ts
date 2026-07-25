import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { ICompanyTeam } from "../LeftSideController";

export interface ITracking {
    id: number;
    created_date: string;
    DateAndId: string;
    companyTeamInfo: ICompanyTeam | undefined;
    latitude: string;
    longitude: string;
    mode:number;
    address: string;
    m_timestamp:string;
}

export const fetchTrackApi = async (
    setExpenseList: React.Dispatch<React.SetStateAction<ITracking[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    Date: string,
    login_id: number
) => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
        a_application_login_id: login_id,
        m_timestamp: Date
    };

    try {
        const response = await axiosInstance.post("get-tracking", requestData);

        if (response.status === 200) {
            if (response.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                setExpenseList([]);
            }
            setLoading(true)
            
            if (response.data.data.item.length === 0) {
                toast.error("No data found for this date");
                setExpenseList([]);
            } else {
                setExpenseList(response.data.data.item); 
                toast.success("Data Found for this date");
            }
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setExpenseList([]);    }
};

export const fetchExpenseTypeApiForExpenses = async (
    setLocation: TReactSetState<[]>,
    companyId: number
) => {
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
        table: "location_trackings",
        columns: "id,latitude,longitude",
        where: ["isDelete=0", `a_application_login_id=${companyId}||0`],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id: companyId
    };
    try {
        const response = await axiosInstance.post("commonGet", requestData
        );

        setLocation(response.data.data); 
    } catch (error) {
        console.error("Error fetching countries:", error);
        setLocation([]);
    }
};