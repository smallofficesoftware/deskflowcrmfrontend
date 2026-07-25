export type Id = string;


export interface KanbanCard {
    id: Id;
    title: string;
    description?: string;
    assignee?: string;
    priority?: number;
    color?: string | any;
}

export interface Column {
    id: Id;
    title: string;
    cardIds: Id[];
    color?: string;
}

export interface KanbanBoardModal {
    show: boolean;
    handleclose: () => void;
    kanbanViewTitle: string;
    supportTicketFlag: number;
    contact_id?: number | null;

}

export interface CardProps {
    card: KanbanCard;
    onView?: (cardId: string) => void;
}

export interface ColumnProps {
    column: Column;
    cards: KanbanCard[];
    onView: (cardId: string) => void;
}