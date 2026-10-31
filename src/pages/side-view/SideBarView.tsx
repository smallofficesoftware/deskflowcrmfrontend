import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import deshFlow_log_icon from "../../assets/images/deshFlow_log.png";
import smalll_office_logo from "../../assets/images/smalll_office_logo.png";
import { AppContext } from "../../common/AppContext";
import { PERMISSION_TYPE } from "../../helpers/AppEnum";
import { listForms } from "../left-side/header/Setting/form-builder/FormBuilderController";
import { reportsMenuData } from "./reportsMenuData";

const SidebarView = ({
  onReportClick,
  onHomeClick,
  isHomeActive,
  onMarketplaceClick,
  isOpen,
  setIsOpen,
  activeReport,
}: any) => {
  const [openMenu, setOpenMenu] = useState<string[]>([
    "CompanySetup",
    "HR",
    "Activities",
    "CRM",
    "HRMS",
    "Production",
    "Account",
    "Automation",
    "Settings",
    "Masters",
    "Product Settings",
    "Others",
    "new reports",
    "Inventory",
    "CS",
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  // const [selectedSubMenu, setSelectedSubMenu] = useState("");
  const [hoveredSubMenu, setHoveredSubMenu] = useState<string | null>(null);

  // The addon screens (Ecommerce Storefront, Tally) open from the Marketplace
  // cards, so the Marketplace entry stays highlighted while they're showing.
  const isMarketplaceActive = ["marketplace", "ecommerce_storefront", "tally_settings"].includes(activeReport);

  const { permissions } = useContext(AppContext)!;
  const navigate = useNavigate();

  // Each published form gets its own row, grouped into its own Category
  // (CRM, HRMS, ...) section - same taxonomy and same grouping pattern as
  // ReportsTileView.tsx merges custom report_definitions into these same
  // sections by report.category. No category set -> "Others", not "Forms".
  const [formRowsByCategory, setFormRowsByCategory] = useState<
    Record<string, { label: string; value: string; icon: string; description: string }[]>
  >({});
  useEffect(() => {
    (async () => {
      const res = await listForms();
      const forms = (res?.data?.item || []).filter((f: any) => f.published_schema_json);
      const byCategory: Record<string, { label: string; value: string; icon: string; description: string }[]> = {};
      forms.forEach((f: any) => {
        const category = f.category || "Others";
        (byCategory[category] ||= []).push({
          label: f.title,
          value: `form_submissions_${f.id}`,
          icon: "list_alt",
          description: `Submissions for "${f.title}"`,
        });
      });
      setFormRowsByCategory(byCategory);
    })();
  }, []);

  const hasPermission = (pageId: number | string, permissionType: string) => {
    const pagePermission = permissions?.find((perm: any) =>
      typeof pageId === "string" ? perm.page_slug === pageId : perm.page_id === pageId,
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

  const handleMenuToggle = (menuName: string) => {
    if (openMenu.includes(menuName)) {
      setOpenMenu(openMenu.filter((menu) => menu !== menuName));
    } else {
      setOpenMenu([...openMenu, menuName]);
    }
  };

  const menuItemStyle = {
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#4B4B4D",
  };

  const subMenuItemStyle = {
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#4B4B4D",
  };

  const menuData = reportsMenuData.map((menu) =>
    formRowsByCategory[menu.key]
      ? { ...menu, subMenus: [...menu.subMenus, ...formRowsByCategory[menu.key]] }
      : menu,
  );

  const permissionFilteredMenus = menuData
    .map((menu) => ({
      ...menu,
      subMenus: menu.subMenus.filter((sub: any) => {
        if (!sub.pageId) return true;

        return hasPermission(sub.pageId, PERMISSION_TYPE.VIEW);
      }),
    }))
    .filter((menu) => menu.subMenus.length > 0);

  const filteredMenus = permissionFilteredMenus
    .map((menuItem) => {
      const matchedSubMenus = menuItem.subMenus.filter((sub) =>
        sub.label.toLowerCase().includes(searchValue.toLowerCase()),
      );

      // If search empty → show all
      if (!searchValue) {
        return menuItem;
      }

      // Show only matched submenu items
      if (matchedSubMenus.length > 0) {
        return {
          ...menuItem,
          subMenus: matchedSubMenus,
        };
      }

      return null;
    })
    .filter(Boolean);

  return (
    <div
      onClick={() => {
        if (!isOpen) {
          setIsOpen(true);
        }
      }}
      style={{
        width: isOpen ? "250px" : "70px",
        transition: "0.3s",
        height: "99vh",
        background: "#E1E1E1",
        borderRight: "1px solid #c9c9c9",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ================= HEADER ================= */}

      <div style={{ padding: "10px" }}>
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "space-between" : "center",
            position: "relative",
            minHeight: "40px",
          }}
        >
          {/* OPEN SIDEBAR */}
          {isOpen ? (
            <>
              <img
                src={deshFlow_log_icon}
                alt="logo"
                width={170}
                style={{
                  transition: "0.2s",
                }}
              />

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  border: "none",
                  color: "#4B4B4D",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "0.2s",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#4B4B4D"
                >
                  <path d="M660-320v-320L500-480l160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm120-80v-560H200v560h120Zm80 0h360v-560H400v560Zm-80 0H200h120Z" />
                </svg>
              </button>
            </>
          ) : (
            /* CLOSED SIDEBAR */
            <>
              {!isHovered ? (
                <img
                  src={smalll_office_logo}
                  alt="logo"
                  width={34}
                  style={{
                    transition: "0.2s",
                  }}
                />
              ) : (
                <button
                  onClick={() => setIsOpen(true)}
                  style={{
                    border: "none",
                    color: "#4B4B4D",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "0.2s",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#4B4B4D"
                  >
                    <path d="M500-640v320l160-160-160-160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm120-80v-560H200v560h120Zm80 0h360v-560H400v560Zm-80 0H200h120Z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* BACK TO MAIN PANEL - kept with the logo, not in the page header */}
        <button
          type="button"
          onClick={() => navigate("/")}
          title="Back to Main Panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "flex-start" : "center",
            gap: "8px",
            width: "100%",
            height: "34px",
            marginTop: "10px",
            padding: isOpen ? "0 12px" : "0",
            borderRadius: "10px",
            border: "1px solid #c9c9c9",
            background: "#fff",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            color: "#4B4B4D",
            whiteSpace: "nowrap",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B4B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {isOpen && "Back to Main Panel"}
        </button>

        {/* SEARCH */}
        {isOpen && (
          <div style={{ position: "relative", marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "#fafafa",
                outline: "none",
              }}
            />

            {searchValue && (
              <span
                className="clear-icon"
                onClick={() => setSearchValue("")}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "10px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#4B4B4D"
                >
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            )}
          </div>
        )}
      </div>

      {/* One Home entry: back to the page with the three tabs (Quick actions / Insights / Reports, SideViewTabs). */}
      <div
        onClick={() => onHomeClick && onHomeClick()}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(245, 134, 52, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isHomeActive ? "rgba(245, 134, 52, 0.12)" : "transparent";
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: isOpen ? "flex-start" : "center",
          padding: "10px 15px",
          margin: "4px 8px",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "background 0.15s ease",
          background: isHomeActive ? "rgba(245, 134, 52, 0.12)" : "transparent",
        }}
        title="Home"
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            minWidth: "30px",
            borderRadius: "50%",
            background: "rgb(245, 134, 52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(245,134,52,0.4)",
          }}
        >
          <i className="pi pi-home" style={{ color: "#fff", fontSize: "15px" }} />
        </div>
        {isOpen && (
          <span style={{ fontWeight: "bold", color: "#4B4B4D" }}>
            Home
          </span>
        )}
      </div>

      <div
        onClick={() => onMarketplaceClick && onMarketplaceClick()}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(245, 134, 52, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isMarketplaceActive ? "rgba(245, 134, 52, 0.12)" : "transparent";
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: isOpen ? "flex-start" : "center",
          padding: "10px 15px",
          margin: "4px 8px",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "background 0.15s ease",
          background: isMarketplaceActive ? "rgba(245, 134, 52, 0.12)" : "transparent",
        }}
        title="Marketplace"
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            minWidth: "30px",
            borderRadius: "50%",
            background: "rgb(245, 134, 52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(245,134,52,0.4)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#fff">
            <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Z" />
          </svg>
        </div>
        {isOpen && (
          <span style={{ fontWeight: "bold", color: "#4B4B4D" }}>
            Marketplace
          </span>
        )}
      </div>

      <hr />

      {/* ================= MENU ================= */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {filteredMenus.map((menu: any) => (
          <div key={menu.key}>
            {/* MENU */}
            <div
              onClick={() => handleMenuToggle(menu.key)}
              style={{
                ...menuItemStyle,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                justifyContent: isOpen ? "flex-start" : "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span>{menu.icon}</span>

                {isOpen && <span>{menu.menu}</span>}
              </div>

              {/* RIGHT SIDE ARROW */}
              {isOpen && (
                <div style={{ marginLeft: "auto" }}>
                  {openMenu.includes(menu.key) ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#4B4B4D"
                    >
                      <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#4B4B4D"
                    >
                      <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* SUB MENU */}
            {isOpen && (openMenu.includes(menu.key) || searchValue) && (
              <div style={{ paddingLeft: "15px" }}>
                {menu.subMenus.map((sub: any, index: number) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredSubMenu(sub.label)}
                    onMouseLeave={() => setHoveredSubMenu(null)}
                    style={{
                      ...subMenuItemStyle,
                      background:
                        activeReport === sub.value
                          ? "#F5F5F5"
                          : hoveredSubMenu === sub.label
                            ? "#f3f4f6"
                            : "transparent",
                      borderRadius: "8px",
                      marginBottom: "3px",
                      transition: "0.2s",
                      fontWeight: "500",
                    }}
                    onClick={() => {
                      if (sub.value === "reviews_report") {
                        // Standalone route — not a NewReportModel report type.
                        navigate("/reviews");
                      } else if (sub.value) {
                        // setSelectedSubMenu(sub.value);
                        onReportClick(sub.value);
                      }
                    }}
                  >
                    {sub.label}
                  </div>
                ))}
              </div>
            )}
            <hr style={{ margin: "6px 8px", borderColor: "#767474" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarView;
