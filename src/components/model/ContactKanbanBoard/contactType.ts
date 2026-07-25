export type Id = string;

export interface KanbanCard {
    id: Id;
    person_name: string;
    mobile_number: string;
    company_name: string;
    client_code: string;
    stage_status_name: string;
    stage_status_color: string;
    label_name: string;         // comma-separated names
    label_color: string;        // comma-separated colors
    teamMemberName: string;
}

export interface Column {
    id: Id;
    title: string;              // stage_status_name
    cardIds: Id[];
    color: string;              // stage_status_color
}

export interface KanbanBoardModal {
    show: boolean;
    handleclose: () => void;
    supportTicketFlag: number;
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