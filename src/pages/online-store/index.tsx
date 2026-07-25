import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../helpers/AppConstants';
import { axiosInstance } from '../../services/axiosInstance';
import { useOnlineStore } from '../../store/onlineStore/useOnlineStore';
import Carousel from './Carousel';
import Cart from './Cart';
import Footer from './Footer';
import Form from './Form';
import Header from './Header';
import Products from './Products';
import { ToastProvider } from './Toast';

const OnlineStore = () => {
    const { qrCode } = useParams<{ qrCode: string }>();
    const navigate = useNavigate();
    const { formSubmitted, setCompanyData, setCategories, companyData, setSelectedCategory, initializeSession, saveSessionState } = useOnlineStore();
    useEffect(() => {
        initializeSession();
    }, []);
    useEffect(() => {
        saveSessionState();
    }, [companyData, formSubmitted]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const existing = document.getElementById("bootstrap-js");
            if (!existing) {
                const script = document.createElement("script");
                script.id = "bootstrap-js";
                script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js";
                script.crossOrigin = "anonymous";
                script.async = true;
                document.body.appendChild(script);
            }
        }
    }, []);
    const getCompanyData = async () => {
        try {
            const payload = {
                table: "company_masters",
                columns: "id,company_name,company_logo,company_sign,company_email,header_img,footer_img,gst_number,currency_id,qr_code,address,country_id,state_id,city_id,terms_and_condition,company_contact,company_catalog,banner_img_one,banner_img_two,order_terms_conditions,order_view_formate",
                where: JSON.stringify({ qr_code: qrCode, isDelete: "0" }),
            };
            const { data } = await axiosInstance.post(
                `mainCommonGet`,
                payload
            );
            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                let companyDatas = data.data[0];
                setCompanyData(companyDatas);
                const companyOwnerIdPayload = {
                    table: "company_vs_application_logins",
                    columns: "id,company_masters_id,a_application_login_id,company_flag",
                    where: JSON.stringify({ company_masters_id: companyDatas.id, isDelete: "0", company_flag: 1 }),
                }
                const response = await axiosInstance.post(
                    `mainCommonGet`,
                    companyOwnerIdPayload
                );
                const ownerRecord = response.data?.data?.[0];
                if (ownerRecord) {
                    companyDatas = {
                        ...companyDatas,
                        a_application_login_id: ownerRecord.a_application_login_id,
                    };
                }
                setCompanyData(companyDatas);
            } else {
                navigate("/")
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    }
    const getProductCategories = async () => {
        try {
            const { data } = await axiosInstance.post(
                `/get-all-product-categories/${qrCode}`
            );
            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setCategories(data.data)
                if (data.data.length > 0) {
                    setSelectedCategory(data.data[0].id)
                }
            } else {
                // toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    }
    useEffect(() => {
        getCompanyData();
        if (companyData) {
            getProductCategories();
        }
    }, [])
    if (!qrCode) return <p>Invalid URL</p>;
    if (!formSubmitted) {
        return <Form qrCode={qrCode} />;
    }
    return (
        <div style={{ backgroundColor: "white" }}>
            <ToastProvider>
                <Header qrCode={qrCode} />
                <Carousel />
                <Products qrCode={qrCode} />
                <Footer />
                <Cart qrCode={qrCode} />
            </ToastProvider>
        </div>
    );
};

export default OnlineStore;