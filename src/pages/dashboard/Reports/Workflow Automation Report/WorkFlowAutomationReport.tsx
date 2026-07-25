import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useRef, useState } from "react";
import MiracleConfigurationsView from "../../../left-side/header/Setting/work-flow-automation/MiracleConfigurationsView";
import WhatsappConfigurationView from "../../../left-side/header/Setting/work-flow-automation/whatsappConfigurationView";
import WorkFlowAutomationAutoAssignmentContactPopUp from "../../../left-side/header/Setting/work-flow-automation/WorkFlowAutomationAutoAssignmentContactPopUp";
import WorkFlowAutomationPopUp from "../../../left-side/header/Setting/work-flow-automation/WorkFlowAutomationPopUp";

export type automationOptionType =
    {
        id: number;
        label: string;
        action: () => void;
    };

const WorkFlowAutomationReport = () => {
    const [loading, setLoading] = useState(false);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownOpenAutoAssignContact, setDropdownOpenAutoAssignContact] = useState(false);
    const [dropdownOpenMiracle, setDropdownOpenMiracle] = useState(false);
    const [dropdownOpenWhatsapp, setDropdownOpenWhatsapp] = useState(false);

    // const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {}
    );

    const toggleDropdown = () => {
        setDropdownOpen(true);
    };
    const toggleDropdownAutoAssignContact = () => {
        setDropdownOpenAutoAssignContact(true);
    };
    const toggleDropdownMiracleIntegrations = () => {
        setDropdownOpenMiracle(true);
    };
    const toggleDropdownWhatsappConfigurations = () => {
        setDropdownOpenWhatsapp(true);
    };

    // const handleClickOutside = (event: MouseEvent) => {
    //     const target = event.target as HTMLElement;

    //     const clickedOnButton = target.closest('.source-of-type-list-grid-options');
    //     if (clickedOnButton) return;

    //     const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
    //         (ref) => ref && ref.contains(target)
    //     );

    //     if (!clickedInsideDropdown) {
    //         setOpenDropdownId(null);
    //     }
    // };

    // useEffect(() => {
    //     document.addEventListener("mousedown", handleClickOutside);
    //     return () => {
    //         document.removeEventListener("mousedown", handleClickOutside);
    //     };
    // }, []);

    // useEffect(() => {
    //     const handleEscKey = (event: KeyboardEvent) => {
    //         if (event.key === "Escape") {
    //             setOpenDropdownId(null);
    //         }
    //     };

    //     document.addEventListener("keydown", handleEscKey);

    //     return () => {
    //         document.removeEventListener("keydown", handleEscKey);
    //     };
    // }, []);

    const actionBodyTemplate = useCallback((rowData: automationOptionType) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                            rowData.action();
                        }}
                    />

                    {/* <ul
                        ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                        style={{
                            width: "150px",
                            marginLeft: "18%",
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

                                rowData.action();
                            }}
                            style={{ margin: "0 10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Save Config
                        </li>
                    </ul> */}
                </>
            </div>
        );
    }, []);

    const automationOptions: automationOptionType[] = [
        {
            id: 1,
            label: "Third Party Scheduler",
            action: () => {
                toggleDropdown();
            }
        },
        {
            id: 2,
            label: "Auto Contact Reminder Daily",
            action: () => { }
        },
        {
            id: 3,
            label: "Auto Assignment of Contact",
            action: () => {
                toggleDropdownAutoAssignContact();
            }
        },
        {
            id: 4,
            label: "Miracle Integrations",
            action: () => {
                toggleDropdownMiracleIntegrations();
            }
        },
        {
            id: 5,
            label: "Whatsapp Configurations",
            action: () => {
                toggleDropdownWhatsappConfigurations();
            }
        },
    ]

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    All Templates
                </h3>
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
                    value={automationOptions}
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
                // key={openDropdownId}
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
                                Automation Name
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
                        body={(rowData: automationOptionType) => {
                            return (
                                <span>
                                    {rowData.label}
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {dropdownOpen && (
                <WorkFlowAutomationPopUp
                    show={dropdownOpen}
                    onHide={() => setDropdownOpen(false)}
                />
            )}
            {dropdownOpenAutoAssignContact && (
                <WorkFlowAutomationAutoAssignmentContactPopUp
                    show={dropdownOpenAutoAssignContact}
                    onHide={() => setDropdownOpenAutoAssignContact(false)}
                    RequiredDetail={{ title: "Auto Assignment Of Contact" }}
                />
            )}
            {dropdownOpenMiracle && (
                <MiracleConfigurationsView
                    show={dropdownOpenMiracle}
                    onHide={() => setDropdownOpenMiracle(false)}
                    headerName="Add Miracle Configurations"
                />
            )}
            {dropdownOpenWhatsapp && (
                <WhatsappConfigurationView
                    show={dropdownOpenWhatsapp}
                    onHide={() => setDropdownOpenWhatsapp(false)}
                    headerName="Add Whatsapp Configurations"
                />
            )}
        </div>
    );
};

export default WorkFlowAutomationReport;