import { ReactNode } from "react";

export interface KanbanItem {
  id: number | string;
}

export interface KanbanColumnDef {
  id: number | string;
  name: string;
  color?: string;
  unreadCount?: number;
}

export interface KanbanFetchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface KanbanFetchParams {
  columnId: KanbanColumnDef["id"];
  page: number;
  limit: number;
  searchTerm: string;
}

export interface KanbanSortOption<T> {
  label: string;
  compare: (a: T, b: T) => number;
}

/**
 * Everything a Kanban board needs to know about one entity type (tasks,
 * contacts, ...). The board/column/card/drag mechanics are all generic —
 * only this config differs per consumer.
 */
export interface KanbanBoardConfig<T extends KanbanItem> {
  // Unique per board — used as the localStorage key for column
  // visibility/order/sort preferences, so boards don't clobber each other.
  boardKey: string;
  fetchColumns: () => Promise<KanbanColumnDef[]>;
  fetchItems: (params: KanbanFetchParams) => Promise<KanbanFetchResult<T>>;
  // Persisted drag order, read back from the item (backend `position` field).
  // Falls back to array order (steps of 1000) for items that predate it.
  itemPosition: (item: T) => number | null | undefined;
  updateItemPosition: (
    itemId: T["id"],
    columnId: KanbanColumnDef["id"],
    position: number,
  ) => Promise<void>;
  renderCard: (item: T) => ReactNode;
  pageSize?: number; // default 30, matches the task board's proven page size
  sortOptions?: KanbanSortOption<T>[]; // "Manual" (drag order) is always the implicit first option
  // Aggregate shown in the column header next to the count — computed over
  // whatever pages are currently loaded for that column, so it's exact once
  // a column is fully scrolled through and an approximation before that.
  columnSummary?: (items: T[]) => string;
  wipLimitOf?: (column: KanbanColumnDef) => number | undefined;
  emptyStateLabel?: string;
}
