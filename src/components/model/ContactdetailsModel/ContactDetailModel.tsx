import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    DEFAULT_STATUS_CODE_SUCCESS,
    MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

interface IPropsContactDetailModal {
    show: boolean;
    onHide: () => void;
    contactId?: number;
}

interface IContactDetail {
    person_name: string;
    company_name: string;
    client_code: string;
    mobile_number: string;
    address: string;
    country_name: string;
    state_name: string;
    city_name: string;
    area_name: string;
    label_name: string;
    label_color: string;
    source_name: string;
    source_name_color: string;
    stage_status_name: string;
    stage_status_color: string;
    assign_team_members_name: string;
}

const ContactDetailModal: React.FC<IPropsContactDetailModal> = ({
    show,
    onHide,
    contactId,
}) => {
    const [contactDetail, setContactDetail] = useState<IContactDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && contactId) {
            fetchContactDetail();
        } else {
            setContactDetail(null);
        }
    }, [show, contactId]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") onHide();
        };
        if (show) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [show, onHide]);

    const fetchContactDetail = async () => {
        try {
            setLoading(true);
            const getUUID = localStorage.getItem("UUID");
            const token = localStorage.getItem("token");

            if (!getUUID || !token) {
                toast.error("Authentication details are missing");
                return;
            }

            const requestData = {
                a_application_login_id: getUUID,
                contact_master_id: contactId,
            };

            const response = await axiosInstance.post(
                "singleContactData",
                requestData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setContactDetail(response.data.data);
            } else {
                toast.error(response.data.ack_msg || "Failed to load contact");
                setContactDetail(null);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            setContactDetail(null);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal1 modal-xl show" style={{ display: "block" }}>
            <div className="modal-content1">
                {/* Header with Title and Close Button */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                    <h5 className="mb-0 fw-bold">Contact Details</h5>
                    <button
                        type="button"
                        onClick={onHide}
                        style={{
                            fontSize: "28px",
                            fontWeight: "300",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable Table */}
                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-3">Loading...</p>
                        </div>
                    ) : contactDetail ? (
                        <table className="table table-bordered table-striped">
                            <tbody>
                                <tr>
                                    <th style={{ width: "200px" }}>Name</th>
                                    <td>{contactDetail.person_name || "-"}</td>
                                </tr>
                                <tr>
                                    <th>Company Name</th>
                                    <td>{contactDetail.company_name || "-"}</td>
                                </tr>
                                <tr>
                                    <th>Client Code</th>
                                    <td>{contactDetail.client_code || "-"}</td>
                                </tr>
                                <tr>
                                    <th>Mobile Number</th>
                                    <td>{contactDetail.mobile_number || "-"}</td>
                                </tr>
                                <tr>
                                    <th>Address</th>
                                    <td>{contactDetail.address || "-"}</td>
                                </tr>
                                <tr>
                                    <th>Country</th>
                                    <td>{contactDetail.country_name || "-"}</td>
                                </tr>
                                <tr>
                                    <th>State</th>
                                    <td>{contactDetail.state_name || "-"}</td>
                                </tr>
                                <tr>
                                    <th>City</th>
                                    <td>{contactDetail.city_name || "-"}</td>
                                </tr>
                                <tr>
                                    <th>Area</th>
                                    <td>{contactDetail.area_name || "-"}</td>
                                </tr>
                                {/* {contactDetail.label_name && ( */}
                                    <tr>
                                        <th>Label</th>
                                        <td>
                                            <span
                                                className="badge rounded-pill px-3 py-2"
                                                style={{
                                                    backgroundColor: contactDetail.label_color || "#ffa64d",
                                                    color: "white",
                                                }}
                                            >
                                                {contactDetail.label_name}
                                            </span>
                                        </td>
                                    </tr>
                                {/* )} */}
                                {/* {contactDetail.stage_status_name && ( */}
                                    <tr>
                                        <th>Status</th>
                                        <td>
                                            <span
                                                className="badge rounded-pill px-3 py-2"
                                                style={{
                                                    backgroundColor: contactDetail.stage_status_color || "#55aa73",
                                                    color: "white",
                                                }}
                                            >
                                                {contactDetail.stage_status_name}
                                            </span>
                                        </td>
                                    </tr>
                                {/* )} */}
                                {/* {contactDetail.source_name && ( */}
                                    <tr>
                                        <th>Source</th>
                                        <td>
                                            <span
                                                className="badge rounded-pill px-3 py-2"
                                                style={{
                                                    backgroundColor: contactDetail.source_name_color || "#6c757d",
                                                    color: "white",
                                                }}
                                            >
                                                {contactDetail.source_name}
                                            </span>
                                        </td>
                                    </tr>
                                 {/* )} */}
                                {/* {contactDetail.assign_team_members_name && ( */}
                                    <tr>
                                        <th>Assigned To</th>
                                        <td>{contactDetail.assign_team_members_name}</td>
                                    </tr>
                                {/* )} */}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            No contact details found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactDetailModal;