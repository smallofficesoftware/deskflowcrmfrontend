import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../../../../components/model/ConfirmationModal.css";
import {
    addContactAssignment,
    fetchAllAreaContacts,
    fetchSelectedContactsList,
    IAreaContact,
    ISelectedContacts,
    removeContactAssignment,
} from "./RoutePlannerController";

interface IContactAssignmentModalProps {
    show: boolean;
    onHide: () => void;
    routeId: number;
    contactFilterObject: any;
}

const PAGE_SIZE = 15;

const RouteAssignContact: React.FC<IContactAssignmentModalProps> = ({
    show,
    onHide,
    routeId,
    contactFilterObject,
}) => {
    const [allContacts, setAllContacts] = useState<IAreaContact[]>([]);
    const [assignedContacts, setAssignedContacts] = useState<ISelectedContacts[]>([]);
    const [activeTab, setActiveTab] = useState<"unassigned" | "assigned">("unassigned");
    const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<Set<number>>(new Set());
    const [selectedAssignedIds, setSelectedAssignedIds] = useState<Set<number>>(new Set());
    const [loadingAll, setLoadingAll] = useState(false);
    const [loadingAssigned, setLoadingAssigned] = useState(false);
    const [addingContacts, setAddingContacts] = useState(false);
    const [removingContacts, setRemovingContacts] = useState(false);
    const [contactOffset, setContactOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const tableRef = useRef<HTMLDivElement>(null);

    const refreshAssigned = () => {
        fetchSelectedContactsList(setAssignedContacts, routeId, setLoadingAssigned);
    };

    const loadContacts = async (offset: number, append: boolean) => {
        if (append) {
            setLoadingMore(true);
            const more = await fetchAllAreaContacts(
                setAllContacts, contactFilterObject,
                () => { }, // loading state handled by loadingMore
                PAGE_SIZE, offset, true
            );
            setHasMore(more);
            setLoadingMore(false);
        } else {
            const more = await fetchAllAreaContacts(
                setAllContacts, contactFilterObject,
                setLoadingAll,
                PAGE_SIZE, offset, false
            );
            setHasMore(more);
        }
    };

    const refreshAll = () => {
        setContactOffset(0);
        setHasMore(false);
        loadContacts(0, false);
    };

    useEffect(() => {
        if (show) {
            refreshAll();
            refreshAssigned();
            setSelectedUnassignedIds(new Set());
            setSelectedAssignedIds(new Set());
            setActiveTab("unassigned");
            setSearchTerm("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const assignedContactIds = useMemo(
        () => new Set(assignedContacts.map((c) => c.contact_id)),
        [assignedContacts]
    );

    const assignedContactMap = useMemo(() => {
        const map = new Map<number, number>();
        assignedContacts.forEach((c) => map.set(c.contact_id, c.id));
        return map;
    }, [assignedContacts]);

    const unassignedContacts = useMemo(
        () => allContacts.filter((c) => !assignedContactIds.has(c.id)),
        [allContacts, assignedContactIds]
    );

    const filteredUnassigned = useMemo(() => {
        if (!searchTerm.trim()) return unassignedContacts;
        const lower = searchTerm.toLowerCase();
        return unassignedContacts.filter(
            (c) =>
                c.person_name.toLowerCase().includes(lower) ||
                (c.company_name || "").toLowerCase().includes(lower)
        );
    }, [unassignedContacts, searchTerm]);

    const filteredAssigned = useMemo(() => {
        if (!searchTerm.trim()) return assignedContacts;
        const lower = searchTerm.toLowerCase();
        return assignedContacts.filter(
            (c) =>
                c.person_name.toLowerCase().includes(lower) ||
                (c.company_name || "").toLowerCase().includes(lower)
        );
    }, [assignedContacts, searchTerm]);

    const isAllUnassignedSelected = useMemo(() => {
        if (filteredUnassigned.length === 0) return false;
        return filteredUnassigned.every((c) => selectedUnassignedIds.has(c.id));
    }, [filteredUnassigned, selectedUnassignedIds]);

    const isAllAssignedSelected = useMemo(() => {
        if (filteredAssigned.length === 0) return false;
        return filteredAssigned.every((c) => selectedAssignedIds.has(c.id));
    }, [filteredAssigned, selectedAssignedIds]);

    const handleHeaderSelectAll = () => {
        if (activeTab === "unassigned") {
            if (isAllUnassignedSelected) {
                setSelectedUnassignedIds(new Set());
            } else {
                setSelectedUnassignedIds(new Set(filteredUnassigned.map((c) => c.id)));
            }
        } else {
            if (isAllAssignedSelected) {
                setSelectedAssignedIds(new Set());
            } else {
                setSelectedAssignedIds(new Set(filteredAssigned.map((c) => c.id)));
            }
        }
    };

    const handleToggleUnassigned = (id: number) => {
        setSelectedUnassignedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleAssigned = (contactId: number) => {
        setSelectedAssignedIds((prev) => {
            const next = new Set(prev);
            if (next.has(contactId)) next.delete(contactId);
            else next.add(contactId);
            return next;
        });
    };

    const handleAddClick = async () => {
        const ids = Array.from(selectedUnassignedIds);
        if (ids.length === 0) return;
        setAddingContacts(true);
        const results = await addContactAssignment(ids, routeId);
        setAddingContacts(false);
        if (results) {
            setSelectedUnassignedIds(new Set());
            refreshAssigned();
        }
    };

    const handleRemoveClick = async () => {
        const assignmentIds = Array.from(selectedAssignedIds);

        if (assignmentIds.length === 0) return;
        setRemovingContacts(true);
        const ok = await removeContactAssignment(assignmentIds);
        setRemovingContacts(false);
        if (ok) {
            setSelectedAssignedIds(new Set());
            refreshAssigned();
        }
    };

    const handleScroll = () => {
        if (activeTab !== "unassigned") return;
        const el = tableRef.current;
        if (!el || !hasMore || loadingMore || loadingAll) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
            const nextOffset = contactOffset + PAGE_SIZE;
            setContactOffset(nextOffset);
            loadContacts(nextOffset, true);
        }
    };

    if (!show) return null;

    const isLoading = activeTab === "unassigned" ? loadingAll : loadingAssigned;

    return (
        <>
            <style>
                {`
          /* ── Modal shell ───────────────────────────────────────────── */
          .modal-header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
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

          /* ── Tabs ───────────────────────────────────────────────────── */
          .rac-tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
          }
          .rac-tab {
            padding: 8px 16px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            color: #6b7280;
            transition: all 0.2s ease;
          }
          .rac-tab:hover {
            color: #374151;
          }
          .rac-tab--active {
            color: #f97316;
            border-bottom-color: #f97316;
          }

          /* ── Toolbar ────────────────────────────────────────────────── */
          .rac-toolbar {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 16px;
          }
          .rac-search-input {
            flex: 1;
            height: 38px;
            padding: 0 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            color: #374151;
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .rac-search-input:focus {
            border-color: #f97316;
            box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
          }
          .rac-add-btn {
            padding: 0 22px;
            height: 38px;
            background-color: #f97316;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
            transition: background-color 0.2s ease;
          }
          .rac-add-btn:hover:not(:disabled) {
            background-color: #ea580c;
          }
          .rac-add-btn:disabled {
            background-color: #e5e7eb;
            color: #9ca3af;
            cursor: not-allowed;
          }

          .rac-remove-btn {
            padding: 0 22px;
            height: 38px;
            background-color: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
            transition: background-color 0.2s ease;
          }
          .rac-remove-btn:hover:not(:disabled) {
            background-color: #dc2626;
          }
          .rac-remove-btn:disabled {
            background-color: #fca5a5;
            cursor: not-allowed;
          }

          /* ── Table container ────────────────────────────────────────── */
          .rac-table-wrap {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .rac-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            text-align: left;
          }
          .rac-table thead th {
            position: sticky;
            top: 0;
            background-color: #f9fafb;
            padding: 11px 12px;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            z-index: 10;
          }
          .rac-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
            vertical-align: middle;
          }
          .rac-table tr:last-child td {
            border-bottom: none;
          }

          /* ── Row states ─────────────────────────────────────────────── */
          .rac-row {
            cursor: pointer;
            transition: background-color 0.15s ease;
          }
          .rac-row:hover {
            background-color: #f9fafb;
          }
          .rac-row--selected {
            background-color: rgba(251,191,36,0.08);
          }
          .rac-row--selected:hover {
            background-color: rgba(251,191,36,0.15);
          }

          /* ── Custom checkbox ────────────────────────────────────────── */
          .rac-cb {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            border: 2px solid #d1d5db;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.15s ease;
          }
          .rac-cb--normal {
            background: white;
          }
          .rac-cb--checked {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
          }

          /* ── Status badges ──────────────────────────────────────────── */
          .rac-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          .rac-badge--assigned {
            background-color: rgba(249,115,22,0.15);
            color: #c2410c;
          }
          .rac-badge--pending {
            background-color: rgba(245,158,11,0.15);
            color: #92400e;
          }

          /* ── Empty / loading ────────────────────────────────────────── */
          .rac-empty-cell {
            text-align: center;
            padding: 36px 20px;
            color: #9ca3af;
            font-size: 14px;
          }
          .rac-load-more-cell {
            text-align: center;
            padding: 12px 20px;
            color: #9ca3af;
            font-size: 13px;
          }
          .rac-end-cell {
            text-align: center;
            padding: 10px 20px;
            color: #d1d5db;
            font-size: 12px;
          }
        `}
            </style>

            <div className="modal-overlay" style={{ zIndex: 1111 }}>
                <div className="modal-content_label" style={{ maxWidth: "700px", width: "100%" }}>

                    <div className="modal-header-container m-0">
                        <h2 className="modal-title1 form_header_text m-0 p-0">
                            Add Contacts To Route Planner
                        </h2>
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

                    <div style={{ marginBottom: "16px", textAlign: "left" }}>
                        <h6 className="m-0">{`From: ${contactFilterObject.country_name}, ${contactFilterObject.state_name}, ${contactFilterObject.city_name}${contactFilterObject.area_name ? `, ${contactFilterObject.area_name}` : ""}`}</h6>
                    </div>

                    <div className="rac-tabs">
                        <button
                            type="button"
                            className={`rac-tab ${activeTab === "unassigned" ? "rac-tab--active" : ""}`}
                            onClick={() => setActiveTab("unassigned")}
                        >
                            Available Contacts ({unassignedContacts.length})
                        </button>
                        <button
                            type="button"
                            className={`rac-tab ${activeTab === "assigned" ? "rac-tab--active" : ""}`}
                            onClick={() => setActiveTab("assigned")}
                        >
                            Assigned Contacts ({assignedContacts.length})
                        </button>
                    </div>

                    <div className="rac-toolbar">
                        <input
                            type="text"
                            className="rac-search-input"
                            placeholder={activeTab === "unassigned" ? "Search available contacts..." : "Search assigned contacts..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {activeTab === "unassigned" ? (
                            <button
                                type="button"
                                className="rac-add-btn"
                                onClick={handleAddClick}
                                disabled={selectedUnassignedIds.size === 0 || addingContacts}
                            >
                                {addingContacts
                                    ? "Adding..."
                                    : selectedUnassignedIds.size > 0
                                        ? `ADD (${selectedUnassignedIds.size})`
                                        : "ADD"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="rac-remove-btn"
                                onClick={handleRemoveClick}
                                disabled={selectedAssignedIds.size === 0 || removingContacts}
                            >
                                {removingContacts
                                    ? "Removing..."
                                    : selectedAssignedIds.size > 0
                                        ? `REMOVE (${selectedAssignedIds.size})`
                                        : "REMOVE"}
                            </button>
                        )}
                    </div>

                    <div className="rac-table-wrap" ref={tableRef} onScroll={handleScroll}>
                        <table className="rac-table">
                            <thead>
                                <tr>
                                    <th
                                        style={{ width: "44px", cursor: "pointer" }}
                                        onClick={handleHeaderSelectAll}
                                        title={
                                            activeTab === "unassigned"
                                                ? isAllUnassignedSelected ? "Deselect All" : "Select All"
                                                : isAllAssignedSelected ? "Deselect All" : "Select All"
                                        }
                                    >
                                        <span className={`rac-cb ${activeTab === "unassigned" ? (isAllUnassignedSelected ? "rac-cb--checked" : "rac-cb--normal") : (isAllAssignedSelected ? "rac-cb--checked" : "rac-cb--normal")}`}>
                                            {(activeTab === "unassigned" ? isAllUnassignedSelected : isAllAssignedSelected) && (
                                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>
                                    </th>
                                    <th style={{ width: "56px" }}>Sr no.</th>
                                    <th>Person Name</th>
                                    <th>Company Name</th>
                                    <th>Mobile Number</th>
                                    <th style={{ width: "84px", textAlign: "center" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="rac-empty-cell">
                                            Loading contacts...
                                        </td>
                                    </tr>
                                ) : activeTab === "unassigned" ? (
                                    filteredUnassigned.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="rac-empty-cell">
                                                {searchTerm
                                                    ? "No available contacts match your search."
                                                    : "No unassigned contacts found for this area."}
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {filteredUnassigned.map((contact, index) => {
                                                const isChecked = selectedUnassignedIds.has(contact.id);
                                                return (
                                                    <tr
                                                        key={contact.id}
                                                        className={`rac-row ${isChecked ? "rac-row--selected" : ""}`}
                                                        onClick={() => handleToggleUnassigned(contact.id)}
                                                    >
                                                        <td>
                                                            <span className={`rac-cb ${isChecked ? "rac-cb--checked" : "rac-cb--normal"}`}>
                                                                {isChecked && (
                                                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                                                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td>{index + 1}</td>
                                                        <td>{contact.person_name}</td>
                                                        <td>{contact.company_name || "-"}</td>
                                                        <td>{contact.mobile_number || "-"}</td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {isChecked && (
                                                                <span className="rac-badge rac-badge--pending">Selected</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {loadingMore && (
                                                <tr>
                                                    <td colSpan={6} className="rac-load-more-cell">
                                                        Loading more contacts...
                                                    </td>
                                                </tr>
                                            )}
                                            {!hasMore && !loadingMore && allContacts.length >= PAGE_SIZE && (
                                                <tr>
                                                    <td colSpan={6} className="rac-end-cell">
                                                        — All available contacts loaded —
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )
                                ) : (
                                    filteredAssigned.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="rac-empty-cell">
                                                {searchTerm
                                                    ? "No assigned contacts match your search."
                                                    : "No contacts currently assigned to this route."}
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {filteredAssigned.map((contact, index) => {
                                                const isChecked = selectedAssignedIds.has(contact.id);
                                                return (
                                                    <tr
                                                        key={contact.id}
                                                        className={`rac-row ${isChecked ? "rac-row--selected" : ""}`}
                                                        onClick={() => handleToggleAssigned(contact.id)}
                                                    >
                                                        <td>
                                                            <span className={`rac-cb ${isChecked ? "rac-cb--checked" : "rac-cb--normal"}`}>
                                                                {isChecked && (
                                                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                                                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td>{index + 1}</td>
                                                        <td>{contact.person_name}</td>
                                                        <td>{contact.company_name || "-"}</td>
                                                        <td>{contact.mobile_number || "-"}</td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <span className="rac-badge rac-badge--assigned">Added</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    )
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
