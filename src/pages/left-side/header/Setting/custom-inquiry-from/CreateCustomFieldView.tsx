import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createCustomInquiryFrom, fetchCompanyForTitle, ICompany, ICustomInquiryFromList, orderTypesCustomInquiryList, pageTypesCustomFieldList, printTypesCustomInquiryList, reportPrintTypesCustomInquiryList, reqTypesCustomInquiryList, requiredForTypesCustomInquiryList, rowOrColumnTypesCustomInquiryList, updateCustomInqFrom, validationTypeList } from "./CustomInquiryFromController";

interface IPropsCreateCustomField {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ICustomInquiryFromList | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshStageStatus: () => void;
    handleOutsidePageTypeDisplayChange: (data: SingleValue<IOption>) => void;
}

const CreateCustomFieldView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshStageStatus,
    handleOutsidePageTypeDisplayChange
}: IPropsCreateCustomField) => {

    const [selectedOrderList, setSelectedOrderList] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedPrintList, setSelectedPrintList] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedPrintReport, setSelectedPrintReport] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedrowOrColumn, setSelectedrowOrColumn] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedRequiredFor, setSelectedRequiredFor] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedReqList, setSelectedReqList] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedPageType, setSelectedPageType] =
        useState<SingleValue<IOption> | null>(null);



    const [companyTitle, setCompanyTitle] = useState<ICompany | undefined>();
    const [titleInput, setTitleInput] = useState("");
    const [isReqDisabled, setIsReqDisabled] = useState(false);

    const [dataTypeError, setDataTypeError] = useState("");
    const [pageTypeError, setPageTypeError] = useState("");
    const [printTypeError, setPrintTypeError] = useState("");
    const [requiredForError, setRequiredForError] = useState("");
    const [titleError, setTitleListError] = useState("");
    const [minLimit, setMinLimit] = useState<string>("");
    const [maxLimit, setMaxLimit] = useState<string>("");
    const [selectedValidationType, setSelectedValidationType] =
        useState<SingleValue<IOption> | null>(null);
    const [limitError, setLimitError] = useState("");
    const [displayOrderInput, setDisplayOrderInput] = useState(0);

    const canAddCustomInquiry = useCheckUserPermission(
        PAGE_ID.CUSTOM_FORM_FIELD,
        PERMISSION_TYPE.ADD
    );
    const canViewCustomInquiry = useCheckUserPermission(
        PAGE_ID.CUSTOM_FORM_FIELD,
        PERMISSION_TYPE.VIEW
    );
    const canUpdateCustomInquiry = useCheckUserPermission(
        PAGE_ID.CUSTOM_FORM_FIELD,
        PERMISSION_TYPE.EDIT
    );

    useEffect(() => {
        if (canViewCustomInquiry) {
            fetchCompanyForTitle(setCompanyTitle);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }, []);

    const showLimitFields = ["1", "2", "3", "8"].includes(
        selectedOrderList?.value?.toString() || ""
    );

    const customLabels: Record<string, string> = {
        "5": companyTitle?.quotation_title || "Quotation",
        "6": companyTitle?.order_title || "Sales Order",
        "7": companyTitle?.invoice_title || "Sales Invoice",
        "8": companyTitle?.purchase_title || "Purchase Invoice",
        "9": companyTitle?.purchase_order_title || "Purchase Order",
        "10": companyTitle?.return_sales_invoice_title || "Return Sales Invoice",
        "11": companyTitle?.return_purchase_invoice_title || "Return Purchase Invoice",
        "12": companyTitle?.inward_title || "Goods Received Note",
        "13": companyTitle?.dispatch_title || "Dispatch",
    };

    const clearForm = () => {
        setTitleInput("");
        setDisplayOrderInput(0);
        setSelectedOrderList(null);
        setSelectedPrintList(null);
        setSelectedPrintReport(null);
        setSelectedrowOrColumn(null);
        setSelectedRequiredFor(null);
        setSelectedReqList(null);
        setSelectedPageType(selectedPageType);
        setMinLimit("0");
        setMaxLimit("0");
        setSelectedValidationType(null);
        setLimitError("");
    };

    const validationDisplayOptions =
        validationTypeList.map((option) => ({
            value: String(option.id),
            label: option.label,
        }));

    const requiredDisplayOptions =
        reqTypesCustomInquiryList &&
        reqTypesCustomInquiryList.map((option) => ({
            value: option.id,
            label: option.order_type_display,
        }));

    const printDisplayOptions =
        printTypesCustomInquiryList &&
        printTypesCustomInquiryList.map((option) => ({
            value: option.id,
            label: option.order_type_display,
        }));

    const rowORColumnDisplayOptions =
        rowOrColumnTypesCustomInquiryList &&
        rowOrColumnTypesCustomInquiryList.map((option) => ({
            value: option.id,
            label: option.order_type_display,
        }));

    const RequiredForDisplayOptions =
        requiredForTypesCustomInquiryList &&
        requiredForTypesCustomInquiryList.map((option) => ({
            value: option.id,
            label: option.order_type_display,
        }));

    const pageTypeDisplayOptions =
        pageTypesCustomFieldList &&
        pageTypesCustomFieldList.map((option) => ({
            value: option.id,
            label: customLabels[option.id] || option.order_type_display,
        }));

    const reportDisplayOptions =
        reportPrintTypesCustomInquiryList &&
        reportPrintTypesCustomInquiryList.map((option) => ({
            value: option.id,
            label: option.order_type_display,
        }));

    const handlePageTypeDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedPageType(selectedOption);
        setPageTypeError(selectedOption ? "" : "Type is required");
        // Reset selected data type when form type changes
        setSelectedOrderList(null);
        setDataTypeError("");
    };

    const getFilteredOrderOptions = () => {
        const selectedPageTypeValue: any = selectedPageType?.value?.toString();

        const isFormType5to9 =
            selectedPageTypeValue &&
            ["5", "6", "7", "8", "9", "10", "11"].includes(selectedPageTypeValue);

        const attachmentAllowedPages = ["3", "14", "15"];

        return orderTypesCustomInquiryList
            .filter((option) => {
                // Attachments
                if (option.id == "13") {
                    return attachmentAllowedPages.includes(selectedPageTypeValue);
                }

                // Page Text & Page URL
                if (["11", "12"].includes(option.id)) {
                    return isFormType5to9;
                }

                // All other field types
                return true;
            })
            .map((option) => ({
                value: option.id,
                label: option.order_type_display,
            }));
    };

    const filteredOrderDisplayOptions = getFilteredOrderOptions();

    const handleOrderDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedOrderList(selectedOption);
        setDataTypeError(selectedOption ? "" : "Data type is required");

        if (selectedOption?.value === "11" || selectedOption?.value === "12") {
            const noOption = reqTypesCustomInquiryList.find(opt => opt.id === "2");
            setSelectedReqList({
                value: noOption?.id || "2",
                label: noOption?.order_type_display || "No",
            });
            setIsReqDisabled(true);
        } else {
            setIsReqDisabled(false);
        }
    };

    const handleReqDisplayChange = (selectedOption: SingleValue<IOption>) => {
        if (!isReqDisabled) {
            setSelectedReqList(selectedOption);
        }
    };

    const handlePrintDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedPrintList(selectedOption);
        setPrintTypeError(selectedOption ? "" : "Print is required");
    };

    const handlePrintReportChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedPrintReport(selectedOption);
        setPrintTypeError(selectedOption ? "" : "Print Report is required");
    };

    const handleRowORColumnChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedrowOrColumn(selectedOption);
        setPrintTypeError(selectedOption ? "" : "Feild in Row OR column is required");
    };

    const handleRequiredForChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedRequiredFor(selectedOption);
        setRequiredForError(
            selectedPageType?.value == "3" && !selectedOption
                ? "Please select when this field should be required."
                : ""
        );
    };

    const handelChangeTitle = (event: TOnChangeInput) => {
        const value = event.target.value;
        setTitleInput(value);
        setTitleListError(value ? "" : "Field Name is required");
    };

    const handelSubmit = async () => {
        let hasError = false;
        let errorMsg;

        if (showLimitFields) {
            if (minLimit && maxLimit) {
                if (Number(maxLimit) <= Number(minLimit)) {
                    setLimitError("Maximum char limit must be greater");
                    hasError = true;
                }
            }
        }

        if (!selectedOrderList) {
            setDataTypeError("Data Type is required");
            errorMsg = "Data Type is required";
            hasError = true;
        }
        if (!selectedPageType) {
            setPageTypeError("Type is required");
            errorMsg = "Type is required";

            hasError = true;
        }
        if (!selectedPrintList) {
            setPrintTypeError("Print is required");
            errorMsg = "Print is required";

            hasError = true;
        }
        if (!selectedPrintReport) {
            setPrintTypeError("Print Report is required");
            errorMsg = "Print Report is required";

            hasError = true;
        }
        if (selectedPageType?.value == "3" && !selectedRequiredFor) {
            setRequiredForError("Please select when this field should be required.");
            errorMsg = "Please select when this field should be required.";
            hasError = true;
        }

        if (titleInput.trim() === "") {
            setTitleListError("Field Name is required");
            errorMsg = "Field Name is required";

            hasError = true;
        }

        if (hasError) {
            toast.error(errorMsg)
            return;
        }

        if (productToEdit) {
            if (canUpdateCustomInquiry) {
                await updateCustomInqFrom(
                    {
                        title: titleInput,
                        data_type: Number(selectedOrderList?.value),
                        display_order: displayOrderInput,
                        required_or_not: Number(selectedReqList?.value)
                            ? Number(selectedReqList?.value)
                            : 0,
                        print_or_not: Number(selectedPrintList?.value)
                            ? Number(selectedPrintList?.value)
                            : 0,
                        report_print_or_not
                            : Number(selectedPrintReport?.value)
                                ? Number(selectedPrintReport?.value)
                                : 0,
                        product_feild_row_column
                            : Number(selectedrowOrColumn?.value)
                                ? Number(selectedrowOrColumn?.value)
                                : 0,
                        required_for
                            : Number(selectedRequiredFor?.value)
                                ? Number(selectedRequiredFor?.value)
                                : 0,
                        form_type: Number(selectedPageType?.value),
                        min_limit: Number(minLimit),
                        max_limit: Number(maxLimit),
                        validation_type: selectedValidationType?.value
                            ? Number(selectedValidationType.value)
                            : 0
                    },
                    setLoading,
                    productToEdit.id,
                    clearForm,
                    Number(selectedPageType?.value)
                );
            } else {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            }
        } else {
            if (canAddCustomInquiry) {
                await createCustomInquiryFrom(
                    {
                        title: titleInput,
                        data_type: Number(selectedOrderList?.value),
                        display_order: displayOrderInput,
                        required_or_not: Number(selectedReqList?.value)
                            ? Number(selectedReqList?.value)
                            : 0,
                        print_or_not: Number(selectedPrintList?.value)
                            ? Number(selectedPrintList?.value)
                            : 0,
                        report_print_or_not: Number(selectedPrintReport?.value)
                            ? Number(selectedPrintReport?.value)
                            : 0,
                        product_feild_row_column: Number(selectedrowOrColumn?.value)
                            ? Number(selectedrowOrColumn?.value)
                            : 0,
                        required_for: Number(selectedRequiredFor?.value)
                            ? Number(selectedRequiredFor?.value)
                            : 0,
                        form_type: Number(selectedPageType?.value),
                        min_limit: Number(minLimit),
                        max_limit: Number(maxLimit),
                        validation_type: selectedValidationType?.value
                            ? Number(selectedValidationType.value)
                            : 0
                    },
                    setLoading,
                    clearForm,
                    Number(selectedPageType?.value)
                );
            } else {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            }
        }
        handleOutsidePageTypeDisplayChange(selectedPageType);
        handleRefreshStageStatus();
        onHide();
    };

    useEffect(() => {
        if (productToEdit) {
            setTitleInput(productToEdit.title);
            setDisplayOrderInput(productToEdit.display_order);
            setMinLimit(productToEdit.min_limit ? String(productToEdit.min_limit) : "0");
            setMaxLimit(productToEdit.max_limit ? String(productToEdit.max_limit) : "0");

            const validationSelectedOption =
                validationDisplayOptions.find(
                    (option: { value: string }) =>
                        option.value === String(productToEdit.validation_type)
                ) || null;

            setSelectedValidationType(validationSelectedOption);

            const formTypeSelectedOption =
                pageTypeDisplayOptions.find(
                    (option: { value: string }) => option.value === String(productToEdit.form_type)
                ) || null;

            // const selectedOption =
            //     filteredOrderDisplayOptions.find(
            //         (option: { value: string }) => option.value === String(productToEdit.data_type)
            //     ) || null;

            const selectedOption =
                orderTypesCustomInquiryList
                    .map((option) => ({
                        value: option.id,
                        label: option.order_type_display,
                    }))
                    .find(
                        (option) => option.value === String(productToEdit.data_type)
                    ) || null;

            const reqSelectedOption =
                requiredDisplayOptions.find(
                    (option: { value: string }) =>
                        option.value === String(productToEdit.required_or_not)
                ) || null;

            const printSelectedOption =
                printDisplayOptions.find(
                    (option: { value: string }) =>
                        option.value === String(productToEdit.print_or_not)
                ) || null;

            const reportSelectedOption =
                reportDisplayOptions.find(
                    (option: { value: string }) =>
                        option.value === String(productToEdit.report_print_or_not)
                ) || null;

            const rowOrColumnSelectedOption =
                rowORColumnDisplayOptions.find(
                    (option: { value: string }) =>
                        option.value === String(productToEdit.product_feild_row_column)
                ) || null;

            const requiredForSelectedOption =
                RequiredForDisplayOptions.find(
                    (option: { value: string }) =>
                        option.value === String(productToEdit.required_for)
                ) || null;

            setSelectedPageType(formTypeSelectedOption);
            setSelectedOrderList(selectedOption);
            setSelectedReqList(reqSelectedOption);
            setSelectedPrintList(printSelectedOption);
            setSelectedPrintReport(reportSelectedOption);
            setSelectedrowOrColumn(rowOrColumnSelectedOption);
            setSelectedRequiredFor(requiredForSelectedOption);
        }
    }, []);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "40%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h2 className="modal-title1 form_header_text">{headerName}</h2>

                        <div className="head" style={{ display: "block", marginLeft: "20px" }}>
                            <div className="row">
                                <div className="col-6 mt-1">
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>
                                            Form Type
                                            <span className="text-danger">*</span>
                                        </h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={pageTypeDisplayOptions}
                                                value={selectedPageType}
                                                onChange={handlePageTypeDisplayChange}
                                                className="w-100"
                                                isDisabled={
                                                    productToEdit || !companyTitle ? "disabled" : false
                                                }
                                            />
                                        </div>
                                    </div>
                                    {pageTypeError && (
                                        <span className="text-danger">{pageTypeError}</span>
                                    )}
                                </div>
                                <div className="col-6 mt-1">
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>
                                            Select Field Data Type
                                            <span className="text-danger">*</span>
                                        </h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={filteredOrderDisplayOptions}
                                                value={selectedOrderList}
                                                onChange={handleOrderDisplayChange}
                                                className="w-100"
                                                isDisabled={productToEdit ? "disabled" : false}
                                            />
                                        </div>
                                    </div>
                                    {dataTypeError && (
                                        <span className="text-danger">{dataTypeError}</span>
                                    )}
                                </div>
                            </div>
                            <div className="row mt-1">
                                <div className="col-12">
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>
                                            Enter Field Name
                                            <span className="text-danger">*</span>
                                        </h6>
                                    </label>
                                    <div className="search-bar ">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                title="Enter Field Name"
                                                placeholder="Enter Field Name"
                                                value={titleInput}
                                                maxLength={BIG_TEXT_LENGTH}
                                                onChange={(e) => handelChangeTitle(e)}
                                            />
                                        </div>
                                    </div>
                                    {titleError && (
                                        <span className="text-danger">{titleError}</span>
                                    )}
                                </div>
                                <div className="col-4" style={{ paddingInline: "5px", width: "135px", marginLeft: "10px" }}>
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>Is Field <br />Required?</h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={requiredDisplayOptions}
                                                value={selectedReqList}
                                                onChange={handleReqDisplayChange}
                                                className="w-100"
                                                isDisabled={isReqDisabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-4" style={{ paddingInline: "5px", width: "135px" }}>
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>Is Field <br />On Print? <span className="text-danger">*</span></h6>

                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={printDisplayOptions}
                                                value={selectedPrintList}
                                                onChange={handlePrintDisplayChange}
                                                className="w-100"
                                            />
                                        </div>
                                    </div>
                                    {printTypeError && (
                                        <span className="text-danger">{printTypeError}</span>
                                    )}
                                </div>
                                <div className="col-3 " style={{ paddingInline: "5px", width: "135px" }}>
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>Is Field <br />On Report? <span className="text-danger">*</span></h6>

                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={printDisplayOptions}
                                                value={selectedPrintReport}
                                                onChange={handlePrintReportChange}
                                                className="w-100"
                                            />
                                        </div>
                                    </div>
                                    {printTypeError && (
                                        <span className="text-danger">{printTypeError}</span>
                                    )}
                                </div>

                                {selectedPageType?.value == 4 &&
                                    <div className="col-4" style={{ paddingInline: "5px" }}>
                                        <label
                                            className="form-check-label"
                                            htmlFor="flexCheckDefault"
                                        >
                                            <h6>Is Field <br />On Row Or Column? <span className="text-danger">*</span></h6>

                                        </label>
                                        <div className="">
                                            <div className="add-source-of-type-section ">
                                                <CustomSearchDropdown
                                                    options={rowORColumnDisplayOptions}
                                                    value={selectedrowOrColumn}
                                                    onChange={handleRowORColumnChange}
                                                    className="w-100"
                                                />
                                            </div>
                                        </div>
                                        {printTypeError && (
                                            <span className="text-danger">{printTypeError}</span>
                                        )}
                                    </div>
                                }
                                {selectedPageType?.value == 3 &&
                                    <div className="col-4" style={{ paddingInline: "5px" }}>
                                        <label
                                            className="form-check-label"
                                            htmlFor="flexCheckDefault"
                                        >
                                            <h6>Make This <br />Field Required For
                                                <span className="text-danger">*</span></h6>

                                        </label>
                                        <div className="">
                                            <div className="add-source-of-type-section ">
                                                <CustomSearchDropdown
                                                    options={RequiredForDisplayOptions}
                                                    value={selectedRequiredFor}
                                                    onChange={handleRequiredForChange}
                                                    className="w-100"
                                                />
                                            </div>
                                        </div>
                                        {requiredForError && (
                                            <span className="text-danger">{requiredForError}</span>
                                        )}
                                    </div>
                                }
                                {showLimitFields && (
                                    <div className="mt-4 mb-4 p-3 border rounded bg-light ms-3" style={{ width: "96%" }}>
                                        <div className="row g-4">
                                            {/* Limits row */}
                                            <div className="col-md-6">
                                                <div className="row g-3">
                                                    <div className="col-6">
                                                        <label className="form-label">Min Characters</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={minLimit}
                                                            onChange={(e) => setMinLimit(e.target.value)}
                                                            placeholder="0"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="col-6">
                                                        <label className="form-label">Max Characters</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={maxLimit}
                                                            onChange={(e) => setMaxLimit(e.target.value)}
                                                            placeholder="∞"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedOrderList?.value !== "1" && selectedOrderList?.value !== "8" && <div className="col-md-6">
                                                <label className="form-label">Validation Type</label>
                                                <CustomSearchDropdown
                                                    options={validationDisplayOptions}
                                                    value={selectedValidationType}
                                                    onChange={(option) => setSelectedValidationType(option)}
                                                    className="w-100"
                                                />
                                            </div>}


                                            {/* Error - full width */}
                                            {limitError && (
                                                <div className="col-12">
                                                    <div className="alert alert-danger py-2 mb-0 small">
                                                        {limitError}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

export default CreateCustomFieldView;