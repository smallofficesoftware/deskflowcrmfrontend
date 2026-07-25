import React, { useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="kanban-search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks, contacts, numbers..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // disabled={isLoading}
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--k-text-muted)",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isLoading && (
        <div
          style={{
            color: "var(--k-text-muted)",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ animation: "spin 0.8s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Searching...
        </div>
      )}

      <button
        className={`btn-refresh ${isRefreshing ? "spinning" : ""}`}
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh board"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>
  );
};
