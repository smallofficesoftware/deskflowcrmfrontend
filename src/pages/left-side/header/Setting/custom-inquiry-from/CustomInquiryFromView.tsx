import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateCustomFieldView from "./CreateCustomFieldView";
import CustomFormFiledEditor from "./CustomFormFiledEditor";
import CustomInquiryAddDataSource from "./CustomInquiryAddDataSource";
import {
  createCustomInquiryFrom,
  fetchColumnData,
  fetchCompanyForTitle,
  fetchCustomInquiryFromApi,
  handleDeleteCustomInquiryFrom,
  ICompany,
  ICustomInquiryFromList,
  orderTypesCustomInquiryList,
  pageTypesCustomFieldList,
  printTypesCustomInquiryList,
  reportPrintTypesCustomInquiryList,
  reqTypesCustomInquiryList,
  requiredForTypesCustomInquiryList,
  rowOrColumnTypesCustomInquiryList,
  updateCustomInqFrom,
  updateDisplayOrderCustomInqFrom,
  validationTypeList,
} from "./CustomInquiryFromController";

interface IPropsCustomInquiryFrom {
  isCustomInquiryFromView: boolean;
  closeCustomInquiryFromView: () => void;
}

const CustomInquiryFromView = ({
  isCustomInquiryFromView,
  closeCustomInquiryFromView,
}: IPropsCustomInquiryFrom) => {
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
  const [titleInput, setTitleInput] = useState("");
  const [displayOrderInput, setDisplayOrderInput] = useState(0);
  const [hasIdAvail, setHasIdAvail] = useState<number | undefined>(undefined);
  const [columnNameForDelete, setColumnNameForDelete] = useState<string | undefined>(undefined);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const [requiredSwitch, setRequiredSwitch] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [customInquiryFromList, setCustomInquiryFromList] = useState<
    ICustomInquiryFromList[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [customInqFromDropdown, setCustomInqFromDropdown] =
    useState<boolean>(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isAddDataSource, setIsAddDataSource] = useState(false);
  const [dataTypeError, setDataTypeError] = useState("");
  const [pageTypeError, setPageTypeError] = useState("");
  const [printTypeError, setPrintTypeError] = useState("");
  const [requiredForError, setRequiredForError] = useState("");
  const [titleError, setTitleListError] = useState("");
  const [displayOrders, setDisplayOrders] = useState<{ [key: number]: number }>(
    {}
  );
  const [editCustomInqFromId, setEditCustomInqFromId] = useState<
    number | undefined
  >(undefined);
  const [addDataSourceItem, setAddDataSourceItem] =
    useState<ICustomInquiryFromList>();
  const [customFeildName, setCustomFeildName] =
    useState<number>(0);

  const [companyTitle, setCompanyTitle] = useState<ICompany | undefined>();
  const [isReqDisabled, setIsReqDisabled] = useState(false);
  const [isAddDataSourceForPageText, setIsAddDataSourceForPageText] = useState(false);
  const [addDataSourceItemForPageText, setAddDataSourceItemForPageText] =
    useState<ICustomInquiryFromList>();

  const [minLimit, setMinLimit] = useState<string>("");
  const [maxLimit, setMaxLimit] = useState<string>("");
  const [selectedValidationType, setSelectedValidationType] =
    useState<SingleValue<IOption> | null>(null);

  const [limitError, setLimitError] = useState("");

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<ICustomInquiryFromList>({
    id: 0,
    title: "",
    data_type: 0,
    display_order: 0,
    required_or_not: 0,
    print_or_not: 0,
    data_sorce: "",
    form_type: 0,
    report_print_or_not: 0,
    reference_column_name: "",
    product_feild_row_column: 0,
    required_for: 0,
    min_limit: 0,
    max_limit: 0,
    validation_type: 0,
  });

  const validationDisplayOptions =
    validationTypeList.map((option) => ({
      value: String(option.id),
      label: option.label,
    }));
  const showLimitFields = ["1", "2", "3", "8"].includes(
    selectedOrderList?.value?.toString() || ""
  );

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

        // Page Text, Page URL & Document Designer Page
        if (["11", "12", "14"].includes(option.id)) {
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

  const reportDisplayOptions =
    reportPrintTypesCustomInquiryList &&
    reportPrintTypesCustomInquiryList.map((option) => ({
      value: option.id,
      label: option.order_type_display,
    }));

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

  const pageTypeDisplayOptions =
    pageTypesCustomFieldList &&
    pageTypesCustomFieldList.map((option) => ({
      value: option.id,
      label: customLabels[option.id] || option.order_type_display,
    }));

  const clearForm = () => {
    setTitleInput("");
    setDisplayOrderInput(0);
    setRequiredSwitch(false);
    setIsEditing(false);
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

  const canViewCustomInquiry = useCheckUserPermission(
    PAGE_ID.CUSTOM_FORM_FIELD,
    PERMISSION_TYPE.VIEW
  );

  const canAddCustomInquiry = useCheckUserPermission(
    PAGE_ID.CUSTOM_FORM_FIELD,
    PERMISSION_TYPE.ADD
  );

  const canUpdateCustomInquiry = useCheckUserPermission(
    PAGE_ID.CUSTOM_FORM_FIELD,
    PERMISSION_TYPE.EDIT
  );

  const canDeleteCustomInquiry = useCheckUserPermission(
    PAGE_ID.CUSTOM_FORM_FIELD,
    PERMISSION_TYPE.DELETE
  );

  useEscapeKey(closeCustomInquiryFromView);

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


  const handlePageTypeDisplayChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedPageType(selectedOption);
    setPageTypeError(selectedOption ? "" : "Type is required");
    // Reset selected data type when form type changes
    setSelectedOrderList(null);
    setDataTypeError("");
  };

  const handelChangeTitle = (event: TOnChangeInput) => {
    const value = event.target.value;
    setTitleInput(value);
    setTitleListError(value ? "" : "Field Name is required");
  };

  const handelChangeDisplayOrder = (event: TOnChangeInput) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setDisplayOrderInput(Number(value));
    } else {
      setDisplayOrderInput(0);
    }
  };

  const handelSubmit = () => {
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

    if (isEditing) {
      if (canUpdateCustomInquiry) {
        updateCustomInqFrom(
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
          editCustomInqFromId,
          clearForm,
          Number(selectedPageType?.value)
        );
      } else {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      }
    } else {
      if (canAddCustomInquiry) {
        createCustomInquiryFrom(
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
  };

  useEffect(() => {
    if (canViewCustomInquiry) {
      fetchCustomInquiryFromApi(
        setCustomInquiryFromList,
        setLoading,
        Number(selectedPageType?.value)
      );
      fetchCompanyForTitle(setCompanyTitle);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }, [isCustomInquiryFromView, isAddDataSource, selectedPageType?.value, isAddDataSourceForPageText]);

  const toggleDropdownCustomInqFrom = (customId: number | undefined) => {
    if (customId === undefined) return;

    setOpenDropdownId((prevId) => {
      return prevId === customId ? null : customId;
    });
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest('.source-of-type-list-grid-options');
    if (isDropdownButton) {
      return;
    }

    const isOutsideCategoryDropdown =
      !Object.values(dropdownContactRef.current).some(
        (ref) => ref && ref.contains(target)
      ) &&
      (!sourceOfTypesRefDropdown.current ||
        !sourceOfTypesRefDropdown.current.contains(target));

    if (isOutsideCategoryDropdown) {
      setOpenDropdownId(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);


  const handleEdit = (item: ICustomInquiryFromList) => {
    // setOpenDropdownId(null);
    // setCustomInqFromDropdown(false);
    // setTitleInput(item.title);
    // setDisplayOrderInput(item.display_order);
    // setMinLimit(item.min_limit ? String(item.min_limit) : "0");
    // setMaxLimit(item.max_limit ? String(item.max_limit) : "0");
    // setIsEditing(true);
    // setEditCustomInqFromId(item.id);

    // const validationSelectedOption =
    //   validationDisplayOptions.find(
    //     (option: { value: string }) =>
    //       option.value === String(item.validation_type)
    //   ) || null;

    // setSelectedValidationType(validationSelectedOption);

    // const selectedOption =
    //   filteredOrderDisplayOptions.find(
    //     (option: { value: string }) => option.value === String(item.data_type)
    //   ) || null;
    // const reqSelectedOption =
    //   requiredDisplayOptions.find(
    //     (option: { value: string }) =>
    //       option.value === String(item.required_or_not)
    //   ) || null;
    // const printSelectedOption =
    //   printDisplayOptions.find(
    //     (option: { value: string }) =>
    //       option.value === String(item.print_or_not)
    //   ) || null;

    // const reportSelectedOption =
    //   reportDisplayOptions.find(
    //     (option: { value: string }) =>
    //       option.value === String(item.report_print_or_not)
    //   ) || null;

    // const rowOrColumnSelectedOption =
    //   rowORColumnDisplayOptions.find(
    //     (option: { value: string }) =>
    //       option.value === String(item.product_feild_row_column)
    //   ) || null;

    // const requiredForSelectedOption =
    //   RequiredForDisplayOptions.find(
    //     (option: { value: string }) =>
    //       option.value === String(item.required_for)
    //   ) || null;

    // setSelectedOrderList(selectedOption);
    // setSelectedReqList(reqSelectedOption);
    // setSelectedPrintList(printSelectedOption);
    // setSelectedPrintReport(reportSelectedOption);
    // setSelectedrowOrColumn(rowOrColumnSelectedOption);
    // setSelectedRequiredFor(requiredForSelectedOption);
    setEditableProduct(item);
    setIsUpdateModel(true);
  };

  const dataSource = (item: ICustomInquiryFromList) => {
    setIsAddDataSource(true);
    setAddDataSourceItem(item);
  };

  const dataSourceForPageText = (item: ICustomInquiryFromList) => {
    setIsAddDataSourceForPageText(true);
    setAddDataSourceItemForPageText(item);
  };

  const dataSourceForDesignerPage = (item: ICustomInquiryFromList) => {
    const params = new URLSearchParams({
      fieldId: String(item.id),
      fieldTitle: item.title || "",
      formType: String(item.form_type),
    });
    // New tab, not an in-app navigate — this Custom Field settings screen
    // (with its own unsaved-edit state, open modals etc.) stays exactly as
    // the user left it instead of being replaced.
    window.open(`/custom-field/designer-page-sources?${params.toString()}`, "_blank");
  };

  const handleDelete = (id: number, column: string, formType: number) => {
    setOpenDropdownId(null);
    fetchColumnData(setCustomFeildName, column, formType)
    setCustomInqFromDropdown(false);
    setIsDeleteConfirmation(true);
    setHasIdAvail(id);
    setColumnNameForDelete(column)
  };

  const handleDisplayOrderChange = async (
    id: number,
    value: number | string
  ) => {
    setDisplayOrders((prev: any) => ({
      ...prev,
      [id]: value,
    }));

    if (value !== 0) {
      updateDisplayOrderCustomInqFrom(
        {
          display_order: Number(value),
        },
        id
      );
    }
  };

  const handleDeleteCustomFrom = () => {
    if (canDeleteCustomInquiry) {
      handleDeleteCustomInquiryFrom(
        hasIdAvail,
        setIsDeleteConfirmation,
        setCustomInquiryFromList,
        setLoading,
        Number(selectedPageType?.value),
        columnNameForDelete
      );
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshStageStatus = async () => {
    await fetchCustomInquiryFromApi(
      setCustomInquiryFromList,
      setLoading,
      Number(selectedPageType?.value)
    );
  };

  const openCreateCustomFieldView = () => {
    if (canAddCustomInquiry) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isCustomInquiryFromView ? (
        <>
          <div
            className="notifications animate__animated animate__fadeInLeft"
            id="notifications"
          >
            <div className="header-Chat">
              <div className="ICON">
                <div
                  aria-disabled="false"
                  role="button"
                  className="icons"
                  data-tab="2"
                  title="Back"
                  aria-label="New chat"
                  onClick={closeCustomInquiryFromView}
                >
                  <span data-testid="chat" data-icon="chat" className="">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                      ></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="newText">
                <h2>Custom Field Form</h2>
              </div>
              <div className="text-end mb-2">
                <div className="ICON"
                  style={{
                    position: "absolute",
                    right: "60px"
                  }}
                >
                  <button
                    className="icons"
                    onClick={openCreateCustomFieldView}
                    title="Create Custom Field"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="30px"
                      viewBox="0 -960 960 960"
                      width="30px"
                      fill="#fff"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </button>
                </div>
                <div className="ICON"
                  style={{
                    position: "absolute",
                    right: "20px"
                  }}
                >
                  <button
                    className="icons"
                    onClick={handleRefreshStageStatus}
                    title="Refresh"
                  >
                    <svg width="30" height="30" viewBox="0 0 50 50">
                      <path
                        fill="currentColor"
                        d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                      />
                      <path
                        fill="currentColor"
                        d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                      />
                      <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                      <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="chats-notifications">
              <div className="block" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
                <div className="h-text">
                  <div className="head" style={{ display: "block" }}>
                    <div className="row">
                      <div className="col-6 mt-1">
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          <h4>
                            Form Type
                            {/* <span className="text-danger">*</span> */}
                          </h4>
                        </label>
                        <div className="">
                          <div className="add-source-of-type-section ">
                            <CustomSearchDropdown
                              options={pageTypeDisplayOptions}
                              value={selectedPageType}
                              onChange={handlePageTypeDisplayChange}
                              className="w-100"
                              isDisabled={
                                isEditing || !companyTitle ? "disabled" : false
                              }
                            />
                          </div>
                        </div>
                        {/* {pageTypeError && (
                          <span className="text-danger">{pageTypeError}</span>
                        )} */}
                      </div>
                      {/* <div className="col-6 mt-1">
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          <h4>
                            Select Field Data Type
                            <span className="text-danger">*</span>
                          </h4>
                        </label>
                        <div className="">
                          <div className="add-source-of-type-section ">
                            <CustomSearchDropdown
                              options={filteredOrderDisplayOptions}
                              value={selectedOrderList}
                              onChange={handleOrderDisplayChange}
                              className="w-100"
                              isDisabled={isEditing ? "disabled" : false}
                            />
                          </div>
                        </div>
                        {dataTypeError && (
                          <span className="text-danger">{dataTypeError}</span>
                        )}
                      </div> */}
                    </div>
                    {/* <div className="row mt-1"> */}
                    {/* <div className="col-12">
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          <h4>
                            Enter Field Name
                            <span className="text-danger">*</span>
                          </h4>
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
                      </div> */}
                    {/* <div className="col-4" style={{ width: "41%" }}>
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          <h4>Is Field <br />Required?</h4>
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
                      </div> */}
                    {/* <div className="col-4" style={{ paddingInline: "5px", width: "135px" }}>
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          <h4>Is Field <br />On Print? <span className="text-danger">*</span></h4>

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
                      </div> */}
                    {/* <div className="col-3 " style={{ paddingInline: "5px", width: "135px" }}>
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          <h4>Is Field <br />On Report? <span className="text-danger">*</span></h4>

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
                      </div> */}

                    {/* {selectedPageType?.value == 4 &&
                        <div className="col-3 " style={{ paddingInline: "5px", width: "135px" }}>
                          <label
                            className="form-check-label"
                            htmlFor="flexCheckDefault"
                          >
                            <h4>Is Field <br />On Row Or Column? <span className="text-danger">*</span></h4>

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
                      } */}
                    {/* {selectedPageType?.value == 3 &&
                        <div className="col-3 " style={{ paddingInline: "5px", width: "135px" }}>
                          <label
                            className="form-check-label"
                            htmlFor="flexCheckDefault"
                          >
                            <h4>Make This <br />Field Required For
                              <span className="text-danger">*</span></h4>

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
                      } */}
                    {/* {showLimitFields && (
                        <div className="mt-4 mb-4 p-3 border rounded bg-light">
                          <div className="row g-4"> */}
                    {/* Limits row */}
                    {/* <div className="col-md-6">
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
                            </div>} */}


                    {/* Error - full width */}
                    {/* {limitError && (
                              <div className="col-12">
                                <div className="alert alert-danger py-2 mb-0 small">
                                  {limitError}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )} */}
                    {/* <div className="col-1 mt-4 p-0">
                        <button className="" onClick={handelSubmit}>
                          <span>
                            {isEditing ? (
                              <span>
                                <svg
                                  data-name="Layer 1"
                                  height={24}
                                  id="Layer_1"
                                  viewBox="0 0 200 200"
                                >
                                  <title />
                                  <path
                                    fill="currentColor"
                                    d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                  />
                                </svg>
                              </span>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="26px"
                                viewBox="0 -960 960 960"
                                width="26px"
                                fill="#5f6368"
                              >
                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                              </svg>
                            )}
                          </span>
                        </button>
                      </div> */}

                    {/* </div> */}
                  </div>
                  <div>
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <div
                          className="source-of-type-list-grid-main"
                          key={index}
                        >
                          <div className="source-of-type-list-grid-list">
                            <div
                              style={{
                                display: "inline-block",
                                marginLeft: "8px",
                              }}
                            >
                              <Skeleton
                                width="100px"
                                height="25px"
                                duration={5}
                                borderRadius={50}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block w-100">
                          <div className="source-of-type-list-grid-main w-100 ">
                            <table className="table table-sm w-100">
                              <thead>
                                <tr>
                                  <th style={{ width: "100px" }}>Sr.no</th>
                                  <th>Data Type</th>
                                  <th>Title</th>
                                  <th style={{ width: "10px" }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPageType !== null ? (
                                  customInquiryFromList.length !== 0 ? (
                                    customInquiryFromList.map((item, index) => (
                                      <tr key={index}>
                                        <td className="">
                                          <input
                                            type="text"
                                            className="w-100"
                                            style={{ textAlign: "right" }}
                                            title="Display Order"
                                            value={
                                              displayOrders[item.id] !==
                                                undefined
                                                ? displayOrders[item.id]
                                                : item.display_order || 0
                                            }
                                            onChange={(e) => {
                                              const newValue = e.target.value;
                                              if (
                                                /^-?$|^-?\d+$/.test(newValue)
                                              ) {
                                                handleDisplayOrderChange(
                                                  item.id,
                                                  newValue
                                                );
                                              }
                                            }}
                                          />
                                        </td>
                                        <td>
                                          {orderTypesCustomInquiryList.find(
                                            (option) =>
                                              Number(option.id) ===
                                              item.data_type
                                          )?.order_type_display || ""}{" "}
                                          <br />
                                          {item.required_or_not === 1 ? (
                                            <span className="text-danger">
                                              *Req
                                            </span>
                                          ) : (
                                            "No"
                                          )}

                                          {item.print_or_not === 1 ? (
                                            <span className="text-danger">
                                              *Print
                                            </span>
                                          ) : (
                                            ""
                                          )}
                                          {item.report_print_or_not === 1 ? (
                                            <span className="text-danger">
                                              *Report
                                            </span>
                                          ) : (
                                            ""
                                          )}
                                          {item.product_feild_row_column == 2 ? (
                                            <span className="text-danger">
                                              *In Column
                                            </span>
                                          ) : (
                                            ""
                                          )}
                                          {item.required_for == 1 ? (
                                            <span className="text-danger">
                                              *Create
                                            </span>
                                          ) : (
                                            ""
                                          )}
                                          {item.required_for == 2 ? (
                                            <span className="text-danger">
                                              *Stop
                                            </span>
                                          ) : (
                                            ""
                                          )}
                                          {item.required_for == 3 ? (
                                            <span className="text-danger">
                                              *Both
                                            </span>
                                          ) : (
                                            ""
                                          )}
                                        </td>
                                        <td>
                                          <p
                                            style={{
                                              width: "100px",
                                              wordBreak: "break-word",
                                            }}
                                          >
                                            {item.title}
                                          </p>
                                        </td>
                                        <td className="">
                                          {item.id === -1 ? (
                                            <span></span>
                                          ) : (
                                            <>
                                              <button
                                                className="source-of-type-list-grid-options"
                                                id={`source-of-types-options-id-${item.id}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleDropdownCustomInqFrom(item?.id);
                                                }}

                                              >
                                                <span>
                                                  <svg
                                                    viewBox="0 0 24 24"
                                                    width="24"
                                                    height="24"
                                                  >
                                                    <path
                                                      fill="currentColor"
                                                      d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                                    ></path>
                                                  </svg>
                                                </span>
                                              </button>
                                              <ul
                                                className={`source-of-types-options source-of-types-options-custom-form ${openDropdownId === item.id ? "isVisible" : "isHidden"
                                                  }`}

                                                ref={(el) => (dropdownContactRef.current[item.id] = el)}
                                                id="dropLeft"
                                                style={{
                                                  width: "150px",
                                                }}
                                              >

                                                <li
                                                  className="listItem"
                                                  role="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(null);
                                                    handleEdit(item);
                                                  }}
                                                >
                                                  Edit
                                                </li>
                                                {item.data_type === 9 ||
                                                  item.data_type === 10 || item.data_type === 12 ? (
                                                  <li
                                                    className="listItem"
                                                    role="button"
                                                    onClick={() =>
                                                      dataSource(item)
                                                    }
                                                  >
                                                    Add Data source
                                                  </li>
                                                ) : (
                                                  <span></span>
                                                )}
                                                {
                                                  item.data_type === 11 ? (
                                                    <li
                                                      className="listItem"
                                                      role="button"
                                                      onClick={() =>
                                                        dataSourceForPageText(item)
                                                      }
                                                    >
                                                      Add Data source
                                                    </li>
                                                  ) : (
                                                    <span></span>
                                                  )}
                                                {
                                                  item.data_type === 14 ? (
                                                    <li
                                                      className="listItem"
                                                      role="button"
                                                      onClick={() =>
                                                        dataSourceForDesignerPage(item)
                                                      }
                                                    >
                                                      Add Data source
                                                    </li>
                                                  ) : (
                                                    <span></span>
                                                  )}
                                                <li
                                                  style={{ color: "red", fontWeight: "600" }}
                                                  className="listItem"
                                                  role="button"
                                                  onClick={() =>
                                                    handleDelete(item.id, item.reference_column_name, item.form_type)
                                                  }
                                                >
                                                  Delete
                                                </li>
                                              </ul>
                                            </>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4}>
                                        <span
                                          style={{
                                            display: "block",
                                            textAlign: "center",
                                            margin: "50px auto",
                                            width: "250px",
                                          }}
                                        >
                                          No Data
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                ) : (
                                  <tr>
                                    <td colSpan={4}>
                                      <span
                                        style={{
                                          display: "block",
                                          textAlign: "center",
                                          margin: "50px auto",
                                          width: "250px",
                                        }}
                                      >
                                        Please Select Any Form Type
                                      </span>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {isDeleteConfirmation && (
              <ConfirmationModal
                show={isDeleteConfirmation}
                onHide={() => setIsDeleteConfirmation(false)}
                handleSubmit={handleDeleteCustomFrom}
                title={"Delete this Custom Field Form"}
                message={
                  "Are you sure you want delete This Custom Field Form? "
                }
                btn1="CANCEL"
                btn2="DELETE"
                showPermission={customFeildName > 0}
                permissionText={"Deleting this field will permanently erase its field data. I agree."}
              />
            )}
          </div>

          {isAddDataSource && (
            <CustomInquiryAddDataSource
              show={isAddDataSource}
              onHide={() => setIsAddDataSource(false)}
              passDataInAddItem={addDataSourceItem}
            />
          )}
          {isAddDataSourceForPageText && (
            <CustomFormFiledEditor
              show={isAddDataSourceForPageText}
              onHide={() => setIsAddDataSourceForPageText(false)}
              passDataInAddItem={addDataSourceItemForPageText}
            />
          )}
        </>
      ) : null}
      {isCreateModel && (
        <CreateCustomFieldView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Custom Field"
          handleRefreshStageStatus={handleRefreshStageStatus}
          productToEdit={undefined}
          handleOutsidePageTypeDisplayChange={handlePageTypeDisplayChange}
        />
      )}
      {isUpdateModel && (
        <CreateCustomFieldView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Custom Field"
          handleRefreshStageStatus={handleRefreshStageStatus}
          productToEdit={editableProduct}
          handleOutsidePageTypeDisplayChange={handlePageTypeDisplayChange}
        />
      )}
    </>
  );
};

export default CustomInquiryFromView;