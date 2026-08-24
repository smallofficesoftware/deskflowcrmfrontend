export interface KanbanBoardModal {
    show: boolean;
    handleclose: () => void;
    kanbanViewTitle: string;
    supportTicketFlag: number;
    contact_id?: number | null;
}
