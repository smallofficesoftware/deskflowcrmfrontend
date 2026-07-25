// =============================
// StickyNotesPanel.tsx  (Enhanced)
// =============================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardLayout, StickyNote } from "./StickyNote";

// ── Z-index ────────────────────────────────────────────────────────────────
const Z_CLOSE_BTN = 2_147_483_647;

// ── Card geometry ──────────────────────────────────────────────────────────
const CARD_W = 290;
const CARD_H_APPROX = 300;

// ── Persistence key ────────────────────────────────────────────────────────
const STORAGE_KEY = "sticky_notes_panel_state";

interface PersistedState {
    visibleIds: any[];
    layouts: Record<string, CardLayout>;
    order: any[];
}

function loadPersistedState(): Partial<PersistedState> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as PersistedState;
    } catch {
        return {};
    }
}

function savePersistedState(state: PersistedState): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // storage quota exceeded — fail silently
    }
}

// ── Scatter algorithm ──────────────────────────────────────────────────────
function computeScatteredPositions(count: number): Array<{ x: number; y: number }> {
    if (count === 0) return [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padX = 40;
    const padY = 48;
    const safeW = vw - padX * 2 - CARD_W;
    const safeH = vh - padY * 2 - CARD_H_APPROX;
    const cols = Math.max(1, Math.floor(safeW / (CARD_W + 24)));
    const rows = Math.ceil(count / cols);
    const cellW = safeW / cols;
    const cellH = Math.min(safeH / rows, CARD_H_APPROX + 40);
    const jitterX = [18, -22, 34, -10, 26, -38, 14, -28, 40, -6, 30, -20];
    const jitterY = [12, -16, 28, -8, 20, -30, 10, -22, 36, -4, 24, -14];

    return Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const baseX = padX + col * cellW + cellW / 2 - CARD_W / 2;
        const baseY = padY + row * cellH;
        const jx = jitterX[i % jitterX.length];
        const jy = jitterY[i % jitterY.length];
        return {
            x: Math.max(padX, Math.min(vw - CARD_W - padX, baseX + jx)),
            y: Math.max(padY, Math.min(vh - CARD_H_APPROX - 8, baseY + jy)),
        };
    });
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Category {
    category_id: any;
    category_name: string;
    category_color: string;
    notes?: Array<{ id: any; content: string }>;
}

interface Props {
    notesData: Category[];

    onClose: () => void;

