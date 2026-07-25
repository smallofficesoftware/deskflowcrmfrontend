import { useEffect, useMemo, useState } from "react";
import { SingleValue } from "react-select";
import CustomSearchDropdown from "../../../../../../../components/CustomSearchDropdown";
import ConfirmationModal from "../../../../../../../components/model/ConfirmationModal";
import RibbonBannerRight from "../../../../../../../components/model/RibbonBedgeRightSide/RibbonBannerRight";
import RibbonBanner from "../../../../../../../components/model/RibbonBedgetLeftSide/RibbonBannerLeft";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../../../helpers/AppConstants";
import { IOption } from "../../../../../../../helpers/AppInterface";
import { axiosInstance } from "../../../../../../../services/axiosInstance";
import { IProductView } from "../../ProductController";
import { fetchProductUnit } from "../bom-details/BomDetailsController";
import { createItemList, getItemList, handleDelete } from "./BomItemController";

interface IProps {
    product: IProductView;
    bomId: number;
    processId: number
}

const ProcessItemTable = ({
    product,
    bomId,
    processId
}: IProps) => {
    const [consumptionList, setConsumptionList] = useState<any[]>([]);
    const [rejectionList, setRejectionList] = useState<any[]>([]);

    // Item states for cons
    const [selectedProductSearchOptionForCons, setSelectedProductSearchOptionForCons] =
        useState<SingleValue<IOption>>(null);

    const handleReqDisplayChangeProductForCons = (
        selectedOption: SingleValue<IOption>
    ) => {
        setSelectedProductSearchOptionForCons(selectedOption);
    };

    // Item states for reject
    const [selectedProductSearchOptionForReject, setSelectedProductSearchOptionForReject] =
        useState<SingleValue<IOption>>(null);

    const handleReqDisplayChangeProductForReject = (
        selectedOption: SingleValue<IOption>
    ) => {
        setSelectedProductSearchOptionForReject(selectedOption);
    };

    const [productDetailsOfCons, setProductDetailsOfCons] = useState<any>([]);
    const [productDetailsOfReject, setProductDetailsOfReject] = useState<any>([]);

    const [isProductUnitList, isSetProductUnitList] = useState<any>([]);
    const [consUnitValue, setConsUnitValue] = useState<number | null>(null);
    const [rejectUnitValue, setRejectUnitValue] = useState<number | null>(null);

    const productUnitOptions = useMemo(() => {
        return isProductUnitList.map((item: any) => ({
            value: Number(item.id),
            label: item.unit,
        }));
    }, [isProductUnitList]);

    useEffect(() => {
        fetchProductUnit(isSetProductUnitList);
    }, []);

    const [consQty, setConsQty] = useState<string>("");
    const [rejectQty, setRejectQty] = useState<string>("");

    const [consRemark, setConsRemark] = useState<string>("");
    const [rejectRemark, setRejectRemark] = useState<string>("");

    const [recallGetItemOnDelete, setRecallGetItemOnDelete] = useState<boolean>(false);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [itemId, setItemId] = useState<number>();
    const [rejectReuse, setRejectReuse] = useState<"yes" | "no">("yes");

    const handleDeleteById = (id: number) => {
        setItemId(id);
        setIsDeleteConfirmation(true);
    };

    const loadProductOptionsForCons = async (inputValue: string): Promise<IOption[]> => {

        if (!inputValue || inputValue.trim().length < 3) {
            return [];
        }

        try {

            const getUUID = localStorage.getItem("UUID");

            const { data } = await axiosInstance.post(`product`, {
                searchTerm: inputValue,
                a_application_login_id: getUUID,
            });

            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setProductDetailsOfCons(data.data.item?.[0]);
                return data.data.item.map((item: any) => ({
                    value: item.id,
                    label: `${item.product_name} - ${item.product_code}`,
                }));
            }

            return [];
        } catch (error) {
            console.error("Error loading product options:", error);
            return [];
        }
    };

    const loadProductOptionsForReject = async (inputValue: string): Promise<IOption[]> => {

        if (!inputValue || inputValue.trim().length < 3) {
            return [];
        }

        try {

            const getUUID = localStorage.getItem("UUID");

            const { data } = await axiosInstance.post(`product`, {
                searchTerm: inputValue,
                a_application_login_id: getUUID,
            });

            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setProductDetailsOfReject(data.data.item?.[0]);
                return data.data.item.map((item: any) => ({
                    value: item.id,
                    label: `${item.product_name} - ${item.product_code}`,
                }));
            }

            return [];
        } catch (error) {
            console.error("Error loading product options:", error);
            return [];
        }
    };


    useEffect(() => {
        if (productDetailsOfCons?.unit_id) {
            setConsUnitValue(productDetailsOfCons.unit_id);
        }
    }, [productDetailsOfCons]);

    useEffect(() => {
        if (productDetailsOfReject?.unit_id) {
            setRejectUnitValue(productDetailsOfReject.unit_id);
        }
    }, [productDetailsOfReject]);

    useEffect(() => {
        getItemList(setConsumptionList, setRejectionList, product.id, processId);
    }, []);

    if (recallGetItemOnDelete) {
        getItemList(setConsumptionList, setRejectionList, product.id, processId);
        setRecallGetItemOnDelete(false);
    }

    const handleAdd = async (type: "cons" | "reject") => {

        // if(selectedProductSearchOptionForCons == null || consUnitValue == null || consQty == ""){

        // }

        let success = false;
        if (type === "cons") {
            success = await createItemList(
                selectedProductSearchOptionForCons,
                consUnitValue,
                consQty,
                consRemark,
                "cons",
                product.id,
                bomId,
                processId,
                rejectReuse
            );
            setSelectedProductSearchOptionForCons(null);
            setConsQty("");
            setConsUnitValue(null);
            setConsRemark("");

        } else {
            success = await createItemList(
                selectedProductSearchOptionForReject,
                rejectUnitValue,
                rejectQty,
                rejectRemark,
                "reject",
                product.id,
                bomId,
                processId,
                rejectReuse 
            );
            setSelectedProductSearchOptionForReject(null);
            setRejectQty("");
            setRejectUnitValue(null);
            setRejectRemark("");
            setRejectReuse("yes");
        }
        if (success) {
            getItemList(setConsumptionList, setRejectionList, product.id, processId);
        }
    };

    const totalPCCost = consumptionList.reduce((sum, item) => {
        const pc = Number(item.purchase_rate || 0);
        const qty = Number(item.qty || 0);
        return sum + (pc * qty);
    }, 0);

    const totalRejectSC = rejectionList.reduce((sum, item) => {
        const sc = Number(item.rate || 0);
        const qty = Number(item.qty || 0);
        return sum + (sc * qty);
    }, 0);

    return (
        <div className="head" style={{ fontSize: "14px" }}>

            <div className="source-of-type-list-grid-block m-0">

                <div className="source-of-type-list-grid-main">


                    <div className="d-flex gap-3">
                        <div className="w-50 card">
                            <RibbonBanner
                                color="#217a40"
                                style={{
                                    position: "absolute",
                                    left: "-27px",
                                    top: "-40px"
                                }}
                            >
                                Consumption
                            </RibbonBanner>

                            <table className="table" border={0}>

                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Unit</th>
                                        <th className="text-end">Remark</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {/* INPUT ROW */}
                                    <tr>
                                        <td style={{ width: "12vw" }}>
                                            <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card w-100 mt-2">
                                                <tr className="w-100">
                                                    <div className="d-flex flex-column gap-2 w-100">

                                                        <div className="form-group autosuggest-container w-100">
                                                            <CustomSearchDropdown
                                                                isAsync={true}
                                                                loadOptions={loadProductOptionsForCons}
                                                                value={selectedProductSearchOptionForCons}
                                                                onChange={(selected: any) => {
                                                                    handleReqDisplayChangeProductForCons(selected);
                                                                }}
                                                                className="w-100 h-100"
                                                                placeholder="Item"
                                                            />
                                                        </div>

                                                    </div>
                                                </tr>
                                            </div>
                                        </td>

                                        <td style={{ width: "5vw" }}>
                                            <div className="search-bar">
                                                <div className="add-source-of-type-section">
                                                    <input
                                                        value={consQty}
                                                        onChange={(e) =>
                                                            setConsQty(e.target.value)
                                                        }
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
                                                        style={{ textAlign: "end" }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td style={{ width: "10vw" }}>
                                            <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card w-100 mt-2">
                                                <tr>
                                                    <div>
                                                        <CustomSearchDropdown
                                                            options={productUnitOptions}
                                                            value={
                                                                productUnitOptions.find(
                                                                    (option: any) => option.value === Number(consUnitValue)
                                                                ) || null
                                                            }
                                                            onChange={(selectedOption: any) => {
                                                                setConsUnitValue(selectedOption?.value || null);
                                                            }}
                                                            className="w-100"
                                                            placeholder="Unit"
                                                        />
                                                    </div>
                                                </tr>
                                            </div>
                                        </td>

                                        <td style={{ width: "10vw" }}>
                                            <div className="search-bar">
                                                <div className="add-source-of-type-section">
                                                    <input
                                                        value={consRemark}
                                                        onChange={(e) =>
                                                            setConsRemark(e.target.value)
                                                        }
                                                        style={{ textAlign: "end" }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className=" mt-2" style={{ textAlign: "center" }}>
                                                <button className=""
                                                    onClick={async () => {
                                                        await handleAdd("cons");
                                                    }}
                                                >
                                                    <span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            height="26px"
                                                            viewBox="0 -960 960 960"
                                                            width="26px"
                                                            fill="#5f6368"
                                                        >
                                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                                        </svg>
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="table" border={0}>
                                <tbody>
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Unit</th>
                                        <th className="text-end">Purchase Cost<br /><span style={{ color: "#FF5454", fontWeight: "500" }}>*Per Unit</span></th>
                                        {/* <th className="text-end">Market Rate<br /><span style={{ color: "#FF5454", fontWeight: "500" }}>*Per Unit</span></th> */}
                                        <th className="text-end">Remark</th>
                                        <th className="text-center">Action</th>
                                    </tr>

                                    {/* DATA */}
                                    {consumptionList.map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.product_name}</td>
                                            <td className="text-end">{item.qty}</td>
                                            <td className="text-end">{item.unit_name}</td>
                                            <td className="text-end">{item.purchase_rate}</td>
                                            {/* <td>
                                                <div className="search-bar">
                                                    <div className="text-end">
                                                        <input
                                                            style={{ width: "6vw", textAlign: "end" }}
                                                            value={item.rate}
                                                            onChange={(e) => {
                                                                const updated = [...consumptionList];
                                                                updated[i].rate = e.target.value;
                                                                setConsumptionList(updated);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td> */}
                                            <td className="text-end"><div style={{ maxWidth: "95px", wordBreak: "break-word", height: "100%" }}>{item.remark}</div></td>
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    style={{ cursor: "pointer", marginRight: "10px" }}
                                                    onClick={() => handleDeleteById(item.id)}
                                                >
                                                    <svg
                                                        viewBox="0 -960 960 960"
                                                        width="22px"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td className="text-end"><b>Total</b></td>
                                        <td className="text-end">{totalPCCost.toFixed(2)}</td>
                                        {/* <td className="text-end">MR Total</td> */}
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div
                            style={{
                                borderLeft: '1px solid black',
                                height: 'auto',
                            }}
                        />

                        <div className="w-50 card">
                            <RibbonBannerRight
                                color="#ff5454"
                                style={{
                                    position: "absolute",
                                    right: "-27px",
                                    top: "-40px",
                                }}
                            >
                                Rejection
                            </RibbonBannerRight>

                            <table className="table" border={0}>
                                <thead>
                                    <tr>
                                        <th>Reuse</th>
                                        <th>Item Name</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Unit</th>
                                        <th className="text-end">Remark</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {/* INPUT ROW */}
                                    <tr>
                                        <td style={{ width: "8vw" }}>
                                            <div className="d-flex gap-2 justify-content-center mt-2">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="reuse"
                                                        value="yes"
                                                        checked={rejectReuse === "yes"}
                                                        onChange={() => setRejectReuse("yes")}
                                                    /> Yes
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="reuse"
                                                        value="no"
                                                        checked={rejectReuse === "no"}
                                                        onChange={() => setRejectReuse("no")}
                                                    /> No
                                                </label>
                                            </div>
                                        </td>
                                        <td style={{ width: "12vw" }}>

                                            <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card w-100 mt-2">
                                                <tr className="w-100">
                                                    <div className="d-flex flex-column gap-2 w-100">

                                                        {/* Product Search */}
                                                        <div className="form-group autosuggest-container w-100">

                                                            <CustomSearchDropdown
                                                                isAsync={true}
                                                                loadOptions={loadProductOptionsForReject}
                                                                value={selectedProductSearchOptionForReject}
                                                                onChange={(selected: any) => {
                                                                    handleReqDisplayChangeProductForReject(selected);

                                                                    const selectedProduct = productDetailsOfReject;
                                                                    if (selectedProduct?.unit_id) {
                                                                        setRejectUnitValue(selectedProduct.unit_id);
                                                                    }
                                                                }}
                                                                className="w-100 h-100"
                                                                placeholder="Item"
                                                            />
                                                        </div>

                                                    </div>
                                                </tr>
                                            </div>
                                        </td>

                                        <td style={{ width: "5vw" }}>
                                            <div className="search-bar">
                                                <div className="add-source-of-type-section">
                                                    <input
                                                        value={rejectQty}
                                                        onChange={(e) =>
                                                            setRejectQty(e.target.value)
                                                        }
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
                                                        style={{ textAlign: "end" }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td style={{ width: "10vw" }}>
                                            <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card w-100 mt-2">
                                                <tr>
                                                    <div>
                                                        <CustomSearchDropdown
                                                            options={productUnitOptions}
                                                            value={
                                                                productUnitOptions.find(
                                                                    (option: any) => option.value === Number(rejectUnitValue)
                                                                ) || null
                                                            }
                                                            onChange={(selectedOption: any) => {
                                                                setRejectUnitValue(selectedOption?.value || null);
                                                            }}
                                                            className="w-100"
                                                            placeholder="Unit"
                                                        />
                                                    </div>
                                                </tr>
                                            </div>
                                        </td>

                                        <td style={{ width: "10vw" }}>
                                            <div className="search-bar">
                                                <div className="add-source-of-type-section">
                                                    <input
                                                        value={rejectRemark}
                                                        onChange={(e) =>
                                                            setRejectRemark(e.target.value)
                                                        }
                                                        style={{ textAlign: "end" }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className=" mt-2" style={{ textAlign: "center" }}>
                                                <button className=""
                                                    onClick={async () => {
                                                        await handleAdd("reject");
                                                    }}
                                                >
                                                    <span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            height="26px"
                                                            viewBox="0 -960 960 960"
                                                            width="26px"
                                                            fill="#5f6368"
                                                        >
                                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                                        </svg>
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="table" border={0}>
                                <tbody>
                                    <tr>
                                        <th>Reuse</th>
                                        <th>Item</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Unit</th>
                                        <th className="text-end">Sales Cost<br /><span style={{ color: "#FF5454", fontWeight: "500" }}>*Per Unit</span></th>
                                        {/* <th className="text-end">Market Rate<br /><span style={{ color: "#FF5454", fontWeight: "500" }}>*Per Unit</span></th> */}
                                        <th className="text-end">Remark</th>
                                        <th className="text-center">Action</th>
                                    </tr>

                                    {/* DATA */}
                                    {rejectionList.map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.is_reusable === 1? "Yes" : "No"}</td>
                                            <td>{item.product_name}</td>
                                            <td className="text-end">{item.qty}</td>
                                            <td className="text-end">{item.unit_name}</td>
                                            <td className="text-end">{item.rate}</td>
                                            {/* <td>
                                                <div className="search-bar">
                                                    <div className="text-end">
                                                        <input
                                                            style={{ width: "6vw", textAlign: "end" }}
                                                            // value={item.rate}
                                                            onChange={(e) => {
                                                                const updated = [...rejectionList];
                                                                updated[i].rate = e.target.value;
                                                                setRejectionList(updated);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td> */}
                                            <td className="text-end"><div style={{ maxWidth: "95px", wordBreak: "break-word", height: "100%" }}>{item.remark}</div></td>
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    style={{ cursor: "pointer", marginRight: "10px" }}
                                                    onClick={() => handleDeleteById(item.id)}
                                                >
                                                    <svg
                                                        viewBox="0 -960 960 960"
                                                        width="22px"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className="text-end"><b>Total</b></td>
                                        <td className="text-end">{totalRejectSC.toFixed(2)}</td>
                                        {/* <td className="text-end">MR Total</td> */}
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <h6 className="d-flex justify-content-center mt-3" style={{ color: "#FF5454", marginBottom: "0" }}>*Kindly note that all the costs mentioned above are before GST</h6>
                </div>
            </div>
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => setIsDeleteConfirmation(false)}
                    handleSubmit={() =>
                        handleDelete(
                            itemId,
                            setRecallGetItemOnDelete,
                            setIsDeleteConfirmation,
                        )
                    }
                    title={"Delete this Item"}
                    message={"Are You Sure You Want To Delete This Item?"}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
        </div >
    );
};

export default ProcessItemTable;