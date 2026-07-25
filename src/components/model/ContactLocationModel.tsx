import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, GOOGLE_MAP_KEY, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { IFilterData, TFilterDate } from "../../helpers/AppInterface";
import { TReactSetState } from "../../helpers/AppType";
import { ITitle } from "../../pages/dashboard/DashoardController";
import {
    fetchCompanyTeamApi,
    ICompanyTeam,
    IUserList,
} from "../../pages/left-side/LeftSideController";
import { axiosInstance } from "../../services/axiosInstance";

export interface IAuth {
    ack: number;
    ack_msg: string;
    developer_msg: string;
}

interface IviewMap {
    show: boolean;
    onHide: () => void;
    filterData?: {
        filterData: IFilterData | null;
        checkedOptions: any[] | null;
        checkedSourceTypes: any[] | null;
        startSearchDate: TFilterDate;
        endSearchDate: TFilterDate;
        checkedOptionsStageStatus: any[] | null | string;
        checkedOptionsUser: any[];
        labelwiseContactShowAndOrNot: number;
    };
    filterDataTwo: {
        searchTerm: string;
        isUnreadState: number;
        selectedLabelId: number;
        selectedSourceId: number;
        selectedStageStatusId: number;
        applicationId: string;
        selectedActiveId: any;
        selectedDays: string | number | undefined | null;
        assignedByMultiTeamMember: any[];
        createdByMultiTeamMember: any[];
    }
}

// Interface for location data
interface ILocation {
    id: string;
    lat: number;
    lng: number;
    username: string;
    company_name: string;
    mobile_number: string;
    email_id: string;
    address: string;
}

