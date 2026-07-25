// =============================
// TaskStickyIcon.tsx
// =============================

import { DndContext } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";

import { toast } from "react-toastify";
import { StickyNotesPanel } from "../StickyNotes/StickyNotesPanel";
import { StickyDraggableWidget } from "./StickyDraggableWidget";
import { useStickyNotes } from "./UseStickyNotes";

const OPEN_KEY = "sticky_notes_open";
const POSITION_KEY = "sticky_notes_position";

export const TaskStickyIcon = ({
    categoryIds,
}: {
    categoryIds: string;
}) => {


    // ── OPEN STATE ─────────────────────────────────────
    const [open, setOpen] = useState<boolean>(() => {
        try {
            return sessionStorage.getItem(OPEN_KEY) === "true";
        } catch {
            return false;
        }
    });

    // ── DRAGGING STATE ─────────────────────────────────
    const [isDragging, setIsDragging] = useState(false);

    // ── POSITION STATE ─────────────────────────────────
    const [widgetPosition, setWidgetPosition] = useState(() => {
        try {
            const saved = localStorage.getItem(POSITION_KEY);

            if (saved) {
                return JSON.parse(saved);
            }

            return {
                x: 44,
                y: 175,
            };
        } catch {
            return {
                x: 44,
                y: 175,
            };
        }
    });

    const {
        notesData,
        loading,
        createNote,
        updateNoteStatus,
        deleteNote,
        editNote,
    } = useStickyNotes(categoryIds);

    const didFetch = useRef(false);

    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
    }, []);

    useEffect(() => {
        try {
            sessionStorage.setItem(OPEN_KEY, String(open));
        } catch { }
    }, [open]);

    // ── DRAG START ─────────────────────────────────────
    const handleDragStart = () => {
        setIsDragging(true);
    };

    // ── DRAG END ───────────────────────────────────────
    const handleDragEnd = (event: any) => {
        setIsDragging(false);

        const { delta } = event;

        const newPosition = {
            x: Math.max(
                0,
                Math.min(window.innerWidth - 80, widgetPosition.x - delta.x)
            ),

            y: Math.max(
                0,
                Math.min(window.innerHeight - 80, widgetPosition.y - delta.y)
            ),
        };

        setWidgetPosition(newPosition);

        localStorage.setItem(
            POSITION_KEY,
            JSON.stringify(newPosition)
        );
    };

    // ── OPEN/CLOSE ─────────────────────────────────────
    const handleOpen = () => {
        // category not found
        if (!categoryIds) {
            toast.error("Go to Task Category > Enable 'Add to Widget'");
            return;
        }

        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);

        try {
            sessionStorage.removeItem(OPEN_KEY);
        } catch { }
    };

    // ── NOTES COUNT ────────────────────────────────────
    const totalNotes = notesData.reduce(
        (sum, cat) => sum + (cat.notes?.length ?? 0),
        0
    );

    return (
        <>
            {/* ───────────────────────────────────────────── */}
            {/* DRAGGABLE STICKY ICON */}
            {/* ───────────────────────────────────────────── */}

            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <StickyDraggableWidget position={widgetPosition}>
                    <button
                        onMouseUp={() => {
                            if (!isDragging) {
                                handleOpen();
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        disabled={loading}
                        title={loading ? "Loading notes…" : "Open sticky notes"}
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            backgroundColor: "#070b47",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(231, 220, 220, 0.15)",
                            transition: isDragging
                                ? "none"
                                : "transform 0.2s, box-shadow 0.2s",
                            cursor: isDragging ? "grabbing" : "grab",
                            userSelect: "none",
                            border: "none",
                            position: "relative",
                        }}
                        onMouseEnter={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.transform = "scale(1.1)";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 16px rgba(0,0,0,0.2)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 12px rgba(0,0,0,0.15)";
                            }
                        }}
                    >

                        {/* ── ICON ───────────────────────────── */}
                        {loading ? (
                            <svg
                                className="animate-spin"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#333"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    strokeOpacity="0.25"
                                />
                                <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="30"
                                height="30"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 4h16v16H4z" />
                                <path d="M8 9h8" />
                                <path d="M8 13h5" />
                            </svg>
                        )}

                        {/* ── BADGE ─────────────────────────── */}
                        {/* {totalNotes > 0 && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-5px",
                                    right: "-5px",
                                    minWidth: "22px",
                                    height: "22px",
                                    borderRadius: "999px",
                                    background: "#ef4444",
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 6px",
                                }}
                            >
                                {totalNotes}
                            </div>
                        )} */}
                    </button>
                </StickyDraggableWidget>
            </DndContext>

            {/* ───────────────────────────────────────────── */}
            {/* STICKY PANEL */}
            {/* ───────────────────────────────────────────── */}

            {open && (
                <StickyNotesPanel
                    notesData={notesData}
                    onClose={handleClose}
                    onAddNote={createNote}
                    onCompleteItem={updateNoteStatus}
                    onDeleteItem={deleteNote}
                    onEditItem={editNote}
                />
            )}
        </>
    );
};