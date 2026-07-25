import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createLabel, ILabelView, updateLabel } from "./LabelController";

interface IPropsCreateLabel {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ILabelView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshLabel: () => void;
}

const CreateLabelView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshLabel,
}: IPropsCreateLabel) => {

    const [labelInput, setLabelInputInput] = useState("");
    const [labelHexColorInput, setLabelHexColorInput] = useState("#999999");
    const [isLabelInputReadOnly, setIsLabelInputReadOnly] = useState(false);
    const [labelError, setlabelError] = useState("");

    const canAdd = useCheckUserPermission(PAGE_ID.LABEL, PERMISSION_TYPE.ADD);

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setLabelInputInput(value);
        setlabelError(value ? "" : "Label Name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setLabelHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setLabelInputInput("");
        setLabelHexColorInput("#999999");
        setIsLabelInputReadOnly(false);
    };

    const handelSubmit = async () => {
        if (labelInput.trim() === "") {
            setlabelError("Label Name is required");
            return;
        }

        setlabelError("");
        if (labelInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateLabel(
                    {
                        lable_name: labelInput,
                        color: labelHexColorInput,
                    },
                    setLoading,
                    productToEdit.id,
                    clearForm
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createLabel(
                    { lable_name: labelInput, color: labelHexColorInput },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshLabel();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setLabelInputInput(productToEdit.lable_name);
            setLabelHexColorInput(productToEdit.color || "#999999");
            setlabelError("");
            setIsLabelInputReadOnly(productToEdit.id < 0);
        }
    }, []);

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
                                    Enter Label Name<span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Add Label Name"
                                                placeholder="Add Label Name"
                                                maxLength={SMALL_TEXT_LENGTH}
                                                value={labelInput}
                                                onChange={(e) => handelChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handelSubmit();
                                                    }
                                                }}
                                                // disabled
                                                readOnly={isLabelInputReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={labelHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (labelInput.trim() === "") {
                                                setlabelError("Label Name is required");
                                                return;
                                            }
                                            if (e.key === "Enter") {
                                                handelSubmit();
                                            }
                                        }}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div>
                                {labelError && (
                                    <span className="text-danger">{labelError}</span>
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
                                onClick={handelSubmit}
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

export default CreateLabelView;