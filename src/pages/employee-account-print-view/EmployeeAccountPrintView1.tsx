import { useEffect, useState } from "react";
// import "./OrderPrintView.css";
import { useParams } from "react-router-dom";
import {
    convertDateTimeFormat
} from "../../common/SharedFunction";
import SafeHtml from "../../components/SafeHtml";
import { PRINT_SETTING_TYPE_OBJ } from "../../helpers/AppEnum";
import { setUrlParams } from "../../services/axiosInstance";
import { fetchprintSetting, IprintSetting } from "../order-pdf-view/OrderPdfController";
import "../order-print-view/OrderPrintView.css";
import {
    fetchApiAccountTransitions
} from "./EmployeeAccountPrintController";

// Define interface for custom form fields based on console output
interface IOrderCompanyDetail {
    company_contact: string;
    company_email: string;
    company_name: string;
    footer_img: string;
    header_img: string;
    company_sign: string;
    company_logo: string;
    address: string;
    currency_id: number;
    gst_number: string;
    bank_detail: string;
    invoice_title: string;
    invoice_doc_no: string;
    invoice_view_color: string;
    invoice_view_formate: number;
    order_title: string;
    order_doc_no: string;
    order_view_color: string;
    order_view_formate: number;
    quotation_title: string;
    quotation_doc_no: string;
    quotation_view_color: string;
    quotation_view_formate: number;
    purchase_title: string;
    purchase_doc_no: string;
    purchase_view_color: string;
    purchase_view_formate: number;
    workorder_title: string;
    workorder_doc_no: string;
    workorder_view_color: string;
    workorder_view_formate: number;
    purchase_order_title: string;
    purchase_order_doc_no: string;
    purchase_order_view_color: string;
    purchase_order_view_formate: number;
    watermark_in_print: number;
}

interface IAccount {
    item: {
        id: number;
        type: string;
        mode: string;
        amount: number;
        payment_date_time: string;
        remark: string;
        created_date_time: Date;
        approve_by_a_application_login_id: number;
        approve_date_time: string;
        employee_name: {
            username: string;
            recovery_email: string;
            recovery_mobile: string;
        };
        payment_type_name: string;
    }[];
    companyDetails: IOrderCompanyDetail;
}

interface ICurrency {
    id: number;
    short_name: string;
    name: string;
    symbol: string;
}

