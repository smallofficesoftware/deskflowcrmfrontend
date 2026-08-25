import { useContext, useState } from "react";
import { AppContext } from "../../common/AppContext";
import { PERMISSION_TYPE } from "../../helpers/AppEnum";
import { reportsMenuData } from "./reportsMenuData";

interface IProps {
  onReportClick: (value: string) => void;
}

const CATEGORY_COLORS = [
  "#F58634", // CRM
  "#4C6EF5", // HRMS
  "#12B886", // Production
  "#E64980", // Account
  "#7048E8", // Inventory
  "#15AABF", // Settings
  "#FA5252", // Masters
  "#F59F00", // Product Settings
  "#40C057", // Other Tools
  "#5C7CFA", // All New Reports
];

const ReportsTileView = ({ onReportClick }: IProps) => {
  const [searchValue, setSearchValue] = useState("");
  const { permissions } = useContext(AppContext)!;

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
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .report-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
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

      {filteredMenus.map((menu, menuIndex) => {
        const color = CATEGORY_COLORS[menuIndex % CATEGORY_COLORS.length];

        return (
          <div key={menu.key} style={{ marginBottom: "28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                <span style={{ display: "flex", filter: "brightness(0) invert(1)" }}>
                  {menu.icon}
                </span>
              </div>
              <span style={{ fontWeight: "bold", fontSize: "15px", color: "#333" }}>
                {menu.menu}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {menu.subMenus.map((sub) => (
                <button
                  key={sub.value}
                  type="button"
                  className="report-tile"
                  onClick={() => onReportClick(sub.value)}
                  style={{
                    minWidth: "160px",
                    flex: "1 1 180px",
                    maxWidth: "220px",
                    textAlign: "left",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid #eee",
                    borderLeft: `4px solid ${color}`,
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#333",
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportsTileView;
