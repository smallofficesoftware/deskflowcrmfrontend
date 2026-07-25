import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../helpers/AppConstants';
import { axiosInstance } from '../../services/axiosInstance';
import { fetchCompanyQR } from '../left-side/list-company/ListCompanyController';

const CompanyQRCodeCard = ({
    poweredByLogoUrl = "/deshFlow_log.png",
    size = 256,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [company, setCompany] = useState<any>();
    const fetchCompanyData = async () => {
        setIsLoading(true);
        const token = await localStorage.getItem("token");
        const getUUID = await localStorage.getItem("UUID");
        try {
            const response = await axiosInstance.post("company", { a_application_login_id: getUUID, }, {
                headers: {
                    Authorization: `${token}`,
                },
            });
            if (response.status === 200) {
                setCompany(response.data?.data?.item[0]);
                if (!response.data?.data?.item[0]) return;
                if (!response.data?.data?.item[0].qr_code) {
                    fetchCompanyQR().then((code) => {
                        setCompany((prev: any) => ({
                            ...prev,
                            qr_code: code,
                        }));
                    });
                }
            }
        } catch (error: any) {
            toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsLoading(false)
        }
    }
    useEffect(() => {
        fetchCompanyData()
    }, [])
    return (
        <>
            {
                isLoading ? (<div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>) :
                    (<div className="d-flex justify-content-center align-items-center vh-100 bg-light px-2">
                        <style>
                            {`
      @page {
        size: A5;
      }
      body {
        width: 100%;
      }
    `}
                        </style>

                        <div
                            className="bg-white p-4 rounded shadow d-flex flex-column w-100"
                            style={{
                                maxWidth: '100mm',
                                width: '100%',
                                height: '150mm',
                            }}
                        >
                            {/* {!company?.company_logos ? <div className='rounded-circle mx-auto d-block mb-2' style={{ width: '100px', height: '100px', objectFit: 'cover' }}></div> : (<img
                                src={company?.company_logo}
                                alt="Company Logo"
                                className="rounded-circle mx-auto d-block mb-2"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />)} */}
                            {!company?.company_logo ? <></> : (<img
                                src={company?.company_logo}
                                alt="Company Logo"
                                className="rounded-circle mx-auto d-block mb-2"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />)}
                            <h1 className="h5 text-center text-dark fw-bold mb-1 text-break" style={{ fontSize: '18px' }}>
                                {company?.company_name}
                            </h1>
                            <p className="text-center text-muted text-break mb-1" style={{ fontSize: '14px' }}>
                                {company?.company_email}
                            </p>
                            <p className="text-center text-muted text-break mb-1" style={{ fontSize: '14px' }}>
                                {company?.company_contact}
                            </p>
                            <p className="text-center text-muted text-break mb-2" style={{ fontSize: '14px' }}>
                                {company?.address}
                            </p>

                            <div className="d-flex justify-content-center align-items-center my-1">
                                <QRCodeSVG value={`${window.location.origin}/qr/${company?.qr_code}`} size={150} />
                            </div>

                            <div className="border-top pt-1 mt-auto text-center">
                                <div className="text-muted small">Powered by</div>
                                <img
                                    src={poweredByLogoUrl}
                                    alt="Powered By Small Office PVT. LTD."
                                    className="mx-auto d-block"
                                    style={{ height: '30px', objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    </div>

                    )
            }
        </>
    );
};

export default CompanyQRCodeCard;