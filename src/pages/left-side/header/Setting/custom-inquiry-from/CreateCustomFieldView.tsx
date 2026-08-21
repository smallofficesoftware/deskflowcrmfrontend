import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createCustomInquiryFrom, fetchCompanyForTitle, ICompany, ICustomInquiryFromList, orderTypesCustomInquiryList, pageTypesCustomFieldList, printTypesCustomInquiryList, productApplicableModulesList, reportPrintTypesCustomInquiryList, reqTypesCustomInquiryList, requiredForTypesCustomInquiryList, rowOrColumnTypesCustomInquiryList, updateCustomInqFrom, validationTypeList } from "./CustomInquiryFromController";

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
    const [selectedApplicableModules, setSelectedApplicableModules] =
        useState<any[]>([]);
    const [selectedRequiredFor, setSelectedRequiredFor] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedReqList, setSelectedReqList] =
        useState<SingleValue<IOption> | null>(null);
    const [selectedPageType, setSelectedPageType] =
        useState<SingleValue<IOption> | null>(null);

    const [companyTitle, setCompanyTitle] = useState<ICompany | undefined>();
    const [titleInput, setTitleInput] = useState("");
    const [thirdPartyFieldNameInput, setThirdPartyFieldNameInput] = useState("");
    const [isReqDisabled, setIsReqDisabled] = useState(false);

    const [dataTypeError, setDataTypeError] = useState("");
    const [pageTypeError, setPageTypeError] = useState("");
    const [printTypeError, setPrintTypeError] = useState("");
    const [printReportTypeError, setPrintReportTypeError] = useState("");
    const [applicableModulesError, setApplicableModulesError] = useState("");
    const [rowOrColumnError, setRowOrColumnError] = useState("");
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
        "4": "Product Master",
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

    const validationDisplayOptions =
        validationTypeList &&
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

    const applicableModulesDisplayOptions =
        productApplicableModulesList &&
        productApplicableModulesList.map((option) => ({
            value: option.id,
            label: customLabels[option.id] || option.order_type_display,
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
                if (option.id == "13") {
                    return attachmentAllowedPages.includes(selectedPageTypeValue);
                }
                if (["11", "12", "14"].includes(option.id)) {
                    return isFormType5to9;
                }
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
        if (selectedOption?.value === "11" || selectedOption?.value === "12" || selectedOption?.value === "14") {
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
        setSelectedReqList(selectedOption);
    };

    const handlePrintDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedPrintList(selectedOption);
        setPrintTypeError(selectedOption ? "" : "Print is required");
    };

    const handlePrintReportChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedPrintReport(selectedOption);
        setPrintReportTypeError(selectedOption ? "" : "Print Report is required");
    };

    const handleRowORColumnChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedrowOrColumn(selectedOption);
        setRowOrColumnError(selectedOption ? "" : "Row or Column is required");
    };

    const handleApplicableModulesChange = (selectedOptions: any) => {
        setSelectedApplicableModules(selectedOptions || []);
        if (selectedOptions && selectedOptions.length > 0) {
            setApplicableModulesError("");
        }
    };

    const handleRequiredForChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedRequiredFor(selectedOption);
        setRequiredForError(selectedOption ? "" : "Please select when this field should be required.");
    };

    const clearForm = () => {
        setSelectedOrderList(null);
        setSelectedPrintList(null);
        setSelectedPrintReport(null);
        setSelectedrowOrColumn(null);
        setSelectedApplicableModules([]);
        setSelectedPageType(null);
        setSelectedRequiredFor(null);
        setSelectedValidationType(null);
        setTitleInput("");
        setThirdPartyFieldNameInput("");
        setDisplayOrderInput(0);
        setMinLimit("");
        setMaxLimit("");
    };

    const handelSubmit = async () => {
        setPageTypeError("");
        setDataTypeError("");
        setTitleListError("");
        setPrintTypeError("");
        setPrintReportTypeError("");
        setApplicableModulesError("");
        setRowOrColumnError("");
        setRequiredForError("");
        setLimitError("");

        let hasError = false;
        let errorMsg;

        if (showLimitFields) {
            if (minLimit && maxLimit) {
                if (Number(maxLimit) <= Number(minLimit)) {
                    errorMsg = "Maximum limit must be greater than minimum limit";
                    setLimitError(errorMsg);
                    hasError = true;
                } else if (Number(minLimit) < 0 || Number(maxLimit) < 0) {
                    errorMsg = "Character limit cannot be negative";
                    setLimitError(errorMsg);
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
            setPrintReportTypeError("Print Report is required");
            errorMsg = "Print Report is required";
            hasError = true;
        }
        if (selectedPageType?.value == "3" && !selectedRequiredFor) {
            setRequiredForError("Please select when this field should be required.");
            errorMsg = "Please select when this field should be required.";
            hasError = true;
        }
        if (selectedPageType?.value == "4" && !selectedrowOrColumn) {
            setRowOrColumnError("Row or Column is required");
            errorMsg = "Row or Column is required";
            hasError = true;
        }
        if (selectedPageType?.value == "4" && (!selectedApplicableModules || selectedApplicableModules.length === 0)) {
            setApplicableModulesError("Applicable Modules selection is required.");
            errorMsg = "Please select at least one applicable module.";
            hasError = true;
        }

        if (titleInput.trim() === "") {
            setTitleListError("Field Name is required");
            errorMsg = "Field Name is required";
            hasError = true;
        }

        if (hasError) {
            if (errorMsg) toast.error(errorMsg);
            return;
        }

        const applicableModulesStr = selectedApplicableModules
            ? selectedApplicableModules.map((item: any) => item.value).join(",")
            : "";

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
                            : 0,
                        third_party_field_name: thirdPartyFieldNameInput.trim(),
                        applicable_modules: applicableModulesStr
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
                            : 0,
                        third_party_field_name: thirdPartyFieldNameInput.trim(),
                        applicable_modules: applicableModulesStr
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
            setThirdPartyFieldNameInput(productToEdit.third_party_field_name || "");
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
                requiredForTypesCustomInquiryList && requiredForTypesCustomInquiryList.find(
                    (option: { id: string }) =>
                        option.id === String(productToEdit.required_for)
                );

            if (productToEdit.applicable_modules) {
                const modIds = String(productToEdit.applicable_modules).split(",").map(m => m.trim());
                const initialMods = applicableModulesDisplayOptions.filter(opt => modIds.includes(String(opt.value)));
                setSelectedApplicableModules(initialMods);
            } else if (Number(productToEdit.form_type) === 4) {
                if (Number(productToEdit.product_feild_row_column) === 2) {
                    const initialMods = applicableModulesDisplayOptions.filter(opt => ["5","6","7","8","9","10","11","12","13"].includes(String(opt.value)));
                    setSelectedApplicableModules(initialMods);
                } else {
                    const initialMods = applicableModulesDisplayOptions.filter(opt => String(opt.value) === "4");
                    setSelectedApplicableModules(initialMods);
                }
            }

            setSelectedPageType(formTypeSelectedOption);
            setSelectedOrderList(selectedOption);
            setSelectedReqList(reqSelectedOption);
            setSelectedPrintList(printSelectedOption);
            setSelectedPrintReport(reportSelectedOption);
            setSelectedrowOrColumn(rowOrColumnSelectedOption);
            setSelectedRequiredFor(requiredForSelectedOption ? { value: requiredForSelectedOption.id, label: requiredForSelectedOption.order_type_display } : null);
        }
    }, []);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ maxWidth: "680px", width: "92%", padding: "24px" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h2 className="modal-title1 form_header_text">{headerName}</h2>

                        <div className="head mt-2" style={{ display: "block" }}>
                            <div className="row">
                                <div className="col-6 mt-1">
                                    <label className="form-check-label">
                                        <h6>Form Type<span className="text-danger">*</span></h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={pageTypeDisplayOptions}
                                                value={selectedPageType}
                                                onChange={handlePageTypeDisplayChange}
                                                className="w-100"
                                                isDisabled={!!productToEdit}
                                            />
                                        </div>
                                    </div>
                                    {pageTypeError && <span className="text-danger">{pageTypeError}</span>}
                                </div>

                                <div className="col-6 mt-1">
                                    <label className="form-check-label">
                                        <h6>Field Name<span className="text-danger">*</span></h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Field Name"
                                                value={titleInput}
                                                maxLength={BIG_TEXT_LENGTH}
                                                onChange={(e) => {
                                                    setTitleInput(e.target.value);
                                                    if (e.target.value.trim() !== "") setTitleListError("");
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {titleError && <span className="text-danger">{titleError}</span>}
                                </div>
                            </div>

                            <div className="row mt-2">
                                <div className="col-6 mt-1">
                                    <label className="form-check-label">
                                        <h6>Data Type<span className="text-danger">*</span></h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={filteredOrderDisplayOptions}
                                                value={selectedOrderList}
                                                onChange={handleOrderDisplayChange}
                                                className="w-100"
                                            />
                                        </div>
                                    </div>
                                    {dataTypeError && <span className="text-danger">{dataTypeError}</span>}
                                </div>

                                <div className="col-6 mt-1">
                                    <label className="form-check-label">
                                        <h6>Third-Party Field Mapping Name</h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. U0000001, U0000002"
                                                value={thirdPartyFieldNameInput}
                                                onChange={(e) => setThirdPartyFieldNameInput(e.target.value)}
                                            />
                                        </div>
                                        <small className="text-muted" style={{ fontSize: "11px" }}>Used for Miracle API sync field matching.</small>
                                    </div>
                                </div>
                            </div>

                            <div className="row mt-2">
                                <div className="col-6 mt-2">
                                    <label className="form-check-label">
                                        <h6>Is Field Compulsory?</h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <CustomSearchDropdown
                                                options={requiredDisplayOptions}
                                                value={selectedReqList}
                                                onChange={handleReqDisplayChange}
                                                isDisabled={isReqDisabled}
                                                className="w-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-6 mt-2">
                                    <label className="form-check-label">
                                        <h6>Print In Document? <span className="text-danger">*</span></h6>
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
                                    {printTypeError && <span className="text-danger">{printTypeError}</span>}
                                </div>
                            </div>

                            <div className="row mt-2">
                                <div className="col-6 mt-2">
                                    <label className="form-check-label">
                                        <h6>Print In Report? <span className="text-danger">*</span></h6>
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
                                    {printReportTypeError && <span className="text-danger">{printReportTypeError}</span>}
                                </div>

                                {selectedPageType?.value == "4" && (
                                    <>
                                        <div className="col-6 mt-2">
                                            <label className="form-check-label">
                                                <h6>Row or Column <span className="text-danger">*</span></h6>
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
                                            {rowOrColumnError && <span className="text-danger">{rowOrColumnError}</span>}
                                        </div>

                                        <div className="col-6 mt-2">
                                            <label className="form-check-label">
                                                <h6>Applicable Modules <span className="text-danger">*</span></h6>
                                            </label>
                                            <div className="">
                                                <div className="add-source-of-type-section ">
                                                    <CustomSearchDropdown
                                                        options={applicableModulesDisplayOptions}
                                                        value={selectedApplicableModules}
                                                        onChange={handleApplicableModulesChange}
                                                        isMulti={true}
                                                        className="w-100"
                                                    />
                                                </div>
                                            </div>
                                            {applicableModulesError && <span className="text-danger">{applicableModulesError}</span>}
                                        </div>
                                    </>
                                )}
                                {selectedPageType?.value == "3" && (
                                    <div className="col-6 mt-2">
                                        <label className="form-check-label">
                                            <h6>Required For <span className="text-danger">*</span></h6>
                                        </label>
                                        <div className="">
                                            <div className="add-source-of-type-section ">
                                                <CustomSearchDropdown
                                                    options={requiredForTypesCustomInquiryList.map(opt => ({ value: opt.id, label: opt.order_type_display }))}
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
                                )}
                            </div>

                            {showLimitFields && (
                                <div className="row mt-2">
                                    <div className="col-4 mt-2">
                                        <label className="form-check-label">
                                            <h6>Validation Type</h6>
                                        </label>
                                        <CustomSearchDropdown
                                            options={validationDisplayOptions}
                                            value={selectedValidationType}
                                            onChange={(selected) => setSelectedValidationType(selected)}
                                            className="w-100"
                                        />
                                    </div>
                                    <div className="col-4 mt-2">
                                        <label className="form-check-label">
                                            <h6>Min Character Limit</h6>
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Min Limit"
                                            value={minLimit}
                                            onChange={(e) => setMinLimit(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-4 mt-2">
                                        <label className="form-check-label">
                                            <h6>Max Character Limit</h6>
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Max Limit"
                                            value={maxLimit}
                                            onChange={(e) => setMaxLimit(e.target.value)}
                                        />
                                    </div>
                                    {limitError && (
                                        <div className="col-12 mt-1">
                                            <span className="text-danger">{limitError}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="row mt-2">
                                <div className="col-6 mt-2">
                                    <label className="form-check-label">
                                        <h6>Display Order</h6>
                                    </label>
                                    <div className="">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Display Order"
                                                value={displayOrderInput}
                                                onChange={(e) => setDisplayOrderInput(Number(e.target.value))}
                                            />
                                        </div>
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