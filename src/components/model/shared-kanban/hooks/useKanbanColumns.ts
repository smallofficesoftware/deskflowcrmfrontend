import { useQuery } from "@tanstack/react-query";
import { KanbanBoardConfig, KanbanColumnDef, KanbanItem } from "../types";

export const useKanbanColumns = <T extends KanbanItem>(
  config: KanbanBoardConfig<T>,
) => {
  return useQuery<KanbanColumnDef[], Error>({
    queryKey: ["shared-kanban-columns", config.boardKey],
    queryFn: config.fetchColumns,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};
