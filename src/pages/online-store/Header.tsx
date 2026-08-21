import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT, DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../helpers/AppConstants';
import { axiosInstance } from '../../services/axiosInstance';
import { useOnlineStore } from '../../store/onlineStore/useOnlineStore';

interface HeaderProps {
    qrCode: string;
}

const Header = ({ qrCode }: HeaderProps) => {
    const {
        companyData, logout, customerData } = useOnlineStore();
    const cart = useOnlineStore(state => state.cart);
    const cartCount = cart.reduce((t, i) => t + i.quantity, 0);
    const getTrimmedName = (name: string, max = 22) => {
        return name.length > max ? name.substring(0, max) + "..." : name;
    };

    // Always the company's default account statement template here — no
    // picker on the customer-facing portal (unlike the staff-side Account
    // History, which offers one when the company has 2+ templates).
    const [isStatementLoading, setIsStatementLoading] = useState(false);
    const printAccountStatement = async () => {
        if (!customerData?.id) return;
        setIsStatementLoading(true);
        try {
            const { data } = await axiosInstance.post(
                `/account-statement-pdf-online-store/${customerData.id}/${qrCode}`,
                {},
            );
            if (data.code !== 200 || data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                return;
            }
            const response = await axios.get(data.data.fileLinkPath, { responseType: "blob" });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (error) {
            console.error(error);
            toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsStatementLoading(false);
        }
    };
    return (
        <>
            <nav className="navbar navbar-expand-lg bg-white shadow-sm py-2 sticky-top premium-header container-fluid container-xl">
                <div className="container-fluid">
                    <a className="navbar-brand d-flex align-items-center gap-2" href={`/website/${qrCode}`}>
                        {companyData?.company_logo && <img
                            src={`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData?.company_logo}`}
                            alt="Logo"
                            width={42}
                            height={42}
                            className="rounded shadow-sm"
                        />}
                        <div className="d-flex flex-column lh-1">
                            <span
                                className="fw-bold fs-5"
                                title={companyData?.company_name}
                                style={{ color: "#f58634" }}
                            >
                                {getTrimmedName(companyData?.company_name)}
                            </span>
                        </div>
                    </a>
                    <button
                        className="navbar-toggler border-0 shadow-none"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#headerNav"
                    >
                        <span className="navbar-toggler-icon">
                        </span>
                    </button>
                    <div className="collapse navbar-collapse mt-3 mt-lg-0" id="headerNav">
                        <div className="ms-lg-auto d-flex flex-row justify-content-center flex-lg-row align-items-center justify-content-lg-end gap-3 w-100 w-lg-auto">
                            <a href={`/SupportTicket/${qrCode}/${customerData?.id}`} target='_blank' rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button
                                    className="btn btn-outline-secondary rounded-pill px-2 py-1 account-btn d-flex align-items-center gap-2" style={{ fontSize: "14px" }}
                                >
                                    <i className="bi bi-person-circle fs-6"></i>
                                    Customer Support Ticket
                                </button>
                            </a>
                            <button
                                className="btn btn-outline-secondary rounded-pill px-2 py-1 account-btn d-flex align-items-center gap-2"
                                style={{ fontSize: "14px" }}
                                onClick={() => {
                                    if (!isStatementLoading) printAccountStatement();
                                }}
                            >
                                <i className="bi bi-person-circle fs-6"></i>
                                {isStatementLoading ? "Preparing..." : "Account Statement"}
                            </button>
                            <button
                                className="btn position-relative rounded-pill px-2 py-1 cart-btn"
                                data-bs-toggle="modal"
                                data-bs-target="#cartModal"
                                style={{ fontSize: "14px" }}
                            >
                                <i className="bi bi-cart3 me-2"></i>
                                Cart
                                {cartCount > 0 && (
                                    <span className="badge bg-danger rounded-circle position-absolute top-0 translate-middle" style={{ right: "-15px", top: "-10px" }}>
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            <button
                                className="btn btn-outline-danger rounded-pill px-2 py-1 logout-btn d-flex align-items-center gap-2"
                                onClick={() => {
                                    logout();
                                    window.location.href = `/website/${qrCode}`;
                                }}
                                style={{ fontSize: "14px" }}
                            >
                                <i className="bi bi-box-arrow-right fs-6"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <style>{`
                .premium-header {
                    backdrop-filter: blur(6px);
                }
                .search-wrap {
                    max-width: 420px;
                }
                .search-input {
                    height: 45px;
                    border-radius: 10px;
                    transition: all 0.25s ease;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
                }
                .search-input:focus {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13,110,253,0.15);
                }
                .search-btn {
                    height: 45px;
                    width: 45px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .cart-btn {
                    display: flex;
                    align-items: center;
                    border-color: #f58634;
                    font-weight: 500;
                }
                    .cart-btn:hover {
                    display: flex;
                    align-items: center;
                    background-color: #f58634;
                    color:white;
                    font-weight: 500;
                }
                @media (max-width: 768px) {
                    .search-input {
                        height: 42px;
                    }
                    .search-btn {
                        height: 42px;
                        width: 42px;
                    }
                }
            `}</style>
        </>
    );
};

export default Header;
