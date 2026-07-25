import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createWarehouse, IWarehouseView, updateWarehouse } from "./WarehouseController";

interface IPropsAddWarehouse {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IWarehouseView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshWarehouse: () => void;
}

const AddWarehouseView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshWarehouse,
}: IPropsAddWarehouse) => {

    const [warehouseInput, setWarehouseInput] = useState("");
    const [warehouseHexColorInput, setWarehouseHexColorInput] = useState("#999999");
    const [warehouseError, setWarehouseError] = useState("");

    const canAdd = useCheckUserPermission(PAGE_ID.WAREHOUSE, PERMISSION_TYPE.ADD);

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setWarehouseInput(value);
        setWarehouseError(value ? "" : "Warehouse name is required");
    };

    const handleChangeHexColor = (event: TOnChangeInput) => {
        setWarehouseHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setWarehouseInput("");
        setWarehouseHexColorInput("#999999");
    };

    const handleSubmit = async () => {
        if (warehouseInput.trim() === "") {
            setWarehouseError("Warehouse name is required");
            return;
        }

        setWarehouseError("");

        if (warehouseInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateWarehouse(
                    {
                        warehouse_name: warehouseInput,
                        warehouse_color: warehouseHexColorInput,
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
                await createWarehouse(
                    {
                        warehouse_name: warehouseInput,
                        warehouse_color: warehouseHexColorInput,
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshWarehouse();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setWarehouseInput(productToEdit.warehouse_name);
            setWarehouseHexColorInput(productToEdit.warehouse_color || "#999999");
            setWarehouseError("");
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
                                    Enter Warehouse Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Warehouse"
                                                maxLength={BIG_TEXT_LENGTH}
                                                placeholder="Add Warehouse"
                                                value={warehouseInput}
                                                onChange={(e) => handleChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={warehouseHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handleChangeHexColor(e)}
                                        style={{ width: "25px", height: '25px' }}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                {warehouseError && (
                                    <span className="text-danger">{warehouseError}</span>
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
                                {productToEdit ? "Save" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default AddWarehouseView;