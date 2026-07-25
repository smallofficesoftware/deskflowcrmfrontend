import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { setUrlParams } from "../../services/axiosInstance";
import { useCompanyStore } from "../../store/company/useCompanyStore";
import { IprintSetting } from "../order-pdf-view/OrderPdfController";
import { fetchContactById, IContact } from "./ContactAddressPrintController";

const ContactAddressPrintView1 = () => {
  const [contactDetails, setContactDetails] = useState<IContact>();
  const { id, MobileToken, getID, printFlag } = useParams();
  const [printSetting, setPrintSetting] = useState<IprintSetting>();


  useEffect(() => {
    setUrlParams({ MobileToken, getID });

    return () => {
      setUrlParams({});
    };
  }, [MobileToken, getID]);


  useEffect(() => {
    // fetchprintSetting(
    //   setPrintSetting,
    //   12,
    //   1,
    //   MobileToken,
    //   getID,
    // )
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

  return contactDetails ? (
    <><style>
      {`
          @page {
            width: 150mm;
            margin: 2mm 1mm;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .print-table th, .print-table td {
            border: 1px solid black;
            padding: 3px;
            font-size: 10px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .print-table th {
            text-align: center;
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
          .main-colspan-class {
            padding: 0 !important;
          }
          .srno {
            width: 10%;
          }
          .model {
            width: 40%;
          }
          .without_price_check {
            width: 25%;
          }
          .without_price_check_customer {
            width: 40%;
            padding-right: 5px !important;
          }
          .bolde-style {
            font-weight: bold;
          }
          .font-13 {
            font-size: 10px !important;
          }
          .font-20 {
            font-size: 20px !important;
          }
          .font-18 {
            font-size: 18px !important;
          }
          .font-16 {
            font-size: 16px !important;
          }
          .content {
            width: 100%;
          }
          hr {
            margin: 2px 0;
            border: 0;
            border-top: 1px solid black;
          }
          @media print {
            body, .print-table, .content {
              width: 101.6mm,
              min-height: 101.6mm,
              
            }
            .print-table th, .print-table td {
              padding: 2px !important;
            }
            .companyName{
              font-size: 20px !important;
            }
          }
          *{
            border:0px !important;
          }
          .companyName{
            font-size: 20px !important;
          }
          hr {
            border-top: 2px solid #000 !important;
            height: 2px;
            width:100%
          }
          .content td,th {
            padding: 2px 5px !important;
            height: 5px;
          }

  .label-box{
  border:2px solid black !important;
  padding:20px;
  width:200%;
}

.label-title{
  text-align:center;
  font-weight:bold;
  font-size:12px;
  border-bottom:2px solid black;
  padding-bottom:4px;
  margin-bottom:6px;
}

.label-content{
  line-height:1.4;
}

.label-name{
  font-weight:bold;
  font-size:14px;
}

.label-company{
  word-break:break-word;
}

.label-address{
  margin-top:4px;
  word-break:break-word;
}

.label-pincode{
  font-weight:bold;
}

.label-phone{
  margin-top:6px;
}
        `}
    </style>
      <div
        style={{
          position: "relative",
          width: "101.6mm",
          minHeight: "101.6mm",
          lineHeight: "1.2",
        }}
      >
        <div className="content" id="content">
          <table className="print-table">
            <tbody>
              <tr>
                <td colSpan={8}>
                  <div className="label-box">
                    <div className="label-content">
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
                            <br />
                          </>
                        )}

                      {contactDetails.company_name && (
                        <div className="font-18 label-company">
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
                      <br />

                      {contactDetails.address && <div className="label-address font-18">
                        <b>Address: </b>{contactDetails.address}
                      </div>}

                      <br />
                      {/* ----------------------------------------------------- */}
                      {/* <br /> */}
                      <br />

                      <strong className="font-20">From:</strong>
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
                            <br />
                          </>
                        )}

                      {companyInfo.company_name && (<div className="font-18">
                        <b>Company: </b>{companyInfo.company_name}
                      </div>)}

                      {companyInfo.company_contact && (<div className="label-phone font-18">
                        <b>Contact No.: </b>{companyInfo.company_contact}
                      </div>)}

                      {companyInfo.company_email && (<div className="font-18" style={{ marginTop: "6px" }}>
                        <b>Email: </b>{companyInfo.company_email}
                      </div>)}
                      <br />

                      {/* {companyInfo.city_name && (<div className="font-18">
                        City: {companyInfo.city_name}
                      </div>)} */}

                      {companyInfo.address && (<div className="label-address font-18">
                        <b>Address: </b>{companyInfo.address}
                      </div>)}

                    </div>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <p className="text-center">Loading...</p>
  );
};

export default ContactAddressPrintView1;