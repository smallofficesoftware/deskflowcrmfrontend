import { toast } from 'react-toastify';
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../../../../helpers/AppConstants';
import { IOption, TFilterDate } from '../../../../../helpers/AppInterface';
import { TReactSetState } from '../../../../../helpers/AppType';
import { axiosInstance } from '../../../../../services/axiosInstance';
import { IUserList } from '../../../LeftSideController';
import { IStageStatusView } from '../stage-status/StageStatusController';

export interface IRouteView {
    id: number;
    employee_id: number;
    employee_name: string;
    start_date: string;
    end_date: string;
    country_id: number;
    state_id: number;
    city_id: number;
    area_id: number;
    country_name: string;
    state_name: string;
    city_name: string;
    area_name: string;
    status_id: number;
    stage_status_name: string;
    stage_status_color: string;
    remark: string;
    created_date_time?: string;
}

export interface IRouteCreate {
    employee_id: number;
    start_date: string;
    end_date: string;
    country_id: number;
    state_id: number;
    city_id: number;
    area_id: number;
    remark: string;
}

interface IRawContact {
    id: number;
    person_name: string;
    company_name?: string;
}

export interface ISelectedContacts {
    id: number;
    contact_id: number;
    person_name: string;
    company_name: string;
    mobile_number: number;
    a_application_login_id: number;
}

export const fetchRouteList = async (
    setRouteList: TReactSetState<IRouteView[]>,
    setLoading: TReactSetState<boolean>,
    searchTerm: string,
    limit: number = 30,
    offset: number = 0,
    append: boolean = false,
    startSearchDate?: TFilterDate,
    endSearchDate?: TFilterDate,
    status_options?: any[],
    employee_options?: any[],
): Promise<boolean> => {

    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        ul: offset,
        ll: limit,
        searchTerm,
        startSearchDate,
        endSearchDate,
        status_options,
        employee_options,
    };

    try {
        const data = await axiosInstance.post(
            "get-routes",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                if (!append) setRouteList([]);
                return false;
            }
            const newItems: IRouteView[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setRouteList((prev) => [...prev, ...newItems]);
            } else {
                setRouteList(newItems);
            }
            return newItems.length === limit;
        }

        return false;

    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

export const createRoute = async (
    routeData: IRouteCreate,
    _setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {

    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        employee_id: routeData.employee_id,
        start_date: routeData.start_date,
        end_date: routeData.end_date,
        country_id: routeData.country_id,
        state_id: routeData.state_id,
        city_id: routeData.city_id,
        area_id: routeData.area_id,
        remark: routeData.remark,
    };

    try {
        const { data } = await axiosInstance.post(
            "add-route",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
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
};

export const updateRoute = async (
    routeData: IRouteCreate,
    editRouteId: number | undefined,
    setLoading: TReactSetState<boolean>,
    clearFormCallback: () => void //
) => {

    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        a_application_login_id: getUUID,
        id: editRouteId,
        employee_id: routeData.employee_id,
        start_date: routeData.start_date,
        end_date: routeData.end_date,
        country_id: routeData.country_id,
        state_id: routeData.state_id,
        city_id: routeData.city_id,
        area_id: routeData.area_id,
        remark: routeData.remark,
    };

    try {
        const { data } = await axiosInstance.post("update-route", requestData);

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
};

export const deleteRouteApi = async (
    deleteRouteIds: number[], // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {

    const getUUID = localStorage.getItem("UUID");

    const requestData = {
        table: "route_planners",
        where: `{"id":"${deleteRouteIds.join(",")}"}`, // Comma-separated IDs
        data: `{"isDelete":"1"}`,
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("commonUpdate", requestData);

        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success(
                deleteRouteIds.length > 1
                    ? "Routes Deleted Successfully"
                    : "Route Deleted Successfully"
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

export const searchContacts = async (
    inputValue: string,
    contactFilterObject: any,
): Promise<IOption[]> => {
    if (!inputValue) return [];
    const getUUID = localStorage.getItem("UUID");

    try {
        const { data } = await axiosInstance.post("Contact", {
            a_application_login_id: getUUID,
            searchTerm: inputValue || "",
            country: contactFilterObject?.country || 0,
            state: contactFilterObject?.state || 0,
            city: contactFilterObject?.city || 0,
            area: contactFilterObject?.area || 0,
        });

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const items: IRawContact[] = data.data?.item || [];
            return items.map((c) => ({
                value: c.id,
                label: c.company_name
                    ? `${c.person_name.trim()} - ${c.company_name}`
                    : c.person_name.trim(),
            }));
        }
        return [];
    } catch (error) {
        console.error("Error loading customers:", error);
        return [];
    }
};

// 2. FETCH LIST OF CHOSEN CONTACTS
export const fetchSelectedContactsList = async (
    setSelectedContacts: TReactSetState<ISelectedContacts[]>,
    routeId: number,
    setLoading: TReactSetState<boolean>
): Promise<void> => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        route_id: routeId
    };

    setLoading(true);
    try {
        const { data } = await axiosInstance.post("get-assigned-contacts", requestData, {
            headers: {
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
            },
        });

        if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const items: ISelectedContacts[] = data.data.item || [];
            setSelectedContacts(items);
        } else {
            setSelectedContacts([]);
        }
    } catch (error: any) {
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setSelectedContacts([]);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }
};

// 3. SUBMIT A SINGLE CONTACT TO DATABASE
export const addContactAssignment = async (
    contactIds: number[],
    routeId: number
): Promise<boolean> => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        contact_ids: contactIds,
        route_id: routeId,
    };

    try {
        const { data } = await axiosInstance.post("assign-contact-to-route", requestData, {
            headers: {
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
            },
        });

        if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(data.ack_msg);
            return true;
        }
        toast.error(data.ack_msg || "Failed to assign contact.");
        return false;
    } catch (error: any) {
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    }
};

