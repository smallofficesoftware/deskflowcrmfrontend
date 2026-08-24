import { DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { KanbanBoardConfig, KanbanItem } from "../types";
import { kanbanItemsQueryKey, KanbanItemsInfiniteData } from "./useKanbanItems";

interface UseKanbanDragOptions<T extends KanbanItem> {
  config: KanbanBoardConfig<T>;
  searchTerm: string;
  onError?: (message: string) => void;
}

// Computes a new `position` for an item dropped at `destIndex` among
// `neighbors` (the destination column's items with the dragged item already
// removed, if it was already in that column). Uses the midpoint between the
// two neighboring positions so most drops don't require touching any other
// row. Gaps started at 1000 (see the backend backfill), so this comfortably
// survives many inserts into the same slot before a collision; on collision
// it falls back to `before + 1`, which stays correct but narrows the gap for
// a future insert in that exact spot — full-column renumbering on collision
// is a documented follow-up, not implemented here (rare in practice).
const computeNewPosition = <T extends KanbanItem>(
  neighbors: T[],
  destIndex: number,
  itemPosition: (item: T) => number | null | undefined,
): number => {
  const before = destIndex > 0 ? itemPosition(neighbors[destIndex - 1]) : null;
  const after =
    destIndex < neighbors.length ? itemPosition(neighbors[destIndex]) : null;

  if (before == null && after == null) return 1000;
  if (before == null) return (after as number) - 1000;
  if (after == null) return before + 1000;

  const mid = Math.floor((before + after) / 2);
  return mid > before ? mid : before + 1;
};

export const useKanbanDrag = <T extends KanbanItem>({
  config,
  searchTerm,
  onError,
}: UseKanbanDragOptions<T>) => {
  const queryClient = useQueryClient();
  const snapshotRef = useRef<{
    sourceColumnId: string;
    destColumnId: string;
    item: T;
    sourceIndex: number;
    destIndex: number;
  } | null>(null);

  const getQueryKey = (columnId: string) =>
    kanbanItemsQueryKey(config.boardKey, columnId, searchTerm);

  const getColumnData = (columnId: string) =>
    queryClient.getQueryData<KanbanItemsInfiniteData<T>>(
      getQueryKey(columnId),
    );

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;

      const sourceData = getColumnData(sourceColumnId);
      if (!sourceData) return;
      const sourceItems = sourceData.pages.flatMap((p) => p.items);
      const item = sourceItems.find((i) => String(i.id) === draggableId);
      if (!item) return;

      snapshotRef.current = {
        sourceColumnId,
        destColumnId,
        item,
        sourceIndex: source.index,
        destIndex: destination.index,
      };

      // Neighbors in the destination column, dragged item excluded — used to
      // compute the new position before we know the API's response.
      const destData = getColumnData(destColumnId);
      const destItemsExcludingDragged = (
        destData?.pages.flatMap((p) => p.items) ?? []
      ).filter((i) => String(i.id) !== draggableId);
      const newPosition = computeNewPosition(
        destItemsExcludingDragged,
        destination.index,
        config.itemPosition,
      );

      // ─── Optimistic update ─────────────────────────────────────────────
      if (sourceColumnId !== destColumnId) {
        queryClient.setQueryData<KanbanItemsInfiniteData<T>>(
          getQueryKey(sourceColumnId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((i) => String(i.id) !== draggableId),
                total: page.total - 1,
              })),
            };
          },
        );

        queryClient.setQueryData<KanbanItemsInfiniteData<T>>(
          getQueryKey(destColumnId),
          (old) => {
            if (!old) return old;
            const pages = old.pages.map((page, pageIdx) => {
              if (pageIdx !== 0) return page;
              const items = [...page.items];
              items.splice(destination.index, 0, item);
              return { ...page, items, total: page.total + 1 };
            });
            return { ...old, pages };
          },
        );
      } else {
        queryClient.setQueryData<KanbanItemsInfiniteData<T>>(
          getQueryKey(sourceColumnId),
          (old) => {
            if (!old) return old;
            const pages = old.pages.map((page, pageIdx) => {
              if (pageIdx !== 0) return page;
              const items = [...page.items];
              const [moved] = items.splice(source.index, 1);
              items.splice(destination.index, 0, moved);
              return { ...page, items };
            });
            return { ...old, pages };
          },
        );
      }

      // ─── Persist ────────────────────────────────────────────────────────
      try {
        await config.updateItemPosition(item.id, destColumnId, newPosition);
        snapshotRef.current = null;
      } catch {
        const snap = snapshotRef.current;
        if (!snap) return;

        queryClient.setQueryData<KanbanItemsInfiniteData<T>>(
          getQueryKey(snap.sourceColumnId),
          (old) => {
            if (!old) return old;
            const pages = old.pages.map((page, pageIdx) => {
              if (pageIdx !== 0) return page;
              const items = [...page.items];
              items.splice(snap.sourceIndex, 0, snap.item);
              return { ...page, items, total: page.total + 1 };
            });
            return { ...old, pages };
          },
        );

        if (snap.sourceColumnId !== snap.destColumnId) {
          queryClient.setQueryData<KanbanItemsInfiniteData<T>>(
            getQueryKey(snap.destColumnId),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.filter(
                    (i) => String(i.id) !== draggableId,
                  ),
                  total: page.total - 1,
                })),
              };
            },
          );
        }

        onError?.("Failed to move card. Changes reverted.");
        snapshotRef.current = null;
      }
    },
    [config, queryClient, searchTerm, onError],
  );

  return { onDragEnd };
};
