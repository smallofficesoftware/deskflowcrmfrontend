import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createDepartment, IDepartmentView, updateDepartment } from "./DepartmentController";

interface IPropsCreateDepartment {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IDepartmentView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshDepartment: () => void;
}

const CreateDepartmentView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshDepartment,
}: IPropsCreateDepartment) => {
    const [departmentInput, setDepartmentInput] = useState("");
    const [departmentHexColorInput, setDepartmentHexColorInput] = useState<string | undefined>("#999999");
    const [departmentError, setDepartmentError] = useState("");

    const canAdd = useCheckUserPermission(PAGE_ID.DEPARTMENT, PERMISSION_TYPE.ADD);

    useEffect(() => {
        if (productToEdit) {
            setDepartmentInput(productToEdit.department_name);
            setDepartmentHexColorInput(productToEdit.color);
        }
    }, []);

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setDepartmentInput(value);
        setDepartmentError(value ? "" : "Department name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setDepartmentHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setDepartmentInput("");
        setDepartmentHexColorInput("#999999");
    };

    const handelSubmit = async () => {
        if (departmentInput.trim() === "") {
            setDepartmentError("Department name is required");
            return;
        }

        setDepartmentError("");
        if (departmentInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateDepartment(
                    {
                        department_name: departmentInput,
                        color: departmentHexColorInput,
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
                await createDepartment(
                    {
                        department_name: departmentInput,
                        color: departmentHexColorInput,
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshDepartment();
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
                            <label className="form-check-label" htmlFor="flexCheckDefault">
                                <h6>
                                    Enter Department Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Department"
                                                placeholder="Add Department"
                                                value={departmentInput}
                                                maxLength={BIG_TEXT_LENGTH}
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
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={departmentHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (departmentInput.trim() === "") {
                                                setDepartmentError("Department name is required");
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
                            <div className="col-12">
                                {departmentError && (
                                    <span className="text-danger">{departmentError}</span>
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
                                {productToEdit ? "Save Department" : "Create Department"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default CreateDepartmentView;