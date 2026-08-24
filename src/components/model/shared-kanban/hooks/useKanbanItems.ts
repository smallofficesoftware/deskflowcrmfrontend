import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useCallback } from "react";
import {
  KanbanBoardConfig,
  KanbanColumnDef,
  KanbanFetchResult,
  KanbanItem,
} from "../types";

const DEFAULT_PAGE_SIZE = 30;

export const kanbanItemsQueryKey = (
  boardKey: string,
  columnId: KanbanColumnDef["id"],
  searchTerm: string,
) => ["shared-kanban-items", boardKey, columnId, searchTerm];

export const useKanbanItems = <T extends KanbanItem>(
  config: KanbanBoardConfig<T>,
  columnId: KanbanColumnDef["id"],
  searchTerm: string,
) => {
  const queryClient = useQueryClient();
  const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
  const queryKey = kanbanItemsQueryKey(config.boardKey, columnId, searchTerm);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      config.fetchItems({
        columnId,
        page: pageParam as number,
        limit: pageSize,
        searchTerm,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const items: T[] = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total: number = query.data?.pages[0]?.total ?? 0;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, config.boardKey, columnId, searchTerm]);

  return {
    items,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isError: query.isError,
    error: query.error,
    loadMore,
    refresh,
  };
};

export type KanbanItemsInfiniteData<T> = InfiniteData<
  KanbanFetchResult<T>,
  number
>;
