import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createUnitMaster, IUnitView, updateUnit } from "./UnitMasterController";

interface IPropsCreateUnit {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IUnitView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCategory: () => void;
}

const CreateUnitView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCategory,
}: IPropsCreateUnit) => {

    const [unitInput, setUnitInputInput] = useState("");
    const [allowPoints, setAllowPoints] = useState<"" | "1" | "0">("");// Default to Yes (1)
    const [unitError, setUnitError] = useState("");
    const [allowdQtyError, setAllowdQtyError] = useState("");

    const canAdd = useCheckUserPermission(
        PAGE_ID.UNIT_MASTER,
        PERMISSION_TYPE.ADD
    );

    useEffect(() => {
        if (productToEdit) {
            setUnitInputInput(productToEdit.unit);
            setAllowPoints(productToEdit.is_point_value_allow == "1" ? "1" : "0");
        }
    }, []);

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setUnitInputInput(value);
        setUnitError(value ? "" : "Unit name is required");
        setAllowdQtyError(value ? "" : "Please Select You Are Allowed Qty in Points");
    };

    const handleAllowPointsChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const value = event.target.value as "" | "1" | "0";
        setAllowPoints(value);
        setAllowdQtyError(value ? "" : "Please Select You Are Allowed Qty in Points");
    };

    const clearForm = () => {
        setUnitInputInput("");
        setAllowPoints("1");
    };

    const handleSubmit = async () => {
        let isValid = true;

        if (unitInput.trim() === "") {
            setUnitError("Unit name is required");
            isValid = false;
        } else {
            setUnitError("");
        }

        if (allowPoints === "") {
            setAllowdQtyError("Please Select You Are Allowed Qty in Points");
            isValid = false;
        } else {
            setAllowdQtyError("");
        }

        if (!isValid) return;

        if (productToEdit && productToEdit.id !== undefined) {
            await updateUnit(
                {
                    unit: unitInput,
                    is_point_value_allow: allowPoints,
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

            await createUnitMaster(
                {
                    unit: unitInput,
                    is_point_value_allow: allowPoints,
                },
                setLoading,
                clearForm
            );
        }
        handleRefreshCategory();
        onHide();
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
                                    Enter Unit Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                        <input
                                            type="text"
                                            title="Category"
                                            maxLength={BIG_TEXT_LENGTH}
                                            placeholder="Add Product Unit"
                                            value={unitInput}
                                            onChange={(e) => handleChange(e)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12">
                                {unitError && (
                                    <span className="text-danger">{unitError}</span>
                                )}
                            </div>
                            <div className="col-12 d-flex align-items-center mx-1">
                                <label
                                    className="form-check-label mt-2"
                                    htmlFor="flexCheckDefault"
                                >
                                    <h6>
                                        Is Allowed To Qty In Points
                                        <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <select
                                    className="form-select mx-1"
                                    value={allowPoints}
                                    onChange={handleAllowPointsChange}
                                    style={{ width: "100px", height: "38px" }}
                                >
                                    <option value="">Select Option</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div className="col-12">
                                {allowdQtyError && (
                                    <span className="text-danger">{allowdQtyError}</span>
                                )}
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

export default CreateUnitView;