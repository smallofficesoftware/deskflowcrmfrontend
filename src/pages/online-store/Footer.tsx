import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../helpers/AppConstants";
import { useOnlineStore } from "../../store/onlineStore/useOnlineStore";

const Footer = () => {
    const {
        companyData
    } = useOnlineStore();
    return (
        <footer className="premium-footer text-white mt-5 pt-5 pb-3">
            <div className="container-fluid">
                <div className="row justify-content-center text-center mb-4">
                    <div className="col-12 col-md-6">
                        {companyData?.company_logo && <img
                            src={`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData?.company_logo}`}
                            alt="Company Logo"
                            style={{ height: 58 }}
                            className="mb-3 rounded shadow-sm"
                        />}
                        <h3 className="fw-bold text-white mb-3">{companyData?.company_name}</h3>
                        {
                            companyData?.address && (
                                <p
                                    className="footer-contact mb-1 d-flex align-items-start"
                                    style={{
                                        wordWrap: "break-word",
                                        overflowWrap: "break-word",
                                        whiteSpace: "normal",
                                        lineHeight: "1.4",
                                        maxWidth: "100%",
                                        margin: 0,
                                        paddingRight: "1rem"
                                    }}
                                >
                                    <i
                                        className="bi bi-geo-alt me-2 flex-shrink-0"
                                        style={{
                                            fontSize: "1.1rem",
                                            marginTop: "2px",
                                            display: "none"
                                        }}
                                    ></i>
                                    <span style={{ flex: 1, wordBreak: "break-word" }}>
                                        {companyData?.address}
                                    </span>
                                </p>
                            )
                        }
                        {companyData?.company_contact && <p className="footer-contact mb-1">
                            <i className="bi bi-telephone me-2"></i>
                            {companyData?.company_contact}
                        </p>}
                        {companyData?.company_email && <p className="footer-contact mb-1">
                            <i className="bi bi-envelope me-2"></i>
                            {companyData?.company_email}
                        </p>}
                    </div>
                </div>
                <hr className="footer-divider my-3" />
                <div className="text-center pb-2">
                    <small className="opacity-50 d-block mb-2">Powered by Deskflow CRM</small>
                    <img
                        src={"https://deskflowcrm.com/images/ft_logo.png"}
                        alt="Deskflow Full Logo"
                        style={{ height: 38 }}
                        className="opacity-75"
                    />
                    <div className="d-flex text-black gap-3 opacity-50 justify-content-center align-items-center d-block mt-2">
                        <a href="/PrivacyPolicy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "gray" }}>Privacy Policy</a>
                        <a href="/ContactUs" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "gray" }}>Contact Us</a>
                    </div>
                </div>
            </div>
            <style>{`
                .premium-footer {
                    background: #111;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .footer-contact {
                    opacity: 0.75;
                    font-size: 1rem;
                }
                .footer-divider {
                    border-color: rgba(255,255,255,0.1);
                }
                @media (max-width: 768px) {
                    .premium-footer {
                        text-align: center;
                    }
                    .footer-contact {
                        font-size: 0.9rem;
                        padding-left: 0.5rem;
                        padding-right: 0.5rem;
                    }
                    .footer-contact i {
                        font-size: 1rem !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;
