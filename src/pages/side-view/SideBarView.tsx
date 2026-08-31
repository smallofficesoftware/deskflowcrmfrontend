import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import deshFlow_log_icon from "../../assets/images/deshFlow_log.png";
import smalll_office_logo from "../../assets/images/smalll_office_logo.png";
import { AppContext } from "../../common/AppContext";
import { PERMISSION_TYPE } from "../../helpers/AppEnum";
import { reportsMenuData } from "./reportsMenuData";

const SidebarView = ({
  onReportClick,
  onInsightsClick,
  onSmartReportsClick,
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

  const { permissions } = useContext(AppContext)!;
  const navigate = useNavigate();

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

  const menuData = reportsMenuData;


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

      <div
        onClick={() => onInsightsClick && onInsightsClick()}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(245, 134, 52, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
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
        }}
        title="Insights"
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            minWidth: "30px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F58634, #F5A623)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(245,134,52,0.4)",
          }}
        >
          <svg
            enableBackground="new 0 0 20 20"
            height="16"
            viewBox="0 0 20 20"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
            fill="#fff"
          >
            <path d="m0 0h20v20h-20z" fill="none" />
            <path d="m12.5 8 .79-1.72 1.71-.78-1.71-.78-.79-1.72-.76 1.72-1.74.78 1.74.78z" />
            <path d="m4 10 .4-1.6 1.6-.4-1.6-.4-.4-1.6-.4 1.6-1.6.4 1.6.4z" />
            <path d="m16.5 6c-1.07 0-1.84 1.12-1.35 2.14l-3.01 3.01c-.52-.25-.99-.14-1.29 0l-1.01-1.01c.1-.19.16-.41.16-.64 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .23.06.45.15.64l-3.01 3.01c-.19-.09-.41-.15-.64-.15-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c.52.25.99.14 1.29 0l1.01 1.01c-.1.19-.16.41-.16.64 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.23-.06-.45-.15-.64l3.01-3.01c1.03.5 2.14-.29 2.14-1.35 0-.83-.67-1.5-1.5-1.5z" />
          </svg>
        </div>
        {isOpen && (
          <span style={{ fontWeight: "bold", color: "#4B4B4D" }}>
            Insights
          </span>
        )}
      </div>

      <div
        onClick={() => onSmartReportsClick && onSmartReportsClick()}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(245, 134, 52, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
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
        }}
        title="Smart Reports"
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            minWidth: "30px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F58634, #F5A623)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(245,134,52,0.4)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="16px"
            viewBox="0 -960 960 960"
            width="16px"
            fill="#fff"
          >
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Z" />
          </svg>
        </div>
        {isOpen && (
          <span style={{ fontWeight: "bold", color: "#4B4B4D" }}>
            Smart Reports
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
                      fontWeight: activeReport === sub.value ? "500" : "400",
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
