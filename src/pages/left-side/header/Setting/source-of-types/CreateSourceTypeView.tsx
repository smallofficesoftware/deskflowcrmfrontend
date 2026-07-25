import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createSourceOfType, ISourceOfTypes, updateSourceOfTypes } from "./SourceOfTypesController";

interface IPropsCreateSourceType {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ISourceOfTypes | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshSourceofType: () => void;
}

const CreateSourceTypeView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshSourceofType,
}: IPropsCreateSourceType) => {

    const [sourceOfTypeInput, setSourceOfTypeInput] = useState("");
    const [sourceOfTypesHexColorInput, setSourceOfTypesHexColorInput] =
        useState("#999999");
    const [sourceOfError, setsourceOfError] = useState("");
    const [isSourceInputReadOnly, setIsSourceInputReadOnly] = useState(false);

    const canAdd = useCheckUserPermission(PAGE_ID.SOURCE, PERMISSION_TYPE.ADD);

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setSourceOfTypeInput(value);
        setsourceOfError(value ? "" : "Source of Type is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setSourceOfTypesHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setSourceOfTypeInput("");
        setSourceOfTypesHexColorInput("#999999");
        setIsSourceInputReadOnly(false);

    };

    const handelSubmit = async () => {
        if (sourceOfTypeInput.trim() === "") {
            setsourceOfError("Source of Type is required");
            return;
        }

        setsourceOfError("");
        if (sourceOfTypeInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateSourceOfTypes(
                    { source_name: sourceOfTypeInput, color: sourceOfTypesHexColorInput },
                    setLoading,
                    productToEdit.id,
                    clearForm
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createSourceOfType(
                    { source_name: sourceOfTypeInput, color: sourceOfTypesHexColorInput },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshSourceofType();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setSourceOfTypeInput(productToEdit.source_name);
            setSourceOfTypesHexColorInput(productToEdit.color || "#999999");
            setsourceOfError("");
            setIsSourceInputReadOnly(productToEdit.id < 0);
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
                                    Enter Source Name<span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar ">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                title="Add Source Type"
                                                placeholder="Add Source Type"
                                                maxLength={SMALL_TEXT_LENGTH}
                                                value={sourceOfTypeInput}
                                                onChange={(e) => handelChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handelSubmit();
                                                    }
                                                }}
                                                readOnly={isSourceInputReadOnly}

                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={sourceOfTypesHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (sourceOfTypeInput.trim() === "") {
                                                setsourceOfError("Source of Type is required");
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
                                {sourceOfError && (
                                    <span className="text-danger">{sourceOfError}</span>
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

export default CreateSourceTypeView;