import { DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { FilterParams } from "../../../../pages/left-side/header/Setting/taskList/TaskListView";
import { updateTaskColumn } from "../api/kanbanApi";
import { BoardType, Task } from "../types/kanban.types";

interface UseTaskDragOptions {
  boardType: BoardType;
  searchTerm: string;
  filterParams?: FilterParams | null;
  onError?: (message: string) => void;
}

export const useTaskDrag = ({
  boardType,
  searchTerm,
  filterParams,
  onError,
}: UseTaskDragOptions) => {
  const queryClient = useQueryClient();
  // Store snapshot for rollback
  const snapshotRef = useRef<{
    sourceColumnId: number;
    destColumnId: number;
    task: Task;
    sourceIndex: number;
    destIndex: number;
  } | null>(null);

  const getQueryKey = (columnId: number) => [
    "kanban-tasks",
    boardType,
    columnId,
    searchTerm,
    filterParams ?? null,
  ];

  const getColumnData = (columnId: number) => {
    return queryClient.getQueryData<{
      pages: { tasks: Task[]; total: number }[];
    }>(getQueryKey(columnId));
  };

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const sourceColumnId = parseInt(source.droppableId);
      const destColumnId = parseInt(destination.droppableId);
      const taskId = parseInt(draggableId);

      // Get the task being dragged
      const sourceData = getColumnData(sourceColumnId);
      if (!sourceData) return;
      const sourceTasks = sourceData.pages.flatMap((p) => p.tasks);
      const task = sourceTasks.find((t) => t.task_id === taskId);
      if (!task) return;

      // Save snapshot for rollback
      snapshotRef.current = {
        sourceColumnId,
        destColumnId,
        task,
        sourceIndex: source.index,
        destIndex: destination.index,
      };

      // ─── Optimistic Update ─────────────────────────────────────────────────
      if (sourceColumnId !== destColumnId) {
        // Remove from source
        queryClient.setQueryData(
          getQueryKey(sourceColumnId),
          (old: typeof sourceData) => {
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

        // Add to destination at correct index
        const updatedTask = { ...task, status_id: destColumnId };
        queryClient.setQueryData(
          getQueryKey(destColumnId),
          (old: typeof sourceData) => {
            if (!old) return old;
            const pages = old.pages.map((page, pageIdx) => {
              if (pageIdx === 0) {
                const tasks = [...page.tasks];
                tasks.splice(destination.index, 0, updatedTask);
                return { ...page, tasks, total: page.total + 1 };
              }
              return page;
            });
            return { ...old, pages };
          },
        );
      } else {
        // Same column reorder
        queryClient.setQueryData(
          getQueryKey(sourceColumnId),
          (old: typeof sourceData) => {
            if (!old) return old;
            const pages = old.pages.map((page, pageIdx) => {
              if (pageIdx === 0) {
                const tasks = [...page.tasks];
                const [moved] = tasks.splice(source.index, 1);
                tasks.splice(destination.index, 0, moved);
                return { ...page, tasks };
              }
              return page;
            });
            return { ...old, pages };
          },
        );
      }

      // ─── API Call ──────────────────────────────────────────────────────────
      try {
        await updateTaskColumn(boardType, taskId, destColumnId);
        snapshotRef.current = null;
      } catch {
        // ─── Rollback ──────────────────────────────────────────────────────
        const snap = snapshotRef.current;
        if (!snap) return;

        // Restore source column
        queryClient.setQueryData(
          getQueryKey(snap.sourceColumnId),
          (old: typeof sourceData) => {
            if (!old) return old;
            const pages = old.pages.map((page, pageIdx) => {
              if (pageIdx === 0) {
                const tasks = [...page.tasks];
                tasks.splice(snap.sourceIndex, 0, snap.task);
                return { ...page, tasks, total: page.total + 1 };
              }
              return page;
            });
            return { ...old, pages };
          },
        );

        // Remove from destination
        if (snap.sourceColumnId !== snap.destColumnId) {
          queryClient.setQueryData(
            getQueryKey(snap.destColumnId),
            (old: typeof sourceData) => {
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
        }

        onError?.("Failed to update task status. Changes reverted.");
        snapshotRef.current = null;
      }
    },
    [boardType, queryClient, searchTerm, onError],
  );

  return { onDragEnd };
};
