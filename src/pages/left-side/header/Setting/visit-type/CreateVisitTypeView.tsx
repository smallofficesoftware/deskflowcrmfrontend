import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createVisitType, IVisitTypeView, updateVisitType } from "./VisitTypeController";

interface IPropsCreateVisitType {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IVisitTypeView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshVisitType: () => void;
}

const CreateVisitTypeView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshVisitType,
}: IPropsCreateVisitType) => {

    const [visitTypeInput, setVisitTypeInput] = useState("");
    const [visitTypeHexColorInput, setVisitTypeHexColorInput] = useState<string | undefined>("#999999");
    const [visitTypeError, setVisitTypeError] = useState("");

    const canAdd = useCheckUserPermission(PAGE_ID.VISIT_TYPE, PERMISSION_TYPE.ADD);

    useEffect(() => {
        if (productToEdit) {
            setVisitTypeInput(productToEdit.visit_type);
            setVisitTypeHexColorInput(productToEdit.color);
        }
    }, []);

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setVisitTypeHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setVisitTypeInput("");
        setVisitTypeHexColorInput("#999999");
    };

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setVisitTypeInput(value);
        setVisitTypeError(value ? "" : "Visit Type name is required");
    };

    const handelSubmit = async () => {
        if (visitTypeInput.trim() === "") {
            setVisitTypeError("Visit Type name is required");
            return;
        }

        setVisitTypeError("");
        if (visitTypeInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateVisitType(
                    {
                        visit_type: visitTypeInput,
                        color: visitTypeHexColorInput,
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
                await createVisitType(
                    {
                        visit_type: visitTypeInput,
                        color: visitTypeHexColorInput,
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshVisitType();
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
                            <label className="form-check-label mx-2" htmlFor="flexCheckDefault">
                                <h6>
                                    Enter Visit Type Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11 d-flex justify-content-end align-items-center">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Visit Type"
                                                placeholder="Add Visit Type"
                                                maxLength={SMALL_TEXT_LENGTH}
                                                value={visitTypeInput}
                                                onChange={(e) => handelChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handelSubmit();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center">
                                    <input
                                        type="color"
                                        value={visitTypeHexColorInput}
                                        className="mx-1 w-40 h-50"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (visitTypeInput.trim() === "") {
                                                setVisitTypeError("Visit Type name is required");
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
                            <div className="col-12 mx-2">
                                {visitTypeError && (
                                    <span className="text-danger">{visitTypeError}</span>
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

export default CreateVisitTypeView;