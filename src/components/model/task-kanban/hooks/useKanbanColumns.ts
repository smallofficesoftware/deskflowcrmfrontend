import { useQuery } from "@tanstack/react-query";
import { BoardColumn, BoardType } from "../types/kanban.types";
import { fetchBoardColumns } from "../api/kanbanApi";

export const useKanbanColumns = (boardType: BoardType) => {
  return useQuery<BoardColumn[], Error>({
    queryKey: ["kanban-columns", boardType],
    queryFn: () => fetchBoardColumns(boardType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};
