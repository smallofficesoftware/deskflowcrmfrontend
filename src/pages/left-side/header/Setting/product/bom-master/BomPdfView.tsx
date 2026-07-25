import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../services/axiosInstance";

const BomPdfView = () => {
    const { id, printFlag, bomId } = useParams();
    const [autoPrint, setAutoPrint] = useState(Number(printFlag) !== 1);
    const [loading, setLoading] = useState(false);

    const [processList, setProcessList] = useState<any[]>([]);
    const [itemList, setItemList] = useState<any[]>([]);
    const [bomDetails, setBomDetails] = useState<Record<string, any>>({});
    const [costing, setCosting] = useState<Record<string, any>>({});
    const [product, setProduct] = useState<Record<string, any>>({});
    const [currencyData, setCurrencyData] = useState<Record<string, any>>({});

    const getAllData = async () => {

        setLoading(true);
        const getUUID = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const requestData = {
            product_id: id,
            bom_id: bomId,
            a_application_login_id: getUUID
        };

        try {
            const response = await axiosInstance.post(
                "get-all-bom-data",
                requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                        "x-tenant-id": getUUID,
                    },
                }
            );

            if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setBomDetails(response.data.data?.item?.bom_details || {});
                setProcessList(response.data.data?.item?.process_list || []);
                setItemList(response.data.data?.item?.item_list || []);
                setCosting(response.data.data?.item?.costing || {});
                setProduct(response.data.data?.item?.product || {});
                setCurrencyData(response.data.data?.item?.currency_data || {})
            } else {
                setBomDetails({});
                setProcessList([]);
                setItemList([]);
                setCosting({});
                setProduct({});
                setCurrencyData({});
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            );
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAllData();
    }, []);

    useEffect(() => {
        if (
            autoPrint &&
            !loading &&
            processList.length > 0
        ) {
            const t = setTimeout(() => window.print(), 800);
            return () => clearTimeout(t);
        }
    }, [loading, autoPrint, processList]);

    const frequencyDropdownOptions = [
        { label: "Weekly", value: 1 },
        { label: "Monthly", value: 2 },
        { label: "Half Yearly", value: 3 },
        { label: "Yearly", value: 4 },
    ];

    let total_cost = 0;
    total_cost = costing.process_grand_total + costing.total_cons_cost + Number(costing.extra_charges_1) + Number(costing.extra_charges_2) - costing.total_reject_cost;

    let profit_amount = 0;
    profit_amount = Number(costing.sales_rate) - total_cost;

    let profit_precentage = 0;
    profit_precentage = (profit_amount / total_cost) * 100;

    return (
        <>
            <style>
                {`
       @page { size: A2 portrait; margin: 15mm; }

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

/* Remove border only from header */
.no-border-header th {
    border: none !important;
}

/* Add border only to body */
.body-border td {
    border: 1px solid #dee2e6;
}

/* Optional: clean look */
.custom-table {
    border-collapse: collapse;
}

.no-border,
.no-border td,
.no-border th {
    border: none !important;
}

.no-border > :not(caption) > * > * {
    border-bottom-width: 0 !important;
}

.process-block {
    page-break-inside: avoid;
    break-inside: avoid;
}
        `}
            </style>

            <div className="statement-container">
                <div className="table-responsive mb-3 mt-3">
                    <div className="mb-5 d-flex justify-content-center">
                        <h2><b>Bill Of Material</b></h2>
                    </div>
                    <h5 style={{ fontWeight: "bold", margin: "0 0 15px 10px" }}>Product Details:</h5>
                    <table className="table table-sm no-border">
                        <tbody>
                            <tr>
                                <td>Item Name</td>
                                <td>-</td>
                                <td>{product.product_name}</td>
                                <td rowSpan={4} style={{ width: "50%" }} className="text-end">{product?.product_img && (
                                    <img src={product.product_img} alt="product" style={{
                                        width: "150px", height: "150px",
                                        objectFit: "cover", borderRadius: "10px"
                                    }} />
                                )}
                                </td>
                            </tr>
                            <tr>
                                <td>Item Code</td>
                                <td>-</td>
                                <td>{product.product_code}</td>
                            </tr>
                            <tr>
                                <td>Item Category</td>
                                <td>-</td>
                                <td>{product.category_name}</td>
                            </tr>
                            <tr>
                                <td>Item Group</td>
                                <td>-</td>
                                <td>{product.group_name}</td>
                            </tr>
                        </tbody>
                    </table>

                    <hr />

                    <table className="table table-sm custom-table">
                        <thead className="no-border-header">
                            <tr>
                                <th colSpan={2} style={{ width: "50%" }}>
                                    <h5 style={{ fontWeight: "bold", margin: 0 }}>BOM Details</h5>
                                </th>
                                <th colSpan={2} style={{ width: "50%" }}>
                                    <div className="d-flex justify-content-between">
                                        <h5 style={{ fontWeight: "bold", margin: 0 }}>Costing</h5>
                                        (In {currencyData.currency})
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="body-border">

                            <tr>
                                <td><strong>BOM Number</strong></td>
                                <td style={{ fontWeight: "650" }}>{bomDetails?.bom_number || "-"}</td>

                                <td><strong>Total Process Cost</strong></td>
                                <td style={{ textAlign: "end" }}>{costing?.process_grand_total?.toFixed(2) || 0}</td>
                            </tr>

                            <tr>
                                <td><strong>BOM Name</strong></td>
                                <td>{bomDetails?.bom_name || "-"}</td>

                                <td><strong>Total Consumption Cost</strong></td>
                                <td style={{ textAlign: "end" }}>{costing?.total_cons_cost?.toFixed(2) || 0}</td>
                            </tr>

                            <tr>
                                <td><strong>Quantity</strong></td>
                                <td>{bomDetails?.qty || "-"}</td>

                                <td><strong>Total Rejection Cost</strong></td>
                                <td style={{ textAlign: "end" }}>{costing?.total_reject_cost?.toFixed(2) || 0}</td>
                            </tr>

                            <tr>
                                <td><strong>Unit</strong></td>
                                <td>{bomDetails?.unit_name || "-"}</td>

                                <td><strong>Extra Charges 1</strong></td>
                                <td style={{ textAlign: "end" }}>{costing?.extra_charges_1?.toFixed(2) || 0}</td>
                            </tr>

                            <tr>
                                <td><strong>Review Frequency</strong></td>
                                <td>{frequencyDropdownOptions.find(
                                    (option) => option.value === Number(bomDetails?.bom_review_frequency)
                                )?.label || "-"}</td>

                                <td><strong>Extra Charges 2</strong></td>
                                <td style={{ textAlign: "end" }}>{costing?.extra_charges_2?.toFixed(2) || 0}</td>
                            </tr>

                            <tr>
                                <td colSpan={2}></td>

                                <td><strong>Total Cost</strong></td>
                                <td style={{ textAlign: "end" }}>{total_cost?.toFixed(2)}</td>
                            </tr>

                            <tr>
                                <td colSpan={2}></td>

                                <td><strong>Sales Rate</strong></td>
                                <td style={{ textAlign: "end" }}>{costing?.sales_rate?.toFixed(2) || 0}</td>
                            </tr>

                            <tr>
                                <td colSpan={2}></td>

                                <td><strong>Profit Amount</strong></td>
                                <td style={{ textAlign: "end", color: profit_amount < 0 ? "#FF5454" : "#217A40" }}>{profit_amount?.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>

                                <td><strong>Profit %</strong></td>
                                <td style={{ textAlign: "end", color: profit_precentage < 0 ? "#FF5454" : "#217A40" }}>{profit_precentage?.toFixed(2)}</td>
                            </tr>

                        </tbody>
                    </table>
                </div>

                <hr />

                <h5 style={{ marginBottom: "25px", fontWeight: "bold" }}>BOM Process:</h5>

                {processList.length !== 0 ? (processList.map((process: any, index: number) => {
                    const relatedItems = itemList.filter(
                        (item: any) => item.process_id === process.id
                    );
                    const consumptionItems = relatedItems.filter((item: any) => item.type === 1);
                    const rejectionItems = relatedItems.filter((item: any) => item.type !== 1);

                    return (
                        <div key={process.id} className="process-block" style={{ marginBottom: "40px" }}>

                            {/* PROCESS HEADER */}
                            <h6 style={{ marginBottom: "8px" }}><strong>
                                {index + 1}. {process.process_name}</strong>
                            </h6>

                            <table className="table table-bordered table-sm mb-2">
                                <tbody>
                                    <tr>
                                        <td>Workstation</td>
                                        <td>{process.machine_name}</td>

                                        <td>Required Time(In Minute)</td>
                                        <td>{process.required_time}</td>
                                    </tr>
                                    <tr>
                                        <td>Process Cost(In {currencyData.currency})</td>
                                        <td>{process.process_cost}</td>

                                        <td>Manpower Cost(In {currencyData.currency})</td>
                                        <td>{process.manpower_cost}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* ITEMS TABLE */}
                            {/* ITEMS SECTION */}
                            <div>

                                {/* CONSUMPTION - TOP */}
                                <div style={{ marginBottom: "15px" }}>
                                    <h6><strong>Consumption</strong></h6>

                                    <table className="table table-bordered table-sm">
                                        <thead className="table" style={{ backgroundColor: "#e6ffe6" }}>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Unit</th>
                                                <th>Rate</th>
                                                <th>Total</th>
                                                <th>Reusable</th>
                                                <th>Remark</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {consumptionItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center">
                                                        No Consumption Items
                                                    </td>
                                                </tr>
                                            ) : (
                                                consumptionItems.map((item: any, i: number) => {
                                                    const rate = item.purchase_rate;
                                                    const total = Number(item.qty || 0) * Number(rate || 0);

                                                    return (
                                                        <tr key={i}>
                                                            <td>{item.product_name}</td>
                                                            <td>{item.qty}</td>
                                                            <td>{item.unit_name}</td>
                                                            <td>{rate.toFixed(2) || 0}</td>
                                                            <td>{total.toFixed(2)}</td>
                                                            <td>{item.is_reusable === 1 ? "Yes" : "No"}</td>
                                                            <td>{item.remark}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* REJECTION - BOTTOM */}
                                <div>
                                    <h6><strong>Rejection</strong></h6>

                                    <table className="table table-bordered table-sm">
                                        <thead className="table" style={{ backgroundColor: "#ffe6e6" }}>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Unit</th>
                                                <th>Rate</th>
                                                <th>Total</th>
                                                <th>Reusable</th>
                                                <th>Remark</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {rejectionItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center">
                                                        No Rejection Items
                                                    </td>
                                                </tr>
                                            ) : (
                                                rejectionItems.map((item: any, i: number) => {
                                                    const rate = item.rate;
                                                    const total = Number(item.qty || 0) * Number(rate || 0);

                                                    return (
                                                        <tr key={i}>
                                                            <td>{item.product_name}</td>
                                                            <td>{item.qty}</td>
                                                            <td>{item.unit_name}</td>
                                                            <td>{rate.toFixed(2) || 0}</td>
                                                            <td>{total.toFixed(2)}</td>
                                                            <td>{item.is_reusable === 1 ? "Yes" : "No"}</td>
                                                            <td>{item.remark}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>
                    );
                })) : (<h6 style={{ marginLeft: "10px" }}>No process available.</h6>)}
            </div>

        </>

    );
};

export default BomPdfView;
