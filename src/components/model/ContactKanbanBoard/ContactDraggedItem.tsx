import { CardProps } from "./contactType";
import './ContactKanban.css';

function DraggedItem({ card }: CardProps) {
    return <div className="kanban-card" style={{ border: `1px solid gray` }}>
        {/* <p className="fw-bold">#{card.id}</p> */}
        <p className="mt-1">{card.person_name} -  {card.company_name}</p>
        <p className="mt-1">{card.mobile_number}</p>
    </div>
}
export default DraggedItem;