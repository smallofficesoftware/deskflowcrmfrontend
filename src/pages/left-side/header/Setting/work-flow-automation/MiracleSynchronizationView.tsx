import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../../../../common/AppContext";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { axiosInstance } from "../../../../../services/axiosInstance";

interface IPropsMiracleSynchronization {
  show: boolean;
  onHide: () => void;
}

interface UnsyncedCounts {
  product: number;
  contact: number;
  quotation: number;
  order: number;
  invoice: number;
  purchase_invoice: number;
  purchase_order: number;
  return_sales_invoice: number;
  return_purchase_invoice: number;
  inward: number;
  dispatch: number;
  account_transaction: number;
}

interface SyncSummary {
  module: string;
  total: number;
  success: number;
  failed: number;
}

interface CompanyTitles {
  invoice_title: string;
  order_title: string;
  quotation_title: string;
  purchase_title: string;
  purchase_order_title: string;
  inward_title: string;
  dispatch_title: string;
  return_sales_invoice_title: string;
  return_purchase_invoice_title: string;
}

const DESKFLOW_COLOR = "#e37430";
const MIRACLE_COLOR = "#1070b2";

type DatePresetKey = "all" | "this_month" | "last_30" | "current_fy" | "custom";

interface ModuleConfig {
  key: keyof UnsyncedCounts;
  defaultLabel: string;
  titleKey?: keyof CompanyTitles;
  badge: string;
  pageId?: number;
  icon: JSX.Element;
}

