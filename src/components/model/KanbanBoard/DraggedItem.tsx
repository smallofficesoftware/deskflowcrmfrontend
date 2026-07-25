import { CardProps } from "./types";
import './KanbanBoard.css';

function DraggedItem({ card }: CardProps) {
    return <div className="kanban-card" style={{ border: `1px solid gray` }}>
        <p className="fw-bold">#{card.id}</p>
        <p className="mt-1">{card.title}</p>
    </div>;
}
export default DraggedItem;