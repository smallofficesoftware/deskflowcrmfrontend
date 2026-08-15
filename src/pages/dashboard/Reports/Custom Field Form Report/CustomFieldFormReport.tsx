import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { IOption } from "../../../../helpers/AppInterface";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import CreateCustomFieldView from "../../../left-side/header/Setting/custom-inquiry-from/CreateCustomFieldView";
import CustomFormFiledEditor from "../../../left-side/header/Setting/custom-inquiry-from/CustomFormFiledEditor";
import CustomInquiryAddDataSource from "../../../left-side/header/Setting/custom-inquiry-from/CustomInquiryAddDataSource";
import { fetchColumnData, fetchCompanyForTitle, handleDeleteCustomInquiryFrom, ICompany, ICustomInquiryFromList, orderTypesCustomInquiryList, pageTypesCustomFieldList } from "../../../left-side/header/Setting/custom-inquiry-from/CustomInquiryFromController";
import { IStageStatusView } from "../../../left-side/header/Setting/stage-status/StageStatusController";
import { fetchCustomFromFieldApi } from "./CustomFieldFormReportController";

interface IVisitTypeReport {
    onHide?: () => void;
}

const CustomFieldFormReport = ({ onHide }: IVisitTypeReport) => {
    const [loading, setLoading] = useState(false);
    const [companyTitle, setCompanyTitle] = useState<ICompany | undefined>();
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [globalSearchText, setGlobalSearchText] = useState("");
    const [selectedOrderList, setSelectedOrderList] = useState<IOption | null>(
        null,
    );
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [OrderListError, setOrderListError] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        form_type: {
            value: null,
            matchMode: "contains",
        },
        title: {
            value: null,
            matchMode: "contains",
        },
    });


    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownStageStatusRef = useRef<
        Record<number, HTMLUListElement | null>
    >({});

    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
    const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
    const [selectedPageType, setSelectedPageType] =
        useState<SingleValue<IOption> | null>(null);
    const [customInquiryFromList, setCustomInquiryFromList] = useState<
        ICustomInquiryFromList[]
    >([]);
    const [pageTypeError, setPageTypeError] = useState("");
    const [dataTypeError, setDataTypeError] = useState("");
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
    const [isAddDataSource, setIsAddDataSource] = useState(false);
    const [addDataSourceItem, setAddDataSourceItem] =
        useState<ICustomInquiryFromList>();
    const [isAddDataSourceForPageText, setIsAddDataSourceForPageText] = useState(false);
    const [addDataSourceItemForPageText, setAddDataSourceItemForPageText] =
        useState<ICustomInquiryFromList>();
    const [customFeildName, setCustomFeildName] =
        useState<number>(0);
    const [customInqFromDropdown, setCustomInqFromDropdown] =
        useState<boolean>(false);
    const [hasIdAvail, setHasIdAvail] = useState<number | undefined>(undefined);
    const [columnNameForDelete, setColumnNameForDelete] = useState<string | undefined>(undefined);

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {

        fetchCustomFromFieldApi(
            setCustomInquiryFromList,
            setLoading,
            Number(selectedPageType?.value),
        );

        fetchCompanyForTitle(setCompanyTitle);

    }, []);

    useEscapeKey(() => {
        if (
            !isCreateModel &&
            !openDropdownId &&
            !isUpdateModel
        ) {
            onHide?.();
        } else {
            setIsCreateModel(false);
            setOpenDropdownId(null);
            setIsUpdateModel(false);
        }
    });

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

    const visibilityBodyTemplate = (rowData: IStageStatusView) => {
        return (
            <span
            >
                {rowData.visibility === 1 ? "External" : "Internal"}
            </span>
        );
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

    const actionBodyTemplate = useCallback((rowData: any) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsActionDropdownOpen(false);
                            setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                        }}
                    />

                    <ul
                        ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                        style={{
                            width: "150px",
                            marginLeft: "15%",
                            height: "auto",
                            display: openDropdownId === rowData.id ? "block" : "none",
                            position: "absolute",
                            zIndex: 9999,
                            background: "#fff",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                            borderRadius: "6px",
                            padding: "5px 0",
                            listStyle: "none",
                        }}
                    >
                        <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleEdit(rowData);
                            }}
                            style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Edit
                        </li>
                        {rowData.data_type === 9 ||
                            rowData.data_type === 10 || rowData.data_type === 12 ? (
                            <li
                                className="listItem"
                                role="button"
                                onClick={() =>
                                    dataSource(rowData)
                                }
                                style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            >
                                Add Data source
                            </li>
                        ) : (
                            <span></span>
                        )}
                        {
                            rowData.data_type === 11 ? (
                                <li
                                    className="listItem"
                                    role="button"
                                    onClick={() =>
                                        dataSourceForPageText(rowData)
                                    }
                                    style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                                >
                                    Add Data source
                                </li>
                            ) : (
                                <span></span>
                            )}
                        <li
                            style={{ color: "red", fontWeight: "600", margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                            className="listItem"
                            role="button"
                            onClick={() =>
                                handleDelete(rowData.id, rowData.reference_column_name, rowData.form_type)
                            }
                        >
                            Delete
                        </li>
                    </ul>
                </>
            </div>
        );
    }, [openDropdownId, canUpdateCustomInquiry, canDeleteCustomInquiry]);

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

    const handleRefreshStageStatus = async () => {
        await fetchCustomFromFieldApi(
            setCustomInquiryFromList,
            setLoading,
            Number(selectedPageType?.value)
        );
    };

    const handlePageTypeDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedPageType(selectedOption);
        setPageTypeError(selectedOption ? "" : "Type is required");
        // Reset selected data type when form type changes
        setSelectedOrderList(null);
        setDataTypeError("");
    };

    const handleEdit = (item: ICustomInquiryFromList) => {
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

    const handleDelete = (id: number, column: string, formType: number) => {
        setOpenDropdownId(null);
        fetchColumnData(setCustomFeildName, column, formType)
        setCustomInqFromDropdown(false);
        setIsDeleteConfirmation(true);
        setHasIdAvail(id);
        setColumnNameForDelete(column)
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

    type CustomFieldColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        body: (rowData: ICustomInquiryFromList) => React.ReactNode;
    };

    const baseColumnDefs: CustomFieldColumnDef[] = useMemo(() => {
        return [
            {
                key: "form_type",
                label: "Form Type",
                header: (
                    <span>
                        Form Type
                    </span>
                ),
                width: "100px",
                body: (rowData: ICustomInquiryFromList) => (
                    <span>
                        {
                            pageTypeDisplayOptions.find(
                                (option) =>
                                    Number(option.value) === Number(rowData.form_type)
                            )?.label || ""
                        }
                    </span>
                ),
            },
            {
                key: "display_order",
                label: "Sr.no",
                header: (
                    <span>
                        Sr.no
                    </span>
                ),
                width: "200px",
                body: (rowData: ICustomInquiryFromList) => rowData.display_order,
            },
            {
                key: "order_type_display",
                label: "Data Type",
                header: (
                    <span>
                        Data Type
                    </span>
                ),
                width: "200px",
                body: (rowData: ICustomInquiryFromList) => {

                    const selectedType = orderTypesCustomInquiryList.find(
                        (option) => String(option.id) === String(rowData.data_type)
                    );

                    return (
                        <div>
                            <span>
                                {selectedType?.order_type_display || "N/A"}
                            </span>

                            <br />

                            {rowData.required_or_not === 1 && (
                                <span className="text-danger me-1">
                                    *Req
                                </span>
                            )}

                            {rowData.print_or_not === 1 && (
                                <span className="text-danger me-1">
                                    *Print
                                </span>
                            )}

                            {rowData.report_print_or_not === 1 && (
                                <span className="text-danger me-1">
                                    *Report
                                </span>
                            )}

                            {rowData.product_feild_row_column == 2 && (
                                <span className="text-danger me-1">
                                    *In Column
                                </span>
                            )}

                            {rowData.required_for == 1 && (
                                <span className="text-danger me-1">
                                    *Create
                                </span>
                            )}

                            {rowData.required_for == 2 && (
                                <span className="text-danger me-1">
                                    *Stop
                                </span>
                            )}

                            {rowData.required_for == 3 && (
                                <span className="text-danger me-1">
                                    *Both
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: "title",
                label: "Title",
                header: (
                    <span>
                        Title
                    </span>
                ),
                width: "100px",
                body: (rowData: ICustomInquiryFromList) => rowData.title,
            },
        ];
    }, [pageTypeDisplayOptions]);

    const {
        visibleColumns,
        orderedColumns,
        hiddenKeys,
        toggleColumn,
        reorderColumns,
        resetColumns,
    } = useColumnPreferences("custom_field_form_report", baseColumnDefs);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    Custom Field Form
                </h3>
                <div className="d-flex gap-2 align-items-center">

                    <Button
                        icon="pi pi-plus"
                        className="report_button"
                        style={{ backgroundColor: "rgb(245, 134, 52)" }}
                        rounded
                        onClick={() => {
                            if (canAddCustomInquiry) {
                                setIsCreateModel(true);
                            } else {
                                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                            }
                        }}
                        tooltip={`Add Custom Field Form`}
                        tooltipOptions={{
                            position: "left",
                            style: {
                                fontSize: "14px",
                            },
                        }}
                    />
                    <Button
                        icon="pi pi-refresh"
                        className="report_button"
                        style={{ backgroundColor: "#4C4C4C" }}
                        rounded
                        onClick={handleRefreshStageStatus}
                        tooltip="Refresh"
                        tooltipOptions={{
                            position: "top",
                            style: {
                                fontSize: "14px",
                            },
                        }}
                    />
                    <ColumnsButton
                        columns={orderedColumns}
                        hiddenKeys={hiddenKeys}
                        onToggle={toggleColumn}
                        onReorder={reorderColumns}
                        onReset={resetColumns}
                    />
                </div>
            </div>

            <div
                className="report_card"
                style={{
                    height: "90vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <DataTable
                    value={customInquiryFromList}
                    loading={loading}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    className="custom-centered-table"
                    tableStyle={{ tableLayout: "fixed", width: "100%" }}
                    emptyMessage="No data found"
                    filterDisplay="row"
                    filters={filters}
                    onFilter={onFilter}
                    key={openDropdownId}
                >
                    <Column
                        field="actions"
                        headerClassName="center-header"
                        headerStyle={{
                            width: "30px",
                            position: "sticky",
                            top: 0,
                        }}
                        body={actionBodyTemplate}
                    />
                    {visibleColumns.map((col) => (
                        <Column
                            key={col.key}
                            field={col.key}
                            header={col.header}
                            sortable
                            filter
                            filterField={col.key}
                            filterPlaceholder="Search"
                            filterMatchMode={col.filterMatchMode || "contains"}
                            headerStyle={{
                                width: col.width || "150px",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                                background: "#f8f9fa",
                                fontSize: "14px",
                            }}
                            bodyStyle={{ fontSize: "14px" }}
                            body={col.body}
                        />
                    ))}
                </DataTable>
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

        </div >
    );
};

export default CustomFieldFormReport;