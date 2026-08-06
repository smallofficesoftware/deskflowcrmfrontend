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
    // Tracks contacts the user explicitly unchecked (inverse of pendingIds)
    const [userDeselectedIds, setUserDeselectedIds] = useState<Set<number>>(new Set());
    const [loadingAll, setLoadingAll] = useState(false);
    const [loadingAssigned, setLoadingAssigned] = useState(false);
    const [addingContacts, setAddingContacts] = useState(false);
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
            setUserDeselectedIds(new Set());
            setSearchTerm("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    // Set of contact_ids that are already assigned
    const assignedContactIds = useMemo(
        () => new Set(assignedContacts.map((c) => c.contact_id)),
        [assignedContacts]
    );

    // Map contact_id → assignment record id (needed for removal)
    const assignedContactMap = useMemo(() => {
        const map = new Map<number, number>();
        assignedContacts.forEach((c) => map.set(c.contact_id, c.id));
        return map;
    }, [assignedContacts]);

    // pendingIds: all loaded contacts that are neither assigned nor explicitly deselected
    // New contacts loaded via scroll are auto-included since they start outside userDeselectedIds
    const pendingIds = useMemo(
        () => new Set(
            allContacts
                .map((c) => c.id)
                .filter((id) => !assignedContactIds.has(id) && !userDeselectedIds.has(id))
        ),
        [allContacts, assignedContactIds, userDeselectedIds]
    );

    // Client-side search filter
    const filteredContacts = useMemo(() => {
        if (!searchTerm.trim()) return allContacts;
        const lower = searchTerm.toLowerCase();
        return allContacts.filter(
            (c) =>
                c.person_name.toLowerCase().includes(lower) ||
                (c.company_name || "").toLowerCase().includes(lower)
        );
    }, [allContacts, searchTerm]);

    const getRowStatus = (contactId: number): "assigned" | "pending" | "normal" => {
        if (assignedContactIds.has(contactId)) return "assigned";
        if (!userDeselectedIds.has(contactId)) return "pending"; // default: selected
        return "normal"; // explicitly deselected by user
    };

    const handleToggle = async (contactId: number) => {
        const status = getRowStatus(contactId);
        if (status === "assigned") {
            // Remove assignment immediately
            const assignmentId = assignedContactMap.get(contactId);
            if (assignmentId !== undefined) {
                const ok = await removeContactAssignment(assignmentId);
                if (ok) refreshAssigned();
            }
        } else if (status === "pending") {
            // Explicitly deselect
            setUserDeselectedIds((prev) => new Set(prev).add(contactId));
        } else {
            // Re-select (remove from deselected set)
            setUserDeselectedIds((prev) => {
                const next = new Set(prev);
                next.delete(contactId);
                return next;
            });
        }
    };

    const handleAddClick = async () => {
        const ids = Array.from(pendingIds);
        if (ids.length === 0) return;
        setAddingContacts(true);
        const results = await addContactAssignment(ids, routeId);
        setAddingContacts(false);
        if (results) {
            refreshAssigned();
        }
    };

    // Infinite scroll — fetch next page when user reaches bottom of table
    const handleScroll = () => {
        const el = tableRef.current;
        if (!el || !hasMore || loadingMore || loadingAll) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
            const nextOffset = contactOffset + PAGE_SIZE;
            setContactOffset(nextOffset);
            loadContacts(nextOffset, true);
        }
    };

    if (!show) return null;

    const isLoading = loadingAll || loadingAssigned;

    return (
        <>
            <style>
                {`
          /* ── Modal shell ───────────────────────────────────────────── */
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
          .rac-row--normal:hover {
            background-color: #f9fafb;
          }
          .rac-row--pending {
            background-color: rgba(251,191,36,0.08);
          }
          .rac-row--pending:hover {
            background-color: rgba(251,191,36,0.15);
          }
          .rac-row--assigned {
            background-color: rgba(249,115,22,0.08);
            box-shadow: inset 3px 0 0 #f97316;
          }
          .rac-row--assigned:hover {
            background-color: rgba(249,115,22,0.14);
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
          .rac-cb--pending {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
          }
          .rac-cb--assigned {
            background: #f97316;
            border-color: #f97316;
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

                    {/* Header */}
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

                    {/* Location subtitle */}
                    <div style={{ marginBottom: "16px", textAlign: "left" }}>
                        <h6 className="m-0">{`From: ${contactFilterObject.country_name}, ${contactFilterObject.state_name}, ${contactFilterObject.city_name}${contactFilterObject.area_name ? `, ${contactFilterObject.area_name}` : ""}`}</h6>
                    </div>

                    {/* Toolbar: search + ADD */}
                    <div className="rac-toolbar">
                        <input
                            type="text"
                            className="rac-search-input"
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            className="rac-add-btn"
                            onClick={handleAddClick}
                            disabled={pendingIds.size === 0 || addingContacts}
                        >
                            {addingContacts
                                ? "Adding..."
                                : pendingIds.size > 0
                                    ? `ADD (${pendingIds.size})`
                                    : "ADD"}
                        </button>
                    </div>

                    {/* Contact list */}
                    <div className="rac-table-wrap" ref={tableRef} onScroll={handleScroll}>
                        <table className="rac-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "44px" }}></th>
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
                                ) : filteredContacts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="rac-empty-cell">
                                            {searchTerm
                                                ? "No contacts match your search."
                                                : "No contacts found for this area."}
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {filteredContacts.map((contact, index) => {
                                            const status = getRowStatus(contact.id);
                                            return (
                                                <tr
                                                    key={contact.id}
                                                    className={`rac-row rac-row--${status}`}
                                                    onClick={() => handleToggle(contact.id)}
                                                >
                                                    {/* Checkbox */}
                                                    <td>
                                                        <span className={`rac-cb rac-cb--${status}`}>
                                                            {status !== "normal" && (
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
                                                        {status === "assigned" && (
                                                            <span className="rac-badge rac-badge--assigned">Added</span>
                                                        )}
                                                        {status === "pending" && (
                                                            <span className="rac-badge rac-badge--pending">Selected</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Infinite scroll feedback */}
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
                                                    — All contacts loaded —
                                                </td>
                                            </tr>
                                        )}
                                    </>
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
