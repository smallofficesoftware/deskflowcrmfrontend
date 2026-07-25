import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createTaskCategory, ITaskCategoryView, updateTaskCategory } from "./TaskCategoryController";

interface IPropsCreateTaskCategory {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ITaskCategoryView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCategory: () => void;
}


const CreateTaskCategoryView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCategory,
}: IPropsCreateTaskCategory) => {

    const [categoryInput, setCategoryInputInput] = useState("");
    const [categoryHexColorInput, setCategoryHexColorInput] = useState("#999999");
    const [categoryError, setCategoryError] = useState("");
    const [visibility, setVisibility] = useState<0 | 1>(0);  // 0 = internal, 1 = external

    const canAdd = useCheckUserPermission(
        PAGE_ID.TASK_CATEGORY,
        PERMISSION_TYPE.ADD
    );

    useEffect(() => {
        if (productToEdit) {
            setCategoryInputInput(productToEdit.task_category_name);
            setCategoryHexColorInput(productToEdit.task_color || "#999999");
            setCategoryError("");
            setVisibility(
                productToEdit.visibility === 1 ? 1 : 0
            );
        }
    }, []);

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setCategoryInputInput(value);
        setCategoryError(value ? "" : "Task Category name is required");
    };

    const handleChangeHexColor = (event: TOnChangeInput) => {
        setCategoryHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setCategoryInputInput("");
        setCategoryHexColorInput("#999999");
        setVisibility(0);
    };

    const handleSubmit = async () => {
        if (categoryInput.trim() === "") {
            setCategoryError("Task Category name is required");
            return;
        }

        setCategoryError("");

        if (categoryInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateTaskCategory(
                    {
                        task_category_name: categoryInput,
                        task_color: categoryHexColorInput,
                        visibility: visibility
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
                await createTaskCategory(
                    {
                        task_category_name: categoryInput,
                        task_color: categoryHexColorInput,
                        visibility: visibility
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
                                    Enter Task Category Name
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
                                                placeholder="Add Task category"
                                                value={categoryInput}
                                                onChange={(e) => handleChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={categoryHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handleChangeHexColor(e)}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                {categoryError && (
                                    <span className="text-danger">{categoryError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>Visibility</h6>
                                </label>
                                <div className="d-flex gap-4 mt-2">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="visibility"
                                            id="internal"
                                            value="0"
                                            checked={visibility === 0}
                                            onChange={() => setVisibility(0)}
                                        />
                                        <label className="form-check-label" htmlFor="internal">
                                            Internal
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="visibility"
                                            id="external"
                                            value="1"
                                            checked={visibility === 1}
                                            onChange={() => setVisibility(1)}
                                        />
                                        <label className="form-check-label" htmlFor="external">
                                            External
                                        </label>
                                    </div>
                                </div>
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

export default CreateTaskCategoryView;