// =============================
// StickyNote.tsx  (Enhanced)
// =============================

import { useCallback, useEffect, useRef, useState } from "react";

// ── Z-index constants ──────────────────────────────────────────────────────
const Z_BASE = 2_147_483_000;
const Z_DRAGGING = 2_147_483_640;

// ── SVG icon primitives ────────────────────────────────────────────────────
const IconClose = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L12 12M12 1L1 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
);

const IconDots = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="2" cy="7" r="1.5" fill="currentColor" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    </svg>
);

// ── Colour helpers ─────────────────────────────────────────────────────────
function darkenHex(hex: string, amount: number): string {
    const c = hex.replace("#", "");
    const num = parseInt(
        c.length === 3 ? c.split("").map(x => x + x).join("") : c,
        16
    );
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Note { id: any; content: string; }
interface Category {
    category_id: any;
    category_name: string;
    category_color: string;
    notes?: Note[];
}

// Persisted layout state per card
export interface CardLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    category: Category;
    defaultX: number;
    defaultY: number;
    layout?: CardLayout;

    onClose: (id: any) => void;

    onAddNote?: (
        categoryId: any,
        content: string
    ) => Promise<void>;

    onFocus: () => void;

    zIndex: number;

    onLayoutChange?: (
        id: any,
        layout: CardLayout
    ) => void;

    onCompleteItem?: (
        noteId: any,
        lineContent: string
    ) => Promise<void>;

    onDeleteItem?: (
        noteId: any
    ) => Promise<void>;

    onEditItem?: (
        noteId: any,
        content: string
    ) => Promise<void>;
}

// ── Checkbox line renderer ─────────────────────────────────────────────────
interface CheckLineProps {
    line: string;
    noteId: any;
    onComplete: (noteId: any, line: string) => Promise<void>;
    accentColor: string;
}

const CheckLine = ({ line, noteId, onComplete, accentColor }: CheckLineProps) => {
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const trimmed = line.trim();
    if (!trimmed) return null;

    const handleCheck = async () => {
        if (checked || loading) return; // prevent duplicate calls
        setLoading(true);
        setError(false);
        // Optimistic UI
        setChecked(true);
        try {
            await onComplete(noteId, trimmed);
        } catch {
            // Revert on error
            setChecked(false);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "5px 14px 5px 10px",
                borderRadius: 6,
                transition: "background 0.14s",
                cursor: checked ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => {
                if (!checked) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.32)";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
            onClick={handleCheck}
        >
            {/* Custom checkbox */}
            <div style={{
                flexShrink: 0,
                marginTop: 2,
                width: 16,
                height: 16,
                borderRadius: 4,
                border: checked
                    ? `2px solid ${accentColor}`
                    : "2px solid rgba(0,0,0,0.30)",
                background: checked ? accentColor : "rgba(255,255,255,0.60)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.18s ease",
                boxShadow: error ? "0 0 0 2px rgba(220,38,38,0.50)" : "none",
            }}>
                {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {loading && !checked && (
                    <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        border: "1.5px solid rgba(0,0,0,0.30)",
                        borderTopColor: "transparent",
                        animation: "spin 0.6s linear infinite",
                    }} />
                )}
            </div>

            <span style={{
                flex: 1,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: checked ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.78)",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                wordBreak: "break-word",
                textDecoration: checked ? "line-through" : "none",
                transition: "color 0.22s, text-decoration 0.22s",
            }}>
                {trimmed}
            </span>

            {error && (
                <span style={{ fontSize: 10, color: "#dc2626", flexShrink: 0 }} title="Failed, click to retry">↺</span>
            )}
        </div>
    );
};

// ── Min/max dimensions ────────────────────────────────────────────────────
const MIN_W = 250;
const MAX_W = 520;
const MIN_H = 200;
const MAX_H = 600;

