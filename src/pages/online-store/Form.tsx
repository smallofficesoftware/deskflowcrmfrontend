import { useState, useEffect, FormEvent } from 'react';
import { useOnlineStore } from '../../store/onlineStore/useOnlineStore';
import { axiosInstance } from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT, DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../helpers/AppConstants';
import { Link } from 'react-router-dom';

const Form = ({ qrCode }: { qrCode: string }) => {
    const {
        companyData,
        customerName,
        customerMobile,
        setFormSubmitted,
        setCustomerName,
        setCustomerMobile,
        setCustomerData
    } = useOnlineStore();
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [OTPJWTToken, setOTPJWTToken] = useState<any>();
    const resetForm = () => {
        setFormSubmitted(false);
        setCustomerName("");
        setCustomerMobile("");
        setOtpSent(false);
    }
    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);
    const sendOtpRequest = async () => {
        if (!customerName.trim() || !customerMobile.trim()) {
            toast.error("Name and mobile number are required.");
            return;
        }
        try {
            setIsLoading(true);
            const payload = {
                contact_name: customerName,
                mobile_number: customerMobile,
                haveOTP: false   // send OTP flow
            };
            const { data } = await axiosInstance.post(
                `/createContactByOnlineStore/${qrCode}`,
                payload,
                { timeout: 20000 }
            );
            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                if (data.ack_msg === "Contact already exists") {
                    setCustomerData(data.data);
                    setFormSubmitted(true);
                    return;
                }
                const token = data?.data?.otp_token;
                if (!token) {
                    toast.error("OTP not received.");
                    return;
                }
                setOTPJWTToken(token);
                setOtpSent(true);
                setTimer(30);
                toast.success("OTP sent to your WhatsApp number successfully!");
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (err: any) {
            toast.error(err?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsLoading(false);
        }
    };
    const resendOtp = async () => {
        if (timer !== 0) return;
        setOtp("");
        await sendOtpRequest();
    };
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!otpSent) {
            // First submit → send OTP
            await sendOtpRequest();
            return;
        }
        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP.");
            return;
        }
        try {
            setIsLoading(true);
            const payload: any = {
                contact_name: customerName,
                mobile_number: customerMobile,
                haveOTP: true,
                otp_token: OTPJWTToken,
                otp: otp
            };
            const { data } = await axiosInstance.post(
                `/createContactByOnlineStore/${qrCode}`,
                payload,
                { timeout: 20000 }
            );
            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setCustomerData(data.data);
                toast.success("Log in successfull!");
                setFormSubmitted(true);
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="onboard-wrapper d-flex justify-content-center align-items-center">
            <div className="onboard-card shadow-lg border-2">
                <div className="text-center mb-4">
                    {
                        companyData?.company_logo && <img
                            src={`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData?.company_logo}`}
                            alt="Company Logo"
                            style={{ width: 100 }}
                            className="mb-3 rounded"
                        />
                    }
                    <h2 className="fw-bold text-primary mb-1 text-secondary">{companyData?.company_name}</h2>
                    <p className="text-muted">Enter your details to continue</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-4">
                        <input
                            type="text"
                            required={true}
                            className="form-control premium-input text-secondary"
                            id="customerName"
                            placeholder="Person Name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <label htmlFor="customerName">Person Name</label>
                    </div>
                    <div className="form-floating mb-4 d-flex gap-2">
                        <input
                            type="tel"
                            required
                            disabled={otpSent}
                            className="form-control premium-input text-secondary"
                            id="customerMobile"
                            placeholder="WhatsApp Number"
                            value={customerMobile}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "");
                                setCustomerMobile(value);
                            }}
                            minLength={10}
                            maxLength={13}
                        />

                        <label htmlFor="customerMobile">WhatsApp Number</label>
                    </div>
                    {otpSent && (
                        <>
                            <div className="fade-in">
                                <div className="form-floating mb-3">
                                    <input
                                        type="tel"
                                        maxLength={6}
                                        className="form-control premium-input"
                                        id="otpInput"
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(e.target.value.replace(/\D/g, ""))}
                                    />
                                    <label htmlFor="otpInput">Enter OTP</label>
                                </div>
                                <div className="text-start mb-4">
                                    <span className="text-muted small">
                                        OTP sent to your WhatsApp number successfully!
                                    </span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className='mb-4'>
                                        <Link to={`/website/${qrCode}`} onClick={resetForm} className="">Go Back</Link>
                                    </div>
                                    <div className="text-end mb-4">
                                        {timer > 0 ? (
                                            <span className="text-muted small">
                                                Resend OTP in {timer}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 text-primary fw-semibold resend-link"
                                                onClick={resendOtp}
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-3 fw-semibold rounded-pill premium-btn"
                        disabled={isLoading}
                        style={{ backgroundColor: "rgb(245, 134, 52)" }}
                    >
                        {isLoading
                            ? "Please wait..."
                            : otpSent
                                ? "Verify OTP"
                                : "Submit"}
                    </button>
                </form>
                <hr className="footer-divider my-3" />
                <div className="text-center pb-2">
                    <small className="opacity-50 d-block mb-2">Powered by Deskflow CRM</small>
                    <img
                        src="/deshFlow_log.png"
                        alt="Deskflow Full Logo"
                        style={{ height: 38 }}
                        className="opacity-75"
                    />
                </div>
            </div>
            <style>{`
                .onboard-wrapper {
                    min-height: 100vh;
                    padding: 30px;
                    background: white;
                    display: flex;
                }
                .onboard-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    border-radius: 20px;
                    padding: 40px 32px;
                    width: 100%;
                    max-width: 430px;
                    animation: fadeUp 0.5s ease;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .premium-input {
                    border-radius: 12px;
                    height: 58px;
                    padding-left: 14px;
                }
                .premium-input:focus {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.18rem rgba(13,110,253,0.2);
                }
                .premium-btn {
                    font-size: 1.05rem;
                    transition: 0.3s ease;
                }
                .premium-btn:hover {
                    opacity: 0.92;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(13,110,253,0.35);
                }
                .resend-link {
                    font-size: 0.9rem;
                }
                .fade-in {
                    animation: fadeIn 0.35s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 576px) {
                    .onboard-card {
                        padding: 28px 22px;
                    }
                    .premium-input {
                        height: 52px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Form;
