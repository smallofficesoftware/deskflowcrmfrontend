import { useSortable } from "@dnd-kit/sortable";
import { CardProps } from "./types";
import { CSS } from "@dnd-kit/utilities";
import './KanbanBoard.css';

export function KanbanCardItem({ card, onView }: CardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });
    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`kanban-card ${isDragging ? "dragging" : ""}`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                border: `1px solid gray`,
            }}
        >
            <p className="fw-bold">#{card.id}</p>
            <p className="mt-1">{card.title}</p>
            <div className="d-flex align-items-center justify-content-end">
                <div style={{ color: "gray", cursor: "pointer" }} title="View" onClick={(e) => {
                    e.stopPropagation();
                    onView?.(card.id);
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="currentColor"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
                </div>
            </div>
        </div>
    );
}

export default KanbanCardItem;