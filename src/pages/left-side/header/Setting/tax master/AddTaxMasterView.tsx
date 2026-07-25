import { useEffect, useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { TReactSetState } from "../../../../../helpers/AppType";
import { createTax, ITaxView, updateTax } from "./TaxMasterController";

interface IPropsAddTax {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ITaxView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshTax: () => void;
}

const AddTaxMasterView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshTax
}: IPropsAddTax) => {
    const [taxValue, setTaxValue] = useState("");
    const [taxName, setTaxName] = useState("");

    const [taxValueError, setTaxValueError] = useState("");
    const [taxNameError, setTaxNameError] = useState("");

    useEffect(() => {
        if (productToEdit) {
            setTaxValue(productToEdit.value);
            setTaxName(productToEdit.name);
        }
    }, []);

    const clearForm = () => {
        setTaxValue("");
        setTaxName("");
    };

    const handleSubmit = async () => {
        let isValid = true;

        if (!taxValue) {
            setTaxValueError("Please Enter Tax Value");
            isValid = false;
        } else {
            setTaxValueError("");
        }

        if (!taxName.trim()) {
            setTaxNameError("Please Enter Name");
            isValid = false;
        } else {
            setTaxNameError("");
        }

        if (!isValid) return;

        if (taxValue && taxName) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateTax(
                    {
                        value: taxValue,
                        name: taxName
                    },
                    productToEdit.id,
                    setLoading,
                    clearForm
                );
            } else {
                // if (!canAdd) {
                //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                //     return;
                // }
                await createTax(
                    {
                        value: taxValue,
                        name: taxName
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshTax();
            onHide();
        }
    };

    useEscapeKey(onHide);

    return (
        <>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "35%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>

                        <h2 className="modal-title1 form_header_text">
                            {headerName}
                        </h2>

                        <div
                            className="head"
                            style={{ display: "block", marginLeft: "20px" }}
                        >
                            {/* tax Value Field */}
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Tax Value <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Enter Value"
                                    className="form-control"
                                    value={taxValue}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*\.?\d*$/.test(val)) {
                                            setTaxValue(val);
                                            setTaxValueError("");
                                        }
                                    }}
                                />

                                {taxValueError && (
                                    <span className="text-danger">{taxValueError}</span>
                                )}
                            </div>

                            {/* tax Name Field */}
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Tax Name <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Name"
                                    value={taxName}
                                    onChange={(e) => {
                                        setTaxName(e.target.value);
                                        setTaxNameError("");
                                    }}
                                />

                                {taxNameError && (
                                    <span className="text-danger">{taxNameError}</span>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                            <button
                                className="modal-button1"
                                onClick={onHide}
                                type="button"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                onClick={handleSubmit}
                                style={{
                                    backgroundColor: "#f58634",
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddTaxMasterView;