import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./ContactKanban.css";
import { CardProps } from "./contactType";

export function ContactKanbenCard({ card, onView }: CardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });

    const labels = card.label_name
        .split(",")
        .filter(Boolean)
        .map((name: string, i: number) => ({
            name: name.trim(),
            color: card.label_color.split(",")[i]?.trim() || "#888",
        }));

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`kanban-card ${isDragging ? "dragging" : ""}`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            {/* <div className="d-flex justify-content-between align-items-start">
                <p className="fw-bold mb-1">#{card.id}</p>
                <div
                    style={{ cursor: "pointer", color: "#666" }}
                    title="View"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView?.(card.id);
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18px"
                        viewBox="0 -960 960 960"
                        width="18px"
                        fill="currentColor"
                    >
                        <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
                    </svg>
                </div>
            </div> */}

            <h6 className="mb-1">{card.person_name}</h6>
            <p className="small text-muted mb-1">{card.mobile_number}</p>

            {(card.company_name || card.client_code) && (
                <p className="small mb-1">
                    {card.company_name} {card.client_code && `(${card.client_code})`}
                </p>
            )}

            {card.teamMemberName && (
                <p className="small text-secondary mb-2">{card.teamMemberName}</p>
            )}

            {/* Labels */}
            {labels.length > 0 && (
                <div className="d-flex flex-wrap gap-1 mb-2">
                    {labels.map((label, i) => (
                        <span
                            key={i}
                            className="badge text-white"
                            style={{
                                backgroundColor: label.color,
                                fontSize: "0.7rem",
                            }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}
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

export default ContactKanbenCard;