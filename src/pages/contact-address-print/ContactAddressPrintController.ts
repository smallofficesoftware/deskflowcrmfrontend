import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";

export interface IContact {
    person_name: string,
    company_name: string,
    mobile_number: string,
    email_id: string,
    address: string,
    pincode: string,
    country_name: string,
    state_name: string,
    city_name: string,
    area_name: string,

}

export const fetchContactById = async (
    id: number | string,
    setContactDetails: TReactSetState<IContact | undefined>,
    mobileToken?: string,
    getID?: string

) => {
    const getUUID = getID || localStorage.getItem("UUID");
    const token = mobileToken || localStorage.getItem("token");

    try {
        const { data } = await axiosInstance.post(
            `getContactById`,
            {
                id: id,
                a_application_login_id: getUUID
            }
        );
        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setContactDetails(data.data);

            }
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    }
    catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
};