    onAddNote?: (
        categoryId: any,
        content: string
    ) => Promise<void>;

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

// ── Component ──────────────────────────────────────────────────────────────
export const StickyNotesPanel = ({
    notesData,
    onClose,
    onAddNote,
    onCompleteItem,
    onDeleteItem,
    onEditItem
}: Props) => {
    const persisted = useRef(loadPersistedState()).current;

    // ── Visible set ───────────────────────────────────────────────────────
    const [visibleIds, setVisibleIds] = useState<Set<any>>(
        () => {
            if (persisted.visibleIds && persisted.visibleIds.length > 0) {
                return new Set(persisted.visibleIds);
            }
            return new Set(notesData.map(c => c.category_id));
        }
    );

    // ── Z-index stacking order ────────────────────────────────────────────
    const [order, setOrder] = useState<any[]>(
        () => persisted.order ?? notesData.map(c => c.category_id)
    );

    // ── Per-card layouts (position + size) ───────────────────────────────
    const [layouts, setLayouts] = useState<Record<string, CardLayout>>(
        () => persisted.layouts ?? {}
    );

    // Sync new categories into order if notesData changes
    useEffect(() => {
        setOrder(prev => {
            const existing = new Set(prev);
            const newIds = notesData
                .map(c => c.category_id)
                .filter(id => !existing.has(id));
            if (newIds.length === 0) return prev;
            return [...prev, ...newIds];
        });
    }, [notesData]);

    // Persist to sessionStorage whenever state changes
    useEffect(() => {
        savePersistedState({
            visibleIds: Array.from(visibleIds),
            layouts,
            order,
        });
    }, [visibleIds, layouts, order]);

    const visible = useMemo(
        () => notesData.filter(c => visibleIds.has(c.category_id)),
        [notesData, visibleIds]
    );

    const bringToFront = useCallback((id: any) => {
        setOrder(prev => {
            if (prev[prev.length - 1] === id) return prev;
            return [...prev.filter(x => x !== id), id];
        });
    }, []);

    const zIndexFor = useCallback(
        (id: any) => order.indexOf(id),
        [order]
    );

    // ── Scatter positions (computed once on mount) ─────────────────────────
    const scatterPositions = useMemo(() => {
        const pts = computeScatteredPositions(visible.length);
        const map: Record<any, { x: number; y: number }> = {};
        visible.forEach((c, i) => { map[c.category_id] = pts[i]; });
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fallbackPos = useCallback((id: any, index: number) => {
        // Prefer persisted layout x/y
        if (layouts[id]) return { x: layouts[id].x, y: layouts[id].y };
        if (scatterPositions[id]) return scatterPositions[id];
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return {
            x: Math.min(60 + (index % 4) * 310, vw - CARD_W - 40),
            y: Math.min(60 + Math.floor(index / 4) * 180, vh - CARD_H_APPROX - 40),
        };
    }, [layouts, scatterPositions]);

    // ── Layout change ─────────────────────────────────────────────────────
    const handleLayoutChange = useCallback((id: any, layout: CardLayout) => {
        setLayouts(prev => ({ ...prev, [id]: layout }));
    }, []);

    // ── Close individual ──────────────────────────────────────────────────
    const handleClose = useCallback((id: any) => {
        setVisibleIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    // ── Close all ─────────────────────────────────────────────────────────
    const handleCloseAll = useCallback(() => {
        // Clear persisted open state
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        onClose();
    }, [onClose]);

    // ── Render ────────────────────────────────────────────────────────────
    return createPortal(
        <>
            {/* ── STICKY NOTE CARDS ─────────────────────────────────────── */}
            {visible.map((category, index) => {
                const { x, y } = fallbackPos(category.category_id, index);
                const savedLayout = layouts[category.category_id];
                return (
                    <StickyNote
                        key={category.category_id}
                        category={category}
                        defaultX={x}
                        defaultY={y}
                        layout={savedLayout}
                        onClose={handleClose}
                        onAddNote={onAddNote}
                        onFocus={() => bringToFront(category.category_id)}
                        zIndex={zIndexFor(category.category_id)}
                        onLayoutChange={handleLayoutChange}
                        onCompleteItem={onCompleteItem}
                        onDeleteItem={onDeleteItem}
                        onEditItem={onEditItem}
                    />
                );
            })}

            {/* ── CLOSE-ALL BUTTON ──────────────────────────────────────── */}
            <button
                onClick={handleCloseAll}
                title="Close all sticky notes"
                style={{
                    position: "fixed",
                    bottom: 28,
                    right: 28,
                    zIndex: Z_CLOSE_BTN,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 22px",
                    height: 50,
                    borderRadius: 25,
                    border: "none",
                    background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)",
                    color: "#fff",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    boxShadow: "0 8px 28px rgba(197,48,48,0.50), 0 2px 8px rgba(0,0,0,0.18)",
                    transition: "transform 0.14s, box-shadow 0.14s",
                    userSelect: "none",
                }}
                onMouseEnter={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.transform = "scale(1.06)";
                    b.style.boxShadow = "0 12px 36px rgba(197,48,48,0.60), 0 4px 12px rgba(0,0,0,0.22)";
                }}
                onMouseLeave={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.transform = "scale(1)";
                    b.style.boxShadow = "0 8px 28px rgba(197,48,48,0.50), 0 2px 8px rgba(0,0,0,0.18)";
                }}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L14 14M14 2L2 14" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                Close All Notes
            </button>
        </>,
        document.body
    );
};
