import { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import PrintSettingModal from "../../components/model/PrintSettingModal";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../helpers/AppConstants";
import { PRINT_SETTING_TYPE_OBJ } from "../../helpers/AppEnum";
import { setUrlParams } from "../../services/axiosInstance";
import { loadSessionCookie } from "../../store/onlineStore/cookieSession";
import { fetchprintSetting, IprintSetting } from "../order-pdf-view/OrderPdfController";
import { IAccountTransaction } from "../right-side/list-account-transaction/ListAccounTransactionController";
import { fetchApiAccountTransitions } from "./AccountTransactionV1Controller";

const fmtNumber = (n?: number) =>
    n == null ? "-" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtDate = (iso?: string, fallback?: string) => {
    if (!iso) return fallback || "";
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
        return d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    return fallback || iso;
};
function fmtTitleDate(dateInput: any) {
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
const formatBalance = (amount: number) => {
    const absVal = Math.abs(amount);
    const formatted = fmtNumber(absVal);
    if (amount >= 0) {
        return <span style={{ color: "green" }}>{formatted} (Cr)</span>;
    } else {
        return <span style={{ color: "red" }}>{formatted} (Dr)</span>;
    }
};

interface ContactData {
    id?: number;
    person_name?: string;
    company_name?: string;
    mobile_number?: string;
    email_id?: string;
    address?: string;
    shipping_address?: string;
    gst_number?: string;
}

const AccountTransactionV1 = () => {
    const sessionData = loadSessionCookie();
    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const qrCode = queryParams.get("qr_code");
    const { id, MobileToken, getID, printFlag } = useParams();
    const [searchParams] = useSearchParams();
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const creditFilter = searchParams.get("creditFilter") || undefined;
    const debitFilter = searchParams.get("debitFilter") || undefined;

    const [accountTransactionList, setAccountTransactionList] = useState<IAccountTransaction[]>([]);
    const [autoPrint, setAutoPrint] = useState(Number(printFlag) !== 1);
    const [closingBalance, setClosingBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [companyData, setCompanyData] = useState<any>({});
    const [contactData, setContactData] = useState<ContactData | null>(null);
    const [printSetting, setPrintSetting] = useState<IprintSetting>();
    const [isPrintSettingShow, setIsPrintSettingShow] =
        useState(false);



    useEffect(() => {
        setUrlParams({ MobileToken, getID });

        return () => {
            setUrlParams({});
        };
    }, [MobileToken, getID]);

    useEffect(() => {
        fetchprintSetting(
            setPrintSetting,
            Number(PRINT_SETTING_TYPE_OBJ[String(-12) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
            1,
            MobileToken,
            getID,
        )

        fetchApiAccountTransitions(
            0,
            setAccountTransactionList,
            setLoading,
            id ? Number(id) : undefined,
            setClosingBalance,
            setCompanyData,
            MobileToken,
            getID,
            qrCode,
            // optional callback to set contact data if your controller supports it
            (cdata?: ContactData) => {
                if (cdata) setContactData(cdata);
            },
            startDate,
            endDate,
            creditFilter,
            debitFilter
        );
    }, [id, MobileToken, getID, printFlag]);

    useEffect(() => {
        if (autoPrint && !loading && !qrCode) {
            const t = setTimeout(() => window.print(), 600);
            return () => clearTimeout(t);
        }
    }, [loading, autoPrint]);

    const totalCredit = accountTransactionList.reduce((s, it) => {
        const approved = it.approve_by_a_application_login_id !== 0;
        return s + (approved && Number(it.type) === 1 ? Number(it.amount || 0) : 0);
    }, 0);

    const totalDebit = accountTransactionList.reduce((s, it) => {
        const approved = it.approve_by_a_application_login_id !== 0;
        return s + (approved && Number(it.type) === 2 ? Number(it.amount || 0) : 0);
    }, 0);

    const isPresent = (v?: string | null) => {
        if (v == null) return false;
        return String(v).trim().length > 0;
    };

    const contactFields = (cd: ContactData) => {
        const rows: { label: string; value?: string }[] = [
            { label: "Name", value: cd.person_name },
            { label: "Company", value: cd.company_name },
            { label: "Mobile", value: cd.mobile_number },
            { label: "Email", value: cd.email_id },
            { label: "Address", value: cd.address },
            { label: "Shipping Address", value: cd.shipping_address },
            { label: "GSTIN", value: cd.gst_number },
        ];
        return rows.filter(r => isPresent(r.value));
    };
    const displayedTxs = accountTransactionList.filter((tx) => tx.approve_by_a_application_login_id !== 0);
    let running = 0;
    const rowsWithBalance = displayedTxs.map((tx) => {
        const amt = Number(tx.amount || 0);
        if (Number(tx.type) === 1) {
            running += amt;
        } else if (Number(tx.type) === 2) {
            running -= amt;
        } else {
            // treat unknown types as no-op (or adapt if needed)
        }
        return { ...tx, balance: running };
    });
    const lastRowBalance = rowsWithBalance.length > 0 ? rowsWithBalance[rowsWithBalance.length - 1].balance : closingBalance;
    const fromDate = rowsWithBalance.length > 0
        ? fmtTitleDate(rowsWithBalance[0].s_timestemp || rowsWithBalance[0].payment_date_time)
        : "";
    const toDate = fmtTitleDate(new Date().toISOString());
    if (loading) return <p className="text-center">Loading...</p>;

    const openPrintSetting = () => {
        setIsPrintSettingShow(true);
    };


    return (
        <>
            <style>
                {`
       @page { size: A4 portrait; margin: 15mm; }

@media print { 
  body { -webkit-print-color-adjust: exact; } 
  .no-print { display: none !important; } 
}

.statement-container { 
  max-width: 1000px; 
  margin: 0 auto; 
  background: #fff; 
  padding: 15px; 
  border-radius: 4px; 
}

.company-logo { 
  max-height: 60px; 
  object-fit: contain; 
}

.table-sm th, .table-sm td { 
  padding: .3rem .5rem; 
  vertical-align: middle; 
}

.remark-cell { 
  max-width: 280px; 
  word-break: break-word; 
  white-space: pre-wrap; 
}

.totals-row td { 
  font-weight: 600; 
}

.table-data { 
  font-size: 15px; 
}

.contact-card { 
  border: 1px solid #e9ecef; 
  padding: 8px 12px; 
  border-radius: 4px; 
  background: #fafafa; 
}

tr { 
  page-break-inside: avoid; 
  break-inside: avoid; 
}

td, th { 
  page-break-inside: avoid; 
  break-inside: avoid; 
}
        `}
            </style>

            <div className="statement-container">
                <div className="print-setting" style={{ position: "absolute", top: "0", right: "0" }}>
                    <button className="icons " onClick={openPrintSetting} title="Print setting">
                        <span className="text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>

                        </span>
                    </button>
                </div>
                {/* <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                        <div>
                            <h5 className="mb-0" style={{ textTransform: "uppercase" }}>
                                {companyData?.company_name || ""}
                            </h5>
                            {isPresent(companyData?.address) && (
                                <div className="small text-muted">{companyData.address}</div>
                            )}
                            <div className="small text-muted">
                                {isPresent(companyData?.company_contact) && <>Mo. {companyData.company_contact}</>}
                                {isPresent(companyData?.company_email) && <> {isPresent(companyData?.company_contact) ? " | " : ""}{companyData.company_email}</>}
                                {isPresent(companyData?.gst_number) && <div className="small text-muted">GSTIN: {companyData.gst_number}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="text-end">
                        <h6 className="mb-0 text-start">Account Statement</h6>
                        <p className="text-muted text-start small">From {fromDate} to {toDate}</p>
                        {contactData && (
                            <div className="mt-2 text-start small">
                                {contactData.person_name && <div><strong>{contactData.person_name}</strong></div>}
                                {contactData.company_name && <div>{contactData.company_name}</div>}
                                {contactData.mobile_number && <div>Mo. {contactData.mobile_number}</div>}
                                {contactData.email_id && <div>{contactData.email_id}</div>}
                                {contactData.address && <div>{contactData.address}</div>}
                                {contactData.shipping_address && <div>{contactData.shipping_address}</div>}
                                {contactData.gst_number && <div>GSTIN: {contactData.gst_number}</div>}
                            </div>
                        )}
                    </div>
                </div> */}

                {printSetting?.setting_details.headerImage == true &&
                    <div className="row mb-2">
                        <div className="col-6">
                            <h5 className="mb-0 text-uppercase">
                                {companyData?.company_name || ""}
                            </h5>
                            {isPresent(companyData?.address) && (
                                <div className="small">{companyData.address}</div>
                            )}
                            <div className="small">
                                {isPresent(companyData?.company_contact) && <>Mo. {companyData.company_contact}</>}
                                {isPresent(companyData?.company_email) && (
                                    <>
                                        {" "}
                                        {isPresent(companyData?.company_contact) ? " | " : ""}
                                        {companyData.company_email}
                                    </>
                                )}
                                {isPresent(companyData?.gst_number) && (
                                    <div className="small">GSTIN: {companyData.gst_number}</div>
                                )}
                            </div>
                        </div>

                        <div className="col-6 text-start">
                            <h6 className="mb-0">Account Statement</h6>
                            <p className="text-muted small">From {fromDate} to {toDate}</p>
                            {contactData && (
                                <div className="mt-2 small text-start">
                                    {contactData.person_name && <div><strong>{contactData.person_name}</strong></div>}
                                    {contactData.company_name && <div>{contactData.company_name}</div>}
                                    {contactData.mobile_number && <div>Mo. {contactData.mobile_number}</div>}
                                    {contactData.email_id && <div>{contactData.email_id}</div>}
                                    {contactData.address && <div>{contactData.address}</div>}
                                    {contactData.shipping_address && <div>{contactData.shipping_address}</div>}
                                    {contactData.gst_number && <div>GSTIN: {contactData.gst_number}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                }


                <hr />

                <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                        <thead className="table-light">
                            <tr>
                                <th>No.</th>
                                <th>Date & Time</th>
                                <th>Remark</th>
                                <th className="text-end">Credit</th>
                                <th className="text-end">Debit</th>
                                <th className="text-end">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="table-data">
                            {rowsWithBalance.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-3">No transactions found</td>
                                </tr>
                            ) : (
                                rowsWithBalance
                                    .filter((tx) => tx.approve_by_a_application_login_id !== 0)
                                    .map((tx, idx) => {
                                        const paymentDate = tx.s_timestemp ? fmtDate(tx.s_timestemp, tx.payment_date_time) : (tx.payment_date_time || "");
                                        const isCredit = Number(tx.type) === 1;
                                        const isDebit = Number(tx.type) === 2;
                                        return (
                                            <tr key={tx.id}>
                                                <td>#{tx.id}</td>
                                                <td>{paymentDate}</td>
                                                <td className="remark-cell"><span dangerouslySetInnerHTML={{ __html: tx.remark || "" }} /></td>
                                                {/* <td>{tx.reference_table ? `${tx.reference_table} #${tx.reference_id || ""}` : "-"}</td> */}
                                                <td className="text-end">{isCredit ? fmtNumber(Number(tx.amount || 0)) : "-"}</td>
                                                <td className="text-end">{isDebit ? fmtNumber(Number(tx.amount || 0)) : "-"}</td>
                                                <td className="text-end">{formatBalance((tx as any).balance)}</td>
                                            </tr>
                                        );
                                    })
                            )}
                            <tr className="totals-row">
                                <td colSpan={3}>Total</td>
                                <td className="text-end">{fmtNumber(totalCredit)}</td>
                                <td className="text-end">{fmtNumber(totalDebit)}</td>
                                <td className="text-end">{formatBalance(lastRowBalance)}</td>
                            </tr>
                            {/* <tr className="totals-row">
                                <td colSpan={3} className="text-end">Total Credit</td>
                                <td className="text-end">{fmtNumber(totalCredit)}</td>
                                <td colSpan={3}></td>
                            </tr>
                            <tr className="totals-row">
                                <td colSpan={3} className="text-end">Total Debit</td>
                                <td className="text-end">{fmtNumber(totalDebit)}</td>
                                <td colSpan={3}></td>
                            </tr>
                            <tr style={{ background: "#f8f9fa", fontWeight: 700 }}>
                                <td colSpan={3} className="text-end">Closing Balance</td>
                                <td className="text-end">{fmtNumber(lastRowBalance)}</td>
                                <td colSpan={3}></td>
                            </tr> */}
                        </tbody>
                    </table>
                </div>

                {/* {companyData?.terms_and_condition && (
                    <>
                        <hr />
                        <div>
                            <h6>Terms & Conditions</h6>
                            <div dangerouslySetInnerHTML={{ __html: companyData.terms_and_condition }} />
                        </div>
                    </>
                )} */}

                {printSetting?.setting_details.footerImage == true &&
                    <div className="text-center mt-4">
                        {companyData?.footer_img && (
                            <img src={`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData.footer_img}`} alt="footer" style={{ width: "100%" }} />
                        )}
                    </div>
                }
                {isPrintSettingShow && printSetting && (
                    <PrintSettingModal
                        show={isPrintSettingShow}
                        setShow={setIsPrintSettingShow}
                        onHide={() => setIsPrintSettingShow(false)}
                        handleSubmit={() => {

                            if (true) {
                                fetchprintSetting(
                                    setPrintSetting,
                                    Number(PRINT_SETTING_TYPE_OBJ[String(-12) as keyof typeof PRINT_SETTING_TYPE_OBJ]),
                                    1,
                                    MobileToken,
                                    getID,

                                )
                            } else {
                                setIsPrintSettingShow(false);
                            }
                        }}

                        orderType={-12}
                        viewFormate={1}
                        orderById={printSetting?.setting_details}
                        titles={"Create"}
                        message={"Please Enter Your Order Details"}
                        btn1={"CANCEL"}
                        btn2={"Approve"}
                    />
                )}

            </div>
        </>

    );
};

export default AccountTransactionV1;
