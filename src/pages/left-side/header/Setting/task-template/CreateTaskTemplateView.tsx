import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createTaskTemplate, ICompanyView, ITaskTemplateView, orderTypesStageList, updateTaskTemplate } from "./TaskTemplateController";

interface IPropsCreateTaskTemplate {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ITaskTemplateView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshTaskTemplate: () => void;
}

const CreateTaskTemplateView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshTaskTemplate,
}: IPropsCreateTaskTemplate) => {

    const [selectedOrderList, setSelectedOrderList] = useState<any>(false);
    const [isStatusInputReadOnly, setIsStatusInputReadOnly] = useState(false);
    const [OrderListError, setOrderListError] = useState("");
    const [tasktemplateInput, setTaskTemplateInput] = useState("");
    const [tasktemplateHexColorInput, setTaskTemplateHexColorInput] = useState("#999999");
    const [tasktemplateError, settasktemplateError] = useState("");
    const [titleList, setTitleList] = useState<ICompanyView[]>([]);
    const [displayOrderInput, setDisplayOrderInput] = useState<{
        [key: number]: string;
    }>({});

    const canAdd = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.ADD);

    const customLabels: Record<string, string> = {
        "5": titleList?.[0]?.quotation_title || "Quotation",
        "6": titleList?.[0]?.order_title || "Sales Order",
        "7": titleList?.[0]?.invoice_title || "Sales Invoice",
        "8": titleList?.[0]?.purchase_title || "Purchase Invoice",
        "9": titleList?.[0]?.purchase_order_title || "Purchase Order",
        "10": titleList?.[0]?.return_sales_invoice_title || "Return Sales Invoice",
        "11": titleList?.[0]?.return_purchase_invoice_title || "Return Purchase Invoice",
        "12": titleList?.[0]?.inward_title || "Goods Received Note",
        "13": titleList?.[0]?.dispatch_title || "Dispatch",
    };

    const orderDisplayOptions = orderTypesStageList?.map((option) => ({
        value: option.id,
        label: customLabels[String(option.id)] || option.order_type_display,
    }));

    const handleOrderDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedOrderList(selectedOption);
        setOrderListError(selectedOption ? "" : "Please Select Type");
    };

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setTaskTemplateInput(value);
        settasktemplateError(value ? "" : "Stage and Status Name is required");
    };

    const handleDisplayorderChange = (event: TOnChangeInput, itemId: number) => {
        const value = event.target.value;
        setDisplayOrderInput((prev: any) => ({
            ...prev,
            [itemId]: value,
        }));
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setTaskTemplateHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setTaskTemplateInput("");
        setTaskTemplateHexColorInput("#999999");
        setSelectedOrderList(false || null);
        setIsStatusInputReadOnly(false);

    };

    const handelSubmit = async () => {
        if (tasktemplateInput.trim() === "") {
            settasktemplateError("Stage and Status is required");
            return;
        }
        if (!selectedOrderList) setOrderListError("Please Select Type");

        if (tasktemplateInput && selectedOrderList) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateTaskTemplate(
                    {
                        name: tasktemplateInput,
                        color: tasktemplateHexColorInput,
                        templete_type: selectedOrderList.value,
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
                await createTaskTemplate(
                    {
                        name: tasktemplateInput,
                        color: tasktemplateHexColorInput,
                        templete_type: selectedOrderList?.value,
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshTaskTemplate();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setOrderListError("");
            settasktemplateError("");
            setTaskTemplateInput(productToEdit.name);
            setTaskTemplateHexColorInput(productToEdit.color || "#999999");
            const selectedCategoryOption = orderDisplayOptions.find(
                (option: { value: string }) => option.value === String(productToEdit.templete_type)
            );
            setSelectedOrderList(selectedCategoryOption);
            setIsStatusInputReadOnly(productToEdit.id < 0);
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
                            <div className="col-12 ">
                                <p className="thanks">
                                    If you want to set a sequence, start from 1 and continue onward.
                                </p>
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                    <h6>
                                        Type
                                        <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="">
                                    <div className="add-source-of-type-section ">
                                        <CustomSearchDropdown
                                            options={orderDisplayOptions}
                                            value={selectedOrderList}
                                            onChange={handleOrderDisplayChange}
                                            className="w-100"
                                            isDisabled={isStatusInputReadOnly ? "disabled" : false}
                                        />
                                    </div>
                                </div>
                                {OrderListError && (
                                    <span className="text-danger">{OrderListError}</span>
                                )}
                            </div>
                            <label className="form-check-label mt-3" htmlFor="flexCheckDefault">
                                <h6>
                                    Enter Task Template Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar ">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                title="Add Task Template Name"
                                                placeholder="Add Task Template Name"
                                                maxLength={SMALL_TEXT_LENGTH}
                                                value={tasktemplateInput}
                                                onChange={(e) => handelChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handelSubmit();
                                                    }
                                                }}
                                                readOnly={isStatusInputReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={tasktemplateHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (tasktemplateInput.trim() === "") {
                                                settasktemplateError("Stage and Status is required");
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
                            {tasktemplateError && (
                                <span className="text-danger">{tasktemplateError}</span>
                            )}
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

export default CreateTaskTemplateView;