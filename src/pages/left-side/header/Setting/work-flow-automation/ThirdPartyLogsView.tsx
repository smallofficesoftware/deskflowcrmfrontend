import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";

interface IPropsThirdPartyLogs {
  show: boolean;
  onHide: () => void;
}

type Integration =
  | "ALL"
  | "INDIAMART"
  | "TRADEINDIA"
  | "TRADEINDIA_BUY_LEADS"
  | "JUSTDIAL"
  | "GOOGLESHEET"
  | "RAZORPAY"
  | "GEMINI"
  | "WHATSAPP_SEND"
  | "WHATSAPP_WEBHOOK";
type Direction = "ALL" | "INBOUND" | "OUTBOUND";
type LogStatus = "ALL" | "SUCCESS" | "FAILED";

interface ThirdPartyLog {
  id: number;
  integration: string;
  direction: "INBOUND" | "OUTBOUND";
  module_name?: string;
  url?: string;
  method?: string;
  status_code?: number;
  status: "SUCCESS" | "FAILED";
  response_time?: number;
  request_payload?: string;
  response_payload?: string;
  error_message?: string;
  created_date_time: string;
}

const THEME_COLOR = "#5b21b6";

const INTEGRATION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  INDIAMART:            { label: "IndiaMart",           color: "#c2410c", bg: "rgba(194,65,12,0.1)",  border: "rgba(194,65,12,0.25)" },
  TRADEINDIA:           { label: "TradeIndia",           color: "#1d4ed8", bg: "rgba(29,78,216,0.1)",  border: "rgba(29,78,216,0.25)" },
  TRADEINDIA_BUY_LEADS: { label: "TradeIndia Buy Leads",  color: "#1d4ed8", bg: "rgba(29,78,216,0.1)",  border: "rgba(29,78,216,0.25)" },
  JUSTDIAL:             { label: "Justdial",              color: "#a16207", bg: "rgba(161,98,7,0.1)",   border: "rgba(161,98,7,0.25)"  },
  GOOGLESHEET:          { label: "Google Sheet",          color: "#15803d", bg: "rgba(21,128,61,0.1)",  border: "rgba(21,128,61,0.25)" },
  RAZORPAY:             { label: "Razorpay",              color: "#4338ca", bg: "rgba(67,56,202,0.1)",  border: "rgba(67,56,202,0.25)" },
  GEMINI:               { label: "Gemini AI",             color: "#7c3aed", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.25)" },
  WHATSAPP_SEND:        { label: "WhatsApp Send",         color: "#128c7e", bg: "rgba(18,140,126,0.1)", border: "rgba(18,140,126,0.25)" },
  WHATSAPP_WEBHOOK:     { label: "WhatsApp Webhook",      color: "#128c7e", bg: "rgba(18,140,126,0.1)", border: "rgba(18,140,126,0.25)" },
};

const DIRECTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  INBOUND:  { label: "Inbound",  color: "#0891b2", bg: "rgba(8,145,178,0.1)",  border: "rgba(8,145,178,0.25)"  },
  OUTBOUND: { label: "Outbound", color: "#ea580c", bg: "rgba(234,88,12,0.1)",  border: "rgba(234,88,12,0.25)"  },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  SUCCESS: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  FAILED:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)"  },
};

const INTEGRATION_LIST = [
  "INDIAMART", "TRADEINDIA", "TRADEINDIA_BUY_LEADS", "JUSTDIAL",
  "GOOGLESHEET", "RAZORPAY", "GEMINI", "WHATSAPP_SEND", "WHATSAPP_WEBHOOK",
];

const PAGE_SIZE = 25;

