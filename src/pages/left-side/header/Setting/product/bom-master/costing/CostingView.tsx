import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../../../services/axiosInstance";
import { IProductView } from "../../ProductController";

interface IPropsBOM {
    show: boolean;
    onHide: () => void;
    bomId: any;
    product: IProductView;
}

const CostingView = ({
    show,
    onHide,
    bomId,
    product
}: IPropsBOM) => {

    const [costingData, setCostingData] = useState({
        extra_charges_1: "",
        extra_charges_2: "",
        sales_rate: ""
    })

    const [costingRates, setCostingRates] = useState({
        process_grand_total: 0,
        total_cons_cost: 0,
        total_reject_cost: 0
    });

    const [totalCost, setTotalCost] = useState<number>(0);
    const [profitAmount, setProfitAmount] = useState<number>(0);
    const [profitPercentage, setProfitPercentage] = useState<number>(0);

    const costUpdate = async () => {
        const a_application_login_id = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const payload = {
            id: bomId,
            product_id: product.id,
            extra_charges_1: costingData.extra_charges_1,
            extra_charges_2: costingData.extra_charges_2,
            sales_rate: costingData.sales_rate
        };

        try {
            const response = await axiosInstance.post(
                "update-costing",
                payload,
                {
                    headers: {
                        Authorization: `${token}`,
                        "x-tenant-id": a_application_login_id,
                    },
                }
            );

            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                toast.success("Costing Updated Successfully");
                return true;
            } else {
                toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                return false;
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            );
            return false;
        }

    };

    const getCosting = async (
        productId: any,
    ) => {

        const getUUID = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const requestData = {
            product_id: productId
        };

        try {
            const response = await axiosInstance.post(
                "get-costing",
                requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                        "x-tenant-id": getUUID,
                    },
                }
            );

            if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setCostingData({
                    extra_charges_1: response.data.data.item.extra_charges_1,
                    extra_charges_2: response.data.data.item.extra_charges_2,
                    sales_rate: response.data.data.item.sales_rate
                });
            } else {
                setCostingData({
                    extra_charges_1: "",
                    extra_charges_2: "",
                    sales_rate: ""
                });
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            );
        }

    };

    const getCostingRates = async (
        bomId: any,
    ) => {

        const getUUID = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const requestData = {
            bom_id: bomId
        };

        try {
            const response = await axiosInstance.post(
                "get-costing-rates",
                requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                        "x-tenant-id": getUUID,
                    },
                }
            );

            if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setCostingRates({
                    process_grand_total: response.data.data.item.process_grand_total,
                    total_cons_cost: response.data.data.item.total_cons_cost,
                    total_reject_cost: response.data.data.item.total_reject_cost
                });
            } else {
                setCostingRates({
                    process_grand_total: 0,
                    total_cons_cost: 0,
                    total_reject_cost: 0
                });
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
            );
        }

    };

    useEffect(() => {
        getCostingRates(bomId);
    }, [bomId])

    useEffect(() => {
        getCosting(product.id);
    }, [])

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setCostingData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {

        const success = await costUpdate();
        // handleRefresh();
        // onHide();
    };

    useEffect(() => {
        let total_cost = 0;
        total_cost = costingRates.process_grand_total + costingRates.total_cons_cost + Number(costingData.extra_charges_1) + Number(costingData.extra_charges_2) - costingRates.total_reject_cost;

        setTotalCost(total_cost);
    }, [costingRates, costingData])

    useEffect(() => {
        let profit_amount = 0;
        profit_amount = Number(costingData.sales_rate) - totalCost;
        setProfitAmount(profit_amount);
    }, [costingData, totalCost])

    useEffect(() => {
        let profit_precentage = 0;
        profit_precentage = (profitAmount / totalCost) * 100;
        setProfitPercentage(profit_precentage);
    })

    return (
        (show && (
            <div
                style={{ overflowY: "auto", borderRadius: "10px" }}
            >
                <table className="table table-bordered mb-0" style={{ borderRadius: "10px" }}>

                    <thead>
                        <tr>
                            <th></th>
                            <th style={{ width: "40%", textAlign: "end" }}>As per Last Purchase</th>
                            {/* <th style={{ width: "40%", textAlign: "end" }}>As per Market</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ width: "20%" }}>Total Process Cost</td>
                            <td style={{ textAlign: "end" , color:"#ff5454", fontWeight:"bold"}}>{costingRates.process_grand_total.toFixed(2)}</td>
                            {/* <td>{data.partA}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Total Consumption Cost</td>
                            <td style={{ textAlign: "end", color:"#ff5454", fontWeight:"bold" }}>{costingRates.total_cons_cost.toFixed(2)}</td>
                            {/* <td className={data.partB < 0 ? "negative" : ""}>
                                {data.partB}
                            </td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Total Rejection Cost</td>
                            <td style={{ textAlign: "end", color:"#217a40", fontWeight:"bold" }}>{costingRates.total_reject_cost.toFixed(2)}</td>
                            {/* <td>{data.partC}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Extra Charges 1</td>
                            <td style={{ display: "flex", justifyContent: "end" }}>
                                <input
                                    style={{ width: "160px", height: "40px", textAlign: "end" }}
                                    type="text"
                                    value={costingData.extra_charges_1}
                                    className="form-control"
                                    name="extra_charges_1"
                                    onInput={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        e.target.value = e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                        );
                                        if (
                                            (e.target.value.match(/\./g) || [])
                                                .length > 1
                                        ) {
                                            e.target.value = e.target.value.slice(
                                                0,
                                                -1,
                                            );
                                        }
                                    }}
                                    onChange={handleChange}
                                /></td>
                            {/* <td>
                                <div className="d-flex justify-content-end">
                                    <input
                                        style={{ width: "160px", height: "40px", textAlign: "end" }}
                                        type="text"
                                        className="form-control"
                                        name="bom_name"
                                        onInput={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => {
                                            e.target.value = e.target.value.replace(
                                                /[^0-9.]/g,
                                                "",
                                            );
                                            if (
                                                (e.target.value.match(/\./g) || [])
                                                    .length > 1
                                            ) {
                                                e.target.value = e.target.value.slice(
                                                    0,
                                                    -1,
                                                );
                                            }
                                        }}
                                    />
                                </div>
                            </td> */}
                            {/* <td>{data.extraCharges1}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Extra Charges 2</td>
                            <td style={{ display: "flex", justifyContent: "end" }}>
                                <input
                                    style={{ width: "160px", height: "40px", textAlign: "end" }}
                                    type="text"
                                    className="form-control"
                                    name="extra_charges_2"
                                    value={costingData.extra_charges_2}
                                    onInput={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        e.target.value = e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                        );
                                        if (
                                            (e.target.value.match(/\./g) || [])
                                                .length > 1
                                        ) {
                                            e.target.value = e.target.value.slice(
                                                0,
                                                -1,
                                            );
                                        }
                                    }}
                                    onChange={handleChange}
                                /></td>
                            {/* <td>
                                <div className="d-flex justify-content-end">
                                    <input
                                        style={{ width: "160px", height: "40px", textAlign: "end" }}
                                        type="text"
                                        className="form-control"
                                        name="bom_name"
                                        onInput={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => {
                                            e.target.value = e.target.value.replace(
                                                /[^0-9.]/g,
                                                "",
                                            );
                                            if (
                                                (e.target.value.match(/\./g) || [])
                                                    .length > 1
                                            ) {
                                                e.target.value = e.target.value.slice(
                                                    0,
                                                    -1,
                                                );
                                            }
                                        }}
                                    // onChange={handleChange}
                                    />
                                </div>
                            </td> */}
                            {/* <td>{data.extraCharges2}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Total Cost</td>
                            <td style={{ textAlign: "end", fontWeight: "bold" }}>{totalCost.toFixed(2)}</td>
                            {/* <td>{data.totalCost}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Sales Rate</td>
                            <td style={{ display: "flex", justifyContent: "end" }}>
                                <input
                                    style={{ width: "160px", height: "40px", textAlign: "end" }}
                                    type="text"
                                    className="form-control"
                                    name="sales_rate"
                                    value={costingData.sales_rate}
                                    onInput={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        e.target.value = e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                        );
                                        if (
                                            (e.target.value.match(/\./g) || [])
                                                .length > 1
                                        ) {
                                            e.target.value = e.target.value.slice(
                                                0,
                                                -1,
                                            );
                                        }
                                    }}
                                    onChange={handleChange}
                                /></td>
                            {/* <td>
                                <div className="d-flex justify-content-end">
                                    <input
                                        style={{ width: "160px", height: "40px", textAlign: "end" }}
                                        type="text"
                                        className="form-control"
                                        name="bom_name"
                                        onInput={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => {
                                            e.target.value = e.target.value.replace(
                                                /[^0-9.]/g,
                                                "",
                                            );
                                            if (
                                                (e.target.value.match(/\./g) || [])
                                                    .length > 1
                                            ) {
                                                e.target.value = e.target.value.slice(
                                                    0,
                                                    -1,
                                                );
                                            }
                                        }}
                                    // onChange={handleChange}
                                    />
                                </div>
                            </td> */}
                            {/* <td>{data.salesRate}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Profit Amount</td>
                            <td style={{ textAlign: "end" }}>{profitAmount.toFixed(2)}</td>
                            {/* <td>{data.profitAmount}</td> */}
                        </tr>

                        <tr>
                            <td style={{ width: "20%" }}>Profit %</td>
                            <td style={{ textAlign: "end" }}>{profitPercentage.toFixed(2)}%</td>
                            {/* <td>{data.profitPercent}%</td> */}
                        </tr>
                    </tbody>
                </table>
                <div
                    style={{
                        bottom: 0,
                        background: "#fff",
                        padding: "15px",
                        borderTop: "1px solid #ddd",
                        zIndex: 1000,
                        position: "sticky"
                    }}
                    className="d-flex justify-content-end gap-2"
                >
                    <button
                        type="button"
                        className="modal-button1 rounded-1 px-4 py-2 ms-2"
                        onClick={onHide}
                        style={{
                            border: "1px solid #f58634",
                            color: "#f58634",
                            background: "transparent"
                        }}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        // onClick={() => handleSubmit(values)}
                        className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                        style={{
                            backgroundColor: "#f58634",
                        }}
                        onClick={handleSubmit}
                    >
                        Save
                    </button>
                </div>
            </div>
        ))
    )
};

export default CostingView;