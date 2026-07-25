import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createPaymentType, IPaymentTypeView, TRANSACTION_MODES, updatePaymentType } from "./PaymentTypeController";

interface IPropsCreatePaymentType {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IPaymentTypeView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCategory: () => void;
}

const CreatePaymentTypeView = ({ show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCategory,
}: IPropsCreatePaymentType) => {

    const [typeInput, setTypeInput] = useState<string | undefined>("");
    const [typeHexColorInput, setTypeHexColorInput] = useState<string | undefined>("#999999");
    const [typeError, setTypeError] = useState("");
    const [transactionMode, setTransactionMode] = useState<number>(0);

    useEffect(() => {
        if (productToEdit) {
            setTypeInput(productToEdit.payment_type_name);
            setTypeHexColorInput(productToEdit.payment_color);
            setTransactionMode(productToEdit.transaction_type);
        }
    }, []);

    const canAdd = useCheckUserPermission(
        PAGE_ID.PAYMENT_TYPE,
        PERMISSION_TYPE.ADD
    );

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setTypeInput(value);
        setTypeError(value ? "" : "Payment Type is required");
    };

    const handleChangeHexColor = (event: TOnChangeInput) => {
        setTypeHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setTypeInput("");
        setTypeHexColorInput("#999999");
    };

    const handleSubmit = async () => {
        if (typeInput?.trim() === "") {
            setTypeError("Payment Type is required");
            return;
        }

        setTypeError("");

        if (typeInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updatePaymentType(
                    {
                        payment_type_name: typeInput,
                        payment_color: typeHexColorInput,
                        transaction_type: transactionMode
                    },
                    productToEdit.id,
                    setLoading,
                    clearForm
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createPaymentType(
                    {
                        payment_type_name: typeInput,
                        payment_color: typeHexColorInput,
                        transaction_type: transactionMode
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshCategory();
            onHide();
        }
    };

    useEscapeKey(onHide);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "35%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h2 className="modal-title1 form_header_text">{headerName}</h2>

                        <div className="head" style={{ display: "block", marginLeft: "20px" }}>
                            <label
                                className="form-check-label"
                                htmlFor="flexCheckDefault"
                            >
                                <h6>
                                    Enter Payment Type
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Type"
                                                maxLength={BIG_TEXT_LENGTH}
                                                placeholder="Add Payment Type"
                                                value={typeInput}
                                                onChange={(e) => handleChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={typeHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handleChangeHexColor(e)}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                {typeError && (
                                    <span className="text-danger">{typeError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-2">
                                <label className="form-check-label"><h6>Transaction Mode</h6></label>
                                <select
                                    className="form-select"
                                    value={transactionMode}
                                    onChange={(e) => {
                                        setTransactionMode(Number(e.target.value));
                                    }}
                                >
                                    {TRANSACTION_MODES.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                            <button
                                className="modal-button1"
                                onClick={onHide}
                                type="button"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                onClick={handleSubmit}
                                style={{
                                    backgroundColor: "#f58634",
                                }}
                            >
                                {productToEdit ? "Save" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default CreatePaymentTypeView;