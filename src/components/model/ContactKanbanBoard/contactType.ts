export interface ContactCardActions {
    /** raw = the full contact API object (needed to prefill the edit form) */
    onEdit?: (contact: { id: number; raw: any }) => void;
    onPin?: (id: number) => void;
    onUnpin?: (id: number) => void;
    onMarkRead?: (id: number) => void;
    onMarkUnread?: (id: number) => void;
    onArchive?: (id: number) => void;
    onUnarchive?: (id: number) => void;
    onAssignLabel?: (id: number) => void;
    onAssignStatus?: (id: number, currentStatus?: number) => void;
    onAssignTeamMember?: (id: number) => void;
    onStartWorkflow?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export interface KanbanBoardModal extends ContactCardActions {
    show: boolean;
    handleclose: () => void;
    supportTicketFlag: number;
}