const ContactLocationModel: React.FC<IviewMap> = ({
    show,
    onHide,
    filterData,
    filterDataTwo
}) => {
    const [title, setTitle] = useState<ITitle[]>([]);
    const [contact, setContact] = useState<any[]>([]);
    const { MobileToken, getID } = useParams();
    const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
    const [authDetails, setAuthDetails] = useState<IAuth | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<ILocation | null>(null);

    const containerStyle = {
        width: "100%",
        height: "100%",
    };

    const locations: ILocation[] = contact
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({
            id: item.id.toString(),
            lat: parseFloat(item.latitude),
            lng: parseFloat(item.longitude),
            username: item.person_name || "Unknown",
            company_name: item.company_name || "",
            mobile_number: item.mobile_number || "",
            email_id: item.email_id || "",
            address: item.address || "",
        }));

    const center = locations.length > 0
        ? {
            lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
            lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
        }
        : { lat: 22.2790918, lng: 70.7743466 };

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAP_KEY,
    });


    const fetchDataUser = async (
        page: number,
        term: string,
        setUsers: TReactSetState<IUserList[]>,
        itemsPerPage: number,
        setNoDataFound: TReactSetState<boolean>,
        setLoading: TReactSetState<boolean>,
        token: string | null,
        localId: string | null,
        setContactId: TReactSetState<number | undefined>,
        setSelectedLabelIds: TReactSetState<any>,
        setCheckToken: TReactSetState<boolean>,
        filterData?: any,
        checkedOptionsLabel?: any,
        checkedSourceTypes?: any,
        startSearchDate?: TFilterDate,
        endSearchDate?: TFilterDate,
        checkedOptionsStageStatus?: any,
        checkedOptionsUser?: any,
        isPin?: number,
        isUnread?: number,
        labelId?: number,
        sourceId?: number,
        stageStatusId?: number,
        isPinByApplicationId?: string,
        setTotalNumberOfUnreadContact?: any,
        setTotalContactCount?: any,
        isArchive?: number,
        selectedActiveId?: number | string | undefined | null,
        selectedDays?: number | string | undefined | null,
        assignedByMultiTeamMember?: any,
        createdByMultiTeamMember?: any
    ) => {
        try {
            const { data } = await axiosInstance.post(
                "Contact",
                {
                    ul: 0,
                    li: 100000,
                    searchTerm: term || "",
                    a_application_login_id: Number(localId),
                    labelFilter: checkedOptionsLabel,
                    sourceTypeFilter: checkedSourceTypes,
                    country: filterData?.country,
                    state: filterData?.state,
                    city: filterData?.city,
                    area: filterData?.area,
                    startDate: startSearchDate,
                    endDate: endSearchDate,
                    statusFilter: checkedOptionsStageStatus,
                    userFilter: checkedOptionsUser,
                    isPin: isPin,
                    isUnread: isUnread,
                    labelId: labelId,
                    sourceId: sourceId,
                    stageStatusId: stageStatusId,
                    isPinByApplicationId: isPinByApplicationId,
                    isArchive: isArchive,
                    request_flag: "location",
                    selectedActiveId: selectedActiveId,
                    selectedDays: selectedDays,
                    assignedByMultiTeamMember,
                    createdByMultiTeamMember
                }
            );
            if (data.code === 200) {
                if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                    if (page === 0) {
                        setUsers(data.data.item);
                    } else {
                        setUsers((prevUsers: any[]) => [...prevUsers, ...data.data.item]);
                    }
                } else {
                    toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                }
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
            setNoDataFound(data.data.item.length === 0);
        } catch (error: any) {
            toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        }
    };

    const fetchCompany = async (setTitle: TReactSetState<ITitle[]>) => {
        const uuid = getID || localStorage.getItem("UUID");
        const requestData = {
            table: "company_masters",
            columns:
                "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,id,invoice_view_formate,order_view_formate,quotation_view_formate,purchase_view_formate,workorder_view_formate,purchase_order_view_formate",
            where: JSON.stringify({ a_application_login_id: uuid }),
            request_flag: 2,
        };
        try {
            const response = await axiosInstance.post("mainCommonGet", requestData);
            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setTitle(response.data.data || []);
            } else {
                toast.error(response.data.ack_msg || "Failed to fetch company data");
                setTitle([]);
            }
        } catch (error: any) {
            console.error("Error fetching company data: ", error);
            toast.error("Error fetching company data");
        }
    };

    useEffect(() => {
        const fetchAuthToken = async (): Promise<IAuth | null> => {
            try {
                const uuid = getID || localStorage.getItem("UUID");
                const token = MobileToken || localStorage.getItem("token");

                const response = await axiosInstance.post(
                    "checkAuthToken",
                    {}
                );

                if (response.data.ack === 3) {
                    setAuthDetails(response.data);
                    toast.error("Unauthorized access. Please log in.");
                    return null;
                }

                setAuthDetails(response.data);
                return response.data;
            } catch (err) {
                console.error("Error fetching auth token: ", err);
                toast.error("Authentication failed");
                return null;
            }
        };

        const uuid = getID || localStorage.getItem("UUID");
        const token = localStorage.getItem("token");
        const localId = uuid;

        const init = async () => {
            const auth = await fetchAuthToken();
            if (auth && auth.ack !== 3) {
                await fetchCompany(setTitle);
                // await fetchContactLocation();
                await fetchDataUser(
                    0,
                    "",
                    setContact,
                    0,
                    () => { },
                    (loading) => { console.log('Loading:', loading); },
                    token,
                    localId,
                    () => { },
                    () => { },
                    () => { },
                    filterData?.filterData || null,
                    filterData?.checkedOptions || null,
                    filterData?.checkedSourceTypes || null,
                    filterData?.startSearchDate || undefined,
                    filterData?.endSearchDate || undefined,
                    filterData?.checkedOptionsStageStatus || null,
                    filterData?.checkedOptionsUser || null,
                    0,
                    filterDataTwo.isUnreadState,
                    filterDataTwo.selectedLabelId,
                    filterDataTwo.selectedSourceId,
                    filterDataTwo.selectedStageStatusId,
                    filterDataTwo.applicationId,
                    null,
                    null,
                    0,
                    filterDataTwo.selectedActiveId,
                    filterDataTwo.selectedDays,
                    filterDataTwo.assignedByMultiTeamMember,
                    filterDataTwo.createdByMultiTeamMember
                );

                if (title[0]?.id) {
                    await fetchCompanyTeamApi(setCompanyTeamLists, title[0].id, "");
                }
            }
        };

        init();
    }, [setTitle]);

    useEffect(() => {
        if (title[0]?.id) {
            fetchCompanyTeamApi(setCompanyTeamLists, title[0]?.id, "");
        }
    }, [title]);

    // Handle marker click to show InfoWindow
    const handleMarkerClick = (location: ILocation) => {
        setSelectedMarker(location);
    };

    // Handle InfoWindow close
    const handleInfoWindowClose = () => {
        setSelectedMarker(null);
    };

    if (loadError) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "90%", backgroundColor: "rgb(240 242 245)" }}
            >
                <h2 className="text-danger">
                    Failed to load Google Maps: {loadError.message}
                </h2>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "90%", backgroundColor: "rgb(240 242 245)" }}
            >
                <h2>Loading Google Maps...</h2>
            </div>
        );
    }

    return (
        <div className="modal1">
            <div
                className="modal-content1"
                style={{
                    width: "98%",
                    height: "98vh",
                    backgroundColor: "rgb(240 242 245)",
                    marginTop: "10px",
                    marginBottom: "0px",
                    paddingBottom: "0px",
                    //   padding:"0px",
                    //   overflow:"hidden"
                }}
            >
                <span
                    style={{ position: "absolute", top: "1.5%", zIndex: "99999", right: "1.5%" }}
                    className="close ms-3 pb-3"
                    onClick={() => onHide()}
                >
                    ×
                </span>
                {authDetails && authDetails.ack == 1 && show && (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={12}
                        options={{
                            draggable: true,
                            zoomControl: true,
                            scrollwheel: true,
                            disableDoubleClickZoom: false,
                        }}
                    >
                        {locations.map((location) => (
                            <Marker
                                key={location.id}
                                position={{ lat: location.lat, lng: location.lng }}
                                title={location.username}
                                onClick={() => handleMarkerClick(location)}
                            />
                        ))}
                        {selectedMarker && (
                            <InfoWindow
                                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                                onCloseClick={handleInfoWindowClose}
                            >
                                <div style={{ padding: "10px", maxWidth: "250px" }}>
                                    <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>{selectedMarker.username}</h3>
                                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                                        <strong>Company:</strong> {selectedMarker.company_name || "N/A"}
                                    </p>
                                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                                        <strong>Mobile:</strong> {selectedMarker.mobile_number || "N/A"}
                                    </p>
                                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                                        <strong>Email:</strong> {selectedMarker.email_id || "N/A"}
                                    </p>
                                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                                        <strong>Address:</strong> {selectedMarker.address || "N/A"}
                                    </p>
                                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                                        <strong>Location:</strong> {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                                    </p>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                )}

                {authDetails && authDetails.ack == 3 && <>
                    <div
                        className="d-flex justify-content-center align-items-center"
                        style={{ minHeight: "90%", backgroundColor: "rgb(240 242 245)" }}
                    >
                        <h2
                            className="text-danger"
                            style={{
                                fontSize: "clamp(18px, 4vw, 24px)",
                                fontWeight: "bold",
                                letterSpacing: "0.4px",
                            }}
                        >
                            You Are Unauthorized. Please log in first.
                        </h2>
                    </div></>}


            </div>
        </div>
    );
};

export default ContactLocationModel;