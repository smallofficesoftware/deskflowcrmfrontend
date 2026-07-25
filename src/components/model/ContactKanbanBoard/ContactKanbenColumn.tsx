import { useDroppable } from "@dnd-kit/core";
import { ColumnProps } from "./contactType";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ContactKanbenCard from "./ContactKanbenCard";

function KanbanColumn({ column, cards, onView }: ColumnProps) {
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div ref={setNodeRef} className="kanban-column">
            <div className="kanban-column-header">
                <span
                    className="py-1 px-2 text-white"
                    style={{ backgroundColor: column.color, borderRadius: "10px" }}
                >
                    {column.title}
                </span>
                <span className="badge bg-secondary ms-2">{cards.length}</span>
            </div>

            <SortableContext
                items={cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {cards.map((card) => (
                    <ContactKanbenCard key={card.id} card={card} onView={onView} />
                ))}
            </SortableContext>

            {cards.length === 0 && (
                <div className="kanban-empty">Drop Contact here</div>
            )}
        </div>
    );
}

export default KanbanColumn;