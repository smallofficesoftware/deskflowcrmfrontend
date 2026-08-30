import React, { useEffect } from "react";
import { SearchBar } from "../../task-kanban/components/SearchBar";
import "../../task-kanban/styles/kanban.css";

// One shared modal chrome + header for every kanban board in the app
// (ContactKanbanBoard, TaskKanbanModal/task-kanban, and KanbanBoard/index.tsx)
// - each of those used to keep its own hand-copied header (icon, title,
// search, filter, add, close), and they drifted: one was missing the
// .kanban-scope wrapper entirely (every CSS var silently resolved to
// nothing), another used raw inline styles/colors with no shared classes
// at all. A fix made in one never reached the other two. This is the ONE
// place that markup lives now - a fix here fixes every board at once, and
// whatever board comes next gets it for free by construction.
//
// Board-specific bits (title, icons aside, the filter modal, the add
// modal, the actual columns) stay owned by each caller - this only owns
// the modal shell + header row + search/filter/add/close buttons.
export interface KanbanModalFrameProps {
  show: boolean;
  onHide: () => void;
  title: string;
  subtitle: string;

  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isSearching?: boolean;
  isRefreshing?: boolean;

  // Omit onOpenFilter entirely for a board with no filter concept.
  onOpenFilter?: () => void;
  hasActiveFilter?: boolean;
  filterTitle?: string;

  // Omit onAdd entirely for a board with no create action. The caller's
  // onAdd is responsible for its own permission check/toast - this frame
  // just renders the button and calls it.
  onAdd?: () => void;
  addTitle?: string;

  children: React.ReactNode;
}

export const KanbanModalFrame: React.FC<KanbanModalFrameProps> = ({
  show,
  onHide,
  title,
  subtitle,
  searchValue,
  onSearchChange,
  onRefresh,
  isSearching = false,
  isRefreshing = false,
  onOpenFilter,
  hasActiveFilter = false,
  filterTitle = "Filter",
  onAdd,
  addTitle = "Add",
  children,
}) => {
  // Body scroll-lock + Escape-to-close - previously only TaskKanbanModal's
  // outer wrapper had this; ContactKanbanBoard and KanbanBoard/index.tsx
  // had neither, another drift this shared frame now closes for all 3.
  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onHide();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="kanban-scope">
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1054 }}
        onClick={onHide}
      />
      <div
        className="modal fade show kanban-modal"
        style={{ display: "flex", zIndex: 1055, alignItems: "stretch" }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onHide();
        }}
      >
        <div
          className="modal-dialog modal-fullscreen m-0 w-100"
          style={{ maxWidth: "100%", height: "100%" }}
        >
          <div
            className="modal-content kanban-modal-content"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Header ── */}
            <div className="modal-header kanban-modal-header px-3 py-0">
              <div className="d-flex align-items-center gap-2">
                <div className="kanban-modal-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                  </svg>
                </div>
                <div>
                  <div className="kanban-modal-title">{title}</div>
                  <div className="kanban-modal-subtitle">{subtitle}</div>
                </div>
              </div>

              {/* Right-side header actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginLeft: "auto",
                  marginRight: 8,
                  flex: 1,
                  minWidth: 0,
                  justifyContent: "flex-end",
                }}
              >
                <SearchBar
                  value={searchValue}
                  onChange={onSearchChange}
                  onRefresh={onRefresh}
                  isLoading={isSearching}
                  isRefreshing={isRefreshing}
                />

                {onOpenFilter && (
                  <button
                    title={filterTitle}
                    onClick={onOpenFilter}
                    className="kanban-header-btn"
                    style={{ color: hasActiveFilter ? "#ef4444" : undefined }}
                  >
                    {hasActiveFilter ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="currentColor"
                      >
                        <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                      </svg>
                    ) : (
                      <svg
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="currentColor"
                      >
                        <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                      </svg>
                    )}
                  </button>
                )}

                {onAdd && (
                  <button
                    title={addTitle}
                    onClick={onAdd}
                    className="kanban-header-btn kanban-header-btn--primary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="22px"
                      viewBox="0 -960 960 960"
                      width="22px"
                      fill="currentColor"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onHide}
              />
            </div>

            {/* ── Body ── */}
            <div className="modal-body kanban-modal-body p-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
