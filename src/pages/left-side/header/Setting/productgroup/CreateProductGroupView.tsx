import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createCategory, IGroupView, updateCategory } from "./ProductgroupController";

interface IPropsCreateDepartment {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IGroupView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCategory: () => void;
}

const CreateProductGroupView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCategory,
}: IPropsCreateDepartment) => {

    const [groupInput, setGroupInputInput] = useState("");
    const [groupHexColorInput, setGroupHexColorInput] = useState<string | undefined>("#999999");
    const [groupError, setGroupError] = useState("");

    const canAdd = useCheckUserPermission(PAGE_ID.PRODUCTGROUP, PERMISSION_TYPE.ADD);

    useEffect(() => {
        if (productToEdit) {
            setGroupInputInput(productToEdit.group_name);
            setGroupHexColorInput(productToEdit.group_color);
        }
    }, []);

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setGroupInputInput(value);
        setGroupError(value ? "" : "Group name is required");
    };

    const handleChangeHexColor = (event: TOnChangeInput) => {
        setGroupHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setGroupInputInput("");
        setGroupHexColorInput("#999999");
    };

    const handleSubmit = async () => {
        if (groupInput.trim() === "") {
            setGroupError("Group name is required");
            return;
        }

        setGroupError("");

        if (groupInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateCategory(
                    {
                        group_name: groupInput,
                        group_color: groupHexColorInput,
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
                await createCategory(
                    {
                        group_name: groupInput,
                        group_color: groupHexColorInput,
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
                                    Enter Product Group Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Category"
                                                maxLength={BIG_TEXT_LENGTH}
                                                placeholder="Add Product Group"
                                                value={groupInput}
                                                onChange={(e) => handleChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={groupHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handleChangeHexColor(e)}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                {groupError && (
                                    <span className="text-danger">{groupError}</span>
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

export default CreateProductGroupView;