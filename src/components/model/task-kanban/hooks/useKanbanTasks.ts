import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { BoardType, Task } from "../types/kanban.types";
import { getTaskList, GetTaskListResponse } from "../api/kanbanApi";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";

type KanbanInfiniteData = InfiniteData<GetTaskListResponse, number>;

const PAGE_LIMIT = 30;

export const useKanbanTasks = (
  boardType: BoardType,
  columnId: number,
  searchTerm: string,
  filterParams?: FilterParams | null,
  supportTicketFlag?: number | null,
) => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    // Feature 5: filterParams in query key → any filter change triggers fresh fetch
    queryKey: [
      "kanban-tasks",
      boardType,
      columnId,
      searchTerm,
      filterParams ?? null,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getTaskList({
        page: pageParam as number,
        limit: PAGE_LIMIT,
        search: searchTerm,
        columnId,
        boardType,
        filterParams: filterParams ?? null,
        supportTicketFlag,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const tasks: Task[] = query.data?.pages.flatMap((p) => p.tasks) ?? [];
  const total: number = query.data?.pages[0]?.total ?? 0;
  // Feature 1: unread count for this column from first page response
  const columnUnreadCount: number =
    query.data?.pages[0]?.unread_count ??
    tasks.filter((t) => (t.unread_count ?? 0) > 0).length;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [
        "kanban-tasks",
        boardType,
        columnId,
        searchTerm,
        filterParams ?? null,
      ],
    });
  }, [queryClient, boardType, columnId, searchTerm, filterParams]);

  const removeTask = useCallback(
    (taskId: number) => {
      queryClient.setQueryData<KanbanInfiniteData>(
        ["kanban-tasks", boardType, columnId, searchTerm, filterParams ?? null],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              tasks: page.tasks.filter((t) => t.task_id !== taskId),
              total: page.total - 1,
            })),
          };
        },
      );
    },
    [queryClient, boardType, columnId, searchTerm, filterParams],
  );

  const addTask = useCallback(
    (task: Task, atIndex?: number) => {
      queryClient.setQueryData<KanbanInfiniteData>(
        ["kanban-tasks", boardType, columnId, searchTerm, filterParams ?? null],
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          const firstPage = { ...pages[0] };
          const tasks = [...firstPage.tasks];
          if (atIndex !== undefined) tasks.splice(atIndex, 0, task);
          else tasks.unshift(task);
          pages[0] = { ...firstPage, tasks, total: firstPage.total + 1 };
          return { ...old, pages };
        },
      );
    },
    [queryClient, boardType, columnId, searchTerm, filterParams],
  );

  return {
    tasks,
    total,
    columnUnreadCount,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isError: query.isError,
    error: query.error,
    loadMore,
    refresh,
    removeTask,
    addTask,
  };
};