const MODULE_LIST: ModuleConfig[] = [
  {
    key: "contact", defaultLabel: "Contact & Party Accounts", badge: "AA/AE/AD",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    key: "product", defaultLabel: "Products & Items", badge: "PA/PE/PD",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  },
  {
    key: "invoice", defaultLabel: "Sales Invoice", badge: "SS",
    titleKey: "invoice_title", pageId: PAGE_ID.INVOICE,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
  {
    key: "purchase_invoice", defaultLabel: "Purchase Invoice", badge: "PP",
    titleKey: "purchase_title", pageId: PAGE_ID.PURCHASE,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  },
  {
    key: "return_sales_invoice", defaultLabel: "Return Sales Invoice", badge: "SR",
    titleKey: "return_sales_invoice_title", pageId: PAGE_ID.RETURN_SALES_INVOICE,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>,
  },
  {
    key: "return_purchase_invoice", defaultLabel: "Return Purchase Invoice", badge: "PR",
    titleKey: "return_purchase_invoice_title", pageId: PAGE_ID.RETURN_PURCHASE_INVOICE,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  },
  {
    key: "quotation", defaultLabel: "Quotation / Estimate", badge: "QS",
    titleKey: "quotation_title", pageId: PAGE_ID.QUOTATION,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    key: "order", defaultLabel: "Sales Order", badge: "OS",
    titleKey: "order_title", pageId: PAGE_ID.ORDER,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>,
  },
  {
    key: "purchase_order", defaultLabel: "Purchase Order", badge: "OP",
    titleKey: "purchase_order_title", pageId: PAGE_ID.PURCHASE_ORDER,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  },
  {
    key: "dispatch", defaultLabel: "Dispatch Challan", badge: "HS",
    titleKey: "dispatch_title", pageId: PAGE_ID.DISPATCH,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  },
  {
    key: "inward", defaultLabel: "Inward Challan", badge: "HP",
    titleKey: "inward_title", pageId: PAGE_ID.INWARD,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12" /><path d="m8 11 4 4 4-4" /><path d="M8 21h8" /></svg>,
  },
  {
    key: "account_transaction", defaultLabel: "Payment & Receipt", badge: "CP/CR/BP/BR",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
];

const initialCounts: UnsyncedCounts = {
  product: 0, contact: 0, quotation: 0, order: 0, invoice: 0,
  purchase_invoice: 0, purchase_order: 0, return_sales_invoice: 0,
  return_purchase_invoice: 0, inward: 0, dispatch: 0, account_transaction: 0,
};

const formatDateToISO = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const MiracleSynchronizationView = ({ show, onHide }: IPropsMiracleSynchronization) => {
  const { permissions } = useContext(AppContext)!;
  const [counts, setCounts] = useState<UnsyncedCounts>(initialCounts);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResults, setSyncResults] = useState<SyncSummary[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [companyTitles, setCompanyTitles] = useState<CompanyTitles | null>(null);

  // ─── Date Range States ───
  const [datePreset, setDatePreset] = useState<DatePresetKey>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // ─── Permission check using same pattern as SideBarView ───
  const hasPermission = (pageId: number, permissionType: string): boolean => {
    const pagePermission = permissions?.find(
      (perm: any) => perm.page_id === pageId
    );
    if (!pagePermission) return false;
    try {
      const rights = JSON.parse(pagePermission.a_page_id_rights_jason);
      return rights?.[permissionType] === 1;
    } catch {
      return false;
    }
  };

  // ─── Filter modules by owner page rights ───
  const allowedModules = MODULE_LIST.filter((mod) => {
    if (!mod.pageId) return true;
    return hasPermission(mod.pageId, PERMISSION_TYPE.VIEW);
  });

  // ─── Get dynamic label from company_master custom titles ───
  const getModuleLabel = (mod: ModuleConfig): string => {
    if (companyTitles && mod.titleKey) {
      const customName = companyTitles[mod.titleKey];
      if (customName && customName.trim()) return customName;
    }
    return mod.defaultLabel;
  };

  // ─── Handle Date Preset Selection ───
  const handleSelectPreset = (preset: DatePresetKey) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateToISO(start));
      setEndDate(formatDateToISO(now));
    } else if (preset === "last_30") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      setStartDate(formatDateToISO(start));
      setEndDate(formatDateToISO(now));
    } else if (preset === "current_fy") {
      // Indian Financial Year: April 1 to March 31
      const currentYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
      const start = new Date(fyStartYear, 3, 1); // April 1
      setStartDate(formatDateToISO(start));
      setEndDate(formatDateToISO(now));
    }
  };

  // ─── Fetch company_master custom titles ───
  const fetchCompanyTitles = async () => {
    const uuid = localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("mainCommonGet", {
        table: "company_masters",
        columns:
          "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,inward_title,dispatch_title,return_sales_invoice_title,return_purchase_invoice_title",
        where: JSON.stringify({ a_application_login_id: uuid }),
        request_flag: 2,
      });
      if (
        response.data.ack === DEFAULT_STATUS_CODE_SUCCESS &&
        response.data.data?.length > 0
      ) {
        setCompanyTitles(response.data.data[0]);
      }
    } catch {
      // Silently fail — fallback labels remain
    }
  };

  const fetchUnsyncedCounts = async (overrideStart?: string, overrideEnd?: string) => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    const sDate = overrideStart !== undefined ? overrideStart : startDate;
    const eDate = overrideEnd !== undefined ? overrideEnd : endDate;

    setIsLoadingCounts(true);
    try {
      const response = await axiosInstance.post(
        "get-miracle-unsynced-counts",
        {
          a_application_login_id,
          start_date: sDate || null,
          end_date: eDate || null,
        },
        { headers: { Authorization: `${token}`, "x-tenant-id": a_application_login_id } }
      );
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const fetchedCounts = response.data.data.counts || initialCounts;
        setCounts(fetchedCounts);
        setSelectedModules(
          allowedModules.filter((m) => (fetchedCounts[m.key] || 0) > 0).map((m) => m.key)
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (show) {
      setSyncResults(null);
      setSyncProgress(0);
      setSearchQuery("");
      fetchCompanyTitles();
      fetchUnsyncedCounts();
    }
  }, [show, startDate, endDate]);

  const toggleSelectAll = () => {
    setSelectedModules(
      selectedModules.length === allowedModules.length ? [] : allowedModules.map((m) => m.key)
    );
  };

  const toggleModule = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey) ? prev.filter((m) => m !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleBulkSync = async () => {
    if (selectedModules.length === 0) {
      toast.info("Please select at least one module to sync.");
      return;
    }
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncResults(null);

    const interval = setInterval(() => {
      setSyncProgress((p) => (p < 85 ? p + Math.random() * 12 : p));
    }, 350);

    try {
      const response = await axiosInstance.post(
        "bulk-sync-miracle-modules",
        {
          a_application_login_id,
          selected_modules: selectedModules,
          start_date: startDate || null,
          end_date: endDate || null,
        },
        { headers: { Authorization: `${token}`, "x-tenant-id": a_application_login_id } }
      );
      clearInterval(interval);
      setSyncProgress(100);

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setSyncResults(response.data.data.results || []);
        toast.success(response.data.ack_msg || "Bulk synchronization completed!");
        fetchUnsyncedCounts();
      } else {
        toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      clearInterval(interval);
      toast.error(error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const getTotalUnsynced = () => Object.values(counts).reduce((a, b) => a + b, 0);

  const filteredModules = allowedModules.filter(
    (m) =>
      getModuleLabel(m).toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1050,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "60%", maxWidth: "940px", maxHeight: "94vh",
          background: "#fff", borderRadius: "16px",
          boxShadow: "0 25px 60px -12px rgba(0,0,0,0.28)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* ─── Header ─── */}
        <div
          style={{
            padding: "20px 24px 16px",
            background: `linear-gradient(135deg, ${MIRACLE_COLOR} 0%, #084c7a 100%)`,
            color: "#fff",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div
              style={{
                width: 46, height: 46, borderRadius: 12,
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </div>
            <div>
              <h5 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                Miracle Synchronization
              </h5>
              <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.85 }}>
                Filter date range, select modules, and push unsynced Deskflow data to Miracle
              </p>
            </div>
          </div>
          <button
            onClick={onHide}
            disabled={isSyncing}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ─── Scrollable Body ─── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* ─── Date Range Filter Bar ─── */}
          <div
            style={{
              padding: "14px 16px", borderRadius: 12, marginBottom: 18,
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MIRACLE_COLOR} strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1e293b" }}>
                  Synchronization Date Range
                </span>
                {(startDate || endDate) && (
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 600, color: MIRACLE_COLOR,
                    background: "rgba(16,112,178,0.1)", padding: "2px 8px", borderRadius: 12,
                  }}>
                    Filtered Range
                  </span>
                )}
              </div>

              {/* Preset Chips */}
              <div style={{ display: "flex", gap: 6 }}>
                {(
                  [
                    { key: "all", label: "All Time" },
                    { key: "this_month", label: "This Month" },
                    { key: "last_30", label: "Last 30 Days" },
                    { key: "current_fy", label: "Financial Year" },
                  ] as { key: DatePresetKey; label: string }[]
                ).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleSelectPreset(p.key)}
                    style={{
                      border: datePreset === p.key ? `1.5px solid ${MIRACLE_COLOR}` : "1px solid #cbd5e1",
                      background: datePreset === p.key ? MIRACLE_COLOR : "#fff",
                      color: datePreset === p.key ? "#fff" : "#475569",
                      padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                      fontSize: "0.72rem", fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date inputs row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#64748b" }}>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setStartDate(e.target.value);
                  }}
                  style={{
                    flex: 1, padding: "6px 10px", borderRadius: 8,
                    border: "1px solid #cbd5e1", background: "#fff",
                    fontSize: "0.78rem", fontWeight: 500, color: "#1e293b", outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#64748b" }}>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setEndDate(e.target.value);
                  }}
                  style={{
                    flex: 1, padding: "6px 10px", borderRadius: 8,
                    border: "1px solid #cbd5e1", background: "#fff",
                    fontSize: "0.78rem", fontWeight: 500, color: "#1e293b", outline: "none",
                  }}
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={() => handleSelectPreset("all")}
                  title="Clear date filter"
                  style={{
                    background: "#fee2e2", border: "1px solid #fca5a5", color: "#ef4444",
                    borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                    fontSize: "0.74rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  ✕ Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* ─── Stat Widgets Row (with Skeleton Support) ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
            {/* Widget 1: Total Unsynced */}
            <div
              style={{
                padding: "16px", borderRadius: 12,
                background: `linear-gradient(135deg, rgba(227,116,48,0.08) 0%, rgba(227,116,48,0.02) 100%)`,
                border: "1px solid rgba(227,116,48,0.18)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Pending Unsynced
                </div>
                {isLoadingCounts ? (
                  <div className="skeleton-bar" style={{ width: 60, height: 28, borderRadius: 6 }}></div>
                ) : (
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: DESKFLOW_COLOR, lineHeight: 1 }}>
                    {getTotalUnsynced()}
                  </div>
                )}
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: DESKFLOW_COLOR, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(227,116,48,0.3)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>

            {/* Widget 2: Selected Count */}
            <div
              style={{
                padding: "16px", borderRadius: 12,
                background: `linear-gradient(135deg, rgba(16,112,178,0.08) 0%, rgba(16,112,178,0.02) 100%)`,
                border: "1px solid rgba(16,112,178,0.18)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Selected Modules
                </div>
                {isLoadingCounts ? (
                  <div className="skeleton-bar" style={{ width: 80, height: 28, borderRadius: 6 }}></div>
                ) : (
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: MIRACLE_COLOR, lineHeight: 1 }}>
                    {selectedModules.length}
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}> / {allowedModules.length}</span>
                  </div>
                )}
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: MIRACLE_COLOR, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16,112,178,0.3)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
            </div>

            {/* Widget 3: Refresh & Status */}
            <div
              style={{
                padding: "16px", borderRadius: 12,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  API Status
                </div>
                <span style={{
                  fontSize: "0.74rem", fontWeight: 600, color: "#10b981",
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                  padding: "3px 10px", borderRadius: 6,
                }}>
                  ● Connected
                </span>
              </div>
              <button
                onClick={() => fetchUnsyncedCounts()}
                disabled={isLoadingCounts || isSyncing}
                style={{
                  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                  padding: "6px 12px", cursor: "pointer", fontSize: "0.74rem",
                  fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: isLoadingCounts ? "spin 1s linear infinite" : "none" }}>
                  <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* ─── Toolbar: Search + Select All ─── */}
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", marginBottom: 14,
              background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: 220, padding: "7px 12px 7px 32px",
                    border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.78rem",
                    background: "#fff", outline: "none",
                  }}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={toggleSelectAll}
                disabled={isLoadingCounts}
                style={{
                  background: selectedModules.length === allowedModules.length
                    ? `linear-gradient(135deg, ${MIRACLE_COLOR}, #09548a)` : "#fff",
                  color: selectedModules.length === allowedModules.length ? "#fff" : "#475569",
                  border: selectedModules.length === allowedModules.length ? "none" : "1px solid #e2e8f0",
                  borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                  fontSize: "0.76rem", fontWeight: 600,
                  boxShadow: selectedModules.length === allowedModules.length
                    ? "0 2px 8px rgba(16,112,178,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                {selectedModules.length === allowedModules.length ? "✓ All Selected" : "Select All"}
              </button>
            </div>
          </div>

          {/* ─── Progress Bar (visible during sync) ─── */}
          {isSyncing && (
            <div
              style={{
                padding: "14px 16px", marginBottom: 16, borderRadius: 12,
                background: "rgba(16,112,178,0.06)", border: "1px solid rgba(16,112,178,0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: MIRACLE_COLOR, display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner-border spinner-border-sm" style={{ color: MIRACLE_COLOR }} role="status"></span>
                  Synchronizing to Miracle...
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: MIRACLE_COLOR }}>
                  {Math.round(syncProgress)}%
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", borderRadius: 99,
                    width: `${syncProgress}%`,
                    background: `linear-gradient(90deg, ${DESKFLOW_COLOR} 0%, ${MIRACLE_COLOR} 100%)`,
                    transition: "width 0.35s ease",
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* ─── SKELETON LOADER STATE (while API waiting) ─── */}
          {isLoadingCounts ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  style={{
                    padding: "14px 16px", borderRadius: 12,
                    border: "1.5px solid #e2e8f0", background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="skeleton-bar" style={{ width: 17, height: 17, borderRadius: 4 }}></div>
                    <div className="skeleton-bar" style={{ width: 36, height: 36, borderRadius: 10 }}></div>
                    <div>
                      <div className="skeleton-bar" style={{ width: 130, height: 14, borderRadius: 4, marginBottom: 6 }}></div>
                      <div className="skeleton-bar" style={{ width: 60, height: 10, borderRadius: 4 }}></div>
                    </div>
                  </div>
                  <div className="skeleton-bar" style={{ width: 32, height: 22, borderRadius: 20 }}></div>
                </div>
              ))}
            </div>
          ) : allowedModules.length === 0 ? (
            /* ─── No permission info ─── */
            <div
              style={{
                padding: "30px", textAlign: "center",
                background: "rgba(239,68,68,0.04)", borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#ef4444", marginBottom: 4 }}>
                No Module Access
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                You don't have page rights to sync any modules. Contact your admin to assign view permissions.
              </div>
            </div>
          ) : (
            /* ─── Module Cards Grid ─── */
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {filteredModules.map((mod) => {
                const count = counts[mod.key] || 0;
                const isSelected = selectedModules.includes(mod.key);
                const isHovered = hoveredModule === mod.key;
                const label = getModuleLabel(mod);

                return (
                  <div
                    key={mod.key}
                    onClick={() => toggleModule(mod.key)}
                    onMouseEnter={() => setHoveredModule(mod.key)}
                    onMouseLeave={() => setHoveredModule(null)}
                    style={{
                      padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${isSelected ? MIRACLE_COLOR : isHovered ? "#cbd5e1" : "#e2e8f0"}`,
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(16,112,178,0.04) 0%, #fff 100%)"
                        : isHovered ? "#fafbfc" : "#fff",
                      boxShadow: isSelected
                        ? "0 4px 14px rgba(16,112,178,0.1)"
                        : isHovered ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      position: "relative", overflow: "hidden",
                      transition: "all 0.2s ease",
                      transform: isHovered ? "translateY(-1px)" : "none",
                    }}
                  >
                    {/* Left accent bar */}
                    <div
                      style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
                        background: isSelected ? MIRACLE_COLOR : "transparent",
                        borderRadius: "0 4px 4px 0",
                        transition: "background 0.2s ease",
                      }}
                    ></div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 4 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{
                          width: 17, height: 17, cursor: "pointer",
                          accentColor: MIRACLE_COLOR, borderRadius: 4,
                        }}
                      />

                      <div
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isSelected ? "rgba(16,112,178,0.1)" : "#f1f5f9",
                          color: isSelected ? MIRACLE_COLOR : "#64748b",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {mod.icon}
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.3 }}>
                          {label}
                        </div>
                        <span
                          style={{
                            fontSize: "0.64rem", fontWeight: 500,
                            color: "#94a3b8", background: "#f1f5f9",
                            padding: "1px 7px", borderRadius: 4, marginTop: 2, display: "inline-block",
                          }}
                        >
                          {mod.badge}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {count > 0 ? (
                        <span
                          style={{
                            fontSize: "0.73rem", fontWeight: 700, color: "#fff",
                            background: DESKFLOW_COLOR, padding: "4px 10px",
                            borderRadius: 20, display: "flex", alignItems: "center", gap: 4,
                            boxShadow: "0 2px 6px rgba(227,116,48,0.2)",
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "inline-block" }}></span>
                          {count}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.73rem", fontWeight: 500, color: "#94a3b8",
                            background: "#f1f5f9", padding: "4px 10px", borderRadius: 20,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          0
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Sync Results Summary ─── */}
          {syncResults && (
            <div
              style={{
                padding: "16px", marginBottom: 8, borderRadius: 12,
                background: "#fff", border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%", background: "#10b981",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "#1e293b" }}>
                    Synchronization Summary
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {syncResults.map((res) => {
                  const matchedMod = MODULE_LIST.find((m) => m.key === res.module);
                  const displayName = matchedMod ? getModuleLabel(matchedMod) : res.module;
                  return (
                    <div
                      key={res.module}
                      style={{
                        padding: "10px 12px", borderRadius: 8,
                        background: "#f8fafc", border: "1px solid #f1f5f9",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>
                        {displayName}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 600, color: "#10b981",
                          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                          padding: "2px 8px", borderRadius: 6,
                        }}>
                          {res.success} ✓
                        </span>
                        {res.failed > 0 && (
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 600, color: "#ef4444",
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            padding: "2px 8px", borderRadius: 6,
                          }}>
                            {res.failed} ✗
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div
          style={{
            padding: "14px 24px", borderTop: "1px solid #e2e8f0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#fafbfc",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            Deskflow CRM → Miracle Accounting
          </span>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onHide}
              disabled={isSyncing}
              style={{
                padding: "8px 20px", borderRadius: 8,
                background: "#fff", border: "1px solid #e2e8f0",
                fontSize: "0.82rem", fontWeight: 600, color: "#475569",
                cursor: "pointer",
              }}
            >
              Close
            </button>

            <button
              onClick={handleBulkSync}
              disabled={isSyncing || isLoadingCounts || selectedModules.length === 0}
              style={{
                padding: "8px 22px", borderRadius: 8, border: "none",
                background: isSyncing || isLoadingCounts || selectedModules.length === 0
                  ? "#cbd5e1"
                  : `linear-gradient(135deg, ${MIRACLE_COLOR} 0%, #09548a 100%)`,
                color: "#fff", fontSize: "0.82rem", fontWeight: 700,
                cursor: isSyncing || isLoadingCounts || selectedModules.length === 0 ? "not-allowed" : "pointer",
                boxShadow: isSyncing || isLoadingCounts || selectedModules.length === 0
                  ? "none"
                  : "0 4px 14px rgba(16,112,178,0.3)",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              {isSyncing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Synchronizing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Sync to Miracle ({selectedModules.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Styles for Skeleton loading animation & spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .skeleton-bar {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s infinite ease-in-out;
        }

        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default MiracleSynchronizationView;
