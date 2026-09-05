import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../common/AppContext";
import { PERMISSION_TYPE } from "../../helpers/AppEnum";
import {
  IReportGroup,
  IRunnableReportDefinition,
  listReportGroups,
  listRunnableReportDefinitions,
} from "../dashboard/Reports/ReportBuilder/ReportBuilderController";
import { ReportIcon } from "./reportIcons";
import { reportsMenuData } from "./reportsMenuData";

const THEME_COLOR = "#F58634";
const THEME_TINT = "#fff3eb";

interface IProps {
  onReportClick: (value: string) => void;
  // Custom Reports tiles are dynamic (a numeric report_definition_id, not
  // one of the ~50 fixed names onReportClick's handler switches on) — a
  // separate callback so BottomView.tsx can route it straight into
  // ReportRunnerView.tsx without touching that big fixed-name dispatch at
  // all (its own fallback branch toasts a permission error for anything
  // it doesn't recognize, which a dynamic id never would).
  onCustomReportClick: (id: number) => void;
}

const ReportsTileView = ({ onReportClick, onCustomReportClick }: IProps) => {
  const [searchValue, setSearchValue] = useState("");
  const { permissions } = useContext(AppContext)!;

  // "Custom Reports" — the dynamic, per-tenant section (Report Builder's
  // report_definitions, both the owner's own and any copied from the
  // system gallery). Visibility is per-report_definition_team_rights grant
  // only (Step 7 of the plan) — the backend already returns exactly what
  // this login is allowed to see, nothing further to filter client-side.
  // A separate fetch from the static reportsMenuData tiles above, not
  // merged into that data shape — reportsMenuData stays untouched.
  const [customReports, setCustomReports] = useState<IRunnableReportDefinition[]>([]);
  const [loadingCustomReports, setLoadingCustomReports] = useState(true);
  // Step 10 — report groups. Flag-only/no-PIN read (same tier
  // list-runnable's own category/description already sit at), so any
  // run-tier viewer can render group headers, not just the owner.
  const [reportGroups, setReportGroups] = useState<IReportGroup[]>([]);

  useEffect(() => {
    listRunnableReportDefinitions().then((rows) => {
      setCustomReports(rows);
      setLoadingCustomReports(false);
    });
    listReportGroups().then(setReportGroups);
  }, []);

  const filteredCustomReports = customReports.filter((r) =>
    !searchValue || r.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // Bucketed by report_group_id, in the tenant's own display_order, with
  // an "Ungrouped" bucket last for anything with no group_id (or one that
  // no longer resolves to a live group). When no groups exist at all,
  // this collapses to a single "Ungrouped" bucket — rendered as one flat
  // section below (no sub-heading), so a tenant who never created groups
  // sees no visual change from before this feature existed.
  const sortedGroups = [...reportGroups].sort((a, b) => a.display_order - b.display_order);
  const reportsByGroup: { group: IReportGroup | null; reports: IRunnableReportDefinition[] }[] = [
    ...sortedGroups.map((group) => ({
      group,
      reports: filteredCustomReports.filter((r) => r.report_group_id === group.id),
    })),
    {
      group: null,
      reports: filteredCustomReports.filter((r) => !sortedGroups.some((g) => g.id === r.report_group_id)),
    },
  ].filter((bucket) => bucket.reports.length > 0);

  const hasPermission = (pageId: number, permissionType: string) => {
    const pagePermission = permissions?.find(
      (perm: any) => perm.page_id === pageId,
    );

    if (!pagePermission) return false;

    try {
      let rights = pagePermission.a_page_id_rights_jason;
      if (typeof rights === "string") {
        rights = JSON.parse(rights);
        if (typeof rights === "string") {
          rights = JSON.parse(rights);
        }
      }
      return rights?.[permissionType] === 1;
    } catch {
      return false;
    }
  };

  const permissionFilteredMenus = reportsMenuData
    .map((menu) => ({
      ...menu,
      subMenus: menu.subMenus.filter((sub) => {
        if (!sub.pageId) return true;
        return hasPermission(sub.pageId, PERMISSION_TYPE.VIEW);
      }),
    }))
    .filter((menu) => menu.subMenus.length > 0);

  const filteredMenus = permissionFilteredMenus
    .map((menu) => {
      if (!searchValue) return menu;

      const matched = menu.subMenus.filter((sub) =>
        sub.label.toLowerCase().includes(searchValue.toLowerCase()),
      );

      return matched.length > 0 ? { ...menu, subMenus: matched } : null;
    })
    .filter(Boolean) as typeof permissionFilteredMenus;

  return (
    <div>
      <style>{`
        .report-tile {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .report-tile:hover {
          border-color: #d1d5db !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
      `}</style>

      <div style={{ position: "relative", maxWidth: "400px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Search Reports..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="form-control"
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "#fff",
          }}
        />
        {searchValue && (
          <span
            onClick={() => setSearchValue("")}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              cursor: "pointer",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="#5f6368"
            >
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          </span>
        )}
      </div>

      {filteredMenus.length === 0 && (
        <div className="text-muted">No reports match your search.</div>
      )}

      {filteredMenus.map((menu) => (
        <div key={menu.key} style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#8a8a8a",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            {menu.menu}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {menu.subMenus.map((sub) => (
              <button
                key={sub.value}
                type="button"
                className="report-tile"
                onClick={() => onReportClick(sub.value)}
                style={{
                  textAlign: "left",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: sub.description ? "8px" : 0,
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: THEME_TINT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ReportIcon name={sub.icon || "report"} size={16} color={THEME_COLOR} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a" }}>
                    {sub.label}
                  </span>
                </div>
                {sub.description && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "#8a8a8a",
                    }}
                  >
                    {sub.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!loadingCustomReports && (filteredCustomReports.length > 0 || (!searchValue && customReports.length === 0)) && (
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#8a8a8a",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Custom Reports
          </div>
          {customReports.length === 0 ? (
            <div className="text-muted" style={{ fontSize: "13px" }}>No reports available yet.</div>
          ) : (
            reportsByGroup.map(({ group, reports }) => (
              <div key={group?.id ?? "ungrouped"} style={{ marginBottom: "20px" }}>
                {/* A sub-heading appears only once this tenant actually has
                    groups — a tenant who never created any sees the exact
                    same flat grid as before this feature existed (single
                    bucket, group: null, no heading rendered). */}
                {sortedGroups.length > 0 && (
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#4a4a4a", marginBottom: "8px" }}>
                    {group?.group_name ?? "Ungrouped"}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {reports.map((def) => (
                    <button
                      key={def.id}
                      type="button"
                      className="report-tile"
                      onClick={() => onCustomReportClick(def.id)}
                      style={{
                        textAlign: "left",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: def.description ? "8px" : 0,
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: THEME_TINT,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <ReportIcon name={def.icon || "report"} size={16} color={THEME_COLOR} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a" }}>
                          {def.name}
                        </span>
                      </div>
                      {def.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            lineHeight: 1.5,
                            color: "#8a8a8a",
                          }}
                        >
                          {def.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsTileView;
