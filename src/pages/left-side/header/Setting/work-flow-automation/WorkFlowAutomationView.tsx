import { useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import MiracleConfigurationsView from "./MiracleConfigurationsView";
import MiracleSynchronizationView from "./MiracleSynchronizationView";
import WhatsappConfigurationView from "./whatsappConfigurationView";
import WorkFlowAutomationAutoAssignmentContactPopUp from "./WorkFlowAutomationAutoAssignmentContactPopUp";
import WorkFlowAutomationPopUp from "./WorkFlowAutomationPopUp";

interface IPropsWorkFlowView {
  isWorkFlowView: boolean;
  closeWorkFlowView: () => void;
}

const WorkFlowAutomationView = ({
  isWorkFlowView,
  closeWorkFlowView,
}: IPropsWorkFlowView) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenAutoAssignContact, setDropdownOpenAutoAssignContact] = useState(false);
  const [isMiracleSectionExpanded, setIsMiracleSectionExpanded] = useState(false);
  const [openMiracleConfigModal, setOpenMiracleConfigModal] = useState(false);
  const [openMiracleSyncModal, setOpenMiracleSyncModal] = useState(false);
  const [dropdownOpenWhatsapp, setDropdownOpenWhatsapp] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(true);
  };
  const toggleDropdownAutoAssignContact = () => {
    setDropdownOpenAutoAssignContact(true);
  };
  const toggleDropdownMiracleIntegrations = () => {
    setIsMiracleSectionExpanded((prev) => !prev);
  };
  const toggleDropdownWhatsappConfigurations = () => {
    setDropdownOpenWhatsapp(true);
  };

  // escape handle
  useEscapeKey(closeWorkFlowView);

  return (
    <>
      {isWorkFlowView ? (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
        >
          {/* <!-- Header --> */}

          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons text-light"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeWorkFlowView}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>
              </div>
            </div>

            <div className="newText col-8">
              <h2>Work Flow Automation</h2>
            </div>

            <div className="col-4 text-end mb-2 ">
              <div
                className="ICON "
                style={{
                  position: "absolute",
                  right: "1px",
                }}
              >
                <button
                  className="icons text-light"
                  onClick={closeWorkFlowView}
                  title="Refresh"
                >
                  <svg width="30" height="30" viewBox="0 0 50 50">
                    <path
                      fill="currentColor"
                      d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                    />
                    <path
                      fill="currentColor"
                      d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                    />
                    <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                    <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div
            className="p-3 animate__animated animate__fadeInLeft overflow-auto"
            id="settings"
            style={{ maxHeight: "80vh" }}
          >
            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">Third Party Scheduler</h6>
                  <p className="text-muted small mb-0">
                    Set Timer to Fetch Data From Third Party Api Which is Set in
                    Company Setting
                  </p>
                </>
              </div>
              <div
                className="form-check form-switch mt-1"
                onClick={toggleDropdown}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 19 20"
                  width="19"
                  height="20"
                  className="hide animate__animated animate__fadeInUp"
                >
                  <path
                    fill="currentColor"
                    d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                  ></path>
                </svg>
              </div>
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Auto Contact Reminder Daily
                  </h6>
                  <p className="text-muted small mb-0">
                    System Find Contact From Your Database and set as unread
                    based on Performance Formula: No Order From Last XX Days, No
                    Inquiery From Last XX Days
                  </p>
                </>
              </div>
              <div className="form-check form-switch mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 19 20"
                  width="19"
                  height="20"
                  className="hide animate__animated animate__fadeInUp"
                >
                  <path
                    fill="currentColor"
                    d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                  ></path>
                </svg>
              </div>
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Auto Assignment of Contact
                  </h6>
                  <p className="text-muted small mb-0">
                    System will assign Contact to particular Team member Using
                    Automation Formula to set please click Setting button
                  </p>
                </>
              </div>
              <div className="form-check form-switch mt-1"
                onClick={toggleDropdownAutoAssignContact}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 19 20"
                  width="19"
                  height="20"
                  className="hide animate__animated animate__fadeInUp"
                >
                  <path
                    fill="currentColor"
                    d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                  ></path>
                </svg>
              </div>
            </div>

            {/* ─── Miracle Integrations Section ─── */}
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e2e8f0" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={toggleDropdownMiracleIntegrations}
              >
                <div style={{ paddingRight: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#1070b2", display: "inline-block",
                        boxShadow: "0 0 6px rgba(16,112,178,0.4)",
                      }}
                    ></span>
                    <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#1070b2" }}>
                      Miracle Integrations
                    </h6>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.76rem", color: "#94a3b8", paddingLeft: 14 }}>
                    Configure API credentials, manage sync permissions, or run bulk synchronization
                  </p>
                </div>
                <div
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: isMiracleSectionExpanded ? "rgba(16,112,178,0.1)" : "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={isMiracleSectionExpanded ? "#1070b2" : "#64748b"} strokeWidth="2.5"
                    style={{
                      transform: isMiracleSectionExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Option Cards */}
              {isMiracleSectionExpanded && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 2 }}>

                  {/* Card 1: Miracle Configurations */}
                  <div
                    onClick={() => setOpenMiracleConfigModal(true)}
                    onMouseEnter={(e) => {
                      const t = e.currentTarget;
                      t.style.transform = "translateY(-2px)";
                      t.style.boxShadow = "0 8px 24px rgba(227,116,48,0.12)";
                      t.style.borderColor = "rgba(227,116,48,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      const t = e.currentTarget;
                      t.style.transform = "translateY(0)";
                      t.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                      t.style.borderColor = "rgba(227,116,48,0.2)";
                    }}
                    style={{
                      padding: "16px 18px", borderRadius: 14, cursor: "pointer",
                      border: "1.5px solid rgba(227,116,48,0.2)",
                      background: "linear-gradient(135deg, #ffffff 0%, rgba(227,116,48,0.03) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {/* Left accent */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
                      background: "linear-gradient(180deg, #e37430 0%, #c85e1b 100%)",
                      borderRadius: "0 4px 4px 0",
                    }}></div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 6 }}>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: "linear-gradient(135deg, #e37430 0%, #c85e1b 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(227,116,48,0.25)",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#1e293b", marginBottom: 2 }}>
                          Miracle Configurations
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.3 }}>
                          API Credentials, Financial Year, Sync & Webhook rights
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 14px", borderRadius: 8,
                        background: "rgba(227,116,48,0.08)", border: "1px solid rgba(227,116,48,0.15)",
                        fontSize: "0.73rem", fontWeight: 700, color: "#e37430",
                        whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      Configure
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Miracle Synchronization */}
                  <div
                    onClick={() => setOpenMiracleSyncModal(true)}
                    onMouseEnter={(e) => {
                      const t = e.currentTarget;
                      t.style.transform = "translateY(-2px)";
                      t.style.boxShadow = "0 8px 24px rgba(16,112,178,0.12)";
                      t.style.borderColor = "rgba(16,112,178,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      const t = e.currentTarget;
                      t.style.transform = "translateY(0)";
                      t.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                      t.style.borderColor = "rgba(16,112,178,0.2)";
                    }}
                    style={{
                      padding: "16px 18px", borderRadius: 14, cursor: "pointer",
                      border: "1.5px solid rgba(16,112,178,0.2)",
                      background: "linear-gradient(135deg, #ffffff 0%, rgba(16,112,178,0.03) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {/* Left accent */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
                      background: "linear-gradient(180deg, #1070b2 0%, #09548a 100%)",
                      borderRadius: "0 4px 4px 0",
                    }}></div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 6 }}>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: "linear-gradient(135deg, #1070b2 0%, #09548a 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(16,112,178,0.25)",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#1e293b", marginBottom: 2 }}>
                          Miracle Synchronization
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.3 }}>
                          Centralized bulk sync of unsynced items across all 12 modules
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 14px", borderRadius: 8,
                        background: "rgba(16,112,178,0.08)", border: "1px solid rgba(16,112,178,0.15)",
                        fontSize: "0.73rem", fontWeight: 700, color: "#1070b2",
                        whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      Sync All
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Whatsapp Configurations
                  </h6>
                  {/* <p className="text-muted small mb-0">
                    Something will be displayed here by Dinesh(Homelander) Lodhavi.
                  </p> */}
                </>
              </div>
              <div className="form-check form-switch mt-1"
                onClick={toggleDropdownWhatsappConfigurations}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 19 20"
                  width="19"
                  height="20"
                  className="hide animate__animated animate__fadeInUp"
                >
                  <path
                    fill="currentColor"
                    d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {dropdownOpen && (
        <WorkFlowAutomationPopUp
          show={dropdownOpen}
          onHide={() => setDropdownOpen(false)}
        />
      )}
      {
        (
          <WorkFlowAutomationAutoAssignmentContactPopUp
            show={dropdownOpenAutoAssignContact}
            onHide={() => setDropdownOpenAutoAssignContact(false)}
            RequiredDetail={{ title: "Auto Assignment Of Contact" }}
          />
        )
      }
      {openMiracleConfigModal && (
        <MiracleConfigurationsView
          show={openMiracleConfigModal}
          onHide={() => setOpenMiracleConfigModal(false)}
          headerName="Add Miracle Configurations"
        />
      )}
      {openMiracleSyncModal && (
        <MiracleSynchronizationView
          show={openMiracleSyncModal}
          onHide={() => setOpenMiracleSyncModal(false)}
        />
      )}
      {dropdownOpenWhatsapp && (
        <WhatsappConfigurationView
          show={dropdownOpenWhatsapp}
          onHide={() => setDropdownOpenWhatsapp(false)}
          headerName="Add Whatsapp Configurations"
        />
      )}
    </>
  );
};

export default WorkFlowAutomationView;
