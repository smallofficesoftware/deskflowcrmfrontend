import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import "../../../../../components/model/ConfirmationModal.css";
import { IOption } from "../../../../../helpers/AppInterface";
import { addContactAssignment, fetchSelectedContactsList, ISelectedContacts, removeContactAssignment, searchContacts } from "./RoutePlannerController";

interface IContactAssignmentModalProps {
    show: boolean;
    onHide: () => void;
    routeId: number;
    contactFilterObject: any;
}

const RouteAssignContact: React.FC<IContactAssignmentModalProps> = ({
    show,
    onHide,
    routeId,
    contactFilterObject
}) => {
    const [selectedContacts, setSelectedContacts] = useState<ISelectedContacts[]>([]);
    const [chosenContact, setChosenContact] = useState<SingleValue<IOption>>(null);
    const [loadingList, setLoadingList] = useState(false);

    const refreshList = () => {
        fetchSelectedContactsList(setSelectedContacts, routeId, setLoadingList);
    };

    useEffect(() => {
        if (show) {
            refreshList();
        }
    }, [show]);

    const onAddClick = async () => {
        if (!chosenContact) return;
        const isSuccess = await addContactAssignment(chosenContact.value, routeId);
        if (isSuccess) {
            setChosenContact(null);
            refreshList();
        }
    };

    const onDeleteClick = async (id: number) => {
        const isSuccess = await removeContactAssignment(id);
        if (isSuccess) {
            refreshList();
        }
    };

    const loadContactOptions = async (
        inputValue: string,
    ): Promise<IOption[]> => {
        if (inputValue.length < 3) return [];

        const result = await searchContacts(inputValue, contactFilterObject);
        return result || [];
    };

    const handleContactSelect = (option: SingleValue<IOption>) => {
        setChosenContact(option);
    };

    if (!show) return null;

    return (
        <>
            <style>
                {`
          .modal-header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .close-icon-wrapper {
            cursor: pointer;
            padding: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
            color: #5f6368;
          }
          .close-icon-wrapper:hover {
            background-color: #f3f4f6;
            color: #111827;
          }
          .search-action-row {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 20px;
          }
          .dropdown-flex-grow {
            flex: 1;
          }
          .add-action-btn {
            padding: 8px 24px;
            height: 38px;
            background-color: #f97316;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
            white-space: nowrap;
          }
          .add-action-btn:hover:not(:disabled) {
            background-color: #ea580c;
          }
          .add-action-btn:disabled {
            background-color: #e5e7eb;
            color: #9ca3af;
            cursor: not-allowed;
          }
          .table-scroll-container {
            max-height: 380px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .process-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            text-align: left;
          }
          .process-table th {
            background-color: #f9fafb;
            padding: 12px;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
          }
          .process-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
          }
          .process-table tr:hover {
            background-color: #f9fafb;
          }
          .action-trash-btn {
            background: none;
            border: none;
            color: #ef4444;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .action-trash-btn:hover {
            background-color: #fee2e2;
          }
          .table-scroll-container {
            max-height: 400px;
            overflow-y: auto;
          }
          .process-table {
            width: 100%;
            border-collapse: collapse;
          }
          .process-table thead th {
            position: sticky;
            top: 0;
            background: white;
            z-index: 10;
          }
        `}
            </style>

            <div className="modal-overlay" style={{ zIndex: 1111 }}>
                <div className="modal-content_label" style={{ maxWidth: "700px", width: "100%" }}>

                    <div className="modal-header-container m-0">
                        <h2 className="modal-title1 form_header_text m-0 p-0">Add Contacts To Route Planner</h2>
                        <div
                            className="close-icon-wrapper"
                            role="button"
                            aria-label="Close"
                            onClick={onHide}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                        </div>
                    </div>
                    <div style={{ marginBottom: "20px", textAlign: "left" }}>
                        <h6>{`From: ${contactFilterObject.country_name}, ${contactFilterObject.state_name}, ${contactFilterObject.city_name}${contactFilterObject.area_name ? `, ${contactFilterObject.area_name}` : ""}`}</h6>
                    </div>

                    <div className="search-action-row">
                        <div className="dropdown-flex-grow">
                            <CustomSearchDropdown
                                isAsync={true}
                                loadOptions={loadContactOptions}
                                value={chosenContact}
                                onChange={handleContactSelect}
                                className="w-100"
                                placeholder="Search contact..."
                                styles={{
                                    singleValue: (base: any) => ({
                                        ...base,
                                        textAlign: "left"
                                    }),
                                    placeholder: (base: any) => ({
                                        ...base,
                                        textAlign: "left"
                                    })
                                }}
                            />
                        </div>
                        <button
                            className="add-action-btn"
                            onClick={onAddClick}
                            disabled={!chosenContact}
                        >
                            ADD
                        </button>
                    </div>

                    <div className="table-scroll-container">
                        <table className="process-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "70px" }}>Sr no.</th>
                                    <th>Person Name</th>
                                    <th>Company Name</th>
                                    <th>Mobile Number</th>
                                    <th style={{ width: "90px", textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingList ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                                            Loading assignments...
                                        </td>
                                    </tr>
                                ) : selectedContacts.length > 0 ? (
                                    selectedContacts.map((contact, index) => (
                                        <tr key={contact.id}>
                                            <td>{index + 1}</td>
                                            <td>{contact.person_name}</td>
                                            <td>{contact.company_name || "-"}</td>
                                            <td>{contact.mobile_number}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    className="action-trash-btn"
                                                    onClick={() => onDeleteClick(contact.id)}
                                                    title="Remove Contact"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                                                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v-40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "24px" }}>
                                            No contacts assigned.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </>
    );
};

export default RouteAssignContact;