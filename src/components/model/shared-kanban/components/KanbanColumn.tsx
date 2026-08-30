import { DraggableProvidedDragHandleProps, Droppable } from "@hello-pangea/dnd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKanbanItems } from "../hooks/useKanbanItems";
import { KanbanBoardConfig, KanbanColumnDef, KanbanItem } from "../types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps<T extends KanbanItem> {
  column: KanbanColumnDef;
  config: KanbanBoardConfig<T>;
  searchTerm: string;
  // Attached to the header only, not the whole column — so cards inside
  // remain independently draggable/clickable while the header drags the
  // column itself to reorder it.
  headerDragHandleProps?: DraggableProvidedDragHandleProps | null;
}

const MANUAL_SORT = -1;

export function KanbanColumn<T extends KanbanItem>({
  column,
  config,
  searchTerm,
  headerDragHandleProps,
}: KanbanColumnProps<T>) {
  const { items, total, isLoading, isFetchingNextPage, hasNextPage, loadMore } =
    useKanbanItems(config, column.id, searchTerm);

  const [sortIndex, setSortIndex] = useState<number>(MANUAL_SORT);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const setupObserver = useCallback(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
          loadMore();
      },
      { threshold: 0.1, root: scrollContainerRef.current },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  useEffect(() => {
    const cleanup = setupObserver();
    return cleanup;
  }, [setupObserver]);

  // Display-only sort — doesn't touch the persisted drag order (`position`).
  // Switching back to "Manual" shows the drag-persisted order again.
  // Note: dropping a card while a non-Manual sort is active computes its new
  // position from the sorted view's neighbors, not the true manual order —
  // switch back to Manual first if you need to place a card precisely.
  const displayItems = useMemo(() => {
    if (sortIndex === MANUAL_SORT || !config.sortOptions?.[sortIndex]) {
      return items;
    }
    return [...items].sort(config.sortOptions[sortIndex].compare);
  }, [items, sortIndex, config.sortOptions]);

  const wipLimit = config.wipLimitOf?.(column);
  const overWipLimit = wipLimit != null && total > wipLimit;
  const summary = config.columnSummary?.(items);

  return (
    <div className="shared-kanban-column">
      <div className="shared-kanban-column-header" {...headerDragHandleProps}>
        <div className="shared-kanban-column-header-left">
          <span
            className="shared-kanban-color-dot"
            style={{ backgroundColor: column.color || "#6b7280" }}
          />
          <span className="shared-kanban-column-name">{column.name}</span>
        </div>
        <div className="shared-kanban-column-header-right">
          {summary && <span className="shared-kanban-summary">{summary}</span>}
          <span
            className={`shared-kanban-count-badge${overWipLimit ? " over-limit" : ""}`}
            title={
              wipLimit != null
                ? `${total} of ${wipLimit} WIP limit`
                : undefined
            }
          >
            {isLoading ? "…" : total}
            {wipLimit != null ? ` / ${wipLimit}` : ""}
          </span>
        </div>
      </div>

      {config.sortOptions && config.sortOptions.length > 0 && (
        <div className="shared-kanban-column-toolbar">
          <select
            value={sortIndex}
            onChange={(e) => setSortIndex(Number(e.target.value))}
            className="shared-kanban-sort-select"
            aria-label={`Sort ${column.name}`}
          >
            <option value={MANUAL_SORT}>Sort: Manual</option>
            {config.sortOptions.map((opt, idx) => (
              <option key={opt.label} value={idx}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="shared-kanban-column-scroll" ref={scrollContainerRef}>
        <Droppable droppableId={String(column.id)} type="KANBAN_ITEM" ignoreContainerClipping>
          {(provided, snapshot) => (
            <div
              className={`shared-kanban-droppable-area${snapshot.isDraggingOver ? " is-dragging-over" : ""}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <KanbanCardSkeleton key={`skel-${i}`} />
                ))}

              {!isLoading &&
                displayItems.map((item, index) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    index={index}
                    renderCard={config.renderCard}
                  />
                ))}

              {provided.placeholder}

              {!isLoading && displayItems.length === 0 && (
                <div className="shared-kanban-empty-state">
                  <svg
                    className="shared-kanban-empty-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 -960 960 960"
                    fill="currentColor"
                  >
                    <path d="M220-160q-24 0-42-18t-18-42v-434q0-24 18-42t42-18h520q24 0 42 18t18 42v434q0 24-18 42t-42 18H220Zm0-60h520v-434H660v100q0 17-11.5 28.5T620-514H340q-17 0-28.5-11.5T300-554v-100H220v434Zm60-434h280v-100H280v100Z" />
                  </svg>
                  <p>{config.emptyStateLabel ?? "Nothing here"}</p>
                </div>
              )}

              <div ref={sentinelRef} className="shared-kanban-load-more-trigger">
                {isFetchingNextPage && (
                  <div className="shared-kanban-load-more-spinner">
                    Loading more...
                  </div>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}

export const KanbanCardSkeleton: React.FC = () => (
  <div className="shared-kanban-card-skeleton" />
);

export const KanbanColumnSkeleton: React.FC = () => (
  <div className="shared-kanban-column">
    <div className="shared-kanban-column-header-skeleton" />
    <div className="shared-kanban-column-scroll">
      {Array.from({ length: 4 }).map((_, i) => (
        <KanbanCardSkeleton key={i} />
      ))}
    </div>
  </div>
);
