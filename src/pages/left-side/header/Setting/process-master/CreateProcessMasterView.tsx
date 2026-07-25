import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createProcess, IProcessView, updateprocess } from "./ProcessMasterController";

interface IPropsCreateProcess {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IProcessView | undefined;
    setLoading: TReactSetState<boolean>;
    handelRefreshprocess: () => void;
}


const CreateProcessMasterView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handelRefreshprocess,
}: IPropsCreateProcess) => {

    const [processMasterInput, setProcessMasterInput] = useState("");
    const [processHexColorInput, setprocessHexColorInput] = useState("#999999");
    const [processError, setprocessError] = useState("");

    const canAdd = useCheckUserPermission(
        PAGE_ID.MACHINE_MANAGEMENTS,
        PERMISSION_TYPE.ADD
    );

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setProcessMasterInput(value);
        setprocessError(value ? "" : "Process name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setprocessHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setProcessMasterInput("");
        setprocessHexColorInput("#eeeeee");
    };

    const handelSubmit = async () => {
        if (processMasterInput.trim() === "") {
            setprocessError("Process name is required");
            return;
        }

        setprocessError("");

        if (processMasterInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateprocess(
                    {
                        process_name: processMasterInput,
                        color: processHexColorInput,
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
                await createProcess(
                    {
                        process_name: processMasterInput,
                        color: processHexColorInput,
                    },
                    setLoading,
                    clearForm
                );
            }
            handelRefreshprocess();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setProcessMasterInput(productToEdit.process_name);
            setprocessHexColorInput(productToEdit.color || "#999999");
            setprocessError("");
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
                                    Enter Process Name<span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar ">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                title="Process"
                                                placeholder="Add Process"
                                                value={processMasterInput}
                                                maxLength={BIG_TEXT_LENGTH}
                                                onChange={(e) => handelChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={processHexColorInput}
                                        className="   mx-1"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                {processError && (
                                    <span className="text-danger">{processError}</span>
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

export default CreateProcessMasterView;