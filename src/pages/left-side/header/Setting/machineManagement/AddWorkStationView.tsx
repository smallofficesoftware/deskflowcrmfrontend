import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createMachineManagement, IMachineView, updatemachine } from "./Machine-managementController";

interface IPropsAddWorkStation {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IMachineView | undefined;
    setLoading: TReactSetState<boolean>;
    handelRefreshmachine: () => void;
}

const AddWorkStationView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handelRefreshmachine,
}: IPropsAddWorkStation) => {

    const [machineManagementInput, setMachineManagementInput] = useState("");
    const [machineHexColorInput, setmachineHexColorInput] = useState("#999999");
    const [machineError, setmachineError] = useState("");

    const canAdd = useCheckUserPermission(
        PAGE_ID.MACHINE_MANAGEMENTS,
        PERMISSION_TYPE.ADD,
    );

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setMachineManagementInput(value);
        setmachineError(value ? "" : "Work Station name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setmachineHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setMachineManagementInput("");
        setmachineHexColorInput("#eeeeee");
    };

    const handelSubmit = async () => {
        if (machineManagementInput.trim() === "") {
            setmachineError("Work Station name is required");
            return;
        }

        setmachineError("");

        if (machineManagementInput) {
            if (productToEdit && productToEdit.id !== null) {
                await updatemachine(
                    {
                        machine_name: machineManagementInput,
                        color: machineHexColorInput,
                    },
                    productToEdit.id,
                    setLoading,
                    clearForm,
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createMachineManagement(
                    {
                        machine_name: machineManagementInput,
                        color: machineHexColorInput,
                    },
                    setLoading,
                    clearForm,
                );
            }
            handelRefreshmachine();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setMachineManagementInput(productToEdit.machine_name);
            setmachineHexColorInput(productToEdit.color || "#999999");
            setmachineError("");
        }
    }, []);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "30%" }}>
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
                                    Enter Work Station Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar ">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                title="Work Station"
                                                placeholder="Add Work Station"
                                                value={machineManagementInput}
                                                maxLength={BIG_TEXT_LENGTH}
                                                onChange={(e) => handelChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={machineHexColorInput}
                                        className="   mx-1"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                {machineError && (
                                    <span className="text-danger">{machineError}</span>
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
                                {productToEdit ? "Save" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};
export default AddWorkStationView;