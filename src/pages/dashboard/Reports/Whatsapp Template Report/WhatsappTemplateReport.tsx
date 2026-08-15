import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEscapeKey } from "../../../../common/SharedFunction";
import { sendTemplateMessagePdf } from "../../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import WhatsappTemplateSenderPreviewModal from "../../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderPreviewModal";
import { CompanyField, fetchCompanyTitleFields } from "../../../left-side/header/Setting/whatsapp-template-config/whatsappTemplateController";
import { fetchCompanyApi, ICompany } from "../../../left-side/list-company/ListCompanyController";

interface IWhatsappTemplateReport {
    onHide?: () => void;
}

const WhatsappTemplateReport = ({ onHide }: IWhatsappTemplateReport) => {
    const [loading, setLoading] = useState(false);

    const [globalSearchText, setGlobalSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // const [filters, setFilters] = useState<DataTableFilterMeta>({
    //     source_name: {
    //         value: null,
    //         matchMode: "contains",
    //     },
    // });
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {}
    );

    const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
    const [noDataFound, setNoDataFound] = useState(false);
    const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();
    const [whatsappTemplateShowModal, setWhatsappTemplateShowModal] =
        useState<boolean>(false);
    const [isOrderShowNum, setIsOrderShowNum] = useState<string>("");
    const [dynamicName, setDynamicName] = useState<string>("");
    const [contextParamsKey, setContextParamsKey] = useState<string>("");
    const [companyTitleFields, setCompanyTitleFields] = useState<CompanyField[]>();

    // const onFilter = (event: DataTableFilterEvent) => {
    //     setFilters(event.filters);
    // };

    useEffect(() => {
        const fetchCompanyTittles = async () => {
            await fetchCompanyApi(
                setCompanyLists,
                "",
                setNoDataFound,
                setCompanyJoinOrCreate,
                setLoading,
            );
        };

        fetchCompanyTittles();
    }, []);

    useEscapeKey(() => {
        if (
            !openDropdownId &&
            !whatsappTemplateShowModal
        ) {
            onHide?.();
        } else {
            setOpenDropdownId(null);
            setWhatsappTemplateShowModal(false);
        }
    });

    const companyData = companyLists?.[0];

    useEffect(() => {
        fetchCompanyTitleFields(companyData, setIsOrderShowNum, setDynamicName, setContextParamsKey, setWhatsappTemplateShowModal, setCompanyTitleFields);
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        await fetchCompanyApi(
            setCompanyLists,
            "",
            setNoDataFound,
            setCompanyJoinOrCreate,
            setLoading,
        );
        fetchCompanyTitleFields(companyData, setIsOrderShowNum, setDynamicName, setContextParamsKey, setWhatsappTemplateShowModal, setCompanyTitleFields);
        setLoading(false);
    };

    const handleSendTemplate = async (
        template: any,
        variables: any,
        receiverClue: any,
        quickFillVars: any,
    ) => {
        /*     console.log("Sending template:", template);
            console.log("With variables:", variables);
        
            // Here you would typically make an API call to send the WhatsApp message
            alert(
              `Template "${template.name}" ready to send with variables: ${JSON.stringify(variables)}`,
            );
            setWhatsappTemplateShowModal(false); */
        await sendTemplateMessagePdf(
            template,
            variables,
            setWhatsappTemplateShowModal,
            receiverClue,
            quickFillVars,
        );
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        const clickedOnButton = target.closest('.source-of-type-list-grid-options');
        if (clickedOnButton) return;

        const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
            (ref) => ref && ref.contains(target)
        );

        if (!clickedInsideDropdown) {
            setOpenDropdownId(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const actionBodyTemplate = useCallback((rowData: CompanyField) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                        }}
                    />

                    <ul
                        ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                        style={{
                            width: "150px",
                            marginLeft: "18%",
                            height: "auto",
                            display: openDropdownId === rowData.id ? "block" : "none",
                            position: "absolute",
                            zIndex: 999,
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

                                rowData.action();
                            }}
                            style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Save Config
                        </li>
                    </ul>
                </>
            </div>
        );
    }, [openDropdownId]);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    All Templates
                </h3>
                <Button
                    icon="pi pi-refresh"
                    className="report_button"
                    style={{ backgroundColor: "#4C4C4C" }}
                    rounded
                    onClick={handleRefresh}
                    tooltip="Refresh"
                    tooltipOptions={{
                        position: "top",
                        style: {
                            fontSize: "14px",
                        },
                    }}
                />
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
                    value={companyTitleFields}
                    loading={loading}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    className="custom-centered-table"
                    tableStyle={{ tableLayout: "fixed", width: "100%" }}
                    emptyMessage="No data found"
                    // filterDisplay="row"
                    // filters={filters}
                    // onFilter={onFilter}
                    key={openDropdownId}
                >
                    <Column
                        field="actions"
                        headerClassName="center-header"
                        headerStyle={{
                            width: "30px",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                        }}
                        body={actionBodyTemplate}

                    />
                    <Column
                        header={
                            <span>
                                Template Name
                            </span>
                        }
                        sortable
                        // filter
                        // filterPlaceholder="Search"
                        // filterMatchMode="contains"
                        headerStyle={{
                            width: "350px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: CompanyField) => {
                            return (
                                <span>
                                    {rowData.type === "company"
                                        ? companyData?.[rowData.key] || rowData.label
                                        : rowData.label}
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {whatsappTemplateShowModal && (
                <WhatsappTemplateSenderPreviewModal
                    show={whatsappTemplateShowModal}
                    onHide={() => setWhatsappTemplateShowModal(false)}
                    onSend={handleSendTemplate}
                    module={isOrderShowNum}
                    displayModule={dynamicName}
                    contextParams={/* { [contextParamsKey]: null } */ null} // Parameters needed for this context
                />
            )}
        </div>
    );
};

export default WhatsappTemplateReport;