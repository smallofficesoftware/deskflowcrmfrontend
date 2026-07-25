import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { setUrlParams } from "../../services/axiosInstance";
import { useCompanyStore } from "../../store/company/useCompanyStore";
import { fetchContactById, IContact } from "./ContactAddressPrintController";

const ContactAddressEnvelopePrintView = () => {
    const [contactDetails, setContactDetails] = useState<IContact>();
    const { id, MobileToken, getID, printFlag } = useParams();


    useEffect(() => {
        setUrlParams({ MobileToken, getID });

        return () => {
            setUrlParams({});
        };
    }, [MobileToken, getID]);


    useEffect(() => {
        fetchContactById(
            Number(id),
            setContactDetails,
            MobileToken,
            getID
        );
    }, [id, MobileToken, getID]);

    useEffect(() => {
        if (contactDetails && !printFlag) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [contactDetails, printFlag]);

    const companyInfo = useCompanyStore((state) => state.companyInfo);

    const extractBrTags = (htmlString: any) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;

        const brElements = Array.from(tempDiv.querySelectorAll("br"));

        return brElements.map((_, index) => <br key={index} />);
    };

    return contactDetails ? (
        <><style>
            {`
            @page {
                size: A4 landscape;
                margin: 0;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                background: white;
            }

            .envelope-sheet {
                 width: 220mm;
                height: 110mm;

                position: relative;
            }

            .envelope-box {
                position: absolute;

                width: 220mm;
                height: 110mm;
                left: 0;
                top: 0;

                box-sizing: border-box;
                padding: 6mm;
            }

            *{
                box-sizing:border-box;
            }

            @media print {

            html,
            body {
                margin:0;
                padding:0;
                overflow: hidden;
            }

            .envelope-sheet {
                width: 220mm;
                height: 110mm;
                position: relative;
            }

            .envelope-box {
                position: absolute;
                left: 0;
                top: 0;
            }

            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            }
          .text-center {
            text-align: center !important;
          }
          .text-right {
            text-align: right !important;
          }
          .text-left {
            text-align: left !important;
          }
          .bolde-style {
            font-weight: bold;
          }
          .font-13 {
            font-size: 10px !important;
          }
          .font-20 {
            font-size: 15px !important;
            line-height: 1.2;
          }
          .font-18 {
            font-size: 12px !important;
            line-height: 1.25;
          }
          .font-16 {
            font-size: 10px !important;
          }
            .section{
                margin-top:10px;
            }
            body{
                border:none;
            }
          hr {
            border-top: 2px solid #000 !important;
            height: 2px;
            width:100%
          }

  .label-box {
    display: flex;
    flex-direction: column;
    gap: 3mm;

    width: 100%;
    height: 100%;
}

.label-title{
  text-align:center;
  font-weight:bold;
  font-size:12px;
  border-bottom:2px solid black;
  padding-bottom:4px;
  margin-bottom:6px;
}

.label-name{
  font-weight:bold;
  font-size:14px;
}

.label-company{
  word-break:break-word;
}

.label-address{
  margin-top:2px;
  word-break:break-word;
}

.label-pincode{
  font-weight:bold;
}

.label-phone{
  margin-top:2px;
}
        `}
        </style>
            <div className="envelope-sheet">
                <div className="envelope-box">
                    <div className="label-box">
                        <div className="to-section">
                            <strong className="font-20">To:</strong>
                            {(contactDetails.country_name ||
                                contactDetails.state_name ||
                                contactDetails.city_name ||
                                contactDetails.area_name ||
                                contactDetails.pincode) && (
                                    <>
                                        <div className="label-pincode font-20">
                                            {[
                                                contactDetails.area_name,
                                                contactDetails.city_name,
                                                contactDetails.state_name,
                                                contactDetails.country_name
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                            {contactDetails.pincode ? ` - ${contactDetails.pincode}` : ""}
                                        </div>
                                    </>
                                )}

                            {contactDetails.company_name && (
                                <div className="font-18 label-company section">
                                    <b>Company: </b>{contactDetails.company_name}
                                </div>
                            )}

                            {contactDetails.person_name && <div className="label-phone font-18">
                                <b>Name: </b>{contactDetails.person_name}
                            </div>}

                            {contactDetails.mobile_number && <div className="label-phone font-18">
                                <b>Contact No.: </b>{contactDetails.mobile_number}
                            </div>}

                            {contactDetails.email_id && (
                                <div className="font-18" style={{ marginTop: "6px" }}>
                                    <b>EMail: </b>{contactDetails.email_id}
                                </div>
                            )}

                            {contactDetails.address && <div className="label-address font-18 section">
                                <b>Address: </b>{contactDetails.address}
                            </div>}
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* <br /> */}
                        <div className="from-section">
                            <strong className="font-20 section">From:</strong>
                            {(
                                companyInfo.state_name ||
                                companyInfo.city_name
                            ) && (
                                    <>
                                        <div className="label-pincode font-20">
                                            {[
                                                companyInfo.city_name,
                                                companyInfo.state_name,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                    </>
                                )}

                            {companyInfo.company_name && (<div className="font-18 section">
                                <b>Company: </b>{companyInfo.company_name}
                            </div>)}

                            {companyInfo.company_contact && (<div className="label-phone font-18">
                                <b>Contact No.: </b>{companyInfo.company_contact}
                            </div>)}

                            {companyInfo.company_email && (<div className="font-18" style={{ marginTop: "6px" }}>
                                <b>Email: </b>{companyInfo.company_email}
                            </div>)}

                            {/* {companyInfo.city_name && (<div className="font-18">
                        City: {companyInfo.city_name}
                      </div>)} */}

                            {companyInfo.address && (<div className="label-address font-18 section">
                                <b>Address: </b>{companyInfo.address}
                            </div>)}
                        </div>
                    </div>
                </div>
            </div>
        </>
    ) : (
        <p className="text-center">Loading...</p>
    );
};

export default ContactAddressEnvelopePrintView;