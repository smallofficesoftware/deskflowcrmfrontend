
import { useEffect, useState } from 'react';
import { DEFAULT_STATUS_CODE_SUCCESS } from '../../../../../helpers/AppConstants';
import { axiosInstance } from '../../../../../services/axiosInstance';

export interface WhatsAppQRViewProps {
}


const WhatsAppQRView = ({ }: WhatsAppQRViewProps) => {
    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [qrCodeURL, setQRCodeURL] = useState(null)
    const [status, setStatus] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState("")
    const [message, setMessage] = useState("")
    const checkSessionStatus = async () => {
        try {
            const statusResponse = await axiosInstance.post(
                `/whatsapp/session/${Number(getUUID)}/getStatus`,
                { a_application_login_id: getUUID }, {
                timeout: 60000,
                headers: {
                    Authorization: token,
                    "x-tenant-id": getUUID,
                },
            }
            );
            if (statusResponse?.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setStatus(statusResponse?.data?.data?.status);
                setQRCodeURL(statusResponse?.data?.data?.qrCode || null);
            } else {
                setStatus("");
                setQRCodeURL(null);
            }
        } catch (error: any) {
            // toast.error(error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED)
        }
    }
    const logoutSession = async () => {
        try {
            const statusResponse = await axiosInstance.post(
                `/whatsapp/session/${Number(getUUID)}/logout`,
                { remove_token: true }, {
                timeout: 60000,
                headers: {
                    Authorization: token,
                    "x-tenant-id": getUUID,
                },
            }
            );
            if (statusResponse?.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                console.log("logout response: ", statusResponse?.data)
            } else {
                console.log("logout response in else: ", statusResponse?.data)

            }
        } catch (error: any) {
            // toast.error(error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED)
        }
    }
    useEffect(() => {
        checkSessionStatus()
    }, [])
    useEffect(() => {
        if (!qrCodeURL) {
            setError(true);
            setLoading(false);
            return;
        }
        const img = new Image();
        img.src = qrCodeURL;
        img.onload = () => {
            setLoading(false);
            setError(false);
        };
        img.onerror = () => {
            setLoading(false);
            setError(true);
        };
    }, [qrCodeURL]);
    const createSession = async () => {
        try {
            const createSessionResponse = await axiosInstance.post(
                `/whatsapp/session/${Number(getUUID)}/create`,
                { a_application_login_id: Number(getUUID) }, {
                timeout: 60000,
                headers: {
                    Authorization: token,
                    "x-tenant-id": getUUID,
                },
            }
            );
            if (createSessionResponse?.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setStatus(createSessionResponse?.data?.data?.status);
                setQRCodeURL(createSessionResponse?.data?.data?.qrCode || null);
                // if (!qrCodeURL) {
                //     getQRSession()
                // }
            } else {

            }
        } catch (error: any) {
            console.log(error)
            // toast.error(error?.message || error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED)
        }
    }
    const sendTextMessage = async () => {
        try {
            if (phoneNumber.length === 0) return;
            if (message.length === 0) return;
            const sendMessageResponse = await axiosInstance.post(
                `/whatsapp/session/${Number(getUUID)}/send-message`,
                { phone: phoneNumber, message }, {
                timeout: 60000,
                headers: {
                    Authorization: token,
                    "x-tenant-id": getUUID,
                },
            }
            );
            if (sendMessageResponse?.status === 200) {
                console.log("send message response data: ", sendMessageResponse.data)
            }
        } catch (error: any) {
            // toast.error(error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED)
        }
    }
    const getQRSession = async () => {
        try {
            const QRResponse = await axiosInstance.post(
                `/whatsapp/session/${Number(getUUID)}/qrcode`,
                {}, {
                timeout: 60000,
                headers: {
                    Authorization: token,
                    "x-tenant-id": getUUID,
                },
            }
            );
            if (QRResponse?.data.code === 200) {
                if (QRResponse?.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                    setStatus(QRResponse?.data?.data?.status)
                    setQRCodeURL(QRResponse?.data?.data?.qrCode)
                }
            }
        }
        catch (error: any) {
            // toast.error(error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED)
        }
    }
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="form-group">
                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                            <label htmlFor="whatsapp_qr" className="form_label mb-0">
                                WhatsApp QR Code
                            </label>
                            <span className={`badge bg-secondary`}>
                                {status}
                            </span>
                        </div>

                        <div className="position-relative border rounded bg-light w-100 mb-3" style={{
                            aspectRatio: '1 / 1', width: '220px',
                            height: '220px'
                        }}>
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                    <div className="spinner-border text-primary" role="status" />
                                </div>
                            ) : error ? (
                                <div className="d-flex justify-content-center align-items-center h-100 text-danger fw-semibold">
                                    QR Code Not Found
                                </div>
                            ) : (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                    <img
                                        src={qrCodeURL || ""}
                                        alt="WhatsApp QR"
                                        className="img-fluid"
                                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                                    />
                                </div>
                            )}
                        </div>


                        <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
                            <button
                                type="button"
                                className={`btn btn-sm btn-outline-secondary'}`}
                                onClick={createSession}
                            >
                                Connect
                            </button>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={getQRSession}
                            >
                                Scan
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={checkSessionStatus}
                            >
                                Check Status
                            </button>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={logoutSession}
                            >
                                Logout
                            </button>
                        </div>

                        <div className="row g-2 align-items-center">
                            <div className="col-12 col-sm-6 col-md-4">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Enter Phone Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                            <div className="col-12 col-sm-6 col-md-4">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Enter Message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            <div className="col-12 col-md-4 text-md-end">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary w-100 w-md-auto"
                                    onClick={sendTextMessage}
                                >
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default WhatsAppQRView;