const EmployeeAccountPrintView1 = () => {
    const [accountTransactions, setAccountTransactions] = useState<IAccount>();
    const { id, MobileToken, getID, printFlag } = useParams();
    const [printSetting, setPrintSetting] = useState<IprintSetting>();


    useEffect(() => {
        setUrlParams({ MobileToken, getID });

        return () => {
            setUrlParams({});
        };
    }, [MobileToken, getID]);


    useEffect(() => {
        fetchprintSetting(
            setPrintSetting,
            Number(PRINT_SETTING_TYPE_OBJ[String(-13) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
            1,
            MobileToken,
            getID,
        )
        fetchApiAccountTransitions(
            Number(id),
            setAccountTransactions,
            MobileToken,
            getID
        );
    }, [id, MobileToken, getID]);

    useEffect(() => {
        if (accountTransactions && !printFlag) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [accountTransactions, printFlag]);

    const extractBrTags = (htmlString: any) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;

        const brElements = Array.from(tempDiv.querySelectorAll("br"));

        return brElements.map((_, index) => <br key={index} />);
    };

    return accountTransactions ? (
        <div
            style={{
                position: "relative",
                width: "80mm",
                minHeight: "100vh",
                margin: "0 auto",
                fontSize: "10px",
                lineHeight: "1.2",
            }}
        >
            <div className="content" id="content">
                <style>
                    {`
          @page {
            width: 80mm;
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
          .content {
            width: 100%;
            max-width: 80mm;
          }
          hr {
            margin: 2px 0;
            border: 0;
            border-top: 1px solid black;
          }
          @media print {
            body, .print-table, .content {
              width: 80mm !important;
              max-width: 80mm !important;
            }
            .print-table th, .print-table td {
              font-size: 10px ;
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
        `}
                </style>
                <table className="print-table">
                    {printSetting?.setting_details.headerImage == true &&

                        <thead>
                            <>
                                <tr>
                                    <td
                                        className="companyName"
                                        colSpan={4}
                                        style={{
                                            textAlign: "center",
                                            border: "1px solid black",
                                            textTransform: "uppercase",
                                            fontWeight: "bold",
                                            padding: "3px",
                                        }}
                                    >
                                        {accountTransactions.companyDetails.company_name}
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        colSpan={4}
                                        style={{
                                            textAlign: "center",
                                            border: "1px solid black",
                                            padding: "3px",
                                        }}
                                    >
                                        {accountTransactions.companyDetails.address}
                                        <br />
                                        <b>Mo.</b>{" "}
                                        {accountTransactions.companyDetails.company_contact} ,{" "}
                                        <b>Email:</b>{" "}
                                        {accountTransactions.companyDetails.company_email} ,{" "}
                                        <b>GSTIN:</b> {accountTransactions.companyDetails.gst_number}
                                    </td>
                                </tr>
                            </>
                        </thead>
                    }
                    <tbody>
                        {printSetting?.setting_details.employeeDetails == true && (
                            <><tr >
                                <td className="main-colspan-class text-center" colSpan={4}>
                                    <hr />
                                    <p className="m-0">
                                        <b>Employee Details</b>
                                    </p>
                                    <hr />
                                </td>
                            </tr><tr>
                                    <td className="main-colspan-class" style={{ padding: "0" }} colSpan={4}>
                                        <table border={0} style={{ width: "100%", border: "0" }}>
                                            <tbody>

                                                {/* Customer Name */}
                                                <tr>
                                                    <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                        Employee Name:
                                                    </td>
                                                    <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                        {accountTransactions.item[0].employee_name?.username || "-"}
                                                    </td>
                                                </tr>
                                                {accountTransactions.item[0].employee_name?.recovery_mobile && <tr>
                                                    <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                        Mobile No:
                                                    </td>
                                                    <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                        {accountTransactions.item[0].employee_name?.recovery_mobile || "-"}
                                                    </td>
                                                </tr>}

                                                {accountTransactions.item[0].employee_name?.recovery_email && <tr>
                                                    <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                        Email:
                                                    </td>
                                                    <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                        {accountTransactions.item[0].employee_name?.recovery_email || "-"}
                                                    </td>
                                                </tr>}

                                            </tbody>
                                        </table>
                                    </td>
                                </tr></>
                        )}
                        <tr >
                            <td className="main-colspan-class text-center" colSpan={4}>
                                <hr />
                                <p className="m-0">
                                    <b>Account Transaction</b>
                                </p>
                                <hr />
                            </td>
                        </tr>

                        <tr>
                            <td className="main-colspan-class" style={{ padding: "0" }} colSpan={4}>
                                <table border={0} style={{ width: "100%", border: "0" }}>
                                    <tbody>
                                        {/* Transaction ID */}
                                        <tr>
                                            <td style={{ width: "48%", verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                Transaction ID:
                                            </td>
                                            <td style={{ width: "52%", textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                <span className="bolde-style"># {accountTransactions.item[0].id}</span>
                                            </td>
                                        </tr>

                                        {/* Customer Name */}
                                        <tr>
                                            <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                Employee Name:
                                            </td>
                                            <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                {accountTransactions.item[0].employee_name?.username || "-"}
                                            </td>
                                        </tr>

                                        {/* Amount */}
                                        <tr>
                                            <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                Amount:
                                            </td>
                                            <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                <span
                                                    className="bolde-style"
                                                    style={{
                                                        fontSize: "13px",
                                                        color: accountTransactions.item[0].type == "1" ? "green" : "red",
                                                    }}
                                                >
                                                    ₹ {accountTransactions.item[0].amount}
                                                    {accountTransactions.item[0].type == "1" ? " (Credit)" : " (Debit)"}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Payment Date & Time */}
                                        <tr>
                                            <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                Payment Date & Time:
                                            </td>
                                            <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                {accountTransactions.item[0].payment_date_time
                                                    ? convertDateTimeFormat(accountTransactions.item[0].payment_date_time).date + " " +
                                                    convertDateTimeFormat(accountTransactions.item[0].payment_date_time).time
                                                    : "-"}
                                            </td>
                                        </tr>

                                        {/* Payment Mode */}
                                        <tr>
                                            <td style={{ verticalAlign: "top", padding: "4px 6px 4px 0", fontWeight: "bold" }}>
                                                Payment Mode:
                                            </td>
                                            <td style={{ textAlign: "right", verticalAlign: "top", padding: "4px 0" }}>
                                                {accountTransactions.item[0].payment_type_name || "-"}
                                            </td>
                                        </tr>

                                        {/* Remark - This will take as many lines as needed */}
                                        <tr>
                                            <td style={{ textAlign: "left", verticalAlign: "top", padding: "6px 0 4px 0", fontWeight: "bold" }}>
                                                <SafeHtml
                                                    htmlContent={accountTransactions.item[0].remark || ""}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan={4}
                                style={{ height: "0px", padding: "0px", margin: "0px" }}
                            >
                                <hr />
                            </td>
                        </tr>
                        <tr
                            className="without_price_check"
                            style={{
                                border: "0px",
                                paddingBottom: "20px",
                                textAlign: "center",
                            }}
                        >
                            <td colSpan={4} style={{ border: "0" }}>
                                Thank You!
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    ) : (
        <p className="text-center">Loading...</p>
    );
};

export default EmployeeAccountPrintView1;