// 4. REMOVE A CONTACT FROM THE LIST
export const removeContactAssignment = async (
    id: string | number,
): Promise<boolean> => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = { id };

    try {
        const { data, status } = await axiosInstance.post("remove-contact-from-route", requestData, {
            headers: {
                Authorization: `${token}`,
                "x-tenant-id": getUUID,
            },
        });

        if (status === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(data.ack_msg);
            return true;
        }
        toast.error(data.ack_msg || "Failed to remove contact.");
        return false;
    } catch (error: any) {
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    }
};

export const fetchStageStatusApiForRoute = async (
    setStageStatusList: TReactSetState<IStageStatusView[]>,
    current_status: number | undefined,
) => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
        status_type: "14",
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

export const assignStatusToRoute = async (
    setLoading: TReactSetState<boolean>,
    checkedOptions: number,
    routeId: number | undefined,
) => {
    try {
        setLoading(true);
        const getUUID = localStorage.getItem("UUID");

        const { data } = await axiosInstance.post("assign-status-to-route", {
            checkedOptions,
            routeId,
            a_application_login_id: getUUID,
        });

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success(data.ack_msg);
        } else {
            toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            return false;
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    } finally {
        setLoading(false);
    }
};

export const fetchContactsApi = async (
    setContactList: TReactSetState<IUserList[]>,
    setLoading: TReactSetState<boolean>,
    limit: number = 30,
    offset: number = 0,
    append: boolean = false,
    ids: number[],
): Promise<boolean> => {

    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const requestData = {
        a_application_login_id: getUUID,
        ul: offset,
        ll: limit,
        ids,
    };

    try {
        const data = await axiosInstance.post(
            "Contact",
            requestData,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false)
                if (!append) setContactList([]);
                return false;
            }
            const newItems: IUserList[] = data.data.data.item || [];
            setLoading(true)
            if (append) {
                setContactList((prev) => [...prev, ...newItems]);
            } else {
                setContactList(newItems);
            }
            return newItems.length === limit;
        }

        return false;

    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return false;
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

// ── All-area contacts (no search term required) ──────────────────────────────

export interface IAreaContact {
    id: number;
    person_name: string;
    company_name?: string;
    mobile_number?: string | number;
}

export const fetchAllAreaContacts = async (
    setContacts: TReactSetState<IAreaContact[]>,
    contactFilterObject: any,
    setLoading: TReactSetState<boolean>,
    limit: number = 15,
    offset: number = 0,
    append: boolean = false,
): Promise<boolean> => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    setLoading(true);
    try {
        const { data } = await axiosInstance.post(
            "Contact",
            {
                a_application_login_id: getUUID,
                searchTerm: "",
                ul: offset,
                ll: limit,
                country: contactFilterObject?.country || 0,
                state: contactFilterObject?.state || 0,
                city: contactFilterObject?.city || 0,
                area: contactFilterObject?.area || 0,
            },
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": getUUID,
                },
            }
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            const items: IAreaContact[] = data.data?.item || [];
            if (append) {
                setContacts((prev) => [...prev, ...items]);
            } else {
                setContacts(items);
            }
            return items.length === limit; // true = more pages may exist
        } else {
            if (!append) setContacts([]);
            return false;
        }
    } catch (error: any) {
        toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        if (!append) setContacts([]);
        return false;
    } finally {
        setLoading(false);
    }
};