const ThirdPartyLogsView = ({ show, onHide }: IPropsThirdPartyLogs) => {
  const [logs, setLogs] = useState<ThirdPartyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [integration, setIntegration] = useState<Integration>("ALL");
  const [direction, setDirection] = useState<Direction>("ALL");
  const [logStatus, setLogStatus] = useState<LogStatus>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [selectedLog, setSelectedLog] = useState<ThirdPartyLog | null>(null);
  const [payloadTab, setPayloadTab] = useState<"request" | "response">("request");
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("get-third-party-logs", {
        page: pg,
        page_size: PAGE_SIZE,
        integration: integration === "ALL" ? undefined : integration,
        direction: direction === "ALL" ? undefined : direction,
        status: logStatus === "ALL" ? undefined : logStatus,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      });
      if (res.data?.ack === DEFAULT_STATUS_CODE_SUCCESS || res.data?.code === 200) {
        setLogs(res.data.data?.rows || []);
        setTotal(res.data.data?.count || 0);
        setPage(pg);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [integration, direction, logStatus, startDate, endDate, search]);

  useEffect(() => {
    if (show) fetchLogs(1);
  }, [show, fetchLogs]);

  const handleConfirmClearLogs = async () => {
    setShowClearConfirm(false);
    try {
      await axiosInstance.post("clear-third-party-logs", {});
      toast.success("Third-party logs cleared.");
      fetchLogs(1);
    } catch {
      toast.error("Failed to clear logs.");
    }
  };

  const copyPayload = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const formatJSON = (str?: string) => {
    if (!str) return "";
    try { return JSON.stringify(JSON.parse(str), null, 2); }
    catch { return str; }
  };

  const formatDate = (dt: string) => {
    try {
      const d = new Date(dt);
      return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch { return dt; }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!show) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed", inset: 0, zIndex: 1060,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onHide(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 1100,
          background: "#fff", borderRadius: 18,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
          fontFamily: "'Inter','Segoe UI',sans-serif",
          display: "flex", flexDirection: "column",
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            padding: "20px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg,#5b21b6 0%,#3730a3 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(91,33,182,0.35)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", letterSpacing: "-0.3px" }}>
                Third-Party Integration Logs
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>
                IndiaMart · TradeIndia · Justdial · Google Sheet · Razorpay · Gemini · WhatsApp
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => fetchLogs(page)}
              disabled={loading}
              title="Refresh"
              style={{
                width: 36, height: 36, borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: loading ? "thirdPartySpin 0.8s linear infinite" : "none" }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444", fontWeight: 600, fontSize: "0.77rem",
              }}
            >
              Clear Logs
            </button>
            <button
              onClick={onHide}
              style={{
                width: 36, height: 36, borderRadius: 8, cursor: "pointer",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          background: "#fafbfc", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
          flexShrink: 0,
        }}>
          <select value={integration} onChange={(e) => setIntegration(e.target.value as Integration)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151", background: "#fff" }}>
            <option value="ALL">All Integrations</option>
            {INTEGRATION_LIST.map((i) => (
              <option key={i} value={i}>{INTEGRATION_CONFIG[i]?.label || i}</option>
            ))}
          </select>
          <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151", background: "#fff" }}>
            <option value="ALL">All Directions</option>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
          </select>
          <select value={logStatus} onChange={(e) => setLogStatus(e.target.value as LogStatus)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151", background: "#fff" }}>
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151" }} title="From date" />
          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>–</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151" }} title="To date" />
          <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search URL, module, error…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151" }} />
          </div>
          <button onClick={() => fetchLogs(1)}
            style={{ padding: "6px 18px", borderRadius: 8, cursor: "pointer", background: THEME_COLOR, color: "#fff", border: "none", fontWeight: 700, fontSize: "0.8rem" }}>
            Apply
          </button>
          <button onClick={() => { setIntegration("ALL"); setDirection("ALL"); setLogStatus("ALL"); setStartDate(""); setEndDate(""); setSearch(""); setTimeout(() => fetchLogs(1), 0); }}
            style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.8rem" }}>
            Reset
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding: "8px 24px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 20, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            <b style={{ color: "#1e293b" }}>{total}</b> logs found
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#94a3b8" }}>
            Page {page} / {totalPages || 1}
          </span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
              <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: THEME_COLOR, borderRadius: "50%", animation: "thirdPartySpin 0.75s linear infinite" }} />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🗒️</div>
              <div style={{ fontWeight: 700, color: "#64748b", fontSize: "0.95rem" }}>No logs found</div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4, lineHeight: 1.6 }}>
                Logs will appear here as third-party integrations run.<br />
                Make sure the backend logging is active.
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["#", "Integration", "Direction", "URL / Event", "Status", "Code", "Latency", "Time", "Payload"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const intCfg = INTEGRATION_CONFIG[log.integration] || { label: log.integration, color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)" };
                  const dirCfg = DIRECTION_CONFIG[log.direction];
                  const stCfg = STATUS_CONFIG[log.status];
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "10px 14px", fontSize: "0.75rem", color: "#94a3b8" }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: intCfg.color, background: intCfg.bg, border: `1px solid ${intCfg.border}`, padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap" }}>
                          {intCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {dirCfg && (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: dirCfg.color, background: dirCfg.bg, border: `1px solid ${dirCfg.border}`, padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap" }}>
                            {dirCfg.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", maxWidth: 240 }}>
                        <div style={{ fontSize: "0.72rem", color: "#374151", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={log.url || ""}>{log.url || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: stCfg.color, background: stCfg.bg, border: `1px solid ${stCfg.border}`, padding: "2px 8px", borderRadius: 5 }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "0.75rem", color: log.status_code && log.status_code >= 400 ? "#ef4444" : "#374151", fontWeight: 600 }}>
                        {log.status_code || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "0.73rem", color: (log.response_time || 0) > 2000 ? "#d97706" : "#64748b" }}>
                        {log.response_time != null ? `${log.response_time}ms` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "0.71rem", color: "#94a3b8", whiteSpace: "nowrap" }}>{formatDate(log.created_date_time)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {(log.request_payload || log.response_payload || log.error_message) ? (
                          <button
                            onClick={() => { setSelectedLog(log); setPayloadTab("request"); }}
                            style={{ padding: "4px 11px", borderRadius: 7, cursor: "pointer", background: "rgba(91,33,182,0.08)", border: "1px solid rgba(91,33,182,0.2)", color: THEME_COLOR, fontSize: "0.72rem", fontWeight: 600 }}
                          >
                            View
                          </button>
                        ) : <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0 }}>
            <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)}
              style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: page <= 1 ? "#f8fafc" : "#fff", color: page <= 1 ? "#cbd5e1" : "#374151", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: "0.78rem" }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => (
              <button key={pg} onClick={() => fetchLogs(pg)}
                style={{ width: 34, height: 34, borderRadius: 7, border: "1px solid " + (page === pg ? THEME_COLOR : "#e2e8f0"), background: page === pg ? THEME_COLOR : "#fff", color: page === pg ? "#fff" : "#374151", fontWeight: page === pg ? 700 : 400, cursor: "pointer", fontSize: "0.78rem" }}>
                {pg}
              </button>
            ))}
            <button disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}
              style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: page >= totalPages ? "#f8fafc" : "#fff", color: page >= totalPages ? "#cbd5e1" : "#374151", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: "0.78rem" }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Payload Viewer */}
      {selectedLog && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1070, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setSelectedLog(null)}
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 800, maxHeight: "88vh", background: "#0f172a", borderRadius: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "monospace" }}>
            {/* Viewer Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {(() => {
                  const cfg = INTEGRATION_CONFIG[selectedLog.integration] || { label: selectedLog.integration, color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)" };
                  return (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "2px 8px", borderRadius: 5 }}>
                      {cfg.label}
                    </span>
                  );
                })()}
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{DIRECTION_CONFIG[selectedLog.direction]?.label}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: STATUS_CONFIG[selectedLog.status].color, background: STATUS_CONFIG[selectedLog.status].bg, border: `1px solid ${STATUS_CONFIG[selectedLog.status].border}`, padding: "2px 8px", borderRadius: 5 }}>
                  {selectedLog.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => copyPayload(formatJSON(payloadTab === "request" ? selectedLog.request_payload : selectedLog.response_payload))}
                  style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: copied ? "#10b981" : "#94a3b8", fontSize: "0.74rem", cursor: "pointer", fontFamily: "inherit" }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button onClick={() => setSelectedLog(null)}
                  style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              {(["request", "response"] as const).map((tab) => (
                <button key={tab} onClick={() => setPayloadTab(tab)}
                  style={{ padding: "10px 24px", border: "none", cursor: "pointer", background: payloadTab === tab ? "rgba(255,255,255,0.05)" : "transparent", color: payloadTab === tab ? "#fff" : "#64748b", fontWeight: payloadTab === tab ? 700 : 400, fontSize: "0.8rem", borderBottom: payloadTab === tab ? `2px solid ${THEME_COLOR}` : "2px solid transparent", fontFamily: "inherit" }}>
                  {tab === "request" ? "📤 Request Payload" : "📥 Response Payload"}
                </button>
              ))}
            </div>
            {/* URL Meta */}
            {selectedLog.url && (
              <div style={{ padding: "8px 24px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{selectedLog.method || "POST"} </span>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8", wordBreak: "break-all" }}>{selectedLog.url}</span>
                {selectedLog.response_time != null && <span style={{ marginLeft: 12, fontSize: "0.68rem", color: "#64748b" }}>• {selectedLog.response_time}ms</span>}
              </div>
            )}
            {/* Error Banner */}
            {selectedLog.error_message && (
              <div style={{ margin: "10px 24px 0", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
                <span style={{ fontSize: "0.73rem", color: "#fca5a5" }}>{selectedLog.error_message}</span>
              </div>
            )}
            {/* Code */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              <pre style={{ margin: 0, padding: "16px 18px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "0.75rem", lineHeight: 1.65, color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {formatJSON(payloadTab === "request" ? selectedLog.request_payload : selectedLog.response_payload) || "(empty)"}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1080,
            background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 440,
              background: "#fff", borderRadius: 16,
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              padding: 24, textAlign: "center",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div
              style={{
                width: 54, height: 54, borderRadius: "50%",
                background: "rgba(239,68,68,0.1)", color: "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px auto", border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1e293b", marginBottom: 8 }}>
              Clear All Third-Party Logs?
            </div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5, marginBottom: 24 }}>
              Are you sure you want to clear all third-party integration logs? This action cannot be undone.
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1, padding: "10px 18px", borderRadius: 10,
                  border: "1px solid #cbd5e1", background: "#fff",
                  color: "#475569", fontWeight: 600, fontSize: "0.83rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearLogs}
                style={{
                  flex: 1, padding: "10px 18px", borderRadius: 10,
                  border: "none", background: "#ef4444",
                  color: "#fff", fontWeight: 700, fontSize: "0.83rem",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                }}
              >
                Yes, Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes thirdPartySpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ThirdPartyLogsView;