// ── Component ──────────────────────────────────────────────────────────────
export const StickyNote = ({
    category,
    defaultX,
    defaultY,
    layout,
    onClose,
    onAddNote,
    onFocus,
    zIndex,
    onLayoutChange,
    onCompleteItem,
    onDeleteItem,
    onEditItem,
}: Props) => {
    const CARD_W_DEFAULT = 290;
    const CARD_H_DEFAULT = 300;

    const [pos, setPos] = useState({
        x: layout?.x ?? defaultX,
        y: layout?.y ?? defaultY,
    });
    const [size, setSize] = useState({
        w: layout?.width ?? CARD_W_DEFAULT,
        h: layout?.height ?? CARD_H_DEFAULT,
    });
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [inputVal, setInputVal] = useState("");
    const [adding, setAdding] = useState(false);
    const [mounted, setMounted] = useState(false);

    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
    const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [menuOpenId, setMenuOpenId] = useState<any>(null);
    const [editingId, setEditingId] = useState<any>(null);
    const [editValue, setEditValue] = useState("");

    // Entrance animation
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 30);
        return () => clearTimeout(t);
    }, []);

    // Debounced layout persistence
    const persistLayout = useCallback((x: number, y: number, w: number, h: number) => {
        if (!onLayoutChange) return;
        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(() => {
            onLayoutChange(category.category_id, { x, y, width: w, height: h });
        }, 300);
    }, [category.category_id, onLayoutChange]);

    // ── Clamp position ────────────────────────────────────────────────────
    const clampPos = useCallback((x: number, y: number, w = size.w) => {
        const maxX = window.innerWidth - w - 8;
        const maxY = window.innerHeight - MIN_H - 8;
        return {
            x: Math.max(8, Math.min(x, maxX)),
            y: Math.max(8, Math.min(y, maxY)),
        };
    }, [size.w]);

    // ── Drag ──────────────────────────────────────────────────────────────
    const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
        setDragging(true);
        onFocus();
    }, [pos, onFocus]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (dragging && dragRef.current) {
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            const newPos = clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy);
            setPos(newPos);
        }
        if (resizing && resizeRef.current) {
            const dx = e.clientX - resizeRef.current.startX;
            const dy = e.clientY - resizeRef.current.startY;
            const newW = Math.max(MIN_W, Math.min(MAX_W, resizeRef.current.origW + dx));
            const newH = Math.max(MIN_H, Math.min(MAX_H, resizeRef.current.origH + dy));
            setSize({ w: newW, h: newH });
        }
    }, [dragging, resizing, clampPos]);

    const handlePointerUp = useCallback(() => {
        if (dragging) {
            setDragging(false);
            dragRef.current = null;
            persistLayout(pos.x, pos.y, size.w, size.h);
        }
        if (resizing) {
            setResizing(false);
            resizeRef.current = null;
            persistLayout(pos.x, pos.y, size.w, size.h);
        }
    }, [dragging, resizing, pos, size, persistLayout]);

    // ── Resize handle ─────────────────────────────────────────────────────
    const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h };
        setResizing(true);
        onFocus();
    }, [size, onFocus]);

    // ── Add note ──────────────────────────────────────────────────────────
    const commitAdd = async () => {
        const v = inputVal.trim();
        if (!v || adding) return;
        setAdding(true);
        try {
            await onAddNote?.(category.category_id, v);
            setInputVal("");
        } finally {
            setAdding(false);
        }
    };

    // ── Colours ───────────────────────────────────────────────────────────
    const bg = category.category_color || "#FFF176";
    const header = darkenHex(bg, 0.12);
    const accent = darkenHex(bg, 0.35);

    // Notes list area height = total height - header(44) - input row(58) - resize(14) - border gaps
    const notesAreaH = Math.max(60, size.h - 44 - 58 - 14 - 6);
    const IconMenu = () => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle cx="12" cy="5" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
    );

    const menuBtnStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 14px",
        border: "none",
        background: "#fff",
        textAlign: "left",
        cursor: "pointer",
        fontSize: 13,
    };
    return (
        <>
            {/* Keyframe for spinner */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerDown={onFocus}
                style={{
                    position: "fixed",
                    left: pos.x,
                    top: pos.y,
                    width: size.w,
                    height: size.h,
                    zIndex: (dragging || resizing) ? Z_DRAGGING : Z_BASE + zIndex,
                    userSelect: "none",
                    willChange: "transform, box-shadow",
                    opacity: mounted ? 1 : 0,
                    transform: dragging
                        ? "scale(1.025) rotate(0.8deg)"
                        : "scale(1) rotate(0deg)",
                    transition: (dragging || resizing)
                        ? "box-shadow 0.12s ease, transform 0.12s ease"
                        : "box-shadow 0.25s ease, transform 0.22s ease, opacity 0.28s ease",
                    boxShadow: (dragging || resizing)
                        ? "0 32px 72px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.22)"
                        : "0 10px 36px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: bg,
                    border: "1px solid rgba(0,0,0,0.10)",
                    cursor: dragging ? "grabbing" : "default",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* ── HEADER ─────────────────────────────────────────────── */}
                <div
                    onPointerDown={handleHeaderPointerDown}
                    style={{
                        flexShrink: 0,
                        background: header,
                        cursor: dragging ? "grabbing" : "grab",
                        padding: "10px 12px 10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid rgba(0,0,0,0.10)",
                        gap: 8,
                    }}
                >
                    <span style={{ color: "rgba(0,0,0,0.35)", flexShrink: 0, marginRight: 4 }}>
                        <IconDots />
                    </span>
                    <span style={{
                        flex: 1,
                        fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "rgba(0,0,0,0.80)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "-0.01em",
                    }}>
                        {category.category_name}
                    </span>
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => onClose(category.category_id)}
                        title="Close"
                        style={{
                            flexShrink: 0,
                            width: 26, height: 26, borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.10)",
                            color: "rgba(0,0,0,0.60)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.20)";
                            (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,0,0,0.85)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.10)";
                            (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,0,0,0.60)";
                        }}
                    >
                        <IconClose />
                    </button>
                </div>

                {/* ── ADD NOTE ───────────────────────────────────────────── */}
                <div
                    onPointerDown={e => e.stopPropagation()}
                    style={{
                        flexShrink: 0,
                        padding: "10px 12px",
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.35)",
                        display: "flex", alignItems: "center", gap: 8,
                    }}
                >
                    <input
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && commitAdd()}
                        placeholder="Add a note…"
                        style={{
                            flex: 1, height: 36, borderRadius: 9,
                            border: "1.5px solid rgba(0,0,0,0.18)",
                            padding: "0 12px", fontSize: 13,
                            fontFamily: "'Segoe UI', system-ui, sans-serif",
                            background: "rgba(255,255,255,0.85)",
                            outline: "none", color: "#1a1a1a",
                            transition: "border-color 0.18s, box-shadow 0.18s",
                        }}
                        onFocus={e => {
                            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.40)";
                            (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(0,0,0,0.07)";
                        }}
                        onBlur={e => {
                            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.18)";
                            (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
                        }}
                    />

                    <button
                        onClick={commitAdd}
                        disabled={adding}
                        title="Add note"
                        style={{
                            flexShrink: 0, width: 36, height: 36, borderRadius: 9,
                            border: "none",
                            background: adding ? "rgba(0,0,0,0.40)" : "rgba(0,0,0,0.75)",
                            color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: adding ? "not-allowed" : "pointer",
                            transition: "background 0.15s, transform 0.12s",
                        }}
                        onMouseEnter={e => {
                            if (!adding) {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.90)";
                                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.07)";
                            }
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = adding ? "rgba(0,0,0,0.40)" : "rgba(0,0,0,0.75)";
                            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                        }}
                    >
                        {adding ? (
                            <div style={{
                                width: 14, height: 14, borderRadius: "50%",
                                border: "2px solid rgba(255,255,255,0.4)",
                                borderTopColor: "#fff",
                                animation: "spin 0.6s linear infinite",
                            }} />
                        ) : <IconPlus />}
                    </button>
                </div>

                {/* ── NOTES LIST ─────────────────────────────────────────── */}
                <div
                    onPointerDown={e => e.stopPropagation()}
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "hidden",
                        background: "rgba(255,255,255,0.15)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(0,0,0,0.20) transparent",
                        minHeight: 0,
                    }}
                >
                    {category.notes && category.notes.length > 0 ? (
                        category.notes.map((note, i) => {
                            const lines = note.content.split("\n").filter(l => l.trim());
                            return (
                                <div
                                    key={note.id ?? i}
                                    style={{
                                        borderBottom: "1px solid rgba(0,0,0,0.07)",
                                        padding: "8px 0",
                                    }}
                                >

                                    {/* ───────────────────────── */}
                                    {/* EDIT MODE */}
                                    {/* ───────────────────────── */}

                                    {editingId === note.id ? (

                                        <div
                                            style={{
                                                padding: 10,
                                            }}
                                        >

                                            <textarea
                                                value={editValue}
                                                onChange={(e) =>
                                                    setEditValue(e.target.value)
                                                }
                                                style={{
                                                    width: "100%",
                                                    minHeight: 70,
                                                    borderRadius: 8,
                                                    padding: 10,
                                                    border: "1px solid #ccc",
                                                    resize: "vertical",
                                                }}
                                            />

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    marginTop: 8,
                                                }}
                                            >

                                                <button
                                                    onClick={async () => {

                                                        await onEditItem?.(
                                                            note.id,
                                                            editValue
                                                        );

                                                        setEditingId(null);

                                                    }}
                                                    style={{
                                                        background: "#16a34a",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        padding: "6px 14px",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                                    }}
                                                >
                                                    Save
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                    }}
                                                    style={{
                                                        background: "#dc2626",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        padding: "6px 14px",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        marginLeft: "8px",
                                                        transition: "all 0.2s ease",
                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>

                                        </div>

                                    ) : (

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                gap: 8,
                                                paddingRight: 8,
                                            }}
                                        >

                                            {/* LEFT CONTENT */}
                                            <div style={{ flex: 1 }}>

                                                <CheckLine
                                                    line={note.content}
                                                    noteId={note.id}
                                                    accentColor={accent}
                                                    onComplete={async (
                                                        noteId,
                                                        lineContent
                                                    ) => {

                                                        if (onCompleteItem) {

                                                            await onCompleteItem(
                                                                noteId,
                                                                lineContent
                                                            );
                                                        }
                                                    }}
                                                />

                                            </div>

                                            {/* RIGHT MENU */}
                                            <div
                                                style={{
                                                    position: "relative",
                                                }}
                                            >

                                                <button
                                                    onClick={() => {

                                                        setMenuOpenId(
                                                            menuOpenId === note.id
                                                                ? null
                                                                : note.id
                                                        );

                                                    }}
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                        cursor: "pointer",
                                                        color: "rgba(0,0,0,0.60)",
                                                        paddingTop: 6,
                                                    }}
                                                >
                                                    ⋮
                                                </button>

                                                {menuOpenId === note.id && (

                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            top: 24,
                                                            right: 0,
                                                            background: "#fff",
                                                            borderRadius: 8,
                                                            boxShadow:
                                                                "0 4px 14px rgba(0,0,0,0.18)",
                                                            overflow: "hidden",
                                                            zIndex: 9999,
                                                            minWidth: 120,
                                                        }}
                                                    >

                                                        <button
                                                            onClick={() => {

                                                                setEditingId(note.id);

                                                                setEditValue(
                                                                    note.content
                                                                );

                                                                setMenuOpenId(null);

                                                            }}
                                                            style={menuBtnStyle}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={async () => {

                                                                await onDeleteItem?.(
                                                                    note.id
                                                                );

                                                                setMenuOpenId(null);

                                                            }}
                                                            style={menuBtnStyle}
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    )}

                                </div>
                            );
                        })
                    ) : (
                        <div style={{
                            padding: "28px 16px",
                            textAlign: "center",
                            color: "rgba(0,0,0,0.38)",
                            fontSize: 12,
                            fontFamily: "'Segoe UI', system-ui, sans-serif",
                            fontStyle: "italic",
                        }}>
                            No notes yet
                        </div>
                    )}
                </div>

                {/* ── RESIZE HANDLE ──────────────────────────────────────── */}
                <div
                    onPointerDown={handleResizePointerDown}
                    style={{
                        flexShrink: 0,
                        height: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: 8,
                        background: "rgba(0,0,0,0.04)",
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        cursor: resizing ? "nwse-resize" : "se-resize",
                    }}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M9 1L1 9M9 5L5 9M9 9" stroke="rgba(0,0,0,0.30)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            </div>
        </>
    );
};
