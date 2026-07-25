import { useEffect, useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { createAdjustmentType, IAdjustmentTypeView, METHOD_TYPES, MODE_TYPES, updateAdjustmentType } from "./AdjustmentTypeController";

interface IPropsAddAdjustmentType {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IAdjustmentTypeView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshAdjustmentType: () => void;
}

const AddAdjustmentTypeView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshAdjustmentType
}: IPropsAddAdjustmentType) => {
    const [method, setMethod] = useState<number>(1);
    const [mode, setMode] = useState<number>(1);
    const [name, setName] = useState("");
    const [knowledgeInfo, setKnowledgeInfo] = useState("");

    const [methodError, setMethodError] = useState("");
    const [modeError, setModeError] = useState("");
    const [nameError, setNameError] = useState("");

    useEffect(() => {
        if (productToEdit) {
            setMethod(productToEdit.method);
            setMode(productToEdit.mode);
            setName(productToEdit.name);
            setKnowledgeInfo(productToEdit.knowledge_info);
        }
    }, []);

    const clearForm = () => {
        setMethod(1);
        setMode(1);
        setName("");
        setKnowledgeInfo("");
    };

    const handleSubmit = async () => {
        let isValid = true;

        if (!method) {
            setMethodError("Please select a method");
            isValid = false;
        } else {
            setMethodError("");
        }

        if (!mode) {
            setModeError("Please select a mode");
            isValid = false;
        } else {
            setModeError("");
        }

        if (!name) {
            setNameError("Please enter a name");
            isValid = false;
        } else {
            setNameError("");
        }

        if (!isValid) return;

        if (method && mode && name) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateAdjustmentType(
                    {
                        method: method,
                        mode: mode,
                        name: name,
                        knowledge_info: knowledgeInfo,
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
                await createAdjustmentType(
                    {
                        method: method,
                        mode: mode,
                        name: name,
                        knowledge_info: knowledgeInfo,
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshAdjustmentType();
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
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Applied On <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <select
                                    className="form-select"
                                    value={method}
                                    onChange={(e) => {
                                        setMethod(Number(e.target.value));
                                        setMethodError("");
                                    }}
                                >
                                    {METHOD_TYPES.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>

                                {methodError && (
                                    <span className="text-danger">{methodError}</span>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Mode <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <select
                                    className="form-select"
                                    value={mode}
                                    onChange={(e) => {
                                        setMode(Number(e.target.value));
                                        setModeError("");
                                    }}
                                >
                                    {MODE_TYPES.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>

                                {modeError && (
                                    <span className="text-danger">{modeError}</span>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Name <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                        <input
                                            type="text"
                                            placeholder="Enter a name"
                                            maxLength={SMALL_TEXT_LENGTH}
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                setNameError("");
                                            }}
                                        />
                                    </div>
                                </div>

                                {nameError && (
                                    <span className="text-danger">{nameError}</span>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Knowledge Info
                                    </h6>
                                </label>

                                <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                        <textarea
                                            placeholder="Enter some knowledge information"
                                            rows={4}
                                            className="form-control font-size-15 rounded-1"
                                            value={knowledgeInfo}
                                            onChange={(e) => {
                                                setKnowledgeInfo(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
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

export default AddAdjustmentTypeView;